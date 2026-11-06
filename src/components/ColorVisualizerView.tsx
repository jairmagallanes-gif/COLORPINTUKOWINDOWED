import React, { useState } from 'react';
import { 
  Eye, 
  Sparkles, 
  Palette, 
  Sliders, 
  Download, 
  RefreshCw, 
  Layers, 
  Maximize2, 
  Share2, 
  Info,
  ChevronRight,
  Sun,
  Moon,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { PINTUCO_PALETTE, PintucoColor } from '../data/pintucoCatalog';

interface ColorVisualizerProps {
  onClose?: () => void;
  isModal?: boolean;
}

interface ScenePreset {
  id: string;
  name: string;
  category: 'exterior' | 'interior' | 'comercial' | 'industrial';
  description: string;
  defaultWallColorHex: string;
  defaultSecondaryHex: string;
  recommendedLine: string;
  svgTemplate: string;
  accentAreaM2: number;
}

const SCENE_PRESETS: ScenePreset[] = [
  {
    id: 'fachada_moderna',
    name: 'Fachada Residencial Contemporánea',
    category: 'exterior',
    description: 'Muros principales exteriores expuestos a alta radiación solar y lluvias constantes.',
    defaultWallColorHex: '#E2E8F0',
    defaultSecondaryHex: '#1E293B',
    recommendedLine: 'Koraza® Máxima Protección Sol & Lluvia',
    svgTemplate: 'facade',
    accentAreaM2: 140
  },
];

const FINISH_EFFECTS = [
  { id: 'mate', name: 'Mate Elegante', description: 'Cero reflejo, disimula imperfecciones.', opacity: '0.94', filter: 'none' },
  { id: 'satinado', name: 'Satinado Sedoso', description: 'Brillo sutil y alta facilidad de limpieza.', opacity: '0.88', filter: 'brightness(1.05) contrast(1.02)' },
  { id: 'semibrillante', name: 'Semibrillante', description: 'Ideal para zonas húmedas y alto tráfico.', opacity: '0.82', filter: 'brightness(1.10) contrast(1.05)' },
  { id: 'brillante', name: 'Brillo Máximo', description: 'Acabado esmaltado de alta reflexión.', opacity: '0.78', filter: 'brightness(1.16) contrast(1.08)' }
];

const DEFAULT_FACADE_MASKS = [
  // Local, image-specific mask for the large white facade plane.
  // The recessed charcoal wall, concrete base, door, sky, and ground stay outside it.
  [[135, 208], [702, 208], [702, 679], [417, 679], [417, 812], [135, 812]],
  [[0, 208], [96, 208], [96, 812], [0, 812]]
];

const FACADE_SCENE = SCENE_PRESETS[0];

export const ColorVisualizerView: React.FC<ColorVisualizerProps> = ({
  onClose,
  isModal = false
}) => {
  const [selectedScene] = useState<ScenePreset>(FACADE_SCENE);
  const [primaryColor, setPrimaryColor] = useState<PintucoColor>(PINTUCO_PALETTE[0]);
  const [secondaryColor, setSecondaryColor] = useState<PintucoColor>(PINTUCO_PALETTE[3] || PINTUCO_PALETTE[0]);
  const [selectedFinish, setSelectedFinish] = useState<string>('mate');
  const [lightingMode, setLightingMode] = useState<'dia_natural' | 'atardecer_calido' | 'noche_led'>('dia_natural');
  const [splitSliderPos, setSplitSliderPos] = useState<number>(50);
  const [isComparingOriginal, setIsComparingOriginal] = useState<boolean>(false);
  const [colorFamilyFilter, setColorFamilyFilter] = useState<string>('all');
  const [customHex, setCustomHex] = useState<string>('#2E3192');
  const wallMasks = DEFAULT_FACADE_MASKS;
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const isPhotoScene = true;

  const filteredPalette = PINTUCO_PALETTE.filter(c => {
    if (colorFamilyFilter === 'all') return true;
    return c.family === colorFamilyFilter;
  });

  const uniqueFamilies = Array.from(new Set(PINTUCO_PALETTE.map(c => c.family)));

  const handleSelectColor = (color: PintucoColor) => {
    setPrimaryColor(color);
  };

  const handleApplyCustomHex = (e: React.FormEvent) => {
    e.preventDefault();
    const customCol: PintucoColor = {
      code: `ESP-${customHex.replace('#', '').toUpperCase()}`,
      name: `Tono Especial Pintuco (${customHex})`,
      hex: customHex,
      family: 'Personalizado'
    };
    handleSelectColor(customCol);
  };

  const currentFinishObj = FINISH_EFFECTS.find(f => f.id === selectedFinish) || FINISH_EFFECTS[0];

  // Estimated gallons for accent area
  const estimatedGallons = Math.ceil((selectedScene.accentAreaM2 * 2) / 38);

  const handleExportSummary = () => {
    const summaryText = `🎨 FICHA TÉCNICA DE COLOR & PROYECCIÓN - COLORLINK PINTUCO®
-----------------------------------------------------------
• Escenario / Superficie: ${selectedScene.name} (${selectedScene.category.toUpperCase()})
• Color Primario: ${primaryColor.name} [HEX: ${primaryColor.hex}] (Código: ${primaryColor.code})
• Color Secundario / Acento: ${secondaryColor.name} [HEX: ${secondaryColor.hex}] (Código: ${secondaryColor.code})
• Acabado y Brillo: ${currentFinishObj.name} - ${currentFinishObj.description}
• Línea Recomendada Pintuco: ${selectedScene.recommendedLine}
• Área Estimada: ${selectedScene.accentAreaM2} m²
• Rendimiento Calculado: ~${estimatedGallons} Galones (${Math.ceil(estimatedGallons / 5)} Cuñetes aprox.)
• Fecha de Proyección: ${new Date().toLocaleDateString('es-CO')}
-----------------------------------------------------------
Ecosistema Inteligente Pintuco® • Transformación Digital UCC`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(summaryText).catch(() => {});
    }
    setCopiedNotification('¡Ficha de Color y Render copiada al portapapeles con éxito!');
    setTimeout(() => setCopiedNotification(null), 4000);
  };

  return (
    <div className={`space-y-6 ${isModal ? 'p-6' : 'pb-12 animate-in fade-in duration-300'}`}>
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Innovación Pintuco® • Simulador & Visualizador de Espacios en Tiempo Real
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Visualizador Interactivo de Color & Acabados Arquitectónicos
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl">
            Proyecta cómo lucirán los tonos oficiales de la carta Pintuco en fachadas, interiores y bodegas antes de comprar. Aplica texturas, simula iluminación diurna/nocturna y compara el antes vs. después.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>

      {copiedNotification && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
        
        {/* LEFT / CENTER: Interactive Canvas & Scene Viewer (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <Eye className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-extrabold text-slate-900">Fachada Residencial Contemporánea</span>
          </div>

          {/* VISUALIZER CANVAS STAGE */}
          <div className="flex items-center justify-center">
          <div className="relative aspect-[6/7] w-full max-w-[480px] lg:h-[min(54vh,560px)] lg:w-[min(46.28vh,480px)] lg:max-w-full lg:aspect-[6/7] rounded-2xl overflow-hidden shadow-lg border-2 border-slate-300 bg-slate-950 select-none">
            
            {/* Lighting Overlay Tint */}
            <div className={`absolute inset-0 z-20 pointer-events-none transition-all duration-500 ${
              lightingMode === 'atardecer_calido' 
                ? 'bg-amber-500/15 mix-blend-color-burn' 
                : lightingMode === 'noche_led' 
                ? 'bg-blue-900/25 mix-blend-multiply' 
                : 'bg-transparent'
            }`} />

            {true ? (
              <div className="relative h-full w-full overflow-hidden bg-slate-200">
                <img src="/colorlink-fachada-ar.jpg" alt="Fachada residencial para simulación de color" className="h-full w-full object-cover" />
                {!isComparingOriginal && <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
                  {wallMasks.map((mask, index) => <polygon key={index} points={mask.map((point) => point.join(',')).join(' ')} fill={primaryColor.hex} fillOpacity={Number(currentFinishObj.opacity) * 0.82} style={{ mixBlendMode: 'color', filter: currentFinishObj.filter }} />)}
                </svg>}
                <div className="absolute bottom-4 left-4 z-30 rounded-full border border-white/20 bg-slate-950/80 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
                  {isComparingOriginal ? 'Fachada original' : `Color sobre pared • ${primaryColor.name}`}
                </div>
              </div>
            ) : (
              /* Vector High-Fidelity SVG Scene Simulation */
              <div className="relative w-full h-full">
                
                {/* Facade Scene */}
                {selectedScene.svgTemplate === 'facade' && (
                  <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
                    {/* Sky Background */}
                    <rect width="800" height="600" fill={lightingMode === 'atardecer_calido' ? '#fde68a' : lightingMode === 'noche_led' ? '#0f172a' : '#93c5fd'} />
                    <circle cx="680" cy="100" r="50" fill={lightingMode === 'atardecer_calido' ? '#f59e0b' : lightingMode === 'noche_led' ? '#f8fafc' : '#fef08a'} opacity="0.85" />
                    
                    {/* Ground / Grass */}
                    <rect y="480" width="800" height="120" fill="#15803d" />
                    <path d="M 0 520 L 800 520 L 800 600 L 0 600 Z" fill="#166534" />
                    
                    {/* Main Building Wall (PRIMARY TARGET COLOR) */}
                    <rect 
                      x="140" 
                      y="160" 
                      width="380" 
                      height="320" 
                      fill={isComparingOriginal ? selectedScene.defaultWallColorHex : primaryColor.hex}
                      style={{ filter: currentFinishObj.filter, transition: 'fill 0.4s ease' }}
                    />
                    
                    {/* Upper Balcony Wall / Secondary Volume (SECONDARY TARGET COLOR) */}
                    <rect 
                      x="460" 
                      y="120" 
                      width="200" 
                      height="360" 
                      fill={isComparingOriginal ? selectedScene.defaultSecondaryHex : secondaryColor.hex}
                      style={{ filter: currentFinishObj.filter, transition: 'fill 0.4s ease' }}
                    />

                    {/* Architectural Columns & Beams */}
                    <rect x="120" y="140" width="420" height="25" fill="#0f172a" opacity="0.9" />
                    <rect x="120" y="140" width="20" height="340" fill="#0f172a" opacity="0.9" />
                    <rect x="640" y="100" width="25" height="380" fill="#0f172a" opacity="0.9" />

                    {/* Windows & Glass with Reflections */}
                    <rect x="180" y="210" width="160" height="110" fill="#0284c7" opacity="0.5" stroke="#0f172a" strokeWidth="4" />
                    <line x1="260" y1="210" x2="260" y2="320" stroke="#0f172a" strokeWidth="4" />
                    <line x1="180" y1="265" x2="340" y2="265" stroke="#0f172a" strokeWidth="4" />

                    <rect x="490" y="160" width="130" height="180" fill="#0369a1" opacity="0.6" stroke="#0f172a" strokeWidth="4" />

                    {/* Entrance Door */}
                    <rect x="230" y="360" width="70" height="120" fill="#78350f" stroke="#0f172a" strokeWidth="3" />
                    <circle cx="288" cy="425" r="4" fill="#fbbf24" />

                    {/* Pavement & Pathway */}
                    <polygon points="210,480 320,480 380,600 150,600" fill="#64748b" />
                  </svg>
                )}

                {/* Living Room Scene */}
                {selectedScene.svgTemplate === 'living' && (
                  <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
                    {/* Ceiling */}
                    <polygon points="0,0 800,0 720,80 80,80" fill="#f8fafc" />
                    
                    {/* Left Wall (SECONDARY TARGET) */}
                    <polygon 
                      points="0,0 80,80 80,500 0,600" 
                      fill={isComparingOriginal ? selectedScene.defaultSecondaryHex : secondaryColor.hex}
                      style={{ filter: currentFinishObj.filter, transition: 'fill 0.4s ease' }}
                    />

                    {/* Main Back Wall (PRIMARY TARGET COLOR) */}
                    <rect 
                      x="80" 
                      y="80" 
                      width="640" 
                      height="420" 
                      fill={isComparingOriginal ? selectedScene.defaultWallColorHex : primaryColor.hex}
                      style={{ filter: currentFinishObj.filter, transition: 'fill 0.4s ease' }}
                    />

                    {/* Right Wall with Window */}
                    <polygon 
                      points="800,0 720,80 720,500 800,600" 
                      fill="#e2e8f0" 
                    />

                    {/* Hardwood Parquet Floor */}
                    <polygon points="80,500 720,500 800,600 0,600" fill="#b45309" opacity="0.85" />

                    {/* Designer Sofa */}
                    <rect x="220" y="340" width="360" height="120" rx="20" fill="#1e293b" />
                    <rect x="250" y="310" width="300" height="70" rx="14" fill="#334155" />
                    <rect x="270" y="350" width="120" height="30" rx="6" fill="#f59e0b" opacity="0.9" />

                    {/* Minimalist Art Frame */}
                    <rect x="320" y="130" width="160" height="130" fill="#ffffff" stroke="#0f172a" strokeWidth="6" />
                    <circle cx="400" cy="195" r="40" fill={secondaryColor.hex} opacity="0.8" />

                    {/* Floor Plant & Pot */}
                    <rect x="120" y="380" width="50" height="70" rx="6" fill="#475569" />
                    <circle cx="145" cy="340" r="45" fill="#15803d" opacity="0.9" />
                  </svg>
                )}

                {/* Office Scene */}
                {selectedScene.svgTemplate === 'office' && (
                  <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
                    {/* Main Corporate Wall (PRIMARY) */}
                    <rect 
                      x="0" 
                      y="0" 
                      width="800" 
                      height="460" 
                      fill={isComparingOriginal ? selectedScene.defaultWallColorHex : primaryColor.hex}
                      style={{ filter: currentFinishObj.filter, transition: 'fill 0.4s ease' }}
                    />

                    {/* Accent Feature Column (SECONDARY) */}
                    <rect 
                      x="100" 
                      y="0" 
                      width="180" 
                      height="460" 
                      fill={isComparingOriginal ? selectedScene.defaultSecondaryHex : secondaryColor.hex}
                      style={{ filter: currentFinishObj.filter, transition: 'fill 0.4s ease' }}
                    />

                    {/* Modern Executive Desk & Monitors */}
                    <polygon points="0,460 800,460 800,600 0,600" fill="#334155" />
                    <polygon points="200,440 600,440 660,540 140,540" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
                    
                    {/* Dual Monitors */}
                    <rect x="300" y="350" width="100" height="70" rx="4" fill="#0f172a" />
                    <rect x="410" y="350" width="100" height="70" rx="4" fill="#0f172a" />
                    
                    {/* Corporate Logo Plaque */}
                    <rect x="440" y="120" width="220" height="80" rx="10" fill="#ffffff" opacity="0.9" stroke="#cbd5e1" strokeWidth="2" />
                    <text x="470" y="168" fontFamily="sans-serif" fontSize="22" fontWeight="900" fill="#1e216b">COLORLINK</text>
                  </svg>
                )}

                {/* Industrial Warehouse Scene */}
                {selectedScene.svgTemplate === 'industrial' && (
                  <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
                    {/* Warehouse Upper Wall (PRIMARY) */}
                    <rect 
                      x="0" 
                      y="0" 
                      width="800" 
                      height="380" 
                      fill={isComparingOriginal ? selectedScene.defaultWallColorHex : primaryColor.hex}
                      style={{ filter: currentFinishObj.filter, transition: 'fill 0.4s ease' }}
                    />

                    {/* Industrial Epoxy Floor (SECONDARY TARGET) */}
                    <polygon 
                      points="0,380 800,380 800,600 0,600" 
                      fill={isComparingOriginal ? selectedScene.defaultSecondaryHex : secondaryColor.hex}
                      style={{ filter: currentFinishObj.filter, transition: 'fill 0.4s ease' }}
                    />

                    {/* Safety Yellow Demarcation Lines */}
                    <line x1="50" y1="480" x2="750" y2="480" stroke="#facc15" strokeWidth="8" strokeDasharray="20,15" />

                    {/* Storage Rack Structures */}
                    <rect x="80" y="100" width="160" height="280" fill="#0284c7" opacity="0.8" />
                    <rect x="560" y="100" width="160" height="280" fill="#ea580c" opacity="0.8" />

                    {/* Pintuco Industrial Drums */}
                    <rect x="360" y="320" width="40" height="60" rx="4" fill="#2563eb" />
                    <rect x="410" y="320" width="40" height="60" rx="4" fill="#2563eb" />
                  </svg>
                )}

              </div>
            )}

            {/* Stage HUD Badges */}
            <div className="absolute top-3 left-3 z-30 flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-slate-950/80 text-white font-mono text-[11px] font-bold backdrop-blur-xs border border-white/20 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor.hex }}></span>
                <span>Pared Principal: {primaryColor.name}</span>
              </span>

            </div>

            {/* Bottom HUD: Finish and Lighting Mode Switcher */}
            <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLightingMode(lightingMode === 'dia_natural' ? 'atardecer_calido' : lightingMode === 'atardecer_calido' ? 'noche_led' : 'dia_natural')}
                className="px-3 py-1.5 rounded-xl bg-slate-900/85 hover:bg-slate-900 text-white text-xs font-bold backdrop-blur-xs border border-white/20 flex items-center gap-1.5 cursor-pointer shadow-md"
                title="Cambiar iluminación ambiental"
              >
                {lightingMode === 'dia_natural' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Luz Diurna</span>
                  </>
                ) : lightingMode === 'atardecer_calido' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-orange-400" />
                    <span>Atardecer Cálido</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-blue-400" />
                    <span>Luz Noche LED</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onMouseDown={() => setIsComparingOriginal(true)}
                onMouseUp={() => setIsComparingOriginal(false)}
                onTouchStart={() => setIsComparingOriginal(true)}
                onTouchEnd={() => setIsComparingOriginal(false)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black backdrop-blur-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                title="Mantén presionado para ver el color original"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isComparingOriginal ? 'Viendo Original...' : 'Mantén: Comparar'}</span>
              </button>
            </div>

          </div>
          </div>

          {isPhotoScene && <p className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-[11px] text-indigo-900">La selección aplica el color únicamente a los paños blancos; el muro gris y el suelo quedan intactos.</p>}

          {/* Quick Technical Specs of the Scene */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Línea Recomendada Pintuco:</span>
              <strong className="text-slate-900 font-bold block">{selectedScene.recommendedLine}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Área de Aplicación Aprox:</span>
              <strong className="text-blue-900 font-bold block">{selectedScene.accentAreaM2} m² (2 manos)</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Consumo Estimado:</span>
              <strong className="text-emerald-800 font-bold block">{estimatedGallons} Galones (~{Math.ceil(estimatedGallons / 5)} Cuñetes)</strong>
            </div>
          </div>

        </div>

        {/* RIGHT: Palette Selector & Finish Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* PALETTE EXPLORER */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 block uppercase tracking-wider">
              Carta de Color Oficial Pintuco®:
              </label>
              <span className="text-[10px] text-slate-400 font-mono">{filteredPalette.length} Tonos</span>
            </div>

            {/* Family Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              <button
                type="button"
                onClick={() => setColorFamilyFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap cursor-pointer ${
                  colorFamilyFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              {uniqueFamilies.map((fam) => (
                <button
                  key={fam}
                  type="button"
                  onClick={() => setColorFamilyFilter(fam)}
                  className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap cursor-pointer ${
                    colorFamilyFilter === fam
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {fam}
                </button>
              ))}
            </div>

            {/* Color Swatches Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1">
              {filteredPalette.map((col) => {
                const isSelected = primaryColor.code === col.code;

                return (
                  <button
                    key={col.code}
                    type="button"
                    onClick={() => handleSelectColor(col)}
                    className={`group relative flex flex-col items-center p-1.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600/30 scale-105'
                        : 'border-slate-200 hover:border-slate-400 bg-white hover:scale-102'
                    }`}
                  >
                    <div 
                      className="w-full h-9 rounded-lg border border-black/10 shadow-2xs mb-1 group-hover:shadow-sm" 
                      style={{ backgroundColor: col.hex }}
                    />
                    <span className="text-[10px] font-bold text-slate-800 truncate w-full text-center leading-tight">
                      {col.name}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">{col.code}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom HEX Picker */}
            <form onSubmit={handleApplyCustomHex} className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <input
                type="color"
                value={customHex}
                onChange={(e) => setCustomHex(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300"
                title="Seleccionar color personalizado"
              />
              <input
                type="text"
                value={customHex}
                onChange={(e) => setCustomHex(e.target.value)}
                placeholder="#HEX"
                className="w-24 px-2 py-1 text-xs font-mono font-bold border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg cursor-pointer"
              >
                Aplicar Tono Especial
              </button>
            </form>
          </div>

          {/* FINISH / TEXTURE SELECTOR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <label className="text-xs font-black text-slate-900 block uppercase tracking-wider">
              3. Nivel de Brillo & Acabado Técnico:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {FINISH_EFFECTS.map((f) => {
                const isSelected = selectedFinish === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFinish(f.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-950 ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <span className="block font-black text-slate-900">{f.name}</span>
                    <span className="text-[10px] text-slate-500 block leading-tight">{f.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Export Button */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExportSummary}
              className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Guardar & Compartir Ficha de Color</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
