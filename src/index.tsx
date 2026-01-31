import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App';
import ErrorBoundary from './ErrorBoundary';

// Defensive wrapper to catch third-party initialization failures
function safeInit() {
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      // Mejor mensaje para identificar rápidamente en logs de Vercel
      console.error("No se encontró el elemento '#root' para montar la app.");
      throw new Error("Could not find root element to mount to");
    }

    console.log('Iniciando montaje de la app — entorno:', process.env.NODE_ENV);

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  } catch (error) {
    // Log error to console for debugging
    console.error('Failed to initialize React app:', error);
    
    // Show a user-friendly error message
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; background: #f8fafc;">
          <div style="max-width: 500px; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h1 style="color: #dc2626; margin: 0 0 15px 0; font-size: 24px;">Error al iniciar la aplicación</h1>
            <p style="color: #64748b; line-height: 1.6; margin: 0 0 15px 0;">
              Ha ocurrido un error durante la inicialización. Por favor, recarga la página o contacta al administrador.
            </p>
            <button 
              onclick="window.location.reload()" 
              style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;"
            >
              Recargar Página
            </button>
            <details style="margin-top: 20px;">
              <summary style="cursor: pointer; color: #64748b; font-size: 14px;">Detalles técnicos</summary>
              <pre style="background: #f1f5f9; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 12px; margin-top: 10px;">${String(error)}</pre>
            </details>
          </div>
        </div>
      `;
    }
  }
}

// Call the safe initialization
safeInit();