export type Gender = 'masculino' | 'feminino' | 'outro' | 'prefiro_nao_informar'

export type Goal = 'perder_peso' | 'ganhar_massa' | 'manter_peso' | 'saude_geral'

export type ActivityLevel = 'sedentario' | 'leve' | 'moderado' | 'intenso' | 'muito_intenso'

export type MedicationType = 'nenhum' | 'ozempic' | 'saxenda' | 'victoza' | 'mounjaro' | 'wegovy' | 'outro_glp1'

export type DietaryPreference = 'nenhuma' | 'vegetariano' | 'vegano' | 'sem_lactose' | 'sem_gluten' | 'low_carb' | 'diabetes'

export type FastingExperience = 'nunca' | 'iniciante' | 'intermediario' | 'avancado'

export type SleepQuality = 'ruim' | 'regular' | 'bom' | 'excelente'

export type FastingFeeling = 'bem' | 'cansado' | 'sem_energia' | 'com_muita_energia' | 'sem_fome' | 'faminto' | 'normal'

export type SubscriptionPlan = 'free' | 'premium' | 'premium_anual'

export interface MealRoutine {
  mealsPerDay: number
  breakfastTime?: string
  lunchTime?: string
  dinnerTime?: string
  hasSnacks: boolean
}

export interface MedicalLimitation {
  hasLimitation: boolean
  description?: string
}

export interface UserProfile {
  id: string
  name: string
  email?: string
  age: number
  gender: Gender
  height: number // em cm
  startingWeight: number // peso no onboarding, nunca atualizado
  currentWeight: number // em kg (atualizado a cada registro de peso)
  targetWeight: number // em kg
  bodyFatPercentage?: number // % de gordura corporal (opcional)
  goal: Goal
  activityLevel: ActivityLevel

  // Preferências alimentares
  dietaryPreferences: DietaryPreference[]

  // Rotina
  mealRoutine: MealRoutine
  averageSleepHours: number
  sleepQuality: SleepQuality

  // Jejum
  fastingExperience: FastingExperience
  interestedInFasting: boolean

  // Medicação e saúde
  medication: MedicationType
  medicationDosage?: string
  /**
   * Cirurgia bariátrica realizada. É tratada separadamente de medicação
   * porque o usuário pode ter feito a cirurgia E estar usando GLP-1.
   */
  hadBariatricSurgery?: boolean
  medicalLimitations: MedicalLimitation

  // LGPD
  consentTerms: boolean
  consentPrivacyPolicy: boolean
  consentDataProcessing: boolean

  // Metas calculadas
  tdee?: number
  bmr?: number
  targetCalories?: number
  targetProtein?: number
  targetCarbs?: number
  targetFat?: number
  targetFiber?: number
  targetWater?: number

  profilePhoto?: string
  country?: string
  language?: string

  // Preferências do cardápio (persistidas; o diálogo pré-preenche e as gerações respeitam)
  menuPreferences?: MenuPreferences

  // Assinatura / Trial
  plan?: SubscriptionPlan
  trialStartedAt?: Date
  subscriptionEmail?: string

  // Gamificação XP
  totalXP?: number              // Total de pontos de experiência acumulados
  xpAchievements?: string[]     // IDs de XPAchievement desbloqueados (sistema novo)

  createdAt: Date
  updatedAt: Date
}

export interface IMCData {
  value: number
  category: 'abaixo' | 'normal' | 'sobrepeso' | 'obesidade_i' | 'obesidade_ii' | 'obesidade_iii'
  description: string
}

export interface MacroNutrients {
  calories: number
  protein: number // em gramas
  carbs: number // em gramas
  fat: number // em gramas
  fiber: number // em gramas
}

export interface WaterIntake {
  date: string
  target: number // em ml
  consumed: number // em ml
  glasses: number // copos de 200ml
}

export interface FoodItem {
  id: string
  name: string
  category: 'proteina' | 'carboidrato' | 'gordura' | 'vegetal' | 'fruta' | 'bebida' | 'outro'
  portion: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  // Micronutrientes (disponíveis para alimentos analisados por IA)
  sodium?: number        // mg — sódio
  sugar?: number         // g  — açúcar total
  saturatedFat?: number  // g  — gordura saturada
  omega3?: number        // g  — ômega-3
  cholesterol?: number   // mg — colesterol
  isBrazilian: boolean
  isHealthy: boolean
  barcode?: string
  customQuantity?: number // Multiplicador da porção (ex: 1.5 = 1.5x a porção padrão)
}

