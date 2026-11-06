import React, { useEffect, useState } from 'react';
import { 
  Truck, 
  MapPin, 
  Search, 
  CheckCircle2, 
  Clock, 
  Phone, 
  MessageSquare, 
  FileText, 
  ShieldCheck, 
  Package, 
  AlertCircle, 
  Layers, 
  Download, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Boxes,
  Navigation,
  Lock,
  Award
} from 'lucide-react';
import { ProjectRecord } from '../types';
import { formatCOP } from '../utils/calculator';
import { INITIAL_PROJECTS } from '../data/mockProjects';
import { PrintableDocumentsModal } from './PrintableDocumentsModal';
import { DispatchGoogleMap } from './DispatchGoogleMap';

interface LiveTrackingViewProps {
  projects?: ProjectRecord[];
  initialTrackingCode?: string;
  onOpenProjectDetail?: (project: ProjectRecord) => void;
  onProjectUpdated?: (project: ProjectRecord) => void;
}

export const LiveTrackingView: React.FC<LiveTrackingViewProps> = ({
  projects = INITIAL_PROJECTS,
  initialTrackingCode = '',
  onOpenProjectDetail,
  onProjectUpdated
}) => {
  const [searchQuery, setSearchQuery] = useState(initialTrackingCode);
  const [searchedProject, setSearchedProject] = useState<ProjectRecord | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [printableDoc, setPrintableDoc] = useState<{ isOpen: boolean; type: 'warranty' | 'dispatch' | 'quotation' } | null>(null);

  useEffect(() => {
    if (!searchedProject) return;
    const refreshed = projects.find(item => item.id === searchedProject.id);
    if (refreshed && refreshed !== searchedProject) setSearchedProject(refreshed);
  }, [projects, searchedProject]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchedProject(null);
    setErrorMessage('');
    setIsSearching(true);

    const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const term = normalize(searchQuery.trim());
    if (!term) {
      setIsSearching(false);
      setErrorMessage('Escribe el número de guía o el nombre del cliente para consultar el envío.');
      return;
    }
    const found = projects.find(p =>
      (p.formData?.identification?.clientName && normalize(p.formData.identification.clientName).includes(term)) ||
      (p.dispatchInfo?.trackingNumber && normalize(p.dispatchInfo.trackingNumber).includes(term))
    );

    setTimeout(() => {
      setIsSearching(false);
      if (found) {
        setSearchedProject(found);
      } else {
        setErrorMessage(`No se encontró ningún pedido o proyecto activo con la referencia "${searchQuery}".`);
      }
    }, 400);
  };

  const project = searchedProject;

  // Business verification: Warranty enabled only after purchase and verified payment
  const isPurchaseCompleted = project?.quotationInfo?.clientDecision === 'aceptada' || 
    (project ? ['inventario_reservado', 'verificacion_pago', 'despacho_en_camino', 'calidad_aprobada', 'finalizado'].includes(project.status) : false);

  const isPaymentConfirmed = Boolean(
    project?.paymentVerification?.isVerified || 
    (project ? ['despacho_en_camino', 'calidad_aprobada', 'finalizado'].includes(project.status) : false)
  );

  const isWarrantyEnabled = isPurchaseCompleted && isPaymentConfirmed;

  // Dispatch Logistics Simulation
  const driverInfo = {
    name: project?.dispatchInfo?.driverContact?.split(' (')[0] || 'Conductor asignado',
    phone: '+57 (310) 845-9921',
    vehiclePlate: project?.dispatchInfo?.vehiclePlate || 'Vehículo por asignar',
    trackingNumber: project?.dispatchInfo?.trackingNumber || 'Guía pendiente de despacho',
    cediOrigin: project?.assignedWarehouse?.cediName || project?.formData?.project?.city || 'CEDI Guarne / Medellín',
    estimatedEta: project?.dispatchInfo?.estimatedDeliveryDate || 'Pendiente de confirmación',
    currentCheckpoint: project?.status === 'finalizado' ? 'Entrega confirmada en destino' : 'Última ubicación reportada por logística',
    progressPercent: project?.status === 'finalizado' ? 100 : project?.dispatchInfo?.isDispatched ? 78 : 0
  };

  const isDelivered = project?.status === 'finalizado' || Boolean(project?.dispatchInfo?.deliveredAt);

  const handleGpsArrival = async () => {
    if (!project || isDelivered) return;
    try {
      const response = await fetch(`/api/projects/${project.id}/confirm-delivery`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'gps_simulation', progress: 100 })
      });
      const result = await response.json();
      if (!response.ok || !result.success || !result.data) throw new Error(result.error || 'No se pudo registrar la entrega.');
      setSearchedProject(result.data);
      onProjectUpdated?.(result.data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo registrar la entrega.');
    }
  };

  const milestones = [
    { title: '1. Pedido Radicado & Estructurado', date: project?.createdAt ? new Date(project.createdAt).toLocaleDateString('es-CO') : '28/08/2026', done: true, note: 'Requerimientos técnicos y m² aprobados' },
    { title: '2. Stock CEDI Reservado & Lote Asignado', date: 'Ayer • 11:20 AM', done: true, note: `Lote certificado en ${driverInfo.cediOrigin}` },
    { title: '3. Pago Confirmado & Facturación DIAN', date: 'Ayer • 4:15 PM', done: true, note: 'Validación por tesorería y emisión electrónica' },
    { title: '6. Despacho en Ruta', date: project?.dispatchInfo?.dispatchedAt ? new Date(project.dispatchInfo.dispatchedAt).toLocaleString('es-CO') : 'Pendiente', done: Boolean(project?.dispatchInfo?.isDispatched), active: Boolean(project?.dispatchInfo?.isDispatched) && !isDelivered, note: `Guía: ${driverInfo.trackingNumber}` },
    { title: '7. Producto Entregado', date: project?.dispatchInfo?.deliveredAt ? new Date(project.dispatchInfo.deliveredAt).toLocaleString('es-CO') : 'Pendiente de entrega', done: isDelivered, active: isDelivered, note: isDelivered ? `Recibido por ${project?.dispatchInfo?.receivedByName || project?.formData?.identification?.clientName || 'el cliente'}` : 'Se actualizará cuando el administrador confirme la entrega.' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider mb-1">
              <Truck className="w-4 h-4 text-blue-600" />
              Pilar 06 • Logística Inteligente & Trazabilidad "Pintuco Express"
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Portal de Seguimiento en Vivo & Estado de Despacho
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Monitoreo en tiempo real del tránsito de recubrimientos desde la bodega CEDI regional hasta la obra o cliente final, con acceso directo a la remisión y certificado de garantía.
            </p>
          </div>
        </div>

        {/* Search Tracking Code Bar */}
        <form onSubmit={handleSearch} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchedProject(null);
                setErrorMessage('');
              }}
              placeholder="Ingresa el número de guía o el nombre del cliente..."
              className="w-full pl-9 pr-3 py-2.5 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Navigation className="w-4 h-4 text-amber-300" />
            <span>{isSearching ? 'Rastreando...' : 'Rastrear Pedido'}</span>
          </button>
        </form>

        {errorMessage && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {!project && (
        <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/70 p-8 text-center">
          <Search className="mx-auto h-8 w-8 text-blue-500" />
          <p className="mt-3 text-sm font-bold text-slate-800">Busca un envío para ver su seguimiento</p>
          <p className="mt-1 text-xs text-slate-600">Escribe el número de guía o el nombre del cliente.</p>
        </div>
      )}

      {project && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Live Map Simulation & Driver Status (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Google Maps Platform Live GPS Tracking Component */}
            <DispatchGoogleMap project={project} driverInfo={driverInfo} onGpsArrival={handleGpsArrival} />

            {/* Quick Driver Direct Communications Bar */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold text-sm border border-blue-200">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                    Línea Directa de Cabina Logística
                  </span>
                  <div className="text-xs font-bold text-slate-800">
                    {driverInfo.name} ({driverInfo.vehiclePlate})
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={`tel:${driverInfo.phone.replace(/[^0-9]/g, '')}`}
                  className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Llamar al Conductor</span>
                </a>
                <a
                  href={`https://wa.me/573108459921?text=Hola%20${encodeURIComponent(driverInfo.name)},%20deseo%20confirmar%20la%20recepci%C3%B3n%20del%20pedido%20${project.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp de Entrega</span>
                </a>
              </div>
            </div>

            {/* Project Summary Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-mono block">Guía: {driverInfo.trackingNumber}</span>
                  <h3 className="text-base font-black text-slate-900">{project.formData.identification.clientName}</h3>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  {project.quotationInfo?.quoteId || 'Cotización Oficial'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 text-[11px] block">Línea Pintuco:</span>
                  <strong className="text-slate-800">{project.solution.recommendedPrimaryProduct?.name || 'Viniltex® Bio-Cuidado'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Área Recubierta:</span>
                  <strong className="text-slate-800">{project.formData.project.areaM2} m²</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Cuñetes Despachados:</span>
                  <strong className="text-emerald-700 font-mono">{project.solution.bucketsPrimary || 6} Cuñetes</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Garantía Emitida:</span>
                  <strong className="text-blue-900">{project.solution.warrantyYears || 5} Años</strong>
                </div>
              </div>

              {onOpenProjectDetail && (
                <button
                  type="button"
                  onClick={() => onOpenProjectDetail(project)}
                  className="w-full mt-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ver Expediente Completo & Fichas Técnicas</span>
                </button>
              )}
            </div>

          </div>

          {/* RIGHT: Timeline Milestones & Documents (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Timeline Stepper */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Hitos de Despacho & Trazabilidad</span>
              </h4>

              <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {milestones.map((step, idx) => (
                  <div key={idx} className="relative group">
                    {/* Circle Node */}
                    <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      step.active 
                        ? 'bg-blue-600 border-white text-white shadow-md ring-4 ring-blue-100 animate-pulse' 
                        : step.done 
                        ? 'bg-emerald-500 border-white text-white' 
                        : 'bg-white border-slate-300 text-slate-400'
                    }`}>
                      {step.done ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-black ${step.active ? 'text-blue-900 font-black' : step.done ? 'text-slate-900' : 'text-slate-400'}`}>
                          {step.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{step.date}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{step.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Official Warranty and Delivery Documents Box */}
            <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-6 rounded-2xl border border-blue-900/50 shadow-md space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  Documentos Digitales & Póliza Pintuco®
                </h4>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Descarga los comprobantes electrónicos firmados digitalmente para archivo de interventoría y aseguramiento de calidad.
              </p>

              <div className="space-y-2">
                {isWarrantyEnabled ? (
                  <button
                    type="button"
                    id="btn-download-warranty"
                    onClick={() => setPrintableDoc({ isOpen: true, type: 'warranty' })}
                    className="w-full py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/15 flex items-center justify-between transition-all hover:border-amber-400/40 active:scale-98 cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-300" />
                      <span>Póliza de Garantía Oficial ({project.solution.warrantyYears || 5} Años)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-black border border-emerald-500/30">
                        ✓ Activa
                      </span>
                      <Download className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    id="btn-download-warranty-locked"
                    onClick={() => setPrintableDoc({ isOpen: true, type: 'warranty' })}
                    className="w-full py-2.5 px-3 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl border border-white/10 flex items-center justify-between transition-all cursor-pointer shadow-xs"
                    title="Póliza inhabilitada: requiere compra aprobada y pago verificado por Tesorería"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>Póliza de Garantía Oficial ({project.solution.warrantyYears || 5} Años)</span>
                    </div>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                      🔒 Requiere Pago
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  id="btn-download-dispatch"
                  onClick={() => setPrintableDoc({ isOpen: true, type: 'dispatch' })}
                  className="w-full py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/15 flex items-center justify-between transition-all hover:border-emerald-400/40 active:scale-98 cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-emerald-300" />
                    <span>Remisión de Despacho & Control de Lote CEDI</span>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-300" />
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Printable / Downloadable Official Document Modal */}
      {printableDoc?.isOpen && project && (
        <PrintableDocumentsModal
          type={printableDoc.type}
          project={project}
          onClose={() => setPrintableDoc(null)}
        />
      )}

    </div>
  );
};
