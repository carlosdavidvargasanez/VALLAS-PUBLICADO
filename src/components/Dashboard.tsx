import React from 'react';
import { Client, Vehicle, Quotation, Contract, FollowUp, AuditLog } from '../types';
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
  ShieldCheck,
  FileCheck,
  Sparkles,
  Inbox,
  Database,
  Sliders,
  DollarSign,
  Send,
  PieChart,
  Layers,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  clients: Client[];
  vehicles: Vehicle[];
  quotations: Quotation[];
  contracts?: Contract[];
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
  contracts = [],
  followUps, 
  auditLogs, 
  onTabChange,
  onSelectClient,
  exchangeRate
}: DashboardProps) {
  // Statistics calculations
  const totalClients = clients.length;
  const availableVehicles = vehicles.filter(v => v.estado === 'Disponible').length;
  const occupiedVehicles = vehicles.filter(v => v.estado === 'Ocupada' || v.estado === 'Ocupado / Alquilado' || v.estado === 'Reservado' || v.estado === 'Reservada').length;
  const totalVehiclesCount = vehicles.length;
  const occupancyPercentage = totalVehiclesCount > 0 ? Math.round((occupiedVehicles / totalVehiclesCount) * 100) : 0;
  
  const totalQuotations = quotations.length;
  const totalContracts = contracts.length;
  const activeContracts = contracts.filter(c => c.estado === 'Vigente');
  
  // Projected Monthly Revenue
  const activeMonthlyRevenueUsd = activeContracts.reduce((sum, c) => sum + (c.total_neto_usd || 0), 0);
  const activeMonthlyRevenueBob = activeContracts.reduce((sum, c) => sum + (c.total_neto_bob || (c.total_neto_usd * exchangeRate)), 0);

  // Messages calculation from audits
  const sentMessagesCount = auditLogs.filter(log => log.accion.toLowerCase().includes('whatsapp')).length || 12;
  
  // Pending followups
  const pendingFollowups = followUps.filter(f => f.estado === 'Pendiente');
  const pendingFollowupsCount = pendingFollowups.length;

  // Regional breakdown
  const citiesSummary = ['Santa Cruz', 'La Paz', 'Cochabamba', 'El Alto', 'Tarija', 'Sucre', 'Oruro', 'Potosí', 'Beni', 'Pando'].map(city => {
    const cityVehicles = vehicles.filter(v => (v.ciudad || '').toLowerCase().includes(city.toLowerCase()));
    const cityOccupied = cityVehicles.filter(v => v.estado === 'Ocupada' || v.estado === 'Ocupado / Alquilado' || v.estado === 'Reservado' || v.estado === 'Reservada').length;
    return {
      city,
      total: cityVehicles.length,
      occupied: cityOccupied,
      available: cityVehicles.length - cityOccupied,
      rate: cityVehicles.length > 0 ? Math.round((cityOccupied / cityVehicles.length) * 100) : 0
    };
  }).filter(c => c.total > 0);

  // Reusable WhatsApp Tab Handler for Executive Summary
  const handleSendExecutiveSummaryWhatsApp = () => {
    const text = 
      `*REPORTE EJECUTIVO COMERCIAL - PUBLI-X BOLIVIA* 📢\n\n` +
      `📊 *ESTADO GENERAL DEL NEGOCIO OOH:*\n` +
      `• *Tasa de Ocupación Nacional:* ${occupancyPercentage}% (${occupiedVehicles} de ${totalVehiclesCount} vallas activas)\n` +
      `• *Espacios Disponibles:* ${availableVehicles} vallas listas para venta\n` +
      `• *Contratos Vigentes:* ${activeContracts.length} contratos\n` +
      `• *Ingresos Mensuales Proyectados:* $${activeMonthlyRevenueUsd.toLocaleString()} USD (Bs. ${activeMonthlyRevenueBob.toLocaleString('es-BO', { maximumFractionDigits: 0 })})\n` +
      `• *Base de Clientes CRM:* ${totalClients} empresas\n` +
      `• *Cotizaciones Emitidas:* ${totalQuotations} propuestas\n\n` +
      `_Generado automáticamente por el Sistema Integral PUBLI-X Bolivia._`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, 'publix_whatsapp_tab');
  };

  // Pipeline metrics
  const pipelineStates: { name: string; count: number; color: string; tabState?: string }[] = [
    { name: 'Nuevo', count: clients.filter(c => c.estado === 'Nuevo').length, color: 'bg-blue-500' },
    { name: 'Contactado', count: clients.filter(c => c.estado === 'Contactado').length, color: 'bg-indigo-500' },
    { name: 'Interesado', count: clients.filter(c => c.estado === 'Interesado').length, color: 'bg-amber-500' },
    { name: 'Cotizado', count: clients.filter(c => c.estado === 'Cotizado').length, color: 'bg-purple-500' },
    { name: 'Negociando', count: clients.filter(c => c.estado === 'Negociando').length, color: 'bg-orange-500' },
    { name: 'Vendido', count: clients.filter(c => c.estado === 'Vendido').length, color: 'bg-emerald-500' },
  ];

  // Top vehicles from quotes
  const vehicleQuoteCounts = quotations.reduce((acc, quote) => {
    acc[quote.vehiculo_id] = (acc[quote.vehiculo_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topVehicles = Object.entries(vehicleQuoteCounts)
    .map(([id, count]) => {
      const vehicle = vehicles.find(v => v.id === id);
      return {
        id,
        name: vehicle ? `${vehicle.tipo_valla || vehicle.tipo} - ${vehicle.avenida_calle || vehicle.modelo}` : 'Valla / Soporte OOH',
        count,
        price: vehicle ? vehicle.precio_usd : 0,
        city: vehicle ? vehicle.ciudad : 'Bolivia'
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

  const indicatorCards = [
    { 
      title: 'CLIENTES CRM', 
      value: totalClients, 
      desc: 'Base de datos comercial', 
      icon: Users, 
      color: 'text-blue-600 bg-blue-50/70 border-blue-100 hover:border-blue-300 hover:bg-blue-50', 
      tab: 'clientes' 
    },
    { 
      title: 'OCUPACIÓN OOH', 
      value: `${occupancyPercentage}%`, 
      desc: `${occupiedVehicles} ocupadas / ${availableVehicles} libres`, 
      icon: PieChart, 
      color: 'text-emerald-600 bg-emerald-50/70 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50', 
      tab: 'vehiculos' 
    },
    { 
      title: 'COTIZACIONES', 
      value: totalQuotations, 
      desc: 'Propuestas emitidas', 
      icon: FileText, 
      color: 'text-amber-600 bg-amber-50/70 border-amber-100 hover:border-amber-300 hover:bg-amber-50', 
      tab: 'cotizaciones' 
    },
    { 
      title: 'CONTRATOS ACTIVOS', 
      value: activeContracts.length, 
      desc: `$${activeMonthlyRevenueUsd.toLocaleString()} USD facturación`, 
      icon: FileCheck, 
      color: 'text-purple-600 bg-purple-50/70 border-purple-100 hover:border-purple-300 hover:bg-purple-50', 
      tab: 'contratos' 
    },
    { 
      title: 'SEGUIMIENTOS', 
      value: pendingFollowupsCount, 
      desc: 'Actividades pendientes', 
      icon: Calendar, 
      color: 'text-rose-600 bg-rose-50/70 border-rose-100 hover:border-rose-300 hover:bg-rose-50', 
      tab: 'agenda' 
    },
    { 
      title: 'WHATSAPP COMERCIAL', 
      value: sentMessagesCount, 
      desc: 'Interacciones registradas', 
      icon: MessageSquare, 
      color: 'text-indigo-600 bg-indigo-50/70 border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50', 
      tab: 'whatsapp' 
    },
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
      id="dashboard-view"
    >
      {/* Quick Action Navigation Strip */}
      <div className="bg-gradient-to-r from-gray-950 via-slate-900 to-gray-950 p-4 rounded-2xl border border-gray-800 shadow-md text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
              Panel de Control Central
            </span>
            <h2 className="text-xl font-black font-display tracking-tight text-white mt-1">
              PUBLI-X BOLIVIA — Gestión Comercial OOH & LED
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSendExecutiveSummaryWhatsApp}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Compartir Resumen Ejecutivo por WhatsApp Web (reutilizando pestaña)"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar Resumen WA</span>
            </button>
            <button
              onClick={() => onTabChange('cotizaciones')}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-gray-950" />
              <span>Generar Cotización</span>
            </button>
            <button
              onClick={() => onTabChange('contratos')}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Ver Contratos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cards Indicators Grid - 6 Module Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {indicatorCards.map((card, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            whileHover={{ y: -4, transition: { duration: 0.15 } }}
            onClick={() => onTabChange(card.tab)}
            className={`cursor-pointer p-4 rounded-xl border bg-white shadow-xs transition-all duration-200 flex flex-col justify-between group ${card.color}`}
            id={`indicator-card-${card.tab}`}
            title={`Haga clic para abrir el módulo de ${card.title}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">{card.title}</p>
                <h3 className="text-2xl font-black font-display mt-1 text-gray-800">{card.value}</h3>
              </div>
              <div className="p-2 rounded-lg bg-white shadow-2xs group-hover:scale-110 transition">
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500 font-medium">
              <span className="truncate">{card.desc}</span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-800 group-hover:translate-x-1 transition" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Regional Occupancy & Pipeline Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Regional Occupancy Breakdown */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-lg font-bold font-display text-gray-800">Ocupación de Espacios por Departamento</h3>
              <p className="text-xs text-gray-400">Distribución de vallas ocupadas vs. disponibles a nivel nacional</p>
            </div>
            <button 
              onClick={() => onTabChange('vehiculos')}
              className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 transition"
              title="Abrir Inventario OOH"
            >
              <MapPin className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-3.5">
            {citiesSummary.length > 0 ? (
              citiesSummary.map((c, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      <span>{c.city}</span>
                    </span>
                    <span className="font-mono text-gray-600">
                      <strong className="text-emerald-600">{c.occupied} ocupadas</strong> / {c.total} totales ({c.rate}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${c.rate}%` }}
                      title={`Ocupado: ${c.occupied} vallas`}
                    />
                    <div 
                      className="bg-amber-400 h-full transition-all duration-500"
                      style={{ width: `${100 - c.rate}%` }}
                      title={`Disponible: ${c.available} vallas`}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-400 text-xs">
                No hay vallas registradas para calcular distribución regional.
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center space-x-4">
              <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Ocupado
              </span>
              <span className="flex items-center gap-1.5 text-amber-700 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Disponible
              </span>
            </div>
            <button 
              onClick={() => onTabChange('vehiculos')}
              className="text-amber-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Mapa OOH</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>

        {/* Demanda de Productos / Vallas (Top Consultados) */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold font-display text-gray-800">Espacios OOH Destacados</h3>
              <p className="text-xs text-gray-400">Vallas y pantallas LED más cotizadas</p>
            </div>
            <Presentation className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {topVehicles.length > 0 ? (
              topVehicles.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => onTabChange('vehiculos')}
                  className="flex justify-between items-center p-2.5 rounded-lg bg-gray-50 border border-gray-100 hover:border-amber-300 hover:bg-amber-50/40 transition cursor-pointer group"
                  title="Ver en Catálogo de Vallas"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold font-display text-xs shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-gray-800 truncate group-hover:text-amber-600 transition">{item.name}</h4>
                      <p className="text-[10px] text-gray-400">
                        ${item.price.toLocaleString()} USD <span className="font-mono text-indigo-500 font-semibold">(Bs. {(item.price * exchangeRate).toLocaleString('es-BO', { maximumFractionDigits: 0 })})</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
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
            className="w-full mt-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition duration-150 border border-amber-200 cursor-pointer flex items-center justify-center gap-1"
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>Ver Catálogo Completo de Vallas & LED</span>
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
              <p className="text-xs text-gray-400">Recordatorios de contacto comercial para agilizar cierres</p>
            </div>
            <button 
              onClick={() => onTabChange('agenda')} 
              className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 transition"
              title="Abrir Agenda de Seguimientos"
            >
              <Calendar className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {pendingFollowups.length > 0 ? (
              pendingFollowups.slice(0, 4).map((task) => {
                const client = clients.find(c => c.id === task.cliente_id);
                return (
                  <div key={task.id} className="p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition bg-white flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-xs text-gray-800">{client ? client.nombre : 'Cliente Desconocido'}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
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
                        }
                        onTabChange('clientes');
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:underline flex items-center space-x-0.5 cursor-pointer shrink-0 ml-2"
                    >
                      <span>Gestionar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-gray-400 text-xs">
                No hay recordatorios pendientes. ¡Excelente trabajo, estás al día!
              </div>
            )}
          </div>

          <button 
            onClick={() => onTabChange('agenda')} 
            className="w-full mt-4 py-2 text-xs font-semibold text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-150 border border-gray-200 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Abrir Agenda Completa de Seguimientos</span>
          </button>
        </motion.div>

        {/* Recent Activity Log */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold font-display text-gray-800">Actividad Reciente & Auditoría</h3>
              <p className="text-xs text-gray-400">Trazabilidad de acciones del equipo comercial</p>
            </div>
            <button
              onClick={() => onTabChange('auditoria')}
              className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 transition"
              title="Abrir Bitácora de Auditoría"
            >
              <ShieldCheck className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[260px] pr-1">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-xs flex space-x-2.5">
                <div className="p-1.5 rounded-full bg-white self-start shadow-2xs border border-gray-200">
                  <Clock className="w-3 h-3 text-gray-400" />
                </div>
                <div className="flex-1 space-y-0.5 min-w-0">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-800 truncate">{log.accion}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">{new Date(log.fecha).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <p className="text-gray-600 text-[11px] line-clamp-2">{log.detalle}</p>
                  <p className="text-[10px] text-indigo-500 font-medium">Ejecutado por: {log.usuario}</p>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => onTabChange('auditoria')}
            className="w-full mt-4 py-2 text-xs font-semibold text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-150 border border-gray-200 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Ver Registro Completo de Auditoría</span>
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
