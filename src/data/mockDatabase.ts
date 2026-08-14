import { Client, Vehicle, Quotation, Contract, FollowUp, MessageTemplate, AuditLog, Settings, UserSession, PendingQuotationRequest } from '../types';
import { INITIAL_VEHICLES } from './initialVehicles';
import { generateClientCredentials } from '../utils/credentials';

const DB_KEYS = {
  CLIENTS: 'mla_autosender_clients',
  VEHICLES: 'mla_autosender_vehicles',
  QUOTATIONS: 'mla_autosender_quotations',
  CONTRACTS: 'mla_autosender_contracts',
  FOLLOW_UPS: 'mla_autosender_follow_ups',
  TEMPLATES: 'mla_autosender_templates',
  AUDIT_LOGS: 'mla_autosender_audit_logs',
  SETTINGS: 'mla_autosender_settings',
  USERS: 'mla_autosender_users',
  CURRENT_USER: 'mla_autosender_current_user',
  PENDING_REQUESTS: 'mla_autosender_pending_requests',
};

const INITIAL_CLIENTS: Client[] = [
  {
    id: 'C001',
    nombre: 'Carlos David Vargas',
    empresa: 'PUBLI-X Bolivia',
    celular: '+59170000000',
    ciudad: 'Santa Cruz',
    departamento: 'Santa Cruz',
    pais: 'Bolivia',
    presupuesto_usd: 12000,
    observaciones: 'Cliente principal y corporativo. Interesado en Vallas Unipolares de Alto Impacto en el 3er Anillo de Santa Cruz.',
    estado: 'Interesado',
    usuario_acceso: 'carlos.vargas',
    password_acceso: '70000000',
    fecha_registro: '2026-07-01T09:10:00Z',
    fecha_actualizacion: '2026-07-11T15:30:00Z'
  },
  {
    id: 'C002',
    nombre: 'Lic. Paola Carmiña Pericón',
    empresa: 'Universidad Privada Domingo Savio (UPDS)',
    razon_social: 'Universidad Privada Domingo Savio S.A.',
    nit_ci: '1015289020',
    celular: '+59172012345',
    ciudad: 'Santa Cruz',
    departamento: 'Santa Cruz',
    pais: 'Bolivia',
    presupuesto_usd: 15000,
    observaciones: 'Requiere 3 vallas unipolares estratégicas más impresión de lonas para campaña académica 2026.',
    estado: 'Negociando',
    usuario_acceso: 'cliente.upds',
    password_acceso: '70000000',
    fecha_registro: '2026-07-05T14:30:00Z',
    fecha_actualizacion: '2026-07-11T12:00:00Z'
  },
  {
    id: 'C003',
    nombre: 'Maria Soria',
    empresa: 'Cervecería Boliviana Nacional',
    razon_social: 'CBN S.A.',
    nit_ci: '1028374029',
    celular: '+59171098765',
    ciudad: 'Cochabamba',
    departamento: 'Cochabamba',
    pais: 'Bolivia',
    presupuesto_usd: 8500,
    observaciones: 'Interesada en Pantallas LED Gigantes HD 4K en ubicaciones céntricas de Cochabamba.',
    estado: 'Nuevo',
    usuario_acceso: 'maria.soria',
    password_acceso: '71098765',
    fecha_registro: '2026-07-10T11:00:00Z',
    fecha_actualizacion: '2026-07-10T11:00:00Z'
  },
  {
    id: 'C004',
    nombre: 'Alejandro Claure',
    empresa: 'Banco Bisa S.A.',
    razon_social: 'Banco Bisa S.A.',
    nit_ci: '1002938471',
    celular: '+59160012345',
    ciudad: 'La Paz',
    departamento: 'La Paz',
    pais: 'Bolivia',
    presupuesto_usd: 22000,
    observaciones: 'Consulta por circuito de pantallas LED y Vallas de Alto Impacto para campaña financiera.',
    estado: 'Cotizado',
    usuario_acceso: 'alejandro.claure',
    password_acceso: '60012345',
    fecha_registro: '2026-06-15T10:00:00Z',
    fecha_actualizacion: '2026-07-11T11:30:00Z'
  }
];

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'T001',
    nombre: 'Primer Contacto (Bienvenida)',
    contenido: 'Hola {CLIENTE}, te saluda {VENDEDOR} de *PUBLI-X BOLIVIA* 📢. Gracias por contactarte con nosotros. Somos especialistas en alquiler de Vallas Publicitarias, Pantallas LED Gigantes, Letreros, Lonas e Ingeniería en Estructuras Metálicas. He registrado tu presupuesto estimado de *USD {PRECIO}*. ¿Qué tipo de espacio publicitario o trabajo especial estás buscando?',
    activa: true
  },
  {
    id: 'T002',
    nombre: 'Envío de Propuesta Comercial',
    contenido: 'Estimado {CLIENTE}, te comparto una excelente solución publicitaria que se adapta a tus metas comerciales:\n\n*📢 {MARCA} - {MODELO}*\n• Especificación: {VERSION}\n• Métricas de Tráfico: {MOTOR}\n• Modalidad: {TRANSMISION}\n\n*Inversión:* USD {PRECIO}\n\nEsta opción cuenta con una visibilidad excepcional. ¿Te gustaría que preparemos la propuesta formal en PDF / PPTX con fotos nocturnas y mapa de ubicación?',
    activa: true
  },
  {
    id: 'T003',
    nombre: 'Envío de Cotización Formal',
    contenido: 'Hola {CLIENTE}! Ya tenemos lista la cotización formal para el proyecto de *{MARCA} - {MODELO}*. Adjunto la cotización formal en PDF con el número *{COTIZACION_NUM}*.\n\nEn el documento verás el desglose de alquiler/fabricación, impresión de lonas, montaje en estructura y mantenimiento. Quedo atento a tus comentarios para reservar el espacio. Saludos, {VENDEDOR} - *PUBLI-X BOLIVIA*.',
    activa: true
  },
  {
    id: 'T004',
    nombre: 'Mensaje de Seguimiento Comercial',
    contenido: 'Hola {CLIENTE}, espero que te encuentres muy bien. Te escribo para consultar si tuviste oportunidad de revisar la cotización enviada para *{MARCA} - {MODELO}*. \n\nRecuerda que las ubicaciones premium y espacios en Pantallas LED gigantes tienen alta demanda. Si tienes consultas sobre montaje, instalación o formas de pago, estoy a tu entera disposición. ¡Saludos!',
    activa: true
  }
];

