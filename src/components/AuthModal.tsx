import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  User, 
  Lock, 
  Mail, 
  Building, 
  Phone, 
  MapPin, 
  ArrowRight, 
  Award, 
  LogIn, 
  UserPlus, 
  Sparkles,
  Info,
  Key,
  Briefcase,
  Building2,
  Hammer,
  Send,
  CheckCircle,
  ExternalLink,
  ShieldAlert,
  Clock,
  Edit3,
  Save,
  RotateCcw,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getRoleLabel, getRoleShortLabel, normalizeUserRole, ROLES_METADATA } from '../utils/rbac';
import { supabaseSyncService } from '../lib/supabaseSyncService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
  onNavigateToRbac?: () => void;
  onOpenEmailNotifications?: () => void;
  onUpdateUser?: (user: UserProfile) => void;
  onRegistrationComplete?: (user: UserProfile, emailRecord?: any) => void;
}

export const PRESET_DEMO_USERS: (UserProfile & { passwordHint: string; roleDesc: string })[] = [
  {
    id: 'user-demo-admin',
    name: 'Jair Magallanes',
    email: 'jairmagallanes@gmail.com',
    passwordHint: 'pintuco2026',
    role: 'administrador',
    companyOrOrg: 'COLORLINK Central Pintuco',
    positionOrTitle: 'Administrador General del Sistema & Director de Plataforma',
    nitOrDoc: '1.047.382.910',
    phone: '+57 323 603 0829',
    city: 'Medellín',
    address: 'Carrera 48 # 26-85, Edificio Sede Principal Pintuco',
    isRegistered: true,
    accountStatus: 'activo',
    emailVerified: true,
    roleDesc: '👑 Administrador General: Control total RBAC y aprobación de asesores'
  },
  {
    id: 'user-demo-advisor',
    name: 'Marcela Cifuentes',
    email: 'mcifuentes@pintuco.com',
    passwordHint: 'pintuco2026',
    role: 'asesor',
    companyOrOrg: 'Pintuco S.A. - Canal Proyectos',
    positionOrTitle: 'Especialista Técnico Comercial Proyectos',
    nitOrDoc: '890.900.120-1',
    phone: '+57 300 451 9822',
    city: 'Bogotá',
    address: 'Calle 26 # 69D-91, Centro Empresarial Arrecife',
    isRegistered: true,
    accountStatus: 'activo',
    emailVerified: true,
    approvedByAdminAt: '2026-08-26T10:00:00Z',
    approvedByAdminName: 'Jair Magallanes (Administrador)',
    roleDesc: '👔 Asesor Aprobado: Gestión técnica de obras, stock CEDIs y cotizaciones'
  },
  {
    id: 'user-pending-advisor-1',
    name: 'Ing. David Osorio',
    email: 'dosorio.proyectos@pintuco.com',
    passwordHint: 'pintuco2026',
    role: 'asesor',
    companyOrOrg: 'Pintuco Regional Occidente',
    positionOrTitle: 'Asesor Técnico en Evaluación',
    nitOrDoc: '890.900.120-1',
    phone: '+57 318 402 1199',
    city: 'Cali',
    address: 'Autopista Cali-Yumbo Km 3, Parque Industrial',
    isRegistered: true,
    accountStatus: 'pendiente_aprobacion_admin',
    emailVerified: true,
    verificationToken: '749201',
    roleDesc: '⏳ Asesor Pendiente: Requiere aprobación del Administrador'
  },
  {
    id: 'user-demo-client-empresa',
    name: 'Arq. Mateo Valenzuela',
    email: 'mvalenzuela@habitatandino.com.co',
    passwordHint: 'pintuco2026',
    role: 'cliente_empresa',
    companyOrOrg: 'Constructora & Hábitat Andino S.A.S.',
    positionOrTitle: 'Director de Obra & Especificaciones',
    nitOrDoc: '900.842.115-4',
    phone: '+57 312 849 2031',
    city: 'Medellín',
    address: 'Carrera 43A # 1Sur-220, Torre Ejecutiva El Poblado',
    isRegistered: true,
    accountStatus: 'activo',
    emailVerified: true,
    clientType: 'empresa',
    roleDesc: '🏢 Cliente B2B: Cotizaciones corporativas, aprobación y avance'
  },
  {
    id: 'user-demo-client-natural',
    name: 'Carolina Gómez',
    email: 'carolina.gomez@gmail.com',
    passwordHint: 'pintuco2026',
    role: 'cliente_natural',
    companyOrOrg: 'Particular / Residencia',
    positionOrTitle: 'Propietaria de Proyecto Residencial',
    nitOrDoc: '43.912.804',
    phone: '+57 314 789 5521',
    city: 'Medellín',
    address: 'Calle 10B # 36-45, Apto 802, Barrio Provenza',
    isRegistered: true,
    accountStatus: 'activo',
    emailVerified: true,
    clientType: 'persona_natural',
    roleDesc: '👤 Cliente Hogar: Cotizador residencial y cálculo de galones'
  },
  {
    id: 'user-demo-contractor',
    name: 'Maestro Jairo Bermúdez',
    email: 'jairo.bermudez@pintoresmaster.co',
    passwordHint: 'pintuco2026',
    role: 'contratista',
    companyOrOrg: 'Cuadrilla Máster Certificada Oro',
    positionOrTitle: 'Contratista Líder de Aplicación Certificado',
    nitOrDoc: '71.294.882',
    phone: '+57 317 623 8810',
    city: 'Cali',
    address: 'Calle 15 # 28A-40, Barrio San Fernando',
    isRegistered: true,
    accountStatus: 'activo',
    emailVerified: true,
    roleDesc: '🛠️ Pintor / Contratista: Verificación técnica y avance'
  }
];

