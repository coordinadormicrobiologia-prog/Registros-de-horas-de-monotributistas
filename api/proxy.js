function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function normalizeBody(body) {
  // Si body viene como string JSON, intentar parsearlo
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (e) {
      // no es JSON, dejar como está (no es lo ideal)
      return { raw: body };
    }
  }
  return body || {};
}

function buildFormPayload(obj) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    // Si el valor es objeto, serializarlo para que el destino lo reciba como string
    if (typeof v === 'object') {
      params.append(k, JSON.stringify(v));
    } else {
      params.append(k, String(v));
    }
  }
  return params.toString();
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

    // POST
    const rawBody = req.body;
    const body = normalizeBody(rawBody);

    // Construir payload que se enviará al Google Script
    const payload = { ...body, apiKey: key };

    // Si el destino (GAS) espera parámetros form-urlencoded, enviamos así:
    // esta content-type evita preflight y es ampliamente compatible con GAS.
    const formBody = buildFormPayload(payload);

    // DEBUG: logear lo que se enviará al target (temporal)
    console.log('proxy -> target POST url:', target);
    console.log('proxy -> target formBody:', formBody);

    const r = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body: formBody,
    });

    const text = await r.text();
    console.log('target response status:', r.status, 'body:', text);

    res.setHeader('Content-Type', r.headers.get('content-type') || 'text/plain');
    return res.status(r.status).send(text);
  } catch (err) {
    console.error('proxy error', err);
    return res.status(500).json({ error: 'proxy error', details: String(err) });
  }
}
