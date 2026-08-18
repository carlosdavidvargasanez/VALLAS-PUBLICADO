import React, { useState } from 'react';
import { Settings, Client, PendingQuotationRequest } from '../types';
import { 
  Share2, 
  MessageSquare, 
  Copy, 
  Check, 
  Send, 
  Globe, 
  Sparkles, 
  HelpCircle, 
  ExternalLink, 
  Play, 
  CheckCircle2, 
  AlertCircle,
  X,
  Smartphone,
  Layers,
  Facebook,
  Instagram
} from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../services/api';

interface SocialLeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onLeadReceived?: (client: Client, req: PendingQuotationRequest) => void;
}

export default function SocialLeadCaptureModal({
  isOpen,
  onClose,
  settings,
  onLeadReceived
}: SocialLeadCaptureModalProps) {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'meta_webhook'>('whatsapp');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // WhatsApp Business campaign message state
  const [targetCity, setTargetCity] = useState('Santa Cruz');
  const [adTopic, setAdTopic] = useState('Vallas Publicitarias y Pantallas LED');
  const [customWelcomeText, setCustomWelcomeText] = useState(
    `¡Hola PUBLI-X Bolivia! 👋 Vi su anuncio en Facebook / Instagram y deseo cotizar espacios publicitarios en ${settings.ciudad || 'Bolivia'}. Por favor envíenme el catálogo de vallas y pantallas LED disponibles.`
  );

  // Meta Webhook Testing State
  const [testLeadName, setTestLeadName] = useState('Carlos Menacho (Demo Meta Ads)');
  const [testLeadPhone, setTestLeadPhone] = useState('+591 76543210');
  const [testLeadEmail, setTestLeadEmail] = useState('carlos.menacho@empresa.bo');
  const [testLeadCity, setTestLeadCity] = useState('Santa Cruz');
  const [testLeadCompany, setTestLeadCompany] = useState('Constructora Andina S.R.L.');
  const [testLeadPlatform, setTestLeadPlatform] = useState<'Facebook' | 'Instagram'>('Instagram');
  const [testLeadCampaign, setTestLeadCampaign] = useState('Campaña Vallas Banzer & Equipetrol 2026');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; client?: Client } | null>(null);

  if (!isOpen) return null;

  // Clean company phone
  const cleanPhone = (settings.whatsapp || settings.telefono || '+59170000000').replace(/[^\d]/g, '');
  const generatedWhatsAppUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(customWelcomeText)}`;

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://publix.bo';
  const webhookUrl = `${currentHost}/api/webhooks/meta-leads`;
  const verifyToken = 'publix_meta_token_2026';

  const handleCopyWhatsAppLink = () => {
    navigator.clipboard.writeText(generatedWhatsAppUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleCopyVerifyToken = () => {
    navigator.clipboard.writeText(verifyToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleRunWebhookSimulation = async () => {
    setIsTestingWebhook(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/webhooks/meta-leads/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: testLeadName,
          celular: testLeadPhone,
          correo: testLeadEmail,
          ciudad: testLeadCity,
          empresa: testLeadCompany,
          plataforma: testLeadPlatform,
          campania: testLeadCampaign,
          presupuesto: 1500,
          observaciones: 'Lead capturado desde formulario instantáneo de Meta Lead Ads'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: `✅ Lead creado exitosamente en el CRM (ID: ${data.client.id}) y en el Buzón de Solicitudes (Código: ${data.pendingRequest.codigo}).`,
          client: data.client
        });
        if (onLeadReceived && data.client && data.pendingRequest) {
          onLeadReceived(data.client, data.pendingRequest);
        }
        window.dispatchEvent(new CustomEvent('publix_new_request'));
      } else {
        setTestResult({
          success: false,
          message: `⚠️ Error al procesar: ${data.error || 'Respuesta inválida del servidor'}`
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `⚠️ Error de conexión: ${err.message}`
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-5 bg-slate-950 text-white flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Captación de Leads desde Redes Sociales</h2>
              <p className="text-xs text-gray-400">Meta Lead Ads (Facebook / Instagram) & WhatsApp Business</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-xl bg-slate-900 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`pb-3 px-4 text-xs font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Enlace WhatsApp Business para Ads / Bio</span>
          </button>
          <button
            onClick={() => setActiveTab('meta_webhook')}
            className={`pb-3 px-4 text-xs font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer ${
              activeTab === 'meta_webhook'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Webhook Meta Lead Ads (FB & IG)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 flex items-start space-x-3">
                <Smartphone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-sm mb-1">Botón de WhatsApp Business para Redes Sociales</span>
                  Coloca este enlace en el botón de tu página de Facebook, biografía de Instagram, TikTok, perfil de Google o botón de llamada a la acción en tus anuncios pagados. Al hacer clic, el prospecto iniciará conversación con tu número oficial con el mensaje pre-armado.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Número WhatsApp Destino</label>
                  <input
                    type="text"
                    value={settings.whatsapp || settings.telefono || '+591 70000000'}
                    disabled
                    className="w-full px-3 py-2 text-xs bg-gray-100 border border-gray-200 rounded-xl text-gray-600 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Ciudad de la Campaña</label>
                  <select
                    value={targetCity}
                    onChange={(e) => {
                      setTargetCity(e.target.value);
                      setCustomWelcomeText(
                        `¡Hola PUBLI-X Bolivia! 👋 Vi su anuncio en Facebook / Instagram y deseo cotizar espacios publicitarios en ${e.target.value}. Por favor envíenme el catálogo de vallas y pantallas LED disponibles.`
                      );
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl font-semibold"
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
                    <option value="Nacional (Todo el país)">Nacional (Todo el país)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mensaje de Bienvenida Pre-Armado</label>
                <textarea
                  rows={3}
                  value={customWelcomeText}
                  onChange={(e) => setCustomWelcomeText(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none leading-relaxed resize-none"
                />
              </div>

              {/* Generated Link Box */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-emerald-400 block">Enlace de Campaña Generado:</span>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-gray-300 break-all select-all">
                  {generatedWhatsAppUrl}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    onClick={handleCopyWhatsAppLink}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace para Ads / Bio'}</span>
                  </button>

                  <a
                    href={generatedWhatsAppUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer border border-slate-700"
                  >
                    <ExternalLink className="w-4 h-4 text-emerald-400" />
                    <span>Probar Enlace en WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'meta_webhook' && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-950 flex items-start space-x-3">
                <Facebook className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-sm mb-1">Integración Automática con Meta Lead Ads</span>
                  Cuando un cliente potencial completa un formulario en tus anuncios de Facebook o Instagram, Meta envía los datos directamente a este Webhook. El sistema creará al cliente en el CRM y abrirá una solicitud en el Buzón de Cotizaciones sin intervención manual.
                </div>
              </div>

              {/* Webhook credentials box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
                  <span className="text-xs font-bold text-gray-700 block">URL del Webhook (Callback URL):</span>
                  <div className="p-2 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-800 break-all select-all">
                    {webhookUrl}
                  </div>
                  <button
                    onClick={handleCopyWebhookUrl}
                    className="text-xs text-blue-600 font-bold flex items-center space-x-1 hover:underline cursor-pointer"
                  >
                    {copiedWebhook ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWebhook ? '¡URL Copiada!' : 'Copiar URL'}</span>
                  </button>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
                  <span className="text-xs font-bold text-gray-700 block">Token de Verificación (Verify Token):</span>
                  <div className="p-2 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-800 break-all select-all">
                    {verifyToken}
                  </div>
                  <button
                    onClick={handleCopyVerifyToken}
                    className="text-xs text-blue-600 font-bold flex items-center space-x-1 hover:underline cursor-pointer"
                  >
                    {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedToken ? '¡Token Copiado!' : 'Copiar Token'}</span>
                  </button>
                </div>
              </div>

              {/* Simulation / Testing Panel */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs">Simulador y Probador de Leads Meta en Vivo</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">POST /api/webhooks/meta-leads/test</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-300 font-medium mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      value={testLeadName}
                      onChange={(e) => setTestLeadName(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-300 font-medium mb-1">WhatsApp / Celular</label>
                    <input
                      type="text"
                      value={testLeadPhone}
                      onChange={(e) => setTestLeadPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-300 font-medium mb-1">Ciudad</label>
                    <input
                      type="text"
                      value={testLeadCity}
                      onChange={(e) => setTestLeadCity(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-300 font-medium mb-1">Empresa</label>
                    <input
                      type="text"
                      value={testLeadCompany}
                      onChange={(e) => setTestLeadCompany(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-300 font-medium mb-1">Plataforma</label>
                    <select
                      value={testLeadPlatform}
                      onChange={(e) => setTestLeadPlatform(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-medium"
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="Facebook">Facebook</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-300 font-medium mb-1">Campaña de Anuncios</label>
                    <input
                      type="text"
                      value={testLeadCampaign}
                      onChange={(e) => setTestLeadCampaign(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-medium"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <button
                    onClick={handleRunWebhookSimulation}
                    disabled={isTestingWebhook}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center space-x-2 cursor-pointer shadow-md shadow-blue-600/20"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isTestingWebhook ? 'Enviando Lead de Prueba...' : 'Disparar Lead de Prueba al CRM'}</span>
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs leading-relaxed ${
                      testResult.success
                        ? 'bg-emerald-950/70 border-emerald-700 text-emerald-200'
                        : 'bg-red-950/70 border-red-700 text-red-200'
                    }`}
                  >
                    {testResult.message}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
