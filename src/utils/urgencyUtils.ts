import React from 'react';
import { DeliveryUrgency } from '../types';
import { Flame, Zap, Clock, CalendarDays, AlertTriangle } from 'lucide-react';

export interface UrgencyConfig {
  key: DeliveryUrgency;
  label: string;
  shortLabel: string;
  timeframe: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  chipBg: string;
  chipText: string;
  dotColor: string;
  accentBarColor: string;
  cardBorder: string;
  lightBg: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  slaDays: string;
  level: 'critical' | 'high' | 'medium' | 'planned';
}

export const URGENCY_CONFIGS: Record<DeliveryUrgency, UrgencyConfig> = {
  [DeliveryUrgency.INMEDIATO_24_48H]: {
    key: DeliveryUrgency.INMEDIATO_24_48H,
    label: 'Urgente / Inmediato (24 a 48 horas)',
    shortLabel: 'Urgente 24-48h',
    timeframe: '24-48 Horas',
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-800',
    badgeBorder: 'border-red-300',
    chipBg: 'bg-red-600',
    chipText: 'text-white',
    dotColor: 'bg-red-600',
    accentBarColor: 'bg-red-600',
    cardBorder: 'border-l-4 border-l-red-600 border-red-200',
    lightBg: 'bg-red-50/50',
    icon: Flame,
    description: 'Despacho prioritario exprés desde CEDI central con alistamiento de inventario en menos de 24 horas.',
    slaDays: '1-2 días',
    level: 'critical'
  },
  [DeliveryUrgency.EXPRESS_3_5DIAS]: {
    key: DeliveryUrgency.EXPRESS_3_5DIAS,
    label: 'Rápido / Express (3 a 5 días hábiles)',
    shortLabel: 'Express 3-5d',
    timeframe: '3-5 Días',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-300',
    chipBg: 'bg-amber-500',
    chipText: 'text-slate-950',
    dotColor: 'bg-amber-500',
    accentBarColor: 'bg-amber-500',
    cardBorder: 'border-l-4 border-l-amber-500 border-amber-200',
    lightBg: 'bg-amber-50/50',
    icon: Zap,
    description: 'Alistamiento ágil de materiales con entrega en obra coordinada dentro de la misma semana.',
    slaDays: '3-5 días',
    level: 'high'
  },
  [DeliveryUrgency.ESTANDAR_1_2SEMANAS]: {
    key: DeliveryUrgency.ESTANDAR_1_2SEMANAS,
    label: 'Estándar (1 a 2 semanas)',
    shortLabel: 'Estándar 1-2 sem',
    timeframe: '1-2 Semanas',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-900',
    badgeBorder: 'border-blue-200',
    chipBg: 'bg-blue-600',
    chipText: 'text-white',
    dotColor: 'bg-blue-600',
    accentBarColor: 'bg-blue-600',
    cardBorder: 'border-l-4 border-l-blue-600 border-blue-200',
    lightBg: 'bg-blue-50/40',
    icon: Clock,
    description: 'Ruta regular de despacho logístico CEDI Pintuco programada a conveniencia de la obra.',
    slaDays: '7-14 días',
    level: 'medium'
  },
  [DeliveryUrgency.PROGRAMADO_ETAPAS]: {
    key: DeliveryUrgency.PROGRAMADO_ETAPAS,
    label: 'Programado por Etapas de Obra',
    shortLabel: 'Por Etapas',
    timeframe: 'Cronograma de Obra',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-900',
    badgeBorder: 'border-purple-200',
    chipBg: 'bg-purple-600',
    chipText: 'text-white',
    dotColor: 'bg-purple-600',
    accentBarColor: 'bg-purple-600',
    cardBorder: 'border-l-4 border-l-purple-600 border-purple-200',
    lightBg: 'bg-purple-50/40',
    icon: CalendarDays,
    description: 'Entregas parciales escalonadas según avance de obra civil y cronograma constructivo.',
    slaDays: 'Según avance',
    level: 'planned'
  }
};

export const ALL_URGENCY_OPTIONS: UrgencyConfig[] = Object.values(URGENCY_CONFIGS);

export function getUrgencyConfig(urgency?: DeliveryUrgency | string | null): UrgencyConfig {
  if (!urgency) return URGENCY_CONFIGS[DeliveryUrgency.ESTANDAR_1_2SEMANAS];
  const key = urgency as DeliveryUrgency;
  return URGENCY_CONFIGS[key] || URGENCY_CONFIGS[DeliveryUrgency.ESTANDAR_1_2SEMANAS];
}
