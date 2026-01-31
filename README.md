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

## Proxy API Requirements

This application uses a Google Sheets backend via a proxy at `/api/proxy`. The proxy must handle the following:

### GET Request - Fetch Entries
**Endpoint:** `GET /api/proxy?action=getEntries`

**Expected Response:**
```json
{
  "ok": true,
  "data": [
    {
      "ID": "...",
      "Fecha": "2026-01-30",
      "Nombre": "Carla",
      " Ingreso": "08:00",
      " Egreso": "16:00",
      " Total_Horas": 8,
      "Tipo_Dia": "Semana",
      "Es_Feriado": false,
      "Observacion": "...",
      "Fecha_Carga": "2026-01-30T..."
    }
  ]
}
```

**Important Notes:**
- The frontend normalizes Spanish keys with spaces to the internal TypeLog format
- Dates can be in ISO format (with 'T') or YYYY-MM-DD
- Times can be in ISO timestamp format (e.g., "1899-12-30T12:16:48.000Z") or HH:MM
- The frontend will retry and normalize responses automatically

### POST Request - Save Entry
**Endpoint:** `POST /api/proxy`

**Request Body:**
```json
{
  "action": "saveEntry",
  "entry": {
    "id": "...",
    "date": "2026-01-30",
    "employeeName": "Carla",
    "entryTime": "08:00",
    "exitTime": "16:00",
    "totalHours": 8,
    "dayType": "Semana",
    "isHoliday": false,
    "observation": "..."
  }
}
```

**Expected Response:**
```json
{
  "ok": true,
  "id": "..."
}
```

### POST Request - Delete Entry
**Endpoint:** `POST /api/proxy`

**Request Body:**
```json
{
  "action": "deleteEntry",
  "id": "...",
  "requesterName": "Carla"
}
```

**Expected Response:**
```json
{
  "ok": true
}
```

**Security Note:** The Apps Script should validate `requesterName` to ensure users can only delete their own entries (or allow admin override).

### Cache Control Recommendations

To avoid stale data issues:

1. **Proxy Response Headers:** Set `Cache-Control: no-store` on GET responses
2. **Apps Script:** Call `SpreadsheetApp.flush()` after `appendRow()` or modifications
3. **Frontend:** Already implements `cache: 'no-store'` in fetch requests

### Example Apps Script Pattern

```javascript
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getEntries') {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    const data = sheet.getDataRange().getValues();
    // ... process data ...
    
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, data: rows }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;
  
  if (action === 'saveEntry') {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    sheet.appendRow([/* ... */]);
    SpreadsheetApp.flush(); // Important: flush immediately
    
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, id: body.entry.id }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'deleteEntry') {
    // Validate requesterName matches the entry or is admin
    // ... delete logic ...
    SpreadsheetApp.flush();
    
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```
