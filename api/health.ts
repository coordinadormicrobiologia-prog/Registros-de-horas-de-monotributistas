export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }


  const target = process.env.GOOGLE_SCRIPT_URL;
  const key = process.env.GOOGLE_SCRIPT_API_KEY || '';


  // Health básico (sirve para verificar que la function corre en Vercel)
  if (!target) {
    return res.status(200).json({
      ok: true,
      warning: 'GOOGLE_SCRIPT_URL not configured (function is running, but GAS not set)',
    });
  }


  try {
    const url = `${target}?action=getEntries${key ? '&apiKey=' + encodeURIComponent(key) : ''}`;


    const r = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });


    const text = await r.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }


    return res.status(200).json({
      ok: true,
      gas_reachable: true,
      gas_status: r.status,
      data: parsed,
    });
  } catch (err) {
    console.error('health error', err);
    return res.status(200).json({
      ok: true,
      gas_reachable: false,
      error: String(err),
    });
  }
}

Si falta GOOGLE_SCRIPT_URL, igual devuelve 200 OK con warning → así confirmás que la function existe (no te confund
