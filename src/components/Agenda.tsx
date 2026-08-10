import React, { useState } from 'react';
import { Client, FollowUp, FollowUpType, FollowUpState, FollowUpPriority } from '../types';
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
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AgendaProps {
  followUps: FollowUp[];
  clients: Client[];
  activeClient: Client | null;
  onSelectActiveClient: (client: Client | null) => void;
  onAddFollowUp: (followUp: Omit<FollowUp, 'id' | 'fecha'>) => void;
  onUpdateFollowUpStatus: (id: string, status: FollowUpState) => void;
  onDeleteFollowUp: (id: string) => void;
}

export default function Agenda({
  followUps,
  clients,
  activeClient,
  onSelectActiveClient,
  onAddFollowUp,
  onUpdateFollowUpStatus,
  onDeleteFollowUp
}: AgendaProps) {
  
  // Tab control (List vs Calendar View)
  const [viewMode, setViewViewMode] = useState<'list' | 'calendar'>('list');
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('Todos');
  const [filterState, setFilterState] = useState<string>('Pendiente'); // default show pending

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

  // Filters logic
  const filteredFollowups = followUps.filter(f => {
    const client = clients.find(c => c.id === f.cliente_id);
    const clientName = client ? client.nombre.toLowerCase() : '';
    const note = f.nota.toLowerCase();
    const query = search.toLowerCase();

    const matchesSearch = clientName.includes(query) || note.includes(query);
    const matchesPriority = filterPriority === 'Todos' || f.prioridad === filterPriority;
    const matchesState = filterState === 'Todos' || f.estado === filterState;

    return matchesSearch && matchesPriority && matchesState;
  });

  // Sort: closest scheduled dates first
  const sortedFollowups = [...filteredFollowups].sort((a, b) => {
    return new Date(a.proximo_contacto).getTime() - new Date(b.proximo_contacto).getTime();
  });

  // Metrics
  const totalPending = followUps.filter(f => f.estado === 'Pendiente').length;
  const totalCompleted = followUps.filter(f => f.estado === 'Realizado').length;

  return (
    <div className="space-y-6" id="agenda-comercial-view">
      
      {/* Overview Indicator Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Flag className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xl font-bold font-mono text-gray-800">
              {followUps.filter(f => f.prioridad === 'Alta' && f.estado === 'Pendiente').length}
            </h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Pendientes de Alta Prioridad</p>
          </div>
        </div>
      </div>

      {/* Toolbar controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente o notas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white transition"
          />
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
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
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
                      <option key={c.id} value={c.id}>{c.nombre}</option>
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
                    <option value="Reunión">Reunión de Negocio</option>
                    <option value="Envío cotización">Envío Cotización PDF</option>
                    <option value="Envío catálogo">Envío Catálogo</option>
                    <option value="Correo">Correo Electrónico</option>
                    <option value="Nota interna">Nota Interna</option>
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
                    placeholder="Ej. Volver a llamar para negociar descuento del flete marítimo..."
                    rows={2}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 resize-none text-gray-700"
                    required
                  />
                </div>

                <div className="md:col-span-4 flex justify-end space-x-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition shadow-xs"
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
                    <p className="text-[10px] text-gray-400 font-medium">Ubicación: {client ? client.ciudad : 'Bolivia'}</p>
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
              <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-[11px]">
                <span className="text-gray-400 font-mono flex items-center space-x-1">
                  <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                  <span>Agenda: {new Date(task.proximo_contacto).toLocaleDateString('es-ES')}</span>
                </span>

                <div className="flex items-center space-x-1">
                  {task.estado === 'Pendiente' ? (
                    <>
                      {/* Mark Completed Icon */}
                      <button
                        onClick={() => onUpdateFollowUpStatus(task.id, 'Realizado')}
                        className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[10px] font-bold border border-emerald-100 transition"
                        title="Marcar como Completado"
                      >
                        Completar
                      </button>

                      {/* Cancel icon */}
                      <button
                        onClick={() => onUpdateFollowUpStatus(task.id, 'Cancelado')}
                        className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded"
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
                        className="p-1 text-gray-400 hover:text-gray-600"
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
                    className="p-1 text-gray-400 hover:text-gray-600"
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
