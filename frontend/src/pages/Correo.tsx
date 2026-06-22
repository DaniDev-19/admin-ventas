import React, { useEffect, useState } from 'react';
import { clientesService } from '../api/clientesService';
import { emailService } from '../api/emailService';
import { useNotification } from '../context/NotificationContext';
import {
  Mail,
  Send,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  CheckSquare,
  Square
} from 'lucide-react';

interface Cliente {
  id: number;
  nombre: string;
  cedula: string;
  email: string | null;
  status: string;
}

const getBizName = () => import.meta.env.VITE_NAME_BUSSINE || 'Single Sales';

const getTemplates = () => {
  const biz = getBizName();
  return [
    {
      id: 'custom',
      name: 'Redactar Personalizado / Manual',
      subject: '',
      body: ''
    },
    {
      id: 'promo',
      name: 'Promoción de Temporada',
      subject: `¡Descuentos imperdibles solo para ti, {cliente}!`,
      body: `Hola {cliente},\n\nTenemos excelentes noticias para ti. Esta semana contamos con promociones especiales de hasta el 20% de descuento en nuestros productos seleccionados.\n\n¡No dejes pasar esta oportunidad! Visítanos en nuestra tienda física o contáctanos para realizar tu pedido de manera rápida.\n\nAtentamente,\nEl equipo de ${biz}.`
    },
    {
      id: 'cobro',
      name: 'Recordatorio de Pago Pendiente',
      subject: `Recordatorio de cuenta pendiente - ${biz}`,
      body: `Hola {cliente},\n\nEsperamos que te encuentres bien. Te escribimos para recordarte amablemente que posees un saldo pendiente registrado en tu cuenta con nosotros.\n\nAgradecemos que pases por nuestro establecimiento para actualizar tu estado de cuenta o te pongas en contacto con administración.\n\nAtentamente,\nAdministración de ${biz}.`
    },
    {
      id: 'gracias',
      name: 'Agradecimiento por su Confianza',
      subject: `¡Gracias por preferirnos, {cliente}!`,
      body: `Hola {cliente},\n\nQueremos tomarnos un momento para agradecerte por tu constante preferencia y confianza en nuestros servicios y productos. Clientes como tú nos motivan a seguir mejorando cada día.\n\nRecuerda que estamos a tu entera disposición para lo que necesites.\n\nAtentamente,\nEl equipo de ${biz}.`
    }
  ];
};

