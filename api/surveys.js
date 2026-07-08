// api/surveys.js
// Vercel Serverless Function - PostgreSQL via Neon Serverless Driver
import { neon } from '@neondatabase/serverless';

let sql = null;
function getSql() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is missing.');
    }
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

// Ensure tables exist on first run
async function ensureTables() {
  const db = getSql();
  await db`
    CREATE TABLE IF NOT EXISTS surveys (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      ends_at TIMESTAMPTZ,
      is_active BOOLEAN DEFAULT TRUE,
      allow_multiple_votes BOOLEAN DEFAULT FALSE,
      show_results_before_end BOOLEAN DEFAULT TRUE,
      created_by TEXT
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS options (
      id TEXT PRIMARY KEY,
      survey_id TEXT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      votes INTEGER DEFAULT 0,
      position INTEGER DEFAULT 0
    )
  `;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await ensureTables();
    const db = getSql();

    const url = new URL(req.url, `https://${req.headers.host}`);
    const pathname = url.pathname;
    const surveyId = pathname.split('/').filter(Boolean).pop();

    // GET /api/surveys - list all surveys
    if (req.method === 'GET' && (pathname === '/api/surveys' || pathname === '/api/surveys/')) {
      const surveys = await db`SELECT * FROM surveys ORDER BY created_at DESC`;
      const options = await db`SELECT * FROM options ORDER BY position ASC`;
      const result = surveys.map(s => ({
        ...s,
        options: options.filter(o => o.survey_id === s.id)
      }));
      res.status(200).json(result);
      return;
    }

    // GET /api/surveys/:id - get single survey
    if (req.method === 'GET' && surveyId && surveyId !== 'surveys') {
      const [survey] = await db`SELECT * FROM surveys WHERE id = ${surveyId}`;
      if (!survey) { res.status(404).json({ error: 'Survey not found' }); return; }
      const options = await db`SELECT * FROM options WHERE survey_id = ${surveyId} ORDER BY position ASC`;
      res.status(200).json({ ...survey, options });
      return;
    }

    // POST /api/surveys - create survey
    if (req.method === 'POST' && (pathname === '/api/surveys' || pathname === '/api/surveys/')) {
      const body = req.body || await parseBody(req);
      const { id, title, description, options = [], ends_at, allow_multiple_votes, show_results_before_end, created_by } = body;
      await db`
        INSERT INTO surveys (id, title, description, ends_at, allow_multiple_votes, show_results_before_end, created_by)
        VALUES (${id}, ${title}, ${description || ''}, ${ends_at || null}, ${allow_multiple_votes || false}, ${show_results_before_end !== false}, ${created_by || null})
      `;
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        await db`INSERT INTO options (id, survey_id, text, votes, position) VALUES (${opt.id}, ${id}, ${opt.text}, 0, ${i})`;
      }
      const [created] = await db`SELECT * FROM surveys WHERE id = ${id}`;
      const createdOptions = await db`SELECT * FROM options WHERE survey_id = ${id} ORDER BY position ASC`;
      res.status(201).json({ ...created, options: createdOptions });
      return;
    }

    // PUT /api/surveys/:id/vote - vote on an option
    if (req.method === 'PUT' && pathname.endsWith('/vote')) {
      const sid = pathname.split('/').filter(Boolean)[1];
      const body = req.body || await parseBody(req);
      const { optionId } = body;
      await db`UPDATE options SET votes = votes + 1 WHERE id = ${optionId} AND survey_id = ${sid}`;
      const [survey] = await db`SELECT * FROM surveys WHERE id = ${sid}`;
      const options = await db`SELECT * FROM options WHERE survey_id = ${sid} ORDER BY position ASC`;
      res.status(200).json({ ...survey, options });
      return;
    }

    // DELETE /api/surveys/:id - delete survey
    if (req.method === 'DELETE' && surveyId && surveyId !== 'surveys') {
      await db`DELETE FROM surveys WHERE id = ${surveyId}`;
      res.status(200).json({ success: true });
      return;
    }

    res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
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