export interface Meal {
  id: string
  date: Date
  type: 'cafe' | 'lanche_manha' | 'almoco' | 'lanche_tarde' | 'jantar' | 'ceia'
  foods: FoodItem[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  photoUrl?: string
  notes?: string
}

export interface FastingSession {
  id: string
  startTime: Date
  endTime?: Date
  targetDuration: number // em horas
  actualDuration?: number // em horas
  completed: boolean
  type: '16_8' | '18_6' | '20_4' | '24h' | '12_12' | '14_10' | 'personalizado'
}

export type WorkoutType = 'pilates' | 'yoga' | 'caminhada' | 'corrida' | 'musculacao' | 'danca' | 'natacao' | 'outro'

export interface WorkoutSession {
  id: string
  date: Date
  type: WorkoutType
  duration: number // em minutos
  caloriesBurned: number
  intensity: 'leve' | 'moderado' | 'intenso'
  notes?: string
  completed: boolean
}

export interface WorkoutPlan {
  id: string
  name: string
  type: WorkoutType
  description: string
  duration: number
  difficulty: 'iniciante' | 'intermediario' | 'avancado'
  exercises: Exercise[]
  caloriesEstimate: number
}

export interface Exercise {
  name: string
  duration?: number // em minutos
  repetitions?: number
  sets?: number
  description: string
  videoUrl?: string
}

export interface WeightEntry {
  id: string
  date: Date
  weight: number
  notes?: string
}

export interface ProgressStats {
  weightLost: number
  daysActive: number
  workoutsCompleted: number
  averageCalories: number
  waterGoalsMet: number
  fastingSessionsCompleted: number
}

export interface SleepEntry {
  id: string
  date: string       // YYYY-MM-DD
  bedtime: string    // HH:MM
  wakeTime: string   // HH:MM
  duration: number   // horas (calculado)
  quality: SleepQuality
  notes?: string
}

export interface MotivationalMessage {
  id: string
  message: string
  type: 'encouragement' | 'tip' | 'reminder' | 'celebration'
  icon: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'water' | 'meal' | 'workout' | 'weigh_in' | 'motivation'
  time: Date
  read: boolean
}

export interface FastingLogEntry {
  id: string
  date: Date
  protocolType: string // ex: '16_8', '18_6', '20_4', etc
  protocolName: string // ex: '16:8 (Iniciante)'
  hours: number
  startTime?: string
  endTime?: string
  feeling: FastingFeeling
  notes?: string
  completed: boolean
}

export interface BodyMeasurement {
  id: string
  date: Date
  weight?: number
  neck?: number // pescoço (cm)
  chest?: number // peito (cm)
  waist?: number // cintura (cm)
  hips?: number // quadril (cm)
  thigh?: number // coxa (cm)
  arm?: number // braço (cm)
  calf?: number // panturrilha (cm)
  bodyFat?: number // % gordura corporal
  notes?: string
}

// ── Gamificação (Check-in diário) ──────────────────────────────────────��──────

export interface CheckInEntry {
  date: string // YYYY-MM-DD
}

export type BadgeTier = 'bronze' | 'prata' | 'ouro' | 'platina' | 'diamante'

export interface BadgeDefinition {
  id: string
  name: string
  description: string
  requiredDays: number
  tier: BadgeTier
  icon: string // lucide icon name
}

export interface CheckInState {
  history: CheckInEntry[] // todas as datas de check-in
  currentStreak: number
  longestStreak: number
  unlockedBadges: string[] // IDs dos badges desbloqueados
}

// ── Gamificação por atividade (água / treino / sono) ──────────────────────────

export type ActivityKind = 'water' | 'workout' | 'sleep'

export interface ActivityStreak {
  currentStreak: number
  longestStreak: number
  lastDate: string   // YYYY-MM-DD do último registro
  totalDays: number  // total de dias com a atividade
  history: string[]  // datas YYYY-MM-DD
}

export interface AchievementDefinition {
  id: string
  activity: ActivityKind
  name: string
  description: string
  threshold: number  // dias de sequência para desbloquear
  tier: BadgeTier
  icon: string       // nome do ícone lucide
}

export interface GamificationState {
  streaks: Record<ActivityKind, ActivityStreak>
  unlockedAchievements: string[] // IDs de conquistas desbloqueadas
}

export interface PrivacySettings {
  dataSharing: boolean
  analytics: boolean
  notifications: boolean
  reminders: boolean
  acceptedTerms: boolean
  acceptedPrivacyPolicy: boolean
}

export interface MenuFoodItem {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number // g — opcional para retrocompatibilidade (cardápios antigos não têm)
}

export type MenuFood = string | MenuFoodItem

/**
 * Estrutura de refeições escolhida no momento da geração do cardápio.
 * Tem prioridade sobre o mealRoutine do perfil. Quando indefinida, a geração
 * aplica um default inteligente (fracionado para GLP-1, bariátrica ou ganho de massa).
 */
export interface MealStructure {
  includeMorningSnack: boolean // lanche da manhã
  includeAfternoonSnack: boolean // lanche da tarde
  includeSupper: boolean // ceia
}

/**
 * Preferências do cardápio que o usuário define no diálogo de geração e que devem PERSISTIR
 * (para o diálogo pré-preencher e as próximas gerações respeitarem). Guardadas na coluna
 * menu_preferences (JSONB) da tabela profiles.
 */
export interface MenuPreferences {
  excludedFoods?: string[]
  country?: string
  mealStructureMode?: 'principais' | 'fracionado'
  fastingProtocol?: string | null // null/undefined = sem jejum
  highCalMealPriority?: string
  highCalorieDays?: string[]
}

export interface SavedWeeklyMenu {
  id: string
  title: string
  description: string
  days: Array<{
    day: string
    meals: Array<{
      type: string
      name: string
      foods: MenuFood[]
      calories: number
      protein: number
      carbs: number
      fat: number
      fiber?: number // g — total da refeição (opcional p/ retrocompat)
    }>
  }>
  tips: string[]
  shoppingList: string[]
  substitutions?: Array<{ original: string; alternatives: string[] }>
  createdAt: Date
  acceptedAt: Date
}

export type CyclePhase = 'menstrual' | 'folicular' | 'ovulacao' | 'lutea'

export interface CycleConfig {
  lastPeriodStart: string // ISO date string (YYYY-MM-DD)
  averageCycleDuration: number // dias, ex: 28
  averagePeriodDuration: number // dias, ex: 5
  typicalVariation: number // ex: 2
  mainGoal?: 'saude' | 'emagrecimento' | 'hipertrofia' | 'performance'
  restrictions?: string[]
  isMenopausa?: boolean
  wantsToGetPregnant?: boolean
}

export type WorkoutEnvironment = 'casa' | 'academia' | 'misto'

export interface AIExercise {
  name: string
  sets?: number
  reps?: string
  duration?: string
  restTime?: string
  notes?: string
  /** URL do GIF/webp animado de demonstração (biblioteca exercise-gifs). */
  gifUrl?: string
}

export interface AIWorkoutDay {
  name: string
  focus: string
  exercises: AIExercise[]
}

export interface AIWorkoutPlan {
  environment: WorkoutEnvironment
  generatedAt: string // ISO date string
  measurements: {
    weight: number
    waist?: number
    hips?: number
    chest?: number
    arm?: number
  }
  muscleGroups: string[]       // grupos musculares prioritários
  homeEquipment?: string[]     // equipamentos disponíveis em casa
  workoutPreference?: string
  objectives?: string[]
  workoutCount?: number
  addAerobic?: boolean
  sessionDurationPref?: string
  mistoHomeSessions?: number
  mistoAcadSessions?: number
  plan: {
    title: string
    description: string
    daysPerWeek: number
    sessionDuration: number
    days: AIWorkoutDay[]
    tips: string[]
    warmup: string[]
    cooldown: string[]
  }
}

export interface CycleDayInfo {
  dayOfCycle: number
  phase: CyclePhase
  nextPeriodStart: Date
  nextPeriodEnd: Date
  ovulationWindowStart: Date
  ovulationWindowEnd: Date
  daysUntilNextPeriod: number
}

export type PhotoCategory = 'frente' | 'lado' | 'costas'

export interface ProgressPhoto {
  id: string
  userId: string
  url: string
  filePath: string
  category: PhotoCategory
  date: Date
  notes?: string
  weight?: number
}

export interface FoodSubstitution {
  original: string
  substitutes: Array<{
    name: string
    portion: string
    calories: number
    protein: number
    carbs: number
    fat: number
    notes?: string
  }>
}
