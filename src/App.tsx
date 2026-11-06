import React, { useState, useEffect } from 'react';
import { ProjectRecord, ProjectStatus, UserProfile, RolePermissionsMatrix, EmailNotificationRecord } from './types';
import { Header } from './components/Header';
import { CompanyIdentity } from './components/CompanyIdentity';
import { CotizadorView } from './components/CotizadorView';
import { IntelligentCaptureForm } from './components/IntelligentCaptureForm';
import { ProjectsTracker } from './components/ProjectsTracker';
import { InventoryCediView } from './components/InventoryCediView';
import { AdminRbacView } from './components/AdminRbacView';
import { ColorVisualizerView } from './components/ColorVisualizerView';
import { LiveTrackingView } from './components/LiveTrackingView';
import { PurchasesView } from './components/PurchasesView';
import { ChatbotView } from './components/ChatbotView';
import { AuthModal } from './components/AuthModal';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { EmailNotificationModal } from './components/EmailNotificationModal';
import { SupabaseConnectionModal } from './components/SupabaseConnectionModal';
import { INITIAL_PROJECTS } from './data/mockProjects';
import { getSavedPermissionsMatrix, savePermissionsMatrix, checkUserPermission, normalizeUserRole, ActiveTabType } from './utils/rbac';
import { getEmailNotifications, saveEmailNotification } from './utils/mailer';
import { Mail, CheckCircle2, X, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTabType>('inicio');
  const [projects, setProjects] = useState<ProjectRecord[]>(INITIAL_PROJECTS);
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null);
  
  // Modals & Notifications state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState<EmailNotificationRecord[]>(() => getEmailNotifications().filter(item => item.type !== 'verificacion_cuenta'));
  const [unreadEmailCount, setUnreadEmailCount] = useState(0);
  const [emailToast, setEmailToast] = useState<{ title: string; message: string; email: string } | null>(null);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    // Every app launch starts signed out; users must explicitly sign in again.
    try { localStorage.removeItem('colorlink_user'); } catch {}
    return null;
  });

  const [permissionsMatrix, setPermissionsMatrix] = useState<RolePermissionsMatrix>(() => getSavedPermissionsMatrix());
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  const goToProjectCapture = () => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    setActiveTab('captura');
  };

  useEffect(() => {
    const handleQuota = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Load the signed-in user's inbox from the server, preserving local drafts as fallback.
  const refreshEmailNotifications = async () => {
    const allLocalEmails = getEmailNotifications();
    const localEmails = allLocalEmails.filter(item => item.type !== 'verificacion_cuenta');
    if (localEmails.length !== allLocalEmails.length) {
      localStorage.setItem('colorlink_email_notifications', JSON.stringify(localEmails));
    }
    let emails = localEmails;
    if (currentUser?.email) {
      try {
        const response = await fetch(`/api/notifications/emails?to=${encodeURIComponent(currentUser.email)}`);
        const payload = await response.json();
        if (response.ok && Array.isArray(payload.data)) {
          const byId = new Map<string, EmailNotificationRecord>();
          [...localEmails, ...payload.data].forEach((item: EmailNotificationRecord) => byId.set(item.id, item));
          emails = [...byId.values()];
        }
      } catch { /* use the local inbox when the server is unreachable */ }
    }
    setEmailNotifications(emails);
    
    if (!currentUser || !currentUser.email) {
      setUnreadEmailCount(0);
      return;
    }

    const userEmail = (currentUser.email || '').toLowerCase().trim();
    const isAdmin = currentUser.role === 'administrador';
    
    const userEmails = emails.filter(e => {
      const to = ((e as any)?.to || (e as any)?.toEmail || '').toLowerCase().trim();
      if (to === userEmail) return true;
      if (isAdmin && (e.type === 'alerta_admin_asesor' || to.includes('jairmagallanes@gmail.com'))) return true;
      return false;
    });

    const unread = userEmails.filter(e => !e.isRead).length;
    setUnreadEmailCount(unread);
  };

  useEffect(() => {
    refreshEmailNotifications();
    const interval = setInterval(refreshEmailNotifications, 3000);
    return () => clearInterval(interval);
  }, [isEmailModalOpen, currentUser]);

  // Sync matrix changes and enforce valid tab access
  const handleUpdatePermissions = (newMatrix: RolePermissionsMatrix) => {
    setPermissionsMatrix(newMatrix);
    savePermissionsMatrix(newMatrix);
  };

  // If user role changes or matrix changes, ensure active tab is still accessible
  useEffect(() => {
    if (activeTab === 'admin_rbac') {
      const userRole = normalizeUserRole(currentUser?.role);
      if (userRole !== 'administrador') {
        setActiveTab('inicio');
      }
    } else if (activeTab === 'cedis') {
      const canView = checkUserPermission(currentUser, 'ver_inventario_cedis', permissionsMatrix);
      if (!canView) setActiveTab('inicio');
    } else if (activeTab === 'captura') {
      const canView = Boolean(currentUser) && checkUserPermission(currentUser, 'crear_captura_proyecto', permissionsMatrix);
      if (!canView) setActiveTab('inicio');
    }
  }, [currentUser, permissionsMatrix, activeTab]);

  // Keep project state fresh so tracking follows newly recorded dispatch updates.
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projects');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setProjects(json.data);
          }
        }
      } catch (err) {
        console.warn('Using initial projects in memory:', err);
      }
    };
    fetchProjects();
    const interval = setInterval(fetchProjects, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('colorlink_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('colorlink_user');
  };

  const handleRegistrationComplete = (user: UserProfile, emailRecord?: EmailNotificationRecord) => {
    refreshEmailNotifications();
    setEmailToast({
      title: emailRecord?.emailSent ? '📩 Código de activación enviado' : '⚠️ Correo pendiente de configuración',
      message: emailRecord?.emailSent ? `Enviamos el código de activación a ${user.email}.` : `No se pudo entregar el código a ${user.email}. Configura el correo saliente y vuelve a solicitar el código.`,
      email: user.email
    });
    setTimeout(() => {
      setEmailToast(null);
    }, 9000);
  };

  const handleValidateTokenFromEmail = async (token: string, email: string) => {
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email })
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        handleLogin(data.user);
      }

      // Mark notification as read and action taken in local storage
      const currentList = getEmailNotifications();
      const updatedList = currentList.map(n => {
        if (n.to.toLowerCase() === email.toLowerCase() && n.verificationToken === token) {
          return { ...n, isRead: true, actionTaken: true };
        }
        return n;
      });
      localStorage.setItem('colorlink_email_notifications', JSON.stringify(updatedList));
      refreshEmailNotifications();

      setEmailToast({
        title: '✅ ¡Cuenta Validada Exitosamente!',
        message: data.message || `El correo ${email} ha sido validado correctamente.`,
        email
      });
      setTimeout(() => setEmailToast(null), 6000);
    } catch (err) {
      console.error('Error validating token from email:', err);
    }
  };

  const handleMarkEmailAsRead = (id: string) => {
    const currentList = getEmailNotifications();
    const updatedList = currentList.map(n => n.id === id ? { ...n, isRead: true } : n);
    localStorage.setItem('colorlink_email_notifications', JSON.stringify(updatedList));
    refreshEmailNotifications();
    // Also notify server
    fetch(`/api/notifications/emails/${id}/read`, { method: 'PATCH' }).catch(() => {});
  };

  const handleClearAllEmails = async () => {
    if (currentUser?.email) {
      try {
        await fetch(`/api/notifications/emails?to=${encodeURIComponent(currentUser.email)}`, { method: 'DELETE' });
      } catch { /* clear the local inbox even if the server is unavailable */ }
    }
    localStorage.removeItem('colorlink_email_notifications');
    refreshEmailNotifications();
  };

  const handleProjectCreated = (newProject: ProjectRecord) => {
    setProjects((prev) => [newProject, ...prev]);
    setSelectedProject(newProject);
  };

  const handleUpdateProjectStatus = async (projectId: string, newStatus: ProjectStatus) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setProjects((prev) =>
            prev.map((p) => (p.id === projectId ? json.data : p))
          );
          if (selectedProject?.id === projectId) {
            setSelectedProject(json.data);
          }
        }
      } else {
        // Local fallback update
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
        );
        if (selectedProject?.id === projectId) {
          setSelectedProject({ ...selectedProject, status: newStatus });
        }
      }
    } catch (e) {
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
      );
      if (selectedProject?.id === projectId) {
        setSelectedProject({ ...selectedProject, status: newStatus });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F6] text-slate-800 flex flex-col font-sans selection:bg-[#FF6B35] selection:text-white">
      {mapsQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}
      
      {/* Top Header with 2-tier layout, branding, unread notification count & RBAC tab filters */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        permissionsMatrix={permissionsMatrix}
        onOpenAuth={() => setIsAuthOpen(true)}
        onNewProjectClick={goToProjectCapture}
        onOpenEmails={() => setIsEmailModalOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        unreadEmailCount={unreadEmailCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        
        {activeTab === 'inicio' && (
          <CompanyIdentity
            onGoToCapture={goToProjectCapture}
            onGoToProjects={() => setActiveTab('proyectos')}
            onGoToCotizador={() => setActiveTab('cotizador')}
            onGoToVisualizer={() => setActiveTab('visualizador')}
            onGoToTracking={() => setActiveTab('tracking')}
          />
        )}

        {activeTab === 'cotizador' && (
          <CotizadorView
            currentUser={currentUser}
            permissionsMatrix={permissionsMatrix}
            onOpenAuth={() => setIsAuthOpen(true)}
            onQuoteConvertedToProject={(newProj) => {
              setProjects((prev) => [newProj, ...prev]);
              setSelectedProject(newProj);
            }}
            onGoToProjects={() => setActiveTab('proyectos')}
          />
        )}

        {activeTab === 'captura' && (
          <IntelligentCaptureForm
            currentUser={currentUser}
            onProjectCreated={handleProjectCreated}
            onOpenAssistant={(tech) => {
              console.log('Asistente Técnico IA activado para sustrato:', tech?.surface);
            }}
          />
        )}

        {activeTab === 'proyectos' && (
          <ProjectsTracker
            projects={projects}
            currentUser={currentUser}
            permissionsMatrix={permissionsMatrix}
            onSelectProject={(p) => setSelectedProject(p)}
            onNewProjectClick={goToProjectCapture}
          />
        )}

        {activeTab === 'cedis' && (
          <InventoryCediView
            currentUser={currentUser}
            permissionsMatrix={permissionsMatrix}
          />
        )}

        {activeTab === 'visualizador' && (
          <ColorVisualizerView />
        )}

        {activeTab === 'tracking' && (
            <LiveTrackingView
            key={currentUser?.email || 'guest'}
            projects={currentUser && ['cliente', 'cliente_empresa', 'cliente_natural'].includes(currentUser.role) ? projects.filter(p => (p.formData?.identification?.contactEmail || p.formData?.identification?.clientEmail || '').toLowerCase() === currentUser.email.toLowerCase()) : projects}
            onOpenProjectDetail={(p) => setSelectedProject(p)}
            onProjectUpdated={(updated) => {
              setProjects((prev) => prev.map((item) => item.id === updated.id ? updated : item));
              if (selectedProject?.id === updated.id) setSelectedProject(updated);
            }}
          />
        )}

        {activeTab === 'compras' && <PurchasesView />}

        {activeTab === 'admin_rbac' && (
          <AdminRbacView
            currentUser={currentUser}
            permissionsMatrix={permissionsMatrix}
            onUpdatePermissions={handleUpdatePermissions}
            onSimulateRoleLogin={(user) => {
              handleLogin(user);
            }}
            onOpenEmailNotifications={() => setIsEmailModalOpen(true)}
            onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          />
        )}

      </main>

      <ChatbotView />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-xs">
              CL
            </div>
            <div>
              <span className="font-bold text-slate-200">COLORLINK Pintuco®</span>
              <span className="text-slate-500 block text-[11px]">
                Ecosistema Inteligente de Pinturas & Recubrimientos
              </span>
            </div>
          </div>

          <div className="text-center sm:text-right text-[11px] text-slate-400">
            <span>Proyecto de Transformación Digital Inteligente • Universidad Cooperativa de Colombia (UCC)</span>
            <span className="block text-slate-500 mt-0.5">
              Integrando Producción, Inventarios CEDIs, Servicio, Calidad e IA con Control RBAC, Validación y Aprobación de Asesores.
            </span>
          </div>
        </div>
      </footer>

      {/* Floating Notification Toast */}
      {emailToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full p-4 bg-slate-900 text-white rounded-2xl shadow-2xl border border-blue-500/30 flex items-start gap-3.5 animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF6B35] to-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <Mail className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#F7C548] flex items-center gap-1.5">
              <span>{emailToast.title}</span>
            </h4>
            <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
              {emailToast.message}
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEmailModalOpen(true);
                  setEmailToast(null);
                }}
                className="px-3 py-1 bg-[#2E3192] hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Ver Correo en Bandeja</span>
                <ExternalLink className="w-3 h-3 text-[#F7C548]" />
              </button>
              <button
                type="button"
                onClick={() => setEmailToast(null)}
                className="px-2.5 py-1 text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEmailToast(null)}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Auth Modal (Login / Register / Profiles / Quick Roles / Verification) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onUpdateUser={handleLogin}
        onNavigateToRbac={() => setActiveTab('admin_rbac')}
        onOpenEmailNotifications={() => setIsEmailModalOpen(true)}
        onRegistrationComplete={handleRegistrationComplete}
      />

      {/* Email Notifications & Account Activation Modal */}
      <EmailNotificationModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        notifications={emailNotifications}
        currentUser={currentUser}
        onValidateTokenFromEmail={handleValidateTokenFromEmail}
        onMarkAsRead={handleMarkEmailAsRead}
        onClearAll={handleClearAllEmails}
      />

      {/* Project Detail / Technical Sheet Modal with RBAC status protection */}
      <ProjectDetailModal
        project={selectedProject}
        currentUser={currentUser}
        permissionsMatrix={permissionsMatrix}
        onClose={() => setSelectedProject(null)}
        onUpdateStatus={handleUpdateProjectStatus}
        onProjectUpdated={(updatedProject) => {
          setProjects(current => current.map(project => project.id === updatedProject.id ? updatedProject : project));
          setSelectedProject(updatedProject);
        }}
      />

      {/* Supabase PostgreSQL Database Connection & Status Modal */}
      <SupabaseConnectionModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

    </div>
  );
}
