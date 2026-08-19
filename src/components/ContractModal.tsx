import React, { useState, useEffect, useMemo } from 'react';
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
  Edit3,
  Search,
  MapPin,
  Filter,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Format Drive URL to viewable image
function formatDriveUrl(url?: string): string {
  if (!url) return 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600';
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return url;
}

// Helper to parse dimension string (e.g. "12 x 4 m" or "12x4") into m2 area
function parseDimensionsM2(medidasStr?: string): number {
  if (!medidasStr) return 48;
  const match = medidasStr.match(/(\d+(?:[.,]\d+)?)\s*(?:[xX*]|por|m\s*x)\s*(\d+(?:[.,]\d+)?)/);
  if (match) {
    const w = parseFloat(match[1].replace(',', '.'));
    const h = parseFloat(match[2].replace(',', '.'));
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      return Math.round(w * h * 10) / 10;
    }
  }
  return 48;
}

// Calculate suggested lona cost in Bs from dimension and rate
function calculateSuggestedLonaCostBs(medidasStr?: string, costoLonaM2Bs?: number): number {
  const m2 = parseDimensionsM2(medidasStr);
  const costPerM2 = costoLonaM2Bs && costoLonaM2Bs > 0 ? costoLonaM2Bs : 65;
  return Math.round(m2 * costPerM2);
}

// Normalize dimension string for comparison (e.g. "12 x 4 m" vs "12x4")
function normalizeDimension(str?: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/[\s\t\n]+/g, '').replace(/m(ts)?$/i, '').replace(/x/g, 'x').replace(/\.0/g, '');
}

