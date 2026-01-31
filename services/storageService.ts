// services/storageService.ts
// Implementación que usa el proxy /api/proxy cuando está disponible.
// Requiere que exista constants.ts exportando PROXY_PATH

import { PROXY_PATH, GOOGLE_SCRIPT_URL } from '../constants';
import { TimeLog } from '../types';

const PROXY = PROXY_PATH || '/api/proxy'; // fallback

async function timeoutFetch(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
  try {
    const res = await fetch(url, { 
      ...options, 
      signal: controller.signal,
      cache: options.cache || 'no-store' // default to no-store
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Helper: parse JSON safely
function parseResponseText(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    console.debug('[storageService] parseResponseText failed, returning null');
    return null;
  }
}

// Helper: normalize Sheets row to TimeLog
// Sheets may return keys like "ID", "Fecha", "Nombre", " Ingreso", " Total_Horas", "Fecha_Carga"
function normalizeSheetsRow(row: any): TimeLog | null {
  try {
    // Map Spanish/spaced keys to English properties
    const id = row.id || row.ID || row.Id || '';
    const date = row.date || row.Fecha || row.fecha || '';
    const employeeName = row.employeeName || row.Nombre || row.nombre || '';
    const entryTime = row.entryTime || row[' Ingreso'] || row.Ingreso || row.ingreso || '';
    const exitTime = row.exitTime || row.Egreso || row.egreso || '';
    const totalHours = parseFloat(row.totalHours || row[' Total_Horas'] || row.Total_Horas || row.total_horas || '0');
    const dayType = row.dayType || row.Tipo_Dia || row.tipo_dia || 'Semana';
    const isHoliday = Boolean(row.isHoliday || row.Feriado || row.feriado);
    const observation = row.observation || row.Observacion || row.observacion || '';
    const timestamp = row.timestamp || row.Fecha_Carga || row.fecha_carga || new Date().toISOString();

    if (!id || !date || !employeeName) {
      console.debug('[storageService] normalizeSheetsRow: missing required fields', row);
      return null;
    }

    return {
      id,
      date,
      employeeName,
      entryTime,
      exitTime,
      totalHours,
      dayType: dayType as any,
      isHoliday,
      observation,
      timestamp
    };
  } catch (err) {
    console.debug('[storageService] normalizeSheetsRow error', err, row);
    return null;
  }
}

export const storageService = {
  // Comprueba si la app está configurada: aceptamos proxy o la URL directa
  isConfigured(): boolean {
    return Boolean(PROXY || GOOGLE_SCRIPT_URL);
  },

  // Leer todos los registros con reintentos y normalización
  async getAllLogs(retries = 3, delayMs = 800): Promise<TimeLog[]> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const url = `${PROXY}?action=getEntries`;
        const res = await timeoutFetch(url, { method: 'GET', cache: 'no-store' });
        const text = await res.text();
        console.debug('[storageService] getAllLogs response text:', text);

        const parsed = parseResponseText(text);
        if (!parsed) {
          console.debug('[storageService] getAllLogs: failed to parse response');
          if (attempt < retries - 1) {
            await new Promise(r => setTimeout(r, delayMs));
            continue;
          }
          return [];
        }

        // Handle different response shapes
        let dataArray: any[] = [];
        
        // Case 1: {ok:true, data:[...]}
        if (parsed.ok && Array.isArray(parsed.data)) {
          dataArray = parsed.data;
        }
        // Case 2: {ok:true, data:{ok:true, id:...}} - this is a save response, retry
        else if (parsed.ok && parsed.data && typeof parsed.data === 'object' && 'id' in parsed.data) {
          console.debug('[storageService] getAllLogs: received save response instead of array, retrying...');
          if (attempt < retries - 1) {
            await new Promise(r => setTimeout(r, delayMs));
            continue;
          }
          return [];
        }
        // Case 3: {data: {data: [...]}}
        else if (parsed.data && parsed.data.data && Array.isArray(parsed.data.data)) {
          dataArray = parsed.data.data;
        }
        // Case 4: direct array
        else if (Array.isArray(parsed)) {
          dataArray = parsed;
        }
        // Case 5: {data: [...]}
        else if (parsed.data && Array.isArray(parsed.data)) {
          dataArray = parsed.data;
        }
        else {
          console.debug('[storageService] getAllLogs: unexpected response shape', parsed);
          if (attempt < retries - 1) {
            await new Promise(r => setTimeout(r, delayMs));
            continue;
          }
          return [];
        }

        // Normalize each row
        const normalized = dataArray
          .map(row => normalizeSheetsRow(row))
          .filter((log): log is TimeLog => log !== null);

        console.debug(`[storageService] getAllLogs: normalized ${normalized.length} logs`);
        return normalized;
      } catch (err) {
        console.error('[storageService] getAllLogs error', err);
        if (attempt < retries - 1) {
          await new Promise(r => setTimeout(r, delayMs));
          continue;
        }
        return [];
      }
    }
    return [];
  },

  // Guardar un registro con parsing flexible
  async saveLog(entry: any): Promise<{ ok: boolean; saved?: any; raw?: any }> {
    try {
      const res = await timeoutFetch(PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveEntry', entry }),
        cache: 'no-store'
      });

      const text = await res.text();
      console.debug('[storageService] saveLog response text:', text);

      const parsed = parseResponseText(text);
      if (!parsed) {
        return { ok: res.ok, raw: text };
      }

      const ok = Boolean(parsed && (parsed.ok === true || parsed.ok));
      const saved = parsed.saved || parsed.data || parsed;
      return { ok, saved, raw: parsed };
    } catch (err) {
      console.error('[storageService] saveLog error', err);
      return { ok: false };
    }
  },

  // Borrar un registro
  async deleteLog(id: string, requesterName?: string): Promise<boolean> {
    try {
      const res = await timeoutFetch(PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteEntry', id, requesterName }),
        cache: 'no-store'
      });

      const text = await res.text();
      console.debug('[storageService] deleteLog response text:', text);

      const parsed = parseResponseText(text);
      if (!parsed) {
        return res.ok;
      }

      return Boolean(parsed && (parsed.ok === true || parsed.ok));
    } catch (err) {
      console.error('[storageService] deleteLog error', err);
      return false;
    }
  }
};

export default storageService;