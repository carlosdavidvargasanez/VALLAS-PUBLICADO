import { Settings } from '../types';

export const DEFAULT_FIELD_LABELS: Record<string, string> = {
  // Vehicle fields
  vehicle_marca: 'Marca',
  vehicle_modelo: 'Modelo',
  vehicle_version: 'Versión',
  vehicle_anio: 'Año',
  vehicle_tipo: 'Tipo',
  vehicle_motor: 'Motor',
  vehicle_combustible: 'Combustible',
  vehicle_transmision: 'Transmisión',
  vehicle_traccion: 'Tracción',
  vehicle_color: 'Color',
  vehicle_precio: 'Precio (USD)',
  vehicle_descripcion: 'Descripción',
  vehicle_estado: 'Estado',
  
  // Client fields
  client_nombre: 'Nombre Completo',
  client_celular: 'Celular / WhatsApp',
  client_ciudad: 'Ciudad',
  client_departamento: 'Departamento',
  client_presupuesto: 'Presupuesto USD',
  client_estado: 'Estado CRM',
  client_observaciones: 'Observaciones / Requerimientos'
};

export function getFieldLabel(fieldKey: string, settings?: Settings): string {
  if (settings && settings.custom_fields && settings.custom_fields[fieldKey]) {
    return settings.custom_fields[fieldKey];
  }
  return DEFAULT_FIELD_LABELS[fieldKey] || fieldKey;
}
