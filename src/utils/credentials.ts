/**
 * Helper to generate client credentials automatically from client name, separate first name & surname, or phone.
 * Rule: 
 * Username (usuario_acceso): first name + '.' + first surname in lowercase (e.g. "juan.perez")
 * Password (password_acceso): first name + '.' + first surname in lowercase (e.g. "juan.perez")
 */
export function generateClientCredentials(
  nombresOrFullName: string,
  apellidosOrPhone?: string,
  maybePhone?: string
): { usuario_acceso: string; password_acceso: string } {
  if (!nombresOrFullName && !apellidosOrPhone) {
    return { usuario_acceso: 'cliente.nuevo', password_acceso: 'cliente.nuevo' };
  }

  let first = 'cliente';
  let last = 'usuario';

  if (maybePhone !== undefined) {
    // 3 parameters: (nombres, apellidos, phone)
    const cleanNombres = (nombresOrFullName || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cleanApellidos = (apellidosOrPhone || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const nParts = cleanNombres.split(/\s+/).filter(Boolean);
    const aParts = cleanApellidos.split(/\s+/).filter(Boolean);

    first = nParts[0] || 'cliente';
    last = aParts[0] || 'usuario';
  } else {
    // 2 parameters: (fullName, phone) or (nombres, apellidos)
    const cleanFirst = (nombresOrFullName || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cleanSecond = (apellidosOrPhone || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const isSecondPhone = /^\+?[0-9\s-]+$/.test(cleanSecond) && cleanSecond.replace(/\D/g, '').length >= 7;

    if (isSecondPhone) {
      // (fullName, phone)
      const parts = cleanFirst.split(/\s+/).filter(Boolean);
      first = parts[0] || 'cliente';
      if (parts.length >= 3) {
        // e.g. "Carlos David Vargas" -> parts[0]="carlos", parts[2]="vargas"
        last = parts[2] || parts[1] || 'usuario';
      } else if (parts.length === 2) {
        last = parts[1];
      } else {
        last = parts[0] || 'usuario';
      }
    } else {
      // (nombres, apellidos)
      const nParts = cleanFirst.split(/\s+/).filter(Boolean);
      const aParts = cleanSecond.split(/\s+/).filter(Boolean);
      first = nParts[0] || 'cliente';
      last = aParts[0] || 'usuario';
    }
  }

  // Sanitize to lowercase alphanumeric without special characters
  first = first.replace(/[^a-z0-9]/g, '') || 'cliente';
  last = last.replace(/[^a-z0-9]/g, '') || 'usuario';

  const usuario_acceso = `${first}.${last}`;
  const password_acceso = `${first}.${last}`;

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
    `A continuación le facilitamos sus credenciales de acceso a nuestro *Portal Exclusivo de Vallas Publicitarias y Pantallas LED*:\n\n` +
    `👤 *Usuario de Acceso:* ${u}\n` +
    `🔑 *Contraseña:* ${p}\n\n` +
    `🌐 *Portal Web:* https://publi-x.bo\n\n` +
    `Desde nuestro portal podrá explorar el catálogo en tiempo real, revisar ubicaciones estratégicas, descargar cotizaciones en PDF y dar seguimiento a sus campañas.\n\n` +
    `Estamos a su entera disposición para cualquier consulta. ¡Éxito total en sus campañas!`;

  const waUrl = `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(message)}`;

  return { cleanPhone: digits, message, waUrl, usuario: u, password: p };
}

/**
 * Automatically generates username for Staff (Gerente, Vendedor)
 * Rule: primer nombre + '.' + primer apellido in lowercase without accents/spaces
 * Example: "Mariana Suárez López" -> "mariana.suarez"
 * Example: ("Mariana", "Suárez López") -> "mariana.suarez"
 */
export function generateStaffUsername(nombresOrFullName: string, apellidos?: string): string {
  if (!nombresOrFullName && !apellidos) return '';

  const cleanFirst = (nombresOrFullName || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleanSecond = (apellidos || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  let first = '';
  let last = '';

  if (cleanSecond) {
    const nParts = cleanFirst.split(/\s+/).filter(Boolean);
    const aParts = cleanSecond.split(/\s+/).filter(Boolean);
    first = nParts[0] || '';
    last = aParts[0] || '';
  } else {
    const parts = cleanFirst.split(/\s+/).filter(Boolean);
    first = parts[0] || '';
    if (parts.length >= 2) {
      last = parts[1] || '';
    }
  }

  // Remove any non-alphanumeric character
  first = first.replace(/[^a-z0-9]/g, '');
  last = last.replace(/[^a-z0-9]/g, '');

  if (!first) return '';
  if (!last) return first;
  return `${first}.${last}`;
}


