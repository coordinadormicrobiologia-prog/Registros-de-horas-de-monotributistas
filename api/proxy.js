function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}


export default async function handler(req, res) {
  setCors(res);


  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }


  const target = process.env.GOOGLE_SCRIPT_URL;
  const key = process.env.GOOGLE_SCRIPT_API_KEY || '';


  if (!target) {
    return res.status(500).json({ error: 'GOOGLE_SCRIPT_URL not configured' });
  }


  try {
    if (req.method === 'GET') {
      const qs = (req.url || '').split('?')[1] || '';
      const url = `${target}?${qs}${qs ? '&' : ''}apiKey=${encodeURIComponent(key)}`;
      const r = await fetch(url);
      const text = await r.text();
      res.setHeader('Content-Type', r.headers.get('content-type') || 'text/plain');
      return res.status(r.status).send(text);
    }


    const body = req.body || {};
    const payload = { ...body, apiKey: key };


    const r = await fetch(target, {
      method: 'POST',
      // clave: text/plain evita preflight raro aguas abajo y es muy compatible con GAS
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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
