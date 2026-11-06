import React, { useState, useEffect } from 'react';
import { CapturedProjectForm, ChannelSource, EnvironmentType, FinishType, ProjectRecord, ProjectType, SurfaceCondition, SurfaceType, UserProfile, AiDiagnosisResult } from '../types';
import { User, Building, FlaskConical, Image as ImageIcon, Sparkles, CheckCircle2, AlertCircle, Upload, ShieldCheck, ArrowRight, Palette, RefreshCw, Radio, X, MessageSquare, Send, Check, HelpCircle, Bot, Zap, Eye, Sliders, Truck, Store, MapPin, Phone } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ALL_CHANNELS, getChannelMetadata, getDefaultChannelForUser } from '../utils/channelUtils';
import { getUrgencyConfig } from '../utils/urgencyUtils';
import { PINTUCO_PICKUP_STORES } from '../data/pintucoCatalog';
import { AiDiagnosisAndSimulatorModal } from './AiDiagnosisAndSimulatorModal';
import { supabaseSyncService } from '../lib/supabaseSyncService';

interface IntelligentCaptureFormProps {
  currentUser?: UserProfile | null;
  onProjectCreated: (newProject: ProjectRecord) => void;
  onOpenAssistant?: (technicalData: any) => void;
}

const SAMPLE_PHOTO_PRESETS = [
  {
    name: 'Humedad & Salitre',
    url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=600&q=80',
    tag: 'Condición Humedad'
  },
  {
    name: 'Fachada Residencial',
    url: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=600&q=80',
    tag: 'Intemperie'
  },
  {
    name: 'Piso Industrial / Bodega',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    tag: 'Tráfico Pesado'
  },
  {
    name: 'Oficina / Drywall',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
    tag: 'Interior'
  }
];

const PINTUCO_PALETTE = [
  { name: 'Blanco Lino 1001-P', hex: '#F7F6F2' },
  { name: 'Gris Calma G-204', hex: '#D8DBE2' },
  { name: 'Azul Colonial P-402', hex: '#2B4C7E' },
  { name: 'Verde Palma Andina', hex: '#3E6B5C' },
  { name: 'Ocre Terracota Real', hex: '#C26D44' },
  { name: 'Arena Suave 1020-P', hex: '#EBE5D8' },
  { name: 'Gris Seguridad Epóxico', hex: '#9AA0A6' },
  { name: 'Amarillo Tráfico Pintuco', hex: '#F9C22E' }
];

