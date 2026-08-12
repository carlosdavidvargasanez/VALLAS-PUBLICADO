import React, { useState, useEffect } from 'react';
import Logo from './Logo';
import { 
  Client, 
  Vehicle, 
  Quotation, 
  Contract, 
  ContractVallaItem, 
  ContractLonaItem, 
  ContractStatus, 
  ContractTemplateDesign,
  Settings 
} from '../types';
import { 
  X, 
  Check, 
  FileText, 
  Building2, 
  User, 
  DollarSign, 
  Calendar, 
  Printer, 
  Send, 
  Mail, 
  MessageSquare, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  ShieldCheck,
  Tag,
  AlertCircle,
  Copy,
  Sliders,
  CheckCircle2,
  FileCheck,
  Info,
  Plus,
  Trash2,
  Layers,
  Palette,
  Eye,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ContractModalProps {
  quotation?: Quotation | null;
  initialContract?: Contract | null;
  initialStep?: 1 | 2 | 3;
  clients: Client[];
  vehicles: Vehicle[];
  settings: Settings;
  currentUserNombre: string;
  onSaveContract: (contract: Contract) => void;
  onClose: () => void;
}

export default function ContractModal({
  quotation,
  initialContract,
  initialStep = 1,
  clients,
  vehicles,
  settings,
  currentUserNombre,
  onSaveContract,
  onClose
}: ContractModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(initialStep);

  // Template Design Selection
  const [disenoPlantilla, setDisenoPlantilla] = useState<ContractTemplateDesign>('OFICIAL_VALLAS');

  // Client / Destinatario State (Editable & Switchable)
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clienteNombre, setClienteNombre] = useState<string>('UNIVERSIDAD PRIVADA DOMINGO SAVIO – UPDS');
  const [clienteEmpresa, setClienteEmpresa] = useState<string>('UPDS');
  const [clienteNitCi, setClienteNitCi] = useState<string>('1015289020');
  const [clienteRepresentante, setClienteRepresentante] = useState<string>('Lic. Paola Carmiña Pericón de Chazal');
  const [clienteRepresentanteCi, setClienteRepresentanteCi] = useState<string>('3559515 emitida en Oruro');
  const [clienteEscrituraPoder, setClienteEscrituraPoder] = useState<string>('Nº 506/2021');
  const [clientePoderFecha, setClientePoderFecha] = useState<string>('05 de Mayo del 2021');
  const [clienteNotariaNumero, setClienteNotariaNumero] = useState<string>('N° 103');
  const [clienteNotarioNombre, setClienteNotarioNombre] = useState<string>('Dra. Marbel Silvana España Pedraza');
  const [clienteCelular, setClienteCelular] = useState<string>('+591 70000000');
  const [clienteCorreo, setClienteCorreo] = useState<string>('marketing@upds.edu.bo');
  const [clienteDireccion, setClienteDireccion] = useState<string>('Av. Beni y 3er anillo Externo');
  const [clienteCiudad, setClienteCiudad] = useState<string>('Santa Cruz');

  // Arrendador (Empresa)
  const [arrendadorEmpresa, setArrendadorEmpresa] = useState<string>('PUBLI-X BOLIVIA');
  const [arrendadorNit, setArrendadorNit] = useState<string>('4579387019');
  const [arrendadorDireccion, setArrendadorDireccion] = useState<string>('Calle Los Tajibos 2185 Barrio Petrolero Norte UV 0016 MZA 14 entre 2do anillo y Av. Los Cusis');
  const [arrendadorRepresentante, setArrendadorRepresentante] = useState<string>('Sr. Carlos David Vargas Añez');
  const [arrendadorCi, setArrendadorCi] = useState<string>('4579387 emitida en Santa Cruz');

  // List of Vallas (Table 1 of Contract)
  const [vallasLista, setVallasLista] = useState<ContractVallaItem[]>([
    {
      id: 'VALLA-1',
      ciudad: 'Santa Cruz',
      formato: 'Valla Unipolar',
      direccion: '3er ANILLO INTERNO CANAL COTOCA',
      costo_mensual_bs: 13980,
      descuento_bs: 1000,
      costo_neto_bs: 12980
    },
    {
      id: 'VALLA-2',
      ciudad: 'Santa Cruz',
      formato: 'Valla Unipolar',
      direccion: '3er ANILLO INTERNO ENTRE AV. BUSH Y AV. SAN MARTIN',
      costo_mensual_bs: 8800,
      descuento_bs: 880,
      costo_neto_bs: 7920
    },
    {
      id: 'VALLA-3',
      ciudad: 'Santa Cruz',
      formato: 'Valla Unipolar',
      direccion: '2do ANILLO AV. PIRAI DIAGONAL HIPERMAXI',
      costo_mensual_bs: 9800,
      descuento_bs: 1100,
      costo_neto_bs: 8700
    }
  ]);

  // List of Lonas (Table 2 of Contract)
  const [lonasLista, setLonasLista] = useState<ContractLonaItem[]>([
    {
      id: 'LONA-1',
      direccion: '3er ANILLO INTERNO CANAL COTOCA',
      medidas: '15x4',
      costo_unitario_bs: 4380,
      descuento_lona_bs: 0,
      total_costo_bs: 4380
    },
    {
      id: 'LONA-2',
      direccion: '3er ANILLO INTERNO ENTRE AV. BUSH Y AV. SAN MARTIN',
      medidas: '10X4',
      costo_unitario_bs: 2920,
      descuento_lona_bs: 30,
      total_costo_bs: 2890
    },
    {
      id: 'LONA-3',
      direccion: '2do ANILLO AV. PIRAI DIAGONAL HIPERMAXI',
      medidas: '10X4',
      costo_unitario_bs: 2920,
      descuento_lona_bs: 30,
      total_costo_bs: 2890
    }
  ]);

  // Fechas y Vigencia
  const [periodoMeses, setPeriodoMeses] = useState<number>(2);
  const [fechaInicio, setFechaInicio] = useState<string>('2026-07-03');
  const [fechaFin, setFechaFin] = useState<string>('2026-09-03');

  // Tipo de Cambio (BOB por USD)
  const tc = settings.tipo_cambio || 6.96;

  // Beneficios Extras Included
  const [beneficiosExtras, setBeneficiosExtras] = useState<string[]>([
    'Mantenimiento preventivo mensual y limpieza de estructura',
    'Iluminación LED continua nocturna (18:00 a 06:00)',
    'Reporte fotográfico mensual de monitoreo',
    'Seguro de estructura y lona ante contingencias'
  ]);

  // Conditions
  const [formaPago, setFormaPago] = useState<string>('El ARRENDATARIO realizará el pago mediante emisión de cheque ó vía transferencia bancaria a nombre de Carlos David Vargas Añez previa emisión de factura.');
  const [clausulasEspeciales, setClausulasEspeciales] = useState<string>('El ARRENDADOR es responsable de conservar en buen estado la estructura e iluminación durante toda la vigencia del contrato.');

  // Status & Success Notice
  const [contractStatus, setContractStatus] = useState<ContractStatus>('Vigente');
  const [savedContract, setSavedContract] = useState<Contract | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  // Initialize form from Quotation or Initial Contract
  useEffect(() => {
    if (initialContract) {
      setSelectedClientId(initialContract.cliente_id);
      setClienteNombre(initialContract.cliente_nombre);
      setClienteEmpresa(initialContract.cliente_empresa || '');
      setClienteNitCi(initialContract.cliente_nit_ci || '');
      setClienteRepresentante(initialContract.cliente_representante || '');
      setClienteRepresentanteCi(initialContract.cliente_representante_ci || '');
      setClienteEscrituraPoder(initialContract.cliente_escritura_poder || '');
      setClientePoderFecha(initialContract.cliente_poder_fecha || '');
      setClienteNotariaNumero(initialContract.cliente_notaria_numero || '');
      setClienteNotarioNombre(initialContract.cliente_notario_nombre || '');
      setClienteCelular(initialContract.cliente_celular);
      setClienteCorreo(initialContract.cliente_correo || '');
      setClienteDireccion(initialContract.cliente_direccion || '');
      setClienteCiudad(initialContract.cliente_ciudad);

      if (initialContract.vallas_lista && initialContract.vallas_lista.length > 0) {
        setVallasLista(initialContract.vallas_lista);
      }
      if (initialContract.lonas_lista && initialContract.lonas_lista.length > 0) {
        setLonasLista(initialContract.lonas_lista);
      }

      setPeriodoMeses(initialContract.periodo_meses);
      setFechaInicio(initialContract.fecha_inicio);
      setFechaFin(initialContract.fecha_fin);

      setBeneficiosExtras(initialContract.beneficios_extras || []);
      setFormaPago(initialContract.forma_pago);
      setClausulasEspeciales(initialContract.clausulas_especiales || '');
      setContractStatus(initialContract.estado);
      if (initialContract.diseno_plantilla) {
        setDisenoPlantilla(initialContract.diseno_plantilla);
      }
    } else if (quotation) {
      const client = clients.find(c => c.id === quotation.cliente_id);
      const vehicle = vehicles.find(v => v.id === quotation.vehiculo_id);

      if (client) {
        setSelectedClientId(client.id);
        setClienteNombre(client.nombre);
        setClienteEmpresa(client.empresa || '');
        setClienteCelular(client.celular);
        setClienteCorreo(client.correo || '');
        setClienteCiudad(client.ciudad || 'Santa Cruz');
        setClienteDireccion('Av. Principal, Edificio Corporativo');
        setClienteNitCi('1020304050');
      }

      if (vehicle) {
        const costoBs = Math.round((quotation.precio_vehiculo || vehicle.precio_usd || 1500) * tc);
        setVallasLista([
          {
            id: 'VALLA-1',
            ciudad: vehicle.ciudad || 'Santa Cruz',
            formato: vehicle.tipo_valla || 'Valla Unipolar',
            direccion: `${vehicle.marca} - ${vehicle.modelo} (${vehicle.avenida_calle || 'Av. Principal'})`,
            costo_mensual_bs: costoBs,
            descuento_bs: 0,
            costo_neto_bs: costoBs
          }
        ]);

        setLonasLista([
          {
            id: 'LONA-1',
            direccion: `${vehicle.marca} - ${vehicle.modelo}`,
            medidas: vehicle.medidas || '12x4',
            costo_unitario_bs: 2890,
            descuento_lona_bs: 0,
            total_costo_bs: 2890
          }
        ]);
      }
    }
  }, [quotation, initialContract, clients, vehicles, tc]);

  // Calculations for Totals in BOB and USD
  const totalVallasBs = vallasLista.reduce((acc, curr) => acc + (curr.costo_neto_bs || 0), 0);
  const totalLonasBs = lonasLista.reduce((acc, curr) => acc + (curr.total_costo_bs || 0), 0);
  
  // Canon total for entire contract duration
  const canonTotalContratoBs = totalVallasBs * periodoMeses;
  const grandTotalContratoBs = canonTotalContratoBs + totalLonasBs;
  
  const grandTotalContratoUsd = Math.round(grandTotalContratoBs / tc);

  // Auto calculate end date
  useEffect(() => {
    if (fechaInicio && periodoMeses) {
      const start = new Date(fechaInicio);
      if (!isNaN(start.getTime())) {
        start.setMonth(start.getMonth() + periodoMeses);
        setFechaFin(start.toISOString().split('T')[0]);
      }
    }
  }, [fechaInicio, periodoMeses]);

  // Valla Item Handlers
  const handleAddVallaRow = () => {
    const newRow: ContractVallaItem = {
      id: 'VALLA-' + Date.now(),
      ciudad: clienteCiudad || 'Santa Cruz',
      formato: 'Valla Unipolar',
      direccion: 'Nueva Ubicación Avenida / Anillo',
      costo_mensual_bs: 8000,
      descuento_bs: 0,
      costo_neto_bs: 8000
    };
    setVallasLista([...vallasLista, newRow]);
  };

  const handleUpdateVallaRow = (id: string, field: keyof ContractVallaItem, value: any) => {
    setVallasLista(vallasLista.map((v) => {
      if (v.id === id) {
        const updated = { ...v, [field]: value };
        if (field === 'costo_mensual_bs' || field === 'descuento_bs') {
          const bruto = field === 'costo_mensual_bs' ? Number(value) : v.costo_mensual_bs;
          const desc = field === 'descuento_bs' ? Number(value) : v.descuento_bs;
          updated.costo_neto_bs = Math.max(0, bruto - desc);
        }
        return updated;
      }
      return v;
    }));
  };

  const handleDeleteVallaRow = (id: string) => {
    setVallasLista(vallasLista.filter(v => v.id !== id));
  };

  // Lona Item Handlers
  const handleAddLonaRow = () => {
    const newRow: ContractLonaItem = {
      id: 'LONA-' + Date.now(),
      direccion: 'Ubicación de Impresión de Lona',
      medidas: '10x4',
      costo_unitario_bs: 2920,
      descuento_lona_bs: 30,
      total_costo_bs: 2890
    };
    setLonasLista([...lonasLista, newRow]);
  };

  const handleUpdateLonaRow = (id: string, field: keyof ContractLonaItem, value: any) => {
    setLonasLista(lonasLista.map((l) => {
      if (l.id === id) {
        const updated = { ...l, [field]: value };
        if (field === 'costo_unitario_bs' || field === 'descuento_lona_bs') {
          const bruto = field === 'costo_unitario_bs' ? Number(value) : l.costo_unitario_bs;
          const desc = field === 'descuento_lona_bs' ? Number(value) : l.descuento_lona_bs;
          updated.total_costo_bs = Math.max(0, bruto - desc);
        }
        return updated;
      }
      return l;
    }));
  };

  const handleDeleteLonaRow = (id: string) => {
    setLonasLista(lonasLista.filter(l => l.id !== id));
  };

  // Build complete Contract object
  const buildContractObject = (): Contract => {
    const year = new Date().getFullYear();
    const contractNum = initialContract ? initialContract.numero : `000${Math.floor(Math.random() * 900 + 100)} PUBLI-X/${year}`;

    return {
      id: initialContract ? initialContract.id : 'CON-' + Date.now(),
      numero: contractNum,
      cotizacion_id: quotation ? quotation.id : undefined,

      cliente_id: selectedClientId || 'C001',
      cliente_nombre: clienteNombre,
      cliente_empresa: clienteEmpresa,
      cliente_nit_ci: clienteNitCi,
      cliente_representante: clienteRepresentante,
      cliente_representante_ci: clienteRepresentanteCi,
      cliente_escritura_poder: clienteEscrituraPoder,
      cliente_poder_fecha: clientePoderFecha,
      cliente_notaria_numero: clienteNotariaNumero,
      cliente_notario_nombre: clienteNotarioNombre,
      cliente_celular: clienteCelular,
      cliente_correo: clienteCorreo,
      cliente_direccion: clienteDireccion,
      cliente_ciudad: clienteCiudad,

      arrendador_empresa: arrendadorEmpresa,
      arrendador_nit: arrendadorNit,
      arrendador_direccion: arrendadorDireccion,
      arrendador_representante: arrendadorRepresentante,
      arrendador_ci: arrendadorCi,

      valla_nombre: vallasLista.length > 0 ? vallasLista[0].direccion : 'Estructuras Varias',
      valla_medidas: lonasLista.length > 0 ? lonasLista[0].medidas : 'Variadas',
      valla_ubicacion: clienteCiudad,
      valla_tipo: 'Valla Publicitaria Unipolar',
      valla_cara: 'Cara A',

      vallas_lista: vallasLista,
      lonas_lista: lonasLista,

      items: [],
      lona_detail: {
        incluye_lona: lonasLista.length > 0,
        especificacion: 'Impresión de lonas 13oz full color 720 dpi',
        medidas_m2: 60,
        costo_m2_usd: 10,
        costo_total_lona: Math.round(totalLonasBs / tc),
        descuento_lona_usd: 0,
        subtotal_lona_neto: Math.round(totalLonasBs / tc)
      },
      beneficios_extras: beneficiosExtras,

      subtotal_alquiler_usd: Math.round((totalVallasBs * periodoMeses) / tc),
      descuento_cliente_usd: 0,
      descuento_cliente_porcentaje: 0,
      total_neto_usd: grandTotalContratoUsd,
      total_neto_bob: grandTotalContratoBs,
      tipo_cambio: tc,

      fecha_emision: new Date().toISOString().split('T')[0],
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      periodo_meses: periodoMeses,
      forma_pago: formaPago,
      clausulas_especiales: clausulasEspeciales,

      estado: contractStatus,
      diseno_plantilla: disenoPlantilla,
      vendedor_nombre: currentUserNombre || 'Asesor Comercial V&L'
    };
  };

  const handleSave = () => {
    const contract = buildContractObject();
    onSaveContract(contract);
    setSavedContract(contract);
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4000);
  };

  const generateContractShareText = () => {
    const c = savedContract || buildContractObject();
    return `*CONTRATO DE ARRENDAMIENTO DE ESPACIOS PUBLICITARIOS* 📢\n*${c.arrendador_empresa || 'PUBLI-X BOLIVIA'}*\n\n📄 *Contrato N°:* ${c.numero}\n👤 *Cliente:* ${c.cliente_nombre}\n🆔 *NIT/CI:* ${c.cliente_nit_ci}\n📍 *Espacios Vallas (${c.vallas_lista.length}):*\n` +
      c.vallas_lista.map(v => ` • ${v.direccion} - Bs. ${v.costo_neto_bs.toLocaleString('es-BO')}/mes`).join('\n') +
      `\n\n🖼️ *Impresión Lonas (${c.lonas_lista.length}):*\n` +
      c.lonas_lista.map(l => ` • ${l.direccion} (${l.medidas}) - Bs. ${l.total_costo_bs.toLocaleString('es-BO')}`).join('\n') +
      `\n\n💰 *Canon Mensual Vallas:* Bs. ${c.vallas_lista.reduce((a,b)=>a+b.costo_neto_bs,0).toLocaleString('es-BO')} BOB\n💵 *Total Impresión Lonas:* Bs. ${c.lonas_lista.reduce((a,b)=>a+b.total_costo_bs,0).toLocaleString('es-BO')} BOB\n📅 *Vigencia:* ${c.periodo_meses} Meses (${c.fecha_inicio} al ${c.fecha_fin})\n\nQuedamos a su disposición.`;
  };

  const handleSendWhatsApp = () => {
    const c = savedContract || buildContractObject();
    const text = encodeURIComponent(generateContractShareText());
    const phone = c.cliente_celular.replace(/[^\d]/g, '');
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handleSendEmail = () => {
    const c = savedContract || buildContractObject();
    const email = c.cliente_correo || '';
    const subject = encodeURIComponent(`Contrato ${c.numero} - PUBLI-X BOLIVIA`);
    const body = encodeURIComponent(generateContractShareText());
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  const handlePrintContract = () => {
    window.print();
  };

  return (
    <div className="fixed inset-y-0 inset-x-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl my-auto overflow-hidden flex flex-col max-h-[95vh] font-sans text-slate-800">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0 no-print">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shadow-sm shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base md:text-lg font-bold font-display uppercase tracking-wide leading-tight flex flex-wrap items-center gap-2">
                Emisión de Contrato Comercial PUBLI-X BOLIVIA
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/40">
                  {initialContract ? 'EDICIÓN' : 'AUTOMÁTICO'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 hidden sm:block">
                Edite variables resaltadas en rojo, administre vallas y lonas, y alterne entre plantillas de diseño
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Toast Banner */}
        <AnimatePresence>
          {showSuccessToast && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-emerald-600 text-white px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs font-bold shrink-0 no-print"
            >
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                <span>¡El contrato ha sido emitido y guardado con éxito!</span>
              </div>
              <div className="flex items-center space-x-3">
                <button onClick={handleSendWhatsApp} className="underline font-extrabold hover:text-emerald-100">WhatsApp</button>
                <button onClick={handleSendEmail} className="underline font-extrabold hover:text-emerald-100">Correo</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wizard Step Indicator Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0 no-print">
          <div className="flex items-center space-x-1 sm:space-x-4 overflow-x-auto">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center space-x-2 text-xs font-bold px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                step === 1 ? 'bg-slate-900 text-amber-400 shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                step === 1 ? 'bg-amber-400 text-slate-950' : 'bg-slate-300 text-slate-700'
              }`}>1</span>
              <span>Datos & Variables Red</span>
            </button>

            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />

            <button
              onClick={() => setStep(2)}
              className={`flex items-center space-x-2 text-xs font-bold px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                step === 2 ? 'bg-slate-900 text-amber-400 shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                step === 2 ? 'bg-amber-400 text-slate-950' : 'bg-slate-300 text-slate-700'
              }`}>2</span>
              <span>Tablas Vallas & Lonas</span>
            </button>

            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />

            <button
              onClick={() => setStep(3)}
              className={`flex items-center space-x-2 text-xs font-bold px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                step === 3 ? 'bg-slate-900 text-amber-400 shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                step === 3 ? 'bg-amber-400 text-slate-950' : 'bg-slate-300 text-slate-700'
              }`}>3</span>
              <span>Vista Previa & Diseño PDF</span>
            </button>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Total Neto General</span>
            <span className="text-sm font-black text-amber-600 font-mono">
              Bs. {grandTotalContratoBs.toLocaleString('es-BO')} (${grandTotalContratoUsd.toLocaleString()} USD)
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* STEP 1: VARIABLES LEGALES Y DATOS EN ROJO */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start space-x-3">
                <Info className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-950 leading-relaxed">
                  <span className="font-extrabold uppercase">Campos del Contrato Base (Marcados en Rojo):</span> En este paso puede editar las variables del contrato privado legal (Razón social, NIT, Representante Legal, C.I., Poder Notarial, etc.). Estos datos se imprimirán resaltados según la cláusula legal de su documento base.
                </div>
              </div>

              {/* Selector para cambiar de cliente desde la base de datos */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <label className="block text-xs font-extrabold uppercase text-slate-700 tracking-wider">
                  Cargar Datos Desde Cliente Guardado:
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedClientId(id);
                    const c = clients.find(cl => cl.id === id);
                    if (c) {
                      setClienteNombre(c.empresa ? `${c.nombre} – ${c.empresa}` : c.nombre);
                      setClienteEmpresa(c.empresa || '');
                      setClienteCelular(c.celular);
                      setClienteCorreo(c.correo || '');
                      setClienteCiudad(c.ciudad || 'Santa Cruz');
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Seleccionar de la lista de Clientes CRM --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.empresa ? `(${c.empresa})` : ''} - Cel: {c.celular}
                    </option>
                  ))}
                </select>
              </div>

              {/* Datos Contratante (Arrendatario) */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-rose-700 uppercase tracking-wider flex items-center space-x-2 border-b border-rose-200 pb-2">
                  <User className="w-4 h-4 text-rose-600" />
                  <span>1.1 Datos del Contratante / Arrendatario (Letras Rojas)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Razón Social / Institución *</label>
                    <input
                      type="text"
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-rose-300 bg-rose-50/30 text-xs font-bold text-rose-950 focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">N° de Identificación Tributaria NIT *</label>
                    <input
                      type="text"
                      value={clienteNitCi}
                      onChange={(e) => setClienteNitCi(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-rose-300 bg-rose-50/30 text-xs font-bold text-rose-950 focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Representante Legal *</label>
                    <input
                      type="text"
                      value={clienteRepresentante}
                      onChange={(e) => setClienteRepresentante(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-rose-300 bg-rose-50/30 text-xs font-bold text-rose-950 focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cédula de Identidad Representante *</label>
                    <input
                      type="text"
                      value={clienteRepresentanteCi}
                      onChange={(e) => setClienteRepresentanteCi(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-rose-300 bg-rose-50/30 text-xs font-bold text-rose-950 focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Escritura Pública de Poder Nº *</label>
                    <input
                      type="text"
                      value={clienteEscrituraPoder}
                      onChange={(e) => setClienteEscrituraPoder(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Poder *</label>
                    <input
                      type="text"
                      value={clientePoderFecha}
                      onChange={(e) => setClientePoderFecha(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Notaría de Fe Pública Nº</label>
                    <input
                      type="text"
                      value={clienteNotariaNumero}
                      onChange={(e) => setClienteNotariaNumero(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de Notario(a)</label>
                    <input
                      type="text"
                      value={clienteNotarioNombre}
                      onChange={(e) => setClienteNotarioNombre(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Domicilio Legal / Dirección *</label>
                    <input
                      type="text"
                      value={clienteDireccion}
                      onChange={(e) => setClienteDireccion(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ciudad de Firma *</label>
                    <input
                      type="text"
                      value={clienteCiudad}
                      onChange={(e) => setClienteCiudad(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Datos Arrendador (Vallasdondevayas) */}
              <div className="space-y-4 border-t border-slate-200 pt-5">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-200 pb-2">
                  <Building2 className="w-4 h-4 text-amber-500" />
                  <span>1.2 Datos del Arrendador (Empresa Proveedora)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Comercial / Empresa</label>
                    <input
                      type="text"
                      value={arrendadorEmpresa}
                      onChange={(e) => setArrendadorEmpresa(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">NIT Arrendador</label>
                    <input
                      type="text"
                      value={arrendadorNit}
                      onChange={(e) => setArrendadorNit(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Representante Arrendador</label>
                    <input
                      type="text"
                      value={arrendadorRepresentante}
                      onChange={(e) => setArrendadorRepresentante(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">C.I. Representante Arrendador</label>
                    <input
                      type="text"
                      value={arrendadorCi}
                      onChange={(e) => setArrendadorCi(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Fechas y Vigencia */}
              <div className="border-t border-slate-200 pt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Período del Contrato (Meses)</label>
                  <input
                    type="number"
                    min="1"
                    max="36"
                    value={periodoMeses}
                    onChange={(e) => setPeriodoMeses(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Inicio *</label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Conclusión</label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-md"
                >
                  <Eye className="w-4 h-4 text-indigo-200" />
                  <span>👁️ Previsualizar Contrato (Paso 3)</span>
                </button>

                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-slate-900 text-amber-400 font-extrabold text-xs rounded-xl hover:bg-slate-800 transition flex items-center space-x-2 cursor-pointer shadow-md ml-auto"
                >
                  <span>Siguiente: Tablas Vallas & Lonas</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          )}

          {/* STEP 2: ADMINISTRADOR DE TABLA CON VALLAS Y LONAS */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              
              {/* TABLA 1: ESPACIOS PUBLICITARIOS (VALLAS) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-amber-500" />
                      <span>Tabla 1: Espacios Publicitarios (Vallas)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Costo mensual por cada valla contratada. Aplique descuentos individuales si aplica.
                    </p>
                  </div>

                  <button
                    onClick={handleAddVallaRow}
                    className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400 transition flex items-center space-x-1 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Espacio Valla</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-2.5">Ciudad</th>
                        <th className="p-2.5">Formato</th>
                        <th className="p-2.5 min-w-[220px]">Dirección / Ubicación</th>
                        <th className="p-2.5 text-right">Precio Lista (Bs)</th>
                        <th className="p-2.5 text-right">Desc. (Bs)</th>
                        <th className="p-2.5 text-right">Costo Neto (Bs)</th>
                        <th className="p-2.5 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                      {vallasLista.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50">
                          <td className="p-2">
                            <input
                              type="text"
                              value={v.ciudad}
                              onChange={(e) => handleUpdateVallaRow(v.id, 'ciudad', e.target.value)}
                              className="w-24 px-2 py-1 rounded border border-slate-200 text-xs font-bold"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={v.formato}
                              onChange={(e) => handleUpdateVallaRow(v.id, 'formato', e.target.value)}
                              className="w-28 px-2 py-1 rounded border border-slate-200 text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={v.direccion}
                              onChange={(e) => handleUpdateVallaRow(v.id, 'direccion', e.target.value)}
                              className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-bold text-slate-900"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              value={v.costo_mensual_bs}
                              onChange={(e) => handleUpdateVallaRow(v.id, 'costo_mensual_bs', parseFloat(e.target.value) || 0)}
                              className="w-24 text-right px-2 py-1 rounded border border-slate-200 text-xs font-mono"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              value={v.descuento_bs}
                              onChange={(e) => handleUpdateVallaRow(v.id, 'descuento_bs', parseFloat(e.target.value) || 0)}
                              className="w-20 text-right px-2 py-1 rounded border border-slate-200 text-xs font-mono text-emerald-600"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-amber-700">
                            Bs. {v.costo_neto_bs.toLocaleString('es-BO')}
                          </td>
                          <td className="p-2 text-center">
                            {vallasLista.length > 1 && (
                              <button
                                onClick={() => handleDeleteVallaRow(v.id)}
                                className="p-1 rounded bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-extrabold text-slate-900 text-xs">
                      <tr>
                        <td colSpan={5} className="p-3 uppercase">SUMA TOTAL MENSUAL CANON VALLAS:</td>
                        <td className="p-3 text-right font-mono text-amber-700 text-sm">
                          Bs. {totalVallasBs.toLocaleString('es-BO')}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* TABLA 2: IMPRESIÓN Y MONTAJE DE LONAS */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-emerald-600" />
                      <span>Tabla 2: Impresión e Instalación de Lonas</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Detalle de medidas e impresión full color 720 DPI para cada estructura.
                    </p>
                  </div>

                  <button
                    onClick={handleAddLonaRow}
                    className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-500 transition flex items-center space-x-1 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Lona</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-2.5 min-w-[220px]">Impresión de Lonas (Dirección)</th>
                        <th className="p-2.5">Medidas</th>
                        <th className="p-2.5 text-right">Costo Unit. (Bs)</th>
                        <th className="p-2.5 text-right">Desc. Lona (Bs)</th>
                        <th className="p-2.5 text-right">Total Costo Lona (Bs)</th>
                        <th className="p-2.5 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                      {lonasLista.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50">
                          <td className="p-2">
                            <input
                              type="text"
                              value={l.direccion}
                              onChange={(e) => handleUpdateLonaRow(l.id, 'direccion', e.target.value)}
                              className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-bold text-slate-900"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={l.medidas}
                              onChange={(e) => handleUpdateLonaRow(l.id, 'medidas', e.target.value)}
                              className="w-24 px-2 py-1 rounded border border-slate-200 text-xs font-mono uppercase"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              value={l.costo_unitario_bs}
                              onChange={(e) => handleUpdateLonaRow(l.id, 'costo_unitario_bs', parseFloat(e.target.value) || 0)}
                              className="w-24 text-right px-2 py-1 rounded border border-slate-200 text-xs font-mono"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              value={l.descuento_lona_bs}
                              onChange={(e) => handleUpdateLonaRow(l.id, 'descuento_lona_bs', parseFloat(e.target.value) || 0)}
                              className="w-20 text-right px-2 py-1 rounded border border-slate-200 text-xs font-mono text-emerald-600"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">
                            Bs. {l.total_costo_bs.toLocaleString('es-BO')}
                          </td>
                          <td className="p-2 text-center">
                            {lonasLista.length > 1 && (
                              <button
                                onClick={() => handleDeleteLonaRow(l.id)}
                                className="p-1 rounded bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-extrabold text-slate-900 text-xs">
                      <tr>
                        <td colSpan={4} className="p-3 uppercase">SUMA TOTAL IMPRESIÓN Y MONTAJE LONAS:</td>
                        <td className="p-3 text-right font-mono text-slate-900 text-sm">
                          Bs. {totalLonasBs.toLocaleString('es-BO')}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* FORMA DE PAGO Y CONDICIONES */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <label className="block text-xs font-extrabold uppercase text-slate-700">Forma de Pago y Cláusulas Especiales</label>
                <textarea
                  rows={2}
                  value={formaPago}
                  onChange={(e) => setFormaPago(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
                  placeholder="Detalle los plazos de pago y forma de cancelación..."
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center space-x-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Atrás</span>
                </button>

                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 bg-slate-900 text-amber-400 font-extrabold text-xs rounded-xl hover:bg-slate-800 transition flex items-center space-x-2 cursor-pointer shadow-md"
                >
                  <span>Ver Documento Final PDF</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          )}

              {/* STEP 3: VISTA PREVIA DEL DOCUMENTO Y SELECCIÓN DE DISEÑO */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              
              {/* Revision Banner before saving */}
              <div className="bg-indigo-900 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 no-print shadow-md border border-indigo-700">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/30 flex items-center justify-center text-indigo-200 border border-indigo-400/30 shrink-0">
                    <Eye className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-indigo-200 tracking-wider">Modo Previsualización & Revisión Previa al Guardado:</h4>
                    <p className="text-[11px] text-indigo-100 leading-snug">
                      Examine el documento legal generado. Puede modificar datos o tablas volviendo a los pasos anteriores antes de confirmar y guardar.
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setStep(1)}
                    className="px-3 py-1.5 bg-indigo-800 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl border border-indigo-600 transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Modificar Datos</span>
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="px-3 py-1.5 bg-indigo-800 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl border border-indigo-600 transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>Modificar Tablas</span>
                  </button>
                </div>
              </div>

              {/* Plantilla Selector Banner */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 no-print shadow-md border border-slate-800">
                <div className="flex items-center space-x-3">
                  <Palette className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">Estilo de Plantilla de Diseño:</h4>
                    <p className="text-[11px] text-slate-300">Seleccione la presentación deseada para este documento</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 overflow-x-auto">
                  <button
                    onClick={() => setDisenoPlantilla('OFICIAL_VALLAS')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
                      disenoPlantilla === 'OFICIAL_VALLAS'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Oficial Legal VALLAS</span>
                  </button>

                  <button
                    onClick={() => setDisenoPlantilla('MODERNO_EJECUTIVO')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
                      disenoPlantilla === 'MODERNO_EJECUTIVO'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ejecutivo Corporativo</span>
                  </button>

                  <button
                    onClick={() => setDisenoPlantilla('COMERCIAL_AGIL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
                      disenoPlantilla === 'COMERCIAL_AGIL'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Comercial Ágil 1-Página</span>
                  </button>
                </div>
              </div>

              {/* DOCUMENT RENDERING CANVAS */}
              <div id="printable-contract-area" className="bg-white text-slate-900 border border-slate-300 shadow-xl rounded-2xl p-6 sm:p-10 font-serif text-xs sm:text-sm leading-relaxed max-w-4xl mx-auto space-y-6">
                
                {/* 1. PLANTILLA OFICIAL LEGAL (PDF Exact Replica) */}
                {disenoPlantilla === 'OFICIAL_VALLAS' && (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-slate-300 pb-4 font-sans">
                      <div>
                        <h1 className="text-sm font-black tracking-wider uppercase text-slate-900">
                          CONTRATO DE ARRENDAMIENTO DE ESPACIOS PUBLICITARIOS {savedContract?.numero || `00025 PUBLI-X/${new Date().getFullYear()}`}
                        </h1>
                        <p className="text-[11px] text-slate-600 mt-1 font-serif">
                          Conste por el presente Contrato Privado, el mismo que podrá ser elevado a instrumento público con el reconocimiento de firmas y rúbricas ante autoridad competente al tenor literal de las siguientes cláusulas:
                        </p>
                      </div>
                      <div className="text-right text-[10px] text-slate-500 font-mono shrink-0 pl-2">
                        Página 1 de 3
                      </div>
                    </div>

                    {/* CLAUSULA PRIMERA */}
                    <div>
                      <h2 className="font-extrabold uppercase font-sans text-xs text-slate-900 mb-1">
                        PRIMERA.- PERSONALIDAD JURIDICA DE PARTES.-
                      </h2>
                      <p className="mb-2">Concurren a la suscripción del presente contrato:</p>
                      
                      <p className="mb-2">
                        <strong>1.1 <span className="text-rose-700 font-bold">{clienteNombre.toUpperCase()}</span></strong> legalmente constituida bajo las leyes del Estado Plurinacional con número de identificación tributaria <strong>NIT <span className="text-rose-700">{clienteNitCi}</span></strong>, con domicilio legal en la ciudad de {clienteCiudad} en la {clienteDireccion}, representada legalmente por <strong><span className="text-rose-700">{clienteRepresentante}</span></strong> con cédula de identidad No. <strong><span className="text-rose-700">{clienteRepresentanteCi}</span></strong>, en calidad de apoderada que ejerce dichas funciones en virtud de la escritura pública de poder <strong>Nº {clienteEscrituraPoder}</strong> de fecha {clientePoderFecha}, poder otorgado por ante la Notaría de Fe Pública {clienteNotariaNumero} del Distrito Judicial de {clienteCiudad} a cargo de {clienteNotarioNombre} quien en adelante se denominará como <strong>"CONTRATANTE"</strong> o el <strong>"ARRENDATARIO"</strong>.
                      </p>

                      <p>
                        <strong>1.2 {arrendadorEmpresa}</strong> con domicilio legal en {arrendadorDireccion} de la ciudad de Santa Cruz con NIT {arrendadorNit}, representada legalmente por el {arrendadorRepresentante} con cédula de identidad No. {arrendadorCi}, en calidad de Gerente General quien para los fines legales de este documento se denominará en lo sucesivo simplemente <strong>"{arrendadorEmpresa}"</strong> o el <strong>"ARRENDADOR"</strong>.
                      </p>
                    </div>

                    {/* CLAUSULA SEGUNDA */}
                    <div>
                      <h2 className="font-extrabold uppercase font-sans text-xs text-slate-900 mb-1">
                        SEGUNDA.- OBJETO Y NATURALEZA.-
                      </h2>
                      <p className="mb-3">
                        El ARRENDADOR otorga al ARRENDATARIO en calidad de arrendamiento {vallasLista.length} Vallas Publicitarias, según el siguiente detalle:
                      </p>

                      {/* Tabla 1: Vallas */}
                      <table className="w-full border-collapse border border-slate-900 text-xs font-sans mb-4">
                        <thead className="bg-slate-100 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="border border-slate-900 p-2">Ciudad</th>
                            <th className="border border-slate-900 p-2">Formato</th>
                            <th className="border border-slate-900 p-2">Dirección</th>
                            <th className="border border-slate-900 p-2 text-right">Costo Mensual en Bs.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vallasLista.map((v) => (
                            <tr key={v.id}>
                              <td className="border border-slate-900 p-2">{v.ciudad}</td>
                              <td className="border border-slate-900 p-2">{v.formato}</td>
                              <td className="border border-slate-900 p-2 font-bold">{v.direccion}</td>
                              <td className="border border-slate-900 p-2 text-right font-mono">{v.costo_neto_bs.toLocaleString('es-BO')},00</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="font-bold bg-slate-50">
                            <td colSpan={3} className="border border-slate-900 p-2 text-right uppercase">SUMA TOTAL:</td>
                            <td className="border border-slate-900 p-2 text-right font-mono">{totalVallasBs.toLocaleString('es-BO')},00</td>
                          </tr>
                        </tfoot>
                      </table>

                      <p className="mb-3">
                        Por otro lado, se acuerda la impresión de {lonasLista.length} lonas para los espacios publicitarios, según el siguiente detalle:
                      </p>

                      {/* Tabla 2: Lonas */}
                      <table className="w-full border-collapse border border-slate-900 text-xs font-sans">
                        <thead className="bg-slate-100 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="border border-slate-900 p-2">Impresión de Lonas (Dirección)</th>
                            <th className="border border-slate-900 p-2">Medidas</th>
                            <th className="border border-slate-900 p-2 text-right">Costo Unitario Bs.</th>
                            <th className="border border-slate-900 p-2 text-right">Total Costo Impresión Bs.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lonasLista.map((l) => (
                            <tr key={l.id}>
                              <td className="border border-slate-900 p-2 font-bold">{l.direccion}</td>
                              <td className="border border-slate-900 p-2 uppercase">{l.medidas}</td>
                              <td className="border border-slate-900 p-2 text-right font-mono">{l.costo_unitario_bs.toLocaleString('es-BO')},00</td>
                              <td className="border border-slate-900 p-2 text-right font-mono">{l.total_costo_bs.toLocaleString('es-BO')},00</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="font-bold bg-slate-50">
                            <td colSpan={3} className="border border-slate-900 p-2 text-right uppercase">SUMA TOTAL:</td>
                            <td className="border border-slate-900 p-2 text-right font-mono">{totalLonasBs.toLocaleString('es-BO')},00</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* CLAUSULA TERCERA */}
                    <div>
                      <h2 className="font-extrabold uppercase font-sans text-xs text-slate-900 mb-1">
                        TERCERA.- VIGENCIA DEL CONTRATO.-
                      </h2>
                      <p>
                        El presente contrato tendrá una vigencia de {periodoMeses} meses, que comenzarán a computarse a partir del {fechaInicio} al {fechaFin}.
                      </p>
                    </div>

                    {/* CLAUSULA CUARTA */}
                    <div>
                      <h2 className="font-extrabold uppercase font-sans text-xs text-slate-900 mb-1">
                        CUARTA.- CANON DE ARRENDAMIENTO, PRECIO Y FORMA DE PAGO.-
                      </h2>
                      <p className="mb-2">
                        El Canon mensual por el arrendamiento de ({vallasLista.length}) espacios publicitarios descritos en la cláusula segunda, es de <strong className="text-rose-700">Bs. {totalVallasBs.toLocaleString('es-BO')},00</strong> los cuales serán cancelados previa emisión de factura.
                      </p>
                      <p className="mb-2">
                        El ARRENDATARIO también se obliga a cancelar el monto de <strong className="text-rose-700">Bs. {totalLonasBs.toLocaleString('es-BO')},00</strong> por la impresión e instalación de ({lonasLista.length}) lonas de 13 onz full color con resolución de 720 dpi.
                      </p>
                      <p className="mb-2">
                        El monto del arrendamiento incluye los impuestos de ley, patentes, dos luminarias y todos los gastos que demandan lo descrito en la cláusula anterior, como ser pago de arrendamiento del terreno, licencias publicitarias y consumo de energía eléctrica.
                      </p>
                      <p>
                        <strong>FORMA DE PAGO:</strong> {formaPago}
                      </p>
                    </div>

                    {/* CLAUSULA QUINTA */}
                    <div>
                      <h2 className="font-extrabold uppercase font-sans text-xs text-slate-900 mb-1">
                        QUINTA.- RENOVACION - CAMBIO DE UBICACIÓN – RESCISION.-
                      </h2>
                      <p>
                        El ARRENDATARIO deberá solicitar al ARRENDADOR con un (1) mes de anticipación para la renovación, cambio de ubicación y/o rescisión de espacio antes de concluido el presente contrato, sin derecho a reclamo o reconocimiento de daños y perjuicios.
                      </p>
                    </div>

                    {/* CLAUSULA SEXTA */}
                    <div>
                      <h2 className="font-extrabold uppercase font-sans text-xs text-slate-900 mb-1">
                        SEXTA.- DE LAS OBLIGACIONES DE LAS PARTES.-
                      </h2>
                      <p className="font-bold mb-1">EL ARRENDADOR:</p>
                      <ul className="list-disc pl-5 space-y-1 mb-2">
                        <li>Realizar el respectivo mantenimiento del espacio publicitario.</li>
                        <li>Cubrir los costos de pagos de impuestos, patentes etc.</li>
                        <li>Mantener la estructura iluminada.</li>
                        <li>En caso de que la valla por inclemencias del tiempo sufriera algún desperfecto; inclinación de la misma, caída por fuertes vientos el ARRENDADOR se responsabiliza por el arreglo de la valla dañada en su totalidad.</li>
                        <li>Por seguridad, se prohíbe la colocación de troqueles que excedan en 10% de la superficie de la valla.</li>
                      </ul>
                      <p className="font-bold mb-1">EL ARRENDATARIO:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Pagar el servicio de forma puntual y de acuerdo al plazo establecido en la cláusula cuarta del presente contrato.</li>
                        <li>Proporcionar la ayuda y/o cooperación necesaria para el cumplimiento del contrato.</li>
                      </ul>
                    </div>

                    {/* CLAUSULA SEPTIMA A DECIMO PRIMERA */}
                    <div>
                      <h2 className="font-extrabold uppercase font-sans text-xs text-slate-900 mb-1">
                        DECIMO PRIMERA.- CONFORMIDAD Y FIRMAS.-
                      </h2>
                      <p className="mb-6">
                        Las partes contratantes de las generales señaladas en la cláusula primera manifiestan su conformidad con lo estipulado precedentemente, en señal de aceptación y obligándose a su fiel y estricto cumplimiento, así firman el presente contrato en triple ejemplar.
                      </p>

                      <div className="text-center font-bold mb-12">
                        {clienteCiudad}, {new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>

                      {/* Firmas */}
                      <div className="grid grid-cols-2 gap-8 text-center font-sans text-xs pt-8 border-t border-slate-300">
                        <div>
                          <div className="h-16 border-b border-slate-400 mb-2"></div>
                          <p className="font-bold text-rose-700">{clienteRepresentante}</p>
                          <p className="text-[11px] text-slate-600">CI. {clienteRepresentanteCi}</p>
                          <p className="font-extrabold text-slate-900 uppercase mt-1">ARRENDATARIO</p>
                        </div>

                        <div>
                          <div className="h-16 border-b border-slate-400 mb-2"></div>
                          <p className="font-bold text-slate-900">{arrendadorRepresentante}</p>
                          <p className="text-[11px] text-slate-600">CI. {arrendadorCi}</p>
                          <p className="font-extrabold text-slate-900 uppercase mt-1">ARRENDADOR</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. PLANTILLA MODERNO EJECUTIVO */}
                {disenoPlantilla === 'MODERNO_EJECUTIVO' && (
                  <div className="space-y-6 font-sans">
                    <div className="bg-slate-900 text-white p-6 rounded-xl flex justify-between items-center gap-4">
                      <div className="flex items-center space-x-3">
                        <Logo size="sm" logoUrl={settings.logo} />
                        <div>
                          <div className="text-amber-400 font-black text-lg tracking-wider">{settings.nombre_empresa}</div>
                          <h1 className="text-sm font-bold text-slate-200 uppercase mt-1">
                            CONTRATO DE ALQUILER PUBLICITARIO N° {savedContract?.numero || 'CON-2026-0091'}
                          </h1>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs rounded-full uppercase">
                          DOCUMENTO VIGENTE
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h3 className="font-black text-slate-900 uppercase mb-2 text-[11px]">CLIENTE / ANUNCIANTE:</h3>
                        <p className="font-bold text-slate-900 text-sm">{clienteNombre}</p>
                        <p className="text-slate-600">NIT/CI: {clienteNitCi}</p>
                        <p className="text-slate-600">Representante: {clienteRepresentante}</p>
                        <p className="text-slate-600">Sede: {clienteCiudad}</p>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h3 className="font-black text-slate-900 uppercase mb-2 text-[11px]">CONDICIONES COMERCIALES:</h3>
                        <p className="font-bold text-amber-700 text-sm">{periodoMeses} MESES DE VIGENCIA</p>
                        <p className="text-slate-600">Inicio: {fechaInicio} - Fin: {fechaFin}</p>
                        <p className="text-slate-600">Moneda: BOB (Bs) / USD</p>
                        <p className="text-slate-600">Emisión: {new Date().toISOString().split('T')[0]}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-black text-slate-900 uppercase text-xs mb-2">1. RESUMEN DE ESPACIOS PUBLICITARIOS CONTRATADOS:</h3>
                      <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                        <thead className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                          <tr>
                            <th className="p-2.5">Ubicación Estructura</th>
                            <th className="p-2.5">Formato</th>
                            <th className="p-2.5 text-right">Canon Mensual Bs.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold">
                          {vallasLista.map(v => (
                            <tr key={v.id}>
                              <td className="p-2.5 font-bold text-slate-900">{v.direccion}</td>
                              <td className="p-2.5">{v.formato}</td>
                              <td className="p-2.5 text-right font-mono font-bold text-amber-700">Bs. {v.costo_neto_bs.toLocaleString('es-BO')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <h3 className="font-black text-slate-900 uppercase text-xs mb-2">2. MONTAJE E IMPRESIÓN DE LONAS INCLUIDAS:</h3>
                      <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                        <thead className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                          <tr>
                            <th className="p-2.5">Dirección Lona</th>
                            <th className="p-2.5">Medida</th>
                            <th className="p-2.5 text-right">Costo Total Bs.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold">
                          {lonasLista.map(l => (
                            <tr key={l.id}>
                              <td className="p-2.5 font-bold text-slate-900">{l.direccion}</td>
                              <td className="p-2.5 font-mono">{l.medidas}</td>
                              <td className="p-2.5 text-right font-mono font-bold">Bs. {l.total_costo_bs.toLocaleString('es-BO')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">TOTAL MONTO NETO DEL CONTRATO</span>
                        <span className="text-[11px] text-slate-500">Incluye Canon Vallas por {periodoMeses} meses + Lonas e Impuestos</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-base font-black text-slate-900 block">Bs. {grandTotalContratoBs.toLocaleString('es-BO')} BOB</span>
                        <span className="text-xs text-amber-700 font-bold">(${grandTotalContratoUsd.toLocaleString()} USD)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. PLANTILLA COMERCIAL AGIL */}
                {disenoPlantilla === 'COMERCIAL_AGIL' && (
                  <div className="space-y-4 font-sans text-xs">
                    <div className="border-b-2 border-amber-500 pb-3 flex justify-between items-center">
                      <div className="font-extrabold text-base text-slate-900 uppercase">ACUERDO COMERCIAL RÁPIDO DE ESPACIO PUBLICITARIO</div>
                      <div className="font-mono text-xs text-slate-500">N° {savedContract?.numero || 'CON-AGIL-2026'}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div><strong className="text-slate-900">Cliente:</strong> {clienteNombre} ({clienteNitCi})</div>
                      <div><strong className="text-slate-900">Período:</strong> {periodoMeses} Meses ({fechaInicio} al {fechaFin})</div>
                    </div>

                    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2">
                      <div className="font-bold text-slate-800 uppercase">Resumen de Vallas y Lonas:</div>
                      {vallasLista.map((v, i) => (
                        <div key={v.id} className="flex justify-between border-b border-slate-200 pb-1">
                          <span>{i+1}. {v.direccion} ({v.formato})</span>
                          <span className="font-mono font-bold">Bs. {v.costo_neto_bs.toLocaleString('es-BO')}/mes</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center bg-slate-900 text-white p-3 rounded-lg font-mono">
                      <span>MONTO TOTAL A CANCELAR:</span>
                      <span className="font-bold text-amber-400 text-sm">Bs. {grandTotalContratoBs.toLocaleString('es-BO')} BOB</span>
                    </div>
                  </div>
                )}

              </div>

              {/* Botones de Acción */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 no-print border-t border-slate-200">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center space-x-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Volver a Tablas</span>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleSendWhatsApp}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={handleSendEmail}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Correo</span>
                  </button>

                  <button
                    onClick={handlePrintContract}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir PDF</span>
                  </button>

                  <button
                    onClick={handleSave}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition flex items-center space-x-2 cursor-pointer shadow-md uppercase tracking-wider"
                  >
                    <Check className="w-4 h-4" />
                    <span>Emitir y Guardar Contrato</span>
                  </button>
                </div>
              </div>

            </motion.div>
          )}

        </div>

      </div>
    </div>
  );
}
