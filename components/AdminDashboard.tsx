
import React, { useState, useEffect, useMemo } from 'react';
import { TimeLog, DayType } from '../types';
import { storageService } from '../services/storageService';
import { formatLogDateForDisplay } from '../src/utils/dateHelpers';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

const TYPE_COLORS = {
  'Semana': '#3b82f6',
  'Fin de Semana': '#f59e0b',
  'Feriado': '#ef4444'
};

const AdminDashboard: React.FC = () => {
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7));

  const fetchData = async () => {
    setLoading(true);
    const data = await storageService.getAllLogs();
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => log.date.startsWith(selectedMonth));
  }, [logs, selectedMonth]);

  const summaryData = useMemo(() => {
    const stats = {
      total: 0,
      semana: 0,
      finde: 0,
      feriado: 0,
      byEmployee: {} as Record<string, any>
    };

    filteredLogs.forEach(log => {
      stats.total += log.totalHours;
      if (log.dayType === 'Semana') stats.semana += log.totalHours;
      if (log.dayType === 'Fin de Semana') stats.finde += log.totalHours;
      if (log.dayType === 'Feriado') stats.feriado += log.totalHours;

      if (!stats.byEmployee[log.employeeName]) {
        stats.byEmployee[log.employeeName] = { 
          name: log.employeeName, 
          semana: 0, 
          finde: 0, 
          feriado: 0, 
          total: 0 
        };
      }
      stats.byEmployee[log.employeeName].total += log.totalHours;
      if (log.dayType === 'Semana') stats.byEmployee[log.employeeName].semana += log.totalHours;
      if (log.dayType === 'Fin de Semana') stats.byEmployee[log.employeeName].finde += log.totalHours;
      if (log.dayType === 'Feriado') stats.byEmployee[log.employeeName].feriado += log.totalHours;
    });

    return stats;
  }, [filteredLogs]);

  const chartData = Object.values(summaryData.byEmployee);
  const pieData = [
    { name: 'Semana', value: summaryData.semana },
    { name: 'Fin de Semana', value: summaryData.finde },
    { name: 'Feriado', value: summaryData.feriado }
  ].filter(d => d.value > 0);

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Confirmas que deseas eliminar este registro permanentemente?')) return;
    
    const success = await storageService.deleteLog(id, 'ADMIN');
    if (success) {
      setLogs(prev => prev.filter(l => l.id !== id));
      // Pequeño delay para que el script de Google procese la fila antes del refresh
      setTimeout(fetchData, 1000);
    } else {
      alert('Error al intentar borrar el registro.');
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-slate-500 font-medium">Cargando reportes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Panel de Control</h2>
          <p className="text-slate-500">Resumen de facturación y horas cargadas</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchData} 
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Actualizar Datos"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-700">Período:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-semibold text-slate-500 uppercase">Total Horas</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{summaryData.total.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-semibold text-blue-500 uppercase">Días Semana</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{summaryData.semana.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-semibold text-amber-500 uppercase">Fines de Semana</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{summaryData.finde.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-semibold text-red-500 uppercase">Feriados</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{summaryData.feriado.toFixed(2)}</p>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">Registros Detallados</h3>
          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
            {filteredLogs.length} Entradas
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Horario</th>
                <th className="px-6 py-4 text-center">Horas</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Observaciones</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.sort((a,b) => b.date.localeCompare(a.date)).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                    {formatLogDateForDisplay(log.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700 font-semibold">{log.employeeName}</td>
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
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Borrar Registro"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
