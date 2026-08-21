import React, { useState } from 'react';
import { Client, FollowUp, FollowUpType, FollowUpState, FollowUpPriority, Contract, Vehicle } from '../types';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  CheckCircle, 
  Clock, 
  XCircle, 
  RotateCcw, 
  Users, 
  Info, 
  AlertCircle,
  FileText,
  Calendar,
  Check,
  Flag,
  Trash2,
  X,
  Send,
  Wrench,
  Camera,
  Layers,
  PhoneCall
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AgendaProps {
  followUps: FollowUp[];
  clients: Client[];
  contracts?: Contract[];
  vehicles?: Vehicle[];
  activeClient: Client | null;
  onSelectActiveClient: (client: Client | null) => void;
  onAddFollowUp: (followUp: Omit<FollowUp, 'id' | 'fecha'>) => void;
  onUpdateFollowUpStatus: (id: string, status: FollowUpState) => void;
  onDeleteFollowUp: (id: string) => void;
}

export default function Agenda({
  followUps,
  clients,
  contracts = [],
  vehicles = [],
  activeClient,
  onSelectActiveClient,
  onAddFollowUp,
  onUpdateFollowUpStatus,
  onDeleteFollowUp
}: AgendaProps) {
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('Todos');
  const [filterState, setFilterState] = useState<string>('Pendiente');
  const [filterCategory, setFilterCategory] = useState<'TODOS' | 'REUNIONES' | 'INSTALACION' | 'COBRANZA'>('TODOS');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Form states
  const [showAddForm, setShowForm] = useState(false);
  const [tipo, setTipo] = useState<FollowUpType>('WhatsApp');
  const [nota, setNota] = useState('');
  const [proximoContacto, setProximoContacto] = useState('');
  const [prioridad, setPrioridad] = useState<FollowUpPriority>('Media');

  // Feedback
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Submit new follow up
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!activeClient) return setFormError('Debe seleccionar un cliente para vincular.');
    if (!nota.trim()) return setFormError('Debe ingresar una nota descriptiva de la actividad.');
    if (!proximoContacto) return setFormError('Debe seleccionar la fecha del próximo contacto.');

    onAddFollowUp({
      cliente_id: activeClient.id,
      tipo,
      nota: nota.trim(),
      proximo_contacto: proximoContacto,
      prioridad,
      estado: 'Pendiente'
    });

    setFormSuccess('Actividad programada correctamente.');
    setTimeout(() => {
      setShowForm(false);
      setNota('');
      setProximoContacto('');
      setFormSuccess('');
    }, 1000);
  };

  // Reusable WhatsApp Tab Handler for Agenda Appointment Reminder
  const handleSendReminderWA = (task: FollowUp) => {
    const client = clients.find(c => c.id === task.cliente_id);
    const phone = (client?.celular || '').replace(/\D/g, '');
    const targetPhone = phone.startsWith('591') ? phone : (phone ? `591${phone}` : '');
    const clientName = client ? client.nombre : 'Estimado/a Cliente';
    const dateFormatted = new Date(task.proximo_contacto).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const text = 
      `*RECORDATORIO DE ACTIVIDAD / REUNIÓN PUBLI-X* 📢\n\n` +
      `Estimado/a *${clientName}*,\n\n` +
      `Le recordamos cordialmente nuestra actividad programada para el *${dateFormatted}*:\n` +
      `📌 *Tipo:* ${task.tipo}\n` +
      `📝 *Detalle:* ${task.nota}\n\n` +
      `Por favor, indíquenos si requiere algún ajuste de horario o información previa.\n\n` +
      `_Atentamente: Equipo Comercial PUBLI-X OOH_`;

    const waUrl = targetPhone 
      ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      
    window.open(waUrl, 'publix_whatsapp_tab');
    setFeedbackMsg(`Abriendo recordatorio de agenda en WhatsApp Web (reutilizando pestaña)`);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Filters logic
  const filteredFollowups = followUps.filter(f => {
    const client = clients.find(c => c.id === f.cliente_id);
    const clientName = client ? client.nombre.toLowerCase() : '';
    const note = f.nota.toLowerCase();
    const query = search.toLowerCase();

    const matchesSearch = clientName.includes(query) || note.includes(query);
    const matchesPriority = filterPriority === 'Todos' || f.prioridad === filterPriority;
    const matchesState = filterState === 'Todos' || f.estado === filterState;

    let matchesCategory = true;
    if (filterCategory === 'REUNIONES') {
      matchesCategory = ['Reunión', 'Llamada', 'WhatsApp'].includes(f.tipo);
    } else if (filterCategory === 'INSTALACION') {
      matchesCategory = f.nota.toLowerCase().includes('instal') || f.nota.toLowerCase().includes('tensado') || f.nota.toLowerCase().includes('lona') || f.tipo === 'Nota interna';
    } else if (filterCategory === 'COBRANZA') {
      matchesCategory = f.nota.toLowerCase().includes('cobro') || f.nota.toLowerCase().includes('factur') || f.nota.toLowerCase().includes('pago');
    }

    return matchesSearch && matchesPriority && matchesState && matchesCategory;
  });

  // Sort: closest scheduled dates first
  const sortedFollowups = [...filteredFollowups].sort((a, b) => {
    return new Date(a.proximo_contacto).getTime() - new Date(b.proximo_contacto).getTime();
  });

  // Active contracts near expiration (next 30 days) to show as automatic OOH milestone alerts
  const expiringContracts = contracts.filter(c => {
    if (c.estado !== 'Vigente' || !c.fecha_fin) return false;
    const end = new Date(c.fecha_fin).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 35;
  });

  // Metrics
  const totalPending = followUps.filter(f => f.estado === 'Pendiente').length;
  const totalCompleted = followUps.filter(f => f.estado === 'Realizado').length;

  return (
    <div className="space-y-6" id="agenda-comercial-view">
      {/* Feedback Alert */}
      {feedbackMsg && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-between text-xs font-bold shadow-lg shadow-amber-500/5">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-amber-400 hover:text-white cursor-pointer">✕</button>
        </div>
      )}
      
      {/* Overview Indicator Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-3xs flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xl font-bold font-mono text-gray-800">{followUps.length}</h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Actividades Totales</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-3xs flex items-center space-x-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xl font-bold font-mono text-gray-800">{totalPending}</h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Pendientes por hacer</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-3xs flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xl font-bold font-mono text-gray-800">{totalCompleted}</h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Realizados con éxito</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-3xs flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xl font-bold font-mono text-gray-800">
              {expiringContracts.length}
            </h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Contratos por Vencer (30d)</p>
          </div>
        </div>
      </div>

      {/* Automatic Contract Expiration Milestone Alerts */}
      {expiringContracts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
              <AlertCircle className="w-4 h-4" />
              <span>Hitos Automáticos OOH: {expiringContracts.length} contratos próximos a finalizar</span>
            </div>
            <span className="text-[10px] text-amber-500 font-bold uppercase">Acción Comercial Requerida</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {expiringContracts.map(c => (
              <div key={c.id} className="bg-slate-900/80 p-3 rounded-xl border border-amber-500/20 flex flex-col justify-between text-xs space-y-2">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-amber-400">{c.numero}</span>
                    <span className="text-[10px] text-rose-400 font-bold">Vence: {c.fecha_fin}</span>
                  </div>
                  <p className="text-white font-semibold mt-1">{c.cliente_nombre}</p>
                  <p className="text-slate-400 text-[11px] line-clamp-1">📍 {c.valla_nombre}</p>
                </div>
                <button
                  onClick={() => {
                    const phone = (c.cliente_celular || '').replace(/\D/g, '');
                    const targetPhone = phone.startsWith('591') ? phone : (phone ? `591${phone}` : '');
                    const text = `*PROPUESTA DE RENOVACIÓN DE ESPACIO PUBLICITARIO OOH* 📢\n*PUBLI-X Cobertura Nacional*\n\nEstimado/a *${c.cliente_nombre}*:\nLe comunicamos que el contrato *${c.numero}* para la valla *${c.valla_nombre}* concluye el *${c.fecha_fin}*.\n\n¿Desea que reservemos la continuidad de su espacio para la siguiente temporada con tarifas preferenciales?`;
                    const waUrl = targetPhone ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(text)}` : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                    window.open(waUrl, 'publix_whatsapp_tab');
                  }}
                  className="w-full py-1.5 px-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] flex items-center justify-center space-x-1 transition cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>Proponer Renovación WA</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente o notas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white transition"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setFilterCategory('TODOS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${filterCategory === 'TODOS' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilterCategory('REUNIONES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${filterCategory === 'REUNIONES' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Reuniones & Contactos
          </button>
          <button
            onClick={() => setFilterCategory('INSTALACION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${filterCategory === 'INSTALACION' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Instalaciones / OOH
          </button>
          <button
            onClick={() => setFilterCategory('COBRANZA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${filterCategory === 'COBRANZA' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Cobranzas
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="Todos">Prioridades (Todas)</option>
            <option value="Alta">Alta</option>
            <option value="Media">Media</option>
            <option value="Baja">Baja</option>
          </select>

          {/* State filter */}
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="Todos">Estados (Todos)</option>
            <option value="Pendiente">Pendientes</option>
            <option value="Realizado">Realizados</option>
            <option value="Reprogramado">Reprogramados</option>
            <option value="Cancelado">Cancelados</option>
          </select>

          <button
            onClick={() => setShowForm(prev => !prev)}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg transition text-xs shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Programar Actividad</span>
          </button>
        </div>
      </div>

      {/* Add activity form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-4">
              <div className="pb-3 border-b border-gray-50 flex justify-between items-center">
                <h4 className="text-base font-bold text-gray-800 font-display">
                  Programar Recordatorio o Próximo Contacto
                </h4>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-lg flex items-center space-x-2">
                  <Check className="w-4 h-4" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Cliente Vinculado *</label>
                  <select
                    value={activeClient ? activeClient.id : ''}
                    onChange={(e) => onSelectActiveClient(clients.find(c => c.id === e.target.value) || null)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 text-gray-700"
                    required
                  >
                    <option value="">-- Seleccionar --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} ({c.empresa})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo de Actividad</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as FollowUpType)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 text-gray-700"
                  >
                    <option value="WhatsApp">Mensaje WhatsApp</option>
                    <option value="Llamada">Llamada de Voz</option>
                    <option value="Reunión">Reunión Comercial / Presentación</option>
                    <option value="Envío cotización">Envío Cotización PDF / PPTX</option>
                    <option value="Envío catálogo">Envío Catálogo OOH</option>
                    <option value="Correo">Correo Electrónico</option>
                    <option value="Nota interna">Inspección / Tensado de Lona / Mantenimiento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Próximo Contacto *</label>
                  <input
                    type="date"
                    value={proximoContacto}
                    onChange={(e) => setProximoContacto(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 text-gray-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Nivel Prioridad</label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value as FollowUpPriority)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 text-gray-700"
                  >
                    <option value="Baja">Baja prioridad</option>
                    <option value="Media">Media prioridad</option>
                    <option value="Alta">Alta prioridad</option>
                  </select>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Detalle / Notas de Seguimiento comercial *</label>
                  <textarea
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    placeholder="Ej. Coordinar entrega de fotos testigo de tensado o confirmar firma de contrato..."
                    rows={2}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 resize-none text-gray-700"
                    required
                  />
                </div>

                <div className="md:col-span-4 flex justify-end space-x-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Programar
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid: Activities Cards Stack */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sortedFollowups.map((task) => {
          const client = clients.find(c => c.id === task.cliente_id);
          
          return (
            <motion.div
              layout
              key={task.id}
              className={`p-4 rounded-xl border bg-white shadow-3xs flex flex-col justify-between space-y-4 ${
                task.estado === 'Realizado' ? 'border-emerald-100 opacity-80' : 'border-gray-100'
              }`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-indigo-500 font-mono tracking-wider">
                      {task.tipo}
                    </span>
                    <h5 className="font-extrabold text-sm text-gray-800 leading-tight">
                      {client ? client.nombre : 'Cliente Desconocido'}
                    </h5>
                    <p className="text-[10px] text-gray-400 font-medium">Empresa: {client?.empresa || 'Particular'} • {client?.ciudad || 'Bolivia'}</p>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${
                    task.prioridad === 'Alta' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                    task.prioridad === 'Media' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                    {task.prioridad}
                  </span>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed italic">
                  "{task.nota}"
                </p>
              </div>

              {/* Footer details and controls */}
              <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-[11px] gap-2">
                <span className="text-gray-400 font-mono flex items-center space-x-1">
                  <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                  <span>{new Date(task.proximo_contacto).toLocaleDateString('es-ES')}</span>
                </span>

                <div className="flex items-center space-x-1.5">
                  {/* WhatsApp Reminder Button */}
                  <button
                    onClick={() => handleSendReminderWA(task)}
                    className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white rounded-lg text-[10px] font-bold border border-emerald-100 transition cursor-pointer"
                    title="Enviar Recordatorio por WhatsApp Web"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>

                  {task.estado === 'Pendiente' ? (
                    <>
                      {/* Mark Completed Icon */}
                      <button
                        onClick={() => onUpdateFollowUpStatus(task.id, 'Realizado')}
                        className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[10px] font-bold border border-emerald-100 transition cursor-pointer"
                        title="Marcar como Completado"
                      >
                        Completar
                      </button>

                      {/* Cancel icon */}
                      <button
                        onClick={() => onUpdateFollowUpStatus(task.id, 'Cancelado')}
                        className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                        title="Cancelar Actividad"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center space-x-1.5">
                      <span className="text-emerald-600 font-bold uppercase text-[9px] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                        Completado
                      </span>
                      {/* Restore status to pending */}
                      <button
                        onClick={() => onUpdateFollowUpStatus(task.id, 'Pendiente')}
                        className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                        title="Reabrir Seguimiento"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Hard Delete */}
                  <button
                    onClick={() => {
                      if (confirm('¿Eliminar permanentemente este recordatorio?')) {
                        onDeleteFollowUp(task.id);
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                    title="Eliminar de la agenda"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {sortedFollowups.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400 text-xs border border-dashed border-gray-100 rounded-xl bg-white">
            No hay actividades programadas que coincidan con la búsqueda o filtro.
          </div>
        )}
      </div>

    </div>
  );
}

