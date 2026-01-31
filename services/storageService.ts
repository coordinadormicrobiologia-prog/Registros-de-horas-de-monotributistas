// src/services/storageService.ts
export async function parseResponseText(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function getEntriesFor(owner: string) {
  const url = `/api/proxy?action=getEntries&owner=${encodeURIComponent(owner)}`;
  const r = await fetch(url, { method: 'GET' });
  const data = await parseResponseText(r);
  if (!r.ok) {
    throw new Error((data && data.error) || `getEntries failed: ${r.status}`);
  }
  // if GAS returns {ok:true, data: [...]}
  if (data && data.ok === true && Array.isArray(data.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

export async function saveEntry(entry: any) {
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

export async function deleteEntry(id: string, requesterName: string) {
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
