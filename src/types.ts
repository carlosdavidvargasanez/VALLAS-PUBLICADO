export type ClientState = 'Nuevo' | 'Contactado' | 'Interesado' | 'Cotizado' | 'Negociando' | 'Esperando respuesta' | 'Vendido' | 'Perdido';

export interface Client {
  id: string;
  nombre: string;
  nombres?: string;
  apellidos?: string;
  celular: string; // unique
  ciudad: string;
  departamento: string;
  pais: string; // default "Bolivia"
  presupuesto_usd: number;
  observaciones: string;
  estado: ClientState;
  fecha_registro: string;
  fecha_actualizacion: string;
  correo?: string;
  campania?: string;
  empresa?: string;
  razon_social?: string;
  nit_ci?: string;
  usuario_acceso?: string;
  password_acceso?: string;
  usuario_habilitado?: boolean; // true = enabled, false = disabled/restricted
  acceso_bloqueado?: boolean;
}

export type VallaCategory = 
  | 'Unipolar'
  | 'Estructural'
  | 'Pantalla LED'
  | 'Vía Peatonal'
  | 'Mural'
  | 'Parada de bus'
  | 'Teleféricos'
  | 'Puente Peatonal'
  | 'Pasarela / Puente Peatonal'
  | 'Letrero luminoso';

export type ProductType = 
  | VallaCategory
  | 'Valla Publicitaria'
  | 'Pantalla LED'
  | 'Letrero & Banner'
  | 'Letras Corpóreas'
  | 'Impresión de Lonas'
  | 'Estructura Metálica'
  | 'Trabajo Especial';

export type ProductState = 'Disponible' | 'Reservado' | 'En instalación' | 'Próximamente' | 'En producción' | 'En mantenimiento' | 'Ocupado / Alquilado' | 'En importación' | 'Vendido';

export type VehicleState = ProductState;

export interface Vehicle {
  id: string;
  codigo?: string;
  nombre?: string;
  tipo_valla?: VallaCategory | string;
  zona?: string;
  cara?: 'Cara A' | 'Cara B' | 'Ambas Caras' | string;
  ciudad?: string;
  avenida_calle?: string;
  provincia?: string;
  detalle?: string;
  medidas?: string; // e.g. "10 x 4"
  transitabilidad_trafico?: string;
  costo_lona_m2_bs?: number; // Cost in BOB per m2 for printed lona
  drive_photos?: string[];
  alto_impacto?: boolean; // Highlighted High-Impact Location (Ubicación de Alto Impacto)

  ubicacion?: string;
  dimensiones?: string;
  especificacion?: string;
  modalidad?: string;
  iluminacion?: string;
  
  // Compatibility fields with existing catalog / components
  marca: string; // Categoría principal (e.g. "Valla Publicitaria", "Pantalla LED")
  modelo: string; // Ubicación o Nombre (e.g. "Av. Banzer 4to Anillo")
  version: string; // Dimensiones / Formato (e.g. "12m x 4m - Lona Frontlight 13oz")
  anio: number; // Año de fabricación / instalación (e.g. 2026)
  tipo: ProductType | string;
  motor?: string; // Especificación Técnica / Tráfico (e.g. "Pitch P3.91mm HD Outdoor")
  combustible?: string; // Material / Tecnología
  transmision?: string; // Modalidad
  traccion?: string; // Iluminación / Acabado
  color?: string; // Color / Acabado Exterior
  
  precio_usd: number;
  precio_original_usd?: number; // Price set by Dueño
  descuento_jefe_usd?: number; // Discount applied by Jefe
  jefe_descuento_autor?: string; // Name of the Jefe who made the reduction
  descripcion: string;
  estado: ProductState;
  imagen_principal: string;
  imagenes: string[];
  foto_principal?: string;
  galeria?: string[];
  fecha_registro: string;
  fecha_actualizacion: string;
}

