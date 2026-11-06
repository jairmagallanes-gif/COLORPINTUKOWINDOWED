import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Key, 
  Check, 
  X, 
  RotateCcw, 
  Save, 
  Building2, 
  UserCheck, 
  UserPlus, 
  AlertCircle, 
  Sparkles, 
  Sliders, 
  Layers, 
  CheckCircle2, 
  Eye, 
  Briefcase, 
  User, 
  Hammer, 
  Lock,
  Search,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  ShieldAlert,
  Send,
  ExternalLink,
  Inbox,
  Database
} from 'lucide-react';
import { PermissionKey, RolePermissionsMatrix, UserProfile, UserRole, EmailNotification } from '../types';
import { 
  DEFAULT_ROLE_PERMISSIONS, 
  PERMISSION_DEFINITIONS, 
  ROLES_METADATA, 
  RoleInfo, 
  getSavedPermissionsMatrix, 
  savePermissionsMatrix, 
  resetPermissionsToDefaults, 
  normalizeUserRole 
} from '../utils/rbac';
import { PRESET_DEMO_USERS } from './AuthModal';
import { supabaseSyncService } from '../lib/supabaseSyncService';
import { 
  createAdvisorApprovalEmail, 
  getEmailNotifications, 
  saveEmailNotification 
} from '../utils/mailer';

interface AdminRbacViewProps {
  currentUser: UserProfile | null;
  permissionsMatrix: RolePermissionsMatrix;
  onUpdatePermissions: (newMatrix: RolePermissionsMatrix) => void;
  onSimulateRoleLogin?: (user: UserProfile) => void;
  onOpenEmailNotifications?: () => void;
  onOpenSupabaseModal?: () => void;
}

