// services/storageService.ts
// Implementación que usa el proxy /api/proxy cuando está disponible.
// Requiere que exista src/constants.ts exportando PROXY_PATH

import { PROXY_PATH, GOOGLE_SCRIPT_URL } from '../src/constants';

const PROXY = PROXY_PATH || '/api/proxy'; // fallback

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

export const storageService = {
  // Nota: isConfigured() histórica mantiene compatibilidad; use checkConfigured() para comprobación real
  isConfigured(): boolean {
    return Boolean(PROXY || GOOGLE_SCRIPT_URL);
  },

  // Comprueba realmente si el proxy/endpoint está respondiendo
  async checkConfigured(): Promise<boolean> {
    try {
      const res = await timeoutFetch('/api/health', { method: 'GET' });
      return res.ok;
    } catch (err) {
      console.error('checkConfigured error', err);
      return false;
    }
  },

  // Leer todos los registros
  async getAllLogs(): Promise<any[]> {
    try {
      const url = `${PROXY}?action=getEntries`;
      const res = await timeoutFetch(url, { method: 'GET' });
      const text = await res.text();
      if (!res.ok) {
        console.error('getAllLogs upstream error', { status: res.status, body: text });
        return [];
      }
      try { return JSON.parse(text).data ?? JSON.parse(text); } catch (err) {
        console.error('getAllLogs parse error', err, 'text:', text);
        return [];
      }
    } catch (err) {
      console.error('getAllLogs error', err);
      return [];
    }
  },

  // Guardar un registro
  async saveLog(entry: any): Promise<boolean> {
    try {
      const res = await timeoutFetch(PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveEntry', entry }),
      });

      const text = await res.text();
      if (!res.ok) {
        console.error('saveLog upstream error', { status: res.status, body: text });
        return false;
      }

      try {
        const parsed = JSON.parse(text);
        return Boolean(parsed && (parsed.ok === true || parsed.ok));
      } catch (err) {
        // Si no es JSON, consideramos ok si status HTTP es 2xx
        console.warn('saveLog: response not json', err, 'body:', text);
        return res.ok;
      }
    } catch (err) {
      console.error('saveLog error', err);
      return false;
    }
  },

  // Borrar (o marcar) un registro
  async deleteLog(id: string): Promise<boolean> {
    try {
      const res = await timeoutFetch(PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteEntry', id }),
      });

      const text = await res.text();
      if (!res.ok) {
        console.error('deleteLog upstream error', { status: res.status, body: text });
        return false;
      }

      try {
        const parsed = JSON.parse(text);
        return Boolean(parsed && (parsed.ok === true || parsed.ok));
      } catch {
        return res.ok;
      }
    } catch (err) {
      console.error('deleteLog error', err);
      return false;
    }
  }
};

export default storageService;