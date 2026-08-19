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

export type ProductState = 'Disponible' | 'Reservado' | 'Reservada' | 'En instalación' | 'Próximamente' | 'En producción' | 'En mantenimiento' | 'Ocupado / Alquilado' | 'Ocupada' | 'En importación' | 'Vendido';

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
  descuento_mensual_usd?: number;
  valla_iluminacion?: string;
  imagen?: string;
}

export interface Quotation {
  id: string;
  numero: string; // format: PUB-YYYYMMDD-XXXXXX
  tipo_cotizacion?: 'TIPO_A_VALLAS' | 'TIPO_B_TECNICA'; // Type A: OOH Billboards/Screens | Type B: Technical structure/sign construction
  cliente_id: string;
  cliente_nombre?: string;
  cliente_empresa?: string;
  cliente_celular?: string;
  cliente_correo?: string;
  cliente_ciudad?: string;
  cliente_direccion?: string;
  cliente_nit_ci?: string;
  cliente_nit?: string;
  vehiculo_id: string;
  precio_vehiculo: number; // Base amount
  gastos_importacion: number;
  gastos_aduana: number;
  gastos_logistica: number;
  gastos_seguro: number;
  total: number;
  estado: QuotationState;
  observaciones: string;
  fecha: string;
  
  // Type A: Billboards & LED Screens (COTIZACION_VP_UPDS_JUNIO_2026 & VALLAS_DONDE_VALLAS_262_15297)
  referencia?: string;
  referencia_asunto?: string;
  destinatario_senores?: string;
  destinatario_atencion?: string;
  destinatario_cargo?: string;
  destinatario_cargo_dpto?: string;
  tiempo_meses?: number;
  tiempo_meses_texto?: string;
  vigencia_dias?: number;
  validez_oferta_dias?: number;
  foto_referencia_url?: string;
  foto_referencia_titulo?: string;
  items_desglose?: Array<{ id: string; name: string; val: number }>;
  vallas_seleccionadas?: QuotationVallaItem[];
  vallas_items_detalle?: Array<{
    valla_id?: string;
    cliente: string;
    depto: string;
    ubicacion: string;
    formato: string;
    medidas: string;
    precio_lista_bs: number;
    precio_desc_mes1_bs?: number;
    precio_desc_mes2_bs?: number;
    total_bs: number;
    imagen?: string;
  }>;
  lonas_items_detalle?: Array<{
    descripcion: string;
    medidas: string;
    costo_unitario_bs: number;
    cantidad: number;
    total_bs: number;
  }>;
  lonas_items?: any[];
  total_alquiler_usd?: number;
  total_lonas_usd?: number;
  total_general_usd?: number;

  // Type B: Technical Construction / Signage (UNIPOLAR_PARA_PANTALLAS)
  items_tecnicos?: Array<{
    id: string;
    titulo: string;
    descripcion: string;
    precio_unitario: number;
    cantidad: number;
    total: number;
    foto_referencia?: string;
    es_alternativa?: boolean;
    alternativa_de_item_id?: string;
    alternativa_label?: string;
    seleccionado?: boolean;
  }>;
  tiempo_produccion_dias_habiles?: number;
  etapas_pago_anticipo_pct?: number;
  etapas_pago_saldo_pct?: number;
  garantia_anos?: number;
  terminos_condiciones_tecnicos?: {
    validez_dias: number;
    plazo_construccion_dias_habiles: number;
    porcentaje_anticipo: number;
    porcentaje_saldo: number;
    texto_adicional?: string;
  };
  evidencia_aceptacion_url?: string; // Uploaded scan/photo of signed and sealed quotation
  evidencia_fecha?: string;
  evidencia_observaciones?: string;
  correo_constancia_enviado?: boolean;

  // Signer / Commercial Agent
  emisor_nombre?: string;
  emisor_cargo?: string;
  emisor_telefono?: string;
  emisor_rol?: string;
  incluye_contrato?: boolean;
  terminos_contrato?: string;
  descuento_usd?: number;
  descuento_total_bs?: number;
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
  medidas?: string;
  valla_id?: string;
}

export interface ContractLonaItem {
  id: string;
  valla_id?: string;
  valla_medidas?: string;
  direccion: string;
  medidas: string;
  costo_unitario_bs: number;
  descuento_lona_bs: number;
  total_costo_bs: number;
  cantidad?: number;
}

export interface ContractItem {
  id: string;
  producto: string;
  caracteristicas: string;
  medidas?: string;
  periodo: string;
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
  numero: string; // format: CON-YYYYMMDD-XXXXXX or custom correlative
  codigo_unico?: string;
  cotizacion_id?: string;
  