export const AdminRbacView: React.FC<AdminRbacViewProps> = ({
  currentUser,
  permissionsMatrix,
  onUpdatePermissions,
  onSimulateRoleLogin,
  onOpenEmailNotifications,
  onOpenSupabaseModal
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('asesor');
  const [localMatrix, setLocalMatrix] = useState<RolePermissionsMatrix>(permissionsMatrix);
  const [viewMode, setViewMode] = useState<'cards' | 'matrix' | 'approvals' | 'users' | 'emails'>('cards');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [auditEmailSearch, setAuditEmailSearch] = useState('');
  
  // Users list from storage/demo
  const [usersList, setUsersList] = useState<UserProfile[]>(() => {
    try {
      const stored = localStorage.getItem('colorlink_registered_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((u: any) => u.role !== 'administrador' || u.email?.toLowerCase() === 'jairmagallanes@gmail.com').map((u: any) => {
            if (u.email?.toLowerCase() === 'jairmagallanes@gmail.com') {
              return {
                ...u,
                id: 'user-demo-admin',
                name: 'Jair Magallanes',
                email: 'jairmagallanes@gmail.com',
                role: 'administrador',
                companyOrOrg: 'COLORLINK Central Pintuco',
                positionOrTitle: 'Administrador General del Sistema & Director de Plataforma',
                nitOrDoc: '1.047.382.910',
                phone: '+57 323 603 0829',
                city: 'Medellín',
                address: 'Carrera 48 # 26-85, Edificio Sede Principal Pintuco',
                isRegistered: true,
                accountStatus: 'activo',
                emailVerified: true
              };
            }
            return u;
          });
        }
      }
    } catch (e) {
      console.warn(e);
    }
    return PRESET_DEMO_USERS;
  });

  const [notificationList, setNotificationList] = useState<EmailNotification[]>(() => {
    return getEmailNotifications();
  });

  const [userRoleChangedToast, setUserRoleChangedToast] = useState<string | null>(null);
  const [approvalActionFeedback, setApprovalActionFeedback] = useState<string | null>(null);

  // Sync with prop updates
  useEffect(() => {
    setLocalMatrix(permissionsMatrix);
  }, [permissionsMatrix]);

  // Load real registered users from Supabase and Backend API
  useEffect(() => {
    const loadRealRegisteredUsers = async () => {
      try {
        // 1. Try fetching from Supabase profiles first
        const supabaseProfiles = await supabaseSyncService.fetchLiveProfiles();
        if (supabaseProfiles && supabaseProfiles.length > 0) {
          const mapped: UserProfile[] = supabaseProfiles.map((p: any) => ({
            id: p.id || `supa-${p.email}`,
            name: p.name || p.full_name || p.email.split('@')[0],
            email: p.email,
            role: (p.role as UserRole) || 'cliente_natural',
            phone: p.phone || '',
            companyOrOrg: p.role === 'asesor' ? 'Pintuco Proyectos' : 'Particular',
            accountStatus: p.accountStatus || (p.is_active ? 'activo' : 'pendiente_aprobacion_admin'),
            emailVerified: true,
            isRegistered: true,
            registeredAt: p.created_at || new Date().toISOString()
          }));

          setUsersList(prev => {
            // Merge with local users without duplicates by email
            const merged = [...mapped];
            prev.forEach(localUser => {
              if (!merged.some(m => m.email.toLowerCase() === localUser.email.toLowerCase())) {
                merged.push(localUser);
              }
            });
            return merged;
          });
          return;
        }

        // 2. Fallback to API users endpoint if available
        const res = await fetch('/api/auth/users');
        if (res.ok) {
          const data = await res.json();
          if (data.users && Array.isArray(data.users)) {
            setUsersList(data.users);
          }
        }
      } catch (err) {
        console.warn('Error loading live users in AdminRbacView:', err);
      }
    };

    loadRealRegisteredUsers();
    const interval = setInterval(loadRealRegisteredUsers, 8000);
    return () => clearInterval(interval);
  }, []);

  const pendingAdvisors = usersList.filter(
    u => u.role === 'asesor' && u.accountStatus === 'pendiente_aprobacion_admin'
  );

  const handleTogglePermission = (role: UserRole, permKey: PermissionKey) => {
    // Prevent locking out administrator from managing permissions
    if (role === 'administrador' && permKey === 'gestionar_roles_permisos') {
      return;
    }

    setLocalMatrix(prev => {
      const rolePerms = prev[role] || { ...DEFAULT_ROLE_PERMISSIONS[role] };
      const updated = {
        ...prev,
        [role]: {
          ...rolePerms,
          [permKey]: !rolePerms[permKey]
        }
      };
      return updated;
    });
    setSaveSuccess(false);
  };

  const handleSaveAll = () => {
    savePermissionsMatrix(localMatrix);
    onUpdatePermissions(localMatrix);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleResetDefaults = () => {
    if (window.confirm('¿Deseas restablecer todos los permisos de los roles a la configuración de fábrica de Pintuco?')) {
      const defaults = resetPermissionsToDefaults();
      setLocalMatrix(defaults);
      onUpdatePermissions(defaults);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    }
  };

  const handleChangeUserRole = (userId: string, newRole: UserRole) => {
    const updatedUsers = usersList.map(u => {
      if (u.id === userId) {
        return { 
          ...u, 
          role: newRole,
          accountStatus: (newRole === 'asesor' && u.accountStatus !== 'activo') ? 'pendiente_aprobacion_admin' : 'activo'
        };
      }
      return u;
    });

    setUsersList(updatedUsers);
    try {
      localStorage.setItem('colorlink_registered_users', JSON.stringify(updatedUsers));
      const targetUser = updatedUsers.find(u => u.id === userId);
      if (targetUser) {
        setUserRoleChangedToast(`Rol de "${targetUser.name}" actualizado a "${ROLES_METADATA[newRole]?.label || newRole}"`);
        setTimeout(() => setUserRoleChangedToast(null), 3000);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleApproveAdvisor = async (advisor: UserProfile) => {
    try {
      await fetch('/api/auth/approve-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advisorId: advisor.id,
          adminName: currentUser?.name || 'Jair Magallanes'
        })
      });
    } catch (e) {
      console.warn('API error, falling back locally', e);
    }

    const updatedUser: UserProfile = {
      ...advisor,
      accountStatus: 'activo',
      emailVerified: true,
      approvedByAdminAt: new Date().toISOString(),
      approvedByAdminName: currentUser?.name || 'Jair Magallanes (Administrador)'
    };

    const updatedUsers = usersList.map(u => u.id === advisor.id ? updatedUser : u);
    setUsersList(updatedUsers);
    localStorage.setItem('colorlink_registered_users', JSON.stringify(updatedUsers));

    // Send confirmation email
    const approvalEmail = createAdvisorApprovalEmail(updatedUser, currentUser?.name || 'Jair Magallanes');
    saveEmailNotification(approvalEmail);
    setNotificationList(getEmailNotifications());

    setApprovalActionFeedback(`¡Asesor ${advisor.name} aprobado exitosamente! Se le ha enviado un correo de bienvenida y activación.`);
    setTimeout(() => setApprovalActionFeedback(null), 4500);
  };

  const handleRejectAdvisor = async (advisor: UserProfile) => {
    if (!window.confirm(`¿Seguro que deseas rechazar la solicitud de ${advisor.name}?`)) return;

    try {
      await fetch('/api/auth/reject-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advisorId: advisor.id,
          adminName: currentUser?.name || 'Jair Magallanes',
          reason: 'Documentación incompleta o no autorizada por Pintuco.'
        })
      });
    } catch (e) {
      console.warn(e);
    }

    const updatedUsers = usersList.map(u => {
      if (u.id === advisor.id) {
        return { ...u, accountStatus: 'rechazado' as const };
      }
      return u;
    });
    setUsersList(updatedUsers);
    localStorage.setItem('colorlink_registered_users', JSON.stringify(updatedUsers));

    setApprovalActionFeedback(`La solicitud de ${advisor.name} ha sido rechazada.`);
    setTimeout(() => setApprovalActionFeedback(null), 4000);
  };

  const activeRoleInfo = ROLES_METADATA[selectedRole] || ROLES_METADATA.asesor;
  const currentRolePerms = localMatrix[selectedRole] || DEFAULT_ROLE_PERMISSIONS[selectedRole] || {};

  const categories = [
    'Navegación & Vistas',
    'Operaciones & Cotizaciones',
    'Gestión Técnica & Stock',
    'Administración del Sistema'
  ] as const;

  const countActivePerms = (role: UserRole) => {
    const perms = localMatrix[role] || {};
    return Object.values(perms).filter(Boolean).length;
  };

  const filteredUsers = usersList.filter(u => 
    (u.name || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    (u.companyOrOrg && u.companyOrOrg.toLowerCase().includes(userSearchTerm.toLowerCase()))
  );

  const filteredNotifications = notificationList.filter(n => {
    const to = (n as any).to || (n as any).toEmail || '';
    const name = n.toName || '';
    const subject = n.subject || '';
    const search = auditEmailSearch.toLowerCase();
    return to.toLowerCase().includes(search) ||
      name.toLowerCase().includes(search) ||
      subject.toLowerCase().includes(search);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1E216B] via-[#2E3192] to-blue-900 rounded-2xl p-6 text-white shadow-xl border border-blue-800/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-13 h-13 rounded-2xl bg-[#FF6B35] text-white flex items-center justify-center font-black shadow-lg shadow-orange-500/30 shrink-0 border border-orange-300/40">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Centro de Control de Roles, Permisos & Aprobaciones
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#F7C548] text-[#1E216B] text-xs font-black uppercase tracking-wider shadow-xs">
                  Modo Administrador
                </span>
              </div>
              <p className="text-blue-200 text-xs sm:text-sm mt-1 max-w-2xl">
                Configura en tiempo real qué módulos puede visualizar y qué acciones tiene autorizadas cada rol del ecosistema COLORLINK, aprueba solicitudes de Asesores Pintuco y audita los correos de verificación.
              </p>
            </div>
          </div>

          {/* Quick Stats & Action Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {onOpenSupabaseModal && (
              <button
                onClick={onOpenSupabaseModal}
                id="btn-admin-supabase-status"
                className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 rounded-xl text-xs font-bold transition-all border border-emerald-400/40 flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Ver estado de conexión y probar Supabase PostgreSQL"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Base de Datos Supabase</span>
              </button>
            )}
            <button
              onClick={handleResetDefaults}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
              title="Restablecer permisos de fábrica"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-200" />
              <span>Valores por Defecto</span>
            </button>
            <button
              onClick={handleSaveAll}
              id="btn-guardar-permisos"
              className="px-5 py-2 bg-[#FF6B35] hover:bg-[#E85520] text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-md hover:shadow-orange-500/25 flex items-center gap-2 cursor-pointer border border-orange-400/40 active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Matriz de Permisos</span>
            </button>
          </div>
        </div>

        {/* Administrator Profile Card */}
        <div className="mt-4 pt-3 border-t border-blue-800/40 flex flex-wrap items-center justify-between gap-3 text-xs bg-white/5 px-3.5 py-2 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-blue-200">Administrador General del Sistema:</span>
            <strong className="text-[#F7C548] font-bold">JAIR MAGALLANES</strong>
            <span className="text-blue-300 hidden sm:inline">(jairmagallanes@gmail.com)</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-blue-200">
            <span>WhatsApp Oficial: <strong className="text-white font-medium">+57 323 603 0829</strong></span>
            <span className="hidden md:inline">•</span>
            {onOpenSupabaseModal ? (
              <button
                onClick={onOpenSupabaseModal}
                className="text-emerald-300 hover:text-emerald-100 font-semibold flex items-center gap-1 cursor-pointer bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-500/30"
              >
                <Database className="w-3 h-3 text-emerald-400" />
                <span>Supabase Conectado</span>
              </button>
            ) : (
              <span className="hidden md:inline text-emerald-300 font-semibold">Gobernanza RBAC & Aprobación Central</span>
            )}
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-blue-800/60 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-white text-[#2E3192] shadow-md font-black'
                : 'text-blue-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Configuración por Rol</span>
          </button>

          <button
            onClick={() => setViewMode('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-white text-[#2E3192] shadow-md font-black'
                : 'text-blue-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tabla Comparativa General</span>
          </button>

          <button
            onClick={() => setViewMode('approvals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative ${
              viewMode === 'approvals'
                ? 'bg-white text-[#2E3192] shadow-md font-black'
                : 'text-blue-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Aprobación de Asesores</span>
            {pendingAdvisors.length > 0 && (
              <span className="px-1.5 py-0.2 bg-[#FF6B35] text-white text-[10px] font-black rounded-full shadow-2xs">
                {pendingAdvisors.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setViewMode('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'users'
                ? 'bg-white text-[#2E3192] shadow-md font-black'
                : 'text-blue-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Directorio de Usuarios ({usersList.length})</span>
          </button>

          <button
            onClick={() => {
              setNotificationList(getEmailNotifications());
              setViewMode('emails');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'emails'
                ? 'bg-white text-[#2E3192] shadow-md font-black'
                : 'text-blue-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Auditoría de Correos ({notificationList.length})</span>
          </button>
        </div>
      </div>

      {/* Save Success Toast */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center justify-between gap-3 text-emerald-900 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">
              ¡Matriz de permisos guardada y aplicada exitosamente! La navegación y acciones se han actualizado en tiempo real.
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md">
            SINCRONIZADO
          </span>
        </div>
      )}

      {approvalActionFeedback && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl flex items-center gap-2.5 text-emerald-900 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{approvalActionFeedback}</span>
        </div>
      )}

      {userRoleChangedToast && (
        <div className="p-3 bg-blue-50 border border-blue-300 rounded-xl flex items-center gap-2.5 text-blue-900 animate-in fade-in">
          <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-xs font-bold">{userRoleChangedToast}</span>
        </div>
      )}

      {/* MODE 1: BY ROLE CARDS & ACCORDION */}
      {viewMode === 'cards' && (
        <div className="space-y-6">
          
          {/* Roles Selector Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {(Object.keys(ROLES_METADATA) as UserRole[]).map(roleKey => {
              const meta = ROLES_METADATA[roleKey];
              const isSelected = selectedRole === roleKey;
              const activeCount = countActivePerms(roleKey);

              return (
                <button
                  key={roleKey}
                  onClick={() => setSelectedRole(roleKey)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white border-[#FF6B35] shadow-lg ring-2 ring-[#FF6B35]/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 right-0 w-2 h-full bg-[#FF6B35]"></div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${meta.badgeBg} ${meta.badgeText} uppercase`}>
                        {meta.shortLabel}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">
                        {activeCount}/{PERMISSION_DEFINITIONS.length}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">
                      {meta.label}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate">{meta.shortLabel}</span>
                    <span className="text-[#2E3192] font-black text-xs">Editar →</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Role Configuration Details */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-200 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2E3192] flex items-center justify-center font-black text-lg border border-blue-200">
                  {activeRoleInfo.shortLabel.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Permisos para: {activeRoleInfo.label}
                    </h3>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${activeRoleInfo.badgeBg} ${activeRoleInfo.badgeText} uppercase`}>
                      {activeRoleInfo.shortLabel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeRoleInfo.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">
                  {countActivePerms(selectedRole)} de {PERMISSION_DEFINITIONS.length} permisos activos
                </span>
              </div>
            </div>

            {/* Permissions by Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {categories.map((category) => {
                const perms = PERMISSION_DEFINITIONS.filter(p => p.category === category);
                return (
                  <div key={category} className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                    <h4 className="font-extrabold text-xs text-[#2E3192] uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-200">
                      <Sparkles className="w-3.5 h-3.5 text-[#FF6B35]" />
                      <span>{category}</span>
                    </h4>

                    <div className="space-y-2">
                      {perms.map((perm) => {
                        const isChecked = !!currentRolePerms[perm.key];
                        const isLockedAdmin = selectedRole === 'administrador' && perm.key === 'gestionar_roles_permisos';

                        return (
                          <div
                            key={perm.key}
                            className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                              isChecked
                                ? 'bg-white border-blue-200 shadow-2xs'
                                : 'bg-slate-100/60 border-slate-200 opacity-60'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-slate-900">
                                  {perm.label}
                                </span>
                                {isLockedAdmin && (
                                  <span className="text-[9px] font-extrabold bg-purple-100 text-purple-900 px-1.5 py-0.2 rounded">
                                    REQUERIDO
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                {perm.description}
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={isLockedAdmin}
                              onClick={() => handleTogglePermission(selectedRole, perm.key)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                isChecked ? 'bg-[#FF6B35]' : 'bg-slate-300'
                              } ${isLockedAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                  isChecked ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: MATRIX TABLE */}
      {viewMode === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#2E3192]" />
                Matriz Comparativa de Permisos por Rol
              </h3>
              <p className="text-xs text-slate-500">
                Visualiza y conmuta permisos de todos los roles de forma simultánea.
              </p>
            </div>
            <button
              onClick={handleSaveAll}
              className="px-5 py-2 bg-[#FF6B35] hover:bg-[#E85520] text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-xs cursor-pointer border border-orange-400/30"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Matriz Completa</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1E216B] text-white font-bold border-b border-blue-900">
                  <th className="p-3.5 min-w-[220px]">Permiso / Funcionalidad</th>
                  <th className="p-3.5 text-center min-w-[120px]">Administrador</th>
                  <th className="p-3.5 text-center min-w-[130px]">Asesor Pintuco</th>
                  <th className="p-3.5 text-center min-w-[130px]">Cliente Empresa</th>
                  <th className="p-3.5 text-center min-w-[130px]">Cliente Hogar</th>
                  <th className="p-3.5 text-center min-w-[120px]">Contratista</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((category) => {
                  const perms = PERMISSION_DEFINITIONS.filter(p => p.category === category);
                  return (
                    <React.Fragment key={category}>
                      <tr className="bg-slate-100/80 font-black text-[#2E3192] text-[11px] uppercase tracking-wider">
                        <td colSpan={6} className="px-3.5 py-2">
                          {category}
                        </td>
                      </tr>
                      {perms.map((p) => (
                        <tr key={p.key} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-800">{p.label}</div>
                            <div className="text-[10px] text-slate-500">{p.description}</div>
                          </td>

                          {(['administrador', 'asesor', 'cliente_empresa', 'cliente_natural', 'contratista'] as UserRole[]).map((r) => {
                            const isChecked = !!(localMatrix[r] && localMatrix[r][p.key]);
                            const isLockedAdmin = r === 'administrador' && p.key === 'gestionar_roles_permisos';

                            return (
                              <td key={r} className="p-3.5 text-center">
                                <button
                                  type="button"
                                  disabled={isLockedAdmin}
                                  onClick={() => handleTogglePermission(r, p.key)}
                                  className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                                    isChecked
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-slate-200 text-slate-400 hover:bg-slate-300'
                                  } ${isLockedAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                                  title={isChecked ? 'Permiso Concedido' : 'Permiso Denegado'}
                                >
                                  {isChecked ? <Check className="w-4 h-4 font-bold" /> : <X className="w-3.5 h-3.5" />}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODE: ADVISOR APPROVALS */}
      {viewMode === 'approvals' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#FF6B35]" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Aprobación de Asesores Técnicos Comerciales Pintuco
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Los perfiles registrados como Asesores requieren autorización formal del Administrador para acceder a la gestión de cotizaciones de obra y stock de CEDIs.
              </p>
            </div>
            <div className="text-xs font-bold px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>{pendingAdvisors.length} solicitud(es) pendiente(s)</span>
            </div>
          </div>

          {pendingAdvisors.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50/70 border border-slate-200 rounded-2xl">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-black text-slate-800">
                ¡No hay solicitudes de Asesores pendientes!
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Todos los asesores registrados han sido revisados y autorizados para operar en la plataforma.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingAdvisors.map((advisor) => (
                <div
                  key={advisor.id}
                  className="p-5 bg-gradient-to-r from-amber-50/60 to-orange-50/40 border-2 border-amber-300/80 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center text-base shrink-0 shadow-md">
                      {advisor.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-slate-900 text-sm">{advisor.name}</h4>
                        <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-950 font-black text-[10px] uppercase tracking-wide">
                          Pendiente de Aprobación
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1 font-medium">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {advisor.email}
                        </span>
                        {advisor.phone && (
                          <span>📞 {advisor.phone}</span>
                        )}
                        <span className="font-semibold text-[#2E3192]">
                          🏢 {advisor.companyOrOrg || 'Pintuco'} • {advisor.city || 'Medellín'}
                        </span>
                        {advisor.positionOrTitle && (
                          <span className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded font-medium text-[11px]">
                            💼 {advisor.positionOrTitle}
                          </span>
                        )}
                        {advisor.address && (
                          <span className="text-slate-600 text-[11px]">
                            📍 {advisor.address}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-amber-800 mt-1.5 flex items-center gap-2">
                        <span>Código de correo validado: <strong className="font-mono">{advisor.verificationToken || '749201'}</strong></span>
                        {advisor.nitOrDoc && (
                          <span className="text-slate-600">• Doc/NIT: <strong>{advisor.nitOrDoc}</strong></span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => handleRejectAdvisor(advisor)}
                      className="px-3 py-2 bg-white hover:bg-red-50 text-red-600 font-bold text-xs rounded-xl border border-red-200 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Rechazar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApproveAdvisor(advisor)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md hover:shadow-emerald-600/25 transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-400"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Aprobar Asesor & Enviar Correo</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODE 3: USERS LIST & ROLE ASSIGNMENTS */}
      {viewMode === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-[#2E3192]" />
                Directorio y Asignación de Roles de Usuarios
              </h3>
              <p className="text-xs text-slate-500">
                Cambia el rol de cualquier usuario registrado para otorgarle los permisos configurados o revisa su estado de activación.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, correo o empresa..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3">Usuario & Nombre</th>
                  <th className="p-3">Correo & Contacto</th>
                  <th className="p-3">Empresa / Ciudad</th>
                  <th className="p-3">Estado de Cuenta</th>
                  <th className="p-3">Rol Asignado</th>
                  <th className="p-3 text-right">Acción Rápida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const normalizedRole = normalizeUserRole(user.role);
                  const isPendingAdvisor = user.role === 'asesor' && user.accountStatus === 'pendiente_aprobacion_admin';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#2E3192] text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                            {user.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{user.name}</div>
                            <div className="text-[10px] text-slate-500">
                              {user.positionOrTitle ? `${user.positionOrTitle} • ` : ''}ID: {user.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-medium text-slate-700">{user.email}</div>
                        <div className="text-[10px] text-slate-500">
                          {user.phone ? `📞 ${user.phone}` : 'Sin teléfono'}
                          {user.nitOrDoc ? ` • NIT: ${user.nitOrDoc}` : ''}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-medium text-slate-700">{user.companyOrOrg || 'Particular'}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                          {user.city || 'Colombia'}{user.address ? ` • ${user.address}` : ''}
                        </div>
                      </td>

                      <td className="p-3">
                        {isPendingAdvisor ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-extrabold text-[10px]">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pendiente Aprobación
                          </span>
                        ) : user.accountStatus === 'rechazado' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-800 font-extrabold text-[10px]">
                            <XCircle className="w-3 h-3 text-red-600" />
                            Rechazado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Activo & Verificado
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <select
                          value={normalizedRole}
                          onChange={(e) => handleChangeUserRole(user.id, e.target.value as UserRole)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                        >
                          <option value="administrador">👑 Administrador del Sistema</option>
                          <option value="asesor">👔 Asesor Técnico Comercial Pintuco</option>
                          <option value="cliente_empresa">🏢 Cliente Empresa / Constructora</option>
                          <option value="cliente_natural">👤 Cliente Persona Natural / Hogar</option>
                          <option value="contratista">🛠️ Pintor / Contratista Certificado</option>
                        </select>
                      </td>

                      <td className="p-3 text-right space-x-1.5">
                        {isPendingAdvisor ? (
                          <button
                            type="button"
                            onClick={() => handleApproveAdvisor(user)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                          >
                            Aprobar
                          </button>
                        ) : null}

                        {onSimulateRoleLogin && (
                          <button
                            onClick={() => onSimulateRoleLogin(user)}
                            className="px-3 py-1 bg-blue-50 hover:bg-[#2E3192] hover:text-white text-[#2E3192] font-bold text-[11px] rounded-lg transition-colors border border-blue-200 cursor-pointer"
                            title="Iniciar sesión como este usuario"
                          >
                            Entrar como usuario
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODE 4: AUDITORIA DE CORREOS */}
      {viewMode === 'emails' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <Inbox className="w-5 h-5 text-[#FF6B35]" />
                <h3 className="font-extrabold text-slate-900 text-base">
                  Auditoría de Notificaciones & Correos Electrónicos Enviados
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Historial de correos enviados por el sistema para validación de perfiles, activación de roles y alertas al administrador.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {onOpenEmailNotifications && (
                <button
                  type="button"
                  onClick={onOpenEmailNotifications}
                  className="px-3 py-1.5 bg-[#2E3192] hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Abrir Buzón de Correo Simulado</span>
                </button>
              )}

              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={auditEmailSearch}
                  onChange={(e) => setAuditEmailSearch(e.target.value)}
                  placeholder="Buscar correo..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className="p-4 bg-slate-50 hover:bg-blue-50/40 border border-slate-200 rounded-2xl transition-colors space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      notif.type === 'verificacion_registro'
                        ? 'bg-blue-100 text-[#1E216B]'
                        : notif.type === 'aprobacion_asesor'
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      {notif.type.replace(/_/g, ' ')}
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                      {notif.subject}
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(notif.sentAt).toLocaleString('es-CO')}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs text-slate-600 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span>Para: <strong>{notif.toName || (notif as any).to}</strong> ({notif.to || (notif as any).toEmail || 'Destinatario'})</span>
                    {notif.verificationToken && (
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono font-bold text-[#2E3192]">
                        Token: {notif.verificationToken}
                      </span>
                    )}
                  </div>

                  {onOpenEmailNotifications && (
                    <button
                      type="button"
                      onClick={onOpenEmailNotifications}
                      className="text-[#2E3192] hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver correo</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
