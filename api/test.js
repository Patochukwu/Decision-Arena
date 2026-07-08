// Minimal test endpoint - no dependencies
export default function handler(req, res) {
  res.status(200).json({ ok: true, message: 'Decision Arena API is running' });
}
