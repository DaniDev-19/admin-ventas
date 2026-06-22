import { Request, Response, NextFunction } from 'express';
import { ReportsService } from '../services/reports.service';
import { generateExcelReport, ExcelColumnOption } from '../utils/excel.utils';
import { generatePdfReport, PdfColumnOption } from '../utils/pdf.utils';
import { enrichAndNext } from '../utils/nextError';

// Formateadores utilitarios para PDF
const formatCurrencyUsd = (val: any) => `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatCurrencyBs = (val: any) => `Bs. ${Number(val || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatNumber = (val: any) => Number(val || 0).toLocaleString('en-US');

/**
 * EXPORTAR REPORTES DE VENTAS
 */
export const exportSalesExcel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const reportsService = new ReportsService(req.prisma!);
    const data = await reportsService.getSalesData(start, end);

    const columns: ExcelColumnOption[] = [
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Cliente', key: 'cliente_nombre', width: 25 },
      { header: 'Cédula', key: 'cliente_cedula', width: 15 },
      { header: 'Producto', key: 'producto', width: 25 },
      { header: 'Categoría', key: 'categoria', width: 18 },
      { header: 'Cant.', key: 'cantidad', numFmt: '#,##0' },
      { header: 'Precio USD', key: 'precio_usd', numFmt: '$#,##0.00' },
      { header: 'Total USD', key: 'total_usd', numFmt: '$#,##0.00' },
      { header: 'Tasa Cambio (Bs)', key: 'tasa_usd', numFmt: '#,##0.00' },
      { header: 'Total Bs', key: 'total_bs', numFmt: '#,##0.00' },
      { header: 'Estado', key: 'status', width: 12 },
    ];

    await generateExcelReport(res, {
      title: 'Reporte Detallado de Ventas',
      sheetName: 'Ventas',
      columns,
      rows: data,
      filename: `reporte_ventas_${new Date().toISOString().split('T')[0]}.xlsx`,
    });
  } catch (error) {
    enrichAndNext(error, next);
  }
};

export const exportSalesPdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const reportsService = new ReportsService(req.prisma!);
    const data = await reportsService.getSalesData(start, end);

    const columns: PdfColumnOption[] = [
      { header: 'Fecha', key: 'fecha', width: 55 },
      { header: 'Cliente', key: 'cliente_nombre', width: 90 },
      { header: 'Producto', key: 'producto', width: 85 },
      { header: 'Cant.', key: 'cantidad', width: 30, align: 'center' },
      { header: 'P. USD', key: 'precio_usd', width: 55, align: 'right', format: formatCurrencyUsd },
      { header: 'T. USD', key: 'total_usd', width: 55, align: 'right', format: formatCurrencyUsd },
      { header: 'Tasa (Bs)', key: 'tasa_usd', width: 45, align: 'right', format: (val) => Number(val).toFixed(2) },
      { header: 'Total Bs', key: 'total_bs', width: 72, align: 'right', format: formatCurrencyBs },
      { header: 'Estado', key: 'status', width: 25, align: 'center' },
    ];

    generatePdfReport(res, {
      title: 'Reporte de Ventas Histórico',
      columns,
      rows: data,
      filename: `reporte_ventas_${new Date().toISOString().split('T')[0]}.pdf`,
    });
  } catch (error) {
    enrichAndNext(error, next);
  }
};

/**
 * EXPORTAR REPORTES DE INVENTARIO
 */
export const exportInventoryExcel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportsService = new ReportsService(req.prisma!);
    const data = await reportsService.getInventoryData();

    const columns: ExcelColumnOption[] = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Producto', key: 'nombre', width: 30 },
      { header: 'Categoría', key: 'categoria', width: 20 },
      { header: 'Precio USD', key: 'precio_usd', numFmt: '$#,##0.00' },
      { header: 'Stock Almacén', key: 'stock', numFmt: '#,##0' },
      { header: 'Valor Total USD', key: 'valor_total_usd', numFmt: '$#,##0.00' },
      { header: 'Valor Equiv. Bs', key: 'valor_total_bs', numFmt: '#,##0.00' },
      { header: 'Estado', key: 'status', width: 15 },
    ];

    await generateExcelReport(res, {
      title: 'Reporte de Estado y Valorización de Inventario',
      sheetName: 'Inventario',
      columns,
      rows: data,
      filename: `reporte_inventario_${new Date().toISOString().split('T')[0]}.xlsx`,
    });
  } catch (error) {
    enrichAndNext(error, next);
  }
};

