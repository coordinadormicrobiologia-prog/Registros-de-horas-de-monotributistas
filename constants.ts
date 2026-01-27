
import { User } from './types';

// REEMPLAZA ESTA URL con la URL de tu Google Apps Script implementado como Aplicación Web
export const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby-YOUR-URL/exec';

export const EMPLOYEES: User[] = [
  { id: '1', username: 'daiana', name: 'Daiana', role: 'EMPLOYEE' },
  { id: '2', username: 'matilde', name: 'Matilde', role: 'EMPLOYEE' },
  { id: '3', username: 'yadia', name: 'Yadia', role: 'EMPLOYEE' },
  { id: '4', username: 'carla', name: 'Carla', role: 'EMPLOYEE' },
  { id: '5', username: 'paula', name: 'Paula', role: 'EMPLOYEE' },
  { id: '6', username: 'ernestina', name: 'Ernestina', role: 'EMPLOYEE' },
];

export const ADMINS: User[] = [
  { id: 'admin-1', username: 'miguel', name: 'Miguel', role: 'ADMIN' },
];

export const ALL_USERS = [...EMPLOYEES, ...ADMINS];

export const OBSERVATION_PLACEHOLDER = "horas extras, cobertura de guardia pasiva, reemplazo de personal de fin de semana, etc";