interface ContractModalProps {
  quotation?: Quotation | null;
  initialContract?: Contract | null;
  initialStep?: 1 | 2 | 3;
  clients: Client[];
  vehicles: Vehicle[];
  contracts?: Contract[];
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
  contracts = [],
  settings,
  currentUserNombre,
  onSaveContract,
  onClose
}: ContractModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(initialStep);

  // Template Design Selection
  const [disenoPlantilla, setDisenoPlantilla] = useState<ContractTemplateDesign>('OFICIAL_VALLAS');

  // Billboard Selector Modal State
  const [showVallaSelector, setShowVallaSelector] = useState<boolean>(false);
  const [vallaSearch, setVallaSearch] = useState<string>('');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('TODAS');
  const [onlyAvailableFilter, setOnlyAvailableFilter] = useState<boolean>(true);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

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
      medidas: '15 x 4 m',
      costo_mensual_bs: 13980,
      descuento_bs: 1000,
      costo_neto_bs: 12980
    },
    {
      id: 'VALLA-2',
      ciudad: 'Santa Cruz',
      formato: 'Valla Unipolar',
      direccion: '3er ANILLO INTERNO ENTRE AV. BUSH Y AV. SAN MARTIN',
      medidas: '10 x 4 m',
      costo_mensual_bs: 8800,
      descuento_bs: 880,
      costo_neto_bs: 7920
    },
    {
      id: 'VALLA-3',
      ciudad: 'Santa Cruz',
      formato: 'Valla Unipolar',
      direccion: '2do ANILLO AV. PIRAI DIAGONAL HIPERMAXI',
      medidas: '10 x 4 m',
      costo_mensual_bs: 9800,
      descuento_bs: 1100,
      costo_neto_bs: 8700
    }
  ]);

  // List of Lonas (Table 2 of Contract)
  const [lonasLista, setLonasLista] = useState<ContractLonaItem[]>([
    {
      id: 'LONA-1',
      valla_medidas: '15 x 4 m',
      direccion: 'Impresion de lona Vinilica 13 Oz.con Filtro Uv.e Instalacion - 3er ANILLO INTERNO CANAL COTOCA',
      medidas: '15 x 4 m',
      costo_unitario_bs: 4380,
      descuento_lona_bs: 0,
      total_costo_bs: 4380
    },
    {
      id: 'LONA-2',
      valla_medidas: '10 x 4 m',
      direccion: 'Impresion de lona Vinilica 13 Oz.con Filtro Uv.e Instalacion - 3er ANILLO INTERNO ENTRE AV. BUSH Y AV. SAN MARTIN',
      medidas: '10 x 4 m',
      costo_unitario_bs: 2920,
      descuento_lona_bs: 30,
      total_costo_bs: 2890
    },
    {
      id: 'LONA-3',
      valla_medidas: '10 x 4 m',
      direccion: 'Impresion de lona Vinilica 13 Oz.con Filtro Uv.e Instalacion - 2do ANILLO AV. PIRAI DIAGONAL HIPERMAXI',
      medidas: '10 x 4 m',
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

      if (client) {
        setSelectedClientId(client.id);
        setClienteNombre(client.empresa ? `${client.nombre} – ${client.empresa}` : client.nombre);
        setClienteEmpresa(client.empresa || '');
        setClienteCelular(client.celular);
        setClienteCorreo(client.correo || '');
        setClienteCiudad(client.ciudad || 'Santa Cruz');
        setClienteDireccion(client.direccion || 'Av. Principal, Edificio Corporativo');
        setClienteNitCi(client.nit_ci || '1020304050');
      }

      if (quotation.vallas_seleccionadas && quotation.vallas_seleccionadas.length > 0) {
        const vallas: ContractVallaItem[] = quotation.vallas_seleccionadas.map((v, idx) => {
          const rentBs = Math.round((v.precio_alquiler_usd || 1000) * tc);
          const location = v.valla_avenida || v.valla_nombre || `Valla ${idx + 1}`;
          return {
            id: `VALLA-${idx + 1}-${Date.now()}`,
            valla_id: v.vehiculo_id,
            ciudad: v.valla_ciudad || 'Santa Cruz',
            formato: v.valla_tipo || 'Valla Unipolar',
            direccion: location,
            medidas: v.valla_medidas || '12 x 4 m',
            costo_mensual_bs: rentBs,
            descuento_bs: 0,
            costo_neto_bs: rentBs
          };
        });

        const lonas: ContractLonaItem[] = quotation.vallas_seleccionadas.map((v, idx) => {
          const lonaCostBs = v.costo_lona_usd 
            ? Math.round(v.costo_lona_usd * tc)
            : calculateSuggestedLonaCostBs(v.valla_medidas || '12 x 4 m', v.costo_lona_m2_bs);

          const location = v.valla_avenida || v.valla_nombre || `Valla ${idx + 1}`;

          return {
            id: `LONA-${idx + 1}-${Date.now()}`,
            valla_id: v.vehiculo_id,
            valla_medidas: v.valla_medidas || '12 x 4 m',
            direccion: `Impresion de lona Vinilica 13 Oz.con Filtro Uv.e Instalacion - ${location}`,
            medidas: v.valla_medidas || '12 x 4 m',
            costo_unitario_bs: lonaCostBs,
            descuento_lona_bs: 0,
            total_costo_bs: lonaCostBs
          };
        });

        setVallasLista(vallas);
        setLonasLista(lonas);
      } else {
        const vehicle = vehicles.find(v => v.id === quotation.vehiculo_id);
        if (vehicle) {
          const rentBs = Math.round((quotation.precio_vehiculo || vehicle.precio_usd || 1200) * tc);
          const lonaCostBs = quotation.gastos_importacion
            ? Math.round(quotation.gastos_importacion * tc)
            : calculateSuggestedLonaCostBs(vehicle.medidas, vehicle.costo_lona_m2_bs);

          const locationName = vehicle.avenida_calle 
            ? `${vehicle.tipo_valla || vehicle.tipo || 'Valla'} - ${vehicle.avenida_calle} (${vehicle.codigo || vehicle.modelo || vehicle.id})`
            : `${vehicle.marca} - ${vehicle.modelo}`;

          setVallasLista([
            {
              id: 'VALLA-1',
              valla_id: vehicle.id,
              ciudad: vehicle.ciudad || 'Santa Cruz',
              formato: vehicle.tipo_valla || vehicle.tipo || 'Valla Unipolar',
              direccion: locationName,
              medidas: vehicle.medidas || '12 x 4 m',
              costo_mensual_bs: rentBs,
              descuento_bs: 0,
              costo_neto_bs: rentBs
            }
          ]);

          setLonasLista([
            {
              id: 'LONA-1',
              valla_id: vehicle.id,
              valla_medidas: vehicle.medidas || '12 x 4 m',
              direccion: `Impresion de lona Vinilica 13 Oz.con Filtro Uv.e Instalacion - ${locationName}`,
              medidas: vehicle.medidas || '12 x 4 m',
              costo_unitario_bs: lonaCostBs,
              descuento_lona_bs: 0,
              total_costo_bs: lonaCostBs
            }
          ]);
        }
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

  // Available unique cities from vehicles
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    vehicles.forEach(v => {
      if (v.ciudad) set.add(v.ciudad);
    });
    return Array.from(set).sort();
  }, [vehicles]);

  // Check vehicle availability helper
  const getVehicleAvailabilityStatus = (v: Vehicle) => {
    const isAlreadyInContract = vallasLista.some(vl => vl.valla_id === v.id);
    if (isAlreadyInContract) {
      return { available: false, reason: 'Ya agregada al contrato', isCurrent: true };
    }

    if (v.estado && v.estado !== 'Disponible') {
      return { available: false, reason: `Estado: ${v.estado}`, isCurrent: false };
    }

    if (fechaInicio && fechaFin && contracts && contracts.length > 0) {
      const start = new Date(fechaInicio).getTime();
      const end = new Date(fechaFin).getTime();

      const collidingContract = contracts.find(c => {
        if (c.id === initialContract?.id) return false;
        if (c.estado !== 'Vigente' && c.estado !== 'Pendiente Firma') return false;

        const hasVehicle = 
          c.valla_id === v.id || 
          c.vehiculo_id === v.id || 
          (c.vallas_lista && c.vallas_lista.some(vl => vl.valla_id === v.id));

        if (!hasVehicle) return false;

        const cStart = new Date(c.fecha_inicio).getTime();
        const cEnd = new Date(c.fecha_fin).getTime();

        if (isNaN(cStart) || isNaN(cEnd)) return false;
        return !(end < cStart || start > cEnd);
      });

      if (collidingContract) {
        return { 
          available: false, 
          reason: `Alquilada (${collidingContract.numero || 'Contrato activo'})`, 
          isCurrent: false 
        };
      }
    }

    return { available: true, reason: 'Disponible', isCurrent: false };
  };

  // Filtered vehicles for the Billboard Selector
  const filteredVehiclesForSelector = useMemo(() => {
    return vehicles.filter(v => {
      const status = getVehicleAvailabilityStatus(v);
      if (onlyAvailableFilter && !status.available && !status.isCurrent) {
        return false;
      }

      if (selectedCityFilter !== 'TODAS' && v.ciudad?.toLowerCase() !== selectedCityFilter.toLowerCase()) {
        return false;
      }

      if (vallaSearch.trim()) {
        const query = vallaSearch.toLowerCase();
        const matchCode = (v.codigo || v.id || '').toLowerCase().includes(query);
        const matchName = (v.nombre || v.modelo || '').toLowerCase().includes(query);
        const matchStreet = (v.avenida_calle || '').toLowerCase().includes(query);
        const matchCity = (v.ciudad || '').toLowerCase().includes(query);
        const matchZone = (v.zona || '').toLowerCase().includes(query);
        const matchType = (v.tipo_valla || v.tipo || '').toLowerCase().includes(query);
        const matchDim = (v.medidas || v.dimensiones || '').toLowerCase().includes(query);
        if (!matchCode && !matchName && !matchStreet && !matchCity && !matchZone && !matchType && !matchDim) {
          return false;
        }
      }

      return true;
    });
  }, [vehicles, onlyAvailableFilter, selectedCityFilter, vallaSearch, vallasLista, fechaInicio, fechaFin, contracts, initialContract]);

  // Handler to select billboard from catalog and auto-populate measures & lonas
  const handleSelectBillboardFromCatalog = (valla: Vehicle) => {
    const newVallaId = 'VALLA-' + Date.now();
    const newLonaId = 'LONA-' + (Date.now() + 1);
    const dimensions = valla.medidas || valla.dimensiones || '12 x 4 m';
    const rentCostBs = Math.round((valla.precio_usd || 1000) * tc);
    const lonaCostBs = calculateSuggestedLonaCostBs(dimensions, valla.costo_lona_m2_bs);
    const locationName = valla.avenida_calle 
      ? `${valla.avenida_calle} (${valla.codigo || valla.modelo || valla.id})`
      : (valla.nombre || valla.modelo || 'Ubicación Valla');

    const newVallaRow: ContractVallaItem = {
      id: newVallaId,
      valla_id: valla.id,
      ciudad: valla.ciudad || clienteCiudad || 'Santa Cruz',
      formato: valla.tipo_valla || valla.tipo || 'Valla Unipolar',
      direccion: locationName,
      medidas: dimensions,
      costo_mensual_bs: rentCostBs,
      descuento_bs: 0,
      costo_neto_bs: rentCostBs
    };

    const newLonaRow: ContractLonaItem = {
      id: newLonaId,
      valla_id: valla.id,
      valla_medidas: dimensions,
      direccion: `Impresion de lona Vinilica 13 Oz.con Filtro Uv.e Instalacion - ${locationName}`,
      medidas: dimensions, // Autocomplete suggested lona size matching billboard size!
      costo_unitario_bs: lonaCostBs,
      descuento_lona_bs: 0,
      total_costo_bs: lonaCostBs
    };

    setVallasLista(prev => [...prev, newVallaRow]);
    setLonasLista(prev => [...prev, newLonaRow]);
    setShowVallaSelector(false);
    setAddedNotice(`✅ ${valla.codigo || valla.modelo || 'Valla'} agregada con medidas: ${dimensions}`);
    setTimeout(() => setAddedNotice(null), 3500);
  };

  // Handler to add a blank/manual row
  const handleAddManualVallaRow = () => {
    const newVallaId = 'VALLA-' + Date.now();
    const newLonaId = 'LONA-' + (Date.now() + 1);
    const defaultMedida = '12 x 4 m';
    const newRow: ContractVallaItem = {
      id: newVallaId,
      ciudad: clienteCiudad || 'Santa Cruz',
      formato: 'Valla Unipolar',
      direccion: 'Nueva Ubicación Avenida / Anillo',
      medidas: defaultMedida,
      costo_mensual_bs: 8000,
      descuento_bs: 0,
      costo_neto_bs: 8000
    };
    const newLonaRow: ContractLonaItem = {
      id: newLonaId,
      valla_id: newVallaId,
      valla_medidas: defaultMedida,
      direccion: 'Impresion de lona Vinilica 13 Oz.con Filtro Uv.e Instalacion - Nueva Ubicación Avenida / Anillo',
      medidas: defaultMedida,
      costo_unitario_bs: 2920,
      descuento_lona_bs: 0,
      total_costo_bs: 2920
    };
    setVallasLista(prev => [...prev, newRow]);
    setLonasLista(prev => [...prev, newLonaRow]);
    setShowVallaSelector(false);
  };

  // Valla Item Handlers
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
    const correspondingValla = vallasLista[lonasLista.length] || vallasLista[vallasLista.length - 1];
    const dimensions = correspondingValla?.medidas || '12 x 4 m';
    const location = correspondingValla?.direccion || 'Ubicación Valla';
    const suggestedCost = calculateSuggestedLonaCostBs(dimensions);

    const newRow: ContractLonaItem = {
      id: 'LONA-' + Date.now(),
      valla_id: correspondingValla?.valla_id || correspondingValla?.id,
      valla_medidas: dimensions,
      direccion: `Impresion de lona Vinilica 13 Oz.con Filtro Uv.e Instalacion - ${location}`,
      medidas: dimensions,
      costo_unitario_bs: suggestedCost,
      descuento_lona_bs: 0,
      total_costo_bs: suggestedCost
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

      cliente_id: selectedClientId || (clients[0]?.id || ''),
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
    try {
      const c = savedContract || buildContractObject();
      const text = encodeURIComponent(generateContractShareText());
      const phone = c.cliente_celular.replace(/[^\d]/g, '');
      const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
      window.open(url, '_blank');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendEmail = () => {
    try {
      const c = savedContract || buildContractObject();
      const email = c.cliente_correo || '';
      const subject = encodeURIComponent(`Contrato ${c.numero} - PUBLI-X BOLIVIA`);
      const body = encodeURIComponent(generateContractShareText());
      window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
    } catch (e) {
      console.error(e);
    }
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
              
              {/* Notice Toast */}
              {addedNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-between shadow-xs">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{addedNotice}</span>
                  </div>
                  <button onClick={() => setAddedNotice(null)} className="text-emerald-700 hover:text-emerald-950 text-xs">✕</button>
                </div>
              )}

              {/* TABLA 1: ESPACIOS PUBLICITARIOS (VALLAS) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-amber-500" />
                      <span>Tabla 1: Espacios Publicitarios (Vallas)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Seleccione estructuras del catálogo para autocompletar medidas y cánones, o edite libremente.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowVallaSelector(true)}
                      className="px-3.5 py-1.5 bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl hover:bg-amber-400 transition flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-98"
                      title="Seleccionar valla o espacio del catálogo"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-950" />
                      <span>+ Agregar</span>
                    </button>
                    <button
                      onClick={handleAddManualVallaRow}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center space-x-1 cursor-pointer"
                      title="Agregar una fila en blanco sin asociar al catálogo"
                    >
                      <span>+ Fila Manual</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-2.5">Ciudad</th>
                        <th className="p-2.5">Formato</th>
                        <th className="p-2.5 min-w-[200px]">Dirección / Ubicación</th>
                        <th className="p-2.5 min-w-[100px]">Medida Valla</th>
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
                          <td className="p-2">
                            <input
                              type="text"
                              value={v.medidas || ''}
                              onChange={(e) => handleUpdateVallaRow(v.id, 'medidas', e.target.value)}
                              placeholder="12 x 4 m"
                              className="w-24 px-2 py-1 rounded border border-slate-200 text-xs font-mono font-bold text-slate-700 bg-slate-50 uppercase"
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
                            <button
                              onClick={() => handleDeleteVallaRow(v.id)}
                              className="p-1 rounded bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 transition cursor-pointer"
                              title="Eliminar este espacio"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-extrabold text-slate-900 text-xs">
                      <tr>
                        <td colSpan={6} className="p-3 uppercase">SUMA TOTAL MENSUAL CANON VALLAS:</td>
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
                      Comparativa visual entre medida de estructura vs medida de impresión requerida.
                    </p>
                  </div>

                  <button
                    onClick={handleAddLonaRow}
                    className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-500 transition flex items-center space-x-1 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Lona Manual</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-2.5 min-w-[180px]">Impresión de Lonas (Dirección)</th>
                        <th className="p-2.5 min-w-[260px]">Medida Valla vs Medida Lona</th>
                        <th className="p-2.5 text-right">Costo Unit. (Bs)</th>
                        <th className="p-2.5 text-right">Desc. Lona (Bs)</th>
                        <th className="p-2.5 text-right">Total Costo Lona (Bs)</th>
                        <th className="p-2.5 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                      {lonasLista.map((l, idx) => {
                        // Find matching billboard measure for comparison
                        const vallaMedida = l.valla_medidas || 
                          vallasLista.find(v => v.valla_id === l.valla_id)?.medidas || 
                          vallasLista[idx]?.medidas || '';

                        const isMatching = vallaMedida ? (normalizeDimension(l.medidas) === normalizeDimension(vallaMedida)) : true;

                        return (
                          <tr key={l.id} className="hover:bg-slate-50">
                            <td className="p-2">
                              <input
                                type="text"
                                value={l.direccion}
                                onChange={(e) => handleUpdateLonaRow(l.id, 'direccion', e.target.value)}
                                className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-bold text-slate-900"
                              />
                            </td>
                            
                            {/* MEDIDA DE LA VALLA VS MEDIDA DE LA LONA */}
                            <td className="p-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {vallaMedida && (
                                  <div 
                                    className="flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-1 rounded text-slate-700 text-xs font-mono font-bold whitespace-nowrap"
                                    title="Medida oficial de la estructura valla"
                                  >
                                    <span className="text-[10px] text-slate-400 font-sans uppercase font-bold">Valla:</span>
                                    <span>{vallaMedida}</span>
                                  </div>
                                )}

                                {vallaMedida && <span className="text-slate-300 font-bold hidden sm:inline">|</span>}

                                <div className="flex items-center gap-1.5">
                                  <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                    <span className="text-[10px] text-slate-400 font-sans uppercase font-bold">Lona:</span>
                                    <input
                                      type="text"
                                      value={l.medidas}
                                      onChange={(e) => handleUpdateLonaRow(l.id, 'medidas', e.target.value)}
                                      placeholder="12 x 4 m"
                                      className={`w-24 px-1.5 py-0.5 rounded text-xs font-mono uppercase font-bold focus:outline-none transition ${
                                        isMatching 
                                          ? 'border-transparent text-slate-900 focus:ring-1 focus:ring-amber-500' 
                                          : 'border border-amber-400 bg-amber-50 text-amber-950 focus:ring-1 focus:ring-amber-500'
                                      }`}
                                    />
                                  </div>

                                  {vallaMedida && (
                                    isMatching ? (
                                      <span 
                                        className="inline-flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[11px] font-bold whitespace-nowrap"
                                        title="La medida de la lona coincide con la de la valla"
                                      >
                                        <Check className="w-3 h-3 text-emerald-600 mr-0.5" /> ✅
                                      </span>
                                    ) : (
                                      <span 
                                        className="inline-flex items-center text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded text-[11px] font-bold whitespace-nowrap shadow-2xs"
                                        title="Advertencia: La medida de la lona no coincide exactamente con la medida de la estructura. Puede guardar normalmente."
                                      >
                                        <AlertCircle className="w-3 h-3 text-amber-600 mr-1 shrink-0" /> ⚠️ Medida distinta
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
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
                              <button
                                onClick={() => handleDeleteLonaRow(l.id)}
                                className="p-1 rounded bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 transition cursor-pointer"
                                title="Eliminar este ítem de lona"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
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

      {/* BILLBOARD SELECTOR MODAL */}
      {showVallaSelector && (
        <div className="fixed inset-0 z-60 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-500 rounded-2xl text-slate-950">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black uppercase tracking-wider text-white">
                    Catálogo de Vallas Publicitarias & Pantallas
                  </h2>
                  <p className="text-xs text-slate-400">
                    Seleccione una estructura disponible para transferir medidas y cánones al contrato
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowVallaSelector(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                {/* Search */}
                <div className="relative w-full sm:flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={vallaSearch}
                    onChange={(e) => setVallaSearch(e.target.value)}
                    placeholder="Buscar por código, avenida, zona, formato o medidas..."
                    className="w-full pl-9 pr-8 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {vallaSearch && (
                    <button
                      onClick={() => setVallaSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Only Available Toggle */}
                <button
                  onClick={() => setOnlyAvailableFilter(!onlyAvailableFilter)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                    onlyAvailableFilter 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${onlyAvailableFilter ? 'bg-emerald-600' : 'bg-slate-400'}`}></span>
                  <span>{onlyAvailableFilter ? 'Solo Disponibles' : 'Ver Todas'}</span>
                </button>
              </div>

              {/* City Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Ciudad:
                </span>
                <button
                  onClick={() => setSelectedCityFilter('TODAS')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition whitespace-nowrap ${
                    selectedCityFilter === 'TODAS'
                      ? 'bg-slate-900 text-amber-400'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Todas ({vehicles.length})
                </button>
                {availableCities.map(city => {
                  const count = vehicles.filter(v => v.ciudad?.toLowerCase() === city.toLowerCase()).length;
                  return (
                    <button
                      key={city}
                      onClick={() => setSelectedCityFilter(city)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition whitespace-nowrap ${
                        selectedCityFilter === city
                          ? 'bg-slate-900 text-amber-400'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {city} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Billboard Grid Content */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 max-h-[58vh]">
              {filteredVehiclesForSelector.length === 0 ? (
                <div className="p-12 text-center text-slate-500 space-y-3">
                  <Layers className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-bold text-sm text-slate-700">No se encontraron vallas con los filtros actuales</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Intente cambiar la búsqueda o desmarcar el filtro de "Solo Disponibles".
                  </p>
                  <button
                    onClick={() => {
                      setVallaSearch('');
                      setSelectedCityFilter('TODAS');
                      setOnlyAvailableFilter(false);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                  >
                    Restablecer Filtros
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredVehiclesForSelector.map(v => {
                    const status = getVehicleAvailabilityStatus(v);
                    const dimensions = v.medidas || v.dimensiones || '12 x 4 m';
                    const rentBs = Math.round((v.precio_usd || 1000) * tc);
                    const lonaBs = calculateSuggestedLonaCostBs(dimensions, v.costo_lona_m2_bs);
                    const areaM2 = parseDimensionsM2(dimensions);

                    return (
                      <div
                        key={v.id}
                        className={`rounded-2xl border p-3 flex gap-3 transition shadow-xs hover:shadow-md ${
                          status.isCurrent 
                            ? 'bg-emerald-50/40 border-emerald-300'
                            : !status.available
                              ? 'bg-slate-50/80 border-slate-200 opacity-75'
                              : 'bg-white border-slate-200 hover:border-amber-400'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 relative">
                          <img
                            src={formatDriveUrl(v.imagen_url || v.foto_url || v.fotos?.[0])}
                            alt={v.codigo || v.modelo}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute top-1 left-1 bg-slate-950/80 backdrop-blur-xs text-amber-400 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">
                            {v.codigo || v.id}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex flex-col justify-between flex-1 min-w-0">
                          <div>
                            {/* Status badge */}
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase truncate">
                                {v.tipo_valla || v.tipo || 'Valla'} • {v.ciudad || 'Bolivia'}
                              </span>
                              {status.isCurrent ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                                  ✓ En este contrato
                                </span>
                              ) : status.available ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-bold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  Disponible
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[9px] font-bold" title={status.reason}>
                                  🔴 {status.reason}
                                </span>
                              )}
                            </div>

                            {/* Location / Name */}
                            <h4 className="font-extrabold text-xs text-slate-900 line-clamp-1">
                              {v.avenida_calle || v.nombre || v.modelo}
                            </h4>
                            {v.zona && (
                              <p className="text-[10px] text-slate-500 line-clamp-1 mb-1.5">
                                Zona: {v.zona}
                              </p>
                            )}

                            {/* Specs Pills */}
                            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold my-1.5">
                              <div className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono">
                                <span className="text-[9px] text-slate-400 block font-sans font-bold">MEDIDA</span>
                                📏 {dimensions} ({areaM2} m²)
                              </div>
                              <div className="bg-amber-50 border border-amber-200 px-2 py-1 rounded text-amber-900 font-mono">
                                <span className="text-[9px] text-amber-700 block font-sans font-bold">CANON MENSUAL</span>
                                Bs. {rentBs.toLocaleString('es-BO')}
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-mono" title="Costo estimado de impresión de lona">
                              Lona: ~Bs. {lonaBs.toLocaleString('es-BO')}
                            </span>

                            {status.isCurrent ? (
                              <button
                                disabled
                                className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg cursor-not-allowed"
                              >
                                Agregada ✅
                              </button>
                            ) : !status.available ? (
                              <button
                                disabled
                                className="px-3 py-1 bg-slate-200 text-slate-400 text-xs font-bold rounded-lg cursor-not-allowed"
                              >
                                No disponible 🔒
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSelectBillboardFromCatalog(v)}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-lg transition cursor-pointer shadow-xs active:scale-95 flex items-center space-x-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Seleccionar</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={handleAddManualVallaRow}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 underline transition cursor-pointer"
              >
                + Crear estructura manual fuera de catálogo
              </button>

              <button
                onClick={() => setShowVallaSelector(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
              >
                Cerrar Selector
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
