import React, { useState, useMemo } from 'react';
import { Client, Vehicle, Quotation, Settings, QuotationVallaItem } from '../types';
import { generateAutoQuotationWithContractPdf, AutoQuotationVallaDetail } from '../utils/pdfGenerator';
import Logo from './Logo';
import { 
  FileText, 
  Search, 
  Check, 
  X, 
  AlertCircle, 
  Layers, 
  DollarSign, 
  FileCheck, 
  Send, 
  Printer, 
  User, 
  MapPin, 
  Maximize2, 
  ShieldCheck, 
  Download, 
  Sparkles,
  ChevronRight,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AutoQuotationGeneratorModalProps {
  clients: Client[];
  vehicles: Vehicle[];
  settings: Settings;
  currentUserNombre?: string;
  currentUserRole?: string;
  initialClient?: Client | null;
  initialVehicle?: Vehicle | null;
  onSaveQuotation: (quote: Omit<Quotation, 'id' | 'numero' | 'fecha'> & { vallas_seleccionadas?: QuotationVallaItem[]; emisor_nombre?: string; emisor_rol?: string; incluye_contrato?: boolean; terminos_contrato?: string; descuento_usd?: number }) => void;
  onClose: () => void;
}

export default function AutoQuotationGeneratorModal({
  clients,
  vehicles,
  settings,
  currentUserNombre = 'Carlos David Vargas',
  currentUserRole = 'Gerente',
  initialClient,
  initialVehicle,
  onSaveQuotation,
  onClose
}: AutoQuotationGeneratorModalProps) {
  // Client selection
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClient?.id || (clients[0]?.id || ''));
  const [clientSearch, setClientSearch] = useState<string>('');

  // Billboard catalog selection & filters
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>(
    initialVehicle ? [initialVehicle.id] : (vehicles.length > 0 ? [vehicles[0].id] : [])
  );
  const [vallaSearch, setVallaSearch] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('TODAS');
  const [selectedType, setSelectedType] = useState<string>('TODAS');

  // Pricing & Lona parameters
  const [costoLonaM2Bs, setCostoLonaM2Bs] = useState<number>(65); // Standard Bs. 65/m² in Bolivia
  const [costoMontajeUsd, setCostoMontajeUsd] = useState<number>(0);
  const [costoMantenimientoUsd, setCostoMantenimientoUsd] = useState<number>(0);
  const [descuentoUsd, setDescuentoUsd] = useState<number>(0);
  const [observaciones, setObservaciones] = useState<string>(
    'Propuesta incluye impresión en Lona Frontlight 13oz de alta tenacidad con filtro UV, montaje con cuadrilla técnica certificada e iluminación nocturna garantizada de 18:30 a 24:00 hrs.'
  );

  // Emitter parameters (Requerimiento d: detector/selector de Gerente vs Vendedor)
  const [emitterType, setEmitterType] = useState<'gerente' | 'vendedor' | 'custom'>(
    currentUserRole.toLowerCase().includes('gerente') || currentUserRole.toLowerCase().includes('dueño') ? 'gerente' : 'vendedor'
  );
  const [customEmitterName, setCustomEmitterName] = useState<string>(currentUserNombre || 'Carlos David Vargas');
  const [customEmitterRole, setCustomEmitterRole] = useState<string>(currentUserRole || 'Gerente General');

  // Contract parameters (Requerimiento b)
  const [includeContract, setIncludeContract] = useState<boolean>(true);
  const [validezDias, setValidezDias] = useState<number>(15);

  // Status & Progress
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const exchangeRate = settings.tipo_cambio || 6.96;

  // Resolved Client
  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  // Available cities & types for filters
  const cities = useMemo(() => {
    const set = new Set<string>();
    vehicles.forEach(v => {
      if (v.ciudad) set.add(v.ciudad.trim());
    });
    return Array.from(set);
  }, [vehicles]);

  const types = useMemo(() => {
    const set = new Set<string>();
    vehicles.forEach(v => {
      const t = v.tipo_valla || v.tipo;
      if (t) set.add(t.trim());
    });
    return Array.from(set);
  }, [vehicles]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchCity = selectedCity === 'TODAS' || (v.ciudad && v.ciudad.toLowerCase() === selectedCity.toLowerCase());
      const matchType = selectedType === 'TODAS' || ((v.tipo_valla || v.tipo) && (v.tipo_valla || v.tipo).toLowerCase() === selectedType.toLowerCase());
      const query = vallaSearch.toLowerCase();
      const matchQuery = !query || 
        (v.avenida_calle && v.avenida_calle.toLowerCase().includes(query)) ||
        (v.modelo && v.modelo.toLowerCase().includes(query)) ||
        (v.marca && v.marca.toLowerCase().includes(query)) ||
        (v.zona && v.zona.toLowerCase().includes(query)) ||
        (v.tipo_valla && v.tipo_valla.toLowerCase().includes(query)) ||
        (v.ciudad && v.ciudad.toLowerCase().includes(query));
      
      return matchCity && matchType && matchQuery;
    });
  }, [vehicles, selectedCity, selectedType, vallaSearch]);

  // Calculate detailed items for selected vehicles
  const calculatedVallaDetails = useMemo<AutoQuotationVallaDetail[]>(() => {
    return selectedVehicleIds.map(vId => {
      const v = vehicles.find(item => item.id === vId);
      if (!v) return null;

      // Calculate area from medidas string (e.g., "12.00 x 4.00 m" -> 48 m²)
      let area = 40;
      if (v.medidas) {
        const nums = v.medidas.match(/(\d+(?:\.\d+)?)/g);
        if (nums && nums.length >= 2) {
          const w = parseFloat(nums[0]);
          const h = parseFloat(nums[1]);
          if (w > 0 && h > 0) area = Math.round(w * h);
        }
      }

      const lonaUnitBs = v.costo_lona_m2_bs || costoLonaM2Bs;
      const lonaTotalBs = area * lonaUnitBs;
      const lonaTotalUsd = Math.round(lonaTotalBs / exchangeRate);
      const alquilerUsd = v.precio_usd || 1500;
      const alquilerBob = Math.round(alquilerUsd * exchangeRate);

      return {
        id: v.id,
        nombre: `${v.tipo_valla || v.tipo || 'Valla'} - ${v.avenida_calle || v.modelo || 'Ubicación Estratégica'}`,
        tipo: v.tipo_valla || v.tipo || 'Valla Unipolar',
        medidas: v.medidas || '12.00 x 4.00 m',
        ciudad: v.ciudad || 'Santa Cruz',
        avenida: v.avenida_calle || v.modelo || 'Avenida Principal',
        cara: v.cara || 'Cara A',
        alquilerMensualUsd: alquilerUsd,
        alquilerMensualBob: alquilerBob,
        areaM2: area,
        costoLonaM2Bs: lonaUnitBs,
        costoLonaTotalBs: lonaTotalBs,
        costoLonaTotalUsd: lonaTotalUsd,
        iluminacion: v.iluminacion || 'Focos LED Nocturnos',
        imagen: v.foto_principal || (v.galeria && v.galeria[0]) || ''
      };
    }).filter(Boolean) as AutoQuotationVallaDetail[];
  }, [selectedVehicleIds, vehicles, costoLonaM2Bs, exchangeRate]);

  // Economic Totals
  const totalAlquilerUsd = useMemo(() => {
    return calculatedVallaDetails.reduce((acc, curr) => acc + curr.alquilerMensualUsd, 0);
  }, [calculatedVallaDetails]);

  const totalLonasUsd = useMemo(() => {
    return calculatedVallaDetails.reduce((acc, curr) => acc + curr.costoLonaTotalUsd, 0);
  }, [calculatedVallaDetails]);

  const totalLonasBob = useMemo(() => {
    return calculatedVallaDetails.reduce((acc, curr) => acc + curr.costoLonaTotalBs, 0);
  }, [calculatedVallaDetails]);

  const totalAreaM2 = useMemo(() => {
    return calculatedVallaDetails.reduce((acc, curr) => acc + curr.areaM2, 0);
  }, [calculatedVallaDetails]);

  const subtotalNetoUsd = totalAlquilerUsd + totalLonasUsd + costoMontajeUsd + costoMantenimientoUsd;
  const totalGeneralUsd = Math.max(0, subtotalNetoUsd - descuentoUsd);
  const totalGeneralBob = Math.round(totalGeneralUsd * exchangeRate);

  // Resolved Emitter
  const resolvedEmitter = useMemo(() => {
    if (emitterType === 'gerente') {
      return {
        nombre: 'Lic. Carlos David Vargas',
        rol: 'Gerente General / Dirección',
        phone: '+591 70000000',
        email: 'carlosdavidvargas@gmail.com'
      };
    } else if (emitterType === 'vendedor') {
      return {
        nombre: currentUserNombre || 'Mariana Suárez',
        rol: 'Asesor Comercial de Cuentas OOH',
        phone: '+591 70000000',
        email: settings.correo || 'ventas@publix.bo'
      };
    } else {
      return {
        nombre: customEmitterName,
        rol: customEmitterRole,
        phone: settings.telefono || '+591 70000000',
        email: settings.correo || 'ventas@publix.bo'
      };
    }
  }, [emitterType, currentUserNombre, customEmitterName, customEmitterRole, settings]);

  // Toggle vehicle selection
  const handleToggleVehicle = (id: string) => {
    setSelectedVehicleIds(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Generate & Download PDF
  const handleGeneratePdf = async () => {
    if (!selectedClient) {
      setErrorMsg('Por favor seleccione un cliente destinatario.');
      return;
    }
    if (calculatedVallaDetails.length === 0) {
      setErrorMsg('Debe seleccionar al menos un producto o valla.');
      return;
    }

    try {
      setIsGeneratingPdf(true);
      setErrorMsg('');
      setProgressMsg('Preparando documento corporativo...');

      const quoteNum = `COT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      await generateAutoQuotationWithContractPdf({
        quoteNumber: quoteNum,
        fechaEmision: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        validezDias,
        client: selectedClient,
        vallas: calculatedVallaDetails,
        costoMontajeUsd,
        costoMantenimientoUsd,
        descuentoUsd,
        totalAlquilerUsd,
        totalLonasUsd,
        totalGeneralUsd,
        totalGeneralBob,
        exchangeRate,
        emitterName: resolvedEmitter.nombre,
        emitterRole: resolvedEmitter.rol,
        emitterPhone: resolvedEmitter.phone,
        emitterEmail: resolvedEmitter.email,
        includeContract,
        observaciones,
        settings,
        onProgress: (msg) => setProgressMsg(msg)
      });

      setSuccessMsg('¡Cotización y Contrato PDF generado y descargado exitosamente!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Error al generar PDF: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsGeneratingPdf(false);
      setProgressMsg('');
    }
  };

  // Save Quotation into App Database
  const handleSaveToDatabase = () => {
    if (!selectedClient) {
      setErrorMsg('Por favor seleccione un cliente destinatario.');
      return;
    }
    if (calculatedVallaDetails.length === 0) {
      setErrorMsg('Debe seleccionar al menos una valla.');
      return;
    }

    const primaryVehicleId = calculatedVallaDetails[0].id;
    const vallasArray: QuotationVallaItem[] = calculatedVallaDetails.map(v => ({
      vehiculo_id: v.id,
      valla_nombre: v.nombre,
      valla_tipo: v.tipo,
      valla_medidas: v.medidas,
      valla_ciudad: v.ciudad,
      valla_avenida: v.avenida,
      valla_cara: v.cara,
      precio_alquiler_usd: v.alquilerMensualUsd,
      costo_lona_usd: v.costoLonaTotalUsd,
      area_m2: v.areaM2,
      costo_lona_m2_bs: v.costoLonaM2Bs,
      imagen: v.imagen
    }));

    onSaveQuotation({
      cliente_id: selectedClient.id,
      vehiculo_id: primaryVehicleId,
      precio_vehiculo: totalAlquilerUsd,
      gastos_importacion: totalLonasUsd,
      gastos_aduana: costoMontajeUsd,
      gastos_logistica: costoMantenimientoUsd,
      gastos_seguro: 0,
      total: totalGeneralUsd,
      estado: 'Enviada',
      observaciones: observaciones.trim(),
      vallas_seleccionadas: vallasArray,
      emisor_nombre: resolvedEmitter.nombre,
      emisor_rol: resolvedEmitter.rol,
      incluye_contrato: includeContract,
      descuento_usd: descuentoUsd
    });

    setSuccessMsg('¡Cotización guardada exitosamente en el sistema!');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  // WhatsApp share message
  const handleShareWhatsApp = () => {
    if (!selectedClient) return;
    const phone = selectedClient.celular.replace(/[^\d]/g, '');
    const vallasListText = calculatedVallaDetails
      .map((v, i) => `${i + 1}. *${v.tipo}* en ${v.avenida} (${v.ciudad}) - ${v.medidas} | Alquiler: $${v.alquilerMensualUsd} USD + Lona: Bs. ${v.costoLonaTotalBs}`)
      .join('\n');

    const msg = `Hola *${selectedClient.nombre}*, le saludamos de *PUBLI-X BOLIVIA*.\n\nAdjuntamos la propuesta de espacios publicitarios OOH solicitada:\n\n${vallasListText}\n\n📊 *Total Alquiler:* $${totalAlquilerUsd.toLocaleString()} USD\n🎨 *Total Confección Lonas:* Bs. ${totalLonasBob.toLocaleString('es-BO')} BOB ($${totalLonasUsd} USD)\n💰 *TOTAL INVERSIÓN:* $${totalGeneralUsd.toLocaleString()} USD (Bs. ${totalGeneralBob.toLocaleString('es-BO')} BOB)\n\n👤 *Emisor:* ${resolvedEmitter.nombre} (${resolvedEmitter.rol})\n📄 *Incluye:* Iluminación nocturna LED, montaje y contrato formal de arrendamiento.\n\n¿Desea que procedamos con la reserva del espacio?`;

    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto no-print">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-5xl w-full overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Header Bar */}
        <div className="bg-slate-900 text-white p-4 sm:px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-500/20 p-2 rounded-xl border border-amber-500/30">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight font-display text-white">
                  Generador Automático de Cotizaciones & Contratos OOH
                </h3>
                <span className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase px-2 py-0.5 rounded-full">
                  PUBLI-X
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Seleccione vallas, calcule lonas al instante y emita la proforma con contrato legal adjunto
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          {/* Top Section: Client & Emitter Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Cliente Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                  <User className="w-4 h-4 text-amber-500" />
                  <span>1. Cliente Destinatario</span>
                </span>
                <span className="text-[11px] text-slate-400">{clients.length} registrados</span>
              </div>

              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-amber-500 text-slate-800 cursor-pointer"
              >
                <option value="">-- Seleccionar Cliente --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.empresa ? `${c.empresa} (${c.nombre})` : c.nombre} - {c.ciudad || 'Bolivia'}
                  </option>
                ))}
              </select>

              {selectedClient && (
                <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-100/80 text-[11px] space-y-1 text-slate-700">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-900">{selectedClient.nombre}</span>
                    <span className="text-amber-700 font-bold">{selectedClient.empresa || 'Corporativo'}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[10px]">
                    <span>📱 {selectedClient.celular}</span>
                    <span>📍 {selectedClient.ciudad}, {selectedClient.departamento}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Emisor Card (Requerimiento d) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>2. Emisor del Documento</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                  {resolvedEmitter.rol}
                </span>
              </div>

              {/* Toggle: Gerente vs Vendedor vs Custom */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setEmitterType('gerente')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 border cursor-pointer ${
                    emitterType === 'gerente'
                      ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>👑 Gerente</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEmitterType('vendedor')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 border cursor-pointer ${
                    emitterType === 'vendedor'
                      ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>👤 Vendedor</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEmitterType('custom')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 border cursor-pointer ${
                    emitterType === 'custom'
                      ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>✏️ Otro</span>
                </button>
              </div>

              {emitterType === 'custom' ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Nombre del emisor..."
                    value={customEmitterName}
                    onChange={(e) => setCustomEmitterName(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Cargo / Rol..."
                    value={customEmitterRole}
                    onChange={(e) => setCustomEmitterRole(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              ) : (
                <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 flex items-center justify-between">
                  <span>Emitido por: <strong className="text-slate-900">{resolvedEmitter.nombre}</strong></span>
                  <span className="text-[10px] text-amber-700 font-semibold">{resolvedEmitter.email}</span>
                </div>
              )}
            </div>

          </div>

          {/* Catalog Multi-Selection Area */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>3. Selección de Vallas y Pantallas Publicitarias ({selectedVehicleIds.length} seleccionadas)</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Marque las casillas de los espacios a cotizar. El precio de lona se calcula automáticamente.
                </p>
              </div>

              {/* Quick filters */}
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative min-w-[160px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar ubicación..."
                    value={vallaSearch}
                    onChange={(e) => setVallaSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                  />
                </div>

                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium cursor-pointer"
                >
                  <option value="TODAS">Todas las Ciudades</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium cursor-pointer"
                >
                  <option value="TODAS">Todos los Tipos</option>
                  {types.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Vallas Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[320px] overflow-y-auto p-1">
              {filteredVehicles.map(v => {
                const isSelected = selectedVehicleIds.includes(v.id);
                
                // calculate quick area
                let area = 40;
                if (v.medidas) {
                  const nums = v.medidas.match(/(\d+(?:\.\d+)?)/g);
                  if (nums && nums.length >= 2) {
                    const w = parseFloat(nums[0]);
                    const h = parseFloat(nums[1]);
                    if (w > 0 && h > 0) area = Math.round(w * h);
                  }
                }
                const lonaBs = area * (v.costo_lona_m2_bs || costoLonaM2Bs);

                return (
                  <div
                    key={v.id}
                    onClick={() => handleToggleVehicle(v.id)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Handled by parent div
                            className="w-4 h-4 text-amber-500 rounded-sm border-slate-300 focus:ring-amber-400 cursor-pointer"
                          />
                          <span className="font-bold text-xs text-slate-900">
                            {v.tipo_valla || v.tipo || 'Valla'}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {v.ciudad || 'Bolivia'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 font-medium line-clamp-1">
                        📍 {v.avenida_calle || v.modelo || 'Ubicación'}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>📐 {v.medidas || '12x4m'} ({area} m²)</span>
                        <span>{v.cara || 'Cara A'}</span>
                      </div>
                    </div>

                    {/* Price Breakdown in Card */}
                    <div className="mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="block text-[10px] text-slate-400">Alquiler:</span>
                        <span className="font-black text-amber-600">${(v.precio_usd || 1500).toLocaleString()} USD</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400">Lona ({area}m²):</span>
                        <span className="font-bold text-slate-800">Bs. {lonaBs.toLocaleString('es-BO')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredVehicles.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                No se encontraron vallas con los filtros seleccionados.
              </div>
            )}
          </div>

          {/* Section 4: Lona Pricing, Contract Toggle & Financial Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Lona Settings & Additional Costs */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 lg:col-span-1">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5 pb-2 border-b border-slate-100">
                <DollarSign className="w-4 h-4 text-amber-500" />
                <span>4. Parámetros de Lonas & Montaje</span>
              </h4>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Costo Impresión Lona Frontlight (Bs. / m²)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Bs.</span>
                  <input
                    type="number"
                    value={costoLonaM2Bs}
                    onChange={(e) => setCostoLonaM2Bs(Number(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Estándar nacional: Bs. 65 a 75 por m²</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    Descuento ($us)
                  </label>
                  <input
                    type="number"
                    value={descuentoUsd}
                    onChange={(e) => setDescuentoUsd(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    Validez (Días)
                  </label>
                  <input
                    type="number"
                    value={validezDias}
                    onChange={(e) => setValidezDias(Number(e.target.value) || 15)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              {/* Contract Toggle Checkbox (Requerimiento b) */}
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/60 mt-2">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeContract}
                    onChange={(e) => setIncludeContract(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded mt-0.5 focus:ring-amber-400 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">
                      Incluir Contrato Asociado en el PDF
                    </span>
                    <span className="text-[10px] text-slate-600 block">
                      Genera automáticamente la página 2 con cláusulas legales OOH, condiciones de iluminación LED, mantenimiento y firmas.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Selected Breakdown Table */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 lg:col-span-2 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5 pb-2 border-b border-slate-100">
                  <FileCheck className="w-4 h-4 text-amber-500" />
                  <span>5. Resumen Financiero de la Propuesta</span>
                </h4>

                {/* Table Breakdown */}
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-100">
                        <th className="py-2 px-2.5">Valla / Ubicación</th>
                        <th className="py-2 px-2.5">Medidas / Superficie</th>
                        <th className="py-2 px-2.5 text-right">Alquiler Mensual</th>
                        <th className="py-2 px-2.5 text-right">Lona Frontlight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {calculatedVallaDetails.map(v => (
                        <tr key={v.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-2.5">
                            <span className="font-bold text-slate-800 block">{v.tipo}</span>
                            <span className="text-[10px] text-slate-500">{v.avenida} ({v.ciudad})</span>
                          </td>
                          <td className="py-2 px-2.5">
                            <span className="font-medium text-slate-700">{v.medidas}</span>
                            <span className="block text-[10px] text-amber-600 font-bold">{v.areaM2} m²</span>
                          </td>
                          <td className="py-2 px-2.5 text-right font-bold text-slate-900">
                            ${v.alquilerMensualUsd.toLocaleString()} USD
                            <span className="block text-[10px] text-slate-400 font-normal">
                              Bs. {v.alquilerMensualBob.toLocaleString('es-BO')}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 text-right font-bold text-slate-900">
                            Bs. {v.costoLonaTotalBs.toLocaleString('es-BO')}
                            <span className="block text-[10px] text-amber-600 font-semibold">
                              ${v.costoLonaTotalUsd} USD
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Big Financial Summary Box */}
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 mt-4">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Subtotal Alquiler ({calculatedVallaDetails.length} vallas):</span>
                  <span className="font-bold font-mono">${totalAlquilerUsd.toLocaleString()} USD</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Subtotal Confección de Lonas ({totalAreaM2} m² totales):</span>
                  <span className="font-bold font-mono">Bs. {totalLonasBob.toLocaleString('es-BO')} BOB (${totalLonasUsd} USD)</span>
                </div>
                {descuentoUsd > 0 && (
                  <div className="flex justify-between text-xs text-amber-400">
                    <span>Descuento Comercial Aplicado:</span>
                    <span className="font-bold font-mono">- ${descuentoUsd.toLocaleString()} USD</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
                  <div>
                    <span className="text-[11px] text-amber-400 uppercase font-black tracking-wider block">
                      TOTAL GENERAL DE LA PROPUESTA
                    </span>
                    <span className="text-xs text-slate-400">
                      T/C Oficial: Bs. {exchangeRate}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                      ${totalGeneralUsd.toLocaleString()} USD
                    </div>
                    <div className="text-xs text-white font-bold font-mono">
                      Bs. {totalGeneralBob.toLocaleString('es-BO')} BOB
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="bg-white p-4 sm:px-6 border-t border-slate-200 flex flex-wrap gap-2.5 items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex flex-wrap gap-2 items-center">
            {/* WhatsApp Share */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={!selectedClient || calculatedVallaDetails.length === 0}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              title="Compartir resumen por WhatsApp"
            >
              <Send className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            {/* Save to System Database */}
            <button
              type="button"
              onClick={handleSaveToDatabase}
              disabled={!selectedClient || calculatedVallaDetails.length === 0}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Guardar en Base de Datos</span>
            </button>

            {/* Generate & Download PDF (PRIMARY ACTION) */}
            <button
              type="button"
              onClick={handleGeneratePdf}
              disabled={isGeneratingPdf || !selectedClient || calculatedVallaDetails.length === 0}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition flex items-center space-x-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>
                {isGeneratingPdf ? (progressMsg || 'Generando PDF...') : 'Descargar Cotización + Contrato PDF'}
              </span>
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
