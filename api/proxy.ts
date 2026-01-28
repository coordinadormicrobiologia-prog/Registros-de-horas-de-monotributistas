import { VercelRequest, VercelResponse } from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {
    const url = process.env.GOOGLE_SCRIPT_URL;
    const apiKey = process.env.GOOGLE_SCRIPT_API_KEY;

    if (!url || !apiKey) {
        return res.status(500).json({ error: 'Missing environment variables.' });
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
    };

    try {
        if (req.method === 'GET') {
            const response = await fetch(url, { headers });
            const data = await response.json();
            return res.status(response.status).json(data);
        } else if (req.method === 'POST') {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(req.body),
            });
            const data = await response.json();
            return res.status(response.status).json(data);
        } else {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Failed to handle request.' });
    }
};