export interface PendingQuotationRequest {
  id: string;
  codigo: string; // e.g. SOL-2026-001
  cliente_id?: string;
  cliente_nombre: string;
  cliente_empresa?: string;
  cliente_celular: string;
  cliente_correo?: string;
  cliente_ciudad?: string;
  vallas_ids: string[];
  vallas_nombres: string[];
  vallas_detalles?: { id: string; nombre: string; precio_usd: number; medidas: string; cara: string; imagen: string }[];
  fecha: string;
  estado: 'Pendiente' | 'En atención' | 'Cotizado' | 'Cancelado';
  vendedor_asignado?: string; // Name of the seller who claimed this request
  observaciones?: string;
  sugerencia_cotizacion?: string;
  imagenes_referencia?: string[];
  dispositivo_detectado?: string;
  presupuesto_estimado_usd?: number;
}

export type QuotationState = 'Borrador' | 'Enviada' | 'Vista por cliente' | 'Negociación' | 'Aceptada' | 'Rechazada' | 'Vencida';

export interface QuotationVallaItem {
  vehiculo_id: string;
  valla_nombre: string;
  valla_tipo: string;
  valla_medidas: string;
  valla_ciudad: string;
  valla_avenida: string;
  valla_cara: string;
  precio_alquiler_usd: number;
  costo_lona_usd: number;
  area_m2: number;
  costo_lona_m2_bs?: number;
  imagen?: string;
}

export interface Quotation {
  id: string;
  numero: string; // format: PUB-YYYYMMDD-XXXXXX
  cliente_id: string;
  vehiculo_id: string;
  precio_vehiculo: number; // Precio Base (Alquiler / Fabricación)
  gastos_importacion: number; // Costo Impresión (Lona / Vinilo)
  gastos_aduana: number; // Costo Montaje & Estructura Metálica
  gastos_logistica: number; // Costo Flete, Permisos & Grúa
  gastos_seguro: number; // Mantenimiento & Energía Eléctrica
  total: number;
  estado: QuotationState;
  observaciones: string;
  fecha: string;
  
  // Enhanced Multi-Valla & Contract features
  vallas_seleccionadas?: QuotationVallaItem[];
  emisor_nombre?: string;
  emisor_rol?: string;
  incluye_contrato?: boolean;
  terminos_contrato?: string;
  descuento_usd?: number;
}

export type ContractStatus = 'Borrador' | 'Pendiente Firma' | 'Vigente' | 'Finalizado' | 'Cancelado';
export type ContractTemplateDesign = 'OFICIAL_VALLAS' | 'MODERNO_EJECUTIVO' | 'COMERCIAL_AGIL';

export interface ContractVallaItem {
  id: string;
  ciudad: string;
  formato: string;
  direccion: string;
  costo_mensual_bs: number;
  descuento_bs: number;
  costo_neto_bs: number;
}

export interface ContractLonaItem {
  id: string;
  direccion: string;
  medidas: string;
  costo_unitario_bs: number;
  descuento_lona_bs: number;
  total_costo_bs: number;
}

export interface ContractItem {
  id: string;
  producto: string; // ej: "Valla Publicitaria Unipolar Banzer"
  caracteristicas: string; // ej: "12x4m - Cara A - Iluminación LED Nocturna 12h"
  medidas?: string;
  periodo: string; // ej: "6 Meses (01/09/2026 al 01/03/2027)"
  precio_unitario: number;
  descuento_item: number;
  total_item: number;
}

export interface ContractLonaDetail {
  incluye_lona: boolean;
  especificacion: string;
  medidas_m2: number;
  costo_m2_usd: number;
  costo_total_lona: number;
  descuento_lona_usd: number;
  subtotal_lona_neto: number;
}

export interface Contract {
  id: string;
  numero: string; // format: CON-YYYYMMDD-XXXXXX
  cotizacion_id?: string;
  
  // Datos del Cliente / Titular (editables para el contrato)
  cliente_id: string;
  cliente_nombre: string;
  cliente_empresa?: string;
  cliente_nit_ci?: string;
  cliente_representante?: string;
  cliente_representante_ci?: string;
  cliente_escritura_poder?: string;
  cliente_poder_fecha?: string;
  cliente_notaria_numero?: string;
  cliente_notario_nombre?: string;
  cliente_celular: string;
  cliente_correo?: string;
  cliente_direccion?: string;
  cliente_ciudad: string;
  
