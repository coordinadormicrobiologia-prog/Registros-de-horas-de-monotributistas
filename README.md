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

## Proxy and Data Format Notes

The application uses `/api/proxy` to communicate with Google Apps Script backend. The proxy handles:
- **GET requests**: Action `getEntries` should return `{ ok: true, data: [...] }` with an array of records
- **POST requests**: 
  - Action `saveEntry` should return `{ ok: true, id: '...', data: {...} }` or similar success indicator
  - Action `deleteEntry` should return `{ ok: true }` or similar success indicator

### Data Normalization

The frontend expects records with English property names (as defined in `types.ts`):
```typescript
{
  id: string;
  date: string;
  employeeName: string;
  entryTime: string;
  exitTime: string;
  totalHours: number;
  dayType: string;
  isHoliday: boolean;
  observation: string;
  timestamp: string;
}
```

However, the backend may return data with Spanish keys and spaces (e.g., "ID", "Fecha", "Nombre", " Ingreso", " Total_Horas"). The `storageService.ts` includes normalization logic to handle this mapping on the client side.

**Best Practice**: Ideally, normalization should be done server-side in the proxy or Apps Script to ensure consistent data format.

### Caching Considerations

- The service uses `cache: 'no-store'` and timestamp query parameters to prevent edge caching issues
- If GET requests return unexpected data (e.g., previous POST response), the service includes retry logic with exponential backoff
