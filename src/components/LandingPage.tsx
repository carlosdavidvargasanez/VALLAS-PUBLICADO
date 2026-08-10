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
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-amber-500 selection:text-gray-950">
      
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 font-black text-gray-950 tracking-tighter text-xl">
              PX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-white uppercase">PUBLI-X</span>
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
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
            <a href="#inicio" className="hover:text-amber-400 transition">Inicio</a>
            <a href="#cobertura" className="hover:text-amber-400 transition">Cobertura Nacional</a>
            <a href="#soluciones" className="hover:text-amber-400 transition">Soluciones OOH</a>
            <a href="#contacto" className="hover:text-amber-400 transition">Contacto</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenLogin}
              className="hidden sm:flex items-center space-x-1.5 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-amber-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Ingresar al Portal</span>
            </button>

            <button
              onClick={onExploreCatalog}
              className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/25 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Presentation className="w-4 h-4 stroke-[3]" />
              <span>IR A VALLAS</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="inicio" className="relative pt-12 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-4xl mx-auto space-y-6">
            
            {/* Top Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 px-4 py-1.5 rounded-full text-xs font-bold text-amber-400 uppercase tracking-widest backdrop-blur-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Red Lider de Vallas Impresas y Pantallas LED Digitales</span>
            </motion.div>

            {/* Main Title */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight uppercase text-white leading-none"
            >
              IMPACTO VISUAL <br />
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                EN TODA BOLIVIA
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-xl text-gray-300 font-medium max-w-2xl mx-auto leading-relaxed"
            >
              Plataforma comercial de gestión de publicidad exterior OOH. Reserve puntos estratégicos de alto tráfico en Santa Cruz, La Paz, Cochabamba y el resto del país.
            </motion.p>

            {/* Big Action Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <button
                onClick={onExploreCatalog}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black rounded-2xl text-base uppercase tracking-wider transition shadow-xl shadow-amber-500/30 flex items-center justify-center space-x-3 cursor-pointer transform hover:-translate-y-1 active:translate-y-0"
              >
                <Presentation className="w-6 h-6 stroke-[2.5]" />
                <span>IR A CATÁLOGO DE VALLAS</span>
                <ArrowRight className="w-5 h-5 stroke-[3]" />
              </button>

              <button
                onClick={onOpenLogin}
                className="w-full sm:w-auto px-8 py-4 bg-gray-900 hover:bg-gray-800 border-2 border-gray-700 text-white font-bold rounded-2xl text-base uppercase tracking-wider transition flex items-center justify-center space-x-3 cursor-pointer"
              >
                <Lock className="w-5 h-5 text-amber-400" />
                <span>ACCESO CLIENTES Y PERSONAL</span>
              </button>
            </motion.div>

            {/* Quick Login Guide Banner */}
            <div className="pt-6">
              <div className="inline-block p-4 bg-gray-900/90 border border-amber-500/30 rounded-2xl text-left text-xs max-w-xl mx-auto backdrop-blur-md">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0 mt-0.5">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-amber-300 text-sm">¿Cómo ingresar al Portal?</h4>
                    <p className="text-gray-300 text-xs mt-0.5">
                      <strong>Clientes:</strong> Su nombre de usuario es sin @ (ej. <code className="text-amber-300 font-mono">cliente.upds</code>) y su clave es su número de celular (ej. <code className="text-amber-300 font-mono">70000000</code>).
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* OOH Digital Showcase Banner Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-14 relative rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl shadow-amber-500/10 max-w-5xl mx-auto group"
          >
            <img 
              src={oohBannerImage} 
              alt="PUBLI-X Bolivia Digital Billboard Banner" 
              className="w-full h-80 sm:h-96 object-cover transform group-hover:scale-105 transition duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent flex flex-col justify-end p-6 sm:p-10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="bg-amber-500 text-gray-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                    Red Premium OOH 2026
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white mt-2">
                    Vallas Monumentales & Pantallas LED
                  </h3>
                  <p className="text-gray-300 text-xs sm:text-sm mt-1 max-w-xl">
                    Soporte técnico, mantenimiento garantizado, iluminación LED nocturna y reporte fotográfico para sus campañas.
                  </p>
                </div>
                
                <button
                  onClick={onExploreCatalog}
                  className="px-6 py-3 bg-white text-gray-950 font-black rounded-xl text-xs uppercase tracking-wider hover:bg-amber-400 transition cursor-pointer shadow-lg flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Ver Puntos Disponibles</span>
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
              <div className="text-3xl sm:text-4xl font-black text-amber-400">250+</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Vallas & LEDs Activas</div>
            </div>

            <div className="p-4 bg-gray-950/60 rounded-2xl border border-gray-800">
              <div className="text-3xl sm:text-4xl font-black text-amber-400">9</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Departamentos Bolivia</div>
            </div>

            <div className="p-4 bg-gray-950/60 rounded-2xl border border-gray-800">
              <div className="text-3xl sm:text-4xl font-black text-amber-400">100%</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Iluminación Garantizada</div>
            </div>

            <div className="p-4 bg-gray-950/60 rounded-2xl border border-gray-800">
              <div className="text-3xl sm:text-4xl font-black text-amber-400">PDF</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Cotizaciones Inmediatas</div>
            </div>

          </div>
        </div>
      </section>

      {/* PLATFORM FEATURES */}
      <section id="soluciones" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-2">Servicios Integrales</h2>
          <p className="text-3xl sm:text-4xl font-black uppercase text-white">
            ¿Por qué elegir PUBLI-X para su marca?
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-8 hover:border-amber-500/50 transition">
            <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mb-6">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white uppercase mb-2">Ubicaciones de Alto Impacto</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Vallas estratégicas en anillos principales de Santa Cruz, avenidas troncales de La Paz, Cochabamba y accesos interdepartamentales.
            </p>
          </div>

          <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-8 hover:border-amber-500/50 transition">
            <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white uppercase mb-2">Pantallas Digitales LED</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Spots publicitarios dinámicos en alta resolución 4K exterior con rotación constante y cambios de arte en tiempo real.
            </p>
          </div>

          <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-8 hover:border-amber-500/50 transition">
            <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mb-6">
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
            <div className="w-8 h-8 bg-amber-500 text-gray-950 font-black rounded-xl flex items-center justify-center text-sm">PX</div>
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
