import pg from 'pg';
import { Client, Vehicle, Quotation, Contract, FollowUp, MessageTemplate, AuditLog, Settings, UserSession, PendingQuotationRequest } from '../src/types';

const { Pool } = pg;

// Database Connection String from environment variable
const DATABASE_URL = process.env.DATABASE_URL;

export let pool: pg.Pool | null = null;
export let isPostgresConnected = false;

// Fallback in-memory store when DATABASE_URL is not yet provided
export const memoryStore = {
  clients: [] as Client[],
  vehicles: [] as Vehicle[],
  quotations: [] as Quotation[],
  contracts: [] as Contract[],
  followUps: [] as FollowUp[],
  templates: [] as MessageTemplate[],
  auditLogs: [] as AuditLog[],
  users: [] as UserSession[],
  pendingRequests: [] as PendingQuotationRequest[],
  settings: {
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
    terminos_cotizacion: '1. Los precios de alquiler de Vallas y Pantallas LED son expresados en USD y se facturan al tipo de cambio oficial acordado.\n2. La cotización incluye materiales de primera calidad e instalación autorizada.\n3. Plazo de instalación e impresión: 3 a 5 días hábiles tras aprobación del diseño.\n4. Mantenimiento técnico e iluminación LED nocturna garantizada durante la vigencia del contrato.',
    backup_auto_enabled: true,
    backup_interval_hours: 24,
    backup_last_timestamp: new Date().toISOString(),
    backup_on_save: true,
    backup_retention_count: 10
  } as Settings
};

export async function initDb() {
  if (DATABASE_URL) {
    try {
      console.log('Connecting to PostgreSQL database with DATABASE_URL...');
      const isLocalhost = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');
      pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: isLocalhost ? false : { rejectUnauthorized: false }
      });

      // Test connection
      const client = await pool.connect();
      client.release();
      isPostgresConnected = true;
      console.log('✅ PostgreSQL database connected successfully!');

      // Run Auto Migration to create tables if they do not exist
      await runMigration();
      await seedInitialDataIfEmpty();
      return;
    } catch (err) {
      console.error('⚠️ Could not connect to PostgreSQL via DATABASE_URL:', err);
      console.log('Falling back to robust in-memory data store until valid connection is ready.');
      isPostgresConnected = false;
      pool = null;
    }
  } else {
    console.log('ℹ️ No DATABASE_URL provided in environment. Running with in-memory store.');
    isPostgresConnected = false;
  }

  // Seed memory store with default starter dataset
  seedMemoryStore();
}

