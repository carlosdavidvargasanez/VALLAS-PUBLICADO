import React, { useEffect, useState } from 'react';
import { MapPin, Loader2, Navigation, Compass, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { BOLIVIA_DEPARTMENT_PATHS, SVG_ID_TO_DEPARTMENT_NAME } from '../assets/maps/boliviaMapData';

interface ZoneItem {
  nombre: string;
  total: number;
  disponibles: number;
  avenidas?: string[];
}

interface DepartmentStat {
  departamento: string;
  total: number;
  disponibles: number;
  zonas?: ZoneItem[];
}

interface BoliviaCoverageMapProps {
  onRequestQuote?: (deptName: string, zoneName?: string) => void;
}

export default function BoliviaCoverageMap({ onRequestQuote }: BoliviaCoverageMapProps) {
  const [stats, setStats] = useState<DepartmentStat[] | null>(null);
  const [totalNacional, setTotalNacional] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedDept, setSelectedDept] = useState<string>('Santa Cruz');
  const [hovered, setHovered] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.getPublicCoverageByDepartment()
      .then(data => {
        if (cancelled) return;
        setStats(data.byDepartment);
        setTotalNacional(data.totalNacional);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const getCount = (dep: string) => stats?.find((s: DepartmentStat) => s.departamento === dep)?.total ?? 0;
  const getDisponibles = (dep: string) => stats?.find((s: DepartmentStat) => s.departamento === dep)?.disponibles ?? 0;
  const getZonas = (dep: string): ZoneItem[] => {
    const found = stats?.find((s: DepartmentStat) => s.departamento === dep);
    if (found?.zonas && found.zonas.length > 0) return found.zonas;
    // Default fallback zones for major departments
    if (dep === 'Santa Cruz') {
      return [
        { nombre: 'Zona Norte (Banzer / Cristo Redentor)', total: 12, disponibles: 9, avenidas: ['Av. Banzer 2do a 8vo Anillo', 'Av. Beni', 'Av. Alemana'] },
        { nombre: 'Zona Equipetrol & San Martín', total: 8, disponibles: 6, avenidas: ['Av. San Martín', 'Canal Isuto', 'Equipetrol Norte'] },
        { nombre: 'Zona Doble Vía a La Guardia', total: 6, disponibles: 5, avenidas: ['Doble Vía a La Guardia', 'Av. Santos Dumont'] },
        { nombre: 'Zona Plan Tres Mil', total: 4, disponibles: 3, avenidas: ['Av. Che Guevara', 'Rotonda Plan 3000'] },
        { nombre: 'Zona Villa Primero de Mayo', total: 4, disponibles: 4, avenidas: ['Av. Cumavi', 'Av. Principal'] }
      ];
    }
    if (dep === 'La Paz') {
      return [
        { nombre: 'Zona Sur (Calacoto & San Miguel)', total: 8, disponibles: 6, avenidas: ['Av. Ballivián', 'Av. Montenegro', 'Calle 21'] },
        { nombre: 'Zona Sopocachi & San Jorge', total: 6, disponibles: 5, avenidas: ['Plaza Abaroa', 'Av. 6 de Agosto', 'Av. 20 de Octubre'] },
        { nombre: 'Zona Central & El Prado', total: 5, disponibles: 4, avenidas: ['Av. 16 de Julio (Prado)', 'Av. Mariscal Santa Cruz'] },
        { nombre: 'El Alto (Ceja & Autopista)', total: 7, disponibles: 5, avenidas: ['Ceja de El Alto', 'Autopista La Paz-El Alto'] }
      ];
    }
    if (dep === 'Cochabamba') {
      return [
        { nombre: 'Zona Norte (Av. América & Pando)', total: 7, disponibles: 5, avenidas: ['Av. América', 'Av. Pando', 'Av. Santa Cruz'] },
        { nombre: 'Zona Central & Plaza Colón', total: 5, disponibles: 4, avenidas: ['Av. Heroínas', 'Av. Ayacucho'] },
        { nombre: 'Av. Blanco Galindo (Quillacollo)', total: 6, disponibles: 4, avenidas: ['Km 3 al Km 10 Blanco Galindo'] }
      ];
    }
    return [
      { nombre: `Zona Central ${dep}`, total: getCount(dep) || 2, disponibles: getDisponibles(dep) || 1, avenidas: ['Avenida Principal', 'Plaza Central'] },
      { nombre: `Zona Comercial & Accesos`, total: Math.max(1, Math.floor(getCount(dep) / 2)), disponibles: 1, avenidas: ['Av. Circunvalación', 'Ruta Troncal'] }
    ];
  };

  const maxCount = stats && stats.length > 0 ? Math.max(1, ...stats.map((s: DepartmentStat) => s.total)) : 1;

  const getFill = (dep: string) => {
    if (selectedDept === dep) {
      return '#ff8c00'; // Brand Orange on active select
    }
    const count = getCount(dep);
    if (count === 0) return 'rgba(255,255,255,0.06)';
    const intensity = count / maxCount; // 0..1
    const alpha = 0.35 + intensity * 0.55;
    return intensity > 0.6
      ? `rgba(255,140,0,${alpha})`   // #ff8c00 brand orange
      : `rgba(15,160,230,${alpha})`; // #0fa0e6 brand blue
  };

  const currentDisplayDept = hovered || selectedDept;
  const currentZones = getZonas(currentDisplayDept);
  const activeZoneData = selectedZone ? currentZones.find(z => z.nombre === selectedZone) : null;

  return (
    <div className="bg-[#0a111e] border border-[#0fa0e6]/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden" id="mapa-bolivia-cobertura">
      {/* Glow effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff8c00]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#0fa0e6]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#ff8c00]/20 border border-[#ff8c00]/40 text-[#ff8c00] text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff8c00] animate-ping" />
              MAPA OFICIAL DE BOLIVIA
            </span>
          </div>
          <h3 className="text-lg sm:text-2xl font-black text-white uppercase tracking-wide">
            Cobertura por <span className="text-[#ff8c00]">Departamento</span>
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Haga clic en cualquier departamento en el mapa geográfico para explorar sus zonas comerciales disponibles.
          </p>
        </div>
        {!loading && !error && (
          <span className="bg-[#0fa0e6]/15 text-[#0fa0e6] border border-[#0fa0e6]/40 text-xs font-black px-4 py-2 rounded-full uppercase tracking-wider shadow-md">
            {totalNacional}+ Espacios a Nivel Nacional
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm py-20 relative z-10">
          <Loader2 className="w-5 h-5 animate-spin text-[#ff8c00]" />
          Cargando mapa oficial y cobertura nacional...
        </div>
      )}

      {error && !loading && (
        <div className="text-center text-gray-400 text-sm py-20 relative z-10">
          No se pudo cargar la cobertura en este momento. Intente nuevamente más tarde.
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
          {/* Left Column: Official Simplemaps Bolivia SVG Map (ViewBox 0 0 1000 1000) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center p-3 bg-[#0d182b]/90 border border-[#0fa0e6]/25 rounded-3xl shadow-inner backdrop-blur-xs">
              <svg
                viewBox="0 0 1000 1000"
                className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)] select-none"
                style={{ maxHeight: '460px' }}
              >
                <defs>
                  <filter id="glow-dept-active" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Lake Titicaca geographic reference on the La Paz border */}
                <g pointerEvents="none" opacity="0.85">
                  <path
                    d="M 98 345 Q 125 365 145 355 Q 125 385 100 375 Z"
                    fill="#00bcd4"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <text x="50" y="360" fontSize="13" fill="#38bdf8" fontWeight="bold">Lago Titicaca</text>
                </g>

                {/* 9 Department Paths */}
                {BOLIVIA_DEPARTMENT_PATHS.map(dep => {
                  const deptName = SVG_ID_TO_DEPARTMENT_NAME[dep.id] || dep.name;
                  const isSelected = selectedDept === deptName;
                  const isHovered = hovered === deptName;
                  const count = getCount(deptName);

                  return (
                    <g key={dep.id} className="group">
                      <path
                        id={dep.id}
                        d={dep.d}
                        onClick={() => {
                          setSelectedDept(deptName);
                          setSelectedZone(null);
                        }}
                        onMouseEnter={() => setHovered(deptName)}
                        onMouseLeave={() => setHovered(null)}
                        fill={getFill(deptName)}
                        stroke={isSelected ? '#ff8c00' : isHovered ? '#ffffff' : 'rgba(15,160,230,0.4)'}
                        strokeWidth={isSelected ? 4 : isHovered ? 2.5 : 1.2}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        filter={isSelected ? 'url(#glow-dept-active)' : undefined}
                        className="cursor-pointer transition-colors duration-200 hover:brightness-110"
                      />

                      {/* Text Label & Badge */}
                      <g
                        transform={`translate(${dep.center.x}, ${dep.center.y})`}
                        pointerEvents="none"
                      >
                        <circle
                          r={isSelected ? 18 : 14}
                          fill={isSelected ? '#ffffff' : isHovered ? '#ff8c00' : '#0a111e'}
                          stroke={isSelected ? '#ff8c00' : '#ffffff'}
                          strokeWidth={2}
                        />
                        <text
                          textAnchor="middle"
                          dy="4.5"
                          fontSize={isSelected ? "13" : "11"}
                          fontWeight="900"
                          fill={isSelected ? '#0a111e' : '#ffffff'}
                          fontFamily="monospace"
                        >
                          {count}
                        </text>
                        <text
                          textAnchor="middle"
                          dy={isSelected ? "32" : "28"}
                          fontSize={isSelected ? "15" : "13"}
                          fontWeight="900"
                          fill={isSelected ? '#ffffff' : '#e2e8f0'}
                          style={{
                            textShadow: '0 2px 8px rgba(0,0,0,0.95), 0 0 4px #000',
                            textTransform: 'uppercase'
                          }}
                        >
                          {deptName}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>

              {/* Interactive notice badge */}
              <div className="absolute bottom-3 left-3 bg-[#0a111e]/90 border border-[#0fa0e6]/30 px-3 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-2 text-[11px] text-gray-200">
                <span className="w-2 h-2 rounded-full bg-[#ff8c00] animate-pulse" />
                <span>Toque cualquier departamento para iluminarlo</span>
              </div>
            </div>

            {/* Quick department selection chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3.5 w-full max-w-[480px]">
              {BOLIVIA_DEPARTMENT_PATHS.map(dep => {
                const deptName = SVG_ID_TO_DEPARTMENT_NAME[dep.id] || dep.name;
                const isSelected = selectedDept === deptName;
                const count = getCount(deptName);
                return (
                  <button
                    key={dep.id}
                    onClick={() => {
                      setSelectedDept(deptName);
                      setSelectedZone(null);
                    }}
                    onMouseEnter={() => setHovered(deptName)}
                    onMouseLeave={() => setHovered(null)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase transition-all duration-200 flex items-center gap-1.5 cursor-pointer border ${
                      isSelected
                        ? 'bg-[#ff8c00] text-gray-950 border-[#ff8c00] shadow-md shadow-[#ff8c00]/30 font-black scale-105'
                        : 'bg-[#0d182b] text-gray-300 border-[#0fa0e6]/25 hover:border-[#ff8c00] hover:text-white'
                    }`}
                  >
                    <span>{deptName}</span>
                    <span className={`px-1 py-0.2 rounded text-[9px] font-mono font-bold ${
                      isSelected ? 'bg-gray-950/20 text-gray-950' : 'bg-[#0fa0e6]/20 text-[#0fa0e6]'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Interactive Zones & Detail Panel */}
          <div className="lg:col-span-6 w-full space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentDisplayDept}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="bg-gradient-to-br from-[#0d182b] to-[#0a111e] border-2 border-[#ff8c00] rounded-3xl p-5 sm:p-6 shadow-xl space-y-5"
              >
                {/* Department Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#0fa0e6]/20">
                  <div>
                    <div className="flex items-center gap-2 text-[#ff8c00] font-black uppercase text-xs">
                      <MapPin className="w-4 h-4" />
                      <span>DEPARTAMENTO SELECCIONADO</span>
                    </div>
                    <h4 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mt-1">
                      {currentDisplayDept}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3.5 py-1.5 bg-[#0a111e] border border-[#0fa0e6]/30 rounded-xl text-center">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Total OOH</span>
                      <span className="text-base font-black text-white font-mono">{getCount(currentDisplayDept)}</span>
                    </div>
                    <div className="px-3.5 py-1.5 bg-[#0a111e] border border-[#ff8c00]/30 rounded-xl text-center">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Disponibles</span>
                      <span className="text-base font-black text-[#ff8c00] font-mono">{getDisponibles(currentDisplayDept)}</span>
                    </div>
                  </div>
                </div>

                {/* Commercial Zones list */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-[#ff8c00]" />
                      <span>Zonas Comerciales en {currentDisplayDept}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-semibold">
                      {currentZones.length} zonas
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* All department button */}
                    <button
                      onClick={() => setSelectedZone(null)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold text-left transition-all duration-200 flex items-center justify-between border cursor-pointer ${
                        selectedZone === null
                          ? 'bg-[#ff8c00] text-gray-950 border-[#ff8c00] shadow-md font-black'
                          : 'bg-[#132742]/80 text-gray-300 border-[#0fa0e6]/25 hover:border-[#ff8c00] hover:text-white'
                      }`}
                    >
                      <span className="truncate">Todo {currentDisplayDept}</span>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ml-2 ${
                        selectedZone === null ? 'bg-gray-950/20 text-gray-950' : 'bg-[#0a111e] text-[#0fa0e6]'
                      }`}>
                        {getCount(currentDisplayDept)}
                      </span>
                    </button>

                    {/* Zone item buttons */}
                    {currentZones.map((zone, idx) => {
                      const isZoneActive = selectedZone === zone.nombre;
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedZone(zone.nombre)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold text-left transition-all duration-200 flex items-center justify-between border cursor-pointer ${
                            isZoneActive
                              ? 'bg-[#ff8c00] text-gray-950 border-[#ff8c00] shadow-md font-black'
                              : 'bg-[#0a111e] text-gray-300 border-[#0fa0e6]/25 hover:border-[#ff8c00] hover:text-white'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <Navigation className={`w-3.5 h-3.5 shrink-0 ${isZoneActive ? 'text-gray-950' : 'text-[#0fa0e6]'}`} />
                            <span className="truncate">{zone.nombre}</span>
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ml-2 shrink-0 ${
                            isZoneActive ? 'bg-gray-950/20 text-gray-950' : 'bg-[#132742] text-[#ff8c00]'
                          }`}>
                            {zone.total}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Zone or Department Details */}
                <div className="bg-[#0a111e] border border-[#0fa0e6]/30 rounded-2xl p-4 space-y-2.5">
                  {activeZoneData ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#ff8c00] animate-ping" />
                          <span className="text-xs font-black text-white uppercase">
                            Zona: <span className="text-[#ff8c00]">{activeZoneData.nombre}</span>
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-[#0fa0e6] font-bold">
                          {activeZoneData.disponibles} disponibles
                        </span>
                      </div>

                      {activeZoneData.avenidas && activeZoneData.avenidas.length > 0 && (
                        <div className="mt-2">
                          <span className="text-[11px] text-gray-400 font-bold uppercase block mb-1">
                            Avenidas y Corredores Principales:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {activeZoneData.avenidas.map((av, i) => (
                              <span key={i} className="px-2 py-0.5 bg-[#132742] border border-[#0fa0e6]/30 rounded-md text-[11px] text-gray-200">
                                {av}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#ff8c00]" />
                        Cobertura en {currentDisplayDept}:
                      </div>
                      <p className="text-xs text-gray-400">
                        Vallas monumentales, unipolares y pantallas digitales LED de alto tráfico vehicular en {currentDisplayDept}. Solicite cotización para ver coordenadas GPS y fotos actualizadas.
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <button
                  onClick={() => {
                    if (onRequestQuote) {
                      onRequestQuote(currentDisplayDept, selectedZone || undefined);
                    } else {
                      const el = document.getElementById('catalogo');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-[#ff8c00] to-[#e65100] hover:from-[#ff991a] hover:to-[#f57c00] text-gray-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#ff8c00]/25 cursor-pointer"
                >
                  <span>
                    {selectedZone
                      ? `Cotizar en ${selectedZone} (${currentDisplayDept})`
                      : `Solicitar Catálogo Completo en ${currentDisplayDept}`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
