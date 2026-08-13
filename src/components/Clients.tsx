import React, { useState, useEffect } from 'react';
import { Client, ClientState, UserSession, PendingQuotationRequest } from '../types';
import { mockDb } from '../data/mockDatabase';
import { generateClientCredentials, generateClientWelcomeMessage } from '../utils/credentials';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  MessageSquare, 
  FileText, 
  AlertCircle, 
  UserPlus, 
  Check, 
  X, 
  History, 
  MapPin, 
  DollarSign, 
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Download,
  Calendar,
  Mail,
  Send,
  Key,
  Copy,
  Lock,
  ExternalLink,
  Inbox,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClientsProps {
  clients: Client[];
  currentUser?: UserSession;
  onAddClient: (client: Omit<Client, 'id' | 'fecha_registro' | 'fecha_actualizacion'>) => boolean;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onSelectClientForWhatsApp: (client: Client) => void;
  onSelectClientForQuote: (client: Client) => void;
  onSelectClientForFollowUp: (client: Client) => void;
  exchangeRate: number;
  clientTimeline: (clientId: string) => any[]; // Function to fetch timeline of events
}

export default function Clients({
  clients,
  currentUser,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onSelectClientForWhatsApp,
  onSelectClientForQuote,
  onSelectClientForFollowUp,
  exchangeRate,
  clientTimeline
}: ClientsProps) {
  const isDuenoOrGerente = currentUser?.rol === 'Dueño' || currentUser?.rol === 'Gerente' || currentUser?.rol === 'Jefe';

  // Pending Requests State
  const [showPendingRequestsModal, setShowPendingRequestsModal] = useState(false);
  const [pendingRequestsList, setPendingRequestsList] = useState<PendingQuotationRequest[]>(() => mockDb.getPendingRequests());
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const refreshPendingRequests = () => {
    setPendingRequestsList(mockDb.getPendingRequests());
  };

  useEffect(() => {
    refreshPendingRequests();
    const handleSync = () => {
      refreshPendingRequests();
    };
    window.addEventListener('publix_new_request', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('publix_new_request', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);
  // Local states
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<'nombre' | 'presupuesto' | 'fecha_registro'>('nombre');
  const [sortOrder, setSortByOrder] = useState<'asc' | 'desc'>('asc');

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [nitCi, setNitCi] = useState('');
  const [nombre, setNombre] = useState('');
  const [celular, setCelular] = useState('');
  const [correo, setCorreo] = useState('');
  const [campania, setCampania] = useState('');
  const [departamento, setDepartamento] = useState('Santa Cruz');
  const [presupuestoUsd, setPresupuestoUsd] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [estado, setEstado] = useState<ClientState>('Nuevo');

  // Detail Modal state
  const [selectedDetailClient, setSelectedDetailClient] = useState<Client | null>(null);
  
  // UI feedback states
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [showConfirmDeleteId, setShowConfirmDeleteId] = useState<string | null>(null);

  // Welcome WhatsApp Modal state
  const [welcomeClientData, setWelcomeClientData] = useState<{ client: Client; welcomeInfo: ReturnType<typeof generateClientWelcomeMessage> } | null>(null);

  const handleAcceptAndSendWelcome = (client: Client) => {
    let u = client.usuario_acceso;
    let p = client.password_acceso;
    if (!u || !p) {
      const creds = generateClientCredentials(client.nombre, client.celular);
      u = creds.usuario_acceso;
      p = creds.password_acceso;
      onUpdateClient({
        ...client,
        usuario_acceso: u,
        password_acceso: p,
        estado: client.estado === 'Nuevo' ? 'Contactado' : client.estado
      });
    } else if (client.estado === 'Nuevo') {
      onUpdateClient({
        ...client,
        estado: 'Contactado'
      });
    }

    const welcomeInfo = generateClientWelcomeMessage(client.nombre, client.celular, u, p);
    setWelcomeClientData({ client, welcomeInfo });
  };

  // Departments & Cities of Bolivia
  const BOLIVIAN_DEPARTMENTS = [
    'Santa Cruz', 'La Paz', 'Cochabamba', 'Tarija', 'Chuquisaca', 'Oruro', 'Potosí', 'Beni', 'Pando'
  ];

  // Handle Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Validations
    if (!nombre.trim()) return setFormError('El nombre completo es obligatorio.');
    if (!celular.trim()) return setFormError('El celular es obligatorio.');
    if (presupuestoUsd && (isNaN(Number(presupuestoUsd)) || Number(presupuestoUsd) < 0)) {
      return setFormError('El presupuesto en USD debe ser un número positivo.');
    }

    // Format phone: "al final se agregue automaticamente el 591 que es el codigo de Bolivia"
    let formattedPhone = celular.trim().replace(/\s+/g, '');
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('591') && formattedPhone.length === 11) {
        formattedPhone = '+' + formattedPhone;
      } else if (formattedPhone.length === 8) {
        formattedPhone = '+591' + formattedPhone; // default bolivian auto prefix
      } else {
        const digitsOnly = formattedPhone.replace(/\D/g, '');
        if (digitsOnly.length === 8) {
          formattedPhone = '+591' + digitsOnly;
        } else if (digitsOnly.length === 11 && digitsOnly.startsWith('591')) {
          formattedPhone = '+' + digitsOnly;
        } else {
          return setFormError('El número celular debe ser de 8 dígitos (ej. 70000000) o incluir el código de país (ej. +59170000000).');
        }
      }
    }

    const parsedPresupuesto = presupuestoUsd ? Number(presupuestoUsd) : 0;

    if (isEditing) {
      // Check duplicate on other clients
      const phoneExists = clients.some(c => c.celular === formattedPhone && c.id !== editId);
      if (phoneExists) {
        return setFormError('Ya existe otro cliente con este número de celular registrado.');
      }

      const original = clients.find(c => c.id === editId);
      if (original) {
        const creds = generateClientCredentials(nombre, formattedPhone);
        onUpdateClient({
          ...original,
          nombre: nombre.trim(),
          empresa: empresa.trim(),
          razon_social: razonSocial.trim(),
          nit_ci: nitCi.trim(),
          celular: formattedPhone,
          ciudad: departamento,
          departamento,
          presupuesto_usd: parsedPresupuesto,
          observaciones: observaciones.trim(),
          estado,
          correo: correo.trim(),
          campania: campania.trim(),
          usuario_acceso: original.usuario_acceso || creds.usuario_acceso,
          password_acceso: original.password_acceso || creds.password_acceso,
          fecha_actualizacion: new Date().toISOString()
        });
        setFormSuccess('Cliente actualizado con éxito.');
        resetForm();
      }
    } else {
      // Add client
      const creds = generateClientCredentials(nombre, formattedPhone);
      const success = onAddClient({
        nombre: nombre.trim(),
        empresa: empresa.trim(),
        razon_social: razonSocial.trim(),
        nit_ci: nitCi.trim(),
        celular: formattedPhone,
        ciudad: departamento,
        departamento,
        pais: 'Bolivia',
        presupuesto_usd: parsedPresupuesto,
        observaciones: observaciones.trim(),
        estado,
        correo: correo.trim(),
        campania: campania.trim(),
        usuario_acceso: creds.usuario_acceso,
        password_acceso: creds.password_acceso
      });

      if (success) {
        setFormSuccess('Cliente registrado con éxito.');
        resetForm();
      } else {
        setFormError('Ya existe un cliente con este número de celular registrado.');
      }
    }
  };

  // Reset form to default
  const resetForm = () => {
    setIsEditing(false);
    setEditId('');
    setEmpresa('');
    setRazonSocial('');
    setNitCi('');
    setNombre('');
    setCelular('');
    setCorreo('');
    setCampania('');
    setDepartamento('Santa Cruz');
    setPresupuestoUsd('');
    setObservaciones('');
    setEstado('Nuevo');
  };

  // Trigger edit mode
  const handleEditClick = (client: Client) => {
    setFormError('');
    setFormSuccess('');
    setIsEditing(true);
    setEditId(client.id);
    setEmpresa(client.empresa || '');
    setRazonSocial(client.razon_social || '');
    setNitCi(client.nit_ci || '');
    setNombre(client.nombre);
    // Strip leading +591 for display in raw input if needed, or leave formatted
    const rawCell = client.celular.startsWith('+591') ? client.celular.substring(4) : client.celular;
    setCelular(rawCell);
    setCorreo(client.correo || '');
    setCampania(client.campania || '');
    setDepartamento(client.departamento || 'Santa Cruz');
    setDepartamento(client.departamento);
    setPresupuestoUsd(String(client.presupuesto_usd));
    setObservaciones(client.observaciones);
    setEstado(client.estado);
  };

  // Direct WhatsApp sending with prefilled message
  const handleDirectWhatsAppSend = (client: Client) => {
    const cleanPhone = client.celular.replace(/\+/g, '');
    const message = `Hola ${client.nombre}, le saluda PUBLI-X BOLIVIA 📢. Vemos que tiene un presupuesto de USD ${client.presupuesto_usd.toLocaleString()} para la difusión de su marca. ¿Qué tipo de Valla Publicitaria o Pantalla LED le gustaría cotizar hoy?`;
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Direct Email sending using mailto
  const handleDirectEmailSend = (client: Client) => {
    if (!client.correo) {
      alert('Este cliente no tiene correo electrónico registrado. Por favor, edite su ficha para agregarlo.');
      return;
    }
    const subject = 'Contacto Comercial - PUBLI-X BOLIVIA 📢';
    const body = `Estimado/a ${client.nombre},\n\nLe escribimos de PUBLI-X BOLIVIA en relación a su interés de vallas publicitarias / pantallas LED registrado en nuestra plataforma.\n\nContamos con un presupuesto registrado de USD ${client.presupuesto_usd.toLocaleString()} para su proyecto. ¿Le gustaría que le preparemos propuestas y opciones exclusivas adaptadas a sus preferencias?\n\nQuedamos a su entera disposición.\n\nAtentamente,\nGerencia Comercial\nPUBLI-X BOLIVIA`;
    const url = `mailto:${client.correo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  };

  // Accept Candidate and create official Client in CRM
  const handleAcceptPendingCandidate = (req: PendingQuotationRequest) => {
    if (!isDuenoOrGerente) {
      alert('⛔ Acceso denegado: Únicamente el usuario con rol de Dueño o Gerente tiene permisos para aceptar el ingreso de nuevos clientes.');
      return;
    }

    const cleanCell = req.cliente_celular.startsWith('+591') ? req.cliente_celular : `+591${req.cliente_celular.replace(/\D/g, '')}`;
    
    // Check if client already exists by phone
    const existing = clients.find(c => c.celular === cleanCell);
    let targetClient: Client;

    if (existing) {
      targetClient = existing;
    } else {
      const creds = generateClientCredentials(req.cliente_nombre, cleanCell);
      const newClientData = {
        nombre: req.cliente_nombre,
        empresa: req.cliente_empresa || '',
        celular: cleanCell,
        correo: req.cliente_correo || '',
        ciudad: req.cliente_ciudad || 'Santa Cruz',
        departamento: 'Santa Cruz',
        pais: 'Bolivia',
        presupuesto_usd: req.presupuesto_estimado_usd || 10000,
        observaciones: req.sugerencia_cotizacion 
          ? `Solicitud web (${req.codigo}): ${req.sugerencia_cotizacion}`
          : `Cliente aceptado desde solicitud de registro web (${req.codigo}).`,
        estado: 'Interesado' as const,
        campania: 'Registro Web',
        usuario_acceso: creds.usuario_acceso,
        password_acceso: creds.password_acceso
      };

      onAddClient(newClientData);
      
      const refreshedClients = mockDb.getClients();
      targetClient = refreshedClients.find(c => c.celular === cleanCell) || {
        ...newClientData,
        id: 'C' + Date.now().toString().slice(-4),
        fecha_registro: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString()
      };
    }

    // Mark request as Cotizado/Atendido in mockDb
    const allReqs = mockDb.getPendingRequests();
    const updatedReqs = allReqs.map(r => r.id === req.id ? { ...r, estado: 'Cotizado' as const, vendedor_asignado: currentUser?.nombre || 'Dueño/Gerente' } : r);
    mockDb.savePendingRequests(updatedReqs);
    setPendingRequestsList(updatedReqs);

    mockDb.addAuditLog(
      currentUser?.nombre || 'Dueño/Gerente',
      'Aceptar Solicitud Cliente',
      `Se aprobó y creó el cliente oficial ${targetClient.nombre} (${targetClient.celular}) procedente de la solicitud web ${req.codigo}.`
    );

    // Show Welcome WhatsApp Popup with Credentials
    const welcomeInfo = generateClientWelcomeMessage(
      targetClient.nombre, 
      targetClient.celular, 
      targetClient.usuario_acceso, 
      targetClient.password_acceso
    );
    setWelcomeClientData({ client: targetClient, welcomeInfo });
  };

  // Filter & Search Logic
  const filteredClients = clients.filter(c => {
    const query = search.toLowerCase();
    const matchesSearch = 
      c.nombre.toLowerCase().includes(query) || 
      c.celular.includes(query) || 
      c.ciudad.toLowerCase().includes(query) ||
      c.observaciones.toLowerCase().includes(query);
    
    const matchesState = filterState === 'Todos' || c.estado === filterState;

    return matchesSearch && matchesState;
  });

  // Sorting
  const sortedClients = [...filteredClients].sort((a, b) => {
    let result = 0;
    if (sortBy === 'nombre') {
      result = a.nombre.localeCompare(b.nombre);
    } else if (sortBy === 'presupuesto') {
      result = a.presupuesto_usd - b.presupuesto_usd;
    } else if (sortBy === 'fecha_registro') {
      result = new Date(a.fecha_registro).getTime() - new Date(b.fecha_registro).getTime();
    }

    return sortOrder === 'asc' ? result : -result;
  });

  // Calculate equivalent in Bolivianos
  const getBobEquivalent = (usd: number) => {
    return (usd * exchangeRate).toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <div className="space-y-6" id="clients-crm-view">
      
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, celular, ciudad u observaciones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center space-x-3">
          {/* Button for Pending Registration Requests */}
          <button
            onClick={() => {
              refreshPendingRequests();
              setShowPendingRequestsModal(true);
            }}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            title="Ver solicitudes y sugerencias de nuevos clientes"
          >
            <Inbox className="w-4 h-4" />
            <span>Solicitudes de Registro ({pendingRequestsList.filter(r => r.estado === 'Pendiente').length})</span>
          </button>

          <label className="text-xs font-semibold text-gray-500">Estado:</label>
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="Todos">Todos los estados</option>
            <option value="Nuevo">Nuevo</option>
            <option value="Contactado">Contactado</option>
            <option value="Interesado">Interesado</option>
            <option value="Cotizado">Cotizado</option>
            <option value="Negociando">Negociando</option>
            <option value="Esperando respuesta">Esperando respuesta</option>
            <option value="Vendido">Vendido</option>
            <option value="Perdido">Perdido</option>
          </select>

          <label className="text-xs font-semibold text-gray-500">Ordenar por:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="nombre">Nombre</option>
            <option value="presupuesto">Presupuesto</option>
            <option value="fecha_registro">Fecha Registro</option>
          </select>

          <button
            onClick={() => setSortByOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200"
          >
            {sortOrder === 'asc' ? 'Ascendente ↑' : 'Descendente ↓'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Side: Form */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs h-fit">
          <div className="flex items-center space-x-2.5 mb-5 pb-3 border-b border-gray-50">
            <UserPlus className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-bold font-display text-gray-800">
              {isEditing ? 'Editar Ficha Cliente' : 'Registrar Nuevo Cliente'}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Form feedback */}
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-lg flex items-center space-x-2 animate-fade-in">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* EMPRESA Y RAZON SOCIAL */}
            <div>
              <label className="block text-xs font-bold text-amber-800 mb-1">Empresa / Nombre Comercial</label>
              <input
                type="text"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                placeholder="Ej. CBN, Entel, Banco Bisa, Cervecería..."
                className="w-full px-3 py-2 text-sm bg-amber-50/50 border border-amber-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
            </div>

            {/* RAZON SOCIAL Y NIT / CI */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Razón Social (Facturación)</label>
                <input
                  type="text"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  placeholder="Ej. Cervecería Boliviana Nacional S.A."
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">NIT / CI</label>
                <input
                  type="text"
                  value={nitCi}
                  onChange={(e) => setNitCi(e.target.value)}
                  placeholder="Ej. 1028374029"
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white transition font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre Completo de Contacto *</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white transition"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Celular (Bolivia) *</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs bg-gray-200 px-1.5 py-0.5 rounded-md">
                    +591
                  </span>
                  <input
                    type="text"
                    value={celular}
                    onChange={(e) => setCelular(e.target.value)}
                    placeholder="70000000"
                    className="w-full pl-16 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white transition font-mono font-bold"
                    required
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5 block">Solo ingrese los 8 dígitos</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Presupuesto USD (Opcional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">$</span>
                  <input
                    type="number"
                    value={presupuestoUsd}
                    onChange={(e) => setPresupuestoUsd(e.target.value)}
                    placeholder="Opcional"
                    className="w-full pl-7 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                </div>
                {presupuestoUsd && !isNaN(Number(presupuestoUsd)) && Number(presupuestoUsd) > 0 && (
                  <span className="block mt-1 text-[10px] text-gray-400 font-medium">
                    Eqv: Bs. {getBobEquivalent(Number(presupuestoUsd))} (T/C {exchangeRate})
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Departamento *</label>
                <select
                  value={departamento}
                  onChange={(e) => setDepartamento(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white transition font-medium"
                >
                  {BOLIVIAN_DEPARTMENTS.map((dep, i) => (
                    <option key={i} value={dep}>{dep}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Estado Comercial *</label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as ClientState)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white transition"
                >
                  <option value="Nuevo">Nuevo</option>
                  <option value="Contactado">Contactado</option>
                  <option value="Interesado">Interesado</option>
                  <option value="Cotizado">Cotizado</option>
                  <option value="Negociando">Negociando</option>
                  <option value="Esperando respuesta">Esperando respuesta</option>
                  <option value="Vendido">Vendido</option>
                  <option value="Perdido">Perdido</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Campaña / Origen</label>
                <input
                  type="text"
                  value={campania}
                  onChange={(e) => setCampania(e.target.value)}
                  placeholder="Ej. Facebook Ads, Feria"
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  list="campaign-suggestions"
                />
                <datalist id="campaign-suggestions">
                  <option value="Facebook Ads" />
                  <option value="Instagram Ads" />
                  <option value="Google Search" />
                  <option value="Tiktok" />
                  <option value="Feria Exposición" />
                  <option value="Recomendación" />
                  <option value="Página Web" />
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Observaciones / Requerimientos</label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej. Interesado en una pickup para trabajo, doble cabina..."
                rows={3}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white transition resize-none"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-amber-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-amber-600 active:bg-amber-700 transition text-sm shadow-xs flex items-center justify-center space-x-1.5"
              >
                <span>{isEditing ? 'Guardar Cambios' : 'Registrar Cliente'}</span>
              </button>
              {(isEditing || nombre || celular) && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-lg transition text-sm"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Side: List Table */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs xl:col-span-2 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-50">
            <h3 className="text-base font-bold font-display text-gray-800">
              Cartera de Clientes ({filteredClients.length} de {clients.length})
            </h3>
            <span className="text-xs text-gray-400 font-medium">Lista de clientes registrados</span>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-[10px] font-semibold uppercase tracking-wider bg-gray-50/50">
                  <th className="py-2 px-2 font-semibold">Cliente / Contacto</th>
                  <th className="py-2 px-1.5 font-semibold">Ubicación</th>
                  <th className="py-2 px-1.5 font-semibold">Presupuesto</th>
                  <th className="py-2 px-1.5 font-semibold">Estado</th>
                  <th className="py-2 px-1.5 font-semibold text-center">Acciones Comerciales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedClients.length > 0 ? (
                  sortedClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-2 px-2">
                        <div className="space-y-0.5 max-w-[200px]">
                          {client.empresa && (
                            <div className="inline-block px-1.5 py-0.2 bg-amber-50 text-amber-900 border border-amber-200 rounded text-[9px] font-extrabold uppercase tracking-wide truncate max-w-full">
                              🏢 {client.empresa}
                            </div>
                          )}
                          {client.razon_social && (
                            <div className="text-[10px] font-bold text-slate-700 truncate">
                              R.S.: {client.razon_social}
                            </div>
                          )}
                          <div className="flex items-center flex-wrap gap-1">
                            <span className="font-semibold text-gray-800 text-xs">{client.nombre}</span>
                            {client.campania && (
                              <span className="px-1 py-0.2 bg-amber-100 text-amber-800 text-[8px] rounded-full font-bold border border-amber-200">
                                {client.campania}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col text-[11px] text-gray-500 space-y-0.2">
                            <span className="font-mono text-indigo-500 font-semibold">{client.celular}</span>
                            {client.correo ? (
                              <span className="text-gray-500 font-mono text-[10px] truncate max-w-[180px]" title={client.correo}>
                                {client.correo}
                              </span>
                            ) : (
                              <span className="text-gray-300 italic text-[9px]">Sin correo</span>
                            )}
                          </div>
                          {/* Generated Credentials Badge */}
                          <div className="mt-0.5 bg-amber-50/80 border border-amber-200 px-1.5 py-0.5 rounded-md flex items-center justify-between text-[9px] font-mono">
                            <span className="text-amber-900 font-bold flex items-center gap-0.5">
                              <Key className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                              <span>U: <strong className="text-gray-900">{client.usuario_acceso || generateClientCredentials(client.nombre, client.celular).usuario_acceso}</strong></span>
                            </span>
                            <span className="text-gray-600 font-bold ml-1">
                              P: <span className="text-amber-800">{client.password_acceso || generateClientCredentials(client.nombre, client.celular).password_acceso}</span>
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-1.5 whitespace-nowrap">
                        <div className="flex items-center space-x-1 text-[11px] text-gray-600 font-semibold">
                          <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                          <span>{client.departamento}</span>
                        </div>
                      </td>
                      <td className="py-2 px-1.5 whitespace-nowrap">
                        <div>
                          {client.presupuesto_usd > 0 ? (
                            <>
                              <p className="text-xs font-bold text-gray-800">${client.presupuesto_usd.toLocaleString()}</p>
                              <p className="text-[9px] text-gray-400 font-medium">Bs. {getBobEquivalent(client.presupuesto_usd)}</p>
                            </>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic font-medium">Sin definir</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-1.5 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          client.estado === 'Nuevo' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                          client.estado === 'Contactado' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                          client.estado === 'Interesado' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          client.estado === 'Cotizado' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                          client.estado === 'Negociando' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                          client.estado === 'Vendido' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          client.estado === 'Perdido' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                          'bg-gray-50 text-gray-600 border border-gray-100'
                        }`}>
                          {client.estado}
                        </span>
                      </td>
                      <td className="py-2 px-1.5">
                        <div className="flex items-center justify-center flex-wrap gap-1">
                          
                          {/* Aceptar Cliente & Enviar Accesos WhatsApp */}
                          <button
                            onClick={() => handleAcceptAndSendWelcome(client)}
                            className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-black text-[9px] uppercase transition shadow-2xs flex items-center space-x-0.5 cursor-pointer whitespace-nowrap"
                            title="Aceptar Cliente y Enviar Bienvenida WhatsApp con Usuario y PIN/Clave"
                          >
                            <Check className="w-3 h-3" />
                            <span>Aceptar</span>
                          </button>

                          {/* Details Icon */}
                          <button
                            onClick={() => setSelectedDetailClient(client)}
                            className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                            title="Ver Historial y Timeline"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Icon */}
                          <button
                            onClick={() => handleEditClick(client)}
                            className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition"
                            title="Editar Datos"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* WhatsApp AutoGenerator */}
                          <button
                            onClick={() => onSelectClientForWhatsApp(client)}
                            className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
                            title="Generar Mensaje WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Direct WhatsApp Envío Automático */}
                          <button
                            onClick={() => handleDirectWhatsAppSend(client)}
                            className="p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded transition"
                            title="Envío Automático WhatsApp Directo"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          {/* Direct Email Envío Automático */}
                          <button
                            onClick={() => handleDirectEmailSend(client)}
                            className={`p-1 rounded transition ${
                              client.correo 
                                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200' 
                                : 'bg-gray-50 text-gray-300 border border-gray-100 cursor-not-allowed'
                            }`}
                            disabled={!client.correo}
                            title={client.correo ? "Envío Automático Correo Directo" : "Sin correo registrado"}
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          {/* Create Cotizacion */}
                          <button
                            onClick={() => onSelectClientForQuote(client)}
                            className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition"
                            title="Generar Cotización PDF"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Action with verification */}
                          {showConfirmDeleteId === client.id ? (
                            <div className="flex items-center space-x-1 animate-fade-in">
                              <button
                                onClick={() => {
                                  onDeleteClient(client.id);
                                  setShowConfirmDeleteId(null);
                                }}
                                className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold"
                              >
                                Sí
                              </button>
                              <button
                                onClick={() => setShowConfirmDeleteId(null)}
                                className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-[10px]"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowConfirmDeleteId(client.id)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Eliminar Cliente (Lógica)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-400 text-xs">
                      No se encontraron clientes que coincidan con los filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-50 text-xs text-gray-400 flex justify-between">
            <span>Bolivian Concesionario Oficial Database SQLite</span>
            <span>Total: {clients.length} clientes</span>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL WITH TIMELINE HISTORY (CRITICAL SPEC REQUIREMENT) */}
      <AnimatePresence>
        {selectedDetailClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="bg-gray-950 text-white p-5 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold font-display">
                    {selectedDetailClient.nombre[0]}
                  </div>
                  <div>
                    <h3 className="font-bold font-display text-base leading-tight">{selectedDetailClient.nombre}</h3>
                    <p className="text-xs text-gray-400">{selectedDetailClient.celular} • {selectedDetailClient.departamento} {selectedDetailClient.razon_social ? `• R.S.: ${selectedDetailClient.razon_social}` : ''}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedDetailClient(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                
                {/* GENERATED CLIENT CREDENTIALS PANEL */}
                <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
                      <Key className="w-4 h-4 text-amber-600" />
                      <span>ACCESO AUTOMÁTICO AL CATÁLOGO PARA CLIENTE</span>
                    </div>
                    <span className="text-[10px] font-extrabold bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full uppercase">
                      Credenciales Invitado
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="bg-white p-3 rounded-xl border border-amber-200/80 flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 block uppercase">Usuario Asignado (Nombre + Apellido)</span>
                        <span className="text-sm font-mono font-extrabold text-amber-700">
                          @{selectedDetailClient.usuario_acceso || generateClientCredentials(selectedDetailClient.nombre, selectedDetailClient.celular).usuario_acceso}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded-xl border border-amber-200/80 flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 block uppercase">Contraseña Generada (Celular sin +591)</span>
                        <span className="text-sm font-mono font-extrabold text-gray-900">
                          {selectedDetailClient.password_acceso || generateClientCredentials(selectedDetailClient.nombre, selectedDetailClient.celular).password_acceso}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        const u = selectedDetailClient.usuario_acceso || generateClientCredentials(selectedDetailClient.nombre, selectedDetailClient.celular).usuario_acceso;
                        const p = selectedDetailClient.password_acceso || generateClientCredentials(selectedDetailClient.nombre, selectedDetailClient.celular).password_acceso;
                        navigator.clipboard.writeText(`Catálogo PUBLI-X BOLIVIA:\nUsuario: ${u}\nContraseña: ${p}`);
                        alert('✅ Credenciales copiadas al portapapeles.');
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer transition shadow-2xs"
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-700" />
                      <span>Copiar Credenciales</span>
                    </button>

                    <button
                      onClick={() => {
                        const u = selectedDetailClient.usuario_acceso || generateClientCredentials(selectedDetailClient.nombre, selectedDetailClient.celular).usuario_acceso;
                        const p = selectedDetailClient.password_acceso || generateClientCredentials(selectedDetailClient.nombre, selectedDetailClient.celular).password_acceso;
                        const msg = encodeURIComponent(`Hola ${selectedDetailClient.nombre}, le compartimos sus datos de acceso para ingresar a nuestro Catálogo Exclusivo de Vallas Publicitarias y Pantallas LED:\n\n👤 *Usuario:* ${u}\n🔑 *Contraseña:* ${p}\n\nPuede explorar las ubicaciones disponibles en línea.`);
                        window.open(`https://wa.me/${selectedDetailClient.celular.replace(/\+/g, '')}?text=${msg}`, '_blank');
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl flex items-center space-x-1.5 cursor-pointer transition shadow-2xs uppercase tracking-wider"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar Credenciales por WhatsApp</span>
                    </button>
                  </div>

                  {/* ACCESS STATUS TOGGLE CONTROL (ADMINISTRADOR / DUEÑO) */}
                  <div className="mt-3 pt-3 border-t border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-extrabold text-gray-700 uppercase">Estado de Ingreso a Plataforma:</span>
                      {selectedDetailClient.usuario_habilitado !== false ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>ACCESO HABILITADO</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center space-x-1">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          <span>ACCESO DESHABILITADO / BLOQUEADO</span>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        const isCurrentlyEnabled = selectedDetailClient.usuario_habilitado !== false;
                        const newStatus = !isCurrentlyEnabled;
                        
                        const updated = {
                          ...selectedDetailClient,
                          usuario_habilitado: newStatus,
                          acceso_bloqueado: !newStatus
                        };

                        onUpdateClient(updated);
                        setSelectedDetailClient(updated);
                        mockDb.addAuditLog(
                          currentUser?.nombre || 'Administrador',
                          'Control Acceso Cliente',
                          `El administrador ${newStatus ? 'HABILITÓ' : 'DESHABILITÓ/RESTRINGIÓ'} el acceso a la plataforma para el cliente ${selectedDetailClient.nombre}.`
                        );

                        alert(`✅ Acceso de ${selectedDetailClient.nombre} ${newStatus ? 'HABILITADO con éxito' : 'DESHABILITADO / BLOQUEADO con éxito'}.`);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-2xs ${
                        selectedDetailClient.usuario_habilitado !== false
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                      title="Habilitar o restringir el inicio de sesión del cliente a la plataforma"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>
                        {selectedDetailClient.usuario_habilitado !== false
                          ? 'Deshabilitar Acceso del Cliente'
                          : 'Habilitar Acceso a Plataforma'}
                      </span>
                    </button>
                  </div>
                </div>
                
                {/* Specs cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                    <p className="text-[10px] uppercase font-semibold text-gray-400">Presupuesto</p>
                    <p className="font-bold text-gray-800 text-sm">${selectedDetailClient.presupuesto_usd.toLocaleString()} USD</p>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                    <p className="text-[10px] uppercase font-semibold text-gray-400">Equivalente</p>
                    <p className="font-bold text-gray-800 text-sm">Bs. {getBobEquivalent(selectedDetailClient.presupuesto_usd)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                    <p className="text-[10px] uppercase font-semibold text-gray-400">Estado CRM</p>
                    <p className="font-bold text-indigo-600 text-xs mt-1">{selectedDetailClient.estado}</p>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                    <p className="text-[10px] uppercase font-semibold text-gray-400">Campaña / Origen</p>
                    <p className="font-bold text-amber-700 text-xs mt-1 truncate" title={selectedDetailClient.campania || 'Orgánico'}>{selectedDetailClient.campania || 'Orgánico'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg col-span-2 md:col-span-1 lg:col-span-1">
                    <p className="text-[10px] uppercase font-semibold text-gray-400">Correo Electrónico</p>
                    <p className="font-semibold text-gray-700 text-xs mt-1 truncate" title={selectedDetailClient.correo || 'Sin registrar'}>{selectedDetailClient.correo || 'Sin registrar'}</p>
                  </div>
                </div>

                {/* Observations */}
                {selectedDetailClient.observaciones && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Observaciones / Perfil Comercial</h4>
                    <p className="text-sm text-gray-700 bg-amber-50/55 p-3 rounded-lg border border-amber-100/50 leading-relaxed italic">
                      "{selectedDetailClient.observaciones}"
                    </p>
                  </div>
                )}

                {/* Chronological Timeline */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <History className="w-4 h-4" />
                      <span>Línea de Tiempo y Trazabilidad</span>
                    </h4>
                    <span className="text-[10px] text-gray-400">Orden cronológico</span>
                  </div>

                  <div className="relative border-l border-gray-200 ml-3 pl-5 space-y-4">
                    {clientTimeline(selectedDetailClient.id).length > 0 ? (
                      clientTimeline(selectedDetailClient.id).map((event, idx) => (
                        <div key={idx} className="relative">
                          {/* Dot indicator */}
                          <span className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white shadow-2xs" />
                          
                          <div className="space-y-0.5">
                            <div className="flex justify-between text-[10px] text-gray-400">
                              <span className="font-semibold text-gray-700">{event.title || event.accion}</span>
                              <span>{new Date(event.fecha).toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-gray-600 leading-normal">{event.description || event.detalle}</p>
                            {event.vendedor && (
                              <p className="text-[9px] text-indigo-500 font-semibold">Responsable: {event.vendedor}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="relative">
                        <span className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full bg-gray-300 border border-white" />
                        <div className="space-y-0.5">
                          <p className="text-xs text-gray-400">No se registran actividades previas adicionales. Se precargó el registro base del cliente.</p>
                          <span className="text-[10px] text-gray-400">{new Date(selectedDetailClient.fecha_registro).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick actions in modal footer */}
                <div className="pt-4 border-t border-gray-50 flex flex-col space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleDirectWhatsAppSend(selectedDetailClient)}
                      className="flex-1 min-w-[130px] bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xs transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>WhatsApp Directo</span>
                    </button>

                    <button
                      onClick={() => handleDirectEmailSend(selectedDetailClient)}
                      className={`flex-1 min-w-[130px] py-2 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xs transition ${
                        selectedDetailClient.correo 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                      }`}
                      disabled={!selectedDetailClient.correo}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Correo Directo</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        onSelectClientForWhatsApp(selectedDetailClient);
                        setSelectedDetailClient(null);
                      }}
                      className="flex-1 min-w-[110px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 py-2 rounded-lg font-semibold text-xs border border-emerald-100 flex items-center justify-center space-x-1.5 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Plantilla WA</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectClientForQuote(selectedDetailClient);
                        setSelectedDetailClient(null);
                      }}
                      className="flex-1 min-w-[110px] bg-purple-50 text-purple-700 hover:bg-purple-100 py-2 rounded-lg font-semibold text-xs border border-purple-100 flex items-center justify-center space-x-1.5 transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Cotizar PDF</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectClientForFollowUp(selectedDetailClient);
                        setSelectedDetailClient(null);
                      }}
                      className="flex-1 min-w-[110px] bg-rose-50 text-rose-700 hover:bg-rose-100 py-2 rounded-lg font-semibold text-xs border border-rose-100 flex items-center justify-center space-x-1.5 transition"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Seguimiento</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WELCOME WHATSAPP MODAL WITH CREDENTIALS */}
      <AnimatePresence>
        {welcomeClientData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-emerald-200 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base uppercase font-display">Aceptar Cliente & Enviar Accesos</h3>
                    <p className="text-xs text-emerald-100">Bienvenida oficial PUBLI-X con PIN / Clave</p>
                  </div>
                </div>
                <button 
                  onClick={() => setWelcomeClientData(null)}
                  className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 text-xs text-gray-700">
                
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-900 text-sm">{welcomeClientData.client.nombre}</span>
                    <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full uppercase">
                      {welcomeClientData.client.empresa || 'Cliente Registrado'}
                    </span>
                  </div>
                  <p className="text-emerald-800 font-semibold">📱 WhatsApp: {welcomeClientData.client.celular}</p>
                </div>

                {/* Credentials box */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 border border-slate-700 font-mono">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Credenciales Generadas para el Portal:</div>
                  <div className="flex justify-between items-center bg-slate-800/80 px-3 py-2 rounded-xl text-xs">
                    <span className="text-gray-400">Usuario de Acceso:</span>
                    <span className="font-bold text-amber-400">{welcomeClientData.welcomeInfo.usuario}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-800/80 px-3 py-2 rounded-xl text-xs">
                    <span className="text-gray-400">PIN / Clave de Acceso:</span>
                    <span className="font-bold text-emerald-400">{welcomeClientData.welcomeInfo.password}</span>
                  </div>
                </div>

                {/* Message Preview */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Vista Previa del Mensaje de Bienvenida WhatsApp:</label>
                  <textarea
                    readOnly
                    value={welcomeClientData.welcomeInfo.message}
                    rows={8}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-[11px] font-mono leading-relaxed text-gray-800 focus:outline-none"
                  />
                </div>

                {/* Action buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      window.open(welcomeClientData.welcomeInfo.waUrl, '_blank');
                      setWelcomeClientData(null);
                    }}
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs uppercase transition shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar WhatsApp de Bienvenida</span>
                  </button>
                  <button
                    onClick={() => setWelcomeClientData(null)}
                    className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-xs uppercase transition cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver atrás</span>
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: SOLICITUDES Y SUGERENCIAS DE NUEVOS CLIENTES (SOLO DUEÑO Y GERENTE PUEDEN ACEPTAR) */}
      <AnimatePresence>
        {showPendingRequestsModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="bg-slate-900 text-white p-5 flex justify-between items-center border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowPendingRequestsModal(false)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-xl transition flex items-center space-x-1 text-xs font-bold mr-1 cursor-pointer"
                    title="Volver atrás"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Volver atrás</span>
                  </button>
                  <div>
                    <div className="flex items-center space-x-2">
                      <Inbox className="w-5 h-5 text-amber-500" />
                      <h3 className="font-extrabold text-base font-display">Solicitudes y Registro de Nuevos Clientes</h3>
                    </div>
                    <p className="text-xs text-gray-400">
                      Buzón de personas que han solicitado ingreso o cotización desde la web. Aprobación exclusiva de Dueño / Gerente.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-bold px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">
                    {pendingRequestsList.filter(r => r.estado === 'Pendiente').length} Pendiente(s)
                  </span>
                  <button
                    onClick={() => setShowPendingRequestsModal(false)}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Security Banner */}
              <div className={`px-5 py-3 text-xs flex items-center justify-between border-b ${
                isDuenoOrGerente 
                  ? 'bg-amber-50 text-amber-900 border-amber-100' 
                  : 'bg-rose-50 text-rose-900 border-rose-100'
              }`}>
                <div className="flex items-center space-x-2 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    {isDuenoOrGerente 
                      ? `Modo Administrador Activo (${currentUser?.rol || 'Dueño'}): Tienes permisos autorizados para Aceptar nuevos clientes y generar sus credenciales.` 
                      : `Modo Restringido (${currentUser?.rol || 'Vendedor'}): Solamente el Dueño o Gerente pueden autorizar y aceptar el ingreso de nuevos clientes.`}
                  </span>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {pendingRequestsList.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 space-y-2">
                    <Inbox className="w-12 h-12 mx-auto text-gray-300" />
                    <p className="font-bold text-sm">No hay solicitudes pendientes en el buzón.</p>
                    <p className="text-xs text-gray-400">Las solicitudes registradas desde el portal web o formulario aparecerán en esta sección.</p>
                  </div>
                ) : (
                  pendingRequestsList.map((req) => (
                    <div 
                      key={req.id} 
                      className={`p-5 rounded-2xl border transition-all ${
                        req.estado === 'Pendiente'
                          ? 'bg-amber-50/40 border-amber-200/80 shadow-2xs'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-gray-200/60">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-gray-900 text-sm">{req.cliente_nombre}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-900 text-white rounded-md">
                              {req.codigo}
                            </span>
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                              req.estado === 'Pendiente' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900'
                            }`}>
                              {req.estado}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            🏢 <b>{req.cliente_empresa || 'Empresa No Especificada'}</b> • 📱 {req.cliente_celular} {req.cliente_correo ? `• ✉️ ${req.cliente_correo}` : ''} • 📍 {req.cliente_ciudad || 'Santa Cruz'}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-2">
                          {req.estado === 'Pendiente' && isDuenoOrGerente && (
                            <button
                              onClick={() => handleAcceptPendingCandidate(req)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition text-xs shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 cursor-pointer uppercase tracking-wider"
                            >
                              <Check className="w-4 h-4" />
                              <span>Aceptar Cliente & Dar Acceso</span>
                            </button>
                          )}

                          {req.estado === 'Pendiente' && !isDuenoOrGerente && (
                            <div className="px-3 py-1.5 bg-rose-100 text-rose-800 text-[11px] font-bold rounded-xl border border-rose-200 flex items-center space-x-1">
                              <Lock className="w-3.5 h-3.5" />
                              <span>Aprobación Solo Dueño/Gerente</span>
                            </div>
                          )}

                          {req.estado !== 'Pendiente' && (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                              ✅ Aceptado por {req.vendedor_asignado || 'Gerencia'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 text-xs">
                        {/* Selected Billboards / Spaces */}
                        <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-1">
                          <span className="font-extrabold text-amber-900 block text-[11px]">📢 Espacios / Vallas Solicitadas:</span>
                          {(req.vallas_nombres && req.vallas_nombres.length > 0) ? (
                            <ul className="list-disc list-inside text-gray-700 space-y-0.5 font-medium">
                              {req.vallas_nombres.map((vn, idx) => (
                                <li key={idx} className="truncate">{vn}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-400 italic">Interés general en catálogo OOH.</p>
                          )}
                        </div>

                        {/* Custom suggestions & specs */}
                        <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-1">
                          <span className="font-extrabold text-gray-800 block text-[11px]">💬 Sugerencia / Requerimientos Específicos:</span>
                          <p className="text-gray-700 italic font-medium">
                            "{req.sugerencia_cotizacion || req.observaciones || 'Sin observaciones adicionales'}"
                          </p>
                          {req.presupuesto_estimado_usd && (
                            <p className="text-emerald-700 font-bold pt-1">
                              Presupuesto Estimado: ${req.presupuesto_estimado_usd.toLocaleString()} USD
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Attached Reference Photos Gallery */}
                      {req.imagenes_referencia && req.imagenes_referencia.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <span className="font-extrabold text-amber-900 block text-[11px] mb-2">
                            📸 Fotografías de Referencia Adjuntas ({req.imagenes_referencia.length}):
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {req.imagenes_referencia.map((imgUrl, idx) => (
                              <div
                                key={idx}
                                onClick={() => setPreviewPhotoUrl(imgUrl)}
                                className="w-16 h-16 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-amber-500 cursor-pointer transition transform hover:scale-105 shadow-sm bg-gray-900"
                              >
                                <img src={imgUrl} alt={`Foto ${idx+1}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Modal Footer with Back Button */}
              <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between items-center">
                <button
                  onClick={() => setShowPendingRequestsModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver atrás</span>
                </button>
                <span className="text-xs text-gray-400">PUBLI-X Bolivia • Control de Registro de Clientes</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox for reference photos */}
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
                <span className="font-bold text-sm">Inspección de Fotografía Referencial</span>
                <button
                  onClick={() => setPreviewPhotoUrl(null)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 flex-1 flex items-center justify-center bg-black overflow-auto">
                <img src={previewPhotoUrl} alt="Foto Referencial" className="max-h-[70vh] w-auto object-contain rounded-xl" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
