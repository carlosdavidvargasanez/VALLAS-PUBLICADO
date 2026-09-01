import React, { useEffect, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';

interface CityStat {
  ciudad: string;
  total: number;
  disponibles: number;
}

export default function SantaCruzCityMap() {
  const [cities, setCities] = useState<CityStat[] | null>(null);
  const [totalSantaCruz, setTotalSantaCruz] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.getPublicSantaCruzCities()
      .then(data => {
        if (cancelled) return;
        setCities(data.byCity);
        setTotalSantaCruz(data.totalSantaCruz);
        if (data.byCity && data.byCity.length > 0) setSelected(data.byCity[0].ciudad);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const maxCount = cities && cities.length > 0 ? Math.max(1, ...cities.map(c => c.total)) : 1;
  const selectedStat = cities?.find(c => c.ciudad === selected) || null;

  const getFill = (count: number, isSelected: boolean) => {
    const intensity = count / maxCount;
    const alpha = isSelected ? 0.9 : 0.25 + intensity * 0.5;
    return isSelected
      ? `rgba(255,140,0,${alpha})`   // #ff8c00 brand orange
      : `rgba(15,160,230,${alpha})`; // #0fa0e6 brand blue
  };

  return (
    <div className="bg-[#0a111e] border border-[#0fa0e6]/30 rounded-3xl p-6 sm:p-8 shadow-xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-wide">
            Cobertura en <span className="text-[#ff8c00]">Santa Cruz</span>
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Toque una ciudad para ver la cantidad de espacios disponibles ahí.
          </p>
        </div>
        {!loading && !error && (
          <span className="bg-[#0fa0e6]/15 text-[#0fa0e6] border border-[#0fa0e6]/40 text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            {totalSantaCruz}+ Espacios en Santa Cruz
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm py-16">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando cobertura de Santa Cruz...
        </div>
      )}

      {error && !loading && (
        <div className="text-center text-gray-400 text-sm py-16">
          No se pudo cargar la cobertura en este momento. Intente nuevamente más tarde.
        </div>
      )}

      {!loading && !error && cities && cities.length === 0 && (
        <div className="text-center text-gray-400 text-sm py-16">
          Aún no hay espacios registrados en Santa Cruz.
        </div>
      )}

      {!loading && !error && cities && cities.length > 0 && (
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* City buttons */}
          <div className="flex flex-wrap gap-2 w-full md:w-[360px] shrink-0">
            {cities.map(city => {
              const isSelected = selected === city.ciudad;
              return (
                <motion.button
                  key={city.ciudad}
                  type="button"
                  onClick={() => setSelected(city.ciudad)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="rounded-xl border px-4 py-2.5 flex flex-col items-center justify-center select-none transition-colors min-w-[100px]"
                  style={{
                    backgroundColor: getFill(city.total, isSelected),
                    borderColor: isSelected ? '#ff8c00' : 'rgba(15,160,230,0.25)'
                  }}
                >
                  <span className="text-[11px] font-black text-white uppercase text-center leading-tight">
                    {city.ciudad}
                  </span>
                  <span className="text-[10px] font-bold text-gray-200">
                    {city.total}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Detail panel */}
          <div className="flex-1 w-full bg-[#0d182b] border border-[#0fa0e6]/20 rounded-2xl p-5 min-h-[140px]">
            <AnimatePresence mode="wait">
              {selectedStat ? (
                <motion.div
                  key={selectedStat.ciudad}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-center gap-2 text-[#ff8c00] font-black uppercase text-sm mb-2">
                    <MapPin className="w-4 h-4" />
                    {selectedStat.ciudad}
                  </div>
                  <p className="text-2xl font-black text-white">
                    {selectedStat.total} <span className="text-sm font-bold text-gray-400 uppercase">espacios OOH</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Vallas monumentales y pantallas LED disponibles en {selectedStat.ciudad}. Solicite acceso al catálogo completo para ver ubicaciones exactas y disponibilidad en tiempo real.
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
                    Explore las ciudades para ver la cobertura de espacios publicitarios de PUBLI-X en Santa Cruz.
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
