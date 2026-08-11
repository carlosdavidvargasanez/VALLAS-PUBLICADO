import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  Laptop, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Calculator, 
  MessageSquare, 
  Plus, 
  Trash2, 
  HelpCircle,
  FileText,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';
import { mockDb } from '../data/mockDatabase';
import { Client, UserSession, PendingQuotationRequest } from '../types';

interface OOHInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  solutionTitle?: string;
  solutionType?: string;
  currentUser?: UserSession | null;
  activeClient?: Client | null;
  logoUrl?: string;
}

export default function OOHInquiryModal({
  isOpen,
  onClose,
  solutionTitle = 'Soluciones OOH - Cotización & Sugerencia',
  solutionType = 'Vallas Monumentales & Pantallas LED',
  currentUser,
  activeClient,
  logoUrl
}: OOHInquiryModalProps) {
  // Device & browser detection state
  const [deviceInfo, setDeviceInfo] = useState<string>('');
  
  // User & Lead Contact Info State
  const [nombre, setNombre] = useState<string>('');
  const [empresa, setEmpresa] = useState<string>('');
  const [celular, setCelular] = useState<string>('');
  const [correo, setCorreo] = useState<string>('');
  const [ciudad, setCiudad] = useState<string>('La Paz');
  
  // Requirements & Suggestions Text State
  const [sugerencia, setSugerencia] = useState<string>('');
  const [presupuestoEstimado, setPresupuestoEstimado] = useState<string>('1500');

  // Reference Images State (Base64 or Sample URLs)
  const [imagenesReferencia, setImagenesReferencia] = useState<{ id: string; name: string; url: string; size?: string }[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Status & Confirmation State
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [submittedData, setSubmittedData] = useState<PendingQuotationRequest | null>(null);

  // Pre-fill user data & detect device info on mount / open
  useEffect(() => {
    if (!isOpen) return;

    // Detect device, OS, and browser automatically
    const ua = navigator.userAgent;
    let deviceType = 'PC Desktop / Laptop';
    if (/Android/i.test(ua)) deviceType = 'Móvil Android';
    else if (/iPhone|iPad|iPod/i.test(ua)) deviceType = 'iPhone / iPad iOS';
    else if (/Tablet/i.test(ua)) deviceType = 'Tablet';

    let browserName = 'Navegador Web';
    if (/Chrome/i.test(ua)) browserName = 'Chrome';
    else if (/Safari/i.test(ua)) browserName = 'Safari';
    else if (/Firefox/i.test(ua)) browserName = 'Firefox';
    else if (/Edge/i.test(ua)) browserName = 'Edge';

    const detected = `${deviceType} (${browserName}) - ${navigator.language || 'es-BO'}`;
    setDeviceInfo(detected);

    // Auto-fill if user is logged in or active client exists
    if (activeClient) {
      setNombre(activeClient.nombre || '');
      setEmpresa(activeClient.empresa || activeClient.observaciones?.slice(0, 30) || 'Cliente Registrado');
      setCelular(activeClient.celular || '');
      setCorreo(activeClient.correo || '');
      setCiudad(activeClient.ciudad || activeClient.departamento || 'La Paz');
    } else if (currentUser && currentUser.rol === 'Cliente') {
      setNombre(currentUser.nombre || '');
      setEmpresa(currentUser.empresa || 'Empresa Registrada');
      setCelular(currentUser.celular || '+591 70000000');
      setCorreo(currentUser.email || '');
    } else {
      // Default auto-fill or stored client info if available in localStorage
      const savedClient = localStorage.getItem('publix_saved_visitor');
      if (savedClient) {
        try {
          const parsed = JSON.parse(savedClient);
          setNombre(parsed.nombre || '');
          setEmpresa(parsed.empresa || '');
          setCelular(parsed.celular || '');
          setCorreo(parsed.correo || '');
          setCiudad(parsed.ciudad || 'La Paz');
        } catch {
          // ignore
        }
      }
    }
  }, [isOpen, currentUser, activeClient]);

  if (!isOpen) return null;

  // Handle File Uploads (Drag & Drop or File Input)
  const handleFileUpload = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    fileArray.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          const sizeKb = (file.size / 1024).toFixed(1) + ' KB';
          setImagenesReferencia(prev => [
            ...prev,
            {
              id: 'IMG_' + Date.now() + Math.random().toString(36).substring(2, 5),
              name: file.name,
              url: result,
              size: sizeKb
            }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Quick preset sample images for easy testing
  const addPresetSampleImage = (type: 'valla' | 'led' | 'boceto') => {
    const presets = {
      valla: {
        name: 'Ejemplo_Valla_Monumental_Banzer.jpg',
        url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
        size: '1.2 MB'
      },
      led: {
        name: 'Ejemplo_Pantalla_LED_Equipetrol.jpg',
        url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
        size: '980 KB'
      },
      boceto: {
        name: 'Boceto_Diseno_Marca_Publix.jpg',
        url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80',
        size: '750 KB'
      }
    };
    const selected = presets[type];
    setImagenesReferencia(prev => [
      ...prev,
      {
        id: 'PRESET_' + Date.now() + Math.random().toString(36).substring(2, 5),
        name: selected.name,
        url: selected.url,
        size: selected.size
      }
    ]);
  };

  const removeImage = (id: string) => {
    setImagenesReferencia(prev => prev.filter(img => img.id !== id));
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !celular.trim()) {
      alert('Por favor complete su nombre completo y número de celular/WhatsApp.');
      return;
    }

    // Save visitor info locally for future sessions
    localStorage.setItem('publix_saved_visitor', JSON.stringify({
      nombre, empresa, celular, correo, ciudad
    }));

    const nextId = 'REQ-' + Date.now().toString().slice(-6);
    const estVal = parseFloat(presupuestoEstimado) || 1500;

    const newRequest: PendingQuotationRequest = {
      id: nextId,
      codigo: `SOL-2026-${Math.floor(100 + Math.random() * 900)}`,
      cliente_nombre: nombre,
      cliente_empresa: empresa || 'Empresa No Especificada',
      cliente_celular: celular,
      cliente_correo: correo || 'no-especificado@cliente.com',
      cliente_ciudad: ciudad,
      vallas_ids: ['SOL-OOH'],
      vallas_nombres: [solutionTitle],
      vallas_detalles: [{
        id: 'SOL-OOH',
        nombre: solutionTitle,
        precio_usd: estVal,
        medidas: 'Formato Personalizado',
        cara: 'Cara A',
        imagen: imagenesReferencia[0]?.url || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'
      }],
      fecha: new Date().toISOString(),
      estado: 'Pendiente',
      observaciones: `Solicitud recibida desde la web de PUBLI-X. Tipo: ${solutionType}`,
      sugerencia_cotizacion: sugerencia,
      imagenes_referencia: imagenesReferencia.map(img => img.url),
      dispositivo_detectado: deviceInfo,
      presupuesto_estimado_usd: estVal
    };

    // Save to mock database pending requests
    const currentRequests = mockDb.getPendingRequests();
    mockDb.savePendingRequests([newRequest, ...currentRequests]);
    mockDb.addAuditLog(nombre, 'Solicitud OOH & Cotización', `El usuario/cliente solicitó cotización OOH para ${ciudad} con ${imagenesReferencia.length} imágenes adjuntas.`);

    setSubmittedData(newRequest);
    setSubmitted(true);
  };

  const handleWhatsAppSend = () => {
    if (!submittedData) return;
    const text = encodeURIComponent(
      `*¡Hola PUBLI-X Bolivia!* 🚀\n` +
      `Solicito cotización para solución OOH en *${ciudad}*.\n\n` +
      `👤 *Cliente:* ${submittedData.cliente_nombre}\n` +
      `🏢 *Empresa:* ${submittedData.cliente_empresa}\n` +
      `📱 *WhatsApp:* ${submittedData.cliente_celular}\n` +
      `📧 *Correo:* ${submittedData.cliente_correo}\n` +
      `📍 *Ciudad/Depto:* ${ciudad}\n` +
      `💡 *Requerimiento / Sugerencia:* ${submittedData.sugerencia_cotizacion || 'Consulta general de vallas y pantallas LED'}\n` +
      `🖼️ *Imágenes adjuntas:* ${submittedData.imagenes_referencia?.length || 0} archivo(s)\n` +
      `💻 *Dispositivo:* ${submittedData.dispositivo_detectado}\n\n` +
      `Quedo atento a su propuesta y presupuesto comercial. ¡Muchas gracias!`
    );
    window.open(`https://wa.me/59170000000?text=${text}`, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl bg-[#0a111e] border-2 border-[#0fa0e6]/40 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden text-white my-auto max-h-[92vh] flex flex-col"
        >

          {/* HEADER BANNER WITH WELCOME */}
          <div className="relative bg-gradient-to-r from-[#0d182b] via-[#0f213d] to-[#0a111e] p-5 sm:p-6 border-b border-[#0fa0e6]/30 flex-shrink-0">
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2.5 text-gray-400 hover:text-white bg-gray-800/60 hover:bg-red-600/80 rounded-full transition cursor-pointer z-10"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#0fa0e6]/10 border border-[#0fa0e6]/40 rounded-2xl hidden sm:flex items-center justify-center">
                <Logo size="sm" logoUrl={logoUrl} />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ff8c00]/15 border border-[#ff8c00]/40 rounded-full text-[11px] font-black text-[#ff8c00] uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Soluciones OOH Bolivia 2026
                </div>

                <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight">
                  ¡Bienvenido a PUBLI-X! 👋
                </h2>
                
                <p className="text-xs sm:text-sm text-gray-300 mt-1 leading-relaxed">
                  Envíenos su sugerencia, idea o requerimiento de cotización junto a sus imágenes de referencia. Le responderemos a la brevedad con una propuesta comercial adaptada a su presupuesto.
                </p>
              </div>
            </div>
          </div>

          {/* MODAL BODY CONTENT */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
            
            {submitted ? (
              /* SUCCESS STATE SCREEN */
              <div className="text-center py-6 space-y-6">
                <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase text-white">
                    ¡Solicitud Enviada con Éxito!
                  </h3>
                  <p className="text-sm text-gray-300 max-w-lg mx-auto">
                    Hemos registrado su requerimiento en nuestro sistema. Un ejecutivo comercial de PUBLI-X revisará su sugerencia e imágenes de referencia para enviarle un presupuesto ajustado.
                  </p>
                </div>

                {/* Summary Card */}
                <div className="bg-[#0d182b] border border-[#0fa0e6]/30 rounded-2xl p-5 text-left text-xs space-y-3 max-w-xl mx-auto shadow-md">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                    <span className="text-gray-400 font-medium">Código de Solicitud:</span>
                    <span className="font-mono font-bold text-[#0fa0e6] text-sm">{submittedData?.codigo}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-gray-400 block">Cliente:</span>
                      <span className="font-bold text-white">{submittedData?.cliente_nombre}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Empresa:</span>
                      <span className="font-bold text-white">{submittedData?.cliente_empresa}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">WhatsApp / Celular:</span>
                      <span className="font-bold text-white">{submittedData?.cliente_celular}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Ciudad / Depto:</span>
                      <span className="font-bold text-white">{submittedData?.cliente_ciudad}</span>
                    </div>
                  </div>

                  {submittedData?.sugerencia_cotizacion && (
                    <div className="pt-2 border-t border-gray-800">
                      <span className="text-gray-400 block mb-1">Requerimiento / Sugerencia:</span>
                      <p className="bg-[#0a111e] p-2.5 rounded-lg text-gray-200 text-xs italic border border-gray-800">
                        "{submittedData.sugerencia_cotizacion}"
                      </p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-800 flex justify-between items-center">
                    <span className="text-gray-400">Imágenes de Referencia:</span>
                    <span className="font-bold text-[#ff8c00]">{submittedData?.imagenes_referencia?.length || 0} imagen(es) adjuntada(s)</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <button
                    onClick={handleWhatsAppSend}
                    className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-sm uppercase tracking-wider transition cursor-pointer shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-5 h-5 fill-current" />
                    <span>Enviar también por WhatsApp</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-8 py-3.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold rounded-xl text-sm transition cursor-pointer border border-gray-700"
                  >
                    Cerrar Ventana
                  </button>
                </div>
              </div>
            ) : (
              /* FORM STATE */
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. PERSONAL DATA SECTION */}
                <div className="bg-[#0d182b]/80 border border-[#0fa0e6]/30 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-[#0fa0e6] tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4" />
                      1. Datos Personales y de Contacto
                    </h3>
                    <span className="text-[11px] text-gray-400">
                      (* Campos obligatorios)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        Nombre Completo *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={nombre}
                          onChange={e => setNombre(e.target.value)}
                          placeholder="Ej: Juan Carlos Pérez"
                          className="w-full pl-9 pr-3 py-2.5 bg-[#0a111e] border border-gray-700 rounded-xl text-xs text-white focus:border-[#0fa0e6] focus:outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        Empresa / Marca / Proyecto
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={empresa}
                          onChange={e => setEmpresa(e.target.value)}
                          placeholder="Ej: Banco Mercantil, Farmacia, Marca Personal"
                          className="w-full pl-9 pr-3 py-2.5 bg-[#0a111e] border border-gray-700 rounded-xl text-xs text-white focus:border-[#0fa0e6] focus:outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        Celular / WhatsApp *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={celular}
                          onChange={e => setCelular(e.target.value)}
                          placeholder="Ej: +591 70000000"
                          className="w-full pl-9 pr-3 py-2.5 bg-[#0a111e] border border-gray-700 rounded-xl text-xs text-white focus:border-[#0fa0e6] focus:outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        Correo Electrónico
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          value={correo}
                          onChange={e => setCorreo(e.target.value)}
                          placeholder="ejemplo@empresa.com"
                          className="w-full pl-9 pr-3 py-2.5 bg-[#0a111e] border border-gray-700 rounded-xl text-xs text-white focus:border-[#0fa0e6] focus:outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        Ciudad / Departamento de Interés
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <select
                          value={ciudad}
                          onChange={e => setCiudad(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-[#0a111e] border border-gray-700 rounded-xl text-xs text-white focus:border-[#0fa0e6] focus:outline-none transition cursor-pointer"
                        >
                          <option value="La Paz">La Paz (Sede de Gobierno & Autopista)</option>
                          <option value="Santa Cruz">Santa Cruz de la Sierra (Equipetrol / Anillos)</option>
                          <option value="Cochabamba">Cochabamba (Zona Central / Cristo)</option>
                          <option value="El Alto">El Alto (La Ceja & Avenidas Principales)</option>
                          <option value="Tarija">Tarija</option>
                          <option value="Sucre">Sucre</option>
                          <option value="Oruro">Oruro</option>
                          <option value="Potosí">Potosí</option>
                          <option value="Trinidad">Trinidad / Beni</option>
                          <option value="Cobija">Cobija / Pando</option>
                          <option value="Provincias">Provincias & Rutas Interdepartamentales</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. SUGGESTIONS & REQUIREMENTS TEXTAREA */}
                <div className="bg-[#0d182b]/80 border border-[#0fa0e6]/30 rounded-2xl p-4 sm:p-5 space-y-3">
                  <h3 className="text-xs font-black uppercase text-[#ff8c00] tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    2. ¿Qué necesita cotizar? Escriba su sugerencia o requerimiento
                  </h3>

                  <textarea
                    rows={4}
                    value={sugerencia}
                    onChange={e => setSugerencia(e.target.value)}
                    placeholder="Escriba aquí los detalles de su campaña OOH: tipo de espacio (valla o pantalla LED), zonas estratégicas deseadas, fechas de exhibición, presupuesto de referencia o sugerencias para su diseño..."
                    className="w-full p-3 bg-[#0a111e] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:border-[#ff8c00] focus:outline-none transition resize-none leading-relaxed"
                  />

                  {/* Budget Selector */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-800 text-xs">
                    <span className="text-gray-300 font-bold flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-[#ff8c00]" />
                      Presupuesto Mensual Estimado:
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        value={presupuestoEstimado}
                        onChange={e => setPresupuestoEstimado(e.target.value)}
                        className="bg-[#0a111e] border border-gray-700 px-3 py-1.5 rounded-lg text-white font-bold text-xs focus:border-[#ff8c00] focus:outline-none cursor-pointer"
                      >
                        <option value="800">$us 500 - $us 1,000 / mes</option>
                        <option value="1500">$us 1,000 - $us 2,500 / mes</option>
                        <option value="3500">$us 2,500 - $us 5,000 / mes</option>
                        <option value="7500">$us 5,000+ / mes (Campaña Nacional)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. ATTACH REFERENCE IMAGES */}
                <div className="bg-[#0d182b]/80 border border-[#0fa0e6]/30 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-[#0fa0e6] tracking-wider flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      3. Adjuntar Imágenes de Referencia
                    </h3>
                    <span className="text-[11px] text-gray-400">
                      ({imagenesReferencia.length} adjuntas)
                    </span>
                  </div>

                  {/* Drag & Drop Box */}
                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
                    }}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition ${
                      isDragging 
                        ? 'border-[#ff8c00] bg-[#ff8c00]/10' 
                        : 'border-gray-700 hover:border-[#0fa0e6] bg-[#0a111e]/60'
                    }`}
                  >
                    <Upload className="w-8 h-8 text-[#0fa0e6] mx-auto mb-2" />
                    <p className="text-xs text-gray-200 font-bold">
                      Arrastre sus imágenes aquí o haga clic para seleccionar
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Fotografías del lugar, bocetos de su marca, logos o referencias visuales (JPG, PNG)
                    </p>

                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={e => e.target.files && handleFileUpload(e.target.files)}
                      className="hidden"
                      id="file-upload-input"
                    />

                    <label
                      htmlFor="file-upload-input"
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0fa0e6] to-[#0873b0] hover:from-[#0873b0] hover:to-[#05517e] text-white font-bold rounded-xl text-xs uppercase cursor-pointer shadow-md transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Seleccionar Archivos</span>
                    </label>
                  </div>

                  {/* Sample Preset Shortcut Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                    <span className="text-gray-400">¿No tiene imagen a mano? Añada un ejemplo rápido:</span>
                    <button
                      type="button"
                      onClick={() => addPresetSampleImage('valla')}
                      className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition border border-gray-700 cursor-pointer"
                    >
                      + Ejemplo Valla
                    </button>
                    <button
                      type="button"
                      onClick={() => addPresetSampleImage('led')}
                      className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition border border-gray-700 cursor-pointer"
                    >
                      + Ejemplo LED
                    </button>
                    <button
                      type="button"
                      onClick={() => addPresetSampleImage('boceto')}
                      className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition border border-gray-700 cursor-pointer"
                    >
                      + Boceto Diseño
                    </button>
                  </div>

                  {/* Image Preview Grid */}
                  {imagenesReferencia.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                      {imagenesReferencia.map((img) => (
                        <div
                          key={img.id}
                          className="relative group bg-[#0a111e] border border-gray-700 rounded-xl overflow-hidden p-2 flex items-center gap-2 shadow-sm"
                        >
                          <img
                            src={img.url}
                            alt={img.name}
                            className="w-12 h-12 object-cover rounded-lg border border-gray-800 flex-shrink-0"
                          />
                          <div className="overflow-hidden text-left flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-gray-200 truncate">
                              {img.name}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {img.size || 'Imagen'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(img.id)}
                            className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition cursor-pointer"
                            title="Eliminar imagen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SUBMIT BUTTON */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-[11px] text-gray-400 text-left">
                    ⚡ Responderemos en un plazo máximo de <strong>15 a 30 minutos</strong> con la ficha técnica y mapa de disponibilidad.
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#ff8c00] via-[#ffa024] to-[#ff7300] hover:from-[#ff7300] hover:to-[#e06600] text-white font-black rounded-2xl text-sm uppercase tracking-wider transition cursor-pointer shadow-xl shadow-[#ff8c00]/30 flex items-center justify-center gap-3 transform hover:scale-102 active:scale-98 border border-amber-300/40"
                  >
                    <Send className="w-5 h-5 stroke-[2.5]" />
                    <span>ENVIAR Y RECIBIR COTIZACIÓN</span>
                  </button>
                </div>

              </form>
            )}

          </div>

        </motion.div>

      </div>
    </AnimatePresence>
  );
}
