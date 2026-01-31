// services/storageService.ts
// Servicio que envuelve las llamadas a /api/proxy.
// Exporta funciones individuales y un objeto named export `storageService`
// para que `import { storageService } from '../services/storageService'` funcione.

import { TimeLog } from '../types';

async function parseResponseText(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// Check if the service is configured (has required env vars)
export function isConfigured(): boolean {
  // In the browser, we can't directly check server env vars,
  // so we assume it's configured if we can reach the proxy
  return true;
}

// Get all logs from the backend
export async function getAllLogs(): Promise<TimeLog[]> {
  try {
    const url = `/api/proxy?action=getAllEntries`;
    const r = await fetch(url, { method: 'GET' });
    const data = await parseResponseText(r);
    if (!r.ok) {
      console.error('getAllLogs failed:', data);
      return [];
    }
    // Handle different response formats
    if (data && data.ok === true && Array.isArray(data.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    console.error('getAllLogs error:', err);
    return [];
  }
}

// Get entries for a specific owner
export async function getEntriesFor(owner: string): Promise<TimeLog[]> {
  try {
    const url = `/api/proxy?action=getEntries&owner=${encodeURIComponent(owner)}`;
    const r = await fetch(url, { method: 'GET' });
    const data = await parseResponseText(r);
    if (!r.ok) {
      console.error('getEntriesFor failed:', data);
      return [];
    }
    // Handle different response formats
    if (data && data.ok === true && Array.isArray(data.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    console.error('getEntriesFor error:', err);
    return [];
  }
}

// Save a log entry (legacy method used by EmployeePortal)
export async function saveLog(log: Omit<TimeLog, 'timestamp'>): Promise<boolean> {
  try {
    const r = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveEntry', entry: log }),
    });
    const data = await parseResponseText(r);
    if (!r.ok || (data && data.ok === false)) {
      console.error('saveLog failed:', data);
      return false;
    }
    return true;
  } catch (err) {
    console.error('saveLog error:', err);
    return false;
  }
}

// Save an entry (new method)
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

// Delete a log entry (legacy method used by EmployeePortal)
export async function deleteLog(id: string): Promise<boolean> {
  try {
    const r = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteEntry', id }),
    });
    const data = await parseResponseText(r);
    if (!r.ok || (data && data.ok === false)) {
      console.error('deleteLog failed:', data);
      return false;
    }
    return true;
  } catch (err) {
    console.error('deleteLog error:', err);
    return false;
  }
}

// Delete an entry with requester validation (new method)
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

// Named export esperado por EmployeePortal.tsx
export const storageService = {
  isConfigured,
  getAllLogs,
  getEntriesFor,
  saveLog,
  saveEntry,
  deleteLog,
  deleteEntry,
};
