/**
 * Sistema de XP e Níveis — BEM.ai
 * Gerencia a progressão do usuário através de pontos de experiência.
 */

// ── Definição de Níveis ───────────────────────────────────────────────────────

/** Nomes dos níveis em três formas: feminino, masculino e neutro */
export const LEVEL_NAMES: { f: string; m: string; n: string; emoji: string; xpRequired: number }[] = [
  { f: 'Desperta',     m: 'Desperto',     n: 'Desperto(a)',     emoji: '🌙', xpRequired: 0 },
  { f: 'Ativa',        m: 'Ativo',        n: 'Ativo(a)',        emoji: '⚡', xpRequired: 200 },
  { f: 'Focada',       m: 'Focado',       n: 'Focado(a)',       emoji: '🔥', xpRequired: 500 },
  { f: 'Determinada',  m: 'Determinado',  n: 'Determinado(a)',  emoji: '💪', xpRequired: 1000 },
  { f: 'Transformada', m: 'Transformado', n: 'Transformado(a)', emoji: '✨', xpRequired: 2000 },
  { f: 'Guerreira',    m: 'Guerreiro',    n: 'Guerreiro(a)',    emoji: '🏅', xpRequired: 4000 },
  { f: 'Renascida',    m: 'Renascido',    n: 'Renascido(a)',    emoji: '🦋', xpRequired: 7500 },
  { f: 'Lendária',     m: 'Lendário',     n: 'Lendário(a)',     emoji: '👑', xpRequired: 12000 },
  { f: 'BEM Elite',    m: 'BEM Elite',    n: 'BEM Elite',       emoji: '💎', xpRequired: 20000 },
]

/**
 * Retorna o nome do nível adaptado ao gênero do perfil.
 * - 'feminino'  → forma feminina
 * - 'masculino' → forma masculina
 * - qualquer outro valor (null, 'outro', 'prefiro_nao_informar') → forma neutra com (a/o)
 */
export function getLevelName(
  levelIndex: number,
  gender?: string | null,
): string {
  const entry = LEVEL_NAMES[levelIndex] ?? LEVEL_NAMES[LEVEL_NAMES.length - 1]
  if (gender === 'feminino') return entry.f
  if (gender === 'masculino') return entry.m
  return entry.n
}

export const LEVELS = LEVEL_NAMES.map((l, i) => ({
  level: i + 1,
  name: l.f, // fallback feminino — usar getLevelName() nos componentes
  emoji: l.emoji,
  xpRequired: l.xpRequired,
})) as const

export type Level = { level: number; name: string; emoji: string; xpRequired: number }

// ── XP por Ação ───────────────────────────────────────────────────────────────

export const XP_ACTIONS = {
  REGISTER_MEAL:            10,
  HIT_CALORIE_GOAL:         25,
  HIT_PROTEIN_GOAL:         20,
  REGISTER_WATER:            5,
  HIT_WATER_GOAL:           20,
  REGISTER_WORKOUT:         15,
  COMPLETE_AI_WORKOUT:      30,
  REGISTER_SLEEP:           10,
  GOOD_SLEEP:               20,  // >= 7h com qualidade boa
  DAILY_CHECKIN:             5,
  REGISTER_WEIGHT:          10,
  WEIGHT_MILESTONE:        100,  // a cada -1kg em direção à meta
  USE_CHAT:                  5,  // máx 1x/dia
  COMPLETE_WEEKLY_CHALLENGE: 150,
  COMPLETE_MONTHLY_CHALLENGE: 500,
  STREAK_7_DAYS:            75,
  STREAK_30_DAYS:          300,
  REFER_FRIEND:            200,
  FIRST_TIME_ANY:           50,  // first time em qualquer categoria
} as const

export type XPAction = keyof typeof XP_ACTIONS

// ── Funções de Nível ──────────────────────────────────────────────────────────

/**
 * Retorna a definição do nível atual para um dado total de XP.
 */
export function getLevelForXP(xp: number): Level {
  let current: Level = LEVELS[0]
  for (const level of LEVELS) {
    if (xp >= level.xpRequired) {
      current = level
    } else {
      break
    }
  }
  return current
}

