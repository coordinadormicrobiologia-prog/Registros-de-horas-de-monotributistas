// constants.ts
export const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';
export const GOOGLE_SCRIPT_API_KEY = import.meta.env.VITE_GOOGLE_SCRIPT_API_KEY || '';
export const PROXY_PATH = '/api/proxy';

export const EMPLOYEES = [
  { id: '1', username: 'daiana', name: 'Daiana', role: 'EMPLOYEE' },
  { id: '2', username: 'matilde', name: 'Matilde', role: 'EMPLOYEE' },
  { id: '3', username: 'yadia', name: 'Yadia', role: 'EMPLOYEE' },
  { id: '4', username: 'carla', name: 'Carla', role: 'EMPLOYEE' },
  { id: '5', username: 'paula', name: 'Paula', role: 'EMPLOYEE' },
  { id: '6', username: 'ernestina', name: 'Ernestina', role: 'EMPLOYEE' },
];

export const ADMINS = [{ id: 'admin-1', username: 'miguel', name: 'Miguel', role: 'ADMIN' }];
export const ALL_USERS = [...EMPLOYEES, ...ADMINS];

export const OBSERVATION_PLACEHOLDER =
  "horas extras, cobertura de guardia pasiva, reemplazo de personal de fin de semana, etc";
