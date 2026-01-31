import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App';
import ErrorBoundary from './ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  // Mejor mensaje para identificar rápidamente en logs de Vercel
  console.error("No se encontró el elemento '#root' para montar la app.");
  throw new Error("Could not find root element to mount to");
}

console.log('Iniciando montaje de la app — entorno:', process.env.NODE_ENV);

// Defensive initialization wrapper to prevent third-party initialization errors
function safeInit() {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Error durante la inicialización de la app:', error);
    // Fallback: show error message directly in DOM
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: #f8fafc;">
          <div style="max-width: 600px; background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="color: #dc2626; font-size: 20px; font-weight: bold; margin-bottom: 8px;">Error al inicializar la aplicación</h2>
            <p style="color: #64748b; margin-bottom: 16px;">Ocurrió un error al cargar la aplicación. Por favor, intenta recargar la página.</p>
            <details style="font-size: 12px; color: #94a3b8; margin-bottom: 16px;">
              <summary style="cursor: pointer;">Detalles del error</summary>
              <pre style="margin-top: 8px; padding: 8px; background: #f1f5f9; border-radius: 4px; overflow-x: auto;">${error instanceof Error ? error.message : String(error)}</pre>
            </details>
            <button onclick="window.location.reload()" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
              Recargar página
            </button>
          </div>
        </div>
      `;
    }
  }
}

safeInit();