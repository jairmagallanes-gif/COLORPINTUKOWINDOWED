import React, { useState, useRef } from 'react';
import { ProjectRecord } from '../types';
import { formatCOP } from '../utils/calculator';
import { getChannelMetadata } from '../utils/channelUtils';
import { getUrgencyConfig } from '../utils/urgencyUtils';
import { Award, ShieldCheck, CheckCircle, Printer, X, Truck, Boxes, FileCheck, QrCode, CheckCircle2, ExternalLink, Minimize2, Maximize2, Lock, AlertTriangle, CreditCard } from 'lucide-react';
import { printElement, openInNewTabForPrint } from '../utils/printHelper';

interface PrintableDocumentsModalProps {
  type: 'warranty' | 'quotation' | 'dispatch';
  project: ProjectRecord;
  onClose: () => void;
}

export const PrintableDocumentsModal: React.FC<PrintableDocumentsModalProps> = ({
  type,
  project,
  onClose
}) => {
  const [isCompact, setIsCompact] = useState<boolean>(true);
  const { formData, solution, assignedWarehouse, qualityAssurance, serviceDispatch } = project;
  const channelMeta = getChannelMetadata(formData.identification.channel);
  const urgencyConfig = getUrgencyConfig(project.deliveryUrgency || formData.project.deliveryUrgency);
  const UrgencyIcon = urgencyConfig.icon;
  const printableRef = useRef<HTMLDivElement>(null);

  // Business verification: Warranty enabled only after purchase and verified payment
  const isPurchaseCompleted = project.quotationInfo?.clientDecision === 'aceptada' || 
    ['inventario_reservado', 'verificacion_pago', 'despacho_en_camino', 'calidad_aprobada', 'finalizado'].includes(project.status);

  const isPaymentConfirmed = Boolean(
    project.paymentVerification?.isVerified || 
    ['despacho_en_camino', 'calidad_aprobada', 'finalizado'].includes(project.status)
  );

  const isWarrantyEnabled = isPurchaseCompleted && isPaymentConfirmed;

  // NOTE: Modal only closes when the user explicitly clicks the "Cerrar" button.
  // Backdrop click and accidental ESC key closing have been disabled per requirement.

  const documentTitle = type === 'warranty'
    ? `Certificado_Garantia_Pintuco_${project.id}`
    : type === 'dispatch'
    ? `Remision_Despacho_CEDI_${project.id}`
    : `Cotizacion_Oficial_Pintuco_${project.id}`;

  const handlePrint = () => {
    if (type === 'warranty' && !isWarrantyEnabled) return;
    if (printableRef.current) {
      printElement(printableRef.current, {
        documentTitle,
        fallbackFilename: `${documentTitle}.html`
      });
    } else {
      window.print();
    }
  };

  const handleOpenInNewTab = () => {
    if (type === 'warranty' && !isWarrantyEnabled) return;
    if (printableRef.current) {
      openInNewTabForPrint(printableRef.current, documentTitle);
    }
  };

  const currentDate = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const certCode = qualityAssurance?.warrantyDocId || `POL-PINTUCO-${project.id.replace('COLORLINK-', '')}`;
  const dispatchCode = `REM-CEDI-${project.id.replace('COLORLINK-', '')}-2026`;
  const loteCode = `LOTE-${assignedWarehouse.cediName.substring(0, 3).toUpperCase()}-9942-X`;

  return (
    <div 
      className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs print:p-0 print:bg-white print:static print:z-auto"
      role="dialog"
      aria-modal="true"
    >
      <div 
        id="pintuco-printable-card-wrapper"
        className={`relative w-full ${isCompact ? 'max-w-3xl' : 'max-w-4xl'} max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden my-auto print:border-none print:shadow-none print:my-0 print:w-full print:max-w-none print:max-h-none flex flex-col animate-in fade-in zoom-in-95 duration-200`}
      >
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="sticky top-0 z-20 bg-slate-900 text-white px-3 sm:px-5 py-3 flex items-center justify-between shadow-md print:hidden shrink-0">
          <div className="flex items-center gap-2">
            {type === 'warranty' && (
              <>
                {isWarrantyEnabled ? (
                  <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span className="font-extrabold text-xs sm:text-sm truncate">
                  Póliza & Garantía Pintuco®
                </span>
                {isWarrantyEnabled ? (
                  <span className="hidden sm:inline-block text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    ✓ Habilitada (Pago Verificado)
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                    🔒 Inactiva (Requiere Compra y Pago)
                  </span>
                )}
              </>
            )}
            {type === 'dispatch' && (
              <>
                <Truck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-extrabold text-xs sm:text-sm truncate">
                  Remisión de Despacho CEDI Pintuco®
                </span>
              </>
            )}
            {type === 'quotation' && (
              <>
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-extrabold text-xs sm:text-sm truncate">
                  Cotización Oficial ColorLink Pintuco®
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              type="button"
              onClick={() => setIsCompact(!isCompact)}
              id="btn-toggle-compact-doc"
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
              title={isCompact ? 'Cambiar a tamaño amplio' : 'Ajustar a tamaño compacto de pantalla'}
            >
              {isCompact ? <Maximize2 className="w-3.5 h-3.5 text-cyan-400" /> : <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />}
              <span className="hidden md:inline">{isCompact ? 'Ampliar' : 'Ajustar'}</span>
            </button>

            <button
              type="button"
              disabled={type === 'warranty' && !isWarrantyEnabled}
              onClick={handlePrint}
              id="btn-print-doc-top"
              className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all active:scale-98 ${
                type === 'warranty' && !isWarrantyEnabled
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
              }`}
              title={type === 'warranty' && !isWarrantyEnabled ? 'Documento inhabilitado: requiere compra y pago verificado' : 'Imprimir documento o guardar como PDF'}
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>
            <button
              type="button"
              disabled={type === 'warranty' && !isWarrantyEnabled}
              onClick={handleOpenInNewTab}
              id="btn-open-tab-doc-top"
              className={`px-2.5 py-1.5 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all active:scale-98 ${
                type === 'warranty' && !isWarrantyEnabled
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer'
              }`}
              title={type === 'warranty' && !isWarrantyEnabled ? 'Documento inhabilitado: requiere compra y pago verificado' : 'Abrir en pestaña completa e imprimir directamente'}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Nueva Pestaña</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              id="btn-close-doc-top"
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-98 cursor-pointer ml-1"
              title="Cerrar documento"
            >
              <X className="w-4 h-4" />
              <span>Cerrar</span>
            </button>
          </div>
        </div>

        {/* PRINTABLE BODY - Clean internal scroll fitting the interface */}
        <div 
          ref={printableRef}
          id="pintuco-printable-content"
          className={`overflow-y-auto flex-1 ${isCompact ? 'p-4 sm:p-6 space-y-5 text-[13px]' : 'p-6 sm:p-10 space-y-7'} text-slate-900 bg-white font-sans print:p-6 print:space-y-6 print:overflow-visible`}
        >
          
          {/* ========================================================
              DOCUMENT 1: CERTIFICADO DE CALIDAD, PÓLIZA & GARANTÍA
             ======================================================== */}
          {type === 'warranty' && !isWarrantyEnabled && (
            <div className="space-y-6 border-4 border-dashed border-amber-400 bg-amber-50/40 p-6 sm:p-10 rounded-2xl text-center animate-in fade-in duration-200">
              <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-amber-300">
                <Lock className="w-8 h-8 text-amber-700" />
              </div>
              
              <div className="max-w-xl mx-auto space-y-2">
                <span className="inline-block px-3 py-1 bg-amber-200 text-amber-900 text-xs font-black rounded-full uppercase tracking-wider shadow-2xs">
                  🔒 Póliza Oficial Inactiva / Bloqueada
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Certificado de Calidad & Póliza de Garantía Pintuco®
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Por estrictas normas de aseguramiento de calidad y control contable de Pintuco® S.A., las pólizas de garantía de fábrica de <strong>{solution.warrantyYears} Años</strong> únicamente se emiten y activan formalmente <strong>después de realizada la compra por el cliente y de que el pago esté reflejado y verificado por Tesorería</strong>.
                </p>
              </div>

              {/* Real-time requirements checklist */}
              <div className="max-w-lg mx-auto bg-white p-4 sm:p-6 rounded-2xl border border-amber-200 shadow-sm text-left space-y-3.5 text-xs">
                <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <ShieldCheck className="w-4 h-4 text-[#2E3192]" />
                  <span>Estado de Requisitos de Emisión:</span>
                </h4>

                {/* Step 1: Purchase approval */}
                <div className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  isPurchaseCompleted ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                      isPurchaseCompleted ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {isPurchaseCompleted ? '✓' : '1'}
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-900 block text-xs">1. Aprobación de Compra (Fase 4)</span>
                      <span className="text-[11px] text-slate-500 block">
                        Aceptación formal de la cotización por parte del cliente titular
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black shrink-0 ${
                    isPurchaseCompleted ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {isPurchaseCompleted ? 'Aprobada ✓' : 'Pendiente ⏳'}
                  </span>
                </div>

                {/* Step 2: Payment verification */}
                <div className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  isPaymentConfirmed ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                      isPaymentConfirmed ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {isPaymentConfirmed ? '✓' : '2'}
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-900 block text-xs">2. Pago Reflejado en Tesorería (Fase 5)</span>
                      <span className="text-[11px] text-slate-500 block">
                        Comprobante acreditado y verificado por Cartera / Tesorería Central
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black shrink-0 ${
                    isPaymentConfirmed ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {isPaymentConfirmed ? 'Verificado ✓' : 'Sin Reflejar ⏳'}
                  </span>
                </div>
              </div>

              <div className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
                Una vez confirmado el pago en el sistema por el equipo de Tesorería o asesor asignado, la póliza se generará automáticamente con firma digital, sello oficial NTC y código de póliza activo para impresión o descarga.
              </div>
            </div>
          )}

          {type === 'warranty' && isWarrantyEnabled && (
            <div className="space-y-5 border-4 border-double border-emerald-800 p-5 sm:p-7 rounded-xl relative bg-linear-to-b from-emerald-50/20 via-white to-emerald-50/20">
              
              {/* Header with official Pintuco styling */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-emerald-800/60 pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-[#2E3192] text-white font-black text-2xl rounded-2xl flex items-center justify-center shadow-md">
                    CL
                  </div>
                  <div>
                    <span className="text-[11px] font-black tracking-widest text-[#2E3192] uppercase block">
                      COLORLINK • PINTUCO® S.A.
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                      Certificado de Calidad, Póliza & Garantía
                    </h1>
                    <span className="text-xs text-slate-500 font-medium">
                      Conforme a Normas Técnicas Colombianas NTC 1335 / NTC 5828 & ASTM D3359
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 rounded-lg border border-emerald-300 font-mono font-black text-xs">
                    PÓLIZA: {certCode}
                  </div>
                  <div className="mt-1 flex items-center justify-end gap-1.5 text-[11px] font-bold text-slate-700">
                    <span>Radicado:</span>
                    <span className="font-mono text-emerald-950 font-black">{project.id}</span>
                  </div>
                  <div className="text-[10px] text-slate-600 font-medium">
                    Canal: <strong className="text-slate-900">{channelMeta.label}</strong> ({channelMeta.sourceCategory})
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Emisión: {currentDate}
                  </div>
                </div>
              </div>

              {/* Verified Purchase and Payment Seal */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                  <div>
                    <span className="font-black text-emerald-950 block">
                      COMPRA APROBADA & PAGO REFLEJADO EN TESORERÍA • PÓLIZA HABILITADA
                    </span>
                    <span className="text-[11px] text-emerald-800">
                      Garantía activada formalmente tras acreditación contable y reserva de lote en CEDI.
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                  <span className="bg-white px-2.5 py-1 rounded-md border border-emerald-200 text-emerald-900 font-bold">
                    Ref: {project.paymentVerification?.paymentReference || 'CONF-TESORERIA-PINTUCO'}
                  </span>
                  <span className="bg-white px-2.5 py-1 rounded-md border border-emerald-200 text-emerald-900 font-bold">
                    Monto: ${new Intl.NumberFormat('es-CO').format(project.paymentVerification?.paymentAmountCOP || project.solution.estimatedMaterialCostCOP)} COP
                  </span>
                  <span className="bg-emerald-600 text-white px-2.5 py-1 rounded-md font-black shadow-2xs">
                    PAGO VERIFICADO ✓
                  </span>
                </div>
              </div>

              {/* Warranty Golden Seal */}
              <div className="p-5 bg-linear-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shrink-0 shadow-inner">
                    ★
                  </div>
                  <div>
                    <span className="text-amber-300 font-black text-xs uppercase tracking-wider block">
                      Garantía Técnica de Fábrica Pintuco
                    </span>
                    <h2 className="text-lg font-black text-white">
                      COBERTURA CERTIFICADA POR {solution.warrantyYears} AÑOS
                    </h2>
                    <p className="text-xs text-emerald-200">
                      Garantía de adherencia, retención de color, lavabilidad y resistencia climática.
                    </p>
                  </div>
                </div>

                <div className="text-center sm:text-right px-4 py-2 rounded-xl bg-white/10 border border-white/20">
                  <span className="text-[10px] text-emerald-200 block uppercase font-bold">Radicado Oficial • Pintuco</span>
                  <span className="text-xs font-mono font-black text-white block">{project.id}</span>
                  <span className="text-[10px] text-emerald-300 font-semibold mt-0.5 block">
                    Canal: {channelMeta.label}
                  </span>
                </div>
              </div>

              {/* Grid 1: Project & Client Details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <h3 className="font-black text-slate-900 uppercase text-[11px] border-b border-slate-200 pb-1">
                    1. Datos del Titular y Ubicación de Obra
                  </h3>
                  <div><strong className="text-slate-600">Radicado del Proyecto:</strong> <span className="font-mono font-bold text-slate-900">{project.id}</span></div>
                  <div><strong className="text-slate-600">Canal de Radicación:</strong> <span className="font-bold text-[#2E3192]">{channelMeta.label} ({channelMeta.sourceCategory})</span></div>
                  <div><strong className="text-slate-600">Titular / Razón Social:</strong> {formData.identification.clientName}</div>
                  <div><strong className="text-slate-600">NIT / Identificación:</strong> {formData.identification.nit || 'No registrado'}</div>
                  <div><strong className="text-slate-600">Contacto:</strong> {formData.identification.contactPerson} ({formData.identification.contactPhone})</div>
                  <div><strong className="text-slate-600">Dirección de Obra:</strong> {formData.project.address || `${formData.project.city}`}</div>
                  <div><strong className="text-slate-600">Ciudad & CEDI Emisor:</strong> {formData.project.city} (CEDI {assignedWarehouse.cediName})</div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <h3 className="font-black text-slate-900 uppercase text-[11px] border-b border-slate-200 pb-1">
                    2. Especificación Técnica de Superficie
                  </h3>
                  <div><strong className="text-slate-600">Área Certificada:</strong> {formData.project.areaM2} m² ({formData.project.projectType})</div>
                  <div><strong className="text-slate-600">Tipo de Sustrato:</strong> {formData.technical.surfaceType} ({formData.technical.condition})</div>
                  <div><strong className="text-slate-600">Ambiente de Exposición:</strong> {formData.technical.environment}</div>
                  <div><strong className="text-slate-600">Color Aplicado:</strong> {formData.technical.colorName}</div>
                  <div><strong className="text-slate-600">Canal de Captura Oficial:</strong> {channelMeta.label}</div>
                </div>
              </div>

              {/* System Applied */}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs space-y-3">
                <h3 className="font-black text-emerald-950 uppercase text-[11px]">
                  3. Sistema de Pintura y Recubrimiento Aplicado Homologado
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">Producto Principal</span>
                    <strong className="text-slate-900 block text-xs">{solution.recommendedPrimaryProduct.name}</strong>
                    <span className="text-[11px] text-slate-500">{solution.coatsRecommended} manos • {solution.gallonsPrimary} Galones</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">Imprimante / Sellador</span>
                    <strong className="text-slate-900 block text-xs">{solution.recommendedPrimer?.name || 'Acondicionador base Pintuco'}</strong>
                    <span className="text-[11px] text-slate-500">{solution.gallonsPrimer} Galones aplicados</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">Preparación & Masilla</span>
                    <strong className="text-slate-900 block text-xs">{solution.recommendedPutty?.name || 'Masilla elastomérica Pintuco'}</strong>
                    <span className="text-[11px] text-slate-500">{solution.kilosPutty} Kg de resane técnico</span>
                  </div>
                </div>
              </div>

              {/* Quality Inspections Passed */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <h3 className="font-black text-slate-900 uppercase text-[11px]">
                  4. Ensayos y Criterios de Calidad Validados en Sitio
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 bg-white rounded border border-slate-200 flex items-center gap-1.5 text-[11px]">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Adherencia Cruzada (NTC 1335): <strong>Conforme</strong></span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200 flex items-center gap-1.5 text-[11px]">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Espesor Película Seca: <strong>Óptimo</strong></span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200 flex items-center gap-1.5 text-[11px]">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Resistencia a Lavabilidad: <strong>Clase 1</strong></span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200 flex items-center gap-1.5 text-[11px]">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Sello Antihumedad & VOC: <strong>Bajo Olor</strong></span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-2 sm:grid-cols-3 gap-8 text-center text-xs">
                <div className="space-y-1">
                  <div className="h-12 border-b border-slate-400 flex items-end justify-center pb-1">
                    <span className="font-serif italic font-bold text-slate-800 text-sm">{qualityAssurance?.inspectorName || 'Ing. Carlos Mendoza R.'}</span>
                  </div>
                  <strong className="text-slate-900 block text-[11px]">Inspector de Calidad Pintuco</strong>
                  <span className="text-[10px] text-slate-500 block">Reg. Técnico NTC 1335</span>
                </div>

                <div className="space-y-1">
                  <div className="h-12 border-b border-slate-400 flex items-end justify-center pb-1">
                    <span className="font-serif italic font-bold text-slate-800 text-sm">{serviceDispatch?.technicianOrContractor || 'Cuadrilla Certificada Pintuco'}</span>
                  </div>
                  <strong className="text-slate-900 block text-[11px]">Aplicador / Contratista Certificado</strong>
                  <span className="text-[10px] text-slate-500 block">Carnet Técnico Pintuco</span>
                </div>

                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <div className="h-12 border-b border-slate-400 flex items-end justify-center pb-1">
                    <span className="font-serif italic font-bold text-slate-800 text-sm">{formData.identification.clientName}</span>
                  </div>
                  <strong className="text-slate-900 block text-[11px]">Recibido a Satisfacción (Cliente)</strong>
                  <span className="text-[10px] text-slate-500 block">Firma y Sello de Recibido</span>
                </div>
              </div>

              {/* Legal Footer Note */}
              <div className="text-[9px] text-slate-400 text-center leading-relaxed pt-2">
                Pintuco® S.A. garantiza el suministro y especificación técnica de los materiales descritos bajo las recomendaciones de la ficha técnica oficial. La garantía cubre defectos de formulación y adherencia cuando la aplicación es ejecutada con las manos y preparación especificadas. NIT 890.900.123-1 • Medellín, Colombia.
              </div>

            </div>
          )}


          {/* ========================================================
              DOCUMENT 2: REMISIÓN DE DESPACHO & CONTROL DE LOTE CEDI
             ======================================================== */}
          {type === 'dispatch' && (
            <div className="space-y-5 border-2 border-slate-800 p-5 sm:p-7 rounded-xl relative bg-white">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-slate-900 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-950 text-white font-black text-2xl rounded-2xl flex items-center justify-center shadow-md">
                    CL
                  </div>
                  <div>
                    <span className="text-[11px] font-black tracking-widest text-[#2E3192] uppercase block">
                      COLORLINK LOGÍSTICA • PINTUCO® S.A.
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                      Remisión Oficial de Despacho & Control de Lote
                    </h1>
                    <span className="text-xs text-slate-500 font-medium">
                      Control de Alistamiento CEDI, Cadena de Custodia & Trazabilidad de Salida
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right border-l-2 sm:border-l-0 pl-3 sm:pl-0 border-slate-300">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    No. Remisión Electrónica:
                  </span>
                  <div className="text-base font-mono font-black text-blue-900">
                    {dispatchCode}
                  </div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">
                    Fecha de Alistamiento: {currentDate}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-700 font-bold">
                    ESTADO: DESPACHADO / EN RUTA
                  </div>
                </div>
              </div>

              {/* Logistics & Dispatch Overview Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                    🏢 CEDI Origen & Bodega:
                  </span>
                  <strong className="text-xs text-slate-900 block mt-0.5">
                    {assignedWarehouse.cediName}
                  </strong>
                  <span className="text-[10px] text-slate-600">
                    Bodega Central de Distribución y Tinturación
                  </span>
                </div>

                {formData.project.deliveryMethod === 'retiro_tienda' ? (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                      🏬 Modalidad de Entrega:
                    </span>
                    <strong className="text-xs text-amber-950 block mt-0.5">
                      Retiro en Tienda Pintacasa
                    </strong>
                    <span className="text-[10px] text-amber-800 block truncate">
                      {formData.project.pickupStoreOrCedi || 'Pintacasa Pintuco'}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 block">
                      🚚 Transporte & Vehículo:
                    </span>
                    <strong className="text-xs text-slate-900 block mt-0.5">
                      Pintuco Express • Placa WLZ-842
                    </strong>
                    <span className="text-[10px] text-slate-600">
                      Conductor: Carlos A. Morales (+57 310 845-9921)
                    </span>
                  </div>
                )}

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    🔒 Precinto & Lote:
                  </span>
                  <strong className="text-xs font-mono text-emerald-900 block mt-0.5">
                    {loteCode}
                  </strong>
                  <span className="text-[10px] text-slate-600">
                    Precinto de Seguridad: #PTC-88219-OK
                  </span>
                </div>
              </div>

              {/* Client & Destination Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h3 className="font-black text-slate-900 uppercase text-[11px] mb-2 border-b pb-1">
                    Destinatario / Obra
                  </h3>
                  <div><strong className="text-slate-700">Cliente / Razón Social:</strong> {formData.identification.clientName}</div>
                  {formData.identification.nit && (
                    <div><strong className="text-slate-700">NIT / Cédula:</strong> {formData.identification.nit}</div>
                  )}
                  <div><strong className="text-slate-700">Contacto en Obra:</strong> {formData.identification.contactPerson} ({formData.identification.contactPhone})</div>
                  <div><strong className="text-slate-700">Email Facturación:</strong> {formData.identification.contactEmail}</div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h3 className="font-black text-slate-900 uppercase text-[11px] mb-2 border-b pb-1">
                    {formData.project.deliveryMethod === 'retiro_tienda'
                      ? 'Punto de Retiro & Entrega en Mostrador'
                      : 'Dirección de Entrega & Aplicación'}
                  </h3>
                  {formData.project.deliveryMethod === 'retiro_tienda' ? (
                    <>
                      <div><strong className="text-slate-700">Tienda Pintacasa:</strong> {formData.project.pickupStoreOrCedi || 'Pintacasa Pintuco'}</div>
                      <div><strong className="text-slate-700">Persona Autorizada:</strong> {formData.project.pickupAuthorizedPerson || formData.identification.contactPerson}</div>
                      <div><strong className="text-slate-700">Ciudad:</strong> {formData.project.city}</div>
                      <div><strong className="text-slate-700">Dirección Obra:</strong> {formData.project.address || `Obra ${formData.project.city}`}</div>
                    </>
                  ) : (
                    <>
                      <div><strong className="text-slate-700">Ciudad de Destino:</strong> {formData.project.city}</div>
                      <div><strong className="text-slate-700">Dirección Exacta:</strong> {formData.project.address || `Obra ${formData.project.city}`}</div>
                      <div><strong className="text-slate-700">Tipo de Proyecto:</strong> {formData.project.projectType} • {formData.project.areaM2} m²</div>
                      <div><strong className="text-slate-700">Fecha Requerida:</strong> {formData.project.requiredDate || 'Inmediata / Prioridad Alta'}</div>
                    </>
                  )}
                </div>
              </div>

              {/* Items Despachados Table */}
              <div className="rounded-xl border border-slate-300 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white font-bold">
                    <tr>
                      <th className="p-3">Código / Producto Pintuco®</th>
                      <th className="p-3">Lote de Fab.</th>
                      <th className="p-3">Presentación</th>
                      <th className="p-3">Cantidad Despachada</th>
                      <th className="p-3 text-center">Control Calidad CEDI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-white">
                      <td className="p-3">
                        <strong className="text-slate-900 block">{solution.recommendedPrimaryProduct.name}</strong>
                        <span className="text-[10px] text-slate-500">Color: {formData.technical.colorName} • Acabado: {formData.technical.finish}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-700">{loteCode}</td>
                      <td className="p-3 text-slate-700">{solution.bucketsPrimary > 0 ? 'Cuñetes (5 Gal) + Galón' : 'Galones'}</td>
                      <td className="p-3 font-bold text-blue-900">
                        {solution.gallonsPrimary} Galones ({solution.bucketsPrimary} Cuñetes + {solution.remainderGallonsPrimary}G)
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Inspeccionado
                        </span>
                      </td>
                    </tr>

                    {solution.recommendedPrimer && (
                      <tr className="bg-slate-50/50">
                        <td className="p-3">
                          <strong className="text-slate-800 block">{solution.recommendedPrimer.name}</strong>
                          <span className="text-[10px] text-slate-500">Imprimante y Sellador de Porosidad</span>
                        </td>
                        <td className="p-3 font-mono text-slate-700">LOT-PRM-2026-08</td>
                        <td className="p-3 text-slate-700">Galones</td>
                        <td className="p-3 font-semibold text-slate-800">{solution.gallonsPrimer} Galones</td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Inspeccionado
                          </span>
                        </td>
                      </tr>
                    )}

                    {solution.recommendedPutty && (
                      <tr className="bg-slate-50/50">
                        <td className="p-3">
                          <strong className="text-slate-800 block">{solution.recommendedPutty.name}</strong>
                          <span className="text-[10px] text-slate-500">Masilla y resane para sustrato</span>
                        </td>
                        <td className="p-3 font-mono text-slate-700">LOT-MAS-2026-11</td>
                        <td className="p-3 text-slate-700">Kilos / Balde</td>
                        <td className="p-3 font-semibold text-slate-800">{solution.kilosPutty} Kg</td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Inspeccionado
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Quality & Security Checklist Box */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-blue-700" />
                    Inspección Técnica de Calidad en CEDI
                  </h4>
                  <ul className="text-[10px] text-slate-600 space-y-0.5 list-disc pl-4">
                    <li>Envases herméticamente sellados sin golpes ni fugas.</li>
                    <li>Tono igualado y verificado con espectrofotómetro oficial Pintuco.</li>
                    <li>Certificado de lote emitido con fecha de caducidad superior a 24 meses.</li>
                  </ul>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Validación DIAN & Blockchain:</span>
                    <strong className="text-xs text-blue-950 font-mono">HASH: 9A8F-44B2-PTC-2026</strong>
                    <p className="text-[9px] text-slate-400">Escanea el código para verificar autenticidad en tiempo real</p>
                  </div>
                  <div className="w-14 h-14 bg-slate-900 text-white rounded-lg flex items-center justify-center p-1.5 shrink-0 shadow-xs">
                    <QrCode className="w-full h-full text-white" />
                  </div>
                </div>
              </div>

              {/* Signatures & Delivery Confirmation */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-xs">
                <div className="space-y-1">
                  <div className="h-12 border-b border-slate-400 flex items-end justify-center pb-1">
                    <span className="font-serif italic font-bold text-slate-800 text-xs">Ing. Rodrigo Valenzuela</span>
                  </div>
                  <strong className="text-slate-900 block text-[11px]">Jefe de Despachos CEDI</strong>
                  <span className="text-[9px] text-slate-500 block">Pintuco® S.A.</span>
                </div>

                <div className="space-y-1">
                  <div className="h-12 border-b border-slate-400 flex items-end justify-center pb-1">
                    <span className="font-serif italic font-bold text-slate-800 text-xs">Carlos Andrés Morales</span>
                  </div>
                  <strong className="text-slate-900 block text-[11px]">Conductor Pintuco Express</strong>
                  <span className="text-[9px] text-slate-500 block">Placa WLZ-842</span>
                </div>

                <div className="space-y-1">
                  <div className="h-12 border-b border-slate-400 flex items-end justify-center pb-1">
                    <span className="font-serif italic font-bold text-slate-800 text-xs">{formData.identification.contactPerson || formData.identification.clientName}</span>
                  </div>
                  <strong className="text-slate-900 block text-[11px]">Recibido en Obra</strong>
                  <span className="text-[9px] text-slate-500 block">Firma, Cédula y Fecha de Recibido</span>
                </div>
              </div>

              {/* Legal Footer */}
              <div className="text-[9px] text-slate-400 text-center leading-relaxed pt-1">
                Remisión electrónica de mercancía amparada bajo el Estatuto Tributario y normatividad de transporte de carga terrestre. Pintuco S.A. NIT 890.900.123-1.
              </div>

            </div>
          )}


          {/* ========================================================
              DOCUMENT 3: COTIZACIÓN TÉCNICO-ECONÓMICA OFICIAL
             ======================================================== */}
          {type === 'quotation' && (
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#2E3192] text-white font-black text-xl rounded-xl flex items-center justify-center">
                    CL
                  </div>
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-[#2E3192] uppercase block">
                      COLORLINK • PINTUCO® S.A.
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase">
                      Cotización Técnico-Económica
                    </h1>
                    <span className="text-xs text-slate-500">
                      Oferta Oficial de Materiales & Especificación de Obra
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Radicado Oficial
                  </div>
                  <div className="font-mono font-black text-sm text-[#2E3192] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 inline-block mt-0.5">
                    {project.id}
                  </div>
                  <div className="text-[11px] text-slate-700 font-semibold mt-1">
                    Canal: <strong className="text-slate-950">{channelMeta.label}</strong>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Fecha de Emisión: {currentDate}
                  </div>
                  <div className="text-[10px] text-amber-700 font-bold">
                    Vigencia: 15 días calendario
                  </div>
                </div>
              </div>

              {/* Urgency & Channel Banner */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${urgencyConfig.badgeBg} ${urgencyConfig.badgeBorder}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${urgencyConfig.chipBg} ${urgencyConfig.chipText}`}>
                    <UrgencyIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                      Nivel de Urgencia & Requerimiento en Obra:
                    </span>
                    <h4 className={`text-sm font-black ${urgencyConfig.badgeText}`}>
                      {urgencyConfig.label}
                    </h4>
                    <span className="text-xs text-slate-600">
                      Fecha estimada en obra: <strong>{formData.project.requiredDate}</strong> ({urgencyConfig.description})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500">Canal de Entrada:</span>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-black border ${channelMeta.badgeBg} ${channelMeta.badgeText} ${channelMeta.badgeBorder}`}>
                    {channelMeta.label}
                  </span>
                </div>
              </div>

              {/* Client & Project Data Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h3 className="font-black text-slate-900 uppercase text-[11px] mb-2 border-b pb-1">
                    Cliente / Razón Social
                  </h3>
                  <div><strong className="text-slate-700">Nombre:</strong> {formData.identification.clientName}</div>
                  {formData.identification.nit && (
                    <div><strong className="text-slate-700">NIT / Doc:</strong> {formData.identification.nit}</div>
                  )}
                  <div><strong className="text-slate-700">Contacto:</strong> {formData.identification.contactPerson}</div>
                  <div><strong className="text-slate-700">Teléfono:</strong> {formData.identification.contactPhone}</div>
                  <div><strong className="text-slate-700">Email:</strong> {formData.identification.contactEmail}</div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h3 className="font-black text-slate-900 uppercase text-[11px] mb-2 border-b pb-1">
                    Ubicación y Despacho
                  </h3>
                  <div><strong className="text-slate-700">Ciudad de Obra:</strong> {formData.project.city}</div>
                  <div><strong className="text-slate-700">Dirección:</strong> {formData.project.address || `${formData.project.city}`}</div>
                  <div><strong className="text-slate-700">CEDI de Abastecimiento:</strong> {assignedWarehouse.cediName}</div>
                  <div><strong className="text-slate-700">Área de Pintura:</strong> {formData.project.areaM2} m² ({formData.project.projectType})</div>
                  <div><strong className="text-slate-700">Superficie / Acabado:</strong> {formData.technical.surfaceType} • {formData.technical.finish}</div>
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white font-bold">
                    <tr>
                      <th className="p-3">Ítem / Producto Pintuco®</th>
                      <th className="p-3">Línea / Catálogo</th>
                      <th className="p-3">Manos</th>
                      <th className="p-3">Volumen Requerido</th>
                      <th className="p-3 text-right">Subtotal Estimado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-white">
                      <td className="p-3 font-extrabold text-slate-900">
                        {solution.recommendedPrimaryProduct.name}
                        <span className="text-[10px] text-slate-500 block">Color: {formData.technical.colorName}</span>
                      </td>
                      <td className="p-3 text-slate-600">{solution.recommendedPrimaryProduct.line}</td>
                      <td className="p-3 font-semibold">{solution.coatsRecommended} manos</td>
                      <td className="p-3 font-bold text-blue-900">
                        {solution.gallonsPrimary} Galones ({solution.bucketsPrimary} Cuñetes + {solution.remainderGallonsPrimary}G)
                      </td>
                      <td className="p-3 text-right font-black text-slate-900">
                        {formatCOP(solution.estimatedMaterialCostCOP)}
                      </td>
                    </tr>
                    {solution.recommendedPrimer && (
                      <tr className="bg-slate-50/50">
                        <td className="p-3 font-medium text-slate-800">
                          {solution.recommendedPrimer.name}
                          <span className="text-[10px] text-slate-500 block">Base selladora y fijadora</span>
                        </td>
                        <td className="p-3 text-slate-600">{solution.recommendedPrimer.line}</td>
                        <td className="p-3">1 mano</td>
                        <td className="p-3 font-semibold">{solution.gallonsPrimer} Galones</td>
                        <td className="p-3 text-right font-semibold text-slate-700">Incluido en kit</td>
                      </tr>
                    )}
                    {solution.recommendedPutty && (
                      <tr className="bg-slate-50/50">
                        <td className="p-3 font-medium text-slate-800">
                          {solution.recommendedPutty.name}
                          <span className="text-[10px] text-slate-500 block">Masillado y resane de fisuras</span>
                        </td>
                        <td className="p-3 text-slate-600">{solution.recommendedPutty.line}</td>
                        <td className="p-3">Resane</td>
                        <td className="p-3 font-semibold">{solution.kilosPutty} Kg</td>
                        <td className="p-3 text-right font-semibold text-slate-700">Incluido en kit</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-100 font-extrabold border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={4} className="p-3 text-right text-xs uppercase text-slate-700">
                        Total Estimado Materiales (COP):
                      </td>
                      <td className="p-3 text-right text-base text-slate-900 font-black">
                        {formatCOP(solution.estimatedMaterialCostCOP)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Warranty & Conditions Note */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                  <h4 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-700" />
                    Respaldo de Garantía de Fábrica
                  </h4>
                  <p className="text-emerald-900 text-[11px]">
                    Este proyecto cuenta con una garantía técnica de <strong>{solution.warrantyYears} Años</strong> expedida directamente por Pintuco® S.A. tras la aprobación del ensayo de calidad.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">
                    Condiciones Comerciales & Despacho
                  </h4>
                  <ul className="text-[10px] text-slate-600 space-y-0.5 list-disc pl-4">
                    <li>Precios con IVA incluido y flete estándar desde CEDI {assignedWarehouse.cediName}.</li>
                    <li>Disponibilidad de entrega sujeta a validación previa y apartado en bodega.</li>
                    <li>Medios de pago aceptados: PSE, Transferencia Bancolombia, Tarjeta y Crédito Constructor.</li>
                  </ul>
                </div>
              </div>

              {/* Authorization */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="space-y-1">
                  <div className="h-10 border-b border-slate-400 flex items-end justify-center pb-1">
                    <span className="font-semibold text-slate-800">Departamento Técnico Comercial ColorLink</span>
                  </div>
                  <strong className="text-slate-900 block text-[11px]">Pintuco® S.A.</strong>
                </div>

                <div className="space-y-1">
                  <div className="h-10 border-b border-slate-400 flex items-end justify-center pb-1">
                    <span className="font-semibold text-slate-800">{formData.identification.clientName}</span>
                  </div>
                  <strong className="text-slate-900 block text-[11px]">Aprobación y Firma de Aceptación del Cliente</strong>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Bottom Control Footer (Hidden when printing) */}
        <div className="sticky bottom-0 z-20 bg-slate-100 border-t border-slate-300 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg print:hidden">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Documento oficial con validez jurídica • Pintuco® S.A.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handlePrint}
              id="btn-print-doc-bottom"
              className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar en PDF</span>
            </button>
            <button
              type="button"
              onClick={handleOpenInNewTab}
              id="btn-open-tab-doc-bottom"
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
              title="Abrir en pestaña completa e imprimir directamente"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">Abrir en Nueva Pestaña</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              id="btn-close-doc-bottom"
              className="flex-1 sm:flex-initial px-5 py-2 bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer"
            >
              <X className="w-4 h-4 text-rose-400" />
              <span>Cerrar</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
