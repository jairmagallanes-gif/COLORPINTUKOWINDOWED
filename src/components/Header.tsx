import React from 'react';
import { UserProfile, RolePermissionsMatrix, ActiveTabType } from '../types';
import { 
  Layers, 
  ClipboardList, 
  PackageCheck, 
  User, 
  LogIn, 
  PlusCircle, 
  Building2, 
  Calculator, 
  LogOut, 
  ShieldCheck, 
  Key, 
  Briefcase, 
  Building, 
  Hammer,
  Mail,
  Eye,
  Truck,
  ShoppingBag,
} from 'lucide-react';
import { checkUserPermission, getRoleShortLabel, normalizeUserRole, ROLES_METADATA } from '../utils/rbac';
import { isSupabaseConfigured } from '../lib/supabase';

export type { ActiveTabType };

interface HeaderProps {
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  currentUser: UserProfile | null;
  permissionsMatrix?: RolePermissionsMatrix;
  onOpenAuth: () => void;
  onNewProjectClick: () => void;
  onOpenEmails?: () => void;
  onOpenSupabaseModal?: () => void;
  unreadEmailCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  permissionsMatrix,
  onOpenAuth,
  onNewProjectClick,
  onOpenEmails,
  onOpenSupabaseModal,
  unreadEmailCount = 0
}) => {
  const canViewMision = checkUserPermission(currentUser, 'ver_mision_pilares', permissionsMatrix);
  const canUseCotizador = checkUserPermission(currentUser, 'usar_cotizador', permissionsMatrix);
  const canCreateCapture = Boolean(currentUser) && checkUserPermission(currentUser, 'crear_captura_proyecto', permissionsMatrix);
  const canViewProjects = checkUserPermission(currentUser, 'ver_proyectos', permissionsMatrix);
  const canViewCedis = checkUserPermission(currentUser, 'ver_inventario_cedis', permissionsMatrix);
  const canUseAi = checkUserPermission(currentUser, 'usar_diagnostico_ia', permissionsMatrix);
  const canManageRbac = checkUserPermission(currentUser, 'gestionar_roles_permisos', permissionsMatrix);

  const normalizedRole = currentUser ? normalizeUserRole(currentUser.role) : null;
  const roleMeta = normalizedRole ? ROLES_METADATA[normalizedRole] : null;

  return (
    <header className="sticky top-0 z-40 bg-white shadow-xs border-b border-slate-200">
      {/* Topmost mini info banner */}
      <div className="bg-[#1E216B] text-slate-200 text-xs py-1.5 px-4 sm:px-6 flex justify-between items-center border-b border-blue-900/60">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 font-semibold text-[11px] border border-blue-400/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F7C548] animate-pulse"></span>
            Transformación Digital Inteligente
          </span>
          <span className="hidden md:inline text-slate-300 text-[11px]">
            • Proyecto Estratégico para <strong className="text-white">PINTUCO® Colombia</strong>
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-300">
          {currentUser && (
            <span className="hidden sm:inline-flex items-center gap-1.5 font-bold text-amber-300 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
              <span>Rol Activo:</span>
              <span className="text-white">{roleMeta?.label || currentUser.role}</span>
            </span>
          )}
          <span className="hidden sm:inline font-medium">UCC • Universidad Cooperativa de Colombia</span>
          <button
            type="button"
            onClick={onOpenSupabaseModal}
            id="btn-header-supabase"
            title="Click para ver estado, diagnóstico y probar conexión con Supabase PostgreSQL"
            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all hover:scale-105 active:scale-95 ${
              isSupabaseConfigured 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30' 
                : 'bg-blue-500/20 text-blue-200 border-blue-400/30 hover:bg-blue-500/30'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-blue-300'}`}></span>
            <span>{isSupabaseConfigured ? 'Supabase Conectado' : 'Supabase Ready'}</span>
          </button>
          <span className="px-2 py-0.5 bg-[#F7C548]/20 text-[#F7C548] rounded font-mono text-[10px] font-bold border border-[#F7C548]/40">
            MVP v2.6 RBAC
          </span>
        </div>
      </div>

      {/* TIER 1 (LÍNEA SUPERIOR): Nombre de Empresa + Nueva Cotización de Proyecto + Iniciar Sesión / Registro */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand & Project Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer group select-none" 
          onClick={() => setActiveTab(canViewMision ? 'inicio' : (canUseCotizador ? 'cotizador' : 'proyectos'))}
          title="Ir a Misión & Pilares"
        >
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-[#2E3192] text-white shadow-md font-black text-xl tracking-tighter group-hover:scale-105 transition-transform">
            <span className="drop-shadow-xs">CL</span>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#F7C548] text-[#1E216B] rounded-full flex items-center justify-center text-[9px] font-black border-2 border-white shadow-xs">
              ✓
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-[#2E3192] tracking-tight flex items-center gap-1.5">
                COLORLINK
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#2E3192]/10 text-[#2E3192] tracking-normal uppercase border border-[#2E3192]/20">
                  by Pintuco
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Ecosistema Inteligente de Pinturas & Recubrimientos
            </p>
          </div>
        </div>

        {/* Right Action Controls: Email Notifications & Login/Register */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* BOTÓN DE NOTIFICACIONES & CORREOS DE ACTIVACIÓN */}
          {onOpenEmails && (
            <button
              onClick={onOpenEmails}
              id="btn-header-emails"
              className="relative flex items-center gap-1.5 px-2.5 py-2 text-slate-700 hover:text-[#1E216B] bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Ver notificaciones por Correo Electrónico y WhatsApp"
              aria-label="Centro de Notificaciones Email y WhatsApp"
            >
              <div className="relative">
                <Mail className="w-4 h-4 text-[#1E216B]" />
                {unreadEmailCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-[#FF6B35] text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse">
                    {unreadEmailCount > 9 ? '9+' : unreadEmailCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline text-[11px] font-bold text-slate-700">
                Notificaciones
              </span>
              <span className="hidden lg:inline text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">
                Gmail + WA
              </span>
            </button>
          )}

          {/* INICIAR SESIÓN / REGISTRO O PERFIL DE USUARIO */}
          <button
            onClick={onOpenAuth}
            id="btn-header-auth"
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              currentUser
                ? 'border-[#2E3192]/30 bg-blue-50/70 hover:bg-blue-100 text-[#2E3192]'
                : 'border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 text-slate-700 shadow-2xs'
            }`}
          >
            {currentUser ? (
              <>
                <div className="w-6 h-6 rounded-full bg-[#2E3192] text-white flex items-center justify-center text-[11px] font-bold shadow-2xs">
                  {currentUser.name.substring(0, 1).toUpperCase()}
                </div>
                <div className="text-left leading-tight max-w-[140px] truncate hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</div>
                  <div className="text-[10px] text-[#2E3192] font-black uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>{getRoleShortLabel(currentUser.role)}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-[#2E3192]" />
                <span className="whitespace-nowrap">Iniciar Sesión / Roles</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* TIER 2 (LÍNEA INFERIOR): Barra de Navegación Dinámica con Control RBAC */}
      <div className="border-t border-slate-200/80 bg-slate-50/70 px-2 sm:px-4 lg:px-6">
        <div className="w-full max-w-7xl mx-auto">
          <nav className="flex items-center justify-between gap-1 overflow-x-auto py-1 scrollbar-none">
            
            {/* Misión & Pilares */}
            {canViewMision && (
              <button
                onClick={() => setActiveTab('inicio')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  activeTab === 'inicio'
                    ? 'bg-white text-[#2E3192] shadow-xs border border-slate-200 font-extrabold ring-1 ring-[#2E3192]/15'
                    : 'text-slate-600 hover:text-[#2E3192] hover:bg-white/80'
                }`}
              >
                <Building2 className={`w-3.5 h-3.5 ${activeTab === 'inicio' ? 'text-[#2E3192]' : 'text-slate-400'}`} />
                <span>Misión & Pilares</span>
              </button>
            )}

            {/* Cotizador en Línea */}
            {canUseCotizador && (
              <button
                onClick={() => setActiveTab('cotizador')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  activeTab === 'cotizador'
                    ? 'bg-white text-[#FF6B35] shadow-xs border border-orange-200 font-extrabold ring-1 ring-[#FF6B35]/25'
                    : 'text-slate-600 hover:text-[#FF6B35] hover:bg-white/80'
                }`}
              >
                <Calculator className={`w-3.5 h-3.5 ${activeTab === 'cotizador' ? 'text-[#FF6B35]' : 'text-[#F7C548]'}`} />
                <span>Cotizador en Línea</span>
              </button>
            )}

            {/* Captura Inteligente de Proyectos */}
            {canCreateCapture && (
              <button
                onClick={onNewProjectClick}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  activeTab === 'captura'
                    ? 'bg-[#2E3192] text-white shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-[#2E3192] hover:bg-white/80'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Captura Inteligente de Proyectos</span>
              </button>
            )}

            {/* Proyectos & Trazabilidad */}
            {canViewProjects && (
              <button
                onClick={() => setActiveTab('proyectos')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  activeTab === 'proyectos'
                    ? 'bg-white text-[#2E3192] shadow-xs border border-slate-200 font-extrabold ring-1 ring-[#2E3192]/15'
                    : 'text-slate-600 hover:text-[#2E3192] hover:bg-white/80'
                }`}
              >
                <Layers className={`w-3.5 h-3.5 ${activeTab === 'proyectos' ? 'text-[#2E3192]' : 'text-slate-400'}`} />
                <span>Proyectos</span>
              </button>
            )}

            {/* Inventario CEDIs */}
            {canViewCedis && (
              <button
                onClick={() => setActiveTab('cedis')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  activeTab === 'cedis'
                    ? 'bg-white text-[#2E3192] shadow-xs border border-slate-200 font-extrabold ring-1 ring-[#2E3192]/15'
                    : 'text-slate-600 hover:text-[#2E3192] hover:bg-white/80'
                }`}
              >
                <PackageCheck className={`w-3.5 h-3.5 ${activeTab === 'cedis' ? 'text-[#2E3192]' : 'text-slate-400'}`} />
                <span>Inventario CEDIs</span>
              </button>
            )}

            {/* Simulador AR de Color */}
            <button
              onClick={() => setActiveTab('visualizador')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                activeTab === 'visualizador'
                  ? 'bg-white text-indigo-900 shadow-xs border border-indigo-300 font-extrabold ring-1 ring-indigo-500/25'
                  : 'text-slate-600 hover:text-indigo-900 hover:bg-white/80'
              }`}
            >
              <Eye className={`w-3.5 h-3.5 ${activeTab === 'visualizador' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Simulador AR</span>
            </button>

            {/* Tracking en Vivo "Pintuco Express" */}
            <button
              onClick={() => setActiveTab('compras')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer shrink-0 ${activeTab === 'compras' ? 'bg-white text-emerald-900 shadow-xs border border-emerald-300 font-extrabold' : 'text-slate-600 hover:text-emerald-900 hover:bg-white/80'}`}
            >
              <ShoppingBag className={`w-3.5 h-3.5 ${activeTab === 'compras' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>Compras</span>
            </button>

            <button
              onClick={() => setActiveTab('tracking')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                activeTab === 'tracking'
                  ? 'bg-white text-blue-900 shadow-xs border border-blue-300 font-extrabold ring-1 ring-blue-500/25'
                  : 'text-slate-600 hover:text-blue-900 hover:bg-white/80'
              }`}
            >
              <Truck className={`w-3.5 h-3.5 ${activeTab === 'tracking' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Tracking en Vivo</span>
            </button>

            {/* TAB EXCLUSIVO DEL ADMINISTRADOR: Roles & Permisos (RBAC) */}
            {canManageRbac && (
              <button
                onClick={() => setActiveTab('admin_rbac')}
                id="tab-admin-rbac"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  activeTab === 'admin_rbac'
                    ? 'bg-purple-900 text-white shadow-xs font-extrabold ring-1 ring-purple-400/40'
                    : 'text-purple-900 bg-purple-100/90 hover:bg-purple-200'
                }`}
              >
                <Key className="w-3.5 h-3.5 text-[#F7C548]" />
                <span>Roles & Permisos</span>
              </button>
            )}

          </nav>
        </div>
      </div>
    </header>
  );
};

