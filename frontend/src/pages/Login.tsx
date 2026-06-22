import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Lock, User, Sparkles, UserPlus, LogIn } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, registerUser } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        await registerUser(username, password, nombre);
        showToast('¡Registro administrativo exitoso! Inicie sesión ahora.', 'success');
        setIsRegister(false);
        setPassword('');
      } else {
        await login(username, password);
        showToast('¡Sesión iniciada correctamente!', 'success');
        navigate('/');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Ocurrió un error inesperado al procesar la solicitud';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel rounded-2xl p-8 relative z-10 shadow-emerald-500/5">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          {/* <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center font-bold text-slate-950 text-xl shadow-xl shadow-emerald-500/20 mb-3 animate-pulse">
            S
          </div> */}
          <h2 className="font-outfit text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            {import.meta.env.VITE_NAME_BUSSINE || 'Single Sales'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isRegister ? 'Crea una cuenta administrativa' : 'Ingresa tus credenciales administrativas'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-950/80 p-1.5 rounded-xl border border-slate-900 mb-6">
          <button
            type="button"
            disabled={loading}
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer disabled:opacity-50 ${
              !isRegister ? 'bg-slate-900 border border-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer disabled:opacity-50 ${
              isRegister ? 'bg-slate-900 border border-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Registrar Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Nombre Completo</label>
              <div className="relative">
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  required
                  disabled={loading}
                  placeholder="ej. Daniel Rodríguez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full pl-10 glass-input disabled:opacity-50"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Usuario</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              <input
                type="text"
                required
                disabled={loading}
                placeholder="ej. admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 glass-input disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              <input
                type="password"
                required
                disabled={loading}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 glass-input disabled:opacity-50"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full btn-primary mt-6 disabled:opacity-55 disabled:cursor-not-allowed">
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></div>
            ) : isRegister ? (
              <>
                <UserPlus className="h-5 w-5" />
                <span>Crear Cuenta</span>
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                <span>Ingresar al Sistema</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
