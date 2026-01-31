import React, { useEffect, useState } from 'react';
import { getEntriesFor, deleteEntry } from '../services/storageService';

type Entry = {
  ID: string;
  Fecha?: string;
  Nombre?: string;
  Ingreso?: string;
  Egreso?: string;
  Total_Horas?: string | number;
  Observaciones?: string;
  Fecha_Carga?: string;
  [k: string]: any;
};

export default function RecentEntries({ username }: { username: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getEntriesFor(username);
      setEntries(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (username) load();
  }, [username]);

  async function handleDelete(id: string) {
    if (!confirm('¿Borrar registro? Esta acción no se puede deshacer.')) return;
    try {
      await deleteEntry(id, username);
      setEntries(prev => prev.filter(e => String(e.ID) !== String(id)));
    } catch (err: any) {
      alert('Error borrando: ' + (err.message || err));
    }
  }

  if (!username) return <div>Inicia sesión para ver tus registros</div>;

  return (
    <div>
      <h3>Tus Registros Recientes</h3>
      {loading && <div>Cargando...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && entries.length === 0 && <div>No hay registros recientes encontrados.</div>}
      <ul>
        {entries.map(entry => (
          <li key={entry.ID} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <div>
              <div><strong>{entry.Fecha}</strong></div>
              <div>{entry.Nombre} — {entry.Total_Horas} h</div>
              <div style={{ fontSize: 12, color: '#666' }}>{entry.Observaciones}</div>
            </div>
            <div>
              <button onClick={() => handleDelete(entry.ID)}>Borrar</button>
            </div>
          </li>
        ))}
      </ul>
      <button onClick={load}>Actualizar</button>
    </div>
  );
}
