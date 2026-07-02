import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import type {
  UserProfile,
  WaterIntake,
  Meal,
  FastingSession,
  WorkoutSession,
  WeightEntry,
  PrivacySettings,
  MotivationalMessage,
  SavedWeeklyMenu,
  CycleConfig,
  AIWorkoutPlan,
  ProgressPhoto,
  PhotoCategory,
  SleepEntry,
  BodyMeasurement,
  CheckInState,
  CheckInEntry,
  GamificationState,
  ActivityKind,
  ActivityStreak,
  MenuPreferences,
} from '@/types'
import { BADGES } from '@/data/badges'
import { ACHIEVEMENTS } from '@/data/achievements'
import { XP_ACTIONS, type XPAction, canUseStreakShield, getLevelForXP, getLevelName, autoIncrementChallenge } from '@/lib/gamification'
import type { CelebrationKind } from '@/components/celebration-modal'
import { calculateBMR, calculateTDEE, calculateCalorieTarget, calculateMacros, calculateWaterTarget, applyClinicalFloors } from '@/lib/health-utils'
import { supabase } from '@/lib/supabase'
import {
  upsertDailyWater, insertMealDb, deleteMealDb, insertWorkoutDb,
  insertWeightEntryDb, insertSleepDb, deleteSleepDb, loadSleepHistoryDb, insertFastingSessionDb, updateFastingSessionDb,
  upsertCycleConfigDb, upsertAiWorkoutPlanDb,
  loadTodayData, loadWeightHistoryDb, loadUserConfig, fetchReportData,
  upsertWeeklyMenuDb, deleteWeeklyMenuDb, loadWeeklyMenuDb,
  insertBodyMeasurementDb, deleteBodyMeasurementDb, loadBodyMeasurementsDb,
  upsertCheckInDb, loadCheckInDb,
  upsertGamificationDb, loadGamificationDb,
  localDateStr, saveProgressPhotoDb, signProgressPhotoUrl, dbGet,
} from '@/lib/db-sync'
import { generatePDFReport } from '@/lib/report-generator'
import { registerServiceWorker, subscribeToPush, unsubscribeFromPush, startLocalNotifications, stopLocalNotifications, requestNotificationPermission } from '@/lib/notifications'
import { generateWeeklyMenu, menuPreferencesToOptions } from '@/lib/gemini'
import {
  checkBiometricAvailability,
  registerBiometric,
  authenticateWithBiometric,
  saveBiometricSession,
  getBiometricSession,
  isBiometricEnabled as isBiometricEnabledFn,
  clearBiometricData,
} from '@/lib/biometric-auth'

interface AppContextType {
  // User
  user: UserProfile | null
  setUser: (user: UserProfile | null) => void
  isOnboarding: boolean
  completeOnboarding: () => void

  // Auth
  session: Session | null
  isAuthenticated: boolean
  authLoading: boolean
  login: (email: string, password: string) => Promise<{ error: string | null }>
  loginWithGoogle: () => Promise<{ error: string | null }>
  logout: () => Promise<void>
  register: (email: string, password: string) => Promise<{ error: string | null }>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  savePendingProfile: (profile: UserProfile) => void

  // Water
  todayWater: WaterIntake
  addWater: (amount: number) => void
  resetWater: () => void

  // Meals
  todayMeals: Meal[]
  addMeal: (meal: Meal) => void
  removeMeal: (id: string) => void

  // Fasting
  activeFasting: FastingSession | null
  startFasting: (session: FastingSession) => void
  endFasting: () => void

  // Workouts
  todayWorkouts: WorkoutSession[]
  addWorkout: (workout: WorkoutSession) => void

  // Weight
  weightHistory: WeightEntry[]
  addWeightEntry: (entry: WeightEntry) => void

  // Privacy
  privacySettings: PrivacySettings
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void

  // Motivational
  dailyMessage: MotivationalMessage

  // Weekly Menu
  savedWeeklyMenu: SavedWeeklyMenu | null
  saveWeeklyMenu: (menu: SavedWeeklyMenu) => void
  clearWeeklyMenu: () => void
  updateMenuPreferences: (prefs: MenuPreferences) => void

  // Cycle
  cycleConfig: CycleConfig | null
  setCycleConfig: (config: CycleConfig | null) => void

  // AI Workout
  aiWorkoutPlan: AIWorkoutPlan | null
  saveAiWorkoutPlan: (plan: AIWorkoutPlan) => void
  clearAiWorkoutPlan: () => void

  // Sleep
  sleepHistory: SleepEntry[]
  addSleepEntry: (entry: SleepEntry) => void
  deleteSleepEntry: (id: string) => void

  // Report
  generateReport: (startDate: string, endDate: string) => Promise<void>

  // Progress Photos
  progressPhotos: ProgressPhoto[]
  addProgressPhoto: (file: File, category: PhotoCategory, notes?: string, weight?: number) => Promise<void>
  deleteProgressPhoto: (id: string, filePath: string) => Promise<void>

  // Body Measurements
  bodyMeasurements: BodyMeasurement[]
  addBodyMeasurement: (entry: BodyMeasurement) => void
  deleteBodyMeasurement: (id: string) => void

  // Biometric
  isBiometricAvailable: boolean
  isBiometricEnabled: boolean
  enableBiometric: () => Promise<{ error: string | null }>
  disableBiometric: () => void
  loginWithBiometric: () => Promise<{ error: string | null }>

  // Check-in / Gamificação
  checkInState: CheckInState
  performCheckIn: () => string[] // retorna IDs de novos badges desbloqueados
  gamification: GamificationState
  registerActivity: (kind: ActivityKind) => string[] // retorna IDs de conquistas novas
  pendingAchievements: string[] // conquistas aguardando celebração
  dismissAchievements: () => void
  pendingRecord: { kind: ActivityKind; streak: number } | null // novo recorde aguardando celebração
  dismissRecord: () => void

  // XP System
  awardXP: (action: import('@/lib/gamification').XPAction) => void
  triggerCelebration: (opts: { kind: CelebrationKind; title: string; subtitle?: string; xpGained?: number }) => void
  pendingCelebration: { kind: CelebrationKind; title: string; subtitle?: string; xpGained?: number } | null
  dismissCelebration: () => void

  // Streak Shield
  streakShieldUsedAt: string | null
  useStreakShield: () => boolean

  // Profile completeness
  isProfileComplete: boolean

