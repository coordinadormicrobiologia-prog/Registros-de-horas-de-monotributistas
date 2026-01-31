// Code.gs - Google Apps Script
// Este archivo debe ser copiado manualmente al proyecto de Google Apps Script
// y luego desplegado como Web App con acceso "Anyone"
//
// IMPORTANTE: Configurar las siguientes variables:
// - SPREADSHEET_ID: ID de la hoja de cálculo de Google Sheets
// - API_KEY_EXPECTED: "enterobacter" (o el valor configurado en GOOGLE_SCRIPT_API_KEY)

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with your actual Spreadsheet ID
const API_KEY_EXPECTED = 'enterobacter';
const SHEET_NAME = 'Registros'; // Nombre de la hoja

function doGet(e) {
  try {
    const params = e.parameter;
    const apiKey = params.apiKey || '';
    
    if (apiKey !== API_KEY_EXPECTED) {
      return jsonResponse({ ok: false, error: 'Invalid API key' });
    }
    
    const action = params.action;
    
    if (action === 'getEntries') {
      const owner = params.owner || '';
      return jsonResponse(getEntries(owner));
    }
    
    return jsonResponse({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

function doPost(e) {
  try {
    // Google Apps Script recibe el body como texto en postData.contents
    const postData = e.postData && e.postData.contents ? e.postData.contents : '{}';
    const data = JSON.parse(postData);
    
    const apiKey = data.apiKey || '';
    if (apiKey !== API_KEY_EXPECTED) {
      return jsonResponse({ ok: false, error: 'Invalid API key' });
    }
    
    const action = data.action;
    
    if (action === 'getEntries') {
      const owner = data.owner || '';
      return jsonResponse(getEntries(owner));
    }
    
    if (action === 'saveEntry') {
      return jsonResponse(saveEntry(data.entry));
    }
    
    if (action === 'deleteEntry') {
      return jsonResponse(deleteEntry(data.id, data.requesterName));
    }
    
    return jsonResponse({ ok: false, error: 'Unknown or malformed action' });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

function getEntries(owner) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return { ok: false, error: 'Sheet not found' };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    // Buscar índices de columnas importantes
    const idIndex = headers.indexOf('id');
    const nombreIndex = headers.indexOf('Nombre');
    const fechaIndex = headers.indexOf('Fecha');
    const ingresoIndex = headers.indexOf('Ingreso');
    const egresoIndex = headers.indexOf('Egreso');
    const horasIndex = headers.indexOf('Total Horas');
    const tipoIndex = headers.indexOf('Tipo Día');
    const feriadoIndex = headers.indexOf('¿Feriado?');
    const obsIndex = headers.indexOf('Observaciones');
    const timestampIndex = headers.indexOf('Timestamp');
    
    const entries = rows
      .filter(row => {
        // Filtrar filas vacías
        if (!row[idIndex] || row[idIndex] === '') return false;
        
        // Si se especifica owner, filtrar por nombre
        if (owner && owner !== '') {
          return row[nombreIndex] === owner;
        }
        return true;
      })
      .map(row => ({
        id: row[idIndex],
        employeeName: row[nombreIndex],
        date: row[fechaIndex],
        entryTime: row[ingresoIndex],
        exitTime: row[egresoIndex],
        totalHours: parseFloat(row[horasIndex]) || 0,
        dayType: row[tipoIndex],
        isHoliday: row[feriadoIndex] === 'Sí' || row[feriadoIndex] === true,
        observation: row[obsIndex] || '',
        timestamp: row[timestampIndex] || ''
      }));
    
    return { ok: true, data: entries };
  } catch (err) {
    return { ok: false, error: err.toString() };
  }
}

function saveEntry(entry) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // Si la hoja no existe, crearla con headers
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['id', 'Nombre', 'Fecha', 'Ingreso', 'Egreso', 'Total Horas', 'Tipo Día', '¿Feriado?', 'Observaciones', 'Timestamp']);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('id');
    
    // Buscar si ya existe una entrada con este ID
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === entry.id) {
        rowIndex = i + 1; // +1 porque las filas empiezan en 1, no en 0
        break;
      }
    }
    
    const timestamp = new Date().toISOString();
    const rowData = [
      entry.id,
      entry.employeeName,
      entry.date,
      entry.entryTime,
      entry.exitTime,
      entry.totalHours,
      entry.dayType,
      entry.isHoliday ? 'Sí' : 'No',
      entry.observation || '',
      entry.timestamp || timestamp
    ];
    
    if (rowIndex > 0) {
      // Actualizar fila existente
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    } else {
      // Agregar nueva fila
      sheet.appendRow(rowData);
    }
    
    return { ok: true, id: entry.id };
  } catch (err) {
    return { ok: false, error: err.toString() };
  }
}

function deleteEntry(id, requesterName) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return { ok: false, error: 'Sheet not found' };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('id');
    const nombreIndex = headers.indexOf('Nombre');
    
    // Buscar la fila con el ID especificado
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === id) {
        // Validar que el requester coincide con el nombre en la fila
        const rowOwner = data[i][nombreIndex];
        
        // Si se proporciona requesterName, validar que coincide
        if (requesterName && requesterName !== '' && rowOwner !== requesterName) {
          return { ok: false, error: 'Permission denied: you can only delete your own entries' };
        }
        
        // Eliminar la fila
        sheet.deleteRow(i + 1); // +1 porque las filas empiezan en 1
        return { ok: true, deleted: id };
      }
    }
    
    return { ok: false, error: 'Entry not found' };
  } catch (err) {
    return { ok: false, error: err.toString() };
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
