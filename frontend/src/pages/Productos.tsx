import React, { useEffect, useState } from 'react';
import { productosService } from '../api/productosService';
import { useNotification } from '../context/NotificationContext';
import { PRODUCT_CATEGORIES } from '../constants/categories';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Layers,
  DollarSign,
  Tag,
  Loader2,
  Eye,
  Info,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  precio_usd: number;
  stock: number;
  status: string;
}

export const Productos: React.FC = () => {
  const { showToast } = useNotification();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Deletion Confirm Modal States
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  // Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [precioUsd, setPrecioUsd] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>('');
  const [status, setStatus] = useState('active');

  // Detail Modal State (Details by ID)
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Producto | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchProductos = async () => {
    setIsTableLoading(true);
    try {
      const data = await productosService.getAll({
        page,
        limit: 10,
        search: search || undefined,
        categoria: filterCategory || undefined
      });
      if (data) {
        setProductos(data.items);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      showToast('Error al cargar la lista de productos', 'error');
    } finally {
      setIsTableLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, [page, search, filterCategory]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setNombre('');
    setCategoria('');
    setPrecioUsd('');
    setStock('');
    setStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Producto) => {
    setModalMode('edit');
    setSelectedId(p.id);
    setNombre(p.nombre);
    setCategoria(p.categoria || '');
    setPrecioUsd(p.precio_usd);
    setStock(p.stock);
    setStatus(p.status);
    setIsModalOpen(true);
  };

  // Ver detalles por ID (details by ID request)
  const handleOpenDetail = async (id: number) => {
    setLoadingDetail(true);
    setIsDetailOpen(true);
    try {
      const data = await productosService.getById(id);
      setDetailProduct(data);
    } catch (err) {
      console.error('Error fetching product details:', err);
      showToast('No se pudieron obtener los detalles del producto.', 'error');
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
      categoria: categoria || 'General',
      precio_usd: Number(precioUsd),
      stock: Number(stock),
      status
    };

    try {
      if (modalMode === 'create') {
        await productosService.create(payload);
        showToast('Producto registrado exitosamente', 'success');
      } else {
        if (selectedId === null) return;
        await productosService.update(selectedId, payload);
        showToast('Producto actualizado exitosamente', 'success');
      }
      setIsModalOpen(false);
      fetchProductos();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al guardar el producto';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setProductToDelete(id);
    setIsConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (productToDelete === null) return;
    setDeletingId(productToDelete);
    try {
      await productosService.delete(productToDelete);
      showToast('Producto eliminado exitosamente', 'success');
      fetchProductos();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'No se pudo eliminar el producto';
      if (msg.includes('foreign key') || msg.includes('restricción')) {
        showToast('No se puede eliminar el producto porque posee historial de ventas registrado (Historial Financiero Protegido).', 'error');
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setDeletingId(null);
      setProductToDelete(null);
      setIsConfirmDeleteOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="font-outfit text-3xl font-extrabold tracking-tight">Inventario de Productos</h2>
          <p className="text-sm text-slate-400 mt-1">Administración de stock, precios en USD y categorías del catálogo.</p>
        </div>
        <button onClick={handleOpenCreate} className="btn-primary">
          <Plus className="h-5 w-5" />
          <span>Agregar Producto</span>
        </button>
      </div>

      {/* Search and Table */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 glass-input"
            />
          </div>
          <div className="relative w-full sm:w-64">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 glass-input"
            >
              <option value="" className="bg-slate-900">Todas las categorías</option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900 text-slate-100">
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isTableLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-800 border-t-emerald-500"></div>
            </div>
          ) : productos.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Package className="h-12 w-12 mx-auto mb-3 stroke-[1.5]" />
              <p className="text-sm">No se encontraron productos</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="pb-3">ID</th>
                  <th className="pb-3">Producto</th>
                  <th className="pb-3">Categoría</th>
                  <th className="pb-3 text-right">Precio (USD)</th>
                  <th className="pb-3 text-center">Stock</th>
                  <th className="pb-3">Estado</th>
                  <th className="pb-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {productos.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/10">
                    <td className="py-3.5 text-slate-400">#{p.id}</td>
                    <td className="py-3.5 font-semibold text-slate-200">{p.nombre}</td>
                    <td className="py-3.5 text-slate-400">{p.categoria || 'General'}</td>
                    <td className="py-3.5 text-right font-bold text-slate-300">${Number(p.precio_usd).toFixed(2)}</td>
                    <td className="py-3.5 text-center font-medium">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        p.stock > 10 ? 'text-slate-300' : p.stock > 0 ? 'text-amber-400 font-semibold bg-amber-550/5 border border-amber-500/20' : 'text-rose-400 font-semibold bg-rose-500/10 border border-rose-500/20 animate-pulse'
                      }`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        p.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {p.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenDetail(p.id)}
                        disabled={deletingId !== null}
                        title="Ver Detalles"
                        className="p-1.5 text-slate-450 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(p)}
                        disabled={deletingId !== null}
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(p.id)}
                        disabled={deletingId !== null}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center justify-center"
                      >
                        {deletingId === p.id ? (
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
              Mostrando {productos.length} de {total} productos — Pág. {page} de {Math.ceil(total / 10)}
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
                Ficha del Producto
              </h3>
              <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
              </div>
            ) : detailProduct ? (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-3 gap-1 py-1.5 border-b border-slate-900">
                  <span className="text-slate-500 font-medium">ID Interno:</span>
                  <span className="col-span-2 font-mono text-slate-300">#{detailProduct.id}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 py-1.5 border-b border-slate-900">
                  <span className="text-slate-500 font-medium">Nombre:</span>
                  <span className="col-span-2 text-slate-100 font-bold">{detailProduct.nombre}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 py-1.5 border-b border-slate-900">
                  <span className="text-slate-500 font-medium">Categoría:</span>
                  <span className="col-span-2 text-slate-350">{detailProduct.categoria || 'General'}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 py-1.5 border-b border-slate-900">
                  <span className="text-slate-500 font-medium">Precio (USD):</span>
                  <span className="col-span-2 font-bold text-slate-200">${Number(detailProduct.precio_usd).toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 py-1.5 border-b border-slate-900">
                  <span className="text-slate-500 font-medium">Stock Físico:</span>
                  <span className="col-span-2 text-slate-300">{detailProduct.stock} unidades</span>
                </div>
                <div className="grid grid-cols-3 gap-1 py-1.5">
                  <span className="text-slate-500 font-medium">Estado:</span>
                  <span className="col-span-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      detailProduct.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {detailProduct.status === 'active' ? 'Activo en Catálogo' : 'Inactivo'}
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
                {modalMode === 'create' ? 'Agregar Producto' : 'Editar Producto'}
              </h3>
              <button onClick={() => !saving && setIsModalOpen(false)} disabled={saving} className="text-slate-400 hover:text-slate-200 cursor-pointer disabled:opacity-30">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Nombre del Producto</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    required
                    disabled={saving}
                    placeholder="ej. Harina Pan 1kg"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full pl-10 glass-input disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Categoría</label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                  <select
                    required
                    disabled={saving}
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full pl-10 glass-input disabled:opacity-50"
                  >
                    <option value="" className="bg-slate-900">Seleccione categoría</option>
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-slate-900 text-slate-100">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Precio (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                    <input
                      type="number"
                      step="0.01"
                      required
                      disabled={saving}
                      placeholder="0.00"
                      value={precioUsd}
                      onChange={(e) => setPrecioUsd(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full pl-9 glass-input disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Stock Inicial</label>
                  <input
                    type="number"
                    required
                    disabled={saving}
                    placeholder="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full glass-input disabled:opacity-50"
                  />
                </div>
              </div>

              {modalMode === 'edit' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Estado</label>
                  <select
                    value={status}
                    disabled={saving}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full glass-input disabled:opacity-50"
                  >
                    <option value="active" className="bg-slate-900">Activo</option>
                    <option value="inactive" className="bg-slate-900">Inactivo</option>
                  </select>
                </div>
              )}

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
        title="Eliminar Producto"
        message="¿Está seguro de que desea eliminar este producto? Esta acción no se puede deshacer."
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsConfirmDeleteOpen(false);
          setProductToDelete(null);
        }}
        isLoading={deletingId !== null}
      />
    </div>
  );
};

export default Productos;
