import { Client, Vehicle, Quotation, Contract, Invoice, FollowUp, MessageTemplate, AuditLog, Settings, UserSession, PendingQuotationRequest, BackupRecord } from '../types';
import { INITIAL_VEHICLES } from './initialVehicles';
import { generateClientCredentials } from '../utils/credentials';
import { api } from '../services/api';

const DB_KEYS = {
  CLIENTS: 'mla_autosender_clients',
  VEHICLES: 'mla_autosender_vehicles',
  QUOTATIONS: 'mla_autosender_quotations',
  CONTRACTS: 'mla_autosender_contracts',
  INVOICES: 'mla_autosender_invoices',
  FOLLOW_UPS: 'mla_autosender_follow_ups',
  TEMPLATES: 'mla_autosender_templates',
  AUDIT_LOGS: 'mla_autosender_audit_logs',
  SETTINGS: 'mla_autosender_settings',
  USERS: 'mla_autosender_users',
  CURRENT_USER: 'mla_autosender_current_user',
  PENDING_REQUESTS: 'mla_autosender_pending_requests',
  AUTO_BACKUPS: 'mla_autosender_auto_backups',
  LAST_BACKUP_TIMESTAMP: 'mla_autosender_last_backup_ts',
};

// 2 Sample Clients clearly identified as [EJEMPLO] / (PRUEBA)
const INITIAL_CLIENTS: Client[] = [
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
    fecha_registro: '2026-07-01T09:00:00Z',
    fecha_actualizacion: '2026-07-01T09:00:00Z'
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
    fecha_registro: '2026-07-02T10:00:00Z',
    fecha_actualizacion: '2026-07-02T10:00:00Z'
  }
];

