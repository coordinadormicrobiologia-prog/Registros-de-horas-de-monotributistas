// src/constants.ts
// Lee las variables de entorno inyectadas por Vite durante el build.
// Si prefieres, puedes reemplazar las cadenas por la URL y la API key directamente.

export const GOOGLE_SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';
export const GOOGLE_SCRIPT_API_KEY = import.meta.env.VITE_GOOGLE_SCRIPT_API_KEY || '';

// Si tu front usa el proxy (recomendado), puedes dejar PROXY_PATH tal cual:
export const PROXY_PATH = '/api/proxy';