  // Assinatura / Trial
  updateSubscription: (plan: 'free' | 'premium' | 'premium_anual', subscriptionEmail?: string) => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

const STORAGE_KEYS = {
  USER: 'bemai_user',
  ONBOARDING: 'bemai_onboarding',
  WATER: 'bemai_water',
  MEALS: 'bemai_meals',
  FASTING: 'bemai_fasting',
  WORKOUTS: 'bemai_workouts',
  WEIGHT: 'bemai_weight',
  PRIVACY: 'bemai_privacy',
  WEEKLY_MENU: 'bemai_weekly_menu',
  CYCLE: 'bemai_cycle_config',
  PENDING_PROFILE: 'bemai_pending_profile',
  AI_WORKOUT: 'bemai_ai_workout',
  SLEEP: 'bemai_sleep',
  BODY_MEASUREMENTS: 'bemai_body_measurements',
  CHECK_IN: 'bemai_check_in',
  GAMIFICATION: 'bemai_gamification',
}

// Migra dados de localStorage vivabem_* → bemai_* (executa uma vez)
;(() => {
  if (localStorage.getItem('__bemai_migrated')) return
  const migrationMap: Record<string, string> = {
    vivabem_user: 'bemai_user',
    vivabem_onboarding: 'bemai_onboarding',
    vivabem_water: 'bemai_water',
    vivabem_meals: 'bemai_meals',
    vivabem_fasting: 'bemai_fasting',
    vivabem_workouts: 'bemai_workouts',
    vivabem_weight: 'bemai_weight',
    vivabem_privacy: 'bemai_privacy',
    vivabem_weekly_menu: 'bemai_weekly_menu',
    vivabem_cycle_config: 'bemai_cycle_config',
    vivabem_pending_profile: 'bemai_pending_profile',
    vivabem_ai_workout: 'bemai_ai_workout',
    vivabem_sleep: 'bemai_sleep',
    vivabem_body_measurements: 'bemai_body_measurements',
    vivabem_biometric_cred: 'bemai_biometric_cred',
    vivabem_biometric_session: 'bemai_biometric_session',
  }
  for (const [oldKey, newKey] of Object.entries(migrationMap)) {
    const val = localStorage.getItem(oldKey)
    if (val !== null && localStorage.getItem(newKey) === null) {
      localStorage.setItem(newKey, val)
    }
  }
  localStorage.setItem('__bemai_migrated', '1')
})()

type MessagePeriod = 'morning' | 'afternoon' | 'evening' | 'night'

const messagesByPeriod: Record<MessagePeriod, MotivationalMessage[]> = {
  morning: [
    { id: 'm1', message: 'Bom dia! Um café da manhã nutritivo é o combustível do seu sucesso.', type: 'tip', icon: 'sun' },
    { id: 'm2', message: 'O dia ainda está começando — cada escolha saudável agora vai render frutos!', type: 'encouragement', icon: 'trending-up' },
    { id: 'm3', message: 'Manhãs são começos. Hoje é mais uma chance de ser a sua melhor versão.', type: 'encouragement', icon: 'sparkles' },
    { id: 'm4', message: 'Hidrate-se! Seu corpo perdeu água durante o sono e já precisa repor.', type: 'reminder', icon: 'droplet' },
    { id: 'm5', message: 'Uma boa manhã começa com intenção. O que você vai conquistar hoje?', type: 'encouragement', icon: 'heart' },
    { id: 'm6', message: 'Comer bem de manhã mantém a energia e o foco por horas. Capriche no café!', type: 'tip', icon: 'info' },
    { id: 'm7', message: 'Você acordou — isso já é um motivo para ser grato e se cuidar bem hoje!', type: 'celebration', icon: 'sparkles' },
    { id: 'm8', message: 'Pequenos hábitos matinais constroem grandes resultados ao longo do tempo.', type: 'tip', icon: 'trending-up' },
    { id: 'm9', message: 'Que tal uma caminhada matinal? Seu metabolismo vai adorar!', type: 'reminder', icon: 'footprints' },
    { id: 'm10', message: 'Bom dia! Lembre-se: consistência vale mais do que perfeição.', type: 'encouragement', icon: 'heart' },
  ],
  afternoon: [
    { id: 'a1', message: 'Metade do dia já passou — parabéns por cada escolha saudável que você fez!', type: 'celebration', icon: 'sparkles' },
    { id: 'a2', message: 'Hora do almoço! Capriche nos vegetais e nas proteínas.', type: 'tip', icon: 'info' },
    { id: 'a3', message: 'Se bateu aquela preguiça, respire fundo e lembre por que você começou.', type: 'encouragement', icon: 'heart' },
    { id: 'a4', message: 'Hidratação à tarde ajuda a evitar confundir sede com fome.', type: 'reminder', icon: 'droplet' },
    { id: 'a5', message: 'Seu progresso é real, mesmo quando você não consegue ver ainda.', type: 'encouragement', icon: 'trending-up' },
    { id: 'a6', message: 'Dica: mastigar devagar ajuda na digestão e no controle da saciedade.', type: 'tip', icon: 'info' },
    { id: 'a7', message: 'A tarde é um ótimo momento para um lanche saudável e se manter produtivo.', type: 'reminder', icon: 'heart-pulse' },
    { id: 'a8', message: 'Você está chegando lá! Continue firme nas suas metas de hoje.', type: 'encouragement', icon: 'trending-up' },
    { id: 'a9', message: 'Se possível, levante e se mova um pouco entre as atividades. Seu corpo agradece!', type: 'reminder', icon: 'footprints' },
    { id: 'a10', message: 'Cada refeição bem feita é um investimento na sua saúde futura.', type: 'tip', icon: 'heart' },
  ],
  evening: [
    { id: 'e1', message: 'Boa noite começa com uma boa janta — nutritiva e não muito pesada!', type: 'tip', icon: 'moon' },
    { id: 'e2', message: 'O dia está chegando ao fim. Como foram suas escolhas hoje?', type: 'encouragement', icon: 'heart' },
    { id: 'e3', message: 'Reflita: o que você fez hoje que te aproximou dos seus objetivos?', type: 'encouragement', icon: 'sparkles' },
    { id: 'e4', message: 'Uma caminhada leve após o jantar pode fazer maravilhas para o bem-estar.', type: 'reminder', icon: 'footprints' },
    { id: 'e5', message: 'Parabéns por mais um dia! Amanhã é uma nova oportunidade.', type: 'celebration', icon: 'sparkles' },
    { id: 'e6', message: 'Evite alimentos muito pesados agora — seu sono vai agradecer!', type: 'tip', icon: 'moon' },
    { id: 'e7', message: 'Aproveite a noite para relaxar. Recuperação também faz parte do processo.', type: 'tip', icon: 'heart-pulse' },
    { id: 'e8', message: 'Você foi além ontem e pode ir ainda mais longe amanhã. Bom descanso!', type: 'encouragement', icon: 'trending-up' },
    { id: 'e9', message: 'Cuidar do jantar com atenção é um gesto de amor pelo seu corpo.', type: 'encouragement', icon: 'heart' },
    { id: 'e10', message: 'Um pequeno lanche leve está ok — ouça o seu corpo com carinho.', type: 'reminder', icon: 'info' },
  ],
  night: [
    { id: 'n1', message: 'A noite é sagrada para a recuperação. Durma bem!', type: 'reminder', icon: 'moon' },
    { id: 'n2', message: 'Dormir é quando seus músculos se recuperam e seu corpo se renova.', type: 'tip', icon: 'moon' },
    { id: 'n3', message: 'Antes de dormir, hidrate-se levemente. Boa noite!', type: 'reminder', icon: 'droplet' },
    { id: 'n4', message: 'Seu corpo trabalha enquanto você dorme — dê a ele o descanso que merece.', type: 'tip', icon: 'heart-pulse' },
    { id: 'n5', message: 'Uma boa noite de sono é tão importante quanto a alimentação. Descanse!', type: 'tip', icon: 'moon' },
    { id: 'n6', message: 'Amanhã é mais um dia para ser incrível. Por ora, recarregue as energias.', type: 'encouragement', icon: 'sparkles' },
    { id: 'n7', message: 'Sono de qualidade regula hormônios e ajuda a controlar o apetite. Bons sonhos!', type: 'tip', icon: 'moon' },
    { id: 'n8', message: 'Desligue a tela e deixe seu corpo e mente descansarem com tranquilidade.', type: 'reminder', icon: 'moon' },
  ],
}

function getCurrentPeriod(): MessagePeriod {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 22) return 'evening'
  return 'night'
}

export function getTimeAwareMessage(): MotivationalMessage {
  const pool = messagesByPeriod[getCurrentPeriod()]
  return pool[Math.floor(Math.random() * pool.length)]
}

function getDailyMessage(): MotivationalMessage {
  return getTimeAwareMessage()
}

// Mapeia UserProfile (camelCase) → colunas do DB (snake_case)
function mapProfileToDb(profile: UserProfile, email: string) {
  return {
    name: profile.name,
    age: profile.age,
    gender: profile.gender,
    height: profile.height,
    current_weight: profile.currentWeight,
    target_weight: profile.targetWeight,
    body_fat_percentage: profile.bodyFatPercentage ?? null,
    goal: profile.goal,
    activity_level: profile.activityLevel,
    dietary_preferences: profile.dietaryPreferences,
    meal_routine: profile.mealRoutine,
    average_sleep_hours: profile.averageSleepHours,
    sleep_quality: profile.sleepQuality,
    fasting_experience: profile.fastingExperience,
    interested_in_fasting: profile.interestedInFasting,
    medication: profile.medication,
    medication_dosage: profile.medicationDosage ?? null,
    had_bariatric_surgery: profile.hadBariatricSurgery ?? false,
    medical_limitations: profile.medicalLimitations,
    consent_terms: profile.consentTerms,
    consent_privacy_policy: profile.consentPrivacyPolicy,
    consent_data_processing: profile.consentDataProcessing,
    bmr: profile.bmr ?? null,
    tdee: profile.tdee ?? null,
    target_calories: profile.targetCalories ?? null,
    target_protein: profile.targetProtein ?? null,
    target_carbs: profile.targetCarbs ?? null,
    target_fat: profile.targetFat ?? null,
    target_fiber: profile.targetFiber ?? null,
    target_water: profile.targetWater ?? null,
    plan: profile.plan ?? 'free',
    trial_started_at: profile.trialStartedAt
      ? (profile.trialStartedAt instanceof Date ? profile.trialStartedAt : new Date(profile.trialStartedAt)).toISOString()
      : new Date().toISOString(),
    subscription_email: profile.subscriptionEmail ?? null,
    email,
  }
}

