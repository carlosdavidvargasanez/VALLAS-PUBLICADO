import React, { useState } from 'react';
import { Client, Vehicle } from '../types';
import { 
  Users, 
  Sparkles, 
  TrendingUp, 
  ArrowRight, 
  Presentation, 
  Check, 
  DollarSign, 
  ChevronRight,
  MessageSquare,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';

interface RecommendationProps {
  clients: Client[];
  vehicles: Vehicle[];
  activeClient: Client | null;
  onSelectActiveClient: (client: Client | null) => void;
  onSelectVehicleForWhatsApp: (vehicle: Vehicle) => void;
  onSelectVehicleForQuote: (vehicle: Vehicle) => void;
  onAssociateVehicleToClient: (clientId: string, vehicleId: string) => void;
  exchangeRate: number;
}

export default function Recommendation({
  clients,
  vehicles,
  activeClient,
  onSelectActiveClient,
  onSelectVehicleForWhatsApp,
  onSelectVehicleForQuote,
  onAssociateVehicleToClient,
  exchangeRate
}: RecommendationProps) {
  
  // Calculate match logic
  const getCompatibility = (clientBudget: number, vehiclePrice: number) => {
    if (!clientBudget || clientBudget <= 0) return { percent: 0, label: 'Baja', color: 'text-gray-500 bg-gray-50 border-gray-200', stars: 1 };
    
    const diff = Math.abs(clientBudget - vehiclePrice);
    const percent = Math.max(0, Math.min(100, Math.round(100 - (diff / clientBudget) * 100)));

    let label = 'Baja Coincidencia';
    let color = 'text-rose-700 bg-rose-50 border-rose-100';
    let stars = 1;

    if (percent >= 90) {
      label = 'Excelente Coincidencia';
      color = 'text-emerald-700 bg-emerald-50 border-emerald-100';
      stars = 5;
    } else if (percent >= 75) {
      label = 'Alta Coincidencia';
      color = 'text-indigo-700 bg-indigo-50 border-indigo-100';
      stars = 4;
    } else if (percent >= 60) {
      label = 'Media Coincidencia';
      color = 'text-amber-700 bg-amber-50 border-amber-100';
      stars = 3;
    } else {
      stars = 2;
    }

    return { percent, label, color, stars };
  };

  // Process recommendations if client is selected
  const recommendedVehicles = activeClient
    ? vehicles
        .filter(v => v.estado === 'Disponible' || v.estado === 'En importación')
        .map(v => {
          const comp = getCompatibility(activeClient.presupuesto_usd, v.precio_usd);
          return { ...v, comp };
        })
        .sort((a, b) => b.comp.percent - a.comp.percent)
    : [];

  // Filter into categories
  const excellentMatches = recommendedVehicles.filter(v => v.comp.percent >= 90);
  const highMatches = recommendedVehicles.filter(v => v.comp.percent >= 75 && v.comp.percent < 90);
  const otherMatches = recommendedVehicles.filter(v => v.comp.percent < 75);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="space-y-6" id="recommendation-engine-view">
      
      {/* Selector box */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2.5 text-gray-700">
          <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
          <div>
            <h3 className="text-base font-bold font-display text-gray-800 uppercase tracking-wider">Asistente de Recomendación Inteligente</h3>
            <p className="text-xs text-gray-400">Analiza el perfil del cliente para emparejarlo con el inventario idóneo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Client select drop */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500">Seleccionar Cliente para Análisis</label>
            <select
              value={activeClient ? activeClient.id : ''}
              onChange={(e) => {
                const client = clients.find(c => c.id === e.target.value) || null;
                onSelectActiveClient(client);
              }}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white transition font-medium text-gray-700"
            >
              <option value="">-- Elija un Cliente para comenzar --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre} (Pto: ${c.presupuesto_usd.toLocaleString()} USD)
                </option>
              ))}
            </select>
          </div>

          {activeClient && (
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-600 flex flex-col justify-between">
              <div>
                <p className="font-semibold text-gray-800">Presupuesto Comercial:</p>
                <p className="text-lg font-bold font-mono text-amber-600 mt-0.5">
                  ${activeClient.presupuesto_usd.toLocaleString()} USD
                  <span className="text-[10px] text-gray-400 ml-1.5 font-normal">
                    (Bs. {(activeClient.presupuesto_usd * exchangeRate).toLocaleString()})
                  </span>
                </p>
              </div>
              <p className="text-[10px] text-gray-400 italic truncate mt-1">
                Ubicación: {activeClient.ciudad} • Estado actual: {activeClient.estado}
              </p>
            </div>
          )}
        </div>
      </div>

      {activeClient ? (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Excellent Matches Section (90-100%) */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-2">
              <span className="w-1.5 h-3 bg-emerald-500 rounded" />
              <span>Opciones Excelentes (90% - 100% de Coincidencia)</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">
                {excellentMatches.length} recomendadas
              </span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {excellentMatches.map((vehicle) => (
                <motion.div
                  variants={cardVariants}
                  key={vehicle.id}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-2xs hover:shadow-xs flex flex-col justify-between"
                >
                  <div className="relative h-44">
                    <img 
                      src={vehicle.imagen_principal} 
                      alt={vehicle.modelo} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    
                    <div className="absolute left-3 top-3 flex flex-col space-y-1">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs border ${vehicle.comp.color}`}>
                        ★ Coincidencia {vehicle.comp.percent}%
                      </span>
                    </div>

                    <div className="absolute left-4 bottom-3 text-white">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400">{vehicle.marca}</span>
                      <h5 className="font-bold text-sm leading-tight font-display">{vehicle.modelo}</h5>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    <div className="space-y-1 text-xs text-gray-500">
                      <p className="flex justify-between">
                        <span>Alquiler mensual:</span>
                        <b className="text-gray-800">${vehicle.precio_usd.toLocaleString()} USD</b>
                      </p>
                      <p className="flex justify-between">
                        <span>Diferencia Presupuesto:</span>
                        <b className="text-emerald-600">
                          -${Math.abs(activeClient.presupuesto_usd - vehicle.precio_usd).toLocaleString()} USD
                        </b>
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onAssociateVehicleToClient(activeClient.id, vehicle.id);
                          alert(`Se guardó ${vehicle.marca} ${vehicle.modelo} como propuesta favorita para ${activeClient.nombre}`);
                        }}
                        className="flex-1 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-lg text-xs border border-gray-200 transition"
                      >
                        Registrar Interés
                      </button>

                      <button
                        onClick={() => onSelectVehicleForWhatsApp(vehicle)}
                        className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-100 transition"
                        title="Enviar por WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onSelectVehicleForQuote(vehicle)}
                        className="p-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg border border-purple-100 transition"
                        title="Hacer Cotización PDF"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {excellentMatches.length === 0 && (
                <div className="col-span-3 text-center py-6 border border-dashed border-gray-100 rounded-xl text-gray-400 text-xs">
                  No hay vallas publicitarias en el rango de coincidencia ideal para este presupuesto.
                </div>
              )}
            </div>
          </div>

          {/* High Matches Section (75-89%) */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center space-x-2">
              <span className="w-1.5 h-3 bg-indigo-500 rounded" />
              <span>Opciones Altamente Recomendables (75% - 89% de Coincidencia)</span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
                {highMatches.length} recomendadas
              </span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {highMatches.map((vehicle) => (
                <motion.div
                  variants={cardVariants}
                  key={vehicle.id}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-2xs hover:shadow-xs flex flex-col justify-between"
                >
                  <div className="relative h-44">
                    <img 
                      src={vehicle.imagen_principal} 
                      alt={vehicle.modelo} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    
                    <div className="absolute left-3 top-3 flex flex-col space-y-1">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-xs border ${vehicle.comp.color}`}>
                        ★ Coincidencia {vehicle.comp.percent}%
                      </span>
                    </div>

                    <div className="absolute left-4 bottom-3 text-white">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400">{vehicle.marca}</span>
                      <h5 className="font-bold text-sm leading-tight font-display">{vehicle.modelo}</h5>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    <div className="space-y-1 text-xs text-gray-500">
                      <p className="flex justify-between">
                        <span>Precio base EE.UU:</span>
                        <b className="text-gray-800">${vehicle.precio_usd.toLocaleString()} USD</b>
                      </p>
                      <p className="flex justify-between">
                        <span>Desviación Presupuesto:</span>
                        <b className="text-indigo-600">
                          +${Math.abs(activeClient.presupuesto_usd - vehicle.precio_usd).toLocaleString()} USD
                        </b>
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onAssociateVehicleToClient(activeClient.id, vehicle.id);
                          alert(`Se guardó ${vehicle.marca} ${vehicle.modelo} como propuesta favorita para ${activeClient.nombre}`);
                        }}
                        className="flex-1 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-lg text-xs border border-gray-200 transition"
                      >
                        Registrar Interés
                      </button>

                      <button
                        onClick={() => onSelectVehicleForWhatsApp(vehicle)}
                        className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-100 transition"
                        title="Enviar por WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onSelectVehicleForQuote(vehicle)}
                        className="p-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg border border-purple-100 transition"
                        title="Hacer Cotización PDF"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {highMatches.length === 0 && (
                <div className="col-span-3 text-center py-6 border border-dashed border-gray-100 rounded-xl text-gray-400 text-xs">
                  No hay vehículos en este rango de precios.
                </div>
              )}
            </div>
          </div>

          {/* Other Matches */}
          {otherMatches.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Otras opciones (Alternativas o fuera de rango ideal)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {otherMatches.slice(0, 4).map((vehicle) => (
                  <div key={vehicle.id} className="p-3 bg-white border border-gray-100 rounded-lg shadow-2xs flex items-center justify-between">
                    <div className="truncate pr-2">
                      <h5 className="font-bold text-gray-800 text-xs truncate">{vehicle.marca} {vehicle.modelo}</h5>
                      <span className="text-[10px] text-gray-400 font-mono">${vehicle.precio_usd.toLocaleString()}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded border border-gray-200">
                      {vehicle.comp.percent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="bg-white p-12 text-center border border-dashed border-gray-200 rounded-xl space-y-3">
          <Presentation className="w-10 h-10 text-gray-300 mx-auto" />
          <h4 className="font-bold text-gray-700 font-display">Asistente en Espera</h4>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Por favor, seleccione un cliente en el menú de arriba para que el recomendador evalúe automáticamente el catálogo e indique las mejores opciones compatibles.
          </p>
        </div>
      )}
    </div>
  );
}
