
import { TimeLog } from '../types';
import { GOOGLE_SCRIPT_URL } from '../constants';

export const storageService = {
  isConfigured(): boolean {
    // Fix: Explicitly cast GOOGLE_SCRIPT_URL to string to resolve the "types have no overlap" comparison error.
    // This happens because TS narrows the constant to its literal value, preventing comparison with other literals.
    return (GOOGLE_SCRIPT_URL as string) !== '' && !GOOGLE_SCRIPT_URL.includes('YOUR-URL');
  },

  async saveLog(log: Omit<TimeLog, 'timestamp'>): Promise<boolean> {
    if (!this.isConfigured()) {
      console.error('URL de Google Script no configurada en constants.ts');
      return false;
    }
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...log, action: 'create' }),
      });
      return true;
    } catch (error) {
      console.error('Error saving to Google Sheets:', error);
      return false;
    }
  },

  async deleteLog(id: string): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, action: 'delete' }),
      });
      return true;
    } catch (error) {
      console.error('Error deleting from Google Sheets:', error);
      return false;
    }
  },

  async getAllLogs(): Promise<TimeLog[]> {
    if (!this.isConfigured()) return [];
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL);
      const data = await response.json();
      
      if (!Array.isArray(data)) return [];

      return data.map((item: any) => ({
        id: item.ID || item.id || item.ID_Registro,
        date: item.Fecha,
        employeeName: item.Nombre || item.Nombre_Empleada,
        entryTime: item.Ingreso || item.Hora_Ingreso,
        exitTime: item.Egreso || item.Hora_Egreso,
        totalHours: Number(item.Total_Horas || 0),
        dayType: item.Tipo_Dia,
        isHoliday: item.Feriado === 'SÍ' || item.Feriado_Si_No === 'SÍ',
        observation: item.Observaciones || item.observation,
        timestamp: item.Fecha_Carga || item.timestamp
      }));
    } catch (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
  }
};
