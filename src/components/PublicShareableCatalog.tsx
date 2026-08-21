import React, { useState, useMemo } from 'react';
import { Vehicle, Settings } from '../types';
import { 
  Search, 
  MapPin, 
  Layers, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  MessageSquare, 
  Download, 
  Filter, 
  Sparkles, 
  Eye, 
  DollarSign, 
  Globe, 
  ArrowLeft,
  Smartphone,
  ChevronRight,
  Maximize2,
  X,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateCatalogPdf, generateSingleVallaPdf } from '../utils/pdfGenerator';
import OOHMapView from './OOHMapView';
import Logo from './Logo';

interface PublicShareableCatalogProps {
  vehicles: Vehicle[];
  settings: Settings;
  onBackToHome?: () => void;
  onOpenLeadModal?: (vehicle?: Vehicle) => void;
}

export default function PublicShareableCatalog({
  vehicles,
  settings,
  onBackToHome,
  onOpenLeadModal
}: PublicShareableCatalogProps) {
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('Todos');
  const [selectedType, setSelectedType] = useState('Todos');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedVehicleForDetail, setSelectedVehicleForDetail] = useState<Vehicle | null>(null);
  const [copiedCatalogLink, setCopiedCatalogLink] = useState(false);

  const exchangeRate = settings.tipo_cambio || 6.96;
  const companyPhone = (settings.whatsapp || settings.telefono || '+59170000000').replace(/[^\d]/g, '');

  const catalogUrl = typeof window !== 'undefined' ? `${window.location.origin}?view=catalogo` : 'https://publix.bo?view=catalogo';

  // Bolivian cities
  const cities = ['Todos', 'Santa Cruz', 'La Paz', 'Cochabamba', 'Tarija', 'Chuquisaca', 'Oruro', 'Potosí', 'Beni', 'Pando'];
  
  // Types
  const types = ['Todos', 'Unipolar', 'Pantalla LED', 'Pasarela / Puente Peatonal', 'Estructural', 'Mural', 'Vía Peatonal', 'Parada de bus'];

  // Filter logic
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const q = search.toLowerCase();
      const matchesSearch = 
        (v.codigo && v.codigo.toLowerCase().includes(q)) ||
        (v.tipo_valla && v.tipo_valla.toLowerCase().includes(q)) ||
        (v.avenida_calle && v.avenida_calle.toLowerCase().includes(q)) ||
        (v.ciudad && v.ciudad.toLowerCase().includes(q)) ||
        (v.zona && v.zona.toLowerCase().includes(q));

      const matchesCity = selectedCity === 'Todos' || v.ciudad.toLowerCase() === selectedCity.toLowerCase();
      const matchesType = selectedType === 'Todos' || (v.tipo_valla || v.tipo || '').toLowerCase().includes(selectedType.toLowerCase());
      const matchesAvail = !onlyAvailable || v.estado === 'Disponible';

      return matchesSearch && matchesCity && matchesType && matchesAvail;
    });
  }, [vehicles, search, selectedCity, selectedType, onlyAvailable]);

  const handleCopyCatalogLink = () => {
    navigator.clipboard.writeText(catalogUrl);
    setCopiedCatalogLink(true);
    setTimeout(() => setCopiedCatalogLink(false), 2000);
  };

  const handleShareCatalogWhatsApp = () => {
    const text = encodeURIComponent(
      `*CATÁLOGO DE VALLAS PUBLICITARIAS Y PANTALLAS LED - PUBLI-X BOLIVIA* 📢\n\nEstimado cliente, le compartimos nuestro catálogo interactivo con disponibilidad y ubicaciones estratégicas en tiempo real:\n\n🌐 Ver Catálogo en Línea: ${catalogUrl}\n\nQuedamos atentos a cualquier consulta.`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, 'publix_whatsapp_tab');
  };

  const handleQuoteOnWhatsApp = (v: Vehicle) => {
    const text = encodeURIComponent(
      `¡Hola PUBLI-X Bolivia! 📢 Deseo consultar disponibilidad y cotización para el siguiente espacio publicitario:\n\n📍 *[${v.codigo || v.id}] ${v.tipo_valla || v.tipo} - ${v.ciudad}*\n🏢 *Ubicación:* ${v.avenida_calle || v.modelo}\n📐 *Medidas:* ${v.medidas || '10x4 m'} (${v.cara || 'Cara A'})\n💰 *Tarifa:* $${v.precio_usd} USD/mes (Bs. ${Math.round(v.precio_usd * exchangeRate).toLocaleString('es-BO')})\n\nPor favor envíenme más información y disponibilidad.`
    );
    window.open(`https://api.whatsapp.com/send?phone=${companyPhone}&text=${text}`, 'publix_whatsapp_tab');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Top Banner & Navigation */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl transition cursor-pointer"
                title="Volver al Inicio"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <Logo size="md" />
            <div className="hidden sm:block pl-3 border-l border-slate-700">
              <span className="text-xs font-bold text-amber-400 block tracking-wide uppercase">Catálogo Público Compartible</span>
              <span className="text-[11px] text-gray-400">Cobertura Nacional en Bolivia • Tarifas en Tiempo Real</span>
            </div>
          </div>

          {/* Quick Sharing & Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyCatalogLink}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer border border-slate-700"
              title="Copiar link para enviar por WhatsApp o redes sociales"
            >
              {copiedCatalogLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-300" />}
              <span>{copiedCatalogLink ? '¡Link Copiado!' : 'Copiar Link'}</span>
            </button>

            <button
              onClick={handleShareCatalogWhatsApp}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir en WhatsApp</span>
            </button>

            <button
              onClick={() => {
                const defaultClient: any = {
                  id: 'public-visitor',
                  nombre: 'Catálogo General',
                  celular: companyPhone,
                  ciudad: 'Bolivia',
                  departamento: 'Bolivia',
                  pais: 'Bolivia',
                  presupuesto_usd: 0,
                  observaciones: '',
                  estado: 'Interesado',
                  fecha_registro: new Date().toISOString(),
                  fecha_actualizacion: new Date().toISOString()
                };
                generateCatalogPdf(filteredVehicles, defaultClient, exchangeRate, undefined, settings);
              }}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Catalog View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Search and Filters Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por avenida, zona, ciudad o código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>

            <div>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-amber-500"
              >
                {cities.map(c => (
                  <option key={c} value={c}>{c === 'Todos' ? '📍 Todas las Ciudades' : `📍 ${c}`}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-amber-500"
              >
                {types.map(t => (
                  <option key={t} value={t}>{t === 'Todos' ? '🏢 Todos los Formatos' : `🏢 ${t}`}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-gray-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500 bg-slate-950 border-slate-700"
                />
                <span>Mostrar solo vallas disponibles</span>
              </label>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400">
                Mostrando <strong className="text-amber-400">{filteredVehicles.length}</strong> espacios publicitarios
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'grid' ? 'bg-amber-500 text-black' : 'bg-slate-800 text-gray-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Cuadrícula</span>
              </button>

              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'map' ? 'bg-amber-500 text-black' : 'bg-slate-800 text-gray-300 hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Mapa Satelital GPS</span>
              </button>
            </div>
          </div>
        </div>

        {/* Map Mode View */}
        {viewMode === 'map' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs text-white">Mapa Satelital de Ubicaciones en Bolivia</span>
              </div>
              <span className="text-[11px] text-gray-400">Haga clic en cualquier marcador para cotizar</span>
            </div>
            <div className="h-[550px] rounded-2xl overflow-hidden border border-slate-700">
              <OOHMapView
                vehicles={filteredVehicles}
                exchangeRate={exchangeRate}
                onSelectVehicleSpec={(v) => setSelectedVehicleForDetail(v)}
                onSelectVehicleForWhatsApp={(v) => handleQuoteOnWhatsApp(v)}
                onSelectVehicleForQuote={(v) => handleQuoteOnWhatsApp(v)}
                onDownloadSinglePdf={(v) => generateSingleVallaPdf(v, exchangeRate, null, undefined, settings)}
              />
            </div>
          </div>
        )}

        {/* Grid Mode View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVehicles.map((v) => {
              const mainPhoto = v.drive_photos?.[0] || v.foto_url || v.imagen || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600';
              const isDispo = v.estado === 'Disponible';
              const priceBob = Math.round(v.precio_usd * exchangeRate);

              return (
                <motion.div
                  key={v.id}
                  layout
                  className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition flex flex-col group"
                >
                  {/* Photo Container */}
                  <div className="relative h-48 bg-slate-950 overflow-hidden cursor-pointer" onClick={() => setSelectedVehicleForDetail(v)}>
                    <img
                      src={mainPhoto}
                      alt={v.avenida_calle || v.modelo}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                    {/* Status & Code Badge */}
                    <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                      <span className="px-2.5 py-0.5 bg-slate-900/90 backdrop-blur-md text-white font-mono text-[11px] font-bold rounded-md border border-slate-700">
                        {v.codigo || v.id}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                        isDispo
                          ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700'
                          : 'bg-amber-950/90 text-amber-300 border-amber-700'
                      }`}>
                        {v.estado || 'Disponible'}
                      </span>
                    </div>

                    {/* City Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-0.5 bg-black/80 backdrop-blur-md text-amber-300 font-bold text-[10px] rounded-md border border-amber-500/30 flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{v.ciudad}</span>
                      </span>
                    </div>

                    {/* High Impact tag */}
                    {v.alto_impacto && (
                      <div className="absolute bottom-3 left-3">
                        <span className="px-2 py-0.5 bg-amber-500 text-black font-black text-[9px] rounded-md uppercase tracking-wider flex items-center space-x-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Alto Tráfico</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide block">
                        {v.tipo_valla || v.tipo || 'Valla Publicitaria'}
                      </span>
                      <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-amber-300 transition">
                        {v.avenida_calle || v.modelo || 'Ubicación Estratégica'}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                        {v.zona || 'Zona Central'} • {v.medidas || '10x4 m'} • {v.cara || 'Cara A'}
                      </p>
                    </div>

                    {/* Technical details badge */}
                    <div className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800 text-[11px] grid grid-cols-2 gap-2 text-gray-300">
                      <div>
                        <span className="text-gray-500 block text-[10px]">Iluminación:</span>
                        <span className="font-medium text-white">{v.iluminacion || 'Frontlight'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">Material:</span>
                        <span className="font-medium text-white">{v.material || 'Lona 13oz'}</span>
                      </div>
                    </div>

                    {/* Price and Actions */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-lg font-black text-white block">
                          ${v.precio_usd.toLocaleString()} <span className="text-xs font-normal text-gray-400">USD/mes</span>
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          Bs. {priceBob.toLocaleString('es-BO')} BOB
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => generateSingleVallaPdf(v, exchangeRate, null, undefined, settings)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-xl transition cursor-pointer"
                          title="Descargar Ficha Técnica en PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleQuoteOnWhatsApp(v)}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Cotizar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {filteredVehicles.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <Search className="w-8 h-8 text-gray-500 mx-auto" />
            <h3 className="font-bold text-base text-white">No se encontraron espacios con los filtros seleccionados</h3>
            <p className="text-xs text-gray-400">Intente modificando la ciudad, tipo de valla o término de búsqueda.</p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCity('Todos');
                setSelectedType('Todos');
                setOnlyAvailable(false);
              }}
              className="px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-xl hover:bg-amber-400 transition cursor-pointer"
            >
              Restablecer Filtros
            </button>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedVehicleForDetail && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 bg-slate-950 text-white flex justify-between items-center border-b border-slate-800">
                <div>
                  <span className="text-xs font-bold text-amber-400">[{selectedVehicleForDetail.codigo || selectedVehicleForDetail.id}] {selectedVehicleForDetail.tipo_valla || selectedVehicleForDetail.tipo}</span>
                  <h3 className="font-bold text-sm text-white">{selectedVehicleForDetail.avenida_calle || selectedVehicleForDetail.modelo}</h3>
                </div>
                <button
                  onClick={() => setSelectedVehicleForDetail(null)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 flex-1 overflow-y-auto space-y-4">
                <img
                  src={selectedVehicleForDetail.drive_photos?.[0] || selectedVehicleForDetail.foto_url || selectedVehicleForDetail.imagen || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600'}
                  alt={selectedVehicleForDetail.avenida_calle}
                  className="w-full h-64 object-cover rounded-2xl border border-slate-800"
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-gray-500 block text-[10px]">Ciudad / Depto</span>
                    <span className="font-bold text-white">{selectedVehicleForDetail.ciudad}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-gray-500 block text-[10px]">Zona</span>
                    <span className="font-bold text-white">{selectedVehicleForDetail.zona || 'Centro'}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-gray-500 block text-[10px]">Medidas</span>
                    <span className="font-bold text-white">{selectedVehicleForDetail.medidas || '10x4 m'}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-gray-500 block text-[10px]">Cara</span>
                    <span className="font-bold text-white">{selectedVehicleForDetail.cara || 'Cara A'}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-gray-500 block text-[10px]">Iluminación</span>
                    <span className="font-bold text-white">{selectedVehicleForDetail.iluminacion || 'Frontlight'}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-gray-500 block text-[10px]">Estado</span>
                    <span className="font-bold text-emerald-400">{selectedVehicleForDetail.estado || 'Disponible'}</span>
                  </div>
                </div>

                <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-amber-300/80 block font-medium">Inversión Mensual</span>
                    <span className="text-2xl font-black text-white">${selectedVehicleForDetail.precio_usd.toLocaleString()} USD</span>
                    <span className="text-xs text-gray-400 block">Bs. {Math.round(selectedVehicleForDetail.precio_usd * exchangeRate).toLocaleString('es-BO')} BOB</span>
                  </div>
                  <button
                    onClick={() => handleQuoteOnWhatsApp(selectedVehicleForDetail)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center space-x-2 cursor-pointer shadow-lg shadow-emerald-600/30"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Cotizar por WhatsApp</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-center text-xs text-gray-500">
        <p>© {new Date().getFullYear()} PUBLI-X BOLIVIA • Cobertura Nacional e Impacto Total • {settings.telefono || '+591 3 3559988'}</p>
      </footer>
    </div>
  );
}
