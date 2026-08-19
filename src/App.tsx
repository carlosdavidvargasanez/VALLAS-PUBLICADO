import React, { useState, useEffect } from 'react';
import { mockDb } from './data/mockDatabase';
import { Client, Vehicle, Quotation, Contract, Invoice, FollowUp, MessageTemplate, AuditLog, Settings, UserSession, QuotationState, ContractStatus, FollowUpState } from './types';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Vehicles from './components/Vehicles';
import Recommendation from './components/Recommendation';
import WhatsAppSender from './components/WhatsAppSender';
import Quotations from './components/Quotations';
import Contracts from './components/Contracts';
import Invoices from './components/Invoices';
import DocumentManager from './components/DocumentManager';
import Agenda from './components/Agenda';
import ImportExport from './components/ImportExport';
import AuditLogs from './components/AuditLogs';
import SettingsConfig from './components/SettingsConfig';
import PendingRequestsManager from './components/PendingRequestsManager';
import LoginModal from './components/LoginModal';
import LandingPage from './components/LandingPage';
import Logo from './components/Logo';

import { 
  Users, 
  Presentation, 
  FileText, 
  FileCheck,
  Receipt,
  MessageSquare, 
  Calendar, 
  ShieldCheck, 
  Sliders, 
  Database, 
  LogOut, 
  User, 
  ChevronRight, 
  ChevronDown,
  Menu, 
  X,
  Compass,
  ArrowRight,
  Sparkles,
  RefreshCw,
  FolderSync,
  UserPlus,
  Shield,
  Home,
  Inbox,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Global persistent states loaded from simulated SQLite (localStorage)
  const [clients, setClients] = useState<Client[]>(() => mockDb.getClients());
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => mockDb.getVehicles());
  const [quotations, setQuotations] = useState<Quotation[]>(() => mockDb.getQuotations());
  const [contracts, setContracts] = useState<Contract[]>(() => mockDb.getContracts());
  const [invoices, setInvoices] = useState<Invoice[]>(() => mockDb.getInvoices());
  const [followUps, setFollowUps] = useState<FollowUp[]>(() => mockDb.getFollowUps());
  const [templates, setTemplates] = useState<MessageTemplate[]>(() => mockDb.getTemplates());
  const [settings, setSettings] = useState<Settings>(() => mockDb.getSettings());
  const [users, setUsers] = useState<UserSession[]>(() => mockDb.getUsers());
  const [currentUser, setCurrentUser] = useState<UserSession>(() => mockDb.getCurrentUser());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => mockDb.getAuditLogs());
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(() => {
    return mockDb.getPendingRequests().filter(r => r.estado === 'Pendiente').length;
  });

  // Selected Active Navigation Tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Selected commercial context states across tabs (extremely premium convenience)
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);

  // Authentication & Landing state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('publix_is_logged_in') === 'true';
  });

  // Responsive Sidebar Menu for mobile & Top User Switcher
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [initialCategoryFilter, setInitialCategoryFilter] = useState<string>('Todos');

  // Load all initial data from local SQLite simulator on startup and check auto-backup
  useEffect(() => {
    mockDb.initialize();
    loadAllStates();

    // Trigger asynchronous sync with PostgreSQL server
    mockDb.syncWithServer().then(synced => {
      if (synced) {
        loadAllStates();
      }
    });

    // Check and trigger auto backup if due
    try {
      const currentSettings = mockDb.getSettings();
      const autoEnabled = currentSettings.backup_auto_enabled ?? true;
      const intervalHours = currentSettings.backup_interval_hours ?? 24;
      const lastBackupIso = mockDb.getLastBackupTimestamp();
      
      const lastBackupDate = new Date(lastBackupIso).getTime();
      const now = Date.now();
      const elapsedHours = (now - lastBackupDate) / (1000 * 60 * 60);

      // Create snapshot if never created or if interval elapsed
      if (autoEnabled && (elapsedHours >= intervalHours || mockDb.getAutoBackups().length === 0)) {
        mockDb.createAutoBackup(`Respaldo automático programado (Ciclo cada ${intervalHours}h)`);
      }
    } catch (e) {
      console.warn('Auto backup check:', e);
    }

    const handleSyncRequests = () => {
      setPendingRequestsCount(mockDb.getPendingRequests().filter(r => r.estado === 'Pendiente').length);
      setQuotations(mockDb.getQuotations());
      setClients(mockDb.getClients());
      setContracts(mockDb.getContracts());
      setInvoices(mockDb.getInvoices());
      setVehicles(mockDb.getVehicles());
    };

    const handleDbSynced = () => {
      loadAllStates();
    };

    // Periodic interval to check auto backup every 15 minutes while app is running
    const backupInterval = setInterval(() => {
      try {
        const currentSettings = mockDb.getSettings();
        const autoEnabled = currentSettings.backup_auto_enabled ?? true;
        const intervalHours = currentSettings.backup_interval_hours ?? 24;
        const lastBackupIso = mockDb.getLastBackupTimestamp();
        const elapsedHours = (Date.now() - new Date(lastBackupIso).getTime()) / (1000 * 60 * 60);

        if (autoEnabled && elapsedHours >= intervalHours) {
          mockDb.createAutoBackup(`Respaldo periódico automático (${intervalHours}h)`);
        }
      } catch (e) {
        console.warn('Periodic backup trigger error:', e);
      }
    }, 15 * 60 * 1000);

    window.addEventListener('publix_new_request', handleSyncRequests);
    window.addEventListener('publix_db_synced', handleDbSynced);
    window.addEventListener('storage', handleSyncRequests);
    return () => {
      clearInterval(backupInterval);
      window.removeEventListener('publix_new_request', handleSyncRequests);
      window.removeEventListener('publix_db_synced', handleDbSynced);
      window.removeEventListener('storage', handleSyncRequests);
    };
  }, []);

  const loadAllStates = () => {
    setClients(mockDb.getClients());
    setVehicles(mockDb.getVehicles());
    setQuotations(mockDb.getQuotations());
    setContracts(mockDb.getContracts());
    setInvoices(mockDb.getInvoices());
    setFollowUps(mockDb.getFollowUps());
    setTemplates(mockDb.getTemplates());
    setSettings(mockDb.getSettings());
    setUsers(mockDb.getUsers());
    setCurrentUser(mockDb.getCurrentUser());
    setAuditLogs(mockDb.getAuditLogs());
    setPendingRequestsCount(mockDb.getPendingRequests().filter(r => r.estado === 'Pendiente').length);
  };

  // Switch Active user session or Login
  const handleUserChange = (user: UserSession) => {
    mockDb.setCurrentUser(user);
    setCurrentUser(user);
    setIsLoggedIn(true);
    localStorage.setItem('publix_is_logged_in', 'true');
    if (user.rol === 'Cliente') {
      setActiveTab('vehiculos');
    } else {
      setActiveTab('dashboard');
    }
    loadAllStates(); // Refresh logs
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('publix_is_logged_in');
  };

  const handleUpdateTemplates = (newTemplates: MessageTemplate[]) => {
    mockDb.saveTemplates(newTemplates);
    setTemplates(newTemplates);
  };

  // Client Mutations
  const handleAddClient = async (clientData: Omit<Client, 'id' | 'fecha_registro' | 'fecha_actualizacion'>): Promise<boolean> => {
    const list = mockDb.getClients();
    const phoneExists = list.some(c => c.celular === clientData.celular);
    if (phoneExists) return false;

    const newClient: Client = {
      ...clientData,
      id: 'C' + String(Date.now()).slice(-4),
      fecha_registro: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString()
    };

    const updated = [newClient, ...list];
    setClients(updated);
    await mockDb.addClient(newClient);

    // Register Trace
    mockDb.addAuditLog(
      currentUser.nombre,
      'Registro Cliente CRM',
      `Se dio de alta con éxito al cliente ${newClient.nombre} (${newClient.celular}) con un presupuesto de $${newClient.presupuesto_usd.toLocaleString()} USD.`
    );
    setAuditLogs(mockDb.getAuditLogs());
    return true;
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    const list = mockDb.getClients();
    const updated = list.map(c => c.id === updatedClient.id ? updatedClient : c);
    setClients(updated);
    await mockDb.updateClient(updatedClient.id, updatedClient);

    // Log update audit trace
    mockDb.addAuditLog(
      currentUser.nombre,
      'Actualización Cliente',
      `Se modificó la ficha técnica y estado del cliente ${updatedClient.nombre} a estado: "${updatedClient.estado}".`
    );
    setAuditLogs(mockDb.getAuditLogs());

    // Update activeClient reference in state if selected
    if (activeClient && activeClient.id === updatedClient.id) {
      setActiveClient(updatedClient);
    }
  };

  const handleDeleteClient = async (id: string) => {
    const list = mockDb.getClients();
    const client = list.find(c => c.id === id) || clients.find(c => c.id === id);
    setClients(prev => prev.filter(c => c.id !== id));
    await mockDb.deleteClient(id);

    if (client) {
      mockDb.addAuditLog(
        currentUser.nombre,
        'Eliminación Cliente',
        `Se eliminó de la base de datos la ficha de ${client.nombre} (${client.celular}).`
      );
      setAuditLogs(mockDb.getAuditLogs());
    }

    if (activeClient && activeClient.id === id) {
      setActiveClient(null);
    }
  };

  // Vehicles Mutations
  const handleAddVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'fecha_registro' | 'fecha_actualizacion'>) => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: 'V' + String(Date.now()).slice(-4),
      fecha_registro: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString()
    };

    setVehicles(prev => [newVehicle, ...prev]);
    await mockDb.addVehicle(newVehicle);

    mockDb.addAuditLog(
      currentUser.nombre,
      'Carga Valla / Pantalla Catálogo',
      `Se agregó el soporte publicitario ${newVehicle.tipo_valla || newVehicle.tipo} (${newVehicle.avenida_calle || newVehicle.modelo}) al catálogo por $${newVehicle.precio_usd.toLocaleString()} USD.`
    );
    setAuditLogs(mockDb.getAuditLogs());
  };

  const handleUpdateVehicle = async (updatedVehicle: Vehicle) => {
    setVehicles(prev => prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
    await mockDb.updateVehicle(updatedVehicle.id, updatedVehicle);

    mockDb.addAuditLog(
      currentUser.nombre,
      'Actualización Valla / Pantalla',
      `Se modificó la ficha de la valla/pantalla ${updatedVehicle.tipo_valla || updatedVehicle.tipo} (${updatedVehicle.avenida_calle || updatedVehicle.modelo}) a estado: "${updatedVehicle.estado}" y precio $${updatedVehicle.precio_usd.toLocaleString()}.`
    );
    setAuditLogs(mockDb.getAuditLogs());

    if (activeVehicle && activeVehicle.id === updatedVehicle.id) {
      setActiveVehicle(updatedVehicle);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    const vehicle = vehicles.find(v => v.id === id) || mockDb.getVehicles().find(v => v.id === id);
    setVehicles(prev => prev.filter(v => v.id !== id));
    await mockDb.deleteVehicle(id);

    if (vehicle) {
      mockDb.addAuditLog(
        currentUser.nombre,
        'Eliminación Valla / Pantalla',
        `Se eliminó la valla/pantalla ${vehicle.tipo_valla || vehicle.tipo} (${vehicle.avenida_calle || vehicle.modelo}) del catálogo.`
      );
      setAuditLogs(mockDb.getAuditLogs());
    }

    if (activeVehicle && activeVehicle.id === id) {
      setActiveVehicle(null);
    }
  };

  // Associate vehicle with client (stores choice)
  const handleAssociateVehicleToClient = (clientId: string, vehicleId: string) => {
    const list = mockDb.getClients();
    const client = list.find(c => c.id === clientId);
    const vehicle = vehicles.find(v => v.id === vehicleId);

    if (client && vehicle) {
      const updatedClient: Client = {
        ...client,
        observaciones: `${client.observaciones}\n[Interés Registrado]: ${vehicle.marca} ${vehicle.modelo} (${vehicle.anio}) de USD ${vehicle.precio_usd.toLocaleString()}`,
        estado: 'Interesado',
        fecha_actualizacion: new Date().toISOString()
      };
      handleUpdateClient(updatedClient);

      mockDb.addAuditLog(
        currentUser.nombre,
        'Asociación Cliente-Vehículo',
        `Se registró la unidad ${vehicle.marca} ${vehicle.modelo} de interés comercial para el cliente ${client.nombre}.`
      );
      setAuditLogs(mockDb.getAuditLogs());
    }
  };

  // Quotation Mutations
  const handleAddQuotation = async (quoteData: Omit<Quotation, 'id' | 'numero' | 'fecha'>) => {
    const list = mockDb.getQuotations();
    
    // Auto-number format: PUBLIX-YYYYMMDD-00000X
    const today = new Date();
    const dateStamp = today.getFullYear() + 
                      String(today.getMonth() + 1).padStart(2, '0') + 
                      String(today.getDate()).padStart(2, '0');
    const seq = String(list.length + 1).padStart(6, '0');
    const quoteNum = `PUBLIX-${dateStamp}-${seq}`;

    const newQuote: Quotation = {
      ...quoteData,
      id: 'Q' + String(Date.now()).slice(-6),
      numero: quoteNum,
      fecha: new Date().toISOString()
    };

    const updated = [newQuote, ...list];
    setQuotations(updated);
    await mockDb.addQuotation(newQuote);

    // Auto-update Client state to "Cotizado"
    const clientList = mockDb.getClients();
    const client = clientList.find(c => c.id === quoteData.cliente_id);
    if (client && client.estado !== 'Cotizado' && client.estado !== 'Vendido' && client.estado !== 'Negociando') {
      handleUpdateClient({
        ...client,
        estado: 'Cotizado',
        fecha_actualizacion: new Date().toISOString()
      });
    }

    mockDb.addAuditLog(
      currentUser.nombre,
      'Generación Cotización PDF',
      `Se emitió con éxito la cotización formal ${quoteNum} por un monto final importado de $${newQuote.total.toLocaleString()} USD.`
    );
    setAuditLogs(mockDb.getAuditLogs());
  };

  const handleUpdateQuotationStatus = async (id: string, status: QuotationState) => {
    const list = mockDb.getQuotations();
    const quote = list.find(q => q.id === id);
    if (quote) {
      const updatedQuote = { ...quote, estado: status };
      const updated = list.map(q => q.id === id ? updatedQuote : q);
      setQuotations(updated);
      await mockDb.updateQuotation(id, { estado: status });

      // Auto update client state to negotiation or sold if appropriate
      if (status === 'Aceptada') {
        const client = clients.find(c => c.id === quote.cliente_id);
        if (client) {
          handleUpdateClient({
            ...client,
            estado: 'Vendido',
            fecha_actualizacion: new Date().toISOString()
          });
        }
      }

      mockDb.addAuditLog(
        currentUser.nombre,
        'Cambio Estado Cotización',
        `Se cambió el estado del documento de cotización ${quote.numero} a "${status}".`
      );
      setAuditLogs(mockDb.getAuditLogs());
    }
  };

  const handleUpdateQuotation = async (updatedQuote: Quotation) => {
    const list = mockDb.getQuotations();
    const updated = list.map(q => q.id === updatedQuote.id ? updatedQuote : q);
    setQuotations(updated);
    await mockDb.updateQuotation(updatedQuote.id, updatedQuote);

    mockDb.addAuditLog(
      currentUser.nombre,
      'Edición Cotización',
      `Se modificó con éxito la proforma / cotización ${updatedQuote.numero} por un monto total de $${updatedQuote.total.toLocaleString()} USD.`
    );
    setAuditLogs(mockDb.getAuditLogs());
  };

  const handleDeleteQuotation = async (id: string) => {
    const list = mockDb.getQuotations();
    const quote = list.find(q => q.id === id);
    if (quote) {
      const updated = list.filter(q => q.id !== id);
      setQuotations(updated);
      await mockDb.deleteQuotation(id);

      mockDb.addAuditLog(
        currentUser.nombre,
        'Eliminación Cotización',
        `Se eliminó la cotización ${quote.numero} del registro de ventas.`
      );
      setAuditLogs(mockDb.getAuditLogs());
    }
  };

  // Contracts Mutations
  const handleAddContract = async (contract: Contract) => {
    const list = mockDb.getContracts();
    const existsIndex = list.findIndex(c => c.id === contract.id);
    let updated: Contract[];
    if (existsIndex >= 0) {
      updated = [...list];
      updated[existsIndex] = contract;
    } else {
      updated = [contract, ...list];
    }
    setContracts(updated);
    await mockDb.addContract(contract);

    // Auto-update Client state to "Vendido"
    const clientList = mockDb.getClients();
    const client = clientList.find(c => c.id === contract.cliente_id);
    if (client && client.estado !== 'Vendido') {
      handleUpdateClient({
        ...client,
        estado: 'Vendido',
        fecha_actualizacion: new Date().toISOString()
      });
    }

    mockDb.addAuditLog(
      currentUser.nombre,
      'Emisión de Contrato Comercial',
      `Se emitió con éxito el Contrato N° ${contract.numero} para ${contract.cliente_nombre} por $${contract.total_neto_usd.toLocaleString()} USD (Bs. ${contract.total_neto_bob.toLocaleString()} BOB).`
    );
    setAuditLogs(mockDb.getAuditLogs());
  };

  const handleUpdateContractStatus = async (id: string, status: ContractStatus) => {
    const list = mockDb.getContracts();
    const contract = list.find(c => c.id === id);
    if (contract) {
      const updatedContract = { ...contract, estado: status };
      const updated = list.map(c => c.id === id ? updatedContract : c);
      setContracts(updated);
      await mockDb.updateContract(id, { estado: status });

      mockDb.addAuditLog(
        currentUser.nombre,
        'Cambio Estado Contrato',
        `Se cambió el estado del Contrato N° ${contract.numero} a "${status}".`
      );
      setAuditLogs(mockDb.getAuditLogs());
    }
  };

  const handleDeleteContract = async (id: string) => {
    const list = mockDb.getContracts();
    const contract = list.find(c => c.id === id);
    if (contract) {
      const updated = list.filter(c => c.id !== id);
      setContracts(updated);
      await mockDb.deleteContract(id);

      mockDb.addAuditLog(
        currentUser.nombre,
        'Eliminación de Contrato',
        `Se eliminó el Contrato N° ${contract.numero} de la base de datos.`
      );
      setAuditLogs(mockDb.getAuditLogs());
    }
  };

  // Invoices Mutations (SIN Fiscal Invoices)
  const handleAddInvoice = async (invoice: Invoice) => {
    const list = mockDb.getInvoices();
    const updated = [invoice, ...list];
    setInvoices(updated);
    await mockDb.addInvoice(invoice);

    mockDb.addAuditLog(
      currentUser.nombre,
      'Emisión de Factura Fiscal',
      `Se emitió la Factura Fiscal Oficial N° ${invoice.numero_factura} para ${invoice.cliente_razon_social || invoice.cliente_nombre} por un total de Bs. ${invoice.total_bs.toLocaleString('es-BO')}.`
    );
    setAuditLogs(mockDb.getAuditLogs());
  };

  const handleUpdateInvoice = async (id: string, update: Partial<Invoice>) => {
    const list = mockDb.getInvoices();
    const inv = list.find(x => x.id === id);
    if (inv) {
      const updated = list.map(x => x.id === id ? { ...x, ...update } : x);
      setInvoices(updated);
      await mockDb.updateInvoice(id, update);

      mockDb.addAuditLog(
        currentUser.nombre,
        'Actualización de Factura Fiscal',
        `Se modificó la Factura N° ${inv.numero_factura} (Estado: ${update.estado || inv.estado}).`
      );
      setAuditLogs(mockDb.getAuditLogs());
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    const list = mockDb.getInvoices();
    const inv = list.find(x => x.id === id);
    if (inv) {
      const updated = list.filter(x => x.id !== id);
      setInvoices(updated);
      await mockDb.deleteInvoice(id);

      mockDb.addAuditLog(
        currentUser.nombre,
        'Eliminación de Factura',
        `Se eliminó la Factura N° ${inv.numero_factura} de la base de datos.`
      );
      setAuditLogs(mockDb.getAuditLogs());
    }
  };

  // Follow-ups Mutations
  const handleAddFollowUp = async (followUpData: Omit<FollowUp, 'id' | 'fecha'>) => {
    const list = mockDb.getFollowUps();
    const newFollowUp: FollowUp = {
      ...followUpData,
      id: 'F' + String(Date.now()).slice(-6),
      fecha: new Date().toISOString()
    };

    const updated = [newFollowUp, ...list];
    setFollowUps(updated);
    await mockDb.addFollowUp(newFollowUp);

    const client = clients.find(c => c.id === followUpData.cliente_id);

    mockDb.addAuditLog(
      currentUser.nombre,
      'Agendamiento Seguimiento',
      `Se programó actividad tipo "${followUpData.tipo}" para el cliente ${client ? client.nombre : 'Desconocido'} con fecha de vencimiento ${new Date(followUpData.proximo_contacto).toLocaleDateString()}.`
    );
    setAuditLogs(mockDb.getAuditLogs());
  };

  const handleUpdateFollowUpStatus = async (id: string, status: FollowUpState) => {
    const list = mockDb.getFollowUps();
    const task = list.find(f => f.id === id);
    if (task) {
      const updatedTask = { ...task, estado: status };
      const updated = list.map(f => f.id === id ? updatedTask : f);
      setFollowUps(updated);
      await mockDb.updateFollowUp(id, { estado: status });

      const client = clients.find(c => c.id === task.cliente_id);

      mockDb.addAuditLog(
        currentUser.nombre,
        'Seguimiento Completado',
        `Se marcó como "${status}" la actividad programada para ${client ? client.nombre : 'Desconocido'}.`
      );
      setAuditLogs(mockDb.getAuditLogs());
    }
  };

  const handleDeleteFollowUp = async (id: string) => {
    const list = mockDb.getFollowUps();
    const task = list.find(f => f.id === id);
    if (task) {
      const updated = list.filter(f => f.id !== id);
      setFollowUps(updated);
      await mockDb.deleteFollowUp(id);

      mockDb.addAuditLog(
        currentUser.nombre,
        'Eliminación Seguimiento',
        `Se borró actividad de la agenda de seguimientos comerciales.`
      );
      setAuditLogs(mockDb.getAuditLogs());
    }
  };

  // Corporate settings updates
  const handleUpdateSettings = (updatedSettings: Settings) => {
    mockDb.saveSettings(updatedSettings);
    setSettings(updatedSettings);

    mockDb.addAuditLog(
      currentUser.nombre,
      'Configuración del Sistema',
      `Se modificó la configuración general, tasas arancelarias, tipo de cambio a Bs. ${updatedSettings.tipo_cambio} y las condiciones de importación.`
    );
    setAuditLogs(mockDb.getAuditLogs());
  };

  // Chronological timeline calculation for details view
  const handleGetClientTimeline = (clientId: string): any[] => {
    const timeline: any[] = [];

    // Filter audits related to this client
    const client = clients.find(c => c.id === clientId);
    if (client) {
      // 1. Initial creation
      timeline.push({
        title: 'Registro de Prospecto',
        detalle: 'Se dio de alta la ficha en el CRM con un presupuesto inicial.',
        fecha: client.fecha_registro,
        vendedor: 'Sistema'
      });

      // 2. Filter quotes for this client
      quotations
        .filter(q => q.cliente_id === clientId)
        .forEach(q => {
          const veh = vehicles.find(v => v.id === q.vehiculo_id);
          timeline.push({
            title: 'Cotización Formal Emitida',
            detalle: `Se generó la propuesta comercial ${q.numero} para el vehículo ${veh ? `${veh.marca} ${veh.modelo}` : 'Desconocido'} por un valor total importado de $${q.total.toLocaleString()} USD (Estado: ${q.estado}).`,
            fecha: q.fecha,
            vendedor: currentUser.nombre
          });
        });

      // 3. Filter followups for this client
      followUps
        .filter(f => f.cliente_id === clientId)
        .forEach(f => {
          timeline.push({
            title: `Actividad comercial: ${f.tipo}`,
            detalle: `[${f.estado}] Notas de seguimiento: "${f.nota}" (Programado para: ${new Date(f.proximo_contacto).toLocaleDateString()}).`,
            fecha: f.fecha,
            vendedor: currentUser.nombre
          });
        });

      // 4. Search message logs in audits
      auditLogs
        .filter(log => log.detalle.includes(client.nombre) && log.accion.toLowerCase().includes('whatsapp'))
        .forEach(log => {
          timeline.push({
            title: 'Mensaje WhatsApp Generado',
            detalle: log.detalle,
            fecha: log.fecha,
            vendedor: log.usuario
          });
        });
    }

    // Sort descending by date (newest first)
    return timeline.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };

  // Add new user in active session list
  const handleAddUser = async (newUserData: Omit<UserSession, 'id'>) => {
    const list = mockDb.getUsers();
    const newUser: UserSession = {
      ...newUserData,
      id: 'U' + String(Date.now()).slice(-4),
      password: newUserData.password || (newUserData.celular ? newUserData.celular.replace(/\D/g, '') : '70000000')
    };
    const updated = [...list, newUser];
    setUsers(updated);
    await mockDb.addUser(newUser);

    mockDb.addAuditLog(
      currentUser.nombre,
      'Creación de Usuario',
      `Se creó el usuario "${newUser.nombre}" con el rol "${newUser.rol}", alias @${newUser.usuario} y contraseña por defecto celular (${newUser.celular || '70000000'}).`
    );
    setAuditLogs(mockDb.getAuditLogs());
  };

  const handleResetUserPassword = (userId: string) => {
    const res = mockDb.resetUserPassword(userId);
    if (res.success) {
      setUsers(mockDb.getUsers());
      setCurrentUser(mockDb.getCurrentUser());
      setAuditLogs(mockDb.getAuditLogs());
    }
    return res;
  };

  const handleChangeMyPassword = (userId: string, newPass: string) => {
    const res = mockDb.changeUserPassword(userId, newPass);
    if (res.success) {
      setUsers(mockDb.getUsers());
      setCurrentUser(mockDb.getCurrentUser());
      setAuditLogs(mockDb.getAuditLogs());
    }
    return res;
  };

  const handleDeleteUser = async (userId: string) => {
    const list = mockDb.getUsers();
    const userToDelete = list.find(u => u.id === userId);
    if (userToDelete && userToDelete.rol !== 'Dueño') {
      const updated = list.filter(u => u.id !== userId);
      setUsers(updated);
      await mockDb.deleteUser(userId);
      mockDb.addAuditLog(
        currentUser.nombre,
        'Eliminación de Usuario',
        `Se eliminó al usuario @${userToDelete.usuario} (${userToDelete.nombre}) del sistema.`
      );
      setAuditLogs(mockDb.getAuditLogs());
    }
  };

  // Database Backup downloads (JSON)
  const handleDownloadBackup = () => {
    const backupText = mockDb.exportBackup();
    const blob = new Blob([backupText], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `VALLAS_LED_BOLIVIA_Copia_Seguridad_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    mockDb.addAuditLog(
      currentUser.nombre,
      'Copia de Seguridad',
      'Se exportó y descargó con éxito un archivo de respaldo general del sistema.'
    );
    setAuditLogs(mockDb.getAuditLogs());
  };

  const handleUploadBackup = (backupText: string): boolean => {
    const success = mockDb.importBackup(backupText);
    if (success) {
      loadAllStates();
    }
    return success;
  };

  const handleResetAll = () => {
    mockDb.resetAll();
    loadAllStates();
    setActiveTab('dashboard');
    setActiveClient(null);
    setActiveVehicle(null);
    alert('¡Base de datos de alta capacidad (350 prospectos de clientes y 350 vehículos en catálogo) re-generada e inicializada con éxito!');
  };

  // Bulk Import Handlers
  const handleImportClients = (importedList: any[]): { successCount: number; errorCount: number; report: string[] } => {
    const currentList = mockDb.getClients();
    let successCount = 0;
    let errorCount = 0;
    const report: string[] = [];

    const updatedList = [...currentList];

    importedList.forEach((row, i) => {
      const idx = i + 2; // spreadsheet row offset
      const nombre = row.Nombre || row.nombre || '';
      let celular = row.Celular || row.celular || '';
      const ciudad = row.Ciudad || row.ciudad || 'Santa Cruz';
      const depto = row.Departamento || row.departamento || 'Santa Cruz';
      const presupuesto = Number(row.PresupuestoUSD || row.presupuesto || 0);
      const obs = row.Observaciones || row.observaciones || '';

      if (!nombre.trim()) {
        errorCount++;
        report.push(`Fila ${idx}: Nombre de cliente vacío.`);
        return;
      }

      if (!celular.trim()) {
        errorCount++;
        report.push(`Fila ${idx}: Celular vacío para el cliente ${nombre}.`);
        return;
      }

      // Format and check phone duplicates
      let formattedPhone = celular.trim().replace(/\s+/g, '');
      if (!formattedPhone.startsWith('+') && formattedPhone.length === 8) {
        formattedPhone = '+591' + formattedPhone;
      }

      const duplicate = updatedList.some(c => c.celular === formattedPhone);
      if (duplicate) {
        errorCount++;
        report.push(`Fila ${idx}: El celular ${formattedPhone} ya está registrado en el CRM.`);
        return;
      }

      if (isNaN(presupuesto) || presupuesto <= 0) {
        errorCount++;
        report.push(`Fila ${idx}: Presupuesto inválido o negativo ($${presupuesto}).`);
        return;
      }

      const newClient: Client = {
        id: 'C' + String(updatedList.length + 1).padStart(3, '0'),
        nombre: nombre.trim(),
        celular: formattedPhone,
        ciudad: ciudad.trim(),
        departamento: depto.trim(),
        pais: 'Bolivia',
        presupuesto_usd: presupuesto,
        observaciones: obs.trim(),
        estado: 'Nuevo',
        fecha_registro: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString()
      };

      updatedList.unshift(newClient);
      successCount++;
    });

    if (successCount > 0) {
      mockDb.saveClients(updatedList);
      setClients(updatedList);
      mockDb.addAuditLog(
        currentUser.nombre,
        'Importación de Clientes',
        `Se cargaron masivamente ${successCount} clientes desde una planilla de cálculo externa.`
      );
      setAuditLogs(mockDb.getAuditLogs());
    }

    return { successCount, errorCount, report };
  };

  const handleImportVehicles = (importedList: any[]): { successCount: number; errorCount: number; report: string[] } => {
    const currentList = mockDb.getVehicles();
    let successCount = 0;
    let errorCount = 0;
    const report: string[] = [];

    const updatedList = [...currentList];

    importedList.forEach((row, i) => {
      const idx = i + 2;
      const marca = row.Marca || row.marca || '';
      const modelo = row.Modelo || row.modelo || '';
      const version = row.Version || row.version || '';
      const anio = Number(row.Anio || row.anio || 2025);
      const tipo = row.Tipo || row.tipo || 'SUV';
      const precio = Number(row.PrecioUSD || row.precio || 0);
      const combustible = row.Combustible || row.combustible || 'Gasolina';
      const transmision = row.Transmision || row.transmision || 'Automática';
      const traccion = row.Traccion || row.traccion || 'AWD';
      const color = row.Color || row.color || '';
      const desc = row.Descripcion || row.descripcion || '';

      if (!marca.trim() || !modelo.trim()) {
        errorCount++;
        report.push(`Fila ${idx}: Marca o Modelo del vehículo faltante.`);
        return;
      }

      if (isNaN(precio) || precio <= 0) {
        errorCount++;
        report.push(`Fila ${idx}: Precio de importación inválido ($${precio}).`);
        return;
      }

      const newVehicle: Vehicle = {
        id: 'V' + String(updatedList.length + 1).padStart(3, '0'),
        marca: marca.trim(),
        modelo: modelo.trim(),
        version: version.trim(),
        anio,
        tipo: tipo as any,
        motor: '',
        combustible: combustible as any,
        transmision: transmision as any,
        traccion: traccion as any,
        color: color.trim(),
        precio_usd: precio,
        descripcion: desc.trim(),
        estado: 'Disponible',
        imagen_principal: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600',
        imagenes: [],
        fecha_registro: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString()
      };

      updatedList.unshift(newVehicle);
      successCount++;
    });

    if (successCount > 0) {
      mockDb.saveVehicles(updatedList);
      setVehicles(updatedList);
      mockDb.addAuditLog(
        currentUser.nombre,
        'Importación de Catálogo',
        `Se añadieron masivamente ${successCount} vehículos al catálogo de venta.`
      );
      setAuditLogs(mockDb.getAuditLogs());
    }

    return { successCount, errorCount, report };
  };

  // Quick switch navigation shortcuts
  const handleSelectClientForWhatsApp = (client: Client) => {
    setActiveClient(client);
    setActiveTab('whatsapp');
  };

  const handleSelectVehicleForWhatsApp = (vehicle: Vehicle) => {
    setActiveVehicle(vehicle);
    setActiveTab('whatsapp');
  };

  const handleSelectClientForQuote = (client: Client) => {
    setActiveClient(client);
    setActiveTab('cotizaciones');
  };

  const handleSelectVehicleForQuote = (vehicle: Vehicle) => {
    setActiveVehicle(vehicle);
    setActiveTab('cotizaciones');
  };

  const handleSelectClientForFollowUp = (client: Client) => {
    setActiveClient(client);
    setActiveTab('agenda');
  };

  // Welcome / Landing Page view if not authenticated
  if (!isLoggedIn) {
    return (
      <>
        <LandingPage
          onOpenLogin={() => {
            setInitialCategoryFilter('Todos');
            setShowLoginModal(true);
          }}
          onOpenLoginWithCategory={(cat) => {
            setInitialCategoryFilter(cat);
            setShowLoginModal(true);
          }}
          onExploreCatalog={() => {
            setInitialCategoryFilter('Todos');
            setShowLoginModal(true);
          }}
          settings={settings}
        />
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          users={users}
          clients={clients}
          onLoginSuccess={handleUserChange}
          logoUrl={settings.logo}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none antialiased text-gray-800">
      
      {/* Top Banner Header (Corporate Branding) */}
      <header className="bg-gray-950 text-white border-b border-gray-900 px-6 py-4 flex justify-between items-center shadow-md z-40 no-print">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setSidebarOpen(prev => !prev)}
            className="p-1.5 rounded-lg hover:bg-white/10 lg:hidden transition"
          >
            <Menu className="w-5 h-5 text-gray-300" />
          </button>
          
          <div className="flex items-center space-x-2.5">
            <Logo size="md" logoUrl={settings.logo} />
          </div>

          {/* Direct Return to Home / Landing Button in Header */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#ff8c00]/15 hover:bg-[#ff8c00]/30 border border-[#ff8c00]/40 text-[#ff8c00] rounded-xl text-xs font-bold transition cursor-pointer"
            title="Ir a la pantalla principal de inicio"
          >
            <Home className="w-3.5 h-3.5 text-[#ff8c00]" />
            <span className="hidden sm:inline font-black uppercase text-[11px] tracking-wider">Inicio</span>
          </button>
        </div>

        {/* Top Active User Dropdown Panel */}
        <div className="flex items-center space-x-4">
          
          {/* Quick Context display */}
          {(activeClient || activeVehicle) && (
            <div className="hidden md:flex items-center space-x-3 text-xs border-r border-gray-800 pr-4">
              {activeClient && (
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-gray-300 truncate max-w-[100px]">{activeClient.nombre}</span>
                </div>
              )}
              {activeVehicle && (
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-gray-300 truncate max-w-[100px]">{activeVehicle.modelo}</span>
                </div>
              )}
              <button 
                onClick={() => {
                  setActiveClient(null);
                  setActiveVehicle(null);
                }}
                className="text-[10px] hover:text-white text-gray-400 font-semibold"
              >
                Limpiar
              </button>
            </div>
          )}

          {/* Cotización del Dólar de hoy Widget */}
          <div className="flex items-center space-x-2 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider font-sans">
              Dólar de Hoy:
            </span>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] text-gray-400 font-semibold">Bs.</span>
              {currentUser.rol === 'Vendedor' ? (
                <span className="font-mono text-sm font-black text-white bg-transparent py-0.5 px-1">
                  {settings.tipo_cambio || '6.96'}
                </span>
              ) : (
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={settings.tipo_cambio || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const newVal = parseFloat(val);
                    handleUpdateSettings({
                      ...settings,
                      tipo_cambio: isNaN(newVal) ? 0 : newVal
                    });
                  }}
                  className="w-16 font-mono text-sm font-black text-white bg-gray-950 border border-gray-850 focus:border-amber-500 focus:ring-0 focus:outline-none rounded text-center px-1 py-0.5"
                  title="Dueño/Jefe: Modifique la cotización oficial aquí en tiempo real"
                />
              )}
            </div>
            {currentUser.rol === 'Vendedor' ? (
              <span className="text-[9px] text-gray-500 italic font-medium" title="Solo el Dueño o Jefe pueden cambiar la cotización">🔒</span>
            ) : (
              <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider animate-pulse">⚡ Activo</span>
            )}
          </div>

          {/* Interactive User Switcher Selector */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(prev => !prev)}
              className="flex items-center space-x-2.5 bg-gray-900 hover:bg-gray-850 border border-gray-800 px-3.5 py-1.5 rounded-xl transition cursor-pointer"
              title="Haz clic para cambiar de usuario o probar roles"
            >
              <div className="w-7 h-7 rounded-full bg-amber-500/25 text-amber-500 flex items-center justify-center font-bold text-xs border border-amber-500/40">
                {currentUser.nombre ? currentUser.nombre[0] : 'U'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold leading-tight flex items-center gap-1">
                  {currentUser.nombre || 'Cargando...'}
                  <ChevronDown className="w-3 h-3 text-amber-400" />
                </span>
                <span className="text-[10px] text-gray-400 font-medium capitalize font-mono text-right">
                  {currentUser.rol || 'Rol'}
                </span>
              </div>
            </button>

            {/* Dropdown Menu Seguro */}
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-50 p-4 space-y-3 text-white"
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-gray-800">
                    <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      SESIÓN AUTENTICADA
                    </span>
                    <button
                      onClick={() => setUserMenuOpen(false)}
                      className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Current Active User Profile Card */}
                  <div className="bg-gray-950/80 border border-gray-800/80 rounded-xl p-3 space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-md ${
                        currentUser.rol === 'Dueño' ? 'bg-amber-500 text-gray-950 ring-2 ring-amber-400/50' :
                        currentUser.rol === 'Jefe' ? 'bg-blue-600 text-white ring-2 ring-blue-400/50' :
                        currentUser.rol === 'Cliente' ? 'bg-purple-600 text-white ring-2 ring-purple-400/50' :
                        'bg-emerald-600 text-white ring-2 ring-emerald-400/50'
                      }`}>
                        {currentUser.nombre ? currentUser.nombre[0] : 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white text-sm truncate">{currentUser.nombre}</div>
                        <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                          <span>@{currentUser.usuario}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-gray-400">Rol asignado:</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        currentUser.rol === 'Dueño' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                        currentUser.rol === 'Jefe' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' :
                        currentUser.rol === 'Cliente' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' :
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}>
                        {currentUser.rol === 'Dueño' ? '👑 DUEÑO' : currentUser.rol === 'Jefe' ? '🛡️ SUPERVISOR / JEFE' : currentUser.rol}
                      </span>
                    </div>
                  </div>

                  {/* Actions Requiring Password / Privileges */}
                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        setShowLoginModal(true);
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-gray-950 font-black rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-amber-500/20"
                    >
                      <Key className="w-4 h-4 text-gray-950" />
                      <span>Cambiar de Usuario con Contraseña</span>
                    </button>

                    {(currentUser.rol === 'Dueño' || currentUser.rol === 'Jefe') && (
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          setActiveTab('configuracion');
                        }}
                        className="w-full py-2 bg-gray-800 hover:bg-gray-750 text-gray-200 border border-gray-700/80 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Gestión de Usuarios & Permisos</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full py-2 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-800/40 text-rose-300 font-bold rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>

                  <div className="text-[10px] text-gray-400 text-center pt-1 border-t border-gray-800/60">
                    Solo usuarios autorizados con contraseña pueden cambiar de cuenta.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-900 hover:bg-rose-950/40 border border-gray-800 hover:border-rose-800/80 text-gray-300 hover:text-rose-300 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Cerrar sesión y volver a la página de bienvenida"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline uppercase text-[11px] tracking-wider">Inicio</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Client specific filtered data for portal access */}
        {(() => {
          const loggedInClient = currentUser.rol === 'Cliente'
            ? clients.find(c => c.id === currentUser.id || c.nombre === currentUser.nombre || (c.usuario_acceso && c.usuario_acceso.toLowerCase() === currentUser.usuario?.toLowerCase()))
            : null;

          const displayQuotations = currentUser.rol === 'Cliente'
            ? (loggedInClient ? quotations.filter(q => q.cliente_id === loggedInClient.id) : [])
            : quotations;

          const displayContracts = currentUser.rol === 'Cliente'
            ? (loggedInClient ? contracts.filter(c => c.cliente_id === loggedInClient.id) : [])
            : contracts;

          return (
            <>
        {/* SIDEBAR NAVIGATION (CRITICAL COMPONENT SPECIFIED IN SPECS) */}
        <aside className={`no-print fixed inset-y-0 left-0 lg:static lg:flex flex-col bg-gray-950 text-white w-64 border-r border-gray-900 shrink-0 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } transition-transform duration-200 ease-in-out z-50 shadow-lg lg:shadow-none`}
        >
          {/* Mobile close sidebar trigger */}
          <div className="p-4 lg:hidden flex justify-end border-b border-gray-900">
            <button onClick={() => setSidebarOpen(false)} className="p-1 rounded bg-gray-900 hover:bg-gray-800 text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {(currentUser.rol === 'Cliente'
              ? [
                  { id: 'vehiculos', label: 'CATÁLOGO DE ESPACIOS PUBLI-X', icon: Presentation, badge: vehicles.length },
                  { id: 'cotizaciones', label: 'MIS COTIZACIONES', icon: FileText, badge: displayQuotations.length },
                  { id: 'contratos', label: 'MIS CONTRATOS FIRMADOS', icon: FileCheck, badge: displayContracts.length },
                ]
              : [
                  { id: 'dashboard', label: 'DASHBOARD PRINCIPAL', icon: Sliders, badge: null },
                  { id: 'solicitudes', label: 'SOLICITUDES & NUEVOS CLIENTES WEB', icon: Inbox, badge: pendingRequestsCount },
                  { id: 'clientes', label: 'CRM CLIENTES', icon: Users, badge: clients.length },
                  { id: 'vehiculos', label: 'CATÁLOGO PUBLI-X OOH', icon: Presentation, badge: vehicles.length },
                  { id: 'recomendacion', label: 'RECOMENDADOR IA', icon: Sparkles, badge: null },
                  { id: 'whatsapp', label: 'WHATSAPP COMERCIAL', icon: MessageSquare, badge: null },
                  { id: 'cotizaciones', label: 'COTIZACIONES PDF', icon: FileText, badge: displayQuotations.length },
                  { id: 'contratos', label: 'CONTRATOS CRM', icon: FileCheck, badge: displayContracts.length },
                  { id: 'facturacion', label: 'FACTURACIÓN & SIN', icon: Receipt, badge: invoices.length },
                  { id: 'documentos', label: 'CENTRO DE DOCUMENTOS', icon: FolderSync, badge: 'PRO' },
                  { id: 'agenda', label: 'SEGUIMIENTOS AGENDA', icon: Calendar, badge: followUps.filter(f => f.estado === 'Pendiente').length },
                  { id: 'importar', label: 'EXCEL IMPORT / EXPORT', icon: Database, badge: null },
                  { id: 'auditoria', label: 'BITÁCORA AUDITORÍA', icon: ShieldCheck, badge: null },
                  { id: 'configuracion', label: 'CONFIGURACIÓN', icon: FolderSync, badge: null },
                ]
            ).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold font-display text-xs tracking-wider flex items-center justify-between transition-colors ${
                    isActive 
                      ? 'bg-amber-500 text-gray-950 font-extrabold shadow-sm' 
                      : 'hover:bg-gray-900 text-gray-400 hover:text-white'
                  }`}
                  id={`nav-link-${item.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && (
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold font-mono ${
                      isActive ? 'bg-gray-950 text-white' : 'bg-gray-900 text-gray-400 border border-gray-800'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer info */}
          <div className="p-4 border-t border-gray-900 space-y-3">
            <button
              onClick={() => {
                setSidebarOpen(false);
                handleLogout();
              }}
              className="w-full py-2.5 bg-gradient-to-r from-[#ff8c00] via-[#ffa024] to-[#ff7300] hover:from-[#ff7300] hover:to-[#e06600] border border-[#ff8c00]/40 text-white font-black rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-[#ff8c00]/20"
            >
              <Home className="w-4 h-4" />
              <span>Volver a Inicio</span>
            </button>

            <div className="text-[10px] text-gray-500 text-center flex flex-col space-y-0.5">
              <span className="font-bold text-gray-400">PUBLI-X BOLIVIA</span>
              <span className="font-mono text-gray-500">Publicidad Exterior OOH & LED</span>
            </div>
          </div>
        </aside>

        {/* WORKSPACE CENTRAL FRAMEWORK */}
        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-70px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'dashboard' && (
                <Dashboard
                  clients={clients}
                  vehicles={vehicles}
                  quotations={quotations}
                  contracts={contracts}
                  followUps={followUps}
                  auditLogs={auditLogs}
                  onTabChange={setActiveTab}
                  onSelectClient={setActiveClient}
                  exchangeRate={settings.tipo_cambio || 6.96}
                />
              )}

              {activeTab === 'solicitudes' && (
                <PendingRequestsManager
                  clients={clients}
                  currentUser={currentUser}
                  onAddClient={handleAddClient}
                  onSelectActiveClient={setActiveClient}
                  onRegisterLog={mockDb.addAuditLog.bind(mockDb)}
                />
              )}

              {activeTab === 'clientes' && (
                <Clients
                  clients={clients}
                  currentUser={currentUser}
                  onAddClient={handleAddClient}
                  onUpdateClient={handleUpdateClient}
                  onDeleteClient={handleDeleteClient}
                  onSelectClientForWhatsApp={handleSelectClientForWhatsApp}
                  onSelectClientForQuote={handleSelectClientForQuote}
                  onSelectClientForFollowUp={handleSelectClientForFollowUp}
                  exchangeRate={settings.tipo_cambio || 6.96}
                  clientTimeline={handleGetClientTimeline}
                />
              )}

              {activeTab === 'vehiculos' && (
                <Vehicles
                  vehicles={vehicles}
                  clients={clients}
                  activeClient={activeClient}
                  onSelectActiveClient={setActiveClient}
                  onAddVehicle={handleAddVehicle}
                  onUpdateVehicle={handleUpdateVehicle}
                  onDeleteVehicle={handleDeleteVehicle}
                  onSelectVehicleForWhatsApp={handleSelectVehicleForWhatsApp}
                  onSelectVehicleForQuote={handleSelectVehicleForQuote}
                  onAssociateVehicleToClient={handleAssociateVehicleToClient}
                  exchangeRate={settings.tipo_cambio || 6.96}
                  currentUser={currentUser}
                  settings={settings}
                  initialCategory={initialCategoryFilter}
                />
              )}

              {activeTab === 'recomendacion' && (
                <Recommendation
                  clients={clients}
                  vehicles={vehicles}
                  activeClient={activeClient}
                  onSelectActiveClient={setActiveClient}
                  onSelectVehicleForWhatsApp={handleSelectVehicleForWhatsApp}
                  onSelectVehicleForQuote={handleSelectVehicleForQuote}
                  onAssociateVehicleToClient={handleAssociateVehicleToClient}
                  exchangeRate={settings.tipo_cambio || 6.96}
                />
              )}

              {activeTab === 'whatsapp' && (
                <WhatsAppSender
                  clients={clients}
                  vehicles={vehicles}
                  templates={templates}
                  onUpdateTemplates={handleUpdateTemplates}
                  activeClient={activeClient}
                  activeVehicle={activeVehicle}
                  onSelectActiveClient={setActiveClient}
                  onSelectActiveVehicle={setActiveVehicle}
                  onRegisterLog={mockDb.addAuditLog.bind(mockDb)}
                  currentUser={currentUser}
                />
              )}

              {activeTab === 'cotizaciones' && (
                <Quotations
                  quotations={displayQuotations}
                  clients={clients}
                  vehicles={vehicles}
                  settings={settings}
                  currentUserNombre={currentUser.nombre}
                  onAddQuotation={handleAddQuotation}
                  onUpdateQuotation={handleUpdateQuotation}
                  onUpdateQuotationStatus={handleUpdateQuotationStatus}
                  onDeleteQuotation={handleDeleteQuotation}
                  onSaveContract={handleAddContract}
                  activeClient={activeClient}
                  activeVehicle={activeVehicle}
                  onSelectActiveClient={setActiveClient}
                  onSelectActiveVehicle={setActiveVehicle}
                />
              )}

              {activeTab === 'documentos' && (
                <DocumentManager
                  quotations={displayQuotations}
                  contracts={displayContracts}
                  clients={clients}
                  vehicles={vehicles}
                  settings={settings}
                  currentUserNombre={currentUser.nombre}
                  onSaveQuotation={handleUpdateQuotation}
                  onSaveContract={handleAddContract}
                />
              )}

              {activeTab === 'contratos' && (
                <Contracts
                  contracts={displayContracts}
                  clients={clients}
                  vehicles={vehicles}
                  settings={settings}
                  currentUserNombre={currentUser.nombre}
                  onSaveContract={handleAddContract}
                  onUpdateContractStatus={handleUpdateContractStatus}
                  onDeleteContract={handleDeleteContract}
                />
              )}

              {activeTab === 'facturacion' && (
                <Invoices
                  invoices={invoices}
                  contracts={contracts}
                  quotations={quotations}
                  clients={clients}
                  settings={settings}
                  currentUser={currentUser}
                  onAddInvoice={handleAddInvoice}
                  onUpdateInvoice={handleUpdateInvoice}
                  onDeleteInvoice={handleDeleteInvoice}
                />
              )}

              {activeTab === 'agenda' && (
                <Agenda
                  followUps={followUps}
                  clients={clients}
                  activeClient={activeClient}
                  onSelectActiveClient={setActiveClient}
                  onAddFollowUp={handleAddFollowUp}
                  onUpdateFollowUpStatus={handleUpdateFollowUpStatus}
                  onDeleteFollowUp={handleDeleteFollowUp}
                />
              )}

              {activeTab === 'importar' && (
                <ImportExport
                  onImportClients={handleImportClients}
                  onImportVehicles={handleImportVehicles}
                  clients={clients}
                  vehicles={vehicles}
                />
              )}

              {activeTab === 'auditoria' && (
                <AuditLogs
                  auditLogs={auditLogs}
                  onClearLogs={() => {
                    mockDb.clearAuditLogs();
                    setAuditLogs([]);
                  }}
                />
              )}

              {activeTab === 'configuracion' && (
                <SettingsConfig
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  users={users}
                  currentUser={currentUser}
                  onSelectUser={handleUserChange}
                  onDownloadBackup={handleDownloadBackup}
                  onUploadBackup={handleUploadBackup}
                  onResetAll={handleResetAll}
                  onAddUser={handleAddUser}
                  onResetPassword={handleResetUserPassword}
                  onChangeMyPassword={handleChangeMyPassword}
                  onDeleteUser={handleDeleteUser}
                />
              )}

            </motion.div>
          </AnimatePresence>
        </main>
            </>
          );
        })()}
      </div>

      {/* Login Modal for Client / Staff Authentication */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        users={users}
        clients={clients}
        onLoginSuccess={handleUserChange}
        logoUrl={settings.logo}
      />

    </div>
  );
}
