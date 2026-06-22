import React, { useEffect, useState } from 'react';
import { clientesService } from '../api/clientesService';
import { useNotification } from '../context/NotificationContext';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Phone,
  CreditCard,
  User,
  Loader2,
  Eye,
  Info,
  ChevronLeft,
  ChevronRight,
  Mail
} from 'lucide-react';

interface Cliente {
  id: number;
  nombre: string;
  cedula: string;
  telefono: string | null;
  email: string | null;
  status: string;
}

export const Clientes: React.FC = () => {
  const { showToast } = useNotification();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Deletion Confirm Modal States
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);

  // Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('active');

  // Detail Modal State (Details by ID)
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailClient, setDetailClient] = useState<Cliente | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchClientes = async () => {
    setIsTableLoading(true);
    try {
      const data = await clientesService.getAll({
        page,
        limit: 10,
        search: search || undefined
      });
      if (data) {
        setClientes(data.items);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
      showToast('Error al cargar la lista de clientes', 'error');
    } finally {
      setIsTableLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, [page, search]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setNombre('');
    setCedula('');
    setTelefono('');
    setEmail('');
    setStatus('activo');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Cliente) => {
    setModalMode('edit');
    setSelectedId(c.id);
    setNombre(c.nombre);
    setCedula(c.cedula);
    setTelefono(c.telefono || '');
    setEmail(c.email || '');
    setStatus(c.status);
    setIsModalOpen(true);
  };

  const handleWhatsAppClick = (telefono: string | null, nombre: string) => {
    if (!telefono) return;
    const cleaned = telefono.replace(/[^\d+]/g, '');
    let formatted = cleaned;
    if (!formatted.startsWith('+')) {
      if (formatted.startsWith('0')) {
        formatted = '58' + formatted.substring(1);
      } else if (!formatted.startsWith('58')) {
        formatted = '58' + formatted;
      }
    } else {
      formatted = formatted.substring(1);
    }
    const bizName = import.meta.env.VITE_NAME_BUSSINE || 'Single Sales';
    const text = encodeURIComponent(`Hola ${nombre}, te saludamos de ${bizName}.`);
    const url = `https://wa.me/${formatted}?text=${text}`;
    window.open(url, '_blank');
  };

  // Ver detalles por ID (details by ID request)
  const handleOpenDetail = async (id: number) => {
    setLoadingDetail(true);
    setIsDetailOpen(true);
    try {
      const data = await clientesService.getById(id);
      setDetailClient(data);
    } catch (err) {
      console.error('Error fetching client details:', err);
      showToast('No se pudieron obtener los detalles del cliente.', 'error');
      setIsDetailOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      nombre,
      cedula,
      telefono: telefono || null,
      email: email || null,
      status
    };

    try {
      if (modalMode === 'create') {
        await clientesService.create(payload);
        showToast('Cliente registrado exitosamente', 'success');
      } else {
        if (selectedId === null) return;
        await clientesService.update(selectedId, payload);
        showToast('Cliente actualizado exitosamente', 'success');
      }
      setIsModalOpen(false);
      fetchClientes();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al guardar el cliente';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setClientToDelete(id);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (clientToDelete === null) return;
    setDeletingId(clientToDelete);
    try {
      await clientesService.delete(clientToDelete);
      showToast('Cliente eliminado exitosamente', 'success');
      fetchClientes();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'No se pudo eliminar el cliente';
      if (msg.includes('foreign key') || msg.includes('restricción')) {
        showToast('No se puede eliminar el cliente porque posee ventas asociadas (Historial Comercial Protegido).', 'error');
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setDeletingId(null);
      setClientToDelete(null);
      setIsConfirmDeleteOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="font-outfit text-3xl font-extrabold tracking-tight">Directorio de Clientes</h2>
          <p className="text-sm text-slate-400 mt-1">Gestión de clientes y deudores registrados en el sistema.</p>
        </div>
        <button onClick={handleOpenCreate} className="btn-primary">
          <Plus className="h-5 w-5" />
          <span>Agregar Cliente</span>
        </button>
      </div>

      {/* Search and Table */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o cédula..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 glass-input"
          />
        </div>

        <div className="overflow-x-auto">
          {isTableLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-800 border-t-emerald-500"></div>
            </div>
          ) : clientes.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users className="h-12 w-12 mx-auto mb-3 stroke-[1.5]" />
              <p className="text-sm">No se encontraron clientes</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="pb-3">Cédula</th>
                  <th className="pb-3">Nombre</th>
                  <th className="pb-3">Teléfono</th>
                  <th className="pb-3">Correo</th>
                  <th className="pb-3">Estado</th>
                  <th className="pb-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {clientes.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/10">
                    <td className="py-3.5 font-semibold text-slate-300">{c.cedula}</td>
                    <td className="py-3.5 text-slate-200">{c.nombre}</td>
                    <td className="py-3.5 text-slate-400">{c.telefono || 'Sin Teléfono'}</td>
                    <td className="py-3.5 text-slate-400 truncate max-w-[160px]" title={c.email || ''}>{c.email || 'Sin Correo'}</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        c.status === 'activo' || c.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                          : c.status === 'deudor'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                          : c.status === 'pago_parcial'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                          : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                      }`}>
                        {c.status === 'activo' || c.status === 'active'
                          ? 'Activo / Solvente'
                          : c.status === 'deudor'
                          ? 'Deudor / Debe'
                          : c.status === 'pago_parcial'
                          ? 'Pago Parcial'
                          : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleWhatsAppClick(c.telefono, c.nombre)}
                        disabled={!c.telefono || deletingId !== null}
                        title={c.telefono ? "Enviar WhatsApp" : "Sin teléfono registrado"}
                        className={`p-1.5 rounded transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center justify-center ${
                          c.telefono
                            ? 'text-emerald-450 hover:text-emerald-400 hover:bg-slate-800'
                            : 'text-slate-650'
                        }`}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.59-4.846c1.6.95 3.488 1.459 5.407 1.46h.007c5.541 0 10.05-4.515 10.054-10.058.002-2.685-1.043-5.21-2.943-7.114-1.9-1.904-4.425-2.953-7.11-2.954-5.547 0-10.056 4.515-10.06 10.059-.001 1.936.5 3.815 1.45 5.485L4.43 20.358l3.217-.804zm8.683-5.467c-.247-.123-1.463-.72-1.689-.803-.226-.082-.39-.123-.554.123-.164.246-.636.802-.78.966-.143.164-.287.185-.534.062-.247-.123-1.042-.383-1.986-1.223-.733-.655-1.229-1.464-1.373-1.71-.143-.246-.015-.38.108-.502.112-.11.247-.287.37-.43.123-.144.164-.246.247-.41.082-.164.04-.308-.02-.43-.06-.123-.554-1.336-.76-1.833-.2-.486-.4-.421-.553-.428-.143-.006-.308-.007-.473-.007s-.43.062-.656.309c-.226.246-.862.842-.862 2.051s.882 2.378 1.005 2.542c.123.164 1.734 2.647 4.2 3.71.586.253 1.043.404 1.4.517.589.187 1.125.16 1.549.097.472-.07 1.463-.598 1.669-1.176.206-.578.206-1.072.144-1.176-.062-.104-.226-.164-.473-.287z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleOpenDetail(c.id)}
                        disabled={deletingId !== null}
                        title="Ver Ficha"
                        className="p-1.5 text-slate-450 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(c)}
                        disabled={deletingId !== null}
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(c.id)}
                        disabled={deletingId !== null}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center justify-center"
                      >
                        {deletingId === c.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {total > 10 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-850">
            <span className="text-xs text-slate-500">
              Mostrando {clientes.length} de {total} clientes — Pág. {page} de {Math.ceil(total / 10)}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1 || isTableLoading}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </button>
              <button
                disabled={page * 10 >= total || isTableLoading}
                onClick={() => setPage(p => p + 1)}
                className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
              >
                Siguiente
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal (Details by ID) */}
      {isDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 space-y-6 animate-scale-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-outfit text-xl font-bold flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-400" />
                Ficha del Cliente
              </h3>
              <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
              </div>
            ) : detailClient ? (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-3 gap-1 py-1.5 border-b border-slate-900">
                  <span className="text-slate-500 font-medium">ID Interno:</span>
                  <span className="col-span-2 font-mono text-slate-300">#{detailClient.id}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 py-1.5 border-b border-slate-900">
                  <span className="text-slate-500 font-medium">Nombre:</span>
                  <span className="col-span-2 text-slate-100 font-bold">{detailClient.nombre}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 py-1.5 border-b border-slate-900">
                  <span className="text-slate-500 font-medium">Cédula:</span>
                  <span className="col-span-2 text-slate-300">{detailClient.cedula}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 py-1.5 border-b border-slate-900">
                  <span className="text-slate-500 font-medium">Teléfono:</span>
                  <span className="col-span-2 text-slate-300">{detailClient.telefono || 'No registrado'}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 py-1.5 border-b border-slate-900">
                  <span className="text-slate-500 font-medium">Correo:</span>
                  <span className="col-span-2 text-slate-300 truncate" title={detailClient.email || ''}>{detailClient.email || 'No registrado'}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 py-1.5">
                  <span className="text-slate-500 font-medium">Estado:</span>
                  <span className="col-span-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      detailClient.status === 'activo' || detailClient.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                        : detailClient.status === 'deudor'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                        : detailClient.status === 'pago_parcial'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                        : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                    }`}>
                      {detailClient.status === 'activo' || detailClient.status === 'active'
                        ? 'Activo / Solvente'
                        : detailClient.status === 'deudor'
                        ? 'Deudor / Debe'
                        : detailClient.status === 'pago_parcial'
                        ? 'Pago Parcial'
                        : 'Inactivo'}
                    </span>
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No se pudo cargar la información.</p>
            )}

            <div className="flex justify-end pt-3">
              <button onClick={() => setIsDetailOpen(false)} className="btn-secondary py-2">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 space-y-6 animate-scale-in">
            <div className="flex justify-between items-center">
              <h3 className="font-outfit text-xl font-bold">
                {modalMode === 'create' ? 'Agregar Cliente' : 'Editar Cliente'}
              </h3>
              <button onClick={() => !saving && setIsModalOpen(false)} disabled={saving} className="text-slate-400 hover:text-slate-200 cursor-pointer disabled:opacity-30">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Cédula</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    required
                    disabled={saving}
                    placeholder="V-12345678"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    className="w-full pl-10 glass-input disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    required
                    disabled={saving}
                    placeholder="ej. Daniel Rodríguez"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full pl-10 glass-input disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Teléfono (Opcional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    disabled={saving}
                    placeholder="0412-1234567"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full pl-10 glass-input disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Correo Electrónico (Opcional)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    disabled={saving}
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 glass-input disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Estado</label>
                <select
                  value={status}
                  disabled={saving}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full glass-input disabled:opacity-50"
                >
                  <option value="activo" className="bg-slate-900">Activo / Solvente</option>
                  <option value="deudor" className="bg-slate-900">Deudor / Debe</option>
                  <option value="pago_parcial" className="bg-slate-900">Pago Parcial</option>
                  <option value="inactivo" className="bg-slate-900">Inactivo</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={saving} className="btn-secondary py-2 disabled:opacity-40 disabled:cursor-not-allowed">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-primary py-2 px-6 disabled:opacity-55 disabled:cursor-not-allowed">
                  {saving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></div>
                  ) : (
                    <span>Guardar</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="Eliminar Cliente"
        message="¿Está seguro de que desea eliminar este cliente? Esta acción no se puede deshacer."
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsConfirmDeleteOpen(false);
          setClientToDelete(null);
        }}
        isLoading={deletingId !== null}
      />
    </div>
  );
};

export default Clientes;
