import React, { useState, useEffect } from 'react';
import { Client, Vehicle, MessageTemplate } from '../types';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Presentation, 
  FileText, 
  ClipboardCopy, 
  Check, 
  RefreshCw, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

interface WhatsAppSenderProps {
  clients: Client[];
  vehicles: Vehicle[];
  templates: MessageTemplate[];
  activeClient: Client | null;
  activeVehicle: Vehicle | null;
  onSelectActiveClient: (client: Client | null) => void;
  onSelectActiveVehicle: (vehicle: Vehicle | null) => void;
  onRegisterLog: (action: string, detail: string) => void;
  currentUser: string;
}

export default function WhatsAppSender({
  clients,
  vehicles,
  templates,
  activeClient,
  activeVehicle,
  onSelectActiveClient,
  onSelectActiveVehicle,
  onRegisterLog,
  currentUser
}: WhatsAppSenderProps) {
  
  // Local states
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState('');

  // Default to first template if loaded
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  // Variables replacement engine
  const replaceVariables = (templateStr: string): string => {
    if (!templateStr) return '';
    
    let result = templateStr;

    // Client variables
    if (activeClient) {
      result = result.replace(/{CLIENTE}/g, activeClient.nombre);
      result = result.replace(/{CELULAR}/g, activeClient.celular);
      result = result.replace(/{PRECIO}/g, activeClient.presupuesto_usd.toLocaleString());
      result = result.replace(/{CIUDAD}/g, activeClient.ciudad);
    } else {
      result = result.replace(/{CLIENTE}/g, '[Cliente]');
      result = result.replace(/{CELULAR}/g, '[Celular]');
      result = result.replace(/{PRECIO}/g, '[Presupuesto]');
      result = result.replace(/{CIUDAD}/g, '[Ciudad]');
    }

    // Valla / Pantalla variables
    if (activeVehicle) {
      // Helper for drive image URL
      let imgUrl = activeVehicle.imagen_principal || '';
      if (imgUrl.includes('drive.google.com')) {
        const idMatch = imgUrl.match(/\/d\/([^\/]+)/) || imgUrl.match(/id=([^&]+)/);
        if (idMatch && idMatch[1]) {
          imgUrl = `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
        }
      }

      const vallaName = `${activeVehicle.tipo_valla || activeVehicle.tipo} - ${activeVehicle.avenida_calle || activeVehicle.modelo}`;
      
      result = result.replace(/{FOTO_URL}/g, imgUrl);
      result = result.replace(/{VALLA_NOMBRE}/g, vallaName);
      result = result.replace(/{MEDIDAS}/g, activeVehicle.medidas || '10 x 4 m');
      result = result.replace(/{UBICACION}/g, `${activeVehicle.ciudad} (${activeVehicle.zona || 'Centro'})`);
      result = result.replace(/{MARCA}/g, activeVehicle.tipo_valla || activeVehicle.marca);
      result = result.replace(/{MODELO}/g, activeVehicle.avenida_calle || activeVehicle.modelo);
      result = result.replace(/{VERSION}/g, activeVehicle.cara || activeVehicle.version);
      result = result.replace(/{AÑO}/g, String(activeVehicle.anio));
      result = result.replace(/{MOTOR}/g, activeVehicle.iluminacion || activeVehicle.motor);
      result = result.replace(/{TIPO}/g, activeVehicle.tipo_valla || activeVehicle.tipo);
      result = result.replace(/{PRECIO}/g, activeVehicle.precio_usd.toLocaleString());
    } else {
      result = result.replace(/{FOTO_URL}/g, '[Link_Foto_Valla]');
      result = result.replace(/{VALLA_NOMBRE}/g, '[Valla / Estructura]');
      result = result.replace(/{MEDIDAS}/g, '[Medidas]');
      result = result.replace(/{UBICACION}/g, '[Ubicación]');
      result = result.replace(/{MARCA}/g, '[Tipo Valla]');
      result = result.replace(/{MODELO}/g, '[Ubicación/Avenida]');
      result = result.replace(/{VERSION}/g, '[Cara A/B]');
      result = result.replace(/{AÑO}/g, '2026');
      result = result.replace(/{TIPO}/g, '[Categoría]');
    }

    // Quotation code mock fallback
    result = result.replace(/{COTIZACION_NUM}/g, 'VLB-20260711-000025');

    // Corporate info
    result = result.replace(/{VENDEDOR}/g, currentUser || 'Asesor Comercial');
    result = result.replace(/{EMPRESA}/g, 'VALLAS & LED BOLIVIA');

    return result;
  };

  // Re-run replacement whenever selections change
  useEffect(() => {
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    if (selectedTemplate) {
      setMessageText(replaceVariables(selectedTemplate.contenido));
    }
  }, [activeClient, activeVehicle, selectedTemplateId, templates]);

  // Handle template switch manually
  const handleTemplateChange = (id: string) => {
    setSelectedTemplateId(id);
    setErrorFeedback('');
  };

  // Clean phone and trigger wa.me
  const handleSendWhatsApp = () => {
    setErrorFeedback('');
    if (!activeClient) {
      return setErrorFeedback('Debe seleccionar un cliente destinatario.');
    }

    // Clean phone number (keep numbers only, keep leading + if present)
    let rawPhone = activeClient.celular.trim().replace(/\s+/g, '');
    let cleanPhone = rawPhone.replace(/[^\d+]/g, '');

    // Format if no +
    if (!cleanPhone.startsWith('+')) {
      if (cleanPhone.length === 8) {
        cleanPhone = '591' + cleanPhone; // Bolivia standard
      }
    } else {
      cleanPhone = cleanPhone.replace('+', ''); // wa.me prefers without +
    }

    // Audit trace
    const vehicleDetail = activeVehicle ? `para el vehículo ${activeVehicle.marca} ${activeVehicle.modelo}` : '';
    onRegisterLog(
      'Mensaje WhatsApp Comercial',
      `Se generó y preparó enlace de WhatsApp para ${activeClient.nombre} (${activeClient.celular}) ${vehicleDetail}.`
    );

    // Encode text
    const encodedText = encodeURIComponent(messageText);
    const waLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;

    // Open link
    window.open(waLink, '_blank');
  };

  // Copy to clipboard fallback
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(messageText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6" id="whatsapp-sender-view">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Selectors Panel */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-gray-50 text-gray-700">
            <MessageSquare className="w-4 h-4 text-emerald-500" />
            <h4 className="font-bold text-sm uppercase tracking-wider font-display">Destinatario y Variables</h4>
          </div>

          <div className="space-y-4">
            
            {/* Target Client Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
                <Users className="w-3.5 h-3.5" />
                <span>Cliente Destinatario *</span>
              </label>
              <select
                value={activeClient ? activeClient.id : ''}
                onChange={(e) => {
                  const client = clients.find(c => c.id === e.target.value) || null;
                  onSelectActiveClient(client);
                }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Seleccionar Cliente --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} ({c.celular})</option>
                ))}
              </select>
            </div>

            {/* Target Vehicle Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
                <Presentation className="w-3.5 h-3.5" />
                <span>Valla / Pantalla de Interés</span>
              </label>
              <select
                value={activeVehicle ? activeVehicle.id : ''}
                onChange={(e) => {
                  const vehicle = vehicles.find(v => v.id === e.target.value) || null;
                  onSelectActiveVehicle(vehicle);
                }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Seleccionar Vehículo (Opcional) --</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.marca} {v.modelo} ({v.anio}) - ${v.precio_usd.toLocaleString()}</option>
                ))}
              </select>
            </div>

            {/* Template Selector Dropdown */}
            <div className="space-y-1.5 pt-2 border-t border-gray-50">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Plantilla Base Comercial</span>
              </label>
              <div className="space-y-2">
                {templates.map(tmpl => (
                  <button
                    key={tmpl.id}
                    onClick={() => handleTemplateChange(tmpl.id)}
                    className={`w-full text-left p-3 rounded-lg border text-xs font-medium transition flex items-start space-x-2 ${
                      selectedTemplateId === tmpl.id 
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800' 
                        : 'border-gray-100 bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="font-semibold block">{tmpl.nombre}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Message Preview and Editing Area */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="pb-3 border-b border-gray-50 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-base text-gray-800 font-display">Editor y Vista Previa de Mensaje</h4>
                <p className="text-xs text-gray-400">Las variables dinámicas se reemplazan automáticamente en tiempo real</p>
              </div>
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            </div>

            {errorFeedback && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorFeedback}</span>
              </div>
            )}

            <div className="relative group">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Escribe o personaliza el mensaje de WhatsApp..."
                rows={12}
                className="w-full p-4 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white font-sans transition resize-none leading-relaxed text-gray-700"
              />
              <div className="absolute right-3 bottom-3 flex space-x-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                
                {/* Reset Template button */}
                <button
                  onClick={() => {
                    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
                    if (selectedTemplate) {
                      setMessageText(replaceVariables(selectedTemplate.contenido));
                    }
                  }}
                  className="p-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-500 rounded-lg transition shadow-2xs"
                  title="Restablecer Plantilla"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>

                {/* Copy content */}
                <button
                  onClick={handleCopyToClipboard}
                  className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold flex items-center space-x-1 transition shadow-2xs"
                  title="Copiar al portapapeles"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
            <div className="text-[11px] text-gray-400">
              {activeClient ? (
                <span>Destinatario listo: <b>{activeClient.nombre}</b> ({activeClient.celular})</span>
              ) : (
                <span className="text-amber-500 font-semibold flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Falta seleccionar un cliente en el panel lateral</span>
                </span>
              )}
            </div>

            <button
              onClick={handleSendWhatsApp}
              disabled={!activeClient}
              className={`py-2.5 px-6 font-bold text-xs rounded-xl shadow-xs flex items-center space-x-2 transition ${
                activeClient 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-98' 
                  : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Abrir WhatsApp Web / Escritorio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
