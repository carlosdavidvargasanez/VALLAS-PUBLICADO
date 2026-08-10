import React, { useState } from 'react';
import { AuditLog } from '../types';
import { ShieldCheck, Search, Trash2, Clock, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface AuditLogsProps {
  auditLogs: AuditLog[];
  onClearLogs?: () => void;
}

export default function AuditLogs({ auditLogs, onClearLogs }: AuditLogsProps) {
  const [search, setSearch] = useState('');

  const filteredLogs = auditLogs.filter(log => {
    const query = search.toLowerCase();
    return (
      log.accion.toLowerCase().includes(query) ||
      log.detalle.toLowerCase().includes(query) ||
      log.usuario.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6" id="audit-logs-module">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-50 text-gray-700">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="text-base font-bold text-gray-800 font-display uppercase tracking-wider">Bitácora de Auditoría del Sistema</h3>
              <p className="text-xs text-gray-400">Registro cronológico inmutable de operaciones en la base de datos SQLite</p>
            </div>
          </div>
          {onClearLogs && (
            <button
              onClick={() => {
                if (confirm('¿Desea limpiar el historial de auditoría? El registro maestro se reiniciará.')) {
                  onClearLogs();
                }
              }}
              className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 transition"
            >
              Vaciar Auditoría
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por acción, usuario o detalles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-[10px] font-semibold uppercase tracking-wider bg-gray-50/50">
                  <th className="py-2.5 px-4">Fecha / Hora</th>
                  <th className="py-2.5 px-4">Asesor Comercial</th>
                  <th className="py-2.5 px-4">Acción Realizada</th>
                  <th className="py-2.5 px-4">Detalle Operación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/30">
                      <td className="py-3 px-4 text-gray-400 font-mono whitespace-nowrap">
                        {new Date(log.fecha).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-700">
                        {log.usuario}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-semibold font-mono">
                          {log.accion}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-sm leading-relaxed">
                        {log.detalle}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-gray-400 text-xs">
                      No se encontraron registros en el historial de auditoría.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
