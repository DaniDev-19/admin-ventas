import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { usuariosService } from '../api/usuariosService';
import type { Usuario } from '../api/usuariosService';
import {
  Users,
  UserPlus,
  Shield,
  Edit2,
  Trash2,
  Search,
  Lock,
  User,
  X,
  Loader2,
  AlertTriangle,
  UserCheck,
  UserX
} from 'lucide-react';

export const Usuarios: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useNotification();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('vendedor');
  const [status, setStatus] = useState('activo');
  const [submitting, setSubmitting] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Usuario | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const data = await usuariosService.getAll();
      setUsuarios(data);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      const msg = error.response?.data?.message || 'Error al obtener la lista de usuarios';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setNombre('');
    setRol('vendedor');
    setStatus('activo');
    setIsModalOpen(true);
  };

  const openEditModal = (user: Usuario) => {
    setEditingUser(user);
    setUsername(user.username);
    setPassword(''); 
    setNombre(user.nombre || '');
    setRol(user.rol);
    setStatus(user.status || 'activo');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !rol || !status) {
      showToast('Por favor, rellene los campos obligatorios.', 'info');
      return;
    }

    if (!editingUser && !password) {
      showToast('La contraseña es obligatoria para nuevos usuarios.', 'info');
      return;
    }

    if (password && password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres.', 'info');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        username: username.trim(),
        nombre: nombre.trim() || null,
        rol,
        status,
        ...(password ? { password } : {})
      };

      if (editingUser) {
        await usuariosService.update(editingUser.id, payload);
        showToast('Usuario actualizado correctamente', 'success');
      } else {
        await usuariosService.create(payload);
        showToast('Usuario creado correctamente', 'success');
      }

      setIsModalOpen(false);
      fetchUsuarios();
    } catch (error: any) {
      console.error('Error saving user:', error);
      const msg = error.response?.data?.message || 'Error al guardar el usuario';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (user: Usuario) => {
    if (currentUser?.id === user.id) {
      showToast('No puedes eliminar tu propia cuenta de usuario activa.', 'info');
      return;
    }
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await usuariosService.delete(userToDelete.id);
      showToast('Usuario eliminado correctamente', 'success');
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      fetchUsuarios();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      const msg = error.response?.data?.message || 'Error al eliminar el usuario';
      showToast(msg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const toggleUserStatus = async (u: Usuario) => {
    if (currentUser?.id === u.id) {
      showToast('No puedes inhabilitar tu propia cuenta activa.', 'info');
      return;
    }
    try {
      const newStatus = u.status === 'activo' ? 'inactivo' : 'activo';
      await usuariosService.update(u.id, {
        username: u.username,
        rol: u.rol,
        status: newStatus
      });
      showToast(`Usuario ${newStatus === 'activo' ? 'habilitado' : 'inhabilitado'} correctamente`, 'success');
      fetchUsuarios();
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      const msg = error.response?.data?.message || 'Error al actualizar el estado del usuario';
      showToast(msg, 'error');
    }
  };

  const filteredUsuarios = usuarios.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.nombre && u.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-outfit text-3xl font-extrabold tracking-tight">Gestión de Usuarios</h2>
          <p className="text-sm text-slate-400 mt-1">
            Administra los accesos, contraseñas y roles del sistema.
          </p>
        </div>

        {currentUser?.rol === 'admin' && (
          <button
            onClick={openCreateModal}
            className="btn-primary py-2.5 px-5 flex items-center gap-2 font-semibold text-xs rounded-xl cursor-pointer shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            <span>Agregar Usuario</span>
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por usuario o nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 glass-input"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-450" />
            <span className="text-sm text-slate-400">Cargando usuarios...</span>
          </div>
        ) : filteredUsuarios.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Users className="h-12 w-12 mx-auto stroke-[1.5] mb-3 text-slate-650" />
            <p className="font-medium text-sm">No se encontraron usuarios registrados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pl-4">Usuario</th>
                  <th className="pb-3">Nombre Completo</th>
                  <th className="pb-3">Rol</th>
                  <th className="pb-3">Estado</th>
                  <th className="pb-3">Fecha Registro</th>
                  {currentUser?.rol === 'admin' && <th className="pb-3 pr-4 text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-sm">
                {filteredUsuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-4 pl-4 font-semibold text-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
                          <User className="h-4 w-4 text-slate-400" />
                        </div>
                        <span>{u.username}</span>
                      </div>
                    </td>
                    <td className="py-4 text-slate-350">{u.nombre || '—'}</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        u.rol === 'admin'
                          ? 'bg-emerald-550/10 text-emerald-400 border-emerald-500/25'
                          : u.rol === 'supervisor'
                          ? 'bg-amber-550/10 text-amber-400 border-amber-500/25'
                          : 'bg-violet-550/10 text-violet-400 border-violet-500/25'
                      }`}>
                        {u.rol === 'admin' ? 'Administrador' : u.rol === 'supervisor' ? 'Supervisor' : 'Vendedor / Caja'}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        u.status === 'activo'
                          ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-450 border-rose-500/20'
                      }`}>
                        {u.status === 'activo' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-4 text-slate-450">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('es-VE') : '—'}
                    </td>
                    {currentUser?.rol === 'admin' && (
                      <td className="py-4 pr-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleUserStatus(u)}
                            disabled={currentUser?.id === u.id}
                            title={u.status === 'activo' ? 'Inhabilitar usuario' : 'Habilitar usuario'}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              currentUser?.id === u.id
                                ? 'opacity-30 cursor-not-allowed text-slate-650'
                                : u.status === 'activo'
                                ? 'hover:bg-rose-500/10 text-rose-450'
                                : 'hover:bg-emerald-500/10 text-emerald-450'
                            }`}
                          >
                            {u.status === 'activo' ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => openEditModal(u)}
                            title="Editar usuario"
                            className="p-1.5 hover:bg-slate-800/80 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(u)}
                            title="Eliminar usuario"
                            disabled={currentUser?.id === u.id}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              currentUser?.id === u.id
                                ? 'opacity-30 cursor-not-allowed text-slate-650'
                                : 'hover:bg-rose-500/10 text-slate-400 hover:text-rose-450'
                            }`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-scale-up text-slate-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-outfit text-xl font-bold flex items-center gap-2 border-b border-slate-900 pb-3 mb-5">
              <Shield className="h-5 w-5 text-emerald-450" />
              {editingUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="ej. Jesús Perdomo"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 glass-input"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Nombre de Usuario (Login) *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="ej. jesus_dev"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 glass-input"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Contraseña {editingUser ? '(dejar en blanco para mantener)' : '*'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required={!editingUser}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 glass-input"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Rol de Acceso *</label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  disabled={editingUser?.id === currentUser?.id}
                  className="w-full glass-input cursor-pointer py-2 text-slate-355 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="admin" className="bg-slate-950 text-slate-200">Administrador (Acceso total)</option>
                  <option value="supervisor" className="bg-slate-950 text-slate-200">Supervisor (Control operativo y reportes)</option>
                  <option value="vendedor" className="bg-slate-950 text-slate-200">Vendedor / Caja (Ventas y clientes)</option>
                </select>
                {editingUser?.id === currentUser?.id && (
                  <span className="text-[10px] text-slate-500">No puedes cambiar tu propio rol de administrador</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Estado de Cuenta *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={editingUser?.id === currentUser?.id}
                  className="w-full glass-input cursor-pointer py-2 text-slate-355 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="activo" className="bg-slate-950 text-slate-200">Activo (Habilitado)</option>
                  <option value="inactivo" className="bg-slate-950 text-slate-200">Inactivo (Inhabilitado)</option>
                </select>
                {editingUser?.id === currentUser?.id && (
                  <span className="text-[10px] text-slate-500">No puedes inhabilitar tu propia cuenta activa</span>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-900 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-900 text-slate-400 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-2 px-5 font-semibold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-950" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Cambios</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative animate-scale-up text-slate-200">
            <div className="flex items-center gap-3 text-rose-500 mb-4 pb-2 border-b border-slate-900">
              <AlertTriangle className="h-6 w-6 stroke-[2]" />
              <h3 className="font-outfit text-lg font-bold">¿Confirmar Eliminación?</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              ¿Estás seguro de que deseas eliminar al usuario <strong className="text-slate-200">@{userToDelete.username}</strong> ({userToDelete.nombre || 'Sin nombre completo'})?
              Esta acción no se puede deshacer y revocará inmediatamente su acceso al sistema administrativo.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-900 text-slate-400 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="bg-rose-500 hover:bg-rose-600 text-slate-950 font-bold text-xs py-2 px-5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-950" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <span>Eliminar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
