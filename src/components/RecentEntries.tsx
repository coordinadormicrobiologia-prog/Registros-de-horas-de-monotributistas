import React, { useState, useEffect } from 'react';
import { TimeLog } from '../../types';
import { storageService } from '../../services/storageService';

interface RecentEntriesProps {
  username: string;
}

const RecentEntries: React.FC<RecentEntriesProps> = ({ username }) => {
  const [entries, setEntries] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const data = await storageService.getEntriesFor(username);
      // Sort by date descending and limit to recent entries
      const sortedData = data
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 10);
      setEntries(sortedData);
    } catch (err) {
      console.error('Error fetching entries:', err);
      setError('No se pudieron cargar los registros');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (username) {
      fetchEntries();
    }
  }, [username]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Deseas borrar este registro?')) return;

    setLoading(true);
    setError(null);
    try {
      await storageService.deleteEntry(id, username);
      // Update UI immediately after successful delete
      setEntries(prev => prev.filter(entry => entry.id !== id));
      // Optionally refresh to ensure consistency
      setTimeout(fetchEntries, 1000);
    } catch (err) {
      console.error('Error deleting entry:', err);
      setError('No se pudo eliminar el registro. Verifica que seas el propietario.');
    } finally {
      setLoading(false);
    }
  };

  if (!username) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
        <p className="text-slate-500">Inicia sesión para ver tus registros</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div className="p-6 border-b flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Tus Registros Recientes</h3>
          <p className="text-xs text-slate-500">Solo puedes eliminar tus propios registros</p>
        </div>
        <button
          onClick={fetchEntries}
          disabled={isRefreshing}
          className={`p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-all ${
            isRefreshing ? 'animate-spin' : ''
          }`}
          title="Refrescar lista"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border-b border-red-100">
          <p className="font-medium text-sm">⚠️ {error}</p>
        </div>
      )}

      <div className="divide-y">
        {entries.map(entry => (
          <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div className="flex-1">
              <p className="font-bold text-slate-700">
                {new Date(entry.date + 'T12:00:00').toLocaleDateString('es-AR')}
              </p>
              <p className="text-xs text-slate-500">
                {entry.entryTime} a {entry.exitTime} — {entry.totalHours}h ({entry.dayType})
              </p>
              {entry.observation && (
                <p className="text-xs text-slate-600 mt-1 italic">{entry.observation}</p>
              )}
            </div>
            <button
              onClick={() => handleDelete(entry.id)}
              disabled={loading}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Borrar Registro"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}

        {!isRefreshing && entries.length === 0 && (
          <div className="p-8 text-center text-slate-400 italic">
            No hay registros recientes encontrados.
          </div>
        )}

        {isRefreshing && (
          <div className="p-8 text-center text-blue-400 italic">
            Buscando en la planilla...
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentEntries;