async function runMigration() {
  if (!pool) return;
  const sql = `
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      nombres VARCHAR(255),
      apellidos VARCHAR(255),
      usuario VARCHAR(100) UNIQUE NOT NULL,
      rol VARCHAR(50) NOT NULL,
      estado VARCHAR(50) DEFAULT 'Activo',
      empresa VARCHAR(255),
      celular VARCHAR(50),
      email VARCHAR(255),
      password VARCHAR(255) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clients (
      id VARCHAR(50) PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      nombres VARCHAR(255),
      apellidos VARCHAR(255),
      celular VARCHAR(50) NOT NULL,
      ciudad VARCHAR(100) DEFAULT 'Santa Cruz',
      departamento VARCHAR(100) DEFAULT 'Santa Cruz',
      pais VARCHAR(100) DEFAULT 'Bolivia',
      presupuesto_usd NUMERIC(12, 2) DEFAULT 0,
      observaciones TEXT,
      estado VARCHAR(50) DEFAULT 'Nuevo',
      correo VARCHAR(255),
      campania VARCHAR(255),
      empresa VARCHAR(255),
      razon_social VARCHAR(255),
      nit_ci VARCHAR(100),
      usuario_acceso VARCHAR(100),
      password_acceso VARCHAR(255),
      usuario_habilitado BOOLEAN DEFAULT TRUE,
      acceso_bloqueado BOOLEAN DEFAULT FALSE,
      fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id VARCHAR(50) PRIMARY KEY,
      codigo VARCHAR(100),
      nombre VARCHAR(255) NOT NULL,
      tipo_valla VARCHAR(100),
      zona VARCHAR(150),
      cara VARCHAR(50),
      ciudad VARCHAR(100) DEFAULT 'Santa Cruz',
      avenida_calle VARCHAR(255),
      provincia VARCHAR(100),
      detalle TEXT,
      medidas VARCHAR(100),
      transitabilidad_trafico VARCHAR(255),
      costo_lona_m2_bs NUMERIC(10, 2) DEFAULT 0,
      drive_photos JSONB DEFAULT '[]'::jsonb,
      alto_impacto BOOLEAN DEFAULT FALSE,
      ubicacion VARCHAR(255),
      dimensiones VARCHAR(100),
      especificacion TEXT,
      modalidad VARCHAR(100),
      iluminacion VARCHAR(100),
      marca VARCHAR(100) DEFAULT 'Valla Publicitaria',
      modelo VARCHAR(255),
      version VARCHAR(255),
      anio INTEGER DEFAULT 2026,
      tipo VARCHAR(100) DEFAULT 'Unipolar',
      motor VARCHAR(255),
      combustible VARCHAR(255),
      transmision VARCHAR(255),
      traccion VARCHAR(255),
      color VARCHAR(100),
      precio_usd NUMERIC(12, 2) DEFAULT 0,
      precio_original_usd NUMERIC(12, 2),
      descuento_jefe_usd NUMERIC(12, 2) DEFAULT 0,
      jefe_descuento_autor VARCHAR(255),
      descripcion TEXT,
      estado VARCHAR(100) DEFAULT 'Disponible',
      imagen_principal TEXT,
      imagenes JSONB DEFAULT '[]'::jsonb,
      foto_principal TEXT,
      galeria JSONB DEFAULT '[]'::jsonb,
      fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id VARCHAR(50) PRIMARY KEY,
      numero VARCHAR(100) NOT NULL,
      cliente_id VARCHAR(50) REFERENCES clients(id) ON DELETE SET NULL,
      vehiculo_id VARCHAR(50) REFERENCES vehicles(id) ON DELETE SET NULL,
      precio_vehiculo NUMERIC(12, 2) DEFAULT 0,
      gastos_importacion NUMERIC(12, 2) DEFAULT 0,
      gastos_aduana NUMERIC(12, 2) DEFAULT 0,
      gastos_logistica NUMERIC(12, 2) DEFAULT 0,
      gastos_seguro NUMERIC(12, 2) DEFAULT 0,
      total NUMERIC(12, 2) DEFAULT 0,
      estado VARCHAR(50) DEFAULT 'Enviada',
      observaciones TEXT,
      fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      vallas_seleccionadas JSONB DEFAULT '[]'::jsonb,
      emisor_nombre VARCHAR(255),
      emisor_rol VARCHAR(100),
      incluye_contrato BOOLEAN DEFAULT FALSE,
      terminos_contrato TEXT,
      descuento_usd NUMERIC(12, 2) DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id VARCHAR(50) PRIMARY KEY,
      numero VARCHAR(100) NOT NULL,
      cotizacion_id VARCHAR(50),
      cliente_id VARCHAR(50) REFERENCES clients(id) ON DELETE SET NULL,
      cliente_nombre VARCHAR(255),
      cliente_empresa VARCHAR(255),
      cliente_nit_ci VARCHAR(100),
      cliente_representante VARCHAR(255),
      cliente_representante_ci VARCHAR(100),
      cliente_escritura_poder VARCHAR(255),
      cliente_poder_fecha VARCHAR(50),
      cliente_notaria_numero VARCHAR(50),
      cliente_notario_nombre VARCHAR(255),
      cliente_celular VARCHAR(50),
      cliente_correo VARCHAR(255),
      cliente_direccion TEXT,
      cliente_ciudad VARCHAR(100),
      arrendador_empresa VARCHAR(255) DEFAULT 'PUBLI-X BOLIVIA',
      arrendador_nit VARCHAR(100),
      arrendador_direccion TEXT,
      arrendador_representante VARCHAR(255),
      arrendador_ci VARCHAR(100),
      valla_id VARCHAR(50),
      valla_nombre VARCHAR(255),
      valla_medidas VARCHAR(100),
      valla_ubicacion VARCHAR(255),
      valla_tipo VARCHAR(100),
      valla_cara VARCHAR(50),
      vallas_lista JSONB DEFAULT '[]'::jsonb,
      lonas_lista JSONB DEFAULT '[]'::jsonb,
      items JSONB DEFAULT '[]'::jsonb,
      lona_detail JSONB DEFAULT '{}'::jsonb,
      beneficios_extras JSONB DEFAULT '[]'::jsonb,
      subtotal_alquiler_usd NUMERIC(12, 2) DEFAULT 0,
      descuento_cliente_usd NUMERIC(12, 2) DEFAULT 0,
      descuento_cliente_porcentaje NUMERIC(6, 2) DEFAULT 0,
      total_neto_usd NUMERIC(12, 2) DEFAULT 0,
      total_neto_bob NUMERIC(12, 2) DEFAULT 0,
      tipo_cambio NUMERIC(10, 4) DEFAULT 6.96,
      fecha_emision VARCHAR(50),
      fecha_inicio VARCHAR(50),
      fecha_fin VARCHAR(50),
      periodo_meses INTEGER DEFAULT 12,
      plazo_meses INTEGER DEFAULT 12,
      forma_pago VARCHAR(255),
      clausulas_especiales TEXT,
      clausulas_adicionales TEXT,
      estado VARCHAR(50) DEFAULT 'Vigente',
      diseno_plantilla VARCHAR(50) DEFAULT 'OFICIAL_VALLAS',
      vendedor_nombre VARCHAR(255),
      vendedor_celular VARCHAR(50),
      vendedor_correo VARCHAR(255),
      observaciones TEXT
    );

    CREATE TABLE IF NOT EXISTS follow_ups (
      id VARCHAR(50) PRIMARY KEY,
      cliente_id VARCHAR(50) REFERENCES clients(id) ON DELETE CASCADE,
      tipo VARCHAR(50) NOT NULL,
      nota TEXT NOT NULL,
      fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      proximo_contacto TIMESTAMP WITH TIME ZONE,
      prioridad VARCHAR(50) DEFAULT 'Media',
      estado VARCHAR(50) DEFAULT 'Pendiente'
    );

    CREATE TABLE IF NOT EXISTS message_templates (
      id VARCHAR(50) PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      contenido TEXT NOT NULL,
      activa BOOLEAN DEFAULT TRUE,
      categoria VARCHAR(100) DEFAULT 'General'
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(50) PRIMARY KEY,
      usuario VARCHAR(255) NOT NULL,
      accion VARCHAR(255) NOT NULL,
      detalle TEXT,
      fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS pending_requests (
      id VARCHAR(50) PRIMARY KEY,
      codigo VARCHAR(100),
      cliente_id VARCHAR(50),
      cliente_nombre VARCHAR(255) NOT NULL,
      cliente_empresa VARCHAR(255),
      cliente_celular VARCHAR(50) NOT NULL,
      cliente_correo VARCHAR(255),
      cliente_ciudad VARCHAR(100),
      vallas_ids JSONB DEFAULT '[]'::jsonb,
      vallas_nombres JSONB DEFAULT '[]'::jsonb,
      vallas_detalles JSONB DEFAULT '[]'::jsonb,
      fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      estado VARCHAR(50) DEFAULT 'Pendiente',
      vendedor_asignado VARCHAR(255),
      observaciones TEXT,
      sugerencia_cotizacion TEXT,
      imagenes_referencia JSONB DEFAULT '[]'::jsonb,
      dispositivo_detectado VARCHAR(100),
      presupuesto_estimado_usd NUMERIC(12, 2)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id VARCHAR(50) PRIMARY KEY DEFAULT 'current',
      nombre_empresa VARCHAR(255) NOT NULL DEFAULT 'PUBLI-X BOLIVIA',
      direccion TEXT DEFAULT 'Av. Banzer y 4to Anillo, Torre Empresarial, Piso 6',
      ciudad VARCHAR(100) DEFAULT 'Santa Cruz de la Sierra',
      departamento VARCHAR(100) DEFAULT 'Santa Cruz',
      pais VARCHAR(100) DEFAULT 'Bolivia',
      telefono VARCHAR(50) DEFAULT '+591 3 3559988',
      whatsapp VARCHAR(50) DEFAULT '+591 70000000',
      correo VARCHAR(255) DEFAULT 'ventas@publix.bo',
      web VARCHAR(255) DEFAULT 'www.publix.bo',
      logo TEXT DEFAULT '',
      tipo_cambio NUMERIC(10, 4) DEFAULT 6.96,
      terminos_cotizacion TEXT,
      custom_fields JSONB DEFAULT '{}'::jsonb,
      backup_auto_enabled BOOLEAN DEFAULT TRUE,
      backup_interval_hours INTEGER DEFAULT 24,
      backup_on_critical_change BOOLEAN DEFAULT TRUE,
      backup_last_timestamp VARCHAR(100),
      backup_on_save BOOLEAN DEFAULT TRUE,
      backup_retention_count INTEGER DEFAULT 10
    );

    CREATE TABLE IF NOT EXISTS system_meta (
      key VARCHAR(100) PRIMARY KEY,
      value VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  await pool.query(sql);
  console.log('✅ PostgreSQL Schema tables verified and migrated successfully.');
}

async function seedInitialDataIfEmpty() {
  if (!pool) return;
  try {
    // 1. Check if seed has already been marked completed in system_meta
    const metaRes = await pool.query("SELECT value FROM system_meta WHERE key = 'initial_seed_completed'");
    if (metaRes.rows.length > 0 && metaRes.rows[0].value === 'true') {
      console.log('ℹ️ Initial PostgreSQL seed was already completed previously. Skipping data seeding to preserve user modifications and deletions.');
      return;
    }

    // 2. Double check if any table already has data (in case database was migrated before system_meta existed)
    const [usersCount, clientsCount, vehiclesCount] = await Promise.all([
      pool.query('SELECT count(*) FROM users'),
      pool.query('SELECT count(*) FROM clients'),
      pool.query('SELECT count(*) FROM vehicles')
    ]);

    const hasUsers = parseInt(usersCount.rows[0].count, 10) > 0;
    const hasClients = parseInt(clientsCount.rows[0].count, 10) > 0;
    const hasVehicles = parseInt(vehiclesCount.rows[0].count, 10) > 0;

    if (hasUsers || hasClients || hasVehicles) {
      console.log('ℹ️ Database already contains records. Registering initial_seed_completed and skipping seed.');
      await pool.query(
        "INSERT INTO system_meta (key, value) VALUES ('initial_seed_completed', 'true') ON CONFLICT (key) DO NOTHING"
      );
      return;
    }

    console.log('🌱 Database is completely empty. Seeding initial starter data on first run only...');
    // Seed Users
    const users: UserSession[] = [
      {
        id: 'U001',
        nombre: 'Carlos David Vargas',
        nombres: 'Carlos David',
        apellidos: 'Vargas',
        usuario: 'carlos.vargas',
        rol: 'Dueño',
        celular: '+59170000000',
        email: 'carlosdavidvargas@gmail.com',
        password: '70000000',
        estado: 'Activo'
      },
      {
        id: 'U002',
        nombre: 'Alejandro Claure',
        nombres: 'Alejandro',
        apellidos: 'Claure',
        usuario: 'alejandro.claure',
        rol: 'Jefe',
        celular: '+59160012345',
        email: 'gerencia@publix.bo',
        password: '60012345',
        estado: 'Activo'
      },
      {
        id: 'U003',
        nombre: 'Mariana Suárez',
        nombres: 'Mariana',
        apellidos: 'Suárez',
        usuario: 'mariana.suarez',
        rol: 'Vendedor',
        celular: '+59171098765',
        email: 'ventas@publix.bo',
        password: '71098765',
        estado: 'Activo'
      }
    ];

    for (const u of users) {
      await pool.query(
        `INSERT INTO users (id, nombre, nombres, apellidos, usuario, rol, celular, email, password, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [u.id, u.nombre, u.nombres || null, u.apellidos || null, u.usuario, u.rol, u.celular, u.email, u.password, u.estado]
      );
    }

    // Seed Initial Settings
    await pool.query(
      `INSERT INTO settings (id, nombre_empresa, direccion, ciudad, departamento, pais, telefono, whatsapp, correo, web, logo, tipo_cambio, terminos_cotizacion)
       VALUES ('current', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO NOTHING`,
      [
        memoryStore.settings.nombre_empresa,
        memoryStore.settings.direccion,
        memoryStore.settings.ciudad,
        memoryStore.settings.departamento,
        memoryStore.settings.pais,
        memoryStore.settings.telefono,
        memoryStore.settings.whatsapp,
        memoryStore.settings.correo,
        memoryStore.settings.web,
        memoryStore.settings.logo,
        memoryStore.settings.tipo_cambio,
        memoryStore.settings.terminos_cotizacion
      ]
    );

    // Seed Templates
    const templates = [
      {
        id: 'T001',
        nombre: '[PLANTILLA] Mensaje de Bienvenida & Presentación',
        contenido: 'Hola {CLIENTE}, te saluda {VENDEDOR} de *PUBLI-X BOLIVIA* 📢. Gracias por contactarte con nosotros. Somos líderes en Publicidad Exterior (Vallas Unipolares, Pantallas LED Gigantes, Pasarelas y Lonas Frontlight). ¿Qué tipo de espacio publicitario estás buscando para tu campaña?',
        activa: true
      },
      {
        id: 'T002',
        nombre: '[PLANTILLA] Envío de Propuesta y Catálogo OOH',
        contenido: 'Estimado/a {CLIENTE}, te comparto nuestra propuesta publicitaria recomendada:\n\n*📢 {MARCA} - {MODELO}*\n• Medidas: {VERSION}\n• Impacto: {MOTOR}\n• Modalidad: {TRANSMISION}\n\n*Inversión mensual:* USD {PRECIO}\n\n¿Te gustaría que te preparemos la cotización formal en PDF con fotografías y mapa satelital?',
        activa: true
      },
      {
        id: 'T003',
        nombre: '[PLANTILLA] Seguimiento de Cotización Formal',
        contenido: 'Hola {CLIENTE}, te saluda {VENDEDOR} de *PUBLI-X BOLIVIA*. Te escribo para consultar si tuviste oportunidad de revisar la cotización *{COTIZACION_NUM}* que te enviamos. Recuerda que los espacios estratégicos tienen alta demanda. Quedo atento a tus consultas.',
        activa: true
      }
    ];

    for (const t of templates) {
      await pool.query(
        `INSERT INTO message_templates (id, nombre, contenido, activa, categoria)
         VALUES ($1, $2, $3, $4, 'General')`,
        [t.id, t.nombre, t.contenido, t.activa]
      );
    }

    // Seed Sample Clients
    const sampleClients: Client[] = [
      {
        id: 'C001',
        nombre: 'Juan Pérez Demo',
        empresa: '[EJEMPLO] Empresa Demo S.R.L. (PRUEBA)',
        razon_social: 'Empresa Demo S.R.L.',
        nit_ci: '1029384756',
        celular: '+59170000001',
        ciudad: 'Santa Cruz',
        departamento: 'Santa Cruz',
        pais: 'Bolivia',
        presupuesto_usd: 1200,
        observaciones: '[REGISTRO DE EJEMPLO / PRUEBA] Cliente de prueba para demostración de cotización de vallas.',
        estado: 'Cotizado',
        usuario_acceso: 'juan.perez',
        password_acceso: '70000001',
        fecha_registro: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString()
      },
      {
        id: 'C002',
        nombre: 'María Gómez Prueba',
        empresa: '[EJEMPLO] Corporación Prueba Bolivia (PRUEBA)',
        razon_social: 'Corporación Prueba S.A.',
        nit_ci: '1098765432',
        celular: '+59170000002',
        ciudad: 'La Paz',
        departamento: 'La Paz',
        pais: 'Bolivia',
        presupuesto_usd: 1800,
        observaciones: '[REGISTRO DE EJEMPLO / PRUEBA] Cliente de prueba interesado en pantalla LED gigante.',
        estado: 'Interesado',
        usuario_acceso: 'maria.gomez',
        password_acceso: '70000002',
        fecha_registro: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString()
      }
    ];

    for (const c of sampleClients) {
      await pool.query(
        `INSERT INTO clients (id, nombre, empresa, razon_social, nit_ci, celular, ciudad, departamento, pais, presupuesto_usd, observaciones, estado, usuario_acceso, password_acceso, fecha_registro, fecha_actualizacion)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [c.id, c.nombre, c.empresa, c.razon_social, c.nit_ci, c.celular, c.ciudad, c.departamento, c.pais, c.presupuesto_usd, c.observaciones, c.estado, c.usuario_acceso, c.password_acceso, c.fecha_registro, c.fecha_actualizacion]
      );
    }

    // Seed Sample Vehicles (OOH Inventory)
    const sampleVehicles: Vehicle[] = [
      {
        id: 'V001',
        codigo: 'VAL-SCZ-DEMO01',
        nombre: '[EJEMPLO] Valla Monumental Av. Banzer 4to Anillo (PRUEBA)',
        ubicacion: 'Santa Cruz - Av. Banzer y 4to Anillo',
        dimensiones: '12m x 4m (48 m²)',
        medidas: '12 x 4 m',
        especificacion: 'Lona Frontlight 13oz Alta Definición (1440 DPI)',
        modalidad: 'Alquiler Mensual',
        iluminacion: 'Iluminación LED Nocturna 24/7',
        marca: 'Valla Publicitaria',
        modelo: 'Av. Banzer y 4to Anillo',
        version: '12m x 4m - Lona Frontlight + LED',
        anio: 2026,
        tipo: 'Unipolar',
        tipo_valla: 'Unipolar',
        alto_impacto: true,
        ciudad: 'Santa Cruz',
        zona: 'Zona Norte / Equipetrol',
        avenida_calle: 'Av. Banzer y 4to Anillo',
        cara: 'Cara A',
        provincia: 'Andrés Ibáñez',
        transitabilidad_trafico: '180,000 vehículos/día',
        costo_lona_m2_bs: 65,
        precio_usd: 1200,
        precio_original_usd: 1200,
        descripcion: '[REGISTRO DE EJEMPLO / PRUEBA] Valla publicitaria monumental de prueba en Av. Banzer y 4to Anillo.',
        detalle: 'Estructura unipolar de 14m de altura, iluminación con 4 reflectores LED de 200W temporizados.',
        estado: 'Disponible',
        imagen_principal: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600',
        imagenes: ['https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600'],
        fecha_registro: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString()
      },
      {
        id: 'V002',
        codigo: 'LED-LPZ-DEMO02',
        nombre: '[EJEMPLO] Pantalla LED Gigante HD Plaza Abaroa (PRUEBA)',
        ubicacion: 'La Paz - Zona Sopocachi, Plaza Abaroa',
        dimensiones: '8m x 4m (32 m²)',
        medidas: '8 x 4 m',
        especificacion: 'Pitch P3.91mm Outdoor 6500 nits Ultra Brillo',
        modalidad: 'Alquiler Mensual / Spots 15s',
        iluminacion: 'Pantalla Digital LED',
        marca: 'Pantalla LED',
        modelo: 'Plaza Abaroa - Sopocachi',
        version: '8m x 4m - Pitch P3.91mm HD Outdoor',
        anio: 2026,
        tipo: 'Pantalla LED',
        tipo_valla: 'Pantalla LED',
        alto_impacto: true,
        ciudad: 'La Paz',
        zona: 'Sopocachi',
        avenida_calle: 'Plaza Abaroa - Sopocachi',
        cara: 'Cara A',
        provincia: 'Murillo',
        transitabilidad_trafico: '220,000 peatones y vehículos/día',
        costo_lona_m2_bs: 0,
        precio_usd: 1800,
        precio_original_usd: 1800,
        descripcion: '[REGISTRO DE EJEMPLO / PRUEBA] Pantalla LED gigante exterior en el nodo neurálgico de Sopocachi.',
        detalle: 'Pantalla LED Outdoor P3.91, resolución nativa Full HD, rotación de 12 spots por ciclo de 2 minutos.',
        estado: 'Disponible',
        imagen_principal: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600',
        imagenes: ['https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600'],
        fecha_registro: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString()
      },
      {
        id: 'V003',
        codigo: 'VAL-CBB-DEMO03',
        nombre: '[EJEMPLO] Valla Pasarela Av. Blanco Galindo Km 3 (PRUEBA)',
        ubicacion: 'Cochabamba - Av. Blanco Galindo Km 3',
        dimensiones: '10m x 3.5m (35 m²)',
        medidas: '10 x 3.5 m',
        especificacion: 'Lona Frontlight 13oz + Reflectores LED',
        modalidad: 'Alquiler Mensual',
        iluminacion: 'Iluminación LED Nocturna',
        marca: 'Valla Publicitaria',
        modelo: 'Av. Blanco Galindo Km 3',
        version: '10m x 3.5m - Pasarela Frontal',
        anio: 2026,
        tipo: 'Puente Peatonal',
        tipo_valla: 'Puente Peatonal',
        alto_impacto: true,
        ciudad: 'Cochabamba',
        zona: 'Oeste / Quillacollo',
        avenida_calle: 'Av. Blanco Galindo Km 3',
        cara: 'Cara A',
        provincia: 'Cercado',
        transitabilidad_trafico: '140,000 vehículos/día',
        costo_lona_m2_bs: 65,
        precio_usd: 950,
        precio_original_usd: 950,
        descripcion: '[REGISTRO DE EJEMPLO / PRUEBA] Valla en pasarela peatonal sobre la vía más transitada de Cochabamba.',
        detalle: 'Excelente visibilidad frontal para tráfico vehicular en dirección Quillacollo - Centro.',
        estado: 'Disponible',
        imagen_principal: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=600',
        imagenes: ['https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=600'],
        fecha_registro: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString()
      }
    ];

    for (const v of sampleVehicles) {
      await pool.query(
        `INSERT INTO vehicles (id, codigo, nombre, tipo_valla, zona, cara, ciudad, avenida_calle, provincia, detalle, medidas, transitabilidad_trafico, costo_lona_m2_bs, alto_impacto, ubicacion, dimensiones, especificacion, modalidad, iluminacion, marca, modelo, version, anio, tipo, precio_usd, precio_original_usd, descripcion, estado, imagen_principal, imagenes, fecha_registro, fecha_actualizacion)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)`,
        [
          v.id, v.codigo, v.nombre, v.tipo_valla, v.zona, v.cara, v.ciudad, v.avenida_calle, v.provincia,
          v.detalle, v.medidas, v.transitabilidad_trafico, v.costo_lona_m2_bs, v.alto_impacto, v.ubicacion,
          v.dimensiones, v.especificacion, v.modalidad, v.iluminacion, v.marca, v.modelo, v.version,
          v.anio, v.tipo, v.precio_usd, v.precio_original_usd, v.descripcion, v.estado, v.imagen_principal,
          JSON.stringify(v.imagenes), v.fecha_registro, v.fecha_actualizacion
        ]
      );
    }

    // Seed Sample Quotation
    const sampleQuote = {
      id: 'Q001',
      numero: 'PUBLIX-20260701-000001',
      cliente_id: 'C001',
      vehiculo_id: 'V001',
      precio_vehiculo: 1200,
      gastos_importacion: 300,
      gastos_aduana: 150,
      gastos_logistica: 100,
      gastos_seguro: 50,
      total: 1800,
      estado: 'Enviada',
      observaciones: '[REGISTRO DE EJEMPLO / PRUEBA] Cotización de prueba para Valla Banzer 4to Anillo.',
      fecha: new Date().toISOString(),
      emisor_nombre: 'Carlos David Vargas',
      emisor_rol: 'Dueño'
    };

    await pool.query(
      `INSERT INTO quotations (id, numero, cliente_id, vehiculo_id, precio_vehiculo, gastos_importacion, gastos_aduana, gastos_logistica, gastos_seguro, total, estado, observaciones, fecha, emisor_nombre, emisor_rol)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [sampleQuote.id, sampleQuote.numero, sampleQuote.cliente_id, sampleQuote.vehiculo_id, sampleQuote.precio_vehiculo, sampleQuote.gastos_importacion, sampleQuote.gastos_aduana, sampleQuote.gastos_logistica, sampleQuote.gastos_seguro, sampleQuote.total, sampleQuote.estado, sampleQuote.observaciones, sampleQuote.fecha, sampleQuote.emisor_nombre, sampleQuote.emisor_rol]
    );

    // Initial audit log
    await pool.query(
      `INSERT INTO audit_logs (id, usuario, accion, detalle, fecha)
       VALUES ($1, 'Sistema', 'Inicio de Base de Datos PostgreSQL', 'Base de datos PostgreSQL inicializada con tablas y esquemas.', NOW())`,
      ['L001']
    );

    // Register initial seed completed permanently in PostgreSQL
    await pool.query(
      "INSERT INTO system_meta (key, value) VALUES ('initial_seed_completed', 'true') ON CONFLICT (key) DO UPDATE SET value = 'true'"
    );

    console.log('✅ PostgreSQL initial data seeded and locked.');
  } catch (err) {
    console.error('⚠️ Error during seedInitialDataIfEmpty:', err);
  }
}

