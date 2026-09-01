import React, { useEffect, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';

interface DepartmentStat {
  departamento: string;
  total: number;
  disponibles: number;
}

// Schematic tile-grid layout of Bolivia's 9 departments (same technique used by
// well-known infographic "tile maps" — approximates real geographic position
// without needing precise cartographic borders).
const GRID_LAYOUT: Record<string, { col: string; row: string }> = {
  'Pando':        { col: '2 / span 1', row: '1 / span 1' },
  'Beni':         { col: '2 / span 2', row: '2 / span 1' },
  'La Paz':       { col: '1 / span 1', row: '2 / span 2' },
  'Cochabamba':   { col: '2 / span 1', row: '3 / span 1' },
  'Santa Cruz':   { col: '3 / span 1', row: '3 / span 3' },
  'Oruro':        { col: '1 / span 1', row: '4 / span 1' },
  'Chuquisaca':   { col: '2 / span 1', row: '4 / span 1' },
  'Potosí':       { col: '1 / span 1', row: '5 / span 1' },
  'Tarija':       { col: '2 / span 1', row: '5 / span 1' }
};

const DEPARTMENTS = Object.keys(GRID_LAYOUT);

export default function BoliviaCoverageMap() {
  const [stats, setStats] = useState<DepartmentStat[] | null>(null);
  const [totalNacional, setTotalNacional] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

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
  const maxCount = stats && stats.length > 0 ? Math.max(1, ...stats.map((s: DepartmentStat) => s.total)) : 1;

  const getFill = (dep: string) => {
    const count = getCount(dep);
    if (count === 0) return 'rgba(255,255,255,0.04)';
    const intensity = count / maxCount; // 0..1
    // Blend between the brand blue (low) and brand orange (high presence)
    const alpha = 0.25 + intensity * 0.6;
    return intensity > 0.6
      ? `rgba(255,140,0,${alpha})`   // #ff8c00 brand orange
      : `rgba(15,160,230,${alpha})`; // #0fa0e6 brand blue
  };

  return (
    <div className="bg-[#0a111e] border border-[#0fa0e6]/30 rounded-3xl p-6 sm:p-8 shadow-xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-wide">
            Cobertura por <span className="text-[#ff8c00]">Departamento</span>
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Pase el cursor sobre cada departamento para ver la cantidad de espacios disponibles.
          </p>
        </div>
        {!loading && !error && (
          <span className="bg-[#0fa0e6]/15 text-[#0fa0e6] border border-[#0fa0e6]/40 text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            {totalNacional}+ Espacios a Nivel Nacional
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm py-16">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando cobertura nacional...
        </div>
      )}

      {error && !loading && (
        <div className="text-center text-gray-400 text-sm py-16">
          No se pudo cargar la cobertura en este momento. Intente nuevamente más tarde.
        </div>
      )}

      {!loading && !error && (
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Tile-grid schematic map */}
          <div
            className="grid gap-1.5 w-full md:w-[340px] shrink-0"
            style={{ gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(5, 52px)' }}
          >
            {DEPARTMENTS.map(dep => {
              const count = getCount(dep);
              const { col, row } = GRID_LAYOUT[dep];
              return (
                <motion.div
                  key={dep}
                  onMouseEnter={() => setHovered(dep)}
                  onMouseLeave={() => setHovered(null)}
                  whileHover={{ scale: 1.04 }}
                  className="relative rounded-xl border flex flex-col items-center justify-center cursor-default select-none transition-colors"
                  style={{
                    gridColumn: col,
                    gridRow: row,
                    backgroundColor: getFill(dep),
                    borderColor: hovered === dep ? '#ff8c00' : 'rgba(15,160,230,0.25)'
                  }}
                >
                  <span className="text-[10px] sm:text-[11px] font-black text-white uppercase text-center leading-tight px-1">
                    {dep}
                  </span>
                  <span className="text-[10px] font-bold text-gray-300">
                    {count}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Hover / detail panel */}
          <div className="flex-1 w-full bg-[#0d182b] border border-[#0fa0e6]/20 rounded-2xl p-5 min-h-[140px]">
            <AnimatePresence mode="wait">
              {hovered ? (
                <motion.div
                  key={hovered}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-center gap-2 text-[#ff8c00] font-black uppercase text-sm mb-2">
                    <MapPin className="w-4 h-4" />
                    {hovered}
                  </div>
                  <p className="text-2xl font-black text-white">
                    {getCount(hovered)} <span className="text-sm font-bold text-gray-400 uppercase">espacios OOH</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Vallas monumentales y pantallas LED disponibles en {hovered}. Solicite acceso al catálogo completo para ver ubicaciones exactas y disponibilidad en tiempo real.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full text-center py-6"
                >
                  <MapPin className="w-6 h-6 text-[#0fa0e6] mb-2" />
                  <p className="text-sm text-gray-400">
                    Explore el mapa para ver la cobertura de PUBLI-X en cada departamento de Bolivia.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
