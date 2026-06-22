import React, { useState } from 'react';
import { reportsService } from '../api/reportsService';
import { useNotification } from '../context/NotificationContext';
import {
  FileText,
  Download,
} from 'lucide-react';
import { reportCards } from '../constants/reportsEmails';

export const Reportes: React.FC = () => {
  const { showToast } = useNotification();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  const handleDownload = async (endpoint: string, defaultFilename: string, type: 'excel' | 'pdf') => {
    const operationKey = `${endpoint}_${type}`;
    setLoading(operationKey);
    showToast(`Generando reporte en formato ${type.toUpperCase()}...`, 'info');
    try {
      const params: any = {};
      if (endpoint === '/reports/sales') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      const res = await reportsService.downloadReport(endpoint, type, params);

      const blob = new Blob([res.data], { type: res.headers['content-type'] ? String(res.headers['content-type']) : (type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') });
      if (type === 'pdf') {
        const fileURL = window.URL.createObjectURL(blob);
        window.open(fileURL, '_blank');
        showToast('¡Reporte generado con éxito y abierto en una nueva pestaña!', 'success');
      } else {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = defaultFilename;
        link.click();
        window.URL.revokeObjectURL(link.href);
        showToast('¡Reporte generado y descargado con éxito!', 'success');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      showToast('Error al generar el reporte. Verifique que la base de datos contenga registros para los filtros seleccionados.', 'error');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="font-outfit text-3xl font-extrabold tracking-tight">Reportes y Business Intelligence</h2>
        <p className="text-sm text-slate-400 mt-1">
          Exporta reportes analíticos de contabilidad y ventas en formatos corporativos PDF y Excel.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCards.map((report) => {
          const Icon = report.icon;
          const todayStr = new Date().toISOString().split('T')[0];

          return (
            <div key={report.endpoint} className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden group">
              <div className="space-y-4">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-r ${report.color} flex items-center justify-center text-slate-950 shadow-lg`}>
                  <Icon className="h-6 w-6 text-slate-950 font-bold" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-outfit text-lg font-bold text-slate-100">{report.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{report.description}</p>
                </div>

                {report.hasDates && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Desde</span>
                      <input
                        type="date"
                        value={startDate}
                        disabled={loading !== null}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="glass-input text-xs py-1.5 px-2.5 disabled:opacity-50"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Hasta</span>
                      <input
                        type="date"
                        value={endDate}
                        disabled={loading !== null}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="glass-input text-xs py-1.5 px-2.5 disabled:opacity-50"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleDownload(report.endpoint, `${report.filename}_${todayStr}.xlsx`, 'excel')}
                  disabled={loading !== null}
                  className="btn-secondary py-2 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === `${report.endpoint}_excel` ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border border-slate-400 border-t-transparent"></div>
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => handleDownload(report.endpoint, `${report.filename}_${todayStr}.pdf`, 'pdf')}
                  disabled={loading !== null}
                  className="btn-primary py-2 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === `${report.endpoint}_pdf` ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border border-slate-950 border-t-transparent"></div>
                  ) : (
                    <FileText className="h-3.5 w-3.5" />
                  )}
                  <span>PDF (.pdf)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Reportes;
