import React, { useState } from 'react';
import { COMPANY_IDENTITY, COLORLINK_PILLARS } from '../data/companyInfo';
import { 
  Target, 
  Compass, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight, 
  Layers, 
  Cpu, 
  Factory, 
  Truck, 
  Award, 
  Calculator,
  Eye
} from 'lucide-react';

interface CompanyIdentityProps {
  onGoToCapture: () => void;
  onGoToProjects: () => void;
  onGoToCotizador?: () => void;
  onGoToVisualizer?: () => void;
  onGoToTracking?: () => void;
}

export const CompanyIdentity: React.FC<CompanyIdentityProps> = ({
  onGoToCapture,
  onGoToProjects,
  onGoToCotizador,
  onGoToVisualizer,
  onGoToTracking
}) => {
  const [selectedPillarId, setSelectedPillarId] = useState<number>(1);
  const activePillar = COLORLINK_PILLARS.find((p) => p.id === selectedPillarId) || COLORLINK_PILLARS[0];

  const pillarIcons: Record<number, React.ReactNode> = {
    1: <Cpu className="w-5 h-5" />,
    2: <Sparkles className="w-5 h-5" />,
    3: <Truck className="w-5 h-5" />,
    4: <Factory className="w-5 h-5" />,
    5: <Award className="w-5 h-5" />
  };

  return (
    <div className="space-y-10 pb-12 animate-in fade-in duration-300">
      
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white p-6 sm:p-10 lg:p-12 border border-blue-900/50 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-5xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30 mb-4 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Transformación Digital Inteligente • Proyecto Pintuco®</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            COLORLINK <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-amber-300">Pintuco</span>
          </h2>
          
          <div className="mt-4 space-y-3 max-w-4xl">
            <p className="text-base sm:text-xl text-blue-100 font-semibold leading-relaxed">
              Transformamos la manera de gestionar tus proyectos de pintura y recubrimientos industriales con nuestro Ecosistema Inteligente.
            </p>
            <p className="text-sm sm:text-base text-blue-200/90 font-normal leading-relaxed">
              Pasamos de la simple compra de insumos a una solución integral 100% automatizada que conecta cada etapa de tu requerimiento en tiempo real: desde la especificación técnica hasta la aplicación final en campo.
            </p>
          </div>

          {/* ¿Por qué optimizar tus proyectos con nosotros? */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-amber-300">
                ¿Por qué optimizar tus proyectos con nosotros?
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Feature 1 */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 hover:border-blue-400/40 transition-all backdrop-blur-xs flex flex-col justify-between group">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                      <Cpu className="w-4 h-4 text-blue-300" />
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-200 transition-colors">
                      Formulación Técnica Precisa
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed font-normal">
                    Diseñamos y ajustamos la fórmula exacta según las especificaciones de durabilidad, resistencia y desempeño que tu infraestructura necesita.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 hover:border-blue-400/40 transition-all backdrop-blur-xs flex flex-col justify-between group">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                      <Truck className="w-4 h-4 text-cyan-300" />
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-200 transition-colors">
                      Control Operativo en Tiempo Real
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed font-normal">
                    Visualiza de inmediato la disponibilidad de inventario en nuestros Centros de Distribución (CEDIs) y agiliza tus despachos sin tiempos muertos.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 hover:border-blue-400/40 transition-all backdrop-blur-xs flex flex-col justify-between group">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                      <Factory className="w-4 h-4 text-amber-300" />
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-200 transition-colors">
                      Servicio de Aplicación Especializada
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed font-normal">
                    No solo te entregamos el producto; garantizamos su correcta ejecución en obra con personal experto y equipo calificado.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 hover:border-blue-400/40 transition-all backdrop-blur-xs flex flex-col justify-between group">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                      <Award className="w-4 h-4 text-emerald-300" />
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-200 transition-colors">
                      Aseguramiento de Calidad End-to-End
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed font-normal">
                    Auditamos el rendimiento y la adherencia en cada capa para asegurar un acabado impecable y de máxima durabilidad.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Misión, Visión, Valores & Objetivos */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Marco Estratégico & Propósito Corporativo
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Fundamentos de ingeniería, negocio y sostenibilidad de COLORLINK Pintuco
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Misión */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Target className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Misión COLORLINK</h4>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {COMPANY_IDENTITY.mision}
            </p>
          </div>

          {/* Visión */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <Compass className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Visión 2030</h4>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {COMPANY_IDENTITY.vision}
            </p>
          </div>
        </div>

        {/* Objetivos & Valores */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Objetivos Estratégicos */}
          <div className="lg:col-span-1 bg-gradient-to-br from-slate-900 to-blue-950 text-white p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h4 className="text-base font-bold text-white uppercase tracking-wider text-xs">
                  Objetivos de Transformación
                </h4>
              </div>
              <p className="text-xs text-blue-200 mb-4">
                Metas cuantitativas para la modernización de la cadena de valor de Pintuco:
              </p>
              <ul className="space-y-3 text-xs text-slate-200">
                {COMPANY_IDENTITY.objetivos.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-500/30 text-blue-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-snug">{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 text-[11px] text-slate-400">
              Alineado con el Modelo Operacional 4.0 de Pintuco.
            </div>
          </div>

          {/* Valores Corporativos */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              Valores del Ecosistema COLORLINK
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {COMPANY_IDENTITY.valores.map((val, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors">
                  <h5 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{val.title}</span>
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {val.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Los 5 Pilares Fundamentales de la Plataforma */}
      <section className="space-y-5">
        <div className="bg-blue-900/5 border border-blue-200 p-6 rounded-2xl">
          <div className="max-w-3xl">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider bg-blue-100 px-2.5 py-0.5 rounded-full">
              Arquitectura E2E
            </span>
            <h3 className="text-2xl font-black text-slate-900 mt-2">
              Los 5 Pilares Fundamentales de COLORLINK
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Explora cómo cada fase del ecosistema digital conecta los datos del cliente con la respuesta técnica, logística, operativa y de calidad.
            </p>
          </div>

          {/* Pillar Selector Pills */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {COLORLINK_PILLARS.map((p) => {
              const isSelected = p.id === selectedPillarId;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPillarId(p.id)}
                  className={`p-3 rounded-xl text-left transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-blue-700 text-white border-blue-700 shadow-md transform -translate-y-0.5'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-black font-mono px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {p.number}
                    </span>
                    <div className={isSelected ? 'text-white' : 'text-blue-600'}>
                      {pillarIcons[p.id]}
                    </div>
                  </div>
                  <div className={`text-xs font-bold leading-snug line-clamp-2 ${
                    isSelected ? 'text-white' : 'text-slate-900'
                  }`}>
                    {p.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Pillar Detail Card */}
          <div className="mt-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-xs">
                  {activePillar.number}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">
                    {activePillar.title}
                  </h4>
                  <p className="text-xs text-blue-700 font-semibold">
                    {activePillar.tagline}
                  </p>
                </div>
              </div>

              {/* Metrics Badge */}
              <div className="flex flex-wrap gap-2">
                {activePillar.metrics.map((m, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-sm text-slate-700 mt-4 leading-relaxed">
              {activePillar.description}
            </p>

            {/* Input -> Action -> Output Pipeline Flow */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                  1. Entrada (Input)
                </span>
                <p className="text-xs text-slate-800 font-medium">
                  {activePillar.input}
                </p>
              </div>

              <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 block mb-1">
                  2. Procesamiento & Acción
                </span>
                <p className="text-xs text-blue-900 font-medium">
                  {activePillar.action}
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block mb-1">
                  3. Salida de Valor (Output)
                </span>
                <p className="text-xs text-emerald-900 font-bold">
                  {activePillar.output}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PILARES DE INNOVACIÓN TECNOLÓGICA */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Ecosistema Digital Pintuco®
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Herramientas de Alta Tecnología para Clientes & Contratistas
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Módulos interactivos diseñados para transformar la experiencia de visualización de color y logística de entrega en obra.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card 1: Simulador AR */}
          <div 
            onClick={onGoToVisualizer}
            className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-wider block">Innovación Visual • AR & Canvas</span>
                <h4 className="text-lg font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
                  Simulador & Visualizador de Color
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Proyecta cartas de color Pintuco en fachadas exteriores, salas residenciales, oficinas y pisos epóxicos con iluminación diurna/nocturna y comparador antes vs. después.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-700">
              <span>Abrir Simulador Interactivo</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Tracking en Vivo */}
          <div 
            onClick={onGoToTracking}
            className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider block">Logística de Entrega • CEDI Despachos</span>
                <h4 className="text-lg font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                  Tracking en Vivo "Pintuco Express"
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Rastrea tu pedido desde el CEDI de origen con mapa GPS en tiempo real, datos del conductor, remisión de lote y descarga de póliza de garantía oficial.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
              <span>Rastrear Pedido en Vivo</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </section>

      {/* Banner to Capture */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
            <Layers className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">¿Listo para probar el flujo de Captura Inteligente de Proyectos?</h4>
            <p className="text-xs text-blue-100">
              Completa el Formulario Mínimo Viable (Identificación, Proyecto, Técnico, Evidencia) y genera el ID de trazabilidad.
            </p>
          </div>
        </div>

        <button
          onClick={onGoToCapture}
          id="btn-banner-captura"
          className="px-6 py-3 bg-[#FF6B35] hover:bg-[#E85520] text-white font-black text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg hover:shadow-orange-500/25 transition-all whitespace-nowrap cursor-pointer border border-orange-400/30"
        >
          Iniciar Captura Ahora
        </button>
      </section>

    </div>
  );
};
