// services/storageService.ts
// Implementación que usa el proxy /api/proxy cuando está disponible.
// Requiere que exista constants.ts exportando PROXY_PATH

import { PROXY_PATH, GOOGLE_SCRIPT_URL } from '../constants';
import type { TimeLog } from '../types';

const PROXY = PROXY_PATH || '/api/proxy'; // fallback

// Mapeo de claves del backend (español con espacios) a formato frontend
const KEY_MAPPINGS = {
  id: ['ID', 'id'],
  date: ['Fecha', 'date'],
  employeeName: ['Nombre', 'employeeName'],
  entryTime: [' Ingreso', 'Ingreso', 'entryTime'],
  exitTime: [' Egreso', 'Egreso', 'exitTime'],
  totalHours: [' Total_Horas', 'Total_Horas', 'totalHours'],
  dayType: ['Tipo_Dia', 'dayType'],
  isHoliday: [' Feriado', 'Feriado', 'isHoliday'],
  observation: ['Observacion', 'observation'],
  timestamp: ['Fecha_Carga', 'timestamp'],
} as const;

async function timeoutFetch(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Helper para parsear respuestas de texto de forma segura
 */
function parseResponseText(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    console.warn('storageService: Failed to parse response text as JSON', text);
    return null;
  }
}

/**
 * Busca un valor en el objeto usando múltiples claves posibles
 */
function findValue(row: any, possibleKeys: readonly string[], defaultValue: any = ''): any {
  for (const key of possibleKeys) {
    if (row[key] !== undefined && row[key] !== null) {
      return row[key];
    }
  }
  return defaultValue;
}

/**
 * Normaliza una fila de Sheets (claves en español con espacios)
 * a la estructura TimeLog esperada por el frontend.
 * 
 * Claves esperadas del backend:
 * - "ID", "Fecha", "Nombre", " Ingreso", " Egreso", " Total_Horas",
 *   "Tipo_Dia", " Feriado", "Observacion", "Fecha_Carga"
 */
function normalizeSheetsRow(row: any): TimeLog | null {
  try {
    const id = findValue(row, KEY_MAPPINGS.id);
    const date = findValue(row, KEY_MAPPINGS.date);
    const employeeName = findValue(row, KEY_MAPPINGS.employeeName);
    const entryTime = findValue(row, KEY_MAPPINGS.entryTime);
    const exitTime = findValue(row, KEY_MAPPINGS.exitTime);
    const totalHours = parseFloat(findValue(row, KEY_MAPPINGS.totalHours, '0'));
    const dayType = findValue(row, KEY_MAPPINGS.dayType, 'Semana');
    const isHoliday = Boolean(findValue(row, KEY_MAPPINGS.isHoliday, false));
    const observation = findValue(row, KEY_MAPPINGS.observation);
    const timestamp = findValue(row, KEY_MAPPINGS.timestamp, new Date().toISOString());

    if (!id || !date || !employeeName) {
      console.warn('storageService: Row missing required fields', row);
      return null;
    }

    return {
      id,
      date,
      employeeName,
      entryTime,
      exitTime,
      totalHours,
      dayType,
      isHoliday,
      observation,
      timestamp,
    };
  } catch (err) {
    console.error('storageService: normalizeSheetsRow error', err, row);
    return null;
  }
}

