import React, { useState } from 'react';
import { Contract, Client, Vehicle, Settings, ContractStatus } from '../types';
import { 
  FileCheck, 
  Plus, 
  Search, 
  Printer, 
  Copy, 
  Eye, 
  Trash2, 
  RefreshCw, 
  DollarSign, 
  Check, 
  X,
  Send,
  Mail,
  MessageSquare,
  Building2,
  Calendar,
  Sparkles,
  ShieldCheck,
  Tag,
  Share2,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ContractModal from './ContractModal';

interface ContractsProps {
  contracts: Contract[];
  clients: Client[];
  vehicles: Vehicle[];
  settings: Settings;
  currentUserNombre: string;
  onSaveContract: (contract: Contract) => void;
  onUpdateContractStatus: (id: string, status: ContractStatus) => void;
  onDeleteContract: (id: string) => void;
}

export default function Contracts({
  contracts,
  clients,
  vehicles,
  settings,
  currentUserNombre,
  onSaveContract,
  onUpdateContractStatus,
  onDeleteContract
}: ContractsProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2 | 3>(1);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [viewDetailContract, setViewDetailContract] = useState<Contract | null>(null);

  // Filter contracts
  const filteredContracts = contracts.filter((c) => {
    const matchesSearch = 
      c.numero.toLowerCase().includes(search.toLowerCase()) ||
      c.cliente_nombre.toLowerCase().includes(search.toLowerCase()) ||
      (c.cliente_empresa && c.cliente_empresa.toLowerCase().includes(search.toLowerCase())) ||
      c.valla_nombre.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'TODOS' || c.estado === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalVigentesUsd = contracts
    .filter(c => c.estado === 'Vigente')
    .reduce((acc, curr) => acc + curr.total_neto_usd, 0);

  const totalGeneralUsd = contracts.reduce((acc, curr) => acc + curr.total_neto_usd, 0);

  const handleOpenCreateModal = () => {
    setSelectedContract(null);
    setModalStep(1);
    setShowModal(true);
  };

  const handleEditContract = (contract: Contract) => {
    setSelectedContract(contract);
    setModalStep(1);
    setShowModal(true);
  };

  const handlePreviewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setModalStep(3);
    setShowModal(true);
  };

  const handleSendWhatsApp = (c: Contract) => {
    const text = encodeURIComponent(
      `*CONTRATO PUBLI-X BOLIVIA* 📢\n\n📄 *Contrato N°:* ${c.numero}\n👤 *Cliente:* ${c.cliente_nombre}\n📍 *Estructura:* ${c.valla_nombre}\n💰 *Monto Total:* $${c.total_neto_usd.toLocaleString()} USD (Bs. ${c.total_neto_bob.toLocaleString('es-BO')} BOB)\n📅 *Vigencia:* ${c.fecha_inicio} al ${c.fecha_fin}\n\nQuedamos a su disposición para cualquier consulta.`
    );
    const phone = c.cliente_celular.replace(/[^\d]/g, '');
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handleSendEmail = (c: Contract) => {
    const email = c.cliente_correo || '';
    const subject = encodeURIComponent(`Contrato ${c.numero} - PUBLI-X BOLIVIA`);
    const body = encodeURIComponent(
      `Estimado(a) ${c.cliente_nombre},\n\nLe adjuntamos los detalles del Contrato N° ${c.numero} de alquiler de espacio publicitario en ${c.valla_nombre}.\n\nMonto Total Neto: $${c.total_neto_usd.toLocaleString()} USD (Bs. ${c.total_neto_bob.toLocaleString('es-BO')} BOB).\nVigencia: ${c.fecha_inicio} al ${c.fecha_fin}.\n\nAtentamente,\n${c.vendedor_nombre}\nPUBLI-X BOLIVIA`
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Banner Stats & Actions */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-lg font-black font-display uppercase tracking-wider text-white">
              Gestor Autónomo de Contratos CRM
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Genere contratos en columnas y filas, aplique descuentos, incluya lona e imprima documentos legales
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right border-r border-slate-800 pr-4 hidden sm:block">
            <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold">Contratos Vigentes</span>
            <span className="text-base font-black text-amber-400 font-mono">
              ${totalVigentesUsd.toLocaleString()} USD
            </span>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition shadow-md flex items-center space-x-2 uppercase tracking-wide cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Emitir Nuevo Contrato</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar contrato por número, cliente, NIT o valla..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          {['TODOS', 'Vigente', 'Pendiente Firma', 'Borrador', 'Finalizado'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-amber-400 font-extrabold shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts Table List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredContracts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileCheck className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No se encontraron contratos registrados.</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Puede convertir cualquier cotización aprobada en contrato o hacer clic en "Emitir Nuevo Contrato".
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-2 px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400 inline-flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Primer Contrato</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white font-extrabold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">N° Contrato</th>
                  <th className="p-3.5">Cliente / Razon Social</th>
                  <th className="p-3.5">Estructura Publicitaria</th>
                  <th className="p-3.5">Período / Vigencia</th>
                  <th className="p-3.5 text-right">Total USD</th>
                  <th className="p-3.5 text-right">Total BOB</th>
                  <th className="p-3.5 text-center">Estado</th>
                  <th className="p-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                {filteredContracts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      {c.numero}
                      <span className="block text-[10px] text-slate-400 font-normal">{c.fecha_emision}</span>
                    </td>

                    <td className="p-3.5">
                      <div className="font-extrabold text-slate-900">{c.cliente_nombre}</div>
                      {c.cliente_empresa && <div className="text-[10px] text-slate-500">{c.cliente_empresa}</div>}
                      <div className="text-[10px] text-slate-400 font-mono">NIT: {c.cliente_nit_ci || 'N/A'}</div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{c.valla_nombre}</div>
                      <div className="text-[10px] text-slate-500">{c.valla_medidas} ({c.valla_cara})</div>
                    </td>

                    <td className="p-3.5 font-mono text-[11px]">
                      {c.periodo_meses} Meses
                      <div className="text-[10px] text-slate-400">{c.fecha_inicio} al {c.fecha_fin}</div>
                    </td>

                    <td className="p-3.5 text-right font-mono font-bold text-amber-700">
                      ${c.total_neto_usd.toLocaleString()}
                      {c.descuento_cliente_usd > 0 && (
                        <div className="text-[9px] text-emerald-600 font-normal">Desc: -${c.descuento_cliente_usd}</div>
                      )}
                    </td>

                    <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                      Bs. {c.total_neto_bob.toLocaleString('es-BO')}
                    </td>

                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        c.estado === 'Vigente' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        c.estado === 'Pendiente Firma' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        c.estado === 'Finalizado' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                        'bg-slate-100 text-slate-600 border border-slate-300'
                      }`}>
                        {c.estado}
                      </span>
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => handlePreviewContract(c)}
                          title="Previsualizar y revisar el documento de contrato en PDF"
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-extrabold text-[11px] transition cursor-pointer flex items-center space-x-1 border border-indigo-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Previsualizar</span>
                        </button>

                        <button
                          onClick={() => handleEditContract(c)}
                          title="Editar variables y cláusulas del contrato"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 transition cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handlePreviewContract(c)}
                          title="Imprimir Contrato Oficial"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 transition cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleSendWhatsApp(c)}
                          title="Enviar por WhatsApp"
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 transition cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleSendEmail(c)}
                          title="Enviar por Correo"
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 transition cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`¿Desea eliminar el contrato N° ${c.numero}?`)) {
                              onDeleteContract(c.id);
                            }
                          }}
                          title="Eliminar"
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contract Modal */}
      {showModal && (
        <ContractModal
          initialContract={selectedContract}
          initialStep={modalStep}
          clients={clients}
          vehicles={vehicles}
          settings={settings}
          currentUserNombre={currentUserNombre}
          onSaveContract={(contract) => {
            onSaveContract(contract);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}

    </div>
  );
}
