import pptxgen from 'pptxgenjs';
import { Vehicle, Client, Settings } from '../types';
import { getFieldLabel } from './fieldLabels';

export const generateCatalogPptx = async (
  selectedVehicles: Vehicle[],
  client: Client,
  exchangeRate: number,
  settings: Settings,
  onProgress?: (text: string) => void
): Promise<void> => {
  if (selectedVehicles.length === 0) {
    throw new Error('Debe seleccionar al menos una valla o pantalla para generar el PowerPoint.');
  }

  onProgress?.('Iniciando generador de PowerPoint...');
  const pptx = new pptxgen();
  
  // Set widescreen layout
  pptx.layout = 'LAYOUT_16x9';

  const companyName = settings.nombre_empresa || 'PUBLI-X BOLIVIA';
  const accentColor = 'F59E0B'; // Amber 500
  const primaryBgColor = '0F172A'; // Slate 900
  const lightGrayBg = 'F8FAFC'; // Slate 50
  const borderLineColor = 'E2E2E2';

  // ----------------------------------------------------
  // SLIDE 1: Cover Slide
  // ----------------------------------------------------
  onProgress?.('Diseñando portada de PowerPoint...');
  const coverSlide = pptx.addSlide();
  
  // Slate dark background
  coverSlide.background = { fill: primaryBgColor };

  // Decorative top border
  coverSlide.addShape('rect' as any, {
    x: 0, y: 0, w: '100%', h: 0.15,
    fill: { color: accentColor }
  });

  // Company Name
  coverSlide.addText(companyName, {
    x: 1.0, y: 1.8, w: 11.3, h: 0.8,
    fontSize: 36,
    bold: true,
    fontFace: 'Helvetica',
    color: accentColor,
    align: 'left'
  });

  // Subtitle
  coverSlide.addText('PORTAFOLIO EXCLUSIVO DE PUBLICIDAD EXTERIOR & PANTALLAS LED', {
    x: 1.0, y: 2.5, w: 11.3, h: 0.4,
    fontSize: 12,
    fontFace: 'Helvetica',
    color: '94A3B8', // slate-400
    bold: true,
    align: 'left'
  });

  // Main banner text
  coverSlide.addText('CATÁLOGO DE VALLAS Y PANTALLAS SELECCIONADAS', {
    x: 1.0, y: 3.4, w: 11.3, h: 0.8,
    fontSize: 24,
    bold: true,
    fontFace: 'Arial Black',
    color: 'FFFFFF',
    align: 'left'
  });

  // Client Details Panel (simulating card shape)
  coverSlide.addShape('roundrect' as any, {
    x: 1.0, y: 4.4, w: 7.0, h: 2.1,
    fill: { color: '1E293B' }, // slate-800
    line: { color: '334155', width: 1 }
  });

  coverSlide.addText('DESTINATARIO COMERCIAL:', {
    x: 1.2, y: 4.5, w: 6.6, h: 0.3,
    fontSize: 10,
    bold: true,
    fontFace: 'Helvetica',
    color: accentColor
  });

  coverSlide.addText(
    [
      { text: `Cliente:  `, options: { bold: true, color: '94A3B8', fontSize: 11 } },
      { text: `${client.nombre}\n`, options: { color: 'FFFFFF', fontSize: 12, bold: true } },
      { text: `Celular:  `, options: { bold: true, color: '94A3B8', fontSize: 11 } },
      { text: `${client.celular || 'No registrado'}\n`, options: { color: 'FFFFFF', fontSize: 11 } },
      { text: `Ubicación: `, options: { bold: true, color: '94A3B8', fontSize: 11 } },
      { text: `${client.ciudad}, ${client.departamento}, Bolivia\n`, options: { color: 'FFFFFF', fontSize: 11 } },
      { text: `Presupuesto: `, options: { bold: true, color: '94A3B8', fontSize: 11 } },
      { text: `$${client.presupuesto_usd.toLocaleString()} USD (~Bs. ${(client.presupuesto_usd * exchangeRate).toLocaleString()} BOB)`, options: { color: 'F59E0B', fontSize: 11, bold: true } }
    ],
    {
      x: 1.2, y: 4.8, w: 6.6, h: 1.5,
      fontFace: 'Helvetica',
      align: 'left',
      valign: 'top',
      lineSpacing: 22
    }
  );

  // Disclaimer and info text right side
  coverSlide.addText(
    'Estimado cliente,\n\n' +
    'Le presentamos una propuesta técnica meticulosa, con precios y características adaptadas a su requerimiento. ' +
    'Tome nota de los Códigos Únicos indicados en cada diapositiva para agilizar su proceso de consulta y reservación.',
    {
      x: 8.3, y: 4.4, w: 4.0, h: 2.1,
      fontSize: 10,
      fontFace: 'Helvetica',
      color: 'CBD5E1', // slate-300
      align: 'left',
      valign: 'top',
      lineSpacing: 18
    }
  );

  // Footer on cover
  coverSlide.addText(`${companyName} © ${new Date().getFullYear()} • Publicidad Exterior e Impacto Urbano en Bolivia`, {
    x: 1.0, y: 6.8, w: 11.3, h: 0.3,
    fontSize: 9,
    fontFace: 'Helvetica',
    color: '64748B' // slate-500
  });

  // ----------------------------------------------------
  // SLIDES 2+: One Slide Per Selected Vehicle
  // ----------------------------------------------------
  let vIndex = 0;
  for (const vehicle of selectedVehicles) {
    vIndex++;
    onProgress?.(`Añadiendo ${vehicle.marca} ${vehicle.modelo} a la diapositiva ${vIndex + 1}...`);
    
    const slide = pptx.addSlide();
    
    // Top banner
    slide.addShape('rect' as any, {
      x: 0, y: 0, w: '100%', h: 0.9,
      fill: { color: primaryBgColor }
    });
    slide.addShape('rect' as any, {
      x: 0, y: 0.9, w: '100%', h: 0.05,
      fill: { color: accentColor }
    });

    // Top Header Company name & Client link
    slide.addText(companyName, {
      x: 0.5, y: 0.2, w: 5.0, h: 0.5,
      fontSize: 18,
      bold: true,
      fontFace: 'Helvetica',
      color: 'FFFFFF'
    });
    slide.addText(`Propuesta Comercial para: ${client.nombre}`, {
      x: 6.0, y: 0.3, w: 6.8, h: 0.3,
      fontSize: 10,
      fontFace: 'Helvetica',
      color: '94A3B8',
      align: 'right'
    });

    // 1. Vehicle Title Block (Top Page Content)
    slide.addText(`${vehicle.marca.toUpperCase()} ${vehicle.modelo.toUpperCase()}`, {
      x: 0.5, y: 1.1, w: 7.5, h: 0.5,
      fontSize: 22,
      bold: true,
      fontFace: 'Helvetica',
      color: primaryBgColor
    });
    slide.addText(vehicle.version || '', {
      x: 0.5, y: 1.5, w: 7.5, h: 0.3,
      fontSize: 11,
      fontFace: 'Helvetica',
      color: '64748B',
      italic: true
    });

    // State badge representation
    let stateColor = '107C41'; // Green
    if (vehicle.estado === 'Reservado') stateColor = 'D97706'; // Amber
    if (vehicle.estado === 'En importación') stateColor = '4F46E5'; // Indigo
    if (vehicle.estado === 'Vendido') stateColor = 'DC2626'; // Rose

    slide.addText(`ESTADO: ${vehicle.estado.toUpperCase()}`, {
      x: 0.5, y: 1.85, w: 4.5, h: 0.3,
      fontSize: 10,
      bold: true,
      fontFace: 'Helvetica',
      color: stateColor
    });

    // 2. Main Vehicle Image Frame (Left Column)
    // PowerPoint handles adding images beautifully using URL strings directly
    try {
      slide.addImage({
        path: vehicle.imagen_principal || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600',
        x: 0.5, y: 2.2, w: 5.2, h: 3.4
      });
      // Outer border shape
      slide.addShape('rect' as any, {
        x: 0.5, y: 2.2, w: 5.2, h: 3.4,
        fill: { color: 'FF0000', transparency: 100 }, // Transparent fill
        line: { color: borderLineColor, width: 1 }
      });
    } catch (e) {
      console.error("Error setting slide image:", e);
    }

    // 3. Technical Specs Box (Right Column)
    slide.addShape('roundrect' as any, {
      x: 6.0, y: 2.2, w: 6.8, h: 3.4,
      fill: { color: lightGrayBg },
      line: { color: borderLineColor, width: 1 }
    });

    slide.addText('FICHA TÉCNICA PERSONALIZADA', {
      x: 6.2, y: 2.3, w: 6.4, h: 0.3,
      fontSize: 10,
      bold: true,
      fontFace: 'Helvetica',
      color: primaryBgColor
    });

    const labelBrand = getFieldLabel('vehicle_marca', settings);
    const labelModel = getFieldLabel('vehicle_modelo', settings);
    const labelType = getFieldLabel('vehicle_tipo', settings);
    const labelZona = getFieldLabel('vehicle_zona', settings);
    const labelCara = getFieldLabel('vehicle_cara', settings);
    const labelMedidas = getFieldLabel('vehicle_medidas', settings);
    const labelTraffic = getFieldLabel('vehicle_transitabilidad', settings);
    const labelCostoLona = getFieldLabel('vehicle_costo_lona', settings);

    slide.addText(
      [
        { text: `• ${labelBrand}: `, options: { bold: true, color: '1E293B', fontSize: 10 } },
        { text: `${vehicle.marca || 'PUBLI-X'}\n`, options: { color: '475569', fontSize: 10 } },
        
        { text: `• ${labelModel}: `, options: { bold: true, color: '1E293B', fontSize: 10 } },
        { text: `${vehicle.avenida_calle || vehicle.modelo}\n`, options: { color: '475569', fontSize: 10 } },
        
        { text: `• ${labelType}: `, options: { bold: true, color: '1E293B', fontSize: 10 } },
        { text: `${vehicle.tipo_valla || vehicle.tipo}\n`, options: { color: '475569', fontSize: 10 } },
        
        { text: `• ${labelZona}: `, options: { bold: true, color: '1E293B', fontSize: 10 } },
        { text: `${vehicle.zona || 'Zona Comercial'}\n`, options: { color: '475569', fontSize: 10 } },
        
        { text: `• ${labelCara}: `, options: { bold: true, color: '1E293B', fontSize: 10 } },
        { text: `${vehicle.cara || 'Cara A'}\n`, options: { color: '475569', fontSize: 10 } },
        
        { text: `• ${labelMedidas}: `, options: { bold: true, color: '1E293B', fontSize: 10 } },
        { text: `${vehicle.medidas || '10 x 4 m'}\n`, options: { color: '475569', fontSize: 10 } },
        
        { text: `• ${labelTraffic}: `, options: { bold: true, color: '1E293B', fontSize: 10 } },
        { text: `${vehicle.transitabilidad_trafico || 'Alto flujo'}\n`, options: { color: '475569', fontSize: 10 } },
        
        { text: `• ${labelCostoLona}: `, options: { bold: true, color: '1E293B', fontSize: 10 } },
        { text: `Bs. ${vehicle.costo_lona_m2_bs || 65}/m²\n`, options: { color: '475569', fontSize: 10 } }
      ],
      {
        x: 6.2, y: 2.6, w: 6.4, h: 2.8,
        fontFace: 'Helvetica',
        align: 'left',
        valign: 'top',
        lineSpacing: 16
      }
    );

    // 4. Pricing Panel (Bottom Left)
    slide.addShape('roundrect' as any, {
      x: 0.5, y: 5.7, w: 5.2, h: 0.9,
      fill: { color: 'F1F5F9' },
      line: { color: borderLineColor, width: 1 }
    });

    slide.addText('ALQUILER MENSUAL (INCLUYE ILUMINACIÓN Y MANTENIMIENTO):', {
      x: 0.6, y: 5.75, w: 5.0, h: 0.2,
      fontSize: 8,
      bold: true,
      fontFace: 'Helvetica',
      color: '64748B'
    });

    const priceUsdString = `$${vehicle.precio_usd.toLocaleString()} USD`;
    const priceBobString = `(~Bs. ${Math.round(vehicle.precio_usd * exchangeRate).toLocaleString()} BOB)`;

    slide.addText(
      [
        { text: priceUsdString, options: { bold: true, color: accentColor, fontSize: 18 } },
        { text: `  ${priceBobString}`, options: { color: '475569', fontSize: 11, bold: true } }
      ],
      {
        x: 0.6, y: 5.95, w: 5.0, h: 0.5,
        fontFace: 'Helvetica',
        valign: 'middle'
      }
    );

    // 5. Unique Selection Code Box (CRITICAL MANDATE)
    // "con un codigo unico para que cuando el cliente escoja pueda enviar solo el codigo"
    slide.addShape('roundrect' as any, {
      x: 6.0, y: 5.7, w: 6.8, h: 0.9,
      fill: { color: 'FFFBEB' }, // Warm amber-50
      line: { color: 'FDE68A', width: 1 } // Amber-200 border
    });

    slide.addText('CÓDIGO ÚNICO DE RESERVACIÓN (ENVÍE ESTE CÓDIGO AL VENDEDOR):', {
      x: 6.2, y: 5.75, w: 6.4, h: 0.2,
      fontSize: 8,
      bold: true,
      fontFace: 'Helvetica',
      color: 'B45309' // Amber-700
    });

    slide.addText(`COD-${vehicle.id}`, {
      x: 6.2, y: 5.95, w: 6.4, h: 0.5,
      fontSize: 20,
      bold: true,
      fontFace: 'Courier New',
      color: 'B45309',
      align: 'left'
    });

    // 6. Slide Footer
    slide.addText(`Página ${vIndex + 1} de ${selectedVehicles.length + 1} | Catálogo Personalizado ${companyName}`, {
      x: 0.5, y: 6.75, w: 12.3, h: 0.2,
      fontSize: 8,
      fontFace: 'Helvetica',
      color: '94A3B8',
      align: 'left'
    });
  }

  // Save PowerPoint Presentation
  onProgress?.('Compilando y descargando PowerPoint...');
  const sanitizedClientName = client.nombre.replace(/[^a-zA-Z0-9]/g, '_');
  await pptx.writeFile({ fileName: `Catalogo_Comercial_${sanitizedClientName}.pptx` });
};
