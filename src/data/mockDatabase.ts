import { Client, Vehicle, Quotation, Contract, FollowUp, MessageTemplate, AuditLog, Settings, UserSession, PendingQuotationRequest, BackupRecord } from '../types';
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
  AUTO_BACKUPS: 'mla_autosender_auto_backups',
  LAST_BACKUP_TIMESTAMP: 'mla_autosender_last_backup_ts',
};

// Clean 2 Sample Clients clearly identified as [EJEMPLO] / (PRUEBA)
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
      // 1. Clients: If null or legacy mass test data (> 4), initialize with clean sample
      const storedClients = localStorage.getItem(DB_KEYS.CLIENTS);
      if (!storedClients) {
        localStorage.setItem(DB_KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS));
      } else {
        try {
          const parsed = JSON.parse(storedClients);
          if (!Array.isArray(parsed) || parsed.length > 4) {
            localStorage.setItem(DB_KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS));
          }
        } catch {
          localStorage.setItem(DB_KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS));
        }
      }

      // 2. Vehicles / Vallas: If null or legacy mass test data (> 5), initialize with 3 clean samples
      const storedVehicles = localStorage.getItem(DB_KEYS.VEHICLES);
      if (!storedVehicles) {
        localStorage.setItem(DB_KEYS.VEHICLES, JSON.stringify(INITIAL_VEHICLES));
      } else {
        try {
          const parsed = JSON.parse(storedVehicles);
          if (!Array.isArray(parsed) || parsed.length > 5 || parsed.length === 0) {
            localStorage.setItem(DB_KEYS.VEHICLES, JSON.stringify(INITIAL_VEHICLES));
          }
        } catch {
          localStorage.setItem(DB_KEYS.VEHICLES, JSON.stringify(INITIAL_VEHICLES));
        }
      }

      // 3. Quotations
      const storedQuotations = localStorage.getItem(DB_KEYS.QUOTATIONS);
      if (!storedQuotations) {
        localStorage.setItem(DB_KEYS.QUOTATIONS, JSON.stringify(INITIAL_QUOTATIONS));
      } else {
        try {
          const parsed = JSON.parse(storedQuotations);
          if (!Array.isArray(parsed) || parsed.length > 4) {
            localStorage.setItem(DB_KEYS.QUOTATIONS, JSON.stringify(INITIAL_QUOTATIONS));
          }
        } catch {
          localStorage.setItem(DB_KEYS.QUOTATIONS, JSON.stringify(INITIAL_QUOTATIONS));
        }
      }

      // 4. Contracts
      const storedContracts = localStorage.getItem(DB_KEYS.CONTRACTS);
      if (!storedContracts) {
        localStorage.setItem(DB_KEYS.CONTRACTS, JSON.stringify(INITIAL_CONTRACTS));
      } else {
        try {
          const parsed = JSON.parse(storedContracts);
          if (!Array.isArray(parsed) || parsed.length > 3) {
            localStorage.setItem(DB_KEYS.CONTRACTS, JSON.stringify(INITIAL_CONTRACTS));
          }
        } catch {
          localStorage.setItem(DB_KEYS.CONTRACTS, JSON.stringify(INITIAL_CONTRACTS));
        }
      }

      // 5. Follow-ups
      const storedFollowUps = localStorage.getItem(DB_KEYS.FOLLOW_UPS);
      if (!storedFollowUps) {
        localStorage.setItem(DB_KEYS.FOLLOW_UPS, JSON.stringify(INITIAL_FOLLOW_UPS));
      } else {
        try {
          const parsed = JSON.parse(storedFollowUps);
          if (!Array.isArray(parsed) || parsed.length > 4) {
            localStorage.setItem(DB_KEYS.FOLLOW_UPS, JSON.stringify(INITIAL_FOLLOW_UPS));
          }
        } catch {
          localStorage.setItem(DB_KEYS.FOLLOW_UPS, JSON.stringify(INITIAL_FOLLOW_UPS));
        }
      }

      // 6. Templates
      if (!localStorage.getItem(DB_KEYS.TEMPLATES)) {
        localStorage.setItem(DB_KEYS.TEMPLATES, JSON.stringify(DEFAULT_TEMPLATES));
      }

      // 7. Settings
      if (!localStorage.getItem(DB_KEYS.SETTINGS)) {
        localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      }

      // 8. Users
      const storedUsers = localStorage.getItem(DB_KEYS.USERS);
      if (!storedUsers) {
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      } else {
        try {
          const parsed: UserSession[] = JSON.parse(storedUsers);
          if (!Array.isArray(parsed) || parsed.length === 0) {
            localStorage.setItem(DB_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
          } else {
            // Ensure all users have password and clean properties
            const updated = parsed.map(u => {
              const def = DEFAULT_USERS.find(du => du.usuario === u.usuario || du.id === u.id);
              return {
                ...u,
                password: u.password || (def ? def.password : (u.celular ? u.celular.replace(/\D/g, '') : '70000000')),
                celular: u.celular || (def ? def.celular : '+59170000000')
              };
            });
            localStorage.setItem(DB_KEYS.USERS, JSON.stringify(updated));
          }
        } catch {
          localStorage.setItem(DB_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
        }
      }

      // 9. Current User
      if (localStorage.getItem(DB_KEYS.CURRENT_USER) === null) {
        localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(DEFAULT_USERS[0]));
      }

      // 10. Audit Logs
      if (localStorage.getItem(DB_KEYS.AUDIT_LOGS) === null) {
        localStorage.setItem(DB_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
      }

      // 11. Pending Requests
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
      return Array.isArray(parsed) ? parsed : INITIAL_VEHICLES;
    } catch {
      return INITIAL_VEHICLES;
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
      return Array.isArray(parsed) ? parsed : INITIAL_CONTRACTS;
    } catch {
      return INITIAL_CONTRACTS;
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

  /**
   * Reset a user's password to their mobile phone number (Admin / Dueño privilege)
   */
  resetUserPassword(userId: string): { success: boolean; newPassword?: string; error?: string } {
    try {
      const users = this.getUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        return { success: false, error: 'Usuario no encontrado.' };
      }

      const user = users[userIndex];
      // Default password is their mobile phone number (digits) or standard fallback
      const defaultPass = user.celular ? user.celular.replace(/\D/g, '') || user.celular : '70000000';
      users[userIndex] = {
        ...user,
        password: defaultPass
      };

      this.saveUsers(users);

      // If current user is modified, update current user too
      const current = this.getCurrentUser();
      if (current.id === userId) {
        this.setCurrentUser(users[userIndex]);
      }

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

  /**
   * Change own password for current user
   */
  changeUserPassword(userId: string, newPassword: string): { success: boolean; error?: string } {
    try {
      const users = this.getUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        return { success: false, error: 'Usuario no encontrado.' };
      }

      users[userIndex] = {
        ...users[userIndex],
        password: newPassword
      };

      this.saveUsers(users);

      const current = this.getCurrentUser();
      if (current.id === userId) {
        this.setCurrentUser(users[userIndex]);
      }

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
      console.warn('LocalStorage quota exceeded on savePendingRequests.', e);
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
      safeLogs.unshift(newLog);
      localStorage.setItem(DB_KEYS.AUDIT_LOGS, JSON.stringify(safeLogs));
    } catch (e) {
      console.error(e);
    }
  },

  // Export full database as string
  exportBackup(): string {
    const data = {
      version: '2.0-ooh-publix',
      timestamp: new Date().toISOString(),
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

  // Auto-backup snapshot generation and local archive
  createAutoBackup(reason: string = 'Respaldo automático programado'): BackupRecord {
    try {
      const dataStr = this.exportBackup();
      const now = new Date();
      const backupId = 'BKP-' + now.getTime();
      const dateFormatted = now.toISOString().replace(/[:.]/g, '-');
      const filename = `PUBLIX_BACKUP_AUTO_${dateFormatted}.json`;
      const sizeBytes = new Blob([dataStr]).size;

      const newBackup: BackupRecord = {
        id: backupId,
        archivo: filename,
        tamano: sizeBytes,
        fecha: now.toISOString(),
        observaciones: reason,
        data: dataStr
      };

      const existingBackups = this.getAutoBackups();
      const updatedBackups = [newBackup, ...existingBackups].slice(0, 15);
      localStorage.setItem(DB_KEYS.AUTO_BACKUPS, JSON.stringify(updatedBackups));
      localStorage.setItem(DB_KEYS.LAST_BACKUP_TIMESTAMP, now.toISOString());

      const currentSettings = this.getSettings();
      if (currentSettings.backup_last_timestamp !== now.toISOString()) {
        currentSettings.backup_last_timestamp = now.toISOString();
        localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(currentSettings));
      }

      this.addAuditLog('Sistema Auto-Backup', 'Respaldo Automático Generado', `Se generó copia de seguridad automática (${(sizeBytes / 1024).toFixed(1)} KB) - Motivo: ${reason}`);

      return newBackup;
    } catch (e) {
      console.error('Error creating auto backup:', e);
      const fallback: BackupRecord = {
        id: 'BKP-' + Date.now(),
        archivo: 'PUBLIX_BACKUP_FALLBACK.json',
        tamano: 0,
        fecha: new Date().toISOString(),
        observaciones: 'Respaldo en memoria',
        data: this.exportBackup()
      };
      return fallback;
    }
  },

  getAutoBackups(): BackupRecord[] {
    try {
      const raw = localStorage.getItem(DB_KEYS.AUTO_BACKUPS);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  getLastBackup(): BackupRecord | null {
    const list = this.getAutoBackups();
    if (list.length > 0) return list[0];
    return null;
  },

  getLastBackupTimestamp(): string {
    const fromStorage = localStorage.getItem(DB_KEYS.LAST_BACKUP_TIMESTAMP);
    if (fromStorage) return fromStorage;
    const settings = this.getSettings();
    return settings.backup_last_timestamp || new Date().toISOString();
  },

  restoreLatestBackup(): boolean {
    const latest = this.getLastBackup();
    if (!latest || !latest.data) return false;
    return this.importBackup(latest.data);
  },

  importBackup(backupText: string): boolean {
    try {
      const parsed = JSON.parse(backupText);
      if (parsed) {
        if (parsed.clients) localStorage.setItem(DB_KEYS.CLIENTS, JSON.stringify(parsed.clients));
        if (parsed.vehicles) localStorage.setItem(DB_KEYS.VEHICLES, JSON.stringify(parsed.vehicles));
        if (parsed.quotations) localStorage.setItem(DB_KEYS.QUOTATIONS, JSON.stringify(parsed.quotations));
        if (parsed.contracts) localStorage.setItem(DB_KEYS.CONTRACTS, JSON.stringify(parsed.contracts));
        if (parsed.followUps) localStorage.setItem(DB_KEYS.FOLLOW_UPS, JSON.stringify(parsed.followUps));
        if (parsed.templates) localStorage.setItem(DB_KEYS.TEMPLATES, JSON.stringify(parsed.templates));
        if (parsed.settings) localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(parsed.settings));
        if (parsed.users) localStorage.setItem(DB_KEYS.USERS, JSON.stringify(parsed.users));
        localStorage.setItem(DB_KEYS.AUDIT_LOGS, JSON.stringify(parsed.auditLogs || []));
        this.addAuditLog('Sistema', 'Restauración de Copia de Seguridad', 'Se restauró con éxito el estado completo de la base de datos.');
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import backup:', e);
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

export const mockDatabase = mockDb;
