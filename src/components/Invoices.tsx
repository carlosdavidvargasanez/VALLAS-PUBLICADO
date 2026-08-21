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
  X,
  Eye,
  FileSpreadsheet,
  HelpCircle,
  Printer
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

interface InvoiceVallaItem {
  id: string;
  ciudad: string;
  formato: string;
  direccion: string;
  medidas: string;
  costo_neto_bs: number;
}

interface InvoiceLonaItem {
  id: string;
  valla_id?: string;
  direccion: string;
  medidas: string;
  costo_unitario_bs: number;
  total_costo_bs: number;
  habilitado: boolean;
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

  // SIAT Libro de Ventas & Anulaciones
  const [showLcvModal, setShowLcvModal] = useState(false);
  const [lcvPeriodo, setLcvPeriodo] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [showAnnulModal, setShowAnnulModal] = useState(false);
  const [selectedInvoiceForAnnul, setSelectedInvoiceForAnnul] = useState<Invoice | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState<string>('1');
  const [obsAnulacion, setObsAnulacion] = useState<string>('Factura mal emitida con datos de cliente/monto erróneos.');

  // Form State for creating/editing invoice
  const [invoiceOrigin, setInvoiceOrigin] = useState<'CONTRATO_ARRENDAMIENTO' | 'COTIZACION_TECNICA' | 'VENTA_DIRECTA'>('CONTRATO_ARRENDAMIENTO');
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Invoice Sequence: 1ra Factura (Vallas + Lonas) vs 2da Factura+ (Solo Vallas, Lonas deshabilitadas por defecto)
  const [tipoFacturaSecuencia, setTipoFacturaSecuencia] = useState<'PRIMERA_FACTURA' | 'SEGUNDA_FACTURA_POSTERIOR'>('PRIMERA_FACTURA');

  // Editable invoice fields
  const [numeroFactura, setNumeroFactura] = useState<string>(`FAC-2026-${String(invoices.length + 1).padStart(4, '0')}`);
  const [razonSocial, setRazonSocial] = useState<string>('');
  const [nitCi, setNitCi] = useState<string>('');
  const [periodoFacturado, setPeriodoFacturado] = useState<string>('Mes de Julio 2026');
  const [concepto, setConcepto] = useState<string>('Alquiler de Espacio Publicitario OOH (Valla Unipolar)');

  // Tablas idénticas a Cotizaciones y Contratos
  const [vallasLista, setVallasLista] = useState<InvoiceVallaItem[]>([
    {
      id: '1',
      ciudad: 'Santa Cruz',
      formato: 'Valla Unipolar',
      direccion: 'Av. Cristo Redentor y 4to Anillo',
      medidas: '10.00 x 4.00 m',
      costo_neto_bs: 12980
    }
  ]);

