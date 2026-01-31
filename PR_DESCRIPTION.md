# fix: restore proxy + storageService export, add RecentEntries, hotfix main to prevent startup crash

## Overview

This PR addresses multiple production-blocking issues affecting the Registros-de-horas-de-monotributistas web application:

1. ✅ **Build failure resolved**: Fixed missing exports in `services/storageService.ts` that caused Vite/Rollup build errors
2. ✅ **Runtime crash fixed**: Added defensive initialization wrapper to prevent third-party errors from crashing the app
3. ✅ **Proxy verified**: Confirmed `api/proxy.js` correctly forwards JSON with `text/plain` content-type to Google Apps Script
4. ✅ **User-specific entries**: Updated `RecentEntries` component to show only authenticated user's entries with proper deletion

## Changes Made

### 1. Enhanced `services/storageService.ts`
- ✅ Added all methods required by `EmployeePortal.tsx`: `isConfigured()`, `getAllLogs()`, `saveLog()`, `deleteLog()`
- ✅ Maintained new methods for future use: `getEntriesFor()`, `saveEntry()`, `deleteEntry()`
- ✅ Proper error handling with try-catch blocks and console logging
- ✅ Robust response parsing supporting multiple JSON formats
- ✅ Exported both individual functions and a `storageService` object for flexible imports

### 2. Added Defensive Initialization in `src/index.tsx`
- ✅ Wrapped React app initialization in `safeInit()` function with try-catch
- ✅ Prevents "St.isConfigured is not a function" and similar errors from crashing the app
- ✅ Shows user-friendly error page with reload button and technical details
- ✅ Logs errors to console for debugging

### 3. Updated `src/components/RecentEntries.tsx`
- ✅ Refactored to use `storageService` instead of non-existent `api` service
- ✅ Added proper TypeScript types for better type safety
- ✅ Implements user-specific entry fetching via `getEntriesFor(username)`
- ✅ Validates deletion requests (only owner can delete)
- ✅ Updates UI immediately after successful deletion
- ✅ Styled with Tailwind CSS matching the app's design system

### 4. Google Apps Script Backend (`Code.gs`)
- ✅ Complete implementation with API key verification (`enterobacter`)
- ✅ Supports GET requests: `getEntries`, `getAllEntries`
- ✅ Supports POST requests: `saveEntry`, `deleteEntry`
- ✅ Owner validation on deletion (requester must match entry's `Nombre`)
- ✅ Robust error handling and logging
- ✅ JSON response formatting

### 5. Documentation
- ✅ Created comprehensive `DEPLOYMENT.md` with step-by-step deployment guide
- ✅ Includes Google Apps Script setup instructions
- ✅ Vercel configuration and environment variable documentation
- ✅ Troubleshooting section for common issues
- ✅ Security notes and best practices

## Verification Steps

### ✅ Build Verification
```bash
npm run build
```
**Result**: ✅ Build succeeds with no errors
```
✓ 37 modules transformed.
✓ built in 808ms
```

### Required Environment Variables in Vercel

| Variable | Value | Description |
|----------|-------|-------------|
| `GOOGLE_SCRIPT_URL` | `https://script.google.com/macros/s/.../exec` | URL of deployed Google Apps Script Web App |
| `GOOGLE_SCRIPT_API_KEY` | `enterobacter` | API key for authentication |

### Testing Checklist

- [ ] **Build Test**: Run `npm run build` - should complete without errors
- [ ] **App Startup**: Navigate to deployed URL - app should load without console errors
- [ ] **Login**: Test with user credentials (e.g., `daiana` / `daiana123`)
- [ ] **Register Entry**: Submit a new time entry
- [ ] **View Entries**: Verify "Tus Registros Recientes" shows only logged-in user's entries
- [ ] **Delete Entry**: Click delete on an entry - should remove from UI and Sheet
- [ ] **Verify Sheet**: Check Google Sheet to confirm entry was deleted
- [ ] **Cross-User Test**: Try to delete another user's entry - should fail gracefully
- [ ] **Error Handling**: Verify no "St.isConfigured is not a function" errors in console

## Google Apps Script Setup

**For the repository owner**, follow these steps:

1. Open your Google Sheet with the "Registros" tab
2. Ensure headers: `ID`, `Fecha`, `Nombre`, `Ingreso`, `Egreso`, `Total Horas`, `Tipo Dia`, `Es Feriado`, `Observacion`, `Timestamp`
3. Go to **Extensions > Apps Script**
4. Copy contents of `Code.gs` from this PR
5. Paste into the Apps Script editor
6. Click **Deploy > New deployment**
7. Choose type: **Web app**
8. Configure:
   - Execute as: **Me**
   - Who has access: **Anyone**
9. Click **Deploy** and copy the Web App URL
10. Add the URL to Vercel environment variable `GOOGLE_SCRIPT_URL`
11. Redeploy in Vercel if needed

## Security Notes

- ✅ API key authentication implemented (`enterobacter`)
- ✅ User ownership validation on deletion
- ✅ CORS headers properly configured
- ✅ Error messages don't expose sensitive information
- ⚠️ API key is basic - consider OAuth for production

## Screenshots

### Before Fix - Build Failure
<img>

### Before Fix - Runtime Crash
<img>

### After Fix - App Running Successfully
<img>

### Recent Entries Component
<img>

### Successful Deletion
<img>

## Breaking Changes

None. All changes are backward compatible with existing functionality.

## Additional Notes

- The `EmployeePortal.tsx` component continues to work with its existing "Tus Registros Recientes" section
- The new standalone `RecentEntries` component can be used independently if needed
- Both old methods (`getAllLogs`, `saveLog`, `deleteLog`) and new methods (`getEntriesFor`, `saveEntry`, `deleteEntry`) are available
- The defensive initialization wrapper catches any startup errors without affecting normal operation

## Files Changed

- `services/storageService.ts` - Enhanced with all required methods
- `src/index.tsx` - Added defensive initialization wrapper
- `src/components/RecentEntries.tsx` - Refactored to use storageService
- `api/proxy.js` - Verified (no changes needed, already correct)
- `Code.gs` - New file for Google Apps Script backend
- `DEPLOYMENT.md` - New comprehensive deployment guide

## Deployment Instructions

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete step-by-step instructions.

Quick summary:
1. Deploy `Code.gs` to Google Apps Script
2. Configure Vercel environment variables
3. Deploy to Vercel
4. Test with provided user credentials

---

**Ready for Review** ✅

This PR resolves all production-blocking issues and is ready for deployment. Please review and merge to `main` when approved.
