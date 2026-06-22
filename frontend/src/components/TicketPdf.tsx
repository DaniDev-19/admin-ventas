import { jsPDF } from 'jspdf';

export interface TicketItem {
  producto: {
    nombre: string;
    precio_usd: number;
  };
  cantidad: number;
}

export interface TicketDetails {
  invoiceKey: string;
  clientName: string;
  clientCedula?: string;
  date: string;
  totalUsd: number;
  tasa: number;
  totalBs: number;
  items: TicketItem[];
}

export const generateTicketPdf = (details: TicketDetails): jsPDF => {
  const margin = 5;
  const width = 80;
  const contentWidth = width - (margin * 2);

  // 1. Dry run to calculate the dynamic page height based on wrapped text
  const tempDoc = new jsPDF({ unit: 'mm', format: [80, 1000] });
  tempDoc.setFont('helvetica', 'normal');
  tempDoc.setFontSize(8.5);

  let currentY = 25; // Initial space for header
  
  // Client Info height
  currentY += 4.5; // Transacción
  currentY += 4.5; // Fecha
  const clientNameLines = tempDoc.splitTextToSize(details.clientName, contentWidth - 18);
  currentY += Math.max(4.5, clientNameLines.length * 3.5); // Cliente
  
  if (details.clientCedula) {
    currentY += 4.5; // Cédula
  }
  
  currentY += 6; // separator + table header space
  currentY += 6; // table header text + line

  // Items table height
  details.items.forEach((item) => {
    const splitName = tempDoc.splitTextToSize(item.producto.nombre, 34);
    const rowHeight = Math.max(splitName.length * 4, 5.5);
    currentY += rowHeight;
  });

  currentY += 4;  // line after items
  currentY += 5;  // Total USD
  currentY += 4.5;// Tasa Cambio
  currentY += 3.5;// line before Total Bs
  currentY += 6;  // Total Bs
  currentY += 4;  // line after Total Bs
  currentY += 10; // Footer message
  currentY += 10; // Bottom padding margin

  const pageHeight = Math.max(120, Math.ceil(currentY));

  // 2. Real document generation with exact height
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, pageHeight]
  });

  // Setup styles
  doc.setTextColor(17, 24, 39); // Slate-900 equivalent

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(import.meta.env.VITE_NAME_BUSSINE || 'Single Sales', width / 2, 11, { align: 'center' });

  // Header Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Control de Ventas & Facturación', width / 2, 15, { align: 'center' });

  // Top Line separator
  doc.setLineWidth(0.15);
  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.line(margin, 19, width - margin, 19);

  // Transaction details
  doc.setFontSize(8);
  let y = 24;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Transacción:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(details.invoiceKey, margin + 18, y);

  y += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(details.date, margin + 18, y);

  y += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(clientNameLines, margin + 18, y);
  y += Math.max(4.5, clientNameLines.length * 3.5) - 4.5;

  if (details.clientCedula) {
    y += 4.5;
    doc.setFont('helvetica', 'bold');
    doc.text('Cédula:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(details.clientCedula, margin + 18, y);
  }

  y += 6;
  doc.line(margin, y, width - margin, y);

  // Table Headers
  y += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.text('Desc.', margin, y);
  doc.text('Cant.', width - 36, y, { align: 'center' });
  doc.text('Precio', width - 20, y, { align: 'right' });
  doc.text('Total', width - margin, y, { align: 'right' });

  y += 2.5;
  doc.line(margin, y, width - margin, y);

  // Table Rows
  doc.setFont('helvetica', 'normal');
  details.items.forEach((item) => {
    y += 4.5;
    const name = item.producto.nombre;
    const splitName = doc.splitTextToSize(name, 34);

    // Draw wrapped description
    doc.text(splitName, margin, y);

    const qty = item.cantidad.toString();
    const price = `$${Number(item.producto.precio_usd).toFixed(2)}`;
    const total = `$${(Number(item.producto.precio_usd) * item.cantidad).toFixed(2)}`;

    // Align columns to first line of wrapped description
    doc.text(qty, width - 36, y, { align: 'center' });
    doc.text(price, width - 20, y, { align: 'right' });
    doc.text(total, width - margin, y, { align: 'right' });

    const rowHeight = Math.max(splitName.length * 4, 5.5);
    y += rowHeight - 4.5; // adjust y for the next item
  });

  y += 4.5;
  doc.line(margin, y, width - margin, y);

  // Totals Section
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text('Total USD:', margin, y);
  doc.setFont('helvetica', 'bold');
  doc.text(`$${details.totalUsd.toFixed(2)}`, width - margin, y, { align: 'right' });

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.text('Tasa Cambio:', margin, y);
  doc.text(`Bs. {${details.tasa.toFixed(2)}}`.replace('{', '').replace('}', ''), width - margin, y, { align: 'right' });

  y += 3.5;
  doc.line(margin, y, width - margin, y);

  y += 5.5;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL BS:', margin, y);
  doc.text(`Bs. ${details.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, width - margin, y, { align: 'right' });

  y += 5;
  doc.line(margin, y, width - margin, y);

  // Footer Message
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('¡Gracias por su compra!', width / 2, y, { align: 'center' });

  return doc;
};
