import React, { useEffect, useState, useRef } from 'react';
import { clientesService } from '../api/clientesService';
import { productosService } from '../api/productosService';
import { tasasService } from '../api/tasasService';
import { ventasService } from '../api/ventasService';
import { useNotification } from '../context/NotificationContext';
import {
  ShoppingBag,
  Search,
  User,
  Plus,
  Minus,
  Trash2,
  FileText,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { generateTicketPdf } from '../components/TicketPdf';
import { emailService } from '../api/emailService';

interface Cliente {
  id: number;
  nombre: string;
  cedula: string;
  telefono?: string | null;
  email?: string | null;
  status?: string;
}

interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  precio_usd: number;
  stock: number;
  status: string;
}

interface CartItem {
  producto: Producto;
  cantidad: number;
}

export const Ventas: React.FC = () => {
  const { showToast } = useNotification();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [latestTasa, setLatestTasa] = useState<{ id: number; tasa_usd: number } | null>(null);

  const [selectedClientId, setSelectedClientId] = useState<number | ''>('');
  const [searchProduct, setSearchProduct] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productPage, setProductPage] = useState(1);
  const PRODUCTS_PER_PAGE = 9;

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [idempotencyKey, setIdempotencyKey] = useState('');

  // Client autocomplete states
  const [clientSearchInput, setClientSearchInput] = useState('');
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [selectedClientName, setSelectedClientName] = useState('');
  const clientSearchRef = useRef<HTMLDivElement>(null);

  // Completed sale details for printable receipt/invoice ticket modal
  const [completedSaleDetails, setCompletedSaleDetails] = useState<{
    clientName: string;
    clientCedula: string;
    items: CartItem[];
    tasa: number;
    totalUsd: number;
    totalBs: number;
    date: string;
    invoiceKey: string;
  } | null>(null);
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

  // Quick Client Register Modal States
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientNombre, setClientNombre] = useState('');
  const [clientCedula, setClientCedula] = useState('');
  const [clientTelefono, setClientTelefono] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [savingClient, setSavingClient] = useState(false);

  // Email receipt states
  const [emailToSend, setEmailToSend] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (completedSaleDetails) {
      const matched = clientes.find(c => c.cedula === completedSaleDetails.clientCedula);
      setEmailToSend(matched?.email || '');
      setShowEmailInput(false);
    }
  }, [completedSaleDetails, clientes]);

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

  // Generar nueva clave de idempotencia
  const generateNewIdempotencyKey = () => {
    setIdempotencyKey(`pos_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  };

  const handleQuickClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientNombre || !clientCedula) {
      showToast('Por favor complete el nombre y la cédula', 'info');
      return;
    }
    setSavingClient(true);
    try {
      const newClient = await clientesService.create({
        nombre: clientNombre,
        cedula: clientCedula,
        telefono: clientTelefono || null,
        email: clientEmail || null,
        status: 'activo'
      });
      showToast('Cliente registrado con éxito', 'success');
      // Recargar lista de clientes
      const cliData = await clientesService.getAll({ limit: 100 });
      if (cliData && cliData.items) {
        const activeClients = cliData.items.filter(
          (c: any) => c.status !== 'inactivo' && c.status !== 'inactive'
        );
        setClientes(activeClients);
      }
      // Seleccionar automáticamente el nuevo cliente
      if (newClient && newClient.id) {
        setSelectedClientId(newClient.id);
        setSelectedClientName(`${newClient.nombre} (${newClient.cedula})`);
        setClientSearchInput(`${newClient.nombre} (${newClient.cedula})`);
      }
      // Limpiar y cerrar modal
      setClientNombre('');
      setClientCedula('');
      setClientTelefono('');
      setClientEmail('');
      setIsClientModalOpen(false);
    } catch (err: any) {
      console.error('Error creating client quickly:', err);
      const msg = err.response?.data?.message || 'Error al registrar el cliente';
      showToast(msg, 'error');
    } finally {
      setSavingClient(false);
    }
  };

  const fetchPosData = async () => {
    setFetchingData(true);
    try {
      const [cliData, prodData, tasaRes] = await Promise.all([
        clientesService.getAll({ limit: 100 }),
        productosService.getAll({ limit: 100 }),
        tasasService.getLatest(),
      ]);

      if (cliData && cliData.items) {
        const activeClients = cliData.items.filter(
          (c: any) => c.status !== 'inactivo' && c.status !== 'inactive'
        );
        setClientes(activeClients);
      }
      if (prodData && prodData.items) {
        const activeProducts = prodData.items.filter(
          (p: any) => p.status !== 'inactivo' && p.status !== 'inactive'
        );
        setProductos(activeProducts);
      }
      if (tasaRes && tasaRes.data) {
        setLatestTasa({
          id: tasaRes.data.id,
          tasa_usd: Number(tasaRes.data.tasa_usd)
        });
      }
    } catch (err) {
      console.error('Error loading POS resources:', err);
      showToast('Error al cargar la información de inventario y tasas cambiarias', 'error');
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    fetchPosData();
    generateNewIdempotencyKey();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clientSearchRef.current && !clientSearchRef.current.contains(event.target as Node)) {
        setClientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const addToCart = (prod: Producto) => {
    if (loading) return;

    if (prod.stock <= 0) {
      showToast(`El producto ${prod.nombre} no tiene stock disponible.`, 'error');
      return;
    }

    const existingIndex = cart.findIndex((item) => item.producto.id === prod.id);
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].cantidad;
      if (currentQty >= prod.stock) {
        showToast(`Límite de stock alcanzado para ${prod.nombre}.`, 'error');
        return;
      }
      const newCart = [...cart];
      newCart[existingIndex].cantidad += 1;
      setCart(newCart);
    } else {
      setCart([...cart, { producto: prod, cantidad: 1 }]);
    }
  };

  const updateQuantity = (prodId: number, delta: number) => {
    if (loading) return;

    const itemIndex = cart.findIndex((item) => item.producto.id === prodId);
    if (itemIndex === -1) return;

    const item = cart[itemIndex];
    const newQty = item.cantidad + delta;

    if (newQty <= 0) {
      setCart(cart.filter((i) => i.producto.id !== prodId));
      return;
    }

    if (newQty > item.producto.stock) {
      showToast(`No hay suficiente stock para ${item.producto.nombre}.`, 'error');
      return;
    }

    const newCart = [...cart];
    newCart[itemIndex].cantidad = newQty;
    setCart(newCart);
  };

  const removeFromCart = (prodId: number) => {
    if (loading) return;
    setCart(cart.filter((item) => item.producto.id !== prodId));
  };

  const calculateTotalUsd = () => {
    return cart.reduce((sum, item) => sum + Number(item.producto.precio_usd) * item.cantidad, 0);
  };

  const calculateTotalBs = () => {
    if (!latestTasa) return 0;
    return calculateTotalUsd() * latestTasa.tasa_usd;
  };

  const handleCheckout = async () => {
    if (loading) return;

    if (!selectedClientId) {
      showToast('Por favor seleccione un cliente antes de procesar la venta.', 'error');
      return;
    }

    if (cart.length === 0) {
      showToast('El carrito está vacío.', 'error');
      return;
    }

    if (!latestTasa) {
      showToast('No se ha podido cargar la tasa cambiaria activa.', 'error');
      return;
    }

    setLoading(true);

    try {
      const promises = cart.map((item, index) => {
        const itemKey = `${idempotencyKey}_item_${item.producto.id}_index_${index}`;
        return ventasService.create({
          clientes_id: Number(selectedClientId),
          productos_id: item.producto.id,
          tasa_moneda_id: latestTasa.id,
          cantidad: item.cantidad,
          precio_unitario: item.producto.precio_usd,
          idempotency_key: itemKey
        });
      });

      await Promise.all(promises);

      // Guardar detalles para el recibo antes de limpiar carrito y selección
      const selectedClientObj = clientes.find(c => c.id === Number(selectedClientId));
      const clientName = selectedClientObj ? selectedClientObj.nombre : 'Cliente Genérico';
      const clientCedula = selectedClientObj ? selectedClientObj.cedula : '';

      setCompletedSaleDetails({
        clientName,
        clientCedula,
        items: [...cart],
        tasa: latestTasa.tasa_usd,
        totalUsd: calculateTotalUsd(),
        totalBs: calculateTotalBs(),
        date: new Date().toLocaleString('es-VE', { hour12: true }),
        invoiceKey: idempotencyKey,
      });

      showToast('¡Venta procesada con éxito! El stock ha sido actualizado.', 'success');
      setCart([]);
      setSelectedClientId('');
      setSelectedClientName('');
      setClientSearchInput('');
      fetchPosData(); // Refresh product stocks
      generateNewIdempotencyKey(); // Reset idempotency key
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Error de concurrencia o stock insuficiente al procesar la venta. Intente nuevamente.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = productos.filter((p) =>
    p.nombre.toLowerCase().includes(searchProduct.toLowerCase()) ||
    p.categoria.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const totalProductPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice(
    (productPage - 1) * PRODUCTS_PER_PAGE,
    productPage * PRODUCTS_PER_PAGE
  );

  const filteredClients = clientSearchInput.trim() === '' || clientSearchInput === selectedClientName
    ? clientes
    : clientes.filter((c) =>
        c.nombre.toLowerCase().includes(clientSearchInput.toLowerCase()) ||
        c.cedula.toLowerCase().includes(clientSearchInput.toLowerCase())
      );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-outfit text-3xl font-extrabold tracking-tight">Punto de Venta (POS)</h2>
        <p className="text-sm text-slate-400 mt-1">Registra nuevas ventas garantizando stock e integridad de idempotencia.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Catalog Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar producto por nombre o categoría..."
              value={searchProduct}
              disabled={loading || fetchingData}
              onChange={(e) => {
                setSearchProduct(e.target.value);
                setProductPage(1);
              }}
              className="w-full pl-10 glass-input disabled:opacity-50"
            />
          </div>

          {fetchingData ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-800 border-t-emerald-500"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 stroke-[1.5]" />
              <p className="text-sm">No se encontraron productos disponibles</p>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {paginatedProducts.map((p) => {
                const inCartCount = cart.find((i) => i.producto.id === p.id)?.cantidad || 0;
                const remainingStock = p.stock - inCartCount;

                return (
                  <div
                    key={p.id}
                    onClick={() => remainingStock > 0 && addToCart(p)}
                    className={`glass-card rounded-xl p-4 flex flex-col justify-between h-40 select-none transition-all ${
                      remainingStock <= 0 || loading ? 'opacity-40 cursor-not-allowed border-rose-500/20' : 'hover:scale-[1.02] cursor-pointer'
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500">{p.categoria || 'General'}</span>
                      <h4 className="font-semibold text-slate-200 line-clamp-2">{p.nombre}</h4>
                    </div>

                    <div className="flex justify-between items-end">
                      <span className="font-outfit text-lg font-extrabold text-slate-100">${Number(p.precio_usd).toFixed(2)}</span>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500">Disponible</p>
                        <p className={`text-xs font-bold ${remainingStock > 5 ? 'text-slate-400' : remainingStock > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {remainingStock} und
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Product Pagination Controls */}
            {filteredProducts.length > PRODUCTS_PER_PAGE && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-850">
                <span className="text-xs text-slate-500">
                  Pág. {productPage} de {totalProductPages} — {filteredProducts.length} productos
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={productPage === 1}
                    onClick={() => setProductPage(p => Math.max(p - 1, 1))}
                    className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Anterior
                  </button>
                  <button
                    disabled={productPage >= totalProductPages}
                    onClick={() => setProductPage(p => p + 1)}
                    className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1"
                  >
                    Siguiente
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
            </>
          )}


        </div>

        {/* Right Col: Cart Summary */}
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <h3 className="font-outfit text-lg font-bold flex items-center gap-2 border-b border-slate-850 pb-4">
            <ShoppingBag className="h-5 w-5 text-emerald-400" />
            Carrito de Compra
          </h3>

          {/* Client Selector (Searchable Autocomplete Combobox) */}
          <div className="flex flex-col gap-1.5" ref={clientSearchRef}>
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Cliente de la Venta</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar cliente por nombre o cédula..."
                  value={clientSearchInput}
                  disabled={loading || fetchingData}
                  onFocus={() => setClientDropdownOpen(true)}
                  onChange={(e) => {
                    setClientSearchInput(e.target.value);
                    setClientDropdownOpen(true);
                    if (e.target.value === '') {
                      setSelectedClientId('');
                      setSelectedClientName('');
                    }
                  }}
                  className="w-full pl-9 pr-8 glass-input disabled:opacity-50"
                />
                
                {selectedClientId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClientId('');
                      setSelectedClientName('');
                      setClientSearchInput('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 cursor-pointer"
                    aria-label="Limpiar cliente"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}

                {/* Autocomplete Dropdown */}
                {clientDropdownOpen && (
                  <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-slate-950/95 border border-slate-800 rounded-xl shadow-2xl divide-y divide-slate-900/50 backdrop-blur-xl">
                    {filteredClients.length === 0 ? (
                      <div className="p-3 text-xs text-slate-500 text-center">
                        No se encontraron clientes activos
                      </div>
                    ) : (
                      filteredClients.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedClientId(c.id);
                            setSelectedClientName(`${c.nombre} (${c.cedula})`);
                            setClientSearchInput(`${c.nombre} (${c.cedula})`);
                            setClientDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-slate-900 flex flex-col ${
                            selectedClientId === c.id ? 'bg-slate-900 text-emerald-400 font-semibold' : 'text-slate-300'
                          }`}
                        >
                          <span>{c.nombre}</span>
                          <span className="text-[10px] text-slate-500">CI: {c.cedula} {c.telefono ? `• ${c.telefono}` : ''}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsClientModalOpen(true)}
                disabled={loading || fetchingData}
                className="btn-secondary py-2.5 px-3 rounded-lg flex items-center justify-center cursor-pointer hover:border-emerald-500 hover:text-emerald-400 transition-colors"
                title="Registrar cliente rápido"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Cart items list */}
          <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1 scrollbar-cart">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm">El carrito está vacío</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.producto.id} className="flex justify-between items-center gap-3 p-3 bg-slate-950/40 border border-slate-900 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">{item.producto.nombre}</p>
                    <p className="text-xs text-slate-400">${Number(item.producto.precio_usd).toFixed(2)} c/u</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.producto.id, -1)}
                      disabled={loading}
                      className="p-1 text-slate-400 hover:text-slate-200 bg-slate-900 rounded cursor-pointer disabled:opacity-35"
                      aria-label={`Disminuir cantidad de ${item.producto.nombre}`}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-sm font-bold w-6 text-center text-slate-200">{item.cantidad}</span>
                    <button
                      onClick={() => updateQuantity(item.producto.id, 1)}
                      disabled={loading}
                      className="p-1 text-slate-400 hover:text-slate-200 bg-slate-900 rounded cursor-pointer disabled:opacity-35"
                      aria-label={`Aumentar cantidad de ${item.producto.nombre}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.producto.id)}
                      disabled={loading}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer ml-1 disabled:opacity-35"
                      aria-label={`Eliminar ${item.producto.nombre} del carrito`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing Totals */}
          <div className="space-y-2.5 border-t border-slate-850 pt-4 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal USD:</span>
              <span className="font-semibold text-slate-200">${calculateTotalUsd().toFixed(2)}</span>
            </div>
            {latestTasa && (
              <div className="flex justify-between text-slate-400">
                <span>Tasa BCV:</span>
                <span>Bs. {latestTasa.tasa_usd.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold border-t border-slate-850 pt-3 text-slate-100">
              <span>Total Estimado Bs:</span>
              <span className="text-emerald-400">Bs. {calculateTotalBs().toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={handleCheckout}
            disabled={loading || cart.length === 0 || !selectedClientId}
            className="w-full btn-primary py-3 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></div>
            ) : (
              <>
                <FileText className="h-5 w-5" />
                <span>Registrar Venta (Idempotente)</span>
              </>
            )}
          </button>

          <div className="text-[10px] text-slate-600 text-center uppercase tracking-wider">
            Key: {idempotencyKey.substring(0, 25)}...
          </div>
        </div>
      </div>

      {/* Quick Client Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-850 p-6 shadow-2xl relative">
            <button
              onClick={() => setIsClientModalOpen(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-200 cursor-pointer"
              aria-label="Cerrar modal de cliente"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-outfit text-xl font-bold mb-4">Registro Rápido de Cliente</h3>
            <form onSubmit={handleQuickClientSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={clientNombre}
                  onChange={(e) => setClientNombre(e.target.value)}
                  className="w-full glass-input"
                  placeholder="ej. Juan Pérez"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Cédula</label>
                <input
                  type="text"
                  required
                  value={clientCedula}
                  onChange={(e) => setClientCedula(e.target.value)}
                  className="w-full glass-input"
                  placeholder="ej. V-12345678"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Teléfono (Opcional)</label>
                <input
                  type="text"
                  value={clientTelefono}
                  onChange={(e) => setClientTelefono(e.target.value)}
                  className="w-full glass-input"
                  placeholder="ej. 0412-1234567"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Correo Electrónico (Opcional)</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full glass-input"
                  placeholder="ej. ejemplo@correo.com"
                />
              </div>

              <div className="flex gap-3 pt-4 justify-end">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="btn-secondary py-2"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingClient}
                  className="btn-primary py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingClient ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Registrar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
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
    </div>
  );
};

export default Ventas;
