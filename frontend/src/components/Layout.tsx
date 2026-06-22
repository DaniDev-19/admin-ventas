import React, { useEffect, useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { tasasService } from '../api/tasasService';
import {
  LayoutDashboard,
  ShoppingBag,
  Clock,
  Users,
  TrendingUp,
  FileText,
  LogOut,
  User as UserIcon,
  DollarSign,
  Menu,
  X,
  RefreshCw,
  Mail
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useNotification();
  const location = useLocation();
  const [tasaBcv, setTasaBcv] = useState<number | null>(null);
  const [tasaParalelo, setTasaParalelo] = useState<number | null>(null);
  const [tasaBcvAnterior, setTasaBcvAnterior] = useState<number | null>(null);
  const [tasaParaleloAnterior, setTasaParaleloAnterior] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchTasa = async () => {
    try {
      const res = await tasasService.getLatest();
      if (res && res.data) {
        setTasaBcv(Number(res.data.tasa_usd));
        if (res.data.tasa_paralelo) {
          setTasaParalelo(Number(res.data.tasa_paralelo));
        }
      }
    } catch (err) {
      console.error('Error fetching exchange rate:', err);
    }
  };

  useEffect(() => {
    fetchTasa();
    const interval = setInterval(fetchTasa, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (tasaBcv) setTasaBcvAnterior(tasaBcv);
      if (tasaParalelo) setTasaParaleloAnterior(tasaParalelo);
      await tasasService.refresh();
      const res = await tasasService.getLatest();
      if (res && res.data) {
        setTasaBcv(Number(res.data.tasa_usd));
        if (res.data.tasa_paralelo) {
          setTasaParalelo(Number(res.data.tasa_paralelo));
        }
        showToast('Tasas de cambio actualizadas correctamente', 'success');
      }
    } catch (err: any) {
      console.error('Error refreshing exchange rates:', err);
      showToast('Error al refrescar las tasas de cambio', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const navItems = [
    ...(user?.rol === 'admin' || user?.rol === 'supervisor' ? [{ label: 'Dashboard', path: '/', icon: LayoutDashboard }] : []),
    { label: 'Nueva Venta (POS)', path: '/ventas', icon: ShoppingBag },
    { label: 'Historial Ventas', path: '/historial', icon: Clock },
    ...(user?.rol === 'admin' || user?.rol === 'supervisor' ? [{ label: 'Productos', path: '/productos', icon: TrendingUp }] : []),
    { label: 'Clientes', path: '/clientes', icon: Users },
    ...(user?.rol === 'admin' || user?.rol === 'supervisor' ? [{ label: 'Reportes y BI', path: '/reportes', icon: FileText }] : []),
    ...(user?.rol === 'admin' || user?.rol === 'supervisor' ? [{ label: 'Correo Informativo', path: '/correo', icon: Mail }] : []),
    ...(user?.rol === 'admin' ? [{ label: 'Gestión Usuarios', path: '/usuarios', icon: UserIcon }] : []),
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar Backdrop for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar for Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 glass-panel border-r border-slate-850 flex flex-col transform transition-transform duration-300 md:translate-x-0 md:static ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            {/* <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-emerald-500/20">
              S
            </div> */}
            <span className="font-outfit text-xl font-bold tracking-tight bg-gradient-to-r from-slate-50 to-slate-200 bg-clip-text text-transparent">
              {import.meta.env.VITE_NAME_BUSSINE || 'Single Sales'}
            </span>
          </div>
          <button className="md:hidden text-slate-400 hover:text-slate-200" onClick={() => setIsSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Profile Card / Footer */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-900/20">
          <div className="flex items-center gap-3 px-2 py-3 rounded-lg">
            <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <UserIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{user?.nombre || user?.username}</p>
              <p className="text-xs text-slate-500 capitalize truncate">{user?.rol || 'Administrador'}</p>
            </div>
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Side */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-screen">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-900 bg-slate-950/60 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-slate-400 hover:text-slate-200 cursor-pointer" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="font-outfit text-lg font-semibold text-slate-200 hidden sm:block">
              {navItems.find((n) => n.path === location.pathname)?.label || 'Panel'}
            </h1>
          </div>

          {/* Widgets / Exchange Rate */}
          <div className="flex items-center gap-2 sm:gap-4">
            {tasaBcv !== null && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 shadow-sm text-emerald-400 text-xs sm:text-sm font-semibold">
                <DollarSign className="h-3.5 w-3.5" />
                <span>Oficial: Bs. {tasaBcv.toFixed(2)}</span>
              </div>
            )}

            {tasaParalelo !== null && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/5 border border-teal-500/10 shadow-sm text-teal-400 text-xs sm:text-sm font-semibold">
                <DollarSign className="h-3.5 w-3.5" />
                <span>Paralelo: Bs. {tasaParalelo.toFixed(2)}</span>
              </div>
            )}

            {(tasaBcvAnterior !== null || tasaParaleloAnterior !== null) && (
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-450 text-xs font-medium">
                <span>Tasa anterior:</span>
                {tasaBcvAnterior !== null && (
                  <span className="font-mono text-slate-400">Ofi. Bs. {tasaBcvAnterior.toFixed(2)}</span>
                )}
                {tasaBcvAnterior !== null && tasaParaleloAnterior !== null && <span className="text-slate-700">|</span>}
                {tasaParaleloAnterior !== null && (
                  <span className="font-mono text-slate-400">Para. Bs. {tasaParaleloAnterior.toFixed(2)}</span>
                )}
              </div>
            )}

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-450 hover:text-emerald-400 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center"
              title="Actualizar tasas de cambio"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <div className="h-8 w-[1px] bg-slate-900 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">Servidor Activo</span>
            </div>
          </div>
        </header>

        {/* Content Page Container */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950/20">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
