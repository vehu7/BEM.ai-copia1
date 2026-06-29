import type { AchievementDefinition, ActivityKind } from '@/types'

/**
 * Conquistas por atividade — desbloqueadas por sequência (streak) de dias.
 * Aditivo ao sistema de check-in diário genérico (ver src/data/badges.ts).
 */
export const ACHIEVEMENTS: AchievementDefinition[] = [
  // 💧 Hidratação
  { id: 'water_1',   activity: 'water',   name: 'Primeira Gota',   description: 'Bateu a meta de água por 1 dia',     threshold: 1,  tier: 'bronze',   icon: 'Droplet' },
  { id: 'water_7',   activity: 'water',   name: 'Hidratado',       description: '7 dias seguidos na meta de água',    threshold: 7,  tier: 'bronze',   icon: 'Droplets' },
  { id: 'water_21',  activity: 'water',   name: 'Oásis',           description: '21 dias seguidos na meta',           threshold: 21, tier: 'prata',    icon: 'GlassWater' },
  { id: 'water_45',  activity: 'water',   name: 'Fonte',           description: '45 dias seguidos na meta',           threshold: 45, tier: 'ouro',     icon: 'Waves' },
  { id: 'water_90',  activity: 'water',   name: 'Maré Alta',       description: '90 dias seguidos na meta',           threshold: 90, tier: 'platina',  icon: 'CloudRain' },

  // 🏋️ Treino
  { id: 'workout_1',  activity: 'workout', name: 'Aquecendo',      description: 'Treinou por 1 dia',                  threshold: 1,  tier: 'bronze',   icon: 'Dumbbell' },
  { id: 'workout_7',  activity: 'workout', name: 'Em Movimento',   description: '7 dias seguidos treinando',          threshold: 7,  tier: 'bronze',   icon: 'Activity' },
  { id: 'workout_21', activity: 'workout', name: 'Disciplina',     description: '21 dias seguidos treinando',         threshold: 21, tier: 'prata',    icon: 'Flame' },
  { id: 'workout_45', activity: 'workout', name: 'Atleta',         description: '45 dias seguidos treinando',         threshold: 45, tier: 'ouro',     icon: 'Zap' },
  { id: 'workout_90', activity: 'workout', name: 'Imbatível',      description: '90 dias seguidos treinando',         threshold: 90, tier: 'platina',  icon: 'Trophy' },

  // 😴 Sono
  { id: 'sleep_1',   activity: 'sleep',   name: 'Boa Noite',       description: 'Registrou o sono por 1 dia',         threshold: 1,  tier: 'bronze',   icon: 'Moon' },
  { id: 'sleep_7',   activity: 'sleep',   name: 'Descansado',      description: '7 dias seguidos registrando o sono', threshold: 7,  tier: 'bronze',   icon: 'Cloud' },
  { id: 'sleep_21',  activity: 'sleep',   name: 'Sono de Ouro',    description: '21 dias seguidos',                   threshold: 21, tier: 'prata',    icon: 'Star' },
  { id: 'sleep_45',  activity: 'sleep',   name: 'Hibernando',      description: '45 dias seguidos',                   threshold: 45, tier: 'ouro',     icon: 'Sparkles' },
  { id: 'sleep_90',  activity: 'sleep',   name: 'Mestre do Sono',  description: '90 dias seguidos',                   threshold: 90, tier: 'platina',  icon: 'Crown' },
]

export const ACTIVITY_LABELS: Record<ActivityKind, string> = {
  water: 'Hidratação',
  workout: 'Treino',
  sleep: 'Sono',
}

/** Mascote ilustrativo de cada atividade (assets em public/mascots/). */
export const ACTIVITY_MASCOT: Record<ActivityKind, string> = {
  water: '/mascots/koala-agua.png',
  workout: '/mascots/koala-treino.png',
  sleep: '/mascots/koala-sono.png',
}

export function achievementsFor(activity: ActivityKind): AchievementDefinition[] {
  return ACHIEVEMENTS.filter(a => a.activity === activity)
}
