// api/surveys.js — Vercel Serverless Function (PostgreSQL via Neon)
import { neon } from '@neondatabase/serverless';

let sql = null;
function getSql() {
  if (!sql) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL environment variable is missing.');
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

async function ensureTables() {
  const db = getSql();
  // surveys table — matches what the frontend creates/reads
  await db`
    CREATE TABLE IF NOT EXISTS surveys (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT DEFAULT '',
      status      TEXT DEFAULT 'draft',
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      start_date  TIMESTAMPTZ,
      end_date    TIMESTAMPTZ
    )
  `;

  // Drop the legacy options JSONB column from surveys if it exists
  try {
    await db`ALTER TABLE surveys DROP COLUMN IF EXISTS options`;
  } catch (err) {
    console.log("No legacy options column to drop, proceeding.");
  }

  // options table — uses "label" to match frontend data model
  await db`
    CREATE TABLE IF NOT EXISTS options (
      id         TEXT PRIMARY KEY,
      survey_id  TEXT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
      label      TEXT NOT NULL,
      votes      INTEGER DEFAULT 0,
      position   INTEGER DEFAULT 0
    )
  `;

  // Seeding: check if options table is empty
  const optionsCount = await db`SELECT count(*) FROM options`;
  if (parseInt(optionsCount[0].count) === 0) {
    console.log("No options found in options table. Resetting tables and seeding fresh default surveys...");
    await db`DELETE FROM options`;
    await db`DELETE FROM surveys`;

    const DEFAULT_SURVEYS = [
      {
        id: "seed-survey-1",
        title: "What major feature should we build next for Decision Arena?",
        description: "Help us prioritize our roadmap. We want to know which integrations and capabilities matter most to you.",
        status: "active",
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        startDate: null,
        endDate: null,
        options: [
          { id: "seed-opt-1-1", label: "Real-time Database Sync (Firebase/Supabase)", votes: 42 },
          { id: "seed-opt-1-2", label: "Social Identity Logins (Google, GitHub, Apple)", votes: 28 },
          { id: "seed-opt-1-3", label: "Interactive charts and PDF reports export", votes: 19 },
          { id: "seed-opt-1-4", label: "Slack & Discord notification webhooks", votes: 35 }
        ]
      },
      {
        id: "seed-survey-2",
        title: "Where should we host the 2026 Developer Retreat?",
        description: "Voting is open to all community members. Select your dream destination for a week of hacking and outdoor adventures.",
        status: "active",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        options: [
          { id: "seed-opt-2-1", label: "Kyoto Temple Stays & Bamboo Forests", votes: 64 },
          { id: "seed-opt-2-2", label: "Swiss Alps Alpine Hackhouse & Skiing", votes: 88 },
          { id: "seed-opt-2-3", label: "Cape Town Beach Villa & Wildlife Safari", votes: 47 }
        ]
      },
      {
        id: "seed-survey-3",
        title: "What is your default IDE color theme preference?",
        description: "Let us know what color scheme keeps you in the flow state during long coding sessions.",
        status: "active",
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        startDate: null,
        endDate: null,
        options: [
          { id: "seed-opt-3-1", label: "Nordic Minimal (Cold Grays & Blues)", votes: 12 },
          { id: "seed-opt-3-2", label: "Dracula / Premium Pitch Dark", votes: 45 },
          { id: "seed-opt-3-3", label: "Warm Editorial Light Theme (Lavender-White)", votes: 29 },
          { id: "seed-opt-3-4", label: "Monokai Classic Retro", votes: 8 }
        ]
      }
    ];

    for (const s of DEFAULT_SURVEYS) {
      await db`
        INSERT INTO surveys (id, title, description, status, created_at, start_date, end_date)
        VALUES (${s.id}, ${s.title}, ${s.description}, ${s.status}, ${s.createdAt}, ${s.startDate}, ${s.endDate})
      `;
      for (let i = 0; i < s.options.length; i++) {
        const opt = s.options[i];
        await db`
          INSERT INTO options (id, survey_id, label, votes, position)
          VALUES (${opt.id}, ${s.id}, ${opt.label}, ${opt.votes}, ${i})
        `;
      }
    }
  }
}

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    await ensureTables();
    const db = getSql();

    const url = new URL(req.url, `https://${req.headers.host}`);
    const idParam = url.searchParams.get('id');

    // ── GET /api/surveys ─────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const surveys = await db`SELECT * FROM surveys ORDER BY created_at DESC`;
      const options = await db`SELECT * FROM options ORDER BY position ASC`;

      const result = surveys.map(s => ({
        id: s.id,
        title: s.title,
        description: s.description || '',
        status: s.status || 'draft',
        createdAt: s.created_at,
        startDate: s.start_date,
        endDate: s.end_date,
        options: options
          .filter(o => o.survey_id === s.id)
          .map(o => ({ id: o.id, label: o.label || o.text || '', votes: o.votes || 0 })),
      }));

      // Return format the frontend expects: { surveys: [...], hasPostgres: true }
      res.status(200).json({ surveys: result, hasPostgres: true });
      return;
    }

    // ── POST /api/surveys — Create a new survey ──────────────────────────────
    if (req.method === 'POST') {
      const body = await parseBody(req);
      const { id, title, description, status, startDate, endDate, options = [] } = body;

      await db`
        INSERT INTO surveys (id, title, description, status, start_date, end_date)
        VALUES (
          ${id},
          ${title},
          ${description || ''},
          ${status || 'draft'},
          ${startDate || null},
          ${endDate || null}
        )
      `;

      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        await db`
          INSERT INTO options (id, survey_id, label, votes, position)
          VALUES (${opt.id}, ${id}, ${opt.label || opt.text || ''}, ${opt.votes || 0}, ${i})
        `;
      }

      const [created] = await db`SELECT * FROM surveys WHERE id = ${id}`;
      const createdOptions = await db`SELECT * FROM options WHERE survey_id = ${id} ORDER BY position ASC`;

      res.status(201).json({
        id: created.id,
        title: created.title,
        description: created.description || '',
        status: created.status,
        createdAt: created.created_at,
        startDate: created.start_date,
        endDate: created.end_date,
        options: createdOptions.map(o => ({ id: o.id, label: o.label || o.text || '', votes: o.votes || 0 })),
      });
      return;
    }

    // ── PUT /api/surveys?id=... — Full update (survey + options) ─────────────
    if (req.method === 'PUT' && idParam) {
      const body = await parseBody(req);
      const { title, description, status, startDate, endDate, options = [] } = body;

      await db`
        UPDATE surveys
        SET title       = ${title},
            description = ${description || ''},
            status      = ${status || 'draft'},
            start_date  = ${startDate || null},
            end_date    = ${endDate || null}
        WHERE id = ${idParam}
      `;

      // Replace options: delete old, insert new
      await db`DELETE FROM options WHERE survey_id = ${idParam}`;
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        await db`
          INSERT INTO options (id, survey_id, label, votes, position)
          VALUES (${opt.id}, ${idParam}, ${opt.label || opt.text || ''}, ${opt.votes || 0}, ${i})
        `;
      }

      const [updated] = await db`SELECT * FROM surveys WHERE id = ${idParam}`;
      const updatedOptions = await db`SELECT * FROM options WHERE survey_id = ${idParam} ORDER BY position ASC`;

      res.status(200).json({
        id: updated.id,
        title: updated.title,
        description: updated.description || '',
        status: updated.status,
        createdAt: updated.created_at,
        startDate: updated.start_date,
        endDate: updated.end_date,
        options: updatedOptions.map(o => ({ id: o.id, label: o.label || o.text || '', votes: o.votes || 0 })),
      });
      return;
    }

    // ── DELETE /api/surveys?id=... ────────────────────────────────────────────
    if (req.method === 'DELETE' && idParam) {
      await db`DELETE FROM surveys WHERE id = ${idParam}`;
      res.status(200).json({ success: true });
      return;
    }

    res.status(404).json({ error: 'Route not found' });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
