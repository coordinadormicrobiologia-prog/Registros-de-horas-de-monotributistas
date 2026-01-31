// services/storageService.ts
// Servicio que envuelve las llamadas a /api/proxy.
// Exporta funciones individuales y un objeto named export `storageService`
// para que `import { storageService } from '../services/storageService'` funcione.

async function parseResponseText(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function getEntriesFor(owner: string): Promise<any[]> {
  const url = `/api/proxy?action=getEntries&owner=${encodeURIComponent(owner)}`;
  const r = await fetch(url, { method: 'GET' });
  const data = await parseResponseText(r);
  if (!r.ok) {
    throw new Error((data && data.error) || `getEntries failed: ${r.status}`);
  }
  // Algunos flujos devuelven { ok: true, data: [...] } y otros solo [...]
  if (data && data.ok === true && Array.isArray(data.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

export async function saveEntry(entry: any): Promise<any> {
  const r = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'saveEntry', entry }),
  });
  const data = await parseResponseText(r);
  if (!r.ok || (data && data.ok === false)) {
    throw new Error((data && data.error) || 'Save failed');
  }
  return data;
}

export async function deleteEntry(id: string, requesterName: string): Promise<any> {
  const r = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'deleteEntry', id, requesterName }),
  });
  const data = await parseResponseText(r);
  if (!r.ok || (data && data.ok === false)) {
    throw new Error((data && data.error) || 'Delete failed');
  }
  return data;
}

// Additional methods for EmployeePortal compatibility
export async function getAllLogs(): Promise<any[]> {
  // Get all entries without filtering by owner
  const url = `/api/proxy?action=getEntries`;
  const r = await fetch(url, { method: 'GET' });
  const data = await parseResponseText(r);
  if (!r.ok) {
    console.error('getAllLogs failed:', data);
    return [];
  }
  // Return the data array
  if (data && data.ok === true && Array.isArray(data.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

export async function saveLog(log: any): Promise<boolean> {
  try {
    await saveEntry(log);
    return true;
  } catch (err) {
    console.error('saveLog error:', err);
    return false;
  }
}

export async function deleteLog(id: string, requesterName: string): Promise<boolean> {
  try {
    if (!requesterName) {
      console.error('deleteLog: requesterName is required');
      return false;
    }
    await deleteEntry(id, requesterName);
    return true;
  } catch (err) {
    console.error('deleteLog error:', err);
    return false;
  }
}

export function isConfigured(): boolean {
  // Check if the proxy endpoint is available
  // In production this will always return true since proxy is deployed
  return true;
}

// Named export esperado por EmployeePortal.tsx
export const storageService = {
  getEntriesFor,
  saveEntry,
  deleteEntry,
  getAllLogs,
  saveLog,
  deleteLog,
  isConfigured,
};
