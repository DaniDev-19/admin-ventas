import {
    Layers,
    Users,
    TrendingUp,
    Package,
    CheckCircle,
    Clock
} from 'lucide-react';

export const reportCards = [
    {
        title: 'Historial General de Ventas',
        description: 'Reporte completo de todas las ventas registradas con filtrado opcional por fecha.',
        endpoint: '/reports/sales',
        filename: 'reporte_ventas',
        icon: Clock,
        color: 'from-blue-500 to-indigo-600',
        hasDates: true
    },
    {
        title: 'Valorización de Inventario',
        description: 'Estado actual del inventario de productos y cálculo del valor total en USD y Bs.',
        endpoint: '/reports/inventory',
        filename: 'reporte_inventario',
        icon: Package,
        color: 'from-emerald-500 to-teal-600'
    },
    {
        title: 'Cuentas por Cobrar (Deudores)',
        description: 'Listado de clientes con deudas pendientes y montos acumulados.',
        endpoint: '/reports/debts',
        filename: 'reporte_deudores',
        icon: Users,
        color: 'from-amber-500 to-orange-600'
    },
    {
        title: 'Productos Más Vendidos (Top Sellers)',
        description: 'Rotación y demanda del catálogo de productos ordenada de mayor a menor consumo.',
        endpoint: '/reports/top-sellers',
        filename: 'reporte_top_sellers',
        icon: TrendingUp,
        color: 'from-purple-500 to-pink-600'
    },
    {
        title: 'Rendimiento por Categoría',
        description: 'Análisis comercial del rendimiento y transacciones consolidadas por departamento.',
        endpoint: '/reports/category',
        filename: 'reporte_ventas_categoria',
        icon: Layers,
        color: 'from-cyan-500 to-blue-600'
    },
    {
        title: 'Clientes de Mayor Consumo (VIP)',
        description: 'Identificación de los clientes más recurrentes y con mayor margen de facturación.',
        endpoint: '/reports/vip-clients',
        filename: 'reporte_clientes_vip',
        icon: Users,
        color: 'from-fuchsia-500 to-rose-600'
    },
    {
        title: 'Cierre de Caja Diario (Cuadre)',
        description: 'Cuadre de caja analítico para las transacciones realizadas durante el día actual.',
        endpoint: '/reports/daily-cash-close',
        filename: 'reporte_cierre_caja',
        icon: CheckCircle,
        color: 'from-teal-500 to-emerald-600'
    }
];