const DEFAULT_SETTINGS: Settings = {
  nombre_empresa: 'PUBLI-X BOLIVIA',
  direccion: 'Av. Banzer y 4to Anillo, Torre Empresarial, Piso 6',
  ciudad: 'Santa Cruz de la Sierra',
  departamento: 'Santa Cruz',
  pais: 'Bolivia',
  telefono: '+591 3 3559988',
  whatsapp: '+591 70000000',
  correo: 'ventas@publix.bo',
  web: 'www.publix.bo',
  logo: '',
  tipo_cambio: 6.96,
  terminos_cotizacion: '1. Los precios de alquiler de Vallas y Pantallas LED son expresados en USD y se facturan al tipo de cambio acordado.\n2. La cotización de trabajos especiales (Estructuras Metálicas, Corpóreos, Lonas) incluye materiales de primera calidad, corte CNC e instalación autorizada.\n3. Plazo de instalación e impresión: 3 a 7 días hábiles tras aprobación del diseño y pago del anticipo (60%).\n4. Mantenimiento técnico e iluminación LED garantizado durante la vigencia del contrato de alquiler.',
};

const DEFAULT_USERS: UserSession[] = [
  {
    id: 'U001',
    nombre: 'Carlos Vargas',
    usuario: 'carlos.vargas',
    rol: 'Dueño',
    estado: 'Activo'
  },
  {
    id: 'U002',
    nombre: 'Alejandro Claure',
    usuario: 'alejandro.gerente',
    rol: 'Jefe',
    estado: 'Activo'
  },
  {
    id: 'U003',
    nombre: 'Mariana Suárez',
    usuario: 'mariana.ventas',
    rol: 'Vendedor',
    estado: 'Activo'
  },
  {
    id: 'U004',
    nombre: 'Cliente UPDS (Acceso Portal)',
    usuario: 'cliente.upds',
    rol: 'Cliente',
    estado: 'Activo'
  }
];

const INITIAL_FOLLOW_UPS: FollowUp[] = [
  {
    id: 'F001',
    cliente_id: 'C002',
    tipo: 'WhatsApp',
    nota: 'Se le envió la propuesta de la Toyota Tacoma. El cliente se encuentra analizando con su socio la viabilidad del presupuesto.',
    fecha: '2026-07-06T10:00:00Z',
    proximo_contacto: '2026-07-12T14:00:00Z',
    prioridad: 'Alta',
    estado: 'Pendiente'
  },
  {
    id: 'F002',
    cliente_id: 'C001',
    tipo: 'Llamada',
    nota: 'Llamada de seguimiento inicial. Carlos expresa fuerte interés en el BMW X5, pero necesita el desglose exacto de impuestos aduaneros para Santa Cruz.',
    fecha: '2026-07-11T09:30:00Z',
    proximo_contacto: '2026-07-13T10:00:00Z',
    prioridad: 'Alta',
    estado: 'Pendiente'
  },
  {
    id: 'F003',
    cliente_id: 'C004',
    tipo: 'Envío cotización',
    nota: 'Creación y envío de cotización formal por correo y WhatsApp para el Porsche Cayenne Coupé. El cliente confirmó de recibido.',
    fecha: '2026-07-11T11:30:00Z',
    proximo_contacto: '2026-07-15T09:00:00Z',
    prioridad: 'Media',
    estado: 'Pendiente'
  }
];

const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'Q001',
    numero: 'MLA-20260711-000001',
    cliente_id: 'C004',
    vehiculo_id: 'V008', // Porsche Cayenne
    precio_vehiculo: 95000,
    gastos_importacion: 1800,
    gastos_aduana: 12500,
    gastos_logistica: 2200,
    gastos_seguro: 950,
    total: 112450,
    estado: 'Enviada',
    observaciones: 'Cotización premium para Porsche Cayenne. El cliente solicita que el flete marítimo sea expreso. Se incluye seguro completo de aduana.',
    fecha: '2026-07-11T11:30:00Z'
  },
  {
    id: 'Q002',
    numero: 'MLA-20260711-000002',
    cliente_id: 'C005',
    vehiculo_id: 'V002', // Toyota 4Runner
    precio_vehiculo: 48000,
    gastos_importacion: 1500,
    gastos_aduana: 6200,
    gastos_logistica: 1800,
    gastos_seguro: 480,
    total: 57980,
    estado: 'Aceptada',
    observaciones: 'Venta cerrada de Toyota 4Runner. El pago del 60% inicial ya fue depositado en la cuenta corriente de la empresa. Se inició proceso de compra en subasta Copart.',
    fecha: '2026-07-11T14:00:00Z'
  }
];

