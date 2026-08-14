import { jsPDF } from 'jspdf';
import { Vehicle, Client, Settings } from '../types';
import { getFieldLabel } from './fieldLabels';
import logoImg from '../assets/images/publi_x_logo_1786377194733.jpg';

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
    doc.text('PUBLI-X BOLIVIA - PORTAFOLIO DE PUBLICIDAD EXTERIOR (OOH)', marginX, 8);
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
    doc.text('Catálogo de Publicidad Exterior PUBLI-X BOLIVIA. Sujeto a disponibilidad de espacios y reserva.', marginX, 280);
    
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
  doc.text(`PUBLI-X BOLIVIA - ${brand}`, x + (w / 2) - 20, y + (h / 2) + 4);
};

// =========================================================================
// 3. GENERADOR AUTOMÁTICO DE COTIZACIONES CON PRECIO DE LONAS Y CONTRATO
// =========================================================================

export interface AutoQuotationVallaDetail {
  id: string;
  nombre: string;
  tipo: string;
  medidas: string;
  ciudad: string;
  avenida: string;
  cara: string;
  alquilerMensualUsd: number;
  alquilerMensualBob: number;
  areaM2: number;
  costoLonaM2Bs: number;
  costoLonaTotalBs: number;
  costoLonaTotalUsd: number;
  iluminacion?: string;
  imagen?: string;
}

export interface GenerateAutoQuotationPdfParams {
  quoteNumber: string;
  fechaEmision: string;
  validezDias?: number;
  client: Client;
  vallas: AutoQuotationVallaDetail[];
  costoMontajeUsd?: number;
  costoMantenimientoUsd?: number;
  descuentoUsd?: number;
  totalAlquilerUsd: number;
  totalLonasUsd: number;
  totalGeneralUsd: number;
  totalGeneralBob: number;
  exchangeRate: number;
  emitterName: string;
  emitterRole: 'Gerente' | 'Vendedor' | 'Dueño' | string;
  emitterPhone?: string;
  emitterEmail?: string;
  includeContract?: boolean;
  observaciones?: string;
  settings?: Settings;
  onProgress?: (msg: string) => void;
}