/**
 * Retorna o progresso até o próximo nível.
 * Se já estiver no nível máximo, retorna percentage 100.
 */
export function getProgressToNextLevel(xp: number): {
  current: number
  required: number
  percentage: number
  isMaxLevel: boolean
} {
  const currentLevel = getLevelForXP(xp)
  const currentIndex = LEVELS.findIndex(l => l.level === currentLevel.level)
  const nextLevel = LEVELS[currentIndex + 1]

  if (!nextLevel) {
    return { current: xp, required: currentLevel.xpRequired, percentage: 100, isMaxLevel: true }
  }

  const xpInCurrentLevel = xp - currentLevel.xpRequired
  const xpNeededForNext = nextLevel.xpRequired - currentLevel.xpRequired
  const percentage = Math.min(Math.round((xpInCurrentLevel / xpNeededForNext) * 100), 100)

  return {
    current: xpInCurrentLevel,
    required: xpNeededForNext,
    percentage,
    isMaxLevel: false,
  }
}

/**
 * Retorna o novo total de XP após conceder pontos por uma ação.
 */
export function awardXP(currentXP: number, action: XPAction): number {
  return currentXP + XP_ACTIONS[action]
}

// ── Achievements (Conquistas) ─────────────────────────────────────────────────

export type AchievementCategory =
  | 'primeiros_passos'
  | 'hidratacao'
  | 'nutricao'
  | 'treino'
  | 'sono'
  | 'progresso'

export interface XPAchievement {
  id: string
  name: string
  description: string
  emoji: string
  category: AchievementCategory
  condition: string // identificador da condição programática
  xpReward: number
}