/**
 * Espera un tiempo antes de reintentar
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const storageService = {
  // Comprueba si la app está configurada: aceptamos proxy o la URL directa
  isConfigured(): boolean {
    return Boolean(PROXY || GOOGLE_SCRIPT_URL);
  },

  /**
   * Leer todos los registros con reintentos y normalización.
   * El backend puede devolver respuestas inconsistentes (caché edge, etc.)
   * por lo que reintentamos hasta obtener un array válido.
   * 
   * @param retries - Número máximo de intentos (default: 3)
   * @param delayMs - Tiempo de espera en milisegundos entre reintentos (default: 800)
   * @returns Array de TimeLog normalizado
   */
  async getAllLogs(retries = 3, delayMs = 800): Promise<TimeLog[]> {
    let attempt = 0;
    
    while (attempt < retries) {
      try {
        const url = `${PROXY}?action=getEntries&_t=${Date.now()}`;
        console.log(`storageService.getAllLogs: attempt ${attempt + 1}/${retries}`, url);
        
        const res = await timeoutFetch(url, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
        
        if (!res.ok) {
          console.warn(`storageService.getAllLogs: HTTP ${res.status}, retrying...`);
          attempt++;
          await delay(delayMs);
          continue;
        }

        const text = await res.text();
        const parsed = parseResponseText(text);

        if (!parsed) {
          console.warn('storageService.getAllLogs: Failed to parse response, retrying...');
          attempt++;
          await delay(delayMs);
          continue;
        }

        // Caso 1: { ok: true, data: [...] } - respuesta esperada
        if (parsed.data && Array.isArray(parsed.data)) {
          console.log(`storageService.getAllLogs: Got array with ${parsed.data.length} items`);
          const normalized = parsed.data
            .map(normalizeSheetsRow)
            .filter((log): log is TimeLog => log !== null);
          return normalized;
        }

        // Caso 2: Array directo (menos probable pero posible)
        if (Array.isArray(parsed)) {
          console.log(`storageService.getAllLogs: Got direct array with ${parsed.length} items`);
          const normalized = parsed
            .map(normalizeSheetsRow)
            .filter((log): log is TimeLog => log !== null);
          return normalized;
        }

        // Caso 3: { ok: true, data: { ok: true, id: '...' } } - respuesta de save
        // Esto indica que GET devolvió una respuesta de POST (problema de caché)
        if (parsed.data && typeof parsed.data === 'object' && 'id' in parsed.data) {
          console.warn('storageService.getAllLogs: Got save-like response instead of array, retrying...');
          attempt++;
          await delay(delayMs);
          continue;
        }

        // Caso 4: Respuesta inesperada
        console.warn('storageService.getAllLogs: Unexpected response format', parsed);
        attempt++;
        await delay(delayMs);
      } catch (err) {
        console.error(`storageService.getAllLogs: error on attempt ${attempt + 1}`, err);
        attempt++;
        if (attempt < retries) {
          await delay(delayMs);
        }
      }
    }

    console.warn('storageService.getAllLogs: All retries exhausted, returning empty array');
    return [];
  },

  /**
   * Guardar un registro con mejor parseo de respuestas
   */
  async saveLog(entry: any): Promise<{ ok: boolean; saved?: TimeLog; raw?: any }> {
    try {
      console.log('storageService.saveLog:', entry);
      
      const res = await timeoutFetch(PROXY, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ action: 'saveEntry', entry }),
      });

      const text = await res.text();
      const parsed = parseResponseText(text);

      if (!parsed) {
        // Si no es JSON pero status es OK, consideramos éxito
        const ok = res.ok;
        console.log(`storageService.saveLog: non-JSON response, ok=${ok}`);
        return { ok, raw: text };
      }

      // Respuesta típica: { ok: true, id: '...', data: {...} }
      const ok = Boolean(parsed.ok || parsed.success);
      console.log(`storageService.saveLog: result ok=${ok}`, parsed);

      // Intentar construir TimeLog desde la respuesta
      let saved: TimeLog | undefined;
      if (ok && parsed.data) {
        saved = normalizeSheetsRow(parsed.data);
      } else if (ok && parsed.id) {
        // Si tenemos id pero no data completa, construir desde entry
        saved = {
          ...entry,
          id: parsed.id,
          timestamp: parsed.timestamp || new Date().toISOString(),
        } as TimeLog;
      }

      return { ok, saved, raw: parsed };
    } catch (err) {
      console.error('storageService.saveLog error', err);
      return { ok: false };
    }
  },

  /**
   * Eliminar un registro
   * @param id - ID del registro a eliminar
   * @param requesterName - Nombre del usuario que solicita el borrado (validación server-side)
   */
  async deleteLog(id: string, requesterName?: string): Promise<boolean> {
    try {
      console.log('storageService.deleteLog:', { id, requesterName });

      const payload: any = { action: 'deleteEntry', id };
      if (requesterName) {
        payload.requesterName = requesterName;
      }

      const res = await timeoutFetch(PROXY, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const parsed = parseResponseText(text);

      const ok = parsed ? Boolean(parsed.ok || parsed.success) : res.ok;
      console.log(`storageService.deleteLog: result ok=${ok}`, parsed);
      return ok;
    } catch (err) {
      console.error('storageService.deleteLog error', err);
      return false;
    }
  }
};

export default storageService;