const GOOGLE_PRESET_PROFILES: { email: string; name: string; role: UserRole; avatarUrl: string; label: string }[] = [
  {
    email: 'mvalenzuela.arq@gmail.com',
    name: 'Arq. Mateo Valenzuela',
    role: 'cliente_empresa',
    label: 'Constructora & B2B',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
  },
  {
    email: 'carolina.gomez.hogar@gmail.com',
    name: 'Carolina Gómez',
    role: 'cliente_natural',
    label: 'Cliente Hogar / Residencial',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
  },
  {
    email: 'david.osorio.pintuco@gmail.com',
    name: 'Ing. David Osorio',
    role: 'asesor',
    label: 'Asesor Técnico Pintuco',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
  },
  {
    email: 'jairo.bermudez.master@gmail.com',
    name: 'Maestro Jairo Bermúdez',
    role: 'contratista',
    label: 'Contratista Certificado',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'
  }
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  onNavigateToRbac,
  onOpenEmailNotifications,
  onUpdateUser,
  onRegistrationComplete
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'verify_email'>('login');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('cliente_empresa');
  const [company, setCompany] = useState('');
  const [positionOrTitle, setPositionOrTitle] = useState('');
  const [nit, setNit] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Medellín');
  const [address, setAddress] = useState('');
  
  // Profile editing fields
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('Medellín');
  const [editPhone, setEditPhone] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Verification states
  const [verificationTokenInput, setVerificationTokenInput] = useState('');
  const [activeVerificationTarget, setActiveVerificationTarget] = useState<UserProfile | null>(null);
  
  // Status states
  const [showAdminQuickAccess, setShowAdminQuickAccess] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleAuthTargetMode, setGoogleAuthTargetMode] = useState<'login' | 'register'>('login');
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [googleCustomName, setGoogleCustomName] = useState('');
  const [formError, setFormError] = useState('');
  const [isAlreadyRegisteredError, setIsAlreadyRegisteredError] = useState(false);
  const [isNotRegisteredError, setIsNotRegisteredError] = useState(false);
  const [pendingAdvisorBlocked, setPendingAdvisorBlocked] = useState<UserProfile | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync profile edit fields when user is loaded or edit mode is entered
  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name || '');
      setEditAddress(currentUser.address || '');
      setEditCity(currentUser.city || 'Medellín');
      setEditPhone(currentUser.phone || '');
      setEditCompany(currentUser.companyOrOrg || '');
      setEditPosition(currentUser.positionOrTitle || '');
    }
  }, [currentUser, isEditingProfile]);

  // Reset errors when mode changes
  useEffect(() => {
    setFormError('');
    setIsAlreadyRegisteredError(false);
    setIsNotRegisteredError(false);
    setPendingAdvisorBlocked(null);
    setSuccessMessage('');
    setIsEditingProfile(false);
    setProfileSuccess('');
    setProfileError('');
  }, [mode]);

  // NOTE: Modal only closes when the user explicitly clicks the "Cerrar" button.
  // Backdrop click and accidental ESC key closing have been disabled per requirement.

  if (!isOpen) return null;

  // Helper to retrieve local stored registered users cache
  const getLocalRegisteredUsers = (): UserProfile[] => {
    try {
      const stored = localStorage.getItem('colorlink_registered_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
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
  };

  const saveUserLocally = (user: UserProfile) => {
    try {
      const users = getLocalRegisteredUsers();
      const index = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
      if (index >= 0) {
        users[index] = { ...users[index], ...user };
      } else {
        users.unshift(user);
      }
      localStorage.setItem('colorlink_registered_users', JSON.stringify(users));
      // If current logged-in user, also update active session cache
      if (currentUser && currentUser.email.toLowerCase() === user.email.toLowerCase()) {
        localStorage.setItem('colorlink_user', JSON.stringify({ ...currentUser, ...user }));
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsAlreadyRegisteredError(false);
    setIsNotRegisteredError(false);
    setPendingAdvisorBlocked(null);
    setSuccessMessage('');

    if (!email.trim() || !password.trim()) {
      setFormError('Por favor ingresa tu correo electrónico y tu contraseña.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMessage(`¡Bienvenido de nuevo, ${data.user.name}!`);
        saveUserLocally(data.user);
        setTimeout(() => {
          onLogin(data.user);
          onClose();
        }, 500);
      } else {
        if (data.pendingAdvisorApproval) {
          setPendingAdvisorBlocked(data.user);
          setFormError(data.error);
        } else if (data.notFound || res.status === 404) {
          setIsNotRegisteredError(true);
          setFormError(`El correo "${email}" no está registrado en el sistema.`);
        } else {
          setFormError(data.error || 'Credenciales inválidas. Por favor verifica tu contraseña.');
        }
      }
    } catch (err) {
      // Fallback verification using client cache & demo users
      const normalizedEmail = email.trim().toLowerCase();
      const localUsers = getLocalRegisteredUsers();
      const found = localUsers.find(u => u.email.toLowerCase() === normalizedEmail);

      if (found) {
        if (found.role === 'asesor' && found.accountStatus === 'pendiente_aprobacion_admin') {
          setPendingAdvisorBlocked(found);
          setFormError(`Tu perfil como Asesor Técnico Comercial (${found.name}) se encuentra pendiente de aprobación por el Administrador Central.`);
          return;
        }

        setSuccessMessage(`¡Bienvenido de nuevo, ${found.name}!`);
        setTimeout(() => {
          onLogin(found);
          onClose();
        }, 500);
      } else {
        setIsNotRegisteredError(true);
        setFormError(`El correo "${email}" no está registrado en COLORLINK.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsAlreadyRegisteredError(false);
    setIsNotRegisteredError(false);
    setSuccessMessage('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setFormError('Por favor completa todos los campos obligatorios (*).');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: normalizedEmail,
          password: password.trim(),
          role,
          companyOrOrg: company.trim(),
          positionOrTitle: positionOrTitle.trim(),
          nitOrDoc: nit.trim(),
          phone: phone.trim(),
          city,
          address: address.trim(),
          clientType: role === 'cliente_empresa' ? 'empresa' : (role === 'cliente_natural' ? 'persona_natural' : undefined)
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const userObj: UserProfile = {
          ...data.user,
          accountStatus: role === 'asesor' ? 'pendiente_aprobacion_admin' : 'pendiente_verificacion_email'
        };

        if (onRegistrationComplete) onRegistrationComplete(userObj, { emailSent: data.emailSent });
        if (!data.emailSent) setFormError(data.message || 'No se pudo enviar el código. Revisa la configuración del correo saliente.');

        saveUserLocally(userObj);
        supabaseSyncService.syncUserProfile(userObj).catch(console.warn);
        setActiveVerificationTarget(userObj);
        setVerificationTokenInput('');
        setMode('verify_email');
      } else {
        if (data.alreadyRegistered || res.status === 409) {
          setIsAlreadyRegisteredError(true);
          setFormError(data.error || `El usuario "${normalizedEmail}" ya está registrado en COLORLINK. Inicia sesión para acceder.`);
        } else {
          setFormError(data.error || 'Error al procesar el registro. Verifica los datos.');
        }
      }
    } catch (err) {
      setFormError('No fue posible conectar con el servidor para registrar la cuenta y enviar el código. Inténtalo de nuevo cuando haya conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateGoogleAuth = (targetMode: 'login' | 'register') => {
    setGoogleAuthTargetMode(targetMode);
    setGoogleCustomEmail(email || '');
    setGoogleCustomName(name || '');
    setShowGoogleModal(true);
    setFormError('');
    setIsAlreadyRegisteredError(false);
    setIsNotRegisteredError(false);
  };

  const handleExecuteGoogleAuth = async (
    targetEmail: string,
    targetName: string,
    targetRole?: UserRole,
    avatar?: string
  ) => {
    const normEmail = targetEmail.trim().toLowerCase();
    if (!normEmail || !normEmail.includes('@')) {
      setFormError('Por favor ingresa un correo electrónico de Google válido.');
      return;
    }

    setLoading(true);
    setFormError('');
    setIsAlreadyRegisteredError(false);
    setIsNotRegisteredError(false);
    setPendingAdvisorBlocked(null);

    const chosenRole = targetRole || role || 'cliente_natural';

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normEmail,
          name: targetName.trim() || 'Usuario Google',
          avatarUrl: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          role: chosenRole,
          companyOrOrg: company.trim() || undefined,
          nitOrDoc: nit.trim() || undefined,
          phone: phone.trim() || undefined,
          city: city || 'Medellín',
          address: address.trim() || undefined,
          clientType: chosenRole === 'cliente_empresa' ? 'empresa' : (chosenRole === 'cliente_natural' ? 'persona_natural' : undefined)
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const authedUser: UserProfile = data.user;
        saveUserLocally(authedUser);
        supabaseSyncService.syncUserProfile(authedUser).catch(console.warn);
        setSuccessMessage(data.message || '¡Autenticación con Google completada exitosamente!');
        setShowGoogleModal(false);
        setTimeout(() => {
          onLogin(authedUser);
          onClose();
        }, 600);
      } else {
        if (data.pendingAdvisorApproval) {
          setPendingAdvisorBlocked(data.user);
          setFormError(data.error || 'El perfil de Asesor Técnico requiere aprobación formal del Administrador.');
          setShowGoogleModal(false);
        } else {
          setFormError(data.error || 'Error al procesar la autenticación con cuenta de Google.');
        }
      }
    } catch (err) {
      console.warn('Google auth fallback:', err);
      const fallbackUser: UserProfile = {
        id: `user-google-${Date.now()}`,
        name: targetName.trim() || 'Usuario Google',
        email: normEmail,
        role: chosenRole,
        companyOrOrg: company.trim() || (chosenRole === 'cliente_empresa' ? 'Constructora Asociada' : undefined),
        city: city || 'Medellín',
        address: address.trim(),
        phone: phone.trim(),
        nitOrDoc: nit.trim(),
        isRegistered: true,
        accountStatus: chosenRole === 'asesor' ? 'pendiente_aprobacion_admin' : 'activo',
        emailVerified: true,
        authProvider: 'google',
        avatarUrl: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
      };

      saveUserLocally(fallbackUser);
      setSuccessMessage('¡Sesión iniciada con Google!');
      setShowGoogleModal(false);
      setTimeout(() => {
        onLogin(fallbackUser);
        onClose();
      }, 600);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setProfileError('');
    setProfileSuccess('');

    if (!editName.trim()) {
      setProfileError('El nombre completo no puede estar vacío.');
      return;
    }

    setEditLoading(true);

    const updatedFields = {
      name: editName.trim(),
      address: editAddress.trim(),
      city: editCity.trim(),
      phone: editPhone.trim(),
      companyOrOrg: editCompany.trim(),
      positionOrTitle: editPosition.trim()
    };

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentUser.id,
          email: currentUser.email,
          ...updatedFields
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const updatedUser: UserProfile = {
          ...currentUser,
          ...updatedFields
        };
        saveUserLocally(updatedUser);
        onLogin(updatedUser);
        if (onUpdateUser) onUpdateUser(updatedUser);
        setProfileSuccess('¡Información de perfil actualizada con éxito!');
        setTimeout(() => {
          setIsEditingProfile(false);
          setProfileSuccess('');
        }, 1200);
      } else {
        setProfileError(data.error || 'No se pudo actualizar el perfil.');
      }
    } catch (err) {
      // Local fallback save
      const updatedUser: UserProfile = {
        ...currentUser,
        ...updatedFields
      };
      saveUserLocally(updatedUser);
      onLogin(updatedUser);
      if (onUpdateUser) onUpdateUser(updatedUser);
      setProfileSuccess('¡Información actualizada en la sesión local!');
      setTimeout(() => {
        setIsEditingProfile(false);
        setProfileSuccess('');
      }, 1200);
    } finally {
      setEditLoading(false);
    }
  };

  const handleVerifyEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVerificationTarget) return;

    if (!verificationTokenInput.trim()) {
      setFormError('Por favor ingresa el código de activación de 6 dígitos.');
      return;
    }

    setLoading(true);
    setFormError('');

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: activeVerificationTarget.email,
          token: verificationTokenInput.trim()
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const isAdvisor = activeVerificationTarget.role === 'asesor';
        const updatedUser: UserProfile = {
          ...activeVerificationTarget,
          emailVerified: true,
          accountStatus: isAdvisor ? 'pendiente_aprobacion_admin' : 'activo'
        };
        saveUserLocally(updatedUser);

        if (isAdvisor) {
          setSuccessMessage('¡Correo verificado con éxito! Tu perfil de Asesor Técnico ahora está en espera de aprobación por el Administrador Central de Pintuco.');
          setActiveVerificationTarget(updatedUser);
        } else {
          setSuccessMessage('¡Correo verificado y cuenta activada exitosamente!');
          setTimeout(() => {
            onLogin(updatedUser);
            onClose();
          }, 800);
        }
      } else {
        setFormError(data.error || 'El código de activación no es válido.');
      }
    } catch (e) {
      // Local fallback
      const isAdvisor = activeVerificationTarget.role === 'asesor';
      const updatedUser: UserProfile = {
        ...activeVerificationTarget,
        emailVerified: true,
        accountStatus: isAdvisor ? 'pendiente_aprobacion_admin' : 'activo'
      };
      saveUserLocally(updatedUser);

      if (isAdvisor) {
        setSuccessMessage('¡Correo verificado! Tu solicitud de Asesor requiere aprobación del Administrador.');
        setActiveVerificationTarget(updatedUser);
      } else {
        setSuccessMessage('¡Correo validado y cuenta activada!');
        setTimeout(() => {
          onLogin(updatedUser);
          onClose();
        }, 800);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchToLoginWithEmail = () => {
    setMode('login');
    setFormError('');
    setIsAlreadyRegisteredError(false);
    const demo = PRESET_DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (demo) {
      setPassword(demo.passwordHint);
    } else {
      setPassword('');
    }
  };

  const switchToRegisterWithEmail = () => {
    setMode('register');
    setFormError('');
    setIsNotRegisteredError(false);
  };

  const selectDemoUser = (demoUser: typeof PRESET_DEMO_USERS[0]) => {
    if (demoUser.role === 'asesor' && demoUser.accountStatus === 'pendiente_aprobacion_admin') {
      setEmail(demoUser.email);
      setPassword(demoUser.passwordHint);
      setPendingAdvisorBlocked(demoUser);
      setFormError(`El usuario ${demoUser.name} se encuentra en estado "Pendiente de Aprobación por Administrador".`);
      return;
    }

    setEmail(demoUser.email);
    setPassword(demoUser.passwordHint);
    onLogin(demoUser);
    saveUserLocally(demoUser);
    onClose();
  };

  const loginAsAdminToApprove = () => {
    const adminUser = PRESET_DEMO_USERS.find(u => u.role === 'administrador');
    if (adminUser) {
      onLogin(adminUser);
      onClose();
      if (onNavigateToRbac) {
        onNavigateToRbac();
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#1E216B] via-[#2E3192] to-blue-900 text-white p-5 sm:p-6 relative border-b border-blue-800">
          <button
            onClick={onClose}
            id="btn-close-auth-modal"
            className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-600/90 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
            <span>Cerrar</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#F7C548] text-[#1E216B] font-black flex items-center justify-center text-xl shadow-md border-2 border-white/20">
              CL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  {currentUser 
                    ? 'Perfil de Usuario & Rol Conectado' 
                    : (mode === 'verify_email' ? 'Verificación & Activación de Cuenta' : 'Acceso & Roles en COLORLINK')}
                </h3>
              </div>
              <p className="text-blue-200 text-xs font-medium">
                Pintuco® • Control de Acceso Basado en Roles (RBAC) & Notificaciones
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 max-h-[82vh] overflow-y-auto">
          {currentUser ? (
            <div className="space-y-5">
              {/* Profile Card Header */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/80 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2E3192] to-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-white shrink-0">
                    {currentUser.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-slate-900 text-base truncate">{currentUser.name}</h4>
                      <span className="px-2.5 py-0.5 text-[11px] font-black rounded-full bg-[#2E3192] text-white uppercase tracking-wider shadow-2xs">
                        {getRoleShortLabel(currentUser.role)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 truncate flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-700">{currentUser.email}</span>
                    </p>
                    {currentUser.positionOrTitle && (
                      <p className="text-[11px] text-[#2E3192] font-semibold flex items-center gap-1.5 mt-0.5">
                        <Briefcase className="w-3 h-3 text-blue-500 shrink-0" />
                        {currentUser.positionOrTitle}
                      </p>
                    )}
                  </div>
                </div>

                {!isEditingProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProfile(true);
                      setProfileSuccess('');
                      setProfileError('');
                    }}
                    className="self-start sm:self-center px-3.5 py-2 bg-white hover:bg-blue-50 text-[#1E216B] hover:text-[#2E3192] border border-blue-300 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#FF6B35]" />
                    <span>Editar Información</span>
                  </button>
                )}
              </div>

              {/* Feedback messages */}
              {profileSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">{profileSuccess}</span>
                </div>
              )}
              {profileError && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-red-800 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="font-bold">{profileError}</span>
                </div>
              )}

              {/* Edit Mode Form vs View Mode */}
              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-[#FF6B35]" />
                      <h5 className="font-black text-slate-900 text-xs uppercase tracking-wider">
                        Editar Información de Perfil & Contacto
                      </h5>
                    </div>
                    <span className="text-[11px] text-amber-700 bg-amber-100 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-600" />
                      Datos Primarios Protegidos
                    </span>
                  </div>

                  {/* Section 1: Immutable Primary Fields (Locked) */}
                  <div className="p-3 bg-slate-100/80 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        Identificadores Primarios & Fiscales Inmutables
                      </span>
                      <span className="text-[10px] text-slate-500 italic">No modificables por auditoría</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-medium">ID del Sistema</span>
                        <span className="font-mono font-semibold text-slate-700 text-[11px] truncate block">
                          {currentUser.id}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-medium">Correo Registrado</span>
                        <span className="font-semibold text-slate-700 text-[11px] truncate block">
                          {currentUser.email}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-medium">NIT / Cédula</span>
                        <span className="font-semibold text-slate-700 text-[11px] truncate block">
                          {currentUser.nitOrDoc || 'No especificado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Editable Fields */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold text-[#1E216B] uppercase tracking-wider block">
                      Datos Modificables de Contacto y Ubicación
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nombre Completo *
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Tu nombre completo"
                            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Cargo / Profesión / Especialidad
                        </label>
                        <div className="relative">
                          <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            value={editPosition}
                            onChange={(e) => setEditPosition(e.target.value)}
                            placeholder="Ej. Residente de Obra / Maestro"
                            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Dirección Física / Sede u Obra Principal
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          placeholder="Ej. Carrera 48 # 26-85, Torre 2 Oficina 401"
                          className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Ciudad / Región CEDI
                        </label>
                        <div className="relative">
                          <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <select
                            value={editCity}
                            onChange={(e) => setEditCity(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                          >
                            <option value="Medellín">Medellín (CEDI Guarne)</option>
                            <option value="Bogotá">Bogotá D.C. (CEDI Fontibón)</option>
                            <option value="Cali">Cali (CEDI Yumbo)</option>
                            <option value="Barranquilla">Barranquilla (CEDI Soledad)</option>
                            <option value="Bucaramanga">Bucaramanga (CEDI Chimitá)</option>
                            <option value="Cartagena">Cartagena (CEDI Mamonal)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Teléfono / Celular / WhatsApp
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="+57 300 123 4567"
                            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Empresa / Razón Social
                      </label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={editCompany}
                          onChange={(e) => setEditCompany(e.target.value)}
                          placeholder="Ej. Constructora Andina S.A.S."
                          className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form Action Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                    <button
                      type="button"
                      disabled={editLoading}
                      onClick={() => {
                        setIsEditingProfile(false);
                        setProfileError('');
                        setProfileSuccess('');
                      }}
                      className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={editLoading}
                      className="px-5 py-2 bg-[#2E3192] hover:bg-[#1E216B] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:bg-blue-300"
                    >
                      {editLoading ? (
                        <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <Save className="w-3.5 h-3.5 text-[#F7C548]" />
                      )}
                      <span>Guardar Información</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Profile View Mode */
                <div className="space-y-4">
                  {/* Immutable Master Data Section */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Datos Primarios & Fiscales Protegidos
                        </span>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-slate-200 text-slate-700">
                        Inmutables
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 block font-medium">ID de Sistema</span>
                        <span className="font-mono font-bold text-slate-800 text-[11px] truncate block mt-0.5">
                          {currentUser.id}
                        </span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 block font-medium">Correo Electrónico</span>
                        <span className="font-bold text-slate-800 text-[11px] truncate block mt-0.5">
                          {currentUser.email}
                        </span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 block font-medium">NIT / Cédula</span>
                        <span className="font-bold text-slate-800 text-[11px] truncate block mt-0.5">
                          {currentUser.nitOrDoc || 'No especificado'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 block font-medium">Rol RBAC</span>
                        <span className="font-bold text-[#2E3192] text-[11px] truncate block mt-0.5">
                          {getRoleLabel(currentUser.role)}
                        </span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 italic leading-relaxed pt-1">
                      * Las llaves de identificación fiscal y credenciales de acceso permanecen protegidas para garantizar la trazabilidad de especificaciones y órdenes en Pintuco®.
                    </p>
                  </div>

                  {/* Editable Contact and Location Data Section */}
                  <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#2E3192]" />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Información de Contacto, Ubicación y Empresa
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(true)}
                        className="text-[11px] font-bold text-[#2E3192] hover:text-[#FF6B35] flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-medium flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          Nombre Completo
                        </span>
                        <span className="font-bold text-slate-900 text-xs block mt-0.5">
                          {currentUser.name}
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-medium flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-slate-400" />
                          Cargo o Especialidad
                        </span>
                        <span className="font-bold text-slate-900 text-xs block mt-0.5">
                          {currentUser.positionOrTitle || 'No especificado'}
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 sm:col-span-2">
                        <span className="text-[10px] text-slate-500 block font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#FF6B35]" />
                          Dirección Física de Sede / Obra
                        </span>
                        <span className="font-bold text-slate-900 text-xs block mt-0.5">
                          {currentUser.address || 'No registrada (Haz clic en editar para agregarla)'}
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-medium flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          Ciudad / Región CEDI
                        </span>
                        <span className="font-bold text-slate-900 text-xs block mt-0.5">
                          {currentUser.city || 'Medellín'}
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 block font-medium flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          Teléfono / Celular
                        </span>
                        <span className="font-bold text-slate-900 text-xs block mt-0.5">
                          {currentUser.phone || 'No registrado'}
                        </span>
                      </div>

                      {currentUser.companyOrOrg && (
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 sm:col-span-2">
                          <span className="text-[10px] text-slate-500 block font-medium flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-400" />
                            Empresa / Razón Social
                          </span>
                          <span className="font-bold text-slate-900 text-xs block mt-0.5">
                            {currentUser.companyOrOrg}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="text-xs text-emerald-800">
                      <span className="font-bold">Permisos RBAC Activos:</span> Tu interfaz y módulos visibles se adaptan automáticamente a las atribuciones configuradas por el Administrador.
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons for Logged in user */}
              <div className="space-y-2 pt-2">
                {normalizeUserRole(currentUser.role) === 'administrador' && onNavigateToRbac && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToRbac();
                    }}
                    className="w-full py-2.5 bg-purple-900 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-purple-400/30"
                  >
                    <Key className="w-4 h-4 text-[#F7C548]" />
                    <span>Abrir Panel de Control de Roles & Aprobación de Asesores (RBAC)</span>
                  </button>
                )}

                {onOpenEmailNotifications && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenEmailNotifications();
                    }}
                    className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-[#1E216B] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 border border-blue-200 cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-[#FF6B35]" />
                    <span>Ver Bandeja de Notificaciones & Correos de Verificación</span>
                  </button>
                )}

                <div className="pt-3 border-t border-slate-200 flex justify-between items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      setMode('login');
                    }}
                    className="px-4 py-2 text-xs sm:text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 cursor-pointer"
                  >
                    Cerrar Sesión
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 text-xs sm:text-sm font-bold text-white bg-[#2E3192] hover:bg-blue-900 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Continuar en la Aplicación
                  </button>
                </div>
              </div>

              {/* Quick switch to another demo role - ONLY FOR ADMINISTRATOR */}
              {currentUser.role === 'administrador' && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#2E3192]" />
                      Panel Administrador: Probar otro Rol:
                    </span>
                    <span className="text-[10px] bg-blue-100 text-blue-900 border border-blue-200 font-bold px-2 py-0.5 rounded-full">
                      Solo Administrador
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRESET_DEMO_USERS.filter(u => u.email !== currentUser.email).map(demo => (
                      <button
                        key={demo.id}
                        type="button"
                        onClick={() => selectDemoUser(demo)}
                        className="p-2 text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-all text-xs cursor-pointer"
                      >
                        <div className="font-bold text-slate-800 truncate">{demo.name}</div>
                        <div className="text-[10px] text-[#2E3192] font-semibold">{getRoleShortLabel(demo.role)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : mode === 'verify_email' ? (
            /* Email Verification Step */
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                <div className="w-14 h-14 bg-gradient-to-tr from-[#1E216B] to-blue-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md mb-3">
                  <Mail className="w-7 h-7 text-[#F7C548]" />
                </div>
                <h4 className="text-base font-black text-slate-900">
                  ¡Valida tu Correo Electrónico!
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                  Revisa el correo de esta cuenta para encontrar el código de activación de 6 dígitos:
                </p>
                <div className="mt-2 inline-block px-3 py-1 bg-white border border-blue-300 rounded-lg font-bold text-[#1E216B] text-xs shadow-2xs">
                  {activeVerificationTarget?.email || email}
                </div>
              </div>

              {activeVerificationTarget?.role === 'asesor' && (
                <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold uppercase tracking-wide block text-amber-950">
                      Requisito de Aprobación de Asesor Técnico
                    </span>
                    <p className="mt-0.5 leading-relaxed text-amber-800">
                      Una vez verificado tu correo, tu perfil pasará automáticamente al estado <strong>"Pendiente de Aprobación por Administrador"</strong>. El Administrador Central autorizará tu cuenta desde el panel RBAC.
                    </p>
                  </div>
                </div>
              )}

              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3.5 bg-emerald-50 text-emerald-900 text-xs rounded-xl border-2 border-emerald-300 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                  {activeVerificationTarget?.role === 'asesor' && (
                    <div className="pt-2 border-t border-emerald-200 flex items-center justify-between gap-2">
                      <span className="text-emerald-800 font-medium">¿Probar aprobación como Administrador?</span>
                      <button
                        type="button"
                        onClick={loginAsAdminToApprove}
                        className="px-3 py-1 bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
                      >
                        Ingresar como Admin
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!successMessage && (
                <form onSubmit={handleVerifyEmailSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 text-center">
                      Ingresa el Código de Activación de 6 Dígitos
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationTokenInput}
                      onChange={(e) => setVerificationTokenInput(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="123456"
                      className="w-full text-center text-2xl font-mono tracking-widest font-black py-2.5 px-3 border-2 border-[#2E3192] rounded-xl focus:ring-4 focus:ring-blue-100 outline-none text-[#1E216B]"
                    />

                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="w-1/3 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Volver
                    </button>
                    <button
                      type="submit"
                      disabled={loading || verificationTokenInput.length < 4}
                      className="w-2/3 py-2.5 bg-[#FF6B35] hover:bg-[#E85520] disabled:bg-orange-300 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Validar y Activar Perfil</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div>
              {/* Tabs for Login / Register */}
              <div className="flex border-b border-slate-200 mb-4 bg-slate-50/60 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2 text-center text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'login'
                      ? 'bg-white text-[#2E3192] shadow-xs border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Iniciar Sesión</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`flex-1 py-2 text-center text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'register'
                      ? 'bg-white text-[#2E3192] shadow-xs border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Registrarse</span>
                </button>
              </div>

              {/* Alert: Pending Advisor Profile Blocked */}
              {pendingAdvisorBlocked && (
                <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-300 rounded-xl text-amber-900 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h5 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                        Perfil de Asesor Pendiente de Aprobación por Administrador
                      </h5>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        El usuario <strong>{pendingAdvisorBlocked.name}</strong> ({pendingAdvisorBlocked.email}) tiene rol de <strong>Asesor Técnico Comercial</strong> y requiere autorización formal del Administrador Central antes de poder operar.
                      </p>
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={loginAsAdminToApprove}
                          className="px-3 py-1.5 bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Key className="w-3.5 h-3.5 text-[#F7C548]" />
                          <span>Ingresar como Administrador para Aprobar</span>
                        </button>
                        {onOpenEmailNotifications && (
                          <button
                            type="button"
                            onClick={onOpenEmailNotifications}
                            className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-900 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Ver Alerta de Correo</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Alert: Already Registered User Notification */}
              {isAlreadyRegisteredError && (
                <div className="mb-4 p-3.5 bg-amber-50 border-2 border-amber-300 rounded-xl text-amber-900 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h5 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                        Usuario Ya Registrado
                      </h5>
                      <p className="text-xs text-amber-800 mt-0.5">
                        El correo <strong>{email}</strong> ya existe en el sistema COLORLINK. No es posible volver a registrarlo.
                      </p>
                      <button
                        type="button"
                        onClick={switchToLoginWithEmail}
                        className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6B35] hover:bg-[#E85520] text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Iniciar Sesión con este correo</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Alert: Not Registered User Notification */}
              {isNotRegisteredError && (
                <div className="mb-4 p-3.5 bg-blue-50 border-2 border-blue-300 rounded-xl text-blue-900 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-5 h-5 text-[#2E3192] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h5 className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                        Cuenta No Encontrada
                      </h5>
                      <p className="text-xs text-blue-800 mt-0.5">
                        El correo <strong>{email}</strong> no está registrado todavía en COLORLINK.
                      </p>
                      <button
                        type="button"
                        onClick={switchToRegisterWithEmail}
                        className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2E3192] hover:bg-blue-900 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Crear mi cuenta con este correo</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Generic Form Error */}
              {formError && !isAlreadyRegisteredError && !isNotRegisteredError && !pendingAdvisorBlocked && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-300 flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* INTERACTIVE GOOGLE AUTH SELECTOR CARD */}
              {false && showGoogleModal && (
                <div className="mb-4 p-4 bg-blue-50/70 border-2 border-blue-300 rounded-2xl animate-in fade-in zoom-in-95 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-200">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center font-black text-xs text-[#4285F4] border border-blue-200 shadow-2xs">
                        G
                      </div>
                      <span className="text-xs font-black text-slate-800">
                        {googleAuthTargetMode === 'register'
                          ? 'Registrarse con Cuenta de Google'
                          : 'Iniciar Sesión con Cuenta de Google'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowGoogleModal(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-md hover:bg-blue-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Accede al ecosistema COLORLINK de forma instantánea usando tu cuenta de Google verificada sin necesidad de recordar contraseñas:
                  </p>

                  {/* Fast Selection with Google Accounts */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider block">
                      Seleccionar cuenta de Google sugerida:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {GOOGLE_PRESET_PROFILES.map((prof) => (
                        <button
                          key={prof.email}
                          type="button"
                          disabled={loading}
                          onClick={() => handleExecuteGoogleAuth(prof.email, prof.name, prof.role, prof.avatarUrl)}
                          className="p-2.5 bg-white hover:bg-blue-100/60 border border-blue-200 hover:border-blue-400 rounded-xl text-left transition-all flex items-center gap-2.5 cursor-pointer shadow-2xs group"
                        >
                          <img
                            src={prof.avatarUrl}
                            alt={prof.name}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-full object-cover border border-blue-300 shrink-0"
                          />
                          <div className="overflow-hidden">
                            <span className="font-bold text-xs text-slate-800 block truncate group-hover:text-blue-900">
                              {prof.name}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate font-mono">
                              {prof.email}
                            </span>
                            <span className="text-[9px] text-blue-600 font-semibold block">
                              {prof.label}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Or Custom Google Email */}
                  <div className="pt-2 border-t border-blue-200 space-y-2">
                    <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block">
                      O ingresa tu cuenta personal de Google:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Nombre y Apellidos"
                        value={googleCustomName}
                        onChange={(e) => setGoogleCustomName(e.target.value)}
                        className="px-3 py-1.5 text-xs border border-blue-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="email"
                        placeholder="ejemplo@gmail.com"
                        value={googleCustomEmail}
                        onChange={(e) => setGoogleCustomEmail(e.target.value)}
                        className="px-3 py-1.5 text-xs border border-blue-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setShowGoogleModal(false)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={loading || !googleCustomEmail.trim()}
                        onClick={() =>
                          handleExecuteGoogleAuth(
                            googleCustomEmail,
                            googleCustomName || 'Usuario Google',
                            role
                          )
                        }
                        className="px-4 py-1.5 bg-[#2E3192] hover:bg-blue-900 disabled:bg-blue-300 text-white font-black text-xs rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                      >
                        {loading ? (
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Continuar con esta cuenta</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Login Form */}
              {mode === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Google Login Button */}
                  <div>
                    <button
                      type="button"
                      id="btn-login-with-google" hidden
                      onClick={() => handleInitiateGoogleAuth('login')}
                      className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border-2 border-slate-200 hover:border-blue-400 shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center font-black text-xs shadow-2xs border border-slate-200 text-[#4285F4]">
                        G
                      </div>
                      <span>Iniciar Sesión con Google</span>
                    </button>

                    <div className="flex items-center gap-2 my-3">
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        o ingresa con tu contraseña
                      </span>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Correo Electrónico Registrado *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setFormError('');
                          setIsNotRegisteredError(false);
                          setPendingAdvisorBlocked(null);
                        }}
                        placeholder="tu.correo@empresa.com"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Contraseña *
                      </label>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setFormError('');
                        }}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-[#FF6B35] hover:bg-[#E85520] disabled:bg-orange-300 text-white font-black text-sm rounded-xl shadow-md hover:shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer border border-orange-400/30"
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Iniciar Sesión en COLORLINK</span>
                      </>
                    )}
                  </button>

                  {/* ADMIN-ONLY ACCORDION QUICK ACCESS - ONLY DISPLAYED WHEN LOGGED IN AS ADMINISTRATOR */}
                  {currentUser?.role === 'administrador' && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          id="btn-toggle-admin-demo-access"
                          onClick={() => setShowAdminQuickAccess(!showAdminQuickAccess)}
                          className="text-[11px] font-bold text-slate-500 hover:text-[#2E3192] flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-100"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-[#2E3192]" />
                          <span>Acceso Rápido por Roles (Solo Administrador / QA)</span>
                          {showAdminQuickAccess ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>
                        <span className="text-[9px] bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.5 rounded border border-slate-200">
                          {showAdminQuickAccess ? 'Ocultar' : 'Solo Admin'}
                        </span>
                      </div>

                      {showAdminQuickAccess && (
                        <div className="mt-2.5 p-3 bg-slate-50 border border-blue-200 rounded-xl space-y-2 animate-in fade-in zoom-in-95 duration-200">
                          <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                            <span className="text-[10px] font-extrabold text-[#2E3192] uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-[#F7C548]" />
                              Perfiles de Prueba Preconfigurados:
                            </span>
                            <span className="text-[9px] bg-blue-100 text-blue-900 border border-blue-200 font-bold px-1.5 py-0.5 rounded">
                              Modo Admin Activo
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {PRESET_DEMO_USERS.map((demo) => (
                              <button
                                key={demo.id}
                                type="button"
                                onClick={() => selectDemoUser(demo)}
                                className={`p-2.5 text-left rounded-xl transition-all cursor-pointer group border ${
                                  demo.accountStatus === 'pendiente_aprobacion_admin'
                                    ? 'bg-amber-50/70 hover:bg-amber-100/80 border-amber-300'
                                    : 'bg-white hover:bg-blue-50/80 border-slate-200 hover:border-blue-300 shadow-2xs'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-900 group-hover:text-[#2E3192]">
                                    {demo.name}
                                  </span>
                                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                                    demo.accountStatus === 'pendiente_aprobacion_admin'
                                      ? 'bg-amber-200 text-amber-900 border border-amber-300'
                                      : 'bg-slate-100 text-[#2E3192] border border-blue-200'
                                  }`}>
                                    {getRoleShortLabel(demo.role)}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                                  {demo.roleDesc}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-center pt-2">
                    <p className="text-xs text-slate-500">
                      ¿Aún no tienes una cuenta registrada?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('register')}
                        className="text-[#2E3192] font-bold hover:underline cursor-pointer"
                      >
                        Regístrate aquí
                      </button>
                    </p>
                  </div>
                </form>
              ) : (
                /* Registration Form */
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  {/* Google Registration Quick Action */}
                  <div className="pb-1">
                    <button
                      type="button"
                      id="btn-register-with-google" hidden
                      onClick={() => handleInitiateGoogleAuth('register')}
                      className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm rounded-xl border-2 border-slate-200 hover:border-blue-400 shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center font-black text-xs shadow-2xs border border-slate-200 text-[#4285F4]">
                        G
                      </div>
                      <span>Registrarse con Cuenta de Google</span>
                    </button>

                    <div className="flex items-center gap-2 my-2.5">
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        o completa el formulario tradicional
                      </span>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>
                  </div>

                  {/* Informative notice when Asesor is selected */}
                  {role === 'asesor' ? (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Perfil de Asesor Técnico Comercial:</strong> Requiere validación por correo y posterior <strong>aprobación formal del Administrador</strong>.
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#2E3192] shrink-0" />
                      <span>Al registrarte recibirás un correo con código de validación para activar tu perfil.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nombre Completo *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ej. Arq. Daniel Osorio"
                          className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Rol en el Ecosistema *
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold text-slate-800 cursor-pointer"
                      >
                        <option value="cliente_empresa">🏢 Cliente Empresa / Constructora (B2B)</option>
                        <option value="cliente_natural">👤 Cliente Persona Natural / Hogar</option>
                        <option value="asesor">👔 Asesor Técnico Comercial Pintuco (Requiere Aprobación)</option>
                        <option value="contratista">🛠️ Pintor / Contratista Certificado</option>
                        <option value="administrador">👑 Administrador del Sistema</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Correo Electrónico *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setIsAlreadyRegisteredError(false);
                            setFormError('');
                          }}
                          placeholder="correo@empresa.com"
                          className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Contraseña Nueva *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Empresa / Razón Social
                      </label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="Ej. Constructora Andina S.A.S."
                          className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Cargo / Profesión / Especialidad
                      </label>
                      <div className="relative">
                        <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={positionOrTitle}
                          onChange={(e) => setPositionOrTitle(e.target.value)}
                          placeholder="Ej. Ingeniero Residente / Pintor"
                          className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        NIT o Documento de Identidad
                      </label>
                      <input
                        type="text"
                        value={nit}
                        onChange={(e) => setNit(e.target.value)}
                        placeholder="Ej. 900.842.115-4"
                        className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Dirección Física / Sede u Obra
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Ej. Carrera 48 # 26-85, Sede Central"
                          className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Teléfono / WhatsApp
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+57 300 123 4567"
                          className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Ciudad / Región CEDI
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <select
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                          <option value="Medellín">Medellín (CEDI Guarne)</option>
                          <option value="Bogotá">Bogotá D.C. (CEDI Fontibón)</option>
                          <option value="Cali">Cali (CEDI Yumbo)</option>
                          <option value="Barranquilla">Barranquilla (CEDI Soledad)</option>
                          <option value="Bucaramanga">Bucaramanga (CEDI Chimitá)</option>
                          <option value="Cartagena">Cartagena (CEDI Mamonal)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-[#FF6B35] hover:bg-[#E85520] disabled:bg-orange-300 text-white font-black text-sm rounded-xl shadow-md hover:shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer border border-orange-400/30"
                    >
                      {loading ? (
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Registrar y Enviar Código de Verificación</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-center pt-1">
                    <p className="text-xs text-slate-500">
                      ¿Ya estás registrado?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="text-[#2E3192] font-bold hover:underline cursor-pointer"
                      >
                        Inicia sesión aquí
                      </button>
                    </p>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
