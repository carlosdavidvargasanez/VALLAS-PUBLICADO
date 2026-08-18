import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quotation, Contract, Invoice, Settings, Client, Vehicle } from '../types';
import { numeroALetrasBolivianos } from './numberToWords';
import logoImg from '../assets/images/publi_x_logo_1786377194733.jpg';

// Helper to convert an image URL to Base64
const getBase64ImageFromUrl = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataURL);
        } else {
          resolve(null);
        }
      } catch (e) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

// =========================================================================
// 1. GENERADOR DE COTIZACIÓN TIPO A: VALLAS Y PANTALLAS LED (FORMATO UPDS / DONDE VALLAS)
// =========================================================================
export const generateTypeAQuotationPdf = async (
  quote: Quotation,
  settings: Settings,
  onProgress?: (msg: string) => void
): Promise<void> => {
  onProgress?.('Iniciando generación de Cotización Tipo A (Vallas y Pantallas)...');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const contentWidth = pageWidth - (marginX * 2);
  let currentY = 12;

  // Header Logo & Company Info
  const logoData = settings.logo || (await getBase64ImageFromUrl(logoImg));
  if (logoData) {
    try {
      doc.addImage(logoData, 'JPEG', marginX, currentY, 40, 15);
    } catch (e) {
      console.warn('Logo error:', e);
    }
  }

  // Company details on right
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(234, 88, 12); // #ea580c orange
  doc.text(settings.nombre_comercial || 'Publi-X Cobertura Nacional Impacto Total', pageWidth - marginX, currentY + 4, { align: 'right' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`NIT: ${settings.nit || '4579387019'} • Tel: ${settings.telefono || '+591 3 3559988'}`, pageWidth - marginX, currentY + 8, { align: 'right' });
  doc.text(`${settings.domicilio_legal || 'Calle Los Tajibos 2185, Barrio Petrolero Norte, Santa Cruz'}`, pageWidth - marginX, currentY + 12, { align: 'right' });
  doc.text(`Email: ${settings.correo || 'ventas@publix.bo'} • Web: ${settings.web || 'www.publix.bo'}`, pageWidth - marginX, currentY + 16, { align: 'right' });

  currentY += 22;

  // Decorative divider
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.8);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 5;

  // Title Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(marginX, currentY, contentWidth, 8, 1.5, 1.5, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('COTIZACIÓN DE ESPACIOS PUBLICITARIOS OOH Y PANTALLAS LED', pageWidth / 2, currentY + 5.5, { align: 'center' });

  currentY += 12;

  // Client and Reference Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, currentY, contentWidth, 24, 2, 2, 'FD');

  const fechaFormateada = new Date(quote.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Señores:', marginX + 4, currentY + 6);
  doc.setFont('Helvetica', 'normal');
  doc.text(`${quote.cliente_empresa || quote.cliente_nombre}`, marginX + 22, currentY + 6);

  doc.setFont('Helvetica', 'bold');
  doc.text('Atención:', marginX + 4, currentY + 12);
  doc.setFont('Helvetica', 'normal');
  doc.text(`${quote.destinatario_atencion || quote.cliente_nombre} ${quote.destinatario_cargo ? `(${quote.destinatario_cargo})` : ''}`, marginX + 22, currentY + 12);

  doc.setFont('Helvetica', 'bold');
  doc.text('Referencia:', marginX + 4, currentY + 18);
  doc.setFont('Helvetica', 'normal');
  doc.text(`${quote.referencia_asunto || 'Propuesta de Circuito de Vallas Publicitarias y Pantallas LED'}`, marginX + 22, currentY + 18);

  // Right side details
  doc.setFont('Helvetica', 'bold');
  doc.text('Cotización N°:', pageWidth - marginX - 45, currentY + 6);
  doc.setTextColor(234, 88, 12);
  doc.text(`${quote.numero}`, pageWidth - marginX - 4, currentY + 6, { align: 'right' });

  doc.setTextColor(15, 23, 42);
  doc.text('Fecha:', pageWidth - marginX - 45, currentY + 12);
  doc.setFont('Helvetica', 'normal');
  doc.text(`${fechaFormateada}`, pageWidth - marginX - 4, currentY + 12, { align: 'right' });

  doc.setFont('Helvetica', 'bold');
  doc.text('Validez Oferta:', pageWidth - marginX - 45, currentY + 18);
  doc.setFont('Helvetica', 'normal');
  doc.text(`${quote.validez_oferta_dias || 15} días hábiles`, pageWidth - marginX - 4, currentY + 18, { align: 'right' });

  currentY += 28;

  // Table 1: Billboard Rental Spaces (Alquiler)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('1. DETALLE DE ESPACIOS PUBLICITARIOS (ALQUILER MENSUAL)', marginX, currentY);
  currentY += 3;

  const vallas = quote.vallas_seleccionadas || [];
  const exchangeRate = settings.tipo_cambio || 6.96;

  const tableDataVallas = vallas.map((v, idx) => {
    const precioBob = Math.round(v.precio_alquiler_usd * exchangeRate);
    const descBob = Math.round((v.descuento_mensual_usd || 0) * exchangeRate);
    const netoBob = precioBob - descBob;

    return [
      String(idx + 1),
      v.valla_ciudad || 'Santa Cruz',
      v.valla_nombre || v.valla_avenida,
      v.valla_medidas || '10m x 4m',
      v.valla_cara || 'Cara A',
      v.valla_iluminacion || 'LED Nocturna',
      `Bs. ${precioBob.toLocaleString('es-BO')}`,
      descBob > 0 ? `Bs. ${descBob.toLocaleString('es-BO')}` : '-',
      `Bs. ${netoBob.toLocaleString('es-BO')}`
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Ciudad', 'Ubicación / Avenida', 'Medidas', 'Cara', 'Iluminación', 'Precio Lista', 'Descuento', 'Total Neto']],
    body: tableDataVallas.length > 0 ? tableDataVallas : [['1', 'Santa Cruz', 'Valla de Alta Visibilidad', '10m x 4m', 'Cara A', 'LED HD', 'Bs. 13.980', 'Bs. 1.000', 'Bs. 12.980']],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 20 },
      2: { cellWidth: 55 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 18, halign: 'right' },
      8: { cellWidth: 22, halign: 'right', fontStyle: 'bold', textColor: [234, 88, 12] }
    },
    margin: { left: marginX, right: marginX }
  });

  // @ts-ignore
  currentY = (doc as any).lastAutoTable.finalY + 6;

  // Table 2: Printing & Production (Lonas)
  const lonas = quote.lonas_items || [];
  if (lonas.length > 0) {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('2. PRODUCCIÓN E IMPRESIÓN DE LONAS FRONTLIGHT 13oz', marginX, currentY);
    currentY += 3;

    const tableDataLonas = lonas.map((l, idx) => [
      String(idx + 1),
      l.valla_referencia || `Valla ${idx + 1}`,
      l.medidas || '10m x 4m',
      `${l.area_m2 || 40} m²`,
      String(l.cantidad || 1),
      `Bs. ${l.costo_unitario_bs.toLocaleString('es-BO')}`,
      `Bs. ${l.total_bs.toLocaleString('es-BO')}`
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Referencia / Ubicación', 'Medidas', 'Área (m²)', 'Cant.', 'Precio Unit. (Bs.)', 'Total BOB']],
      body: tableDataLonas,
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      columnStyles: {
        0: { cellWidth: 7, halign: 'center' },
        1: { cellWidth: 70 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: marginX, right: marginX }
    });

    // @ts-ignore
    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // Check page overflow
  if (currentY > 210) {
    doc.addPage();
    currentY = 16;
  }

  // Summary Totals Card
  const totalAlquilerBob = Math.round(quote.total_alquiler_usd * exchangeRate);
  const totalLonasBob = quote.total_lonas_usd ? Math.round(quote.total_lonas_usd * exchangeRate) : 0;
  const totalGeneralBob = Math.round(quote.total_general_usd * exchangeRate);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, currentY, contentWidth, 22, 2, 2, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Subtotal Alquiler Mensual: Bs. ${totalAlquilerBob.toLocaleString('es-BO')} BOB ($${quote.total_alquiler_usd.toLocaleString()} USD)`, marginX + 4, currentY + 6);
  if (totalLonasBob > 0) {
    doc.text(`Producción e Impresión Lonas: Bs. ${totalLonasBob.toLocaleString('es-BO')} BOB ($${(quote.total_lonas_usd || 0).toLocaleString()} USD)`, marginX + 4, currentY + 11);
  }
  doc.text(`Tipo de Cambio Oficial Acordado: Bs. ${exchangeRate.toFixed(2)} por 1 USD`, marginX + 4, currentY + 16);

  // Right total highlight
  doc.setFontSize(11);
  doc.setTextColor(234, 88, 12);
  doc.text(`TOTAL MENSUAL: Bs. ${totalGeneralBob.toLocaleString('es-BO')} BOB`, pageWidth - marginX - 4, currentY + 9, { align: 'right' });
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`($${quote.total_general_usd.toLocaleString()} USD)`, pageWidth - marginX - 4, currentY + 16, { align: 'right' });

  currentY += 26;

  // Commercial Notes & Conditions
  doc.setFillColor(254, 243, 199); // light amber
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(marginX, currentY, contentWidth, 18, 1.5, 1.5, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(146, 64, 14);
  doc.text('CONDICIONES COMERCIALES Y DE SERVICIO:', marginX + 3, currentY + 4.5);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  const condicionesTexto = quote.observaciones || settings.terminos_cotizacion || 
    '1. Precios incluyen factura legal oficial. 2. Iluminación nocturna LED garantizada de 18:30 a 24:00 hrs. 3. Mantenimiento y cuadrilla técnica certificada. 4. Plazo de instalación: 3 a 5 días hábiles tras recepción de artes.';
  const splitCond = doc.splitTextToSize(condicionesTexto, contentWidth - 6);
  doc.text(splitCond, marginX + 3, currentY + 8.5);

  currentY += 23;

  // Signature Block
  const signY = currentY + 6;
  const signWidth = 70;

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.line(marginX + 10, signY + 12, marginX + 10 + signWidth, signY + 12);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(settings.representante_legal || 'Carlos David Vargas Añez', marginX + 10 + (signWidth / 2), signY + 16, { align: 'center' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(234, 88, 12);
  doc.text(settings.representante_cargo || 'Gerente General', marginX + 10 + (signWidth / 2), signY + 19.5, { align: 'center' });
  doc.setTextColor(100, 116, 139);
  doc.text('PUBLI-X Cobertura Nacional', marginX + 10 + (signWidth / 2), signY + 23, { align: 'center' });

  // Client signature line
  const clientSignX = pageWidth - marginX - signWidth - 10;
  doc.line(clientSignX, signY + 12, clientSignX + signWidth, signY + 12);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(quote.cliente_empresa || quote.cliente_nombre, clientSignX + (signWidth / 2), signY + 16, { align: 'center' });
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Aceptación de Cotización / Firma y Sello', clientSignX + (signWidth / 2), signY + 19.5, { align: 'center' });

  // Footer
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`PUBLI-X BOLIVIA • Cotización ${quote.numero} • Generado el ${new Date().toLocaleString('es-ES')}`, marginX, 268);
  doc.text('Página 1 de 1', pageWidth - marginX, 268, { align: 'right' });

  doc.save(`Cotizacion_TipoA_${quote.numero}_${(quote.cliente_empresa || quote.cliente_nombre).replace(/\s+/g, '_')}.pdf`);
};

// =========================================================================
// 2. GENERADOR DE COTIZACIÓN TIPO B: COTIZACIONES TÉCNICAS (ESTRUCTURAS, UNIPOLARES, LETREROS)
// =========================================================================
export const generateTypeBQuotationPdf = async (
  quote: Quotation,
  settings: Settings,
  onProgress?: (msg: string) => void
): Promise<void> => {
  onProgress?.('Generando Cotización Técnica Tipo B (Estructura / Fabricación)...');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const contentWidth = pageWidth - (marginX * 2);
  let currentY = 12;

  // Header Logo
  const logoData = settings.logo || (await getBase64ImageFromUrl(logoImg));
  if (logoData) {
    try {
      doc.addImage(logoData, 'JPEG', marginX, currentY, 38, 14);
    } catch (e) {
      console.warn('Logo error:', e);
    }
  }

  // Header text
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(234, 88, 12);
  doc.text(settings.nombre_comercial || 'Publi-X Cobertura Nacional Impacto Total', pageWidth - marginX, currentY + 4, { align: 'right' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('DIVISIÓN DE INGENIERÍA, ESTRUCTURAS METÁLICAS Y PANTALLAS LED', pageWidth - marginX, currentY + 8, { align: 'right' });
  doc.text(`NIT: ${settings.nit || '4579387019'} • Domicilio: ${settings.domicilio_legal || 'Calle Los Tajibos 2185, Santa Cruz'}`, pageWidth - marginX, currentY + 12, { align: 'right' });
  doc.text(`Tel: ${settings.telefono || '+591 3 3559988'} • Email: ${settings.correo || 'ventas@publix.bo'}`, pageWidth - marginX, currentY + 16, { align: 'right' });

  currentY += 22;

  // Divider
  doc.setDrawColor(234, 88, 12);
  doc.setLineWidth(0.8);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 5;

  // Title Banner
  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(marginX, currentY, contentWidth, 8, 1.5, 1.5, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text('COTIZACIÓN TÉCNICA DE FABRICACIÓN, MONTAJE Y ESTRUCTURA', pageWidth / 2, currentY + 5.5, { align: 'center' });

  currentY += 12;

  // Client Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, currentY, contentWidth, 22, 2, 2, 'FD');

  const fechaDoc = new Date(quote.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Cliente / Empresa:', marginX + 4, currentY + 6);
  doc.setFont('Helvetica', 'normal');
  doc.text(`${quote.cliente_empresa || quote.cliente_nombre}`, marginX + 32, currentY + 6);

  doc.setFont('Helvetica', 'bold');
  doc.text('Atención:', marginX + 4, currentY + 11.5);
  doc.setFont('Helvetica', 'normal');
  doc.text(`${quote.destinatario_atencion || quote.cliente_nombre}`, marginX + 32, currentY + 11.5);

  doc.setFont('Helvetica', 'bold');
  doc.text('Proyecto / Ítem:', marginX + 4, currentY + 17);
  doc.setFont('Helvetica', 'normal');
  doc.text(`${quote.referencia_asunto || 'FABRICACIÓN E INSTALACIÓN DE ESTRUCTURA UNIPOLAR / PANTALLA LED'}`, marginX + 32, currentY + 17);

  // Right details
  doc.setFont('Helvetica', 'bold');
  doc.text('Cotización N°:', pageWidth - marginX - 45, currentY + 6);
  doc.setTextColor(234, 88, 12);
  doc.text(`${quote.numero}`, pageWidth - marginX - 4, currentY + 6, { align: 'right' });

  doc.setTextColor(15, 23, 42);
  doc.text('Fecha:', pageWidth - marginX - 45, currentY + 11.5);
  doc.setFont('Helvetica', 'normal');
  doc.text(`${fechaDoc}`, pageWidth - marginX - 4, currentY + 11.5, { align: 'right' });

  doc.setFont('Helvetica', 'bold');
  doc.text('Plazo Ejecución:', pageWidth - marginX - 45, currentY + 17);
  doc.setFont('Helvetica', 'normal');
  doc.text(`${quote.tiempo_produccion_dias_habiles || 25} días hábiles`, pageWidth - marginX - 4, currentY + 17, { align: 'right' });

  currentY += 26;

  // Technical Items Table
  const items = quote.items_tecnicos || [
    {
      id: '1',
      titulo: 'ESTRUCTURA UNIPOLAR PARA PANTALLA LED (10m x 4m)',
      descripcion_detallada: 'Columna tubular de acero estructural ASTM A-36 de 18" de diámetro y 10mm de espesor. Altura libre de 12 metros. Parrilla reticular reforzada con perfiles de alta resistencia, tratamiento anticorrosivo epóxico y pintura automotriz de acabado. Incluye pasarela técnica de mantenimiento y escalera de gato con jaula de seguridad.',
      cantidad: 1,
      unidad: 'GLOBAL',
      precio_unitario_usd: 12500,
      total_usd: 12500,
      alternativa: 'A'
    },
    {
      id: '2',
      titulo: 'FUNDACIÓN Y OBRA CIVIL DE HORMIGÓN ARMADO',
      descripcion_detallada: 'Excavación, zapata de hormigón ciclópeo / armado H-25 de 4.00m x 4.00m x 1.80m, pernos de anclaje de alta resistencia grado 8 de 1 1/2" con plantillas de precisión y pruebas de resistencia.',
      cantidad: 1,
      unidad: 'GLOBAL',
      precio_unitario_usd: 4800,
      total_usd: 4800,
      alternativa: 'A'
    },
    {
      id: '3',
      titulo: 'SISTEMA ELÉCTRICO, TABLERO Y PUESTA A TIERRA',
      descripcion_detallada: 'Tablero termomagnético Schneider, disyuntores de protección, contactor horario programable, cableado libre de halógeno y sistema de jabalinas de cobre para descarga a tierra.',
      cantidad: 1,
      unidad: 'GLOBAL',
      precio_unitario_usd: 1400,
      total_usd: 1400,
      alternativa: 'A'
    }
  ];

  const tableDataItems = items.map((it, idx) => [
    String(idx + 1),
    `${it.titulo}${it.alternativa ? ` [Alt. ${it.alternativa}]` : ''}\n${it.descripcion_detallada}`,
    String(it.cantidad),
    it.unidad || 'GLB',
    `$${it.precio_unitario_usd.toLocaleString()} USD`,
    `$${it.total_usd.toLocaleString()} USD`
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Especificaciones Técnicas y Materiales', 'Cant.', 'Unidad', 'P. Unitario (USD)', 'Total (USD)']],
    body: tableDataItems,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    bodyStyles: { fontSize: 7.2, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 100 },
      2: { cellWidth: 12, halign: 'center' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: [234, 88, 12] }
    },
    margin: { left: marginX, right: marginX }
  });

  // @ts-ignore
  currentY = (doc as any).lastAutoTable.finalY + 6;

  // Check page overflow
  if (currentY > 200) {
    doc.addPage();
    currentY = 16;
  }

  // Commercial / Technical Summary
  const exchangeRate = settings.tipo_cambio || 6.96;
  const totalUsd = quote.total_general_usd;
  const totalBob = Math.round(totalUsd * exchangeRate);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, currentY, contentWidth, 26, 2, 2, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('FORMA DE PAGO Y CONDICIONES TÉCNICAS:', marginX + 4, currentY + 6);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`• Anticipo de Inicio de Fabricación: ${quote.etapas_pago_anticipo_pct || 60}% ($${Math.round(totalUsd * ((quote.etapas_pago_anticipo_pct || 60) / 100)).toLocaleString()} USD)`, marginX + 4, currentY + 11.5);
  doc.text(`• Saldo Contra Entrega e Instalación: ${quote.etapas_pago_saldo_pct || 40}% ($${Math.round(totalUsd * ((quote.etapas_pago_saldo_pct || 40) / 100)).toLocaleString()} USD)`, marginX + 4, currentY + 16.5);
  doc.text(`• Garantía de Estructura: ${quote.garantia_anos || 5} años en soldaduras y cálculo estructural.`, marginX + 4, currentY + 21.5);

  // Right Total Highlight
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(234, 88, 12);
  doc.text(`TOTAL: $${totalUsd.toLocaleString()} USD`, pageWidth - marginX - 4, currentY + 10, { align: 'right' });
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`(Equivalente a Bs. ${totalBob.toLocaleString('es-BO')} BOB)`, pageWidth - marginX - 4, currentY + 17, { align: 'right' });

  currentY += 32;

  // Signatures
  const signY = currentY + 6;
  const signWidth = 70;

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.line(marginX + 10, signY + 12, marginX + 10 + signWidth, signY + 12);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(settings.representante_legal || 'Carlos David Vargas Añez', marginX + 10 + (signWidth / 2), signY + 16, { align: 'center' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(234, 88, 12);
  doc.text('Ingeniería & Proyectos PUBLI-X', marginX + 10 + (signWidth / 2), signY + 19.5, { align: 'center' });

  // Client signature line
  const clientSignX = pageWidth - marginX - signWidth - 10;
  doc.line(clientSignX, signY + 12, clientSignX + signWidth, signY + 12);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(quote.cliente_empresa || quote.cliente_nombre, clientSignX + (signWidth / 2), signY + 16, { align: 'center' });
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Aceptación de Oferta Técnica / Firma y Sello', clientSignX + (signWidth / 2), signY + 19.5, { align: 'center' });

  // Footer
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`PUBLI-X INGENIERÍA • Cotización Técnica N° ${quote.numero}`, marginX, 268);
  doc.text('Página 1 de 1', pageWidth - marginX, 268, { align: 'right' });

  doc.save(`Cotizacion_Tecnica_${quote.numero}_${(quote.cliente_empresa || quote.cliente_nombre).replace(/\s+/g, '_')}.pdf`);
};

// =========================================================================
// 3. GENERADOR DE CONTRATOS LEGALES CON LAS 11 CLÁUSULAS COMPLETAS
// =========================================================================
export const generateFullLegalContractPdf = async (
  contract: Contract,
  settings: Settings,
  onProgress?: (msg: string) => void
): Promise<void> => {
  onProgress?.('Generando Documento Oficial de Contrato con 11 Cláusulas...');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 16;
  const contentWidth = pageWidth - (marginX * 2);
  let currentY = 16;

  // Header Logo
  const logoData = settings.logo || (await getBase64ImageFromUrl(logoImg));
  if (logoData) {
    try {
      doc.addImage(logoData, 'JPEG', marginX, currentY, 36, 13);
    } catch (e) {
      console.warn('Logo error:', e);
    }
  }

  // Header Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('CONTRATO DE ARRENDAMIENTO DE ESPACIOS PUBLICITARIOS EXTERIORES', marginX + 42, currentY + 6);
  doc.setFontSize(8);
  doc.setTextColor(234, 88, 12);
  doc.text(`CONTRATO N°: ${contract.numero}`, marginX + 42, currentY + 11);

  currentY += 18;

  // Divider
  doc.setDrawColor(234, 88, 12);
  doc.setLineWidth(0.8);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 6;

  // Preamble Text with Cláusula 1ª
  const arrendadorNombre = settings.nombre_comercial || 'Publi-X Cobertura Nacional Impacto Total';
  const arrendadorNit = settings.nit || '4579387019';
  const arrendadorDomicilio = settings.domicilio_legal || 'Calle Los Tajibos 2185, Barrio Petrolero Norte, UV 0016 MZA 14, entre 2do anillo y Av. Los Cusis, frente a importadora TOA, Santa Cruz';
  const arrendadorRep = settings.representante_legal || 'Carlos David Vargas Añez';
  const arrendadorCi = `${settings.representante_ci || '4579387'} emitida en ${settings.representante_ci_emision || 'Santa Cruz'}`;

  const clienteNombre = contract.cliente_nombre || contract.cliente_empresa;
  const clienteNit = contract.cliente_nit_ci || '1015289020';
  const clienteDomicilio = contract.cliente_direccion || 'Av. Beni y 3er Anillo Externo, Santa Cruz';
  const clienteRep = contract.cliente_representante || contract.cliente_nombre;
  const clienteCi = contract.cliente_representante_ci || '3559515 emitida en Oruro';

  let poderClausula = '';
  if (contract.cliente_escritura_poder) {
    poderClausula = ` en mérito al Poder Especial y Suficiente N° ${contract.cliente_escritura_poder} de fecha ${contract.cliente_poder_fecha || '05 de Mayo del 2021'} otorgado ante la Notaría de Fe Pública ${contract.cliente_notaria_numero || 'N° 103'} a cargo de ${contract.cliente_notario_nombre || 'Dra. Marbel Silvana España Pedraza'}`;
  }

  const exchangeRate = settings.tipo_cambio || 6.96;
  const totalUsd = contract.total_neto_usd;
  const totalBob = Math.round(totalUsd * exchangeRate);
  const literalBob = numeroALetrasBolivianos(totalBob);

  const clauses = [
    {
      num: 'CLÁUSULA PRIMERA (DE LAS PARTES):',
      text: `Conste por el presente documento privado reconocido legalmente entre:\n1.1. EL ARRENDADOR: ${arrendadorNombre}, con N.I.T. ${arrendadorNit}, con domicilio legal en ${arrendadorDomicilio}, legalmente representada por el Sr. ${arrendadorRep}, mayor de edad, hábil por derecho, con C.I. N° ${arrendadorCi}.\n1.2. EL ARRENDATARIO: ${clienteNombre}, con N.I.T. ${clienteNit}, con domicilio en ${clienteDomicilio}, legalmente representada por ${clienteRep}, con C.I. N° ${clienteCi}${poderClausula}.`
    },
    {
      num: 'CLÁUSULA SEGUNDA (DEL OBJETO):',
      text: `EL ARRENDADOR concede en calidad de arrendamiento comercial temporal y exclusivo a favor de EL ARRENDATARIO, los espacios de publicidad exterior (Vallas / Pantallas LED) especificados en la Cláusula Tercera, garantizando su despeje visual, integridad estructural y exhibición comercial ininterrumpida.`
    },
    {
      num: 'CLÁUSULA TERCERA (DE LA UBICACIÓN Y CARACTERÍSTICAS):',
      text: `Los espacios publicitarios objeto del presente contrato corresponden al siguiente circuito:\n` +
        (contract.vallas_lista && contract.vallas_lista.length > 0 
          ? contract.vallas_lista.map((v, i) => `• Ítem ${i + 1}: ${v.formato || 'Valla Unipolar'} en ${v.direccion || v.ciudad} - Canon Mensual: Bs. ${(v.costo_neto_bs || v.costo_mensual_bs).toLocaleString('es-BO')} BOB.`).join('\n')
          : `• Espacio: ${contract.valla_nombre} (${contract.valla_tipo || 'Valla Unipolar'}), Ciudad: ${contract.valla_ciudad || 'Santa Cruz'}, Canon Mensual: Bs. ${totalBob.toLocaleString('es-BO')} BOB.`)
    },
    {
      num: 'CLÁUSULA CUARTA (DEL PLAZO Y VIGENCIA):',
      text: `El plazo de vigencia del presente contrato es de ${contract.periodo_meses || 12} meses forzosos para ambas partes, computables a partir del ${contract.fecha_inicio} hasta el ${contract.fecha_fin}. Podrá renovarse previo acuerdo escrito entre partes con treinta (30) días de anticipación.`
    },
    {
      num: 'CLÁUSULA QUINTA (DEL CANON DE ARRENDAMIENTO Y FORMA DE PAGO):',
      text: `El canon total convenido asciende a la suma de $${totalUsd.toLocaleString()} USD (Equivalente a Bs. ${totalBob.toLocaleString('es-BO')} BOB - SON: ${literalBob}), calculados al tipo de cambio oficial de Bs. ${exchangeRate.toFixed(2)} por 1 USD. El pago se efectuará mediante cuotas mensuales anticipadas dentro de los primeros diez (10) días calendario de cada periodo mensual, contra entrega de la Factura Oficial.`
    },
    {
      num: 'CLÁUSULA SEXTA (DE LA IMPRESIÓN, INSTALACIÓN Y MANTENIMIENTO):',
      text: `La confección de lonas se realizará en Lona Frontlight 13oz con filtro UV de alta duración. El montaje y tensado correrá por cuenta de cuadrillas técnicas especializadas de PUBLI-X. EL ARRENDADOR garantiza el mantenimiento preventivo y correctivo de la estructura y lonas ante contingencias climáticas.`
    },
    {
      num: 'CLÁUSULA SÉPTIMA (DE LA ILUMINACIÓN Y ENERGÍA ELÉCTRICA):',
      text: `EL ARRENDADOR garantiza el encendido diario ininterrumpido del sistema de reflectores LED de alta eficiencia en horario nocturno comprendido entre las 18:30 y 24:00 horas todos los días del año, asumiendo los costos del consumo eléctrico y mantenimiento de luminarias.`
    },
    {
      num: 'CLÁUSULA OCTAVA (DE LOS PERMISOS Y LICENCIAS MUNICIPALES):',
      text: `EL ARRENDADOR declara que las estructuras cuentan con las autorizaciones, registros y patentes municipales requeridas por las normativas de la Alcaldía correspondiente, asumiendo toda responsabilidad regulatoria del soporte físico.`
    },
    {
      num: 'CLÁUSULA NOVENA (DEL CONTENIDO PUBLICITARIO):',
      text: `EL ARRENDATARIO asume exclusiva responsabilidad por el diseño, marca, marcas registradas y contenidos gráficos expuestos, garantizando que no vulneran normativas legales vigentes ni derechos de terceros.`
    },
    {
      num: 'CLÁUSULA DÉCIMA (DE LA RESOLUCIÓN Y PENALIDADES):',
      text: `El incumplimiento en el pago de dos (2) mensualidades consecutivas facultará a EL ARRENDADOR a suspender la exhibición publicitaria y resolver el contrato de pleno derecho, sin perjuicio de exigir el cobro judicial de los montos adeudados e intereses de ley.`
    },
    {
      num: 'CLÁUSULA DÉCIMA PRIMERA (DE LA SOLUCIÓN DE CONTROVERSIAS Y ACEPTACIÓN):',
      text: `Para cualquier controversia que surja de la interpretación o ejecución del presente contrato, las partes fijan su domicilio legal en la ciudad de Santa Cruz de la Sierra y se someten expresamente a la conciliación y arbitraje del Centro de Arbitraje de ${settings.notaria_arbitraje || 'CAINCO Santa Cruz'} o juzgados ordinarios competentes.\n\nEn señal de plena conformidad con todas y cada una de las cláusulas precedentes, firman en doble ejemplar de un mismo tenor y validez.`
    }
  ];

  doc.setFontSize(7.2);

  clauses.forEach((c, idx) => {
    // Check if we need a new page
    if (currentY > pageHeight - 35) {
      doc.addPage();
      currentY = 16;
    }

    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(234, 88, 12);
    doc.text(c.num, marginX, currentY);
    currentY += 3.8;

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const lines = doc.splitTextToSize(c.text, contentWidth);
    doc.text(lines, marginX, currentY);
    currentY += (lines.length * 3.5) + 3;
  });

  // Check page overflow for signatures
  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 24;
  } else {
    currentY += 8;
  }

  // Signatures
  const signWidth = 72;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);

  // Arrendador
  doc.line(marginX + 6, currentY + 16, marginX + 6 + signWidth, currentY + 16);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(arrendadorRep, marginX + 6 + (signWidth / 2), currentY + 20, { align: 'center' });
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(234, 88, 12);
  doc.text('EL ARRENDADOR', marginX + 6 + (signWidth / 2), currentY + 23.5, { align: 'center' });
  doc.setTextColor(100, 116, 139);
  doc.text(arrendadorNombre, marginX + 6 + (signWidth / 2), currentY + 27, { align: 'center' });

  // Arrendatario
  const clientSignX = pageWidth - marginX - signWidth - 6;
  doc.line(clientSignX, currentY + 16, clientSignX + signWidth, currentY + 16);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(clienteRep, clientSignX + (signWidth / 2), currentY + 20, { align: 'center' });
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(234, 88, 12);
  doc.text('EL ARRENDATARIO', clientSignX + (signWidth / 2), currentY + 23.5, { align: 'center' });
  doc.setTextColor(100, 116, 139);
  doc.text(clienteNombre, clientSignX + (signWidth / 2), currentY + 27, { align: 'center' });

  doc.save(`Contrato_Oficial_${contract.numero}_${clienteNombre.replace(/\s+/g, '_')}.pdf`);
};

// =========================================================================
// 4. GENERADOR DE FACTURA COMERCIAL Y FISCAL PROFORMA (SIN)
// =========================================================================
export const generateFiscalInvoicePdf = async (
  invoice: Invoice,
  settings: Settings,
  onProgress?: (msg: string) => void
): Promise<void> => {
  onProgress?.('Generando Factura Fiscal Oficial...');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const contentWidth = pageWidth - (marginX * 2);
  let currentY = 12;

  // Left: Company Info
  const logoData = settings.logo || (await getBase64ImageFromUrl(logoImg));
  if (logoData) {
    try {
      doc.addImage(logoData, 'JPEG', marginX, currentY, 36, 13);
    } catch (e) {
      console.warn('Logo error:', e);
    }
  }

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(settings.nombre_comercial || 'Publi-X Cobertura Nacional Impacto Total', marginX, currentY + 18);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Casa Matriz: ${settings.domicilio_legal || 'Calle Los Tajibos 2185, Santa Cruz'}`, marginX, currentY + 22);
  doc.text(`Teléfono: ${settings.telefono || '+591 3 3559988'} • Santa Cruz - Bolivia`, marginX, currentY + 25.5);

  // Right: Fiscal Box (NIT / FACTURA N° / AUTORIZACIÓN)
  const fiscalBoxWidth = 72;
  const fiscalBoxX = pageWidth - marginX - fiscalBoxWidth;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(234, 88, 12);
  doc.setLineWidth(0.6);
  doc.roundedRect(fiscalBoxX, currentY, fiscalBoxWidth, 26, 2, 2, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`NIT: ${settings.nit || '4579387019'}`, fiscalBoxX + (fiscalBoxWidth / 2), currentY + 6, { align: 'center' });

  doc.setFontSize(10.5);
  doc.setTextColor(234, 88, 12);
  doc.text(`FACTURA N°: ${invoice.numero_factura}`, fiscalBoxX + (fiscalBoxWidth / 2), currentY + 12, { align: 'center' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`CÓD. AUTORIZACIÓN: ${invoice.codigo_autorizacion || '4A8F93B27C10E'}`, fiscalBoxX + (fiscalBoxWidth / 2), currentY + 18, { align: 'center' });
  doc.text('ACTIVIDAD: PUBLICIDAD EXTERIOR OOH', fiscalBoxX + (fiscalBoxWidth / 2), currentY + 22.5, { align: 'center' });

  currentY += 32;

  // Title Banner
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(marginX, currentY, contentWidth, 6.5, 1, 1, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('FACTURA (CON DERECHO A CRÉDITO FISCAL)', pageWidth / 2, currentY + 4.5, { align: 'center' });

  currentY += 10;

  // Client Details
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, currentY, contentWidth, 18, 1.5, 1.5, 'FD');

  const fechaFactura = new Date(invoice.fecha_emision).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Fecha:', marginX + 4, currentY + 5.5);
  doc.setFont('Helvetica', 'normal');
  doc.text(fechaFactura, marginX + 16, currentY + 5.5);

  doc.setFont('Helvetica', 'bold');
  doc.text('Señor(es):', marginX + 4, currentY + 11.5);
  doc.setFont('Helvetica', 'normal');
  doc.text(`${invoice.razon_social || invoice.cliente_nombre}`, marginX + 20, currentY + 11.5);

  // Right
  doc.setFont('Helvetica', 'bold');
  doc.text('NIT / CI:', pageWidth - marginX - 50, currentY + 5.5);
  doc.setFont('Helvetica', 'normal');
  doc.text(`${invoice.nit_ci}`, pageWidth - marginX - 4, currentY + 5.5, { align: 'right' });

  doc.setFont('Helvetica', 'bold');
  doc.text('Estado SIN:', pageWidth - marginX - 50, currentY + 11.5);
  doc.setTextColor(234, 88, 12);
  doc.text(`${invoice.estado_sin || 'Emitida / Válida'}`, pageWidth - marginX - 4, currentY + 11.5, { align: 'right' });

  currentY += 22;

  // Items Table
  const items = invoice.items || [
    {
      id: '1',
      codigo: 'PUB-001',
      descripcion: 'Alquiler de Espacio Publicitario OOH (Valla Unipolar)',
      cantidad: 1,
      unidad: 'MES',
      precio_unitario_bob: invoice.monto_total_bob,
      descuento_bob: 0,
      subtotal_bob: invoice.monto_total_bob
    }
  ];

  const tableData = items.map((it, idx) => [
    String(idx + 1),
    it.codigo || `ITM-0${idx + 1}`,
    it.descripcion,
    String(it.cantidad),
    it.unidad || 'UNI',
    `Bs. ${it.precio_unitario_bob.toLocaleString('es-BO')}`,
    it.descuento_bob > 0 ? `Bs. ${it.descuento_bob.toLocaleString('es-BO')}` : '-',
    `Bs. ${it.subtotal_bob.toLocaleString('es-BO')}`
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Código', 'Descripción del Servicio / Producto', 'Cant.', 'Unidad', 'P. Unit. (Bs.)', 'Descuento', 'Subtotal (Bs.)']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
    bodyStyles: { fontSize: 7.2, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 72 },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 18, halign: 'right' },
      7: { cellWidth: 24, halign: 'right', fontStyle: 'bold', textColor: [234, 88, 12] }
    },
    margin: { left: marginX, right: marginX }
  });

  // @ts-ignore
  currentY = (doc as any).lastAutoTable.finalY + 6;

  // Literal in Words & Totals
  const literal = invoice.monto_literal || numeroALetrasBolivianos(invoice.monto_total_bob);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, currentY, contentWidth, 24, 1.5, 1.5, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('SON:', marginX + 4, currentY + 6);
  doc.setFont('Helvetica', 'normal');
  doc.text(literal, marginX + 14, currentY + 6);

  doc.setFont('Helvetica', 'bold');
  doc.text('Concepto / Contrato:', marginX + 4, currentY + 12);
  doc.setFont('Helvetica', 'normal');
  doc.text(invoice.concepto || 'Alquiler de Espacios Publicitarios OOH', marginX + 35, currentY + 12);

  // Right Totals
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(234, 88, 12);
  doc.text(`TOTAL FACTURADO: Bs. ${invoice.monto_total_bob.toLocaleString('es-BO')} BOB`, pageWidth - marginX - 4, currentY + 8, { align: 'right' });

  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`IMPORTE BASE CRÉDITO FISCAL: Bs. ${invoice.monto_total_bob.toLocaleString('es-BO')} BOB`, pageWidth - marginX - 4, currentY + 14, { align: 'right' });

  currentY += 28;

  // Fiscal Ley 453 & QR code section
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(marginX, currentY, contentWidth, 14, 1.5, 1.5, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(153, 27, 27);
  doc.text('"ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS, EL USO ILÍCITO SERÁ SANCIONADO PENALMENTE DE ACUERDO A LEY"', pageWidth / 2, currentY + 4.5, { align: 'center' });
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text('Ley N° 453: El proveedor debe brindar información clara y oportuna sobre los servicios ofertados.', pageWidth / 2, currentY + 9, { align: 'center' });

  doc.save(`Factura_${invoice.numero_factura}_${invoice.nit_ci}.pdf`);
};
