<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1T7WCaGdU_gLXVfDbtiMX3eEfXq9_VuA9

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Proxy/Backend Requirements

**Important:** The proxy endpoint (`/api/proxy`) must consistently return responses in the following format:

- **GET** `?action=getEntries`: Should return `{ ok: true, data: [...] }` where `data` is an array of log entries
- **POST** with `action=saveEntry`: Should return `{ ok: true, id: "...", saved: {...} }`
- **POST** with `action=deleteEntry`: Should return `{ ok: true }` or `{ ok: false, error: "..." }`

**Caching:** The proxy should set `Cache-Control: no-store` header to prevent POST responses from being reused for GET requests.

**Data format:** The proxy may return Spanish column names from Google Sheets (e.g., "Fecha", "Nombre", "Ingreso"), which will be automatically normalized by the client to match the expected `TimeLog` interface.
