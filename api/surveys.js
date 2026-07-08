// api/surveys.js
// Vercel Serverless Function to proxy requests and bypass browser CORS preflight restrictions

const SURVEYS_BIN_URL = 'https://extendsclass.com/api/json-storage/bin/efcaebe';

export default async function handler(req, res) {
  // Add CORS headers for local development (localhost)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      // Enable Vercel Edge CDN Caching (1s fresh, stale for 9s while revalidating in background)
      res.setHeader('Cache-Control', 'public, s-maxage=1, stale-while-revalidate=9');

      const response = await fetch(SURVEYS_BIN_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch from backend storage: ${response.statusText}`);
      }
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error('Proxy GET error:', error);
      res.status(500).json({ error: error.message });
    }
    return;
  }

  if (req.method === 'PUT') {
    try {
      // Forward the PUT request to ExtendsClass from server-side (bypasses CORS check)
      const response = await fetch(SURVEYS_BIN_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      if (!response.ok) {
        throw new Error(`Failed to save to backend storage: ${response.statusText}`);
      }
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error('Proxy PUT error:', error);
      res.status(500).json({ error: error.message });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
