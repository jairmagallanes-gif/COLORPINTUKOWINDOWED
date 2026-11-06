import React, { useState, useEffect } from 'react';
import { ProjectRecord, ProjectStatus, UserProfile, RolePermissionsMatrix, DeliveryUrgency } from '../types';
import { formatCOP } from '../utils/calculator';
import { 
  X, Printer, CheckCircle2, Building, ShieldCheck, Truck, User, Calendar, Droplet, 
  ArrowRight, Download, Award, FileText, Lock, Clock, AlertTriangle, XCircle, CreditCard, 
  PackageCheck, Check, Send, Sparkles, MapPin, Phone, History, AlertCircle, Store
} from 'lucide-react';
import { checkUserPermission, getRoleShortLabel, isClientUser, canValidatePaymentRole } from '../utils/rbac';
import { PrintableDocumentsModal } from './PrintableDocumentsModal';
import { getUrgencyConfig } from '../utils/urgencyUtils';
import { getChannelMetadata } from '../utils/channelUtils';
import { printElement } from '../utils/printHelper';

interface ProjectDetailModalProps {
  project: ProjectRecord | null;
  currentUser?: UserProfile | null;
  permissionsMatrix?: RolePermissionsMatrix;
  onClose: () => void;
  onUpdateStatus: (projectId: string, newStatus: ProjectStatus) => void;
  onProjectUpdated?: (updatedProject: ProjectRecord) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = (props) => {
  if (!props.project) return null;
  return <ProjectDetailModalContent {...props} project={props.project} />;
};

const ProjectDetailModalContent: React.FC<Omit<ProjectDetailModalProps, 'project'> & { project: ProjectRecord }> = ({
  project,
  currentUser,
  permissionsMatrix,
  onClose,
  onUpdateStatus,
  onProjectUpdated
}) => {
  // NOTE: Modal only closes when the user explicitly clicks the "Cerrar" button.
  // Backdrop click and accidental ESC key closing have been disabled per requirement.

  const canChangeStatus = checkUserPermission(currentUser || null, 'cambiar_estado_proyecto', permissionsMatrix);
  const isAdvisorOrAdmin = currentUser?.role === 'asesor' || currentUser?.role === 'administrador';
  const isClient = isClientUser(currentUser);
  const canValidatePayment = canValidatePaymentRole(currentUser);
  const canDispatch = currentUser?.email?.toLowerCase() === 'jairmagallanes@gmail.com';

  // Business verification: Warranty enabled only after purchase and verified payment
  const isPurchaseCompleted = project.quotationInfo?.clientDecision === 'aceptada' || 
    ['inventario_reservado', 'verificacion_pago', 'despacho_en_camino', 'calidad_aprobada', 'finalizado'].includes(project.status);

  const isPaymentConfirmed = Boolean(
    project.paymentVerification?.isVerified || 
    ['despacho_en_camino', 'calidad_aprobada', 'finalizado'].includes(project.status)
  );

  const isWarrantyEnabled = isPurchaseCompleted && isPaymentConfirmed;

  const [activeTab, setActiveTab] = useState<'workflow' | 'technical' | 'timeline'>('workflow');
  const [selectedPhase, setSelectedPhase] = useState<ProjectStatus>(
    project.status === 'cotizacion_rechazada' ? 'cotizacion_rechazada' : project.status
  );
  const [viewAllPhases, setViewAllPhases] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Local state for stock validation
  const [stockNotes, setStockNotes] = useState(project.stockValidation?.notes || 'Stock validado en CEDI para despacho.');
  
  // Local state for rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Local state for payment verification
  const [paymentMethodInput, setPaymentMethodInput] = useState<'transferencia_bancolombia' | 'pse' | 'tarjeta_credito' | 'credito_constructor_pintuco'>('transferencia_bancolombia');
  const [paymentRefInput, setPaymentRefInput] = useState(project.paymentVerification?.paymentReference || `TRF-BCOL-${Math.floor(100000 + Math.random() * 900000)}`);
  const [paymentAmountInput, setPaymentAmountInput] = useState<number>(project.solution.estimatedMaterialCostCOP);
  const [paymentNotesInput, setPaymentNotesInput] = useState(project.paymentVerification?.notes || 'Pago confirmado por Tesorería Central.');

  // Local state for dispatch
  const [carrierInput, setCarrierInput] = useState(project.dispatchInfo?.carrierName || 'Flota Logística Especializada Pintuco Express');
  const [trackingInput, setTrackingInput] = useState(project.dispatchInfo?.trackingNumber || `GUIA-PIN-${Math.floor(10000 + Math.random() * 90000)}`);
  const [vehiclePlateInput, setVehiclePlateInput] = useState(project.dispatchInfo?.vehiclePlate || 'WGL-492 (Camión 4.5 Ton)');
  const [driverContactInput, setDriverContactInput] = useState(project.dispatchInfo?.driverContact || 'Don Rodrigo Arboleda (+57 311 405 9920)');
  const [estDeliveryDateInput, setEstDeliveryDateInput] = useState(project.dispatchInfo?.estimatedDeliveryDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);

  useEffect(() => {
    setTrackingInput(project.dispatchInfo?.trackingNumber || `GUIA-PIN-${Math.floor(10000 + Math.random() * 90000)}`);
  }, [project.id, project.dispatchInfo?.trackingNumber]);

  useEffect(() => {
    setSelectedPhase(project.status === 'cotizacion_rechazada' ? 'cotizacion_rechazada' : project.status);
  }, [project.id, project.status]);

  // State for dedicated printable document modal
  const [printableDoc, setPrintableDoc] = useState<'warranty' | 'quotation' | 'dispatch' | null>(null);

  const { formData, solution, assignedWarehouse, serviceDispatch, qualityAssurance } = project;

  // Workflow steps map (7 Phases)
  const WORKFLOW_STEPS: { key: ProjectStatus; label: string; stepNumber: number; description: string; role: string }[] = [
    { key: 'capturado', label: '1. Radicado', stepNumber: 1, description: 'Requerimiento y Urgencia', role: 'Asesor Técnico Comercial' },
    { key: 'validacion_stock_previa', label: '2. Stock CEDI', stepNumber: 2, description: 'Validación en Bodega', role: 'Logística & CEDI Pintuco' },
    { key: 'cotizacion_enviada', label: '3. Cotización', stepNumber: 3, description: 'Enviada al Cliente', role: 'Asesor Comercial' },
    { key: 'inventario_reservado', label: '4. Aprobada & Stock', stepNumber: 4, description: 'Aceptación del Cliente', role: 'Cliente & Bodega CEDI' },
    { key: 'verificacion_pago', label: '5. Pago', stepNumber: 5, description: 'Validación Tesorería', role: 'Tesorería & Cartera Central' },
    { key: 'despacho_en_camino', label: '6. Despacho', stepNumber: 6, description: 'Materiales en Ruta', role: 'Despacho & Transporte CEDI' },
    { key: 'finalizado', label: '7. Finalizado', stepNumber: 7, description: 'Producto entregado al cliente', role: 'Logística & Cliente' }
  ];

  // Helper for delivery urgency label with rich badges
  const getDeliveryUrgencyBadge = () => {
    const rawUrgency = project.deliveryUrgency || formData.project.deliveryUrgency;
    const config = getUrgencyConfig(rawUrgency);
    const IconComp = config.icon;

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border font-black text-xs shadow-xs ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}>
        <span className={`w-2.5 h-2.5 rounded-full ${config.dotColor} ${config.level === 'critical' ? 'animate-pulse' : ''}`}></span>
        <IconComp className="w-4 h-4" />
        <span>{config.label}</span>
      </span>
    );
  };

  // API Call: Validate Stock in CEDI
  const handleValidateStock = async () => {
    setIsProcessing(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/validate-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedCedi: assignedWarehouse.cediName,
          availableGallons: 1200,
          requiredGallons: solution.gallonsPrimary,
          notes: stockNotes,
          validatedBy: currentUser?.name || 'Asesor Técnico Comercial Pintuco'
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setFeedback({ type: 'success', text: '¡Inventario en CEDI validado exitosamente! El stock está listo.' });
          if (onProjectUpdated) onProjectUpdated(json.data);
          onUpdateStatus(project.id, json.data.status);
        }
      }
    } catch (e) {
      console.error('Error validating stock:', e);
      setFeedback({ type: 'error', text: 'Error al registrar validación de stock.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // API Call: Client Decision (Accept or Reject)
  const handleClientDecision = async (decision: 'aceptada' | 'rechazada', reason?: string) => {
    setIsProcessing(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/client-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          reason: reason || rejectionReasonInput,
          authorName: currentUser?.name || formData.identification.clientName || 'Cliente'
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          if (decision === 'aceptada') {
            setFeedback({ type: 'success', text: '¡Cotización aceptada por el cliente! Stock reservado formalmente en CEDI. Siguiente paso: Verificación de Pago.' });
          } else {
            setFeedback({ type: 'error', text: 'La cotización ha sido rechazada por el cliente. El proceso ha finalizado según las políticas de Pintuco.' });
            setShowRejectModal(false);
          }
          if (onProjectUpdated) onProjectUpdated(json.data);
          onUpdateStatus(project.id, json.data.status);
        }
      }
    } catch (e) {
      console.error('Error in client decision:', e);
      setFeedback({ type: 'error', text: 'Error al registrar la decisión del cliente.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // API Call: Verify Payment
  const handleVerifyPayment = async (isVerified: boolean) => {
    setIsProcessing(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: paymentMethodInput,
          paymentReference: paymentRefInput,
          paymentAmountCOP: paymentAmountInput,
          paymentDate: new Date().toISOString(),
          isVerified,
          verifiedBy: currentUser?.name || 'Tesorería Pintuco Central',
          notes: paymentNotesInput
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setFeedback({
            type: 'success',
            text: isVerified 
              ? '¡Pago verificado y aprobado por Tesorería! Pedido liberado para despacho logístico y Póliza de Garantía oficial habilitada.'
              : 'Comprobante de pago registrado. Pendiente de aprobación contable en Tesorería.'
          });
          if (onProjectUpdated) onProjectUpdated(json.data);
        }
      }
    } catch (e) {
      console.error('Error verifying payment:', e);
      setFeedback({ type: 'error', text: 'Error al registrar verificación de pago.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // API Call: Dispatch Materials / In-Store Pickup Preparation
  const handleDispatch = async () => {
    setIsProcessing(true);
    setFeedback(null);
    const isStorePickup = formData.project.deliveryMethod === 'retiro_tienda';
    try {
      const res = await fetch(`/api/projects/${project.id}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrierName: isStorePickup
            ? (formData.project.pickupStoreOrCedi || 'Tienda Pintacasa Pintuco')
            : carrierInput,
          trackingNumber: trackingInput,
          vehiclePlate: isStorePickup ? 'RETIRO-MOSTRADOR' : vehiclePlateInput,
          driverContact: isStorePickup
            ? (formData.project.pickupAuthorizedPerson || formData.client.name || 'Cliente Autorizado')
            : driverContactInput,
          estimatedDeliveryDate: estDeliveryDateInput,
          deliveryAddress: isStorePickup
            ? (formData.project.pickupStoreOrCedi || 'Tienda Pintacasa Autorizada')
            : (formData.project.address || `${formData.project.city}`),
          authorName: currentUser?.name || (isStorePickup ? 'Encargado Tienda Pintacasa' : 'Logística & Despacho CEDI'),
          authorEmail: currentUser?.email
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.dispatchInfo?.trackingNumber) setTrackingInput(json.data.dispatchInfo.trackingNumber);
          setFeedback({ 
            type: 'success', 
            text: isStorePickup 
              ? `¡Materiales listos para entrega en mostrador! Código de Retiro: ${json.data.dispatchInfo?.trackingNumber || trackingInput}.`
              : `¡Materiales despachados en ruta con Guía ${json.data.dispatchInfo?.trackingNumber || trackingInput}! Transporte en camino hacia la obra.` 
          });
          if (onProjectUpdated) onProjectUpdated(json.data);
        }
      } else {
        const errJson = await res.json();
        setFeedback({ type: 'error', text: errJson.error || 'No se puede despachar sin previa verificación de pago.' });
      }
    } catch (e) {
      console.error('Error dispatching:', e);
      setFeedback({ type: 'error', text: 'Error al procesar el despacho de materiales.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDelivery = async () => {
    setIsProcessing(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/confirm-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorEmail: currentUser?.email,
          authorName: currentUser?.name,
          receivedByName: formData.identification.clientName
        })
      });
      const payload = await res.json();
      if (!res.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || 'No se pudo confirmar la entrega.');
      }
      onProjectUpdated?.(payload.data);
      setSelectedPhase('finalizado');
      setFeedback({ type: 'success', text: 'Entrega confirmada. Se notificó al cliente y al administrador por correo y en la bandeja de notificaciones.' });
    } catch (error: any) {
      setFeedback({ type: 'error', text: error?.message || 'No se pudo confirmar la entrega.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div 
        id="project-detail-modal-card"
        className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden my-auto flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            id="btn-close-project-modal-top"
            className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-600/90 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-98"
          >
            <X className="w-4 h-4" />
            <span>Cerrar</span>
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-400 text-blue-950 font-black flex items-center justify-center text-xl shadow-md">
                CL
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-amber-300 text-xs sm:text-sm bg-amber-400/15 px-2.5 py-0.5 rounded-md border border-amber-400/30">
                    RADICADO: {project.id}
                  </span>
                  {(() => {
                    const channelKey = project.channel || project.formData?.identification?.channel || 'web_portal';
                    const chMeta = getChannelMetadata(channelKey);
                    const ChannelIcon = chMeta.icon;
                    return (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-black border ${chMeta.badgeBg} ${chMeta.badgeText} ${chMeta.badgeBorder}`}>
                        <ChannelIcon className="w-3.5 h-3.5" />
                        <span>Canal: {chMeta.shortLabel}</span>
                      </span>
                    );
                  })()}
                  <span className="text-xs text-slate-300">
                    Radicado: {new Date(project.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <h3 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
                  {formData.identification.clientName}
                </h3>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPrintableDoc('quotation')}
                className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Cotización</span>
              </button>
              {isWarrantyEnabled ? (
                <button
                  type="button"
                  id="btn-print-warranty-active"
                  onClick={() => setPrintableDoc('warranty')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
                  title="Póliza de Garantía Pintuco activa y respaldada por pago verificado"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Imprimir Póliza & Garantía</span>
                  <span className="text-[10px] bg-emerald-800 text-white px-1.5 py-0.2 rounded font-black">✓ Activa</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-print-warranty-locked"
                  onClick={() => {
                    setFeedback({
                      type: 'error',
                      text: !isPurchaseCompleted 
                        ? '🔒 La Póliza de Calidad y Garantía se habilitará cuando el cliente apruebe la compra (Fase 4) y el pago se vea reflejado y verificado en Tesorería (Fase 5).'
                        : '🔒 La Póliza de Calidad y Garantía se habilitará cuando el pago de la compra se vea reflejado y verificado por Tesorería (Fase 5).'
                    });
                    setPrintableDoc('warranty');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                  title="Póliza inhabilitada: se activa tras compra formal y pago verificado por Tesorería"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Póliza & Garantía</span>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.2 rounded font-semibold">
                    {!isPurchaseCompleted ? 'Requiere Compra' : 'Requiere Pago'}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  printElement('project-detail-modal-card', {
                    documentTitle: `Ficha_Tecnica_Proyecto_${project.id}`
                  });
                }}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer active:scale-98"
                title="Imprimir ficha completa de trazabilidad"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Ficha Completa</span>
              </button>
            </div>
          </div>

          {/* Stepper of 8 Real-World Stages */}
          <div className="mt-5 pt-4 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <div>
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block sm:inline mr-2">
                  Fases de Trazabilidad & Estado de Obra:
                </span>
                <span className="text-[11px] text-slate-400">
                  (Haz clic en cualquiera de las fases para ver su contenido y detalle)
                </span>
              </div>
              {project.status === 'cotizacion_rechazada' ? (
                <span className="text-xs font-bold text-red-300 bg-red-500/20 px-2.5 py-0.5 rounded border border-red-500/40 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                  Proceso Terminado (Cotización Rechazada por Cliente)
                </span>
              ) : (
                <span className="text-[11px] text-amber-300 font-medium">
                  Estado Oficial: <strong className="text-white capitalize">{project.status.replace(/_/g, ' ')}</strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 text-center text-xs">
              {WORKFLOW_STEPS.map((s) => {
                const isInspecting = selectedPhase === s.key;
                const isCurrentStatus = project.status === s.key;
                const isPast = WORKFLOW_STEPS.findIndex(x => x.key === project.status) > WORKFLOW_STEPS.findIndex(x => x.key === s.key);
                
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => {
                      setSelectedPhase(s.key);
                      setActiveTab('workflow');
                    }}
                    className={`p-2 rounded-xl transition-all border text-left flex flex-col justify-between cursor-pointer relative group ${
                      isInspecting
                        ? 'bg-amber-400 text-blue-950 font-black border-amber-300 ring-2 ring-white shadow-lg scale-[1.02]'
                        : isCurrentStatus
                        ? 'bg-amber-400/20 text-amber-300 border-amber-400/50 hover:bg-amber-400/30'
                        : isPast
                        ? 'bg-blue-800/60 text-emerald-300 border-blue-700/50 hover:bg-blue-800/80'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={`text-[9px] uppercase tracking-wider font-extrabold ${isInspecting ? 'text-blue-950' : 'opacity-80'}`}>
                        Fase {s.stepNumber}
                      </span>
                      {isInspecting && (
                        <span className="text-[8px] px-1 py-0.2 bg-blue-950 text-amber-300 rounded font-black">
                          VIENDO
                        </span>
                      )}
                      {!isInspecting && isCurrentStatus && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                      )}
                      {!isInspecting && isPast && (
                        <span className="text-[9px] text-emerald-400 font-bold">✓</span>
                      )}
                    </div>
                    <div className="text-[11px] font-bold leading-tight line-clamp-1">
                      {s.label.split('. ')[1]}
                    </div>
                    <div className={`text-[9px] mt-0.5 truncate ${isInspecting ? 'text-blue-900 font-semibold' : 'text-slate-400'}`}>
                      {s.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Tabs inside modal */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('workflow')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'workflow' ? 'bg-amber-400 text-blue-950' : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              🔄 Flujo Operativo & Validaciones
            </button>
            <button
              onClick={() => setActiveTab('technical')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'technical' ? 'bg-amber-400 text-blue-950' : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              📋 Especificación Técnica & Prescripción
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'timeline' ? 'bg-amber-400 text-blue-950' : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              🕒 Línea de Tiempo & Trazabilidad ({project.timelineEvents?.length || 0})
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-4 mx-6 mt-4 rounded-xl flex items-center justify-between gap-3 text-xs font-bold ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' : 'bg-red-50 text-red-900 border border-red-300'
          }`}>
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
              <span>{feedback.text}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100 font-black">✕</button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[72vh] overflow-y-auto">
          
          {/* TAB 1: WORKFLOW & ACTIONS */}
          {activeTab === 'workflow' && (
            <div className="space-y-6">
              
              {/* Phase Inspector Navigation Bar */}
              <div className="p-4 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white rounded-2xl shadow-md border border-blue-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-blue-950 flex items-center justify-center font-black text-base shadow-sm">
                    {WORKFLOW_STEPS.find(s => s.key === selectedPhase)?.stepNumber || '•'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300">
                        Inspeccionando Fase {WORKFLOW_STEPS.find(s => s.key === selectedPhase)?.stepNumber} de 7
                      </span>
                      {selectedPhase === project.status && (
                        <span className="text-[9px] px-2 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 font-bold">
                          📍 Estado Oficial del Proyecto
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-extrabold text-white">
                      {WORKFLOW_STEPS.find(s => s.key === selectedPhase)?.label.split('. ')[1]} - {WORKFLOW_STEPS.find(s => s.key === selectedPhase)?.description}
                    </h4>
                    <span className="text-[11px] text-slate-300">
                      Área Responsable: <strong className="text-amber-200">{WORKFLOW_STEPS.find(s => s.key === selectedPhase)?.role}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Prev Step Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const curIdx = WORKFLOW_STEPS.findIndex(s => s.key === selectedPhase);
                      if (curIdx > 0) setSelectedPhase(WORKFLOW_STEPS[curIdx - 1].key);
                    }}
                    disabled={WORKFLOW_STEPS.findIndex(s => s.key === selectedPhase) === 0}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    ← Fase Anterior
                  </button>

                  {/* Next Step Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const curIdx = WORKFLOW_STEPS.findIndex(s => s.key === selectedPhase);
                      if (curIdx < WORKFLOW_STEPS.length - 1) setSelectedPhase(WORKFLOW_STEPS[curIdx + 1].key);
                    }}
                    disabled={WORKFLOW_STEPS.findIndex(s => s.key === selectedPhase) === WORKFLOW_STEPS.length - 1}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Fase Siguiente →
                  </button>

                  {/* View All Toggle */}
                  <button
                    type="button"
                    onClick={() => setViewAllPhases(!viewAllPhases)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewAllPhases 
                        ? 'bg-amber-400 text-blue-950 font-black shadow-xs' 
                        : 'bg-white/10 hover:bg-white/20 text-slate-200'
                    }`}
                  >
                    {viewAllPhases ? '👁️ Viendo Todas las Fases' : 'Ver Todas las Fases Juntas'}
                  </button>
                </div>
              </div>

              {/* Status Alert if project was rejected */}
              {project.status === 'cotizacion_rechazada' && (
                <div className="p-6 bg-red-50 border-2 border-red-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2.5 text-red-900">
                    <XCircle className="w-6 h-6 text-red-600 shrink-0" />
                    <h4 className="text-base font-extrabold">Flujo del Proyecto Concluido (Cotización Rechazada)</h4>
                  </div>
                  <p className="text-xs text-red-800 leading-relaxed">
                    El cliente decidió no aceptar la cotización económica y técnica. El proceso ha finalizado y no se realizarán reservas de inventario ni despachos.
                  </p>
                  {project.quotationInfo?.rejectionReason && (
                    <div className="p-3 bg-white/80 border border-red-200 rounded-xl text-xs text-red-950 font-medium">
                      <strong>Motivo de Rechazo Registrado:</strong> "{project.quotationInfo.rejectionReason}"
                    </div>
                  )}
                  {canChangeStatus && (
                    <button
                      onClick={() => {
                        onUpdateStatus(project.id, 'capturado');
                        setSelectedPhase('capturado');
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Reabrir Proyecto para Nueva Cotización
                    </button>
                  )}
                </div>
              )}

              {/* PHASE 1: RADICADO & URGENCIA DE MATERIALES */}
              {(viewAllPhases || selectedPhase === 'capturado') && (
                <div className="p-6 bg-white border-2 border-blue-100 rounded-2xl shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-black text-sm">
                        1
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">
                          Fase 1: Radicación & Captura del Requerimiento en Obra
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Recepción inicial, diagnóstico de superficie y tiempo requerido para despacho.
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1 w-fit">
                      <Check className="w-3.5 h-3.5" /> Radicado Exitosamente
                    </span>
                  </div>

                  {/* Delivery Urgency Highlight */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 font-bold block">Tiempo Requerido por el Cliente para Materiales:</span>
                        <h5 className="text-xs font-black text-slate-900">
                          Fecha estimada en obra: {formData.project.requiredDate}
                        </h5>
                      </div>
                    </div>
                    <div>
                      {getDeliveryUrgencyBadge()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">Cliente / Razón Social:</span>
                      <span className="font-bold text-slate-900">{formData.identification.clientName}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">NIT / Cédula:</span>
                      <span className="font-bold text-slate-900">{formData.identification.nit || 'No registrado'}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">Ciudad de la Obra:</span>
                      <span className="font-bold text-slate-900">{formData.project.city}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">Área a Pintar:</span>
                      <span className="font-extrabold text-blue-800">{formData.project.areaM2} m² ({formData.project.projectType})</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">Superficie & Ambiente:</span>
                      <span className="font-semibold text-slate-800 capitalize">{formData.technical.surfaceType} ({formData.technical.environment})</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">Condición del Sustrato:</span>
                      <span className="font-semibold text-slate-800 capitalize">{formData.technical.condition}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 block text-[11px]">Canal de Captura & Radicación:</span>
                      {(() => {
                        const channelKey = project.channel || project.formData?.identification?.channel || 'web_portal';
                        const chMeta = getChannelMetadata(channelKey);
                        const ChannelIcon = chMeta.icon;
                        return (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${chMeta.badgeBg} ${chMeta.badgeText} ${chMeta.badgeBorder}`}>
                              <ChannelIcon className="w-3 h-3" />
                              {chMeta.label}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {formData.evidence.description && (
                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs">
                      <span className="font-bold text-blue-950 block mb-1">Descripción o requerimiento del cliente:</span>
                      <p className="text-slate-700 italic">"{formData.evidence.description}"</p>
                    </div>
                  )}

                  {canChangeStatus && project.status !== 'capturado' && (
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(project.id, 'capturado')}
                        className="px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 border border-blue-300 rounded-xl cursor-pointer"
                      >
                        Revertir Estado Oficial a Radicado
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* PHASE 2: STOCK CEDI VALIDATION (AUTOMATED) */}
              {(viewAllPhases || selectedPhase === 'validacion_stock_previa') && (
                <div className="p-6 rounded-2xl border-2 transition-all space-y-4 bg-emerald-50/40 border-emerald-300 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                        2
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">
                          Fase 2: Validación Automatizada de Stock en CEDI Pintuco
                        </h4>
                        <span className="text-[11px] text-slate-600">
                          Verificación en tiempo real conectada al inventario del CEDI regional para garantizar despacho en 24-48h.
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black flex items-center gap-1.5 w-fit shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Stock Confirmado Automáticamente
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-slate-500 block text-[11px]">CEDI Pintuco Regional:</span>
                      <span className="font-bold text-slate-900">{assignedWarehouse.cediName}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Despacho estándar en 24-48h</span>
                    </div>
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-slate-500 block text-[11px]">Volumen Requerido:</span>
                      <span className="font-black text-blue-900">{solution.gallonsPrimary} Galones</span>
                      <span className="text-[10px] text-slate-600 block mt-0.5">({solution.bucketsPrimary} Cuñetes + {solution.remainderGallonsPrimary}G)</span>
                    </div>
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-slate-500 block text-[11px]">Inventario en Bodega:</span>
                      <span className="font-black text-emerald-700">1,200 Galones Listos</span>
                      <span className="text-[10px] text-emerald-600 block mt-0.5">Capacidad suficiente garantizada</span>
                    </div>
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-slate-500 block text-[11px]">Código de Reserva:</span>
                      <span className="font-mono font-bold text-slate-800">{assignedWarehouse.reservationCode || 'RES-PIN-AUTO-948'}</span>
                      <span className="text-[10px] text-blue-700 block mt-0.5 font-semibold">Reserva WMS Activa</span>
                    </div>
                  </div>

                  {/* Automated Confirmation Card */}
                  <div className="p-4 bg-white rounded-xl border border-emerald-300 text-xs text-slate-800 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-extrabold text-emerald-950 text-xs">
                          Confirmación de Disponibilidad en Línea (Sistema CEDI Pintuco®)
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {project.stockValidation?.validatedAt ? new Date(project.stockValidation.validatedAt).toLocaleString('es-CO') : 'Verificado en tiempo real'}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      El sistema WMS de Pintuco® ha verificado y reservado automáticamente el stock de <strong>{solution.gallonsPrimary} galones</strong> de <em>{solution.recommendedPrimaryProduct.name}</em> en la sede <strong>{assignedWarehouse.cediName}</strong>. El pedido cuenta con disponibilidad inmediata y no requiere gestiones manuales adicionales.
                    </p>
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Lote certificado de fábrica listo para tintometría y cargue.
                      </span>
                      <span className="bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded text-[10px]">
                        100% Stock Garantizado
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* PHASE 3: COTIZACIÓN FORMAL */}
              {(viewAllPhases || selectedPhase === 'cotizacion_enviada') && (
                <div className="p-6 bg-white border-2 border-amber-200 rounded-2xl shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-black text-sm">
                        3
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">
                          Fase 3: Cotización Técnico-Económica Formal
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Oferta comercial generada con precios de lista Pintuco®, rendimiento por $m^2$ y vigencia.
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">Total Cotizado:</span>
                      <span className="text-base font-black text-slate-900">{formatCOP(solution.estimatedMaterialCostCOP)}</span>
                    </div>
                  </div>

                  {/* Products table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Material / Prescripción</th>
                          <th className="p-3">Manos</th>
                          <th className="p-3">Volumen</th>
                          <th className="p-3">Garantía</th>
                          <th className="p-3 text-right">Subtotal Estimado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr className="bg-white">
                          <td className="p-3">
                            <span className="font-extrabold text-slate-900 block">{solution.recommendedPrimaryProduct.name}</span>
                            <span className="text-[10px] text-slate-500">{solution.recommendedPrimaryProduct.line}</span>
                          </td>
                          <td className="p-3 font-semibold">{solution.coatsRecommended} manos</td>
                          <td className="p-3 font-bold text-blue-900">{solution.gallonsPrimary} Galones</td>
                          <td className="p-3 font-bold text-amber-700">{solution.warrantyYears} Años</td>
                          <td className="p-3 text-right font-black text-slate-900">{formatCOP(solution.estimatedMaterialCostCOP)}</td>
                        </tr>
                        {solution.recommendedPrimer && (
                          <tr className="bg-slate-50/50">
                            <td className="p-3 font-medium text-slate-800">{solution.recommendedPrimer.name}</td>
                            <td className="p-3">1 mano</td>
                            <td className="p-3 font-semibold">{solution.gallonsPrimer} Galones</td>
                            <td className="p-3 text-slate-400">-</td>
                            <td className="p-3 text-right font-semibold text-slate-700">Incluido en kit</td>
                          </tr>
                        )}
                        {solution.recommendedPutty && (
                          <tr className="bg-slate-50/50">
                            <td className="p-3 font-medium text-slate-800">{solution.recommendedPutty.name}</td>
                            <td className="p-3">Resane</td>
                            <td className="p-3 font-semibold">{solution.kilosPutty} Kg</td>
                            <td className="p-3 text-slate-400">-</td>
                            <td className="p-3 text-right font-semibold text-slate-700">Incluido en kit</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-center justify-between">
                    <div>
                      <span className="font-bold block">Condiciones de la Oferta Comercial:</span>
                      <span>Vigencia de 15 días calendario. Despacho directo desde CEDI {assignedWarehouse.cediName}.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPrintableDoc('quotation')}
                      className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimir Cotización Oficial</span>
                    </button>
                  </div>
                </div>
              )}

              {/* PHASE 4: CLIENT DECISION & RESERVATION */}
              {(viewAllPhases || selectedPhase === 'inventario_reservado') && (
                <div className="p-6 bg-white border-2 border-emerald-200 rounded-2xl shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
                        4
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">
                          Fase 4: Decisión del Cliente & Apartado de Lote en CEDI
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Aceptación formal de la cotización por parte del cliente o rechazo que finaliza el proceso.
                        </span>
                      </div>
                    </div>

                    {project.quotationInfo?.clientDecision === 'aceptada' ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-xs flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Cotización Aprobada por Cliente
                      </span>
                    ) : project.status === 'cotizacion_rechazada' ? (
                      <span className="px-3 py-1 rounded-full bg-red-100 text-red-900 font-extrabold text-xs flex items-center gap-1 w-fit">
                        <XCircle className="w-3.5 h-3.5 text-red-600" /> Cotización Rechazada (Fin)
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs w-fit">
                        Pendiente Decisión del Cliente
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Si el cliente <strong>acepta</strong> la cotización, se emite la reserva formal de lote de inventario en el CEDI y se habilita el módulo de pago. Si el cliente <strong>rechaza</strong>, el proceso se cierra formalmente sin compromisos operativos.
                  </p>

                  {/* Decision action: ONLY CLIENTS CAN APPROVE OR REJECT */}
                  {isClient ? (
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      {project.status !== 'cotizacion_rechazada' && project.quotationInfo?.clientDecision !== 'aceptada' && (
                        <>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleClientDecision('aceptada')}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Aprobar Cotización (Cliente Acepta)</span>
                          </button>

                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => setShowRejectModal(true)}
                            className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-300 flex items-center gap-2 cursor-pointer transition-all"
                          >
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span>Rechazar Cotización (Terminar Proceso)</span>
                          </button>
                        </>
                      )}

                      {project.quotationInfo?.clientDecision === 'aceptada' && (
                        <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Has aprobado formalmente esta propuesta. Procede a la Fase 5 para coordinar el pago.</span>
                        </div>
                      )}

                      {project.stockReservationCode && (
                        <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs">
                          <span className="text-slate-500 block text-[10px]">Código de Reserva en CEDI:</span>
                          <span className="font-mono font-black text-blue-900">{project.stockReservationCode}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 text-slate-700">
                        <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <span className="font-extrabold text-slate-900 block">Decisión Exclusiva del Cliente</span>
                          <span className="text-slate-500 text-[11px]">
                            {project.quotationInfo?.clientDecision === 'aceptada'
                              ? 'El cliente ya aprobó formalmente esta cotización. El lote de inventario está apartado en el CEDI.'
                              : project.status === 'cotizacion_rechazada'
                              ? 'El cliente rechazó la cotización. El proceso ha finalizado.'
                              : 'Esta acción está reservada exclusivamente para el Cliente (Hogar / Empresa). Esperando respuesta del cliente titular.'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {project.stockReservationCode && (
                          <div className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-[11px] font-mono font-bold text-blue-900">
                            Reserva: {project.stockReservationCode}
                          </div>
                        )}
                        <span className="px-3 py-1 bg-amber-100 text-amber-900 font-bold rounded-lg text-[11px] whitespace-nowrap">
                          {project.quotationInfo?.clientDecision === 'aceptada' ? '✓ Aprobada por Cliente' : '⏳ Pendiente Cliente'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PHASE 5: PAYMENT VERIFICATION */}
              {(viewAllPhases || selectedPhase === 'verificacion_pago') && (
                <div className={`p-6 rounded-2xl border-2 transition-all space-y-4 ${
                  project.paymentVerification?.isVerified 
                    ? 'bg-emerald-50/40 border-emerald-300' 
                    : selectedPhase === 'verificacion_pago'
                    ? 'bg-white border-amber-300 ring-2 ring-amber-400'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-black text-sm">
                        5
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">
                          Fase 5: Verificación de Pago (Tesorería Central & Asesores Pintuco)
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Validación de fondos o cupo constructor previo a la emisión de orden de despacho.
                        </span>
                      </div>
                    </div>

                    {project.paymentVerification?.isVerified ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Pago Confirmado & Aprobado
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold w-fit">
                        Pendiente Verificación de Pago
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Medio de Pago:</label>
                      <select
                        value={paymentMethodInput}
                        disabled={!canValidatePayment && project.paymentVerification?.isVerified}
                        onChange={(e: any) => setPaymentMethodInput(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-medium outline-none disabled:bg-slate-50"
                      >
                        <option value="transferencia_bancolombia">Transferencia Bancolombia / QR</option>
                        <option value="pse">PSE Pagos en Línea</option>
                        <option value="credito_constructor_pintuco">Crédito Constructor Pintuco B2B</option>
                        <option value="tarjeta_credito">Tarjeta de Crédito / Débito</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">N° Comprobante / Referencia:</label>
                      <input
                        type="text"
                        value={paymentRefInput}
                        disabled={!canValidatePayment && project.paymentVerification?.isVerified}
                        onChange={(e) => setPaymentRefInput(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-mono font-bold outline-none disabled:bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Monto Pagado (COP):</label>
                      <input
                        type="number"
                        value={paymentAmountInput}
                        disabled={!canValidatePayment && project.paymentVerification?.isVerified}
                        onChange={(e) => setPaymentAmountInput(Number(e.target.value))}
                        className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold outline-none disabled:bg-slate-50"
                      />
                    </div>
                  </div>

                  {/* Payment Verification Actions: ONLY ADVISORS, ADMINS, CONTRACTORS CAN VALIDATE */}
                  {canValidatePayment ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <div className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">Rol Autorizado ({getRoleShortLabel(currentUser?.role)}):</span> Puedes validar y confirmar el pago para liberar el despacho.
                      </div>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleVerifyPayment(true)}
                        className="w-full sm:w-auto px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <Check className="w-4 h-4" />
                        <span>Validar y Confirmar Pago (Aprobar Despacho)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 text-slate-700">
                        <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                        <div>
                          <span className="font-extrabold text-slate-900 block">Validación Contable Restringida</span>
                          <span className="text-slate-500 text-[11px]">
                            {project.paymentVerification?.isVerified
                              ? `Pago verificado por ${project.paymentVerification.verifiedBy || 'Asesor/Tesorería Pintuco'}. El despacho está autorizado.`
                              : 'La validación y aprobación final del pago es potestad exclusiva de Asesores Comerciales, Administradores o Contratistas certificados de Pintuco.'}
                          </span>
                        </div>
                      </div>

                      {!project.paymentVerification?.isVerified && (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleVerifyPayment(false)}
                          className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold rounded-xl border border-blue-200 cursor-pointer text-xs flex items-center gap-1.5 self-start sm:self-auto"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Registrar / Reportar Comprobante</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Status Banner for Warranty Enabled by Payment */}
                  <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    project.paymentVerification?.isVerified
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-amber-50/70 border-amber-300 text-amber-950'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      {project.paymentVerification?.isVerified ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <div>
                        <span className="font-extrabold block">
                          {project.paymentVerification?.isVerified
                            ? 'Póliza de Calidad & Garantía Habilitada'
                            : 'Póliza de Garantía en Espera de Pago'}
                        </span>
                        <span className={`text-[11px] ${project.paymentVerification?.isVerified ? 'text-emerald-800' : 'text-amber-800'}`}>
                          {project.paymentVerification?.isVerified
                            ? 'El pago ya se encuentra reflejado y validado en Tesorería. La póliza oficial Pintuco® está activa y lista para expedición.'
                            : 'La póliza oficial de garantía y calidad se desbloqueará de forma automática una vez confirmado el pago contable.'}
                        </span>
                      </div>
                    </div>

                    {project.paymentVerification?.isVerified && (
                      <button
                        type="button"
                        onClick={() => setPrintableDoc('warranty')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer active:scale-98"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Ver Póliza Oficial</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* PHASE 6: DISPATCH / STORE PICKUP */}
              {(viewAllPhases || selectedPhase === 'despacho_en_camino') && (
                <div className={`p-6 rounded-2xl border-2 transition-all space-y-4 ${
                  project.dispatchInfo?.isDispatched
                    ? 'bg-blue-50/40 border-blue-300'
                    : 'bg-white border-purple-200 shadow-xs'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-black text-sm">
                        6
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <span>
                            {formData.project.deliveryMethod === 'retiro_tienda'
                              ? 'Fase 6: Alistamiento & Retiro en Tienda Pintacasa / CEDI'
                              : 'Fase 6: Despacho & Envío Logístico de Materiales hacia la Obra'}
                          </span>
                          {formData.project.deliveryMethod === 'retiro_tienda' ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center gap-1">
                              <Store className="w-3 h-3" /> Retiro en Mostrador
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 font-bold text-[10px] flex items-center gap-1">
                              <Truck className="w-3 h-3" /> Envío a Obra
                            </span>
                          )}
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          {formData.project.deliveryMethod === 'retiro_tienda'
                            ? 'Preparación de materiales en punto de venta, emisión de código PIN para mostrador y acta de entrega.'
                            : 'Emisión de remisión de cargue, asignación de vehículo y seguimiento de la guía de transporte.'}
                        </span>
                      </div>
                    </div>

                    {project.dispatchInfo?.isDispatched ? (
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-black flex items-center gap-1 w-fit">
                        {formData.project.deliveryMethod === 'retiro_tienda' ? (
                          <>
                            <Store className="w-3.5 h-3.5 text-blue-700" /> Listo para Retiro en Tienda
                          </>
                        ) : (
                          <>
                          <Truck className="w-3.5 h-3.5 text-blue-700" /> {project.status === 'finalizado' ? 'Producto Entregado al Cliente' : 'Materiales en Ruta hacia Obra'}
                          </>
                        )}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-bold w-fit">
                        {formData.project.deliveryMethod === 'retiro_tienda'
                          ? 'Pendiente de Alistamiento en Tienda'
                          : 'Pendiente de Despacho'}
                      </span>
                    )}
                  </div>

                  {formData.project.deliveryMethod === 'retiro_tienda' ? (
                    /* In-Store Pickup Specific Controls */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div className="lg:col-span-2">
                        <label className="block text-slate-700 font-bold mb-1">
                          Punto Pintacasa / Tienda Seleccionada:
                        </label>
                        <div className="p-2.5 border border-amber-300 rounded-xl bg-amber-50/50 font-bold text-slate-800 flex items-center gap-2">
                          <Store className="w-4 h-4 text-amber-700 shrink-0" />
                          <span className="truncate">{formData.project.pickupStoreOrCedi || 'Pintacasa Pintuco Central'}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          Código PIN de Retiro:
                        </label>
                        <input
                          type="text"
                          value={trackingInput}
                          onChange={(e) => setTrackingInput(e.target.value)}
                          placeholder="RET-PIN-XXXX"
                          className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-mono font-black text-blue-900 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          Persona Autorizada para Retirar:
                        </label>
                        <input
                          type="text"
                          value={driverContactInput}
                          onChange={(e) => setDriverContactInput(e.target.value)}
                          placeholder="Nombre y Cédula"
                          className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-medium outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Standard Truck Shipping Controls */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Transportadora:</label>
                        <input
                          type="text"
                          value={carrierInput}
                          onChange={(e) => setCarrierInput(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-medium outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">N° Guía / Tracking:</label>
                        <input
                          type="text"
                          value={trackingInput}
                          onChange={(e) => setTrackingInput(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-mono font-bold outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Placa Vehículo:</label>
                        <input
                          type="text"
                          value={vehiclePlateInput}
                          onChange={(e) => setVehiclePlateInput(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Conductor / Contacto:</label>
                        <input
                          type="text"
                          value={driverContactInput}
                          onChange={(e) => setDriverContactInput(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-xl bg-white outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <div className="text-xs text-slate-600">
                      <span className="font-bold text-slate-900">
                        {formData.project.deliveryMethod === 'retiro_tienda' ? 'Sede de Retiro:' : 'Destino de Entrega:'}
                      </span>{' '}
                      {formData.project.deliveryMethod === 'retiro_tienda'
                        ? (formData.project.pickupStoreOrCedi || 'Tienda Pintacasa')
                        : (formData.project.address || `${formData.project.city}`)}
                    </div>

                    {canDispatch && <button
                      type="button"
                      disabled={isProcessing || !project.paymentVerification?.isVerified}
                      onClick={handleDispatch}
                      className={`px-5 py-2.5 font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                        project.paymentVerification?.isVerified
                          ? 'bg-[#FF6B35] hover:bg-[#E85520] text-white'
                          : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {formData.project.deliveryMethod === 'retiro_tienda' ? (
                        <>
                          <Store className="w-4 h-4" />
                          <span>
                            {project.dispatchInfo?.isDispatched
                              ? 'Actualizar Datos de Retiro'
                              : 'Confirmar Listo para Retiro en Tienda'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>
                            {project.dispatchInfo?.isDispatched
                              ? 'Actualizar Datos de Despacho'
                              : 'Confirmar Despacho en Ruta'}
                          </span>
                        </>
                      )}
                    </button>}
                  </div>
                </div>
              )}

              {(viewAllPhases || selectedPhase === 'finalizado') && (
                <div className={`rounded-2xl border-2 p-6 space-y-3 ${project.status === 'finalizado' ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 font-black text-emerald-900">7</div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">Fase 7: Producto entregado</h4>
                        <p className="text-[11px] text-slate-600">Cierre del seguimiento cuando el cliente recibe el pedido.</p>
                      </div>
                    </div>
                    {project.status === 'finalizado' ? (
                      <span className="rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-900">Entrega confirmada</span>
                    ) : project.dispatchInfo?.isDispatched ? (
                      <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">Pendiente de entrega en destino</span>
                    ) : (
                      <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">Pendiente de despacho</span>
                    )}
                  </div>
                  {project.status === 'finalizado' && (
                    <p className="text-xs text-emerald-900">
                      Recibido por <strong>{project.dispatchInfo?.receivedByName || formData.identification.clientName}</strong>
                      {project.dispatchInfo?.deliveredAt ? ` el ${new Date(project.dispatchInfo.deliveredAt).toLocaleString('es-CO')}` : ''}.
                      {project.dispatchInfo?.trackingNumber ? ` Guía ${project.dispatchInfo.trackingNumber}.` : ''}
                    </p>
                  )}
                  {canDispatch && project.dispatchInfo?.isDispatched && project.status !== 'finalizado' && (
                    <button type="button" disabled={isProcessing} onClick={handleConfirmDelivery} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50">
                      {isProcessing ? 'Guardando entrega…' : 'Confirmar entrega del producto'}
                    </button>
                  )}
                </div>
              )}



            </div>
          )}

          {/* TAB 2: TECHNICAL SPECIFICATION & SOLUTION */}
          {activeTab === 'technical' && (
            <div className="space-y-6">
              
              {/* Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                  <span className="text-[11px] font-bold text-blue-800 uppercase block mb-1">Producto Principal</span>
                  <span className="text-xs font-black text-slate-900 block leading-tight">
                    {solution.recommendedPrimaryProduct.name}
                  </span>
                  <span className="text-[10px] text-blue-700 mt-1 inline-block font-semibold">
                    {solution.recommendedPrimaryProduct.line}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-600 uppercase block mb-1">Volumen Total</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-slate-900">{solution.gallonsPrimary}</span>
                    <span className="text-xs text-slate-500 font-medium">Galones</span>
                  </div>
                  <span className="text-[10px] text-slate-600">
                    {solution.bucketsPrimary} Cuñetes (5G) + {solution.remainderGallonsPrimary} Gal
                  </span>
                </div>

                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase block mb-1">Inversión Materiales</span>
                  <div className="text-base font-black text-emerald-900">
                    {formatCOP(solution.estimatedMaterialCostCOP)}
                  </div>
                  <span className="text-[10px] text-emerald-700">COP (Estimado lista Pintuco)</span>
                </div>

                <div className={`p-3.5 border rounded-xl ${isWarrantyEnabled ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50/70 border-amber-200'}`}>
                  <span className={`text-[11px] font-bold uppercase block mb-1 ${isWarrantyEnabled ? 'text-emerald-800' : 'text-amber-800'}`}>
                    Garantía Pintuco
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-xl font-black ${isWarrantyEnabled ? 'text-emerald-900' : 'text-amber-900'}`}>{solution.warrantyYears}</span>
                    <span className={`text-xs font-bold ${isWarrantyEnabled ? 'text-emerald-800' : 'text-amber-800'}`}>Años Certificados</span>
                  </div>
                  <span className={`text-[10px] font-semibold flex items-center gap-1 mt-0.5 ${isWarrantyEnabled ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {isWarrantyEnabled ? '✓ Póliza Habilitada (Pago Verificado)' : '🔒 Póliza Bloqueada (Requiere Pago)'}
                  </span>
                </div>
              </div>

              {/* 2-Column Split: Captured Data vs Technical Prescription */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left: Captured Structured Data */}
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-blue-600" />
                      <span>Datos de la Obra y Cliente</span>
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block">NIT / ID:</span>
                        <span className="font-semibold text-slate-800">{formData.identification.nit || 'No registrado'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Contacto:</span>
                        <span className="font-semibold text-slate-800">{formData.identification.contactPerson || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Ciudad / CEDI:</span>
                        <span className="font-semibold text-slate-800">{formData.project.city}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Tipo de Obra:</span>
                        <span className="font-semibold text-slate-800 capitalize">{formData.project.projectType}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Área Total:</span>
                        <span className="font-bold text-blue-700">{formData.project.areaM2} m²</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Fecha Inicio:</span>
                        <span className="font-semibold text-slate-800">{formData.project.requiredDate}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 block">Color & Tonalidad:</span>
                        <span className="font-bold text-slate-900">{formData.technical.colorName}</span>
                      </div>
                    </div>

                    {formData.evidence.description && (
                      <div className="pt-2 border-t border-slate-200 text-xs">
                        <span className="text-slate-500 block mb-0.5">Descripción de la necesidad:</span>
                        <p className="text-slate-700 italic">"{formData.evidence.description}"</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Technical Formulation & Steps */}
                <div className="space-y-4">
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 space-y-2.5">
                    <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Droplet className="w-4 h-4 text-blue-700" />
                      <span>Prescripción de Materiales Pintuco</span>
                    </h4>

                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 bg-white rounded-lg border border-blue-100 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-900">{solution.recommendedPrimaryProduct.name}</div>
                          <div className="text-[11px] text-slate-500">{solution.coatsRecommended} manos recomendadas</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-800">{solution.gallonsPrimary} Gal</div>
                          <div className="text-[10px] text-slate-500">
                            {solution.bucketsPrimary > 0 ? `${solution.bucketsPrimary} Cuñetes + ${solution.remainderGallonsPrimary}G` : `${solution.gallonsPrimary} Gal`}
                          </div>
                        </div>
                      </div>

                      {solution.recommendedPrimer && (
                        <div className="p-2.5 bg-white rounded-lg border border-blue-100 flex justify-between items-center">
                          <div>
                            <div className="font-bold text-slate-900">{solution.recommendedPrimer.name}</div>
                            <div className="text-[11px] text-slate-500">Imprimante de penetración y bloqueo</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-800">{solution.gallonsPrimer} Gal</div>
                            <div className="text-[10px] text-slate-500">1 mano</div>
                          </div>
                        </div>
                      )}

                      {solution.recommendedPutty && (
                        <div className="p-2.5 bg-white rounded-lg border border-blue-100 flex justify-between items-center">
                          <div>
                            <div className="font-bold text-slate-900">{solution.recommendedPutty.name}</div>
                            <div className="text-[11px] text-slate-500">Resane de fisuras y nivelación</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-800">{solution.kilosPutty} Kg</div>
                            <div className="text-[10px] text-slate-500">Pasta lista</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Surface Prep Steps */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                      Protocolo de Preparación de Superficie
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {solution.surfacePreparationSteps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: TIMELINE & AUDIT TRACEABILITY */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-800" />
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Trazabilidad de Eventos & Auditoría en Tiempo Real
                  </h4>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {project.timelineEvents?.length || 0} Eventos Registrados
                </span>
              </div>

              {(!project.timelineEvents || project.timelineEvents.length === 0) ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No hay eventos registrados en la línea de tiempo aún.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {project.timelineEvents.map((evt, idx) => (
                    <div key={evt.id || idx} className="relative group">
                      <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-white border border-blue-400"></div>
                      
                      <div className="p-4 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 rounded-xl transition-all space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h5 className="font-extrabold text-xs text-slate-900">{evt.title}</h5>
                          <span className="text-[11px] font-mono text-slate-500">
                            {new Date(evt.timestamp).toLocaleString('es-CO')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{evt.description}</p>
                        <div className="text-[10px] text-slate-400 font-medium pt-1">
                          Registrado por: <strong className="text-slate-600">{evt.author}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Rejection Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-red-200 space-y-4">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="w-5 h-5" />
                <h4 className="text-base font-extrabold">Rechazar Cotización (Fin del Proceso)</h4>
              </div>
              <p className="text-xs text-slate-600">
                Por favor indica el motivo por el cual el cliente no aceptó la propuesta. Este motivo quedará registrado en la trazabilidad oficial.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo de Rechazo *</label>
                <select
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-none mb-2"
                >
                  <option value="">-- Seleccionar motivo --</option>
                  <option value="Ajuste o falta de presupuesto interno">Ajuste o falta de presupuesto interno</option>
                  <option value="Tiempo de entrega de materiales no se ajusta">Tiempo de entrega de materiales no se ajusta</option>
                  <option value="Contrató con otro proveedor o marca">Contrató con otro proveedor o marca</option>
                  <option value="Proyecto cancelado o aplazado para siguiente vigencia">Proyecto cancelado o aplazado para siguiente vigencia</option>
                  <option value="Disconformidad con especificación técnica">Disconformidad con especificación técnica</option>
                </select>

                <textarea
                  rows={3}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="Detalles adicionales del motivo..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  disabled={!rejectionReasonInput.trim()}
                  onClick={() => handleClientDecision('rechazada', rejectionReasonInput)}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
                >
                  Confirmar Rechazo y Cerrar Proceso
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center">
          <div className="text-xs text-slate-500 font-mono">
            COLORLINK Engine • Pintuco® S.A.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cerrar Ficha
          </button>
        </div>

        {/* Dedicated Printable Documents Modal for Warranty Policy and Official Quotation */}
        {printableDoc && (
          <PrintableDocumentsModal
            type={printableDoc}
            project={project}
            onClose={() => setPrintableDoc(null)}
          />
        )}

      </div>
    </div>
  );
};

