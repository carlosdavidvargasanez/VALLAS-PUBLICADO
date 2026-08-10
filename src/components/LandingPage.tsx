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
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-[#d21482] selection:text-white">
      
      {/* Background Ambient Glows - Pantone Magenta (#d21482) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#d21482]/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-[#d21482]/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
      </div>

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo with Pantone Magenta Gradient */}
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-gradient-to-br from-[#f552b0] via-[#d21482] to-[#8a0651] rounded-2xl flex items-center justify-center shadow-lg shadow-[#d21482]/30 font-black text-white tracking-tighter text-xl">
              PX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-white uppercase">PUBLI-X</span>
                <span className="bg-[#d21482]/20 text-[#f552b0] border border-[#d21482]/40 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Bolivia
                </span>
              </div>
              <span className="text-[11px] font-bold text-gray-400 tracking-wider block -mt-0.5">
                Publicidad Exterior OOH & LED
              </span>
            </div>
          </div>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-bold uppercase tracking-wider text-gray-300">
            <a href="#inicio" className="hover:text-[#f552b0] transition">Inicio</a>
            <a href="#cobertura" className="hover:text-[#f552b0] transition">Cobertura Nacional</a>
            <a href="#soluciones" className="hover:text-[#f552b0] transition">Soluciones OOH</a>
            <a href="#contacto" className="hover:text-[#f552b0] transition">Contacto</a>
          </nav>

          {/* Top Header Login Button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenLogin}
              className="flex items-center space-x-1.5 px-4 py-2 bg-gray-900 hover:bg-[#d21482]/20 border border-gray-700 hover:border-[#d21482]/60 text-gray-200 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-[#f552b0]" />
              <span>Ingresar</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION - Directly showing Publi-X Banner */}
      <section id="inicio" className="relative pt-6 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* OOH Digital Showcase Banner Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative rounded-3xl overflow-hidden border border-[#d21482]/40 shadow-2xl shadow-[#d21482]/15 max-w-5xl mx-auto group"
          >
            <img 
              src={oohBannerImage} 
              alt="PUBLI-X Bolivia Digital Billboard Banner" 
              className="w-full h-80 sm:h-[450px] object-cover transform group-hover:scale-105 transition duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent flex flex-col justify-end p-6 sm:p-12">
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
                <div>
                  <span className="bg-[#d21482] text-white font-black text-xs px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                    PUBLI-X BOLIVIA 2026
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-black text-white mt-3 uppercase tracking-tight">
                    Vallas Monumentales & Pantallas LED
                  </h3>
                  <p className="text-gray-300 text-xs sm:text-sm mt-1.5 max-w-xl leading-relaxed">
                    Ubicaciones estratégicas de alto tráfico en Santa Cruz, La Paz y Cochabamba.
                  </p>
                </div>
                
                {/* THE ONLY "VER PUNTOS DISPONIBLES" BUTTON AS REQUESTED */}
                <button
                  onClick={onExploreCatalog}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#d21482] via-[#e01a8f] to-[#be1074] hover:from-[#b00f6c] hover:to-[#a00c61] text-white font-black rounded-2xl text-sm sm:text-base uppercase tracking-wider transition cursor-pointer shadow-2xl shadow-[#d21482]/40 flex items-center justify-center gap-3 shrink-0 transform hover:scale-105 active:scale-95"
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
      <section id="cobertura" className="py-12 bg-gray-900/60 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            
            <div className="p-4 bg-gray-950/60 rounded-2xl border border-gray-800">
              <div className="text-3xl sm:text-4xl font-black text-[#f552b0]">250+</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Vallas & LEDs Activas</div>
            </div>

            <div className="p-4 bg-gray-950/60 rounded-2xl border border-gray-800">
              <div className="text-3xl sm:text-4xl font-black text-[#f552b0]">9</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Departamentos Bolivia</div>
            </div>

            <div className="p-4 bg-gray-950/60 rounded-2xl border border-gray-800">
              <div className="text-3xl sm:text-4xl font-black text-[#f552b0]">100%</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Iluminación Garantizada</div>
            </div>

            <div className="p-4 bg-gray-950/60 rounded-2xl border border-gray-800">
              <div className="text-3xl sm:text-4xl font-black text-[#f552b0]">PDF</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Cotizaciones Inmediatas</div>
            </div>

          </div>
        </div>
      </section>

      {/* PLATFORM FEATURES */}
      <section id="soluciones" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-black text-[#f552b0] uppercase tracking-widest mb-2">Servicios Integrales</h2>
          <p className="text-3xl sm:text-4xl font-black uppercase text-white">
            ¿Por qué elegir PUBLI-X para su marca?
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-8 hover:border-[#d21482]/50 transition">
            <div className="w-12 h-12 bg-[#d21482]/20 text-[#f552b0] rounded-2xl flex items-center justify-center mb-6">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white uppercase mb-2">Ubicaciones de Alto Impacto</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Vallas estratégicas en anillos principales de Santa Cruz, avenidas troncales de La Paz, Cochabamba y accesos interdepartamentales.
            </p>
          </div>

          <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-8 hover:border-[#d21482]/50 transition">
            <div className="w-12 h-12 bg-[#d21482]/20 text-[#f552b0] rounded-2xl flex items-center justify-center mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white uppercase mb-2">Pantallas Digitales LED</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Spots publicitarios dinámicos en alta resolución 4K exterior con rotación constante y cambios de arte en tiempo real.
            </p>
          </div>

          <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-8 hover:border-[#d21482]/50 transition">
            <div className="w-12 h-12 bg-[#d21482]/20 text-[#f552b0] rounded-2xl flex items-center justify-center mb-6">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white uppercase mb-2">Portal CRM de Contratos</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Acceda a sus cotizaciones en PDF, contratos firmados con código QR y reportes de exhibición directamente desde la plataforma.
            </p>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer id="contacto" className="bg-gray-900 border-t border-gray-800 py-12 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-8 h-8 bg-[#d21482] text-white font-black rounded-xl flex items-center justify-center text-sm shadow-md">PX</div>
            <span className="font-extrabold text-white text-base">PUBLI-X BOLIVIA</span>
          </div>
          <p className="text-gray-400 max-w-md mx-auto">
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

