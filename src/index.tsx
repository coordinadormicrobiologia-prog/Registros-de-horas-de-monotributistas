import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './ErrorBoundary';

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
