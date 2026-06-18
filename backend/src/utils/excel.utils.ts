import ExcelJS from 'exceljs';
import { Response } from 'express';

export interface ExcelColumnOption {
  header: string;
  key: string;
  width?: number;
  numFmt?: string; // Formato numérico de Excel (ej: '$#,##0.00', '0')
}

export async function generateExcelReport(
  res: Response,
  options: {
    title: string;
    sheetName?: string;
    columns: ExcelColumnOption[];
    rows: any[];
    filename: string;
  }
) {
  const { title, sheetName = 'Reporte', columns, rows, filename } = options;
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // 1. Título principal del Reporte
  worksheet.mergeCells('A1', `${String.fromCharCode(65 + columns.length - 1)}1`);
  const titleRow = worksheet.getRow(1);
  titleRow.getCell(1).value = title.toUpperCase();
  titleRow.getCell(1).font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } };
  titleRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '0F172A' }, // Slate 900
  };
  titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
  titleRow.height = 40;

  // Fila vacía para espacio
  worksheet.addRow([]);

  // 2. Cabeceras de la tabla
  const headerRow = worksheet.addRow(columns.map(c => c.header));
  headerRow.height = 28;
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E293B' }, // Slate 800
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: '475569' } },
      bottom: { style: 'medium', color: { argb: '0F172A' } },
      left: { style: 'thin', color: { argb: '475569' } },
      right: { style: 'thin', color: { argb: '475569' } },
    };
  });

  // 3. Filas de datos
  rows.forEach((rowData, index) => {
    const values = columns.map(col => rowData[col.key]);
    const row = worksheet.addRow(values);
    row.height = 20;

    const isEven = index % 2 === 0;

    row.eachCell((cell, colNumber) => {
      const colOption = columns[colNumber - 1];
      cell.font = { name: 'Arial', size: 10 };
      
      // Zebra striping
      if (isEven) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F8FAFC' }, // Slate 50
        };
      }

      // Bordes grises finos
      cell.border = {
        top: { style: 'thin', color: { argb: 'E2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
        left: { style: 'thin', color: { argb: 'E2E8F0' } },
        right: { style: 'thin', color: { argb: 'E2E8F0' } },
      };

      // Alineación y formatos específicos
      if (colOption.numFmt) {
        cell.numFmt = colOption.numFmt;
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (typeof cell.value === 'number') {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    });
  });

  // 4. Auto-ajustar ancho de las columnas dinámicamente
  columns.forEach((colOption, index) => {
    const column = worksheet.getColumn(index + 1);
    if (colOption.width) {
      column.width = colOption.width;
    } else {
      let maxLen = colOption.header.length;
      rows.forEach(r => {
        const val = r[colOption.key];
        if (val !== null && val !== undefined) {
          const strLen = String(val).length;
          if (strLen > maxLen) maxLen = strLen;
        }
      });
      column.width = Math.min(Math.max(maxLen + 4, 12), 40);
    }
  });

  // Configuración de las cabeceras Express
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  // Generamos el stream binario directo a la respuesta de Express
  await workbook.xlsx.write(res);
  res.end();
}
