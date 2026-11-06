import { PermissionDefinition, PermissionKey, RolePermissionsMatrix, UserProfile, UserRole, ActiveTabType } from '../types';

export type { ActiveTabType };

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Navegación & Vistas
  {
    key: 'ver_mision_pilares',
    label: 'Misión & Pilares Ecosistema',
    description: 'Permite visualizar la sección de Misión, Pilares de Valor y Sostenibilidad Pintuco.',
    category: 'Navegación & Vistas'
  },
  {
    key: 'usar_cotizador',
    label: 'Cotizador en Línea',
    description: 'Acceso a la calculadora interactiva de pinturas, cálculo de galones y cotizaciones instantáneas.',
    category: 'Navegación & Vistas'
  },
  {
    key: 'ver_proyectos',
    label: 'Módulo de Proyectos & Trazabilidad',
    description: 'Acceso al listado de proyectos, estados de obra, bitácora y especificaciones técnicas.',
    category: 'Navegación & Vistas'
  },
  {
    key: 'ver_inventario_cedis',
    label: 'Inventario en Red CEDIs Pintuco',
    description: 'Consulta de existencias, stock en tiempo real y disponibilidad en bodegas de Colombia.',
    category: 'Navegación & Vistas'
  },
  {
    key: 'usar_diagnostico_ia',
    label: 'Diagnóstico Técnico con IA',
    description: 'Utilizar el asistente inteligente y dictámenes automáticos de patologías de sustrato.',
    category: 'Navegación & Vistas'
  },

  // Operaciones & Cotizaciones
  {
    key: 'crear_captura_proyecto',
    label: 'Crear Nuevas Cotizaciones / Proyectos',
    description: 'Formulario de captura técnica inteligente para registrar nuevas solicitudes de obra.',
    category: 'Operaciones & Cotizaciones'
  },
  {
    key: 'generar_cotizacion_pdf',
    label: 'Generar y Descargar Cotización Formal (PDF)',
    description: 'Capacidad de emitir la propuesta económica oficial en PDF con desglose de impuestos y materiales.',
    category: 'Operaciones & Cotizaciones'
  },
  {
    key: 'aprobar_cotizaciones',
    label: 'Aprobar / Aceptar Cotizaciones (Solo Clientes)',
    description: 'Decisión exclusiva del cliente titular para dar el visto bueno formal, aceptar la propuesta comercial y reservar inventario en CEDI.',
    category: 'Operaciones & Cotizaciones'
  },

  // Gestión Técnica & Stock
  {
    key: 'ver_todos_los_proyectos',
    label: 'Ver Todos los Proyectos Globales',
    description: 'Si está desactivado, el usuario solo verá sus propios proyectos creados o asignados.',
    category: 'Gestión Técnica & Stock'
  },
  {
    key: 'cambiar_estado_proyecto',
    label: 'Modificar Estado y Flujo de Obra',
    description: 'Avanzar proyectos entre etapas (Diagnosticado, Inventario Reservado, Despachado, Calidad Aprobada).',
    category: 'Gestión Técnica & Stock'
  },
  {
    key: 'gestionar_inventario_productos',
    label: 'Gestionar Stock e Ingresar Nuevos Productos',
    description: 'Permite actualizar cantidades de inventario por CEDI y registrar nuevos productos en el catálogo Pintuco.',
    category: 'Gestión Técnica & Stock'
  },

  // Administración del Sistema
  {
    key: 'gestionar_roles_permisos',
    label: 'Administrar Roles y Matriz de Permisos (RBAC)',
    description: 'Panel exclusivo del Administrador para conceder/revocar permisos y reasignar roles de usuarios.',
    category: 'Administración del Sistema'
  }
];

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionsMatrix = {
  administrador: {
    ver_mision_pilares: true,
    usar_cotizador: true,
    crear_captura_proyecto: true,
    ver_proyectos: true,
    ver_todos_los_proyectos: true,
    cambiar_estado_proyecto: true,
    ver_inventario_cedis: true,
    gestionar_inventario_productos: true,
    usar_diagnostico_ia: true,
    generar_cotizacion_pdf: true,
    aprobar_cotizaciones: false, // Solo Clientes aprueban cotizaciones
    gestionar_roles_permisos: true
  },
  asesor: {
    ver_mision_pilares: true,
    usar_cotizador: true,
    crear_captura_proyecto: true,
    ver_proyectos: true,
    ver_todos_los_proyectos: true,
    cambiar_estado_proyecto: true,
    ver_inventario_cedis: true,
    gestionar_inventario_productos: true,
    usar_diagnostico_ia: true,
    generar_cotizacion_pdf: true,
    aprobar_cotizaciones: false, // Solo Clientes aprueban cotizaciones
    gestionar_roles_permisos: false
  },
  cliente_empresa: {
    ver_mision_pilares: true,
    usar_cotizador: true,
    crear_captura_proyecto: true,
    ver_proyectos: true,
    ver_todos_los_proyectos: false,
    cambiar_estado_proyecto: false,
    ver_inventario_cedis: false,
    gestionar_inventario_productos: false,
    usar_diagnostico_ia: true,
    generar_cotizacion_pdf: true,
    aprobar_cotizaciones: true, // Clientes aprueban
    gestionar_roles_permisos: false
  },
  cliente_natural: {
    ver_mision_pilares: true,
    usar_cotizador: true,
    crear_captura_proyecto: true,
    ver_proyectos: true,
    ver_todos_los_proyectos: false,
    cambiar_estado_proyecto: false,
    ver_inventario_cedis: false,
    gestionar_inventario_productos: false,
    usar_diagnostico_ia: false,
    generar_cotizacion_pdf: true,
    aprobar_cotizaciones: true, // Clientes aprueban
    gestionar_roles_permisos: false
  },
  cliente: {
    ver_mision_pilares: true,
    usar_cotizador: true,
    crear_captura_proyecto: true,
    ver_proyectos: true,
    ver_todos_los_proyectos: false,
    cambiar_estado_proyecto: false,
    ver_inventario_cedis: false,
    gestionar_inventario_productos: false,
    usar_diagnostico_ia: true,
    generar_cotizacion_pdf: true,
    aprobar_cotizaciones: true,
    gestionar_roles_permisos: false
  },
  contratista: {
    ver_mision_pilares: true,
    usar_cotizador: true,
    crear_captura_proyecto: true,
    ver_proyectos: true,
    ver_todos_los_proyectos: false,
    cambiar_estado_proyecto: true,
    ver_inventario_cedis: true,
    gestionar_inventario_productos: false,
    usar_diagnostico_ia: true,
    generar_cotizacion_pdf: true,
    aprobar_cotizaciones: false,
    gestionar_roles_permisos: false
  },
  calidad: {
    ver_mision_pilares: true,
    usar_cotizador: true,
    crear_captura_proyecto: true,
    ver_proyectos: true,
    ver_todos_los_proyectos: true,
    cambiar_estado_proyecto: true,
    ver_inventario_cedis: true,
    gestionar_inventario_productos: false,
    usar_diagnostico_ia: true,
    generar_cotizacion_pdf: true,
    aprobar_cotizaciones: false,
    gestionar_roles_permisos: false
  }
};