// High-Capacity Programmatic Generators to support 350+ records
function generate350Clients(): Client[] {
  const firstNames = ['Juan', 'Pedro', 'Maria', 'Alejandro', 'Roberto', 'Carlos', 'Luis', 'Jorge', 'Grover', 'Daniela', 'Claudia', 'Patricia', 'Fernando', 'Ricardo', 'Andrés', 'Sofía', 'Gabriela', 'Diego', 'Camila', 'Sebastian', 'Javier', 'Hugo', 'Oscar', 'Monica', 'Elizabeth', 'Gisela', 'Ramiro', 'Gustavo', 'Adrian', 'Paola', 'Natalia', 'Vanessa', 'Mauricio', 'René', 'Edgar', 'Eduardo', 'Walter', 'Raúl'];
  const lastNames = ['Vargas', 'López', 'Soria', 'Claure', 'Vaca', 'Guzmán', 'Rojas', 'Flores', 'Torrico', 'Melgar', 'Pinto', 'Fernández', 'Suárez', 'Chávez', 'Aramayo', 'Mendoza', 'Mamani', 'Quispe', 'Sánchez', 'Rodríguez', 'Gómez', 'Gutiérrez', 'Ortega', 'Cardozo', 'Bustamante', 'Paz', 'Arce', 'Soliz', 'Montaño', 'Villaroel', 'Herrera', 'Salinas', 'Prado', 'Aparicio', 'Zárate', 'Aguilar', 'Paredes', 'Medina'];
  const cities = [
    { name: 'Santa Cruz de la Sierra', dept: 'Santa Cruz' },
    { name: 'La Paz', dept: 'La Paz' },
    { name: 'El Alto', dept: 'La Paz' },
    { name: 'Cochabamba', dept: 'Cochabamba' },
    { name: 'Tarija', dept: 'Tarija' },
    { name: 'Sucre', dept: 'Chuquisaca' },
    { name: 'Oruro', dept: 'Oruro' },
    { name: 'Potosí', dept: 'Potosí' },
    { name: 'Trinidad', dept: 'Beni' }
  ];
  const states: Client['estado'][] = ['Nuevo', 'Contactado', 'Interesado', 'Cotizado', 'Negociando', 'Esperando respuesta', 'Vendido', 'Perdido'];
  const observations = [
    'Interesado en importar SUV familiar espaciosa de 3 filas.',
    'Busca pickup cabina doble para trabajo de campo y viajes.',
    'Prefiere auto compacto de excelente rendimiento urbano.',
    'Busca un sedán premium con transmisión automática y bajo kilometraje.',
    'Interesado en deportivo de lujo para fines de semana.',
    'Consulta por plazos de importación desde puertos chilenos.',
    'Cliente corporativo requiere cotización formal para flota.',
    'Busca vagoneta 4x4 robusta con bloqueo de diferencial.',
    'Interesado en opciones híbridas o eléctricas por ahorro.',
    'Evaluando presupuesto para compra directa en subasta Copart.'
  ];

  const clientsList: Client[] = [...INITIAL_CLIENTS];
  let currentId = clientsList.length + 1;
  const generatedNumbers = new Set(clientsList.map(c => c.celular));

  while (clientsList.length < 350) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const ln2 = lastNames[Math.floor(Math.random() * lastNames.length)];
    const cityObj = cities[Math.floor(Math.random() * cities.length)];
    const estado = states[Math.floor(Math.random() * states.length)];
    const budget = Math.floor(Math.random() * 12 + 2) * 5000 + 15000; // 15,000 to 75,000
    const cellNum = Math.floor(Math.random() * 9000000 + 7000000); // realistic Bolivian cell
    const cell = `+591${cellNum}`;
    const obs = observations[Math.floor(Math.random() * observations.length)];
    
    if (generatedNumbers.has(cell)) continue;
    generatedNumbers.add(cell);

    const fullName = `${fn} ${ln} ${ln2}`;
    const creds = generateClientCredentials(fullName, cell);

    clientsList.push({
      id: 'C' + String(currentId).padStart(3, '0'),
      nombre: fullName,
      celular: cell,
      ciudad: cityObj.name,
      departamento: cityObj.dept,
      pais: 'Bolivia',
      presupuesto_usd: budget,
      observaciones: obs,
      estado,
      usuario_acceso: creds.usuario_acceso,
      password_acceso: creds.password_acceso,
      fecha_registro: new Date(Date.now() - Math.random() * 30 * 24 * 3600 * 1000).toISOString(),
      fecha_actualizacion: new Date().toISOString()
    });
    currentId++;
  }

  return clientsList;
}

