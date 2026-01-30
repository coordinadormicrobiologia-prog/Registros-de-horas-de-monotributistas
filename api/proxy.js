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
    console.error('[proxy] GOOGLE_SCRIPT_URL not configured');
    return res.status(500).json({ error: 'GOOGLE_SCRIPT_URL not configured' });
  }


  try {
    if (req.method === 'GET') {
      const qs = (req.url || '').split('?')[1] || '';
      const url = `${target}?${qs}${qs ? '&' : ''}apiKey=${encodeURIComponent(key)}`;
      console.info(`[proxy] GET -> ${url}`);
      const r = await fetch(url);
      const text = await r.text();
      res.setHeader('Content-Type', r.headers.get('content-type') || 'text/plain');
      return res.status(r.status).send(text);
    }


    // Aceptar application/json o text/plain desde el cliente
    const body = req.body || {};
    const payload = { ...body, apiKey: key };

    console.info('[proxy] POST forwarding to', target, 'payload:', JSON.stringify(payload));

    const r = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    const contentType = r.headers.get('content-type') || 'text/plain';
    res.setHeader('Content-Type', contentType);

    if (!r.ok) {
      console.error('[proxy] upstream error', { status: r.status, body: text });
      // reenviar el body del upstream y el status para debug en frontend
      return res.status(r.status).send(text);
    }

    return res.status(r.status).send(text);
  } catch (err) {
    console.error('proxy error', err);
    return res.status(500).json({ error: 'proxy error', details: String(err) });
  }
}

