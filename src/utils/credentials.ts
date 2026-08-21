/**
 * Helper to generate client credentials automatically from client name, separate first name & surname, or phone.
 * Rule: 
 * Username (usuario_acceso): first name + '.' + first surname in lowercase (e.g. "juan.perez")
 * Password (password_acceso): client's phone number (celular e.g. "70012345")
 */
export function generateClientCredentials(
  nombresOrFullName: string,
  apellidosOrPhone?: string,
  maybePhone?: string
): { usuario_acceso: string; password_acceso: string } {
  if (!nombresOrFullName && !apellidosOrPhone) {
    return { usuario_acceso: 'cliente.nuevo', password_acceso: '70000000' };
  }

  let first = 'cliente';
  let last = 'usuario';
  let phoneStr = '';

  if (maybePhone !== undefined) {
    // 3 parameters: (nombres, apellidos, phone)
    const cleanNombres = (nombresOrFullName || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cleanApellidos = (apellidosOrPhone || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const nParts = cleanNombres.split(/\s+/).filter(Boolean);
    const aParts = cleanApellidos.split(/\s+/).filter(Boolean);

    first = nParts[0] || 'cliente';
    last = aParts[0] || 'usuario';
    phoneStr = maybePhone || '';
  } else {
    // 2 parameters: (fullName, phone) or (nombres, apellidos)
    const cleanFirst = (nombresOrFullName || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cleanSecond = (apellidosOrPhone || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const isSecondPhone = /^\+?[0-9\s-]+$/.test(cleanSecond) && cleanSecond.replace(/\D/g, '').length >= 7;

    if (isSecondPhone) {
      // (fullName, phone)
      phoneStr = cleanSecond;
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

  // Extract phone digits for password: if 8 digits (e.g. 70012345), or +59170012345 -> 70012345
  const rawDigits = phoneStr.replace(/\D/g, '');
  let password_acceso = usuario_acceso;
  if (rawDigits.length >= 8) {
    // If it starts with 591 and has 11 digits, extract the 8 digits of the cell phone
    if (rawDigits.startsWith('591') && rawDigits.length === 11) {
      password_acceso = rawDigits.slice(3);
    } else if (rawDigits.length === 8) {
      password_acceso = rawDigits;
    } else {
      password_acceso = rawDigits;
    }
  }

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

  const message = `*¡Bienvenido/a a PUBLI-X BOLIVIA!* 📢\n\n` +
    `Estimado/a *${nombre || 'Cliente'}*,\n` +
    `¡Muchas gracias por confiar en nosotros! En *PUBLI-X* impulsamos el posicionamiento y la visibilidad de su marca con la red líder de Vallas Publicitarias y Pantallas LED a nivel nacional.\n\n` +
    `Su cuenta ha sido creada exitosamente. Ya puede ingresar a nuestra plataforma exclusiva para explorar el catálogo en tiempo real, cotizar ubicaciones y dar seguimiento a sus campañas publicitarias:\n\n` +
    `👤 *Usuario:* ${u}\n` +
    `🔑 *Contraseña:* ${p} _(su número de teléfono)_\n\n` +
    `🌐 *Acceso a la plataforma:* https://publi-x.bo\n\n` +
    `Si requiere asistencia o desea coordinar una propuesta personalizada, estamos siempre a su disposición. ¡Mucho éxito en sus proyectos!`;

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


