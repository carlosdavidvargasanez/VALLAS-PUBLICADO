import React from 'react';
import { Presentation, Shield, Lock, MapPin, Sparkles, CheckCircle2, Phone, Star, Building2, ArrowRight, Eye, Smartphone, Zap, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import oohBannerImage from '../assets/images/publi_x_ooh_banner_1786328834763.jpg';

interface LandingPageProps {
  onOpenLogin: () => void;
  onExploreCatalog: () => void;
}

export default function LandingPage({ onOpenLogin, onExploreCatalog }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#0a111e] text-white font-sans selection:bg-[#ff8c00] selection:text-white">
      
      {/* Background Ambient Glows with Process Blue (#0fa0e6) & Vibrant Orange (#ff8c00) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#0fa0e6]/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-[#ff8c00]/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-[#0fa0e6]/10 rounded-full blur-3xl" />
      </div>

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0a111e]/90 backdrop-blur-xl border-b border-[#0fa0e6]/30 shadow-xl shadow-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo - PUBLI (Blue) + X (Orange #ff8c00) */}
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#0fa0e6]/20 font-black tracking-tighter text-xl">
              <span className="text-[#0fa0e6]">P</span>
              <span className="text-[#ff8c00]">X</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-white uppercase">
                  PUBLI<span className="text-[#ff8c00]">-X</span>
                </span>
                <span className="bg-[#ff8c00] text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  Bolivia
                </span>
              </div>
              <span className="text-[11px] font-bold text-[#0fa0e6] tracking-wider block -mt-0.5">
                Publicidad Exterior OOH & LED
              </span>
            </div>
          </div>

          {/* Quick Nav Links */}
          <nav className="flex items-center space-x-8 text-xs font-bold uppercase tracking-wider text-gray-200">
            <a href="#inicio" className="hover:text-[#0fa0e6] transition py-1">Inicio</a>
            <a href="#cobertura" className="hover:text-[#0fa0e6] transition py-1">Cobertura Nacional</a>
            <a href="#soluciones" className="hover:text-[#0fa0e6] transition py-1">Soluciones OOH</a>
            <a href="#contacto" className="hover:text-[#0fa0e6] transition py-1">Contacto</a>
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
                    Ubicaciones estratégicas de alto tráfico en Santa Cruz, La Paz y Cochabamba.
                  </p>
                </div>
                
                {/* HIGH VISIBILITY "VER PUNTOS DISPONIBLES" BUTTON */}
                <button
                  onClick={onExploreCatalog}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#ff8c00] via-[#ffa024] to-[#ff7300] hover:from-[#ff7300] hover:to-[#e06600] text-white font-black rounded-2xl text-sm sm:text-base uppercase tracking-wider transition cursor-pointer shadow-2xl shadow-[#ff8c00]/50 flex items-center justify-center gap-3 shrink-0 transform hover:scale-105 active:scale-95 border-2 border-amber-300/40"
                >
                  <Eye className="w-5 h-5 stroke-[2.5]" />
                  <span>VER PUNTOS DISPONIBLES</span>
                  <ArrowRight className="w-5 h-5 stroke-[3]" />
                </button>
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

      {/* PLATFORM FEATURES */}
      <section id="soluciones" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-black text-[#ff8c00] uppercase tracking-widest mb-2 bg-[#ff8c00]/10 border border-[#ff8c00]/30 inline-block px-3.5 py-1 rounded-full">Servicios Integrales</h2>
          <p className="text-3xl sm:text-4xl font-black uppercase text-white mt-3">
            ¿Por qué elegir PUBLI-X para su marca?
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          <div className="bg-[#0d182b] border border-[#0fa0e6]/30 rounded-3xl p-8 hover:border-[#ff8c00]/60 transition shadow-xl group">
            <div className="w-12 h-12 bg-gradient-to-br from-[#0fa0e6] to-[#0873b0] text-white rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white uppercase mb-2">Ubicaciones de Alto Impacto</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Vallas estratégicas en anillos principales de Santa Cruz, avenidas troncales de La Paz, Cochabamba y accesos interdepartamentales.
            </p>
          </div>

          <div className="bg-[#0d182b] border border-[#0fa0e6]/30 rounded-3xl p-8 hover:border-[#ff8c00]/60 transition shadow-xl group">
            <div className="w-12 h-12 bg-gradient-to-br from-[#ff8c00] to-[#e67e00] text-white rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white uppercase mb-2">Pantallas Digitales LED</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Spots publicitarios dinámicos en alta resolución 4K exterior con rotación constante y cambios de arte en tiempo real.
            </p>
          </div>

          <div className="bg-[#0d182b] border border-[#0fa0e6]/30 rounded-3xl p-8 hover:border-[#ff8c00]/60 transition shadow-xl group">
            <div className="w-12 h-12 bg-gradient-to-br from-[#0fa0e6] to-[#0873b0] text-white rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white uppercase mb-2">Portal CRM de Contratos</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Acceda a sus cotizaciones en PDF, contratos firmados con código QR y reportes de exhibición directamente desde la plataforma.
            </p>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer id="contacto" className="bg-[#070d18] border-t border-[#0fa0e6]/20 py-12 text-center text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center font-black text-sm shadow-md">
              <span className="text-[#0fa0e6]">P</span>
              <span className="text-[#ff8c00]">X</span>
            </div>
            <span className="font-extrabold text-white text-base">PUBLI-X BOLIVIA</span>
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

    </div>
  );
}


