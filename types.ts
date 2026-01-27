
export type UserRole = 'ADMIN' | 'EMPLOYEE';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

export type DayType = 'Semana' | 'Fin de Semana' | 'Feriado';

export interface TimeLog {
  id: string;
  date: string;
  employeeName: string;
  entryTime: string;
  exitTime: string;
  totalHours: number;
  dayType: DayType;
  isHoliday: boolean;
  observation: string;
  timestamp: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
