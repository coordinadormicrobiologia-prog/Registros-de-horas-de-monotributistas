# Deployment Guide - Registros de Horas de Monotributistas

This guide provides instructions for deploying the application to Vercel and configuring the Google Apps Script backend.

## Prerequisites

- A Vercel account
- A Google account with access to Google Sheets and Google Apps Script
- Node.js installed locally for testing

## Step 1: Set Up Google Apps Script

### 1.1 Create the Google Sheet

1. Create a new Google Sheet or use an existing one
2. Ensure the sheet has a tab named "Registros" (or update the `SHEET_NAME` in Code.gs)
3. Add the following column headers in the first row:
   - ID
   - Fecha
   - Nombre
   - Ingreso
   - Egreso
   - Total Horas
   - Tipo Dia
   - Es Feriado
   - Observacion
   - Timestamp

### 1.2 Deploy the Google Apps Script

1. From your Google Sheet, go to **Extensions > Apps Script**
2. Delete any existing code in the Code.gs file
3. Copy the entire contents of the `Code.gs` file from this repository
4. Paste it into the Code.gs editor
5. **Important**: Verify the `API_KEY` constant is set to `'enterobacter'` (or update it and your Vercel env vars accordingly)
6. Click **Deploy > New deployment**
7. Choose type: **Web app**
8. Configure:
   - Description: "Registros API"
   - Execute as: **Me**
   - Who has access: **Anyone**
9. Click **Deploy**
10. **Copy the Web App URL** - you'll need this for Vercel

### 1.3 Test the Script (Optional)

You can test the script by making a GET request to the Web App URL:
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=getAllEntries&apiKey=enterobacter
```

## Step 2: Deploy to Vercel

### 2.1 Fork or Clone the Repository

1. Fork this repository to your GitHub account, or
2. Clone it and push to your own repository

### 2.2 Import to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New > Project**
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 2.3 Configure Environment Variables

In the Vercel project settings, add the following environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `GOOGLE_SCRIPT_URL` | Your Web App URL | The URL you copied from Apps Script deployment |
| `GOOGLE_SCRIPT_API_KEY` | `enterobacter` | API key for authentication |

**To add environment variables:**
1. Go to your project in Vercel
2. Click **Settings > Environment Variables**
3. Add each variable for all environments (Production, Preview, Development)

### 2.4 Deploy

1. Click **Deploy**
2. Wait for the build to complete
3. Once deployed, click on the deployment URL to test your app

## Step 3: Test the Application

### 3.1 Login

Use one of the following test credentials:
- Username: `daiana`, Password: `daiana123`
- Username: `matilde`, Password: `matilde123`
- Username: `miguel`, Password: `miguel123` (Admin)

### 3.2 Test Features

1. **Register Hours**: Fill in the form and submit a new entry
2. **View Recent Entries**: Your recent entries should appear below the form
3. **Delete Entry**: Click the delete button on any of your entries
4. **Verify in Google Sheet**: Check that entries appear in your Google Sheet

## Troubleshooting

### Build Fails with "missing export" error
- Ensure all files from this repository are present
- Run `npm install` and `npm run build` locally to verify

### "GOOGLE_SCRIPT_URL not configured" error
- Verify environment variables are set in Vercel
- Redeploy after adding environment variables

### "Invalid API key" error from GAS
- Verify `GOOGLE_SCRIPT_API_KEY` in Vercel matches the `API_KEY` in Code.gs
- Default value should be `enterobacter`

### Entries not appearing or "Unknown action" error
- Verify the Google Apps Script is properly deployed as a Web App
- Check the Web App URL is correct and accessible
- Ensure "Who has access" is set to "Anyone" in the Apps Script deployment

### Delete not working or "No autorizado" error
- This is expected behavior - users can only delete their own entries
- The `Nombre` column in the sheet must match the logged-in username
- Check that the requesterName is being sent correctly from the frontend

## Updating the Deployment

### Update Google Apps Script
1. Go to your Apps Script project
2. Update the Code.gs file
3. Click **Deploy > Manage deployments**
4. Click the pencil icon (Edit) on your existing deployment
5. Create a new version
6. Click **Deploy**

### Update Vercel Application
1. Push changes to your GitHub repository
2. Vercel will automatically deploy the changes
3. Or manually trigger a deployment from the Vercel dashboard

## Security Notes

- The API key (`enterobacter`) is a basic security measure
- For production, consider using more secure authentication methods
- The Google Apps Script runs with your permissions, so be careful who has access
- Consider implementing rate limiting if the app will be publicly accessible

## Support

For issues or questions:
1. Check the browser console for error messages
2. Check the Vercel deployment logs
3. Check the Google Apps Script execution logs (View > Executions in Apps Script)
4. Create an issue in the GitHub repository