function generate350Vehicles(): Vehicle[] {
  const billboardTypes: { tipo_valla: Vehicle['tipo_valla']; tipo: string; defaultMedidas: string; defaultIlum: string; minPrice: number; maxPrice: number }[] = [
    { tipo_valla: 'Unipolar', tipo: 'Unipolar', defaultMedidas: '12 x 4 m', defaultIlum: 'Iluminación LED Nocturna 24/7', minPrice: 1100, maxPrice: 2200 },
    { tipo_valla: 'Estructural', tipo: 'Estructural', defaultMedidas: '10 x 4 m', defaultIlum: 'Reflectores LED 400W', minPrice: 950, maxPrice: 1800 },
    { tipo_valla: 'Pantalla LED', tipo: 'Pantalla LED', defaultMedidas: '8 x 4 m', defaultIlum: 'Pantalla Digital LED', minPrice: 1600, maxPrice: 3200 },
    { tipo_valla: 'Pasarela / Puente Peatonal', tipo: 'Pasarela / Puente Peatonal', defaultMedidas: '16 x 3 m', defaultIlum: 'Iluminación LED Nocturna 24/7', minPrice: 1400, maxPrice: 2500 },
    { tipo_valla: 'Vía Peatonal', tipo: 'Vía Peatonal', defaultMedidas: '1.8 x 1.2 m', defaultIlum: 'Caja de Luz Backlight', minPrice: 350, maxPrice: 750 },
    { tipo_valla: 'Mural', tipo: 'Mural', defaultMedidas: '15 x 6 m', defaultIlum: 'Iluminación LED Nocturna 24/7', minPrice: 850, maxPrice: 1600 },
    { tipo_valla: 'Parada de bus', tipo: 'Parada de bus', defaultMedidas: '1.8 x 1.2 m', defaultIlum: 'Caja de Luz Backlight', minPrice: 300, maxPrice: 600 },
    { tipo_valla: 'Teleféricos', tipo: 'Teleféricos', defaultMedidas: '6 x 2.5 m', defaultIlum: 'Iluminación LED Nocturna 24/7', minPrice: 700, maxPrice: 1300 },
    { tipo_valla: 'Letrero luminoso', tipo: 'Letrero luminoso', defaultMedidas: '6 x 2 m', defaultIlum: 'Caja de Luz Backlight', minPrice: 400, maxPrice: 900 }
  ];

  const cityData: {
    ciudad: string;
    provincia: string;
    zonasYAvenidas: { zona: string; avenidas: string[] }[];
  }[] = [
    {
      ciudad: 'Santa Cruz',
      provincia: 'Andrés Ibáñez',
      zonasYAvenidas: [
        { zona: 'Equipetrol', avenidas: ['Av. San Martín y Calle 5', 'Av. San Martín y 4to Anillo', 'Av. Marcelo Terceros (Sirari)'] },
        { zona: 'Zona Norte', avenidas: ['Av. Banzer y 3er Anillo', 'Av. Banzer y 4to Anillo', 'Av. Banzer y 5to Anillo', 'Av. Banzer y 7mo Anillo'] },
        { zona: 'Cristo Redentor', avenidas: ['Av. Cristo Redentor y 2do Anillo', 'Av. Cristo Redentor y 4to Anillo', 'Av. Cristo Redentor y 6to Anillo'] },
        { zona: '3er Anillo', avenidas: ['3er Anillo Interno Canal Cotoca', '3er Anillo Interno entre Bush y San Martín', '3er Anillo Externo Av. Beni'] },
        { zona: 'Doble Vía La Guardia', avenidas: ['Doble Vía La Guardia y 3er Anillo', 'Doble Vía La Guardia y 5to Anillo', 'Doble Vía La Guardia Km 6'] },
        { zona: 'Urubó', avenidas: ['Puente Foianini / Entrada Urubó', 'Av. Principal Urubó Village', 'Rotonda Urubó Mall'] },
        { zona: 'Centro / 1er Anillo', avenidas: ['1er Anillo Av. Cañoto', '1er Anillo Av. Brasil', 'Calle René Moreno y 24 de Septiembre'] },
        { zona: 'Av. Santos Dumont', avenidas: ['Av. Santos Dumont y 3er Anillo', 'Av. Santos Dumont y 4to Anillo'] }
      ]
    },
    {
      ciudad: 'La Paz',
      provincia: 'Murillo',
      zonasYAvenidas: [
        { zona: 'Sopocachi', avenidas: ['Plaza Abaroa - Sopocachi', 'Av. 20 de Octubre y Guachalla', 'Av. 6 de Agosto y Aspiazu'] },
        { zona: 'Zona Sur / Calacoto', avenidas: ['Av. Ballivián Calle 21 Calacoto', 'Av. Ballivián Calle 12', 'Av. Ballivián Calle 8', 'Av. Inofuentes y Calle 18'] },
        { zona: 'San Miguel / Achumani', avenidas: ['Av. Montenegro - San Miguel', 'Av. Fuerza Naval y Calle 21', 'Av. Alexander - Achumani'] },
        { zona: 'Centro / El Prado', avenidas: ['Av. 16 de Julio (El Prado)', 'Av. Mariscal Santa Cruz y Obelisco', 'Av. Montes y Pérez Velasco'] },
        { zona: 'Miraflores', avenidas: ['Av. Saavedra y Plaza Uyuni', 'Av. Bush y Plaza Triangular', 'Av. Germán Busch y Villalobos'] },
        { zona: 'San Pedro', avenidas: ['Plaza Sucre (San Pedro)', 'Av. 20 de Octubre y Plaza Israel'] }
      ]
    },
    {
      ciudad: 'Cochabamba',
      provincia: 'Cercado',
      zonasYAvenidas: [
        { zona: 'Cala Cala / Av. América', avenidas: ['Av. América y Pando', 'Av. América y Santa Cruz', 'Av. América y Melchor Pérez'] },
        { zona: 'Av. Blanco Galindo', avenidas: ['Av. Blanco Galindo Km 2', 'Av. Blanco Galindo Km 4', 'Av. Blanco Galindo Km 7 (Quillacollo)'] },
        { zona: 'Centro Histórico', avenidas: ['Av. Heroínas y Ayacucho', 'Av. Heroínas y San Martín', 'Plaza 14 de Septiembre y Bolívar'] },
        { zona: 'Sarco / Melchor Pérez', avenidas: ['Av. Melchor Pérez de Holguín y D\'Orbigny', 'Av. América Oeste y Beijing'] },
        { zona: 'Av. Ballivián (El Prado)', avenidas: ['Av. Ballivián y Plaza Colón', 'Av. Ballivián y Calle México'] },
        { zona: 'Circunvalación', avenidas: ['Av. Circunvalación Norte y Atahuallpa', 'Av. Circunvalación y Cruce Taquiña'] }
      ]
    },
    {
      ciudad: 'El Alto',
      provincia: 'Murillo',
      zonasYAvenidas: [
        { zona: 'La Ceja / Autopista', avenidas: ['Autopista La Paz - El Alto Km 12 (Peaje)', 'Av. 6 de Marzo y Ceja', 'Av. Juan Pablo II y Distribuidor Ceja'] },
        { zona: 'Av. Juan Pablo II', avenidas: ['Av. Juan Pablo II frente a la UPEA', 'Av. Juan Pablo II y Chacaltaya', 'Av. Juan Pablo II y Río Seco'] },
        { zona: 'Av. 6 de Marzo', avenidas: ['Av. 6 de Marzo y Cruce Viacha', 'Av. 6 de Marzo y Calle 4', 'Av. 6 de Marzo y Senkata'] },
        { zona: 'Aeropuerto / Satélite', avenidas: ['Rotonda del Aeropuerto Internacional', 'Av. Cívica - Ciudad Satélite'] }
      ]
    },
    {
      ciudad: 'Tarija',
      provincia: 'Cercado',
      zonasYAvenidas: [
        { zona: 'Centro / Av. Víctor Paz', avenidas: ['Av. Víctor Paz Estenssoro y Senador Rosas', 'Av. Víctor Paz y Puente San Martín'] },
        { zona: 'Av. Las Panteras / Circunvalación', avenidas: ['Av. Circunvalación y Av. Froilán Tejerina', 'Av. Las Panteras y Rotonda Aeropuerto'] }
      ]
    },
    {
      ciudad: 'Sucre',
      provincia: 'Oropeza',
      zonasYAvenidas: [
        { zona: 'Plaza España / Parque Bolívar', avenidas: ['Av. Jaime Mendoza y Plaza España', 'Av. Germán Mendoza y Destacamento 111'] },
        { zona: 'Centro Colonial', avenidas: ['Av. Hernando Siles y Junín', 'Av. Las Américas y Destacamento Chuquisaca'] }
      ]
    },
    {
      ciudad: 'Oruro',
      provincia: 'Cercado',
      zonasYAvenidas: [
        { zona: 'Centro / 6 de Agosto', avenidas: ['Av. 6 de Agosto y Villarroel', 'Av. 6 de Agosto y Bolívar'] },
        { zona: 'Zona Norte', avenidas: ['Av. Circunvalación y Tomás Barrón (Entrada Oruro)'] }
      ]
    }
  ];

  const faces: ('Cara A' | 'Cara B' | 'Ambas Caras')[] = ['Cara A', 'Cara B', 'Ambas Caras'];
  const states: Vehicle['estado'][] = ['Disponible', 'Disponible', 'Disponible', 'Reservado', 'En instalación', 'Próximamente', 'Ocupado / Alquilado'];

  const images = [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&q=80&w=600'
  ];

  const vehiclesList: Vehicle[] = [...INITIAL_VEHICLES];
  let currentId = vehiclesList.length + 1;

  while (vehiclesList.length < 350) {
    const typeObj = billboardTypes[Math.floor(Math.random() * billboardTypes.length)];
    const cData = cityData[Math.floor(Math.random() * cityData.length)];
    const zObj = cData.zonasYAvenidas[Math.floor(Math.random() * cData.zonasYAvenidas.length)];
    const ave = zObj.avenidas[Math.floor(Math.random() * zObj.avenidas.length)];
    const face = faces[Math.floor(Math.random() * faces.length)];
    const state = states[Math.floor(Math.random() * states.length)];
    const isAltoImpacto = Math.random() > 0.65 || typeObj.tipo_valla === 'Pantalla LED' || typeObj.tipo_valla === 'Pasarela / Puente Peatonal';
    const price = Math.round((Math.floor(Math.random() * (typeObj.maxPrice - typeObj.minPrice)) + typeObj.minPrice) / 50) * 50;
    const img = images[Math.floor(Math.random() * images.length)];
    const traffic = `${Math.floor(Math.random() * 160 + 60)},000 vehículos y peatones/día`;

    vehiclesList.push({
      id: 'V' + String(currentId).padStart(3, '0'),
      codigo: `PUB-${String(currentId).padStart(4, '0')}`,
      nombre: `${typeObj.tipo_valla} - ${ave}`,
      ubicacion: `${cData.ciudad} - ${ave} (${zObj.zona})`,
      dimensiones: typeObj.defaultMedidas,
      medidas: typeObj.defaultMedidas,
      especificacion: typeObj.tipo_valla === 'Pantalla LED'
        ? 'Pitch P3.91mm HD Outdoor 6500 nits Ultra Brillo'
        : 'Lona Frontlight 13oz Alta Resistencia + Iluminación LED',
      modalidad: 'Alquiler Mensual',
      iluminacion: typeObj.defaultIlum,
      marca: typeObj.tipo_valla === 'Pantalla LED' ? 'Pantalla LED' : 'Valla Publicitaria',
      modelo: ave,
      version: `${typeObj.defaultMedidas} - ${face}`,
      anio: 2026,
      tipo: typeObj.tipo,
      tipo_valla: typeObj.tipo_valla,
      alto_impacto: isAltoImpacto,
      ciudad: cData.ciudad,
      zona: zObj.zona,
      avenida_calle: ave,
      cara: face,
      provincia: cData.provincia,
      transitabilidad_trafico: traffic,
      costo_lona_m2_bs: typeObj.tipo_valla === 'Pantalla LED' ? 0 : 65,
      motor: traffic,
      combustible: 'Estructura Metálica Certificada',
      transmision: 'Alquiler Mensual',
      traccion: typeObj.defaultIlum,
      color: 'Acabado Estructural Anti-Reflejo',
      precio_usd: price,
      precio_original_usd: price,
      descripcion: `Excelente espacio de publicidad exterior OOH ubicado en ${ave}, zona ${zObj.zona} de ${cData.ciudad}. Gran ángulo de visibilidad frontal y alto tráfico diario garantizado.`,
      detalle: `Soporte publicitario ${typeObj.tipo_valla}, dimensiones ${typeObj.defaultMedidas}, orientación ${face}, con sistema de ${typeObj.defaultIlum}.`,
      estado: state,
      imagen_principal: img,
      imagenes: [img],
      fecha_registro: new Date(Date.now() - Math.random() * 90 * 24 * 3600 * 1000).toISOString(),
      fecha_actualizacion: new Date().toISOString()
    });
    currentId++;
  }

  return vehiclesList;
}

