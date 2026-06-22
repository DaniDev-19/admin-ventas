import type { PrismaClient } from "../generated/prisma/client";

export class ReportsService {
  constructor(private db: PrismaClient) {}

  /**
   * Obtiene las ventas registradas con datos de cliente, producto y tasa de cambio.
   */
  async getSalesData(startDate?: Date, endDate?: Date) {
    const where: any = {};
    
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = startDate;
      if (endDate) where.created_at.lte = endDate;
    }

    const ventas = await this.db.ventas.findMany({
      where,
      include: {
        clientes: {
          select: { nombre: true, cedula: true }
        },
        productos: {
          select: { nombre: true, categoria: true }
        },
        tasa_moneda: {
          select: { tasa_usd: true, tasa_euro: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Formateamos las filas para la generación de reportes
    return ventas.map(v => {
      const cantidad = Number(v.cantidad);
      const precioUsd = Number(v.precio_unitario);
      const totalUsd = cantidad * precioUsd;
      const tasaUsd = Number(v.tasa_moneda?.tasa_usd || 1);
      const totalBs = totalUsd * tasaUsd;

      return {
        id: v.id,
        fecha: v.created_at ? v.created_at.toISOString().split('T')[0] : 'N/A',
        cliente_nombre: v.clientes?.nombre || 'Consumidor Final',
        cliente_cedula: v.clientes?.cedula || 'N/A',
        producto: v.productos?.nombre || 'Producto Eliminado',
        categoria: v.productos?.categoria || 'General',
        cantidad,
        precio_usd: precioUsd,
        total_usd: totalUsd,
        tasa_usd: tasaUsd,
        total_bs: totalBs,
        status: v.status
      };
    });
  }

  /**
   * Obtiene la lista de productos del inventario y calcula su valorización total.
   */
  async getInventoryData() {
    const productos = await this.db.productos.findMany({
      orderBy: { nombre: 'asc' }
    });

    // Obtenemos la última tasa de cambio registrada para calcular el valor equivalente en Bs
    const ultimaTasa = await this.db.tasa_moneda.findFirst({
      orderBy: { id: 'desc' }
    });
    const tasaUsd = Number(ultimaTasa?.tasa_usd || 1);

    return productos.map(p => {
      const stock = Number(p.stock || 0);
      const precioUsd = Number(p.precio_usd || 0);
      const valorTotalUsd = stock * precioUsd;
      const valorTotalBs = valorTotalUsd * tasaUsd;

      return {
        id: p.id,
        nombre: p.nombre || 'N/A',
        categoria: p.categoria || 'General',
        precio_usd: precioUsd,
        stock,
        valor_total_usd: valorTotalUsd,
        valor_total_bs: valorTotalBs,
        status: p.status
      };
    });
  }

  /**
   * Obtiene los clientes que poseen deudas (ventas con status 'no_pagada')
   */
  async getDebtsData() {
    const clientesDeudores = await this.db.clientes.findMany({
      where: {
        ventas: {
          some: { status: 'no_pagada' }
        }
      },
      include: {
        ventas: {
          where: { status: 'no_pagada' },
          include: {
            tasa_moneda: {
              select: { tasa_usd: true }
            }
          }
        }
      },
      orderBy: { nombre: 'asc' }
    });

    return clientesDeudores.map(c => {
      let deudaTotalUsd = 0;
      let deudaTotalBs = 0;

      c.ventas.forEach(v => {
        const cant = Number(v.cantidad);
        const precio = Number(v.precio_unitario);
        const totalVentaUsd = cant * precio;
        const tasaVenta = Number(v.tasa_moneda?.tasa_usd || 1);

        deudaTotalUsd += totalVentaUsd;
        deudaTotalBs += (totalVentaUsd * tasaVenta);
      });

      return {
        cliente_id: c.id,
        cedula: c.cedula,
        nombre: c.nombre || 'N/A',
        telefono: c.telefono || 'N/A',
        status: c.status,
        compras_pendientes: c.ventas.length,
        deuda_usd: deudaTotalUsd,
        deuda_bs: deudaTotalBs
      };
    });
  }

  /**
   * Obtiene la rotación de inventario y los productos más vendidos.
   */
  async getTopSellersData() {
    const sales = await this.db.ventas.findMany({
      where: { status: 'pagada' },
      include: { productos: true }
    });

    const ultimaTasa = await this.db.tasa_moneda.findFirst({
      orderBy: { id: 'desc' }
    });
    const tasaUsd = Number(ultimaTasa?.tasa_usd || 1);

    const productsMap: Record<number, {
      id: number;
      nombre: string;
      categoria: string;
      cantidad_vendida: number;
      total_usd: number;
      total_bs: number;
      stock_actual: number;
    }> = {};

    sales.forEach(v => {
      const prodId = v.productos_id;
      const cant = Number(v.cantidad);
      const priceUsd = Number(v.precio_unitario);
      const totalUsd = cant * priceUsd;
      const totalBs = totalUsd * tasaUsd;

      if (!productsMap[prodId]) {
        productsMap[prodId] = {
          id: prodId,
          nombre: v.productos?.nombre || 'Producto Eliminado',
          categoria: v.productos?.categoria || 'General',
          cantidad_vendida: 0,
          total_usd: 0,
          total_bs: 0,
          stock_actual: v.productos?.stock || 0
        };
      }

      productsMap[prodId].cantidad_vendida += cant;
      productsMap[prodId].total_usd += totalUsd;
      productsMap[prodId].total_bs += totalBs;
    });

    return Object.values(productsMap).sort((a, b) => b.cantidad_vendida - a.cantidad_vendida);
  }

  /**
   * Obtiene las ventas consolidadas por categoría de producto.
   */
  async getSalesByCategoryData() {
    const sales = await this.db.ventas.findMany({
      where: { status: 'pagada' },
      include: { productos: true }
    });

    const ultimaTasa = await this.db.tasa_moneda.findFirst({
      orderBy: { id: 'desc' }
    });
    const tasaUsd = Number(ultimaTasa?.tasa_usd || 1);

    const categoryMap: Record<string, {
      categoria: string;
      ventas_count: number;
      cantidad_vendida: number;
      total_usd: number;
      total_bs: number;
    }> = {};

    sales.forEach(v => {
      const cat = v.productos?.categoria || 'General';
      const cant = Number(v.cantidad);
      const price = Number(v.precio_unitario);
      const totalUsd = cant * price;
      const totalBs = totalUsd * tasaUsd;

      if (!categoryMap[cat]) {
        categoryMap[cat] = {
          categoria: cat,
          ventas_count: 0,
          cantidad_vendida: 0,
          total_usd: 0,
          total_bs: 0
        };
      }

      categoryMap[cat].ventas_count += 1;
      categoryMap[cat].cantidad_vendida += cant;
      categoryMap[cat].total_usd += totalUsd;
      categoryMap[cat].total_bs += totalBs;
    });

    return Object.values(categoryMap).sort((a, b) => b.total_usd - a.total_usd);
  }

  /**
   * Obtiene la lista de clientes VIP (los que más compran/aportan ingresos).
   */
  async getVipClientsData() {
    const sales = await this.db.ventas.findMany({
      where: { status: 'pagada' },
      include: { clientes: true }
    });

    const ultimaTasa = await this.db.tasa_moneda.findFirst({
      orderBy: { id: 'desc' }
    });
    const tasaUsd = Number(ultimaTasa?.tasa_usd || 1);

    const clientsMap: Record<number, {
      cliente_id: number;
      cedula: string;
      nombre: string;
      telefono: string;
      cantidad_compras: number;
      total_usd: number;
      total_bs: number;
    }> = {};

    sales.forEach(v => {
      const cliId = v.clientes_id;
      const cant = Number(v.cantidad);
      const price = Number(v.precio_unitario);
      const totalUsd = cant * price;
      const totalBs = totalUsd * tasaUsd;

      if (!clientsMap[cliId]) {
        clientsMap[cliId] = {
          cliente_id: cliId,
          cedula: v.clientes?.cedula || 'N/A',
          nombre: v.clientes?.nombre || 'Consumidor Final',
          telefono: v.clientes?.telefono || 'N/A',
          cantidad_compras: 0,
          total_usd: 0,
          total_bs: 0
        };
      }

      clientsMap[cliId].cantidad_compras += 1;
      clientsMap[cliId].total_usd += totalUsd;
      clientsMap[cliId].total_bs += totalBs;
    });

    return Object.values(clientsMap).sort((a, b) => b.total_usd - a.total_usd);
  }

  /**
   * Obtiene la reconciliación o cierre de caja diario.
   */
  async getDailyCashCloseData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sales = await this.db.ventas.findMany({
      where: {
        created_at: {
          gte: today
        }
      },
      include: {
        tasa_moneda: true
      }
    });

    const statusMap: Record<string, {
      status: string;
      cantidad_transacciones: number;
      total_usd: number;
      total_bs: number;
    }> = {};

    sales.forEach(v => {
      const status = v.status;
      const cant = Number(v.cantidad);
      const price = Number(v.precio_unitario);
      const totalUsd = cant * price;
      const tasaUsd = Number(v.tasa_moneda?.tasa_usd || 1);
      const totalBs = totalUsd * tasaUsd;

      if (!statusMap[status]) {
        statusMap[status] = {
          status,
          cantidad_transacciones: 0,
          total_usd: 0,
          total_bs: 0
        };
      }

      statusMap[status].cantidad_transacciones += 1;
      statusMap[status].total_usd += totalUsd;
      statusMap[status].total_bs += totalBs;
    });

    return Object.values(statusMap);
  }
}
export default ReportsService;
