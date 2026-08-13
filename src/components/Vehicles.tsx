import React, { useState, useEffect } from 'react';
import { Vehicle, VehicleState, Client, Settings, UserSession, PendingQuotationRequest, VallaCategory } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  SlidersHorizontal, 
  DollarSign, 
  Info, 
  Edit3, 
  Copy, 
  Trash2, 
  X,
  Check,
  AlertCircle,
  FileText,
  MessageSquare,
  Download,
  Presentation,
  MapPin,
  Layers,
  Inbox,
  Send,
  Eye,
  ExternalLink,
  Calculator,
  Grid,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateCatalogPdf, generateSingleVallaPdf } from '../utils/pdfGenerator';
import { mockDb } from '../data/mockDatabase';
import OOHMapView from './OOHMapView';

interface VehiclesProps {
  vehicles: Vehicle[];
  clients: Client[];
  activeClient: Client | null;
  onSelectActiveClient: (client: Client | null) => void;
  onAddVehicle: (vehicle: Omit<Vehicle, 'id' | 'fecha_registro' | 'fecha_actualizacion'>) => void;
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onSelectVehicleForWhatsApp: (vehicle: Vehicle) => void;
  onSelectVehicleForQuote: (vehicle: Vehicle) => void;
  onAssociateVehicleToClient: (clientId: string, vehicleId: string) => void;
  exchangeRate: number;
  currentUser: UserSession;
  settings: Settings;
  initialCategory?: string;
}

// Convert Google Drive share link into viewable image link
export function formatDriveUrl(url: string): string {
  if (!url) return 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600';
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return url;
}

// Calculate approximate printed banner (lona) cost in BOB
export function calculateLonaCostBob(medidasStr?: string, costoM2Bs?: number): { areaM2: number; totalCostBs: number } {
  const defaultCostoM2 = costoM2Bs || 65; // Default Bs 65 per m2
  if (!medidasStr) return { areaM2: 40, totalCostBs: 40 * defaultCostoM2 };
  
  const numbers = medidasStr.match(/(\d+(?:\.\d+)?)/g);
  let area = 40;
  if (numbers && numbers.length >= 2) {
    const w = parseFloat(numbers[0]);
    const h = parseFloat(numbers[1]);
    if (w > 0 && h > 0 && w < 100 && h < 100) {
      area = Math.round(w * h);
    }
  }
  return { areaM2: area, totalCostBs: Math.round(area * defaultCostoM2) };
}

export const VALLA_CATEGORIES: VallaCategory[] = [
  'Unipolar',
  'Estructural',
  'Pantalla LED',
  'Vía Peatonal',
  'Mural',
  'Parada de bus',
  'Teleféricos',
  'Puente Peatonal',
  'Letrero luminoso'
];

