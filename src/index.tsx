
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../App';
import ErrorBoundary from './ErrorBoundary';

console.log('Iniciando montaje de la app — entorno:', process.env.NODE_ENV);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
