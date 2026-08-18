import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  X, 
  Minimize2, 
  Maximize2, 
  Bot, 
  User, 
  MapPin, 
  DollarSign, 
  CheckCircle2, 
  ArrowRight,
  Phone,
  Building,
  Layers,
  Flame,
  Check,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Vehicle, Settings, PendingQuotationRequest } from '../types';
import { mockDb } from '../data/mockDatabase';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  recommendedVehicles?: Vehicle[];
}

interface CommercialAiChatbotProps {
  settings?: Settings;
  onSelectVehicleInquiry?: (vehicle: Vehicle) => void;
  onOpenInquiryModal?: (title: string, type: string) => void;
}

export default function CommercialAiChatbot({ 
  settings, 
  onSelectVehicleInquiry,
  onOpenInquiryModal 
}: CommercialAiChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `¡Hola! 👋 Soy el **Asesor Comercial Virtual de PUBLI-X BOLIVIA** 📢.\n\nTengo acceso en tiempo real a nuestro catálogo de **Vallas Publicitarias, Unipolares y Pantallas LED** en Santa Cruz, La Paz, Cochabamba y todo el país.\n\n¿En qué ciudad o zona le gustaría posicionar su marca hoy?`,
      timestamp: new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);

  // Lead capture state
  const [leadNombre, setLeadNombre] = useState('');
  const [leadCelular, setLeadCelular] = useState('');
  const [leadEmpresa, setLeadEmpresa] = useState('');
  const [leadCiudad, setLeadCiudad] = useState('Santa Cruz');
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isLoading]);

  const quickChips = [
    '📍 Vallas en Santa Cruz',
    '📺 Pantallas LED en La Paz',
    '⭐ Ubicaciones de Alto Impacto',
    '💰 Vallas hasta $1,500 USD',
    '🤝 Solicitar Asesor Comercial'
  ];

  const handleSendMessage = async (userText: string) => {
    const text = userText.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build conversational history
      const historyPayload = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/deepseek/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload
        })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: Message = {
          id: 'ast_' + Date.now(),
          role: 'assistant',
          content: data.reply || '¡Gracias por su consulta! Nuestro equipo comercial está a su servicio.',
          timestamp: new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
          recommendedVehicles: data.recommendedVehicles || []
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        // Fallback local response
        const fallbackMsg: Message = {
          id: 'ast_' + Date.now(),
          role: 'assistant',
          content: `¡Excelente consulta! En **PUBLI-X BOLIVIA** contamos con puntos estratégicos de altísima visibilidad en las principales avenidas y rotondas del país. Puede dejarnos sus datos o contactarnos al WhatsApp oficial para enviarle una propuesta a medida.`,
          timestamp: new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, fallbackMsg]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMsg: Message = {
        id: 'ast_' + Date.now(),
        role: 'assistant',
        content: `Contamos con las mejores ubicaciones OOH y pantallas LED 4K en Bolivia. ¿Desea que un asesor comercial le prepare una cotización formal? Complete sus datos abajo o contáctenos directamente.`,
        timestamp: new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadNombre.trim() || !leadCelular.trim()) return;

    let cleanCell = leadCelular.trim().replace(/\s+/g, '');
    if (!cleanCell.startsWith('+591')) {
      cleanCell = cleanCell.startsWith('591') ? '+' + cleanCell : '+591' + cleanCell.replace(/\D/g, '');
    }

    const pendingReq: PendingQuotationRequest = {
      id: 'REQ-' + Date.now().toString().slice(-6),
      codigo: 'WEB-' + Math.floor(1000 + Math.random() * 9000),
      cliente_nombre: leadNombre.trim(),
      cliente_celular: cleanCell,
      cliente_correo: '',
      cliente_ciudad: leadCiudad,
      cliente_empresa: leadEmpresa.trim() || 'Particular / Empresa',
      vallas_ids: [],
      vallas_nombres: ['Consulta vía Asesor Comercial IA DeepSeek'],
      vallas_detalles: [],
      fecha: new Date().toISOString(),
      estado: 'Pendiente',
      observaciones: `Captura automática de prospecto en Chat IA DeepSeek (${leadCiudad}).`,
      sugerencia_cotizacion: `Interesado en espacios de ${leadCiudad}. Contactar de inmediato por WhatsApp.`
    };

    mockDb.addPendingRequest(pendingReq);
    window.dispatchEvent(new CustomEvent('publix_new_request'));

    setLeadSubmitted(true);
    setTimeout(() => {
      setShowLeadForm(false);
      setLeadSubmitted(false);
      setLeadNombre('');
      setLeadCelular('');
      setLeadEmpresa('');
      setMessages(prev => [
        ...prev,
        {
          id: 'lead_confirm_' + Date.now(),
          role: 'assistant',
          content: `✅ ¡Perfecto, **${leadNombre.trim()}**! Su solicitud ha sido registrada en nuestro CRM Comercial.\n\nUn ejecutivo de **PUBLI-X** le enviará el catálogo de vallas y la cotización formal a su WhatsApp (**${cleanCell}**) en breve.`,
          timestamp: new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1500);
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              onClick={() => setIsOpen(true)}
              className="bg-slate-900/90 text-white px-3.5 py-2 rounded-2xl border border-amber-400/40 shadow-xl backdrop-blur-md hidden sm:flex items-center gap-2 cursor-pointer hover:bg-slate-800 transition group"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-amber-300 group-hover:text-amber-200">
                ¿Busca una Valla o Pantalla LED?
              </span>
              <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase">
                Asesor IA
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(prev => !prev)}
          className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-[#ff8c00] to-[#0fa0e6] text-white flex items-center justify-center shadow-2xl shadow-amber-500/30 border-2 border-white/30 cursor-pointer"
          title="Abrir Asesor Comercial Virtual Inteligente"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <>
              <Sparkles className="w-6 h-6 text-slate-950" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </>
          )}
        </motion.button>
      </div>

      {/* Floating Chat Modal Box */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[420px] max-h-[600px] h-[82vh] bg-slate-950/95 backdrop-blur-2xl rounded-3xl border border-cyan-500/30 shadow-2xl shadow-black/80 flex flex-col overflow-hidden text-white font-sans"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950 border-b border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-[#0fa0e6] p-0.5 shadow-md">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white tracking-tight">Asesor Comercial IA</h3>
                    <span className="text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                      En Línea
                    </span>
                  </div>
                  <p className="text-[10px] text-cyan-200/70">PUBLI-X BOLIVIA • Catálogo en Tiempo Real</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowLeadForm(prev => !prev)}
                  className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-400/30 transition text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Registrar solicitud de cotización formal"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="text-[10px] hidden sm:inline">Cotizar</span>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lead Capture Banner / Inline Form */}
            <AnimatePresence>
              {showLeadForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-gradient-to-b from-amber-500/15 to-transparent border-b border-amber-500/30 p-3.5 text-xs overflow-hidden"
                >
                  {leadSubmitted ? (
                    <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-center font-bold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>¡Solicitud enviada con éxito al equipo comercial!</span>
                    </div>
                  ) : (
                    <form onSubmit={handleLeadSubmit} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-amber-300 text-[11px] uppercase tracking-wider flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-amber-400" />
                          Dejar datos para cotización formal
                        </span>
                        <button 
                          type="button" 
                          onClick={() => setShowLeadForm(false)} 
                          className="text-gray-400 hover:text-white text-[10px]"
                        >
                          Cerrar ✕
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Su Nombre *"
                          value={leadNombre}
                          onChange={e => setLeadNombre(e.target.value)}
                          className="px-2.5 py-1.5 bg-slate-900 border border-amber-400/40 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Celular / WhatsApp *"
                          value={leadCelular}
                          onChange={e => setLeadCelular(e.target.value)}
                          className="px-2.5 py-1.5 bg-slate-900 border border-amber-400/40 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Empresa / Marca (opcional)"
                          value={leadEmpresa}
                          onChange={e => setLeadEmpresa(e.target.value)}
                          className="px-2.5 py-1.5 bg-slate-900 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                        <select
                          value={leadCiudad}
                          onChange={e => setLeadCiudad(e.target.value)}
                          className="px-2.5 py-1.5 bg-slate-900 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                        >
                          <option value="Santa Cruz">Santa Cruz</option>
                          <option value="La Paz">La Paz</option>
                          <option value="Cochabamba">Cochabamba</option>
                          <option value="Tarija">Tarija</option>
                          <option value="Chuquisaca">Chuquisaca</option>
                          <option value="Oruro">Oruro</option>
                          <option value="Potosí">Potosí</option>
                          <option value="Beni">Beni</option>
                          <option value="Pando">Pando</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg transition shadow-md uppercase cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar Solicitud a un Asesor</span>
                      </button>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 shadow-md ${
                      m.role === 'user'
                        ? 'bg-gradient-to-r from-amber-500 to-[#ff8c00] text-slate-950 font-semibold rounded-br-none'
                        : 'bg-slate-900/90 border border-cyan-500/20 text-gray-100 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>

                    {/* Interactive Recommended Vehicles Cards */}
                    {m.recommendedVehicles && m.recommendedVehicles.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-cyan-500/20 space-y-2">
                        <div className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          <span>Espacios Recomendados del Catálogo:</span>
                        </div>
                        {m.recommendedVehicles.map(v => (
                          <div
                            key={v.id}
                            className="bg-slate-950/80 p-2.5 rounded-xl border border-cyan-500/30 flex flex-col gap-1.5"
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-extrabold text-white text-[11px] truncate">
                                {v.tipo_valla || v.tipo} - {v.avenida_calle || v.modelo}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-amber-400">
                                ${v.precio_usd.toLocaleString()} USD
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-400 flex items-center gap-2">
                              <span>📍 {v.ciudad} ({v.zona || 'Principal'})</span>
                              <span>📐 {v.medidas || '10x4 m'}</span>
                            </div>
                            <div className="flex gap-2 mt-1">
                              <button
                                onClick={() => {
                                  if (onOpenInquiryModal) {
                                    onOpenInquiryModal(
                                      `${v.tipo_valla || v.tipo} en ${v.ciudad}`,
                                      `${v.avenida_calle || v.modelo} (${v.medidas || '10x4 m'}) - $${v.precio_usd} USD`
                                    );
                                  }
                                }}
                                className="flex-1 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-400/40 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <span>Cotizar este espacio</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-gray-500 mt-1 px-1">{m.timestamp}</span>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-cyan-400 text-xs p-2 bg-slate-900/60 rounded-xl w-fit border border-cyan-500/20">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="font-medium text-[11px]">Consultando catálogo de Bolivia...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-3 py-1.5 bg-slate-900/80 border-t border-cyan-500/10 flex gap-1.5 overflow-x-auto no-scrollbar">
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-950 text-cyan-200 hover:text-white rounded-full text-[10px] font-medium whitespace-nowrap border border-cyan-500/20 transition cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Message Input Box */}
            <div className="p-3 bg-slate-900 border-t border-cyan-500/20">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputMessage);
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Pregunte sobre vallas, zonas o precios..."
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-slate-950 border border-cyan-500/30 rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 transition"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-2.5 bg-gradient-to-r from-amber-500 to-[#ff8c00] text-slate-950 rounded-2xl font-black disabled:opacity-40 hover:opacity-90 transition cursor-pointer shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