export const exportInventoryPdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportsService = new ReportsService(req.prisma!);
    const data = await reportsService.getInventoryData();

    const columns: PdfColumnOption[] = [
      { header: 'ID', key: 'id', width: 30, align: 'center' },
      { header: 'Producto', key: 'nombre', width: 140 },
      { header: 'Categoría', key: 'categoria', width: 82 },
      { header: 'P. USD', key: 'precio_usd', width: 55, align: 'right', format: formatCurrencyUsd },
      { header: 'Stock', key: 'stock', width: 45, align: 'center', format: formatNumber },
      { header: 'Val. USD', key: 'valor_total_usd', width: 75, align: 'right', format: formatCurrencyUsd },
      { header: 'Val. Bs', key: 'valor_total_bs', width: 85, align: 'right', format: formatCurrencyBs },
    ];

    generatePdfReport(res, {
      title: 'Valorización del Inventario de Productos',
      columns,
      rows: data,
      filename: `reporte_inventario_${new Date().toISOString().split('T')[0]}.pdf`,
    });
  } catch (error) {
    enrichAndNext(error, next);
  }
};

/**
 * EXPORTAR REPORTES DE CUENTAS POR COBRAR (DEUDAS)
 */
export const exportDebtsExcel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportsService = new ReportsService(req.prisma!);
    const data = await reportsService.getDebtsData();

    const columns: ExcelColumnOption[] = [
      { header: 'Cédula', key: 'cedula', width: 15 },
      { header: 'Cliente', key: 'nombre', width: 25 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'Estado Cliente', key: 'status', width: 15 },
      { header: 'Compras Pendientes', key: 'compras_pendientes', numFmt: '#,##0' },
      { header: 'Deuda Total USD', key: 'deuda_usd', numFmt: '$#,##0.00' },
      { header: 'Deuda Total Bs', key: 'deuda_bs', numFmt: '#,##0.00' },
    ];

    await generateExcelReport(res, {
      title: 'Cuentas por Cobrar y Clientes Deudores',
      sheetName: 'Deudores',
      columns,
      rows: data,
      filename: `reporte_cuentas_cobrar_${new Date().toISOString().split('T')[0]}.xlsx`,
    });
  } catch (error) {
    enrichAndNext(error, next);
  }
};

export const exportDebtsPdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportsService = new ReportsService(req.prisma!);
    const data = await reportsService.getDebtsData();

    const columns: PdfColumnOption[] = [
      { header: 'Cédula', key: 'cedula', width: 70 },
      { header: 'Cliente', key: 'nombre', width: 130 },
      { header: 'Teléfono', key: 'telefono', width: 75 },
      { header: 'Ventas Pend.', key: 'compras_pendientes', width: 65, align: 'center', format: formatNumber },
      { header: 'Deuda USD', key: 'deuda_usd', width: 82, align: 'right', format: formatCurrencyUsd },
      { header: 'Deuda Bs', key: 'deuda_bs', width: 90, align: 'right', format: formatCurrencyBs },
    ];

    generatePdfReport(res, {
      title: 'Reporte de Cuentas por Cobrar Administrativas',
      columns,
      rows: data,
      filename: `reporte_cuentas_cobrar_${new Date().toISOString().split('T')[0]}.pdf`,
    });
  } catch (error) {
    enrichAndNext(error, next);
  }
};
/**
 * EXPORTAR REPORTES DE PRODUCTOS MÁS VENDIDOS (TOP SELLERS)
 */