export interface RoleInfo {
  role: UserRole;
  label: string;
  shortLabel: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  iconType: 'admin' | 'advisor' | 'company' | 'person' | 'contractor' | 'quality';
}

export const ROLES_METADATA: Record<string, RoleInfo> = {
  administrador: {
    role: 'administrador',
    label: 'Administrador del Sistema',
    shortLabel: 'Admin',
    description: 'Acceso total a la plataforma, configuración de permisos dinámicos y gestión de usuarios.',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    borderColor: 'border-purple-300',
    iconType: 'admin'
  },
  asesor: {
    role: 'asesor',
    label: 'Asesor Técnico Comercial Pintuco',
    shortLabel: 'Asesor Pintuco',
    description: 'Gestión técnica de obras, diagnósticos, cotizaciones formales y seguimiento de inventario en CEDIs.',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    borderColor: 'border-blue-300',
    iconType: 'advisor'
  },
  cliente_empresa: {
    role: 'cliente_empresa',
    label: 'Cliente Empresa / Constructora (B2B)',
    shortLabel: 'Cliente Empresa',
    description: 'Solicitud de cotizaciones corporativas, aprobación de propuestas y seguimiento de proyectos propios.',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    borderColor: 'border-emerald-300',
    iconType: 'company'
  },
  cliente_natural: {
    role: 'cliente_natural',
    label: 'Cliente Persona Natural / Hogar',
    shortLabel: 'Cliente Hogar',
    description: 'Uso del cotizador en línea, cálculo rápido de pintura y consulta de cotizaciones personales.',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    borderColor: 'border-amber-300',
    iconType: 'person'
  },
  contratista: {
    role: 'contratista',
    label: 'Pintor / Contratista Certificado',
    shortLabel: 'Contratista Oro',
    description: 'Consulta técnica de preparación de sustratos, avance de obras y verificación de inventario.',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-800',
    borderColor: 'border-orange-300',
    iconType: 'contractor'
  }
};