export default function Vehicles({
  vehicles,
  clients,
  activeClient,
  onSelectActiveClient,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onSelectVehicleForWhatsApp,
  onSelectVehicleForQuote,
  onAssociateVehicleToClient,
  exchangeRate,
  currentUser,
  settings,
  initialCategory
}: VehiclesProps) {
  
  const isDueno = currentUser.rol === 'Dueño';
  const isJefe = currentUser.rol === 'Jefe';
  const isVendedor = currentUser.rol === 'Vendedor';
  const isCliente = currentUser.rol === 'Cliente';

  // Filters states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'Todos');
  const [selectedCity, setSelectedCity] = useState<string>('Todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos');
  const [maxPrice, setMaxPrice] = useState<number>(10000);

  // Sync initialCategory if passed
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  // Form / Add / Edit Modal
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  
  // Valla / LED Fields
  const [tipoValla, setTipoValla] = useState<VallaCategory>('Unipolar');
  const [altoImpacto, setAltoImpacto] = useState<boolean>(false);
  const [zona, setZona] = useState('');
  const [cara, setCara] = useState<'Cara A' | 'Cara B' | 'Ambas Caras'>('Cara A');
  const [estado, setEstado] = useState<VehicleState>('Disponible');
  const [ciudad, setCiudad] = useState('Santa Cruz');
  const [avenidaCalle, setAvenidaCalle] = useState('');
  const [precioUsd, setPrecioUsd] = useState('');
  const [provincia, setProvincia] = useState('Andrés Ibáñez');
  const [medidas, setMedidas] = useState('10 x 4 m');
  const [transitabilidad, setTransitabilidad] = useState('Alto tráfico (150,000 veh/día)');
  const [costoLonaM2Bs, setCostoLonaM2Bs] = useState('65');
  const [detalle, setDetalle] = useState('');
  const [imgUrl, setImgUrl] = useState('');

  // Specs Modal state
  const [selectedSpecVehicle, setSelectedSpecVehicle] = useState<Vehicle | null>(null);

  // Pending Requests Inbox Drawer/Modal state
  const [showInbox, setShowInbox] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<PendingQuotationRequest[]>(() => mockDb.getPendingRequests());

  // Multi-select & PDF Presentation states
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [showPdfClientModal, setShowPdfClientModal] = useState(false);
  const [customPdfClientId, setCustomPdfClientId] = useState<string>('');
  const [pdfNotes, setPdfNotes] = useState('');

  // View mode state (Catalog Grid vs Interactive Map)
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // UI feedback
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Sync active client
  React.useEffect(() => {
    if (activeClient) {
      setCustomPdfClientId(activeClient.id);
    }
  }, [activeClient?.id]);

  // Refresh inbox
  const refreshInbox = () => {
    setPendingRequests(mockDb.getPendingRequests());
  };

  React.useEffect(() => {
    refreshInbox();
    const handleSync = () => {
      refreshInbox();
    };
    window.addEventListener('publix_new_request', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('publix_new_request', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Toggle multi-select item
  const handleToggleSelectVehicle = (id: string) => {
    setSelectedVehicleIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(vid => vid !== id);
      } else {
        if (prev.length >= 20) {
          alert('Límite de Selección: Puede seleccionar un máximo de hasta 20 vallas/pantallas para la presentación.');
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  // Claim/Take pending request by seller
  const handleClaimRequest = (reqId: string) => {
    const list = mockDb.getPendingRequests();
    const updated = list.map(req => {
      if (req.id === reqId) {
        return {
          ...req,
          estado: 'En atención' as const,
          vendedor_asignado: currentUser.nombre
        };
      }
      return req;
    });
    mockDb.savePendingRequests(updated);
    mockDb.addAuditLog(currentUser.nombre, 'Tomar Solicitud Cotización', `Atendiendo solicitud de ${updated.find(r => r.id === reqId)?.cliente_nombre}`);
    setPendingRequests(updated);
    alert(`¡Solicitud asignada a ${currentUser.nombre}! Ahora puedes contactar al cliente o generar su cotización.`);
  };

  // Complete request
  const handleMarkRequestDone = (reqId: string) => {
    const list = mockDb.getPendingRequests();
    const updated = list.map(req => {
      if (req.id === reqId) {
        return { ...req, estado: 'Cotizado' as const };
      }
      return req;
    });
    mockDb.savePendingRequests(updated);
    setPendingRequests(updated);
  };

  // Open PDF Client selector
  const handleOpenPdfModal = () => {
    if (selectedVehicleIds.length === 0) {
      alert('Por favor, seleccione al menos una valla o pantalla para generar la presentación PDF.');
      return;
    }
    setShowPdfClientModal(true);
  };

  // Generate Catalog PDF Presentation and create Pending Request
  const handleConfirmGeneratePdf = async () => {
    const targetClient = clients.find(c => c.id === customPdfClientId);
    if (!targetClient) {
      alert('Por favor, seleccione un cliente para la presentación PDF.');
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const selectedVallas = vehicles.filter(v => selectedVehicleIds.includes(v.id));
      
      // Call PDF Generator
      await generateCatalogPdf(selectedVallas, targetClient, exchangeRate);

      // Post request to Inbox for sales team
      const newRequest: PendingQuotationRequest = {
        id: Date.now().toString(),
        codigo: `SOL-${Date.now().toString().slice(-6)}`,
        cliente_id: targetClient.id,
        cliente_nombre: targetClient.nombre,
        cliente_empresa: targetClient.empresa || 'Empresa No Especificada',
        cliente_celular: targetClient.celular,
        vallas_ids: selectedVehicleIds,
        vallas_nombres: selectedVallas.map(v => `${v.tipo_valla || v.tipo} - ${v.avenida_calle || v.modelo} (${v.ciudad})`),
        fecha: new Date().toISOString(),
        estado: 'Pendiente',
        observaciones: pdfNotes || 'Presentación PDF solicitada desde catálogo'
      };

      const currentInbox = mockDb.getPendingRequests();
      mockDb.savePendingRequests([newRequest, ...currentInbox]);
      mockDb.addAuditLog(currentUser.nombre, 'Generación Presentación PDF', `Catálogo PDF generado para ${targetClient.nombre} (${selectedVallas.length} vallas)`);

      refreshInbox();
      alert(`✅ ¡Presentación PDF generada con éxito! Se ha registrado en la "Bandeja de Solicitudes Pendientes" para seguimiento comercial.`);
      
      setShowPdfClientModal(false);
      setIsMultiSelect(false);
      setSelectedVehicleIds([]);
      setPdfNotes('');
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al generar la presentación PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Download Single Ficha Técnica PDF for a Billboard/LED Screen
  const handleDownloadSinglePdf = async (valla: Vehicle) => {
    try {
      await generateSingleVallaPdf(valla, exchangeRate, activeClient, undefined, settings);
      mockDb.addAuditLog(currentUser.nombre, 'Ficha Técnica PDF', `Descargó Ficha Técnica OOH para COD-${valla.id}`);
    } catch (err) {
      console.error(err);
      alert('Error al generar la ficha técnica en PDF.');
    }
  };

  // Reset Form fields
  const resetFormFields = () => {
    setIsEditing(false);
    setEditId('');
    setTipoValla('Unipolar');
    setAltoImpacto(false);
    setZona('');
    setCara('Cara A');
    setEstado('Disponible');
    setCiudad('Santa Cruz');
    setAvenidaCalle('');
    setPrecioUsd('');
    setProvincia('Andrés Ibáñez');
    setMedidas('10 x 4 m');
    setTransitabilidad('Alto tráfico (150,000 veh/día)');
    setCostoLonaM2Bs('65');
    setDetalle('');
    setImgUrl('');
    setFormError('');
    setFormSuccess('');
  };

  // Handle Edit Click
  const handleEditClick = (v: Vehicle) => {
    setFormError('');
    setFormSuccess('');
    setIsEditing(true);
    setEditId(v.id);
    setTipoValla(v.tipo_valla || (v.tipo as any) || 'Unipolar');
    setAltoImpacto(!!v.alto_impacto);
    setZona(v.zona || '');
    setCara((v.cara as any) || 'Cara A');
    setEstado(v.estado);
    setCiudad(v.ciudad || 'Santa Cruz');
    setAvenidaCalle(v.avenida_calle || v.modelo || '');
    setPrecioUsd(String(v.precio_usd));
    setProvincia(v.provincia || 'Andrés Ibáñez');
    setMedidas(v.medidas || '10 x 4 m');
    setTransitabilidad(v.transitabilidad_trafico || '');
    setCostoLonaM2Bs(String(v.costo_lona_m2_bs || 65));
    setDetalle(v.detalle || v.descripcion || '');
    setImgUrl(v.imagen_principal || '');
    setShowForm(true);
  };

  // Handle Delete (Strictly restricted to Dueño)
  const handleDeleteClick = (v: Vehicle) => {
    if (!isDueno) {
      alert('⛔ Acceso denegado: Únicamente el usuario con rol Dueño tiene permisos para eliminar Vallas o Pantallas del catálogo.');
      return;
    }
    if (confirm(`¿Está seguro de eliminar la valla "${v.tipo_valla || v.tipo} - ${v.avenida_calle || v.modelo}"? Esta acción no se puede deshacer.`)) {
      onDeleteVehicle(v.id);
      mockDb.addAuditLog(currentUser.nombre, 'Eliminar Valla', `Eliminada valla ${v.id}`);
    }
  };

  // Save Valla / Pantalla LED Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const parsedPrice = Number(precioUsd);
    if (!avenidaCalle.trim() || !precioUsd || isNaN(parsedPrice) || parsedPrice <= 0) {
      return setFormError('Por favor ingrese la Avenida/Calle y un precio mensual válido en USD.');
    }

    const formattedImg = formatDriveUrl(imgUrl.trim());

    const vehicleData: Partial<Vehicle> = {
      marca: 'PUBLI-X',
      modelo: avenidaCalle.trim(),
      version: `${tipoValla} - ${zona || 'Sin Zona'} (${cara})`,
      anio: 2025,
      tipo: tipoValla as any,
      tipo_valla: tipoValla,
      alto_impacto: altoImpacto,
      zona: zona.trim(),
      cara,
      ciudad,
      avenida_calle: avenidaCalle.trim(),
      provincia: provincia.trim(),
      medidas: medidas.trim(),
      transitabilidad_trafico: transitabilidad.trim(),
      costo_lona_m2_bs: Number(costoLonaM2Bs) || 65,
      detalle: detalle.trim(),
      descripcion: `${tipoValla} en ${avenidaCalle}. Medidas: ${medidas}. Tráfico: ${transitabilidad}.`,
      precio_usd: parsedPrice,
      precio_original_usd: parsedPrice,
      estado,
      imagen_principal: formattedImg || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600',
      imagenes: [formattedImg]
    };

    if (isEditing) {
      const original = vehicles.find(v => v.id === editId);
      if (original) {
        onUpdateVehicle({
          ...original,
          ...vehicleData,
          id: editId,
          fecha_actualizacion: new Date().toISOString()
        } as Vehicle);
        mockDb.addAuditLog(currentUser.nombre, 'Editar Valla', `Actualizada Valla ${editId}`);
        setFormSuccess('Valla/Pantalla actualizada correctamente.');
      }
    } else {
      onAddVehicle(vehicleData as any);
      mockDb.addAuditLog(currentUser.nombre, 'Registrar Valla', `Registrada nueva Valla: ${tipoValla} en ${avenidaCalle}`);
      setFormSuccess('Nueva Valla/Pantalla registrada con éxito en el catálogo.');
    }

    setTimeout(() => {
      setShowForm(false);
      resetFormFields();
    }, 1200);
  };

  // Filter vehicles/vallas list
  const filteredVehicles = vehicles.filter(v => {
    const query = search.toLowerCase();
    const vCategory = v.tipo_valla || v.tipo || '';
    const vLocation = `${v.ciudad} ${v.zona} ${v.avenida_calle} ${v.modelo} ${v.provincia}`.toLowerCase();

    const matchesSearch = vLocation.includes(query) || vCategory.toLowerCase().includes(query) || v.id.includes(query);
    const matchesCategory = selectedCategory === 'Todos'
      ? true
      : selectedCategory === 'Alto Impacto'
      ? (v.alto_impacto === true || vCategory === 'Unipolar' || vCategory === 'Estructural' || (v.zona && v.zona.toLowerCase().includes('alto impacto')))
      : vCategory === selectedCategory;
    const matchesCity = selectedCity === 'Todos' || v.ciudad === selectedCity;
    const matchesStatus = selectedStatus === 'Todos' || v.estado === selectedStatus;
    const matchesPrice = v.precio_usd <= maxPrice;

    return matchesSearch && matchesCategory && matchesCity && matchesStatus && matchesPrice;
  });

  const pendingCount = pendingRequests.filter(r => r.estado === 'Pendiente').length;

  return (
    <div className="space-y-6" id="vallas-catalog-view">
      
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-2xl border border-amber-100/80 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        
        {/* Active Client Selection */}
        <div className="flex items-center space-x-3 bg-amber-50/60 px-3.5 py-2 rounded-xl border border-amber-200/50">
          <Layers className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-[10px] text-amber-800 font-extrabold uppercase tracking-wider">Cliente Activo para Presentación</span>
            <select
              value={activeClient ? activeClient.id : ''}
              onChange={(e) => {
                const client = clients.find(c => c.id === e.target.value) || null;
                onSelectActiveClient(client);
              }}
              className="text-xs font-bold text-gray-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="">-- Seleccionar Cliente para Cotizar --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.empresa ? `${c.empresa} (${c.nombre})` : c.nombre}
                </option>
              ))}
            </select>
          </div>
          {activeClient && (
            <button 
              onClick={() => onSelectActiveClient(null)} 
              className="p-1 hover:bg-amber-200 rounded text-amber-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">

          {/* View Mode Switcher (Grid vs Interactive Map) */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-gray-900 shadow-2xs font-extrabold' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Catálogo</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                viewMode === 'map' ? 'bg-amber-600 text-white shadow-2xs font-extrabold' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Mapa OOH</span>
            </button>
          </div>
          
          {/* Inbox Solicitudes Button (Only for Internal Staff) */}
          {!isCliente && (
            <button
              onClick={() => {
                refreshInbox();
                setShowInbox(true);
              }}
              className="relative bg-white hover:bg-gray-50 border border-amber-300 text-amber-900 font-bold py-2 px-3.5 rounded-xl text-xs transition shadow-2xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Inbox className="w-4 h-4 text-amber-600" />
              <span>Bandeja de Solicitudes</span>
              {pendingCount > 0 && (
                <span className="ml-1 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>
          )}

          {/* Multi-Select Toggle / Presentation / Client Cart Button */}
          <button
            onClick={() => {
              if (!isMultiSelect) {
                setIsMultiSelect(true);
              } else if (selectedVehicleIds.length > 0) {
                handleOpenPdfModal();
              } else {
                setIsMultiSelect(false);
              }
            }}
            className={`font-bold py-2 px-4 rounded-xl transition text-xs shadow-xs flex items-center space-x-1.5 cursor-pointer border ${
              isMultiSelect 
                ? 'bg-amber-600 border-amber-700 text-white hover:bg-amber-700' 
                : 'bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900'
            }`}
          >
            <Presentation className="w-4 h-4" />
            <span>
              {isCliente
                ? (!isMultiSelect 
                    ? '🛒 Ver Carrito / Seleccionar Vallas' 
                    : selectedVehicleIds.length > 0 
                      ? `Enviar Solicitud (${selectedVehicleIds.length} vallas)` 
                      : 'Cancelar Selección')
                : (!isMultiSelect 
                    ? 'Seleccionar Vallas para PDF' 
                    : selectedVehicleIds.length > 0 
                      ? `Crear Presentación (${selectedVehicleIds.length})` 
                      : 'Cancelar Selección')}
            </span>
          </button>

          {/* AGREGAR PRODUCTOS Button (Only for Internal Staff) */}
          {!isCliente && (
            <button
              onClick={() => {
                resetFormFields();
                setShowForm(prev => !prev);
              }}
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black py-2 px-4 rounded-xl hover:from-amber-600 hover:to-amber-700 transition text-xs shadow-xs flex items-center space-x-1.5 cursor-pointer uppercase tracking-wider"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>AGREGAR PRODUCTOS</span>
            </button>
          )}
        </div>
      </div>

      {/* Categories quick bar */}
      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs overflow-x-auto flex items-center space-x-2">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider px-2 whitespace-nowrap">Categorías:</span>
        <button
          onClick={() => setSelectedCategory('Todos')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            selectedCategory === 'Todos'
              ? 'bg-amber-500 text-white shadow-2xs'
              : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
          }`}
        >
          Todos ({vehicles.length})
        </button>

        <button
          onClick={() => setSelectedCategory('Alto Impacto')}
          className={`px-3.5 py-1 rounded-lg text-xs font-black transition whitespace-nowrap cursor-pointer flex items-center gap-1 ${
            selectedCategory === 'Alto Impacto'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-2xs'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
          }`}
        >
          <span>⭐ Alto Impacto</span>
          <span>({vehicles.filter(v => v.alto_impacto || (v.tipo_valla || v.tipo) === 'Unipolar' || (v.tipo_valla || v.tipo) === 'Estructural').length})</span>
        </button>
        {VALLA_CATEGORIES.map((cat) => {
          const count = vehicles.filter(v => (v.tipo_valla || v.tipo) === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* FORM MODAL FOR ADDING / EDITING PRODUCTS */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white p-6 rounded-2xl border border-amber-200 shadow-lg space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-gray-800 text-lg font-display">
                  {isEditing ? 'Editar Datos de la Valla / Pantalla' : 'Ingresar Nueva Valla o Pantalla LED al Catálogo'}
                </h3>
              </div>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              {/* Tipo de Valla */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Tipo de Valla / Publicidad *</label>
                <select
                  value={tipoValla}
                  onChange={(e) => setTipoValla(e.target.value as VallaCategory)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold text-gray-800"
                  required
                >
                  {VALLA_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Ubicación de Alto Impacto Checkbox */}
              <div className="flex items-end pb-1">
                <label className="flex items-center space-x-2 cursor-pointer bg-amber-50 hover:bg-amber-100 p-2.5 rounded-xl border border-amber-200 w-full transition">
                  <input
                    type="checkbox"
                    checked={altoImpacto}
                    onChange={(e) => setAltoImpacto(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="text-xs font-black text-amber-900">⭐ Ubicación de Alto Impacto</span>
                </label>
              </div>

              {/* Ciudad */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Ciudad *</label>
                <select
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-semibold text-gray-800"
                >
                  <option value="Santa Cruz">Santa Cruz de la Sierra</option>
                  <option value="La Paz">La Paz</option>
                  <option value="El Alto">El Alto</option>
                  <option value="Cochabamba">Cochabamba</option>
                  <option value="Tarija">Tarija</option>
                  <option value="Sucre">Sucre</option>
                  <option value="Oruro">Oruro</option>
                  <option value="Potosí">Potosí</option>
                  <option value="Beni">Trinidad (Beni)</option>
                  <option value="Cobija">Cobija (Pando)</option>
                </select>
              </div>

              {/* Zona */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Zona / Barrio</label>
                <input
                  type="text"
                  value={zona}
                  onChange={(e) => setZona(e.target.value)}
                  placeholder="Ej. Equipetrol, Zona Norte, Sopocachi"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium text-gray-800"
                />
              </div>

              {/* Avenida o Calle */}
              <div className="md:col-span-2">
                <label className="block font-bold text-gray-700 mb-1">Avenida o Calle (Ubicación Exacta) *</label>
                <input
                  type="text"
                  value={avenidaCalle}
                  onChange={(e) => setAvenidaCalle(e.target.value)}
                  placeholder="Ej. Av. Banzer y 4to Anillo, FRENTE A MALL VENTURA"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold text-gray-800"
                  required
                />
              </div>

              {/* Cara */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Cara Exhibida *</label>
                <select
                  value={cara}
                  onChange={(e) => setCara(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-semibold text-gray-800"
                >
                  <option value="Cara A">Cara A</option>
                  <option value="Cara B">Cara B</option>
                  <option value="Ambas Caras">Ambas Caras (A y B)</option>
                </select>
              </div>

              {/* Disponibilidad */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Estado de Disponibilidad *</label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as VehicleState)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-bold text-gray-800"
                >
                  <option value="Disponible">Disponible</option>
                  <option value="Reservado">Reservado</option>
                  <option value="En instalación">En instalación</option>
                  <option value="Próximamente">Próximamente</option>
                </select>
              </div>

              {/* Precio Alquiler $us */}
              <div>
                <label className="block font-bold text-amber-800 mb-1">Precio Alquiler Mensual ($us) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-amber-600">$</span>
                  <input
                    type="number"
                    value={precioUsd}
                    onChange={(e) => setPrecioUsd(e.target.value)}
                    placeholder="Ej. 1200"
                    className="w-full pl-7 pr-3 py-2 bg-amber-50/50 border border-amber-200 rounded-xl focus:outline-none focus:border-amber-500 font-mono font-black text-amber-700"
                    required
                  />
                </div>
                {precioUsd && !isNaN(Number(precioUsd)) && (
                  <span className="text-[10px] text-gray-500 font-medium block mt-1">
                    Eqv: Bs. {Math.round(Number(precioUsd) * exchangeRate).toLocaleString()} (T/C {exchangeRate})
                  </span>
                )}
              </div>

              {/* Provincia */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Provincia</label>
                <input
                  type="text"
                  value={provincia}
                  onChange={(e) => setProvincia(e.target.value)}
                  placeholder="Ej. Andrés Ibáñez, Murillo"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium text-gray-800"
                />
              </div>

              {/* Medidas */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Medidas (Ancho x Alto) *</label>
                <input
                  type="text"
                  value={medidas}
                  onChange={(e) => setMedidas(e.target.value)}
                  placeholder="Ej. 10 x 4 m"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-mono font-semibold text-gray-800"
                  required
                />
              </div>

              {/* Costo Lona m2 Bs */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Costo Lona por m² (Bs.)</label>
                <input
                  type="number"
                  value={costoLonaM2Bs}
                  onChange={(e) => setCostoLonaM2Bs(e.target.value)}
                  placeholder="Ej. 65"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-mono font-semibold text-gray-800"
                />
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  Aprox Lona: Bs. {calculateLonaCostBob(medidas, Number(costoLonaM2Bs)).totalCostBs.toLocaleString()}
                </span>
              </div>

              {/* Transitabilidad */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Transitabilidad / Tráfico Vehicular</label>
                <input
                  type="text"
                  value={transitabilidad}
                  onChange={(e) => setTransitabilidad(e.target.value)}
                  placeholder="Ej. Alto tráfico, 180,000 veh/día"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium text-gray-800"
                />
              </div>

              {/* Foto Google Drive / URL */}
              <div className="md:col-span-3">
                <label className="block font-bold text-gray-700 mb-1">Enlace de Foto (Google Drive o URL Directa)</label>
                <input
                  type="text"
                  value={imgUrl}
                  onChange={(e) => setImgUrl(e.target.value)}
                  placeholder="Pegue aquí el link de carpeta o imagen de Google Drive o URL..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-mono text-gray-700"
                />
                <span className="text-[10px] text-gray-400 block mt-1">
                  💡 Admite enlaces de Google Drive compartidos. Se convertirán automáticamente para previsualizar.
                </span>
              </div>

              {/* Detalle / Observaciones */}
              <div className="md:col-span-3">
                <label className="block font-bold text-gray-700 mb-1">Detalle / Especificaciones de la Estructura</label>
                <textarea
                  value={detalle}
                  onChange={(e) => setDetalle(e.target.value)}
                  placeholder="Ej. Iluminación nocturna foco LED 400W, excelente ángulo de visión desde rotonda..."
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 resize-none font-medium text-gray-800"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="md:col-span-3 flex justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold uppercase transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black uppercase tracking-wider transition cursor-pointer shadow-xs"
                >
                  {isEditing ? 'Guardar Cambios' : 'Ingresar Valla al Catálogo'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAP VIEW MODE vs CATALOG GRID MODE */}
      {viewMode === 'map' ? (
        <OOHMapView
          vehicles={vehicles}
          exchangeRate={exchangeRate}
          onSelectVehicleSpec={(valla) => setSelectedSpecVehicle(valla)}
          onSelectVehicleForWhatsApp={(valla) => onSelectVehicleForWhatsApp(valla)}
          onSelectVehicleForQuote={(valla) => onSelectVehicleForQuote(valla)}
          onDownloadSinglePdf={(valla) => handleDownloadSinglePdf(valla)}
        />
      ) : (
        /* MAIN CATALOG GRID + FILTERS */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Filter Sidebar */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs h-fit space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-gray-50 text-gray-700">
            <SlidersHorizontal className="w-4 h-4 text-amber-500" />
            <h4 className="font-extrabold text-xs uppercase tracking-wider font-display">Filtros de Búsqueda</h4>
          </div>

          <div className="space-y-4 text-xs">
            
            {/* Search Input */}
            <div>
              <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Búsqueda Rápida</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Calle, zona, código..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* City Filter */}
            <div>
              <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Ciudad</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 cursor-pointer"
              >
                <option value="Todos">Todas las ciudades</option>
                <option value="Santa Cruz">Santa Cruz</option>
                <option value="La Paz">La Paz</option>
                <option value="Cochabamba">Cochabamba</option>
                <option value="Tarija">Tarija</option>
                <option value="Sucre">Sucre</option>
                <option value="Oruro">Oruro</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Estado de Disponibilidad</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 cursor-pointer"
              >
                <option value="Todos">Todos los estados</option>
                <option value="Disponible">Disponible</option>
                <option value="Reservado">Reservado</option>
                <option value="En instalación">En instalación</option>
                <option value="Próximamente">Próximamente</option>
              </select>
            </div>

            {/* Price Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-gray-400 uppercase tracking-wider">Precio Máx ($us)</label>
                <span className="font-mono font-bold text-amber-600">${maxPrice.toLocaleString()} USD</span>
              </div>
              <input
                type="range"
                min={200}
                max={15000}
                step={200}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-gray-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Right Product Grid */}
        <div className="lg:col-span-3 space-y-4">
          
          <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
            <span>Se encontraron <b>{filteredVehicles.length}</b> espacios de publicidad</span>
            {isMultiSelect && (
              <span className="text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 animate-pulse">
                Modo Selección Activo: {selectedVehicleIds.length} vallas marcadas
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredVehicles.map((valla) => {
              const categoryName = valla.tipo_valla || valla.tipo || 'Unipolar';
              const isSelected = selectedVehicleIds.includes(valla.id);
              const priceBob = Math.round(valla.precio_usd * exchangeRate);
              const lonaCost = calculateLonaCostBob(valla.medidas, valla.costo_lona_m2_bs);

              return (
                <motion.div
                  layout
                  key={valla.id}
                  whileHover={{ y: isMultiSelect ? 0 : -3 }}
                  onClick={() => {
                    if (isMultiSelect) handleToggleSelectVehicle(valla.id);
                  }}
                  className={`bg-white rounded-2xl overflow-hidden shadow-2xs hover:shadow-xs flex flex-col justify-between transition-all duration-200 ${
                    isMultiSelect
                      ? isSelected
                        ? 'border-2 border-amber-600 ring-2 ring-amber-100 cursor-pointer shadow-sm'
                        : 'border border-gray-100 hover:border-amber-300 cursor-pointer'
                      : 'border border-gray-100'
                  }`}
                >
                  {/* Image Banner */}
                  <div className="relative h-44 bg-slate-900 overflow-hidden group">
                    <img
                      src={formatDriveUrl(valla.imagen_principal)}
                      alt={valla.modelo}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600';
                      }}
                    />

                    {/* Checkbox multi-select overlay */}
                    {isMultiSelect && (
                      <div className="absolute right-3 top-3 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelectVehicle(valla.id);
                          }}
                          className={`w-7 h-7 rounded-full flex items-center justify-center border-2 shadow-md transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 border-amber-600 text-white scale-110'
                              : 'bg-white/90 border-gray-300 text-transparent hover:bg-white'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3] text-white" />
                        </button>
                      </div>
                    )}

                    {/* Badge Category & Status */}
                    <div className="absolute left-3 top-3 flex flex-col space-y-1">
                      <span className="px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-black/75 backdrop-blur-xs text-amber-400 border border-amber-400/30">
                        {categoryName}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${
                        valla.estado === 'Disponible' ? 'bg-emerald-500 text-white' :
                        valla.estado === 'Reservado' ? 'bg-amber-500 text-white' :
                        valla.estado === 'En instalación' ? 'bg-blue-500 text-white' :
                        'bg-purple-500 text-white'
                      }`}>
                        {valla.estado}
                      </span>
                    </div>

                    <span className="absolute right-3 bottom-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] text-white font-mono font-bold">
                      COD-{valla.id}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    
                    <div>
                      <div className="flex items-center space-x-1 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                        <MapPin className="w-3 h-3 text-amber-600" />
                        <span>{valla.ciudad} • {valla.zona || 'Centro'}</span>
                      </div>

                      <h4 className="font-bold text-gray-800 text-sm leading-tight font-display mt-0.5 line-clamp-2">
                        {valla.avenida_calle || valla.modelo}
                      </h4>

                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="px-2 py-0.5 bg-gray-100 rounded font-bold text-gray-600">
                          {valla.cara || 'Cara A'}
                        </span>
                        <span className="font-mono text-gray-500 font-semibold">
                          📏 {valla.medidas || '10 x 4 m'}
                        </span>
                      </div>

                      {/* Pricing view */}
                      <div className="mt-3 pt-2 border-t border-gray-100 flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] text-gray-400 font-bold block">ALQUILER MENSUAL</span>
                          <div className="flex items-baseline space-x-1 text-amber-600">
                            <span className="text-lg font-black font-mono">${valla.precio_usd.toLocaleString()}</span>
                            <span className="text-[10px] font-bold">USD</span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-medium">Bs. {priceBob.toLocaleString()} (T/C {exchangeRate})</p>
                        </div>

                        <div className="text-right">
                          <span className="text-[9px] text-gray-400 font-bold block">LONA IMPRESA (APROX)</span>
                          <span className="text-xs font-bold text-gray-700 font-mono block">
                            Bs. {lonaCost.totalCostBs.toLocaleString()}
                          </span>
                          <span className="text-[9px] text-gray-400 font-mono">({lonaCost.areaM2} m²)</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-1.5" onClick={(e) => isMultiSelect && e.stopPropagation()}>
                      
                      {/* Specs Modal Trigger */}
                      <button
                        onClick={() => setSelectedSpecVehicle(valla)}
                        className="flex-1 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition cursor-pointer"
                        title="Ver Detalle Completo"
                      >
                        <Info className="w-3.5 h-3.5 text-amber-600" />
                        <span>Detalle</span>
                      </button>

                      {/* Client Cart Add/Remove Button */}
                      {isCliente ? (
                        <button
                          onClick={() => {
                            if (!isMultiSelect) setIsMultiSelect(true);
                            handleToggleSelectVehicle(valla.id);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer border ${
                            isSelected
                              ? 'bg-amber-600 border-amber-700 text-white'
                              : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900'
                          }`}
                        >
                          <Check className={`w-3.5 h-3.5 ${isSelected ? 'inline-block' : 'hidden'}`} />
                          <span>{isSelected ? 'Agregado 🛒' : '+ Carrito'}</span>
                        </button>
                      ) : (
                        <>
                          {/* Edit Button (Internal Staff) */}
                          <button
                            onClick={() => handleEditClick(valla)}
                            className="p-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-amber-700 rounded-xl transition cursor-pointer"
                            title="Editar Datos"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Button (STRICTLY Dueño Only) */}
                          {isDueno && (
                            <button
                              onClick={() => handleDeleteClick(valla)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 rounded-xl transition cursor-pointer"
                              title="Eliminar Valla (Sólo Dueño)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}

                      {/* Direct WhatsApp Contact */}
                      <button
                        onClick={() => onSelectVehicleForWhatsApp(valla)}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition cursor-pointer"
                        title="Enviar por WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      {/* Direct Single PDF Ficha Técnica Download */}
                      <button
                        onClick={() => handleDownloadSinglePdf(valla)}
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl transition cursor-pointer"
                        title="Descargar Ficha Técnica PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {/* Direct Quote Generator (Staff Only) */}
                      {!isCliente && (
                        <button
                          onClick={() => onSelectVehicleForQuote(valla)}
                          className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl transition cursor-pointer"
                          title="Generar Cotización Individual"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
                );
              })}

            {filteredVehicles.length === 0 && (
              <div className="col-span-3 text-center py-20 bg-white rounded-2xl border border-gray-100 text-gray-400 text-xs font-medium">
                No hay vallas publicitarias o pantallas registradas que coincidan con los filtros aplicados.
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* DETAILED SPECIFICATIONS MODAL - EXPANDED WIDE VIEW */}
      <AnimatePresence>
        {selectedSpecVehicle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-5xl lg:max-w-6xl w-full overflow-hidden flex flex-col max-h-[92vh]"
            >
              {/* Top Modal Header Bar */}
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <span className="px-2.5 py-1 bg-amber-500 text-slate-950 font-extrabold text-[11px] rounded-lg uppercase tracking-wider font-mono">
                    {selectedSpecVehicle.tipo_valla || selectedSpecVehicle.tipo} • COD-{selectedSpecVehicle.id}
                  </span>
                  <h3 className="text-lg font-extrabold font-display text-white truncate max-w-md md:max-w-xl">
                    {selectedSpecVehicle.avenida_calle || selectedSpecVehicle.modelo}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedSpecVehicle(null)}
                  className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                  title="Cerrar ventana"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body - 2 Column Side-By-Side Grid */}
              <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 text-xs">
                
                {/* Left Column: Big Image Display & Quick Contact */}
                <div className="md:col-span-6 flex flex-col space-y-4">
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 h-64 md:h-80 shadow-inner group">
                    <img
                      src={formatDriveUrl(selectedSpecVehicle.imagen_principal)}
                      alt={selectedSpecVehicle.modelo}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    
                    <div className="absolute left-4 bottom-4 right-4 flex items-center justify-between text-white">
                      <div>
                        <p className="text-xs font-bold text-amber-400">
                          📍 {selectedSpecVehicle.ciudad} • {selectedSpecVehicle.zona || 'Centro'}
                        </p>
                        <p className="text-[11px] text-gray-300 font-medium">
                          {selectedSpecVehicle.cara || 'Cara A'} • {selectedSpecVehicle.provincia || 'Andrés Ibáñez'}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-500 text-slate-950 text-xs font-black rounded-xl uppercase tracking-wider shadow-xs">
                        {selectedSpecVehicle.estado}
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Toolbar inside modal */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => {
                        const imageUrl = formatDriveUrl(selectedSpecVehicle.imagen_principal);
                        const phone = activeClient?.celular ? activeClient.celular.replace(/[^\d]/g, '') : '';
                        const encoded = encodeURIComponent(imageUrl);
                        const waUrl = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
                        window.open(waUrl, '_blank');
                      }}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition flex items-center justify-center space-x-1.5 text-xs cursor-pointer shadow-xs uppercase tracking-wider"
                      title="Enviar únicamente la foto/link a WhatsApp sin texto"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Solo Foto</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectVehicleForWhatsApp(selectedSpecVehicle);
                      }}
                      className="py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl transition flex items-center justify-center space-x-1.5 text-xs cursor-pointer shadow-xs uppercase tracking-wider"
                      title="Enviar foto + plantilla de texto prediseñado"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Foto + Texto</span>
                    </button>

                    <button
                      onClick={() => {
                        handleDownloadSinglePdf(selectedSpecVehicle);
                      }}
                      className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition flex items-center justify-center space-x-1.5 text-xs cursor-pointer shadow-xs uppercase tracking-wider"
                      title="Descargar Ficha Técnica en PDF para este espacio"
                    >
                      <Download className="w-4 h-4" />
                      <span>Ficha PDF</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectVehicleForQuote(selectedSpecVehicle);
                        setSelectedSpecVehicle(null);
                      }}
                      className="py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl transition flex items-center justify-center space-x-1.5 text-xs cursor-pointer shadow-xs uppercase tracking-wider"
                      title="Generar cotización PDF formal"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Cotizar PDF</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Complete Technical Specifications & Calculations */}
                <div className="md:col-span-6 flex flex-col justify-between space-y-4">
                  
                  {/* Price & Printing Cost Panel */}
                  <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/80 grid grid-cols-2 gap-4 shadow-2xs">
                    <div>
                      <span className="text-[10px] text-amber-900 font-extrabold uppercase tracking-wider block">Alquiler Mensual</span>
                      <div className="flex items-baseline space-x-1.5 mt-0.5">
                        <span className="text-2xl font-black font-mono text-amber-600">${selectedSpecVehicle.precio_usd.toLocaleString()}</span>
                        <span className="text-xs font-bold text-gray-500">USD</span>
                      </div>
                      <span className="text-[11px] text-gray-600 font-mono font-bold block mt-0.5">
                        Bs. {Math.round(selectedSpecVehicle.precio_usd * exchangeRate).toLocaleString()} BOB (T/C {exchangeRate})
                      </span>
                    </div>

                    <div className="border-l border-amber-200/80 pl-4">
                      <span className="text-[10px] text-amber-900 font-extrabold uppercase tracking-wider block">Costo Aprox. Lona Impresa</span>
                      <div className="flex items-baseline space-x-1.5 mt-0.5">
                        <span className="text-xl font-black font-mono text-gray-800">
                          Bs. {calculateLonaCostBob(selectedSpecVehicle.medidas, selectedSpecVehicle.costo_lona_m2_bs).totalCostBs.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium block mt-0.5">
                        Calculado sobre {calculateLonaCostBob(selectedSpecVehicle.medidas, selectedSpecVehicle.costo_lona_m2_bs).areaM2} m² @ Bs. {selectedSpecVehicle.costo_lona_m2_bs || 65}/m²
                      </span>
                    </div>
                  </div>

                  {/* Attributes Grid */}
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200/60">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Categoría de Estructura</span>
                      <span className="font-extrabold text-gray-800 text-xs">{selectedSpecVehicle.tipo_valla || selectedSpecVehicle.tipo}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Cara & Orientación</span>
                      <span className="font-extrabold text-gray-800 text-xs">{selectedSpecVehicle.cara || 'Cara A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Dimensiones / Medidas</span>
                      <span className="font-mono font-extrabold text-amber-700 text-xs">{selectedSpecVehicle.medidas || '10 x 4 m'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Flujo Vehicular / Tráfico</span>
                      <span className="font-semibold text-gray-800 text-xs">{selectedSpecVehicle.transitabilidad_trafico || 'Alto tráfico diario'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Ubicación / Municipio</span>
                      <span className="font-semibold text-gray-800 text-xs">{selectedSpecVehicle.ciudad} - {selectedSpecVehicle.provincia || 'Andrés Ibáñez'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Estado de Disponibilidad</span>
                      <span className="font-extrabold text-emerald-600 uppercase text-xs">{selectedSpecVehicle.estado}</span>
                    </div>
                  </div>

                  {/* Technical details note */}
                  {(selectedSpecVehicle.detalle || selectedSpecVehicle.descripcion) && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Especificaciones y Detalles de Ubicación</span>
                      <p className="text-gray-700 leading-relaxed font-sans bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs">
                        {selectedSpecVehicle.detalle || selectedSpecVehicle.descripcion}
                      </p>
                    </div>
                  )}

                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
                  PUBLI-X BOLIVIA • Espacio publicitario de alta visibilidad
                </span>
                <button
                  onClick={() => setSelectedSpecVehicle(null)}
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer ml-auto"
                >
                  Cerrar Detalle
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL CLIENT SELECTOR FOR PDF PRESENTATION */}
      <AnimatePresence>
        {showPdfClientModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-lg w-full p-6 space-y-5"
            >
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div className="flex items-center space-x-2 text-amber-700">
                  <Presentation className="w-5 h-5" />
                  <h3 className="font-extrabold text-lg font-display text-gray-800">
                    Generar Presentación PDF ({selectedVehicleIds.length} vallas)
                  </h3>
                </div>
                <button onClick={() => setShowPdfClientModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Seleccionar Cliente de la Cartera *</label>
                  <select
                    value={customPdfClientId}
                    onChange={(e) => setCustomPdfClientId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Elija un cliente existente --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.empresa ? `🏢 ${c.empresa} (${c.nombre})` : c.nombre} - {c.celular}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Notas / Observaciones de la Presentación</label>
                  <textarea
                    value={pdfNotes}
                    onChange={(e) => setPdfNotes(e.target.value)}
                    placeholder="Ej. Propuesta especial para campaña de verano 2025 con descuento por paquete..."
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 font-medium resize-none text-gray-800"
                  />
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                  💡 Al confirmar, se descargará el documento PDF con las fichas completas y se agregará un registro en la <b>"Bandeja de Solicitudes Pendientes"</b> para que los vendedores realicen el seguimiento comercial.
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPdfClientModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold transition text-xs uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isGeneratingPdf}
                  onClick={handleConfirmGeneratePdf}
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl transition text-xs shadow-xs uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>{isGeneratingPdf ? 'Generando PDF...' : 'Descargar PDF & Registrar Solicitud'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BANDEJA DE SOLICITUDES PENDIENTES DRAWER / MODAL */}
      <AnimatePresence>
        {showInbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-3xl w-full p-6 space-y-5 max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div className="flex items-center space-x-2 text-amber-700">
                  <button
                    onClick={() => setShowInbox(false)}
                    className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition flex items-center space-x-1 text-xs font-bold mr-1 cursor-pointer"
                    title="Volver atrás"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Volver atrás</span>
                  </button>
                  <Inbox className="w-5 h-5" />
                  <h3 className="font-extrabold text-lg font-display text-gray-800">
                    Bandeja de Solicitudes & Cotizaciones Pendientes
                  </h3>
                </div>
                <button onClick={() => setShowInbox(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 space-y-3 pr-1 text-xs">
                {pendingRequests.length > 0 ? (
                  pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className={`p-4 rounded-2xl border transition space-y-3 ${
                        req.estado === 'Pendiente' ? 'bg-amber-50/50 border-amber-200' :
                        req.estado === 'En atención' ? 'bg-blue-50/50 border-blue-200' :
                        'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-gray-800 text-sm">{req.cliente_nombre}</span>
                            {req.cliente_empresa && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-extrabold text-[10px] rounded uppercase">
                                🏢 {req.cliente_empresa}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-indigo-600 font-bold block mt-0.5">
                            📱 {req.cliente_celular}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            req.estado === 'Pendiente' ? 'bg-rose-500 text-white animate-pulse' :
                            req.estado === 'En atención' ? 'bg-blue-600 text-white' :
                            'bg-emerald-600 text-white'
                          }`}>
                            {req.estado}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {new Date(req.fecha).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Vallas list requested */}
                      <div className="space-y-1 bg-white p-2.5 rounded-xl border border-gray-100 text-[11px]">
                        <span className="font-bold text-gray-400 uppercase tracking-wider block text-[9px]">Vallas / Espacios Solicitados:</span>
                        {(req.vallas_nombres || []).map((res, i) => (
                          <div key={i} className="text-gray-700 font-medium">
                            • {res}
                          </div>
                        ))}
                      </div>

                      {req.sugerencia_cotizacion && (
                        <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-[11px] text-gray-800">
                          <b className="text-amber-900 block font-bold">💡 Requerimiento / Sugerencia del Cliente:</b>
                          <p className="italic mt-0.5">"{req.sugerencia_cotizacion}"</p>
                        </div>
                      )}

                      {req.imagenes_referencia && req.imagenes_referencia.length > 0 && (
                        <div className="space-y-1">
                          <span className="font-bold text-gray-500 uppercase tracking-wider block text-[9px]">🖼️ Imágenes de Referencia Adjuntas ({req.imagenes_referencia.length}):</span>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {req.imagenes_referencia.map((img, idx) => (
                              <a
                                key={idx}
                                href={img}
                                target="_blank"
                                rel="noreferrer"
                                className="block w-14 h-14 rounded-lg border border-amber-300 overflow-hidden hover:scale-105 transition shadow-xs"
                                title="Ver imagen de referencia"
                              >
                                <img src={img} alt="Referencia" className="w-full h-full object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {req.observaciones && (
                        <p className="text-gray-500 italic text-[11px]">"{req.observaciones}"</p>
                      )}

                      {req.dispositivo_detectado && (
                        <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                          <span>📱 Capturado desde:</span>
                          <span className="text-gray-600 font-semibold">{req.dispositivo_detectado}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs">
                        <span className="text-gray-400 text-[10px]">
                          Vendedor Asignado: <b className="text-gray-700">{req.vendedor_asignado || 'Ninguno (Libre)'}</b>
                        </span>

                        <div className="flex items-center space-x-2">
                          {req.estado === 'Pendiente' && (
                            <button
                              onClick={() => handleClaimRequest(req.id)}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition cursor-pointer text-xs shadow-2xs"
                            >
                              Tomar / Atender Solicitud
                            </button>
                          )}

                          {req.estado === 'En atención' && (
                            <button
                              onClick={() => handleMarkRequestDone(req.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition cursor-pointer text-xs"
                            >
                              Marcar como Cotizado
                            </button>
                          )}

                          <button
                            onClick={() => {
                              const cleanPhone = (req.cliente_celular || '').replace(/\+/g, '');
                              const msg = `Hola ${req.cliente_nombre}, le contactamos de PUBLI-X BOLIVIA 📢 en seguimiento a su solicitud de cotización para ${(req.vallas_nombres || []).length} espacios publicitarios. ¿En qué horario le podemos brindar detalles?`;
                              window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                            className="p-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100"
                            title="Contactar vía WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400 text-xs font-medium">
                    No hay solicitudes pendientes registadas en el buzón.
                  </div>
                )}
              </div>

              <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <button
                  onClick={() => setShowInbox(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver atrás</span>
                </button>
                <span className="text-[11px] text-gray-400 font-medium">PUBLI-X Bolivia</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
