import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const target = process.env.GOOGLE_SCRIPT_URL;
  const key = process.env.GOOGLE_SCRIPT_API_KEY || '';

  if (!target) {
    return res.status(500).json({ error: 'GOOGLE_SCRIPT_URL not configured' });
  }

  try {
    if (req.method === 'GET') {
      // Preserve original query string and append apiKey
      const qs = req.url?.split('?')[1] || '';
      const url = `${target}?${qs}${qs ? '&' : ''}apiKey=${encodeURIComponent(key)}`;
      const r = await fetch(url);
      const text = await r.text();
      res.setHeader('Content-Type', r.headers.get('content-type') || 'text/plain');
      return res.status(r.status).send(text);
    }

    // For POST requests forward body and inject apiKey
    const body = req.body || {};
    const payload = { ...body, apiKey: key };

    const r = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    res.setHeader('Content-Type', r.headers.get('content-type') || 'text/plain');
    return res.status(r.status).send(text);
  } catch (err) {
    console.error('proxy error', err);
    return res.status(500).json({ error: 'proxy error', details: String(err) });
  }
}