const DEFAULT_TEMPLATES: MessageTemplate[] = [
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

const DEFAULT_SETTINGS: Settings = {
  nombre_empresa: 'PUBLI-X BOLIVIA',
  nombre_comercial: 'Publi-X Cobertura Nacional Impacto Total',
  nit: '4579387019',
  domicilio_legal: 'Calle Los Tajibos 2185, Barrio Petrolero Norte, UV 0016 MZA 14, entre 2do anillo y Av. Los Cusis, frente a importadora TOA, Santa Cruz',
  representante_legal: 'Carlos David Vargas Añez',
  representante_cargo: 'Gerente General',
  representante_ci: '4579387',
  representante_ci_emision: 'Santa Cruz',
  notaria_arbitraje: 'CAINCO Santa Cruz',
  direccion: 'Calle Los Tajibos 2185, Barrio Petrolero Norte, UV 0016 MZA 14, entre 2do anillo y Av. Los Cusis',
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
};

// Staff Users with default mobile passwords
const DEFAULT_USERS: UserSession[] = [
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

// 2 Sample Follow-ups
const INITIAL_FOLLOW_UPS: FollowUp[] = [
  {
    id: 'F001',
    cliente_id: 'C001',
    tipo: 'Llamada',
    nota: '[EJEMPLO] Llamada de seguimiento comercial para Valla Banzer 4to Anillo (PRUEBA).',
    fecha: '2026-07-01T10:00:00Z',
    proximo_contacto: '2026-07-05T10:00:00Z',
    prioridad: 'Alta',
    estado: 'Pendiente'
  },
  {
    id: 'F002',
    cliente_id: 'C002',
    tipo: 'WhatsApp',
    nota: '[EJEMPLO] Envío de catálogo digital de Pantallas LED (PRUEBA).',
    fecha: '2026-07-02T11:00:00Z',
    proximo_contacto: '2026-07-06T15:00:00Z',
    prioridad: 'Media',
    estado: 'Pendiente'
  }
];

// 1 Sample Quotation
const INITIAL_QUOTATIONS: Quotation[] = [
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
    fecha: '2026-07-01T11:00:00Z',
    emisor_nombre: 'Carlos David Vargas',
    emisor_rol: 'Dueño'
  }
];

// 1 Sample Contract
const INITIAL_CONTRACTS: Contract[] = [
  {
    id: 'CON-00001',
    numero: '00001 PUBLI-X/2026',
    cotizacion_id: 'Q001',
    cliente_id: 'C001',
    cliente_nombre: '[EJEMPLO] Empresa Demo S.R.L. (PRUEBA)',
    cliente_empresa: 'Empresa Demo S.R.L.',
    cliente_nit_ci: '1029384756',
    cliente_representante: 'Juan Pérez Demo',
    cliente_representante_ci: '4567890 SC',
    cliente_celular: '+59170000001',
    cliente_correo: 'contacto@empresademo.bo',
    cliente_direccion: 'Av. Banzer y 3er Anillo',
    cliente_ciudad: 'Santa Cruz',
    arrendador_empresa: 'PUBLI-X BOLIVIA',
    arrendador_nit: '1029384029',
    arrendador_direccion: 'Av. Banzer y 4to Anillo, Torre Empresarial',
    arrendador_representante: 'Carlos David Vargas',
    arrendador_ci: '4579387 SC',
    valla_nombre: '[EJEMPLO] Valla Monumental Av. Banzer 4to Anillo (PRUEBA)',
    valla_medidas: '12 x 4 m',
    valla_ubicacion: 'Santa Cruz',
    valla_tipo: 'Unipolar',
    valla_cara: 'Cara A',
    vallas_lista: [
      {
        id: 'V001',
        ciudad: 'Santa Cruz',
        formato: '12 x 4 m',
        direccion: 'Av. Banzer y 4to Anillo',
        costo_mensual_bs: 8352,
        descuento_bs: 0,
        costo_neto_bs: 8352
      }
    ],
    lonas_lista: [
      {
        id: 'L001',
        direccion: 'Av. Banzer y 4to Anillo',
        medidas: '12 x 4 m (48 m²)',
        costo_unitario_bs: 45,
        descuento_lona_bs: 0,
        total_costo_bs: 2160
      }
    ],
    items: [],
    lona_detail: {
      incluye_lona: true,
      especificacion: 'Confección e instalación de lona frontlight 13oz full color',
      medidas_m2: 48,
      costo_m2_usd: 10,
      costo_total_lona: 480,
      descuento_lona_usd: 0,
      subtotal_lona_neto: 480
    },
    beneficios_extras: [
      'Iluminación LED nocturna programada 12 horas diarias',
      'Mantenimiento preventivo y seguro de estructura'
    ],
    subtotal_alquiler_usd: 1200,
    descuento_cliente_usd: 0,
    descuento_cliente_porcentaje: 0,
    total_neto_usd: 1200,
    total_neto_bob: 8352,
    tipo_cambio: 6.96,
    fecha_emision: '2026-07-01',
    fecha_inicio: '2026-07-01',
    fecha_fin: '2027-06-30',
    periodo_meses: 12,
    plazo_meses: 12,
    forma_pago: 'Mensual anticipado vía transferencia o cheque',
    clausulas_especiales: '[REGISTRO DE EJEMPLO / PRUEBA] Contrato de prueba para fines demostrativos.',
    estado: 'Vigente',
    vendedor_nombre: 'Carlos David Vargas',
    observaciones: '[REGISTRO DE EJEMPLO / PRUEBA]'
  }
];

const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'INV-001',
    numero_factura: 'FAC-2026-0001',
    tipo_origen: 'CONTRATO_ARRENDAMIENTO',
    contrato_id: 'CON-001',
    cliente_id: 'C001',
    cliente_nombre: 'Juan Pérez Demo',
    cliente_razon_social: '[EJEMPLO] Empresa Demo S.R.L. (PRUEBA)',
    cliente_nit_ci: '1029384756',
    cliente_ciudad: 'Santa Cruz',
    fecha_emision: '2026-07-03',
    periodo_facturado: 'Mes de Julio 2026',
    items: [
      {
        id: '1',
        descripcion: 'Alquiler de Espacio Publicitario OOH - Valla Monumental Av. Banzer 4to Anillo',
        medida_unidad: 'MES',
        cantidad: 1,
        precio_unitario_bs: 8352,
        descuento_bs: 0,
        subtotal_bs: 8352
      }
    ],
    subtotal_bs: 8352,
    descuento_total_bs: 0,
    total_bs: 8352,
    total_literal_bs: 'OCHO MIL TRESCIENTOS CINCUENTA Y DOS 00/100 BOLIVIANOS',
    total_usd: 1200,
    tipo_cambio: 6.96,
    estado: 'Emitida',
    codigo_autorizacion_sin: '4A8F93B27C10E'
  }
];

