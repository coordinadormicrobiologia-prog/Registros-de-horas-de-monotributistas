/**
 * Google Apps Script - Code.gs
 * 
 * This script should be deployed as a Web App in Google Apps Script
 * with the following settings:
 * - Execute as: Me
 * - Who has access: Anyone
 * 
 * Environment variables needed in Vercel:
 * - GOOGLE_SCRIPT_URL = URL of this deployed Web App
 * - GOOGLE_SCRIPT_API_KEY = enterobacter
 */

// Configuration
const API_KEY = 'enterobacter';
const SHEET_NAME = 'Registros'; // Change this to your sheet name

/**
 * Main entry point for GET requests
 */
function doGet(e) {
  try {
    const params = e.parameter || {};
    
    // Verify API key
    if (params.apiKey !== API_KEY) {
      return createResponse({ ok: false, error: 'Invalid API key' }, 401);
    }
    
    const action = params.action || '';
    
    if (action === 'getEntries') {
      const owner = params.owner || '';
      const entries = getEntries(owner);
      return createResponse({ ok: true, data: entries });
    }
    
    if (action === 'getAllEntries') {
      const entries = getEntries(''); // Empty owner means get all
      return createResponse({ ok: true, data: entries });
    }
    
    return createResponse({ ok: false, error: 'Unknown action' }, 400);
  } catch (err) {
    Logger.log('doGet error: ' + err.message);
    return createResponse({ ok: false, error: err.message }, 500);
  }
}

/**
 * Main entry point for POST requests
 */
function doPost(e) {
  try {
    // Parse the JSON payload
    const payload = JSON.parse(e.postData.contents);
    
    // Verify API key
    if (payload.apiKey !== API_KEY) {
      return createResponse({ ok: false, error: 'Invalid API key' }, 401);
    }
    
    const action = payload.action || '';
    
    if (action === 'saveEntry') {
      const entry = payload.entry || {};
      const result = saveEntry(entry);
      return createResponse({ ok: true, data: result });
    }
    
    if (action === 'deleteEntry') {
      const id = payload.id || '';
      const requesterName = payload.requesterName || '';
      const result = deleteEntry(id, requesterName);
      return createResponse(result);
    }
    
    return createResponse({ ok: false, error: 'Unknown or malformed action' }, 400);
  } catch (err) {
    Logger.log('doPost error: ' + err.message);
    return createResponse({ ok: false, error: err.message }, 500);
  }
}

/**
 * Get entries, optionally filtered by owner (Nombre column)
 */
function getEntries(owner) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    throw new Error('Sheet "' + SHEET_NAME + '" not found');
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  // Find column indices
  const idIdx = headers.indexOf('ID');
  const fechaIdx = headers.indexOf('Fecha');
  const nombreIdx = headers.indexOf('Nombre');
  const ingresoIdx = headers.indexOf('Ingreso');
  const egresoIdx = headers.indexOf('Egreso');
  const totalIdx = headers.indexOf('Total Horas');
  const tipoDiaIdx = headers.indexOf('Tipo Dia');
  const esFeriadoIdx = headers.indexOf('Es Feriado');
  const observacionIdx = headers.indexOf('Observacion');
  const timestampIdx = headers.indexOf('Timestamp');
  
  const entries = [];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    // Skip empty rows
    if (!row[idIdx] && !row[fechaIdx]) continue;
    
    const nombre = String(row[nombreIdx] || '');
    
    // Filter by owner if specified
    if (owner && nombre.toLowerCase() !== owner.toLowerCase()) {
      continue;
    }
    
    entries.push({
      id: String(row[idIdx] || ''),
      date: formatDate(row[fechaIdx]),
      employeeName: nombre,
      entryTime: String(row[ingresoIdx] || ''),
      exitTime: String(row[egresoIdx] || ''),
      totalHours: parseFloat(row[totalIdx]) || 0,
      dayType: String(row[tipoDiaIdx] || ''),
      isHoliday: Boolean(row[esFeriadoIdx]),
      observation: String(row[observacionIdx] || ''),
      timestamp: formatDate(row[timestampIdx])
    });
  }
  
  return entries;
}

/**
 * Save an entry (create new or update existing by ID)
 */
function saveEntry(entry) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    throw new Error('Sheet "' + SHEET_NAME + '" not found');
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  // Find column indices
  const idIdx = headers.indexOf('ID');
  const fechaIdx = headers.indexOf('Fecha');
  const nombreIdx = headers.indexOf('Nombre');
  const ingresoIdx = headers.indexOf('Ingreso');
  const egresoIdx = headers.indexOf('Egreso');
  const totalIdx = headers.indexOf('Total Horas');
  const tipoDiaIdx = headers.indexOf('Tipo Dia');
  const esFeriadoIdx = headers.indexOf('Es Feriado');
  const observacionIdx = headers.indexOf('Observacion');
  const timestampIdx = headers.indexOf('Timestamp');
  
  // Check if entry already exists
  let rowIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][idIdx]) === String(entry.id)) {
      rowIndex = i + 2; // +2 because: +1 for header, +1 for 0-based to 1-based
      break;
    }
  }
  
  const rowData = new Array(headers.length).fill('');
  rowData[idIdx] = entry.id || '';
  rowData[fechaIdx] = entry.date || '';
  rowData[nombreIdx] = entry.employeeName || '';
  rowData[ingresoIdx] = entry.entryTime || '';
  rowData[egresoIdx] = entry.exitTime || '';
  rowData[totalIdx] = entry.totalHours || 0;
  rowData[tipoDiaIdx] = entry.dayType || '';
  rowData[esFeriadoIdx] = entry.isHoliday || false;
  rowData[observacionIdx] = entry.observation || '';
  rowData[timestampIdx] = new Date();
  
  if (rowIndex > 0) {
    // Update existing row
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowData]);
  } else {
    // Append new row
    sheet.appendRow(rowData);
  }
  
  return { id: entry.id, success: true };
}

/**
 * Delete an entry by ID, verifying that requester matches Nombre
 */
function deleteEntry(id, requesterName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    throw new Error('Sheet "' + SHEET_NAME + '" not found');
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const idIdx = headers.indexOf('ID');
  const nombreIdx = headers.indexOf('Nombre');
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[idIdx]) === String(id)) {
      const nombre = String(row[nombreIdx] || '');
      
      // Verify requester matches owner
      if (requesterName && nombre.toLowerCase() !== requesterName.toLowerCase()) {
        return { ok: false, error: 'No autorizado: el registro pertenece a otro usuario' };
      }
      
      // Delete the row (+2 for header and 0-based indexing)
      sheet.deleteRow(i + 2);
      return { ok: true, message: 'Registro eliminado' };
    }
  }
  
  return { ok: false, error: 'Registro no encontrado' };
}

/**
 * Helper to create JSON response
 */
function createResponse(data, statusCode) {
  statusCode = statusCode || 200;
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Helper to format dates
 */
function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string') return date;
  if (date instanceof Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(date);
}
