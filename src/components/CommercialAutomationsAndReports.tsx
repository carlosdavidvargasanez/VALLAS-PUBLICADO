import React, { useState, useMemo } from 'react';
import { Contract, Quotation, Client, Vehicle, Settings, UserSession } from '../types';
import { 
  Bell, 
  TrendingUp, 
  FileText, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Send, 
  MessageSquare, 
  Mail, 
  Download, 
  DollarSign, 
  Share2, 
  Calendar, 
  ArrowUpRight, 
  Sparkles, 
  Layers, 
  Building2, 
  MapPin, 
  Percent, 
  UserCheck, 
  ExternalLink,
  Filter,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CommercialAutomationsAndReportsProps {
  contracts: Contract[];
  quotations: Quotation[];
  clients: Client[];
  vehicles: Vehicle[];
  settings: Settings;
  currentUser: UserSession;
  onNavigateToContract?: (contractId: string) => void;
  onNavigateToQuote?: (quoteId: string) => void;
}

export default function CommercialAutomationsAndReports({
  contracts,
  quotations,
  clients,
  vehicles,
  settings,
  currentUser,
  onNavigateToContract,
  onNavigateToQuote
}: CommercialAutomationsAndReportsProps) {
  const [activeTab, setActiveTab] = useState<'reminders' | 'profitability' | 'weekly_report'>('reminders');
  const [reminderFilter, setReminderFilter] = useState<'ALL' | 'EXPIRING_5' | 'EXPIRING_15' | 'COLD_QUOTES' | 'POST_SALE'>('ALL');
  const [copiedReport, setCopiedReport] = useState(false);

  const exchangeRate = settings.tipo_cambio || 6.96;
  const now = new Date();

  // -------------------------------------------------------------------------
  // 1. COMPUTED REMINDERS & ALERTS
  // -------------------------------------------------------------------------
  const reminders = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'EXPIRING_5' | 'EXPIRING_15' | 'COLD_QUOTES' | 'POST_SALE';
      title: string;
      subtitle: string;
      daysInfo: string;
      clientName: string;
      clientPhone: string;
      clientEmail?: string;
      entityId: string;
      amountUsd: number;
      actionText: string;
      whatsAppMessage: string;
      emailSubject: string;
      emailBody: string;
    }> = [];

    // A) Contratos próximos a vencer (15 días y 5 días)
    contracts.forEach((c) => {
      if (c.estado !== 'Vigente') return;
      const endDate = new Date(c.fecha_fin);
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 5) {
        list.push({
          id: `REM-CTR-5-${c.id}`,
          type: 'EXPIRING_5',
          title: `⚠️ Contrato N° ${c.numero} vence en ${diffDays} día(s)`,
          subtitle: `Espacio: ${c.valla_nombre} (${c.cliente_empresa || c.cliente_nombre})`,
          daysInfo: `${diffDays} días restantes`,
          clientName: c.cliente_nombre,
          clientPhone: c.cliente_celular,
          entityId: c.id,
          amountUsd: c.total_neto_usd,
          actionText: 'Renovar Contrato (Urgente)',
          whatsAppMessage: `Estimado/a ${c.cliente_nombre}, le saludamos de *PUBLI-X BOLIVIA* 📢. Le recordamos cordialmente que su contrato publicitario *${c.numero}* para el espacio *${c.valla_nombre}* concluye el *${c.fecha_fin}* (en ${diffDays} días). Para garantizar la continuidad de su marca y no perder la reserva del espacio, ¿desea que le preparemos la renovación formal?`,
          emailSubject: `Aviso de Vencimiento de Contrato Publicitario N° ${c.numero} - PUBLI-X Bolivia`,
          emailBody: `Estimado/a ${c.cliente_nombre},\n\nLe escribimos para recordarle que el contrato publicitario N° ${c.numero} finaliza el ${c.fecha_fin}.\n\nQuedamos a su disposición para coordinar la renovación del espacio.\n\nAtentamente,\nPUBLI-X Bolivia`
        });
      } else if (diffDays > 5 && diffDays <= 15) {
        list.push({
          id: `REM-CTR-15-${c.id}`,
          type: 'EXPIRING_15',
          title: `📅 Contrato N° ${c.numero} vence en ${diffDays} días`,
          subtitle: `Espacio: ${c.valla_nombre} (${c.cliente_empresa || c.cliente_nombre})`,
          daysInfo: `${diffDays} días restantes`,
          clientName: c.cliente_nombre,
          clientPhone: c.cliente_celular,
          entityId: c.id,
          amountUsd: c.total_neto_usd,
          actionText: 'Iniciar Negociación de Renovación',
          whatsAppMessage: `Hola ${c.cliente_nombre}, te saluda PUBLI-X Bolivia. Tu contrato *${c.numero}* en *${c.valla_nombre}* concluye en ${diffDays} días (${c.fecha_fin}). Queremos ofrecerte condiciones preferenciales para la renovación anticipada de tu campaña. ¿Cuándo podemos coordinar?`,
          emailSubject: `Renovación Anticipada de Espacio Publicitario N° ${c.numero} - PUBLI-X Bolivia`,
          emailBody: `Estimado/a ${c.cliente_nombre},\n\nSu contrato en ${c.valla_nombre} vence el ${c.fecha_fin}. Le ofrecemos prioridad de renovación para mantener su ubicación estratégica.\n\nSaludos cordiales,\nPUBLI-X Bolivia`
        });
      }

      // Post-Venta (Contrato iniciado hace entre 3 y 10 días)
      const startDate = new Date(c.fecha_inicio);
      const elapsedDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (elapsedDays >= 2 && elapsedDays <= 10) {
        list.push({
          id: `REM-POST-${c.id}`,
          type: 'POST_SALE',
          title: `✨ Seguimiento Post-Venta: Contrato N° ${c.numero}`,
          subtitle: `Verificar instalación y satisfacción con ${c.cliente_nombre}`,
          daysInfo: `Inició hace ${elapsedDays} días`,
          clientName: c.cliente_nombre,
          clientPhone: c.cliente_celular,
          entityId: c.id,
          amountUsd: c.total_neto_usd,
          actionText: 'Enviar Saludo Post-Venta',
          whatsAppMessage: `Hola ${c.cliente_nombre}, le saludamos de *PUBLI-X BOLIVIA* 📢. Esperamos que su campaña en *${c.valla_nombre}* esté generando el impacto deseado. Estamos monitoreando la iluminación y el estado de su lona para garantizar la máxima calidad. ¿Tiene alguna consulta o requerimiento adicional?`,
          emailSubject: `Seguimiento de Campaña Publicitaria N° ${c.numero} - PUBLI-X Bolivia`,
          emailBody: `Estimado/a ${c.cliente_nombre},\n\nNos ponemos en contacto para verificar que su campaña publicitaria en ${c.valla_nombre} esté funcionando a la perfección.\n\nAtentamente,\nPUBLI-X Bolivia`
        });
      }
    });

    // B) Cotizaciones frías sin respuesta (> 3 días en estado 'Enviada')
    quotations.forEach((q) => {
      if (q.estado === 'Enviada') {
        const quoteDate = new Date(q.fecha);
        const daysAgo = Math.floor((now.getTime() - quoteDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysAgo >= 3) {
          const client = clients.find(c => c.id === q.cliente_id);
          const cName = client ? client.nombre : 'Cliente';
          const cPhone = client ? client.celular : '';
          list.push({
            id: `REM-QUO-${q.id}`,
            type: 'COLD_QUOTES',
            title: `⏳ Cotización N° ${q.numero} sin respuesta (${daysAgo} días)`,
            subtitle: `Monto: $${q.total.toLocaleString()} USD • Cliente: ${cName}`,
            daysInfo: `Enviada hace ${daysAgo} días`,
            clientName: cName,
            clientPhone: cPhone,
            clientEmail: client?.correo,
            entityId: q.id,
            amountUsd: q.total,
            actionText: 'Reactivar Prospecto',
            whatsAppMessage: `Hola ${cName}, te saluda PUBLI-X Bolivia 📢. Te consulto si tuviste oportunidad de revisar la cotización formal *${q.numero}* por $${q.total.toLocaleString()} USD que te enviamos. ¿Tienes alguna duda o te gustaría que ajustemos la propuesta o los tiempos de campaña?`,
            emailSubject: `Seguimiento de Cotización N° ${q.numero} - PUBLI-X Bolivia`,
            emailBody: `Estimado/a ${cName},\n\nLe escribimos para hacer seguimiento a la cotización formal N° ${q.numero}.\n\nQuedamos atentos a sus comentarios para coordinar los siguientes pasos.\n\nAtentamente,\nPUBLI-X Bolivia`
          });
        }
      }
    });

    return list;
  }, [contracts, quotations, clients, now]);

  const filteredReminders = useMemo(() => {
    if (reminderFilter === 'ALL') return reminders;
    return reminders.filter(r => r.type === reminderFilter);
  }, [reminders, reminderFilter]);

  // -------------------------------------------------------------------------
  // 2. PROFITABILITY & OCCUPANCY METRICS
  // -------------------------------------------------------------------------
  const profitabilityMetrics = useMemo(() => {
    // Total Revenue from Active Contracts
    const activeContracts = contracts.filter(c => c.estado === 'Vigente');
    const totalRevenueUsd = activeContracts.reduce((sum, c) => sum + c.total_neto_usd, 0);
    const totalRevenueBob = activeContracts.reduce((sum, c) => sum + c.total_neto_bob, 0);

    // Occupancy
    const totalVehicles = vehicles.length;
    const occupiedCount = vehicles.filter(v => v.estado === 'Ocupada' || v.estado === 'Ocupado / Alquilado' || v.estado === 'Reservado' || v.estado === 'Reservada').length;
    const availableCount = vehicles.filter(v => v.estado === 'Disponible').length;
    const occupancyRate = totalVehicles > 0 ? Math.round((occupiedCount / totalVehicles) * 100) : 0;

    // Revenue by Billboard (Top performing)
    const billboardRevenueMap: Record<string, { vehicle: Vehicle; totalRevenueUsd: number; contractsCount: number }> = {};
    vehicles.forEach(v => {
      billboardRevenueMap[v.id] = { vehicle: v, totalRevenueUsd: 0, contractsCount: 0 };
    });

    contracts.forEach(c => {
      const vId = c.vehiculo_id || c.valla_id;
      if (vId && billboardRevenueMap[vId]) {
        billboardRevenueMap[vId].totalRevenueUsd += c.total_neto_usd;
        billboardRevenueMap[vId].contractsCount += 1;
      }
    });

    const rankedBillboards = Object.values(billboardRevenueMap).sort((a, b) => b.totalRevenueUsd - a.totalRevenueUsd);
    const topBillboards = rankedBillboards.slice(0, 5);

    // Low occupancy / Available Billboards (Opportunities)
    const lowOccupancyBillboards = vehicles.filter(v => v.estado === 'Disponible').slice(0, 5);

    // Revenue by Department / City
    const cityRevenueMap: Record<string, { city: string; revenueUsd: number; totalVallas: number; occupiedVallas: number }> = {};
    vehicles.forEach(v => {
      const city = v.ciudad || 'Otras';
      if (!cityRevenueMap[city]) {
        cityRevenueMap[city] = { city, revenueUsd: 0, totalVallas: 0, occupiedVallas: 0 };
      }
      cityRevenueMap[city].totalVallas += 1;
      if (v.estado === 'Ocupada' || v.estado === 'Ocupado / Alquilado' || v.estado === 'Reservado' || v.estado === 'Reservada') {
        cityRevenueMap[city].occupiedVallas += 1;
      }
    });

    contracts.forEach(c => {
      const vId = c.vehiculo_id || c.valla_id;
      const v = vehicles.find(veh => veh.id === vId);
      const city = v?.ciudad || c.valla_ciudad || c.cliente_ciudad || 'Santa Cruz';
      if (cityRevenueMap[city]) {
        cityRevenueMap[city].revenueUsd += c.total_neto_usd;
      }
    });

    const cityPerformance = Object.values(cityRevenueMap).sort((a, b) => b.revenueUsd - a.revenueUsd);

    return {
      totalRevenueUsd,
      totalRevenueBob,
      totalVehicles,
      occupiedCount,
      availableCount,
      occupancyRate,
      topBillboards,
      lowOccupancyBillboards,
      cityPerformance
    };
  }, [contracts, vehicles]);

  // -------------------------------------------------------------------------
  // 3. WEEKLY EXECUTIVE SUMMARY (FOR WHATSAPP / EMAIL)
  // -------------------------------------------------------------------------
  const weeklyReportText = useMemo(() => {
    const activeCtr = contracts.filter(c => c.estado === 'Vigente');
    const recentQuotes = quotations.slice(0, 10);
    const expiringSoon = reminders.filter(r => r.type === 'EXPIRING_5' || r.type === 'EXPIRING_15');
    const newClients = clients.slice(0, 5);

    return `📊 *REPORTE SEMANAL EJECUTIVO - PUBLI-X BOLIVIA* 📢
📅 *Fecha:* ${now.toLocaleDateString('es-BO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
👤 *Generado para:* ${settings.nombre_empresa} (Gerencia / Dirección)

═════════════════════════════════════
💰 *1. FACTURACIÓN Y OCUPACIÓN*
• *Ingresos Activos:* $${profitabilityMetrics.totalRevenueUsd.toLocaleString()} USD (Bs. ${profitabilityMetrics.totalRevenueBob.toLocaleString('es-BO')} BOB)
• *Tasa de Ocupación:* ${profitabilityMetrics.occupancyRate}% (${profitabilityMetrics.occupiedCount} ocupadas / ${profitabilityMetrics.availableCount} disponibles de ${profitabilityMetrics.totalVehicles} totales)
• *Contratos Vigentes:* ${activeCtr.length} contratos activos

═════════════════════════════════════
⚠️ *2. CONTRATOS PRÓXIMOS A VENCER (${expiringSoon.length})*
${expiringSoon.length > 0 ? expiringSoon.map(r => `• [${r.daysInfo}] ${r.title} - $${r.amountUsd.toLocaleString()} USD`).join('\n') : '• Ningún contrato por vencer en los próximos 15 días.'}

═════════════════════════════════════
📈 *3. TOP CIUDADES POR RENTABILIDAD*
${profitabilityMetrics.cityPerformance.map(cp => `• *${cp.city}:* $${cp.revenueUsd.toLocaleString()} USD (${cp.occupiedVallas}/${cp.totalVallas} vallas)`).join('\n')}

═════════════════════════════════════
🎯 *4. ESPACIOS DISPONIBLES PRIORITARIOS*
${profitabilityMetrics.lowOccupancyBillboards.map(v => `• [${v.codigo || v.id}] ${v.tipo_valla || v.tipo} en ${v.ciudad} (${v.avenida_calle}) - $${v.precio_usd} USD/mes`).join('\n')}

═════════════════════════════════════
👥 *5. ÚLTIMOS CLIENTES REGISTRADOS (${newClients.length})*
${newClients.map(c => `• ${c.nombre} (${c.empresa || 'Particular'}) - ${c.ciudad}`).join('\n')}

_Generado automáticamente por el Sistema Comercial PUBLI-X Bolivia._`;
  }, [contracts, quotations, clients, reminders, profitabilityMetrics, settings, now]);

  const handleSendWeeklyReportWhatsApp = () => {
    const text = encodeURIComponent(weeklyReportText);
    const gerenciaPhone = (settings.whatsapp || settings.telefono || '+59170000000').replace(/[^\d]/g, '');
    window.open(`https://api.whatsapp.com/send?phone=${gerenciaPhone}&text=${text}`, 'publix_whatsapp_tab');
  };

  const handleSendWeeklyReportEmail = () => {
    const subject = encodeURIComponent(`📊 Reporte Semanal Ejecutivo - PUBLI-X Bolivia (${now.toLocaleDateString('es-BO')})`);
    const body = encodeURIComponent(weeklyReportText);
    const destEmail = settings.correo || currentUser.email || 'gerencia@publix.bo';
    window.open(`mailto:${destEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleCopyWeeklyReport = () => {
    navigator.clipboard.writeText(weeklyReportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const handleDownloadWeeklyReportPdf = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    
    // Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 216, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PUBLI-X BOLIVIA - REPORTE EJECUTIVO SEMANAL', 14, 16);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Fecha: ${now.toLocaleDateString('es-BO')} | Generado para Gerencia y Dirección`, 14, 24);
    doc.text(`Tipo de Cambio Oficial: Bs. ${exchangeRate}`, 14, 30);

    // Section 1: KPI Metrics
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('1. RESUMEN DE FACTURACIÓN Y OCUPACIÓN NACIONAL', 14, 45);

    autoTable(doc, {
      startY: 48,
      head: [['Métrica Comercial', 'Valor USD', 'Valor BOB / %']],
      body: [
        ['Facturación Activa en Contratos', `$${profitabilityMetrics.totalRevenueUsd.toLocaleString()} USD`, `Bs. ${profitabilityMetrics.totalRevenueBob.toLocaleString('es-BO')} BOB`],
        ['Tasa de Ocupación de Vallas', `${profitabilityMetrics.occupiedCount} de ${profitabilityMetrics.totalVehicles} vallas`, `${profitabilityMetrics.occupancyRate}% Ocupación`],
        ['Espacios Disponibles para Venta', `${profitabilityMetrics.availableCount} vallas`, `${100 - profitabilityMetrics.occupancyRate}% Disponibilidad`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' }
    });

    // Section 2: Expirations
    const currentY = (doc as any).lastAutoTable.finalY + 10;
    doc.text('2. CONTRATOS PRÓXIMOS A VENCER (PRÓXIMOS 15 DÍAS)', 14, currentY);

    const expiringRows = reminders
      .filter(r => r.type === 'EXPIRING_5' || r.type === 'EXPIRING_15')
      .map(r => [r.title, r.clientName, r.daysInfo, `$${r.amountUsd.toLocaleString()} USD`]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [['Contrato / Espacio', 'Cliente', 'Tiempo Restante', 'Monto USD']],
      body: expiringRows.length > 0 ? expiringRows : [['Sin contratos por vencer', '-', '-', '-']],
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    // Section 3: City Performance
    const currentY2 = (doc as any).lastAutoTable.finalY + 10;
    doc.text('3. RENDIMIENTO Y RENTABILIDAD POR DEPARTAMENTO', 14, currentY2);

    const cityRows = profitabilityMetrics.cityPerformance.map(cp => [
      cp.city,
      `$${cp.revenueUsd.toLocaleString()} USD`,
      `Bs. ${Math.round(cp.revenueUsd * exchangeRate).toLocaleString('es-BO')}`,
      `${cp.occupiedVallas} de ${cp.totalVallas} (${cp.totalVallas > 0 ? Math.round((cp.occupiedVallas/cp.totalVallas)*100) : 0}%)`
    ]);

    autoTable(doc, {
      startY: currentY2 + 3,
      head: [['Departamento', 'Ingresos USD', 'Ingresos BOB', 'Ocupación']],
      body: cityRows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' }
    });

    doc.save(`Reporte_Semanal_PubliX_${now.toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-gray-900">Inteligencia Comercial & Recordatorios</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Control de vencimiento de contratos, reactivación de cotizaciones y análisis de rentabilidad OOH en Bolivia.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl gap-1">
          <button
            onClick={() => setActiveTab('reminders')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'reminders'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-500" />
            <span>Recordatorios</span>
            {reminders.length > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px] font-black">
                {reminders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('profitability')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'profitability'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Rentabilidad & Ocupación</span>
          </button>

          <button
            onClick={() => setActiveTab('weekly_report')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'weekly_report'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-500" />
            <span>Reporte Semanal a Gerencia</span>
          </button>
        </div>
      </div>

      {/* TAB 1: RECORDATORIOS AUTOMÁTICOS */}
      {activeTab === 'reminders' && (
        <div className="space-y-4">
          {/* Subfilter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setReminderFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                reminderFilter === 'ALL'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Todos ({reminders.length})
            </button>

            <button
              onClick={() => setReminderFilter('EXPIRING_5')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                reminderFilter === 'EXPIRING_5'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Contratos Urgentes (≤ 5 días)</span>
            </button>

            <button
              onClick={() => setReminderFilter('EXPIRING_15')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                reminderFilter === 'EXPIRING_15'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Próximos a Vencer (6-15 días)</span>
            </button>

            <button
              onClick={() => setReminderFilter('COLD_QUOTES')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                reminderFilter === 'COLD_QUOTES'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Cotizaciones Sin Respuesta (&gt; 3 días)</span>
            </button>

            <button
              onClick={() => setReminderFilter('POST_SALE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                reminderFilter === 'POST_SALE'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Seguimiento Post-Venta</span>
            </button>
          </div>

          {/* Reminder Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReminders.map((rem) => {
              const cleanPhone = rem.clientPhone.replace(/[^\d]/g, '');
              const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(rem.whatsAppMessage)}`;
              const mailUrl = `mailto:${rem.clientEmail || ''}?subject=${encodeURIComponent(rem.emailSubject)}&body=${encodeURIComponent(rem.emailBody)}`;

              const isUrgent = rem.type === 'EXPIRING_5';
              const isWarning = rem.type === 'EXPIRING_15';
              const isCold = rem.type === 'COLD_QUOTES';
              const isPost = rem.type === 'POST_SALE';

              return (
                <motion.div
                  key={rem.id}
                  layout
                  className={`bg-white rounded-2xl p-5 border shadow-2xs transition flex flex-col justify-between space-y-4 ${
                    isUrgent ? 'border-red-300 ring-1 ring-red-200 bg-red-50/20' :
                    isWarning ? 'border-amber-300 bg-amber-50/20' :
                    isCold ? 'border-blue-200 bg-blue-50/10' :
                    'border-emerald-200 bg-emerald-50/10'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                        isUrgent ? 'bg-red-100 text-red-800' :
                        isWarning ? 'bg-amber-100 text-amber-800' :
                        isCold ? 'bg-blue-100 text-blue-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {rem.daysInfo}
                      </span>
                      <span className="font-bold text-xs text-gray-900">
                        ${rem.amountUsd.toLocaleString()} USD
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-gray-900 leading-snug">{rem.title}</h3>
                    <p className="text-xs text-gray-600 font-medium">{rem.subtitle}</p>
                    <div className="text-[11px] text-gray-500 flex items-center space-x-2">
                      <span>👤 {rem.clientName}</span>
                      <span>•</span>
                      <span>📱 {rem.clientPhone}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-1.5">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1.5 shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>

                      {rem.clientEmail && (
                        <a
                          href={mailUrl}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition border border-blue-200"
                          title="Enviar Correo"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    {isCold && onNavigateToQuote && (
                      <button
                        onClick={() => onNavigateToQuote(rem.entityId)}
                        className="text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer flex items-center space-x-1"
                      >
                        <span>Ver Cotización</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {(isUrgent || isWarning || isPost) && onNavigateToContract && (
                      <button
                        onClick={() => onNavigateToContract(rem.entityId)}
                        className="text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer flex items-center space-x-1"
                      >
                        <span>Ver Contrato</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredReminders.length === 0 && (
            <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-sm text-gray-900">No hay recordatorios pendientes en este filtro</h3>
              <p className="text-xs text-gray-500">Todos los contratos y cotizaciones se encuentran al día.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REPORTES DE RENTABILIDAD & OCUPACIÓN */}
      {activeTab === 'profitability' && (
        <div className="space-y-6">
          {/* Main KPI Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
              <span className="text-xs font-medium text-gray-500 block">Facturación Activa Total</span>
              <span className="text-2xl font-black text-gray-900 block mt-1">
                ${profitabilityMetrics.totalRevenueUsd.toLocaleString()} <span className="text-xs font-normal text-gray-400">USD</span>
              </span>
              <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
                Bs. {profitabilityMetrics.totalRevenueBob.toLocaleString('es-BO')} BOB
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
              <span className="text-xs font-medium text-gray-500 block">Tasa de Ocupación Nacional</span>
              <span className="text-2xl font-black text-emerald-600 block mt-1">
                {profitabilityMetrics.occupancyRate}%
              </span>
              <span className="text-[11px] text-gray-500 mt-1 block">
                {profitabilityMetrics.occupiedCount} ocupadas de {profitabilityMetrics.totalVehicles} vallas totales
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
              <span className="text-xs font-medium text-gray-500 block">Espacios Disponibles</span>
              <span className="text-2xl font-black text-amber-600 block mt-1">
                {profitabilityMetrics.availableCount}
              </span>
              <span className="text-[11px] text-amber-700 font-medium mt-1 block">
                Listas para comercialización inmediata
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
              <span className="text-xs font-medium text-gray-500 block">Tipo de Cambio Base</span>
              <span className="text-2xl font-black text-gray-900 block mt-1">
                Bs. {exchangeRate}
              </span>
              <span className="text-[11px] text-gray-500 mt-1 block">
                BOB / USD oficial acordado
              </span>
            </div>
          </div>

          {/* Two-Column Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top performing billboards */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                  <h3 className="font-bold text-sm text-gray-900">Top Vallas por Facturación</h3>
                </div>
                <span className="text-xs text-gray-400">Histórico de contratos</span>
              </div>

              <div className="space-y-3">
                {profitabilityMetrics.topBillboards.map((item, idx) => (
                  <div
                    key={item.vehicle.id}
                    className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-xs text-gray-900 block">
                          [{item.vehicle.codigo || item.vehicle.id}] {item.vehicle.tipo_valla || item.vehicle.tipo}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {item.vehicle.avenida_calle} • {item.vehicle.ciudad} ({item.contractsCount} contratos)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-xs text-gray-900 block">${item.totalRevenueUsd.toLocaleString()} USD</span>
                      <span className="text-[10px] text-gray-400">Bs. {Math.round(item.totalRevenueUsd * exchangeRate).toLocaleString('es-BO')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* City / Department Performance */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <h3 className="font-bold text-sm text-gray-900">Rentabilidad por Departamento</h3>
                </div>
                <span className="text-xs text-gray-400">Distribución nacional</span>
              </div>

              <div className="space-y-3">
                {profitabilityMetrics.cityPerformance.map((cp) => {
                  const perc = cp.totalVallas > 0 ? Math.round((cp.occupiedVallas / cp.totalVallas) * 100) : 0;
                  return (
                    <div key={cp.city} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-900">{cp.city}</span>
                        <span className="font-bold text-gray-900">${cp.revenueUsd.toLocaleString()} USD</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${perc}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-500">
                        <span>Ocupación: {perc}% ({cp.occupiedVallas} de {cp.totalVallas} vallas)</span>
                        <span>Bs. {Math.round(cp.revenueUsd * exchangeRate).toLocaleString('es-BO')} BOB</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Billboards needing marketing boost */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-3xl p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-sm text-amber-950">Vallas Disponibles con Oportunidad de Promoción Comercial</h3>
            </div>
            <p className="text-xs text-amber-900/80">
              Espacios estratégicos actualmente sin contrato activo. Se recomienda ofrecer promociones de paquete o descuentos de impresión de lona para acelerar su colocación.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {profitabilityMetrics.lowOccupancyBillboards.map(v => (
                <div key={v.id} className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-2xs space-y-1.5">
                  <span className="font-bold text-xs text-gray-900 block">[{v.codigo || v.id}] {v.tipo_valla || v.tipo}</span>
                  <p className="text-[11px] text-gray-500">{v.avenida_calle} • {v.ciudad}</p>
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="font-bold text-amber-700">${v.precio_usd.toLocaleString()} USD/mes</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-bold text-[10px]">Disponible</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REPORTE SEMANAL AUTOMÁTICO A GERENCIA */}
      {activeTab === 'weekly_report' && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h2 className="font-bold text-base text-gray-900">Reporte Semanal Ejecutivo para Gerencia y Dirección</h2>
              <p className="text-xs text-gray-500">
                Consolidado integral de ventas, contratos por vencer, cotizaciones y ocupación listo para enviar por WhatsApp o correo.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyWeeklyReport}
                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
              >
                {copiedReport ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedReport ? '¡Copiado!' : 'Copiar Texto'}</span>
              </button>

              <button
                onClick={handleDownloadWeeklyReportPdf}
                className="px-3.5 py-2 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar PDF</span>
              </button>

              <button
                onClick={handleSendWeeklyReportEmail}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-blue-600/20"
              >
                <Mail className="w-4 h-4" />
                <span>Enviar por Correo</span>
              </button>

              <button
                onClick={handleSendWeeklyReportWhatsApp}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Enviar por WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Formatted Report Preview */}
          <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 text-slate-200 font-mono text-xs leading-relaxed whitespace-pre-wrap select-all shadow-inner overflow-x-auto">
            {weeklyReportText}
          </div>
        </div>
      )}
    </div>
  );
}
