import React, { useEffect, useState } from 'react';
import { ventasService } from '../api/ventasService';
import { clientesService } from '../api/clientesService';
import { productosService } from '../api/productosService';
import { useNotification } from '../context/NotificationContext';
import { tasasService } from '../api/tasasService';
import {
  Clock,
  Search,
  Loader2,
  Trash2,
  Eye,
  Info,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileText,
  Printer,
  Calendar,
  DollarSign,
  X,
  Users
} from 'lucide-react';
import { generateTicketPdf } from '../components/TicketPdf';
import { emailService } from '../api/emailService';

interface Venta {
  id: number;
  clientes_id: number;
  productos_id: number;
  tasa_moneda_id: number;
  cantidad: number;
  precio_unitario: number;
  total: number;
  status: string;
  created_at: string;
}

interface CompletedSaleDetails {
  invoiceKey: string;
  clientName: string;
  clientCedula: string;
  date: string;
  totalUsd: number;
  tasa: number;
  totalBs: number;
  items: Array<{
    producto: { id: number; nombre: string; precio_usd: number };
    cantidad: number;
    precio_unitario: number;
    total: number;
  }>;
}

export const HistorialVentas: React.FC = () => {
  const { showToast } = useNotification();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 8; // items per page

  // Helper maps to display names in table instead of IDs
  const [clientsMap, setClientsMap] = useState<Record<number, any>>({});
  const [productsMap, setProductsMap] = useState<Record<number, any>>({});
  const [tasasMap, setTasasMap] = useState<Record<number, number>>({});

  // Details Modal
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
  const [detailClient, setDetailClient] = useState<any>(null);
  const [detailProduct, setDetailProduct] = useState<any>(null);
  const [detailTasaVal, setDetailTasaVal] = useState<number>(1);

  // Completed sale details for print ticket
  const [completedSaleDetails, setCompletedSaleDetails] = useState<CompletedSaleDetails | null>(null);
  const generateAndDownloadPdf = (details: any | null) => {
    if (!details) return;
    try {
      const doc = generateTicketPdf(details);
      doc.save(`ticket-${details.invoiceKey}.pdf`);
    } catch (err) {
      console.error('Error generating PDF (jsPDF):', err);
      showToast(`Error al generar el PDF: ${(err as any)?.message || err}`, 'error');
    }
  };

  const [emailToSend, setEmailToSend] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (completedSaleDetails) {
      const matched = Object.values(clientsMap).find((c: any) => c.cedula === completedSaleDetails.clientCedula);
      setEmailToSend((matched as any)?.email || '');
      setShowEmailInput(false);
    }
  }, [completedSaleDetails, clientsMap]);

  const handleSendReceiptEmail = async () => {
    if (!emailToSend) {
      showToast('Por favor ingrese un correo electrónico válido', 'info');
      return;
    }
    setSendingEmail(true);
    try {
      await emailService.sendReceipt(emailToSend, completedSaleDetails);
      showToast('Recibo enviado por correo exitosamente', 'success');
      setShowEmailInput(false);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Error al enviar el correo';
      showToast(msg, 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  // Delete Confirm Modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchVentas = async () => {
    setIsTableLoading(true);
    try {
      const res = await ventasService.getAll({
        page,
        limit,
        search: searchQuery || undefined,
        status: statusFilter || undefined
      });
      if (res && res.data) {
        setVentas(res.data);
        if (res.meta) {
          setTotalPages(res.meta.pages || 1);
          setTotalItems(res.meta.total || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching sales history:', err);
      showToast('Error al cargar el historial de ventas', 'error');
    } finally {
      setIsTableLoading(false);
    }
  };

  // Load clients & products maps for name mapping on listing
  useEffect(() => {
    const loadMaps = async () => {
      try {
        const [cliRes, prodRes] = await Promise.all([
          clientesService.getAll({ limit: 1000 }),
          productosService.getAll({ limit: 1000 })
        ]);
        if (cliRes && cliRes.items) {
          const cMap: Record<number, any> = {};
          cliRes.items.forEach((c: any) => {
            cMap[c.id] = c;
          });
          setClientsMap(cMap);
        }
        if (prodRes && prodRes.items) {
          const pMap: Record<number, any> = {};
          prodRes.items.forEach((p: any) => {
            pMap[p.id] = p;
          });
          setProductsMap(pMap);
        }
      } catch (err) {
        console.error('Error loading helper maps:', err);
      }
    };
    loadMaps();
  }, []);

  // Fetch exchange rates list once to map exchange rate values to their IDs if possible, or fall back to current latest rate
  useEffect(() => {
    const fetchTasas = async () => {
      try {
        const res = await tasasService.getLatest();
        if (res && res.data) {
          setTasasMap({ [res.data.id]: Number(res.data.tasa_usd) });
        }
      } catch (err) {
        console.error('Error fetching exchange rate for map:', err);
      }
    };
    fetchTasas();
  }, []);

  useEffect(() => {
    fetchVentas();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchVentas();
  };

  const handleOpenDetail = async (venta: Venta) => {
    setSelectedVenta(venta);
    setIsDetailOpen(true);
    setLoadingDetail(true);
    setDetailClient(null);
    setDetailProduct(null);
    setDetailTasaVal(1);

    try {
      // Fetch details in parallel
      const [cData, pData] = await Promise.all([
        clientesService.getById(venta.clientes_id).catch(() => null),
        productosService.getById(venta.productos_id).catch(() => null)
      ]);

      setDetailClient(cData);
      setDetailProduct(pData);

      // Resolve exchange rate
      let rate = 1;
      if (tasasMap[venta.tasa_moneda_id]) {
        rate = tasasMap[venta.tasa_moneda_id];
      } else {
        try {
          const res = await tasasService.getLatest();
          if (res && res.data) {
            rate = Number(res.data.tasa_usd);
          }
        } catch (e) {
          console.error(e);
        }
      }
      setDetailTasaVal(rate);
    } catch (err) {
      console.error('Error loading details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenPrintTicket = async (venta: Venta, client: any, product: any, rate: number) => {
    let resolvedRate = rate;
    // If rate is not provided or equals 1 (fallback), try fetching latest tasa
    if (!resolvedRate || resolvedRate === 1) {
      try {
        const res = await tasasService.getLatest();
        if (res && res.data && res.data.tasa_usd) resolvedRate = Number(res.data.tasa_usd);
      } catch (e) {
        console.warn('No se pudo obtener tasa al abrir ticket, usando fallback', e);
      }
    }
    const formattedDate = venta.created_at ? new Date(venta.created_at).toLocaleString() : 'Hoy';
    const clientName = client ? client.nombre : `Cliente #${venta.clientes_id}`;
    const clientCedula = client ? client.cedula : '';
    const totalUsd = Number(venta.total);
    const totalBs = totalUsd * (resolvedRate || 1);
    const detailObj = {
      invoiceKey: `TX-${venta.id}-${Date.parse(venta.created_at) || Date.now()}`,
      clientName,
      clientCedula,
      date: formattedDate,
      totalUsd,
      tasa: resolvedRate || 1,
      totalBs,
      items: [
        {
          producto: {
            id: venta.productos_id,
            nombre: product ? product.nombre : `Producto #${venta.productos_id}`,
            precio_usd: Number(venta.precio_unitario)
          },
          cantidad: venta.cantidad,
          precio_unitario: Number(venta.precio_unitario),
          total: totalUsd
        }
      ]
    };

    setCompletedSaleDetails(detailObj);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async (restoreStock: boolean) => {
    if (deletingId === null) return;
    setDeleting(true);
    try {
      if (restoreStock) {
        await ventasService.delete(deletingId);
        showToast('Venta anulada y stock devuelto exitosamente', 'success');
      } else {
        await ventasService.deleteNoRestore(deletingId);
        showToast('Venta anulada sin devolver stock exitosamente', 'success');
      }
      setIsDeleteOpen(false);
      fetchVentas();
    } catch (err: any) {
      console.error(err);
      showToast('Error al anular la venta.', 'error');
    } finally {
      setDeleting(false);
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pagada':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            Pagada
          </span>
        );
      case 'no_pagada':
      case 'debe':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/25">
            Debe
          </span>
        );
      case 'parcialmente_pagada':
      case 'pago_parcial':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25">
            Pago Parcial
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700/50">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-outfit text-3xl font-extrabold tracking-tight">Historial de Ventas</h2>
          <p className="text-sm text-slate-400 mt-1">Listado completo, auditoría y reimpresión de comprobantes post-venta.</p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="glass-panel rounded-2xl p-6">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Search Bar */}
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label htmlFor="searchVenta" className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Buscar Venta</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por cédula o nombre del cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 glass-input"
              />
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="statusFilter" className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Filtrar por Estado</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 glass-input"
                aria-label="Filtrar por estado de venta"
              >
                <option value="" className="bg-slate-900">Todos los estados</option>
                <option value="pagada" className="bg-slate-900">Pagada</option>
                <option value="no_pagada" className="bg-slate-900">Debe</option>
                <option value="pago_parcial" className="bg-slate-900">Pago Parcial</option>
              </select>
            </div>
          </div>

          {/* Search Submit Button */}
          <div>
            <button type="submit" className="btn-secondary w-full py-2.5">
              Aplicar Filtros
            </button>
          </div>
        </form>
      </div>

      {/* Main Table Card */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col min-h-100">
        <div className="flex-1 overflow-x-auto">
          {isTableLoading ? (
            <div className="flex justify-center items-center py-24">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-450" />
                <p className="text-slate-500 text-xs font-medium">Buscando historial...</p>
              </div>
            </div>
          ) : ventas.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <Clock className="h-12 w-12 mx-auto mb-3 stroke-[1.5]" />
              <p className="text-sm">No se encontraron registros de ventas.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="pb-3">ID Venta</th>
                  <th className="pb-3">Fecha</th>
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Producto</th>
                  <th className="pb-3 text-center">Cant.</th>
                  <th className="pb-3 text-right">Total USD</th>
                  <th className="pb-3 text-center">Estado</th>
                  <th className="pb-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {ventas.map((v) => {
                  const client = clientsMap[v.clientes_id];
                  const product = productsMap[v.productos_id];
                  return (
                    <tr key={v.id} className="hover:bg-slate-900/10">
                      <td className="py-3.5 font-mono font-bold text-slate-350">#{v.id}</td>
                      <td className="py-3.5 text-slate-400">
                        {v.created_at ? new Date(v.created_at).toLocaleDateString() : 'Desconocida'}
                      </td>
                      <td className="py-3.5 text-slate-200 font-medium truncate max-w-37.5">
                        {client ? client.nombre : `ID: ${v.clientes_id}`}
                      </td>
                      <td className="py-3.5 text-slate-300 truncate max-w-37.5">
                        {product ? product.nombre : `ID: ${v.productos_id}`}
                      </td>
                      <td className="py-3.5 text-center text-slate-400 font-semibold">{v.cantidad}</td>
                      <td className="py-3.5 text-right font-bold text-slate-100">
                        ${Number(v.total).toFixed(2)}
                      </td>
                      <td className="py-3.5 text-center">{getStatusBadge(v.status)}</td>
                      <td className="py-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenDetail(v)}
                          title="Detalles de Venta"
                          className="p-1.5 text-slate-450 hover:text-blue-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            let rate = 1;
                            if (tasasMap[v.tasa_moneda_id]) rate = tasasMap[v.tasa_moneda_id];
                            handleOpenPrintTicket(v, client, product, rate);
                          }}
                          title="Imprimir Ticket"
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(v.id)}
                          title="Anular Venta"
                          className="p-1.5 text-slate-400 hover:text-rose-450 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Table Pagination Controls */}
        {!isTableLoading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-850 pt-4 mt-6 gap-4">
            <span className="text-xs text-slate-450 font-medium">
              Mostrando {ventas.length} de {totalItems} transacciones
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary py-1.5 px-3 flex items-center gap-1 text-xs disabled:opacity-35 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </button>
              <div className="px-3 py-1 bg-slate-900/50 border border-slate-800/80 rounded-lg text-xs font-semibold text-slate-300">
                Página {page} de {totalPages}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary py-1.5 px-3 flex items-center gap-1 text-xs disabled:opacity-35 disabled:cursor-not-allowed"
              >
                Siguiente
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sale Detail Modal */}
      {isDetailOpen && selectedVenta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 space-y-6 animate-scale-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-outfit text-xl font-bold flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-400" />
                Auditoría de Venta #{selectedVenta.id}
              </h3>
              <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-slate-200 cursor-pointer" aria-label="Cerrar detalle">
                  <X className="h-5 w-5" onClick={() => setIsDetailOpen(false)} />
                </button>
            </div>

            {loadingDetail ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                {/* Client Box */}
                <div className="space-y-2 border-b border-slate-900 pb-3">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-slate-500" /> Datos del Cliente
                  </span>
                  <div className="grid grid-cols-3 gap-1 py-0.5">
                    <span className="text-slate-500 font-medium">Nombre:</span>
                    <span className="col-span-2 text-slate-200 font-semibold">{detailClient ? detailClient.nombre : 'Cargando...'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 py-0.5">
                    <span className="text-slate-500 font-medium">Cédula:</span>
                    <span className="col-span-2 font-mono text-slate-300">{detailClient ? detailClient.cedula : 'Cargando...'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 py-0.5">
                    <span className="text-slate-500 font-medium">Teléfono:</span>
                    <span className="col-span-2 text-slate-350">{detailClient ? (detailClient.telefono || 'Sin teléfono') : 'Cargando...'}</span>
                  </div>
                </div>

                {/* Product Box */}
                <div className="space-y-2 border-b border-slate-900 pb-3">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-slate-500" /> Detalle de Producto
                  </span>
                  <div className="grid grid-cols-3 gap-1 py-0.5">
                    <span className="text-slate-500 font-medium">Producto:</span>
                    <span className="col-span-2 text-slate-200 font-semibold">{detailProduct ? detailProduct.nombre : 'Cargando...'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 py-0.5">
                    <span className="text-slate-500 font-medium">Categoría:</span>
                    <span className="col-span-2 text-slate-300">{detailProduct ? (detailProduct.categoria || 'General') : 'Cargando...'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 py-0.5">
                    <span className="text-slate-500 font-medium">Cantidad:</span>
                    <span className="col-span-2 text-slate-200 font-bold">{selectedVenta.cantidad} unidades</span>
                  </div>
                </div>

                {/* Pricing / Rates Box */}
                <div className="space-y-2 pb-1">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-slate-500" /> Valores Financieros
                  </span>
                  <div className="grid grid-cols-3 gap-1 py-0.5">
                    <span className="text-slate-500 font-medium">P. Unitario:</span>
                    <span className="col-span-2 font-mono font-bold text-slate-200">${Number(selectedVenta.precio_unitario).toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 py-0.5">
                    <span className="text-slate-500 font-medium">Total USD:</span>
                    <span className="col-span-2 font-mono font-bold text-emerald-400">${Number(selectedVenta.total).toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 py-0.5">
                    <span className="text-slate-500 font-medium">Tasa de Venta:</span>
                    <span className="col-span-2 text-slate-400">Bs. {detailTasaVal.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 py-0.5">
                    <span className="text-slate-500 font-medium">Total Bs.:</span>
                    <span className="col-span-2 font-mono font-bold text-amber-500">Bs. {(Number(selectedVenta.total) * detailTasaVal).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 py-1 items-center">
                    <span className="text-slate-500 font-medium font-outfit text-sm">Estado Venta:</span>
                    <div className="col-span-2 flex items-center gap-2">
                      <select
                        aria-label="Cambiar estado de venta"
                        value={selectedVenta.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          try {
                            await ventasService.updateStatus(selectedVenta.id, newStatus);
                            setSelectedVenta({ ...selectedVenta, status: newStatus });
                            showToast('Estado de la venta actualizado correctamente', 'success');
                            fetchVentas();
                          } catch (err) {
                            showToast('Error al actualizar el estado de la venta', 'error');
                          }
                        }}
                        className="bg-slate-950/80 border border-slate-800 focus:border-emerald-500/80 text-slate-200 text-xs rounded px-2.5 py-1.5 outline-none transition-all duration-200 cursor-pointer"
                      >
                        <option value="pagada">Pagada</option>
                        <option value="no_pagada">Debe / No Pagada</option>
                        <option value="pago_parcial">Pago Parcial</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 py-0.5">
                    <span className="text-slate-500 font-medium">Fecha:</span>
                    <span className="col-span-2 text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(selectedVenta.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setIsDetailOpen(false);
                  handleOpenPrintTicket(selectedVenta, detailClient, detailProduct, detailTasaVal);
                }}
                disabled={loadingDetail}
                className="btn-primary py-2 text-slate-950 flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4 text-slate-950" />
                Imprimir Ticket
              </button>
              <button onClick={() => setIsDetailOpen(false)} className="btn-secondary py-2">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt/Ticket Overlay Modal */}
      {completedSaleDetails && (
        <>
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              html, body {
                width: 80mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                color: black !important;
              }
              body * {
                visibility: hidden !important;
              }
              #print-receipt-modal-container, #print-receipt-modal-container * {
                visibility: visible !important;
              }
              #print-receipt-modal-container {
                position: absolute !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                top: 0 !important;
                width: 80mm !important;
                max-width: 80mm !important;
                background: white !important;
                color: black !important;
                padding: 4mm 2mm !important;
                margin: 0 !important;
                box-sizing: border-box !important;
              }
              #print-receipt-modal-container table {
                width: 100% !important;
                font-size: 10px !important;
              }
              #print-receipt-modal-container th,
              #print-receipt-modal-container td {
                padding: 4px 2px !important;
              }
              #print-receipt-modal-container h3 {
                font-size: 14px !important;
                margin-bottom: 2px !important;
              }
              #print-receipt-modal-container p,
              #print-receipt-modal-container span,
              #print-receipt-modal-container div {
                font-size: 9px !important;
              }
              #print-receipt-modal-container .border-b,
              #print-receipt-modal-container .border-t {
                border-color: #cbd5e1 !important; /* light gray for print */
              }
            }
          `}} />
          <div id="print-receipt-modal-container" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:p-0 print:bg-white print:absolute print:inset-0">
            <div className="bg-white text-slate-900 w-full max-w-[80mm] rounded-2xl p-6 shadow-2xl relative border border-slate-200 print:border-none print:shadow-none print:bg-white print:w-full print:max-w-none print:p-0 print:m-0 font-sans">
              
              {/* Header info */}
              <div className="text-center space-y-1 pb-4 border-b border-slate-200">
                <h3 className="font-outfit text-xl font-extrabold text-slate-900">
                  {import.meta.env.VITE_NAME_BUSSINE || 'Single Sales'}
                </h3>
                <p className="text-xs text-slate-600">Control de Ventas & Facturación</p>
                <p className="text-[10px] text-slate-500">Transacción: {completedSaleDetails.invoiceKey}</p>
              </div>

              {/* Client and Date details */}
              <div className="py-4 space-y-1.5 text-xs border-b border-slate-200 text-slate-800">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-600">Fecha:</span>
                  <span>{completedSaleDetails.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-600">Cliente:</span>
                  <span className="font-bold text-slate-900">{completedSaleDetails.clientName}</span>
                </div>
                {completedSaleDetails.clientCedula && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-600">Cédula:</span>
                    <span>{completedSaleDetails.clientCedula}</span>
                  </div>
                )}
              </div>

              {/* Items table */}
              <div className="py-4 border-b border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-600 border-b border-slate-200 pb-2 font-bold uppercase">
                      <th className="pb-1.5">Desc.</th>
                      <th className="pb-1.5 text-center">Cant.</th>
                      <th className="pb-1.5 text-right">Precio</th>
                      <th className="pb-1.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {completedSaleDetails.items.map((item) => (
                      <tr key={item.producto.id} className="text-slate-800">
                        <td className="py-2 pr-2 font-medium">{item.producto.nombre}</td>
                        <td className="py-2 text-center">{item.cantidad}</td>
                        <td className="py-2 text-right">${Number(item.producto.precio_usd).toFixed(2)}</td>
                        <td className="py-2 text-right">${(Number(item.producto.precio_usd) * item.cantidad).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="py-4 space-y-1.5 text-xs text-slate-800">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-600">Total USD:</span>
                  <span className="font-bold text-base text-slate-900">${completedSaleDetails.totalUsd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-600">Tasa de Cambio:</span>
                  <span>Bs. {completedSaleDetails.tasa.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="font-extrabold text-slate-900">TOTAL BS:</span>
                  <span className="font-extrabold text-base text-slate-900">
                    Bs. {completedSaleDetails.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Footer message / Print Buttons */}
              <div className="text-center pt-4 border-t border-slate-200 print:hidden">
                <p className="text-[10px] text-slate-500 mb-4">¡Gracias por su compra!</p>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.print()}
                      className="flex-1 btn-primary py-2 text-xs"
                    >
                      Imprimir Ticket
                    </button>
                    <button
                      onClick={() => generateAndDownloadPdf(completedSaleDetails)}
                      className="flex-1 btn-secondary py-2 text-xs bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 font-medium"
                    >
                      Descargar PDF
                    </button>
                  </div>
                  {showEmailInput ? (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left space-y-2 mt-1">
                      <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Enviar Recibo por Correo</label>
                      <input
                        type="email"
                        required
                        disabled={sendingEmail}
                        value={emailToSend}
                        onChange={(e) => setEmailToSend(e.target.value)}
                        placeholder="cliente@correo.com"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 text-slate-900"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSendReceiptEmail}
                          disabled={sendingEmail}
                          className="flex-1 btn-primary py-1.5 text-xs"
                        >
                          {sendingEmail ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto text-slate-950" />
                          ) : (
                            'Enviar Correo'
                          )}
                        </button>
                        <button
                          onClick={() => setShowEmailInput(false)}
                          disabled={sendingEmail}
                          className="btn-secondary py-1.5 px-3 text-xs bg-slate-200 hover:bg-slate-300 border-slate-300 text-slate-700"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowEmailInput(true)}
                      className="w-full btn-secondary py-2 text-xs bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 font-semibold"
                    >
                      Enviar por Correo
                    </button>
                  )}
                  <button
                    onClick={() => setCompletedSaleDetails(null)}
                    className="w-full btn-secondary py-2 px-4 text-xs bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
              
              {/* Print-only thank you message */}
              <div className="hidden print:block text-center pt-8 text-[10px] text-slate-500 font-medium">
                ¡Gracias por su compra!
              </div>
            </div>
          </div>
        </>
      )}

      {/* Custom Confirmation Dialog for Deletes with two restore-stock options */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel rounded-2xl p-6 space-y-6 animate-scale-in">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20">
                <Trash2 className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-outfit text-xl font-bold text-slate-100">Anular Transacción de Venta</h3>
                <p className="text-sm text-slate-450 leading-relaxed">
                  ¿Cómo desea proceder con la anulación de esta venta? Esta operación es irreversible. Elija si desea devolver la cantidad vendida al inventario de productos.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => handleConfirmDelete(true)}
                className="btn-primary py-2.5 text-slate-950 text-xs flex items-center justify-center gap-1.5"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                ) : (
                  <>Anular y Devolver Stock al Catálogo</>
                )}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => handleConfirmDelete(false)}
                className="btn-secondary hover:bg-rose-950/25 border-rose-900/40 text-rose-400 py-2.5 text-xs flex items-center justify-center gap-1.5"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-rose-450" />
                ) : (
                  <>Anular sin Devolver Stock (Eliminar Registro)</>
                )}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setIsDeleteOpen(false);
                  setDeletingId(null);
                }}
                className="btn-secondary py-2 px-4 rounded-lg text-xs"
              >
                Volver Atrás (No Anular)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialVentas;