  // Datos del Cliente / Titular / Arrendatario
  cliente_id: string;
  cliente_nombre: string;
  cliente_empresa?: string;
  cliente_razon_social?: string;
  cliente_nit_ci?: string;
  cliente_representante?: string;
  cliente_representante_cargo?: string;
  cliente_representante_ci?: string;
  cliente_representante_ci_emision?: string;
  
  // Cláusula Condicional del Apoderado (Poder Notarial)
  firma_mediante_poder?: boolean;
  cliente_escritura_poder?: string; // e.g. "506/2021"
  cliente_poder_fecha?: string; // e.g. "05 de Mayo del 2021"
  cliente_notaria_numero?: string; // e.g. "103"
  cliente_poder_distrito_judicial?: string; // e.g. "Santa Cruz de La Sierra"
  cliente_notario_nombre?: string; // e.g. "Dra. Marbel Silvana España Pedraza"
  
  cliente_celular: string;
  cliente_correo?: string;
  cliente_direccion?: string;
  cliente_ciudad: string;
  
  // Arrendador (Empresa - Datos Fijos)
  arrendador_empresa?: string;
  arrendador_nit?: string;
  arrendador_direccion?: string;
  arrendador_representante?: string;
  arrendador_representante_cargo?: string;
  arrendador_ci?: string;
  arrendador_ci_emision?: string;

  // Estructura Principal & Compatibilidad
  valla_id?: string;
  vallas_ids?: string[];
  vehiculo_id?: string;
  valla_ciudad?: string;
  valla_nombre: string;
  valla_medidas: string;
  valla_ubicacion: string;
  valla_tipo: string;
  valla_cara: string;
  
  // Listas de Vallas y Lonas para tablas del contrato oficial
  vallas_lista: ContractVallaItem[];
  lonas_lista: ContractLonaItem[];

  // Ítems en Tabla genérica
  items: ContractItem[];
  
  // Detalle de Lona e Instalación
  lona_detail: ContractLonaDetail;
  
  // Beneficios extras
  beneficios_extras: string[];
  
  // Totales y Descuentos
  subtotal_alquiler_usd: number;
  descuento_cliente_usd: number;
  descuento_cliente_porcentaje: number;
  total_neto_usd: number;
  total_neto_bob: number;
  total_lonas_bob?: number;
  canon_mensual_bob?: number;
  tipo_cambio: number;
  
  // Fechas y Condiciones
  fecha_emision: string;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_firma?: string;
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

export interface InvoiceItem {
  id?: string;
  descripcion: string;
  medida_unidad?: string;
  cantidad: number;
  precio_unitario_bs: number;
  descuento_bs: number;
  subtotal_bs: number;
}

export interface Invoice {
  id: string;
  numero_factura: string; // Correlative or manual format
  tipo_origen: 'CONTRATO_ARRENDAMIENTO' | 'COTIZACION_TECNICA' | 'VENTA_DIRECTA';
  contrato_id?: string;
  cotizacion_id?: string;
  cliente_id: string;
  cliente_nombre: string;
  cliente_razon_social: string;
  razon_social?: string;
  cliente_nit_ci: string;
  nit_ci?: string;
  cliente_direccion?: string;
  cliente_ciudad?: string;
  cliente_celular?: string;
  cliente_correo?: string;
  fecha_emision: string;
  fecha_vencimiento?: string;
  periodo_facturado?: string;
  concepto?: string;
  items: InvoiceItem[];
  subtotal_bs: number;
  descuento_total_bs: number;
  total_bs: number;
  monto_total_bob?: number;
  total_literal_bs: string;
  monto_literal?: string;
  total_usd?: number;
  tipo_cambio: number;
  observaciones?: string;
  estado: 'Emitida' | 'Subida a SIN' | 'Anulada' | 'Pagada';
  estado_sin?: string;
  fecha_subida_sin?: string;
  codigo_autorizacion_sin?: string;
  codigo_autorizacion?: string;
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
  modulo?: string;
  detalle?: string;
  detalles?: string;
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
  tipo_cambio: number; // e.g. 6.96 / 10.10
  terminos_cotizacion: string;
  custom_fields?: Record<string, string>;

  // Fixed Legal Data for Contracts & Invoices (Point 1)
  nombre_comercial?: string; // Publi-X Cobertura Nacional Impacto Total
  nit?: string; // 4579387019
  domicilio_legal?: string; // Calle Los Tajibos 2185, Barrio Petrolero Norte, UV 0016 MZA 14...
  representante_legal?: string; // Carlos David Vargas Añez
  representante_cargo?: string; // Gerente General
  representante_ci?: string; // 4579387
  representante_ci_emision?: string; // Santa Cruz
  notaria_arbitraje?: string; // CAINCO Santa Cruz

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
