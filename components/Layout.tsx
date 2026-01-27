
import React from 'react';
import { User, AuthState } from '../types';

interface LayoutProps {
  auth: AuthState;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ auth, onLogout, children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navigation Header - Only visible when logged in */}
      {auth.isAuthenticated && (
        <header className="bg-white border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-xl text-slate-800 tracking-tight">Registro de Horas</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{auth.user?.name}</p>
                <p className="text-xs text-slate-500">{auth.user?.role === 'ADMIN' ? 'Administrador' : 'Personal'}</p>
              </div>
              <button
                onClick={onLogout}
                className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`flex-grow ${!auth.isAuthenticated ? 'flex items-center justify-center p-4' : 'max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8'}`}>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">
            Microbiología - Sanatorio Británico
          </p>
          <p className="text-xs text-slate-400 mt-1">
            © {new Date().getFullYear()} Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
