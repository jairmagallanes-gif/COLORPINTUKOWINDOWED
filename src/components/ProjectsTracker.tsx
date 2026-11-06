import React, { useState } from 'react';
import { ProjectRecord, ProjectStatus, UserProfile, RolePermissionsMatrix, DeliveryUrgency } from '../types';
import { formatCOP } from '../utils/calculator';
import { Search, Filter, Layers, Clock, CheckCircle2, ChevronRight, Droplets, MapPin, Building, Eye, PlusCircle, ShieldCheck, UserCheck, Flame, Zap, CalendarDays } from 'lucide-react';
import { checkUserPermission, getRoleShortLabel, normalizeUserRole } from '../utils/rbac';
import { getUrgencyConfig, ALL_URGENCY_OPTIONS } from '../utils/urgencyUtils';
import { getChannelMetadata } from '../utils/channelUtils';

interface ProjectsTrackerProps {
  projects: ProjectRecord[];
  currentUser?: UserProfile | null;
  permissionsMatrix?: RolePermissionsMatrix;
  onSelectProject: (project: ProjectRecord) => void;
  onNewProjectClick: () => void;
}

export const ProjectsTracker: React.FC<ProjectsTrackerProps> = ({
  projects,
  currentUser,
  permissionsMatrix,
  onSelectProject,
  onNewProjectClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');

  const canViewAllProjects = checkUserPermission(currentUser || null, 'ver_todos_los_proyectos', permissionsMatrix);
  const canCreateCapture = checkUserPermission(currentUser || null, 'crear_captura_proyecto', permissionsMatrix);

  // Filter projects by permission
  const accessibleProjects = (projects || []).filter(p => {
    if (canViewAllProjects || !currentUser) {
      return true;
    }
    // If restricted to own projects:
    const userEmail = (currentUser.email || '').toLowerCase();
    const clientEmail = (p?.formData?.identification?.contactEmail || p?.formData?.identification?.clientEmail || '').toLowerCase();
    return Boolean(userEmail && clientEmail && clientEmail === userEmail);
  });

  const filteredProjects = accessibleProjects.filter((p) => {
    const term = (searchTerm || '').toLowerCase();
    const projChannel = p?.channel || p?.formData?.identification?.channel || 'web_portal';
    const channelMeta = getChannelMetadata(projChannel);

    const matchesSearch =
      !term ||
      (p?.id || '').toLowerCase().includes(term) ||
      (p?.formData?.identification?.clientName || '').toLowerCase().includes(term) ||
      (p?.formData?.project?.city || '').toLowerCase().includes(term) ||
      (p?.solution?.recommendedPrimaryProduct?.name || '').toLowerCase().includes(term) ||
      channelMeta.label.toLowerCase().includes(term) ||
      channelMeta.shortLabel.toLowerCase().includes(term) ||
      channelMeta.code.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'all' || p?.status === statusFilter;
    const matchesCity = cityFilter === 'all' || p?.formData?.project?.city === cityFilter;
    const currentUrgency = p?.deliveryUrgency || p?.formData?.project?.deliveryUrgency;
    const matchesUrgency = urgencyFilter === 'all' || currentUrgency === urgencyFilter;
    const matchesChannel = channelFilter === 'all' || projChannel === channelFilter;

    return matchesSearch && matchesStatus && matchesCity && matchesUrgency && matchesChannel;
  });

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'capturado':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">1. Radicado</span>;
      case 'validacion_stock_previa':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">2. Stock CEDI Validado</span>;
      case 'cotizacion_enviada':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">3. Cotización Enviada</span>;
      case 'cotizacion_rechazada':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">Rechazado (Fin)</span>;
      case 'inventario_reservado':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">4. Aprobada & Stock CEDI</span>;
      case 'verificacion_pago':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">5. Pago Verificado</span>;
      case 'despacho_en_camino':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">6. Despacho en Ruta</span>;
      case 'calidad_aprobada':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">7. Calidad & Garantía</span>;
      case 'finalizado':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">Entregado</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">En Proceso</span>;
    }
  };

  const totalM2 = projects.reduce((acc, p) => acc + (p.formData.project.areaM2 || 0), 0);
  const totalGallons = projects.reduce((acc, p) => acc + (p.solution.gallonsPrimary || 0), 0);

  const normalizedRole = normalizeUserRole(currentUser?.role);
  const isClientRole = normalizedRole === 'cliente_natural' || normalizedRole === 'cliente_empresa' || normalizedRole === 'cliente';
  const showMetrics = !isClientRole;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* Top Metrics Row (Oculto para roles Cliente Hogar y Cliente Empresa) */}
      {showMetrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 block mb-1">Proyectos en Ecosistema</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">{projects.length}</span>
              <span className="text-xs font-semibold text-emerald-600">Activos 100%</span>
            </div>
            <span className="text-[11px] text-slate-400">Trazabilidad E2E en tiempo real</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 block mb-1">Superficie Total Orquestada</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-blue-700">{totalM2.toLocaleString()}</span>
              <span className="text-xs font-semibold text-slate-500">m² de obra</span>
            </div>
            <span className="text-[11px] text-slate-400">Residencial, comercial e industrial</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 block mb-1">Volumen Calculado</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">{totalGallons.toLocaleString()}</span>
              <span className="text-xs font-semibold text-slate-500">Galones</span>
            </div>
            <span className="text-[11px] text-slate-400">Enlace con CEDIs Pintuco</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-500 block mb-1">Tiempo de Respuesta</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-600">&lt; 2 min</span>
              <span className="text-xs font-semibold text-emerald-700">-85% vs tradicional</span>
            </div>
            <span className="text-[11px] text-slate-400">Cero llamadas o cálculos manuales</span>
          </div>
        </div>
      )}

      {/* User Scope Privacy Notice if restricted to own projects */}
      {!canViewAllProjects && currentUser && (
        <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-[#2E3192]">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#2E3192] shrink-0" />
            <span>
              <strong>Filtro de Privacidad Activo:</strong> Mostrando únicamente los proyectos vinculados a tu cuenta (<strong>{currentUser.name}</strong>).
            </span>
          </div>
          <span className="font-bold text-[10px] bg-blue-200/80 px-2 py-0.5 rounded text-blue-950 uppercase">
            {getRoleShortLabel(currentUser.role)}
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por cliente, ID de proyecto (COLORLINK-...), ciudad o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-slate-700"
          >
            <option value="all">Todos los Estados</option>
            <option value="capturado">1. Radicado</option>
            <option value="validacion_stock_previa">2. Stock CEDI Validado</option>
            <option value="cotizacion_enviada">3. Cotización Enviada</option>
            <option value="inventario_reservado">4. Aprobada & Stock CEDI</option>
            <option value="verificacion_pago">5. Pago Verificado</option>
            <option value="despacho_en_camino">6. Despacho en Ruta</option>
            <option value="calidad_aprobada">7. Calidad & Garantía</option>
          </select>

          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-slate-700"
          >
            <option value="all">Todas las Ciudades</option>
            <option value="Medellín">Medellín</option>
            <option value="Bogotá">Bogotá</option>
            <option value="Cali">Cali</option>
            <option value="Barranquilla">Barranquilla</option>
            <option value="Bucaramanga">Bucaramanga</option>
            <option value="Cartagena">Cartagena</option>
          </select>

          {/* Delivery Urgency Filter */}
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-slate-700"
          >
            <option value="all">Cualquier Urgencia</option>
            <option value={DeliveryUrgency.INMEDIATO_24_48H}>🚨 Urgente (24-48h)</option>
            <option value={DeliveryUrgency.EXPRESS_3_5DIAS}>⚡ Express (3-5 días)</option>
            <option value={DeliveryUrgency.ESTANDAR_1_2SEMANAS}>📦 Estándar (1-2 semanas)</option>
            <option value={DeliveryUrgency.PROGRAMADO_ETAPAS}>📅 Por Etapas</option>
          </select>

          {/* Capture Channel Filter */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold text-slate-800"
          >
            <option value="all">📡 Todos los Canales</option>
            <option value="web_portal">🌐 Portal Web ColorLink</option>
            <option value="whatsapp">💬 WhatsApp Oficial</option>
            <option value="commercial_advisor">👔 Asesor en Campo</option>
            <option value="pintuco_store">🏪 Tienda Física Pintuco</option>
            <option value="constructor_b2b">🏢 Convenio B2B</option>
            <option value="mobile_app">📱 App Móvil Pintores</option>
          </select>

          {canCreateCapture && (
            <button
              onClick={onNewProjectClick}
              id="btn-tracker-nuevo-proyecto"
              className="px-3.5 py-2 bg-[#FF6B35] hover:bg-[#E85520] text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer border border-orange-400/30"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nueva Cotización / Proyecto</span>
            </button>
          )}
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-3">
        {filteredProjects.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <Layers className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">No se encontraron proyectos</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No hay solicitudes que coincidan con los filtros aplicados. Puedes iniciar una nueva cotización o Captura Inteligente de Proyectos.
            </p>
            <button
              onClick={onNewProjectClick}
              className="mt-2 px-5 py-2.5 bg-[#FF6B35] hover:bg-[#E85520] text-white text-xs font-black rounded-xl cursor-pointer shadow-md"
            >
              Nueva Cotización de Proyecto
            </button>
          </div>
        ) : (
          filteredProjects.map((proj) => {
            const urgencyConfig = getUrgencyConfig(proj.deliveryUrgency || proj.formData.project.deliveryUrgency);
            const UrgencyIcon = urgencyConfig.icon;
            const channelKey = proj.channel || proj.formData.identification.channel || 'web_portal';
            const channelMeta = getChannelMetadata(channelKey);
            const ChannelIcon = channelMeta.icon;

            return (
              <div
                key={proj.id}
                onClick={() => onSelectProject(proj)}
                className={`bg-white p-5 rounded-2xl border ${urgencyConfig.cardBorder} hover:shadow-md transition-all cursor-pointer group relative overflow-hidden`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left Info */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                        {proj.id}
                      </span>
                      {getStatusBadge(proj.status)}

                      {/* Capture Channel Badge */}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${channelMeta.badgeBg} ${channelMeta.badgeText} ${channelMeta.badgeBorder}`}>
                        <ChannelIcon className="w-3 h-3" />
                        <span>Canal: {channelMeta.shortLabel}</span>
                      </span>
                      
                      {/* Urgency Badge with Color Coding */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-black border ${urgencyConfig.badgeBg} ${urgencyConfig.badgeText} ${urgencyConfig.badgeBorder}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${urgencyConfig.dotColor} ${urgencyConfig.level === 'critical' ? 'animate-ping' : ''}`}></span>
                        <UrgencyIcon className="w-3.5 h-3.5" />
                        <span>{urgencyConfig.shortLabel}</span>
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                      {proj.formData.identification.clientName}
                    </h3>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{proj.formData.project.city}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span className="capitalize">{proj.formData.project.projectType} • {proj.formData.project.areaM2} m²</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5 text-blue-500" />
                        <span className="font-medium text-slate-700">{proj.solution.recommendedPrimaryProduct.name}</span>
                      </span>
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Requerido: {proj.formData.project.requiredDate}</span>
                      </span>
                    </div>
                  </div>

                  {/* Right Metrics & CTA */}
                  <div className="flex items-center justify-between lg:justify-end gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="text-left lg:text-right">
                      <div className="text-xs font-bold text-slate-900">
                        {proj.solution.gallonsPrimary} Galones
                      </div>
                      <div className="text-xs font-extrabold text-emerald-700">
                        {formatCOP(proj.solution.estimatedMaterialCostCOP)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        CEDI {proj.assignedWarehouse.city}
                      </div>
                    </div>

                    <button 
                      id={`btn-open-project-${proj.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProject(proj);
                      }}
                      className="px-3.5 py-1.5 bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                    >
                      <span>Ver Ficha</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