  // Arrendador (Empresa)
  arrendador_empresa?: string;
  arrendador_nit?: string;
  arrendador_direccion?: string;
  arrendador_representante?: string;
  arrendador_ci?: string;

  // Estructura Principal
  valla_id?: string;
  valla_nombre: string;
  valla_medidas: string;
  valla_ubicacion: string;
  valla_tipo: string;
  valla_cara: string;
  
  // Listas de Vallas y Lonas para tablas del contrato oficial
  vallas_lista: ContractVallaItem[];
  lonas_lista: ContractLonaItem[];

  // Ítems en Tabla genérica (Filas y Columnas)
  items: ContractItem[];
  
  // Detalle de Lona e Instalación (Beneficios Extras)
  lona_detail: ContractLonaDetail;
  
  // Beneficios extras adicionados sin costo
  beneficios_extras: string[];
  
  // Totales y Descuentos
  subtotal_alquiler_usd: number;
  descuento_cliente_usd: number;
  descuento_cliente_porcentaje: number;
  total_neto_usd: number;
  total_neto_bob: number;
  tipo_cambio: number;
  
  // Fechas y Condiciones
  fecha_emision: string;
  fecha_inicio: string;
  fecha_fin: string;
  periodo_meses: number;
  plazo_meses?: number;
  forma_pago: string;
  clausulas_especiales?: string;
  clausulas_adicionales?: string;
  
  estado: ContractStatus;
  diseno_plantilla?: ContractTemplateDesign;
  vendedor_nombre: string;
  vendedor_celular?: string;
  vendedor_correo?: string;
  observaciones?: string;
}

export type FollowUpType = 'Llamada' | 'WhatsApp' | 'Correo' | 'Reunión' | 'Envío catálogo' | 'Envío cotización' | 'Nota interna';
export type FollowUpState = 'Pendiente' | 'Realizado' | 'Reprogramado' | 'Cancelado';
export type FollowUpPriority = 'Alta' | 'Media' | 'Baja';

export interface FollowUp {
  id: string;
  cliente_id: string;
  tipo: FollowUpType;
  nota: string;
  fecha: string;
  proximo_contacto: string;
  prioridad: FollowUpPriority;
  estado: FollowUpState;
}

export interface MessageTemplate {
  id: string;
  nombre: string;
  contenido: string;
  activa?: boolean;
  activo?: boolean;
  categoria?: 'General' | 'Agradecimiento' | 'Promocion' | 'Urgencia' | 'Cierre' | string;
}

export interface AuditLog {
  id: string;
  usuario: string;
  accion: string;
  detalle: string;
  fecha: string;
}

export interface Settings {
  nombre_empresa: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  pais: string;
  telefono: string;
  whatsapp: string;
  correo: string;
  web: string;
  logo: string;
  tipo_cambio: number; // e.g. 10.10
  terminos_cotizacion: string;
  custom_fields?: Record<string, string>;

  // Auto Backup Configuration
  backup_auto_enabled?: boolean;
  backup_interval_hours?: number; // 1, 6, 12, 24
  backup_on_critical_change?: boolean;
  backup_last_timestamp?: string;
  backup_on_save?: boolean;
  backup_retention_count?: number;
}

export type UserRole = 'Dueño' | 'Gerente' | 'Jefe' | 'Supervisor' | 'Administrador' | 'Vendedor' | 'Cliente';

export interface UserSession {
  id: string;
  nombre: string;
  nombres?: string;
  apellidos?: string;
  usuario: string;
  rol: UserRole;
  estado: 'Activo' | 'Inactivo' | 'Bloqueado';
  empresa?: string;
  celular?: string;
  email?: string;
  password?: string;
}

export interface BackupRecord {
  id: string;
  archivo: string;
  tamano: number;
  fecha: string;
  observaciones: string;
  data: string;
}
