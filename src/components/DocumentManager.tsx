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
  FileText, 
  FileCheck, 
  Layers, 
  Edit3, 
  Check, 
  X, 
  Printer, 
  Download, 
  Send, 
  Mail, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Copy, 
  Eye, 
  Sparkles, 
  ShieldCheck, 
  Building2, 
  User, 
  DollarSign, 
  Calendar, 
  Tag, 
  HelpCircle, 
  Info, 
  Search,
  CheckCircle2,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AutoQuotationGeneratorModal from './AutoQuotationGeneratorModal';

interface DocumentManagerProps {
  quotations: Quotation[];
  contracts: Contract[];
  clients: Client[];
  vehicles: Vehicle[];
  settings: Settings;
  currentUserNombre?: string;
  onSaveQuotation: (quote: Quotation) => void;
  onSaveContract: (contract: Contract) => void;
  onSelectQuotationForContract?: (quote: Quotation) => void;
}

type DocCategory = 'PROFORMA' | 'CONTRATO' | 'ACTA_ENTREGA';

export default function DocumentManager({
  quotations,
  contracts,
  clients,
  vehicles,
  settings,
  currentUserNombre = 'Asesor Comercial PUBLI-X',
  onSaveQuotation,
  onSaveContract
}: DocumentManagerProps) {
  // Document Type selection
  const [activeDocType, setActiveDocType] = useState<DocCategory>('PROFORMA');
  
  // Highlight editable fields switch (KEY USER REQUEST)
  const [highlightEditableFields, setHighlightEditableFields] = useState<boolean>(true);
  
  // Active Selected IDs
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>(quotations[0]?.id || '');
  const [selectedContractId, setSelectedContractId] = useState<string>(contracts[0]?.id || '');

  // Notifications
  const [saveToast, setSaveToast] = useState<string>('');

  // Auto Quotation Generator Modal State
  const [showAutoGeneratorModal, setShowAutoGeneratorModal] = useState<boolean>(false);

  // ----------------------------------------------------
  // PROFORMA EDITABLE STATE
  // ----------------------------------------------------
  const [proformaData, setProformaData] = useState<{
    id: string;
    numero: string;
    fecha: string;
    validez_dias: number;
    cliente_id: string;
    cliente_nombre: string;
    cliente_empresa: string;
    cliente_celular: string;
    cliente_ciudad: string;
    vehiculo_id: string;
    valla_nombre: string;
    valla_tipo: string;
    valla_medidas: string;
    valla_ciudad: string;
    valla_avenida: string;
    valla_cara: string;
    precio_alquiler_usd: number;
    costo_lona_usd: number;
    costo_montaje_usd: number;
    costo_logistica_usd: number;
    costo_mantenimiento_usd: number;
    descuento_usd: number;
    observaciones: string;
    terminos_legales: string;
    asesor_comercial: string;
  }>({
    id: 'Q-TEMP',
    numero: `PUBLIX-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2,'0')}01-0001`,
    fecha: new Date().toISOString().split('T')[0],
    validez_dias: 15,
    cliente_id: clients[0]?.id || '',
    cliente_nombre: clients[0]?.nombre || 'Cliente General',
    cliente_empresa: clients[0]?.empresa || 'Corporación',
    cliente_celular: clients[0]?.celular || '+591 70000000',
    cliente_ciudad: clients[0]?.ciudad || 'Santa Cruz',
    vehiculo_id: vehicles[0]?.id || '',
    valla_nombre: vehicles[0]?.avenida_calle || vehicles[0]?.modelo || 'Valla Unipolar 3er Anillo',
    valla_tipo: vehicles[0]?.tipo_valla || vehicles[0]?.tipo || 'Valla Unipolar',
    valla_medidas: vehicles[0]?.medidas || '15x4m',
    valla_ciudad: vehicles[0]?.ciudad || 'Santa Cruz',
    valla_avenida: vehicles[0]?.avenida_calle || 'Av. Banzer y 4to Anillo',
    valla_cara: vehicles[0]?.cara || 'Cara A',
    precio_alquiler_usd: vehicles[0]?.precio_usd || 1500,
    costo_lona_usd: 400,
    costo_montaje_usd: 300,
    costo_logistica_usd: 150,
    costo_mantenimiento_usd: 100,
    descuento_usd: 0,
    observaciones: 'Propuesta comercial para publicidad exterior de alto impacto con iluminación LED nocturna y lona frontlight 13oz.',
    terminos_legales: settings.terminos_cotizacion || 'Precios expresados en USD. Facturación al tipo de cambio oficial. Incluye mantenimiento de luminarias e instalación autorizada.',
    asesor_comercial: currentUserNombre
  });

  // ----------------------------------------------------
  // CONTRATO EDITABLE STATE
  // ----------------------------------------------------
  const [contratoData, setContratoData] = useState<{
    id: string;
    numero: string;
    fecha_emision: string;
    fecha_inicio: string;
    fecha_fin: string;
    plazo_meses: number;
    
    // Arrendador (PUBLI-X)
    arrendador_empresa: string;
    arrendador_nit: string;
    arrendador_direccion: string;
    arrendador_representante: string;
    arrendador_ci: string;
    arrendador_celular: string;

    // Arrendatario (Cliente)
    cliente_id: string;
    cliente_nombre: string;
    cliente_empresa: string;
    cliente_nit_ci: string;
    cliente_representante: string;
    cliente_representante_ci: string;
    cliente_escritura_poder: string;
    cliente_poder_fecha: string;
    cliente_notaria_numero: string;
    cliente_notario_nombre: string;
    cliente_celular: string;
    cliente_correo: string;
    cliente_direccion: string;
    cliente_ciudad: string;

    // Items de vallas
    vallas_lista: ContractVallaItem[];
    lonas_lista: ContractLonaItem[];

    // Totales
    tipo_cambio: number;
    subtotal_usd: number;
    descuento_usd: number;
    total_neto_usd: number;
    total_neto_bob: number;
    
    // Cláusulas
    clausula_objeto: string;
    clausula_precio_pago: string;
    clausula_iluminacion: string;
    clausula_penalidades: string;
    clausula_jurisdiccion: string;
  }>({
    id: 'CON-TEMP',
    numero: `00025 PUBLI-X/${new Date().getFullYear()}`,
    fecha_emision: new Date().toISOString().split('T')[0],
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    plazo_meses: 2,

    arrendador_empresa: settings.nombre_empresa || 'PUBLI-X BOLIVIA',
    arrendador_nit: '4579387019',
    arrendador_direccion: 'Calle Los Tajibos 2185 Barrio Petrolero Norte entre 2do anillo y Av. Los Cusis',
    arrendador_representante: 'Sr. Carlos David Vargas Añez',
    arrendador_ci: '4579387 emitida en Santa Cruz',
    arrendador_celular: '+591 70000000',

    cliente_id: clients[0]?.id || '',
    cliente_nombre: clients[0]?.nombre || 'UNIVERSIDAD PRIVADA DOMINGO SAVIO – UPDS',
    cliente_empresa: clients[0]?.empresa || 'UPDS',
    cliente_nit_ci: clients[0]?.nit_ci || '1015289020',
    cliente_representante: 'Lic. Paola Carmiña Pericón de Chazal',
    cliente_representante_ci: '3559515 emitida en Oruro',
    cliente_escritura_poder: 'Nº 506/2021',
    cliente_poder_fecha: '05 de Mayo del 2021',
    cliente_notaria_numero: 'N° 103',
    cliente_notario_nombre: 'Dra. Marbel Silvana España Pedraza',
    cliente_celular: clients[0]?.celular || '+591 70000000',
    cliente_correo: clients[0]?.correo || 'marketing@upds.edu.bo',
    cliente_direccion: 'Av. Beni y 3er anillo Externo',
    cliente_ciudad: clients[0]?.ciudad || 'Santa Cruz',

    vallas_lista: [
      { id: 'V1', ciudad: 'Santa Cruz', formato: 'Valla Unipolar', direccion: '3er ANILLO INTERNO CANAL COTOCA', costo_mensual_bs: 13980, descuento_bs: 1000, costo_neto_bs: 12980 },
      { id: 'V2', ciudad: 'Santa Cruz', formato: 'Valla Unipolar', direccion: '3er ANILLO INTERNO ENTRE AV. BUSH Y AV. SAN MARTIN', costo_mensual_bs: 8800, descuento_bs: 880, costo_neto_bs: 7920 }
    ],
    lonas_lista: [
      { id: 'L1', direccion: '3er ANILLO INTERNO CANAL COTOCA', medidas: '15x4', costo_unitario_bs: 4380, descuento_lona_bs: 0, total_costo_bs: 4380 },
      { id: 'L2', direccion: '3er ANILLO INTERNO ENTRE AV. BUSH Y AV. SAN MARTIN', medidas: '10X4', costo_unitario_bs: 2920, descuento_lona_bs: 30, total_costo_bs: 2890 }
    ],

    tipo_cambio: settings.tipo_cambio || 6.96,
    subtotal_usd: 4100,
    descuento_usd: 300,
    total_neto_usd: 3800,
    total_neto_bob: 26448,

    clausula_objeto: 'EL ARRENDADOR concede en calidad de alquiler a favor de EL ARRENDATARIO los espacios de publicidad exterior especificados en la Tabla 1, con mantenimiento e iluminación nocturna garantizada.',
    clausula_precio_pago: 'El canon de arrendamiento mensual convenido es facturado en Moneda Nacional al tipo de cambio acordado. El pago se efectuará mediante transferencia bancaria dentro de los primeros 5 días hábiles de cada mes.',
    clausula_iluminacion: 'PUBLI-X garantiza el funcionamiento óptimo del sistema de luminarias LED desde las 18:30 hasta las 24:00 horas todos los días del año.',
    clausula_penalidades: 'En caso de mora superior a diez (10) días hábiles, EL ARRENDADOR podrá suspender temporalmente la iluminación del espacio previa notificación escrita.',
    clausula_jurisdiccion: 'Para cualquier controversia, las partes se someten a la conciliación y arbitraje del Centro de Conciliación y Arbitraje Comercial de CAINCO Santa Cruz.'
  });

  // ----------------------------------------------------
  // ACTA DE ENTREGA STATE
  // ----------------------------------------------------
  const [actaData, setActaData] = useState({
    numero: `ACTA-${new Date().getFullYear()}-001`,
    fecha_instalacion: new Date().toISOString().split('T')[0],
    hora_encendido: '18:30',
    cliente_nombre: clients[0]?.nombre || 'Cliente Corporativo',
    valla_direccion: vehicles[0]?.avenida_calle || '3er Anillo Interno Canal Cotoca',
    medidas_lona: vehicles[0]?.medidas || '15x4m',
    tipo_estructura: 'Valla Unipolar Metálica con 4 Reflectores LED 200W',
    estado_lona: 'Lona Frontlight 13oz tensada correctamente sin arrugas ni roturas',
    luminarias_funcionando: '4 de 4 Reflectores LED operativos',
    responsable_montaje: 'Ing. Supervisor Técnico PUBLI-X',
    conformidad_cliente: 'Aprobado a entera satisfacción sin observaciones'
  });

  // Synchronize when quotation is selected from dropdown
  useEffect(() => {
    if (selectedQuoteId) {
      const q = quotations.find(item => item.id === selectedQuoteId);
      if (q) {
        const c = clients.find(cl => cl.id === q.cliente_id);
        const v = vehicles.find(vh => vh.id === q.vehiculo_id);
        setProformaData(prev => ({
          ...prev,
          id: q.id,
          numero: q.numero,
          fecha: q.fecha ? q.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
          cliente_id: q.cliente_id,
          cliente_nombre: c?.nombre || 'Cliente Destinatario',
          cliente_empresa: c?.empresa || 'Empresa',
          cliente_celular: c?.celular || '+591 70000000',
          cliente_ciudad: c?.ciudad || 'Santa Cruz',
          vehiculo_id: q.vehiculo_id,
          valla_nombre: v?.avenida_calle || v?.modelo || 'Valla Publicitaria',
          valla_tipo: v?.tipo_valla || v?.tipo || 'Valla Unipolar',
          valla_medidas: v?.medidas || '12x4m',
          valla_ciudad: v?.ciudad || 'Santa Cruz',
          valla_avenida: v?.avenida_calle || 'Av. Principal',
          valla_cara: v?.cara || 'Cara A',
          precio_alquiler_usd: q.precio_vehiculo || 1500,
          costo_lona_usd: q.gastos_importacion || 400,
          costo_montaje_usd: q.gastos_aduana || 300,
          costo_logistica_usd: q.gastos_logistica || 150,
          costo_mantenimiento_usd: q.gastos_seguro || 100,
          descuento_usd: 0,
          observaciones: q.observaciones || prev.observaciones
        }));
      }
    }
  }, [selectedQuoteId, quotations, clients, vehicles]);

  // Synchronize when contract is selected from dropdown
  useEffect(() => {
    if (selectedContractId) {
      const c = contracts.find(item => item.id === selectedContractId);
      if (c) {
        setContratoData(prev => ({
          ...prev,
          id: c.id,
          numero: c.numero,
          fecha_emision: c.fecha_emision || prev.fecha_emision,
          fecha_inicio: c.fecha_inicio || prev.fecha_inicio,
          fecha_fin: c.fecha_fin || prev.fecha_fin,
          cliente_id: c.cliente_id || prev.cliente_id,
          cliente_nombre: c.cliente_nombre || prev.cliente_nombre,
          cliente_empresa: c.cliente_empresa || prev.cliente_empresa,
          cliente_nit_ci: c.cliente_nit_ci || prev.cliente_nit_ci,
          cliente_representante: c.cliente_representante || prev.cliente_representante,
          cliente_representante_ci: c.cliente_representante_ci || prev.cliente_representante_ci,
          cliente_escritura_poder: c.cliente_escritura_poder || prev.cliente_escritura_poder,
          cliente_celular: c.cliente_celular || prev.cliente_celular,
          cliente_correo: c.cliente_correo || prev.cliente_correo,
          cliente_direccion: c.cliente_direccion || prev.cliente_direccion,
          cliente_ciudad: c.cliente_ciudad || prev.cliente_ciudad,
          vallas_lista: c.vallas_lista && c.vallas_lista.length > 0 ? c.vallas_lista : prev.vallas_lista,
          lonas_lista: c.lonas_lista && c.lonas_lista.length > 0 ? c.lonas_lista : prev.lonas_lista,
          total_neto_usd: c.total_neto_usd || prev.total_neto_usd,
          total_neto_bob: c.total_neto_bob || prev.total_neto_bob,
        }));
      }
    }
  }, [selectedContractId, contracts]);

  // Recalculate Proforma Total
  const subtotalProforma = 
    (Number(proformaData.precio_alquiler_usd) || 0) +
    (Number(proformaData.costo_lona_usd) || 0) +
    (Number(proformaData.costo_montaje_usd) || 0) +
    (Number(proformaData.costo_logistica_usd) || 0) +
    (Number(proformaData.costo_mantenimiento_usd) || 0);
  const totalProformaUSD = Math.max(0, subtotalProforma - (Number(proformaData.descuento_usd) || 0));
  const totalProformaBOB = Math.round(totalProformaUSD * (settings.tipo_cambio || 6.96));

  // Save Proforma to database
  const handleSaveProforma = () => {
    const updatedQuote: Quotation = {
      id: proformaData.id.startsWith('Q-TEMP') ? 'Q' + Date.now() : proformaData.id,
      numero: proformaData.numero,
      cliente_id: proformaData.cliente_id,
      vehiculo_id: proformaData.vehiculo_id,
      precio_vehiculo: Number(proformaData.precio_alquiler_usd) || 0,
      gastos_importacion: Number(proformaData.costo_lona_usd) || 0,
      gastos_aduana: Number(proformaData.costo_montaje_usd) || 0,
      gastos_logistica: Number(proformaData.costo_logistica_usd) || 0,
      gastos_seguro: Number(proformaData.costo_mantenimiento_usd) || 0,
      total: totalProformaUSD,
      estado: 'Enviada',
      observaciones: proformaData.observaciones,
      fecha: new Date(proformaData.fecha).toISOString()
    };

    onSaveQuotation(updatedQuote);
    setSaveToast('¡Proforma comercial guardada y actualizada exitosamente!');
    setTimeout(() => setSaveToast(''), 4000);
  };

  // Save Contrato to database
  const handleSaveContrato = () => {
    const updatedContract: Contract = {
      id: contratoData.id.startsWith('CON-TEMP') ? 'CON-' + Date.now() : contratoData.id,
      numero: contratoData.numero,
      cliente_id: contratoData.cliente_id,
      cliente_nombre: contratoData.cliente_nombre,
      cliente_empresa: contratoData.cliente_empresa,
      cliente_nit_ci: contratoData.cliente_nit_ci,
      cliente_representante: contratoData.cliente_representante,
      cliente_representante_ci: contratoData.cliente_representante_ci,
      cliente_escritura_poder: contratoData.cliente_escritura_poder,
      cliente_poder_fecha: contratoData.cliente_poder_fecha,
      cliente_notaria_numero: contratoData.cliente_notaria_numero,
      cliente_notario_nombre: contratoData.cliente_notario_nombre,
      cliente_celular: contratoData.cliente_celular,
      cliente_correo: contratoData.cliente_correo,
      cliente_direccion: contratoData.cliente_direccion,
      cliente_ciudad: contratoData.cliente_ciudad,
      arrendador_empresa: contratoData.arrendador_empresa,
      arrendador_nit: contratoData.arrendador_nit,
      arrendador_direccion: contratoData.arrendador_direccion,
      arrendador_representante: contratoData.arrendador_representante,
      arrendador_ci: contratoData.arrendador_ci,
      valla_nombre: contratoData.vallas_lista[0]?.direccion || 'Espacios de Publicidad Exterior',
      valla_medidas: contratoData.lonas_lista[0]?.medidas || '15x4',
      valla_ubicacion: contratoData.cliente_ciudad,
      valla_tipo: 'Valla Unipolar',
      valla_cara: 'Cara A',
      vallas_lista: contratoData.vallas_lista,
      lonas_lista: contratoData.lonas_lista,
      items: [],
      lona_detail: {
        incluye_lona: true,
        especificacion: 'Confección e instalación de lona frontlight full color',
        medidas_m2: 120,
        costo_m2_usd: 10,
        costo_total_lona: 1200,
        descuento_lona_usd: 0,
        subtotal_lona_neto: 1200
      },
      beneficios_extras: [
        'Mantenimiento de luminarias e iluminación nocturna',
        'Soporte y revisión ante vientos o inclemencias climáticas'
      ],
      subtotal_alquiler_usd: contratoData.subtotal_usd,
      descuento_cliente_usd: contratoData.descuento_usd,
      descuento_cliente_porcentaje: 8,
      total_neto_usd: contratoData.total_neto_usd,
      total_neto_bob: contratoData.total_neto_bob,
      tipo_cambio: contratoData.tipo_cambio,
      fecha_emision: contratoData.fecha_emision,
      fecha_inicio: contratoData.fecha_inicio,
      fecha_fin: contratoData.fecha_fin,
      periodo_meses: contratoData.plazo_meses || 12,
      plazo_meses: contratoData.plazo_meses,
      forma_pago: 'Transferencia Bancaria / Factura Comercial',
      clausulas_especiales: contratoData.clausula_objeto,
      estado: 'Vigente',
      observaciones: 'Contrato formal generado desde Centro de Documentos PUBLI-X.',
      vendedor_nombre: currentUserNombre,
      vendedor_celular: settings.telefono || '+591 70000000',
      clausulas_adicionales: contratoData.clausula_objeto
    };

    onSaveContract(updatedContract);
    setSaveToast('¡Contrato de Publicidad Exterior guardado y validado!');
    setTimeout(() => setSaveToast(''), 4000);
  };

  // Convert Proforma to Contract
  const handleConvertProformaToContract = () => {
    setActiveDocType('CONTRATO');
    setContratoData(prev => ({
      ...prev,
      cliente_id: proformaData.cliente_id,
      cliente_nombre: proformaData.cliente_nombre,
      cliente_empresa: proformaData.cliente_empresa,
      cliente_celular: proformaData.cliente_celular,
      cliente_ciudad: proformaData.cliente_ciudad,
      vallas_lista: [
        {
          id: 'V1',
          ciudad: proformaData.valla_ciudad,
          formato: proformaData.valla_tipo,
          direccion: proformaData.valla_avenida,
          costo_mensual_bs: Math.round(proformaData.precio_alquiler_usd * (settings.tipo_cambio || 6.96)),
          descuento_bs: Math.round(proformaData.descuento_usd * (settings.tipo_cambio || 6.96)),
          costo_neto_bs: Math.round((proformaData.precio_alquiler_usd - proformaData.descuento_usd) * (settings.tipo_cambio || 6.96))
        }
      ],
      lonas_lista: [
        {
          id: 'L1',
          direccion: proformaData.valla_avenida,
          medidas: proformaData.valla_medidas,
          costo_unitario_bs: Math.round(proformaData.costo_lona_usd * (settings.tipo_cambio || 6.96)),
          descuento_lona_bs: 0,
          total_costo_bs: Math.round(proformaData.costo_lona_usd * (settings.tipo_cambio || 6.96))
        }
      ],
      total_neto_usd: totalProformaUSD,
      total_neto_bob: totalProformaBOB,
    }));
    setSaveToast('¡Proforma transferida al formato de Contrato Oficial!');
    setTimeout(() => setSaveToast(''), 4000);
  };

  // WhatsApp Sender
  const handleSendWhatsApp = () => {
    try {
      const cell = (activeDocType === 'PROFORMA' ? proformaData.cliente_celular : contratoData.cliente_celular).replace(/[^\d]/g, '');
      const docTitle = activeDocType === 'PROFORMA' ? `PROFORMA COMERCIAL N° ${proformaData.numero}` : `CONTRATO OOH N° ${contratoData.numero}`;
      const total = activeDocType === 'PROFORMA' ? `$${totalProformaUSD.toLocaleString()} USD (Bs. ${totalProformaBOB.toLocaleString('es-BO')})` : `$${contratoData.total_neto_usd.toLocaleString()} USD (Bs. ${contratoData.total_neto_bob.toLocaleString('es-BO')})`;
      const valla = activeDocType === 'PROFORMA' ? proformaData.valla_nombre : contratoData.vallas_lista[0]?.direccion || 'Espacios OOH';

      const msg = encodeURIComponent(
        `*PUBLI-X BOLIVIA | ${docTitle}* 📢\n\n` +
        `Estimado(a) *${activeDocType === 'PROFORMA' ? proformaData.cliente_nombre : contratoData.cliente_nombre}*:\n` +
        `Le compartimos la propuesta oficial para el espacio publicitario:\n` +
        `📍 *Ubicación:* ${valla}\n` +
        `💰 *Inversión Total:* ${total}\n` +
        `✨ Incluye iluminación nocturna, confección de lona frontlight y mantenimiento.\n\n` +
        `Quedamos a su disposición para formalizar la reserva.\n` +
        `*${currentUserNombre}* • PUBLI-X BOLIVIA`
      );
      window.open(cell ? `https://wa.me/${cell}?text=${msg}` : `https://wa.me/?text=${msg}`, '_blank');
    } catch (e) {
      console.error(e);
    }
  };

  // Helper visual indicator for editable fields
  const editableFieldStyle = highlightEditableFields 
    ? "relative border-2 border-dashed border-amber-400/80 bg-amber-50/50 hover:bg-amber-100/70 p-1.5 rounded-lg transition-all cursor-text group" 
    : "border border-transparent p-1";

  const editableBadge = highlightEditableFields ? (
    <span className="absolute -top-2.5 right-1 bg-amber-500 text-slate-950 font-black text-[8px] uppercase tracking-wider px-1.5 py-0.2 rounded-md shadow-xs pointer-events-none group-hover:scale-105 transition">
      ✏️ Editable
    </span>
  ) : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Top Header & Overview Bar */}
      <div className="bg-slate-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white flex items-center gap-2">
                Centro de Documentos & Pre-Edición
                <span className="text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full">
                  PUBLI-X OOH
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Pre-edita, personaliza y señala los campos modificables en Proformas Comerciales y Contratos de Publicidad Exterior en tiempo real.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Quick Auto Generator Trigger */}
          <button
            onClick={() => setShowAutoGeneratorModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-xl transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
            title="Generar nueva cotización automática multi-valla con cálculo de lonas y contrato"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>⚡ Nueva Cotización Automática</span>
          </button>

          {/* Highlight Toggle (CRITICAL USER REQUEST) */}
          <button
            onClick={() => setHighlightEditableFields(!highlightEditableFields)}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center space-x-2 cursor-pointer shadow-sm ${
              highlightEditableFields
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Activa o desactiva la señalización visual de campos editables"
          >
            <Sparkles className="w-4 h-4" />
            <span>{highlightEditableFields ? '🟡 Señalizar Campos: ACTIVADO' : '⚪ Modo Hoja Limpia'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-extrabold rounded-xl transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
            title="Imprimir o Exportar PDF de Alta Resolución"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>PDF / Imprimir</span>
          </button>

          <button
            onClick={handleSendWhatsApp}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
            title="Compartir por WhatsApp"
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          {activeDocType === 'PROFORMA' ? (
            <button
              onClick={handleSaveProforma}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center space-x-1.5 shadow-md cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Proforma</span>
            </button>
          ) : (
            <button
              onClick={handleSaveContrato}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center space-x-1.5 shadow-md cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Contrato</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast feedback */}
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-600 text-white p-3.5 rounded-2xl shadow-lg font-black text-xs text-center flex items-center justify-center space-x-2 border border-emerald-400"
          >
            <CheckCircle2 className="w-5 h-5 text-amber-300" />
            <span>{saveToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Type Selector Tabs & Quick Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        
        {/* Document Selector Pills */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveDocType('PROFORMA')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center space-x-2 transition cursor-pointer ${
              activeDocType === 'PROFORMA'
                ? 'bg-slate-950 text-amber-400 shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. PROFORMA / COTIZACIÓN OOH</span>
          </button>

          <button
            onClick={() => setActiveDocType('CONTRATO')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center space-x-2 transition cursor-pointer ${
              activeDocType === 'CONTRATO'
                ? 'bg-slate-950 text-amber-400 shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>2. CONTRATO ARRENDAMIENTO OOH</span>
          </button>

          <button
            onClick={() => setActiveDocType('ACTA_ENTREGA')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center space-x-2 transition cursor-pointer ${
              activeDocType === 'ACTA_ENTREGA'
                ? 'bg-slate-950 text-amber-400 shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>3. ACTA DE INSTALACIÓN</span>
          </button>
        </div>

        {/* Cargar Datos Existentes Dropdown */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap">
            Cargar desde BD:
          </span>
          {activeDocType === 'PROFORMA' ? (
            <select
              value={selectedQuoteId}
              onChange={(e) => setSelectedQuoteId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="">-- Seleccionar Cotización Existente --</option>
              {quotations.map(q => {
                const c = clients.find(cl => cl.id === q.cliente_id);
                return (
                  <option key={q.id} value={q.id}>
                    {q.numero} - {c?.nombre || 'Cliente'} (${q.total.toLocaleString()} USD)
                  </option>
                );
              })}
            </select>
          ) : activeDocType === 'CONTRATO' ? (
            <select
              value={selectedContractId}
              onChange={(e) => setSelectedContractId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="">-- Seleccionar Contrato Existente --</option>
              {contracts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.numero} - {c.cliente_nombre} (${c.total_neto_usd.toLocaleString()} USD)
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-slate-500 italic">Plantilla de Acta Estándar</span>
          )}

          {activeDocType === 'PROFORMA' && (
            <button
              onClick={handleConvertProformaToContract}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition flex items-center space-x-1 whitespace-nowrap cursor-pointer"
              title="Convertir esta Proforma en un Contrato Oficial"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Convertir a Contrato</span>
            </button>
          )}
        </div>
      </div>

      {/* DOCUMENT PREVIEW & REAL-TIME PRE-EDITOR SHEET */}
      <div className="bg-slate-200/80 p-4 sm:p-8 rounded-3xl border border-slate-300 shadow-inner flex justify-center">
        
        {/* ========================================================================= */}
        {/* VIEW 1: PROFORMA COMERCIAL PRE-EDITOR */}
        {/* ========================================================================= */}
        {activeDocType === 'PROFORMA' && (
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl p-8 sm:p-12 space-y-6 text-slate-800 font-sans" id="printable-proforma">
            
            {/* Membrete Corporativo Oficial PUBLI-X */}
            <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b-2 border-slate-900 gap-4">
              <div className="space-y-1.5 max-w-md">
                <Logo size="md" logoUrl={settings.logo} />
                <p className="text-[11px] text-amber-700 font-black tracking-widest uppercase pt-1">
                  PUBLICIDAD EXTERIOR (OOH) • VALLAS GIGANTES & PANTALLAS LED EN BOLIVIA
                </p>
                <div className="text-[10px] text-slate-500 leading-relaxed font-medium">
                  <p><strong>Razón Social:</strong> {settings.nombre_empresa || 'PUBLI-X BOLIVIA'}</p>
                  <p><strong>Dirección:</strong> {settings.direccion || 'Av. Banzer y 4to Anillo, Torre Empresarial, Piso 6'}</p>
                  <p><strong>Ubicación:</strong> {settings.ciudad || 'Santa Cruz'}, {settings.pais || 'Bolivia'}</p>
                  <p><strong>Tel / WhatsApp:</strong> {settings.telefono || '+591 70000000'} • <strong>Web:</strong> {settings.web || 'www.publix.bo'}</p>
                </div>
              </div>

              <div className="text-left sm:text-right space-y-2 sm:self-start w-full sm:w-auto">
                <div className="inline-block px-4 py-1.5 bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shadow-xs">
                  COTIZACIÓN FORMAL / PROFORMA
                </div>
                
                <div className={editableFieldStyle}>
                  {editableBadge}
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Nº de Proforma:</p>
                  <input
                    type="text"
                    value={proformaData.numero}
                    onChange={(e) => setProformaData({ ...proformaData, numero: e.target.value })}
                    className="font-mono font-black text-slate-900 text-sm bg-transparent border-b border-dashed border-amber-500 focus:outline-none w-full sm:text-right"
                  />
                </div>

                <div className="grid grid-cols-2 sm:flex sm:flex-col gap-2 text-[10px] text-slate-500 font-mono">
                  <div className={editableFieldStyle}>
                    {editableBadge}
                    <span>Fecha Emisión: </span>
                    <input
                      type="date"
                      value={proformaData.fecha}
                      onChange={(e) => setProformaData({ ...proformaData, fecha: e.target.value })}
                      className="font-bold text-slate-800 bg-transparent border-b border-dashed border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className={editableFieldStyle}>
                    {editableBadge}
                    <span>Validez Oferta: </span>
                    <input
                      type="number"
                      value={proformaData.validez_dias}
                      onChange={(e) => setProformaData({ ...proformaData, validez_dias: Number(e.target.value) })}
                      className="w-12 font-bold text-slate-800 bg-transparent border-b border-dashed border-amber-500 text-center"
                    /> días
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 1: DATOS DEL CLIENTE */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <span>I. DATOS DEL CLIENTE / DESTINATARIO</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Seleccione o escriba directamente</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className={editableFieldStyle}>
                  {editableBadge}
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-0.5">Nombre / Razón Social:</label>
                  <input
                    type="text"
                    value={proformaData.cliente_nombre}
                    onChange={(e) => setProformaData({ ...proformaData, cliente_nombre: e.target.value })}
                    className="w-full font-bold text-slate-900 bg-transparent focus:outline-none"
                  />
                </div>

                <div className={editableFieldStyle}>
                  {editableBadge}
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-0.5">Empresa / Marca:</label>
                  <input
                    type="text"
                    value={proformaData.cliente_empresa}
                    onChange={(e) => setProformaData({ ...proformaData, cliente_empresa: e.target.value })}
                    className="w-full font-semibold text-slate-800 bg-transparent focus:outline-none"
                  />
                </div>

                <div className={editableFieldStyle}>
                  {editableBadge}
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-0.5">Teléfono / WhatsApp:</label>
                  <input
                    type="text"
                    value={proformaData.cliente_celular}
                    onChange={(e) => setProformaData({ ...proformaData, cliente_celular: e.target.value })}
                    className="w-full font-mono text-slate-800 bg-transparent focus:outline-none"
                  />
                </div>

                <div className={editableFieldStyle}>
                  {editableBadge}
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-0.5">Ciudad / Cobertura:</label>
                  <input
                    type="text"
                    value={proformaData.cliente_ciudad}
                    onChange={(e) => setProformaData({ ...proformaData, cliente_ciudad: e.target.value })}
                    className="w-full font-semibold text-slate-800 bg-transparent focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: DETALLE DEL ESPACIO PUBLICITARIO OOH */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>II. ESPACIO PUBLICITARIO COTIZADO</span>
                </h3>
                <span className="text-[10px] text-amber-700 font-bold">Cobertura Estratégica</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className={editableFieldStyle}>
                  {editableBadge}
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-0.5">Formato / Tipo de Soporte:</label>
                  <input
                    type="text"
                    value={proformaData.valla_tipo}
                    onChange={(e) => setProformaData({ ...proformaData, valla_tipo: e.target.value })}
                    className="w-full font-bold text-slate-900 bg-transparent focus:outline-none"
                  />
                </div>

                <div className={editableFieldStyle}>
                  {editableBadge}
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-0.5">Medidas / Dimensiones:</label>
                  <input
                    type="text"
                    value={proformaData.valla_medidas}
                    onChange={(e) => setProformaData({ ...proformaData, valla_medidas: e.target.value })}
                    className="w-full font-bold text-slate-900 bg-transparent focus:outline-none"
                  />
                </div>

                <div className={editableFieldStyle}>
                  {editableBadge}
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-0.5">Cara / Visual:</label>
                  <input
                    type="text"
                    value={proformaData.valla_cara}
                    onChange={(e) => setProformaData({ ...proformaData, valla_cara: e.target.value })}
                    className="w-full font-semibold text-slate-800 bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              <div className={editableFieldStyle}>
                {editableBadge}
                <label className="block text-[9px] font-bold uppercase text-slate-500 mb-0.5">Ubicación y Dirección Exacta:</label>
                <input
                  type="text"
                  value={proformaData.valla_avenida}
                  onChange={(e) => setProformaData({ ...proformaData, valla_avenida: e.target.value })}
                  className="w-full font-bold text-slate-900 bg-transparent focus:outline-none"
                  placeholder="Ej: Av. Cristo Redentor y 4to Anillo, Sentido Norte - Sur"
                />
              </div>
            </div>

            {/* SECCIÓN 3: TABLA DE COSTOS E INVERSIÓN */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                  <span>III. DESGLOSE ECONÓMICO Y CONDICIONES (USD / BOB)</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Tipo de Cambio: Bs. {settings.tipo_cambio || 6.96}</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 text-white font-mono text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Concepto / Servicio OOH</th>
                      <th className="py-2.5 px-3 text-right">Monto Unitario (USD)</th>
                      <th className="py-2.5 px-3 text-right">Equivalente en BOB</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3">
                        <span className="font-bold text-slate-900">Alquiler Mensual del Espacio Publicitario</span>
                        <p className="text-[10px] text-slate-500">Incluye estructura bipolar/unipolar de alta visibilidad</p>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className={editableFieldStyle}>
                          {editableBadge}
                          <input
                            type="number"
                            value={proformaData.precio_alquiler_usd}
                            onChange={(e) => setProformaData({ ...proformaData, precio_alquiler_usd: Number(e.target.value) })}
                            className="w-24 text-right font-black font-mono bg-transparent focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-700">
                        Bs. {Math.round(proformaData.precio_alquiler_usd * (settings.tipo_cambio || 6.96)).toLocaleString('es-BO')}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3">
                        <span className="font-bold text-slate-900">Confección e Impresión de Lona Frontlight 13oz</span>
                        <p className="text-[10px] text-slate-500">Impresión digital full color alta resolución con tintas UV resistentes</p>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className={editableFieldStyle}>
                          {editableBadge}
                          <input
                            type="number"
                            value={proformaData.costo_lona_usd}
                            onChange={(e) => setProformaData({ ...proformaData, costo_lona_usd: Number(e.target.value) })}
                            className="w-24 text-right font-black font-mono bg-transparent focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-700">
                        Bs. {Math.round(proformaData.costo_lona_usd * (settings.tipo_cambio || 6.96)).toLocaleString('es-BO')}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3">
                        <span className="font-bold text-slate-900">Montaje, Instalación & Estructura Metálica</span>
                        <p className="text-[10px] text-slate-500">Tensado profesional con cuadrilla técnica y equipo de altura certificado</p>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className={editableFieldStyle}>
                          {editableBadge}
                          <input
                            type="number"
                            value={proformaData.costo_montaje_usd}
                            onChange={(e) => setProformaData({ ...proformaData, costo_montaje_usd: Number(e.target.value) })}
                            className="w-24 text-right font-black font-mono bg-transparent focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-700">
                        Bs. {Math.round(proformaData.costo_montaje_usd * (settings.tipo_cambio || 6.96)).toLocaleString('es-BO')}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50">
                      <td className="py-2 px-3">
                        <span className="font-bold text-slate-900">Iluminación LED Nocturna & Mantenimiento Preventivo</span>
                        <p className="text-[10px] text-slate-500">Reflectores LED 200W encendido automático 18:30 a 24:00 horas</p>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className={editableFieldStyle}>
                          {editableBadge}
                          <input
                            type="number"
                            value={proformaData.costo_mantenimiento_usd}
                            onChange={(e) => setProformaData({ ...proformaData, costo_mantenimiento_usd: Number(e.target.value) })}
                            className="w-24 text-right font-black font-mono bg-transparent focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-700">
                        Bs. {Math.round(proformaData.costo_mantenimiento_usd * (settings.tipo_cambio || 6.96)).toLocaleString('es-BO')}
                      </td>
                    </tr>

                    {/* Descuento Especial */}
                    <tr className="bg-amber-50/50">
                      <td className="py-2 px-3 font-bold text-amber-900">
                        Descuento Comercial Especial / Bonificación
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className={editableFieldStyle}>
                          {editableBadge}
                          <input
                            type="number"
                            value={proformaData.descuento_usd}
                            onChange={(e) => setProformaData({ ...proformaData, descuento_usd: Number(e.target.value) })}
                            className="w-24 text-right font-black font-mono text-amber-900 bg-transparent focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-amber-900">
                        - Bs. {Math.round(proformaData.descuento_usd * (settings.tipo_cambio || 6.96)).toLocaleString('es-BO')}
                      </td>
                    </tr>

                    {/* TOTAL NETO */}
                    <tr className="bg-slate-950 text-white font-black">
                      <td className="py-3 px-4 text-sm uppercase tracking-wider text-amber-400">
                        TOTAL GENERAL PROPUESTA OOH:
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-base text-amber-400">
                        ${totalProformaUSD.toLocaleString()} USD
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-base text-white">
                        Bs. {totalProformaBOB.toLocaleString('es-BO')} BOB
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECCIÓN 4: OBSERVACIONES Y TÉRMINOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className={editableFieldStyle}>
                {editableBadge}
                <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                  Observaciones & Acuerdos Comerciales:
                </label>
                <textarea
                  rows={3}
                  value={proformaData.observaciones}
                  onChange={(e) => setProformaData({ ...proformaData, observaciones: e.target.value })}
                  className="w-full bg-transparent text-xs text-slate-800 font-medium focus:outline-none"
                  placeholder="Escriba condiciones especiales..."
                />
              </div>

              <div className={editableFieldStyle}>
                {editableBadge}
                <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                  Términos de Facturación y Validez:
                </label>
                <textarea
                  rows={3}
                  value={proformaData.terminos_legales}
                  onChange={(e) => setProformaData({ ...proformaData, terminos_legales: e.target.value })}
                  className="w-full bg-transparent text-xs text-slate-800 font-medium focus:outline-none"
                />
              </div>
            </div>

            {/* FIRMAS Y PIE DE PÁGINA */}
            <div className="pt-8 border-t-2 border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-2">
                <div className="w-48 border-b-2 border-slate-400 mx-auto pb-1" />
                <div className={editableFieldStyle}>
                  {editableBadge}
                  <input
                    type="text"
                    value={proformaData.asesor_comercial}
                    onChange={(e) => setProformaData({ ...proformaData, asesor_comercial: e.target.value })}
                    className="w-full text-center font-black text-slate-900 bg-transparent focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 font-bold uppercase">{settings.nombre_empresa || 'PUBLI-X BOLIVIA'}</p>
                  <p className="text-[9px] text-slate-400">Departamento Comercial y Ventas OOH</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="w-48 border-b-2 border-slate-400 mx-auto pb-1" />
                <p className="font-black text-slate-900">{proformaData.cliente_nombre}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Conformidad del Cliente / Aceptación</p>
                <p className="text-[9px] text-slate-400">Firma y Sello de la Empresa</p>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: CONTRATO DE ARRENDAMIENTO PRE-EDITOR */}
        {/* ========================================================================= */}
        {activeDocType === 'CONTRATO' && (
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl p-8 sm:p-12 space-y-6 text-slate-900 font-serif leading-relaxed" id="printable-contrato">
            
            {/* Header Contrato */}
            <div className="flex flex-col sm:flex-row justify-between items-start pb-4 border-b-2 border-slate-900 gap-4">
              <Logo size="md" logoUrl={settings.logo} />
              <div className="text-right">
                <div className={editableFieldStyle}>
                  {editableBadge}
                  <span className="font-sans text-[10px] font-bold text-slate-400 uppercase">N° de Contrato:</span>
                  <input
                    type="text"
                    value={contratoData.numero}
                    onChange={(e) => setContratoData({ ...contratoData, numero: e.target.value })}
                    className="w-full text-right font-sans font-black text-amber-700 text-sm bg-transparent border-b border-dashed border-amber-500 focus:outline-none"
                  />
                </div>
                <p className="font-sans text-[10px] text-slate-500 mt-1">
                  NIT: {contratoData.arrendador_nit} • Santa Cruz de la Sierra
                </p>
              </div>
            </div>

            {/* Titular Contrato */}
            <div className="text-center space-y-1">
              <h2 className="text-base sm:text-lg font-black tracking-wide text-slate-900 uppercase font-sans">
                CONTRATO PRIVADO DE ARRENDAMIENTO DE ESPACIOS PUBLICITARIOS EXTERIORES (OOH)
              </h2>
              <p className="font-sans text-xs text-slate-500">
                Conste por el presente documento privado reconocido ante la ley que suscriben las partes intervinientes:
              </p>
            </div>

            {/* CLÁUSULA PRIMERA: COMPARECIENTES */}
            <div className="space-y-3 font-sans text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="font-black text-slate-900 uppercase text-[11px] border-b border-slate-200 pb-1">
                CLÁUSULA PRIMERA (DE LAS PARTES INTERVINIENTES):
              </h3>
              
              {/* Arrendador Box */}
              <div className="space-y-1">
                <p className="font-bold text-amber-800">1.1. EL ARRENDADOR (EMPRESA PROPIETARIA):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className={editableFieldStyle}>
                    {editableBadge}
                    <label className="block text-[9px] text-slate-400 uppercase">Empresa / Razón Social:</label>
                    <input
                      type="text"
                      value={contratoData.arrendador_empresa}
                      onChange={(e) => setContratoData({ ...contratoData, arrendador_empresa: e.target.value })}
                      className="w-full font-bold text-slate-900 bg-transparent focus:outline-none"
                    />
                  </div>
                  <div className={editableFieldStyle}>
                    {editableBadge}
                    <label className="block text-[9px] text-slate-400 uppercase">Representante Legal y CI:</label>
                    <input
                      type="text"
                      value={contratoData.arrendador_representante}
                      onChange={(e) => setContratoData({ ...contratoData, arrendador_representante: e.target.value })}
                      className="w-full font-bold text-slate-900 bg-transparent focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Arrendatario Box */}
              <div className="space-y-1 pt-2">
                <p className="font-bold text-indigo-800">1.2. EL ARRENDATARIO (CLIENTE / ANUNCIANTE):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className={editableFieldStyle}>
                    {editableBadge}
                    <label className="block text-[9px] text-slate-400 uppercase">Cliente / Institución:</label>
                    <input
                      type="text"
                      value={contratoData.cliente_nombre}
                      onChange={(e) => setContratoData({ ...contratoData, cliente_nombre: e.target.value })}
                      className="w-full font-bold text-slate-900 bg-transparent focus:outline-none"
                    />
                  </div>
                  <div className={editableFieldStyle}>
                    {editableBadge}
                    <label className="block text-[9px] text-slate-400 uppercase">NIT / CI del Cliente:</label>
                    <input
                      type="text"
                      value={contratoData.cliente_nit_ci}
                      onChange={(e) => setContratoData({ ...contratoData, cliente_nit_ci: e.target.value })}
                      className="w-full font-bold text-slate-900 bg-transparent focus:outline-none"
                    />
                  </div>
                  <div className={editableFieldStyle}>
                    {editableBadge}
                    <label className="block text-[9px] text-slate-400 uppercase">Representante Legal Autorizado:</label>
                    <input
                      type="text"
                      value={contratoData.cliente_representante}
                      onChange={(e) => setContratoData({ ...contratoData, cliente_representante: e.target.value })}
                      className="w-full font-bold text-slate-900 bg-transparent focus:outline-none"
                    />
                  </div>
                  <div className={editableFieldStyle}>
                    {editableBadge}
                    <label className="block text-[9px] text-slate-400 uppercase">Poder Notarial / Notaría:</label>
                    <input
                      type="text"
                      value={`${contratoData.cliente_escritura_poder} - Notaría ${contratoData.cliente_notaria_numero}`}
                      onChange={(e) => setContratoData({ ...contratoData, cliente_escritura_poder: e.target.value })}
                      className="w-full font-bold text-slate-900 bg-transparent focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CLÁUSULA SEGUNDA: TABLA DE VALLAS Y CANON MENSUAL */}
            <div className="space-y-3 font-sans text-xs">
              <h3 className="font-black text-slate-900 uppercase text-[11px]">
                CLÁUSULA SEGUNDA (DEL OBJETO Y DETALLE DE VALLAS PUBLICITARIAS - TABLA 1):
              </h3>
              
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900 text-white text-[10px] uppercase">
                    <tr>
                      <th className="p-2">Ciudad</th>
                      <th className="p-2">Formato</th>
                      <th className="p-2">Ubicación / Avenida</th>
                      <th className="p-2 text-right">Costo Mensual (Bs.)</th>
                      <th className="p-2 text-right">Costo Neto (Bs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {contratoData.vallas_lista.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="p-2 font-bold">{item.ciudad}</td>
                        <td className="p-2">{item.formato}</td>
                        <td className="p-2 font-semibold">
                          <input
                            type="text"
                            value={item.direccion}
                            onChange={(e) => {
                              const updated = [...contratoData.vallas_lista];
                              updated[idx].direccion = e.target.value;
                              setContratoData({ ...contratoData, vallas_lista: updated });
                            }}
                            className="w-full bg-transparent border-b border-dashed border-amber-400 focus:outline-none"
                          />
                        </td>
                        <td className="p-2 text-right font-mono">Bs. {item.costo_mensual_bs.toLocaleString('es-BO')}</td>
                        <td className="p-2 text-right font-mono font-bold text-amber-800">Bs. {item.costo_neto_bs.toLocaleString('es-BO')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CLÁUSULA TERCERA: LONAS E IMPRESIÓN */}
            <div className="space-y-3 font-sans text-xs">
              <h3 className="font-black text-slate-900 uppercase text-[11px]">
                CLÁUSULA TERCERA (CONFECCIÓN E INSTALACIÓN DE LONAS - TABLA 2):
              </h3>
              
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-800 text-white text-[10px] uppercase">
                    <tr>
                      <th className="p-2">Ubicación de Valla</th>
                      <th className="p-2">Medidas (m)</th>
                      <th className="p-2 text-right">Costo Impresión (Bs.)</th>
                      <th className="p-2 text-right">Total Neto Lona (Bs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {contratoData.lonas_lista.map((lona, lidx) => (
                      <tr key={lona.id || lidx}>
                        <td className="p-2 font-semibold">{lona.direccion}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={lona.medidas}
                            onChange={(e) => {
                              const updated = [...contratoData.lonas_lista];
                              updated[lidx].medidas = e.target.value;
                              setContratoData({ ...contratoData, lonas_lista: updated });
                            }}
                            className="w-16 text-center font-bold bg-transparent border-b border-dashed border-amber-400 focus:outline-none"
                          />
                        </td>
                        <td className="p-2 text-right font-mono">Bs. {lona.costo_unitario_bs.toLocaleString('es-BO')}</td>
                        <td className="p-2 text-right font-mono font-bold text-amber-800">Bs. {lona.total_costo_bs.toLocaleString('es-BO')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CLÁUSULA CUARTA: VIGENCIA Y CRONOGRAMA */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans text-xs space-y-2">
              <h3 className="font-black text-slate-900 uppercase text-[11px]">
                CLÁUSULA CUARTA (DE LA VIGENCIA DEL CONTRATO):
              </h3>
              <p className="text-slate-700 leading-relaxed">
                El presente contrato tendrá una vigencia improrrogable de <strong>{contratoData.plazo_meses} meses calendario</strong>, 
                iniciando el día <strong>{contratoData.fecha_inicio}</strong> y concluyendo indefectiblemente el día <strong>{contratoData.fecha_fin}</strong>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className={editableFieldStyle}>
                  {editableBadge}
                  <label className="block text-[9px] text-slate-400 uppercase">Fecha Inicio:</label>
                  <input
                    type="date"
                    value={contratoData.fecha_inicio}
                    onChange={(e) => setContratoData({ ...contratoData, fecha_inicio: e.target.value })}
                    className="w-full font-bold text-slate-900 bg-transparent focus:outline-none"
                  />
                </div>
                <div className={editableFieldStyle}>
                  {editableBadge}
                  <label className="block text-[9px] text-slate-400 uppercase">Fecha Fin:</label>
                  <input
                    type="date"
                    value={contratoData.fecha_fin}
                    onChange={(e) => setContratoData({ ...contratoData, fecha_fin: e.target.value })}
                    className="w-full font-bold text-slate-900 bg-transparent focus:outline-none"
                  />
                </div>
                <div className={editableFieldStyle}>
                  {editableBadge}
                  <label className="block text-[9px] text-slate-400 uppercase">Plazo en Meses:</label>
                  <input
                    type="number"
                    value={contratoData.plazo_meses}
                    onChange={(e) => setContratoData({ ...contratoData, plazo_meses: Number(e.target.value) })}
                    className="w-full font-bold text-slate-900 bg-transparent focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* CLÁUSULAS ADICIONALES EDITABLES */}
            <div className="space-y-3 font-sans text-xs">
              <div className={editableFieldStyle}>
                {editableBadge}
                <label className="block font-black text-slate-900 uppercase text-[11px] mb-1">
                  CLÁUSULA QUINTA (ILUMINACIÓN NOCTURNA Y MANTENIMIENTO TÉCNICO):
                </label>
                <textarea
                  rows={2}
                  value={contratoData.clausula_iluminacion}
                  onChange={(e) => setContratoData({ ...contratoData, clausula_iluminacion: e.target.value })}
                  className="w-full bg-transparent text-xs text-slate-800 leading-relaxed focus:outline-none font-serif"
                />
              </div>

              <div className={editableFieldStyle}>
                {editableBadge}
                <label className="block font-black text-slate-900 uppercase text-[11px] mb-1">
                  CLÁUSULA SEXTA (CONCILIACIÓN Y ARBITRAJE):
                </label>
                <textarea
                  rows={2}
                  value={contratoData.clausula_jurisdiccion}
                  onChange={(e) => setContratoData({ ...contratoData, clausula_jurisdiccion: e.target.value })}
                  className="w-full bg-transparent text-xs text-slate-800 leading-relaxed focus:outline-none font-serif"
                />
              </div>
            </div>

            {/* FIRMAS LEGALES DEL CONTRATO */}
            <div className="pt-10 border-t-2 border-slate-300 font-sans grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-2">
                <div className="w-52 border-b-2 border-slate-400 mx-auto pb-1" />
                <p className="font-black text-slate-900">{contratoData.arrendador_representante}</p>
                <p className="text-[10px] text-slate-600 font-bold uppercase">{contratoData.arrendador_empresa}</p>
                <p className="text-[9px] text-slate-400">EL ARRENDADOR • C.I. {contratoData.arrendador_ci}</p>
              </div>

              <div className="space-y-2">
                <div className="w-52 border-b-2 border-slate-400 mx-auto pb-1" />
                <p className="font-black text-slate-900">{contratoData.cliente_representante}</p>
                <p className="text-[10px] text-slate-600 font-bold uppercase">{contratoData.cliente_nombre}</p>
                <p className="text-[9px] text-slate-400">EL ARRENDATARIO • Poder {contratoData.cliente_escritura_poder}</p>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: ACTA DE ENTREGA E INSTALACIÓN */}
        {/* ========================================================================= */}
        {activeDocType === 'ACTA_ENTREGA' && (
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl p-8 sm:p-12 space-y-6 text-slate-900 font-sans" id="printable-acta">
            
            <div className="flex justify-between items-start pb-4 border-b-2 border-slate-900">
              <Logo size="md" logoUrl={settings.logo} />
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-md">
                  {actaData.numero}
                </span>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">Depto. de Operaciones & Montaje</p>
              </div>
            </div>

            <div className="text-center space-y-1 py-2">
              <h2 className="text-base sm:text-lg font-black tracking-wide text-slate-900 uppercase">
                ACTA DE CONFORMIDAD Y ENTREGA DE ESPACIO PUBLICITARIO OOH
              </h2>
              <p className="text-xs text-slate-500">
                Certificación técnica de montaje de lona, encendido de iluminación LED y recepción a satisfacción.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={editableFieldStyle}>
                  {editableBadge}
                  <label className="block text-[9px] text-slate-500 uppercase font-bold">Cliente / Empresa:</label>
                  <input
                    type="text"
                    value={actaData.cliente_nombre}
                    onChange={(e) => setActaData({ ...actaData, cliente_nombre: e.target.value })}
                    className="w-full font-bold text-slate-900 bg-transparent focus:outline-none"
                  />
                </div>

                <div className={editableFieldStyle}>
                  {editableBadge}
                  <label className="block text-[9px] text-slate-500 uppercase font-bold">Fecha de Instalación:</label>
                  <input
                    type="date"
                    value={actaData.fecha_instalacion}
                    onChange={(e) => setActaData({ ...actaData, fecha_instalacion: e.target.value })}
                    className="w-full font-bold text-slate-900 bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              <div className={editableFieldStyle}>
                {editableBadge}
                <label className="block text-[9px] text-slate-500 uppercase font-bold">Ubicación y Dirección de la Valla:</label>
                <input
                  type="text"
                  value={actaData.valla_direccion}
                  onChange={(e) => setActaData({ ...actaData, valla_direccion: e.target.value })}
                  className="w-full font-bold text-slate-900 bg-transparent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={editableFieldStyle}>
                  {editableBadge}
                  <label className="block text-[9px] text-slate-500 uppercase font-bold">Estado del Tensado y Material:</label>
                  <input
                    type="text"
                    value={actaData.estado_lona}
                    onChange={(e) => setActaData({ ...actaData, estado_lona: e.target.value })}
                    className="w-full font-bold text-slate-900 bg-transparent focus:outline-none"
                  />
                </div>

                <div className={editableFieldStyle}>
                  {editableBadge}
                  <label className="block text-[9px] text-slate-500 uppercase font-bold">Sistema de Luminarias LED:</label>
                  <input
                    type="text"
                    value={actaData.luminarias_funcionando}
                    onChange={(e) => setActaData({ ...actaData, luminarias_funcionando: e.target.value })}
                    className="w-full font-bold text-slate-900 bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              <div className={editableFieldStyle}>
                {editableBadge}
                <label className="block text-[9px] text-slate-500 uppercase font-bold">Dictamen de Conformidad Técnica:</label>
                <input
                  type="text"
                  value={actaData.conformidad_cliente}
                  onChange={(e) => setActaData({ ...actaData, conformidad_cliente: e.target.value })}
                  className="w-full font-bold text-slate-900 bg-transparent focus:outline-none"
                />
              </div>
            </div>

            {/* Firmas Acta */}
            <div className="pt-10 border-t-2 border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-2">
                <div className="w-48 border-b-2 border-slate-400 mx-auto pb-1" />
                <div className={editableFieldStyle}>
                  {editableBadge}
                  <input
                    type="text"
                    value={actaData.responsable_montaje}
                    onChange={(e) => setActaData({ ...actaData, responsable_montaje: e.target.value })}
                    className="w-full text-center font-bold text-slate-900 bg-transparent focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Responsable de Montaje • PUBLI-X</p>
              </div>

              <div className="space-y-2">
                <div className="w-48 border-b-2 border-slate-400 mx-auto pb-1" />
                <p className="font-bold text-slate-900">{actaData.cliente_nombre}</p>
                <p className="text-[10px] text-slate-400">Firma de Recepción del Cliente / Agencia</p>
              </div>
            </div>

          </div>
        )}

      </div>

    {/* Auto Quotation Multi-Valla Generator Modal */}
    {showAutoGeneratorModal && (
      <AutoQuotationGeneratorModal
        clients={clients}
        vehicles={vehicles}
        settings={settings}
        currentUserNombre={currentUserNombre}
        onSaveQuotation={(quoteData) => {
          onSaveQuotation(quoteData as any);
          setShowAutoGeneratorModal(false);
          setSaveToast('¡Nueva cotización guardada exitosamente!');
          setTimeout(() => setSaveToast(''), 4000);
        }}
        onClose={() => setShowAutoGeneratorModal(false)}
      />
    )}

    </div>
  );
}
