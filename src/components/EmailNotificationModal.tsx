import React, { useState, useEffect } from 'react';
import { EmailNotificationRecord, UserProfile } from '../types';
import { 
  Mail, 
  X, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Eye, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Sparkles, 
  Inbox, 
  UserCheck 
} from 'lucide-react';
import { getRoleLabel, getRoleShortLabel } from '../utils/rbac';

interface EmailNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: EmailNotificationRecord[];
  currentUser: UserProfile | null;
  onValidateTokenFromEmail: (token: string, email: string) => void;
  onMarkAsRead: (id: string) => void;
  onClearAll?: () => void;
}

export const EmailNotificationModal: React.FC<EmailNotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  currentUser,
  onValidateTokenFromEmail,
  onMarkAsRead,
  onClearAll
}) => {
  const [selectedEmail, setSelectedEmail] = useState<EmailNotificationRecord | null>(null);
  const [filterType, setFilterType] = useState<'my' | 'admin'>('my');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // NOTE: Modal only closes when the user explicitly clicks the "Cerrar" button.
  // Backdrop click and accidental ESC key closing have been disabled per requirement.

  if (!isOpen) return null;

  const userEmail = (currentUser?.email || '').toLowerCase().trim();
  const isAdmin = currentUser?.role === 'administrador';

  // Strict user isolation: Only show emails belonging to the logged-in user (or admin alerts if administrator)
  const userEmails = (notifications || []).filter((n) => {
    if (!currentUser || !userEmail) return false;
    const to = (n?.to || (n as any)?.toEmail || '').toLowerCase().trim();
    if (to === userEmail) return true;
    if (isAdmin && (n?.type === 'alerta_admin_asesor' || to.includes('admin') || to.includes('jairmagallanes@gmail.com'))) return true;
    return false;
  });

  const filteredEmails = userEmails.filter((n) => {
    const to = (n?.to || (n as any)?.toEmail || '').toLowerCase().trim();
    if (filterType === 'admin' && isAdmin) {
      return n?.type === 'alerta_admin_asesor' || to.includes('admin') || to.includes('jairmagallanes@gmail.com');
    }
    // Default 'my':
    return to === userEmail || !isAdmin;
  });

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleSelectEmail = (email: EmailNotificationRecord) => {
    setSelectedEmail(email);
    onMarkAsRead(email.id);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative w-full max-w-4xl h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E216B] via-[#2E3192] to-blue-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-blue-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F7C548] text-[#1E216B] font-black flex items-center justify-center text-lg shadow-sm">
              <Mail className="w-5 h-5 text-[#1E216B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  Bandeja de Notificaciones & Correos
                </h3>
                {currentUser && (
                  <span className="bg-blue-500/30 text-blue-100 text-xs px-2 py-0.5 rounded-full font-bold border border-blue-400/30">
                    {userEmails.length} {userEmails.length === 1 ? 'correo' : 'correos'}
                  </span>
                )}
              </div>
              <p className="text-blue-200 text-xs font-medium truncate max-w-md">
                {currentUser 
                  ? `Bandeja privada de: ${currentUser.name} (${currentUser.email})` 
                  : 'Inicia sesión para consultar tus notificaciones'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            id="btn-close-email-modal"
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-600/90 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
            <span>Cerrar</span>
          </button>
        </div>

        {/* Filter bar / Account status */}
        <div className="bg-slate-50 p-2.5 sm:px-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-2 text-xs font-bold">
              <button
                onClick={() => setFilterType('my')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterType === 'my'
                    ? 'bg-[#2E3192] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Mis Correos ({userEmails.filter(n => (n?.to || (n as any)?.toEmail || '').toLowerCase().trim() === userEmail).length})</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => setFilterType('admin')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterType === 'admin'
                      ? 'bg-[#2E3192] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Alertas Admin ({userEmails.filter(n => n?.type === 'alerta_admin_asesor' || (n?.to || '').includes('admin')).length})</span>
                </button>
              )}
            </div>
          ) : (
            <div className="text-xs text-amber-800 font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Debes tener una sesión activa para consultar tus mensajes.</span>
            </div>
          )}

          {selectedEmail && (
            <button
              onClick={() => setSelectedEmail(null)}
              className="text-xs font-semibold text-[#2E3192] hover:underline cursor-pointer sm:hidden"
            >
              ← Volver a la lista
            </button>
          )}
        </div>

        {/* Content Body */}
        {!currentUser ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 shadow-inner">
              <Mail className="w-8 h-8" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900">
              Sesión No Iniciada
            </h4>
            <p className="text-xs text-slate-600 max-w-sm mt-1 mb-4 leading-relaxed">
              Por motivos de privacidad y seguridad, la bandeja de notificaciones solo muestra los correos pertenecientes a la cuenta que tiene una sesión iniciada.
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#2E3192] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Cerrar y Abrir Inicio de Sesión
            </button>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            
            {/* Left Column: Email list */}
            <div className={`w-full sm:w-2/5 border-r border-slate-200 overflow-y-auto bg-slate-50/50 ${selectedEmail ? 'hidden sm:block' : 'block'}`}>
              {filteredEmails.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Inbox className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-semibold text-slate-600">No hay correos en tu bandeja.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Los correos dirigidos a {currentUser.email} aparecerán aquí automáticamente.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {filteredEmails.map((item) => {
                    const isSelected = selectedEmail?.id === item.id;
                    const isAdvisorAlert = item.type === 'alerta_admin_asesor';
                    const isApproval = item.type === 'aprobacion_asesor';

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectEmail(item)}
                        className={`p-3.5 sm:p-4 text-left transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-blue-50/90 border-l-4 border-l-[#FF6B35]'
                            : 'hover:bg-slate-100/70 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            isAdvisorAlert 
                              ? 'bg-purple-100 text-purple-900 border border-purple-200' 
                              : isApproval 
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : 'bg-blue-100 text-blue-900 border border-blue-200'
                          }`}>
                            {item.type === 'alerta_admin_asesor' ? 'Alerta Admin' : item.type === 'aprobacion_asesor' ? 'Aprobado' : 'Verificación'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="font-bold text-xs text-slate-900 truncate">
                          {item.toName} &lt;{item.to}&gt;
                        </div>

                        <div className="text-xs font-semibold text-slate-800 truncate mt-0.5">
                          {item.subject}
                        </div>

                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {item.previewSnippet}
                        </p>

                        {item.verificationToken && (
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#2E3192] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              Código: {item.verificationToken}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Email Preview & Quick Actions */}
            <div className={`w-full sm:w-3/5 overflow-y-auto p-4 sm:p-6 bg-slate-100 ${!selectedEmail ? 'hidden sm:flex sm:items-center sm:justify-center' : 'block'}`}>
              {selectedEmail ? (
                <div className="space-y-4 max-w-2xl mx-auto">
                  {/* Action Banner if has verification token */}
                  {selectedEmail.verificationToken && selectedEmail.type === 'verificacion_cuenta' && (
                    <div className="bg-gradient-to-r from-orange-500 to-[#FF6B35] text-white p-4 rounded-xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider text-orange-100">
                          Acción Requerida
                        </div>
                        <div className="text-sm font-extrabold">
                          Código de Activación: <span className="font-mono bg-white/20 px-2 py-0.5 rounded text-white tracking-widest">{selectedEmail.verificationToken}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleCopy(selectedEmail.verificationToken!)}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedToken === selectedEmail.verificationToken ? 'Copiado' : 'Copiar'}</span>
                        </button>
                        <button
                          onClick={() => {
                            onValidateTokenFromEmail(selectedEmail.verificationToken!, selectedEmail.to);
                            onClose();
                          }}
                          className="px-4 py-1.5 bg-white text-[#FF6B35] hover:bg-orange-50 rounded-lg text-xs font-black shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Validar y Activar Perfil Ahora</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Email HTML Container */}
                  <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">De:</span>
                        <span className="font-bold text-slate-800">COLORLINK Pintuco® &lt;no-reply@pintuco.com&gt;</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Para:</span>
                        <span className="font-bold text-slate-800">{selectedEmail.toName} &lt;{selectedEmail.to}&gt;</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Fecha:</span>
                        <span className="text-slate-600">{new Date(selectedEmail.sentAt).toLocaleString('es-CO')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Asunto:</span>
                        <span className="font-extrabold text-[#1E216B]">{selectedEmail.subject}</span>
                      </div>
                    </div>

                    <div 
                      className="p-4 sm:p-6"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 text-slate-400">
                  <Mail className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <h4 className="text-sm font-bold text-slate-700">Selecciona un correo para previsualizar</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Aquí verás los correos de verificación y avisos de aprobación generados por COLORLINK dirigidos a tu cuenta.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
