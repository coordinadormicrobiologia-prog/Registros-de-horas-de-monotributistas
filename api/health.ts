import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const target = process.env.GOOGLE_SCRIPT_URL;
  const key = process.env.GOOGLE_SCRIPT_API_KEY || '';

  if (!target) {
    return res.status(500).json({ error: 'GOOGLE_SCRIPT_URL not configured' });
  }

  try {
    const url = `${target}?action=getEntries${key ? '&apiKey=' + encodeURIComponent(key) : ''}`;
    const r = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
    const text = await r.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
    return res.status(200).json({ ok: true, status: r.status, data: parsed });
  } catch (err) {
    console.error('health error', err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
}