import React, { useState } from 'react';
import { PendingQuotationRequest, Client, UserSession } from '../types';
import { mockDb } from '../data/mockDatabase';
import { generateClientCredentials, generateClientWelcomeMessage } from '../utils/credentials';
import { 
  Inbox, 
  Check, 
  X, 
  Search, 
  Filter, 
  UserPlus, 
  Phone, 
  Mail, 
  Building2, 
  MapPin, 
  DollarSign, 
  Image as ImageIcon, 
  MessageSquare, 
  Send, 
  ShieldCheck, 
  Lock, 
  Maximize2, 
  Copy, 
  Calendar, 
  Laptop, 
  CheckCircle2, 
  Sparkles,
  ArrowLeft,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PendingRequestsManagerProps {
  clients: Client[];
  currentUser: UserSession;
  onAddClient: (clientData: Omit<Client, 'id' | 'fecha_registro' | 'fecha_actualizacion'>) => boolean | Promise<boolean>;
  onSelectActiveClient?: (client: Client) => void;
  onRegisterLog: (action: string, detail: string) => void;
}

export default function PendingRequestsManager({
  clients,
  currentUser,
  onAddClient,
  onSelectActiveClient,
  onRegisterLog
}: PendingRequestsManagerProps) {
  const isDuenoOrGerente = currentUser?.rol === 'Dueño' || 
                           currentUser?.rol === 'Gerente' || 
                           currentUser?.rol === 'Jefe' || 
                           currentUser?.rol === 'Supervisor' || 
                           currentUser?.rol === 'Administrador';

  // Requests state
  const [requestsList, setRequestsList] = useState<PendingQuotationRequest[]>(() => mockDb.getPendingRequests());
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState<string>('Todos');

  // Lightbox Modal state for inspecting reference photos
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Welcome popup state after accepting candidate
  const [welcomeClientData, setWelcomeClientData] = useState<{ client: Client; welcomeInfo: string } | null>(null);

  const refreshRequests = () => {
    setRequestsList(mockDb.getPendingRequests());
  };

  // Real-time synchronization whenever a new web request is sent
  React.useEffect(() => {
    const handleSync = () => {
      setRequestsList(mockDb.getPendingRequests());
    };
    window.addEventListener('publix_new_request', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('publix_new_request', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // User notification message state
  const [actionNotice, setActionNotice] = useState<{ msg: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setActionNotice({ msg, type });
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Accept candidate and convert into official CRM Client with username & password
  const handleAcceptCandidate = (req: PendingQuotationRequest) => {
    if (!isDuenoOrGerente) {
      showToast('⛔ Acceso denegado: Únicamente el usuario con rol de Dueño, Gerente, Jefe o Supervisor tiene permisos para aceptar clientes.', 'error');
      return;
    }

    const rawCell = (req.cliente_celular || '').trim();
    let cleanCell = rawCell.startsWith('+591') ? rawCell : `+591${rawCell.replace(/\D/g, '')}`;
    if (cleanCell === '+591' || cleanCell.length < 8) {
      cleanCell = `+591${Math.floor(70000000 + Math.random() * 9999999)}`;
    }

    // Split req.cliente_nombre into nombres and apellidos
    const nameParts = req.cliente_nombre.trim().split(/\s+/).filter(Boolean);
    let nombres = req.cliente_nombre;
    let apellidos = '';
    if (nameParts.length === 2) {
      nombres = nameParts[0];
      apellidos = nameParts[1];
    } else if (nameParts.length >= 3) {
      nombres = nameParts.slice(0, nameParts.length - 2).join(' ') || nameParts[0];
      apellidos = nameParts.slice(-2).join(' ');
    }

    // Generate credentials strictly based on the candidate's name
    const creds = generateClientCredentials(req.cliente_nombre, cleanCell);
    
    // Check if client already exists by phone AND name (avoid hijacking C001 Carlos Vargas default)
    const currentClients = mockDb.getClients();
    const existing = currentClients.find(c => 
      c.celular === cleanCell && 
      (c.nombre.toLowerCase().trim() === req.cliente_nombre.toLowerCase().trim() && c.id !== 'C001')
    );
    let targetClient: Client;

    if (existing) {
      targetClient = {
        ...existing,
        usuario_acceso: existing.usuario_acceso || creds.usuario_acceso,
        password_acceso: existing.password_acceso || creds.password_acceso,
        usuario_habilitado: true,
        acceso_bloqueado: false
      };
      const updatedClients = currentClients.map(c => c.id === existing.id ? targetClient : c);
      mockDb.saveClients(updatedClients);
    } else {
      const newClientData: Omit<Client, 'id' | 'fecha_registro' | 'fecha_actualizacion'> = {
        nombre: req.cliente_nombre.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        empresa: req.cliente_empresa || '',
        celular: cleanCell,
        correo: req.cliente_correo || '',
        ciudad: req.cliente_ciudad || 'Santa Cruz',
        departamento: req.cliente_ciudad || 'Santa Cruz',
        pais: 'Bolivia',
        presupuesto_usd: req.presupuesto_estimado_usd || 1500,
        observaciones: req.sugerencia_cotizacion 
          ? `Solicitud web (${req.codigo}): ${req.sugerencia_cotizacion}`
          : `Cliente aceptado desde solicitud de registro web (${req.codigo}).`,
        estado: 'Interesado' as const,
        campania: 'Registro Web / Formulario',
        usuario_acceso: creds.usuario_acceso,
        password_acceso: creds.password_acceso,
        usuario_habilitado: true,
        acceso_bloqueado: false
      };

      onAddClient(newClientData);
      
      const refreshedClients = mockDb.getClients();
      targetClient = refreshedClients.find(c => c.celular === cleanCell && c.nombre === req.cliente_nombre.trim()) || {
        ...newClientData,
        id: 'C' + Date.now().toString().slice(-4),
        fecha_registro: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString()
      };
    }

    // Generate formal Quotation record in system for this client request
    try {
      const currentQuotations = mockDb.getQuotations();
      const newQuotation = {
        id: 'Q' + Date.now().toString().slice(-6),
        numero: `PUB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
        cliente_id: targetClient.id,
        vehiculo_id: req.vallas_ids?.[0] || 'V001',
        precio_vehiculo: req.presupuesto_estimado_usd || 1500,
        gastos_importacion: 150,
        gastos_aduana: 100,
        gastos_logistica: 80,
        gastos_seguro: 50,
        total: (req.presupuesto_estimado_usd || 1500) + 380,
        estado: 'Enviada' as const,
        observaciones: `Cotización solicitada desde la Web (${req.codigo}) para ${req.vallas_nombres?.[0] || 'Solución OOH'}. Requerimiento: ${req.sugerencia_cotizacion || 'Consulta de espacios publicitarios'}`,
        fecha: new Date().toISOString()
      };
      mockDb.saveQuotations([newQuotation, ...currentQuotations]);
    } catch (e) {
      console.error('Error generating quotation record:', e);
    }

    // Delete from pending requests so it disappears from this pending inbox
    mockDb.deletePendingRequest(req.id);
    setRequestsList(mockDb.getPendingRequests());
    window.dispatchEvent(new CustomEvent('publix_new_request'));

    onRegisterLog(
      'Aceptar Solicitud Cliente',
      `Se aprobó y creó el cliente oficial ${targetClient.nombre} (${targetClient.celular}) procedente de la solicitud web ${req.codigo}. Usuario: @${targetClient.usuario_acceso} | Clave: ${targetClient.password_acceso}.`
    );

    showToast(`✅ Cliente ${targetClient.nombre} agregado al CRM con usuario @${targetClient.usuario_acceso} y clave generada. Retirado de solicitudes pendientes.`);

    // Show Welcome WhatsApp Popup with Credentials
    const welcomeInfo = generateClientWelcomeMessage(
      targetClient.nombre, 
      targetClient.celular, 
      targetClient.usuario_acceso, 
      targetClient.password_acceso
    );
    setWelcomeClientData({ client: targetClient, welcomeInfo });
  };

  const handleCancelRequest = (id: string) => {
    const allReqs = mockDb.getPendingRequests();
    const target = allReqs.find(r => r.id === id);
    mockDb.deletePendingRequest(id);
    setRequestsList(mockDb.getPendingRequests());
    window.dispatchEvent(new CustomEvent('publix_new_request'));
    onRegisterLog('Desestimar Solicitud Web', `Se desestimó y retiró la solicitud de ${target?.cliente_nombre || id} por ${currentUser.nombre}.`);
    showToast(`Solicitud ${target?.codigo || id} desestimada y retirada del buzón.`, 'info');
  };

  const handleDeleteRequest = (id: string) => {
    const allReqs = mockDb.getPendingRequests();
    const target = allReqs.find(r => r.id === id);
    mockDb.deletePendingRequest(id);
    setRequestsList(mockDb.getPendingRequests());
    window.dispatchEvent(new CustomEvent('publix_new_request'));
    onRegisterLog('Eliminar Solicitud Web', `Se eliminó definitivamente la solicitud de ${target?.cliente_nombre || id} por ${currentUser.nombre}.`);
    showToast(`Solicitud ${target?.codigo || id} eliminada permanentemente del buzón.`, 'info');
  };

  const handleClearAllRequests = () => {
    mockDb.clearPendingRequests();
    setRequestsList([]);
    window.dispatchEvent(new CustomEvent('publix_new_request'));
    onRegisterLog('Vaciar Buzón Solicitudes', `Se limpió todo el buzón de solicitudes web por ${currentUser.nombre}.`);
    showToast('Buzón de solicitudes vaciado por completo.', 'info');
  };

  // Filter & search logic
  const filteredRequests = requestsList.filter(req => {
    const q = search.toLowerCase();
    const matchesSearch = 
      req.cliente_nombre.toLowerCase().includes(q) ||
      (req.cliente_empresa && req.cliente_empresa.toLowerCase().includes(q)) ||
      req.cliente_celular.toLowerCase().includes(q) ||
      req.codigo.toLowerCase().includes(q) ||
      (req.cliente_ciudad && req.cliente_ciudad.toLowerCase().includes(q)) ||
      (req.sugerencia_cotizacion && req.sugerencia_cotizacion.toLowerCase().includes(q));

    const matchesFilter = filterState === 'Todos' || req.estado === filterState;

    return matchesSearch && matchesFilter;
  });

  const pendingCount = requestsList.filter(r => r.estado === 'Pendiente').length;
  const approvedCount = requestsList.filter(r => r.estado === 'Cotizado').length;
  const totalBudget = requestsList.reduce((acc, curr) => acc + (curr.presupuesto_estimado_usd || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 rounded-3xl text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <Inbox className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black font-display tracking-tight">Solicitudes de Cotización & Nuevos Clientes Web</h2>
              <p className="text-xs text-slate-300 font-medium">
                Buzón centralizado de consultas de vallas publicitarias y pantallas LED recibidas desde la web. Aceptación y creación de usuarios CRM.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700/80 text-center">
            <span className="block text-[10px] text-amber-400 uppercase font-bold">Pendientes</span>
            <span className="text-lg font-black text-white">{pendingCount}</span>
          </div>

          <div className="bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700/80 text-center">
            <span className="block text-[10px] text-emerald-400 uppercase font-bold">Aprobados CRM</span>
            <span className="text-lg font-black text-white">{approvedCount}</span>
          </div>

          <div className="bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700/80 text-center">
            <span className="block text-[10px] text-indigo-400 uppercase font-bold">Presupuesto Solicitado</span>
            <span className="text-lg font-black text-white">${totalBudget.toLocaleString()} USD</span>
          </div>
        </div>
      </div>

      {/* Security Privilege Banner */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
        isDuenoOrGerente 
          ? 'bg-amber-50 text-amber-950 border-amber-200' 
          : 'bg-rose-50 text-rose-950 border-rose-200'
      }`}>
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {isDuenoOrGerente 
              ? `Sesión Autorizada (${currentUser.rol}): Tienes permisos para revisar sugerencias, inspeccionar fotos referenciales y ACEPTAR nuevos clientes creando sus credenciales.` 
              : `Sesión Vendedor (${currentUser.rol}): Puedes revisar las solicitudes web. La aprobación final de nuevos clientes requiere rol de Dueño o Gerente.`}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={refreshRequests} 
            className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
          >
            Actualizar Buzón
          </button>
          {isDuenoOrGerente && requestsList.length > 0 && (
            <button 
              onClick={handleClearAllRequests} 
              className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-800 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
              title="Vaciar todas las solicitudes de cotización"
            >
              <span>Vaciar Buzón</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between animate-fade-in ${
          actionNotice.type === 'error'
            ? 'bg-rose-50 text-rose-800 border-rose-200'
            : actionNotice.type === 'info'
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          <div className="flex items-center space-x-2">
            <span>{actionNotice.msg}</span>
          </div>
          <button 
            onClick={() => setActionNotice(null)} 
            className="text-gray-400 hover:text-gray-700 text-xs px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, empresa, WhatsApp, código o sugerencias..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500 focus:bg-white transition"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-bold text-gray-500">Estado:</span>
          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            {['Todos', 'Pendiente', 'Cotizado', 'Cancelado'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterState(st)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filterState === st 
                    ? 'bg-amber-500 text-gray-950 shadow-2xs' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requests List Cards */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-3">
            <Inbox className="w-12 h-12 mx-auto text-gray-300" />
            <p className="font-bold text-gray-700 text-sm">No se encontraron solicitudes con los filtros aplicados.</p>
            <p className="text-xs text-gray-400">Las solicitudes registradas desde el portal web o formulario emergente aparecerán aquí en tiempo real.</p>
          </div>
        ) : (
          filteredRequests.map((req) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-3xl border transition-all overflow-hidden ${
                req.estado === 'Pendiente'
                  ? 'border-amber-300 shadow-md ring-1 ring-amber-400/30'
                  : 'border-gray-200/80 shadow-2xs'
              }`}
            >
              {/* Card Header Bar */}
              <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <span className="px-2.5 py-1 bg-amber-500 text-gray-950 font-black text-xs rounded-lg font-mono">
                    {req.codigo}
                  </span>
                  <div>
                    <h3 className="font-bold text-sm leading-tight text-white">{req.cliente_nombre}</h3>
                    <p className="text-xs text-slate-400 font-medium">
                      🏢 {req.cliente_empresa || 'Particular'} • 📍 {req.cliente_ciudad || 'Santa Cruz'} • 📱 {req.cliente_celular}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                    req.estado === 'Pendiente' 
                      ? 'bg-amber-400 text-amber-950 font-extrabold animate-pulse' 
                      : req.estado === 'Cotizado'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}>
                    {req.estado}
                  </span>

                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(req.fecha).toLocaleDateString()} {new Date(req.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Main Content Body */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Col 1: Contact & Device Info */}
                <div className="space-y-3 bg-gray-50/80 p-4 rounded-2xl border border-gray-200/60 text-xs">
                  <span className="font-extrabold text-gray-900 block border-b border-gray-200 pb-1.5 uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span>Contacto del Solicitante</span>
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  </span>

                  <div className="space-y-1.5 text-gray-700">
                    <p className="flex items-center space-x-2 font-medium">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>WhatsApp: <b>{req.cliente_celular}</b></span>
                    </p>
                    {req.cliente_correo && (
                      <p className="flex items-center space-x-2 font-medium truncate">
                        <Mail className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate">Email: {req.cliente_correo}</span>
                      </p>
                    )}
                    <p className="flex items-center space-x-2 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Ubicación: {req.cliente_ciudad || 'Santa Cruz, Bolivia'}</span>
                    </p>
                    {req.dispositivo_detectado && (
                      <p className="flex items-center space-x-2 font-mono text-[10px] text-gray-500 pt-1 border-t border-gray-200">
                        <Laptop className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate" title={req.dispositivo_detectado}>Dispositivo: {req.dispositivo_detectado}</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    <a
                      href={`https://wa.me/${req.cliente_celular.replace(/\+/g, '')}?text=${encodeURIComponent(`Hola ${req.cliente_nombre}, le saludamos de PUBLI-X BOLIVIA en relación a su solicitud de cotización (${req.codigo}).`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Contactar por WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* Col 2: Sugerencias & Requerimientos del Cliente */}
                <div className="space-y-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/60 text-xs">
                  <span className="font-extrabold text-amber-950 block border-b border-amber-200/80 pb-1.5 uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span>Sugerencias & Requerimientos</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  </span>

                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] font-bold text-amber-900 block uppercase">Vallas / Ubicaciones Consultadas:</span>
                      <ul className="list-disc list-inside font-bold text-gray-800 space-y-0.5 pt-0.5">
                        {(req.vallas_nombres || []).map((vName, idx) => (
                          <li key={idx} className="truncate">{vName}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-1">
                      <span className="text-[10px] font-bold text-amber-900 block uppercase">Comentario / Sugerencia del Cliente:</span>
                      <p className="italic text-gray-800 bg-white p-2.5 rounded-xl border border-amber-200 font-medium leading-relaxed mt-1">
                        "{req.sugerencia_cotizacion || req.observaciones || 'Consulta general sobre espacios OOH y pantallas LED.'}"
                      </p>
                    </div>

                    {req.presupuesto_estimado_usd && (
                      <div className="pt-1 flex items-center justify-between font-bold text-emerald-800 bg-emerald-100/60 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <span>Presupuesto Estimado:</span>
                        <span className="text-sm font-black">${req.presupuesto_estimado_usd.toLocaleString()} USD</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Col 3: Fotos Referenciales & Botón Aceptar Cliente */}
                <div className="space-y-3 bg-gray-50/80 p-4 rounded-2xl border border-gray-200/60 text-xs flex flex-col justify-between">
                  <div>
                    <span className="font-extrabold text-gray-900 block border-b border-gray-200 pb-1.5 uppercase tracking-wider text-[11px] flex items-center justify-between">
                      <span>Fotos Referenciales Adjuntas</span>
                      <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                    </span>

                    <div className="pt-2">
                      {(req.imagenes_referencia && req.imagenes_referencia.length > 0) ? (
                        <div className="grid grid-cols-3 gap-2">
                          {req.imagenes_referencia.map((imgUrl, idx) => (
                            <div 
                              key={idx} 
                              onClick={() => setPreviewPhotoUrl(imgUrl)}
                              className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square bg-gray-900 cursor-pointer shadow-2xs hover:border-amber-500 transition"
                            >
                              <img 
                                src={imgUrl} 
                                alt={`Foto ${idx+1}`} 
                                className="w-full h-full object-cover group-hover:scale-110 transition duration-300 opacity-90 group-hover:opacity-100" 
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <Maximize2 className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-white rounded-xl border border-gray-200 text-center text-gray-400 italic">
                          Sin fotos adjuntas.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-gray-200 space-y-2">
                    {req.estado === 'Pendiente' && isDuenoOrGerente && (
                      <button
                        onClick={() => handleAcceptCandidate(req)}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Aceptar Cliente & Crear Usuario CRM</span>
                      </button>
                    )}

                    {req.estado === 'Pendiente' && !isDuenoOrGerente && (
                      <div className="p-2.5 bg-rose-100 text-rose-900 rounded-xl border border-rose-200 text-center font-bold text-[11px] flex items-center justify-center space-x-1.5">
                        <Lock className="w-3.5 h-3.5 text-rose-700" />
                        <span>Solo Dueño o Gerente pueden Aprobar</span>
                      </div>
                    )}

                    {req.estado === 'Cotizado' && (
                      <div className="p-2.5 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 text-center font-bold text-xs flex items-center justify-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Cliente Aceptado e Ingresado por {req.vendedor_asignado || 'Gerencia'}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 pt-1">
                      {req.estado === 'Pendiente' && (
                        <button
                          onClick={() => handleCancelRequest(req.id)}
                          className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] rounded-xl transition text-center cursor-pointer"
                        >
                          Desestimar
                        </button>
                      )}
                      
                      {isDuenoOrGerente && (
                        <button
                          onClick={() => handleDeleteRequest(req.id)}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold text-[11px] rounded-xl transition flex items-center justify-center cursor-pointer"
                          title="Eliminar esta solicitud"
                        >
                          <span>Eliminar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* LIGHTBOX PREVIEW MODAL FOR REFERENCE PHOTOS */}
      <AnimatePresence>
        {previewPhotoUrl && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 bg-slate-950 text-white flex justify-between items-center border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5 text-amber-500" />
                  <span className="font-bold text-sm">Inspección de Fotografía Referencial del Cliente</span>
                </div>
                <button
                  onClick={() => setPreviewPhotoUrl(null)}
                  className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex-1 flex items-center justify-center bg-black/90 overflow-hidden">
                <img 
                  src={previewPhotoUrl} 
                  alt="Vista previa" 
                  className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-2xl border border-slate-800" 
                />
              </div>

              <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
                <button
                  onClick={() => setPreviewPhotoUrl(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver a la Lista</span>
                </button>
                <span className="text-xs text-gray-400">PUBLI-X Bolivia</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP: ACCESO CREADO Y ENVIAR CREDENCIALES POR WHATSAPP */}
      <AnimatePresence>
        {welcomeClientData && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base font-display">¡Cliente Registrado con Éxito!</h3>
                    <p className="text-xs text-emerald-100">Credenciales generadas e ingreso activado en el CRM</p>
                  </div>
                </div>
                <button
                  onClick={() => setWelcomeClientData(null)}
                  className="p-1 text-emerald-200 hover:text-white rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-emerald-900 block uppercase">Credenciales del Cliente</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                      <span className="text-[10px] font-bold text-gray-400 block">USUARIO</span>
                      <span className="font-mono font-extrabold text-emerald-800 text-sm">@{welcomeClientData.client.usuario_acceso}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                      <span className="text-[10px] font-bold text-gray-400 block">CONTRASEÑA</span>
                      <span className="font-mono font-extrabold text-gray-900 text-sm">{welcomeClientData.client.password_acceso}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mensaje de Bienvenida para WhatsApp:</label>
                  <textarea
                    readOnly
                    rows={6}
                    value={welcomeClientData.welcomeInfo}
                    className="w-full p-3 text-xs font-mono bg-gray-50 border border-gray-200 rounded-xl focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => {
                      try {
                        const text = encodeURIComponent(welcomeClientData.welcomeInfo);
                        window.open(`https://wa.me/${welcomeClientData.client.celular.replace(/\+/g, '')}?text=${text}`, '_blank');
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs uppercase transition shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar WhatsApp</span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(welcomeClientData.welcomeInfo);
                      alert('✅ Mensaje de bienvenida copiado al portapapeles.');
                    }}
                    className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-2xl text-xs uppercase transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copiar Texto</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center px-6">
                <button
                  onClick={() => setWelcomeClientData(null)}
                  className="text-xs text-gray-500 font-bold hover:text-gray-800 flex items-center space-x-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver a Solicitudes</span>
                </button>
                <span className="text-[10px] text-gray-400">PUBLI-X Bolivia</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