const INITIAL_PENDING_REQUESTS: PendingQuotationRequest[] = [
  {
    id: 'SOL-001',
    codigo: 'SOL-2026-0001',
    cliente_nombre: 'Carlos David Vargas',
    cliente_empresa: 'Constructora Vargas SRL',
    cliente_celular: '+59170000000',
    cliente_ciudad: 'Santa Cruz',
    vallas_ids: ['V001', 'V002'],
    vallas_nombres: ['Valla Monumental Av. Banzer 4to Anillo', 'Pantalla LED Gigante HD Plaza Abaroa'],
    vallas_detalles: [
      { id: 'V001', nombre: 'Valla Monumental Av. Banzer 4to Anillo', precio_usd: 1200, medidas: '12m x 4m (48 m²)', cara: 'Cara A', imagen: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600' },
      { id: 'V002', nombre: 'Pantalla LED Gigante HD Plaza Abaroa', precio_usd: 1800, medidas: '8m x 4m (32 m²)', cara: 'Cara A', imagen: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600' }
    ],
    fecha: new Date(Date.now() - 3600000 * 4).toISOString(),
    estado: 'Pendiente',
    observaciones: 'Solicitud enviada desde catálogo web. Requiere cotización de 3 meses de alquiler más impresión de lonas.'
  }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'L001',
    usuario: 'Carlos Vargas',
    accion: 'Inicialización de Base de Datos',
    detalle: 'Se creó la base de datos de alta capacidad con 350 vallas y pantallas en el catálogo y clientes en el CRM.',
    fecha: '2026-07-11T16:34:50-07:00'
  }
];

export const mockDb = {
  initialize() {
    try {
      const storedClients = localStorage.getItem(DB_KEYS.CLIENTS);
      if (!storedClients) {
        localStorage.setItem(DB_KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS));
      } else {
        try {
          const parsed = JSON.parse(storedClients);
          if (Array.isArray(parsed) && parsed.length > 4) {
            localStorage.setItem(DB_KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS));
          }
        } catch (err) {
          localStorage.setItem(DB_KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS));
        }
      }
      
      // Auto-migrate legacy data to 350 clean OOH billboard stock
      const storedVehicles = localStorage.getItem(DB_KEYS.VEHICLES);
      if (!storedVehicles) {
        localStorage.setItem(DB_KEYS.VEHICLES, JSON.stringify(generate350Vehicles()));
      } else {
        try {
          const parsed = JSON.parse(storedVehicles);
          if (!Array.isArray(parsed) || parsed.length === 0 || !parsed[0].tipo_valla || !parsed[0].medidas || !parsed[0].avenida_calle) {
            localStorage.setItem(DB_KEYS.VEHICLES, JSON.stringify(generate350Vehicles()));
          }
        } catch (err) {
          localStorage.setItem(DB_KEYS.VEHICLES, JSON.stringify(generate350Vehicles()));
        }
      }

    if (!localStorage.getItem(DB_KEYS.QUOTATIONS)) {
      localStorage.setItem(DB_KEYS.QUOTATIONS, JSON.stringify(INITIAL_QUOTATIONS));
    }
    if (!localStorage.getItem(DB_KEYS.CONTRACTS)) {
      const initialContracts: Contract[] = [
        {
          id: 'CON-00025',
          numero: '00025 PUBLI-X/2026',
          cliente_id: 'C001',
          cliente_nombre: 'UNIVERSIDAD PRIVADA DOMINGO SAVIO – UPDS',
          cliente_empresa: 'UPDS',
          cliente_nit_ci: '1015289020',
          cliente_representante: 'Lic. Paola Carmiña Pericón de Chazal',
          cliente_representante_ci: '3559515 emitida en Oruro',
          cliente_escritura_poder: 'Nº 506/2021',
          cliente_poder_fecha: '05 de Mayo del 2021',
          cliente_notaria_numero: 'N° 103',
          cliente_notario_nombre: 'Dra. Marbel Silvana España Pedraza',
          cliente_celular: '+591 70000000',
          cliente_correo: 'marketing@upds.edu.bo',
          cliente_direccion: 'Av. Beni y 3er anillo Externo',
          cliente_ciudad: 'Santa Cruz',

          arrendador_empresa: 'PUBLI-X BOLIVIA',
          arrendador_nit: '4579387019',
          arrendador_direccion: 'Calle Los Tajibos 2185 Barrio Petrolero Norte UV 0016 MZA 14 entre 2do anillo y Av. Los Cusis',
          arrendador_representante: 'Sr. Carlos David Vargas Añez',
          arrendador_ci: '4579387 emitida en Santa Cruz',

          valla_nombre: '3er ANILLO INTERNO CANAL COTOCA',
          valla_medidas: '15X4',
          valla_ubicacion: 'Santa Cruz',
          valla_tipo: 'Valla Unipolar',
          valla_cara: 'Cara A',

          vallas_lista: [
            { id: 'V1', ciudad: 'Santa Cruz', formato: 'Valla Unipolar', direccion: '3er ANILLO INTERNO CANAL COTOCA', costo_mensual_bs: 13980, descuento_bs: 1000, costo_neto_bs: 12980 },
            { id: 'V2', ciudad: 'Santa Cruz', formato: 'Valla Unipolar', direccion: '3er ANILLO INTERNO ENTRE AV. BUSH Y AV. SAN MARTIN', costo_mensual_bs: 8800, descuento_bs: 880, costo_neto_bs: 7920 },
            { id: 'V3', ciudad: 'Santa Cruz', formato: 'Valla Unipolar', direccion: '2do ANILLO AV. PIRAI DIAGONAL HIPERMAXI', costo_mensual_bs: 9800, descuento_bs: 1100, costo_neto_bs: 8700 }
          ],
          lonas_lista: [
            { id: 'L1', direccion: '3er ANILLO INTERNO CANAL COTOCA', medidas: '15x4', costo_unitario_bs: 4380, descuento_lona_bs: 0, total_costo_bs: 4380 },
            { id: 'L2', direccion: '3er ANILLO INTERNO ENTRE AV. BUSH Y AV. SAN MARTIN', medidas: '10X4', costo_unitario_bs: 2920, descuento_lona_bs: 30, total_costo_bs: 2890 },
            { id: 'L3', direccion: '2do ANILLO AV. PIRAI DIAGONAL HIPERMAXI', medidas: '10X4', costo_unitario_bs: 2920, descuento_lona_bs: 30, total_costo_bs: 2890 }
          ],

          items: [],
          lona_detail: {
            incluye_lona: true,
            especificacion: 'Impresión e instalación de lona full color 720 dpi',
            medidas_m2: 140,
            costo_m2_usd: 10,
            costo_total_lona: 1460,
            descuento_lona_usd: 0,
            subtotal_lona_neto: 1460
          },
          beneficios_extras: [
            'Mantenimiento de luminarias e iluminación nocturna',
            'Soporte técnico ante eventos climáticos'
          ],

          subtotal_alquiler_usd: 8505,
          descuento_cliente_usd: 850,
          descuento_cliente_porcentaje: 10,
          total_neto_usd: 9965,
          total_neto_bob: 69360,
          tipo_cambio: 6.96,

          fecha_emision: '2026-07-03',
          fecha_inicio: '2026-07-03',
          fecha_fin: '2026-09-03',
          periodo_meses: 2,
          forma_pago: 'El ARRENDATARIO realizará el pago mediante emisión de cheque ó vía transferencia bancaria a nombre de Carlos David Vargas Añez.',
          clausulas_especiales: 'Contrato privado privado de arrendamiento publicitario con validez legal.',

          estado: 'Vigente',
          diseno_plantilla: 'OFICIAL_VALLAS',
          vendedor_nombre: 'Carlos David Vargas Añez'
        }
      ];
      localStorage.setItem(DB_KEYS.CONTRACTS, JSON.stringify(initialContracts));
    }
    if (!localStorage.getItem(DB_KEYS.FOLLOW_UPS)) {
      localStorage.setItem(DB_KEYS.FOLLOW_UPS, JSON.stringify(INITIAL_FOLLOW_UPS));
    }
    if (!localStorage.getItem(DB_KEYS.TEMPLATES)) {
      localStorage.setItem(DB_KEYS.TEMPLATES, JSON.stringify(DEFAULT_TEMPLATES));
    }
    if (!localStorage.getItem(DB_KEYS.SETTINGS)) {
      localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
    
    // Always refresh default users if users storage is missing or outdated
    const storedUsers = localStorage.getItem(DB_KEYS.USERS);
    if (!storedUsers) {
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    }
    if (localStorage.getItem(DB_KEYS.CURRENT_USER) === null) {
      localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(DEFAULT_USERS[0])); // Carlos as default
    }
    if (localStorage.getItem(DB_KEYS.AUDIT_LOGS) === null) {
      localStorage.setItem(DB_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    }
    if (localStorage.getItem(DB_KEYS.PENDING_REQUESTS) === null) {
      localStorage.setItem(DB_KEYS.PENDING_REQUESTS, JSON.stringify(INITIAL_PENDING_REQUESTS));
    }
  } catch (err) {
    console.warn('LocalStorage error during initialize:', err);
  }
},

  getClients(): Client[] {
    this.initialize();
    try {
      const raw: Client[] = JSON.parse(localStorage.getItem(DB_KEYS.CLIENTS) || '[]');
      if (!Array.isArray(raw)) return INITIAL_CLIENTS;
      let modified = false;
      const updated = raw.map(c => {
        if (!c.usuario_acceso || !c.password_acceso) {
          const creds = generateClientCredentials(c.nombre, c.celular);
          modified = true;
          return {
            ...c,
            usuario_acceso: c.usuario_acceso || creds.usuario_acceso,
            password_acceso: c.password_acceso || creds.password_acceso
          };
        }
        return c;
      });
      if (modified) {
        localStorage.setItem(DB_KEYS.CLIENTS, JSON.stringify(updated));
      }
      return updated;
    } catch {
      return INITIAL_CLIENTS;
    }
  },

  saveClients(clients: Client[]) {
    try {
      localStorage.setItem(DB_KEYS.CLIENTS, JSON.stringify(clients));
    } catch (e) {
      console.error(e);
    }
  },

  getVehicles(): Vehicle[] {
    this.initialize();
    try {
      const parsed = JSON.parse(localStorage.getItem(DB_KEYS.VEHICLES) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveVehicles(vehicles: Vehicle[]) {
    try {
      localStorage.setItem(DB_KEYS.VEHICLES, JSON.stringify(vehicles));
    } catch (e) {
      console.error(e);
    }
  },

  getQuotations(): Quotation[] {
    this.initialize();
    try {
      const parsed = JSON.parse(localStorage.getItem(DB_KEYS.QUOTATIONS) || '[]');
      return Array.isArray(parsed) ? parsed : INITIAL_QUOTATIONS;
    } catch {
      return INITIAL_QUOTATIONS;
    }
  },

  saveQuotations(quotations: Quotation[]) {
    try {
      localStorage.setItem(DB_KEYS.QUOTATIONS, JSON.stringify(quotations));
    } catch (e) {
      console.error(e);
    }
  },

  getContracts(): Contract[] {
    this.initialize();
    try {
      const parsed = JSON.parse(localStorage.getItem(DB_KEYS.CONTRACTS) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveContracts(contracts: Contract[]) {
    try {
      localStorage.setItem(DB_KEYS.CONTRACTS, JSON.stringify(contracts));
    } catch (e) {
      console.error(e);
    }
  },

  getFollowUps(): FollowUp[] {
    this.initialize();
    try {
      const parsed = JSON.parse(localStorage.getItem(DB_KEYS.FOLLOW_UPS) || '[]');
      return Array.isArray(parsed) ? parsed : INITIAL_FOLLOW_UPS;
    } catch {
      return INITIAL_FOLLOW_UPS;
    }
  },

  saveFollowUps(followUps: FollowUp[]) {
    try {
      localStorage.setItem(DB_KEYS.FOLLOW_UPS, JSON.stringify(followUps));
    } catch (e) {
      console.error(e);
    }
  },

  getTemplates(): MessageTemplate[] {
    this.initialize();
    try {
      const parsed = JSON.parse(localStorage.getItem(DB_KEYS.TEMPLATES) || '[]');
      return Array.isArray(parsed) ? parsed : DEFAULT_TEMPLATES;
    } catch {
      return DEFAULT_TEMPLATES;
    }
  },

  saveTemplates(templates: MessageTemplate[]) {
    try {
      localStorage.setItem(DB_KEYS.TEMPLATES, JSON.stringify(templates));
    } catch (e) {
      console.error(e);
    }
  },

  getSettings(): Settings {
    this.initialize();
    try {
      const settings: Settings = JSON.parse(localStorage.getItem(DB_KEYS.SETTINGS) || '{}');
      if (settings.logo && (settings.logo.includes('photo-') || settings.logo.includes('unsplash'))) {
        settings.logo = '';
        this.saveSettings(settings);
      }
      return settings && typeof settings === 'object' && settings.nombre_empresa ? settings : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: Settings) {
    try {
      localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  },

  getUsers(): UserSession[] {
    this.initialize();
    try {
      const parsed = JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  },

  saveUsers(users: UserSession[]) {
    try {
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  },

  getCurrentUser(): UserSession {
    this.initialize();
    try {
      const raw = localStorage.getItem(DB_KEYS.CURRENT_USER);
      if (!raw || raw === 'null' || raw === 'undefined') {
        return DEFAULT_USERS[0];
      }
      const user = JSON.parse(raw);
      if (user && typeof user === 'object' && user.id && user.rol) {
        return user;
      }
      return DEFAULT_USERS[0];
    } catch {
      return DEFAULT_USERS[0];
    }
  },

  setCurrentUser(user: UserSession) {
    try {
      const safeUser = user && user.id ? user : DEFAULT_USERS[0];
      localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(safeUser));
      this.addAuditLog(safeUser.nombre || 'Administrador', 'Cambio de Usuario Sesión', `El usuario cambió sesión activa a rol ${safeUser.rol || 'Dueño'}`);
    } catch (e) {
      console.error(e);
    }
  },

  getAuditLogs(): AuditLog[] {
    this.initialize();
    try {
      const parsed = JSON.parse(localStorage.getItem(DB_KEYS.AUDIT_LOGS) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  getPendingRequests(): PendingQuotationRequest[] {
    this.initialize();
    try {
      const parsed = JSON.parse(localStorage.getItem(DB_KEYS.PENDING_REQUESTS) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  savePendingRequests(requests: PendingQuotationRequest[]) {
    try {
      localStorage.setItem(DB_KEYS.PENDING_REQUESTS, JSON.stringify(requests));
    } catch (e) {
      console.warn('LocalStorage quota exceeded on savePendingRequests. Applying lightweight compression fallback...', e);
      // Fallback Level 1: Keep last 25 requests and strip base64 from older ones
      try {
        const trimmed = requests.slice(0, 25).map((req, idx) => {
          if (idx > 2) {
            return {
              ...req,
              imagenes_referencia: (req.imagenes_referencia || []).map(img => 
                img.startsWith('data:') ? 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=75' : img
              )
            };
          }
          return req;
        });
        localStorage.setItem(DB_KEYS.PENDING_REQUESTS, JSON.stringify(trimmed));
      } catch (err2) {
        console.warn('Applying Level 2 storage fallback for pending requests...', err2);
        // Fallback Level 2: Strip all base64 data URLs from all requests
        try {
          const stripped = requests.slice(0, 15).map(req => ({
            ...req,
            imagenes_referencia: (req.imagenes_referencia || []).filter(img => !img.startsWith('data:'))
          }));
          localStorage.setItem(DB_KEYS.PENDING_REQUESTS, JSON.stringify(stripped));
        } catch (err3) {
          console.error('Failed to store pending requests even with stripped payload:', err3);
        }
      }
    }
  },

  deletePendingRequest(id: string) {
    try {
      const current = this.getPendingRequests();
      const updated = current.filter(r => r.id !== id);
      this.savePendingRequests(updated);
      try {
        window.dispatchEvent(new Event('publix_new_request'));
      } catch {}
    } catch (e) {
      console.error(e);
    }
  },

  clearPendingRequests() {
    try {
      localStorage.setItem(DB_KEYS.PENDING_REQUESTS, JSON.stringify([]));
      try {
        window.dispatchEvent(new Event('publix_new_request'));
      } catch {}
    } catch (e) {
      console.error(e);
    }
  },

  clearAuditLogs() {
    try {
      localStorage.setItem(DB_KEYS.AUDIT_LOGS, JSON.stringify([]));
    } catch (e) {
      console.error(e);
    }
  },

  addAuditLog(usuario: string, accion: string, detalle: string) {
    try {
      const logs = JSON.parse(localStorage.getItem(DB_KEYS.AUDIT_LOGS) || '[]');
      const newLog: AuditLog = {
        id: 'L' + String((Array.isArray(logs) ? logs.length : 0) + 1).padStart(3, '0'),
        usuario: usuario || 'Sistema',
        accion: accion || 'Acción',
        detalle: detalle || '',
        fecha: new Date().toISOString()
      };
      const safeLogs = Array.isArray(logs) ? logs : [];
      safeLogs.unshift(newLog); // Prepend to show newest first
      localStorage.setItem(DB_KEYS.AUDIT_LOGS, JSON.stringify(safeLogs));
    } catch (e) {
      console.error(e);
    }
  },

  // Export full database as string
  exportBackup(): string {
    const data = {
      clients: this.getClients(),
      vehicles: this.getVehicles(),
      quotations: this.getQuotations(),
      contracts: this.getContracts(),
      followUps: this.getFollowUps(),
      templates: this.getTemplates(),
      settings: this.getSettings(),
      users: this.getUsers(),
      auditLogs: this.getAuditLogs(),
    };
    return JSON.stringify(data, null, 2);
  },

  // Import full database from backup
  importBackup(backupStr: string): boolean {
    try {
      const parsed = JSON.parse(backupStr);
      if (parsed.clients && parsed.vehicles && parsed.settings) {
        localStorage.setItem(DB_KEYS.CLIENTS, JSON.stringify(parsed.clients));
        localStorage.setItem(DB_KEYS.VEHICLES, JSON.stringify(parsed.vehicles));
        localStorage.setItem(DB_KEYS.QUOTATIONS, JSON.stringify(parsed.quotations || []));
        localStorage.setItem(DB_KEYS.CONTRACTS, JSON.stringify(parsed.contracts || []));
        localStorage.setItem(DB_KEYS.FOLLOW_UPS, JSON.stringify(parsed.followUps || []));
        localStorage.setItem(DB_KEYS.TEMPLATES, JSON.stringify(parsed.templates || []));
        localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(parsed.settings));
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(parsed.users || DEFAULT_USERS));
        localStorage.setItem(DB_KEYS.AUDIT_LOGS, JSON.stringify(parsed.auditLogs || []));
        this.addAuditLog('Sistema', 'Restauración de Backup', 'Se restauró con éxito una copia de seguridad externa.');
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  resetAll() {
    localStorage.removeItem(DB_KEYS.CLIENTS);
    localStorage.removeItem(DB_KEYS.VEHICLES);
    localStorage.removeItem(DB_KEYS.QUOTATIONS);
    localStorage.removeItem(DB_KEYS.CONTRACTS);
    localStorage.removeItem(DB_KEYS.FOLLOW_UPS);
    localStorage.removeItem(DB_KEYS.TEMPLATES);
    localStorage.removeItem(DB_KEYS.SETTINGS);
    localStorage.removeItem(DB_KEYS.USERS);
    localStorage.removeItem(DB_KEYS.CURRENT_USER);
    localStorage.removeItem(DB_KEYS.AUDIT_LOGS);
    this.initialize();
  }
};
