/**
 * Helper to generate client credentials automatically from client name and phone.
 * Username: First name + First surname (e.g. "Carlos Vargas" -> "carlos.vargas")
 * Password: Phone number without country prefix or non-digits (e.g. "+591 70000000" -> "70000000")
 */
export function generateClientCredentials(nombre: string, celular: string): { usuario_acceso: string; password_acceso: string } {
  if (!nombre) {
    return { usuario_acceso: 'cliente.invitado', password_acceso: '70000000' };
  }

  // Clean name and normalize diacritics
  const cleanName = nombre.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const parts = cleanName.split(/\s+/).filter(Boolean);

  let first = parts[0] || 'cliente';
  let last = parts.length > 1 ? parts[parts.length - 1] : 'bolivia';

  if (parts.length >= 3) {
    // e.g. "Carlos David Vargas" -> primer nombre ("carlos") + primer apellido ("vargas")
    first = parts[0];
    last = parts[2] || parts[1];
  }

  const usuario_acceso = `${first}.${last}`.replace(/[^a-z0-0.]/g, '');

  // Clean phone number (strip +591 or non-digits)
  const cleanPhone = (celular || '').replace(/\+591/g, '').replace(/\D/g, '');
  const password_acceso = cleanPhone.length > 0 ? cleanPhone : '70000000';

  return { usuario_acceso, password_acceso };
}
