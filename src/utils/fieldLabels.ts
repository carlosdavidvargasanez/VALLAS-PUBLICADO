import { Settings } from '../types';

export const DEFAULT_FIELD_LABELS: Record<string, string> = {
  // Vallas & Espacios Publicitarios OOH fields
  vehicle_marca: 'Empresa / Marca OOH',
  vehicle_modelo: 'Ubicación / Avenida / Calle',
  vehicle_version: 'Zona y Formato',
  vehicle_tipo: 'Tipo de Estructura / Valla',
  vehicle_zona: 'Zona / Distrito',
  vehicle_cara: 'Cara / Vista Exposición',
  vehicle_medidas: 'Medidas / Dimensiones (m)',
  vehicle_ciudad: 'Ciudad',
  vehicle_provincia: 'Provincia / Municipio',
  vehicle_transitabilidad: 'Transitabilidad / Flujo Vehicular',
  vehicle_costo_lona: 'Costo Impresión Lona (Bs/m²)',
  vehicle_precio: 'Precio Alquiler Mensual (USD)',
  vehicle_descripcion: 'Detalle Técnico / Especificaciones',
  vehicle_estado: 'Estado de Disponibilidad',
  
  // Client fields
  client_nombre: 'Nombre Completo de Contacto',
  client_empresa: 'Empresa Comercial',
  client_razon_social: 'Razón Social (Facturación)',
  client_nit_ci: 'NIT / CI',
  client_celular: 'Celular / WhatsApp',
  client_departamento: 'Departamento',
  client_presupuesto: 'Presupuesto USD (Opcional)',
  client_estado: 'Estado CRM',
  client_observaciones: 'Observaciones / Requerimientos'
};

export function getFieldLabel(fieldKey: string, settings?: Settings): string {
  if (settings && settings.custom_fields && settings.custom_fields[fieldKey]) {
    return settings.custom_fields[fieldKey];
  }
  return DEFAULT_FIELD_LABELS[fieldKey] || fieldKey;
}
