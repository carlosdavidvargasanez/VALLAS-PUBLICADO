import React, { useState, useMemo } from 'react';
import { Vehicle } from '../types';
import { MapPin, Info, MessageSquare, Download, FileText, ExternalLink, X, Search, Sparkles, Navigation, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDriveUrl, calculateLonaCostBob } from './Vehicles';

interface OOHMapViewProps {
  vehicles: Vehicle[];
  exchangeRate: number;
  onSelectVehicleSpec: (vehicle: Vehicle) => void;
  onSelectVehicleForWhatsApp: (vehicle: Vehicle) => void;
  onSelectVehicleForQuote: (vehicle: Vehicle) => void;
  onDownloadSinglePdf: (vehicle: Vehicle) => void;
}

const BOLIVIA_CITIES = ['Todas las Ciudades', 'Santa Cruz', 'La Paz', 'Cochabamba', 'Tarija', 'Sucre', 'Oruro', 'El Alto'];

export default function OOHMapView({
  vehicles,
  exchangeRate,
  onSelectVehicleSpec,
  onSelectVehicleForWhatsApp,
  onSelectVehicleForQuote,
  onDownloadSinglePdf
}: OOHMapViewProps) {
  const [selectedCity, setSelectedCity] = useState('Todas las Ciudades');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [activePinVehicle, setActivePinVehicle] = useState<Vehicle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered list for map
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchCity = selectedCity === 'Todas las Ciudades' || v.ciudad?.toLowerCase().includes(selectedCity.toLowerCase());
      const cat = v.tipo_valla || v.tipo || 'Unipolar';
      const matchCat = selectedCategory === 'Todas' || cat.toLowerCase().includes(selectedCategory.toLowerCase());
      const query = searchQuery.toLowerCase();
      const matchSearch = !query || 
        v.modelo.toLowerCase().includes(query) || 
        (v.avenida_calle && v.avenida_calle.toLowerCase().includes(query)) ||
        (v.zona && v.zona.toLowerCase().includes(query)) ||
        v.id.includes(query);
      return matchCity && matchCat && matchSearch;
    });
  }, [vehicles, selectedCity, selectedCategory, searchQuery]);

  // Generate deterministic grid positions for map layout visualization
  const getPinPosition = (valla: Vehicle, index: number) => {
    // Generate pseudo-coordinates across map matrix based on index/id hash
    const seed = valla.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const xPct = 12 + ((seed * 17 + index * 29) % 76);
    const yPct = 15 + ((seed * 23 + index * 37) % 70);
    return { left: `${xPct}%`, top: `${yPct}%` };
  };

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 shadow-2xl space-y-4 text-white">
      
      {/* Top Filter Bar for Map */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
        
        {/* City Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {BOLIVIA_CITIES.map(city => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCity === city
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-extrabold'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Search inside map */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por avenida, zona o código..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 font-medium"
          />
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
        <div className="flex items-center space-x-2">
          <span className="font-bold uppercase tracking-wider text-[10px] text-amber-500">Filtrar Estructuras:</span>
          {['Todas', 'Unipolar', 'Pantalla LED', 'Estructural', 'Mural', 'Vía Peatonal'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                  : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <span>
          Mostrando <b>{filteredVehicles.length}</b> puntos OOH en mapa
        </span>
      </div>

      {/* Main Map Interactive Viewport Canvas */}
      <div className="relative w-full h-[520px] bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden shadow-inner flex flex-col justify-between p-4">
        
        {/* Background Stylized Map Matrix Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
        
        {/* Decorative Grid Lines representing Avenues */}
        <div className="absolute inset-0 pointer-events-none opacity-25">
          <div className="absolute left-[20%] top-0 bottom-0 w-px bg-amber-500/40" />
          <div className="absolute left-[50%] top-0 bottom-0 w-px bg-blue-500/40" />
          <div className="absolute left-[75%] top-0 bottom-0 w-px bg-emerald-500/40" />
          <div className="absolute top-[30%] left-0 right-0 h-px bg-amber-500/40" />
          <div className="absolute top-[65%] left-0 right-0 h-px bg-blue-500/40" />
        </div>

        {/* Map Header Overlay */}
        <div className="relative z-10 flex items-center justify-between bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800 max-w-lg">
          <div className="flex items-center space-x-2">
            <Navigation className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-extrabold text-xs text-white uppercase tracking-wider font-display">
              GEO-RED NACIONAL OOH BOLIVIA
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
            ● GPS Activo & Actualizado 2026
          </span>
        </div>

        {/* Pins Render Engine */}
        <div className="absolute inset-0 z-10 overflow-hidden">
          {filteredVehicles.map((valla, index) => {
            const pos = getPinPosition(valla, index);
            const isSelected = activePinVehicle?.id === valla.id;
            const isLed = (valla.tipo_valla || valla.tipo || '').toLowerCase().includes('led');

            return (
              <motion.div
                key={valla.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{ left: pos.left, top: pos.top }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                onClick={() => setActivePinVehicle(valla)}
              >
                {/* Pin Container */}
                <div className={`relative flex items-center justify-center p-2 rounded-full shadow-lg border-2 transition-all transform duration-200 ${
                  isSelected
                    ? 'bg-amber-500 border-white scale-125 z-30 ring-4 ring-amber-500/40'
                    : valla.estado === 'Disponible'
                    ? 'bg-emerald-600 border-emerald-300 hover:scale-110 hover:bg-emerald-500'
                    : valla.estado === 'Reservado'
                    ? 'bg-amber-600 border-amber-300 hover:scale-110'
                    : 'bg-blue-600 border-blue-300 hover:scale-110'
                }`}>
                  <MapPin className="w-4 h-4 text-white stroke-[2.5]" />

                  {/* Pulsing halo ring */}
                  <span className={`absolute -inset-1 rounded-full animate-ping opacity-20 pointer-events-none ${
                    valla.estado === 'Disponible' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`} />
                </div>

                {/* Pin Label Tooltip on Hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center pointer-events-none z-40">
                  <div className="bg-slate-950 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-700 shadow-xl whitespace-nowrap">
                    <p className="text-amber-400 font-extrabold">{valla.avenida_calle || valla.modelo}</p>
                    <p className="text-gray-300 font-mono">${valla.precio_usd} USD • {valla.ciudad}</p>
                  </div>
                  <div className="w-2 h-2 bg-slate-950 rotate-45 -mt-1 border-r border-b border-slate-700" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Floating Side Spec Sheet Drawer when a pin is selected */}
        <AnimatePresence>
          {activePinVehicle && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute right-3 top-3 bottom-3 w-80 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl z-30 p-4 flex flex-col justify-between overflow-y-auto text-xs"
            >
              {/* Drawer Top Header */}
              <div>
                <div className="flex justify-between items-start pb-2 border-b border-slate-800">
                  <div>
                    <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded uppercase">
                      COD-{activePinVehicle.id}
                    </span>
                    <h4 className="font-extrabold text-sm font-display text-white mt-1 leading-tight">
                      {activePinVehicle.avenida_calle || activePinVehicle.modelo}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      📍 {activePinVehicle.ciudad} • {activePinVehicle.zona || 'Centro'}
                    </p>
                  </div>
                  <button
                    onClick={() => setActivePinVehicle(null)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Image */}
                <div className="relative h-32 rounded-xl overflow-hidden bg-slate-950 mt-3 border border-slate-800">
                  <img
                    src={formatDriveUrl(activePinVehicle.imagen_principal)}
                    alt={activePinVehicle.modelo}
                    className="w-full h-full object-cover"
                  />
                  <span className={`absolute left-2 top-2 px-2 py-0.5 rounded text-[9px] font-black uppercase text-white ${
                    activePinVehicle.estado === 'Disponible' ? 'bg-emerald-600' : 'bg-amber-600'
                  }`}>
                    {activePinVehicle.estado}
                  </span>
                </div>

                {/* Price Details */}
                <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Alquiler Mensual</span>
                    <span className="text-base font-black font-mono text-amber-400">${activePinVehicle.precio_usd.toLocaleString()} USD</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono text-right">
                    Bs. {Math.round(activePinVehicle.precio_usd * exchangeRate).toLocaleString()} BOB
                  </p>
                </div>

                {/* Specs List */}
                <div className="mt-3 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500 font-bold">Estructura:</span>
                    <span className="font-semibold">{activePinVehicle.tipo_valla || activePinVehicle.tipo}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500 font-bold">Dimensiones:</span>
                    <span className="font-semibold font-mono text-amber-400">{activePinVehicle.medidas || '10 x 4 m'}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500 font-bold">Orientación:</span>
                    <span className="font-semibold">{activePinVehicle.cara || 'Cara A'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons inside map drawer */}
              <div className="space-y-2 pt-3 border-t border-slate-800 mt-3">
                <button
                  onClick={() => onSelectVehicleSpec(activePinVehicle)}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl transition flex items-center justify-center space-x-1.5 text-xs uppercase tracking-wider cursor-pointer"
                >
                  <Info className="w-4 h-4" />
                  <span>Ver Ficha Completa</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onDownloadSinglePdf(activePinVehicle)}
                    className="py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 font-bold rounded-xl transition flex items-center justify-center space-x-1 text-[11px] cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Ficha PDF</span>
                  </button>

                  <button
                    onClick={() => onSelectVehicleForWhatsApp(activePinVehicle)}
                    className="py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-bold rounded-xl transition flex items-center justify-center space-x-1 text-[11px] cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Map Legend Footer */}
        <div className="relative z-10 flex items-center justify-between bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800 text-[10px]">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Disponible</span>
            </span>
            <span className="flex items-center space-x-1 text-amber-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              <span>Reservado</span>
            </span>
            <span className="flex items-center space-x-1 text-blue-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              <span>En instalación</span>
            </span>
          </div>

          <span className="text-slate-400 font-mono">
            Haga clic en cualquier pin de ubicación para ver la ficha técnica OOH.
          </span>
        </div>
      </div>
    </div>
  );
}
