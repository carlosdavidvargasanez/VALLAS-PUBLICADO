-- ============================================================================
-- PUBLI-X BOLIVIA - Esquema de Base de Datos PostgreSQL
-- Publicidad Exterior, Vallas, Pantallas LED, Pasarelas & CRM Comercial
-- ============================================================================

-- Extensión para generación de UUIDs (opcional)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Usuarios y Sesiones (Staff: Dueño, Gerente, Vendedor)
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

-- 2. Tabla de Clientes (CRM Comercial)
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

-- 3. Tabla de Catálogo de Vallas Publicitarias y Pantallas LED (Inventario OOH)
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

-- 4. Tabla de Cotizaciones Formales
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

-- 5. Tabla de Contratos de Arrendamiento y Publicidad Exterior
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

-- 6. Tabla de Seguimientos y Agenda Comercial
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

-- 7. Tabla de Plantillas de Mensajes WhatsApp / Notificaciones
CREATE TABLE IF NOT EXISTS message_templates (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  contenido TEXT NOT NULL,
  activa BOOLEAN DEFAULT TRUE,
  categoria VARCHAR(100) DEFAULT 'General'
);

-- 8. Tabla de Bitácora de Auditoría del Sistema
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(50) PRIMARY KEY,
  usuario VARCHAR(255) NOT NULL,
  accion VARCHAR(255) NOT NULL,
  detalle TEXT,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Tabla de Solicitudes de Cotización Web (Landing Page)
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

-- 10. Tabla de Configuración Global de la Empresa
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

-- Índices recomendados para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_clients_celular ON clients(celular);
CREATE INDEX IF NOT EXISTS idx_vehicles_ciudad ON vehicles(ciudad);
CREATE INDEX IF NOT EXISTS idx_quotations_cliente ON quotations(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contracts_cliente ON contracts(cliente_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_cliente ON follow_ups(cliente_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_fecha ON audit_logs(fecha DESC);