export const generateAutoQuotationWithContractPdf = async (
  params: GenerateAutoQuotationPdfParams
): Promise<void> => {
  const {
    quoteNumber,
    fechaEmision,
    validezDias = 15,
    client,
    vallas,
    costoMontajeUsd = 0,
    costoMantenimientoUsd = 0,
    descuentoUsd = 0,
    totalAlquilerUsd,
    totalLonasUsd,
    totalGeneralUsd,
    totalGeneralBob,
    exchangeRate,
    emitterName,
    emitterRole,
    emitterPhone = '+591 70000000',
    emitterEmail = 'ventas@publix.bo',
    includeContract = true,
    observaciones = '',
    settings,
    onProgress
  } = params;

  onProgress?.('Iniciando generador automático de cotización OOH...');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - (marginX * 2); // 182mm

  // Palette
  const cDark = [15, 23, 42]; // Slate-900
  const cAmber = [245, 158, 11]; // Amber-500
  const cAmberDark = [180, 83, 9]; // Amber-700
  const cGrayText = [100, 116, 139]; // Slate-500
  const cBorder = [226, 232, 240]; // Slate-200
  const cBgSoft = [248, 250, 252]; // Slate-50

  // -------------------------------------------------------------
  // PÁGINA 1: COTIZACIÓN FORMAL OOH & DESGLOSE DE LONAS
  // -------------------------------------------------------------
  onProgress?.('Renderizando membrete corporativo y datos del cliente...');

  // Top Accent Bar
  doc.setFillColor(cDark[0], cDark[1], cDark[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFillColor(cAmber[0], cAmber[1], cAmber[2]);
  doc.rect(0, 28, pageWidth, 2.5, 'F');

  // Load and place Logo
  try {
    const logoBase64 = await getBase64ImageFromUrl(settings?.logo || logoImg);
    if (logoBase64) {
      doc.addImage(logoBase64, 'JPEG', marginX, 4, 46, 20);
    } else {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(cAmber[0], cAmber[1], cAmber[2]);
      doc.text('PUBLI-X', marginX, 15);
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text('COBERTURA NACIONAL | IMPACTO TOTAL', marginX, 21);
    }
  } catch {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(cAmber[0], cAmber[1], cAmber[2]);
    doc.text('PUBLI-X', marginX, 15);
  }

  // Header Right: Title and Doc Number
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('COTIZACIÓN FORMAL DE PUBLICIDAD EXTERIOR', pageWidth - marginX, 10, { align: 'right' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(cAmber[0], cAmber[1], cAmber[2]);
  doc.text(`N° ${quoteNumber}`, pageWidth - marginX, 16, { align: 'right' });

  doc.setTextColor(200, 200, 200);
  doc.setFontSize(7.5);
  doc.text(`Fecha de Emisión: ${fechaEmision} • Validez: ${validezDias} días`, pageWidth - marginX, 22, { align: 'right' });

  let currentY = 36;

  // -------------------------------------------------------------
  // CARDS: EMISOR (GERENTE/VENDEDOR) & DESTINATARIO (CLIENTE)
  // -------------------------------------------------------------
  const cardWidth = (contentWidth - 6) / 2;
  const cardHeight = 32;

  // 1. EMISOR CARD (Requerimiento d: detector/selector de Gerente o Vendedor)
  doc.setFillColor(cBgSoft[0], cBgSoft[1], cBgSoft[2]);
  doc.roundedRect(marginX, currentY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.roundedRect(marginX, currentY, cardWidth, cardHeight, 2, 2, 'S');

  doc.setFillColor(cDark[0], cDark[1], cDark[2]);
  doc.roundedRect(marginX, currentY, cardWidth, 6.5, 2, 2, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(cAmber[0], cAmber[1], cAmber[2]);
  doc.text('I. ASESOR / EMISOR RESPONSABLE', marginX + 3, currentY + 4.5);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.text(emitterName, marginX + 3, currentY + 12);

  // Role Badge
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(cAmberDark[0], cAmberDark[1], cAmberDark[2]);
  const roleDisplay = emitterRole === 'Gerente' || emitterRole === 'Dueño' ? 'GERENTE GENERAL / DIRECCIÓN' : 'ASESOR COMERCIAL DE CUENTAS';
  doc.text(`• ${roleDisplay}`, marginX + 3, currentY + 17);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(cGrayText[0], cGrayText[1], cGrayText[2]);
  doc.text(`Empresa: ${settings?.nombre_empresa || 'PUBLI-X BOLIVIA'}`, marginX + 3, currentY + 22);
  doc.text(`WhatsApp: ${emitterPhone} • Correo: ${emitterEmail}`, marginX + 3, currentY + 27);

  // 2. RECEPTOR / CLIENTE CARD
  const clientCardX = marginX + cardWidth + 6;
  doc.setFillColor(cBgSoft[0], cBgSoft[1], cBgSoft[2]);
  doc.roundedRect(clientCardX, currentY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.roundedRect(clientCardX, currentY, cardWidth, cardHeight, 2, 2, 'S');

  doc.setFillColor(cDark[0], cDark[1], cDark[2]);
  doc.roundedRect(clientCardX, currentY, cardWidth, 6.5, 2, 2, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('II. CLIENTE / DESTINATARIO DE LA PROPUESTA', clientCardX + 3, currentY + 4.5);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  const clientNameFull = client.empresa ? `${client.nombre} (${client.empresa})` : client.nombre;
  doc.text(clientNameFull, clientCardX + 3, currentY + 12);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(cGrayText[0], cGrayText[1], cGrayText[2]);
  if (client.nit_ci) {
    doc.text(`NIT / CI: ${client.nit_ci}`, clientCardX + 3, currentY + 17);
  } else {
    doc.text(`Contacto Comercial: ${client.nombre}`, clientCardX + 3, currentY + 17);
  }
  doc.text(`Celular / WhatsApp: ${client.celular || 'No registrado'}`, clientCardX + 3, currentY + 22);
  doc.text(`Ciudad: ${client.ciudad || 'Santa Cruz'} - Bolivia • T/C: Bs. ${exchangeRate}`, clientCardX + 3, currentY + 27);

  currentY += cardHeight + 6;

  // -------------------------------------------------------------
  // TABLA 1: ESPACIOS PUBLICITARIOS COTIZADOS (VALLAS SELECCIONADAS)
  // -------------------------------------------------------------
  onProgress?.('Generando tabla de vallas y soportes seleccionados...');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.text('III. ESPACIOS PUBLICITARIOS SELECCIONADOS (ALQUILER MENSUAL)', marginX, currentY);

  currentY += 3;

  // Table Header
  const colWidths = [8, 38, 62, 28, 22, 24]; // Total 182mm
  doc.setFillColor(cDark[0], cDark[1], cDark[2]);
  doc.rect(marginX, currentY, contentWidth, 6, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('#', marginX + 2, currentY + 4);
  doc.text('TIPO / FORMATO', marginX + 10, currentY + 4);
  doc.text('UBICACIÓN & AVENIDA ESTRATÉGICA', marginX + 48, currentY + 4);
  doc.text('MEDIDAS / CARA', marginX + 112, currentY + 4);
  doc.text('ALQUILER USD', marginX + 140, currentY + 4, { align: 'right' });
  doc.text('EQUIV. EN BOB', marginX + 164, currentY + 4, { align: 'right' });

  currentY += 6;

  // Rows
  doc.setFontSize(7);
  vallas.forEach((v, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(marginX, currentY, contentWidth, 7, 'F');
    doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
    doc.rect(marginX, currentY, contentWidth, 7, 'S');

    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(cDark[0], cDark[1], cDark[2]);
    doc.text(String(idx + 1), marginX + 2, currentY + 4.5);

    doc.setFont('Helvetica', 'bold');
    doc.text((v.tipo || 'Valla Unipolar').substring(0, 22), marginX + 10, currentY + 4.5);

    doc.setFont('Helvetica', 'normal');
    doc.text((v.avenida || v.nombre || 'Ubicación Estratégica').substring(0, 42), marginX + 48, currentY + 4.5);

    doc.text(`${v.medidas || '12x4m'} (${v.cara || 'Cara A'})`, marginX + 112, currentY + 4.5);

    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(cAmberDark[0], cAmberDark[1], cAmberDark[2]);
    doc.text(`$${v.alquilerMensualUsd.toLocaleString()}`, marginX + 140, currentY + 4.5, { align: 'right' });

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(cDark[0], cDark[1], cDark[2]);
    doc.text(`Bs. ${v.alquilerMensualBob.toLocaleString('es-BO')}`, marginX + 164, currentY + 4.5, { align: 'right' });

    currentY += 7;
  });

  currentY += 4;

  // -------------------------------------------------------------
  // TABLA 2: DESGLOSE DETALLADO DE CONFECCIÓN DE LONAS (REQUERIMIENTO a)
  // -------------------------------------------------------------
  onProgress?.('Calculando y desglosando costos de impresión y confección de lonas...');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.text('IV. DESGLOSE INDIVIDUAL DE CONFECCIÓN E IMPRESIÓN DE LONAS', marginX, currentY);

  currentY += 3;

  // Header Lonas
  doc.setFillColor(cAmberDark[0], cAmberDark[1], cAmberDark[2]);
  doc.rect(marginX, currentY, contentWidth, 6, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('VALLA / SOPORTE DESTINO', marginX + 3, currentY + 4);
  doc.text('DIMENSIONES', marginX + 70, currentY + 4);
  doc.text('ÁREA (M²)', marginX + 98, currentY + 4, { align: 'right' });
  doc.text('PRECIO / M²', marginX + 120, currentY + 4, { align: 'right' });
  doc.text('SUBTOTAL LONAS (BOB)', marginX + 150, currentY + 4, { align: 'right' });
  doc.text('TOTAL (USD)', marginX + 178, currentY + 4, { align: 'right' });

  currentY += 6;

  doc.setFontSize(7);
  let sumAreaM2 = 0;
  let sumLonasBob = 0;

  vallas.forEach((v, idx) => {
    sumAreaM2 += v.areaM2;
    sumLonasBob += v.costoLonaTotalBs;

    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 254, isEven ? 255 : 252, isEven ? 255 : 243);
    doc.rect(marginX, currentY, contentWidth, 7, 'F');
    doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
    doc.rect(marginX, currentY, contentWidth, 7, 'S');

    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(cDark[0], cDark[1], cDark[2]);
    doc.text((v.avenida || v.nombre || 'Valla Publicitaria').substring(0, 36), marginX + 3, currentY + 4.5);

    doc.setFont('Helvetica', 'normal');
    doc.text(v.medidas || '12x4m', marginX + 70, currentY + 4.5);

    doc.text(`${v.areaM2} m²`, marginX + 98, currentY + 4.5, { align: 'right' });
    doc.text(`Bs. ${v.costoLonaM2Bs || 65}`, marginX + 120, currentY + 4.5, { align: 'right' });

    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(cDark[0], cDark[1], cDark[2]);
    doc.text(`Bs. ${v.costoLonaTotalBs.toLocaleString('es-BO')}`, marginX + 150, currentY + 4.5, { align: 'right' });

    doc.setTextColor(cAmberDark[0], cAmberDark[1], cAmberDark[2]);
    doc.text(`$${v.costoLonaTotalUsd.toLocaleString()}`, marginX + 178, currentY + 4.5, { align: 'right' });

    currentY += 7;
  });

  // Total Lonas Row
  doc.setFillColor(254, 243, 199); // Amber-100
  doc.rect(marginX, currentY, contentWidth, 7, 'F');
  doc.setDrawColor(cAmber[0], cAmber[1], cAmber[2]);
  doc.rect(marginX, currentY, contentWidth, 7, 'S');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(146, 64, 14); // Amber-900
  doc.text('TOTAL IMPRESIÓN DE LONAS FRONTLIGHT 13OZ:', marginX + 3, currentY + 4.8);
  doc.text(`${sumAreaM2} m² totales`, marginX + 98, currentY + 4.8, { align: 'right' });
  doc.text(`Bs. ${sumLonasBob.toLocaleString('es-BO')} BOB`, marginX + 150, currentY + 4.8, { align: 'right' });
  doc.text(`$${totalLonasUsd.toLocaleString()} USD`, marginX + 178, currentY + 4.8, { align: 'right' });

  currentY += 11;

  // -------------------------------------------------------------
  // RESUMEN ECONÓMICO FINAL
  // -------------------------------------------------------------
  doc.setFillColor(cDark[0], cDark[1], cDark[2]);
  doc.roundedRect(marginX, currentY, contentWidth, 38, 2, 2, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(cAmber[0], cAmber[1], cAmber[2]);
  doc.text('V. RESUMEN FINANCIERO TOTAL DE LA PROPUESTA OOH', marginX + 4, currentY + 6);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  doc.text(`• Subtotal Alquiler Mensual (${vallas.length} espacios):`, marginX + 4, currentY + 13);
  doc.text(`$${totalAlquilerUsd.toLocaleString()} USD  (Bs. ${Math.round(totalAlquilerUsd * exchangeRate).toLocaleString('es-BO')})`, marginX + 120, currentY + 13);

  doc.text(`• Subtotal Impresión & Confección Lonas (${sumAreaM2} m²):`, marginX + 4, currentY + 18);
  doc.text(`$${totalLonasUsd.toLocaleString()} USD  (Bs. ${sumLonasBob.toLocaleString('es-BO')})`, marginX + 120, currentY + 18);

  doc.text('• Montaje en Estructura, Tensado & Iluminación LED Nocturna:', marginX + 4, currentY + 23);
  doc.text(`$${costoMontajeUsd + costoMantenimientoUsd} USD  (INCLUIDO / GARANTIZADO)`, marginX + 120, currentY + 23);

  if (descuentoUsd > 0) {
    doc.setTextColor(cAmber[0], cAmber[1], cAmber[2]);
    doc.text(`• Descuento Comercial Especial Aplicado:`, marginX + 4, currentY + 28);
    doc.text(`- $${descuentoUsd.toLocaleString()} USD  (- Bs. ${Math.round(descuentoUsd * exchangeRate).toLocaleString('es-BO')})`, marginX + 120, currentY + 28);
  }

  // Total Highlight Bar inside Summary
  doc.setFillColor(cAmber[0], cAmber[1], cAmber[2]);
  doc.roundedRect(marginX + 2, currentY + 29, contentWidth - 4, 7.5, 1.5, 1.5, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.text('TOTAL GENERAL DE LA INVERSIÓN:', marginX + 5, currentY + 34);
  doc.text(`$${totalGeneralUsd.toLocaleString()} USD  |  Bs. ${totalGeneralBob.toLocaleString('es-BO')} BOB`, pageWidth - marginX - 5, currentY + 34, { align: 'right' });

  // Page 1 Footer
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(cGrayText[0], cGrayText[1], cGrayText[2]);
  doc.text('PUBLI-X BOLIVIA • Cobertura Nacional en Vallas Gigantes y Pantallas LED • www.publix.bo • Santa Cruz, Bolivia', marginX, 290);
  doc.text('Página 1 de 2', pageWidth - marginX, 290, { align: 'right' });

  // -------------------------------------------------------------
  // PÁGINA 2: CONTRATO ASOCIADO & TÉRMINOS DEL SERVICIO (REQUERIMIENTO b)
  // -------------------------------------------------------------
  if (includeContract) {
    onProgress?.('Generando contrato de servicio y términos legales asociados...');

    doc.addPage();

    // Top Header Banner
    doc.setFillColor(cDark[0], cDark[1], cDark[2]);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setFillColor(cAmber[0], cAmber[1], cAmber[2]);
    doc.rect(0, 20, pageWidth, 2, 'F');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(255, 255, 255);
    doc.text('CONTRATO DE ARRENDAMIENTO DE ESPACIOS PUBLICITARIOS (OOH)', marginX, 10);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(cAmber[0], cAmber[1], cAmber[2]);
    doc.text(`DOCUMENTO ASOCIADO A LA COTIZACIÓN N° ${quoteNumber} • PUBLI-X BOLIVIA`, marginX, 16);

    let contractY = 28;

    // Preamble
    doc.setFillColor(cBgSoft[0], cBgSoft[1], cBgSoft[2]);
    doc.roundedRect(marginX, contractY, contentWidth, 14, 2, 2, 'F');
    doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
    doc.roundedRect(marginX, contractY, contentWidth, 14, 2, 2, 'S');

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(cDark[0], cDark[1], cDark[2]);
    const preamble = `Conste por el presente documento privado de términos y condiciones de servicio comercial que se suscribe entre PUBLI-X BOLIVIA (El Arrendador) y ${client.empresa || client.nombre} (El Arrendatario), bajo las siguientes cláusulas y estipulaciones de mutuo acuerdo:`;
    const splitPreamble = doc.splitTextToSize(preamble, contentWidth - 6);
    doc.text(splitPreamble, marginX + 3, contractY + 5);

    contractY += 18;

    // Clauses List
    const clauses = [
      {
        title: 'CLÁUSULA PRIMERA (OBJETO DEL ARRENDAMIENTO):',
        text: `EL ARRENDADOR concede a favor de EL ARRENDATARIO el uso temporal y exclusivo de los ${vallas.length} espacios de publicidad exterior (Vallas / Pantallas) detallados en la carátula económica, asegurando el despeje visual y la exhibición de la marca contratada durante el periodo estipulado.`
      },
      {
        title: 'CLÁUSULA SEGUNDA (CONFECCIÓN, IMPRESIÓN Y MONTAJE DE LONAS):',
        text: `La confección de las lonas publicitarias se realizará en material Frontlight 13oz de alta tenacidad con tintas UV resistentes a la intemperie. La instalación y tensado en estructura metálica será ejecutada por personal técnico especializado con equipo de seguridad y altura certificado por PUBLI-X.`
      },
      {
        title: 'CLÁUSULA TERCERA (SISTEMA DE ILUMINACIÓN LED Y MANTENIMIENTO):',
        text: 'EL ARRENDADOR garantiza el encendido diario ininterrumpido del sistema de iluminación LED desde las 18:30 hasta las 24:00 horas todos los días del año. Asimismo, se compromete al mantenimiento preventivo de reflectores, estructura y re-tensado ante eventuales inclemencias climáticas severas.'
      },
      {
        title: 'CLÁUSULA CUARTA (PRECIO, FACTURACIÓN Y FORMA DE PAGO):',
        text: `El canon total convenido es de $${totalGeneralUsd.toLocaleString()} USD (Equivalente a Bs. ${totalGeneralBob.toLocaleString('es-BO')} BOB facturados al tipo de cambio oficial de Bs. ${exchangeRate}). El pago se realizará dentro de los primeros cinco (5) días calendario de cada periodo mensual convenido.`
      },
      {
        title: 'CLÁUSULA QUINTA (RESPONSABILIDAD DEL CONTENIDO PUBLICITARIO):',
        text: 'EL ARRENDATARIO declara ser el titular legítimo o contar con las autorizaciones debidas sobre las marcas, artes y diseños expuestos, deslindando a PUBLI-X de toda responsabilidad respecto al contenido comercial exhibido.'
      },
      {
        title: 'CLÁUSULA SEXTA (JURISDICCIÓN, CONCILIACIÓN Y CONFORMIDAD):',
        text: 'Para la interpretación o cumplimiento del presente instrumento, las partes renuncian a su fuero y se someten al Centro de Conciliación y Arbitraje Comercial de CAINCO (Santa Cruz) o juzgados competentes según la legislación del Estado Plurinacional de Bolivia.'
      }
    ];

    clauses.forEach((c) => {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(cAmberDark[0], cAmberDark[1], cAmberDark[2]);
      doc.text(c.title, marginX, contractY);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(cDark[0], cDark[1], cDark[2]);
      const splitText = doc.splitTextToSize(c.text, contentWidth);
      doc.text(splitText, marginX, contractY + 4);

      contractY += 5 + (splitText.length * 3.4) + 2;
    });

    if (observaciones && observaciones.trim()) {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(cDark[0], cDark[1], cDark[2]);
      doc.text('OBSERVACIONES PARTICULARES:', marginX, contractY);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      const splitObs = doc.splitTextToSize(observaciones.trim(), contentWidth);
      doc.text(splitObs, marginX, contractY + 4);
      contractY += 5 + (splitObs.length * 3.4) + 2;
    }

    // -------------------------------------------------------------
    // SIGNATURE BLOCKS (EMISOR Y CLIENTE)
    // -------------------------------------------------------------
    const signY = 248;
    const signBoxWidth = (contentWidth - 20) / 2;

    // Signature 1: Emitter (Gerente / Vendedor)
    doc.setDrawColor(cDark[0], cDark[1], cDark[2]);
    doc.setLineWidth(0.4);
    doc.line(marginX + 5, signY + 16, marginX + 5 + signBoxWidth, signY + 16);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(cDark[0], cDark[1], cDark[2]);
    doc.text(emitterName, marginX + 5 + (signBoxWidth / 2), signY + 21, { align: 'center' });

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(cAmberDark[0], cAmberDark[1], cAmberDark[2]);
    doc.text(`${emitterRole.toUpperCase()} - PUBLI-X BOLIVIA`, marginX + 5 + (signBoxWidth / 2), signY + 25, { align: 'center' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(cGrayText[0], cGrayText[1], cGrayText[2]);
    doc.text('El Arrendador • Firma Autorizada', marginX + 5 + (signBoxWidth / 2), signY + 29, { align: 'center' });

    // Signature 2: Cliente / Arrendatario
    const clientSignX = marginX + signBoxWidth + 20;
    doc.line(clientSignX, signY + 16, clientSignX + signBoxWidth, signY + 16);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(cDark[0], cDark[1], cDark[2]);
    doc.text(client.nombre, clientSignX + (signBoxWidth / 2), signY + 21, { align: 'center' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(cGrayText[0], cGrayText[1], cGrayText[2]);
    doc.text(client.empresa ? `Representante Legal (${client.empresa})` : 'El Arrendatario / Cliente', clientSignX + (signBoxWidth / 2), signY + 25, { align: 'center' });
    doc.text('Conformidad y Aceptación de Términos', clientSignX + (signBoxWidth / 2), signY + 29, { align: 'center' });

    // Page 2 Footer
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(cGrayText[0], cGrayText[1], cGrayText[2]);
    doc.text('PUBLI-X BOLIVIA • Cobertura Nacional en Vallas Gigantes y Pantallas LED • www.publix.bo • Santa Cruz, Bolivia', marginX, 290);
    doc.text('Página 2 de 2', pageWidth - marginX, 290, { align: 'right' });
  }

  // Save the PDF
  onProgress?.('Guardando archivo PDF en su dispositivo...');
  const safeClient = (client.empresa || client.nombre).replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Cotizacion_Contrato_PUBLIX_${quoteNumber}_${safeClient}.pdf`;
  doc.save(filename);
};

