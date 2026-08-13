import React, { useState } from 'react';
import { Presentation, Shield, Lock, MapPin, Sparkles, CheckCircle2, Phone, Star, Building2, ArrowRight, Eye, Smartphone, Zap, FileText, MessageSquare, Upload, UserCheck, UserPlus, X, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import oohBannerImage from '../assets/images/publi_x_ooh_banner_1786328834763.jpg';
import Logo from './Logo';
import OOHInquiryModal from './OOHInquiryModal';

import { Settings } from '../types';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenLoginWithCategory?: (category: string) => void;
  onExploreCatalog: () => void;
  settings?: Settings;
}

export default function LandingPage({ onOpenLogin, onOpenLoginWithCategory, onExploreCatalog, settings }: LandingPageProps) {
  const logoUrl = settings?.logo;
  const [showInquiryModal, setShowInquiryModal] = useState<boolean>(false);
  const [inquiryTitle, setInquiryTitle] = useState<string>('Soluciones OOH Bolivia');
  const [inquiryType, setInquiryType] = useState<string>('Vallas Monumentales & Pantallas LED');

  // Action Selection Modal state (Cliente vs Nuevo Cliente)
  const [showActionModal, setShowActionModal] = useState<boolean>(false);
  const [targetCategory, setTargetCategory] = useState<'Alto Impacto' | 'Pantalla LED'>('Alto Impacto');

  const handleOpenActionModal = (category: 'Alto Impacto' | 'Pantalla LED') => {
    setTargetCategory(category);
    setShowActionModal(true);
  };

  const handleOpenInquiry = (title: string, type: string) => {
    setInquiryTitle(title);
    setInquiryType(type);
    setShowInquiryModal(true);
  };

  return (
    <div className="min-h-screen bg-[#0a111e] text-white font-sans selection:bg-[#ff8c00] selection:text-white">
      
      {/* Background Ambient Glows with Process Blue (#0fa0e6) & Vibrant Orange (#ff8c00) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#0fa0e6]/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-[#ff8c00]/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-[#0fa0e6]/10 rounded-full blur-3xl" />
      </div>

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0a111e]/95 backdrop-blur-xl border-b border-[#0fa0e6]/30 shadow-2xl shadow-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-28 sm:h-32 flex items-center justify-between">
          
          {/* Brand Logo - Top Left Header (PROMINENT & LARGER) */}
          <div className="flex items-center -ml-2 py-2">
            <Logo size="lg" logoUrl={logoUrl} />
          </div>

          {/* Quick Nav Links & Login Button */}
          <nav className="flex items-center space-x-3 sm:space-x-6 text-xs font-bold uppercase tracking-wider text-gray-200">
            <a href="#inicio" className="hover:text-[#0fa0e6] transition py-1 hidden sm:inline">Inicio</a>
            <a href="#cobertura" className="hover:text-[#0fa0e6] transition py-1 hidden md:inline">Cobertura Nacional</a>
            <button 
              onClick={() => handleOpenInquiry('Soluciones OOH Bolivia', 'Servicios Integrales Vallas y LEDs')}
              className="text-[#ff8c00] hover:text-amber-300 font-extrabold transition py-1 flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Soluciones OOH</span>
            </button>
            <a href="#contacto" className="hover:text-[#0fa0e6] transition py-1 hidden lg:inline">Contacto</a>

            {/* Prominent Login / Access Portal Button */}
            <button
              onClick={onOpenLogin}
              className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-[#0fa0e6] to-[#0873b0] hover:from-[#0fa0e6] hover:to-[#0988cf] text-white font-extrabold rounded-xl transition shadow-lg shadow-[#0fa0e6]/30 flex items-center gap-2 cursor-pointer border border-cyan-300/30 text-xs"
            >
              <LogIn className="w-4 h-4" />
              <span>Portal Clientes & CRM</span>
            </button>
          </nav>
        </div>
      </header>

      {/* HERO SECTION - Showcase Publi-X Banner */}
      <section id="inicio" className="relative pt-8 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* OOH Digital Showcase Banner Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative rounded-3xl overflow-hidden border-2 border-[#0fa0e6]/40 shadow-2xl shadow-[#0fa0e6]/20 max-w-5xl mx-auto group"
          >
            <img 
              src={oohBannerImage} 
              alt="PUBLI-X Bolivia Digital Billboard Banner" 
              className="w-full h-80 sm:h-[460px] object-cover transform group-hover:scale-105 transition duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a111e] via-[#0a111e]/50 to-transparent flex flex-col justify-end p-6 sm:p-12">
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
                <div>
                  <span className="bg-[#0fa0e6] text-white font-black text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-md inline-block">
                    PUBLI-X BOLIVIA 2026
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-black text-white mt-3 uppercase tracking-tight">
                    Vallas Monumentales & Pantallas LED
                  </h3>
                  <p className="text-gray-300 text-xs sm:text-sm mt-1.5 max-w-xl leading-relaxed">
                    Ubicaciones estratégicas de alto tráfico en La Paz, Santa Cruz, Cochabamba y Provincias.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* STATS HIGHLIGHTS */}
      <section id="cobertura" className="py-12 bg-[#0d182b] border-y border-[#0fa0e6]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            
            <div className="p-5 bg-[#0a111e] rounded-2xl border border-[#0fa0e6]/30 shadow-md">
              <div className="text-3xl sm:text-4xl font-black text-[#ff8c00] drop-shadow-sm">250+</div>
              <div className="text-xs font-bold text-gray-300 uppercase tracking-wider mt-1">Vallas & LEDs Activas</div>
            </div>

            <div className="p-5 bg-[#0a111e] rounded-2xl border border-[#0fa0e6]/30 shadow-md">
              <div className="text-3xl sm:text-4xl font-black text-[#ff8c00] drop-shadow-sm">9</div>
              <div className="text-xs font-bold text-gray-300 uppercase tracking-wider mt-1">Departamentos Bolivia</div>
            </div>

            <div className="p-5 bg-[#0a111e] rounded-2xl border border-[#0fa0e6]/30 shadow-md">
              <div className="text-3xl sm:text-4xl font-black text-[#ff8c00] drop-shadow-sm">100%</div>
              <div className="text-xs font-bold text-gray-300 uppercase tracking-wider mt-1">Iluminación Garantizada</div>
            </div>

            <div className="p-5 bg-[#0a111e] rounded-2xl border border-[#0fa0e6]/30 shadow-md">
              <div className="text-3xl sm:text-4xl font-black text-[#ff8c00] drop-shadow-sm">PDF</div>
              <div className="text-xs font-bold text-gray-300 uppercase tracking-wider mt-1">Cotizaciones Inmediatas</div>
            </div>

          </div>
        </div>
      </section>

      {/* PLATFORM FEATURES - SOLUCIONES OOH SECTION */}
      <section id="soluciones" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-black text-[#ff8c00] uppercase tracking-widest mb-2 bg-[#ff8c00]/10 border border-[#ff8c00]/30 inline-block px-3.5 py-1 rounded-full">Servicios Integrales</h2>
          <p className="text-3xl sm:text-4xl font-black uppercase text-white mt-3">
            ¿Por qué elegir <span className="text-[#0fa0e6]">PUBLI</span>-<span className="text-[#ff8c00]">X</span> para su marca?
          </p>
          <p className="text-xs sm:text-sm text-gray-300 mt-2">
            Haga clic en cualquiera de nuestras soluciones para enviarnos sus sugerencias, cotizar su espacio o adjuntar imágenes de referencia.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Card 1: Ubicaciones de Alto Impacto */}
          <div 
            onClick={() => handleOpenActionModal('Alto Impacto')}
            className="bg-[#0d182b] border border-[#0fa0e6]/30 hover:border-[#ff8c00] rounded-3xl p-8 transition shadow-xl group cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#0fa0e6] to-[#0873b0] text-white rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white uppercase mb-2 group-hover:text-[#ff8c00] transition">Ubicaciones de Alto Impacto</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Vallas estratégicas en anillos principales de Santa Cruz, avenidas troncales de La Paz, Cochabamba y accesos interdepartamentales.
              </p>
            </div>

            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); handleOpenActionModal('Alto Impacto'); }}
              className="mt-6 w-full py-3.5 bg-gradient-to-r from-[#ff8c00] to-[#ff7300] hover:from-[#ff7300] hover:to-[#e06600] text-white font-extrabold rounded-xl text-xs uppercase transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Cotizar</span>
            </button>
          </div>

          {/* Card 2: Pantallas LED */}
          <div 
            onClick={() => handleOpenActionModal('Pantalla LED')}
            className="bg-[#0d182b] border border-[#0fa0e6]/30 hover:border-[#ff8c00] rounded-3xl p-8 transition shadow-xl group cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#ff8c00] to-[#e67e00] text-white rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white uppercase mb-2 group-hover:text-[#ff8c00] transition">Pantallas Digitales LED</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Spots publicitarios dinámicos en alta resolución 4K exterior con rotación constante y cambios de arte en tiempo real.
              </p>
            </div>

            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); handleOpenActionModal('Pantalla LED'); }}
              className="mt-6 w-full py-3.5 bg-gradient-to-r from-[#ff8c00] to-[#ff7300] hover:from-[#ff7300] hover:to-[#e06600] text-white font-extrabold rounded-xl text-xs uppercase transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Cotizar</span>
            </button>
          </div>

          {/* Card 3: Portal CRM */}
          <div 
            onClick={() => handleOpenInquiry('Proyectos Especiales OOH', 'Desarrollo de Estructuras & Letreros')}
            className="bg-[#0d182b] border border-[#0fa0e6]/30 hover:border-[#ff8c00] rounded-3xl p-8 transition shadow-xl group cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#0fa0e6] to-[#0873b0] text-white rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white uppercase mb-2 group-hover:text-[#ff8c00] transition">Proyectos Especiales & CRM</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Acceda a sus cotizaciones en PDF, contratos firmados con código QR y envíe requerimientos especiales para ingeniería metálica.
              </p>
            </div>

            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); handleOpenInquiry('Proyectos Especiales OOH', 'Desarrollo de Estructuras & Letreros'); }}
              className="mt-6 w-full py-3 bg-[#0a111e] group-hover:bg-[#ff8c00] text-gray-200 group-hover:text-white font-bold rounded-xl text-xs uppercase transition border border-gray-700 group-hover:border-[#ff8c00] flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Solicitar Cotización</span>
            </button>
          </div>

        </div>

        {/* Banner CTA Box within Soluciones */}
        <div className="mt-12 bg-gradient-to-r from-[#0d182b] via-[#0f213d] to-[#0d182b] border-2 border-[#0fa0e6]/40 rounded-3xl p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-xs font-black text-[#0fa0e6] uppercase tracking-wider">¿Tiene una foto o boceto de su proyecto?</span>
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase">
              Reciba una cotización estimada con sus imágenes de referencia
            </h3>
            <p className="text-xs text-gray-300 max-w-xl">
              Si no está registrado aún, nuestro sistema capturará su solicitud para darle respuesta inmediata con la ficha técnica y costo estimado.
            </p>
          </div>

          <button
            onClick={() => handleOpenInquiry('Cotización Personalizada con Imagen', 'Solicitud Directa con Referencias')}
            className="px-8 py-4 bg-gradient-to-r from-[#ff8c00] via-[#ffa024] to-[#ff7300] hover:from-[#ff7300] hover:to-[#e06600] text-white font-black rounded-2xl text-xs sm:text-sm uppercase tracking-wider transition cursor-pointer shadow-xl shadow-[#ff8c00]/40 flex items-center gap-3 border border-amber-300/40 whitespace-nowrap"
          >
            <Upload className="w-5 h-5" />
            <span>Abrir Formulario & Adjuntar</span>
          </button>
        </div>
      </section>

      {/* CALL TO ACTION AT THE VERY BOTTOM OF THE PRESENTATION PAGE */}
      <section className="py-16 px-4 bg-gradient-to-b from-[#0d182b] to-[#0a111e] border-t border-[#0fa0e6]/20 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <span className="bg-[#ff8c00]/15 text-[#ff8c00] border border-[#ff8c00]/40 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest inline-block shadow-sm">
            Catálogo OOH Bolivia 2026
          </span>
          
          <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight leading-tight">
            ¿Listo para destacar su marca en las mejores ubicaciones?
          </h2>
          
          <p className="text-gray-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed font-medium">
            Explore nuestro mapa interactivo de vallas monumentales e impresas y pantallas digitales LED disponibles en todo el país.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onExploreCatalog}
              className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-[#ff8c00] via-[#ffa024] to-[#ff7300] hover:from-[#ff7300] hover:to-[#e06600] text-white font-black rounded-2xl text-base sm:text-lg uppercase tracking-wider transition cursor-pointer shadow-2xl shadow-[#ff8c00]/50 flex items-center justify-center gap-4 transform hover:scale-105 active:scale-95 border-2 border-amber-300/40"
            >
              <Eye className="w-6 h-6 stroke-[2.5]" />
              <span>VER PUNTOS DISPONIBLES</span>
              <ArrowRight className="w-6 h-6 stroke-[3]" />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contacto" className="bg-[#070d18] border-t border-[#0fa0e6]/20 py-12 text-center text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-4 space-y-6">
          <div className="flex items-center justify-center py-2">
            <Logo size="xl" logoUrl={logoUrl} />
          </div>
          <p className="text-gray-300 max-w-md mx-auto leading-relaxed">
            Oficina Central: Av. San Martín #450, Equipetrol, Santa Cruz - Bolivia. <br />
            Teléfono Ventas: +591 70000000 | +591 3 3559988
          </p>
          <div className="pt-4 border-t border-gray-800 text-[11px] text-gray-500">
            © {new Date().getFullYear()} PUBLI-X Bolivia - Todos los derechos reservados.
          </div>
        </div>
      </footer>

      {/* OOH INQUIRY & SUGGESTIONS MODAL */}
      <OOHInquiryModal
        isOpen={showInquiryModal}
        onClose={() => setShowInquiryModal(false)}
        solutionTitle={inquiryTitle}
        solutionType={inquiryType}
      />

      {/* ACTION SELECTION MODAL (COTIZAR BUTTON CLICKS) */}
      <AnimatePresence>
        {showActionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-[#0d182b] border-2 border-[#0fa0e6]/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-6"
            >
              {/* Close button */}
              <button
                onClick={() => setShowActionModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-gray-800/60 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center space-y-2 pt-2">
                <span className="bg-[#ff8c00]/20 text-[#ff8c00] border border-[#ff8c00]/40 text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider inline-block">
                  PUBLI-X BOLIVIA 2026
                </span>
                <h3 className="text-2xl font-black uppercase text-white tracking-tight">
                  {targetCategory === 'Alto Impacto' ? 'Ubicaciones de Alto Impacto' : 'Pantallas Digitales LED 4K'}
                </h3>
                <p className="text-xs text-gray-300">
                  ¿Cómo desea proceder para cotizar y revisar estos espacios publicitarios?
                </p>
              </div>

              {/* 2 Main Action Buttons */}
              <div className="grid grid-cols-1 gap-4 pt-2">
                {/* Button 1: Cliente Registrado / Iniciar Sesión */}
                <button
                  onClick={() => {
                    setShowActionModal(false);
                    if (onOpenLoginWithCategory) {
                      onOpenLoginWithCategory(targetCategory);
                    } else {
                      onOpenLogin();
                    }
                  }}
                  className="w-full p-4 bg-gradient-to-r from-[#0fa0e6] to-[#0873b0] hover:from-[#0873b0] hover:to-[#05517d] text-white font-extrabold rounded-2xl transition shadow-xl flex items-center justify-between group cursor-pointer border border-cyan-400/30"
                >
                  <div className="flex items-center space-x-3.5 text-left">
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                      <UserCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-black uppercase tracking-wide">CLIENTE REGISTRADO</div>
                      <div className="text-[11px] text-cyan-100 font-medium">
                        Iniciar sesión para ver directamente las vallas de {targetCategory === 'Alto Impacto' ? 'Alto Impacto' : 'Pantallas LED'}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition flex-shrink-0 ml-2" />
                </button>

                {/* Button 2: Nuevo Cliente / Solicitar Cotización */}
                <button
                  onClick={() => {
                    setShowActionModal(false);
                    handleOpenInquiry(
                      targetCategory === 'Alto Impacto' ? 'Ubicaciones de Alto Impacto' : 'Pantallas Digitales LED 4K',
                      targetCategory === 'Alto Impacto' ? 'Vallas Monumentales & Estratégicas' : 'Publicidad Exterior Digital'
                    );
                  }}
                  className="w-full p-4 bg-gradient-to-r from-[#ff8c00] via-[#ffa024] to-[#ff7300] hover:from-[#ff7300] hover:to-[#e06600] text-white font-extrabold rounded-2xl transition shadow-xl flex items-center justify-between group cursor-pointer border border-amber-300/40"
                >
                  <div className="flex items-center space-x-3.5 text-left">
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                      <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-black uppercase tracking-wide">NUEVO CLIENTE</div>
                      <div className="text-[11px] text-amber-100 font-medium">
                        Registrarse o enviar formulario de cotización directa con imágenes de referencia
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition flex-shrink-0 ml-2" />
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}


