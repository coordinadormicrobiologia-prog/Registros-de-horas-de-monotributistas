import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Safe initialization wrapper to avoid third-party init crashing the app
function safeInit() {
  try {
    // Si inicializas Sentry/analytics/otro, hazlo aquí dentro con guardas.
    // Ejemplo:
    // if (process.env.NODE_ENV === 'production') {
    //   try { Sentry.init({ dsn: ... }) } catch(e) { console.error('Sentry init failed', e); }
    // }
  } catch (err) {
    console.error('Init error (safeInit):', err);
  }
}
safeInit();

try {
  const container = document.getElementById('root');
  if (!container) throw new Error('Root container not found');
  const root = createRoot(container);
  root.render(<App />);
} catch (err) {
  console.error('Render error (hotfix):', err);
  document.body.innerHTML = '<div style="padding:24px">Ocurrió un error inicializando la aplicación. Intente recargar.</div>';
}