export const exportTopSellersExcel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportsService = new ReportsService(req.prisma!);
    const data = await reportsService.getTopSellersData();

    const columns: ExcelColumnOption[] = [
      { header: 'ID Producto', key: 'id', width: 12 },
      { header: 'Producto', key: 'nombre', width: 30 },
      { header: 'Categoría', key: 'categoria', width: 20 },
      { header: 'Cant. Vendida', key: 'cantidad_vendida', numFmt: '#,##0' },
      { header: 'Total USD', key: 'total_usd', numFmt: '$#,##0.00' },
      { header: 'Total Bs', key: 'total_bs', numFmt: '#,##0.00' },
      { header: 'Stock Restante', key: 'stock_actual', numFmt: '#,##0' },
    ];

    await generateExcelReport(res, {
      title: 'Reporte de Productos Más Vendidos',
      sheetName: 'Top Sellers',
      columns,
      rows: data,
      filename: `reporte_top_sellers_${new Date().toISOString().split('T')[0]}.xlsx`,
    });
  } catch (error) {
    enrichAndNext(error, next);
  }
};

export const exportTopSellersPdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportsService = new ReportsService(req.prisma!);
    const data = await reportsService.getTopSellersData();

    const columns: PdfColumnOption[] = [
      { header: 'ID', key: 'id', width: 30, align: 'center' },
      { header: 'Producto', key: 'nombre', width: 150 },
      { header: 'Categoría', key: 'categoria', width: 100 },
      { header: 'U. Vendidas', key: 'cantidad_vendida', width: 60, align: 'center', format: formatNumber },
      { header: 'Total USD', key: 'total_usd', width: 82, align: 'right', format: formatCurrencyUsd },
      { header: 'Total Bs', key: 'total_bs', width: 90, align: 'right', format: formatCurrencyBs },
    ];

    generatePdfReport(res, {
      title: 'Productos de Mayor Rotación (Top Sellers)',
      columns,
      rows: data,
      filename: `reporte_top_sellers_${new Date().toISOString().split('T')[0]}.pdf`,
    });
  } catch (error) {
    enrichAndNext(error, next);
  }
};

/**
 * EXPORTAR REPORTES DE VENTAS POR CATEGORÍA
 */
export const exportSalesByCategoryExcel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportsService = new ReportsService(req.prisma!);
    const data = await reportsService.getSalesByCategoryData();

    const columns: ExcelColumnOption[] = [
      { header: 'Categoría', key: 'categoria', width: 25 },
      { header: 'Transacciones', key: 'ventas_count', numFmt: '#,##0' },
      { header: 'Cant. Vendida', key: 'cantidad_vendida', numFmt: '#,##0' },
      { header: 'Total USD', key: 'total_usd', numFmt: '$#,##0.00' },
      { header: 'Total Bs', key: 'total_bs', numFmt: '#,##0.00' },
    ];

    await generateExcelReport(res, {
      title: 'Reporte de Ventas por Categoría de Producto',
      sheetName: 'Categorías',
      columns,
      rows: data,
      filename: `reporte_ventas_categoria_${new Date().toISOString().split('T')[0]}.xlsx`,
    });
  } catch (error) {
    enrichAndNext(error, next);
  }
};

export const exportSalesByCategoryPdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportsService = new ReportsService(req.prisma!);
    const data = await reportsService.getSalesByCategoryData();

    const columns: PdfColumnOption[] = [
      { header: 'Categoría', key: 'categoria', width: 170 },
      { header: 'Ventas Realizadas', key: 'ventas_count', width: 80, align: 'center', format: formatNumber },
      { header: 'Cant. Vendida', key: 'cantidad_vendida', width: 80, align: 'center', format: formatNumber },
      { header: 'Total USD', key: 'total_usd', width: 90, align: 'right', format: formatCurrencyUsd },
      { header: 'Total Bs', key: 'total_bs', width: 92, align: 'right', format: formatCurrencyBs },
    ];

    generatePdfReport(res, {
      title: 'Rendimiento Comercial por Categoría',
      columns,
      rows: data,
      filename: `reporte_ventas_categoria_${new Date().toISOString().split('T')[0]}.pdf`,
    });
  } catch (error) {
    enrichAndNext(error, next);
  }
};

/**
 * EXPORTAR REPORTES DE CLIENTES VIP
 */
