import { Router, Request, Response } from 'express';
import { pool, isPostgresConnected, memoryStore } from './db';
import { Client, Vehicle, Quotation, Contract, FollowUp, MessageTemplate, AuditLog, Settings, UserSession, PendingQuotationRequest } from '../src/types';

export const apiRouter = Router();

// ----------------------------------------------------
// Health & Bootstrap
// ----------------------------------------------------
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    database: isPostgresConnected ? 'postgresql' : 'memory_fallback',
    connected: isPostgresConnected,
    timestamp: new Date().toISOString()
  });
});

apiRouter.get('/bootstrap', async (req: Request, res: Response) => {
  try {
    if (pool && isPostgresConnected) {
      const [
        clientsRes,
        vehiclesRes,
        quotationsRes,
        contractsRes,
        followUpsRes,
        templatesRes,
        auditLogsRes,
        usersRes,
        pendingRes,
        settingsRes
      ] = await Promise.all([
        pool.query('SELECT * FROM clients ORDER BY fecha_registro DESC'),
        pool.query('SELECT * FROM vehicles ORDER BY fecha_registro DESC'),
        pool.query('SELECT * FROM quotations ORDER BY fecha DESC'),
        pool.query('SELECT * FROM contracts ORDER BY fecha_emision DESC'),
        pool.query('SELECT * FROM follow_ups ORDER BY fecha DESC'),
        pool.query('SELECT * FROM message_templates ORDER BY id ASC'),
        pool.query('SELECT * FROM audit_logs ORDER BY fecha DESC LIMIT 300'),
        pool.query('SELECT * FROM users ORDER BY id ASC'),
        pool.query('SELECT * FROM pending_requests ORDER BY fecha DESC'),
        pool.query('SELECT * FROM settings WHERE id = $1', ['current'])
      ]);

      const settings = settingsRes.rows[0] ? {
        ...settingsRes.rows[0],
        tipo_cambio: parseFloat(settingsRes.rows[0].tipo_cambio) || 6.96,
        custom_fields: settingsRes.rows[0].custom_fields || {}
      } : memoryStore.settings;

      return res.json({
        clients: clientsRes.rows.map(mapClientFromDb),
        vehicles: vehiclesRes.rows.map(mapVehicleFromDb),
        quotations: quotationsRes.rows.map(mapQuotationFromDb),
        contracts: contractsRes.rows.map(mapContractFromDb),
        followUps: followUpsRes.rows.map(mapFollowUpFromDb),
        templates: templatesRes.rows,
        auditLogs: auditLogsRes.rows,
        users: usersRes.rows,
        pendingRequests: pendingRes.rows.map(mapPendingFromDb),
        settings,
        isPostgresConnected: true
      });
    }

    // Return in-memory fallback
    res.json({
      clients: memoryStore.clients,
      vehicles: memoryStore.vehicles,
      quotations: memoryStore.quotations,
      contracts: memoryStore.contracts,
      followUps: memoryStore.followUps,
      templates: memoryStore.templates,
      auditLogs: memoryStore.auditLogs,
      users: memoryStore.users,
      pendingRequests: memoryStore.pendingRequests,
      settings: memoryStore.settings,
      isPostgresConnected: false
    });
  } catch (err: any) {
    console.error('Error in /bootstrap:', err);
    res.status(500).json({ error: err.message || 'Error fetching bootstrap data' });
  }
});

