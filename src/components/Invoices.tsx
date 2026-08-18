import React, { useState, useMemo } from 'react';
import { Invoice, InvoiceItem, Contract, Quotation, Client, Settings, UserSession } from '../types';
import { numeroALetrasBolivianos } from '../utils/numberToWords';
import { generateFiscalInvoicePdf } from '../utils/commercialPdfGenerators';
import { 
  Receipt, 
  Plus, 
  Search, 
  FileText, 
  Download, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  DollarSign, 
  Building2, 
  User, 
  Calendar, 
  Sparkles, 
  Trash2, 
  Edit3, 
  ExternalLink,
  QrCode,
  FileCheck,
  AlertCircle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InvoicesProps {
  invoices: Invoice[];
  contracts: Contract[];
  quotations: Quotation[];
  clients: Client[];
  settings: Settings;
  currentUser: UserSession;
  onAddInvoice: (inv: Invoice) => void;
  onUpdateInvoice: (id: string, update: Partial<Invoice>) => void;
  onDeleteInvoice: (id: string) => void;
}

export default function Invoices({
  invoices,
  contracts,
  quotations,
  clients,
  settings,
  currentUser,
  onAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice
}: InvoicesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODAS');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoiceForPreview, setSelectedInvoiceForPreview] = useState<Invoice | null>(null);

  // Form State for creating/editing invoice
  const [invoiceOrigin, setInvoiceOrigin] = useState<'CONTRATO_ARRENDAMIENTO' | 'COTIZACION_TECNICA' | 'VENTA_DIRECTA'>('CONTRATO_ARRENDAMIENTO');
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Editable invoice fields
  const [numeroFactura, setNumeroFactura] = useState<string>(`FAC-2026-${String(invoices.length + 1).padStart(4, '0')}`);
  const [razonSocial, setRazonSocial] = useState<string>('');
  const [nitCi, setNitCi] = useState<string>('');
  const [periodoFacturado, setPeriodoFacturado] = useState<string>('Mes de Julio 2026');
  const [concepto, setConcepto] = useState<string>('Alquiler de Espacio Publicitario OOH (Valla Unipolar)');
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: '1',
      descripcion: 'Alquiler de Espacio Publicitario OOH - Circuito Central',
      medida_unidad: 'MES',
      cantidad: 1,
      precio_unitario_bs: 12980,
      descuento_bs: 0,
      subtotal_bs: 12980
    }
  ]);

  const [codigoAutorizacion, setCodigoAutorizacion] = useState<string>('4A8F93B27C10E');
  const [observaciones, setObservaciones] = useState<string>('Pago contra entrega de factura oficial con derecho a crédito fiscal.');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const exchangeRate = settings.tipo_cambio || 6.96;

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchStatus = statusFilter === 'TODAS' || inv.estado === statusFilter;
      const term = searchTerm.toLowerCase();
      const matchTerm = !term ||
        inv.numero_factura.toLowerCase().includes(term) ||
        inv.cliente_nombre.toLowerCase().includes(term) ||
        inv.cliente_razon_social.toLowerCase().includes(term) ||
        inv.cliente_nit_ci.toLowerCase().includes(term);
      return matchStatus && matchTerm;
    });
  }, [invoices, statusFilter, searchTerm]);

  // Handle source contract selection
  const handleSelectContract = (contractId: string) => {
    setSelectedContractId(contractId);
    const c = contracts.find(item => item.id === contractId);
    if (c) {
      setSelectedClientId(c.cliente_id);
      setRazonSocial(c.cliente_empresa || c.cliente_nombre);
      setNitCi(c.cliente_nit_ci || '');
      setConcepto(`Canon de Arrendamiento según Contrato N° ${c.numero} - ${c.valla_nombre}`);
      
      const vallasTotalBs = c.vallas_lista && c.vallas_lista.length > 0 
        ? c.vallas_lista.reduce((acc, curr) => acc + (curr.costo_neto_bs || curr.costo_mensual_bs), 0)
        : Math.round(c.total_neto_usd * exchangeRate);

      setItems([
        {
          id: '1',
          descripcion: `Arrendamiento Publicitario OOH: ${c.valla_nombre} (${c.periodo_meses || 12} meses)`,
          medida_unidad: 'MES',
          cantidad: 1,
          precio_unitario_bs: vallasTotalBs,
          descuento_bs: 0,
          subtotal_bs: vallasTotalBs
        }
      ]);
    }
  };

  // Handle source quotation selection
  const handleSelectQuotation = (quoteId: string) => {
    setSelectedQuotationId(quoteId);
    const q = quotations.find(item => item.id === quoteId);
    if (q) {
      setSelectedClientId(q.cliente_id);
      setRazonSocial(q.cliente_empresa || q.cliente_nombre);
      setNitCi(q.cliente_nit || '');
      setConcepto(q.referencia_asunto || `Servicio Publicitario según Cotización N° ${q.numero}`);
      
      const totalBob = Math.round(q.total * exchangeRate);
      setItems([
        {
          id: '1',
          descripcion: q.tipo_cotizacion === 'TIPO_B_TECNICA' 
            ? `Fabricación e Instalación Estructural: ${q.referencia_asunto || 'Estructura Unipolar'}`
            : `Alquiler y Producción Publicitaria según Cotización ${q.numero}`,
          medida_unidad: 'GLB',
          cantidad: 1,
          precio_unitario_bs: totalBob,
          descuento_bs: 0,
          subtotal_bs: totalBob
        }
      ]);
    }
  };

  // Calculate totals
  const subtotalBs = items.reduce((acc, curr) => acc + (curr.precio_unitario_bs * curr.cantidad), 0);
  const totalDescuentosBs = items.reduce((acc, curr) => acc + (curr.descuento_bs || 0), 0);
  const totalNetoBs = Math.max(0, subtotalBs - totalDescuentosBs);
  const totalLiteral = numeroALetrasBolivianos(totalNetoBs);

  // Save new invoice
  const handleSaveInvoice = () => {
    if (!razonSocial.trim() || !nitCi.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Por favor complete la Razón Social y el NIT/CI del cliente.' });
      return;
    }
    if (items.length === 0 || totalNetoBs <= 0) {
      setFeedbackMsg({ type: 'error', text: 'La factura debe tener al menos un ítem con monto válido.' });
      return;
    }

    const client = clients.find(c => c.id === selectedClientId) || {
      id: 'C_MANUAL',
      nombre: razonSocial,
      celular: '',
      correo: '',
      ciudad: 'Santa Cruz'
    };

    const newInvoice: Invoice = {
      id: 'INV-' + Date.now(),
      numero_factura: numeroFactura,
      tipo_origen: invoiceOrigin,
      contrato_id: invoiceOrigin === 'CONTRATO_ARRENDAMIENTO' ? selectedContractId : undefined,
      cotizacion_id: invoiceOrigin === 'COTIZACION_TECNICA' ? selectedQuotationId : undefined,
      cliente_id: client.id,
      cliente_nombre: client.nombre,
      cliente_razon_social: razonSocial,
      cliente_nit_ci: nitCi,
      cliente_celular: client.celular,
      cliente_correo: client.correo,
      cliente_ciudad: client.ciudad,
      fecha_emision: new Date().toISOString().split('T')[0],
      periodo_facturado: periodoFacturado,
      items: items,
      subtotal_bs: subtotalBs,
      descuento_total_bs: totalDescuentosBs,
      total_bs: totalNetoBs,
      total_literal_bs: totalLiteral,
      total_usd: Math.round(totalNetoBs / exchangeRate),
      tipo_cambio: exchangeRate,
      observaciones: observaciones,
      estado: 'Emitida',
      codigo_autorizacion_sin: codigoAutorizacion
    };

    onAddInvoice(newInvoice);
    setFeedbackMsg({ type: 'success', text: `¡Factura ${numeroFactura} emitida y registrada exitosamente!` });
    setShowCreateModal(false);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Download PDF
  const handleDownloadPdf = async (inv: Invoice) => {
    await generateFiscalInvoicePdf(inv, settings);
  };

  // WhatsApp share
  const handleSendWhatsApp = (inv: Invoice) => {
    const phone = (inv.cliente_celular || '').replace(/[^\d]/g, '');
    const msg = `Estimados *${inv.cliente_razon_social}*,\n\nLe saludamos de *PUBLI-X BOLIVIA*. Adjuntamos el detalle de su *Factura Fiscal N° ${inv.numero_factura}*:\n\n📄 *Concepto:* Alquiler de Espacios Publicitarios OOH\n💰 *Total Facturado:* Bs. ${inv.total_bs.toLocaleString('es-BO')} (${inv.total_literal_bs})\n🛡️ *NIT / CI:* ${inv.cliente_nit_ci}\n⚡ *Estado:* ${inv.estado}\n\nPuede descargar su documento oficial con derecho a crédito fiscal. Quedamos a su entera disposición.`;
    
    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              MÓDULO DE FACTURACIÓN FISCAL (SIN)
            </span>
            <span className="text-xs text-slate-400">Ley N° 453</span>
          </div>
          <h2 className="text-2xl font-black font-display tracking-tight text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-amber-400" />
            Gestión de Facturas & Proformas Fiscales
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Emita facturas fiscales oficiales a partir de Contratos o Cotizaciones Técnicas, con conversión automática a montos literales en bolivianos, control de estado SIN y exportación a PDF.
          </p>
        </div>

        <button
          onClick={() => {
            setNumeroFactura(`FAC-2026-${String(invoices.length + 1).padStart(4, '0')}`);
            setShowCreateModal(true);
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>Nueva Factura / Proforma</span>
        </button>
      </div>

      {/* Notifications */}
      {feedbackMsg && (
        <div className={`p-4 rounded-xl text-xs flex items-center space-x-2 border ${
          feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {feedbackMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por cliente, NIT, N° factura..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto">
          {['TODAS', 'Emitida', 'Subida a SIN', 'Pagada', 'Anulada'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === st 
                  ? 'bg-slate-900 text-white shadow-xs' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {filteredInvoices.length} Facturas registradas
          </span>
          <span className="text-[11px] text-amber-600 font-bold">
            Total Facturado: Bs. {invoices.reduce((acc, curr) => acc + curr.total_bs, 0).toLocaleString('es-BO')} BOB
          </span>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Receipt className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-medium">No se encontraron facturas registradas.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-xs text-amber-600 font-bold hover:underline"
            >
              + Emitir la primera factura ahora
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">N° Factura</th>
                  <th className="p-3.5">Cliente / Razón Social</th>
                  <th className="p-3.5">NIT / CI</th>
                  <th className="p-3.5">Fecha</th>
                  <th className="p-3.5 text-right">Total BOB</th>
                  <th className="p-3.5 text-center">Estado SIN</th>
                  <th className="p-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-bold font-mono text-slate-900">
                      {inv.numero_factura}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{inv.cliente_razon_social || inv.cliente_nombre}</div>
                      <div className="text-[10px] text-slate-400">{inv.periodo_facturado || 'Arrendamiento OOH'}</div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {inv.cliente_nit_ci}
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {new Date(inv.fecha_emision).toLocaleDateString('es-ES')}
                    </td>
                    <td className="p-3.5 text-right font-bold text-amber-600">
                      Bs. {inv.total_bs.toLocaleString('es-BO')}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        inv.estado === 'Subida a SIN' ? 'bg-blue-100 text-blue-800' :
                        inv.estado === 'Pagada' ? 'bg-emerald-100 text-emerald-800' :
                        inv.estado === 'Anulada' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.estado}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleDownloadPdf(inv)}
                          className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Descargar PDF Fiscal Oficial"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSendWhatsApp(inv)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          title="Enviar por WhatsApp"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <select
                          value={inv.estado}
                          onChange={(e) => onUpdateInvoice(inv.id, { estado: e.target.value as any })}
                          className="text-[10px] font-semibold bg-slate-100 border border-slate-200 rounded px-1.5 py-1 focus:outline-none cursor-pointer"
                        >
                          <option value="Emitida">Emitida</option>
                          <option value="Subida a SIN">Subida a SIN</option>
                          <option value="Pagada">Pagada</option>
                          <option value="Anulada">Anulada</option>
                        </select>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar la factura ${inv.numero_factura}?`)) {
                              onDeleteInvoice(inv.id);
                            }
                          }}
                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Eliminar Factura"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Modal to Create Invoice */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col my-auto max-h-[92vh]"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-4 sm:px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="bg-amber-500/20 p-2 rounded-xl border border-amber-500/30">
                    <Receipt className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black font-display text-white">
                      Emisión de Factura Fiscal Oficial (SIN)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Publi-X Cobertura Nacional • NIT: {settings.nit || '4579387019'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
                
                {/* 1. Origin Selector */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    1. Origen de la Facturación
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'CONTRATO_ARRENDAMIENTO', label: 'Desde Contrato OOH', desc: 'Importa vallas, mensualidades y cliente' },
                      { id: 'COTIZACION_TECNICA', label: 'Desde Cotización', desc: 'Tipo A o Tipo B Técnica' },
                      { id: 'VENTA_DIRECTA', label: 'Venta Directa / Manual', desc: 'Ingreso manual libre' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setInvoiceOrigin(item.id as any)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          invoiceOrigin === item.id 
                            ? 'bg-amber-50/80 border-amber-500 text-slate-900 shadow-xs' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold text-xs">{item.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* Dynamic Source Dropdown */}
                  {invoiceOrigin === 'CONTRATO_ARRENDAMIENTO' && (
                    <div className="pt-2">
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Seleccionar Contrato Firmado:</label>
                      <select
                        value={selectedContractId}
                        onChange={(e) => handleSelectContract(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="">-- Seleccionar Contrato --</option>
                        {contracts.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.numero} - {c.cliente_nombre} ({c.valla_nombre}) - Bs. {c.total_neto_bob.toLocaleString('es-BO')}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {invoiceOrigin === 'COTIZACION_TECNICA' && (
                    <div className="pt-2">
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Seleccionar Cotización Aprobada:</label>
                      <select
                        value={selectedQuotationId}
                        onChange={(e) => handleSelectQuotation(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="">-- Seleccionar Cotización --</option>
                        {quotations.map(q => (
                          <option key={q.id} value={q.id}>
                            {q.numero} - {q.cliente_empresa || q.cliente_nombre} - ${q.total.toLocaleString()} USD
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* 2. Client & Fiscal Info */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Razón Social / Señor(es):</label>
                    <input
                      type="text"
                      value={razonSocial}
                      onChange={(e) => setRazonSocial(e.target.value)}
                      placeholder="Ej: UNIVERSIDAD PRIVADA DOMINGO SAVIO"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">NIT / CI del Cliente:</label>
                    <input
                      type="text"
                      value={nitCi}
                      onChange={(e) => setNitCi(e.target.value)}
                      placeholder="Ej: 1015289020"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">N° Factura:</label>
                    <input
                      type="text"
                      value={numeroFactura}
                      onChange={(e) => setNumeroFactura(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-amber-700 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Periodo Facturado:</label>
                    <input
                      type="text"
                      value={periodoFacturado}
                      onChange={(e) => setPeriodoFacturado(e.target.value)}
                      placeholder="Ej: Mes de Julio 2026"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* 3. Items Table */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold uppercase text-slate-500">
                      3. Ítems y Conceptos Facturados
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setItems([
                          ...items,
                          {
                            id: String(Date.now()),
                            descripcion: 'Nuevo Ítem de Publicidad OOH',
                            medida_unidad: 'UNI',
                            cantidad: 1,
                            precio_unitario_bs: 1000,
                            descuento_bs: 0,
                            subtotal_bs: 1000
                          }
                        ]);
                      }}
                      className="text-xs text-amber-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Agregar Ítem
                    </button>
                  </div>

                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={item.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center text-xs">
                        <div className="col-span-12 sm:col-span-5 space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold">Descripción:</label>
                          <input
                            type="text"
                            value={item.descripcion}
                            onChange={(e) => {
                              const updated = [...items];
                              updated[idx].descripcion = e.target.value;
                              setItems(updated);
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                          />
                        </div>

                        <div className="col-span-4 sm:col-span-2 space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold">Cantidad:</label>
                          <input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(e) => {
                              const qty = Number(e.target.value) || 1;
                              const updated = [...items];
                              updated[idx].cantidad = qty;
                              updated[idx].subtotal_bs = (qty * updated[idx].precio_unitario_bs) - updated[idx].descuento_bs;
                              setItems(updated);
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-center"
                          />
                        </div>

                        <div className="col-span-4 sm:col-span-2 space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold">Precio Unit. (Bs):</label>
                          <input
                            type="number"
                            min="0"
                            value={item.precio_unitario_bs}
                            onChange={(e) => {
                              const p = Number(e.target.value) || 0;
                              const updated = [...items];
                              updated[idx].precio_unitario_bs = p;
                              updated[idx].subtotal_bs = (updated[idx].cantidad * p) - updated[idx].descuento_bs;
                              setItems(updated);
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-right font-mono"
                          />
                        </div>

                        <div className="col-span-4 sm:col-span-2 space-y-1">
                          <label className="text-[10px] text-slate-400 font-bold">Subtotal (Bs):</label>
                          <div className="py-1 px-2 text-right font-mono font-bold text-amber-700">
                            Bs. {item.subtotal_bs.toLocaleString('es-BO')}
                          </div>
                        </div>

                        <div className="col-span-12 sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (items.length > 1) {
                                setItems(items.filter((_, i) => i !== idx));
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Literal Amount in Words & Totals */}
                <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 border border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">SON (Monto Literal en Español Oficial):</span>
                    <span className="text-amber-400 font-bold font-mono text-right">{totalLiteral}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-800">
                    <span className="font-bold">TOTAL FACTURADO:</span>
                    <span className="text-xl font-black text-amber-400 font-mono">
                      Bs. {totalNetoBs.toLocaleString('es-BO')} BOB
                    </span>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveInvoice}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center space-x-2 shadow-md cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Emitir y Registrar Factura Fiscal</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
