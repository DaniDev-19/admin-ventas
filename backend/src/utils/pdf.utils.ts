import PDFDocument from 'pdfkit';
import { Response } from 'express';

export interface PdfColumnOption {
  header: string;
  key: string;
  width: number; // Ancho absoluto de columna en puntos (el ancho total de la tabla en carta es ~512 pt)
  align?: 'left' | 'center' | 'right';
  format?: (val: any) => string;
}

export function generatePdfReport(
  res: Response,
  options: {
    title: string;
    columns: PdfColumnOption[];
    rows: any[];
    filename: string;
  }
) {
  const { title, columns, rows, filename } = options;

  // Creamos el documento PDF
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    bufferPages: true, // Requerido para numerar páginas con "de N" al final
  });

  // Cabeceras HTTP para descarga
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  // Tubería de stream de PDF a Response Express
  doc.pipe(res);

  let startY = 120;
  const rowHeight = 22;
  const pageHeightLimit = 700;
  const startX = 50;

  // Dibujar cabecera decorativa superior de página
  const drawPageHeader = (pageTitle: string) => {
    // Franja negra Slate
    doc.rect(0, 0, 612, 15).fill('#0F172A');

    // Título del reporte
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(16).text(pageTitle.toUpperCase(), 50, 40);
    
    // Metadatos
    doc.fillColor('#64748B').font('Helvetica').fontSize(8).text(`Generado: ${new Date().toLocaleString()}`, 50, 60);

    // Separador
    doc.moveTo(50, 75).lineTo(562, 75).strokeColor('#E2E8F0').lineWidth(1.2).stroke();
  };

  // Dibujar encabezado de tabla
  const drawTableHeader = (y: number) => {
    doc.rect(startX, y, 512, rowHeight).fill('#1E293B');

    let currentX = startX;
    columns.forEach(col => {
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9).text(
        col.header,
        currentX + 5,
        y + 6,
        { width: col.width - 10, align: col.align || 'left' }
      );
      currentX += col.width;
    });
  };

  // Primera página
  drawPageHeader(title);
  let currentY = startY;
  drawTableHeader(currentY);
  currentY += rowHeight;

  // Iterar y dibujar registros de tabla
  rows.forEach((rowData, index) => {
    // Control de paginación
    if (currentY > pageHeightLimit) {
      doc.addPage();
      drawPageHeader(title);
      currentY = startY;
      drawTableHeader(currentY);
      currentY += rowHeight;
    }

    const isEven = index % 2 === 0;

    // Zebra striping
    if (isEven) {
      doc.rect(startX, currentY, 512, rowHeight).fill('#F8FAFC');
    }

    // Línea inferior de la fila
    doc.moveTo(startX, currentY + rowHeight).lineTo(562, currentY + rowHeight).strokeColor('#F1F5F9').lineWidth(0.5).stroke();

    let currentX = startX;
    columns.forEach(col => {
      const rawVal = rowData[col.key];
      let valStr = '';

      if (col.format) {
        valStr = col.format(rawVal);
      } else if (rawVal !== null && rawVal !== undefined) {
        valStr = String(rawVal);
      }

      doc.fillColor('#334155').font('Helvetica').fontSize(8.5).text(
        valStr,
        currentX + 5,
        currentY + 6,
        { width: col.width - 10, align: col.align || 'left' }
      );
      currentX += col.width;
    });

    currentY += rowHeight;
  });

  // Numeración dinámica de pie de página recorriendo el buffer
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fillColor('#94A3B8').font('Helvetica').fontSize(8).text(
      `Página ${i + 1} de ${range.count}`,
      50,
      745,
      { align: 'center', width: 512 }
    );
  }

  // Finalizar y enviar stream
  doc.end();
}