// ----------------------------------------------------
// 1. CLIENTS (CRM)
// ----------------------------------------------------
apiRouter.get('/clients', async (req: Request, res: Response) => {
  try {
    if (pool && isPostgresConnected) {
      const { rows } = await pool.query('SELECT * FROM clients ORDER BY fecha_registro DESC');
      return res.json(rows.map(mapClientFromDb));
    }
    res.json(memoryStore.clients);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/clients', async (req: Request, res: Response) => {
  try {
    const client: Client = req.body;
    if (!client.id) {
      client.id = 'C' + String(Date.now()).slice(-6);
    }
    client.fecha_registro = client.fecha_registro || new Date().toISOString();
    client.fecha_actualizacion = new Date().toISOString();

    if (pool && isPostgresConnected) {
      await pool.query(
        `INSERT INTO clients (id, nombre, nombres, apellidos, celular, ciudad, departamento, pais, presupuesto_usd, observaciones, estado, correo, campania, empresa, razon_social, nit_ci, usuario_acceso, password_acceso, usuario_habilitado, acceso_bloqueado, fecha_registro, fecha_actualizacion)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
         ON CONFLICT (id) DO UPDATE SET
           nombre = EXCLUDED.nombre,
           nombres = EXCLUDED.nombres,
           apellidos = EXCLUDED.apellidos,
           celular = EXCLUDED.celular,
           ciudad = EXCLUDED.ciudad,
           departamento = EXCLUDED.departamento,
           presupuesto_usd = EXCLUDED.presupuesto_usd,
           observaciones = EXCLUDED.observaciones,
           estado = EXCLUDED.estado,
           correo = EXCLUDED.correo,
           empresa = EXCLUDED.empresa,
           razon_social = EXCLUDED.razon_social,
           nit_ci = EXCLUDED.nit_ci,
           usuario_acceso = EXCLUDED.usuario_acceso,
           password_acceso = EXCLUDED.password_acceso,
           fecha_actualizacion = EXCLUDED.fecha_actualizacion`,
        [
          client.id, client.nombre, client.nombres || null, client.apellidos || null, client.celular,
          client.ciudad || 'Santa Cruz', client.departamento || 'Santa Cruz', client.pais || 'Bolivia',
          client.presupuesto_usd || 0, client.observaciones || '', client.estado || 'Nuevo',
          client.correo || null, client.campania || null, client.empresa || null, client.razon_social || null,
          client.nit_ci || null, client.usuario_acceso || null, client.password_acceso || null,
          client.usuario_habilitado !== false, client.acceso_bloqueado === true,
          client.fecha_registro, client.fecha_actualizacion
        ]
      );
      return res.status(201).json(client);
    }

    const idx = memoryStore.clients.findIndex(c => c.id === client.id);
    if (idx >= 0) {
      memoryStore.clients[idx] = client;
    } else {
      memoryStore.clients.unshift(client);
    }
    res.status(201).json(client);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/clients/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const client: Partial<Client> = req.body;
    client.fecha_actualizacion = new Date().toISOString();

    if (pool && isPostgresConnected) {
      const existing = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ error: 'Client not found' });
      }
      const prev = mapClientFromDb(existing.rows[0]);
      const merged = { ...prev, ...client, id };

      await pool.query(
        `UPDATE clients SET
           nombre = $2, nombres = $3, apellidos = $4, celular = $5, ciudad = $6, departamento = $7, pais = $8,
           presupuesto_usd = $9, observaciones = $10, estado = $11, correo = $12, campania = $13,
           empresa = $14, razon_social = $15, nit_ci = $16, usuario_acceso = $17, password_acceso = $18,
           usuario_habilitado = $19, acceso_bloqueado = $20, fecha_actualizacion = $21
         WHERE id = $1`,
        [
          id, merged.nombre, merged.nombres || null, merged.apellidos || null, merged.celular,
          merged.ciudad || 'Santa Cruz', merged.departamento || 'Santa Cruz', merged.pais || 'Bolivia',
          merged.presupuesto_usd || 0, merged.observaciones || '', merged.estado || 'Nuevo',
          merged.correo || null, merged.campania || null, merged.empresa || null, merged.razon_social || null,
          merged.nit_ci || null, merged.usuario_acceso || null, merged.password_acceso || null,
          merged.usuario_habilitado !== false, merged.acceso_bloqueado === true, merged.fecha_actualizacion
        ]
      );
      return res.json(merged);
    }

    const idx = memoryStore.clients.findIndex(c => c.id === id);
    if (idx >= 0) {
      memoryStore.clients[idx] = { ...memoryStore.clients[idx], ...client };
      return res.json(memoryStore.clients[idx]);
    }
    res.status(404).json({ error: 'Client not found' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/clients/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (pool && isPostgresConnected) {
      await pool.query('DELETE FROM clients WHERE id = $1', [id]);
      return res.json({ success: true, id });
    }
    memoryStore.clients = memoryStore.clients.filter(c => c.id !== id);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 2. VEHICLES / VALLAS (CATALOG)
// ----------------------------------------------------
apiRouter.get('/vehicles', async (req: Request, res: Response) => {
  try {
    if (pool && isPostgresConnected) {
      const { rows } = await pool.query('SELECT * FROM vehicles ORDER BY fecha_registro DESC');
      return res.json(rows.map(mapVehicleFromDb));
    }
    res.json(memoryStore.vehicles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/vehicles', async (req: Request, res: Response) => {
  try {
    const v: Vehicle = req.body;
    if (!v.id) {
      v.id = 'V' + String(Date.now()).slice(-6);
    }
    v.fecha_registro = v.fecha_registro || new Date().toISOString();
    v.fecha_actualizacion = new Date().toISOString();

    if (pool && isPostgresConnected) {
      await pool.query(
        `INSERT INTO vehicles (id, codigo, nombre, tipo_valla, zona, cara, ciudad, avenida_calle, provincia, detalle, medidas, transitabilidad_trafico, costo_lona_m2_bs, drive_photos, alto_impacto, ubicacion, dimensiones, especificacion, modalidad, iluminacion, marca, modelo, version, anio, tipo, motor, combustible, transmision, traccion, color, precio_usd, precio_original_usd, descuento_jefe_usd, jefe_descuento_autor, descripcion, estado, imagen_principal, imagenes, foto_principal, galeria, fecha_registro, fecha_actualizacion)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42)
         ON CONFLICT (id) DO UPDATE SET
           codigo = EXCLUDED.codigo, nombre = EXCLUDED.nombre, tipo_valla = EXCLUDED.tipo_valla, zona = EXCLUDED.zona,
           cara = EXCLUDED.cara, ciudad = EXCLUDED.ciudad, avenida_calle = EXCLUDED.avenida_calle, provincia = EXCLUDED.provincia,
           detalle = EXCLUDED.detalle, medidas = EXCLUDED.medidas, transitabilidad_trafico = EXCLUDED.transitabilidad_trafico,
           costo_lona_m2_bs = EXCLUDED.costo_lona_m2_bs, drive_photos = EXCLUDED.drive_photos, alto_impacto = EXCLUDED.alto_impacto,
           ubicacion = EXCLUDED.ubicacion, dimensiones = EXCLUDED.dimensiones, especificacion = EXCLUDED.especificacion,
           modalidad = EXCLUDED.modalidad, iluminacion = EXCLUDED.iluminacion, marca = EXCLUDED.marca, modelo = EXCLUDED.modelo,
           version = EXCLUDED.version, anio = EXCLUDED.anio, tipo = EXCLUDED.tipo, precio_usd = EXCLUDED.precio_usd,
           precio_original_usd = EXCLUDED.precio_original_usd, descuento_jefe_usd = EXCLUDED.descuento_jefe_usd,
           jefe_descuento_autor = EXCLUDED.jefe_descuento_autor, descripcion = EXCLUDED.descripcion, estado = EXCLUDED.estado,
           imagen_principal = EXCLUDED.imagen_principal, imagenes = EXCLUDED.imagenes, fecha_actualizacion = EXCLUDED.fecha_actualizacion`,
        [
          v.id, v.codigo || null, v.nombre || v.modelo || 'Espacio Publicitario', v.tipo_valla || v.tipo || 'Unipolar',
          v.zona || null, v.cara || 'Cara A', v.ciudad || 'Santa Cruz', v.avenida_calle || null, v.provincia || null,
          v.detalle || null, v.medidas || v.dimensiones || null, v.transitabilidad_trafico || v.motor || null,
          v.costo_lona_m2_bs || 0, JSON.stringify(v.drive_photos || []), v.alto_impacto === true,
          v.ubicacion || null, v.dimensiones || null, v.especificacion || null, v.modalidad || v.transmision || null,
          v.iluminacion || v.traccion || null, v.marca || 'Valla Publicitaria', v.modelo || '', v.version || '',
          v.anio || 2026, v.tipo || 'Unipolar', v.motor || null, v.combustible || null, v.transmision || null,
          v.traccion || null, v.color || null, v.precio_usd || 0, v.precio_original_usd || v.precio_usd || 0,
          v.descuento_jefe_usd || 0, v.jefe_descuento_autor || null, v.descripcion || '', v.estado || 'Disponible',
          v.imagen_principal || v.foto_principal || '', JSON.stringify(v.imagenes || v.galeria || []),
          v.foto_principal || v.imagen_principal || '', JSON.stringify(v.galeria || v.imagenes || []),
          v.fecha_registro, v.fecha_actualizacion
        ]
      );
      return res.status(201).json(v);
    }

    const idx = memoryStore.vehicles.findIndex(x => x.id === v.id);
    if (idx >= 0) {
      memoryStore.vehicles[idx] = v;
    } else {
      memoryStore.vehicles.unshift(v);
    }
    res.status(201).json(v);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/vehicles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const update = req.body;
    update.fecha_actualizacion = new Date().toISOString();

    if (pool && isPostgresConnected) {
      const existing = await pool.query('SELECT * FROM vehicles WHERE id = $1', [id]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      const prev = mapVehicleFromDb(existing.rows[0]);
      const v = { ...prev, ...update, id };

      await pool.query(
        `UPDATE vehicles SET
           codigo = $2, nombre = $3, tipo_valla = $4, zona = $5, cara = $6, ciudad = $7, avenida_calle = $8,
           provincia = $9, detalle = $10, medidas = $11, transitabilidad_trafico = $12, costo_lona_m2_bs = $13,
           drive_photos = $14, alto_impacto = $15, ubicacion = $16, dimensiones = $17, especificacion = $18,
           modalidad = $19, iluminacion = $20, marca = $21, modelo = $22, version = $23, anio = $24, tipo = $25,
           motor = $26, combustible = $27, transmision = $28, traccion = $29, color = $30, precio_usd = $31,
           precio_original_usd = $32, descuento_jefe_usd = $33, jefe_descuento_autor = $34, descripcion = $35,
           estado = $36, imagen_principal = $37, imagenes = $38, foto_principal = $39, galeria = $40,
           fecha_actualizacion = $41
         WHERE id = $1`,
        [
          id, v.codigo || null, v.nombre || v.modelo || '', v.tipo_valla || v.tipo || '', v.zona || null,
          v.cara || 'Cara A', v.ciudad || 'Santa Cruz', v.avenida_calle || null, v.provincia || null,
          v.detalle || null, v.medidas || null, v.transitabilidad_trafico || null, v.costo_lona_m2_bs || 0,
          JSON.stringify(v.drive_photos || []), v.alto_impacto === true, v.ubicacion || null,
          v.dimensiones || null, v.especificacion || null, v.modalidad || null, v.iluminacion || null,
          v.marca || '', v.modelo || '', v.version || '', v.anio || 2026, v.tipo || '', v.motor || null,
          v.combustible || null, v.transmision || null, v.traccion || null, v.color || null,
          v.precio_usd || 0, v.precio_original_usd || v.precio_usd || 0, v.descuento_jefe_usd || 0,
          v.jefe_descuento_autor || null, v.descripcion || '', v.estado || 'Disponible',
          v.imagen_principal || '', JSON.stringify(v.imagenes || []), v.foto_principal || '',
          JSON.stringify(v.galeria || []), v.fecha_actualizacion
        ]
      );
      return res.json(v);
    }

    const idx = memoryStore.vehicles.findIndex(x => x.id === id);
    if (idx >= 0) {
      memoryStore.vehicles[idx] = { ...memoryStore.vehicles[idx], ...update };
      return res.json(memoryStore.vehicles[idx]);
    }
    res.status(404).json({ error: 'Vehicle not found' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/vehicles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (pool && isPostgresConnected) {
      await pool.query('DELETE FROM vehicles WHERE id = $1', [id]);
      return res.json({ success: true, id });
    }
    memoryStore.vehicles = memoryStore.vehicles.filter(x => x.id !== id);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 3. QUOTATIONS
// ----------------------------------------------------
apiRouter.get('/quotations', async (req: Request, res: Response) => {
  try {
    if (pool && isPostgresConnected) {
      const { rows } = await pool.query('SELECT * FROM quotations ORDER BY fecha DESC');
      return res.json(rows.map(mapQuotationFromDb));
    }
    res.json(memoryStore.quotations);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/quotations', async (req: Request, res: Response) => {
  try {
    const q: Quotation = req.body;
    if (!q.id) {
      q.id = 'Q' + String(Date.now()).slice(-6);
    }
    q.fecha = q.fecha || new Date().toISOString();

    if (pool && isPostgresConnected) {
      await pool.query(
        `INSERT INTO quotations (id, numero, cliente_id, vehiculo_id, precio_vehiculo, gastos_importacion, gastos_aduana, gastos_logistica, gastos_seguro, total, estado, observaciones, fecha, vallas_seleccionadas, emisor_nombre, emisor_rol, incluye_contrato, terminos_contrato, descuento_usd)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
         ON CONFLICT (id) DO UPDATE SET
           numero = EXCLUDED.numero, cliente_id = EXCLUDED.cliente_id, vehiculo_id = EXCLUDED.vehiculo_id,
           precio_vehiculo = EXCLUDED.precio_vehiculo, gastos_importacion = EXCLUDED.gastos_importacion,
           gastos_aduana = EXCLUDED.gastos_aduana, gastos_logistica = EXCLUDED.gastos_logistica,
           gastos_seguro = EXCLUDED.gastos_seguro, total = EXCLUDED.total, estado = EXCLUDED.estado,
           observaciones = EXCLUDED.observaciones, fecha = EXCLUDED.fecha,
           vallas_seleccionadas = EXCLUDED.vallas_seleccionadas, emisor_nombre = EXCLUDED.emisor_nombre,
           emisor_rol = EXCLUDED.emisor_rol, incluye_contrato = EXCLUDED.incluye_contrato,
           terminos_contrato = EXCLUDED.terminos_contrato, descuento_usd = EXCLUDED.descuento_usd`,
        [
          q.id, q.numero, q.cliente_id || null, q.vehiculo_id || null, q.precio_vehiculo || 0,
          q.gastos_importacion || 0, q.gastos_aduana || 0, q.gastos_logistica || 0, q.gastos_seguro || 0,
          q.total || 0, q.estado || 'Enviada', q.observaciones || '', q.fecha,
          JSON.stringify(q.vallas_seleccionadas || []), q.emisor_nombre || null, q.emisor_rol || null,
          q.incluye_contrato === true, q.terminos_contrato || null, q.descuento_usd || 0
        ]
      );
      return res.status(201).json(q);
    }

    const idx = memoryStore.quotations.findIndex(x => x.id === q.id);
    if (idx >= 0) {
      memoryStore.quotations[idx] = q;
    } else {
      memoryStore.quotations.unshift(q);
    }
    res.status(201).json(q);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/quotations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (pool && isPostgresConnected) {
      await pool.query('DELETE FROM quotations WHERE id = $1', [id]);
      return res.json({ success: true, id });
    }
    memoryStore.quotations = memoryStore.quotations.filter(x => x.id !== id);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 4. CONTRACTS
// ----------------------------------------------------
apiRouter.get('/contracts', async (req: Request, res: Response) => {
  try {
    if (pool && isPostgresConnected) {
      const { rows } = await pool.query('SELECT * FROM contracts ORDER BY fecha_emision DESC');
      return res.json(rows.map(mapContractFromDb));
    }
    res.json(memoryStore.contracts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/contracts', async (req: Request, res: Response) => {
  try {
    const c: Contract = req.body;
    if (!c.id) {
      c.id = 'CON-' + String(Date.now()).slice(-6);
    }

    if (pool && isPostgresConnected) {
      await pool.query(
        `INSERT INTO contracts (
          id, numero, cotizacion_id, cliente_id, cliente_nombre, cliente_empresa, cliente_nit_ci,
          cliente_representante, cliente_representante_ci, cliente_escritura_poder, cliente_poder_fecha,
          cliente_notaria_numero, cliente_notario_nombre, cliente_celular, cliente_correo, cliente_direccion,
          cliente_ciudad, arrendador_empresa, arrendador_nit, arrendador_direccion, arrendador_representante,
          arrendador_ci, valla_id, valla_nombre, valla_medidas, valla_ubicacion, valla_tipo, valla_cara,
          vallas_lista, lonas_lista, items, lona_detail, beneficios_extras, subtotal_alquiler_usd,
          descuento_cliente_usd, descuento_cliente_porcentaje, total_neto_usd, total_neto_bob, tipo_cambio,
          fecha_emision, fecha_inicio, fecha_fin, periodo_meses, plazo_meses, forma_pago,
          clausulas_especiales, clausulas_adicionales, estado, diseno_plantilla, vendedor_nombre,
          vendedor_celular, vendedor_correo, observaciones
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38,
          $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52, $53
        ) ON CONFLICT (id) DO UPDATE SET
          numero = EXCLUDED.numero, cotizacion_id = EXCLUDED.cotizacion_id, cliente_nombre = EXCLUDED.cliente_nombre,
          cliente_empresa = EXCLUDED.cliente_empresa, cliente_nit_ci = EXCLUDED.cliente_nit_ci,
          cliente_representante = EXCLUDED.cliente_representante, cliente_representante_ci = EXCLUDED.cliente_representante_ci,
          cliente_celular = EXCLUDED.cliente_celular, cliente_correo = EXCLUDED.cliente_correo,
          valla_nombre = EXCLUDED.valla_nombre, valla_medidas = EXCLUDED.valla_medidas, valla_ubicacion = EXCLUDED.valla_ubicacion,
          vallas_lista = EXCLUDED.vallas_lista, lonas_lista = EXCLUDED.lonas_lista, items = EXCLUDED.items,
          lona_detail = EXCLUDED.lona_detail, beneficios_extras = EXCLUDED.beneficios_extras,
          subtotal_alquiler_usd = EXCLUDED.subtotal_alquiler_usd, descuento_cliente_usd = EXCLUDED.descuento_cliente_usd,
          total_neto_usd = EXCLUDED.total_neto_usd, total_neto_bob = EXCLUDED.total_neto_bob,
          fecha_emision = EXCLUDED.fecha_emision, fecha_inicio = EXCLUDED.fecha_inicio, fecha_fin = EXCLUDED.fecha_fin,
          periodo_meses = EXCLUDED.periodo_meses, forma_pago = EXCLUDED.forma_pago,
          clausulas_especiales = EXCLUDED.clausulas_especiales, estado = EXCLUDED.estado,
          observaciones = EXCLUDED.observaciones`,
        [
          c.id, c.numero, c.cotizacion_id || null, c.cliente_id || null, c.cliente_nombre || '',
          c.cliente_empresa || null, c.cliente_nit_ci || null, c.cliente_representante || null,
          c.cliente_representante_ci || null, c.cliente_escritura_poder || null, c.cliente_poder_fecha || null,
          c.cliente_notaria_numero || null, c.cliente_notario_nombre || null, c.cliente_celular || '',
          c.cliente_correo || null, c.cliente_direccion || null, c.cliente_ciudad || 'Santa Cruz',
          c.arrendador_empresa || 'PUBLI-X BOLIVIA', c.arrendador_nit || null, c.arrendador_direccion || null,
          c.arrendador_representante || null, c.arrendador_ci || null, c.valla_id || null,
          c.valla_nombre || '', c.valla_medidas || '', c.valla_ubicacion || '', c.valla_tipo || '',
          c.valla_cara || '', JSON.stringify(c.vallas_lista || []), JSON.stringify(c.lonas_lista || []),
          JSON.stringify(c.items || []), JSON.stringify(c.lona_detail || {}),
          JSON.stringify(c.beneficios_extras || []), c.subtotal_alquiler_usd || 0,
          c.descuento_cliente_usd || 0, c.descuento_cliente_porcentaje || 0, c.total_neto_usd || 0,
          c.total_neto_bob || 0, c.tipo_cambio || 6.96, c.fecha_emision || '', c.fecha_inicio || '',
          c.fecha_fin || '', c.periodo_meses || 12, c.plazo_meses || 12, c.forma_pago || '',
          c.clausulas_especiales || null, c.clausulas_adicionales || null, c.estado || 'Vigente',
          c.diseno_plantilla || 'OFICIAL_VALLAS', c.vendedor_nombre || '', c.vendedor_celular || null,
          c.vendedor_correo || null, c.observaciones || null
        ]
      );
      return res.status(201).json(c);
    }

    const idx = memoryStore.contracts.findIndex(x => x.id === c.id);
    if (idx >= 0) {
      memoryStore.contracts[idx] = c;
    } else {
      memoryStore.contracts.unshift(c);
    }
    res.status(201).json(c);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/contracts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (pool && isPostgresConnected) {
      await pool.query('DELETE FROM contracts WHERE id = $1', [id]);
      return res.json({ success: true, id });
    }
    memoryStore.contracts = memoryStore.contracts.filter(x => x.id !== id);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 5. FOLLOW UPS / AGENDA
// ----------------------------------------------------
apiRouter.get('/follow-ups', async (req: Request, res: Response) => {
  try {
    if (pool && isPostgresConnected) {
      const { rows } = await pool.query('SELECT * FROM follow_ups ORDER BY fecha DESC');
      return res.json(rows.map(mapFollowUpFromDb));
    }
    res.json(memoryStore.followUps);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/follow-ups', async (req: Request, res: Response) => {
  try {
    const f: FollowUp = req.body;
    if (!f.id) {
      f.id = 'F' + String(Date.now()).slice(-6);
    }
    f.fecha = f.fecha || new Date().toISOString();

    if (pool && isPostgresConnected) {
      await pool.query(
        `INSERT INTO follow_ups (id, cliente_id, tipo, nota, fecha, proximo_contacto, prioridad, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           cliente_id = EXCLUDED.cliente_id, tipo = EXCLUDED.tipo, nota = EXCLUDED.nota,
           proximo_contacto = EXCLUDED.proximo_contacto, prioridad = EXCLUDED.prioridad, estado = EXCLUDED.estado`,
        [f.id, f.cliente_id || null, f.tipo, f.nota, f.fecha, f.proximo_contacto || null, f.prioridad || 'Media', f.estado || 'Pendiente']
      );
      return res.status(201).json(f);
    }

    const idx = memoryStore.followUps.findIndex(x => x.id === f.id);
    if (idx >= 0) {
      memoryStore.followUps[idx] = f;
    } else {
      memoryStore.followUps.unshift(f);
    }
    res.status(201).json(f);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/follow-ups/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const update = req.body;

    if (pool && isPostgresConnected) {
      await pool.query(
        `UPDATE follow_ups SET
           tipo = COALESCE($2, tipo), nota = COALESCE($3, nota),
           proximo_contacto = COALESCE($4, proximo_contacto), prioridad = COALESCE($5, prioridad),
           estado = COALESCE($6, estado)
         WHERE id = $1`,
        [id, update.tipo, update.nota, update.proximo_contacto, update.prioridad, update.estado]
      );
      return res.json({ success: true, id, ...update });
    }

    const idx = memoryStore.followUps.findIndex(x => x.id === id);
    if (idx >= 0) {
      memoryStore.followUps[idx] = { ...memoryStore.followUps[idx], ...update };
      return res.json(memoryStore.followUps[idx]);
    }
    res.status(404).json({ error: 'Follow up not found' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/follow-ups/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (pool && isPostgresConnected) {
      await pool.query('DELETE FROM follow_ups WHERE id = $1', [id]);
      return res.json({ success: true, id });
    }
    memoryStore.followUps = memoryStore.followUps.filter(x => x.id !== id);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 6. MESSAGE TEMPLATES
// ----------------------------------------------------
apiRouter.get('/templates', async (req: Request, res: Response) => {
  try {
    if (pool && isPostgresConnected) {
      const { rows } = await pool.query('SELECT * FROM message_templates ORDER BY id ASC');
      return res.json(rows);
    }
    res.json(memoryStore.templates);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/templates', async (req: Request, res: Response) => {
  try {
    const t: MessageTemplate = req.body;
    if (!t.id) {
      t.id = 'T' + String(Date.now()).slice(-6);
    }

    if (pool && isPostgresConnected) {
      await pool.query(
        `INSERT INTO message_templates (id, nombre, contenido, activa, categoria)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           nombre = EXCLUDED.nombre, contenido = EXCLUDED.contenido, activa = EXCLUDED.activa, categoria = EXCLUDED.categoria`,
        [t.id, t.nombre, t.contenido, t.activa !== false, t.categoria || 'General']
      );
      return res.status(201).json(t);
    }

    const idx = memoryStore.templates.findIndex(x => x.id === t.id);
    if (idx >= 0) {
      memoryStore.templates[idx] = t;
    } else {
      memoryStore.templates.push(t);
    }
    res.status(201).json(t);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/templates', async (req: Request, res: Response) => {
  try {
    const templates: MessageTemplate[] = req.body;
    if (Array.isArray(templates)) {
      if (pool && isPostgresConnected) {
        for (const t of templates) {
          await pool.query(
            `INSERT INTO message_templates (id, nombre, contenido, activa, categoria)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO UPDATE SET
               nombre = EXCLUDED.nombre, contenido = EXCLUDED.contenido, activa = EXCLUDED.activa, categoria = EXCLUDED.categoria`,
            [t.id, t.nombre, t.contenido, t.activa !== false, t.categoria || 'General']
          );
        }
        return res.json(templates);
      }
      memoryStore.templates = templates;
      return res.json(templates);
    }
    res.status(400).json({ error: 'Expected array of templates' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 7. SETTINGS & CONFIG
// ----------------------------------------------------
apiRouter.get('/settings', async (req: Request, res: Response) => {
  try {
    if (pool && isPostgresConnected) {
      const { rows } = await pool.query('SELECT * FROM settings WHERE id = $1', ['current']);
      if (rows.length > 0) {
        const s = rows[0];
        return res.json({
          ...s,
          tipo_cambio: parseFloat(s.tipo_cambio) || 6.96,
          custom_fields: s.custom_fields || {}
        });
      }
    }
    res.json(memoryStore.settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/settings', async (req: Request, res: Response) => {
  try {
    const s: Settings = req.body;
    if (pool && isPostgresConnected) {
      await pool.query(
        `INSERT INTO settings (
          id, nombre_empresa, direccion, ciudad, departamento, pais, telefono, whatsapp,
          correo, web, logo, tipo_cambio, terminos_cotizacion, custom_fields,
          backup_auto_enabled, backup_interval_hours, backup_on_critical_change,
          backup_last_timestamp, backup_on_save, backup_retention_count
        ) VALUES (
          'current', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        ) ON CONFLICT (id) DO UPDATE SET
          nombre_empresa = EXCLUDED.nombre_empresa, direccion = EXCLUDED.direccion,
          ciudad = EXCLUDED.ciudad, departamento = EXCLUDED.departamento, pais = EXCLUDED.pais,
          telefono = EXCLUDED.telefono, whatsapp = EXCLUDED.whatsapp, correo = EXCLUDED.correo,
          web = EXCLUDED.web, logo = EXCLUDED.logo, tipo_cambio = EXCLUDED.tipo_cambio,
          terminos_cotizacion = EXCLUDED.terminos_cotizacion, custom_fields = EXCLUDED.custom_fields,
          backup_auto_enabled = EXCLUDED.backup_auto_enabled, backup_interval_hours = EXCLUDED.backup_interval_hours,
          backup_on_critical_change = EXCLUDED.backup_on_critical_change, backup_last_timestamp = EXCLUDED.backup_last_timestamp,
          backup_on_save = EXCLUDED.backup_on_save, backup_retention_count = EXCLUDED.backup_retention_count`,
        [
          s.nombre_empresa || 'PUBLI-X BOLIVIA', s.direccion || '', s.ciudad || '', s.departamento || '',
          s.pais || 'Bolivia', s.telefono || '', s.whatsapp || '', s.correo || '', s.web || '',
          s.logo || '', s.tipo_cambio || 6.96, s.terminos_cotizacion || '', JSON.stringify(s.custom_fields || {}),
          s.backup_auto_enabled !== false, s.backup_interval_hours || 24, s.backup_on_critical_change !== false,
          s.backup_last_timestamp || new Date().toISOString(), s.backup_on_save !== false, s.backup_retention_count || 10
        ]
      );
      return res.json(s);
    }
    memoryStore.settings = { ...memoryStore.settings, ...s };
    res.json(memoryStore.settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 8. USERS & PERMISSIONS
// ----------------------------------------------------
apiRouter.get('/users', async (req: Request, res: Response) => {
  try {
    if (pool && isPostgresConnected) {
      const { rows } = await pool.query('SELECT * FROM users ORDER BY id ASC');
      return res.json(rows);
    }
    res.json(memoryStore.users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/users', async (req: Request, res: Response) => {
  try {
    const u: UserSession = req.body;
    if (!u.id) {
      u.id = 'U' + String(Date.now()).slice(-6);
    }
    if (!u.password) {
      u.password = (u.celular ? u.celular.replace(/\D/g, '') : '70000000');
    }

    if (pool && isPostgresConnected) {
      await pool.query(
        `INSERT INTO users (id, nombre, nombres, apellidos, usuario, rol, celular, email, password, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           nombre = EXCLUDED.nombre, nombres = EXCLUDED.nombres, apellidos = EXCLUDED.apellidos,
           usuario = EXCLUDED.usuario, rol = EXCLUDED.rol, celular = EXCLUDED.celular,
           email = EXCLUDED.email, password = EXCLUDED.password, estado = EXCLUDED.estado`,
        [u.id, u.nombre, u.nombres || null, u.apellidos || null, u.usuario, u.rol, u.celular || null, u.email || null, u.password, u.estado || 'Activo']
      );
      return res.status(201).json(u);
    }

    const idx = memoryStore.users.findIndex(x => x.id === u.id);
    if (idx >= 0) {
      memoryStore.users[idx] = u;
    } else {
      memoryStore.users.push(u);
    }
    res.status(201).json(u);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/users/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (pool && isPostgresConnected) {
      const uRes = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      if (uRes.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      const user = uRes.rows[0];
      const defaultPass = user.celular ? user.celular.replace(/\D/g, '') : '70000000';
      await pool.query('UPDATE users SET password = $1 WHERE id = $2', [defaultPass, id]);
      return res.json({ success: true, newPassword: defaultPass });
    }

    const user = memoryStore.users.find(x => x.id === id);
    if (user) {
      const defaultPass = user.celular ? user.celular.replace(/\D/g, '') : '70000000';
      user.password = defaultPass;
      return res.json({ success: true, newPassword: defaultPass });
    }
    res.status(404).json({ error: 'User not found' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/users/:id/change-password', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.trim().length < 4) {
      return res.status(400).json({ error: 'Password must have at least 4 characters' });
    }

    if (pool && isPostgresConnected) {
      await pool.query('UPDATE users SET password = $1 WHERE id = $2', [newPassword.trim(), id]);
      return res.json({ success: true });
    }

    const user = memoryStore.users.find(x => x.id === id);
    if (user) {
      user.password = newPassword.trim();
      return res.json({ success: true });
    }
    res.status(404).json({ error: 'User not found' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (pool && isPostgresConnected) {
      await pool.query('DELETE FROM users WHERE id = $1 AND rol != $2', [id, 'Dueño']);
      return res.json({ success: true, id });
    }
    memoryStore.users = memoryStore.users.filter(x => x.id !== id);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 9. AUDIT LOGS
// ----------------------------------------------------
apiRouter.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    if (pool && isPostgresConnected) {
      const { rows } = await pool.query('SELECT * FROM audit_logs ORDER BY fecha DESC LIMIT 500');
      return res.json(rows);
    }
    res.json(memoryStore.auditLogs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/audit-logs', async (req: Request, res: Response) => {
  try {
    const log: AuditLog = req.body;
    if (!log.id) {
      log.id = 'L' + String(Date.now()).slice(-6);
    }
    log.fecha = log.fecha || new Date().toISOString();

    if (pool && isPostgresConnected) {
      await pool.query(
        `INSERT INTO audit_logs (id, usuario, accion, detalle, fecha)
         VALUES ($1, $2, $3, $4, $5)`,
        [log.id, log.usuario || 'Sistema', log.accion, log.detalle || '', log.fecha]
      );
      return res.status(201).json(log);
    }

    memoryStore.auditLogs.unshift(log);
    res.status(201).json(log);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 10. PENDING REQUESTS (SOLICITUDES LANDING PAGE)
// ----------------------------------------------------
apiRouter.get('/pending-requests', async (req: Request, res: Response) => {
  try {
    if (pool && isPostgresConnected) {
      const { rows } = await pool.query('SELECT * FROM pending_requests ORDER BY fecha DESC');
      return res.json(rows.map(mapPendingFromDb));
    }
    res.json(memoryStore.pendingRequests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/pending-requests', async (req: Request, res: Response) => {
  try {
    const r: PendingQuotationRequest = req.body;
    if (!r.id) {
      r.id = 'REQ-' + String(Date.now()).slice(-6);
    }
    r.fecha = r.fecha || new Date().toISOString();

    if (pool && isPostgresConnected) {
      await pool.query(
        `INSERT INTO pending_requests (id, codigo, cliente_id, cliente_nombre, cliente_empresa, cliente_celular, cliente_correo, cliente_ciudad, vallas_ids, vallas_nombres, vallas_detalles, fecha, estado, vendedor_asignado, observaciones, sugerencia_cotizacion, imagenes_referencia, dispositivo_detectado, presupuesto_estimado_usd)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
         ON CONFLICT (id) DO UPDATE SET
           estado = EXCLUDED.estado, vendedor_asignado = EXCLUDED.vendedor_asignado, observaciones = EXCLUDED.observaciones`,
        [
          r.id, r.codigo || null, r.cliente_id || null, r.cliente_nombre, r.cliente_empresa || null,
          r.cliente_celular, r.cliente_correo || null, r.cliente_ciudad || null,
          JSON.stringify(r.vallas_ids || []), JSON.stringify(r.vallas_nombres || []),
          JSON.stringify(r.vallas_detalles || []), r.fecha, r.estado || 'Pendiente',
          r.vendedor_asignado || null, r.observaciones || null, r.sugerencia_cotizacion || null,
          JSON.stringify(r.imagenes_referencia || []), r.dispositivo_detectado || null,
          r.presupuesto_estimado_usd || null
        ]
      );
      return res.status(201).json(r);
    }

    const idx = memoryStore.pendingRequests.findIndex(x => x.id === r.id);
    if (idx >= 0) {
      memoryStore.pendingRequests[idx] = r;
    } else {
      memoryStore.pendingRequests.unshift(r);
    }
    res.status(201).json(r);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/pending-requests/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (pool && isPostgresConnected) {
      await pool.query('DELETE FROM pending_requests WHERE id = $1', [id]);
      return res.json({ success: true, id });
    }
    memoryStore.pendingRequests = memoryStore.pendingRequests.filter(x => x.id !== id);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/pending-requests', async (req: Request, res: Response) => {
  try {
    if (pool && isPostgresConnected) {
      await pool.query('DELETE FROM pending_requests');
      return res.json({ success: true });
    }
    memoryStore.pendingRequests = [];
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// BACKUP IMPORT & RESET ALL
// ----------------------------------------------------
apiRouter.post('/backup/import', async (req: Request, res: Response) => {
  try {
    const backup = req.body;
    if (!backup || typeof backup !== 'object') {
      return res.status(400).json({ error: 'Invalid backup structure' });
    }

    if (pool && isPostgresConnected) {
      // Clear and re-populate
      if (Array.isArray(backup.clients)) {
        await pool.query('DELETE FROM clients');
        for (const c of backup.clients) {
          await pool.query(
            `INSERT INTO clients (id, nombre, nombres, apellidos, celular, ciudad, departamento, pais, presupuesto_usd, observaciones, estado, correo, campania, empresa, razon_social, nit_ci, usuario_acceso, password_acceso, fecha_registro, fecha_actualizacion)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
             ON CONFLICT (id) DO NOTHING`,
            [c.id, c.nombre, c.nombres || null, c.apellidos || null, c.celular, c.ciudad, c.departamento, c.pais, c.presupuesto_usd || 0, c.observaciones || '', c.estado, c.correo || null, c.campania || null, c.empresa || null, c.razon_social || null, c.nit_ci || null, c.usuario_acceso || null, c.password_acceso || null, c.fecha_registro || new Date().toISOString(), c.fecha_actualizacion || new Date().toISOString()]
          );
        }
      }

      if (Array.isArray(backup.vehicles)) {
        await pool.query('DELETE FROM vehicles');
        for (const v of backup.vehicles) {
          await pool.query(
            `INSERT INTO vehicles (id, codigo, nombre, tipo_valla, zona, cara, ciudad, avenida_calle, provincia, detalle, medidas, transitabilidad_trafico, costo_lona_m2_bs, alto_impacto, ubicacion, dimensiones, especificacion, modalidad, iluminacion, marca, modelo, version, anio, tipo, precio_usd, precio_original_usd, descripcion, estado, imagen_principal, imagenes, fecha_registro, fecha_actualizacion)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
             ON CONFLICT (id) DO NOTHING`,
            [
              v.id, v.codigo || null, v.nombre || v.modelo || '', v.tipo_valla || v.tipo || 'Unipolar',
              v.zona || null, v.cara || 'Cara A', v.ciudad || 'Santa Cruz', v.avenida_calle || null, v.provincia || null,
              v.detalle || null, v.medidas || null, v.transitabilidad_trafico || null, v.costo_lona_m2_bs || 0,
              v.alto_impacto === true, v.ubicacion || null, v.dimensiones || null, v.especificacion || null,
              v.modalidad || null, v.iluminacion || null, v.marca || 'Valla Publicitaria', v.modelo || '',
              v.version || '', v.anio || 2026, v.tipo || 'Unipolar', v.precio_usd || 0, v.precio_original_usd || v.precio_usd || 0,
              v.descripcion || '', v.estado || 'Disponible', v.imagen_principal || '', JSON.stringify(v.imagenes || []),
              v.fecha_registro || new Date().toISOString(), v.fecha_actualizacion || new Date().toISOString()
            ]
          );
        }
      }

      if (backup.settings) {
        const s = backup.settings;
        await pool.query(
          `INSERT INTO settings (id, nombre_empresa, direccion, ciudad, departamento, pais, telefono, whatsapp, correo, web, logo, tipo_cambio, terminos_cotizacion)
           VALUES ('current', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO UPDATE SET
             nombre_empresa = EXCLUDED.nombre_empresa, direccion = EXCLUDED.direccion,
             ciudad = EXCLUDED.ciudad, departamento = EXCLUDED.departamento, pais = EXCLUDED.pais,
             telefono = EXCLUDED.telefono, whatsapp = EXCLUDED.whatsapp, correo = EXCLUDED.correo,
             web = EXCLUDED.web, logo = EXCLUDED.logo, tipo_cambio = EXCLUDED.tipo_cambio,
             terminos_cotizacion = EXCLUDED.terminos_cotizacion`,
          [s.nombre_empresa, s.direccion, s.ciudad, s.departamento, s.pais, s.telefono, s.whatsapp, s.correo, s.web, s.logo, s.tipo_cambio || 6.96, s.terminos_cotizacion]
        );
      }
    }

    if (Array.isArray(backup.clients)) memoryStore.clients = backup.clients;
    if (Array.isArray(backup.vehicles)) memoryStore.vehicles = backup.vehicles;
    if (Array.isArray(backup.quotations)) memoryStore.quotations = backup.quotations;
    if (Array.isArray(backup.contracts)) memoryStore.contracts = backup.contracts;
    if (Array.isArray(backup.followUps)) memoryStore.followUps = backup.followUps;
    if (backup.settings) memoryStore.settings = { ...memoryStore.settings, ...backup.settings };

    res.json({ success: true, message: 'Backup successfully imported into PostgreSQL database' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// Helper Mappers between PostgreSQL and App Types
// ----------------------------------------------------
function mapClientFromDb(row: any): Client {
  return {
    ...row,
    presupuesto_usd: parseFloat(row.presupuesto_usd) || 0,
    fecha_registro: row.fecha_registro ? new Date(row.fecha_registro).toISOString() : new Date().toISOString(),
    fecha_actualizacion: row.fecha_actualizacion ? new Date(row.fecha_actualizacion).toISOString() : new Date().toISOString()
  };
}

function mapVehicleFromDb(row: any): Vehicle {
  return {
    ...row,
    precio_usd: parseFloat(row.precio_usd) || 0,
    precio_original_usd: row.precio_original_usd ? parseFloat(row.precio_original_usd) : parseFloat(row.precio_usd) || 0,
    descuento_jefe_usd: row.descuento_jefe_usd ? parseFloat(row.descuento_jefe_usd) : 0,
    costo_lona_m2_bs: row.costo_lona_m2_bs ? parseFloat(row.costo_lona_m2_bs) : 0,
    drive_photos: typeof row.drive_photos === 'string' ? JSON.parse(row.drive_photos) : (row.drive_photos || []),
    imagenes: typeof row.imagenes === 'string' ? JSON.parse(row.imagenes) : (row.imagenes || []),
    galeria: typeof row.galeria === 'string' ? JSON.parse(row.galeria) : (row.galeria || []),
    alto_impacto: row.alto_impacto === true,
    fecha_registro: row.fecha_registro ? new Date(row.fecha_registro).toISOString() : new Date().toISOString(),
    fecha_actualizacion: row.fecha_actualizacion ? new Date(row.fecha_actualizacion).toISOString() : new Date().toISOString()
  };
}

function mapQuotationFromDb(row: any): Quotation {
  return {
    ...row,
    precio_vehiculo: parseFloat(row.precio_vehiculo) || 0,
    gastos_importacion: parseFloat(row.gastos_importacion) || 0,
    gastos_aduana: parseFloat(row.gastos_aduana) || 0,
    gastos_logistica: parseFloat(row.gastos_logistica) || 0,
    gastos_seguro: parseFloat(row.gastos_seguro) || 0,
    total: parseFloat(row.total) || 0,
    descuento_usd: row.descuento_usd ? parseFloat(row.descuento_usd) : 0,
    vallas_seleccionadas: typeof row.vallas_seleccionadas === 'string' ? JSON.parse(row.vallas_seleccionadas) : (row.vallas_seleccionadas || []),
    fecha: row.fecha ? new Date(row.fecha).toISOString() : new Date().toISOString()
  };
}

function mapContractFromDb(row: any): Contract {
  return {
    ...row,
    subtotal_alquiler_usd: parseFloat(row.subtotal_alquiler_usd) || 0,
    descuento_cliente_usd: parseFloat(row.descuento_cliente_usd) || 0,
    descuento_cliente_porcentaje: parseFloat(row.descuento_cliente_porcentaje) || 0,
    total_neto_usd: parseFloat(row.total_neto_usd) || 0,
    total_neto_bob: parseFloat(row.total_neto_bob) || 0,
    tipo_cambio: parseFloat(row.tipo_cambio) || 6.96,
    vallas_lista: typeof row.vallas_lista === 'string' ? JSON.parse(row.vallas_lista) : (row.vallas_lista || []),
    lonas_lista: typeof row.lonas_lista === 'string' ? JSON.parse(row.lonas_lista) : (row.lonas_lista || []),
    items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
    lona_detail: typeof row.lona_detail === 'string' ? JSON.parse(row.lona_detail) : (row.lona_detail || {}),
    beneficios_extras: typeof row.beneficios_extras === 'string' ? JSON.parse(row.beneficios_extras) : (row.beneficios_extras || [])
  };
}

function mapFollowUpFromDb(row: any): FollowUp {
  return {
    ...row,
    fecha: row.fecha ? new Date(row.fecha).toISOString() : new Date().toISOString(),
    proximo_contacto: row.proximo_contacto ? new Date(row.proximo_contacto).toISOString() : new Date().toISOString()
  };
}

function mapPendingFromDb(row: any): PendingQuotationRequest {
  return {
    ...row,
    vallas_ids: typeof row.vallas_ids === 'string' ? JSON.parse(row.vallas_ids) : (row.vallas_ids || []),
    vallas_nombres: typeof row.vallas_nombres === 'string' ? JSON.parse(row.vallas_nombres) : (row.vallas_nombres || []),
    vallas_detalles: typeof row.vallas_detalles === 'string' ? JSON.parse(row.vallas_detalles) : (row.vallas_detalles || []),
    imagenes_referencia: typeof row.imagenes_referencia === 'string' ? JSON.parse(row.imagenes_referencia) : (row.imagenes_referencia || []),
    fecha: row.fecha ? new Date(row.fecha).toISOString() : new Date().toISOString(),
    presupuesto_estimado_usd: row.presupuesto_estimado_usd ? parseFloat(row.presupuesto_estimado_usd) : undefined
  };
}