let memoryStoreSeeded = false;

function seedMemoryStore() {
  if (memoryStoreSeeded) return;
  memoryStoreSeeded = true;
  memoryStore.users = [
    {
      id: 'U001',
      nombre: 'Carlos David Vargas',
      nombres: 'Carlos David',
      apellidos: 'Vargas',
      usuario: 'carlos.vargas',
      rol: 'Dueño',
      celular: '+59170000000',
      email: 'carlosdavidvargas@gmail.com',
      password: '70000000',
      estado: 'Activo'
    },
    {
      id: 'U002',
      nombre: 'Alejandro Claure',
      nombres: 'Alejandro',
      apellidos: 'Claure',
      usuario: 'alejandro.claure',
      rol: 'Jefe',
      celular: '+59160012345',
      email: 'gerencia@publix.bo',
      password: '60012345',
      estado: 'Activo'
    },
    {
      id: 'U003',
      nombre: 'Mariana Suárez',
      nombres: 'Mariana',
      apellidos: 'Suárez',
      usuario: 'mariana.suarez',
      rol: 'Vendedor',
      celular: '+59171098765',
      email: 'ventas@publix.bo',
      password: '71098765',
      estado: 'Activo'
    }
  ];

  memoryStore.clients = [
    {
      id: 'C001',
      nombre: 'Juan Pérez Demo',
      empresa: '[EJEMPLO] Empresa Demo S.R.L. (PRUEBA)',
      razon_social: 'Empresa Demo S.R.L.',
      nit_ci: '1029384756',
      celular: '+59170000001',
      ciudad: 'Santa Cruz',
      departamento: 'Santa Cruz',
      pais: 'Bolivia',
      presupuesto_usd: 1200,
      observaciones: '[REGISTRO DE EJEMPLO / PRUEBA] Cliente de prueba para demostración de cotización de vallas.',
      estado: 'Cotizado',
      usuario_acceso: 'juan.perez',
      password_acceso: '70000001',
      fecha_registro: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString()
    },
    {
      id: 'C002',
      nombre: 'María Gómez Prueba',
      empresa: '[EJEMPLO] Corporación Prueba Bolivia (PRUEBA)',
      razon_social: 'Corporación Prueba S.A.',
      nit_ci: '1098765432',
      celular: '+59170000002',
      ciudad: 'La Paz',
      departamento: 'La Paz',
      pais: 'Bolivia',
      presupuesto_usd: 1800,
      observaciones: '[REGISTRO DE EJEMPLO / PRUEBA] Cliente de prueba interesado en pantalla LED gigante.',
      estado: 'Interesado',
      usuario_acceso: 'maria.gomez',
      password_acceso: '70000002',
      fecha_registro: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString()
    }
  ];

  memoryStore.vehicles = [
    {
      id: 'V001',
      codigo: 'VAL-SCZ-DEMO01',
      nombre: '[EJEMPLO] Valla Monumental Av. Banzer 4to Anillo (PRUEBA)',
      ubicacion: 'Santa Cruz - Av. Banzer y 4to Anillo',
      dimensiones: '12m x 4m (48 m²)',
      medidas: '12 x 4 m',
      especificacion: 'Lona Frontlight 13oz Alta Definición (1440 DPI)',
      modalidad: 'Alquiler Mensual',
      iluminacion: 'Iluminación LED Nocturna 24/7',
      marca: 'Valla Publicitaria',
      modelo: 'Av. Banzer y 4to Anillo',
      version: '12m x 4m - Lona Frontlight + LED',
      anio: 2026,
      tipo: 'Unipolar',
      tipo_valla: 'Unipolar',
      alto_impacto: true,
      ciudad: 'Santa Cruz',
      zona: 'Zona Norte / Equipetrol',
      avenida_calle: 'Av. Banzer y 4to Anillo',
      cara: 'Cara A',
      provincia: 'Andrés Ibáñez',
      transitabilidad_trafico: '180,000 vehículos/día',
      costo_lona_m2_bs: 65,
      precio_usd: 1200,
      precio_original_usd: 1200,
      descripcion: '[REGISTRO DE EJEMPLO / PRUEBA] Valla publicitaria monumental de prueba en Av. Banzer y 4to Anillo.',
      detalle: 'Estructura unipolar de 14m de altura, iluminación con 4 reflectores LED de 200W temporizados.',
      estado: 'Disponible',
      imagen_principal: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600',
      imagenes: ['https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600'],
      fecha_registro: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString()
    },
    {
      id: 'V002',
      codigo: 'LED-LPZ-DEMO02',
      nombre: '[EJEMPLO] Pantalla LED Gigante HD Plaza Abaroa (PRUEBA)',
      ubicacion: 'La Paz - Zona Sopocachi, Plaza Abaroa',
      dimensiones: '8m x 4m (32 m²)',
      medidas: '8 x 4 m',
      especificacion: 'Pitch P3.91mm Outdoor 6500 nits Ultra Brillo',
      modalidad: 'Alquiler Mensual / Spots 15s',
      iluminacion: 'Pantalla Digital LED',
      marca: 'Pantalla LED',
      modelo: 'Plaza Abaroa - Sopocachi',
      version: '8m x 4m - Pitch P3.91mm HD Outdoor',
      anio: 2026,
      tipo: 'Pantalla LED',
      tipo_valla: 'Pantalla LED',
      alto_impacto: true,
      ciudad: 'La Paz',
      zona: 'Sopocachi',
      avenida_calle: 'Plaza Abaroa - Sopocachi',
      cara: 'Cara A',
      provincia: 'Murillo',
      transitabilidad_trafico: '220,000 peatones y vehículos/día',
      costo_lona_m2_bs: 0,
      precio_usd: 1800,
      precio_original_usd: 1800,
      descripcion: '[REGISTRO DE EJEMPLO / PRUEBA] Pantalla LED gigante exterior en el nodo neurálgico de Sopocachi.',
      detalle: 'Pantalla LED Outdoor P3.91, resolución nativa Full HD, rotación de 12 spots por ciclo de 2 minutos.',
      estado: 'Disponible',
      imagen_principal: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600',
      imagenes: ['https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600'],
      fecha_registro: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString()
    },
    {
      id: 'V003',
      codigo: 'VAL-CBB-DEMO03',
      nombre: '[EJEMPLO] Valla Pasarela Av. Blanco Galindo Km 3 (PRUEBA)',
      ubicacion: 'Cochabamba - Av. Blanco Galindo Km 3',
      dimensiones: '10m x 3.5m (35 m²)',
      medidas: '10 x 3.5 m',
      especificacion: 'Lona Frontlight 13oz + Reflectores LED',
      modalidad: 'Alquiler Mensual',
      iluminacion: 'Iluminación LED Nocturna',
      marca: 'Valla Publicitaria',
      modelo: 'Av. Blanco Galindo Km 3',
      version: '10m x 3.5m - Pasarela Frontal',
      anio: 2026,
      tipo: 'Puente Peatonal',
      tipo_valla: 'Puando Peatonal',
      alto_impacto: true,
      ciudad: 'Cochabamba',
      zona: 'Oeste / Quillacollo',
      avenida_calle: 'Av. Blanco Galindo Km 3',
      cara: 'Cara A',
      provincia: 'Cercado',
      transitabilidad_trafico: '140,000 vehículos/día',
      costo_lona_m2_bs: 65,
      precio_usd: 950,
      precio_original_usd: 950,
      descripcion: '[REGISTRO DE EJEMPLO / PRUEBA] Valla en pasarela peatonal sobre la vía más transitada de Cochabamba.',
      detalle: 'Excelente visibilidad frontal para tráfico vehicular en dirección Quillacollo - Centro.',
      estado: 'Disponible',
      imagen_principal: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=600',
      imagenes: ['https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=600'],
      fecha_registro: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString()
    }
  ];

  memoryStore.templates = [
    {
      id: 'T001',
      nombre: '[PLANTILLA] Mensaje de Bienvenida & Presentación',
      contenido: 'Hola {CLIENTE}, te saluda {VENDEDOR} de *PUBLI-X BOLIVIA* 📢. Gracias por contactarte con nosotros. Somos líderes en Publicidad Exterior (Vallas Unipolares, Pantallas LED Gigantes, Pasarelas y Lonas Frontlight). ¿Qué tipo de espacio publicitario estás buscando para tu campaña?',
      activa: true
    },
    {
      id: 'T002',
      nombre: '[PLANTILLA] Envío de Propuesta y Catálogo OOH',
      contenido: 'Estimado/a {CLIENTE}, te comparto nuestra propuesta publicitaria recomendada:\n\n*📢 {MARCA} - {MODELO}*\n• Medidas: {VERSION}\n• Impacto: {MOTOR}\n• Modalidad: {TRANSMISION}\n\n*Inversión mensual:* USD {PRECIO}\n\n¿Te gustaría que te preparemos la cotización formal en PDF con fotografías y mapa satelital?',
      activa: true
    },
    {
      id: 'T003',
      nombre: '[PLANTILLA] Seguimiento de Cotización Formal',
      contenido: 'Hola {CLIENTE}, te saluda {VENDEDOR} de *PUBLI-X BOLIVIA*. Te escribo para consultar si tuviste oportunidad de revisar la cotización *{COTIZACION_NUM}* que te enviamos. Recuerda que los espacios estratégicos tienen alta demanda. Quedo atento a tus consultas.',
      activa: true
    }
  ];

  memoryStore.quotations = [
    {
      id: 'Q001',
      numero: 'PUBLIX-20260701-000001',
      cliente_id: 'C001',
      vehiculo_id: 'V001',
      precio_vehiculo: 1200,
      gastos_importacion: 300,
      gastos_aduana: 150,
      gastos_logistica: 100,
      gastos_seguro: 50,
      total: 1800,
      estado: 'Enviada',
      observaciones: '[REGISTRO DE EJEMPLO / PRUEBA] Cotización de prueba para Valla Banzer 4to Anillo.',
      fecha: new Date().toISOString(),
      emisor_nombre: 'Carlos David Vargas',
      emisor_rol: 'Dueño'
    }
  ];

  memoryStore.followUps = [
    {
      id: 'F001',
      cliente_id: 'C001',
      tipo: 'Llamada',
      nota: '[EJEMPLO] Llamada de seguimiento comercial para Valla Banzer 4to Anillo (PRUEBA).',
      fecha: new Date().toISOString(),
      proximo_contacto: new Date(Date.now() + 86400000 * 3).toISOString(),
      prioridad: 'Alta',
      estado: 'Pendiente'
    }
  ];

  memoryStore.auditLogs = [
    {
      id: 'L001',
      usuario: 'Sistema',
      accion: 'Inicio de Sistema',
      detalle: 'Servidor iniciado y listo para recibir peticiones.',
      fecha: new Date().toISOString()
    }
  ];
}
