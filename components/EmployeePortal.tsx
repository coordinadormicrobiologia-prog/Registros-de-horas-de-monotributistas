
import React, { useState, useEffect } from 'react';
import { User, TimeLog, DayType } from '../types';
import { storageService } from '../services/storageService';
import { OBSERVATION_PLACEHOLDER } from '../constants';

interface EmployeePortalProps {
  user: User;
}

const EmployeePortal: React.FC<EmployeePortalProps> = ({ user }) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [entryTime, setEntryTime] = useState<string>('08:00');
  const [exitTime, setExitTime] = useState<string>('16:00');
  const [isHoliday, setIsHoliday] = useState<boolean>(false);
  const [observation, setObservation] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentLogs, setRecentLogs] = useState<TimeLog[]>([]);
  const [allMyLogs, setAllMyLogs] = useState<TimeLog[]>([]);
  const [showAll, setShowAll] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);

  const fetchRecentLogs = async () => {
    setIsRefreshing(true);
    const logs = await storageService.getAllLogs();
    const myLogs = logs
      .filter(l => l.employeeName === user.name)
      .sort((a, b) => b.date.localeCompare(a.date));
    setAllMyLogs(myLogs);
    setRecentLogs(myLogs.slice(0, 5));
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (!storageService.isConfigured()) {
      setMessage({ type: 'warning', text: 'Configuración pendiente: Falta la URL de Google Script en constants.ts' });
    }
    fetchRecentLogs();
  }, [user.name]);

  const calculateHours = () => {
    if (!entryTime || !exitTime) return 0;
    const [h1, m1] = entryTime.split(':').map(Number);
    const [h2, m2] = exitTime.split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60;
    return Number((diff / 60).toFixed(2));
  };

  const actualDayType = (selectedDate: string, holiday: boolean): DayType => {
    if (holiday) return 'Feriado';
    const d = new Date(selectedDate + 'T00:00:00');
    const day = d.getDay();
    return (day === 0 || day === 6) ? 'Fin de Semana' : 'Semana';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storageService.isConfigured()) {
      alert('Error: La URL de Google Sheets no ha sido configurada.');
      return;
    }
    
    setLoading(true);
    setMessage(null);

    const total = calculateHours();
    const dayType = actualDayType(date, isHoliday);

    const log: Omit<TimeLog, 'timestamp'> = {
      id: crypto.randomUUID(),
      date,
      employeeName: user.name,
      entryTime,
      exitTime,
      totalHours: total,
      dayType,
      isHoliday,
      observation
    };

    const success = await storageService.saveLog(log);

    if (success) {
      setMessage({ type: 'success', text: '¡Registro enviado! Actualizando lista...' });
      setObservation('');
      // Reintentar fetching después de 2 segundos para dar tiempo a Google Sheets
      setTimeout(fetchRecentLogs, 2500);
    } else {
      setMessage({ type: 'error', text: 'Error al enviar datos. Verifique su conexión.' });
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Deseas borrar este registro?')) return;
    
    setLoading(true);
    setMessage(null);
    const success = await storageService.deleteLog(id);
    if (success) {
      setRecentLogs(prev => prev.filter(l => l.id !== id));
      setAllMyLogs(prev => prev.filter(l => l.id !== id));
      setMessage({ type: 'success', text: 'Registro eliminado exitosamente.' });
      setTimeout(fetchRecentLogs, 2500);
    } else {
      setMessage({ type: 'error', text: 'No se pudo eliminar el registro.' });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Registrar Horas</h2>
          <p className="text-slate-500">Carga tu jornada laboral diaria</p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 animate-pulse ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
            message.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
            'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Fecha</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center mt-8 md:justify-center">
               <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={isHoliday} onChange={(e) => setIsHoliday(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                <span className="ml-3 text-sm font-semibold text-slate-700">¿Es Feriado?</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Ingreso</label>
              <input type="time" required value={entryTime} onChange={(e) => setEntryTime(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Egreso</label>
              <input type="time" required value={exitTime} onChange={(e) => setExitTime(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex justify-between items-center">
            <span className="text-blue-700 font-semibold text-xs uppercase tracking-wider">Total Calculado:</span>
            <span className="text-2xl font-bold text-blue-900">{calculateHours()} h</span>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Observaciones</label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder={OBSERVATION_PLACEHOLDER}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none min-h-[100px]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl text-white font-bold text-lg transition-all ${loading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? 'Enviando...' : 'Confirmar Registro'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Tus Registros</h3>
            <p className="text-xs text-slate-500">Puedes borrar una carga si cometiste un error</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowAll(!showAll)}
              className="px-4 py-2 text-sm font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
            >
              {showAll ? 'Mostrar Recientes' : 'Mostrar Todos'}
            </button>
            <button 
              onClick={fetchRecentLogs}
              disabled={isRefreshing}
              className={`p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-all ${isRefreshing ? 'animate-spin' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Horario</th>
                <th className="px-6 py-4 text-center">Horas</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Observaciones</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(showAll ? allMyLogs : recentLogs).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                    {new Date(log.date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{log.entryTime} - {log.exitTime}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-sm font-bold">{log.totalHours}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      log.dayType === 'Feriado' ? 'bg-red-100 text-red-700' :
                      log.dayType === 'Fin de Semana' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                    }`}>{log.dayType}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 italic truncate max-w-[200px]">{log.observation || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(log.id)}
                      disabled={loading}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Borrar Registro"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {!isRefreshing && (showAll ? allMyLogs : recentLogs).length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">No hay registros encontrados.</td>
                </tr>
              )}
              {isRefreshing && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-blue-400 italic">Buscando en la planilla...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeePortal;
