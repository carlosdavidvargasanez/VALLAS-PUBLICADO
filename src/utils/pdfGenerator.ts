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
  doc.text('VALLAS & LED BOLIVIA', marginX, 35);
  
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
  doc.text('VALLAS & LED BOLIVIA - PUBLICIDAD EXTERIOR INTEGRAL', marginX, 275);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(cSecondary[0], cSecondary[1], cSecondary[2]);
  doc.setFontSize(8);
  doc.text('Contacto Comercial: ventas@vallasledbolivia.com | Telf: +591 70000000', marginX, 280);

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
      const labelYear = settings ? getFieldLabel('vehicle_anio', settings) : 'Año';
      const labelType = settings ? getFieldLabel('vehicle_tipo', settings) : 'Carrocería';
      const labelEngine = settings ? getFieldLabel('vehicle_motor', settings) : 'Motor/Cilindrada';
      const labelFuel = settings ? getFieldLabel('vehicle_combustible', settings) : 'Combustible';
      const labelTrans = settings ? getFieldLabel('vehicle_transmision', settings) : 'Transmisión';
      const labelTract = settings ? getFieldLabel('vehicle_traccion', settings) : 'Tracción';
      const labelColor = settings ? getFieldLabel('vehicle_color', settings) : 'Color Exterior';

      const specs = [
        `• ${labelYear}: ${vehicle.anio}`,
        `• ${labelType}: ${vehicle.tipo}`,
        `• ${labelEngine}: ${vehicle.motor || 'Verificar'}`,
        `• ${labelFuel}: ${vehicle.combustible}`,
        `• ${labelTrans}: ${vehicle.transmision}`,
        `• ${labelTract}: ${vehicle.traccion}`,
        `• ${labelColor}: ${vehicle.color || 'A elección'}`
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
  doc.save(`Catalogo_Personalizado_${sanitizedClientName}.pdf`);
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
