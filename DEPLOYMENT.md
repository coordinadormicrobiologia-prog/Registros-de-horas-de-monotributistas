# Deployment and Verification Instructions

## Google Apps Script Setup

1. **Create a new Google Apps Script project:**
   - Go to https://script.google.com/
   - Create a new project
   - Copy the entire contents of `Code.gs` from this repository
   - Replace `TU_SPREADSHEET_ID_AQUI` with your actual Google Sheets ID

2. **Configure the spreadsheet:**
   - Create a Google Sheet with a tab named "Registros"
   - The sheet will auto-create headers on first save:
     - `id`, `Nombre`, `Fecha`, `Ingreso`, `Egreso`, `Total Horas`, `Tipo Día`, `¿Feriado?`, `Observaciones`, `Timestamp`

3. **Deploy the Web App:**
   - In Apps Script: Click "Deploy" → "New deployment"
   - Type: "Web app"
   - Execute as: "Me"
   - Who has access: "Anyone"
   - Click "Deploy"
   - Copy the Web App URL (this is your `GOOGLE_SCRIPT_URL`)

## Vercel Environment Variables

Configure the following environment variables in Vercel:

```
GOOGLE_SCRIPT_URL=<Your Google Apps Script Web App URL>
GOOGLE_SCRIPT_API_KEY=enterobacter
```

**Important:** The API key must be "enterobacter" to match the expected key in Code.gs.

## Verification Steps

### 1. Test the Proxy Endpoint

Test GET request:
```bash
curl "https://your-app.vercel.app/api/proxy?action=getEntries&owner=" -v
```

Expected response: JSON with `{ ok: true, data: [...] }`

### 2. Test Save Entry

```bash
curl -X POST https://your-app.vercel.app/api/proxy \
  -H "Content-Type: application/json" \
  -d '{
    "action": "saveEntry",
    "entry": {
      "id": "test-123",
      "employeeName": "Test User",
      "date": "2024-01-31",
      "entryTime": "08:00",
      "exitTime": "16:00",
      "totalHours": 8,
      "dayType": "Semana",
      "isHoliday": false,
      "observation": "Test entry"
    }
  }'
```

Expected response: `{ ok: true, id: "test-123" }`

### 3. Test Delete Entry

```bash
curl -X POST https://your-app.vercel.app/api/proxy \
  -H "Content-Type: application/json" \
  -d '{
    "action": "deleteEntry",
    "id": "test-123",
    "requesterName": "Test User"
  }'
```

Expected response: `{ ok: true, deleted: "test-123" }`

### 4. Manual Testing in Browser

1. Open the application: https://your-app.vercel.app
2. Login with a test user:
   - Username: `daiana`, Password: `daiana123`
3. Submit a time entry
4. Verify it appears in "Tus Registros Recientes"
5. Click the delete button and confirm
6. Verify the entry is removed from the list
7. Check the Google Sheet to confirm the entry was deleted

## Troubleshooting

### Build Failures
- Check that all imports in `components/EmployeePortal.tsx` resolve correctly
- Verify `services/storageService.ts` exports all required methods

### Runtime Errors
- Check browser console for errors
- Verify that `GOOGLE_SCRIPT_URL` is set correctly in Vercel
- Test the proxy endpoint directly using curl

### Integration Issues
- Verify the Google Apps Script is deployed with "Anyone" access
- Check that the API key matches in both Vercel env vars and Code.gs
- Look at Google Apps Script execution logs for errors
- Ensure the Google Sheet exists and has the correct name "Registros"

### Delete Permission Errors
If you get "Permission denied" when deleting:
- Verify that the `requesterName` matches the `Nombre` field in the sheet
- Check that the user is only trying to delete their own entries

## Architecture Notes

### Proxy Flow
1. Frontend → `/api/proxy` (Vercel serverless function)
2. Proxy → Google Apps Script Web App
3. GAS processes request and updates Google Sheets
4. Response flows back: GAS → Proxy → Frontend

### Content-Type Requirements
- Frontend sends to proxy: `application/json`
- Proxy sends to GAS: `text/plain;charset=utf-8` (GAS requirement)
- GAS receives data in `postData.contents` as JSON string

### Security
- API key validation on GAS side
- Delete operations validate requester ownership
- CORS enabled on proxy for browser access
