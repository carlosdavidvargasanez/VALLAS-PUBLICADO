import React, { useState } from 'react';
import Logo from './Logo';
import { Client, Vehicle, Quotation, QuotationState, Settings, Contract, QuotationVallaItem } from '../types';
import { generateAutoQuotationWithContractPdf, AutoQuotationVallaDetail } from '../utils/pdfGenerator';
import AutoQuotationGeneratorModal from './AutoQuotationGeneratorModal';
import { 
  FileText, 
  Plus, 
  Search, 
  Printer, 
  Copy, 
  Eye, 
  Trash2, 
  ChevronRight, 
  RefreshCw, 
  DollarSign, 
  Check, 
  X,
  AlertCircle,
  Briefcase,
  Layers,
  ShieldAlert,
  Send,
  Mail,
  MessageSquare,
  Share2,
  FileCheck,
  Edit3,
  Sparkles,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ContractModal from './ContractModal';

interface QuotationsProps {
  quotations: Quotation[];
  clients: Client[];
  vehicles: Vehicle[];
  settings: Settings;
  currentUserNombre?: string;
  onAddQuotation: (quote: Omit<Quotation, 'id' | 'numero' | 'fecha'>) => void;
  onUpdateQuotation?: (quote: Quotation) => void;
  onUpdateQuotationStatus: (id: string, status: QuotationState) => void;
  onDeleteQuotation: (id: string) => void;
  onSaveContract?: (contract: Contract) => void;
  activeClient: Client | null;
  activeVehicle: Vehicle | null;
  onSelectActiveClient: (client: Client | null) => void;
  onSelectActiveVehicle: (vehicle: Vehicle | null) => void;
}

export default function Quotations({
  quotations,
  clients,
  vehicles,
  settings,
  currentUserNombre = 'Asesor Comercial V&L',
  onAddQuotation,
  onUpdateQuotation,
  onUpdateQuotationStatus,
  onDeleteQuotation,
  onSaveContract,
  activeClient,
  activeVehicle,
  onSelectActiveClient,
  onSelectActiveVehicle
}: QuotationsProps) {
  
  // Tabs and views
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowForm] = useState(false);
  const [selectedPrintQuote, setSelectedPrintQuote] = useState<Quotation | null>(null);

  // Proforma Preview & Edit State
  const [isEditingPreview, setIsEditingPreview] = useState<boolean>(false);
  const [editingQuote, setEditingQuote] = useState<Quotation | null>(null);
  const [previewSuccessMsg, setPreviewSuccessMsg] = useState<string>('');

  // Contract Generation Modal State
  const [contractModalQuote, setContractModalQuote] = useState<Quotation | null>(null);
  const [showContractModal, setShowContractModal] = useState<boolean>(false);

  // Auto Quotation Multi-Valla Generator Modal
  const [showAutoGeneratorModal, setShowAutoGeneratorModal] = useState<boolean>(false);

  // Form states (Fees breakdown)
  const [precioVehiculo, setPrecioVehiculo] = useState('');
  const [gastosImportacion, setGastosImportacion] = useState('1800'); // defaults
  const [gastosAduana, setGastosAduana] = useState('6500');
  const [gastosLogistica, setGastosLogistica] = useState('2000');
  const [gastosSeguro, setGastosSeguro] = useState('450');
  const [observaciones, setObservaciones] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Generate and download full PDF for any quotation
  const handleDownloadQuotePdf = async (quote: Quotation) => {
    const client = clients.find(c => c.id === quote.cliente_id);
    if (!client) return;

    let vallaList: AutoQuotationVallaDetail[] = [];
    if (quote.vallas_seleccionadas && quote.vallas_seleccionadas.length > 0) {
      vallaList = quote.vallas_seleccionadas.map(v => {
        const lonaTotalBs = (v.area_m2 || 40) * (v.costo_lona_m2_bs || 65);
        return {
          id: v.vehiculo_id,
          nombre: v.valla_nombre,
          tipo: v.valla_tipo,
          medidas: v.valla_medidas,
          ciudad: v.valla_ciudad,
          avenida: v.valla_avenida,
          cara: v.valla_cara,
          alquilerMensualUsd: v.precio_alquiler_usd,
          alquilerMensualBob: Math.round(v.precio_alquiler_usd * settings.tipo_cambio),
          areaM2: v.area_m2 || 40,
          costoLonaM2Bs: v.costo_lona_m2_bs || 65,
          costoLonaTotalBs: lonaTotalBs,
          costoLonaTotalUsd: v.costo_lona_usd || Math.round(lonaTotalBs / settings.tipo_cambio),
          imagen: v.imagen
        };
      });
    } else {
      const vehicle = vehicles.find(v => v.id === quote.vehiculo_id);
      let area = 40;
      if (vehicle?.medidas) {
        const nums = vehicle.medidas.match(/(\d+(?:\.\d+)?)/g);
        if (nums && nums.length >= 2) {
          const w = parseFloat(nums[0]);
          const h = parseFloat(nums[1]);
          if (w > 0 && h > 0) area = Math.round(w * h);
        }
      }
      const lonaUnitBs = vehicle?.costo_lona_m2_bs || 65;
      const lonaTotalBs = area * lonaUnitBs;
      vallaList = [{
        id: vehicle?.id || 'v1',
        nombre: vehicle ? `${vehicle.tipo_valla || vehicle.tipo} - ${vehicle.avenida_calle || vehicle.modelo}` : 'Valla Publicitaria',
        tipo: vehicle?.tipo_valla || vehicle?.tipo || 'Valla Unipolar',
        medidas: vehicle?.medidas || '12.00 x 4.00 m',
        ciudad: vehicle?.ciudad || 'Santa Cruz',
        avenida: vehicle?.avenida_calle || vehicle?.modelo || 'Ubicación Estratégica',
        cara: vehicle?.cara || 'Cara A',
        alquilerMensualUsd: quote.precio_vehiculo || 1500,
        alquilerMensualBob: Math.round((quote.precio_vehiculo || 1500) * settings.tipo_cambio),
        areaM2: area,
        costoLonaM2Bs: lonaUnitBs,
        costoLonaTotalBs: lonaTotalBs,
        costoLonaTotalUsd: quote.gastos_importacion || Math.round(lonaTotalBs / settings.tipo_cambio),
        imagen: vehicle?.foto_principal || ''
      }];
    }

    const totalAlq = vallaList.reduce((a, c) => a + c.alquilerMensualUsd, 0);
    const totalLon = vallaList.reduce((a, c) => a + c.costoLonaTotalUsd, 0);

    await generateAutoQuotationWithContractPdf({
      quoteNumber: quote.numero,
      fechaEmision: new Date(quote.fecha).toLocaleDateString('es-ES'),
      validezDias: 15,
      client,
      vallas: vallaList,
      costoMontajeUsd: quote.gastos_aduana || 0,
      costoMantenimientoUsd: quote.gastos_logistica || 0,
      descuentoUsd: quote.descuento_usd || 0,
      totalAlquilerUsd: totalAlq,
      totalLonasUsd: totalLon,
      totalGeneralUsd: quote.total,
      totalGeneralBob: Math.round(quote.total * settings.tipo_cambio),
      exchangeRate: settings.tipo_cambio,
      emitterName: quote.emisor_nombre || currentUserNombre || 'Lic. Carlos David Vargas',
      emitterRole: quote.emisor_rol || 'Gerente General',
      emitterPhone: settings.telefono || '+591 70000000',
      emitterEmail: settings.correo || 'ventas@publix.bo',
      includeContract: quote.incluye_contrato !== false,
      observaciones: quote.observaciones,
      settings
    });
  };

  // Close preview modal cleanly
  const handleClosePreview = () => {
    setSelectedPrintQuote(null);
    setEditingQuote(null);
    setIsEditingPreview(false);
    setPreviewSuccessMsg('');
  };

  // Keyboard shortcut: ESC to close preview modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPrintQuote) {
        handleClosePreview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPrintQuote]);

  // Auto load vehicle price when vehicle changes
  React.useEffect(() => {
    if (activeVehicle) {
      setPrecioVehiculo(String(activeVehicle.precio_usd));
      // Auto adjust aduana/logistics based on vehicle value as a premium helper
      const base = activeVehicle.precio_usd;
      if (base > 80000) {
        setGastosImportacion('2500');
        setGastosAduana('14000');
        setGastosLogistica('3000');
        setGastosSeguro('950');
      } else if (base > 50000) {
        setGastosImportacion('2000');
        setGastosAduana('8500');
        setGastosLogistica('2200');
        setGastosSeguro('600');
      } else {
        setGastosImportacion('1500');
        setGastosAduana('5200');
        setGastosLogistica('1800');
        setGastosSeguro('350');
      }
    }
  }, [activeVehicle]);

  // Form calculations
  const basePriceNum = Number(precioVehiculo) || 0;
  const importNum = Number(gastosImportacion) || 0;
  const aduanaNum = Number(gastosAduana) || 0;
  const logisticaNum = Number(gastosLogistica) || 0;
  const seguroNum = Number(gastosSeguro) || 0;
  const totalQuotePrice = basePriceNum + importNum + aduanaNum + logisticaNum + seguroNum;

  // Open Proforma Preview Modal
  const handleOpenPreview = (quote: Quotation, editMode: boolean = false) => {
    setSelectedPrintQuote(quote);
    setEditingQuote({ ...quote });
    setIsEditingPreview(editMode);
    setPreviewSuccessMsg('');
  };

  // Preview Draft before saving
  const handlePreviewDraft = () => {
    setFormError('');
    if (!activeClient) return setFormError('Debe seleccionar un cliente destinatario.');
    if (!activeVehicle) return setFormError('Debe seleccionar una valla o pantalla publicitaria a cotizar.');
    if (!precioVehiculo || isNaN(Number(precioVehiculo))) return setFormError('Proporcione un precio base válido.');

    const draftQuote: Quotation = {
      id: 'DRAFT-' + Date.now(),
      numero: `COT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      cliente_id: activeClient.id,
      vehiculo_id: activeVehicle.id,
      precio_vehiculo: basePriceNum,
      gastos_importacion: importNum,
      gastos_aduana: aduanaNum,
      gastos_logistica: logisticaNum,
      gastos_seguro: seguroNum,
      total: totalQuotePrice,
      fecha: new Date().toISOString(),
      estado: 'Borrador',
      observaciones: observaciones.trim()
    };

    handleOpenPreview(draftQuote, false);
  };

  // Save changes made inside the Preview/Edit Modal
  const handleSaveEditedQuote = () => {
    if (!editingQuote) return;
    
    // Recalculate total sum
    const newTotal = (editingQuote.precio_vehiculo || 0) +
      (editingQuote.gastos_importacion || 0) +
      (editingQuote.gastos_aduana || 0) +
      (editingQuote.gastos_logistica || 0) +
      (editingQuote.gastos_seguro || 0);

    const updated = {
      ...editingQuote,
      total: newTotal
    };

    if (updated.id.startsWith('DRAFT-')) {
      onAddQuotation({
        cliente_id: updated.cliente_id,
        vehiculo_id: updated.vehiculo_id,
        precio_vehiculo: updated.precio_vehiculo,
        gastos_importacion: updated.gastos_importacion,
        gastos_aduana: updated.gastos_aduana,
        gastos_logistica: updated.gastos_logistica,
        gastos_seguro: updated.gastos_seguro,
        total: updated.total,
        estado: updated.estado,
        observaciones: updated.observaciones
      });
      setPreviewSuccessMsg('¡Proforma creada y guardada con éxito en el sistema!');
    } else {
      if (onUpdateQuotation) {
        onUpdateQuotation(updated);
      }
      setSelectedPrintQuote(updated);
      setEditingQuote(updated);
      setPreviewSuccessMsg('¡Proforma actualizada y guardada con éxito!');
    }

    setIsEditingPreview(false);
    setTimeout(() => setPreviewSuccessMsg(''), 3500);
  };

  // Handle submit quote
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!activeClient) return setFormError('Debe seleccionar un cliente destinatario.');
    if (!activeVehicle) return setFormError('Debe seleccionar un vehículo a cotizar.');
    if (!precioVehiculo || isNaN(Number(precioVehiculo))) return setFormError('Proporcione un precio base válido.');

    onAddQuotation({
      cliente_id: activeClient.id,
      vehiculo_id: activeVehicle.id,
      precio_vehiculo: basePriceNum,
      gastos_importacion: importNum,
      gastos_aduana: aduanaNum,
      gastos_logistica: logisticaNum,
      gastos_seguro: seguroNum,
      total: totalQuotePrice,
      estado: 'Borrador',
      observaciones: observaciones.trim()
    });

    setFormSuccess('Se generó la cotización con éxito.');
    setTimeout(() => {
      setShowForm(false);
      resetForm();
    }, 1000);
  };

  const resetForm = () => {
    setPrecioVehiculo('');
    setGastosImportacion('1500');
    setGastosAduana('5200');
    setGastosLogistica('1800');
    setGastosSeguro('350');
    setObservaciones('');
    onSelectActiveVehicle(null);
  };

  const handleDuplicateQuote = (quote: Quotation) => {
    const client = clients.find(c => c.id === quote.cliente_id);
    const vehicle = vehicles.find(v => v.id === quote.vehiculo_id);
    if (client && vehicle) {
      onSelectActiveClient(client);
      onSelectActiveVehicle(vehicle);
      setPrecioVehiculo(String(quote.precio_vehiculo));
      setGastosImportacion(String(quote.gastos_importacion));
      setGastosAduana(String(quote.gastos_aduana));
      setGastosLogistica(String(quote.gastos_logistica));
      setGastosSeguro(String(quote.gastos_seguro));
      setObservaciones(quote.observaciones + ' (Duplicado)');
      setShowForm(true);
    }
  };

  // Helper functions for sending quotations via WhatsApp, Email, or BOTH
  const generateQuoteText = (quote: Quotation) => {
    const client = clients.find(c => c.id === quote.cliente_id);
    const vehicle = vehicles.find(v => v.id === quote.vehiculo_id);
    const clientName = client ? client.nombre : 'Estimado Cliente';
    const vallaName = vehicle ? `${vehicle.tipo_valla || vehicle.tipo} - ${vehicle.avenida_calle || vehicle.modelo}` : 'Valla Publicitaria';
    const totalUsd = quote.total.toLocaleString();
    const totalBob = (quote.total * settings.tipo_cambio).toLocaleString('es-BO', { maximumFractionDigits: 0 });

    return `Hola ${clientName}, le compartimos la cotización oficial de PUBLI-X BOLIVIA:\n\n📄 *Cotización N°:* ${quote.numero}\n📍 *Ubicación:* ${vallaName}\n📐 *Medidas:* ${vehicle?.medidas || '10 x 4 m'} (${vehicle?.cara || 'Cara A'})\n🌆 *Ciudad:* ${vehicle?.ciudad || 'Santa Cruz'}\n\n💰 *Total Mensual:* $${totalUsd} USD (Bs. ${totalBob} BOB - T/C ${settings.tipo_cambio})\n📅 *Validez:* 15 días calendario\n\nQuedamos atentos a sus comentarios para asegurar el espacio.`;
  };

  const handleSendWhatsApp = (quote: Quotation) => {
    try {
      const client = clients.find(c => c.id === quote.cliente_id);
      const text = encodeURIComponent(generateQuoteText(quote));
      const phone = client ? client.celular.replace(/[^\d]/g, '') : '';
      const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
      window.open(url, '_blank');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendEmail = (quote: Quotation) => {
    try {
      const client = clients.find(c => c.id === quote.cliente_id);
      const email = client?.correo || '';
      const subject = encodeURIComponent(`Cotización Formal ${quote.numero} - PUBLI-X BOLIVIA`);
      const body = encodeURIComponent(generateQuoteText(quote));
      window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendBoth = (quote: Quotation) => {
    handleSendWhatsApp(quote);
    setTimeout(() => {
      handleSendEmail(quote);
    }, 500);
  };

  // Filters search
  const filteredQuotes = quotations.filter(q => {
    const client = clients.find(c => c.id === q.cliente_id);
    const vehicle = vehicles.find(v => v.id === q.vehiculo_id);
    const clientName = client ? client.nombre.toLowerCase() : '';
    const vehicleName = vehicle ? `${vehicle.marca} ${vehicle.modelo}`.toLowerCase() : '';
    const num = q.numero.toLowerCase();
    const query = search.toLowerCase();

    return num.includes(query) || clientName.includes(query) || vehicleName.includes(query);
  });

  return (
    <div className="space-y-6" id="quotations-view">
      
      {/* Top filter bar & Create trigger */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex flex-wrap gap-4 items-center justify-between no-print">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar cotizaciones por número, cliente, valla o ubicación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAutoGeneratorModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2 px-3.5 rounded-lg transition text-xs shadow-xs flex items-center space-x-1.5 cursor-pointer uppercase tracking-tight"
            title="Generador automático con selección múltiple de vallas, cálculo de lonas y contrato"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>⚡ Generador Automático (Vallas + Lonas + PDF)</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setShowForm(prev => !prev);
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-3.5 rounded-lg transition text-xs shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Calculadora Rápida</span>
          </button>
        </div>
      </div>

      {/* Form: Create Quote */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden no-print"
          >
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-4">
              <div className="pb-3 border-b border-gray-50 flex justify-between items-center">
                <h4 className="text-base font-bold text-gray-800 font-display">
                  Calculadora y Generador de Cotizaciones OOH / Publicidad Exterior
                </h4>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-lg flex items-center space-x-2">
                  <Check className="w-4 h-4" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Selectors column */}
                <div className="space-y-4 md:col-span-1">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Cliente Destinatario *</label>
                    <select
                      value={activeClient ? activeClient.id : ''}
                      onChange={(e) => onSelectActiveClient(clients.find(c => c.id === e.target.value) || null)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-amber-500"
                      required
                    >
                      <option value="">-- Seleccionar Cliente --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Valla / Estructura Cotizada *</label>
                    <select
                      value={activeVehicle ? activeVehicle.id : ''}
                      onChange={(e) => onSelectActiveVehicle(vehicles.find(v => v.id === e.target.value) || null)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-amber-500"
                      required
                    >
                      <option value="">-- Seleccionar Valla / LED --</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.tipo_valla || v.tipo} - {v.avenida_calle || v.modelo} ({v.ciudad})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Observaciones Adicionales</label>
                    <textarea
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Ej. Incluye colocación nocturna, iluminación LED, lona lona alta durabilidad..."
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>
                </div>

                {/* Fees Breakdown Column */}
                <div className="space-y-4 md:col-span-1">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Alquiler Base Mensual USD *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">$</span>
                      <input
                        type="number"
                        value={precioVehiculo}
                        onChange={(e) => setPrecioVehiculo(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Impresión Lona USD</label>
                      <input
                        type="number"
                        value={gastosImportacion}
                        onChange={(e) => setGastosImportacion(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Montaje / Estructura USD</label>
                      <input
                        type="number"
                        value={gastosAduana}
                        onChange={(e) => setGastosAduana(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Iluminación / Mantenimiento USD</label>
                      <input
                        type="number"
                        value={gastosLogistica}
                        onChange={(e) => setGastosLogistica(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Seguro de Valla USD</label>
                      <input
                        type="number"
                        value={gastosSeguro}
                        onChange={(e) => setGastosSeguro(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Final Total and Action Column */}
                <div className="p-5 rounded-xl border border-amber-100 bg-amber-50/45 flex flex-col justify-between md:col-span-1">
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center space-x-1">
                      <span>Resumen de Presupuesto</span>
                    </h5>

                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex justify-between text-gray-500">
                        <span>Alquiler Mensual Valla:</span>
                        <span>${basePriceNum.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Lona + Montaje + Mant.:</span>
                        <span>${(importNum + aduanaNum + logisticaNum + seguroNum).toLocaleString()}</span>
                      </div>
                      <div className="border-t border-dashed border-amber-200/80 pt-3 flex justify-between text-base font-extrabold text-gray-800">
                        <span>Total Neto Cotizado:</span>
                        <span className="font-mono text-lg text-amber-700">${totalQuotePrice.toLocaleString()} USD</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 pt-1 font-semibold">
                        <span>Total Equivalente Bolivianos:</span>
                        <span>Bs. {(totalQuotePrice * settings.tipo_cambio).toLocaleString('es-BO', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Cerrar
                    </button>
                    <button
                      type="button"
                      onClick={handlePreviewDraft}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-extrabold transition shadow-xs flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Previsualizar</span>
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-extrabold transition shadow-xs uppercase flex-1 cursor-pointer"
                    >
                      Generar Documento
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid: Quotes List Table */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs no-print">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-50">
          <h3 className="text-lg font-bold font-display text-gray-800">
            Registro Histórico de Cotizaciones ({filteredQuotes.length} de {quotations.length})
          </h3>
          <span className="text-xs text-gray-400 font-medium">Bases de datos SQLite SQLite Core</span>
        </div>

        <div className="overflow-x-auto min-h-[350px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 text-xs font-semibold uppercase tracking-wider bg-gray-50/50">
                <th className="py-3 px-4 font-semibold">Número Documento</th>
                <th className="py-3 px-4 font-semibold">Cliente</th>
                <th className="py-3 px-4 font-semibold">Valla / Espacio Publicitario</th>
                <th className="py-3 px-4 font-semibold">Monto Total</th>
                <th className="py-3 px-4 font-semibold">Estado</th>
                <th className="py-3 px-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredQuotes.length > 0 ? (
                filteredQuotes.map((quote) => {
                  const client = clients.find(c => c.id === quote.cliente_id);
                  const vehicle = vehicles.find(v => v.id === quote.vehiculo_id);

                  return (
                    <tr key={quote.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-xs text-indigo-600">{quote.numero}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-gray-800 text-sm">{client ? client.nombre : 'Cliente Desconocido'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs text-gray-700 font-medium">
                          {vehicle ? `${vehicle.tipo_valla || vehicle.tipo} - ${vehicle.avenida_calle || vehicle.modelo} (${vehicle.ciudad})` : 'Valla No Especificada'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs font-bold text-gray-800">
                          <span>${quote.total.toLocaleString()} USD</span>
                          <span className="block text-[10px] text-gray-400 font-normal">
                            Bs. {(quote.total * settings.tipo_cambio).toLocaleString('es-BO', {maximumFractionDigits: 0})}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={quote.estado}
                          onChange={(e) => onUpdateQuotationStatus(quote.id, e.target.value as QuotationState)}
                          className={`text-xs font-bold px-2 py-1 rounded-full border cursor-pointer ${
                            quote.estado === 'Borrador' ? 'bg-gray-50 text-gray-600 border-gray-200' :
                            quote.estado === 'Enviada' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                            quote.estado === 'Vista por cliente' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                            quote.estado === 'Negociación' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                            quote.estado === 'Aceptada' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                            quote.estado === 'Rechazada' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                            'bg-red-50 text-red-600 border-red-200'
                          }`}
                        >
                          <option value="Borrador">Borrador</option>
                          <option value="Enviada">Enviada</option>
                          <option value="Vista por cliente">Vista por cliente</option>
                          <option value="Negociación">Negociación</option>
                          <option value="Aceptada">Aceptada</option>
                          <option value="Rechazada">Rechazada</option>
                          <option value="Vencida">Vencida</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center space-x-1">
                          
                          {/* Descargar PDF con Lonas y Contrato */}
                          <button
                            onClick={() => handleDownloadQuotePdf(quote)}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] rounded-md transition flex items-center space-x-1 shadow-2xs cursor-pointer"
                            title="Descargar PDF Corporativo Oficial con desglose de lonas y contrato legal"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-950" />
                            <span>PDF Lonas</span>
                          </button>

                          {/* Previsualizar y Editar Proforma */}
                          <button
                            onClick={() => handleOpenPreview(quote, false)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-extrabold text-[10px] rounded-md transition flex items-center space-x-1 border border-indigo-200 cursor-pointer"
                            title="Previsualizar, revisar y modificar la proforma / cotización"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-600 hover:text-white" />
                            <span>Previsualizar</span>
                          </button>

                          {/* Generar Contrato Directo */}
                          <button
                            onClick={() => {
                              setContractModalQuote(quote);
                              setShowContractModal(true);
                            }}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-[10px] rounded-md transition uppercase flex items-center space-x-1 shadow-2xs cursor-pointer"
                            title="Generar y Emitir Contrato Comercial con Descuento y Lona"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                            <span>Contrato</span>
                          </button>

                          {/* Send WhatsApp */}
                          <button
                            onClick={() => handleSendWhatsApp(quote)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition flex items-center space-x-1"
                            title="Enviar por WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Send Email */}
                          <button
                            onClick={() => handleSendEmail(quote)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center space-x-1"
                            title="Enviar por Correo / Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          {/* Send BOTH */}
                          <button
                            onClick={() => handleSendBoth(quote)}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] rounded-md transition uppercase shadow-2xs flex items-center space-x-1"
                            title="Enviar por WhatsApp y Email (AMBAS)"
                          >
                            <Send className="w-3 h-3" />
                            <span>Ambas</span>
                          </button>

                          {/* Print details popup */}
                          <button
                            onClick={() => setSelectedPrintQuote(quote)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Ver / Imprimir Cotización Oficial"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Clone Quotation */}
                          <button
                            onClick={() => handleDuplicateQuote(quote)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="Clonar / Duplicar Cotización"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete quote */}
                          <button
                            onClick={() => {
                              if (confirm('¿Está seguro de que desea eliminar permanentemente este registro de cotización?')) {
                                onDeleteQuotation(quote.id);
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Eliminar Documento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 text-xs">
                    No se encontraron cotizaciones coincidentes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINT PREVIEW / OFFICIAL QUOTATION PDF SHEET & EDITOR */}
      <AnimatePresence>
        {selectedPrintQuote && (() => {
          const displayQuote = editingQuote || selectedPrintQuote;
          const client = clients.find(c => c.id === displayQuote.cliente_id);
          const vehicle = vehicles.find(v => v.id === displayQuote.vehiculo_id);
          
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  handleClosePreview();
                }
              }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto no-print"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col my-8 relative"
              >
                {/* Controls toolbar */}
                <div className="bg-gray-950 text-white p-4 flex flex-wrap gap-2 justify-between items-center no-print border-b border-gray-800 sticky top-0 z-20">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsEditingPreview(!isEditingPreview)}
                      className={`px-3 py-1.5 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition cursor-pointer shadow-xs ${
                        isEditingPreview 
                          ? 'bg-amber-500 text-slate-950 font-black hover:bg-amber-400' 
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold'
                      }`}
                    >
                      {isEditingPreview ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                      <span>{isEditingPreview ? '👁️ Ver Vista Previa Sheet' : '✏️ Modificar Proforma'}</span>
                    </button>
                    <span className="text-[11px] text-gray-400 font-mono hidden sm:inline">
                      Nº {displayQuote.numero}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleSendWhatsApp(displayQuote)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center space-x-1 transition cursor-pointer"
                      title="Enviar por WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      onClick={() => handleSendEmail(displayQuote)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center space-x-1 transition cursor-pointer"
                      title="Enviar por Email"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email</span>
                    </button>

                    <button
                      onClick={() => handleSendBoth(displayQuote)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-gray-950 font-extrabold text-xs rounded-lg flex items-center space-x-1 transition cursor-pointer"
                      title="Enviar por WhatsApp y Email"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>AMBAS</span>
                    </button>

                    <button
                      onClick={() => window.print()}
                      className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 transition active:scale-98 cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-amber-400" />
                      <span>PDF / Imprimir</span>
                    </button>
                    
                    <button
                      onClick={handleClosePreview}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs transition flex items-center space-x-1 cursor-pointer"
                      title="Cerrar vista previa (Esc)"
                    >
                      <X className="w-4 h-4" />
                      <span>Cerrar</span>
                    </button>
                  </div>
                </div>

                {/* Success Banner */}
                {previewSuccessMsg && (
                  <div className="bg-emerald-600 text-white p-3 font-extrabold text-xs text-center border-b border-emerald-500 flex items-center justify-center space-x-2">
                    <Check className="w-4 h-4 text-amber-300" />
                    <span>{previewSuccessMsg}</span>
                  </div>
                )}

                {/* EDIT MODE FORM vs PRINTABLE SHEET */}
                {isEditingPreview ? (
                  <div className="p-6 bg-slate-50 text-slate-800 space-y-5 overflow-y-auto max-h-[80vh]">
                    <div className="bg-indigo-900 text-white rounded-xl p-3.5 flex justify-between items-center text-xs">
                      <span className="font-extrabold uppercase tracking-wider text-amber-400 flex items-center space-x-2">
                        <Edit3 className="w-4 h-4 text-amber-400" />
                        <span>Edición Interactiva de Proforma N° {displayQuote.numero}</span>
                      </span>
                      <span className="font-mono text-indigo-200 text-[11px]">Modifique cualquier parámetro y presione Guardar</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Cliente Destinatario</label>
                        <select
                          value={displayQuote.cliente_id}
                          onChange={(e) => setEditingQuote(prev => prev ? { ...prev, cliente_id: e.target.value } : prev)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                        >
                          {clients.map((c) => (
                            <option key={c.id} value={c.id}>{c.nombre} ({c.empresa || c.departamento})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Valla Publicitaria / Pantalla LED Cotizada</label>
                        <select
                          value={displayQuote.vehiculo_id}
                          onChange={(e) => setEditingQuote(prev => prev ? { ...prev, vehiculo_id: e.target.value } : prev)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                        >
                          {vehicles.map((v) => (
                            <option key={v.id} value={v.id}>{v.tipo_valla || v.tipo} - {v.avenida_calle || v.modelo} ({v.ciudad})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b pb-2">
                        Desglose de Montos y Servicios (USD)
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Alquiler Base Mensual ($)</label>
                          <input
                            type="number"
                            value={displayQuote.precio_vehiculo}
                            onChange={(e) => setEditingQuote(prev => prev ? { ...prev, precio_vehiculo: parseFloat(e.target.value) || 0 } : prev)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Impresión Lona ($)</label>
                          <input
                            type="number"
                            value={displayQuote.gastos_importacion}
                            onChange={(e) => setEditingQuote(prev => prev ? { ...prev, gastos_importacion: parseFloat(e.target.value) || 0 } : prev)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Montaje / Estructura ($)</label>
                          <input
                            type="number"
                            value={displayQuote.gastos_aduana}
                            onChange={(e) => setEditingQuote(prev => prev ? { ...prev, gastos_aduana: parseFloat(e.target.value) || 0 } : prev)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Mantenimiento / Luz ($)</label>
                          <input
                            type="number"
                            value={displayQuote.gastos_logistica}
                            onChange={(e) => setEditingQuote(prev => prev ? { ...prev, gastos_logistica: parseFloat(e.target.value) || 0 } : prev)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Seguro / Garantía ($)</label>
                          <input
                            type="number"
                            value={displayQuote.gastos_seguro}
                            onChange={(e) => setEditingQuote(prev => prev ? { ...prev, gastos_seguro: parseFloat(e.target.value) || 0 } : prev)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Estado Proforma</label>
                          <select
                            value={displayQuote.estado}
                            onChange={(e) => setEditingQuote(prev => prev ? { ...prev, estado: e.target.value as QuotationState } : prev)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                          >
                            <option value="Borrador">Borrador</option>
                            <option value="Enviada">Enviada</option>
                            <option value="Aceptada">Aceptada</option>
                            <option value="Rechazada">Rechazada</option>
                          </select>
                        </div>
                      </div>

                      <div className="bg-slate-900 text-white p-3 rounded-xl flex justify-between items-center font-mono text-xs mt-2">
                        <span>TOTAL RECALCULADO:</span>
                        <span className="text-amber-400 font-bold text-sm">
                          ${((displayQuote.precio_vehiculo||0)+(displayQuote.gastos_importacion||0)+(displayQuote.gastos_aduana||0)+(displayQuote.gastos_logistica||0)+(displayQuote.gastos_seguro||0)).toLocaleString()} USD
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Observaciones y Notas Comerciales</label>
                      <textarea
                        rows={2}
                        value={displayQuote.observaciones || ''}
                        onChange={(e) => setEditingQuote(prev => prev ? { ...prev, observaciones: e.target.value } : prev)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-semibold"
                        placeholder="Ingrese notas o acuerdos de la oferta..."
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setIsEditingPreview(false)}
                        className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-300 transition cursor-pointer"
                      >
                        Cancelar Edición
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveEditedQuote}
                        className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition flex items-center space-x-2 shadow-md cursor-pointer uppercase tracking-wider"
                      >
                        <Check className="w-4 h-4" />
                        <span>Guardar Cambios en Proforma</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Printable sheet area */
                  <div className="p-8 bg-white text-gray-800 space-y-6 overflow-y-auto" id="printable-area">
                    
                    {/* Letterhead */}
                    <div className="flex flex-col sm:flex-row justify-between items-start pb-5 border-b-2 border-slate-900 gap-4">
                      <div className="space-y-1 max-w-md">
                        <Logo size="md" logoUrl={settings.logo} />
                        <p className="text-[11px] text-amber-600 font-extrabold tracking-wider uppercase pt-1">
                          Publicidad Exterior • Vallas Gigantes & Pantallas LED en Bolivia
                        </p>
                        <div className="text-[10px] text-gray-500 leading-normal pt-1">
                          <p><strong>Empresa:</strong> {settings.nombre_empresa || 'PUBLI-X BOLIVIA'}</p>
                          <p><strong>Dirección:</strong> {settings.direccion}</p>
                          <p><strong>Ubicación:</strong> {settings.ciudad}, {settings.departamento}, {settings.pais}</p>
                          <p><strong>Contacto:</strong> Tel: {settings.telefono} • WhatsApp: {settings.whatsapp}</p>
                          <p><strong>Digital:</strong> {settings.correo} • {settings.web}</p>
                        </div>
                      </div>

                      <div className="text-left sm:text-right space-y-2 w-full sm:w-auto">
                        <div className="inline-block px-3.5 py-1 bg-amber-500 text-slate-950 rounded-lg text-xs font-black uppercase tracking-wider shadow-xs">
                          COTIZACIÓN FORMAL / PROFORMA
                        </div>
                        <div className="font-mono text-xs">
                          <p className="text-gray-400">Nº de Control:</p>
                          <p className="font-black text-gray-900 text-sm">{displayQuote.numero}</p>
                        </div>
                        <div className="font-mono text-[10px] text-gray-500">
                          <p>Fecha Emisión: {new Date(displayQuote.fecha).toLocaleDateString()}</p>
                          <p>Validez: 15 días calendario</p>
                        </div>
                      </div>
                    </div>

                    {/* Client and destination details */}
                    <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs">
                      <div className="space-y-1">
                        <p className="font-bold uppercase tracking-wider text-gray-400 text-[9px]">Cliente Destinatario:</p>
                        <p className="font-extrabold text-gray-800 text-sm">{client ? client.nombre : 'Cliente Desconocido'}</p>
                        <p className="text-gray-500">Ubicación: {client ? `${client.ciudad}, ${client.departamento}` : 'Bolivia'}</p>
                        <p className="text-gray-500">Teléfono: {client ? client.celular : 'N/A'}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="font-bold uppercase tracking-wider text-gray-400 text-[9px]">Ubicación y Cobertura Comercial:</p>
                        <p className="font-bold text-gray-800">Bolivia (Ejes Urbanos Principales)</p>
                        <p className="text-gray-500">Puntos de Alto Flujo Vehicular y Peatonal</p>
                        <p className="text-gray-500">Garantía de Iluminación y Mantenimiento Incluido</p>
                      </div>
                    </div>

                    {/* Vehicle / Valla details */}
                    {vehicle && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest pb-1 border-b border-gray-50">
                          Especificaciones de la Valla / Estructura Cotizada
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                          <div className="space-y-1.5 text-xs">
                            <p className="text-sm font-extrabold text-gray-800">{vehicle.tipo_valla || vehicle.tipo} - {vehicle.avenida_calle || vehicle.modelo}</p>
                            <p className="text-gray-500"><b className="font-medium text-gray-700">Medidas:</b> {vehicle.medidas || '10 x 4 m'}</p>
                            <p className="text-gray-500"><b className="font-medium text-gray-700">Ubicación:</b> {vehicle.ciudad} - {vehicle.zona || 'Centro'}</p>
                            <p className="text-gray-500"><b className="font-medium text-gray-700">Orientación / Cara:</b> {vehicle.cara || 'Cara A'} • <b className="font-medium text-gray-700">Iluminación:</b> {vehicle.iluminacion || 'LED Nocturna'}</p>
                            <p className="text-gray-500"><b className="font-medium text-gray-700">Estado:</b> {vehicle.estado}</p>
                          </div>
                          <div className="h-32 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden shadow-2xs">
                            <img
                              src={vehicle.imagen_principal}
                              alt={vehicle.modelo}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cost breakdown */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest pb-1 border-b border-gray-50">
                        Desglose de Alquiler y Servicios Publicitarios
                      </h4>
                      
                      <div className="border border-gray-100 rounded-xl overflow-hidden text-xs">
                        <div className="grid grid-cols-3 bg-gray-50 p-2.5 font-bold border-b border-gray-100 text-gray-600">
                          <span>Concepto / Servicio Publicitario</span>
                          <span className="text-right">Monto (USD)</span>
                          <span className="text-right">Equivalente (Bs)</span>
                        </div>
                        
                        <div className="divide-y divide-gray-50">
                          {[
                            { name: 'Alquiler Base Mensual de Valla Publicitaria / Pantalla', val: displayQuote.precio_vehiculo },
                            { name: 'Impresión de Lona Vinílica de Alta Durabilidad', val: displayQuote.gastos_importacion },
                            { name: 'Montaje, Colocado e Instalación de Estructura', val: displayQuote.gastos_aduana },
                            { name: 'Mantenimiento, Iluminación LED Nocturna y Limpieza', val: displayQuote.gastos_logistica },
                            { name: 'Seguro de Estructura y Garantía de Espacio Exclusivo', val: displayQuote.gastos_seguro },
                          ].map((row, i) => (
                            <div key={i} className="grid grid-cols-3 p-2.5 text-gray-600">
                              <span>{row.name}</span>
                              <span className="text-right font-mono font-medium">${row.val.toLocaleString()}</span>
                              <span className="text-right font-mono text-gray-400">Bs. {(row.val * settings.tipo_cambio).toLocaleString('es-BO', {maximumFractionDigits:0})}</span>
                            </div>
                          ))}
                        </div>

                        {/* Total row */}
                        <div className="grid grid-cols-3 bg-gray-950 text-white p-3 font-bold border-t border-gray-100 items-center">
                          <span className="text-sm font-extrabold uppercase tracking-wider text-amber-400 font-display">VALOR TOTAL COTIZADO:</span>
                          <span className="text-right font-mono text-base">${displayQuote.total.toLocaleString()} USD</span>
                          <span className="text-right font-mono text-sm text-gray-300">Bs. {(displayQuote.total * settings.tipo_cambio).toLocaleString('es-BO', {maximumFractionDigits:0})} BOB</span>
                        </div>
                      </div>
                    </div>

                    {/* Observations */}
                    {displayQuote.observaciones && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Notas Particulares de la Oferta:</p>
                        <p className="text-xs text-gray-600 leading-normal italic bg-gray-50 p-3 rounded-lg border border-gray-100">
                          "{displayQuote.observaciones}"
                        </p>
                      </div>
                    )}

                    {/* Conditions & Signatures */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 border-t border-gray-100 text-[10px]">
                      <div className="space-y-1 text-gray-400">
                        <p className="font-bold text-gray-600 uppercase tracking-wider text-[9px]">Términos y Cláusulas del Servicio:</p>
                        <div className="whitespace-pre-line leading-relaxed italic">
                          {settings.terminos_cotizacion}
                        </div>
                      </div>

                      <div className="flex flex-col justify-end items-center text-center space-y-3 pt-8">
                        <div className="w-40 border-b border-gray-300 pb-1" />
                        <div>
                          <p className="font-bold text-gray-700 text-[10px]">{settings.nombre_empresa || 'PUBLI-X BOLIVIA'}</p>
                          <p className="text-gray-400">Firma Autorizada • Departamento Comercial</p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Exit Bar */}
                    <div className="pt-6 border-t border-gray-100 flex items-center justify-between no-print">
                      <button
                        onClick={handleClosePreview}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>Cerrar Vista Previa</span>
                      </button>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => window.print()}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Imprimir / Guardar PDF</span>
                        </button>
                      </div>
                    </div>

                  </div>
                )}
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Auto Quotation Multi-Valla Generator Modal */}
      {showAutoGeneratorModal && (
        <AutoQuotationGeneratorModal
          clients={clients}
          vehicles={vehicles}
          settings={settings}
          currentUserNombre={currentUserNombre}
          initialClient={activeClient}
          initialVehicle={activeVehicle}
          onSaveQuotation={(quoteData) => {
            onAddQuotation(quoteData as any);
            setShowAutoGeneratorModal(false);
          }}
          onClose={() => setShowAutoGeneratorModal(false)}
        />
      )}

      {/* Contract Generation Modal */}
      {showContractModal && (
        <ContractModal
          quotation={contractModalQuote}
          clients={clients}
          vehicles={vehicles}
          settings={settings}
          currentUserNombre={currentUserNombre}
          onSaveContract={(contract) => {
            if (onSaveContract) {
              onSaveContract(contract);
            }
          }}
          onClose={() => {
            setShowContractModal(false);
            setContractModalQuote(null);
          }}
        />
      )}
    </div>
  );
}