const INITIAL_PENDING_REQUESTS: PendingQuotationRequest[] = [
  {
    id: 'SOL-001',
    codigo: 'SOL-2026-DEMO01',
    cliente_nombre: 'Juan Pérez Demo',
    cliente_empresa: '[EJEMPLO] Empresa Demo S.R.L. (PRUEBA)',
    cliente_celular: '+59170000001',
    cliente_correo: 'contacto@empresademo.bo',
    cliente_ciudad: 'Santa Cruz',
    vallas_ids: ['V001'],
    vallas_nombres: ['[EJEMPLO] Valla Monumental Av. Banzer 4to Anillo (PRUEBA)'],
    fecha: '2026-07-01T09:30:00Z',
    estado: 'Cotizado',
    observaciones: '[REGISTRO DE EJEMPLO / PRUEBA] Solicitud de cotización de prueba'
  }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'L001',
    usuario: 'Sistema',
    accion: 'Inicialización de Base de Datos',
    detalle: 'Base de datos de PUBLI-X lista con registros de ejemplo claramente identificados.',
    fecha: new Date().toISOString()
  }
];

export const mockDb = {
  initialize() {
    try {
      const isInit = localStorage.getItem('publix_db_initialized_v3');
      if (!isInit) {
        if (localStorage.getItem(DB_KEYS.CLIENTS) === null) {
          localStorage.setItem(DB_KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS));
        }
        if (localStorage.getItem(DB_KEYS.VEHICLES) === null) {
          localStorage.setItem(DB_KEYS.VEHICLES, JSON.stringify(INITIAL_VEHICLES));
        }
        if (localStorage.getItem(DB_KEYS.QUOTATIONS) === null) {
          localStorage.setItem(DB_KEYS.QUOTATIONS, JSON.stringify(INITIAL_QUOTATIONS));
        }
        if (localStorage.getItem(DB_KEYS.CONTRACTS) === null) {
          localStorage.setItem(DB_KEYS.CONTRACTS, JSON.stringify(INITIAL_CONTRACTS));
        }
        if (localStorage.getItem(DB_KEYS.FOLLOW_UPS) === null) {
          localStorage.setItem(DB_KEYS.FOLLOW_UPS, JSON.stringify(INITIAL_FOLLOW_UPS));
        }
        if (localStorage.getItem(DB_KEYS.TEMPLATES) === null) {
          localStorage.setItem(DB_KEYS.TEMPLATES, JSON.stringify(DEFAULT_TEMPLATES));
        }
        if (localStorage.getItem(DB_KEYS.SETTINGS) === null) {
          localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        }
        if (localStorage.getItem(DB_KEYS.USERS) === null) {
          localStorage.setItem(DB_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
        }
        if (localStorage.getItem(DB_KEYS.CURRENT_USER) === null) {
          localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(DEFAULT_USERS[0]));
        }
        if (localStorage.getItem(DB_KEYS.AUDIT_LOGS) === null) {
          localStorage.setItem(DB_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
        }
        if (localStorage.getItem(DB_KEYS.PENDING_REQUESTS) === null) {
          localStorage.setItem(DB_KEYS.PENDING_REQUESTS, JSON.stringify(INITIAL_PENDING_REQUESTS));
        }
        localStorage.setItem('publix_db_initialized_v3', 'true');
      }
    } catch (err) {
      console.warn('LocalStorage error during initialize:', err);
    }
  },

  /**
   * Sync all data from PostgreSQL / Express Backend
   */
  async syncWithServer(): Promise<boolean> {
    try {
      const data = await api.getBootstrap();
      if (data) {
        if (Array.isArray(data.clients)) localStorage.setItem(DB_KEYS.CLIENTS, JSON.stringify(data.clients));
        if (Array.isArray(data.vehicles)) localStorage.setItem(DB_KEYS.VEHICLES, JSON.stringify(data.vehicles));
        if (Array.isArray(data.quotations)) localStorage.setItem(DB_KEYS.QUOTATIONS, JSON.stringify(data.quotations));
        if (Array.isArray(data.contracts)) localStorage.setItem(DB_KEYS.CONTRACTS, JSON.stringify(data.contracts));
        if (Array.isArray(data.followUps)) localStorage.setItem(DB_KEYS.FOLLOW_UPS, JSON.stringify(data.followUps));
        if (Array.isArray(data.templates)) localStorage.setItem(DB_KEYS.TEMPLATES, JSON.stringify(data.templates));
        if (data.settings) localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(data.settings));
        if (Array.isArray(data.users)) localStorage.setItem(DB_KEYS.USERS, JSON.stringify(data.users));
        if (Array.isArray(data.auditLogs)) localStorage.setItem(DB_KEYS.AUDIT_LOGS, JSON.stringify(data.auditLogs));
        if (Array.isArray(data.pendingRequests)) localStorage.setItem(DB_KEYS.PENDING_REQUESTS, JSON.stringify(data.pendingRequests));
        
        try {
          window.dispatchEvent(new Event('publix_db_synced'));
        } catch {}
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Sync with server error (using cache):', err);
      return false;
    }
  },

  getClients(): Client[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(DB_KEYS.CLIENTS);
      if (raw === null) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveClients(clients: Client[]) {
    try {
      localStorage.setItem(DB_KEYS.CLIENTS, JSON.stringify(clients));
    } catch (e) {
      console.error(e);
    }
  },

  async addClient(client: Client) {
    const list = this.getClients();
    const idx = list.findIndex(c => c.id === client.id);
    if (idx >= 0) {
      list[idx] = client;
    } else {
      list.unshift(client);
    }
    this.saveClients(list);
    this.checkTriggerCriticalBackup(`Actualización de cliente: ${client.nombre}`);
    try {
      await api.createClient(client);
    } catch (e) {
      console.warn('API addClient error:', e);
    }
  },

  async updateClient(id: string, update: Partial<Client>) {
    const list = this.getClients();
    const idx = list.findIndex(c => c.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...update, fecha_actualizacion: new Date().toISOString() };
      this.saveClients(list);
      this.checkTriggerCriticalBackup(`Modificación de cliente: ${list[idx].nombre}`);
      try {
        await api.updateClient(id, update);
      } catch (e) {
        console.warn('API updateClient error:', e);
      }
    }
  },

  async deleteClient(id: string) {
    const list = this.getClients().filter(c => c.id !== id);
    this.saveClients(list);
    this.checkTriggerCriticalBackup(`Eliminación de cliente ID ${id}`);
    try {
      await api.deleteClient(id);
    } catch (e) {
      console.warn('API deleteClient error:', e);
    }
  },

  getVehicles(): Vehicle[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(DB_KEYS.VEHICLES);
      if (raw === null) return [];
      const parsed = JSON.parse(raw);
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

  async addVehicle(vehicle: Vehicle) {
    const list = this.getVehicles();
    const idx = list.findIndex(v => v.id === vehicle.id);
    if (idx >= 0) {
      list[idx] = vehicle;
    } else {
      list.unshift(vehicle);
    }
    this.saveVehicles(list);
    this.checkTriggerCriticalBackup(`Nuevo soporte publicitario: ${vehicle.modelo || vehicle.marca}`);
    try {
      await api.createVehicle(vehicle);
    } catch (e) {
      console.warn('API addVehicle error:', e);
    }
  },

  async updateVehicle(id: string, update: Partial<Vehicle>) {
    const list = this.getVehicles();
    const idx = list.findIndex(v => v.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...update, fecha_actualizacion: new Date().toISOString() };
      this.saveVehicles(list);
      this.checkTriggerCriticalBackup(`Modificación de valla/soporte: ${list[idx].modelo || list[idx].marca}`);
      try {
        await api.updateVehicle(id, update);
      } catch (e) {
        console.warn('API updateVehicle error:', e);
      }
    }
  },

  async deleteVehicle(id: string) {
    const list = this.getVehicles().filter(v => v.id !== id);
    this.saveVehicles(list);
    this.checkTriggerCriticalBackup(`Eliminación de soporte publicitario ID ${id}`);
    try {
      await api.deleteVehicle(id);
    } catch (e) {
      console.warn('API deleteVehicle error:', e);
    }
  },

  getQuotations(): Quotation[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(DB_KEYS.QUOTATIONS);
      if (raw === null) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveQuotations(quotations: Quotation[]) {
    try {
      localStorage.setItem(DB_KEYS.QUOTATIONS, JSON.stringify(quotations));
    } catch (e) {
      console.error(e);
    }
  },

  async addQuotation(q: Quotation) {
    const list = this.getQuotations();
    const idx = list.findIndex(x => x.id === q.id);
    if (idx >= 0) {
      list[idx] = q;
    } else {
      list.unshift(q);
    }
    this.saveQuotations(list);
    this.checkTriggerCriticalBackup(`Nueva cotización emitida: ${q.numero}`);
    try {
      await api.createQuotation(q);
    } catch (e) {
      console.warn('API addQuotation error:', e);
    }
  },

  async updateQuotation(id: string, update: Partial<Quotation>) {
    const list = this.getQuotations();
    const idx = list.findIndex(x => x.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...update };
      this.saveQuotations(list);
      this.checkTriggerCriticalBackup(`Modificación de cotización: ${list[idx].numero}`);
      try {
        await api.createQuotation(list[idx]);
      } catch (e) {
        console.warn('API updateQuotation error:', e);
      }
    }
  },

  async deleteQuotation(id: string) {
    const list = this.getQuotations().filter(q => q.id !== id);
    this.saveQuotations(list);
    this.checkTriggerCriticalBackup(`Eliminación de cotización ID ${id}`);
    try {
      await api.deleteQuotation(id);
    } catch (e) {
      console.warn('API deleteQuotation error:', e);
    }
  },

  getContracts(): Contract[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(DB_KEYS.CONTRACTS);
      if (raw === null) return [];
      const parsed = JSON.parse(raw);
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

  async addContract(c: Contract) {
    const list = this.getContracts();
    const idx = list.findIndex(x => x.id === c.id);
    if (idx >= 0) {
      list[idx] = c;
    } else {
      list.unshift(c);
    }
    this.saveContracts(list);
    this.checkTriggerCriticalBackup(`Nuevo contrato generado: ${c.numero}`);
    try {
      await api.createContract(c);
    } catch (e) {
      console.warn('API addContract error:', e);
    }
  },

  async updateContract(id: string, update: Partial<Contract>) {
    const list = this.getContracts();
    const idx = list.findIndex(x => x.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...update };
      this.saveContracts(list);
      this.checkTriggerCriticalBackup(`Modificación de contrato: ${list[idx].numero}`);
      try {
        await api.createContract(list[idx]);
      } catch (e) {
        console.warn('API updateContract error:', e);
      }
    }
  },

  async deleteContract(id: string) {
    const list = this.getContracts().filter(c => c.id !== id);
    this.saveContracts(list);
    try {
      await api.deleteContract(id);
    } catch (e) {
      console.warn('API deleteContract error:', e);
    }
  },

  getInvoices(): Invoice[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(DB_KEYS.INVOICES);
      if (raw === null) return INITIAL_INVOICES;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  },

  saveInvoices(invoices: Invoice[]) {
    try {
      localStorage.setItem(DB_KEYS.INVOICES, JSON.stringify(invoices));
    } catch (e) {
      console.error(e);
    }
  },

  async addInvoice(inv: Invoice) {
    const list = this.getInvoices();
    const idx = list.findIndex(x => x.id === inv.id);
    if (idx >= 0) {
      list[idx] = inv;
    } else {
      list.unshift(inv);
    }
    this.saveInvoices(list);
    this.checkTriggerCriticalBackup(`Nueva factura emitida: ${inv.numero_factura}`);
  },

  async updateInvoice(id: string, update: Partial<Invoice>) {
    const list = this.getInvoices();
    const idx = list.findIndex(x => x.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...update };
      this.saveInvoices(list);
      this.checkTriggerCriticalBackup(`Modificación de factura: ${list[idx].numero_factura}`);
    }
  },

  async deleteInvoice(id: string) {
    const list = this.getInvoices().filter(inv => inv.id !== id);
    this.saveInvoices(list);
  },

  getFollowUps(): FollowUp[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(DB_KEYS.FOLLOW_UPS);
      if (raw === null) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveFollowUps(followUps: FollowUp[]) {
    try {
      localStorage.setItem(DB_KEYS.FOLLOW_UPS, JSON.stringify(followUps));
    } catch (e) {
      console.error(e);
    }
  },

  async addFollowUp(f: FollowUp) {
    const list = this.getFollowUps();
    list.unshift(f);
    this.saveFollowUps(list);
    try {
      await api.createFollowUp(f);
    } catch (e) {
      console.warn('API addFollowUp error:', e);
    }
  },

  async updateFollowUp(id: string, update: Partial<FollowUp>) {
    const list = this.getFollowUps();
    const idx = list.findIndex(f => f.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...update };
      this.saveFollowUps(list);
      try {
        await api.updateFollowUp(id, update);
      } catch (e) {
        console.warn('API updateFollowUp error:', e);
      }
    }
  },

  async deleteFollowUp(id: string) {
    const list = this.getFollowUps().filter(f => f.id !== id);
    this.saveFollowUps(list);
    try {
      await api.deleteFollowUp(id);
    } catch (e) {
      console.warn('API deleteFollowUp error:', e);
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
      api.saveTemplatesBatch(templates).catch(e => console.warn('API saveTemplates error:', e));
    } catch (e) {
      console.error(e);
    }
  },

  getSettings(): Settings {
    this.initialize();
    try {
      const settings: Settings = JSON.parse(localStorage.getItem(DB_KEYS.SETTINGS) || '{}');
      return settings && typeof settings === 'object' && settings.nombre_empresa ? settings : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: Settings) {
    try {
      localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(settings));
      api.saveSettings(settings).catch(e => console.warn('API saveSettings error:', e));
    } catch (e) {
      console.error(e);
    }
  },

  getUsers(): UserSession[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(DB_KEYS.USERS);
      if (raw === null) return DEFAULT_USERS;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : DEFAULT_USERS;
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

  async addUser(user: UserSession) {
    const list = this.getUsers();
    const idx = list.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      list[idx] = user;
    } else {
      list.push(user);
    }
    this.saveUsers(list);
    try {
      await api.saveUser(user);
    } catch (e) {
      console.warn('API saveUser error:', e);
    }
  },

  async deleteUser(userId: string) {
    const list = this.getUsers().filter(u => u.id !== userId);
    this.saveUsers(list);
    try {
      await api.deleteUser(userId);
    } catch (e) {
      console.warn('API deleteUser error:', e);
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

  resetUserPassword(userId: string): { success: boolean; newPassword?: string; error?: string } {
    try {
      const users = this.getUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        return { success: false, error: 'Usuario no encontrado.' };
      }

      const user = users[userIndex];
      const defaultPass = user.celular ? user.celular.replace(/\D/g, '') || user.celular : '70000000';
      users[userIndex] = { ...user, password: defaultPass };
      this.saveUsers(users);

      const current = this.getCurrentUser();
      if (current.id === userId) {
        this.setCurrentUser(users[userIndex]);
      }

      api.resetUserPassword(userId).catch(e => console.warn('API resetUserPassword error:', e));

      this.addAuditLog(
        current.nombre || 'Administrador',
        'Restablecimiento de Contraseña',
        `Se restableció la contraseña por defecto del usuario @${user.usuario} a su número de celular (${defaultPass}).`
      );

      return { success: true, newPassword: defaultPass };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error al restablecer contraseña.' };
    }
  },

  changeUserPassword(userId: string, newPassword: string): { success: boolean; error?: string } {
    try {
      const users = this.getUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        return { success: false, error: 'Usuario no encontrado.' };
      }

      users[userIndex] = { ...users[userIndex], password: newPassword };
      this.saveUsers(users);

      const current = this.getCurrentUser();
      if (current.id === userId) {
        this.setCurrentUser(users[userIndex]);
      }

      api.changeUserPassword(userId, newPassword).catch(e => console.warn('API changeUserPassword error:', e));

      this.addAuditLog(
        users[userIndex].nombre,
        'Cambio de Contraseña Personal',
        `El usuario @${users[userIndex].usuario} actualizó su contraseña personal.`
      );

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error al cambiar contraseña.' };
    }
  },

  exportBackup(): string {
    return this.exportDatabaseJSON();
  },

  importBackup(jsonStr: string): boolean {
    try {
      this.importDatabaseJSON(jsonStr);
      return true;
    } catch {
      return false;
    }
  },

  getLastBackup(): BackupRecord | null {
    const list = this.getAutoBackups();
    return list.length > 0 ? list[0] : null;
  },

  restoreLatestBackup(): boolean {
    const latest = this.getLastBackup();
    if (!latest || !latest.data) return false;
    return this.importBackup(latest.data);
  },

  resetAll() {
    try {
      this.saveClients(INITIAL_CLIENTS);
      this.saveVehicles(INITIAL_VEHICLES);
      this.saveQuotations(INITIAL_QUOTATIONS);
      this.saveContracts(INITIAL_CONTRACTS);
      this.saveFollowUps(INITIAL_FOLLOW_UPS);
      this.saveTemplates(DEFAULT_TEMPLATES);
      this.saveSettings(DEFAULT_SETTINGS);
      this.saveUsers(DEFAULT_USERS);
      this.savePendingRequests(INITIAL_PENDING_REQUESTS);
      this.clearAuditLogs();
      this.addAuditLog('Sistema', 'Reinicio de Base de Datos', 'Se restablecieron todos los datos a los valores iniciales.');
      try {
        window.dispatchEvent(new Event('publix_db_synced'));
      } catch {}
    } catch (e) {
      console.error('Error resetting all:', e);
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

  addAuditLog(usuario: string, accion: string, detalle: string) {
    const log: AuditLog = {
      id: 'L' + String(Date.now()).slice(-6),
      usuario,
      accion,
      detalle,
      fecha: new Date().toISOString()
    };
    const logs = this.getAuditLogs();
    logs.unshift(log);
    try {
      localStorage.setItem(DB_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 300)));
      api.createAuditLog(log).catch(e => console.warn('API createAuditLog error:', e));
    } catch (e) {
      console.error(e);
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
      console.warn('LocalStorage error on savePendingRequests.', e);
    }
  },

  async addPendingRequest(req: PendingQuotationRequest) {
    const current = this.getPendingRequests();
    current.unshift(req);
    this.savePendingRequests(current);
    try {
      await api.createPendingRequest(req);
    } catch (e) {
      console.warn('API addPendingRequest error:', e);
    }
    try {
      window.dispatchEvent(new Event('publix_new_request'));
    } catch {}
  },

  async deletePendingRequest(id: string) {
    try {
      const current = this.getPendingRequests();
      const updated = current.filter(r => r.id !== id);
      this.savePendingRequests(updated);
      await api.deletePendingRequest(id).catch(e => console.warn('API deletePendingRequest error:', e));
      try {
        window.dispatchEvent(new Event('publix_new_request'));
      } catch {}
    } catch (e) {
      console.error(e);
    }
  },

  async clearPendingRequests() {
    try {
      localStorage.setItem(DB_KEYS.PENDING_REQUESTS, JSON.stringify([]));
      await api.clearPendingRequests().catch(e => console.warn('API clearPendingRequests error:', e));
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

  getAutoBackups(): BackupRecord[] {
    this.initialize();
    try {
      const raw = localStorage.getItem(DB_KEYS.AUTO_BACKUPS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveAutoBackups(backups: BackupRecord[]) {
    try {
      localStorage.setItem(DB_KEYS.AUTO_BACKUPS, JSON.stringify(backups));
    } catch (e) {
      console.error(e);
    }
  },

  getLastBackupTimestamp(): string {
    return localStorage.getItem(DB_KEYS.LAST_BACKUP_TIMESTAMP) || new Date().toISOString();
  },

  setLastBackupTimestamp(ts: string) {
    localStorage.setItem(DB_KEYS.LAST_BACKUP_TIMESTAMP, ts);
  },

  checkTriggerCriticalBackup(reason: string) {
    try {
      const settings = this.getSettings();
      if (settings.backup_on_critical_change ?? true) {
        const lastIso = this.getLastBackupTimestamp();
        const diffMs = Date.now() - new Date(lastIso).getTime();
        // Prevent duplicate backups if another change occurred within the last 60 seconds
        if (diffMs > 60 * 1000) {
          this.createAutoBackup(`Respaldo automático por cambio crítico: ${reason}`);
        }
      }
    } catch (e) {
      console.warn('Critical backup trigger error:', e);
    }
  },

  createAutoBackup(reason: string = 'Respaldo automático del sistema'): BackupRecord | null {
    try {
      const settings = this.getSettings();
      const maxRetention = settings.backup_retention_count || 10;
      const dataToBackup = {
        timestamp: new Date().toISOString(),
        reason,
        clients: this.getClients(),
        vehicles: this.getVehicles(),
        quotations: this.getQuotations(),
        contracts: this.getContracts(),
        followUps: this.getFollowUps(),
        templates: this.getTemplates(),
        settings: this.getSettings(),
        users: this.getUsers(),
        pendingRequests: this.getPendingRequests()
      };

      const dataStr = JSON.stringify(dataToBackup);
      const sizeBytes = new Blob([dataStr]).size;
      const date = new Date();
      const formattedDate = date.toISOString().replace(/[:.]/g, '-');
      const filename = `PUBLIX_BACKUP_${formattedDate}.json`;

      const newBackup: BackupRecord = {
        id: 'BKP-' + Date.now(),
        archivo: filename,
        tamano: sizeBytes,
        fecha: date.toISOString(),
        observaciones: reason,
        data: dataStr
      };

      let existing = this.getAutoBackups();
      existing.unshift(newBackup);
      if (existing.length > maxRetention) {
        existing = existing.slice(0, maxRetention);
      }

      this.saveAutoBackups(existing);
      this.setLastBackupTimestamp(date.toISOString());
      return newBackup;
    } catch (e) {
      console.warn('Auto backup creation failed:', e);
      return null;
    }
  },

  exportDatabaseJSON(): string {
    const data = {
      version: '2.0.0-postgres',
      timestamp: new Date().toISOString(),
      nombre_empresa: this.getSettings().nombre_empresa,
      clients: this.getClients(),
      vehicles: this.getVehicles(),
      quotations: this.getQuotations(),
      contracts: this.getContracts(),
      followUps: this.getFollowUps(),
      templates: this.getTemplates(),
      settings: this.getSettings(),
      users: this.getUsers(),
      auditLogs: this.getAuditLogs(),
      pendingRequests: this.getPendingRequests()
    };
    return JSON.stringify(data, null, 2);
  },

  async importDatabaseJSON(jsonStr: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || typeof data !== 'object') {
        throw new Error('Estructura de respaldo inválida.');
      }
      if (Array.isArray(data.clients)) this.saveClients(data.clients);
      if (Array.isArray(data.vehicles)) this.saveVehicles(data.vehicles);
      if (Array.isArray(data.quotations)) this.saveQuotations(data.quotations);
      if (Array.isArray(data.contracts)) this.saveContracts(data.contracts);
      if (Array.isArray(data.followUps)) this.saveFollowUps(data.followUps);
      if (Array.isArray(data.templates)) this.saveTemplates(data.templates);
      if (data.settings && typeof data.settings === 'object') this.saveSettings(data.settings);
      if (Array.isArray(data.users)) this.saveUsers(data.users);
      if (Array.isArray(data.auditLogs)) localStorage.setItem(DB_KEYS.AUDIT_LOGS, JSON.stringify(data.auditLogs));
      if (Array.isArray(data.pendingRequests)) this.savePendingRequests(data.pendingRequests);

      // Send import payload to backend server
      await api.importBackup(data).catch(e => console.warn('API importBackup error:', e));

      this.addAuditLog(
        this.getCurrentUser().nombre || 'Administrador',
        'Importación de Base de Datos',
        'Se importó y restauró exitosamente una copia de seguridad en el sistema y base de datos.'
      );

      try {
        window.dispatchEvent(new Event('publix_db_synced'));
      } catch {}

      return true;
    } catch (err) {
      console.error('Error importing database JSON:', err);
      return false;
    }
  }
};

export const mockDatabase = mockDb;
export default mockDb;