export const exportVipClientsExcel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportsService = new ReportsService(req.prisma!);
    const data = await reportsService.getVipClientsData();

    const columns: ExcelColumnOption[] = [
      { header: 'Cédula', key: 'cedula', width: 15 },
      { header: 'Cliente', key: 'nombre', width: 25 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'Compras Realizadas', key: 'cantidad_compras', numFmt: '#,##0' },
      { header: 'Total USD', key: 'total_usd', numFmt: '$#,##0.00' },
      { header: 'Total Bs', key: 'total_bs', numFmt: '#,##0.00' },
    ];

    await generateExcelReport(res, {
      title: 'Reporte de Clientes VIP (Mayores Compras)',
      sheetName: 'Clientes VIP',
      columns,
      rows: data,
      filename: `reporte_clientes_vip_${new Date().toISOString().split('T')[0]}.xlsx`,
    });
  } catch (error) {
    enrichAndNext(error, next);
  }
};

export const exportVipClientsPdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportsService = new ReportsService(req.prisma!);
    const data = await reportsService.getVipClientsData();

    const columns: PdfColumnOption[] = [
      { header: 'Cédula', key: 'cedula', width: 80 },
      { header: 'Cliente', key: 'nombre', width: 140 },
      { header: 'Teléfono', key: 'telefono', width: 80 },
      { header: 'Compras', key: 'cantidad_compras', width: 60, align: 'center', format: formatNumber },
      { header: 'Total USD', key: 'total_usd', width: 72, align: 'right', format: formatCurrencyUsd },
      { header: 'Total Bs', key: 'total_bs', width: 80, align: 'right', format: formatCurrencyBs },
    ];

    generatePdfReport(res, {
      title: 'Clientes de Mayor Consumo (VIP)',
      columns,
      rows: data,
      filename: `reporte_clientes_vip_${new Date().toISOString().split('T')[0]}.pdf`,
    });
  } catch (error) {
    enrichAndNext(error, next);
  }
};

/**
 * EXPORTAR REPORTES DE CIERRE DE CAJA DIARIO
 */
export const exportDailyCashCloseExcel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportsService = new ReportsService(req.prisma!);
    const data = await reportsService.getDailyCashCloseData();

    const columns: ExcelColumnOption[] = [
      { header: 'Estado de Venta', key: 'status', width: 25 },
      { header: 'Transacciones', key: 'cantidad_transacciones', numFmt: '#,##0' },
      { header: 'Total USD', key: 'total_usd', numFmt: '$#,##0.00' },
      { header: 'Total Bs', key: 'total_bs', numFmt: '#,##0.00' },
    ];

    await generateExcelReport(res, {
      title: 'Cierre de Caja Diario (Ventas del Día)',
      sheetName: 'Cierre Diario',
      columns,
      rows: data,
      filename: `reporte_cierre_caja_${new Date().toISOString().split('T')[0]}.xlsx`,
    });
  } catch (error) {
    enrichAndNext(error, next);
  }
};

export const exportDailyCashClosePdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportsService = new ReportsService(req.prisma!);
    const data = await reportsService.getDailyCashCloseData();

    const columns: PdfColumnOption[] = [
      { header: 'Estado de Venta', key: 'status', width: 140 },
      { header: 'Transacciones', key: 'cantidad_transacciones', width: 100, align: 'center', format: formatNumber },
      { header: 'Total USD', key: 'total_usd', width: 130, align: 'right', format: formatCurrencyUsd },
      { header: 'Total Bs', key: 'total_bs', width: 142, align: 'right', format: formatCurrencyBs },
    ];

    generatePdfReport(res, {
      title: 'Conciliación y Cierre de Caja Diario',
      columns,
      rows: data,
      filename: `reporte_cierre_caja_${new Date().toISOString().split('T')[0]}.pdf`,
    });
  } catch (error) {
    enrichAndNext(error, next);
  }
};

export default {
  exportSalesExcel,
  exportSalesPdf,
  exportInventoryExcel,
  exportInventoryPdf,
  exportDebtsExcel,
  exportDebtsPdf,
  exportTopSellersExcel,
  exportTopSellersPdf,
  exportSalesByCategoryExcel,
  exportSalesByCategoryPdf,
  exportVipClientsExcel,
  exportVipClientsPdf,
  exportDailyCashCloseExcel,
  exportDailyCashClosePdf,
};