  const [lonasLista, setLonasLista] = useState<InvoiceLonaItem[]>([
    {
      id: '1',
      valla_id: '1',
      direccion: 'Impresion de lona Vinilica 13 Oz.con Filtro Uv.e Instalacion',
      medidas: '10.00 x 4.00 m (40.00 m²)',
      costo_unitario_bs: 60,
      total_costo_bs: 2400,
      habilitado: true
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
        (inv.cliente_razon_social && inv.cliente_razon_social.toLowerCase().includes(term)) ||
        (inv.cliente_nit_ci && inv.cliente_nit_ci.toLowerCase().includes(term));
      return matchStatus && matchTerm;
    });
  }, [invoices, statusFilter, searchTerm]);

  // LCV Filtered Invoices by selected month/year
  const lcvInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (!lcvPeriodo) return true;
      return inv.fecha_emision.startsWith(lcvPeriodo);
    });
  }, [invoices, lcvPeriodo]);

  const lcvTotals = useMemo(() => {
    let totalVentas = 0;
    let totalBaseFiscal = 0;
    let totalDebitoFiscal = 0;
    let totalAnuladas = 0;
    let totalValidas = 0;

    lcvInvoices.forEach(inv => {
      const isAnulada = inv.estado === 'Anulada';
      if (isAnulada) {
        totalAnuladas += 1;
      } else {
        totalValidas += 1;
        const total = inv.total_bs;
        const desc = inv.descuento_total_bs || 0;
        const base = total - desc;
        totalVentas += total;
        totalBaseFiscal += base;
        totalDebitoFiscal += base * 0.13;
      }
    });

    return {
      totalVentas,
      totalBaseFiscal,
      totalDebitoFiscal,
      totalAnuladas,
      totalValidas,
      totalCount: lcvInvoices.length
    };
  }, [lcvInvoices]);

  // Export SIAT LCV (CSV compatible with SIAT / Facilito / RCV)
  const handleExportSiatLcv = () => {
    const headers = [
      'Nro',
      'Fecha de la Factura',
      'Nro. de la Factura',
      'Nro. de Autorizacion/CUF',
      'NIT / CI Cliente',
      'Complemento',
      'Razon Social / Nombre del Comprador',
      'Importe Total de la Venta',
      'Importe ICE',
      'Importe IEHD',
      'Importe IPJ',
      'Tasas',
      'Otros No Sujetos al IVA',
      'Exportaciones y Operaciones Exentas',
      'Ventas Gravadas a Tasa Cero',
      'Subtotal',
      'Descuentos Bonificaciones Rebajas Otorgadas',
      'Importe Gift Card',
      'Importe Base para Debito Fiscal',
      'Debito Fiscal',
      'Estado',
      'Codigo de Control',
      'Tipo de Venta'
    ];

    const rows = lcvInvoices.map((inv, idx) => {
      const isAnulada = inv.estado === 'Anulada';
      const total = inv.total_bs;
      const desc = inv.descuento_total_bs || 0;
      const baseFiscal = isAnulada ? 0 : (total - desc);
      const debitoFiscal = isAnulada ? 0 : Number((baseFiscal * 0.13).toFixed(2));
      const estadoLetra = isAnulada ? 'A' : 'V';
      const codControl = (inv.codigo_autorizacion_sin || '4A8F93B27C10E').slice(0, 8);

      return [
        idx + 1,
        inv.fecha_emision,
        inv.numero_factura,
        inv.codigo_autorizacion_sin || '4A8F93B27C10E',
        inv.cliente_nit_ci,
        '',
        `"${(inv.cliente_razon_social || inv.cliente_nombre).replace(/"/g, '""')}"`,
        total.toFixed(2),
        '0.00',
        '0.00',
        '0.00',
        '0.00',
        '0.00',
        '0.00',
        '0.00',
        total.toFixed(2),
        desc.toFixed(2),
        '0.00',
        baseFiscal.toFixed(2),
        debitoFiscal.toFixed(2),
        estadoLetra,
        codControl,
        '0'
      ].join(';');
    });

    const csvContent = [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Libro_Ventas_IVA_SIAT_${lcvPeriodo || 'General'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setFeedbackMsg({ type: 'success', text: `Libro de Ventas IVA exportado exitosamente (${lcvInvoices.length} facturas).` });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Confirm Annulment
  const handleConfirmAnnulInvoice = () => {
    if (!selectedInvoiceForAnnul) return;
    const motivoDesc = 
      motivoAnulacion === '1' ? '1: Factura mal emitida (Datos erróneos)' :
      motivoAnulacion === '2' ? '2: Nota de crédito / Rescisión de contrato' :
      motivoAnulacion === '3' ? '3: Datos de transacción incorrectos' :
      '4: Duplicidad de emisión de factura';

    onUpdateInvoice(selectedInvoiceForAnnul.id, {
      estado: 'Anulada',
      observaciones: `${selectedInvoiceForAnnul.observaciones ? selectedInvoiceForAnnul.observaciones + ' | ' : ''}ANULADA SIAT [${motivoDesc}] - Obs: ${obsAnulacion} (Por: ${currentUser.nombre} el ${new Date().toLocaleDateString('es-BO')})`
    });

    setFeedbackMsg({ type: 'success', text: `Factura ${selectedInvoiceForAnnul.numero_factura} anulada oficialmente bajo normativa SIAT.` });
    setShowAnnulModal(false);
    setSelectedInvoiceForAnnul(null);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Handle invoice sequence change
  const handleSequenceChange = (mode: 'PRIMERA_FACTURA' | 'SEGUNDA_FACTURA_POSTERIOR') => {
    setTipoFacturaSecuencia(mode);
    if (mode === 'PRIMERA_FACTURA') {
      // Enable all lonas by default
      setLonasLista(prev => prev.map(l => ({ ...l, habilitado: true })));
    } else {
      // Disable all lonas by default for subsequent invoices (can be enabled 1 by 1)
      setLonasLista(prev => prev.map(l => ({ ...l, habilitado: false })));
    }
  };

  // Toggle individual lona
  const handleToggleLona = (id: string) => {
    setLonasLista(prev => prev.map(l => l.id === id ? { ...l, habilitado: !l.habilitado } : l));
  };

  // Handle source contract selection
  const handleSelectContract = (contractId: string) => {
    setSelectedContractId(contractId);
    const c = contracts.find(item => item.id === contractId);
    if (c) {
      setSelectedClientId(c.cliente_id);
      setRazonSocial(c.cliente_empresa || c.cliente_nombre);
      setNitCi(c.cliente_nit_ci || '');
      setConcepto(`Canon de Arrendamiento según Contrato N° ${c.numero} - ${c.valla_nombre}`);

      if (c.vallas_lista && c.vallas_lista.length > 0) {
        const vItems: InvoiceVallaItem[] = c.vallas_lista.map((v, i) => ({
          id: v.id || String(i + 1),
          ciudad: v.ciudad || 'Santa Cruz',
          formato: v.formato || 'Valla Unipolar',
          direccion: v.direccion || v.ciudad,
          medidas: v.medidas || '10.00 x 4.00 m',
          costo_neto_bs: Number(v.costo_neto_bs || v.costo_mensual_bs || 0)
        }));
        setVallasLista(vItems);

        if (c.lonas_lista && c.lonas_lista.length > 0) {
          const lItems: InvoiceLonaItem[] = c.lonas_lista.map((l, i) => ({
            id: l.id || String(i + 1),
            valla_id: l.valla_id || vItems[i]?.id,
            direccion: 'Impresion de lona Vinilica 13 Oz.con Filtro Uv.e Instalacion',
            medidas: l.medidas || vItems[i]?.medidas || '10.00 x 4.00 m (40.00 m²)',
            costo_unitario_bs: Number(l.costo_unitario_bs || 60),
            total_costo_bs: Number(l.total_costo_bs || 2400),
            habilitado: tipoFacturaSecuencia === 'PRIMERA_FACTURA'
          }));
          setLonasLista(lItems);
        } else {
          // Derive lonas from vallas
          const lItems: InvoiceLonaItem[] = vItems.map((v, i) => {
            const dims = v.medidas.toLowerCase().replace(/m/g, '').split('x').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
            const area = (dims.length >= 2) ? dims[0] * dims[1] : 40;
            const unit = 60;
            const total = Math.round(area * unit);
            return {
              id: `L-${i + 1}`,
              valla_id: v.id,
              direccion: 'Impresion de lona Vinilica 13 Oz.con Filtro Uv.e Instalacion',
              medidas: `${v.medidas} (${area.toFixed(2)} m²)`,
              costo_unitario_bs: unit,
              total_costo_bs: total,
              habilitado: tipoFacturaSecuencia === 'PRIMERA_FACTURA'
            };
          });
          setLonasLista(lItems);
        }
      } else {
        const vallasTotalBs = Math.round(c.total_neto_usd * exchangeRate);
        setVallasLista([
          {
            id: '1',
            ciudad: c.valla_ciudad || 'Santa Cruz',
            formato: c.valla_tipo || 'Valla Unipolar',
            direccion: c.valla_nombre || 'Ubicación Principal OOH',
            medidas: '10.00 x 4.00 m',
            costo_neto_bs: vallasTotalBs
          }
        ]);
        setLonasLista([
          {
            id: '1',
            valla_id: '1',
            direccion: 'Impresion de lona Vinilica 13 Oz.con Filtro Uv.e Instalacion',
            medidas: '10.00 x 4.00 m (40.00 m²)',
            costo_unitario_bs: 60,
            total_costo_bs: 2400,
            habilitado: tipoFacturaSecuencia === 'PRIMERA_FACTURA'
          }
        ]);
      }
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

      if (q.vallas_seleccionadas && q.vallas_seleccionadas.length > 0) {
        const vItems: InvoiceVallaItem[] = q.vallas_seleccionadas.map((v, i) => {
          const netoBob = Math.round((v.precio_alquiler_usd - (v.descuento_mensual_usd || 0)) * exchangeRate);
          return {
            id: v.vehiculo_id || String(i + 1),
            ciudad: v.valla_ciudad || 'Santa Cruz',
            formato: 'Valla Unipolar',
            direccion: v.valla_nombre || v.valla_avenida || 'Espacio Publicitario',
            medidas: v.valla_medidas || '10.00 x 4.00 m',
            costo_neto_bs: netoBob
          };
        });
        setVallasLista(vItems);

        const lItems: InvoiceLonaItem[] = vItems.map((v, i) => {
          const dims = v.medidas.toLowerCase().replace(/m/g, '').split('x').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
          const area = (dims.length >= 2) ? dims[0] * dims[1] : 40;
          const unit = 60;
          const total = Math.round(area * unit);
          return {
            id: `L-${i + 1}`,
            valla_id: v.id,
            direccion: 'Impresion de lona Vinilica 13 Oz.con Filtro Uv.e Instalacion',
            medidas: `${v.medidas} (${area.toFixed(2)} m²)`,
            costo_unitario_bs: unit,
            total_costo_bs: total,
            habilitado: tipoFacturaSecuencia === 'PRIMERA_FACTURA'
          };
        });
        setLonasLista(lItems);
      } else {
        const totalBob = Math.round(q.total * exchangeRate);
        setVallasLista([
          {
            id: '1',
            ciudad: 'Santa Cruz',
            formato: 'Valla Unipolar',
            direccion: q.referencia_asunto || 'Espacio Publicitario OOH',
            medidas: '10.00 x 4.00 m',
            costo_neto_bs: totalBob
          }
        ]);
        setLonasLista([
          {
            id: '1',
            valla_id: '1',
            direccion: 'Impresion de lona Vinilica 13 Oz.con Filtro Uv.e Instalacion',
            medidas: '10.00 x 4.00 m (40.00 m²)',
            costo_unitario_bs: 60,
            total_costo_bs: 2400,
            habilitado: tipoFacturaSecuencia === 'PRIMERA_FACTURA'
          }
        ]);
      }
    }
  };

  // Row handlers for Vallas
  const handleAddVallaRow = () => {
    setVallasLista(prev => [
      ...prev,
      {
        id: 'V-' + Date.now(),
        ciudad: 'Santa Cruz',
        formato: 'Valla Unipolar',
        direccion: 'Nueva Ubicación Valla Publicitaria',
        medidas: '10.00 x 4.00 m',
        costo_neto_bs: 6000
      }
    ]);
  };

  const handleUpdateVallaRow = (id: string, field: keyof InvoiceVallaItem, value: any) => {
    setVallasLista(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleDeleteVallaRow = (id: string) => {
    setVallasLista(prev => prev.filter(v => v.id !== id));
  };

  // Row handlers for Lonas
  const handleAddLonaRow = () => {
    setLonasLista(prev => [
      ...prev,
      {
        id: 'L-' + Date.now(),
        direccion: 'Impresion de lona Vinilica 13 Oz.con Filtro Uv.e Instalacion',
        medidas: '10.00 x 4.00 m (40.00 m²)',
        costo_unitario_bs: 60,
        total_costo_bs: 2400,
        habilitado: true
      }
    ]);
  };

  const handleUpdateLonaRow = (id: string, field: keyof InvoiceLonaItem, value: any) => {
    setLonasLista(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const handleDeleteLonaRow = (id: string) => {
    setLonasLista(prev => prev.filter(l => l.id !== id));
  };

  // Real-time calculations matching tables
  const totalVallasBs = vallasLista.reduce((acc, curr) => acc + (Number(curr.costo_neto_bs) || 0), 0);
  const lonasHabilitadas = lonasLista.filter(l => l.habilitado);
  const totalLonasHabilitadasBs = lonasHabilitadas.reduce((acc, curr) => acc + (Number(curr.total_costo_bs) || 0), 0);
  const subtotalBs = totalVallasBs + totalLonasHabilitadasBs;
  const totalNetoBs = subtotalBs;
  const totalLiteral = numeroALetrasBolivianos(totalNetoBs);

  // Save new invoice
  const handleSaveInvoice = () => {
    if (!razonSocial.trim() || !nitCi.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Por favor complete la Razón Social y el NIT/CI del cliente.' });
      return;
    }
    if (vallasLista.length === 0 || totalNetoBs <= 0) {
      setFeedbackMsg({ type: 'error', text: 'La factura debe tener al menos un ítem de espacio/valla con monto válido.' });
      return;
    }

    const client = clients.find(c => c.id === selectedClientId) || {
      id: 'C_MANUAL',
      nombre: razonSocial,
      celular: '',
      correo: '',
      ciudad: 'Santa Cruz'
    };

    const vallaItems: InvoiceItem[] = vallasLista.map((v, i) => ({
      id: `V-${i + 1}`,
      codigo: `OOH-VALLA-${String(i + 1).padStart(2, '0')}`,
      descripcion: `Alquiler de Espacio Publicitario OOH: ${v.ciudad} - ${v.direccion} (${v.formato || 'Valla Unipolar'}) - Medidas: ${v.medidas}`,
      medida_unidad: 'MES',
      cantidad: 1,
      precio_unitario_bs: Number(v.costo_neto_bs) || 0,
      descuento_bs: 0,
      subtotal_bs: Number(v.costo_neto_bs) || 0
    }));

    const lonaItems: InvoiceItem[] = lonasHabilitadas.map((l, i) => ({
      id: `L-${i + 1}`,
      codigo: `PROD-LONA-${String(i + 1).padStart(2, '0')}`,
      descripcion: `${l.direccion} [${l.medidas}]`,
      medida_unidad: 'GLB',
      cantidad: 1,
      precio_unitario_bs: Number(l.total_costo_bs) || 0,
      descuento_bs: 0,
      subtotal_bs: Number(l.total_costo_bs) || 0
    }));

    const compiledItems: InvoiceItem[] = [...vallaItems, ...lonaItems];

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
      items: compiledItems,
      subtotal_bs: subtotalBs,
      descuento_total_bs: 0,
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

  // Reusable WhatsApp Tab Handler to avoid duplicate tabs & send payment receipt/reminder
  const handleSendWhatsApp = (inv: Invoice) => {
    const phone = (inv.cliente_celular || '').replace(/[^\d]/g, '');
    const targetPhone = phone.startsWith('591') ? phone : (phone ? `591${phone}` : '');
    
    let msg = '';
    if (inv.estado === 'Pagada') {
      msg = `*PUBLI-X PUBLICIDAD EXTERIOR OOH* 📢\n` +
        `*COMPROBANTE DE PAGO / FACTURA CANCELADA*\n\n` +
        `Estimados *${inv.cliente_razon_social || inv.cliente_nombre}*,\n\n` +
        `Confirmamos con éxito la recepción del pago correspondiente a su *Factura Fiscal N° ${inv.numero_factura}*:\n\n` +
        `📄 *Detalle:* ${inv.periodo_facturado || 'Alquiler de Espacios Publicitarios OOH'}\n` +
        `💰 *Monto Cancelado:* Bs. ${inv.total_bs.toLocaleString('es-BO', { minimumFractionDigits: 2 })} (${inv.total_literal_bs || ''})\n` +
        `🛡️ *NIT / CI:* ${inv.cliente_nit_ci}\n` +
        `✅ *Estado de Cuenta:* TOTALMENTE PAGADO / AL DÍA\n\n` +
        `¡Muchas gracias por su puntualidad y por confiar en PUBLI-X para su cobertura publicitaria!`;
    } else {
      msg = `*PUBLI-X PUBLICIDAD EXTERIOR OOH* 📢\n` +
        `*RECORDATORIO DE PAGO / FACTURA FISCAL*\n\n` +
        `Estimados *${inv.cliente_razon_social || inv.cliente_nombre}*,\n\n` +
        `Le saludamos cordialmente. Adjuntamos la información de su *Factura Fiscal N° ${inv.numero_factura}* pendiente de pago:\n\n` +
        `📄 *Concepto:* ${inv.periodo_facturado || 'Arrendamiento de Espacios OOH'}\n` +
        `💰 *Total Facturado:* Bs. ${inv.total_bs.toLocaleString('es-BO', { minimumFractionDigits: 2 })}\n` +
        `📅 *Fecha de Emisión:* ${inv.fecha_emision}\n` +
        `🛡️ *NIT / CI:* ${inv.cliente_nit_ci}\n` +
        `⚡ *Estado:* Pendiente de Cobro (${inv.estado})\n\n` +
        `Agradecemos coordinar la cancelación mediante transferencia o cheque para la emisión de su recibo oficial.`;
    }
    
    const url = targetPhone ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(msg)}` : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, 'publix_whatsapp_tab');
    setFeedbackMsg({ type: 'success', text: `Abriendo WhatsApp Web para Factura ${inv.numero_factura} (reutilizando pestaña)` });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Quick mark invoice as paid with automatic WhatsApp notification trigger
  const handleQuickMarkPaid = (inv: Invoice) => {
    onUpdateInvoice(inv.id, { estado: 'Pagada' });
    setFeedbackMsg({ type: 'success', text: `Factura ${inv.numero_factura} marcada como PAGADA.` });
    setTimeout(() => setFeedbackMsg(null), 4000);
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLcvModal(true)}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>Libro de Ventas SIAT</span>
          </button>

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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Facturado</span>
          <span className="text-xl font-black text-slate-900 font-mono mt-1 block">
            Bs. {invoices.filter(i => i.estado !== 'Anulada').reduce((acc, curr) => acc + curr.total_bs, 0).toLocaleString('es-BO')}
          </span>
          <span className="text-[10px] text-slate-500">{invoices.filter(i => i.estado !== 'Anulada').length} Facturas Válidas</span>
        </div>

        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Cobrado / Pagado</span>
          <span className="text-xl font-black text-emerald-700 font-mono mt-1 block">
            Bs. {invoices.filter(i => i.estado === 'Pagada').reduce((acc, curr) => acc + curr.total_bs, 0).toLocaleString('es-BO')}
          </span>
          <span className="text-[10px] text-emerald-600 font-medium">
            {invoices.filter(i => i.estado === 'Pagada').length} Facturas al día
          </span>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Por Cobrar (Pendiente)</span>
          <span className="text-xl font-black text-amber-700 font-mono mt-1 block">
            Bs. {invoices.filter(i => i.estado !== 'Pagada' && i.estado !== 'Anulada').reduce((acc, curr) => acc + curr.total_bs, 0).toLocaleString('es-BO')}
          </span>
          <span className="text-[10px] text-amber-600 font-medium">
            {invoices.filter(i => i.estado !== 'Pagada' && i.estado !== 'Anulada').length} Facturas por cobrar
          </span>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-2xs text-white">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Exportación Contable</span>
          <button
            onClick={handleExportSiatLcv}
            className="mt-2 w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Descargar Libro CSV</span>
          </button>
        </div>
      </div>

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
                          onClick={() => setSelectedInvoiceForPreview(inv)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Ver Factura en Pantalla"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(inv)}
                          className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                          title="Descargar PDF Fiscal Oficial"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSendWhatsApp(inv)}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            inv.estado === 'Pagada' 
                              ? 'text-emerald-600 hover:bg-emerald-50' 
                              : 'text-amber-600 hover:bg-amber-50'
                          }`}
                          title={inv.estado === 'Pagada' ? 'Enviar Comprobante de Cancelación por WA' : 'Enviar Recordatorio de Cobro por WA'}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        {inv.estado !== 'Pagada' && inv.estado !== 'Anulada' && (
                          <button
                            onClick={() => handleQuickMarkPaid(inv)}
                            className="p-1.5 text-emerald-600 hover:text-white hover:bg-emerald-500 rounded-lg transition cursor-pointer"
                            title="Registrar Cobro / Marcar como Pagada"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {inv.estado !== 'Anulada' ? (
                          <button
                            onClick={() => {
                              setSelectedInvoiceForAnnul(inv);
                              setShowAnnulModal(true);
                            }}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Anulación Fiscal SIAT (RND)"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="p-1.5 text-slate-300" title="Factura ya anulada">
                            <XCircle className="w-4 h-4" />
                          </span>
                        )}
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
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Eliminar Registro"
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

                {/* 3. Selección de Tipo / Secuencia de Factura */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 rounded-2xl text-white space-y-3 border border-slate-700">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                        3. Secuencia de Facturación & Cobro de Lonas
                      </span>
                      <h4 className="text-xs font-bold text-slate-200">
                        Configuración de Emisión para Vallas y Lonas
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleSequenceChange('PRIMERA_FACTURA')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center space-x-1.5 ${
                          tipoFacturaSecuencia === 'PRIMERA_FACTURA'
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>1ra Factura (Vallas + Lonas)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSequenceChange('SEGUNDA_FACTURA_POSTERIOR')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center space-x-1.5 ${
                          tipoFacturaSecuencia === 'SEGUNDA_FACTURA_POSTERIOR'
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>2da Factura+ (Solo Vallas)</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {tipoFacturaSecuencia === 'PRIMERA_FACTURA'
                      ? '✅ Primera Factura: Se cobra el alquiler de vallas junto con la confección e instalación de lonas vinílicas.'
                      : 'ℹ️ 2da Factura y sucesivas: Las lonas están deshabilitadas por defecto (ya no se cobran). Puede habilitar una por una solo aquellas lonas que se vayan a reimprimir.'}
                  </p>
                </div>

                {/* 4. Tabla 1: ALQUILER DE VALLAS PUBLICITARIAS (ESPACIOS OOH) */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-extrabold uppercase text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-amber-600" />
                        <span>1. Detalle de Espacios Publicitarios (Alquiler Mensual)</span>
                      </span>
                      <p className="text-[10px] text-slate-500">Coincide exactamente con la cotización o contrato seleccionado.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddVallaRow}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg text-[11px] flex items-center gap-1 border border-amber-200 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar Valla</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/80 text-slate-700 text-[10px] uppercase font-bold">
                          <th className="p-2 w-8 text-center">#</th>
                          <th className="p-2 w-24">Ciudad</th>
                          <th className="p-2 w-28">Formato</th>
                          <th className="p-2">Ubicación / Dirección</th>
                          <th className="p-2 w-28">Medidas</th>
                          <th className="p-2 w-32 text-right">Canon Mensual (Bs)</th>
                          <th className="p-2 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {vallasLista.map((v, idx) => (
                          <tr key={v.id || idx} className="hover:bg-slate-50">
                            <td className="p-2 text-center font-bold text-slate-400 text-[11px]">{idx + 1}</td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={v.ciudad}
                                onChange={(e) => handleUpdateVallaRow(v.id, 'ciudad', e.target.value)}
                                className="w-full px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={v.formato}
                                onChange={(e) => handleUpdateVallaRow(v.id, 'formato', e.target.value)}
                                className="w-full px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={v.direccion}
                                onChange={(e) => handleUpdateVallaRow(v.id, 'direccion', e.target.value)}
                                className="w-full px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={v.medidas}
                                onChange={(e) => handleUpdateVallaRow(v.id, 'medidas', e.target.value)}
                                className="w-full px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-center"
                              />
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                min="0"
                                value={v.costo_neto_bs}
                                onChange={(e) => handleUpdateVallaRow(v.id, 'costo_neto_bs', Number(e.target.value) || 0)}
                                className="w-full px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-right font-mono font-bold"
                              />
                            </td>
                            <td className="p-2 text-center">
                              {vallasLista.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVallaRow(v.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                  title="Eliminar fila"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-200">
                          <td colSpan={5} className="p-2 text-right uppercase text-[10px] tracking-wider">
                            Subtotal Alquiler Vallas:
                          </td>
                          <td className="p-2 text-right font-mono text-xs text-amber-700">
                            Bs. {totalVallasBs.toLocaleString('es-BO')}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* 5. Tabla 2: IMPRESIÓN Y MONTAJE DE LONAS VINÍLICAS */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-extrabold uppercase text-slate-800">
                          2. Impresion de lona Vinilica 13 Oz.con Filtro Uv.e Instalacion
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          lonasHabilitadas.length > 0
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {lonasHabilitadas.length} de {lonasLista.length} Habilitadas
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Habilite individualmente cada lona que requiera ser cobrada / reimpresa en esta factura.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLonasLista(prev => prev.map(l => ({ ...l, habilitado: true })))}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[10px] border border-emerald-200 transition cursor-pointer"
                      >
                        ✓ Habilitar Todas
                      </button>
                      <button
                        type="button"
                        onClick={() => setLonasLista(prev => prev.map(l => ({ ...l, habilitado: false })))}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] border border-slate-200 transition cursor-pointer"
                      >
                        ✕ Deshabilitar Todas
                      </button>
                      <button
                        type="button"
                        onClick={handleAddLonaRow}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg text-[10px] border border-amber-200 transition cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Agregar Lona</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/80 text-slate-700 text-[10px] uppercase font-bold">
                          <th className="p-2 w-28 text-center">Cobrar Lona</th>
                          <th className="p-2">Descripción / Ubicación</th>
                          <th className="p-2 w-36">Medidas (m²)</th>
                          <th className="p-2 w-24 text-right">P. Unit (Bs)</th>
                          <th className="p-2 w-28 text-right">Total Lona (Bs)</th>
                          <th className="p-2 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {lonasLista.map((l, idx) => (
                          <tr 
                            key={l.id || idx} 
                            className={`transition ${
                              l.habilitado 
                                ? 'bg-amber-50/40 hover:bg-amber-50/80' 
                                : 'bg-slate-50/50 hover:bg-slate-50 text-slate-400'
                            }`}
                          >
                            <td className="p-2 text-center">
                              <label className="inline-flex items-center space-x-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={l.habilitado}
                                  onChange={() => handleToggleLona(l.id)}
                                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                                />
                                <span className={`text-[10px] font-extrabold ${l.habilitado ? 'text-amber-900' : 'text-slate-400'}`}>
                                  {l.habilitado ? 'COBRAR' : 'DESHABILITADA'}
                                </span>
                              </label>
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={l.direccion}
                                onChange={(e) => handleUpdateLonaRow(l.id, 'direccion', e.target.value)}
                                className={`w-full px-1.5 py-1 border rounded text-xs ${
                                  l.habilitado ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-100 border-slate-200 text-slate-400'
                                }`}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={l.medidas}
                                onChange={(e) => handleUpdateLonaRow(l.id, 'medidas', e.target.value)}
                                className={`w-full px-1.5 py-1 border rounded text-xs text-center ${
                                  l.habilitado ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-100 border-slate-200 text-slate-400'
                                }`}
                              />
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                min="0"
                                value={l.costo_unitario_bs}
                                onChange={(e) => {
                                  const cu = Number(e.target.value) || 0;
                                  handleUpdateLonaRow(l.id, 'costo_unitario_bs', cu);
                                }}
                                className={`w-full px-1.5 py-1 border rounded text-xs text-right font-mono ${
                                  l.habilitado ? 'bg-white border-slate-200 text-slate-900 font-bold' : 'bg-slate-100 border-slate-200 text-slate-400'
                                }`}
                              />
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                min="0"
                                value={l.total_costo_bs}
                                onChange={(e) => handleUpdateLonaRow(l.id, 'total_costo_bs', Number(e.target.value) || 0)}
                                className={`w-full px-1.5 py-1 border rounded text-xs text-right font-mono ${
                                  l.habilitado ? 'bg-white border-slate-200 text-amber-700 font-bold' : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                                }`}
                              />
                            </td>
                            <td className="p-2 text-center">
                              {lonasLista.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLonaRow(l.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                  title="Eliminar fila"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-200">
                          <td colSpan={4} className="p-2 text-right uppercase text-[10px] tracking-wider">
                            Subtotal Lonas Habilitadas ({lonasHabilitadas.length} cobradas):
                          </td>
                          <td className="p-2 text-right font-mono text-xs text-amber-700">
                            Bs. {totalLonasHabilitadasBs.toLocaleString('es-BO')}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* 6. Literal Amount in Words & Totals */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3 border border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-3 border-b border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">1. Alquiler Vallas:</span>
                      <span className="font-mono font-bold text-slate-200">Bs. {totalVallasBs.toLocaleString('es-BO')}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">2. Lonas Habilitadas:</span>
                      <span className="font-mono font-bold text-emerald-400">Bs. {totalLonasHabilitadasBs.toLocaleString('es-BO')} ({lonasHabilitadas.length} ítems)</span>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Tipo de Cambio:</span>
                      <span className="font-mono text-slate-300">Bs. {exchangeRate.toFixed(2)} por $1 USD</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">SON (Monto Literal en Español Oficial):</span>
                    <span className="text-amber-400 font-bold font-mono text-right">{totalLiteral}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-800">
                    <span className="font-bold uppercase tracking-wider text-slate-100">TOTAL FACTURA:</span>
                    <span className="text-2xl font-black text-amber-400 font-mono">
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

      {/* Modal: Libro de Ventas IVA (SIAT / RCV) */}
      <AnimatePresence>
        {showLcvModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full overflow-hidden flex flex-col my-auto max-h-[92vh]"
            >
              {/* Header */}
              <div className="bg-slate-900 text-white p-4 sm:px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="bg-amber-500/20 p-2 rounded-xl border border-amber-500/30">
                    <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black font-display text-white">
                      Libro de Ventas IVA (SIAT / RCV Bolivia)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Registro de Compras y Ventas (RCV) • RND N° 102100000011 • Impuestos Nacionales
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLcvModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
                {/* Filter & Actions Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <label className="text-xs font-bold text-slate-700">Periodo Fiscal:</label>
                    <input
                      type="month"
                      value={lcvPeriodo}
                      onChange={(e) => setLcvPeriodo(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={handleExportSiatLcv}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow-xs transition cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Exportar CSV (Formato SIAT)</span>
                    </button>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Ventas Facturadas</span>
                    <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                      Bs. {lcvTotals.totalVentas.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{lcvTotals.totalValidas} facturas válidas</span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Base Débito Fiscal</span>
                    <span className="text-base sm:text-lg font-black text-blue-600 font-mono">
                      Bs. {lcvTotals.totalBaseFiscal.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Importe neto gravado</span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Débito Fiscal IVA (13%)</span>
                    <span className="text-base sm:text-lg font-black text-amber-600 font-mono">
                      Bs. {lcvTotals.totalDebitoFiscal.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-amber-700 block mt-0.5">A favor del Fisco SIN</span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Facturas Anuladas</span>
                    <span className="text-base sm:text-lg font-black text-rose-600 font-mono">
                      {lcvTotals.totalAnuladas}
                    </span>
                    <span className="text-[10px] text-rose-700 block mt-0.5">Débito fiscal = Bs. 0.00</span>
                  </div>
                </div>

                {/* Table */}
                <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="p-2.5">N°</th>
                        <th className="p-2.5">Fecha</th>
                        <th className="p-2.5">N° Factura</th>
                        <th className="p-2.5">NIT / CI</th>
                        <th className="p-2.5">Cliente / Razón Social</th>
                        <th className="p-2.5 text-right">Total Venta</th>
                        <th className="p-2.5 text-right">Base Fiscal</th>
                        <th className="p-2.5 text-right">IVA 13%</th>
                        <th className="p-2.5 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lcvInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400">
                            No hay facturas registradas en el periodo fiscal seleccionado.
                          </td>
                        </tr>
                      ) : (
                        lcvInvoices.map((inv, idx) => {
                          const isAnulada = inv.estado === 'Anulada';
                          const base = isAnulada ? 0 : inv.total_bs;
                          const debito = isAnulada ? 0 : base * 0.13;
                          return (
                            <tr key={inv.id} className={isAnulada ? 'bg-rose-50/50 text-rose-800' : 'hover:bg-slate-50'}>
                              <td className="p-2.5 font-mono">{idx + 1}</td>
                              <td className="p-2.5 font-mono">{inv.fecha_emision}</td>
                              <td className="p-2.5 font-bold font-mono">{inv.numero_factura}</td>
                              <td className="p-2.5 font-mono">{inv.cliente_nit_ci}</td>
                              <td className="p-2.5 font-medium">{inv.cliente_razon_social || inv.cliente_nombre}</td>
                              <td className="p-2.5 text-right font-mono">Bs. {inv.total_bs.toFixed(2)}</td>
                              <td className="p-2.5 text-right font-mono font-bold">Bs. {base.toFixed(2)}</td>
                              <td className="p-2.5 text-right font-mono text-amber-700 font-bold">Bs. {debito.toFixed(2)}</td>
                              <td className="p-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isAnulada ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {isAnulada ? 'A (Anulada)' : 'V (Válida)'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
                <span className="text-xs text-slate-500">
                  {lcvInvoices.length} facturas filtradas para exportación SIAT
                </span>
                <button
                  type="button"
                  onClick={() => setShowLcvModal(false)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Anulación Fiscal SIAT */}
      <AnimatePresence>
        {showAnnulModal && selectedInvoiceForAnnul && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col my-auto"
            >
              {/* Header */}
              <div className="bg-rose-900 text-white p-4 sm:px-6 flex items-center justify-between border-b border-rose-950 shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <XCircle className="w-5 h-5 text-rose-200" />
                  </div>
                  <div>
                    <h3 className="text-base font-black font-display text-white">
                      Anulación Fiscal SIAT (Bolivia)
                    </h3>
                    <p className="text-xs text-rose-200">
                      Factura N° {selectedInvoiceForAnnul.numero_factura}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAnnulModal(false);
                    setSelectedInvoiceForAnnul(null);
                  }}
                  className="p-1.5 text-rose-200 hover:text-white rounded-lg hover:bg-rose-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 text-xs">
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-rose-900">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    Advertencia de Cumplimiento Tributario SIN
                  </p>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    La anulación registrará el estado <strong>'A' (Anulada)</strong> en el Libro de Ventas IVA. Esta operación es irrevocable y generará una marca de agua <strong>ANULADA</strong> en el PDF fiscal.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    Motivo de Anulación (Normativa SIN RND 102100000011):
                  </label>
                  <select
                    value={motivoAnulacion}
                    onChange={(e) => setMotivoAnulacion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="1">1 - Factura mal emitida (Datos incorrectos de cliente / NIT)</option>
                    <option value="2">2 - Nota de crédito / Rescisión de contrato o servicio no prestado</option>
                    <option value="3">3 - Datos de transacción erróneos (Montos o ítems incorrectos)</option>
                    <option value="4">4 - Duplicidad de emisión de factura</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">
                    Observaciones / Justificación de Auditoría:
                  </label>
                  <textarea
                    rows={3}
                    value={obsAnulacion}
                    onChange={(e) => setObsAnulacion(e.target.value)}
                    placeholder="Detalle el motivo específico de la anulación fiscal..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cliente:</span>
                    <span className="font-bold">{selectedInvoiceForAnnul.cliente_razon_social || selectedInvoiceForAnnul.cliente_nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">NIT / CI:</span>
                    <span className="font-mono">{selectedInvoiceForAnnul.cliente_nit_ci}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Monto Facturado:</span>
                    <span className="font-mono font-bold text-rose-700">Bs. {selectedInvoiceForAnnul.total_bs.toLocaleString('es-BO')}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowAnnulModal(false);
                    setSelectedInvoiceForAnnul(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAnnulInvoice}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center space-x-2 shadow-md cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Confirmar Anulación Fiscal</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Previsualización de Factura Fiscal Oficial */}
      <AnimatePresence>
        {selectedInvoiceForPreview && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col my-auto max-h-[94vh]"
            >
              {/* Header */}
              <div className="bg-slate-900 text-white p-4 sm:px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="bg-amber-500/20 p-2 rounded-xl border border-amber-500/30">
                    <Receipt className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-black font-display text-white">
                      Vista Previa: Factura Fiscal N° {selectedInvoiceForPreview.numero_factura}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Documento Oficial con Derecho a Crédito Fiscal • Estado: {selectedInvoiceForPreview.estado}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedInvoiceForPreview(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Invoice Replica Body */}
              <div className="p-6 space-y-6 overflow-y-auto text-xs bg-slate-50 relative">
                {selectedInvoiceForPreview.estado === 'Anulada' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <span className="text-7xl font-black text-rose-500/20 border-8 border-rose-500/20 px-10 py-4 rounded-3xl transform -rotate-12 select-none">
                      ANULADA
                    </span>
                  </div>
                )}

                {/* Top Company & Tax Header */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-slate-900 tracking-tight">
                      PUBLI-X COBERTURA NACIONAL
                    </h4>
                    <p className="text-slate-500 text-[11px]">De: Carlos David Vargas Fernandez</p>
                    <p className="text-slate-500 text-[11px]">{settings.direccion || 'Av. Cristo Redentor y 4to Anillo, Santa Cruz - Bolivia'}</p>
                    <p className="text-slate-500 text-[11px]">Tel: {settings.telefono || '+591 78554402'}</p>
                  </div>

                  <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 text-right space-y-1 sm:w-64">
                    <div className="text-[11px] font-bold text-slate-700">NIT: <span className="font-mono text-slate-900">{settings.nit || '4579387019'}</span></div>
                    <div className="text-[11px] font-bold text-slate-700">FACTURA N°: <span className="font-mono text-amber-800 text-sm">{selectedInvoiceForPreview.numero_factura}</span></div>
                    <div className="text-[10px] text-slate-500 font-mono">AUTORIZACIÓN: {selectedInvoiceForPreview.codigo_autorizacion_sin || '4A8F93B27C10E'}</div>
                    <div className="text-[10px] font-bold text-slate-700">ORIGINAL</div>
                  </div>
                </div>

                {/* Client Info Bar */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Fecha de Emisión:</span>
                    <span className="font-semibold text-slate-800">{new Date(selectedInvoiceForPreview.fecha_emision).toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">NIT / CI Cliente:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedInvoiceForPreview.cliente_nit_ci}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Señor(es) / Razón Social:</span>
                    <span className="font-bold text-slate-900">{selectedInvoiceForPreview.cliente_razon_social || selectedInvoiceForPreview.cliente_nombre}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Periodo / Concepto:</span>
                    <span className="text-slate-700">{selectedInvoiceForPreview.periodo_facturado || 'Alquiler de Espacios Publicitarios OOH'}</span>
                  </div>
                </div>

                {/* Items Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-3">Cant.</th>
                        <th className="p-3">Descripción del Servicio / Espacio Publicitario OOH</th>
                        <th className="p-3 text-right">P. Unitario (BOB)</th>
                        <th className="p-3 text-right">Subtotal (BOB)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedInvoiceForPreview.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono text-center font-bold text-slate-600">{item.cantidad}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{item.descripcion}</div>
                            {item.medidas && <div className="text-[10px] text-slate-400 font-mono">{item.medidas}</div>}
                          </td>
                          <td className="p-3 text-right font-mono">Bs. {item.precio_unitario_bs.toFixed(2)}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">Bs. {item.subtotal_bs.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                      <tr>
                        <td colSpan={3} className="p-3 text-right text-slate-700 uppercase text-[11px]">
                          TOTAL A PAGAR:
                        </td>
                        <td className="p-3 text-right font-mono text-base text-amber-700 font-black">
                          Bs. {selectedInvoiceForPreview.total_bs.toFixed(2)} BOB
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Literal Amount & SIN Footer */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Son:</span>
                    <p className="font-bold text-slate-800 font-mono text-xs">{selectedInvoiceForPreview.total_literal_bs}</p>
                  </div>

                  <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200/60 text-[10px] text-slate-600 space-y-0.5">
                    <p className="font-bold text-amber-900">"ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS, EL USO ILÍCITO SERÁ SANCIONADO PENALMENTE DE ACUERDO A LEY"</p>
                    <p className="text-slate-500">Ley N° 453: Los servicios deben prestarse en condiciones de calidad y seguridad.</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceForPreview(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cerrar
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleSendWhatsApp(selectedInvoiceForPreview)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(selectedInvoiceForPreview)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs uppercase tracking-wider"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar PDF Fiscal</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
