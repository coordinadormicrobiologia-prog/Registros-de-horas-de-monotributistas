
import React, { useState, useEffect } from 'react';
import { AuthState, User } from './types';
import { ALL_USERS } from './constants';
import Layout from './components/Layout';
import EmployeePortal from './components/EmployeePortal';
import AdminDashboard from './components/AdminDashboard';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('auth_britlab');
    return saved ? JSON.parse(saved) : { user: null, isAuthenticated: false };
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem('auth_britlab', JSON.stringify(auth));
  }, [auth]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const foundUser = ALL_USERS.find(
      u => u.username.toLowerCase() === username.toLowerCase()
    );

    // Password rule: name123 (lowercase)
    const expectedPassword = foundUser ? `${foundUser.username.toLowerCase()}123` : '';

    if (foundUser && password === expectedPassword) {
      setAuth({ user: foundUser, isAuthenticated: true });
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  const handleLogout = () => {
    setAuth({ user: null, isAuthenticated: false });
    setUsername('');
    setPassword('');
  };

  if (!auth.isAuthenticated) {
    return (
      <Layout auth={auth} onLogout={handleLogout}>
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-10">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold text-slate-800 leading-tight">
              Registro de horas para facturación-Microbiologia
            </h1>
            <p className="text-slate-600 font-semibold mt-2">
              BritLab-Sanatorio Británico
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Usuario</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-lg"
                placeholder="Nombre de usuario"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-lg"
                placeholder="********"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl shadow-lg shadow-blue-200 transition-all transform active:scale-[0.98]"
            >
              Iniciar Sesión
            </button>
          </form>
          
          <div className="mt-8 text-center border-t border-slate-50 pt-6">
            <p className="text-xs text-slate-400">
              Uso exclusivo para personal autorizado
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout auth={auth} onLogout={handleLogout}>
      {auth.user?.role === 'ADMIN' ? (
        <AdminDashboard />
      ) : (
        <EmployeePortal user={auth.user!} />
      )}
    </Layout>
  );
};

export default App;
