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

/**
 * Generates official PUBLI-X welcome message with login credentials for WhatsApp.
 */
export function generateClientWelcomeMessage(
  nombre: string,
  celular: string,
  usuario_acceso?: string,
  password_acceso?: string
): { cleanPhone: string; message: string; waUrl: string; usuario: string; password: string } {
  const creds = generateClientCredentials(nombre, celular);
  const u = usuario_acceso || creds.usuario_acceso;
  const p = password_acceso || creds.password_acceso;

  const rawPhone = celular || '';
  let digits = rawPhone.replace(/\D/g, '');
  if (!digits.startsWith('591') && digits.length === 8) {
    digits = '591' + digits;
  }

  const message = `*¡Bienvenido a PUBLI-X BOLIVIA!* 📢\n\n` +
    `Estimado/a *${nombre || 'Cliente'}*,\n` +
    `¡Muchas gracias por elegirnos! Elegir *PUBLI-X* es sin duda la mejor opción para potenciar la presencia, el impacto y la visibilidad de su marca.\n\n` +
    `A continuación le facilitamos sus credenciales para ingresar a nuestro *Portal Exclusivo de Vallas Publicitarias y Pantallas LED*:\n\n` +
    `👤 *Nombre de Usuario:* ${u}\n` +
    `🔑 *PIN / Clave de Acceso:* ${p}\n\n` +
    `🌐 *Acceso Web:* https://publi-x.bo\n\n` +
    `Desde nuestro portal podrá explorar el catálogo en tiempo real, revisar ubicaciones de alto impacto, descargar cotizaciones en PDF y dar seguimiento a sus proyectos.\n\n` +
    `Estamos a su entera disposición para cualquier consulta. ¡Éxito total en sus campañas!`;

  const waUrl = `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(message)}`;

  return { cleanPhone: digits, message, waUrl, usuario: u, password: p };
}