const RBAC_STORAGE_KEY = 'colorlink_rbac_permissions_v1';

export function getSavedPermissionsMatrix(): RolePermissionsMatrix {
  try {
    const stored = localStorage.getItem(RBAC_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with default in case new permission keys were added
      const merged: RolePermissionsMatrix = { ...DEFAULT_ROLE_PERMISSIONS };
      Object.keys(DEFAULT_ROLE_PERMISSIONS).forEach((r) => {
        merged[r] = {
          ...DEFAULT_ROLE_PERMISSIONS[r],
          ...(parsed[r] || {})
        };
      });
      return merged;
    }
  } catch (err) {
    console.warn('Error reading RBAC permissions:', err);
  }
  return DEFAULT_ROLE_PERMISSIONS;
}

export function savePermissionsMatrix(matrix: RolePermissionsMatrix): void {
  try {
    localStorage.setItem(RBAC_STORAGE_KEY, JSON.stringify(matrix));
  } catch (err) {
    console.warn('Error saving RBAC permissions:', err);
  }
}

export function resetPermissionsToDefaults(): RolePermissionsMatrix {
  try {
    localStorage.removeItem(RBAC_STORAGE_KEY);
  } catch (err) {
    console.warn(err);
  }
  return DEFAULT_ROLE_PERMISSIONS;
}

export function normalizeUserRole(role?: string): UserRole {
  if (!role) return 'cliente_natural';
  if (role === 'cliente') return 'cliente_empresa';
  if (role in DEFAULT_ROLE_PERMISSIONS) return role as UserRole;
  return 'cliente_natural';
}

export function checkUserPermission(
  user: UserProfile | null,
  permission: PermissionKey,
  matrix?: RolePermissionsMatrix
): boolean {
  const currentMatrix = matrix || getSavedPermissionsMatrix();
  
  // If no logged in user, treat as public / guest (with basic view permissions)
  if (!user) {
    if (permission === 'ver_mision_pilares' || permission === 'usar_cotizador' || permission === 'crear_captura_proyecto' || permission === 'usar_diagnostico_ia') {
      return true;
    }
    return false;
  }

  const normalized = normalizeUserRole(user.role);
  const rolePerms = currentMatrix[normalized] || DEFAULT_ROLE_PERMISSIONS[normalized] || DEFAULT_ROLE_PERMISSIONS.cliente_natural;
  
  return !!rolePerms[permission];
}

export function getRoleLabel(role?: string): string {
  if (!role) return 'Visitante';
  const norm = normalizeUserRole(role);
  return ROLES_METADATA[norm]?.label || role;
}

export function getRoleShortLabel(role?: string): string {
  if (!role) return 'Visitante';
  const norm = normalizeUserRole(role);
  return ROLES_METADATA[norm]?.shortLabel || role;
}

/**
 * Checks if a user is a client (individual home or enterprise B2B client).
 * Only clients can approve or reject quotations.
 */
export function isClientUser(user?: UserProfile | null): boolean {
  if (!user) return true; // Unauthenticated guest behaves as prospective client
  const role = normalizeUserRole(user.role);
  return role === 'cliente_natural' || role === 'cliente_empresa' || role === 'cliente';
}

/**
 * Checks if a user has authority to validate/verify payments.
 * Per business rules, only advisors (asesores), administrators, and contractors can validate payments.
 */
export function canValidatePaymentRole(user?: UserProfile | null): boolean {
  if (!user) return false;
  const role = normalizeUserRole(user.role);
  return role === 'asesor' || role === 'administrador' || role === 'contratista';
}

