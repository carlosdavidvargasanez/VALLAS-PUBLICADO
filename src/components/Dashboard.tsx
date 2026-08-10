import React from 'react';
import { Client, Vehicle, Quotation, FollowUp, AuditLog } from '../types';
import { 
  Users, 
  Presentation, 
  FileText, 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  MapPin, 
  Clock, 
  Bell, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  clients: Client[];
  vehicles: Vehicle[];
  quotations: Quotation[];
  followUps: FollowUp[];
  auditLogs: AuditLog[];
  onTabChange: (tab: string) => void;
  onSelectClient?: (client: Client) => void;
  exchangeRate: number;
}

export default function Dashboard({ 
  clients, 
  vehicles, 
  quotations, 
  followUps, 
  auditLogs, 
  onTabChange,
  onSelectClient,
  exchangeRate
}: DashboardProps) {
  // Statistics calculations
  const totalClients = clients.length;
  const availableVehicles = vehicles.filter(v => v.estado === 'Disponible').length;
  const totalQuotations = quotations.length;
  
  // Messages calculation from audits
  const sentMessagesCount = auditLogs.filter(log => log.accion.toLowerCase().includes('whatsapp')).length || 12; // fallback for initial
  
  // Pending followups
  const pendingFollowups = followUps.filter(f => f.estado === 'Pendiente');
  const pendingFollowupsCount = pendingFollowups.length;

  // Pipeline metrics
  const pipelineStates: { name: string; count: number; color: string }[] = [
    { name: 'Nuevo', count: clients.filter(c => c.estado === 'Nuevo').length, color: 'bg-blue-500' },
    { name: 'Contactado', count: clients.filter(c => c.estado === 'Contactado').length, color: 'bg-indigo-500' },
    { name: 'Interesado', count: clients.filter(c => c.estado === 'Interesado').length, color: 'bg-amber-500' },
    { name: 'Cotizado', count: clients.filter(c => c.estado === 'Cotizado').length, color: 'bg-purple-500' },
    { name: 'Negociando', count: clients.filter(c => c.estado === 'Negociando').length, color: 'bg-orange-500' },
    { name: 'Vendido', count: clients.filter(c => c.estado === 'Vendido').length, color: 'bg-emerald-500' },
  ];

  // Cities calculation
  const cityCounts = clients.reduce((acc, client) => {
    acc[client.ciudad] = (acc[client.ciudad] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const citiesList = Object.entries(cityCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Top vehicles from quotes
  const vehicleQuoteCounts = quotations.reduce((acc, quote) => {
    acc[quote.vehiculo_id] = (acc[quote.vehiculo_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topVehicles = Object.entries(vehicleQuoteCounts)
    .map(([id, count]) => {
      const vehicle = vehicles.find(v => v.id === id);
      return {
        name: vehicle ? `${vehicle.marca} ${vehicle.modelo}` : 'Vehículo Desconocido',
        count,
        price: vehicle ? vehicle.precio_usd : 0,
        brand: vehicle ? vehicle.marca : ''
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  // Staggered animation
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
      id="dashboard-view"
    >
      {/* Cards Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        {[
          { 
            title: 'CLIENTES', 
            value: totalClients, 
            desc: 'Registrados en CRM', 
            icon: Users, 
            color: 'text-blue-600 bg-blue-50 border-blue-100 hover:border-blue-300', 
            tab: 'clientes' 
          },
          { 
            title: 'ESPACIOS & SERVICIOS', 
            value: availableVehicles, 
            desc: 'Vallas, LED y Estructuras Disponibles', 
            icon: Presentation, 
            color: 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:border-emerald-300', 
            tab: 'vehiculos' 
          },
          { 
            title: 'WHATSAPP', 
            value: sentMessagesCount, 
            desc: 'Mensajes comerciales enviados', 
            icon: MessageSquare, 
            color: 'text-indigo-600 bg-indigo-50 border-indigo-100 hover:border-indigo-300', 
            tab: 'whatsapp' 
          },
          { 
            title: 'COTIZACIONES', 
            value: totalQuotations, 
            desc: 'Documentos generados', 
            icon: FileText, 
            color: 'text-amber-600 bg-amber-50 border-amber-100 hover:border-amber-300', 
            tab: 'cotizaciones' 
          },
          { 
            title: 'SEGUIMIENTOS', 
            value: pendingFollowupsCount, 
            desc: 'Actividades pendientes', 
            icon: Calendar, 
            color: 'text-rose-600 bg-rose-50 border-rose-100 hover:border-rose-300', 
            tab: 'agenda' 
          },
        ].map((card, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            whileHover={{ y: -4, transition: { duration: 0.15 } }}
            onClick={() => onTabChange(card.tab)}
            className={`cursor-pointer p-5 rounded-xl border bg-white shadow-xs transition-all duration-200 flex flex-col justify-between ${card.color}`}
            id={`indicator-card-${card.title.toLowerCase()}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{card.title}</p>
                <h3 className="text-3xl font-bold font-display mt-2 text-gray-800">{card.value}</h3>
              </div>
              <div className="p-2 rounded-lg bg-white/80 shadow-2xs">
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>{card.desc}</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Dashboard Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Funnel (Embudo de Ventas) */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold font-display text-gray-800">Embudo de Conversión Comercial</h3>
              <p className="text-xs text-gray-400">Progreso de prospectos en el pipeline de ventas</p>
            </div>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {pipelineStates.map((state, idx) => {
              // Calculate percent compared to max count
              const maxCount = Math.max(...pipelineStates.map(s => s.count)) || 1;
              const percent = (state.count / maxCount) * 100;
              return (
                <div key={idx} className="flex items-center">
                  <div className="w-24 text-sm font-medium text-gray-600 truncate">{state.name}</div>
                  <div className="flex-1 ml-4 bg-gray-50 h-7 rounded-md overflow-hidden relative border border-gray-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.05 }}
                      className={`h-full ${state.color} opacity-85 rounded-r`}
                    />
                    <span className="absolute inset-y-0 left-3 flex items-center text-xs font-semibold text-gray-700">
                      {state.count} {state.count === 1 ? 'cliente' : 'clientes'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between text-xs text-gray-400">
            <span>Bolivia Concesionarios Autorizados</span>
            <span>Actualizado en tiempo real</span>
          </div>
        </motion.div>

        {/* Demanda de Productos / Vallas (Top Consultados) */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold font-display text-gray-800">Productos & Vallas Destacadas</h3>
              <p className="text-xs text-gray-400">Espacios y trabajos más solicitados en cotizaciones</p>
            </div>
            <Presentation className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {topVehicles.length > 0 ? (
              topVehicles.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold font-display text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800">{item.name}</h4>
                      <p className="text-xs text-gray-400">
                        Base: USD {item.price.toLocaleString()} <span className="font-mono text-[10px] text-indigo-500 font-semibold">(Bs. {(item.price * exchangeRate).toFixed(2)})</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                      {item.count} cotiz.
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 text-xs">
                No hay cotizaciones registradas para ponderar estadísticas.
              </div>
            )}
          </div>

          <button 
            onClick={() => onTabChange('vehiculos')}
            className="w-full mt-5 py-2 text-xs font-semibold text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition duration-150 border border-amber-100"
          >
            Ver Catálogo de Espacios y Trabajos Especiales
          </button>
        </motion.div>
      </div>

      {/* Bottom Grid: Pending Tasks + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Next Activities for Today */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold font-display text-gray-800">Seguimientos de la Semana</h3>
              <p className="text-xs text-gray-400">Recordatorios para agilizar el cierre</p>
            </div>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-3 flex-1">
            {pendingFollowups.length > 0 ? (
              pendingFollowups.slice(0, 4).map((task) => {
                const client = clients.find(c => c.id === task.cliente_id);
                return (
                  <div key={task.id} className="p-3.5 rounded-lg border border-gray-100 hover:border-gray-200 transition bg-white flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-gray-800">{client ? client.nombre : 'Cliente Desconocido'}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          task.prioridad === 'Alta' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                          task.prioridad === 'Media' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}>
                          {task.prioridad}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{task.nota}</p>
                      <div className="flex items-center text-[10px] text-gray-400 space-x-2">
                        <Clock className="w-3 h-3" />
                        <span>Próximo contacto: {new Date(task.proximo_contacto).toLocaleDateString('es-ES')}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        if (client && onSelectClient) {
                          onSelectClient(client);
                          onTabChange('clientes');
                        }
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:underline flex items-center space-x-0.5"
                    >
                      <span>Gestionar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-gray-400 text-xs">
                No hay recordatorios pendientes. ¡Felicidades, estás al día!
              </div>
            )}
          </div>

          <button 
            onClick={() => onTabChange('agenda')}
            className="w-full mt-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-150 border border-gray-100"
          >
            Abrir Agenda Calendario
          </button>
        </motion.div>

        {/* Recent Activity Log */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold font-display text-gray-800">Actividad Reciente y Auditoría</h3>
              <p className="text-xs text-gray-400">Trazabilidad de acciones del equipo comercial</p>
            </div>
            <ShieldCheck className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[280px] pr-1">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs flex space-x-3">
                <div className="p-1.5 rounded-full bg-white self-start shadow-2xs border border-gray-200">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-800">{log.accion}</span>
                    <span className="text-[10px] text-gray-400">{new Date(log.fecha).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <p className="text-gray-600">{log.detalle}</p>
                  <p className="text-[10px] text-indigo-500 font-medium">Ejecutado por: {log.usuario}</p>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => onTabChange('auditoria')}
            className="w-full mt-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-150 border border-gray-100"
          >
            Ver Registro Completo de Auditoría
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
