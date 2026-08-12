import { jsPDF } from 'jspdf';
import { Vehicle, Client, Settings } from '../types';
import { getFieldLabel } from './fieldLabels';

// Helper to convert an image URL to Base64 with CORS handling
const getBase64ImageFromUrl = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
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
          // Compress slightly to avoid massive PDF size
          const dataURL = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataURL);
        } else {
          resolve(null);
        }
      } catch (e) {
        console.error("CORS canvas error for URL:", url, e);
        resolve(null);
      }
    };
    img.onerror = () => {
      console.warn("Failed to load image for PDF:", url);
      resolve(null);
    };
    img.src = url;
  });
};

export const generateCatalogPdf = async (
  selectedVehicles: Vehicle[],
  client: Client,
  exchangeRate: number,
  onProgress?: (text: string) => void,
  settings?: Settings
): Promise<void> => {
  if (selectedVehicles.length === 0) {
    throw new Error('Debe seleccionar al menos un vehículo.');
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 15;
  const contentWidth = pageWidth - (marginX * 2); // 180mm

  // Colors
  const cPrimary = [15, 23, 42]; // slate-900 (#0f172a)
  const cSecondary = [100, 116, 139]; // slate-500
  const cAccent = [245, 158, 11]; // amber-500 (#f59e0b)
  const cGrayBg = [248, 250, 252]; // slate-50
  const cBorder = [226, 232, 240]; // slate-200

  // 1. PAGE 1: Stunning Cover Page / Presentation Header
  onProgress?.('Preparando diseño de portada...');
  
  // Cover page Background layout details
  doc.setFillColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  doc.rect(0, 0, pageWidth, 90, 'F'); // Dark header banner

  // Gold accent bar
  doc.setFillColor(cAccent[0], cAccent[1], cAccent[2]);
  doc.rect(0, 90, pageWidth, 4, 'F');

  // Title on dark banner
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('PUBLI-X BOLIVIA', marginX, 35);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(cAccent[0], cAccent[1], cAccent[2]);
  doc.text('CIRCUITO NACIONAL DE VALLAS PUBLICITARIAS Y PANTALLAS LED GIGANTES', marginX, 42);

  // Document details on cover
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.text('PRESENTACIÓN EJECUTIVA DE ESPACIOS PUBLICITARIOS', marginX, 65);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-ES')}`, marginX, 72);

  // Client Details Card Section
  doc.setFillColor(cGrayBg[0], cGrayBg[1], cGrayBg[2]);
  doc.rect(marginX, 105, contentWidth, 48, 'F');
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.setLineWidth(0.5);
  doc.rect(marginX, 105, contentWidth, 48, 'S');

  // Client Card Title
  doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('INFORMACIÓN DE DESTINATARIO', marginX + 6, 114);

  // Separator line in card
  doc.setDrawColor(226, 232, 240);
  doc.line(marginX + 6, 117, marginX + contentWidth - 6, 117);

  // Client data fields
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(cSecondary[0], cSecondary[1], cSecondary[2]);
  
  doc.text('Empresa / Cliente:', marginX + 8, 126);
  doc.text('Celular:', marginX + 8, 133);
  doc.text('Ubicación:', marginX + 8, 140);
  doc.text('Presupuesto:', marginX + 8, 147);

  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  doc.setFontSize(10);
  const clientDisplayName = client.empresa ? `${client.empresa} - ${client.nombre}` : client.nombre;
  doc.text(clientDisplayName, marginX + 38, 126);
  doc.text(client.celular || 'No registrado', marginX + 38, 133);
  doc.text(`${client.ciudad}, ${client.departamento}, Bolivia`, marginX + 38, 140);
  
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(cAccent[0], cAccent[1], cAccent[2]);
  doc.text(`$${client.presupuesto_usd.toLocaleString()} USD (Bs. ${(client.presupuesto_usd * exchangeRate).toLocaleString()} Aprox)`, marginX + 38, 147);

  // Descriptive text below client card
  doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Estimado/a cliente,', marginX, 170);
  
  const introText = 'A continuación, le presentamos la propuesta seleccionada de vallas publicitarias y pantallas LED gigantes ubicadas estratégicamente en arterias de alta transitabilidad vehicular y peatonal en Bolivia. Cada espacio incluye detalles de visibilidad, dimensiones e inversión estimada.';
  const splitIntro = doc.splitTextToSize(introText, contentWidth);
  doc.text(splitIntro, marginX, 176);

  // Instructions / Disclaimer
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Condiciones del Servicio Comercial:', marginX, 210);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(cSecondary[0], cSecondary[1], cSecondary[2]);
  const terms = [
    '• Precios expresados en Dólares Estadounidenses ($us) e informativos al tipo de cambio del día.',
    '• Reserva de espacio confirmada mediante anticipo del 50% y contrato de alquiler de publicidad exterior.',
    '• Servicio de impresión de lonavinil e instalación coordinado con equipo técnico certificado.',
    '• Mantenimiento preventivo e iluminación nocturna incluidos en contratos de mediano y largo plazo.'
  ];
  let termY = 217;
  terms.forEach(term => {
    doc.text(term, marginX, termY);
    termY += 6;
  });

  // Footer on cover
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  doc.text('PUBLI-X BOLIVIA - PUBLICIDAD EXTERIOR INTEGRAL', marginX, 275);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(cSecondary[0], cSecondary[1], cSecondary[2]);
  doc.setFontSize(8);
  doc.text('Contacto Comercial: ventas@publix.bo | Telf: +591 70000000', marginX, 280);

  // Page index
  doc.text('Página 1 de ' + (Math.ceil(selectedVehicles.length / 2) + 1), pageWidth - marginX - 15, 280);

  // 2. VEHICLES LIST (2 units per page)
  let currentVehicleIndex = 0;
  let pageNum = 2;

  while (currentVehicleIndex < selectedVehicles.length) {
    doc.addPage();
    onProgress?.(`Procesando página ${pageNum}...`);

    // Gold accent band on top of every page
    doc.setFillColor(cPrimary[0], cPrimary[1], cPrimary[2]);
    doc.rect(0, 0, pageWidth, 12, 'F');
    doc.setFillColor(cAccent[0], cAccent[1], cAccent[2]);
    doc.rect(0, 12, pageWidth, 1, 'F');

    // Mini header text on top band
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('MLA AUTOMOTORS - PORTAFOLIO EXCLUSIVO', marginX, 8);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Destinatario: ${client.nombre}`, pageWidth - marginX - 55, 8);

    // Render up to 2 vehicles on this page
    const vehiclesOnThisPage = selectedVehicles.slice(currentVehicleIndex, currentVehicleIndex + 2);
    
    for (let i = 0; i < vehiclesOnThisPage.length; i++) {
      const vehicle = vehiclesOnThisPage[i];
      const startY = 22 + (i * 125); // Top boundary of vehicle section

      onProgress?.(`Procesando ${vehicle.marca} ${vehicle.modelo} (${currentVehicleIndex + 1}/${selectedVehicles.length})...`);

      // Vehicle Header background box
      doc.setFillColor(cGrayBg[0], cGrayBg[1], cGrayBg[2]);
      doc.rect(marginX, startY, contentWidth, 10, 'F');
      
      // Brand / Model
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
      doc.text(`${vehicle.marca.toUpperCase()} ${vehicle.modelo.toUpperCase()}`, marginX + 4, startY + 7);

      // Unique selection code for client
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(217, 119, 6); // amber-600
      doc.text(`COD-${vehicle.id}`, marginX + 85, startY + 7);

      // Version tag
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(cSecondary[0], cSecondary[1], cSecondary[2]);
      doc.text(vehicle.version || '', marginX + 120, startY + 7);

      // Status Badge
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      let badgeBg = [237, 247, 242]; // Greenish for available
      let badgeText = [16, 124, 65];
      if (vehicle.estado === 'Reservado') {
        badgeBg = [255, 244, 229];
        badgeText = [124, 65, 16];
      } else if (vehicle.estado === 'En importación') {
        badgeBg = [238, 242, 255];
        badgeText = [79, 70, 229];
      } else if (vehicle.estado === 'Vendido') {
        badgeBg = [254, 242, 242];
        badgeText = [220, 38, 38];
      }

      doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
      doc.rect(marginX + contentWidth - 30, startY + 2.5, 26, 5, 'F');
      doc.setTextColor(badgeText[0], badgeText[1], badgeText[2]);
      doc.text(vehicle.estado.toUpperCase(), marginX + contentWidth - 27, startY + 6);

      // Let's load the base64 image
      const imageBase64 = await getBase64ImageFromUrl(vehicle.imagen_principal);

      const imageX = marginX;
      const imageY = startY + 14;
      const imageWidth = 65;
      const imageHeight = 43;

      if (imageBase64) {
        try {
          doc.addImage(imageBase64, 'JPEG', imageX, imageY, imageWidth, imageHeight);
          
          // Outer black frame around the image
          doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
          doc.setLineWidth(0.3);
          doc.rect(imageX, imageY, imageWidth, imageHeight, 'S');
        } catch (e) {
          console.error("Error embedding image into PDF:", e);
          // Fallback box
          drawFallbackPlaceholder(doc, imageX, imageY, imageWidth, imageHeight, vehicle.marca, cBorder, cSecondary);
        }
      } else {
        // Fallback placeholder box
        drawFallbackPlaceholder(doc, imageX, imageY, imageWidth, imageHeight, vehicle.marca, cBorder, cSecondary);
      }

      // Specs Column (Middle/Right)
      const specsX = marginX + 70;
      const specsY = startY + 16;

      doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      
      doc.text('Características Técnicas:', specsX, specsY);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);

      const cellHeight = 5.2;
      
      // Dynamic custom fields support
      const labelType = settings ? getFieldLabel('vehicle_tipo', settings) : 'Tipo de Estructura';
      const labelModel = settings ? getFieldLabel('vehicle_modelo', settings) : 'Ubicación / Avenida';
      const labelZona = settings ? getFieldLabel('vehicle_zona', settings) : 'Zona / Distrito';
      const labelCara = settings ? getFieldLabel('vehicle_cara', settings) : 'Cara / Vista';
      const labelMedidas = settings ? getFieldLabel('vehicle_medidas', settings) : 'Medidas';
      const labelTraffic = settings ? getFieldLabel('vehicle_transitabilidad', settings) : 'Transitabilidad';
      const labelCostoLona = settings ? getFieldLabel('vehicle_costo_lona', settings) : 'Impresión Lona';

      const specs = [
        `• ${labelType}: ${vehicle.tipo_valla || vehicle.tipo}`,
        `• ${labelModel}: ${vehicle.avenida_calle || vehicle.modelo}`,
        `• ${labelZona}: ${vehicle.zona || 'Zona Comercial'}`,
        `• ${labelCara}: ${vehicle.cara || 'Cara A'}`,
        `• ${labelMedidas}: ${vehicle.medidas || '10 x 4 m'}`,
        `• ${labelTraffic}: ${vehicle.transitabilidad_trafico || 'Alto flujo'}`,
        `• ${labelCostoLona}: Bs. ${vehicle.costo_lona_m2_bs || 65}/m²`
      ];

      specs.forEach((spec, sIdx) => {
        doc.text(spec, specsX, specsY + 6 + (sIdx * cellHeight));
      });

      // Price block (Spacious panel bottom left/right)
      const pricePanelX = marginX;
      const pricePanelY = startY + 62;
      const pricePanelW = 65;
      const pricePanelH = 14;

      doc.setFillColor(cGrayBg[0], cGrayBg[1], cGrayBg[2]);
      doc.rect(pricePanelX, pricePanelY, pricePanelW, pricePanelH, 'F');
      doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
      doc.rect(pricePanelX, pricePanelY, pricePanelW, pricePanelH, 'S');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(cSecondary[0], cSecondary[1], cSecondary[2]);
      doc.text('PRECIO DE IMPORTACIÓN (CIF HASTA ADUANA)', pricePanelX + 3, pricePanelY + 4.5);

      doc.setFontSize(12);
      doc.setTextColor(cAccent[0], cAccent[1], cAccent[2]);
      const priceBob = vehicle.precio_usd * exchangeRate;
      doc.text(`$${vehicle.precio_usd.toLocaleString()} USD`, pricePanelX + 3, pricePanelY + 11.5);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(cSecondary[0], cSecondary[1], cSecondary[2]);
      doc.text(`(Equiv: Bs. ${Math.round(priceBob).toLocaleString()} Aprox)`, pricePanelX + 38, pricePanelY + 11.5);

      // Description text
      const descX = marginX + 70;
      const descY = startY + specs.length * cellHeight + 21;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
      doc.text('Descripción Comercial:', descX, descY);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(cSecondary[0], cSecondary[1], cSecondary[2]);
      const vehicleDesc = vehicle.descripcion || 'Esta unidad cuenta con equipamiento premium y un estado de conservación verificado de importación desde subastas oficiales. Comuníquese con su asesor para conocer las especificaciones extendidas y opciones de equipamiento adicional.';
      const splitDesc = doc.splitTextToSize(vehicleDesc, 110);
      doc.text(splitDesc, descX, descY + 4);

      // Horizontal separator line between vehicles if 2 items exist
      if (i === 0 && vehiclesOnThisPage.length > 1) {
        doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
        doc.setLineWidth(0.4);
        doc.line(marginX, startY + 114, marginX + contentWidth, startY + 114);
      }

      currentVehicleIndex++;
    }

    // Page footer
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(cSecondary[0], cSecondary[1], cSecondary[2]);
    doc.setFontSize(7.5);
    doc.text('Catálogo Personalizado MLA AutoSender. Sujeto a variabilidad de fletes y stock.', marginX, 280);
    
    const totalPages = Math.ceil(selectedVehicles.length / 2) + 1;
    doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - marginX - 15, 280);

    pageNum++;
  }

  // Save the generated PDF
  onProgress?.('Guardando archivo PDF...');
  const sanitizedClientName = client.nombre.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Catalogo_PUBLI_X_${sanitizedClientName}.pdf`);
};

/**
 * Generates an executive 1-Page PDF "Ficha Técnica OOH" for a single Billboard / LED Screen
 */
export const generateSingleVallaPdf = async (
  vehicle: Vehicle,
  exchangeRate: number,
  client?: Client | null,
  onProgress?: (text: string) => void,
  settings?: Settings
): Promise<void> => {
  onProgress?.('Generando Ficha Técnica OOH...');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const marginX = 15;
  const contentWidth = pageWidth - (marginX * 2); // 180mm

  // Colors
  const cPrimary = [13, 24, 43]; // #0d182b - PUBLI-X Dark Navy
  const cAccentOrange = [255, 140, 0]; // #ff8c00 - PUBLI-X Orange
  const cAccentBlue = [15, 160, 230]; // #0fa0e6 - PUBLI-X Blue
  const cGrayBg = [248, 250, 252];
  const cBorder = [226, 232, 240];

  // Header Banner
  doc.setFillColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Orange Accent Stripe
  doc.setFillColor(cAccentOrange[0], cAccentOrange[1], cAccentOrange[2]);
  doc.rect(0, 42, pageWidth, 3, 'F');

  // Title Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('PUBLI-X BOLIVIA', marginX, 18);

  doc.setFontSize(9);
  doc.setTextColor(cAccentOrange[0], cAccentOrange[1], cAccentOrange[2]);
  doc.text('FICHA TÉCNICA Y ESPECIFICACIONES DE ESPACIO PUBLICITARIO OOH', marginX, 25);

  doc.setFontSize(8);
  doc.setTextColor(200, 210, 225);
  doc.text(`Cobertura Nacional | Impacto Total • Fecha: ${new Date().toLocaleDateString('es-ES')}`, marginX, 32);

  // Client Info Tag if provided
  if (client) {
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`Preparado para: ${client.nombre} ${client.empresa ? `(${client.empresa})` : ''}`, pageWidth - marginX - 70, 32);
  }

  let currentY = 52;

  // Code & Category Header Bar
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(marginX, currentY, contentWidth, 12, 2, 2, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  const codeText = `CÓDIGO: COD-${vehicle.id}`;
  doc.text(codeText, marginX + 4, currentY + 8);

  doc.setFontSize(10);
  doc.setTextColor(cAccentBlue[0], cAccentBlue[1], cAccentBlue[2]);
  const categoryText = `${vehicle.tipo_valla || vehicle.tipo || 'Valla Publicitaria'} • ${vehicle.cara || 'Cara A'}`;
  doc.text(categoryText, pageWidth - marginX - doc.getTextWidth(categoryText) - 4, currentY + 8);

  currentY += 18;

  // Billboard Title Location
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  const title = vehicle.avenida_calle || vehicle.modelo || 'Ubicación OOH Bolivia';
  doc.text(title, marginX, currentY);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`📍 ${vehicle.ciudad} • ${vehicle.zona || 'Centro'} (${vehicle.provincia || 'Andrés Ibáñez'})`, marginX, currentY + 6);

  currentY += 13;

  // Main Photo Box
  const photoHeight = 72;
  const photoWidth = 110;

  let imageLoaded = false;
  if (vehicle.imagen_principal) {
    onProgress?.('Cargando fotografía de alta resolución...');
    const base64Img = await getBase64ImageFromUrl(vehicle.imagen_principal);
    if (base64Img) {
      try {
        doc.addImage(base64Img, 'JPEG', marginX, currentY, photoWidth, photoHeight);
        imageLoaded = true;
      } catch (err) {
        console.warn('Error rendering image in single PDF:', err);
      }
    }
  }

  if (!imageLoaded) {
    drawFallbackPlaceholder(doc, marginX, currentY, photoWidth, photoHeight, vehicle.modelo || 'PUBLI-X', cBorder, [100, 116, 139]);
  }

  // Right Side Specs & Price Box
  const rightX = marginX + photoWidth + 6;
  const rightWidth = contentWidth - photoWidth - 6;

  // Price Card Box
  doc.setFillColor(254, 243, 199); // Amber-100
  doc.setDrawColor(251, 191, 36); // Amber-400
  doc.roundedRect(rightX, currentY, rightWidth, 32, 3, 3, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(146, 64, 14); // Amber-800
  doc.text('ALQUILER MENSUAL', rightX + 4, currentY + 7);

  doc.setFontSize(18);
  doc.setTextColor(217, 119, 6); // Amber-600
  doc.text(`$${vehicle.precio_usd.toLocaleString()} USD`, rightX + 4, currentY + 17);

  const priceBob = Math.round(vehicle.precio_usd * exchangeRate);
  doc.setFontSize(9);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(120, 53, 15);
  doc.text(`Bs. ${priceBob.toLocaleString()} BOB (T/C ${exchangeRate})`, rightX + 4, currentY + 24);

  // Lona Cost Card
  const lonaCost = (vehicle.costo_lona_m2_bs || 65);
  let areaM2 = 40;
  if (vehicle.medidas) {
    const nums = vehicle.medidas.match(/(\d+(?:\.\d+)?)/g);
    if (nums && nums.length >= 2) {
      const w = parseFloat(nums[0]);
      const h = parseFloat(nums[1]);
      if (w > 0 && h > 0) areaM2 = Math.round(w * h);
    }
  }
  const lonaTotalBs = areaM2 * lonaCost;

  doc.setFillColor(cGrayBg[0], cGrayBg[1], cGrayBg[2]);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.roundedRect(rightX, currentY + 36, rightWidth, 36, 3, 3, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('COSTO IMPRESIÓN LONA', rightX + 4, currentY + 43);

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`Bs. ${lonaTotalBs.toLocaleString()} BOB`, rightX + 4, currentY + 52);

  doc.setFontSize(7.5);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Base: ${areaM2} m² @ Bs. ${lonaCost}/m²`, rightX + 4, currentY + 58);
  doc.text(`Lona Frontlight 13oz Alta Res.`, rightX + 4, currentY + 64);

  currentY += photoHeight + 10;

  // Technical Specs Table Section
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  doc.text('ESPECIFICACIONES TÉCNICAS Y ENTORNOS DE EXPOSICIÓN', marginX, currentY);

  currentY += 4;

  // Table Data Array
  const specRows = [
    ['Categoría / Estructura:', vehicle.tipo_valla || vehicle.tipo || 'Valla Publicitaria', 'Dimensiones / Formato:', vehicle.medidas || '10m x 4m (40 m²)'],
    ['Orientación / Cara:', vehicle.cara || 'Cara A', 'Visibilidad / Tráfico:', vehicle.transitabilidad_trafico || 'Alto tráfico diario'],
    ['Departamento / Ciudad:', `${vehicle.ciudad || 'Santa Cruz'} - Bolivia`, 'Zona / Avenida:', vehicle.avenida_calle || vehicle.zona || 'Ubicación Estratégica'],
    ['Iluminación:', vehicle.iluminacion || 'Focos LED Nocturnos HD', 'Estado de Disponibilidad:', vehicle.estado || 'Disponible']
  ];

  doc.setFontSize(8.5);
  let rowY = currentY;

  specRows.forEach((row, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
    doc.rect(marginX, rowY, contentWidth, 8, 'F');
    doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
    doc.rect(marginX, rowY, contentWidth, 8, 'S');

    // Col 1 Label
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(row[0], marginX + 3, rowY + 5.5);

    // Col 1 Value
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(row[1], marginX + 45, rowY + 5.5);

    // Col 2 Label
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(row[2], marginX + 95, rowY + 5.5);

    // Col 2 Value
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(row[3], marginX + 138, rowY + 5.5);

    rowY += 8;
  });

  currentY = rowY + 8;

  // Commercial Observations / Details Box
  if (vehicle.detalle || vehicle.descripcion) {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(marginX, currentY, contentWidth, 20, 2, 2, 'F');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(cPrimary[0], cPrimary[1], cPrimary[2]);
    doc.text('Detalles Comerciales & Flujo:', marginX + 4, currentY + 6);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const detailText = vehicle.detalle || vehicle.descripcion || 'Punto de alta visibilidad para impacto comercial.';
    const splitText = doc.splitTextToSize(detailText, contentWidth - 8);
    doc.text(splitText, marginX + 4, currentY + 12);

    currentY += 24;
  }

  // Footer Contact Banner
  const footerY = 262;
  doc.setFillColor(cPrimary[0], cPrimary[1], cPrimary[2]);
  doc.rect(0, footerY, pageWidth, 35, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(cAccentOrange[0], cAccentOrange[1], cAccentOrange[2]);
  doc.text('PUBLI-X BOLIVIA • DEPARTAMENTO COMERCIAL Y VENTAS OOH', marginX, footerY + 8);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('📞 WhatsApp / Central: +591 70000000 • Email: ventas@publix.bo', marginX, footerY + 15);
  doc.text('🌐 Catálogo On-line: www.publix.bo • Cobertura en La Paz, Santa Cruz, Cochabamba, Tarija y todo el país.', marginX, footerY + 21);

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Sujeto a disponibilidad al momento de la confirmación formal del contrato. Precios expresados en USD y BOB.', marginX, footerY + 28);

  // Save the PDF
  onProgress?.('Guardando Ficha Técnica PDF...');
  const sanitizedTitle = (vehicle.avenida_calle || vehicle.modelo || `valla_${vehicle.id}`).replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Ficha_Tecnica_PUBLI_X_${vehicle.id}_${sanitizedTitle}.pdf`);
};

// Resilient Image Fallback Drawer
const drawFallbackPlaceholder = (

  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  brand: string,
  cBorder: number[],
  cSecondary: number[]
) => {
  doc.setFillColor(241, 245, 249); // light blue-gray background
  doc.rect(x, y, w, h, 'F');
  
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.setLineWidth(0.3);
  doc.rect(x, y, w, h, 'S');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('IMAGEN EN CATÁLOGO', x + (w / 2) - 17, y + (h / 2) - 1.5);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`MLA AUTOMOTORS - ${brand}`, x + (w / 2) - 20, y + (h / 2) + 4);
};