export const IntelligentCaptureForm: React.FC<IntelligentCaptureFormProps> = ({
  currentUser,
  onProjectCreated,
  onOpenAssistant
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Advanced AI Diagnostic & Simulation Modal state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Form State adhering strictly to the 4 pillars from the slide
  const [formData, setFormData] = useState<CapturedProjectForm>({
    identification: {
      clientName: '',
      nit: '',
      contactPerson: '',
      contactPhone: '',
      contactEmail: '',
      channel: 'web_portal'
    },
    project: {
      city: 'Medellín',
      projectType: 'residencial',
      areaM2: 120,
      requiredDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      deliveryUrgency: 'express_3_5dias',
      deliveryMethod: 'envio_obra',
      pickupStoreOrCedi: '',
      pickupAuthorizedPerson: '',
      address: ''
    },
    technical: {
      surface: 'mamposteria_concreto',
      environment: 'interior_seco',
      condition: 'buen_estado',
      finish: 'mate',
      colorName: 'Blanco Lino 1001-P',
      colorHex: '#F7F6F2'
    },
    evidence: {
      description: '',
      photos: [SAMPLE_PHOTO_PRESETS[0].url],
      observations: '',
      consentHabeasData: true
    }
  });

  // Sync with current user profile and role-based default channel
  useEffect(() => {
    if (currentUser) {
      const defaultChan = getDefaultChannelForUser(currentUser);
      setFormData((prev) => ({
        ...prev,
        identification: {
          ...prev.identification,
          clientName: prev.identification.clientName || currentUser.name || '',
          contactPerson: prev.identification.contactPerson || currentUser.name || '',
          contactEmail: prev.identification.contactEmail || currentUser.email || '',
          contactPhone: prev.identification.contactPhone || currentUser.phone || '',
          nit: prev.identification.nit || currentUser.nitOrDoc || '',
          channel: prev.identification.channel || defaultChan
        },
        project: {
          ...prev.project,
          city: currentUser.city || prev.project.city
        }
      }));
    }
  }, [currentUser]);

  const handleFillDemoData = () => {
    setFormData({
      identification: {
        clientName: 'Constructora Bolívar S.A.',
        nit: '860.052.124-7',
        contactPerson: 'Ing. Rodrigo Cárdenas',
        contactPhone: '+57 315 780 4390',
        contactEmail: 'rcardenas@constructorabolivar.com',
        channel: 'constructor_b2b'
      },
      project: {
        city: 'Medellín',
        projectType: 'residencial',
        areaM2: 450,
        requiredDate: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
        deliveryUrgency: 'express_3_5dias',
        deliveryMethod: 'envio_obra',
        pickupStoreOrCedi: '',
        pickupAuthorizedPerson: 'Ing. Rodrigo Cárdenas',
        address: 'Calle 10 Sur # 35-120, Poblado'
      },
      technical: {
        surface: 'mamposteria_concreto',
        environment: 'exterior_intemperie',
        condition: 'humedad_eflorescencia',
        finish: 'mate',
        colorName: 'Blanco Lino 1001-P',
        colorHex: '#F7F6F2'
      },
      evidence: {
        description: 'Repinte de muros de fachada exterior con presencia de eflorescencia salina y manchas de humedad en la base.',
        photos: [SAMPLE_PHOTO_PRESETS[0].url, SAMPLE_PHOTO_PRESETS[1].url],
        observations: 'Aplicación debe realizarse con andamio certificado.',
        consentHabeasData: true
      }
    });
  };

  const handlePhotoAdd = (presetUrl: string) => {
    if (!formData.evidence.photos.includes(presetUrl)) {
      setFormData({
        ...formData,
        evidence: {
          ...formData.evidence,
          photos: [...formData.evidence.photos, presetUrl]
        }
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData({
            ...formData,
            evidence: {
              ...formData.evidence,
              photos: [...formData.evidence.photos, event.target.result as string]
            }
          });
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const updated = [...formData.evidence.photos];
    updated.splice(index, 1);
    setFormData({
      ...formData,
      evidence: {
        ...formData.evidence,
        photos: updated
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.identification.clientName) {
      setErrorMessage('Por favor ingrese el nombre del cliente o empresa.');
      return;
    }
    if (!formData.project.areaM2 || formData.project.areaM2 <= 0) {
      setErrorMessage('Por favor indique un área en m² válida mayor a 0.');
      return;
    }
    if (!formData.evidence.consentHabeasData) {
      setErrorMessage('Es requerido aceptar el consentimiento de tratamiento de datos.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success && result.data) {
        // Sync project to Supabase if connected
        supabaseSyncService.saveProject(result.data).catch((err) => {
          console.warn('Supabase background project sync notice:', err);
        });

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        onProjectCreated(result.data);
      } else {
        setErrorMessage(result.error || 'Error al procesar la Captura Inteligente de Proyectos.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Error de comunicación con el servidor de COLORLINK.');
    } finally {
      setLoading(false);
    }
  };

  const handleConsultAi = () => {
    setIsAiModalOpen(true);
    if (typeof onOpenAssistant === 'function') {
      try {
        onOpenAssistant(formData.technical);
      } catch (err) {
        console.warn('onOpenAssistant callback error handled safely:', err);
      }
    }
  };

  const handleApplyAiDiagnosisResult = (
    result: AiDiagnosisResult,
    selectedColor?: { name: string; hex: string }
  ) => {
    const note = `[Diagnóstico IA Pintuco]: ${result.diagnostico || ''}\n[Sistema Recomendado]: ${result.recomendacionPintuco || ''}${result.imprimanteRecomendado ? ` con imprimante ${result.imprimanteRecomendado}` : ''}`;
    
    setFormData(prev => ({
      ...prev,
      technical: {
        ...prev.technical,
        ...(selectedColor ? { colorName: selectedColor.name, colorHex: selectedColor.hex } : {})
      },
      evidence: {
        ...prev.evidence,
        observations: prev.evidence.observations 
          ? `${prev.evidence.observations}\n\n${note}`
          : note
      }
    }));
    setIsAiModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      
      {/* Top Banner mirroring classroom slide */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Pilar 01 • Formulario Mínimo Viable (MVP)
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Captura Inteligente de Proyectos
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              "Capturar no es solo llenar un formulario. Es convertir una necesidad ambigua en datos listos para validar, consultar, clasificar y automatizar."
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFillDemoData}
              className="px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Autocompletar Caso Demo</span>
            </button>

            <button
              type="button"
              onClick={handleConsultAi}
              className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Consultar Asistente IA</span>
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main 4-Column Structured Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* 1. IDENTIFICACIÓN */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
            <div className="bg-emerald-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide">1. Identificación</h3>
                  <span className="text-[10px] text-emerald-100 uppercase tracking-wider font-semibold">
                    Dato Estructurado
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3.5 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cliente / Razón Social *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Constructora Andina S.A.S."
                  value={formData.identification.clientName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      identification: { ...formData.identification, clientName: e.target.value }
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIT / Documento Identidad
                </label>
                <input
                  type="text"
                  placeholder="Ej. 900.842.115-4"
                  value={formData.identification.nit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      identification: { ...formData.identification, nit: e.target.value }
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Responsable de Contacto
                </label>
                <input
                  type="text"
                  placeholder="Ej. Arq. Carolina Morales"
                  value={formData.identification.contactPerson}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      identification: { ...formData.identification, contactPerson: e.target.value }
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="+57 300 451 9822"
                  value={formData.identification.contactPhone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      identification: { ...formData.identification, contactPhone: e.target.value }
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Canal de Captura & Origen *
                  </label>
                  {(() => {
                    const meta = getChannelMetadata(formData.identification.channel);
                    return (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}>
                        {meta.sourceCategory}
                      </span>
                    );
                  })()}
                </div>
                <div className="relative">
                  <select
                    value={formData.identification.channel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        identification: { ...formData.identification, channel: e.target.value as ChannelSource }
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-semibold text-slate-800"
                  >
                    {ALL_CHANNELS.map((ch) => (
                      <option key={ch.key} value={ch.key}>
                        {ch.label} ({ch.sourceCategory})
                      </option>
                    ))}
                  </select>
                </div>
                {(() => {
                  const meta = getChannelMetadata(formData.identification.channel);
                  const IconComp = meta.icon;
                  return (
                    <div className="mt-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] flex items-start gap-2 text-slate-600">
                      <IconComp className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="leading-tight">
                        <strong className="text-slate-800">{meta.label}:</strong> {meta.description}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* 2. PROYECTO */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide">2. Proyecto</h3>
                  <span className="text-[10px] text-blue-100 uppercase tracking-wider font-semibold">
                    Dato Estructurado
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3.5 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ciudad / Nodo CEDI *
                </label>
                <select
                  value={formData.project.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      project: { ...formData.project, city: e.target.value }
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="Medellín">Medellín (CEDI Central Guarne)</option>
                  <option value="Bogotá">Bogotá D.C. (CEDI Fontibón)</option>
                  <option value="Cali">Cali (CEDI Yumbo)</option>
                  <option value="Barranquilla">Barranquilla (CEDI Soledad)</option>
                  <option value="Bucaramanga">Bucaramanga (CEDI Chimitá)</option>
                  <option value="Cartagena">Cartagena (CEDI Mamonal)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tipo de Obra *
                </label>
                <select
                  value={formData.project.projectType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      project: { ...formData.project, projectType: e.target.value as ProjectType }
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="residencial">Residencial (Casas / Aptos)</option>
                  <option value="comercial">Comercial (Locales / Oficinas)</option>
                  <option value="industrial">Industrial (Plantas / Bodegas)</option>
                  <option value="infraestructura">Infraestructura Pública / Puentes</option>
                  <option value="institucional">Institucional (Hospitales / Colegios)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Área Total a Pintar (m²) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.project.areaM2}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        project: { ...formData.project, areaM2: Number(e.target.value) }
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold text-blue-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="absolute right-3 top-1.5 text-xs font-semibold text-slate-400">m²</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fecha Requerida de Inicio *
                </label>
                <input
                  type="date"
                  required
                  value={formData.project.requiredDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      project: { ...formData.project, requiredDate: e.target.value }
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>¿En cuánto tiempo necesita los materiales? *</span>
                  <span className="text-[10px] text-amber-600 font-extrabold uppercase">Logística & Despacho CEDI</span>
                </label>
                <select
                  value={formData.project.deliveryUrgency || 'express_3_5dias'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      project: { ...formData.project, deliveryUrgency: e.target.value as any }
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-bold border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 bg-white"
                >
                  <option value="inmediato_24_48h">🚨 Urgente / Inmediato (24 a 48 horas)</option>
                  <option value="express_3_5dias">⚡ Rápido / Express (3 a 5 días hábiles)</option>
                  <option value="estandar_1_2semanas">📦 Estándar (1 a 2 semanas)</option>
                  <option value="programado_etapas">📅 Programada por Etapas de Obra</option>
                </select>

                {(() => {
                  const urgencyVal = formData.project.deliveryUrgency || 'express_3_5dias';
                  const config = getUrgencyConfig(urgencyVal);
                  const IconComp = config.icon;
                  return (
                    <div className={`mt-2 p-2.5 rounded-lg border text-xs flex items-start gap-2 ${config.badgeBg} ${config.badgeBorder}`}>
                      <IconComp className={`w-4 h-4 shrink-0 mt-0.5 ${config.badgeText}`} />
                      <div className="leading-tight">
                        <span className={`font-bold block text-[11px] ${config.badgeText}`}>
                          Prioridad de Despacho: {config.label}
                        </span>
                        <span className="text-[10px] text-slate-600">
                          {config.description} (SLA estimado: {config.slaDays})
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Modalidad de Entrega: Envío a Obra vs Retiro en Tienda Pintacasa */}
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Modalidad de Entrega de los Materiales *</span>
                  <span className="text-[10px] text-blue-600 font-extrabold uppercase">Logística Pintuco®</span>
                </label>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        project: { ...formData.project, deliveryMethod: 'envio_obra' }
                      })
                    }
                    className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-start gap-2 ${
                      (formData.project.deliveryMethod || 'envio_obra') === 'envio_obra'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Truck
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        (formData.project.deliveryMethod || 'envio_obra') === 'envio_obra' ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                    <div>
                      <span className="font-extrabold text-xs block leading-tight">Envío a Obra</span>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                        Despacho directo en flota logística
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const currentCity = formData.project.city || 'Medellín';
                      const storeMatch =
                        PINTUCO_PICKUP_STORES.find((s) => s.city.toLowerCase() === currentCity.toLowerCase()) ||
                        PINTUCO_PICKUP_STORES[0];
                      setFormData({
                        ...formData,
                        project: {
                          ...formData.project,
                          deliveryMethod: 'retiro_tienda',
                          pickupStoreOrCedi: formData.project.pickupStoreOrCedi || `${storeMatch.name} - ${storeMatch.address}`,
                          pickupAuthorizedPerson:
                            formData.project.pickupAuthorizedPerson || formData.identification.contactPerson || ''
                        }
                      });
                    }}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-start gap-2 ${
                      formData.project.deliveryMethod === 'retiro_tienda'
                        ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Store
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        formData.project.deliveryMethod === 'retiro_tienda' ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    />
                    <div>
                      <span className="font-extrabold text-xs block leading-tight text-emerald-800">Retiro en Tienda</span>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                        Pintacasa / CEDI (Sin costo)
                      </span>
                    </div>
                  </button>
                </div>

                {formData.project.deliveryMethod === 'retiro_tienda' ? (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-950 mb-1 flex items-center justify-between">
                        <span>Punto de Retiro (Tienda Pintacasa o CEDI):</span>
                        <span className="text-[10px] text-emerald-700 font-extrabold">Zona {formData.project.city}</span>
                      </label>
                      <select
                        value={formData.project.pickupStoreOrCedi || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            project: { ...formData.project, pickupStoreOrCedi: e.target.value }
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-semibold border border-emerald-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        {PINTUCO_PICKUP_STORES.map((st) => (
                          <option key={st.id} value={`${st.name} - ${st.address}`}>
                            {st.city}: {st.name} ({st.address})
                          </option>
                        ))}
                      </select>
                    </div>

                    {(() => {
                      const selectedStore =
                        PINTUCO_PICKUP_STORES.find((s) =>
                          formData.project.pickupStoreOrCedi?.includes(s.name)
                        ) ||
                        PINTUCO_PICKUP_STORES.find(
                          (s) => s.city.toLowerCase() === (formData.project.city || 'medellín').toLowerCase()
                        ) ||
                        PINTUCO_PICKUP_STORES[0];

                      return (
                        <div className="p-2.5 bg-white rounded-lg border border-emerald-200 text-[11px] text-slate-600 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{selectedStore.address}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Tel: {selectedStore.phone}</span>
                            <span className="font-semibold text-emerald-800">{selectedStore.schedule}</span>
                          </div>
                        </div>
                      );
                    })()}

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Persona / Documento Autorizado a Reclamar en Mostrador:
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Juan Pérez (C.C. 1.020.304.506)"
                        value={formData.project.pickupAuthorizedPerson || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            project: { ...formData.project, pickupAuthorizedPerson: e.target.value }
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs border border-emerald-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Dirección de la Obra (Para Despacho en Camión) *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Cra 43A # 14-88, El Poblado"
                      value={formData.project.address || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          project: { ...formData.project, address: e.target.value }
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. TÉCNICO */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
            <div className="bg-indigo-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide">3. Técnico</h3>
                  <span className="text-[10px] text-indigo-100 uppercase tracking-wider font-semibold">
                    Dato Estructurado
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3.5 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Superficie / Sustrato *
                </label>
                <select
                  value={formData.technical.surface}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      technical: { ...formData.technical, surface: e.target.value as SurfaceType }
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                >
                  <option value="mamposteria_concreto">Mampostería / Concreto / Revoque</option>
                  <option value="drywall_yeso">Drywall / Yeso / Lámina de yeso</option>
                  <option value="madera">Madera natural o procesada</option>
                  <option value="metal_ferroso">Metal ferroso / Estructuras de acero</option>
                  <option value="metal_galvanizado">Metal galvanizado / Aluminio</option>
                  <option value="teja_fibrocemento">Tejas / Fibrocemento / Cubiertas</option>
                  <option value="piso_industrial">Piso de concreto industrial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ambiente de Exposición *
                </label>
                <select
                  value={formData.technical.environment}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      technical: { ...formData.technical, environment: e.target.value as EnvironmentType }
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="interior_seco">Interior Seco (Habitaciones, Oficinas)</option>
                  <option value="interior_humedo">Interior Húmedo (Baños, Cocinas, Lavanderías)</option>
                  <option value="exterior_intemperie">Exterior Intemperie (Fachadas, Muros externos)</option>
                  <option value="industrial_agresivo">Industrial Agresivo (Químicos, Vapores)</option>
                  <option value="inmersion_humedad_extrema">Humedad Extrema / Terrazas / Cubiertas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Condición del Espacio *
                </label>
                <select
                  value={formData.technical.condition}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      technical: { ...formData.technical, condition: e.target.value as SurfaceCondition }
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                >
                  <option value="nueva_sin_pintar">Superficie Nueva (Sin pintar)</option>
                  <option value="buen_estado">Buen Estado (Repinte preventivo)</option>
                  <option value="humedad_eflorescencia">Humedad / Salitre / Hongos</option>
                  <option value="fisuras_grietas">Fisuras / Grietas superficiales</option>
                  <option value="descascaramiento_severo">Descascaramiento / Pintura suelta</option>
                  <option value="corrosion_oxido">Corrosión / Óxido visible</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Color / Acabado *
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={formData.technical.colorName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        technical: { ...formData.technical, colorName: e.target.value }
                      })
                    }
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Color Pintuco o RAL"
                  />
                  <div
                    className="w-7 h-7 rounded-lg border border-slate-300 shrink-0 shadow-2xs"
                    style={{ backgroundColor: formData.technical.colorHex || '#ffffff' }}
                  />
                </div>

                {/* Quick Color Palette */}
                <div className="flex flex-wrap gap-1">
                  {PINTUCO_PALETTE.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          technical: {
                            ...formData.technical,
                            colorName: c.name,
                            colorHex: c.hex
                          }
                        })
                      }
                      title={c.name}
                      className="w-5 h-5 rounded border border-slate-300 hover:scale-110 transition-transform cursor-pointer"
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. EVIDENCIA */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
            <div className="bg-rose-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide">4. Evidencia</h3>
                  <span className="text-[10px] text-rose-100 uppercase tracking-wider font-semibold">
                    Dato Estructurado
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3.5 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción Libre de la Necesidad
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre el estado actual, requerimientos especiales..."
                  value={formData.evidence.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      evidence: { ...formData.evidence, description: e.target.value }
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Fotos de la Superficie</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {formData.evidence.photos.length} adjunta(s)
                  </span>
                </label>

                {/* Photo Previews */}
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {formData.evidence.photos.map((p, idx) => (
                    <div key={idx} className="relative group rounded-md overflow-hidden h-14 border border-slate-200">
                      <img src={p} alt={`Evidencia ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute inset-0 bg-black/60 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>

                {/* Upload or Choose Presets */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-1.5">
                    <label className="flex-1 py-1.5 px-2 border border-dashed border-rose-300 hover:border-rose-500 bg-rose-50/50 hover:bg-rose-50 rounded-lg text-center cursor-pointer transition-colors text-[11px] font-semibold text-rose-800 flex items-center justify-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir Foto Evidencia</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>

                  {/* Direct button to run AI Diagnosis and Visual Simulation from photos */}
                  <button
                    type="button"
                    onClick={handleConsultAi}
                    className="w-full py-2 px-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow-indigo-500/20 active:scale-98 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    <span>Diagnosticar con IA & Ver Acabado Final</span>
                  </button>
                </div>

                <div className="mt-1.5">
                  <span className="text-[10px] text-slate-500 block mb-1">Muestras de Patologías:</span>
                  <div className="flex flex-wrap gap-1">
                    {SAMPLE_PHOTO_PRESETS.map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handlePhotoAdd(preset.url)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                      >
                        + {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observaciones de Operación
                </label>
                <input
                  type="text"
                  placeholder="Ej. Horario nocturno, requiere andamio"
                  value={formData.evidence.observations}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      evidence: { ...formData.evidence, observations: e.target.value }
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              {/* Habeas Data Consent */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.evidence.consentHabeasData}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        evidence: { ...formData.evidence, consentHabeasData: e.target.checked }
                      })
                    }
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-[11px] text-slate-600 leading-tight">
                    Autorizo el tratamiento de datos y origen del canal según la política de privacidad Pintuco.
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Validar y Generar Ficha Técnica Automática
              </h4>
              <p className="text-xs text-slate-400">
                El motor calculará cuñetes, masilla, imprimante, reserva de CEDI y cuadrilla certificada.
              </p>
            </div>
          </div>

          <button
            type="submit"
            id="btn-generar-proyecto-colorlink"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#FF6B35] hover:bg-[#E85520] disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-lg hover:shadow-orange-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border border-orange-400/30"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Calculando Solución Pintuco...</span>
              </>
            ) : (
              <>
                <span>Generar Proyecto COLORLINK</span>
                <ArrowRight className="w-4 h-4 text-[#F7C548]" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Advanced AI Diagnosis & Visual Finishing Simulator Modal */}
      <AiDiagnosisAndSimulatorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        technical={formData.technical}
        project={formData.project}
        evidence={formData.evidence}
        onApplyRecommendation={handleApplyAiDiagnosisResult}
      />

    </div>
  );
};
