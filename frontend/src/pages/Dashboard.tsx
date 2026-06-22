import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ventasService } from '../api/ventasService';
import { productosService } from '../api/productosService';
import { clientesService } from '../api/clientesService';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Venta {
  id: number;
  clientes_id: number;
  productos_id: number;
  cantidad: number;
  precio_unitario: number;
  total: number;
  status: string;
  created_at: string;
}

export const Dashboard: React.FC = () => {
  const [sales, setSales] = useState<Venta[]>([]);
  const [productsCount, setProductsCount] = useState(0);
  const [clientsCount, setClientsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [salesRes, prodRes, cliRes] = await Promise.all([
          ventasService.getAll({ limit: 100 }),
          productosService.getAll({ limit: 1 }),
          clientesService.getAll({ limit: 1 }),
        ]);

        if (salesRes && salesRes.data) {
          setSales(salesRes.data);
        }
        if (prodRes) {
          setProductsCount(prodRes.total || 0);
        }
        if (cliRes) {
          setClientsCount(cliRes.total || 0);
        }
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalRevenue = sales
    .filter((v) => v.status === 'pagada')
    .reduce((sum, v) => sum + Number(v.total), 0);

  // Grouping sales by date (last 7 days)
  const getDailySalesData = () => {
    const dataMap: { [dateStr: string]: number } = {};
    const dates: string[] = [];

    // Initialize the last 7 days with 0
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
      dataMap[dateStr] = 0;
      dates.push(dateStr);
    }

    sales
      .filter((v) => v.status === 'pagada')
      .forEach((v) => {
        if (v.created_at) {
          const d = new Date(v.created_at);
          const dateStr = d.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
          if (dataMap[dateStr] !== undefined) {
            dataMap[dateStr] += Number(v.total);
          }
        }
      });

    return dates.map((label) => ({ label, value: dataMap[label] }));
  };

  const chartData = getDailySalesData();
  const maxValue = Math.max(...chartData.map((d) => d.value), 10);

  // Chart coordinates
  const points = chartData.map((d, i) => {
    const x = 45 + i * (435 / 6);
    const y = 170 - (d.value / maxValue) * 150;
    return { x, y, label: d.label, value: d.value };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} 170 L ${points[0].x} 170 Z`
    : '';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pagada':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/25">
            <CheckCircle className="h-3 w-3" /> Pagada
          </span>
        );
      case 'no_pagada':
      case 'debe':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold text-rose-450 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/25">
            <AlertCircle className="h-3 w-3" /> Debe
          </span>
        );
      case 'parcialmente_pagada':
      case 'pago_parcial':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold text-amber-450 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/25">
            <AlertCircle className="h-3 w-3" /> Pago Parcial
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-500/10 px-2.5 py-1 rounded-full border border-slate-500/25">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-emerald-500"></div>
          <p className="text-slate-400 text-sm animate-pulse">Cargando métricas del negocio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div>
        <h2 className="font-outfit text-3xl font-extrabold tracking-tight">Inicio comercial</h2>
        <p className="text-sm text-slate-400 mt-1">Métricas de facturación, estado comercial de inventario y cuentas.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total revenue card */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-300"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Ventas Totales (Pagadas)</span>
              <p className="font-outfit text-3xl font-bold tracking-tight text-slate-100">
                ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Sales count card */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-300"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Transacciones</span>
              <p className="font-outfit text-3xl font-bold tracking-tight text-slate-100">
                {sales.length}
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
              <ShoppingBag className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Products card */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all duration-300"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Productos Activos</span>
              <p className="font-outfit text-3xl font-bold tracking-tight text-slate-100">
                {productsCount}
              </p>
            </div>
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
              <Package className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Clients card */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-300"></div>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Clientes Registrados</span>
              <p className="font-outfit text-3xl font-bold tracking-tight text-slate-100">
                {clientsCount}
              </p>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Split: POS Shortcut & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quick Actions and shortcuts */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="font-outfit text-lg font-bold">Operaciones rápidas</h3>
            <div className="grid grid-cols-1 gap-3">
              <Link to="/ventas" className="btn-primary w-full py-3 text-slate-950">
                <span>Ir al Punto de Venta (POS)</span>
                <ArrowRight className="h-4 w-4 text-slate-950" />
              </Link>
              <Link to="/reportes" className="btn-secondary w-full py-3">
                <span>Ver Reportes de Inteligencia</span>
                <ArrowRight className="h-4 w-4 animate-pulse" />
              </Link>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="font-outfit text-lg font-bold">Estado Operativo</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Idempotencia de POS:</span>
                <span className="text-emerald-400 font-semibold">Habilitada (Redis/Postgres)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Bloqueos de Stock:</span>
                <span className="text-emerald-400 font-semibold">Pesimistas (FOR UPDATE)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Histórico de Tasas:</span>
                <span className="text-emerald-400 font-semibold">Inmutable (Garantía Histórica)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Chart & Recent Transactions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sales Performance Area/Line Chart */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="space-y-1">
                <h3 className="font-outfit text-base font-bold flex items-center gap-2">
                  <TrendingUp className="h-4.5 w-4.5 text-emerald-400" />
                  Rendimiento de Ventas (Últimos 7 días)
                </h3>
                <p className="text-xs text-slate-400">Facturación diaria en USD de ventas cobradas.</p>
              </div>
              {hoveredIndex !== null ? (
                <div className="text-right bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg animate-fade-in">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">{points[hoveredIndex].label}</span>
                  <span className="text-sm font-bold text-emerald-400">${points[hoveredIndex].value.toFixed(2)}</span>
                </div>
              ) : (
                <div className="text-right text-xs text-slate-500 italic">
                  Pasa el cursor por la gráfica
                </div>
              )}
            </div>

            <div className="relative w-full overflow-hidden mt-6">
              <svg viewBox="0 0 500 200" className="w-full h-auto text-slate-400">
                <defs>
                  <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="45" y1="20" x2="480" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="45" y1="70" x2="480" y2="70" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="45" y1="120" x2="480" y2="120" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="45" y1="170" x2="480" y2="170" stroke="#334155" />

                {/* Y-Axis Labels */}
                <text x="35" y="23" textAnchor="end" className="text-[9px] fill-slate-500 font-mono font-semibold">${maxValue.toFixed(0)}</text>
                <text x="35" y="73" textAnchor="end" className="text-[9px] fill-slate-500 font-mono font-semibold">${(maxValue * 2 / 3).toFixed(0)}</text>
                <text x="35" y="123" textAnchor="end" className="text-[9px] fill-slate-500 font-mono font-semibold">${(maxValue * 1 / 3).toFixed(0)}</text>
                <text x="35" y="173" textAnchor="end" className="text-[9px] fill-slate-500 font-mono font-semibold">$0</text>

                {/* Area Path */}
                {areaPath && <path d={areaPath} fill="url(#chart-grad)" />}

                {/* Line Path */}
                {linePath && <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

                {/* Interactive Hover Areas / Circles */}
                {points.map((p, i) => (
                  <g
                    key={i}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Invisible larger hover circle */}
                    <circle cx={p.x} cy={p.y} r="12" fill="transparent" />
                    {/* Outer pulsing hover circle */}
                    {hoveredIndex === i && (
                      <circle cx={p.x} cy={p.y} r="7" fill="#10b981" opacity="0.4" />
                    )}
                    {/* Inner solid circle */}
                    <circle cx={p.x} cy={p.y} r="4" fill={hoveredIndex === i ? '#ffffff' : '#10b981'} stroke="#0f172a" strokeWidth="1.5" />
                  </g>
                ))}

                {/* X-Axis Labels */}
                {points.map((p, i) => (
                  <text key={i} x={p.x} y="190" textAnchor="middle" className="text-[9px] fill-slate-500 font-semibold">{p.label}</text>
                ))}
              </svg>
            </div>
          </div>

          {/* Recent Sales Table */}
          <div className="glass-card rounded-2xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-outfit text-lg font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-400" />
                Ventas Recientes
              </h3>
              <Link to="/historial" className="text-sm text-emerald-400 hover:text-emerald-350 transition-colors font-medium">
                Ver todas
              </Link>
            </div>

            <div className="flex-1 overflow-x-auto">
              {sales.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                  <ShoppingBag className="h-10 w-10 mb-2 stroke-[1.5]" />
                  <p className="text-sm">No se han registrado ventas hoy</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="pb-3">ID Venta</th>
                      <th className="pb-3">Fecha</th>
                      <th className="pb-3 text-right">Monto (USD)</th>
                      <th className="pb-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {sales.slice(0, 5).map((v) => (
                      <tr key={v.id} className="hover:bg-slate-900/10">
                        <td className="py-3.5 font-semibold text-slate-300">#{v.id}</td>
                        <td className="py-3.5 text-slate-400">
                          {v.created_at ? new Date(v.created_at).toLocaleDateString() : 'Hoy'}
                        </td>
                        <td className="py-3.5 text-right font-bold text-slate-200">
                          ${Number(v.total).toFixed(2)}
                        </td>
                        <td className="py-3.5 text-center flex items-center justify-center">
                          {getStatusBadge(v.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
