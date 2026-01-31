// services/storageService.ts
// Implementación que usa el proxy /api/proxy cuando está disponible.
// Requiere que exista constants.ts exportando PROXY_PATH

import { PROXY_PATH, GOOGLE_SCRIPT_URL } from '../constants';
import { extractDateYYYYMMDD, extractTimeHHMM } from '../src/utils/dateHelpers';
import { TimeLog } from '../types';

const PROXY = PROXY_PATH || '/api/proxy'; // fallback

async function timeoutFetch(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
  try {
    // Always use cache: 'no-store' to avoid stale data
    const res = await fetch(url, { 
      ...options, 
      signal: controller.signal,
      cache: 'no-store'
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Parse response text and handle nested data structures
 */
function parseResponseText(text: string): any {
  try {
    return JSON.parse(text);
  } catch (err) {
    console.debug('[parseResponseText] Failed to parse JSON:', text?.substring(0, 100));
    return null;
  }
}

/**
 * Normalize a Sheets row to TimeLog format
 * Handles Spanish keys with spaces (ID, Fecha, " Ingreso", etc.)
 */
function normalizeSheetsRow(row: any): TimeLog | null {
  if (!row || typeof row !== 'object') {
    return null;
  }

  console.debug('[normalizeSheetsRow] Input:', row);

  // Map Spanish/spaced keys to lowercase without spaces
  const keyMap: Record<string, string> = {
    'ID': 'id',
    'id': 'id',
    'Fecha': 'date',
    'fecha': 'date',
    'date': 'date',
    'Nombre': 'employeeName',
    'nombre': 'employeeName',
    'employeeName': 'employeeName',
    ' Ingreso': 'entryTime',
    'Ingreso': 'entryTime',
    'ingreso': 'entryTime',
    'entryTime': 'entryTime',
    ' Egreso': 'exitTime',
    'Egreso': 'exitTime',
    'egreso': 'exitTime',
    'exitTime': 'exitTime',
    ' Total_Horas': 'totalHours',
    'Total_Horas': 'totalHours',
    'totalHours': 'totalHours',
    'Tipo_Dia': 'dayType',
    'dayType': 'dayType',
    'Es_Feriado': 'isHoliday',
    'isHoliday': 'isHoliday',
    'Observacion': 'observation',
    'observation': 'observation',
    'Fecha_Carga': 'timestamp',
    'timestamp': 'timestamp'
  };

  const normalized: any = {};

  // Map keys
  for (const [originalKey, value] of Object.entries(row)) {
    const mappedKey = keyMap[originalKey] || originalKey.toLowerCase().trim().replace(/\s+/g, '_');
    normalized[mappedKey] = value;
  }

  // Normalize date to YYYY-MM-DD
  const dateRaw = normalized.date || normalized.fecha || '';
  const date = extractDateYYYYMMDD(dateRaw);

  // Normalize times to HH:MM
  const entryRaw = normalized.entryTime || normalized.entrytime || normalized.ingreso || '';
  const exitRaw = normalized.exitTime || normalized.exittime || normalized.egreso || '';
  const entryTime = extractTimeHHMM(entryRaw);
  const exitTime = extractTimeHHMM(exitRaw);

  // Normalize totalHours to number
  let totalHours = 0;
  const totalRaw = normalized.totalHours || normalized.totalhours || normalized.total_horas || 0;
  if (typeof totalRaw === 'number') {
    totalHours = totalRaw;
  } else if (typeof totalRaw === 'string') {
    totalHours = parseFloat(totalRaw) || 0;
  }

  // Normalize isHoliday to boolean
  let isHoliday = false;
  const holidayRaw = normalized.isHoliday || normalized.isholiday || normalized.es_feriado;
  if (typeof holidayRaw === 'boolean') {
    isHoliday = holidayRaw;
  } else if (typeof holidayRaw === 'string') {
    isHoliday = holidayRaw.toLowerCase() === 'true' || holidayRaw === '1';
  }

  const result: TimeLog = {
    id: String(normalized.id || crypto.randomUUID()),
    date,
    employeeName: String(normalized.employeeName || normalized.employeename || normalized.nombre || ''),
    entryTime,
    exitTime,
    totalHours,
    dayType: (normalized.dayType || normalized.daytype || normalized.tipo_dia || 'Semana') as any,
    isHoliday,
    observation: String(normalized.observation || normalized.observacion || ''),
    timestamp: String(normalized.timestamp || normalized.fecha_carga || new Date().toISOString())
  };

  console.debug('[normalizeSheetsRow] Output:', result);
  return result;
}

export const storageService = {
  // Comprueba si la app está configurada: aceptamos proxy o la URL directa
  isConfigured(): boolean {
    return Boolean(PROXY || GOOGLE_SCRIPT_URL);
  },

  // Leer todos los registros con normalización y retries
  async getAllLogs(retries = 3, delayMs = 800): Promise<TimeLog[]> {
    console.debug('[getAllLogs] Starting with retries:', retries);
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const url = `${PROXY}?action=getEntries`;
        console.debug(`[getAllLogs] Attempt ${attempt + 1}/${retries} - Fetching:`, url);
        
        const res = await timeoutFetch(url, { method: 'GET' });
        const text = await res.text();
        console.debug('[getAllLogs] Response text:', text?.substring(0, 200));
        
        const parsed = parseResponseText(text);
        if (!parsed) {
          console.debug('[getAllLogs] Failed to parse response, retrying...');
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }

        // Handle nested data: { ok: true, data: { ok: true, data: [...] } }
        let data = parsed;
        
        // Unwrap nested data structures
        if (data.data && typeof data.data === 'object') {
          console.debug('[getAllLogs] Unwrapping data.data');
          data = data.data;
        }

        // If data.data exists again (double nesting), unwrap again
        if (data.data && typeof data.data === 'object') {
          console.debug('[getAllLogs] Unwrapping data.data again');
          data = data.data;
        }

        // Check if we got a save response instead of a list (caching issue)
        if (data.ok && data.id && !Array.isArray(data.data)) {
          console.debug('[getAllLogs] Detected save response instead of list, retrying...');
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }

        // Extract the array
        let array = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
        
        if (!Array.isArray(array) || array.length === 0) {
          console.debug('[getAllLogs] No array found or empty array');
          if (attempt < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
            continue;
          }
          return [];
        }

        console.debug('[getAllLogs] Found array with', array.length, 'items');

        // Normalize all rows
        const normalized = array
          .map(row => normalizeSheetsRow(row))
          .filter((log): log is TimeLog => log !== null);

        console.debug('[getAllLogs] Normalized to', normalized.length, 'logs');
        return normalized;

      } catch (err) {
        console.error('[getAllLogs] Error on attempt', attempt + 1, ':', err);
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    console.debug('[getAllLogs] All retries exhausted, returning empty array');
    return [];
  },

  // Guardar un registro con parsing flexible
  async saveLog(entry: any): Promise<{ ok: boolean; saved?: TimeLog; raw?: any }> {
    try {
      console.debug('[saveLog] Saving entry:', entry);
      
      const res = await timeoutFetch(PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveEntry', entry }),
      });

      const text = await res.text();
      console.debug('[saveLog] Response text:', text?.substring(0, 200));
      
      const parsed = parseResponseText(text);
      
      if (parsed && parsed.ok) {
        console.debug('[saveLog] Success');
        return { 
          ok: true, 
          saved: entry,
          raw: parsed
        };
      }

      return { ok: res.ok, raw: parsed };
    } catch (err) {
      console.error('[saveLog] Error:', err);
      return { ok: false };
    }
  },

  // Borrar un registro
  async deleteLog(id: string, requesterName?: string): Promise<boolean> {
    try {
      console.debug('[deleteLog] Deleting entry:', id, 'by:', requesterName);
      
      const res = await timeoutFetch(PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'deleteEntry', 
          id,
          requesterName 
        }),
      });

      const text = await res.text();
      console.debug('[deleteLog] Response text:', text?.substring(0, 200));
      
      const parsed = parseResponseText(text);
      const success = Boolean(parsed && (parsed.ok === true || parsed.ok));
      
      console.debug('[deleteLog] Success:', success);
      return success;
    } catch (err) {
      console.error('[deleteLog] Error:', err);
      return false;
    }
  }
};

export default storageService;