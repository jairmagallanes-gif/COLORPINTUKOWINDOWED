import React from 'react';
import { ChannelSource, UserProfile } from '../types';
import { 
  Globe, 
  MessageSquare, 
  UserCheck, 
  Store, 
  Building2, 
  Smartphone,
  Radio
} from 'lucide-react';
import { normalizeUserRole } from './rbac';

export interface ChannelMetadata {
  key: ChannelSource;
  code: string;
  label: string;
  shortLabel: string;
  description: string;
  sourceCategory: 'Digital' | 'Omnicanal' | 'Comercial' | 'Punto Físico' | 'Corporativo' | 'Móvil';
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const CHANNELS_REGISTRY: Record<ChannelSource, ChannelMetadata> = {
  web_portal: {
    key: 'web_portal',
    code: 'WEB',
    label: 'Portal Web ColorLink',
    shortLabel: 'Portal Web',
    description: 'Captura digital directa autoservicio desde el portal web oficial ColorLink Pintuco.',
    sourceCategory: 'Digital',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-200',
    dotColor: 'bg-blue-600',
    icon: Globe
  },
  whatsapp: {
    key: 'whatsapp',
    code: 'WSP',
    label: 'Línea WhatsApp Oficial Pintuco',
    shortLabel: 'WhatsApp',
    description: 'Captura asistida por Bot IA y asesor comercial a través del canal WhatsApp Business.',
    sourceCategory: 'Omnicanal',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-200',
    dotColor: 'bg-emerald-600',
    icon: MessageSquare
  },
  commercial_advisor: {
    key: 'commercial_advisor',
    code: 'ADV',
    label: 'Asesor Técnico Comercial en Campo',
    shortLabel: 'Asesor en Campo',
    description: 'Levantamiento presencial de medidas y diagnóstico técnico directo en obra por asesor Pintuco.',
    sourceCategory: 'Comercial',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-800',
    badgeBorder: 'border-purple-200',
    dotColor: 'bg-purple-600',
    icon: UserCheck
  },
  pintuco_store: {
    key: 'pintuco_store',
    code: 'POS',
    label: 'Tienda / Punto de Venta Pintuco',
    shortLabel: 'Tienda Física',
    description: 'Radicación presencial en mostrador de tienda autorizada o centro de experiencia Pintuco.',
    sourceCategory: 'Punto Físico',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    dotColor: 'bg-amber-600',
    icon: Store
  },
  constructor_b2b: {
    key: 'constructor_b2b',
    code: 'B2B',
    label: 'Convenio B2B Constructoras & Grandes Cuentas',
    shortLabel: 'Convenio B2B',
    description: 'Canal corporativo prioritario para constructoras, contratistas institucionales e industria.',
    sourceCategory: 'Corporativo',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-200',
    dotColor: 'bg-indigo-600',
    icon: Building2
  },
  mobile_app: {
    key: 'mobile_app',
    code: 'APP',
    label: 'App Móvil Aplicadores & Pintores',
    shortLabel: 'App Móvil',
    description: 'Captura ágil en sitio ejecutada por pintores y maestros de obra certificados en la app móvil.',
    sourceCategory: 'Móvil',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-800',
    badgeBorder: 'border-teal-200',
    dotColor: 'bg-teal-600',
    icon: Smartphone
  }
};

export const ALL_CHANNELS: ChannelMetadata[] = Object.values(CHANNELS_REGISTRY);

/**
 * Gets channel metadata safely with fallback to web_portal
 */
export function getChannelMetadata(channel?: ChannelSource | string | null): ChannelMetadata {
  if (!channel) return CHANNELS_REGISTRY.web_portal;
  const key = channel as ChannelSource;
  return CHANNELS_REGISTRY[key] || CHANNELS_REGISTRY.web_portal;
}

/**
 * Formats a project radicado with its capture channel tag (e.g. "COLORLINK-2026-001 [WhatsApp]")
 */
export function formatRadicadoWithChannelTag(radicado: string, channel?: ChannelSource | string | null): string {
  const meta = getChannelMetadata(channel);
  return `${radicado} • Canal: ${meta.label}`;
}

/**
 * Formats short radicado code with channel prefix (e.g. "[WSP] COLORLINK-2026-001")
 */
export function getShortRadicadoChannelLabel(radicado: string, channel?: ChannelSource | string | null): string {
  const meta = getChannelMetadata(channel);
  return `[${meta.code}] ${radicado}`;
}

/**
 * Returns the recommended default capture channel based on logged-in user profile
 */
export function getDefaultChannelForUser(user?: UserProfile | null): ChannelSource {
  if (!user) return 'web_portal';
  const role = normalizeUserRole(user.role);
  
  switch (role) {
    case 'asesor':
      return 'commercial_advisor';
    case 'cliente_empresa':
      return 'constructor_b2b';
    case 'contratista':
      return 'mobile_app';
    case 'cliente_natural':
    case 'cliente':
      return 'web_portal';
    default:
      return 'web_portal';
  }
}
