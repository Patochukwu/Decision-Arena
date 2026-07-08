// api/surveys.js
// Vercel Serverless Function - PostgreSQL (Standard pg client)
import pg from 'pg';

const { Pool } = pg;
const HAS_POSTGRES = Boolean(process.env.DATABASE_URL);

let pool = null;
function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is missing.');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
  return pool;
}

// Default Seed surveys
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

// Helper to initialize Postgres table and seed data
async function initDb() {
  try {
    const db = getPool();
    // 1. Create table
    await db.query(`
      CREATE TABLE IF NOT EXISTS surveys (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        start_date TIMESTAMP WITH TIME ZONE,
        end_date TIMESTAMP WITH TIME ZONE,
        options JSONB NOT NULL
      )
    `);

    // 2. Check if table is empty
    const countResult = await db.query('SELECT count(*) FROM surveys');
    if (parseInt(countResult.rows[0].count) === 0) {
      console.log("Postgres database is empty. Seeding default surveys...");
      for (const s of DEFAULT_SURVEYS) {
        await db.query(
          `INSERT INTO surveys (id, title, description, status, created_at, start_date, end_date, options)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            s.id, 
            s.title, 
            s.description, 
            s.status, 
            s.createdAt, 
            s.startDate, 
            s.endDate, 
            JSON.stringify(s.options)
          ]
        );
      }
    }
  } catch (err) {
    console.error("Failed to initialize database:", err);
    throw err;
  }
}

// Run initialization
let dbInitialized = false;

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Database Connection Gate
  if (!HAS_POSTGRES) {
    res.status(500).json({ 
      error: 'Database configuration missing. Please link a Postgres database (DATABASE_URL environment variable) in your Vercel project dashboard.' 
    });
    return;
  }

  // Ensure DB table exists
  if (!dbInitialized) {
    try {
      await initDb();
      dbInitialized = true;
    } catch (e) {
      res.status(500).json({ error: 'Database connection failed: ' + e.message });
      return;
    }
  }

  // ── GET Request ────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      const db = getPool();
      const result = await db.query('SELECT * FROM surveys ORDER BY created_at DESC');
      const surveys = result.rows.map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        status: r.status,
        createdAt: r.created_at,
        startDate: r.start_date,
        endDate: r.end_date,
        options: r.options
      }));
      res.status(200).json({ surveys, hasPostgres: true });
    } catch (error) {
      console.error('GET error:', error);
      res.status(500).json({ error: error.message });
    }
    return;
  }

  // ── POST Request (Create Survey) ──────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const s = req.body;
      const db = getPool();
      await db.query(
        `INSERT INTO surveys (id, title, description, status, created_at, start_date, end_date, options)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          s.id, 
          s.title, 
          s.description, 
          s.status, 
          s.createdAt, 
          s.startDate ?? null, 
          s.endDate ?? null, 
          JSON.stringify(s.options)
        ]
      );
      res.status(201).json({ success: true, survey: s });
    } catch (error) {
      console.error('POST error:', error);
      res.status(500).json({ error: error.message });
    }
    return;
  }

  // ── PUT Request (Update Survey / Vote) ─────────────────────────────────────
  if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      const s = req.body;

      if (!id) {
        res.status(400).json({ error: 'Missing survey id query parameter' });
        return;
      }

      const db = getPool();
      await db.query(
        `UPDATE surveys
         SET title = $1,
             description = $2,
             status = $3,
             start_date = $4,
             end_date = $5,
             options = $6
         WHERE id = $7`,
        [
          s.title,
          s.description,
          s.status,
          s.startDate ?? null,
          s.endDate ?? null,
          JSON.stringify(s.options),
          id
        ]
      );
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('PUT error:', error);
      res.status(500).json({ error: error.message });
    }
    return;
  }

  // ── DELETE Request ─────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) {
        res.status(400).json({ error: 'Missing survey id query parameter' });
        return;
      }
      const db = getPool();
      await db.query('DELETE FROM surveys WHERE id = $1', [id]);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('DELETE error:', error);
      res.status(500).json({ error: error.message });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