// Garante que o usuário tem trialStartedAt preenchido. Se não tiver
// (perfil antigo criado antes do sistema de trial), inicializa AGORA e sincroniza no DB.
// Isso evita que usuários existentes sejam bloqueados instantaneamente.
async function ensureTrialInitialized(profile: UserProfile): Promise<UserProfile> {
  if (profile.trialStartedAt && profile.plan) return profile
  const trialStart = profile.trialStartedAt
    ? (profile.trialStartedAt instanceof Date ? profile.trialStartedAt : new Date(profile.trialStartedAt))
    : new Date()
  const plan = profile.plan ?? 'free'
  try {
    await supabase
      .from('profiles')
      .update({ trial_started_at: trialStart.toISOString(), plan })
      .eq('id', profile.id)
  } catch {
    // falha silenciosa — será retentado no próximo load
  }
  return { ...profile, plan, trialStartedAt: trialStart }
}

// Mapeia linha do DB (snake_case) → UserProfile (camelCase)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbToProfile(row: Record<string, any>): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? undefined,
    age: row.age,
    gender: row.gender,
    height: row.height,
    startingWeight: row.starting_weight ?? row.current_weight,
    currentWeight: row.current_weight,
    targetWeight: row.target_weight,
    bodyFatPercentage: row.body_fat_percentage ?? undefined,
    goal: row.goal,
    activityLevel: row.activity_level,
    dietaryPreferences: row.dietary_preferences ?? [],
    mealRoutine: row.meal_routine,
    averageSleepHours: row.average_sleep_hours,
    sleepQuality: row.sleep_quality,
    fastingExperience: row.fasting_experience,
    interestedInFasting: row.interested_in_fasting,
    // Migração de dados: perfis antigos com medication='bariatrica' viram
    // medication='nenhum' + hadBariatricSurgery=true (persistido no próximo save).
    medication: row.medication === 'bariatrica' ? 'nenhum' : row.medication,
    medicationDosage: row.medication_dosage ?? undefined,
    hadBariatricSurgery: row.had_bariatric_surgery ?? (row.medication === 'bariatrica'),
    medicalLimitations: row.medical_limitations,
    consentTerms: row.consent_terms,
    consentPrivacyPolicy: row.consent_privacy_policy,
    consentDataProcessing: row.consent_data_processing,
    bmr: row.bmr ?? undefined,
    tdee: row.tdee ?? undefined,
    targetCalories: row.target_calories ?? undefined,
    targetProtein: row.target_protein ?? undefined,
    targetCarbs: row.target_carbs ?? undefined,
    targetFat: row.target_fat ?? undefined,
    targetFiber: row.target_fiber ?? undefined,
    targetWater: row.target_water ?? undefined,
    plan: row.plan ?? undefined,
    trialStartedAt: row.trial_started_at ? new Date(row.trial_started_at) : undefined,
    subscriptionEmail: row.subscription_email ?? undefined,
    // Preferências do cardápio (coluna menu_preferences; undefined se a coluna ainda não existir)
    menuPreferences: row.menu_preferences ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER)
    if (stored) {
      try {
        const parsedUser = JSON.parse(stored)
        // Detecta perfil estruturalmente inválido (campos obrigatórios ausentes = undefined).
        // ATENÇÃO: usa === undefined, NÃO !campo, para não confundir consentTerms=false
        // (usuário que ainda não aceitou) com campo ausente (perfil muito antigo).
        // localStorage.clear() substituído por remoção seletiva — não apaga dados do usuário
        // (refeições, água, treinos, peso) por causa de um perfil corrompido.
        if (parsedUser.dietaryPreferences === undefined || parsedUser.mealRoutine === undefined || parsedUser.consentTerms === undefined) {
          console.log('Perfil antigo detectado, removendo apenas o perfil...')
          localStorage.removeItem(STORAGE_KEYS.USER)
          return null
        }
        return parsedUser
      } catch (e) {
        console.error('Erro ao carregar perfil:', e)
        localStorage.removeItem(STORAGE_KEYS.USER)
        return null
      }
    }
    return null
  })

  const [isOnboarding, setIsOnboarding] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING) !== 'completed'
  })

  // Auth
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const loggingOut = useRef(false)

  useEffect(() => {
    let resolved = false
    const markReady = () => {
      if (!resolved) { resolved = true; setAuthLoading(false) }
    }

    // Timeout de segurança: se o Supabase não responder em 5s, libera a UI
    const safetyTimer = setTimeout(markReady, 5000)

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session)
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(safetyTimer)
        markReady()
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignora eventos apos logout manual para evitar re-autenticacao
      if (loggingOut.current) return

      setSession(session)

      if (event === 'SIGNED_OUT') {
        // Só limpa o estado se for logout explícito (loggingOut.current já cobre isso acima,
        // mas TOKEN_REFRESH_FAILED também dispara SIGNED_OUT — nesse caso session vem null
        // mas o token sb-* ainda pode existir no localStorage; não queremos mostrar tela vazia).
        // Se ainda há um token Supabase guardado, ignoramos o SIGNED_OUT espúrio.
        const hasStoredToken = Object.keys(localStorage).some(
          k => k.startsWith('sb-') && k.endsWith('-auth-token')
        )
        if (hasStoredToken) return
        setUserState(null)
        return
      }

      // Login (SIGNED_IN) ou restauração de sessão no boot (INITIAL_SESSION).
      // Carregar o perfil TAMBÉM no INITIAL_SESSION evita a TELA BRANCA quando o
      // app reabre com sessão válida mas sem o cache 'bemai_user' no localStorage
      // (o "bug de login" relatado pela cliente: autenticado, porém sem dados).
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        const userId = session.user.id
        const email = session.user.email ?? ''
        const pending = localStorage.getItem(STORAGE_KEYS.PENDING_PROFILE)

        // Busca o perfil via REST (dbGet): não pendura no lock do supabase-js
        // durante o boot. Se a leitura falhar, não mexe no estado (evita
        // sobrescrever um perfil válido por um perfil mínimo).
        const profileRes = await dbGet(`profiles?id=eq.${userId}&select=*`)
        if (!profileRes.ok) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const profileRows = (await profileRes.json().catch(() => [])) as any[]
        const existingRow = Array.isArray(profileRows) && profileRows[0] ? profileRows[0] : null

        if (existingRow) {
          // Perfil já existe — apenas carrega (segundo login, login após logout,
          // ou reabrir o app com o cache local ausente).
          const loaded = mapDbToProfile(existingRow)
          const profile = await ensureTrialInitialized(loaded)

          // Se o perfil no banco está incompleto (minimal — age/height/weight = 0),
          // tenta recuperar o perfil completo do localStorage (pode ter sido preenchido
          // via ProfileSetupModal enquanto o upsert para o banco falhou silenciosamente).
          const isDbProfileIncomplete = !profile.height || !profile.currentWeight || !profile.age
          try {
            const localStr = localStorage.getItem(STORAGE_KEYS.USER)
            if (localStr) {
              const local: UserProfile = JSON.parse(localStr)
              const isLocalProfileComplete = !!(local.height && local.currentWeight && local.age && local.goal && local.activityLevel)
              if (isDbProfileIncomplete && isLocalProfileComplete && local.email === email) {
                // Prefere o perfil local completo e tenta re-salvar no banco
                const mergedProfile = await ensureTrialInitialized({ ...local, id: userId, email })
                setUserState(mergedProfile)
                localStorage.setItem(STORAGE_KEYS.ONBOARDING, 'completed')
                setIsOnboarding(false)
                // Re-tenta salvar no banco em background
                const accessToken = session?.access_token
                if (accessToken) {
                  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
                  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
                  fetch(`${supabaseUrl}/rest/v1/profiles?on_conflict=id`, {
                    method: 'POST',
                    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
                    body: JSON.stringify({ id: userId, ...mapProfileToDb(mergedProfile, email) }),
                  }).catch(e => console.error('[profile] re-sync falhou:', e))
                }
                return
              }
              if (local.startingWeight) profile.startingWeight = local.startingWeight
            }
          } catch { /* ignore */ }
          if (!profile.startingWeight) profile.startingWeight = profile.currentWeight
          // Garante email da sessão no perfil — coluna email pode ser null no banco para contas antigas
          if (!profile.email && email) {
            profile.email = email
            // Persiste email no banco para que futuras sessões não precisem deste patch
            const accessToken = session?.access_token
            if (accessToken) {
              const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
              const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
              fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
                method: 'PATCH',
                headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
              }).catch(() => {})
            }
          }
          setUserState(profile)
          localStorage.setItem(STORAGE_KEYS.ONBOARDING, 'completed')
          setIsOnboarding(false)
        } else if (pending) {
          // Primeiro login com Google após onboarding — salva o perfil pendente
          const pendingProfile: UserProfile = JSON.parse(pending)
          const trialStart = new Date()
          const pendingWithPlan: UserProfile = {
            ...pendingProfile,
            plan: 'free',
            trialStartedAt: trialStart,
          }
          await supabase.from('profiles').insert({
            id: userId,
            ...mapProfileToDb(pendingWithPlan, email),
          })

          const finalProfile: UserProfile = {
            ...pendingWithPlan,
            id: userId,
            email,
            updatedAt: new Date(),
          }
          setUserState(finalProfile)
          localStorage.setItem(STORAGE_KEYS.ONBOARDING, 'completed')
          localStorage.removeItem(STORAGE_KEYS.PENDING_PROFILE)
          setIsOnboarding(false)

          // Gera cardápio semanal personalizado em background
          generateWeeklyMenu(finalProfile, menuPreferencesToOptions(finalProfile.menuPreferences)).then(menu => {
            const saved: SavedWeeklyMenu = {
              ...menu,
              id: crypto.randomUUID(),
              createdAt: new Date(),
              acceptedAt: new Date(),
            }
            setSavedWeeklyMenu(saved)
            localStorage.setItem(STORAGE_KEYS.WEEKLY_MENU, JSON.stringify(saved))
            upsertWeeklyMenuDb(userId, saved)
          }).catch((e) => console.error('[cardápio] auto-geração (cadastro) falhou:', e))
        } else {
          // Sem perfil no banco e sem pending — perfil mínimo (será completado via modal)
          const minimalProfile: UserProfile = {
            id: userId, name: email.split('@')[0], email, age: 0, gender: 'outro',
            height: 0, startingWeight: 0, currentWeight: 0, targetWeight: 0,
            goal: 'saude_geral', activityLevel: 'sedentario', dietaryPreferences: [],
            mealRoutine: { mealsPerDay: 3, hasSnacks: false },
            averageSleepHours: 7, sleepQuality: 'bom', fastingExperience: 'nunca',
            interestedInFasting: false, medication: 'nenhum',
            medicalLimitations: { hasLimitation: false },
            consentTerms: false, consentPrivacyPolicy: false, consentDataProcessing: false,
            plan: 'free', trialStartedAt: new Date(),
            createdAt: new Date(), updatedAt: new Date(),
          }
          setUserState(minimalProfile)
          localStorage.setItem(STORAGE_KEYS.ONBOARDING, 'completed')
          setIsOnboarding(false)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const [todayWater, setTodayWater] = useState<WaterIntake>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.WATER)
    if (stored) {
      const data = JSON.parse(stored)
      if (data.date === new Date().toDateString()) return data
    }
    return { date: new Date().toDateString(), target: 2000, consumed: 0, glasses: 0 }
  })

  const [todayMeals, setTodayMeals] = useState<Meal[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.MEALS)
    if (stored) {
      const data = JSON.parse(stored)
      return data.filter((meal: Meal) => new Date(meal.date).toDateString() === new Date().toDateString())
    }
    return []
  })

  const [activeFasting, setActiveFasting] = useState<FastingSession | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.FASTING)
    if (stored) {
      const data = JSON.parse(stored)
      if (!data.completed) return data
    }
    return null
  })

  const [allWorkouts, setAllWorkouts] = useState<WorkoutSession[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.WORKOUTS)
    return stored ? JSON.parse(stored) : []
  })
  const todayWorkouts = allWorkouts.filter(
    (w) => new Date(w.date).toDateString() === new Date().toDateString()
  )

  const [sleepHistory, setSleepHistory] = useState<SleepEntry[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.SLEEP)
    return stored ? JSON.parse(stored) : []
  })

  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.WEIGHT)
    return stored ? JSON.parse(stored) : []
  })

  const [savedWeeklyMenu, setSavedWeeklyMenu] = useState<SavedWeeklyMenu | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.WEEKLY_MENU)
    return stored ? JSON.parse(stored) : null
  })

  const [cycleConfig, setCycleConfigState] = useState<CycleConfig | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.CYCLE)
    return stored ? JSON.parse(stored) : null
  })

  const [aiWorkoutPlan, setAiWorkoutPlan] = useState<AIWorkoutPlan | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.AI_WORKOUT)
    return stored ? JSON.parse(stored) : null
  })

  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([])

  const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurement[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.BODY_MEASUREMENTS)
    if (!stored) return []
    try {
      return JSON.parse(stored).map((e: BodyMeasurement) => ({ ...e, date: new Date(e.date) }))
    } catch { return [] }
  })

  const DEFAULT_CHECK_IN: CheckInState = { history: [], currentStreak: 0, longestStreak: 0, unlockedBadges: [] }

  const [checkInState, setCheckInState] = useState<CheckInState>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.CHECK_IN)
    if (!stored) return DEFAULT_CHECK_IN
    try { return JSON.parse(stored) } catch { return DEFAULT_CHECK_IN }
  })

  // ── Gamificação por atividade (água / treino / sono) ──
  const emptyStreak = (): ActivityStreak => ({ currentStreak: 0, longestStreak: 0, lastDate: '', totalDays: 0, history: [] })
  const DEFAULT_GAMIFICATION: GamificationState = {
    streaks: { water: emptyStreak(), workout: emptyStreak(), sleep: emptyStreak() },
    unlockedAchievements: [],
  }
  const normalizeGamification = (raw: Partial<GamificationState> | null | undefined): GamificationState => ({
    streaks: {
      water: raw?.streaks?.water ?? emptyStreak(),
      workout: raw?.streaks?.workout ?? emptyStreak(),
      sleep: raw?.streaks?.sleep ?? emptyStreak(),
    },
    unlockedAchievements: raw?.unlockedAchievements ?? [],
  })

  const [gamification, setGamification] = useState<GamificationState>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.GAMIFICATION)
    if (!stored) return DEFAULT_GAMIFICATION
    try { return normalizeGamification(JSON.parse(stored)) } catch { return DEFAULT_GAMIFICATION }
  })

  // Fila de conquistas recém-desbloqueadas, aguardando celebração na UI
  const [pendingAchievements, setPendingAchievements] = useState<string[]>([])
  // Novo recorde de sequência aguardando celebração (parabéns)
  const [pendingRecord, setPendingRecord] = useState<{ kind: ActivityKind; streak: number } | null>(null)
  // Celebração de meta / level-up / desafio
  const [pendingCelebration, setPendingCelebration] = useState<{ kind: CelebrationKind; title: string; subtitle?: string; xpGained?: number } | null>(null)
  const dismissCelebration = () => setPendingCelebration(null)

  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricEnabled, setBiometricEnabled] = useState(isBiometricEnabledFn)

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.PRIVACY)
    return stored ? JSON.parse(stored) : {
      dataSharing: false, analytics: false, notifications: true,
      reminders: true, acceptedTerms: false, acceptedPrivacyPolicy: false
    }
  })

  const [dailyMessage] = useState<MotivationalMessage>(getDailyMessage())

  // ── Hydrate from DB on session ──────────────────────────────────────────────

  const loadProgressPhotosFromDb = async (userId: string) => {
    // Via REST (dbGet + signed URL REST) em vez de supabase-js: o createSignedUrl
    // do supabase-js pendurava no boot (lock), então as fotos salvas não
    // reapareciam ao recarregar a página. O .replace remove eventual '\n' que a
    // env VITE_SUPABASE_URL possa ter, para a extração do caminho funcionar.
    const res = await dbGet(`progress_photos?user_id=eq.${userId}&select=*&order=date.desc`)
    if (!res.ok) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await res.json().catch(() => [] as any[])
    if (!Array.isArray(data) || !data.length) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const photos = await Promise.all(data.map(async (row: any) => {
      const pathMatch = (row.url || '').replace(/\s/g, '').match(/\/object\/(?:public|sign)\/progress-photos\/(.+?)(?:\?|$)/)
      const filePath = pathMatch ? decodeURIComponent(pathMatch[1]) : `${row.user_id}/${row.id}`
      const signed = await signProgressPhotoUrl(filePath)
      return {
        id: row.id,
        userId: row.user_id,
        url: signed ?? row.url,
        filePath,
        category: row.category,
        date: new Date(row.date),
        notes: row.notes ?? undefined,
        weight: row.weight ?? undefined,
      }
    }))
    setProgressPhotos(photos)
  }

  const hydrateFromDb = async (userId: string) => {
    const todayStr = localDateStr()
    // Disparada ANTES do Promise.all (supabase-js): a leitura de fotos usa REST
    // (dbGet/signed URL) e não pode ficar bloqueada atrás do Promise.all, que
    // pendura por lock no boot — era por isso que as fotos salvas não
    // reapareciam ao recarregar /progress.
    loadProgressPhotosFromDb(userId)
    const [today, weights, config, weeklyMenu] = await Promise.all([
      loadTodayData(userId, todayStr),
      loadWeightHistoryDb(userId),
      loadUserConfig(userId),
      loadWeeklyMenuDb(userId),
    ])
    if (today.water) setTodayWater(today.water)
    if (today.meals.length) setTodayMeals(today.meals)
    if (today.workouts.length) {
      setAllWorkouts(prev => {
        const todayDateStr = new Date().toDateString()
        const notToday = prev.filter(w => new Date(w.date).toDateString() !== todayDateStr)
        return [...notToday, ...today.workouts]
      })
    }
    if (today.activeFasting) setActiveFasting(today.activeFasting)
    if (weights.length) {
      setWeightHistory(weights)
      // Sincroniza currentWeight com o registro mais recente do DB
      const sorted = [...weights].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      const latestEntry = sorted[0]
      if (latestEntry) {
        setUserState(prev => {
          if (!prev || prev.currentWeight === latestEntry.weight) return prev
          const bmr = calculateBMR(latestEntry.weight, prev.height, prev.age, prev.gender)
          const tdee = calculateTDEE(bmr, prev.activityLevel)
          const targetCalories = calculateCalorieTarget(tdee, prev.goal, prev.medication)
          const macros = applyClinicalFloors(
            calculateMacros(targetCalories, prev.goal, latestEntry.weight),
            { medication: prev.medication, hadBariatricSurgery: prev.hadBariatricSurgery, weight: latestEntry.weight }
          )
          const targetWater = calculateWaterTarget(latestEntry.weight, prev.activityLevel)
          return { ...prev, currentWeight: latestEntry.weight, bmr: Math.round(bmr), tdee: Math.round(tdee), targetCalories: Math.round(targetCalories), targetProtein: macros.protein, targetCarbs: macros.carbs, targetFat: macros.fat, targetFiber: macros.fiber, targetWater }
        })
      }
    }
    if (config.cycleConfig) setCycleConfigState(config.cycleConfig)
    if (config.aiWorkoutPlan) setAiWorkoutPlan(config.aiWorkoutPlan)
    if (weeklyMenu) {
      setSavedWeeklyMenu(weeklyMenu)
    } else {
      // Migra cardápio do localStorage para o banco na primeira vez
      const localStr = localStorage.getItem(STORAGE_KEYS.WEEKLY_MENU)
      if (localStr) {
        try {
          const localMenu = JSON.parse(localStr) as SavedWeeklyMenu
          upsertWeeklyMenuDb(userId, localMenu)
        } catch { /* ignora */ }
      }
    }
    loadBodyMeasurementsDb(userId).then(data => {
      if (data.length) setBodyMeasurements(data)
    })
    loadSleepHistoryDb(userId).then(data => {
      if (data.length) setSleepHistory(data)
    })
    loadCheckInDb(userId).then(data => {
      if (data) setCheckInState(data)
    })
    loadGamificationDb(userId).then(data => {
      if (data) setGamification(normalizeGamification(data))
    })
  }

  useEffect(() => {
    if (session?.user?.id) {
      hydrateFromDb(session.user.id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id])

  // Sincroniza meta de água com o perfil do usuário (peso + atividade)
  useEffect(() => {
    if (!user?.targetWater) return
    setTodayWater(prev => {
      if (prev.target === user.targetWater) return prev
      return { ...prev, target: user.targetWater! }
    })
  }, [user?.id, user?.targetWater])

  // Zera hidratação automaticamente ao virar o dia (mantém target)
  useEffect(() => {
    const checkDayRollover = () => {
      const todayStr = new Date().toDateString()
      setTodayWater(prev => {
        if (prev.date === todayStr) return prev
        const reset = { date: todayStr, target: prev.target, consumed: 0, glasses: 0 }
        const uid = session?.user?.id
        if (uid) {
          const dbDate = localDateStr()
          upsertDailyWater(uid, dbDate, 0, prev.target)
        }
        return reset
      })
    }
    checkDayRollover()
    const intervalId = window.setInterval(checkDayRollover, 60 * 1000)
    const onVisibility = () => { if (document.visibilityState === 'visible') checkDayRollover() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [session?.user?.id])

  // Persistência localStorage
  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEYS.USER)
  }, [user])

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.WATER, JSON.stringify(todayWater)) }, [todayWater])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.MEALS, JSON.stringify(todayMeals)) }, [todayMeals])
  useEffect(() => {
    if (activeFasting) localStorage.setItem(STORAGE_KEYS.FASTING, JSON.stringify(activeFasting))
    else localStorage.removeItem(STORAGE_KEYS.FASTING)
  }, [activeFasting])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(allWorkouts)) }, [allWorkouts])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SLEEP, JSON.stringify(sleepHistory)) }, [sleepHistory])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.BODY_MEASUREMENTS, JSON.stringify(bodyMeasurements)) }, [bodyMeasurements])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CHECK_IN, JSON.stringify(checkInState)) }, [checkInState])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.GAMIFICATION, JSON.stringify(gamification)) }, [gamification])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.WEIGHT, JSON.stringify(weightHistory)) }, [weightHistory])
  useEffect(() => {
    if (savedWeeklyMenu) localStorage.setItem(STORAGE_KEYS.WEEKLY_MENU, JSON.stringify(savedWeeklyMenu))
    else localStorage.removeItem(STORAGE_KEYS.WEEKLY_MENU)
  }, [savedWeeklyMenu])
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PRIVACY, JSON.stringify(privacySettings)) }, [privacySettings])

  // ── Notifications ──────────────────────────────────────────────────────────
  useEffect(() => {
    registerServiceWorker()
  }, [])

  useEffect(() => {
    if (privacySettings.notifications && session) {
      requestNotificationPermission().then((granted) => {
        if (granted) {
          startLocalNotifications()
          const uid = session.user?.id
          if (uid) subscribeToPush(uid)
        }
      })
    } else {
      stopLocalNotifications()
      const uid = session?.user?.id
      if (uid && !privacySettings.notifications) unsubscribeFromPush(uid)
    }
    return () => stopLocalNotifications()
  }, [privacySettings.notifications, session])

  useEffect(() => {
    checkBiometricAvailability().then(setBiometricAvailable)
  }, [])

  const setUser = (newUser: UserProfile | null) => {
    if (newUser) {
      const bmr = calculateBMR(newUser.currentWeight, newUser.height, newUser.age, newUser.gender)
      const tdee = calculateTDEE(bmr, newUser.activityLevel)
      const targetCalories = calculateCalorieTarget(tdee, newUser.goal, newUser.medication)
      const macros = applyClinicalFloors(
        calculateMacros(targetCalories, newUser.goal, newUser.currentWeight),
        { medication: newUser.medication, hadBariatricSurgery: newUser.hadBariatricSurgery, weight: newUser.currentWeight }
      )
      const targetWater = calculateWaterTarget(newUser.currentWeight, newUser.activityLevel)

      const updated: UserProfile = {
        ...newUser,
        // startingWeight é definido uma única vez (peso no onboarding) e nunca alterado
        startingWeight: newUser.startingWeight ?? newUser.currentWeight,
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        targetCalories: Math.round(targetCalories),
        targetProtein: macros.protein,
        targetCarbs: macros.carbs,
        targetFat: macros.fat,
        targetFiber: macros.fiber,
        targetWater,
        updatedAt: new Date()
      }

      setUserState(updated)

      // Persiste no Supabase para que a edição de perfil sobreviva ao próximo login.
      // Usa fetch direto (REST PostgREST) em vez do supabase-js para evitar que
      // re-renders/desmontagens do React cancelem o promise pendente do client.
      const uid = session?.user?.id
      const accessToken = session?.access_token
      const email = session?.user?.email ?? updated.email ?? ''
      if (uid && accessToken) {
        try {
          const dbPayload = mapProfileToDb(updated, email)
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
          fetch(`${supabaseUrl}/rest/v1/profiles?on_conflict=id`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates',
            },
            body: JSON.stringify({ id: uid, ...dbPayload }),
          })
            .then(async r => {
              if (!r.ok) {
                const t = await r.text().catch(() => '')
                console.error('Erro ao salvar perfil no Supabase:', r.status, t)
              }
            })
            .catch(e => console.error('Erro de rede ao salvar perfil:', e))
        } catch (e) {
          console.error('Erro ao preparar payload do perfil:', e)
        }
      }
    } else {
      setUserState(null)
    }
  }

  const completeOnboarding = () => {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING, 'completed')
    setIsOnboarding(false)
  }

  // ── AUTH FUNCTIONS ──

  const savePendingProfile = (profile: UserProfile) => {
    localStorage.setItem(STORAGE_KEYS.PENDING_PROFILE, JSON.stringify(profile))
  }

  const register = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }
    if (!data.user) return { error: 'Falha ao criar conta.' }

    const pending = localStorage.getItem(STORAGE_KEYS.PENDING_PROFILE)

    if (pending) {
      // Fluxo com perfil completo (veio do /completar-perfil)
      const pendingProfile: UserProfile = JSON.parse(pending)
      const trialStart = new Date()
      const pendingWithPlan: UserProfile = {
        ...pendingProfile,
        plan: 'free',
        trialStartedAt: trialStart,
      }
      const { error: insertError } = await supabase.from('profiles').insert({
        id: data.user.id,
        ...mapProfileToDb(pendingWithPlan, email)
      })
      if (insertError) return { error: insertError.message }

      const finalProfile: UserProfile = {
        ...pendingWithPlan,
        id: data.user.id,
        email,
        updatedAt: new Date()
      }
      setUserState(finalProfile)
      localStorage.removeItem(STORAGE_KEYS.PENDING_PROFILE)

      // Gera cardápio semanal personalizado em background
      const newUserId = data.user.id
      generateWeeklyMenu(finalProfile, menuPreferencesToOptions(finalProfile.menuPreferences)).then(menu => {
        const saved: SavedWeeklyMenu = {
          ...menu,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          acceptedAt: new Date()
        }
        setSavedWeeklyMenu(saved)
        localStorage.setItem(STORAGE_KEYS.WEEKLY_MENU, JSON.stringify(saved))
        upsertWeeklyMenuDb(newUserId, saved)
      }).catch((e) => console.error('[cardápio] auto-geração falhou:', e))
    } else {
      // Fluxo sem perfil (veio do funil → registro direto)
      // Cria perfil mínimo — será completado via modal dentro do app
      const minimalProfile: UserProfile = {
        id: data.user.id,
        name: email.split('@')[0],
        email,
        age: 0,
        gender: 'outro',
        height: 0,
        startingWeight: 0,
        currentWeight: 0,
        targetWeight: 0,
        goal: 'saude_geral',
        activityLevel: 'sedentario',
        dietaryPreferences: [],
        mealRoutine: { mealsPerDay: 3, hasSnacks: false },
        averageSleepHours: 7,
        sleepQuality: 'bom',
        fastingExperience: 'nunca',
        interestedInFasting: false,
        medication: 'nenhum',
        medicalLimitations: { hasLimitation: false },
        consentTerms: false,
        consentPrivacyPolicy: false,
        consentDataProcessing: false,
        plan: 'free',
        trialStartedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setUserState(minimalProfile)
    }

    localStorage.setItem(STORAGE_KEYS.ONBOARDING, 'completed')
    setIsOnboarding(false)

    return { error: null }
  }

  const translateAuthError = (message: string): string => {
    if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.'
    if (message.includes('Email not confirmed')) return 'E-mail ainda não confirmado. Verifique sua caixa de entrada.'
    if (message.includes('User already registered')) return 'Este e-mail já está cadastrado.'
    if (message.includes('Password should be at least')) return 'A senha deve ter pelo menos 6 caracteres.'
    if (message.includes('Unable to validate email address')) return 'E-mail inválido.'
    if (message.includes('Email rate limit exceeded')) return 'Muitas tentativas. Aguarde alguns minutos.'
    if (message.includes('too many requests') || message.includes('rate limit')) return 'Muitas tentativas seguidas. Tente novamente em alguns minutos.'
    if (message.includes('Network') || message.includes('fetch')) return 'Sem conexão com a internet. Verifique sua rede.'
    return 'Ocorreu um erro. Tente novamente.'
  }

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: translateAuthError(error.message) }

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle()

    if (profileRow) {
      const loaded = mapDbToProfile(profileRow)
      const profile = await ensureTrialInitialized(loaded)
      // Preserva startingWeight do localStorage (coluna ainda não existe no Supabase)
      try {
        const localStr = localStorage.getItem(STORAGE_KEYS.USER)
        if (localStr) {
          const local = JSON.parse(localStr)
          if (local.startingWeight) profile.startingWeight = local.startingWeight
        }
      } catch { /* ignore */ }
      if (!profile.startingWeight) profile.startingWeight = profile.currentWeight
      // Garante email da sessão no perfil — coluna email pode ser null no banco para contas antigas
      if (!profile.email && data.user?.email) profile.email = data.user.email
      // Usa setUser para garantir que BMR/TDEE/macros/água sejam sempre recalculados
      setUser(profile)
      localStorage.setItem(STORAGE_KEYS.ONBOARDING, 'completed')
      setIsOnboarding(false)
    }

    return { error: null }
  }

  const loginWithGoogle = async (): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })
    if (error) return { error: translateAuthError(error.message) }
    return { error: null }
  }

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    if (error) return { error: translateAuthError(error.message) }
    return { error: null }
  }

  const logout = async () => {
    stopLocalNotifications()
    loggingOut.current = true
    // Limpa estado local PRIMEIRO para garantir redirect imediato
    setUserState(null)
    setSession(null)
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key))
    localStorage.setItem(STORAGE_KEYS.ONBOARDING, 'completed')
    setIsOnboarding(false)
    // Remove o token do supabase-js de forma SÍNCRONA. O signOut() é assíncrono
    // e deixa locks internos (navigator.locks) que travam o relogin na MESMA aba
    // — o login ficava preso em "Entrando..." e a tela não reagia (bug Verônica
    // do login). Disparamos o signOut() mesmo assim para invalidar no servidor.
    Object.keys(localStorage)
      .filter(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
      .forEach(k => localStorage.removeItem(k))
    supabase.auth.signOut().catch(() => {})
    // Recarrega a aba na tela de login: zera o estado interno do supabase-js,
    // então o próximo login funciona como um login novo (que comprovadamente
    // não trava), em vez de reaproveitar o cliente em estado inconsistente.
    window.location.href = '/login'
  }

  // ── OUTROS ──

  // Wrap DB writes em setTimeout(0) para desacoplar do tick do React.
  // Sem isso, promises do supabase-js são canceladas quando o componente que
  // disparou (ex.: dialog) re-renderiza/desmonta, e a escrita nunca completa.
  const deferDbCall = <T,>(fn: () => Promise<T>): void => {
    setTimeout(() => { void fn().catch(e => console.error('DB persist failed:', e)) }, 0)
  }

  const addWater = (amount: number) => {
    const newConsumed = todayWater.consumed + amount
    setTodayWater(prev => ({
      ...prev,
      consumed: prev.consumed + amount,
      glasses: Math.floor((prev.consumed + amount) / 200)
    }))
    const uid = session?.user?.id
    if (uid) {
      const todayStr = localDateStr()
      deferDbCall(() => upsertDailyWater(uid, todayStr, todayWater.consumed + amount, todayWater.target))
    }
    // Gamificação: registra ao cruzar a meta de água (uma vez por dia)
    if (todayWater.target > 0 && todayWater.consumed < todayWater.target && newConsumed >= todayWater.target) {
      registerActivity('water')
      // Auto-progressão de desafio de hidratação
      autoIncrementChallenge('hidratacao', localDateStr())
    }
  }

  const resetWater = () => {
    setTodayWater({ date: new Date().toDateString(), target: todayWater.target, consumed: 0, glasses: 0 })
    const uid = session?.user?.id
    if (uid) {
      const todayStr = localDateStr()
      deferDbCall(() => upsertDailyWater(uid, todayStr, 0, todayWater.target))
    }
  }

  const addMeal = (meal: Meal) => {
    setTodayMeals(prev => [...prev, meal])
    const uid = session?.user?.id
    if (uid) deferDbCall(() => insertMealDb(uid, meal))
  }

  const removeMeal = (id: string) => {
    setTodayMeals(prev => prev.filter(meal => meal.id !== id))
    const uid = session?.user?.id
    if (uid) deferDbCall(() => deleteMealDb(uid, id))
  }

  const startFasting = (fSession: FastingSession) => {
    setActiveFasting(fSession)
    const uid = session?.user?.id
    if (uid) deferDbCall(() => insertFastingSessionDb(uid, fSession))
  }

  const endFasting = () => {
    const uid = session?.user?.id
    if (uid && activeFasting) {
      const now = new Date()
      const actualDuration = Math.round(
        (now.getTime() - new Date(activeFasting.startTime).getTime()) / 3600000
      )
      const fastingId = activeFasting.id
      deferDbCall(() => updateFastingSessionDb(uid, fastingId, { endTime: now, actualDuration, completed: true }))
    }
    setActiveFasting(null)
  }

  const addWorkout = (workout: WorkoutSession) => {
    setAllWorkouts(prev => [...prev, workout])
    const uid = session?.user?.id
    if (uid) deferDbCall(() => insertWorkoutDb(uid, workout))
    // Gamificação: registra atividade de treino
    registerActivity('workout')
    // Auto-progressão de desafio de treino
    autoIncrementChallenge('treino', localDateStr())
  }

  const addSleepEntry = (entry: SleepEntry) => {
    setSleepHistory(prev => [entry, ...prev].sort((a, b) => b.date.localeCompare(a.date)))
    const uid = session?.user?.id
    if (uid) deferDbCall(() => insertSleepDb(uid, entry))
    // Gamificação: registra atividade de sono
    registerActivity('sleep')
    // Auto-progressão de desafio de sono (apenas se >= 7h)
    if (entry.duration >= 7) {
      autoIncrementChallenge('sono', entry.date)
    }
  }

  const deleteSleepEntry = (id: string) => {
    setSleepHistory(prev => prev.filter(e => e.id !== id))
    const uid = session?.user?.id
    if (uid) deferDbCall(() => deleteSleepDb(uid, id))
  }

  const addWeightEntry = (entry: WeightEntry) => {
    setWeightHistory(prev => [...prev, entry].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
    // Recalcula tudo com base no novo peso e atualiza estado
    setUserState(prev => {
      if (!prev) return null
      const bmr = calculateBMR(entry.weight, prev.height, prev.age, prev.gender)
      const tdee = calculateTDEE(bmr, prev.activityLevel)
      const targetCalories = calculateCalorieTarget(tdee, prev.goal, prev.medication)
      const macros = applyClinicalFloors(
        calculateMacros(targetCalories, prev.goal, entry.weight),
        { medication: prev.medication, hadBariatricSurgery: prev.hadBariatricSurgery, weight: entry.weight }
      )
      const targetWater = calculateWaterTarget(entry.weight, prev.activityLevel)
      const updated = {
        ...prev,
        currentWeight: entry.weight,
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        targetCalories: Math.round(targetCalories),
        targetProtein: macros.protein,
        targetCarbs: macros.carbs,
        targetFat: macros.fat,
        targetFiber: macros.fiber,
        targetWater,
        updatedAt: new Date(),
      }
      // Persiste tudo no Supabase via fetch direto (mesmo motivo do setUser)
      const uid = session?.user?.id
      const accessToken = session?.access_token
      if (uid && accessToken) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        const profilePayload = {
          current_weight: entry.weight,
          bmr: updated.bmr,
          tdee: updated.tdee,
          target_calories: updated.targetCalories,
          target_protein: updated.targetProtein,
          target_carbs: updated.targetCarbs,
          target_fat: updated.targetFat,
          target_fiber: updated.targetFiber,
          target_water: updated.targetWater,
        }
        deferDbCall(() => fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${uid}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profilePayload),
        }).then(r => { if (!r.ok) console.error('Erro ao atualizar peso no perfil:', r.status) }))
      }
      return updated
    })
    const uid = session?.user?.id
    if (uid) deferDbCall(() => insertWeightEntryDb(uid, entry))
  }

  const updatePrivacySettings = (settings: Partial<PrivacySettings>) => {
    setPrivacySettings(prev => ({ ...prev, ...settings }))
  }
  // Salva as preferências do cardápio (mescla no perfil + localStorage + PATCH dedicado da coluna
  // menu_preferences). O PATCH falha de forma silenciosa se a coluna ainda não existir no banco,
  // então funciona em sessão/dispositivo mesmo antes de rodar o SQL; sincroniza ao banco depois.
  const updateMenuPreferences = (prefs: MenuPreferences) => {
    setUserState(prev => {
      if (!prev) return prev
      const merged: MenuPreferences = { ...prev.menuPreferences, ...prefs }
      const updated: UserProfile = { ...prev, menuPreferences: merged }
      try { localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated)) } catch { /* quota */ }
      const uid = session?.user?.id
      const accessToken = session?.access_token
      if (uid && accessToken) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        deferDbCall(() => fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${uid}`, {
          method: 'PATCH',
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ menu_preferences: merged }),
        }).then(r => { if (!r.ok) console.warn('[cardápio] menu_preferences não salvo (rode o SQL da coluna):', r.status) })
          .catch(() => { /* offline: fica no localStorage */ }))
      }
      return updated
    })
  }
  const saveWeeklyMenu = (menu: SavedWeeklyMenu) => {
    setSavedWeeklyMenu(menu)
    const uid = session?.user?.id
    if (uid) deferDbCall(() => upsertWeeklyMenuDb(uid, menu))
  }
  const clearWeeklyMenu = () => {
    setSavedWeeklyMenu(null)
    const uid = session?.user?.id
    if (uid) deferDbCall(() => deleteWeeklyMenuDb(uid))
  }

  const setCycleConfig = (config: CycleConfig | null) => {
    setCycleConfigState(config)
    if (config) {
      localStorage.setItem(STORAGE_KEYS.CYCLE, JSON.stringify(config))
      const uid = session?.user?.id
      if (uid) deferDbCall(() => upsertCycleConfigDb(uid, config))
    } else {
      localStorage.removeItem(STORAGE_KEYS.CYCLE)
    }
  }

  const saveAiWorkoutPlan = (plan: AIWorkoutPlan) => {
    setAiWorkoutPlan(plan)
    localStorage.setItem(STORAGE_KEYS.AI_WORKOUT, JSON.stringify(plan))
    const uid = session?.user?.id
    if (uid) deferDbCall(() => upsertAiWorkoutPlanDb(uid, plan))
  }

  const clearAiWorkoutPlan = () => {
    setAiWorkoutPlan(null)
    localStorage.removeItem(STORAGE_KEYS.AI_WORKOUT)
  }

  const addProgressPhoto = async (file: File, category: PhotoCategory, notes?: string, weight?: number) => {
    const uid = session?.user?.id
    // Lança em vez de retornar em silêncio: antes, sem sessão, o upload "passava"
    // sem salvar e o handler contava como sucesso. Agora o erro é mostrado.
    if (!uid) throw new Error('Sessão expirada. Faça login novamente.')
    const id = crypto.randomUUID()
    const today = localDateStr()
    // Upload (com timeout) + insert via REST: não trava mais em "Salvando...".
    const { displayUrl, filePath } = await saveProgressPhotoDb({
      userId: uid, file, id, category, date: today, notes, weight,
    })
    const photo: ProgressPhoto = {
      id, userId: uid, url: displayUrl, filePath, category,
      date: new Date(today + 'T00:00:00'), notes, weight,
    }
    setProgressPhotos(prev => [photo, ...prev])
  }

  const addBodyMeasurement = (entry: BodyMeasurement) => {
    setBodyMeasurements(prev =>
      [entry, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    )
    const uid = session?.user?.id
    if (uid) deferDbCall(() => insertBodyMeasurementDb(uid, entry))
  }

  const deleteBodyMeasurement = (id: string) => {
    setBodyMeasurements(prev => prev.filter(e => e.id !== id))
    const uid = session?.user?.id
    if (uid) deferDbCall(() => deleteBodyMeasurementDb(uid, id))
  }

  const deleteProgressPhoto = async (id: string, filePath: string) => {
    const uid = session?.user?.id
    if (!uid) return
    await supabase.storage.from('progress-photos').remove([filePath])
    await supabase.from('progress_photos').delete().eq('id', id).eq('user_id', uid)
    setProgressPhotos(prev => prev.filter(p => p.id !== id))
  }

  // ── ASSINATURA / TRIAL ──
  const updateSubscription = async (
    plan: 'free' | 'premium' | 'premium_anual',
    subscriptionEmail?: string,
  ) => {
    const uid = session?.user?.id
    if (!uid) return
    await supabase.from('profiles').update({
      plan,
      subscription_email: subscriptionEmail ?? null,
    }).eq('id', uid)
    setUserState(prev => prev ? {
      ...prev,
      plan,
      subscriptionEmail: subscriptionEmail ?? prev.subscriptionEmail,
      updatedAt: new Date(),
    } : prev)
  }

  const generateReport = async (startDate: string, endDate: string) => {
    if (!session?.user?.id || !user) return
    const data = await fetchReportData(session.user.id, startDate, endDate)
    generatePDFReport(user, startDate, endDate, data)
  }

  // ── CHECK-IN / GAMIFICAÇÃO ──

  const performCheckIn = (): string[] => {
    const today = localDateStr()
    if (checkInState.history.some(e => e.date === today)) return []

    const yesterdayDate = new Date()
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterdayStr = localDateStr(yesterdayDate)
    const hadYesterday = checkInState.history.some(e => e.date === yesterdayStr)

    const newStreak = hadYesterday ? checkInState.currentStreak + 1 : 1
    const newLongest = Math.max(checkInState.longestStreak, newStreak)

    const newEntry: CheckInEntry = { date: today }
    const newHistory = [...checkInState.history, newEntry]

    // Verifica novos badges
    const newBadges = BADGES
      .filter(b => newStreak >= b.requiredDays && !checkInState.unlockedBadges.includes(b.id))
      .map(b => b.id)

    const updated: CheckInState = {
      history: newHistory,
      currentStreak: newStreak,
      longestStreak: newLongest,
      unlockedBadges: [...checkInState.unlockedBadges, ...newBadges],
    }

    setCheckInState(updated)

    // Sync com Supabase
    const uid = session?.user?.id
    if (uid) {
      upsertCheckInDb(uid, updated)
    }

    // Auto-progressão de desafio de check-in
    autoIncrementChallenge('progresso', today)

    return newBadges
  }

  // Registra uma atividade do dia (água/treino/sono) e devolve as conquistas novas.
  // Idempotente por dia: registrar a mesma atividade 2x no mesmo dia conta 1 vez.
  const registerActivity = (kind: ActivityKind): string[] => {
    const today = localDateStr()
    const streak = gamification.streaks[kind]
    if (streak.history.includes(today)) return []

    const yesterdayDate = new Date()
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const hadYesterday = streak.history.includes(localDateStr(yesterdayDate))

    const newStreak = hadYesterday ? streak.currentStreak + 1 : 1
    const newLongest = Math.max(streak.longestStreak, newStreak)

    const updatedStreak: ActivityStreak = {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastDate: today,
      totalDays: streak.totalDays + 1,
      history: [...streak.history, today],
    }

    const newAchievements = ACHIEVEMENTS
      .filter(a => a.activity === kind && newStreak >= a.threshold && !gamification.unlockedAchievements.includes(a.id))
      .map(a => a.id)

    const updated: GamificationState = {
      streaks: { ...gamification.streaks, [kind]: updatedStreak },
      unlockedAchievements: [...gamification.unlockedAchievements, ...newAchievements],
    }

    setGamification(updated)
    if (newAchievements.length > 0) {
      setPendingAchievements(prev => [...prev, ...newAchievements])
    }

    // Novo recorde pessoal de sequência: celebra a cada 5 dias acima do recorde
    // anterior, sem competir com a celebração de conquista no mesmo check-in.
    const isNewRecord = newAchievements.length === 0 && newStreak > streak.longestStreak && newStreak >= 5 && newStreak % 5 === 0
    if (isNewRecord) setPendingRecord({ kind, streak: newStreak })

    const uid = session?.user?.id
    if (uid) upsertGamificationDb(uid, updated)

    return newAchievements
  }

  const dismissAchievements = () => setPendingAchievements([])
  const dismissRecord = () => setPendingRecord(null)

  // ── STREAK SHIELD ──
  const STREAK_SHIELD_KEY = 'bem_streak_shield_used_at'
  const [streakShieldUsedAt, setStreakShieldUsedAt] = useState<string | null>(() =>
    localStorage.getItem(STREAK_SHIELD_KEY)
  )

  const useStreakShield = (): boolean => {
    if (!canUseStreakShield(streakShieldUsedAt)) return false
    const now = new Date().toISOString()
    localStorage.setItem(STREAK_SHIELD_KEY, now)
    setStreakShieldUsedAt(now)
    return true
  }

  // ── XP SYSTEM ──
  const awardXP = (action: XPAction) => {
    if (!user) return
    const gained = XP_ACTIONS[action] ?? 0
    if (!gained) return
    const prevTotal = user.totalXP ?? 0
    const newTotal = prevTotal + gained
    const prevLevel = getLevelForXP(prevTotal).level
    const newLevel = getLevelForXP(newTotal).level
    setUser({ ...user, totalXP: newTotal, updatedAt: new Date() })
    if (newLevel > prevLevel) {
      const gender = (user.gender ?? 'neutro') as 'masculino' | 'feminino' | 'neutro'
      const levelName = getLevelName(newLevel - 1, gender)
      setTimeout(() => setPendingCelebration({
        kind: 'level',
        title: `Nível ${newLevel} desbloqueado!`,
        subtitle: `Você agora é ${levelName}. Continue assim!`,
        xpGained: gained,
      }), 300)
    }
  }

  const triggerCelebration = (opts: { kind: CelebrationKind; title: string; subtitle?: string; xpGained?: number }) => {
    setPendingCelebration(opts)
  }

  // ── BIOMETRIA ──

  const enableBiometric = async (): Promise<{ error: string | null }> => {
    if (!session?.user || !user) return { error: 'Sem sessão ativa' }
    const { ok, error: regError } = await registerBiometric(session.user.id, session.user.email!, user.name)
    if (!ok) return { error: regError }
    const { data } = await supabase.auth.getSession()
    if (data.session?.refresh_token) {
      saveBiometricSession(data.session.refresh_token)
    }
    setBiometricEnabled(true)
    return { error: null }
  }

  const disableBiometric = () => {
    clearBiometricData()
    setBiometricEnabled(false)
  }

  const loginWithBiometric = async (): Promise<{ error: string | null }> => {
    try {
      const { ok: passed, error: authError } = await authenticateWithBiometric()
      if (!passed) return { error: authError ?? 'Biometria não reconhecida' }

      const refreshToken = getBiometricSession()
      if (!refreshToken) return { error: 'Sessão expirada. Faça login normalmente.' }

      const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken })
      if (error || !data.session) return { error: 'Sessão expirada. Faça login normalmente.' }

      // Atualiza refresh token (rotaciona a cada uso)
      saveBiometricSession(data.session.refresh_token)

      const { data: profileRow } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user!.id)
        .maybeSingle()

      if (profileRow) {
        const loaded = mapDbToProfile(profileRow)
        const profile = await ensureTrialInitialized(loaded)
        try {
          const localStr = localStorage.getItem(STORAGE_KEYS.USER)
          if (localStr) {
            const local = JSON.parse(localStr)
            if (local.startingWeight) profile.startingWeight = local.startingWeight
          }
        } catch { /* ignore */ }
        if (!profile.startingWeight) profile.startingWeight = profile.currentWeight
        // Garante email da sessão no perfil — coluna email pode ser null no banco para contas antigas
        if (!profile.email && data.user?.email) profile.email = data.user.email
        setUser(profile)
        localStorage.setItem(STORAGE_KEYS.ONBOARDING, 'completed')
        setIsOnboarding(false)
      }

      return { error: null }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'NotAllowedError') return { error: 'Biometria cancelada' }
      return { error: 'Erro ao autenticar' }
    }
  }

  const isAuthenticated = session !== null
  const isProfileComplete = !!(user?.targetCalories && user?.goal && user?.activityLevel && user?.height && user?.currentWeight)

  return (
    <AppContext.Provider
      value={{
        user, setUser, isOnboarding, completeOnboarding,
        session, isAuthenticated, authLoading, login, loginWithGoogle, logout, register, resetPassword, savePendingProfile,
        todayWater, addWater, resetWater,
        todayMeals, addMeal, removeMeal,
        activeFasting, startFasting, endFasting,
        todayWorkouts, addWorkout,
        weightHistory, addWeightEntry,
        privacySettings, updatePrivacySettings,
        dailyMessage,
        savedWeeklyMenu, saveWeeklyMenu, clearWeeklyMenu, updateMenuPreferences,
        cycleConfig, setCycleConfig,
        aiWorkoutPlan, saveAiWorkoutPlan, clearAiWorkoutPlan,
        sleepHistory, addSleepEntry, deleteSleepEntry,
        generateReport,
        progressPhotos, addProgressPhoto, deleteProgressPhoto,
        bodyMeasurements, addBodyMeasurement, deleteBodyMeasurement,
        isBiometricAvailable: biometricAvailable,
        isBiometricEnabled: biometricEnabled,
        enableBiometric, disableBiometric, loginWithBiometric,
        checkInState, performCheckIn,
        gamification, registerActivity, pendingAchievements, dismissAchievements, pendingRecord, dismissRecord,
        awardXP, triggerCelebration, pendingCelebration, dismissCelebration,
        streakShieldUsedAt, useStreakShield,
        isProfileComplete,
        updateSubscription,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
