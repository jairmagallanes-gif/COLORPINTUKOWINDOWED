import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Bot, 
  X, 
  RefreshCw, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  Leaf, 
  Package, 
  Send, 
  MessageSquare, 
  Check, 
  Sliders, 
  Eye, 
  Image as ImageIcon, 
  AlertTriangle, 
  ArrowRight,
  Info,
  Droplets,
  Sun,
  Shield,
  Palette,
  Maximize2
} from 'lucide-react';
import { 
  SurfaceType, 
  EnvironmentType, 
  SurfaceCondition, 
  FinishType, 
  AiDiagnosisResult 
} from '../types';
import { PINTUCO_PALETTE } from '../data/pintucoCatalog';

interface AiDiagnosisAndSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  technical: {
    surface: SurfaceType;
    environment: EnvironmentType;
    condition: SurfaceCondition;
    finish?: FinishType;
    colorName?: string;
    colorHex?: string;
  };
  project: {
    areaM2: number;
    city?: string;
    clientName?: string;
  };
  evidence: {
    description?: string;
    photos?: string[];
    observations?: string;
  };
  onApplyRecommendation?: (result: AiDiagnosisResult, selectedColor?: { name: string; hex: string }) => void;
}

export const AiDiagnosisAndSimulatorModal: React.FC<AiDiagnosisAndSimulatorModalProps> = ({
  isOpen,
  onClose,
  technical,
  project,
  evidence,
  onApplyRecommendation
}) => {
  const [activeTab, setActiveTab] = useState<'simulacion' | 'diagnostico' | 'materiales' | 'chat'>('simulacion');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiDiagnosisResult | null>(null);
  const [aiSource, setAiSource] = useState<string>('groq-ai');
  
  // Simulation Controls
  const [sliderPosition, setSliderPosition] = useState(50);
  const [viewMode, setViewMode] = useState<'slider' | 'side_by_side'>('slider');
  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string }>({
    name: technical.colorName || 'Blanco Lino 1001-P',
    hex: technical.colorHex || '#F7F6F2'
  });
  const [selectedFinish, setSelectedFinish] = useState<string>(technical.finish || 'mate');

  // Chat State
  const [aiQuestion, setAiQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Sync initial color with technical props when modal opens
  useEffect(() => {
    if (isOpen) {
      if (technical.colorName && technical.colorHex) {
        setSelectedColor({ name: technical.colorName, hex: technical.colorHex });
      }
      if (technical.finish) {
        setSelectedFinish(technical.finish);
      }
      fetchDiagnosis();
    }
  }, [isOpen, technical.surface, technical.environment, technical.condition, technical.colorHex]);

  // NOTE: Modal only closes when the user explicitly clicks the "Cerrar" button.
  // Backdrop click and accidental ESC key closing have been disabled per requirement.

  const fetchDiagnosis = async (customColor?: { name: string; hex: string }) => {
    setLoading(true);
    const colorToUse = customColor || selectedColor;

    try {
      const photoSummary = evidence.photos && evidence.photos.length > 0
        ? `${evidence.photos.length} fotos adjuntas de evidencia`
        : 'Muestra estándar del sustrato';

      const res = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surface: technical.surface,
          environment: technical.environment,
          condition: technical.condition,
          areaM2: project.areaM2 || 100,
          description: `${evidence.description || ''}. Observaciones: ${evidence.observations || ''}`,
          photoDescription: photoSummary,
          photos: evidence.photos || [],
          colorName: colorToUse.name,
          colorHex: colorToUse.hex,
          finish: selectedFinish
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setResult(json.data);
          if (json.source) {
            setAiSource(json.source);
          }
          return;
        }
      }
      // Fallback if endpoint didn't return
      setResult(generateLocalFallback(colorToUse));
    } catch (err) {
      console.warn('Error fetching AI diagnosis:', err);
      setResult(generateLocalFallback(colorToUse));
    } finally {
      setLoading(false);
    }
  };

  const generateLocalFallback = (col: { name: string; hex: string }): AiDiagnosisResult => {
    const isExterior = technical.environment.includes('exterior') || technical.environment.includes('inmersion');
    const isMetal = technical.surface.includes('metal');
    const isIndustrial = technical.surface.includes('piso') || technical.environment.includes('industrial');

    const primary = isIndustrial
      ? 'Pintucoat® Epóxico de Altos Sólidos'
      : isMetal
      ? 'Pintulux® 3 en 1 Esmalte Anticorrosivo'
      : isExterior
      ? 'Koraza® 5 Máxima Durabilidad Exteriores'
      : 'Viniltex® Bio-Cuidado Antibacterial 0 VOC';

    const primer = isIndustrial
      ? 'Pintupox® Primer Epóxico'
      : isMetal
      ? 'Pintulux® Anticorrosivo Cromato de Zinc'
      : 'Sellomax® 7 en 1 Imprimante Antihumedad';

    const area = project.areaM2 || 100;

    return {
      diagnostico: `Diagnóstico para sustrato ${technical.surface.replace(/_/g, ' ')} expuesto a ${technical.environment.replace(/_/g, ' ')}. La patología de "${technical.condition.replace(/_/g, ' ')}" compromete la película. Requiere sellado e inhibición con ${primer} y acabado bicapa con ${primary}.`,
      recomendacionPintuco: primary,
      imprimanteRecomendado: primer,
      sistemaCapas: [
        'Fase 1: Limpieza mecánica profunda, lijado y retiro de partes sueltas.',
        `Fase 2: Aplicación de 1 mano uniforme de ${primer} para neutralizar alcalinidad.`,
        `Fase 3: 1ª mano de ${primary} diluida al 10% con agua limpia.`,
        `Fase 4: 2ª mano de acabado de ${primary} para lograr película protectora continua de 3.5 mils.`
      ],
      materialesVenta: [
        {
          producto: primary,
          presentacion: area > 150 ? 'Cuñetes (5 Gal)' : 'Galones (3.785 L)',
          cantidadEstimada: `${Math.ceil((area * 2) / 35)} galones aprox. (${area} m²)`,
          rol: 'Acabado y Protección Principal'
        },
        {
          producto: primer,
          presentacion: 'Galón o Cuñete según área',
          cantidadEstimada: `${Math.ceil(area / 40)} galón(es)`,
          rol: 'Sellado, Fijación e Inhibición de Humedad'
        },
        {
          producto: 'Masilla Acrílica / Sellador de Fisuras Pintuco®',
          presentacion: 'Galón',
          cantidadEstimada: '1 a 2 unidades',
          rol: 'Nivelación y Calafateo de Superficie'
        },
        {
          producto: 'Kit Profesional Pintuco (Rodillo Microfibra + Brocha 3" + Bandeja)',
          presentacion: 'Kit de Aplicación',
          cantidadEstimada: '1 a 2 kits',
          rol: 'Herramientas Certificadas de Aplicación'
        }
      ],
      simulacionAcabado: {
        titulo: `Acabado de Alta Gama con ${primary}`,
        descripcionResultado: `La superficie quedará 100% homogénea, continua y sellada en el tono ${col.name} (${col.hex}). El sistema Pintuco® sella las imperfecciones de ${technical.condition.replace(/_/g, ' ')}, generando una película con tecnología perleo que repele la humedad y el polvo.`,
        texturaVisual: 'Textura tersa, uniforme, sin marcas de empalme ni sombras, con efecto hidrófobo de perleo de agua.',
        nivelBrillo: isMetal || isIndustrial ? 'Brillante industrial de alta reflexión' : isExterior ? 'Mate satinado con elastómeros y filtro UV' : 'Mate aterciopelado de alta elegancia',
        tonoColor: `${col.name} (${col.hex})`,
        durabilidadGarantizada: isExterior ? 'Garantía certificada de 5 a 7 años contra decoloración' : 'Durabilidad superior de más de 8 años con resistencia a 2,000 ciclos de lavado',
        beneficioEstetico: 'Máxima luminosidad, valorización inmediata del inmueble y estética arquitectónica moderna.',
        aspectosTransformados: [
          `Eliminación total del defecto inicial (${technical.condition.replace(/_/g, ' ')}).`,
          'Sellado elástico que previene reaparición de salitre y manchas.',
          `Tono ${col.name} uniforme con protección solar UV.`,
          'Película antimicrobiana y lavable certificada.'
        ]
      },
      pasosClave: [
        'Limpieza y desengrase o lijado del sustrato.',
        'Corrección de fisuras con Masilla Pintuco.',
        'Aplicación de Imprimante Sellomax o Anticorrosivo.',
        '2 manos de acabado respetando 3 horas de secado.'
      ],
      riesgosMitigados: [
        'Previene ampollamiento y desprendimiento prematuro.',
        'Evita filtración de humedad y manchas de salitre.',
        'Garantiza el rendimiento óptimo por m².',
        'Protege la inversión con garantía de fábrica.'
      ],
      selloSostenibilidad: 'Fórmula Pintuco eco-amigable con ultra bajo VOC (Compuestos Orgánicos Volátiles), segura para el medio ambiente y los aplicadores.'
    };
  };

  const handleColorChange = (color: { name: string; hex: string }) => {
    setSelectedColor(color);
    if (result && result.simulacionAcabado) {
      setResult({
        ...result,
        simulacionAcabado: {
          ...result.simulacionAcabado,
          tonoColor: `${color.name} (${color.hex})`,
          descripcionResultado: result.simulacionAcabado.descripcionResultado.replace(
            /tono .*?\)/,
            `tono "${color.name}" (${color.hex})`
          )
        }
      });
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim() || chatLoading) return;

    const userText = aiQuestion.trim();
    setAiQuestion('');
    setChatHistory(prev => [...prev, { role: 'user', text: userText }]);
    setChatLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userText,
          surface: technical.surface,
          condition: technical.condition,
          colorName: selectedColor.name,
          context: `Diagnóstico: ${result?.diagnostico || ''}. Sistema recomendado: ${result?.recomendacionPintuco || ''}. Imprimante: ${result?.imprimanteRecomendado || ''}`
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.reply) {
          setChatHistory(prev => [...prev, { role: 'assistant', text: json.reply }]);
          return;
        }
      }
      
      // Fallback to general advice
      setChatHistory(prev => [...prev, { role: 'assistant', text: 'Recomendación Técnica Pintuco: Limpie la superficie con desengrasante, aplique Sellomax® 7 en 1 y aplique 2 manos de acabado con tiempo de secado de 3 horas entre manos.' }]);
    } catch {
      setChatHistory(prev => [...prev, { role: 'assistant', text: 'Recomendación Pintuco: Aplique imprimante fijador Sellomax®, 2 manos de acabado respetando 3 horas de secado. Resiste hasta 2,000 ciclos de lavado.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    if (onApplyRecommendation) {
      onApplyRecommendation(result, selectedColor);
    }
    onClose();
  };

  if (!isOpen) return null;

  // Determine representative image for BEFORE
  const beforeImage = (evidence.photos && evidence.photos.length > 0)
    ? evidence.photos[0]
    : technical.surface.includes('metal')
    ? 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
    : technical.environment.includes('exterior')
    ? 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=800&q=80'
    : technical.condition.includes('humedad')
    ? 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80'
    : 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-white w-full max-w-5xl xl:max-w-6xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in zoom-in-95 duration-200"
      >
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-indigo-950 via-[#2E3192] to-blue-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-indigo-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Sparkles className="w-6 h-6 text-indigo-950 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Asistente Técnico IA • PINTUCO®
                </h3>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-400 text-indigo-950 uppercase tracking-wider shadow-xs flex items-center gap-1">
                  ⚡ Groq AI (Llama & Qwen)
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  Simulador de Acabado Final
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Diagnóstico patológico con evidencias fotográficas y proyección de acabado con materiales Pintuco®
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            id="btn-close-ai-modal"
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-rose-600/90 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ml-2 shadow-xs active:scale-98"
          >
            <X className="w-4 h-4" />
            <span>Cerrar</span>
          </button>
        </div>

        {/* ENHANCED CONTEXT & TECHNICAL PARAMETERS PANEL */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Field Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1">
              {/* Field 1: Superficie */}
              <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Superficie / Sustrato
                </span>
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs truncate">
                  <span className="text-sm">🧱</span>
                  <span className="capitalize truncate">{technical.surface.replace(/_/g, ' ')}</span>
                </div>
              </div>

              {/* Field 2: Entorno */}
              <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Entorno / Exposición
                </span>
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs truncate">
                  <span className="text-sm">🌦️</span>
                  <span className="capitalize truncate">{technical.environment.replace(/_/g, ' ')}</span>
                </div>
              </div>

              {/* Field 3: Condición / Patología */}
              <div className="bg-amber-50/70 px-3 py-2 rounded-xl border border-amber-200 shadow-2xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 block mb-0.5">
                  Patología Detectada
                </span>
                <div className="flex items-center gap-1.5 font-black text-amber-900 text-xs truncate">
                  <span className="text-sm">⚠️</span>
                  <span className="capitalize truncate">{technical.condition.replace(/_/g, ' ')}</span>
                </div>
              </div>

              {/* Field 4: Área */}
              <div className="bg-blue-50/70 px-3 py-2 rounded-xl border border-blue-200 shadow-2xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 block mb-0.5">
                  Área Proyectada
                </span>
                <div className="flex items-center gap-1.5 font-black text-blue-900 text-xs">
                  <span className="text-sm">📐</span>
                  <span>{project.areaM2 || 100} m²</span>
                </div>
              </div>
            </div>

            {/* Field 5: Color Seleccionado */}
            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between sm:justify-start gap-3 shrink-0">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Tono Pintuco® Formulado
                </span>
                <div className="flex items-center gap-2">
                  <span 
                    className="w-5 h-5 rounded-full border-2 border-slate-300 shadow-sm shrink-0" 
                    style={{ backgroundColor: selectedColor.hex }} 
                  />
                  <span className="font-black text-slate-900 text-xs sm:text-sm">{selectedColor.name}</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-semibold">
                    {selectedColor.hex}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODERN SEGMENTED NAVIGATION TABS */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 sm:px-6 py-2.5">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('simulacion')}
              className={`py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shrink-0 shadow-2xs ${
                activeTab === 'simulacion'
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20'
                  : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${activeTab === 'simulacion' ? 'text-amber-300' : 'text-amber-500'}`} />
              <span>Simulación Visual (Antes vs. Después)</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                activeTab === 'simulacion' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
              }`}>
                Visual
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('diagnostico')}
              className={`py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shrink-0 shadow-2xs ${
                activeTab === 'diagnostico'
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20'
                  : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${activeTab === 'diagnostico' ? 'text-indigo-200' : 'text-blue-600'}`} />
              <span>Diagnóstico Patológico</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('materiales')}
              className={`py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shrink-0 shadow-2xs ${
                activeTab === 'materiales'
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20'
                  : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Package className={`w-4 h-4 ${activeTab === 'materiales' ? 'text-emerald-200' : 'text-emerald-600'}`} />
              <span>Materiales a Vender & Capas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shrink-0 shadow-2xs ${
                activeTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20'
                  : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <MessageSquare className={`w-4 h-4 ${activeTab === 'chat' ? 'text-purple-200' : 'text-purple-600'}`} />
              <span>Consultas Técnicas IA</span>
              {chatHistory.length > 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                  activeTab === 'chat' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                }`}>
                  {chatHistory.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-slate-800 space-y-5">
          
          {/* LOADING STATE */}
          {loading && (
            <div className="p-10 text-center space-y-4 bg-indigo-50/60 rounded-2xl border border-indigo-100">
              <div className="relative w-12 h-12 mx-auto">
                <RefreshCw className="w-12 h-12 animate-spin text-indigo-600" />
                <Sparkles className="w-5 h-5 text-amber-500 absolute top-3 left-3 animate-ping" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-extrabold text-indigo-950">
                  Analizando Evidencias Fotográficas & Generando Simulación...
                </h4>
                <p className="text-xs text-indigo-700 max-w-md mx-auto mt-1">
                  El motor Groq AI está diagnosticando el sustrato ({technical.surface.replace(/_/g, ' ')}), tratando la patología ({technical.condition.replace(/_/g, ' ')}) y formulando el acabado con {selectedColor.name}.
                </p>
              </div>
            </div>
          )}

          {!loading && result && (
            <>
              {/* TAB 1: SIMULACIÓN VISUAL ANTES VS DESPUÉS */}
              {activeTab === 'simulacion' && (
                <div className="space-y-5">
                  
                  {/* Mode & Color Switcher Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">Modo de Visualización:</span>
                      <div className="flex bg-white rounded-lg p-0.5 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setViewMode('slider')}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                            viewMode === 'slider'
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Sliders className="w-3 h-3 inline mr-1" />
                          Deslizador Interactivo
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('side_by_side')}
                          className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                            viewMode === 'side_by_side'
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Eye className="w-3 h-3 inline mr-1" />
                          Lado a Lado
                        </button>
                      </div>
                    </div>

                    {/* Color Swatches */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        <Palette className="w-3 h-3 text-indigo-600" />
                        Probar Color Pintuco:
                      </span>
                      {PINTUCO_PALETTE.map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleColorChange(c)}
                          title={`${c.name} (${c.hex})`}
                          className={`w-6 h-6 rounded-md border-2 transition-transform cursor-pointer relative ${
                            selectedColor.name === c.name
                              ? 'border-indigo-600 scale-110 shadow-xs ring-2 ring-indigo-200'
                              : 'border-slate-300 hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.hex }}
                        >
                          {selectedColor.name === c.name && (
                            <Check className="w-3 h-3 text-indigo-950 absolute inset-0 m-auto drop-shadow-xs" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* VISUAL SIMULATOR CONTAINER */}
                  {viewMode === 'slider' ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-md bg-slate-900 h-72 sm:h-96 select-none group">
                      
                      {/* AFTER (Finished Transformation with Pintuco Paint) */}
                      <div className="absolute inset-0 w-full h-full">
                        <div 
                          className="w-full h-full relative"
                          style={{
                            backgroundColor: selectedColor.hex,
                            backgroundImage: `radial-gradient(circle at 50% 30%, rgba(255,255,255,0.25) 0%, rgba(0,0,0,0.15) 100%)`
                          }}
                        >
                          {/* Realistic architectural finish texture overlay */}
                          <div 
                            className="absolute inset-0 opacity-40 mix-blend-multiply bg-cover bg-center"
                            style={{
                              backgroundImage: `url('https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80')`
                            }}
                          />

                          {/* Subtle wall sheen effect */}
                          <div 
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 60%, rgba(0,0,0,0.08) 100%)'
                            }}
                          />

                          {/* After Labels & Guarantee Badge */}
                          <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5 z-10">
                            <span className="px-3 py-1 bg-emerald-600/90 backdrop-blur-xs text-white text-xs font-black rounded-lg shadow-md border border-emerald-400/40 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              RESULTADO FINALIZADO • PINTUCO®
                            </span>
                            <span className="px-2.5 py-0.5 bg-slate-900/80 backdrop-blur-xs text-amber-300 text-[10px] font-bold rounded-md border border-amber-400/30">
                              🛡️ {result.simulacionAcabado?.durabilidadGarantizada || 'Garantía Certificada 5 Años'}
                            </span>
                            <span className="px-2.5 py-0.5 bg-white/90 text-slate-900 text-[10px] font-extrabold rounded-md shadow-xs">
                              🎨 {selectedColor.name}
                            </span>
                          </div>

                          {/* Water droplets / hydrophobic callout */}
                          <div className="absolute bottom-4 right-4 bg-slate-900/85 backdrop-blur-xs text-white p-2.5 rounded-xl border border-white/10 text-xs max-w-xs space-y-1 z-10 shadow-lg">
                            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                              <Droplets className="w-3.5 h-3.5" />
                              <span>Tecnología Perleo Hidrorrepelente</span>
                            </div>
                            <p className="text-[10px] text-slate-300 leading-tight">
                              Película continua de 3.5 mils DFT que sella 100% de microfisuras y repele agua de lluvia.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* BEFORE (Damaged / Initial State) with clipPath based on slider */}
                      <div 
                        className="absolute inset-0 h-full overflow-hidden"
                        style={{ width: `${sliderPosition}%` }}
                      >
                        <div 
                          className="relative h-full"
                          style={{ width: `calc(100vw - 32px)`, maxWidth: '1152px' }}
                        >
                          <img 
                            src={beforeImage} 
                            alt="Estado Inicial de la Obra" 
                            className="w-full h-full object-cover filter contrast-110 saturate-90"
                          />
                          
                          {/* Before Labels & Detected Pathologies */}
                          <div className="absolute top-4 left-4 flex flex-col items-start gap-1.5 z-10">
                            <span className="px-3 py-1 bg-rose-700/90 backdrop-blur-xs text-white text-xs font-black rounded-lg shadow-md border border-rose-400/40 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                              ESTADO INICIAL (ANTES)
                            </span>
                            <span className="px-2 py-0.5 bg-slate-950/80 text-rose-300 text-[10px] font-bold rounded-md border border-rose-500/40">
                              ⚠️ Patología: {technical.condition.replace(/_/g, ' ')}
                            </span>
                          </div>

                          <div className="absolute bottom-4 left-4 bg-slate-950/85 backdrop-blur-xs text-rose-200 p-2.5 rounded-xl border border-rose-500/30 text-xs max-w-xs space-y-0.5 z-10 shadow-lg">
                            <span className="font-bold text-white text-[11px] block">Evidencia del Sustrato:</span>
                            <p className="text-[10px] text-slate-300 leading-tight">
                              Presencia de porosidad, alcalinidad libre y desgaste que requieren imprimación técnica previa.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Drag Slider Line */}
                      <div 
                        className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(0,0,0,0.8)] cursor-ew-resize z-20 flex items-center justify-center"
                        style={{ left: `${sliderPosition}%` }}
                      >
                        <div className="w-8 h-8 rounded-full bg-white text-slate-900 shadow-xl border-2 border-indigo-600 flex items-center justify-center text-xs font-black cursor-grab active:cursor-grabbing hover:scale-110 transition-transform">
                          ↔
                        </div>
                      </div>

                      {/* Native range input overlay for seamless drag / touch */}
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        value={sliderPosition}
                        onChange={(e) => setSliderPosition(Number(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                      />
                    </div>
                  ) : (
                    /* SIDE-BY-SIDE VIEW */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Before Card */}
                      <div className="rounded-2xl overflow-hidden border border-rose-200 bg-rose-50/40 shadow-xs flex flex-col">
                        <div className="bg-rose-700 text-white p-3 flex items-center justify-between">
                          <span className="text-xs font-black flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                            ESTADO INICIAL (ANTES)
                          </span>
                          <span className="text-[10px] bg-rose-900/60 px-2 py-0.5 rounded font-semibold">
                            {technical.condition.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="h-48 relative overflow-hidden bg-slate-900">
                          <img 
                            src={beforeImage} 
                            alt="Antes" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="p-3 text-xs space-y-1 bg-white flex-1">
                          <span className="font-bold text-slate-800 text-[11px] block">Patología Detectada:</span>
                          <p className="text-slate-600 text-[11px] leading-relaxed">
                            {result.diagnostico}
                          </p>
                        </div>
                      </div>

                      {/* After Card */}
                      <div className="rounded-2xl overflow-hidden border border-emerald-200 bg-emerald-50/40 shadow-xs flex flex-col">
                        <div className="bg-emerald-700 text-white p-3 flex items-center justify-between">
                          <span className="text-xs font-black flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            ACABADO FINALIZADO (DESPUÉS)
                          </span>
                          <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded font-semibold">
                            {selectedColor.name}
                          </span>
                        </div>
                        <div 
                          className="h-48 relative overflow-hidden flex items-center justify-center p-4"
                          style={{ backgroundColor: selectedColor.hex }}
                        >
                          <div 
                            className="absolute inset-0 opacity-40 mix-blend-multiply bg-cover bg-center"
                            style={{
                              backgroundImage: `url('https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80')`
                            }}
                          />
                          <div className="relative z-10 bg-white/95 backdrop-blur-xs p-3 rounded-xl shadow-lg border border-slate-200 text-center max-w-xs">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                              Protegido con Pintuco®
                            </span>
                            <h5 className="text-xs font-black text-slate-900 mt-0.5">
                              {result.recomendacionPintuco}
                            </h5>
                            <span className="text-[10px] text-slate-600 block mt-1">
                              Tono: <strong>{selectedColor.name}</strong> • 2 manos
                            </span>
                          </div>
                        </div>
                        <div className="p-3 text-xs space-y-1 bg-white flex-1">
                          <span className="font-bold text-emerald-950 text-[11px] block">Transformación Garantizada:</span>
                          <p className="text-slate-600 text-[11px] leading-relaxed">
                            {result.simulacionAcabado?.descripcionResultado}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SIMULATION DESCRIPTIVE SUMMARY */}
                  {result.simulacionAcabado && (
                    <div className="bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/60 p-4 sm:p-5 rounded-2xl border border-indigo-100 space-y-3">
                      <div className="flex items-center gap-2 text-indigo-950">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <h4 className="font-extrabold text-sm sm:text-base">
                          {result.simulacionAcabado.titulo}
                        </h4>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                        {result.simulacionAcabado.descripcionResultado}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            ✨ Textura & Película:
                          </span>
                          <p className="text-slate-800 font-semibold text-[11px]">
                            {result.simulacionAcabado.texturaVisual}
                          </p>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            💡 Nivel de Brillo:
                          </span>
                          <p className="text-slate-800 font-semibold text-[11px]">
                            {result.simulacionAcabado.nivelBrillo}
                          </p>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            🛡️ Durabilidad & Garantía:
                          </span>
                          <p className="text-emerald-800 font-bold text-[11px]">
                            {result.simulacionAcabado.durabilidadGarantizada}
                          </p>
                        </div>
                      </div>

                      {/* Transformed Aspects */}
                      {result.simulacionAcabado.aspectosTransformados && (
                        <div className="pt-2">
                          <span className="text-xs font-bold text-slate-800 block mb-1.5">
                            Beneficios Clave de la Transformación:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {result.simulacionAcabado.aspectosTransformados.map((asp, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs bg-white p-2 rounded-lg border border-slate-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="text-slate-700 font-medium text-[11px]">{asp}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

              {/* TAB 2: DIAGNÓSTICO PATOLÓGICO */}
              {activeTab === 'diagnostico' && (
                <div className="space-y-4">
                  {/* Diagnosis Causa Raiz */}
                  <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50/50 rounded-2xl border border-indigo-200 space-y-2">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>Diagnóstico de Patología & Causa Raíz</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                      {result.diagnostico}
                    </p>
                  </div>

                  {/* Primary & Primer Recommendation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        1. Acabado Principal Pintuco®
                      </span>
                      <h4 className="text-sm font-black text-emerald-950">
                        {result.recomendacionPintuco}
                      </h4>
                      <p className="text-[11px] text-emerald-800">
                        2 manos uniformes para película continua y color {selectedColor.name}.
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                        2. Imprimante & Sellador Técnico
                      </span>
                      <h4 className="text-sm font-black text-blue-950">
                        {result.imprimanteRecomendado || 'Sellomax® 7 en 1 Imprimante Fijador'}
                      </h4>
                      <p className="text-[11px] text-blue-800">
                        Neutraliza alcalinidad y sella microporos para evitar sobreconsumo.
                      </p>
                    </div>
                  </div>

                  {/* Key Steps */}
                  {result.pasosClave && result.pasosClave.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                        Pasos de Preparación y Aplicación:
                      </h4>
                      <div className="space-y-1.5">
                        {result.pasosClave.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                              {idx + 1}
                            </span>
                            <span className="text-slate-800 leading-tight font-medium">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mitigated Risks & Sustainability */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {result.riesgosMitigados && (
                      <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                        <span className="font-bold text-amber-900 block mb-1.5 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-amber-700" />
                          Riesgos Prevenidos con Pintuco:
                        </span>
                        <ul className="list-disc list-inside text-amber-800 space-y-1 text-[11px]">
                          {result.riesgosMitigados.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.selloSostenibilidad && (
                      <div className="p-3.5 bg-teal-50 rounded-xl border border-teal-200 text-xs flex flex-col justify-between">
                        <div>
                          <span className="font-bold text-teal-900 block mb-1.5 flex items-center gap-1.5">
                            <Leaf className="w-3.5 h-3.5 text-teal-700" />
                            Sostenibilidad & Bajo VOC:
                          </span>
                          <p className="text-teal-800 text-[11px] leading-relaxed">
                            {result.selloSostenibilidad}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: MATERIALES A VENDER & SISTEMA DE CAPAS */}
              {activeTab === 'materiales' && (
                <div className="space-y-5">
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-emerald-600" />
                      Materiales Exactos a Cotizar y Vender al Cliente ({project.areaM2 || 100} m²):
                    </h4>

                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                          <tr>
                            <th className="p-3">Producto Comercial Pintuco®</th>
                            <th className="p-3">Presentación</th>
                            <th className="p-3">Cantidad Estimada</th>
                            <th className="p-3">Rol Técnico</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {result.materialesVenta && result.materialesVenta.length > 0 ? (
                            result.materialesVenta.map((mat, i) => (
                              <tr key={i} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 font-bold text-slate-900">{mat.producto}</td>
                                <td className="p-3 text-slate-600">{mat.presentacion}</td>
                                <td className="p-3 font-semibold text-indigo-700">{mat.cantidadEstimada}</td>
                                <td className="p-3 text-slate-600">{mat.rol}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td className="p-3 font-bold text-slate-900">{result.recomendacionPintuco}</td>
                              <td className="p-3 text-slate-600">Cuñetes / Galones</td>
                              <td className="p-3 font-semibold text-indigo-700">{Math.ceil((project.areaM2 * 2) / 35)} Galones</td>
                              <td className="p-3 text-slate-600">Acabado y Protección Principal</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Sistema de Capas Multicapa */}
                  {result.sistemaCapas && result.sistemaCapas.length > 0 && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        Esquema del Sistema Multicapa Pintuco®:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {result.sistemaCapas.map((capa, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 flex items-start gap-2.5 text-xs shadow-2xs">
                            <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-800 font-black flex items-center justify-center shrink-0 text-xs border border-indigo-200">
                              {idx + 1}
                            </span>
                            <span className="text-slate-700 leading-tight">{capa}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CONSULTAS TÉCNICAS IA (CHAT) */}
              {activeTab === 'chat' && (
                <div className="space-y-4">
                  <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 text-xs text-indigo-950 flex items-center gap-2">
                    <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Pregunta directamente al Asistente IA sobre dilución, rendimientos, tiempos de curado o preparación de la superficie.</span>
                  </div>

                  {/* Chat message thread */}
                  <div className="space-y-2.5 max-h-60 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    {chatHistory.length === 0 && (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        No hay preguntas previas. Haz una consulta o presiona una sugerencia abajo.
                      </div>
                    )}
                    {chatHistory.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl max-w-[85%] ${
                          msg.role === 'user'
                            ? 'bg-indigo-600 text-white ml-auto text-right'
                            : 'bg-white text-slate-800 mr-auto border border-slate-200 whitespace-pre-line shadow-2xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="text-slate-500 text-xs flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 w-fit">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        <span>Generando respuesta técnica con fichas Pintuco...</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Starter Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      '¿Cuál es la dilución exacta con agua?',
                      '¿Cuánto tiempo debo esperar entre la 1ra y 2da mano?',
                      '¿Cómo tratar el salitre antes de pintar?',
                      '¿Qué garantía certificada tiene este producto?'
                    ].map((q, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setAiQuestion(q)}
                        className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-800 px-2.5 py-1 rounded-full text-slate-700 border border-slate-200 font-medium transition-colors cursor-pointer"
                      >
                        + {q}
                      </button>
                    ))}
                  </div>

                  {/* Chat Input Form */}
                  <form onSubmit={handleSendChat} className="flex gap-2">
                    <input
                      type="text"
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      placeholder="Escribe tu consulta técnica aquí..."
                      className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!aiQuestion.trim() || chatLoading}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Preguntar</span>
                    </button>
                  </form>
                </div>
              )}
            </>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => fetchDiagnosis()}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reanalizar</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={!result}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar Diagnóstico y Materiales al Formulario</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