export const Correo: React.FC = () => {
  const { showToast } = useNotification();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  // Form states
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('custom');
  const [audienceType, setAudienceType] = useState<'all' | 'active' | 'debtors' | 'manual'>('all');
  
  // Manual selection states
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [clientSearch, setClientSearch] = useState('');

  // Sending status states
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    successCount: number;
    failureCount: number;
    totalTarget: number;
    errors: Array<{ email: string; error: string }>;
  } | null>(null);

  // Fetch clients to map targets
  useEffect(() => {
    const fetchAllClients = async () => {
      setLoadingClients(true);
      try {
        const data = await clientesService.getAll({ limit: 1000 });
        if (data && data.items) {
          setClientes(data.items);
        }
      } catch (err) {
        console.error('Error fetching clients for mail panel:', err);
        showToast('Error al cargar la lista de clientes', 'error');
      } finally {
        setLoadingClients(false);
      }
    };
    fetchAllClients();
  }, []);

  // Filter clients based on audience selection
  const getTargetClients = () => {
    return clientes.filter((c) => {
      // Check if client has a registered email
      if (!c.email || c.email.trim() === '') return false;

      if (audienceType === 'all') return true;
      if (audienceType === 'active') return c.status === 'activo' || c.status === 'active';
      if (audienceType === 'debtors') return c.status === 'deudor';
      if (audienceType === 'manual') return selectedIds.includes(c.id);

      return false;
    });
  };

  const handleSelectAll = (filteredClients: Cliente[]) => {
    const filteredWithEmail = filteredClients.filter(c => c.email && c.email.trim() !== '');
    const allSelected = filteredWithEmail.every(c => selectedIds.includes(c.id));
    
    if (allSelected) {
      // Unselect all in this search
      setSelectedIds(prev => prev.filter(id => !filteredWithEmail.map(c => c.id).includes(id)));
    } else {
      // Select all in this search
      const idsToAdd = filteredWithEmail.map(c => c.id).filter(id => !selectedIds.includes(id));
      setSelectedIds(prev => [...prev, ...idsToAdd]);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    setSelectedTemplateId(templateId);
    const selected = getTemplates().find(t => t.id === templateId);
    if (selected && templateId !== 'custom') {
      setSubject(selected.subject);
      setBody(selected.body);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const targets = getTargetClients();
    if (targets.length === 0) {
      showToast('No hay destinatarios válidos seleccionados con correos electrónicos registrados.', 'error');
      return;
    }

    if (!subject.trim() || !body.trim()) {
      showToast('Asunto y Cuerpo del mensaje son requeridos.', 'info');
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const targetIds = targets.map(t => t.id);
      const res = await emailService.sendCampaign({
        clientIds: targetIds,
        subject,
        body
      });
      
      if (res && res.status === 'success') {
        showToast('Campaña procesada correctamente', 'success');
        setSendResult(res.data || {
          successCount: targetIds.length,
          failureCount: 0,
          totalTarget: targetIds.length,
          errors: []
        });
        // Clear fields on success
        setSubject('');
        setBody('');
        setSelectedTemplateId('custom');
        setSelectedIds([]);
      }
    } catch (err: any) {
      console.error('Error sending campaign:', err);
      const msg = err.response?.data?.message || 'Error al enviar la campaña de correos';
      showToast(msg, 'error');
    } finally {
      setSending(false);
    }
  };

  // Search filter for manual mode table
  const searchFilteredClients = clientes.filter(c => 
    c.nombre.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.cedula.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const targetsCount = getTargetClients().length;

  return (
    <div className="space-y-6 animate-fade-in text-slate-200">
      <div>
        <h2 className="font-outfit text-3xl font-extrabold tracking-tight">Módulo de Correo Informativo</h2>
        <p className="text-sm text-slate-400 mt-1">Envía promociones, avisos o comunicados personalizados a tus clientes mediante SMTP.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Composer Form Panel */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 space-y-6">
          <h3 className="font-outfit text-xl font-bold flex items-center gap-2 border-b border-slate-800 pb-3">
            <Mail className="h-5 w-5 text-emerald-450" />
            Redactar Mensaje
          </h3>

          <form onSubmit={handleSend} className="space-y-4">
            
            {/* Audience selection */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Destinatarios</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setAudienceType('all')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    audienceType === 'all'
                      ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/30'
                      : 'bg-slate-900/40 text-slate-450 border-slate-850 hover:border-slate-800'
                  }`}
                >
                  Todos los Clientes
                </button>
                <button
                  type="button"
                  onClick={() => setAudienceType('active')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    audienceType === 'active'
                      ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/30'
                      : 'bg-slate-900/40 text-slate-450 border-slate-850 hover:border-slate-800'
                  }`}
                >
                  Clientes Activos
                </button>
                <button
                  type="button"
                  onClick={() => setAudienceType('debtors')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    audienceType === 'debtors'
                      ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/30'
                      : 'bg-slate-900/40 text-slate-450 border-slate-850 hover:border-slate-800'
                  }`}
                >
                  Clientes Deudores
                </button>
                <button
                  type="button"
                  onClick={() => setAudienceType('manual')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    audienceType === 'manual'
                      ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/30'
                      : 'bg-slate-900/40 text-slate-450 border-slate-850 hover:border-slate-800'
                  }`}
                >
                  Selección Manual
                </button>
              </div>
            </div>

            {/* Template Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Plantilla del Mensaje</label>
              <select
                disabled={sending}
                value={selectedTemplateId}
                onChange={handleTemplateChange}
                className="w-full glass-input cursor-pointer text-slate-300 py-2"
              >
                {getTemplates().map(t => (
                  <option key={t.id} value={t.id} className="bg-slate-950 text-slate-200">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Asunto</label>
              <input
                type="text"
                required
                disabled={sending}
                placeholder="ej. ¡Nueva promoción de fin de mes disponible!"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setSelectedTemplateId('custom');
                }}
                className="w-full glass-input"
              />
            </div>

            {/* Message Body */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Mensaje (Cuerpo)</label>
                <span className="text-[10px] text-slate-500 font-medium normal-case">
                  Usa <code className="bg-slate-900 text-emerald-400 px-1 py-0.5 rounded font-mono font-semibold">{`{cliente}`}</code> para insertar su nombre.
                </span>
              </div>
              <textarea
                required
                rows={8}
                disabled={sending}
                placeholder={`Hola {cliente},\n\nQueremos informarte sobre nuestras ofertas especiales de esta semana...\n\nAtentamente,\nEquipo de Ventas.`}
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  setSelectedTemplateId('custom');
                }}
                className="w-full glass-input font-sans py-3"
              />
            </div>

            {/* Submit */}
            <div className="pt-2 flex justify-between items-center gap-4">
              <div className="text-xs text-slate-400">
                Se enviará a: <strong className="text-emerald-400">{targetsCount}</strong> clientes válidos con correo electrónico.
              </div>
              <button
                type="submit"
                disabled={sending || targetsCount === 0}
                className="btn-primary py-2.5 px-6 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Enviar Correo</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Results Summary Box */}
          {sendResult && (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Resultado del Envío
              </h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
                  <div className="text-xs text-slate-500">Destinatarios</div>
                  <div className="text-lg font-bold text-slate-350">{sendResult.totalTarget}</div>
                </div>
                <div className="bg-emerald-500/5 p-2.5 rounded-lg border border-emerald-500/10">
                  <div className="text-xs text-emerald-500/70">Enviados OK</div>
                  <div className="text-lg font-bold text-emerald-400">{sendResult.successCount}</div>
                </div>
                <div className="bg-rose-500/5 p-2.5 rounded-lg border border-rose-500/10">
                  <div className="text-xs text-rose-500/70">Fallidos</div>
                  <div className="text-lg font-bold text-rose-400">{sendResult.failureCount}</div>
                </div>
              </div>

              {sendResult.errors && sendResult.errors.length > 0 && (
                <div className="space-y-2 mt-2 pt-2 border-t border-slate-850/60">
                  <div className="text-xs text-rose-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Detalle de Errores de Entrega:
                  </div>
                  <ul className="text-xs text-slate-400 space-y-1 divide-y divide-slate-850 max-h-32 overflow-y-auto pr-1">
                    {sendResult.errors.map((err, idx) => (
                      <li key={idx} className="py-1.5 flex justify-between items-start gap-3">
                        <span className="font-mono text-slate-300 font-semibold">{err.email}</span>
                        <span className="text-rose-400 text-right">{err.error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Manual Target Selection Sidebar */}
        <div className="glass-card rounded-2xl p-6 flex flex-col h-[520px] lg:h-auto">
          <h3 className="font-outfit text-xl font-bold flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
            <Users className="h-5 w-5 text-emerald-450" />
            Destinatarios {audienceType === 'manual' ? '(Manual)' : ''}
          </h3>

          {audienceType === 'manual' ? (
            <div className="flex-1 flex flex-col space-y-3 min-h-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filtrar por nombre..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full pl-8 py-1.5 text-xs glass-input"
                />
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400 bg-slate-900/40 p-2 rounded-lg border border-slate-850">
                <span>Seleccionados: <strong className="text-emerald-400">{selectedIds.length}</strong></span>
                <button
                  type="button"
                  onClick={() => handleSelectAll(searchFilteredClients)}
                  className="text-[10px] text-emerald-450 hover:underline cursor-pointer font-semibold"
                >
                  {searchFilteredClients.filter(c => c.email && c.email.trim() !== '').every(c => selectedIds.includes(c.id))
                    ? 'Desmarcar Todos'
                    : 'Marcar Todos'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                {loadingClients ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                  </div>
                ) : searchFilteredClients.length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-6">No se encontraron clientes.</div>
                ) : (
                  searchFilteredClients.map((c) => {
                    const hasEmail = c.email && c.email.trim() !== '';
                    const isSelected = selectedIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => hasEmail && handleToggleSelect(c.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          !hasEmail
                            ? 'opacity-40 cursor-not-allowed border-transparent bg-slate-950/20'
                            : 'cursor-pointer hover:bg-slate-900/30 ' + 
                              (isSelected ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-900/20 border-slate-850')
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">{c.nombre}</p>
                          <p className="text-[10px] text-slate-450 truncate">{c.email || 'Sin correo registrado'}</p>
                        </div>
                        {hasEmail ? (
                          isSelected ? (
                            <CheckSquare className="h-4 w-4 text-emerald-450 shrink-0" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-650 hover:text-slate-450 shrink-0" />
                          )
                        ) : (
                          <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-900/10 border border-dashed border-slate-850 rounded-2xl">
              <Users className="h-10 w-10 text-slate-600 mb-3 stroke-[1.5]" />
              <p className="text-xs text-slate-400 font-medium">Filtro de Audiencia Activo:</p>
              <p className="text-sm font-bold text-emerald-400 mt-1">
                {audienceType === 'all' && 'Todos los Clientes'}
                {audienceType === 'active' && 'Clientes Activos'}
                {audienceType === 'debtors' && 'Clientes Deudores'}
              </p>
              <p className="text-[10px] text-slate-500 mt-2 max-w-[200px]">
                {audienceType === 'all' && 'Se enviará el correo a todos los clientes que posean una dirección electrónica registrada.'}
                {audienceType === 'active' && 'Se enviará únicamente a clientes con estado comercial "Activo / Solvente".'}
                {audienceType === 'debtors' && 'Se enviará únicamente a clientes con saldo pendiente ("Deudor / Debe").'}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Correo;
