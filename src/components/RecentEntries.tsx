import React, { useEffect, useState } from 'react';
import { fetchEntriesFor, deleteEntry } from '../services/api';

export default function RecentEntries({ username }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEntriesFor(username);
      setEntries(data);
    } catch (err) {
      console.error('load entries error', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (username) load();
  }, [username]);

  async function handleDelete(id) {
    if (!confirm('¿Borrar registro? Esta acción no se puede deshacer.')) return;
    try {
      await deleteEntry(id, username);
      // actualizar UI localmente
      setEntries(prev => prev.filter(e => String(e.id) !== String(id)));
    } catch (err) {
      alert('Error borrando: ' + (err.message || err));
    }
  }

  if (!username) return <div>Inicia sesión para ver tus registros</div>;

  return (
    <div>
      <h3>Tus Registros Recientes</h3>
      {loading && <p>Cargando...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && entries.length === 0 && <p>No hay registros recientes encontrados.</p>}
      <ul>
        {entries.map(e => (
          <li key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <div>
              <div><strong>{e.date || e.fecha || ''}</strong></div>
              <div>{e.employeeName || e.requesterName || ''} — {e.hours || ''} h</div>
            </div>
            <div>
              <button onClick={() => handleDelete(e.id)}>Borrar</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
