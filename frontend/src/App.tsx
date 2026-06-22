import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Ventas from './pages/Ventas';
import HistorialVentas from './pages/HistorialVentas';
import Productos from './pages/Productos';
import Clientes from './pages/Clientes';
import Reportes from './pages/Reportes';
import Correo from './pages/Correo';
import Usuarios from './pages/Usuarios';

import './App.css';

const RoleProtectedRoute: React.FC<{ allowedRoles: string[] }> = ({ allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.rol)) {
    if (user.rol === 'vendedor') {
      return <Navigate to="/ventas" replace />;
    }
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

const RootRedirect: React.FC = () => {
  const { user } = useAuth();
  if (user?.rol === 'vendedor') {
    return <Navigate to="/ventas" replace />;
  }
  return <Dashboard />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected Administrative Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                {/* Everyone can access these but root '/' redirects vendedors to /ventas */}
                <Route path="/" element={<RootRedirect />} />
                <Route path="/ventas" element={<Ventas />} />
                <Route path="/historial" element={<HistorialVentas />} />
                <Route path="/clientes" element={<Clientes />} />

                {/* Supervisor & Admin only */}
                <Route element={<RoleProtectedRoute allowedRoles={['admin', 'supervisor']} />}>
                  <Route path="/productos" element={<Productos />} />
                  <Route path="/reportes" element={<Reportes />} />
                  <Route path="/correo" element={<Correo />} />
                </Route>

                {/* Admin only */}
                <Route element={<RoleProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/usuarios" element={<Usuarios />} />
                </Route>
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