export const XP_ACHIEVEMENTS: XPAchievement[] = [
  // ── Primeiros Passos ────────────────────────────────────────────────────────
  {
    id: 'first_onboarding',
    name: 'Bem-vindo(a) ao BEM',
    description: 'Completou o onboarding',
    emoji: '🌱',
    category: 'primeiros_passos',
    condition: 'complete_onboarding',
    xpReward: 50,
  },
  {
    id: 'first_meal',
    name: 'Primeira Refeição',
    description: 'Registrou a primeira refeição',
    emoji: '🍽️',
    category: 'primeiros_passos',
    condition: 'first_meal_registered',
    xpReward: 50,
  },
  {
    id: 'first_workout_plan',
    name: 'Primeiro Plano',
    description: 'Gerou o primeiro plano de treino',
    emoji: '💪',
    category: 'primeiros_passos',
    condition: 'first_workout_plan_generated',
    xpReward: 50,
  },
  {
    id: 'first_menu',
    name: 'Primeiro Cardápio',
    description: 'Gerou o primeiro cardápio semanal',
    emoji: '📋',
    category: 'primeiros_passos',
    condition: 'first_menu_generated',
    xpReward: 50,
  },
  {
    id: 'first_weight',
    name: 'Pesando o Progresso',
    description: 'Registrou o primeiro peso de acompanhamento',
    emoji: '⚖️',
    category: 'primeiros_passos',
    condition: 'first_weight_registered',
    xpReward: 50,
  },
  {
    id: 'first_chat',
    name: 'Papo com BEM',
    description: 'Usou o chat pela primeira vez',
    emoji: '🤖',
    category: 'primeiros_passos',
    condition: 'first_chat_used',
    xpReward: 50,
  },

  // ── Hidratação ──────────────────────────────────────────────────────────────
  {
    id: 'water_day_1',
    name: 'Primeira Gota',
    description: '1 dia atingindo a meta de água',
    emoji: '💧',
    category: 'hidratacao',
    condition: 'water_streak_1',
    xpReward: 25,
  },
  {
    id: 'water_day_7',
    name: 'Hidratad(a/o)',
    description: '7 dias seguidos atingindo a meta de água',
    emoji: '🌊',
    category: 'hidratacao',
    condition: 'water_streak_7',
    xpReward: 75,
  },
  {
    id: 'water_day_21',
    name: 'Oásis',
    description: '21 dias seguidos na meta de água',
    emoji: '🏝️',
    category: 'hidratacao',
    condition: 'water_streak_21',
    xpReward: 150,
  },
  {
    id: 'water_day_45',
    name: 'Fonte',
    description: '45 dias seguidos na meta de água',
    emoji: '⛲',
    category: 'hidratacao',
    condition: 'water_streak_45',
    xpReward: 250,
  },
  {
    id: 'water_day_90',
    name: 'Maré Alta',
    description: '90 dias seguidos na meta de água',
    emoji: '🌊',
    category: 'hidratacao',
    condition: 'water_streak_90',
    xpReward: 500,
  },
  {
    id: 'water_day_180',
    name: 'Oceano',
    description: '180 dias seguidos na meta de água',
    emoji: '🐋',
    category: 'hidratacao',
    condition: 'water_streak_180',
    xpReward: 1000,
  },

  // ── Nutrição ────────────────────────────────────────────────────────────────
  {
    id: 'protein_week',
    name: 'Semana Proteica',
    description: '7 dias atingindo a meta de proteína',
    emoji: '🥩',
    category: 'nutricao',
    condition: 'protein_streak_7',
    xpReward: 100,
  },
  {
    id: 'macro_balance',
    name: 'Equilíbrio Perfeito',
    description: '3 dias com macros dentro de 10% do alvo',
    emoji: '⚖️',
    category: 'nutricao',
    condition: 'macro_balance_3_days',
    xpReward: 100,
  },
  {
    id: 'food_explorer',
    name: 'Explorador(a) Culinário(a)',
    description: 'Registrou 50 alimentos diferentes',
    emoji: '🔭',
    category: 'nutricao',
    condition: 'unique_foods_50',
    xpReward: 150,
  },
  {
    id: 'bem_chef',
    name: 'Chef BEM',
    description: 'Experimentou 10 receitas geradas pela IA',
    emoji: '🧑‍🍳',
    category: 'nutricao',
    condition: 'recipes_tried_10',
    xpReward: 150,
  },
  {
    id: 'full_menu',
    name: 'Cardápio Completo',
    description: 'Seguiu o cardápio por 5 dias seguidos',
    emoji: '📅',
    category: 'nutricao',
    condition: 'menu_followed_5_days',
    xpReward: 200,
  },

  // ── Treino ──────────────────────────────────────────────────────────────────
  {
    id: 'workout_day_1',
    name: 'Aquecendo',
    description: '1 dia registrando treino',
    emoji: '🔥',
    category: 'treino',
    condition: 'workout_streak_1',
    xpReward: 25,
  },
  {
    id: 'workout_day_7',
    name: 'Em Movimento',
    description: '7 dias seguidos registrando treino',
    emoji: '🏃',
    category: 'treino',
    condition: 'workout_streak_7',
    xpReward: 75,
  },
  {
    id: 'workout_day_21',
    name: 'Disciplina',
    description: '21 dias seguidos de treino',
    emoji: '⚡',
    category: 'treino',
    condition: 'workout_streak_21',
    xpReward: 150,
  },
  {
    id: 'workout_day_45',
    name: 'Atleta',
    description: '45 dias seguidos de treino',
    emoji: '🏅',
    category: 'treino',
    condition: 'workout_streak_45',
    xpReward: 250,
  },
  {
    id: 'workout_day_90',
    name: 'Imbatível',
    description: '90 dias seguidos de treino',
    emoji: '🏆',
    category: 'treino',
    condition: 'workout_streak_90',
    xpReward: 500,
  },
  {
    id: 'workout_day_180',
    name: 'Maratonista',
    description: '180 dias seguidos de treino',
    emoji: '🎖️',
    category: 'treino',
    condition: 'workout_streak_180',
    xpReward: 1000,
  },
  {
    id: 'workout_diverse',
    name: 'Diversificad(a/o)',
    description: '5 tipos de atividade diferentes registrados',
    emoji: '🎯',
    category: 'treino',
    condition: 'workout_types_5',
    xpReward: 100,
  },
  {
    id: 'strength_20',
    name: 'Força Total',
    description: '20 treinos de musculação completados',
    emoji: '🦾',
    category: 'treino',
    condition: 'strength_workouts_20',
    xpReward: 200,
  },

  // ── Sono ────────────────────────────────────────────────────────────────────
  {
    id: 'sleep_day_1',
    name: 'Boa Noite',
    description: '1 dia registrando sono',
    emoji: '😴',
    category: 'sono',
    condition: 'sleep_streak_1',
    xpReward: 25,
  },
  {
    id: 'sleep_day_7',
    name: 'Descansad(a/o)',
    description: '7 dias seguidos registrando sono',
    emoji: '🌙',
    category: 'sono',
    condition: 'sleep_streak_7',
    xpReward: 75,
  },
  {
    id: 'sleep_day_21',
    name: 'Sono de Ouro',
    description: '21 dias seguidos de sono registrado',
    emoji: '⭐',
    category: 'sono',
    condition: 'sleep_streak_21',
    xpReward: 150,
  },
  {
    id: 'sleep_day_45',
    name: 'Hibernando',
    description: '45 dias seguidos registrando sono',
    emoji: '🐻',
    category: 'sono',
    condition: 'sleep_streak_45',
    xpReward: 250,
  },
  {
    id: 'sleep_day_90',
    name: 'Mestre do Sono',
    description: '90 dias seguidos de sono registrado',
    emoji: '🌟',
    category: 'sono',
    condition: 'sleep_streak_90',
    xpReward: 500,
  },

  // ── Progresso ───────────────────────────────────────────────────────────────
  {
    id: 'weight_1kg',
    name: 'Primeiro Passo',
    description: '1kg em direção à meta',
    emoji: '🎯',
    category: 'progresso',
    condition: 'weight_progress_1kg',
    xpReward: 100,
  },
  {
    id: 'weight_5kg',
    name: 'Determinação',
    description: '5kg em direção à meta',
    emoji: '🌟',
    category: 'progresso',
    condition: 'weight_progress_5kg',
    xpReward: 300,
  },
  {
    id: 'weight_10kg',
    name: 'Transformação',
    description: '10kg em direção à meta',
    emoji: '🏆',
    category: 'progresso',
    condition: 'weight_progress_10kg',
    xpReward: 700,
  },
  {
    id: 'checkin_30',
    name: 'Consistência de Ferro',
    description: '30 check-ins diários realizados',
    emoji: '💪',
    category: 'progresso',
    condition: 'checkins_30',
    xpReward: 200,
  },
  {
    id: 'goal_reached',
    name: 'Missão Completa',
    description: 'Atingiu o peso meta pela primeira vez',
    emoji: '🎉',
    category: 'progresso',
    condition: 'weight_goal_reached',
    xpReward: 1000,
  },
  {
    id: 'refer_friend',
    name: 'Parceira da Saúde',
    description: 'Convidou uma amiga que se cadastrou',
    emoji: '👭',
    category: 'progresso',
    condition: 'friend_referred',
    xpReward: 200,
  },
  {
    id: 'pdf_report_3',
    name: 'Relatório para o Médico',
    description: 'Gerou e baixou 3 relatórios PDF',
    emoji: '📄',
    category: 'progresso',
    condition: 'pdf_reports_3',
    xpReward: 150,
  },
]

// ── Cores por categoria ───────────────────────────────────────────────────────

export const CATEGORY_COLORS: Record<AchievementCategory, string> = {
  primeiros_passos: '#22c55e', // primary (verde)
  hidratacao:       '#3b82f6', // azul
  nutricao:         '#22c55e', // verde
  treino:           '#f97316', // laranja
  sono:             '#a855f7', // roxo
  progresso:        '#f59e0b', // dourado
}

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  primeiros_passos: 'Primeiros Passos',
  hidratacao:       'Hidratação',
  nutricao:         'Nutrição',
  treino:           'Treino',
  sono:             'Sono',
  progresso:        'Progresso',
}
