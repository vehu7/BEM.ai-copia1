import type { BadgeDefinition } from '@/types'

export const BADGES: BadgeDefinition[] = [
  { id: 'streak_3',   name: 'Primeiro Passo',    description: '3 dias consecutivos',     requiredDays: 3,   tier: 'bronze',   icon: 'Footprints' },
  { id: 'streak_7',   name: 'Semana Forte',       description: '7 dias consecutivos',     requiredDays: 7,   tier: 'bronze',   icon: 'Flame' },
  { id: 'streak_14',  name: 'Foco Total',         description: '14 dias consecutivos',    requiredDays: 14,  tier: 'prata',    icon: 'Target' },
  { id: 'streak_21',  name: 'Hábito Formado',     description: '21 dias consecutivos',    requiredDays: 21,  tier: 'prata',    icon: 'Brain' },
  { id: 'streak_30',  name: 'Guerreiro do Mês',   description: '30 dias consecutivos',    requiredDays: 30,  tier: 'ouro',     icon: 'Shield' },
  { id: 'streak_60',  name: 'Imparável',          description: '60 dias consecutivos',    requiredDays: 60,  tier: 'ouro',     icon: 'Zap' },
  { id: 'streak_90',  name: 'Inspiração',         description: '90 dias consecutivos',    requiredDays: 90,  tier: 'platina',  icon: 'Star' },
  { id: 'streak_180', name: 'Lenda',              description: '180 dias consecutivos',   requiredDays: 180, tier: 'platina',  icon: 'Crown' },
  { id: 'streak_365', name: 'Imortal',            description: '1 ano consecutivo',       requiredDays: 365, tier: 'diamante', icon: 'Trophy' },
]

// Escala de níveis 100% na paleta da marca: bronze→ouro num degradê de verde
// (claro→escuro = sensação de progressão) e platina/diamante em lavanda→roxo.
// Sem marrom/âmbar/azul — alinhado à cor verde do app.
export const TIER_COLORS: Record<BadgeDefinition['tier'], string> = {
  bronze:   'from-green-300 to-green-400',
  prata:    'from-green-500 to-green-600',
  ouro:     'from-green-700 to-green-800',
  platina:  'from-violet-300 to-purple-400',
  diamante: 'from-violet-400 to-fuchsia-500',
}

export const TIER_BG: Record<BadgeDefinition['tier'], string> = {
  bronze:   'bg-green-50 dark:bg-green-950/40',
  prata:    'bg-green-100 dark:bg-green-900/30',
  ouro:     'bg-green-200/60 dark:bg-green-900/50',
  platina:  'bg-violet-50 dark:bg-violet-950/40',
  diamante: 'bg-violet-50 dark:bg-violet-950/40',
}
