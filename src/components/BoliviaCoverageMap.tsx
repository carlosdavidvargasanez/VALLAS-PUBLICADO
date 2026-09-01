import React, { useEffect, useState } from 'react';
import { MapPin, Loader2, Navigation, Compass, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { BOLIVIA_DEPARTMENT_PATHS, SVG_ID_TO_DEPARTMENT_NAME, DEPARTMENT_TONES } from '../assets/maps/boliviaMapData';

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

  // Color functions respecting custom distinct blues and custom distinct oranges per department
  const getFill = (dep: string) => {
    const tones = DEPARTMENT_TONES[dep] || {
      blueColor: '#0284c7',
      blueHover: '#38bdf8',
      orangeColor: '#ff8c00',
      orangeGlow: 'rgba(255, 140, 0, 0.6)'
    };

    if (selectedDept === dep) {
      return tones.orangeColor;
    }
    if (hovered === dep) {
      return tones.blueHover;
    }
    return tones.blueColor;
  };

  const currentDisplayDept = hovered || selectedDept;
  const currentTones = DEPARTMENT_TONES[currentDisplayDept] || {
    blueColor: '#0284c7',
    blueHover: '#38bdf8',
    orangeColor: '#ff8c00',
    orangeGlow: 'rgba(255, 140, 0, 0.6)'
  };
  const currentZones = getZonas(currentDisplayDept);
  const activeZoneData = selectedZone ? currentZones.find(z => z.nombre === selectedZone) : null;

  return (
    <div className="bg-[#0a111e] border border-[#0fa0e6]/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden" id="mapa-bolivia-cobertura">
      {/* Dynamic Glow effects tailored to active department */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-colors duration-500 opacity-25"
        style={{ backgroundColor: currentTones.orangeColor }}
      />
      <div
        className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-colors duration-500 opacity-20"
        style={{ backgroundColor: currentTones.blueColor }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors duration-300"
              style={{
                backgroundColor: `${currentTones.orangeColor}20`,
                borderColor: `${currentTones.orangeColor}50`,
                color: currentTones.orangeColor
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-ping"
                style={{ backgroundColor: currentTones.orangeColor }}
              />
              MAPA OFICIAL DE BOLIVIA &bull; 9 DEPARTAMENTOS
            </span>
          </div>
          <h3 className="text-lg sm:text-2xl font-black text-white uppercase tracking-wide">
            Cobertura por <span style={{ color: currentTones.orangeColor }}>Departamento</span>
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Cada departamento cuenta con su tono de azul distintivo. Haga clic en cualquiera para activarlo en su tonalidad naranja exclusiva y explorar sus zonas comerciales.
          </p>
        </div>
        {!loading && !error && (
          <span className="bg-[#0fa0e6]/15 text-[#0fa0e6] border border-[#0fa0e6]/40 text-xs font-black px-4 py-2 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#ff8c00]" />
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
            <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center p-3 bg-[#0d182b]/95 border border-[#0fa0e6]/25 rounded-3xl shadow-inner backdrop-blur-xs">
              <svg
                viewBox="0 0 1000 1000"
                className="w-full h-full filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.75)] select-none"
                style={{ maxHeight: '460px' }}
              >
                <defs>
                  <filter id="glow-dept-active" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Lake Titicaca geographic reference on the La Paz border */}
                <g pointerEvents="none" opacity="0.85">
                  <path
                    d="M 98 345 Q 125 365 145 355 Q 125 385 100 375 Z"
                    fill="#38bdf8"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <text x="48" y="360" fontSize="12" fill="#7dd3fc" fontWeight="bold">Lago Titicaca</text>
                </g>

                {/* 9 Department Paths with distinct individual Blue and Orange tones */}
                {BOLIVIA_DEPARTMENT_PATHS.map(dep => {
                  const deptName = SVG_ID_TO_DEPARTMENT_NAME[dep.id] || dep.name;
                  const isSelected = selectedDept === deptName;
                  const isHovered = hovered === deptName;
                  const count = getCount(deptName);
                  const tone = DEPARTMENT_TONES[deptName] || dep;

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
                        stroke={isSelected ? '#ffffff' : isHovered ? '#ffffff' : 'rgba(255,255,255,0.45)'}
                        strokeWidth={isSelected ? 4 : isHovered ? 2.5 : 1.2}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        filter={isSelected ? 'url(#glow-dept-active)' : undefined}
                        className="cursor-pointer transition-all duration-300 hover:brightness-115"
                      />

                      {/* Text Label & Badge */}
                      <g
                        transform={`translate(${dep.center.x}, ${dep.center.y})`}
                        pointerEvents="none"
                      >
                        <circle
                          r={isSelected ? 18 : 14}
                          fill={isSelected ? '#ffffff' : isHovered ? tone.orangeColor : '#0a111e'}
                          stroke={isSelected ? tone.orangeColor : '#ffffff'}
                          strokeWidth={isSelected ? 3 : 1.8}
                          className="transition-all duration-300"
                        />
                        <text
                          textAnchor="middle"
                          dy="4.5"
                          fontSize={isSelected ? "13" : "11"}
                          fontWeight="900"
                          fill={isSelected ? tone.orangeColor : '#ffffff'}
                          fontFamily="monospace"
                        >
                          {count}
                        </text>
                        <text
                          textAnchor="middle"
                          dy={isSelected ? "32" : "28"}
                          fontSize={isSelected ? "15" : "13"}
                          fontWeight="900"
                          fill={isSelected ? '#ffffff' : '#f1f5f9'}
                          style={{
                            textShadow: '0 2px 8px rgba(0,0,0,0.98), 0 0 4px #000',
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em'
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
              <div className="absolute bottom-3 left-3 bg-[#0a111e]/90 border border-[#0fa0e6]/30 px-3 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-2 text-[11px] text-gray-200 shadow-md">
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: currentTones.orangeColor }}
                />
                <span>Toque un departamento para iluminarlo en naranja</span>
              </div>
            </div>

            {/* Quick department selection chips with matching colors */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3.5 w-full max-w-[480px]">
              {BOLIVIA_DEPARTMENT_PATHS.map(dep => {
                const deptName = SVG_ID_TO_DEPARTMENT_NAME[dep.id] || dep.name;
                const isSelected = selectedDept === deptName;
                const count = getCount(deptName);
                const tone = DEPARTMENT_TONES[deptName] || dep;

                return (
                  <button
                    key={dep.id}
                    onClick={() => {
                      setSelectedDept(deptName);
                      setSelectedZone(null);
                    }}
                    onMouseEnter={() => setHovered(deptName)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      backgroundColor: isSelected ? tone.orangeColor : '#0d182b',
                      borderColor: isSelected ? '#ffffff' : `${tone.blueColor}60`,
                      color: isSelected ? '#000000' : '#e2e8f0'
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase transition-all duration-200 flex items-center gap-1.5 cursor-pointer border ${
                      isSelected
                        ? 'shadow-md font-black scale-105'
                        : 'hover:border-white hover:text-white'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: isSelected ? '#000000' : tone.blueColor }}
                    />
                    <span>{deptName}</span>
                    <span
                      style={{
                        backgroundColor: isSelected ? 'rgba(0,0,0,0.2)' : `${tone.blueColor}30`,
                        color: isSelected ? '#000000' : '#38bdf8'
                      }}
                      className="px-1 py-0.2 rounded text-[9px] font-mono font-bold"
                    >
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
                style={{
                  borderColor: currentTones.orangeColor,
                  boxShadow: `0 10px 30px ${currentTones.orangeGlow}`
                }}
                className="bg-gradient-to-br from-[#0d182b] to-[#0a111e] border-2 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5"
              >
                {/* Department Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#0fa0e6]/20">
                  <div>
                    <div
                      className="flex items-center gap-2 font-black uppercase text-xs"
                      style={{ color: currentTones.orangeColor }}
                    >
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
                    <div
                      className="px-3.5 py-1.5 bg-[#0a111e] border rounded-xl text-center"
                      style={{ borderColor: `${currentTones.orangeColor}60` }}
                    >
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Disponibles</span>
                      <span
                        className="text-base font-black font-mono"
                        style={{ color: currentTones.orangeColor }}
                      >
                        {getDisponibles(currentDisplayDept)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Commercial Zones list */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Compass className="w-4 h-4" style={{ color: currentTones.orangeColor }} />
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
                      style={
                        selectedZone === null
                          ? {
                              backgroundColor: currentTones.orangeColor,
                              borderColor: currentTones.orangeColor,
                              color: '#000000'
                            }
                          : {}
                      }
                      className={`px-3 py-2 rounded-xl text-xs font-bold text-left transition-all duration-200 flex items-center justify-between border cursor-pointer ${
                        selectedZone === null
                          ? 'shadow-md font-black'
                          : 'bg-[#132742]/80 text-gray-300 border-[#0fa0e6]/25 hover:border-white hover:text-white'
                      }`}
                    >
                      <span className="truncate">Todo {currentDisplayDept}</span>
                      <span
                        style={
                          selectedZone === null
                            ? { backgroundColor: 'rgba(0,0,0,0.2)', color: '#000000' }
                            : { backgroundColor: '#0a111e', color: '#0fa0e6' }
                        }
                        className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ml-2"
                      >
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
                          style={
                            isZoneActive
                              ? {
                                  backgroundColor: currentTones.orangeColor,
                                  borderColor: currentTones.orangeColor,
                                  color: '#000000'
                                }
                              : {}
                          }
                          className={`px-3 py-2 rounded-xl text-xs font-bold text-left transition-all duration-200 flex items-center justify-between border cursor-pointer ${
                            isZoneActive
                              ? 'shadow-md font-black'
                              : 'bg-[#0a111e] text-gray-300 border-[#0fa0e6]/25 hover:border-white hover:text-white'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <Navigation className={`w-3.5 h-3.5 shrink-0 ${isZoneActive ? 'text-black' : 'text-[#0fa0e6]'}`} />
                            <span className="truncate">{zone.nombre}</span>
                          </span>
                          <span
                            style={
                              isZoneActive
                                ? { backgroundColor: 'rgba(0,0,0,0.2)', color: '#000000' }
                                : { backgroundColor: '#132742', color: currentTones.orangeColor }
                            }
                            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ml-2 shrink-0"
                          >
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
                          <span
                            className="w-2 h-2 rounded-full animate-ping"
                            style={{ backgroundColor: currentTones.orangeColor }}
                          />
                          <span className="text-xs font-black text-white uppercase">
                            Zona: <span style={{ color: currentTones.orangeColor }}>{activeZoneData.nombre}</span>
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
                        <CheckCircle2 className="w-4 h-4" style={{ color: currentTones.orangeColor }} />
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
                  style={{
                    backgroundImage: `linear-gradient(to right, ${currentTones.orangeColor}, #e65100)`,
                    boxShadow: `0 8px 20px ${currentTones.orangeGlow}`
                  }}
                  className="w-full py-3.5 hover:brightness-110 text-gray-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
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
