import { supabase } from '@/lib/supabase'
import type { Meal, WaterIntake, WorkoutSession, WeightEntry, FastingSession, CycleConfig, AIWorkoutPlan, SavedWeeklyMenu, BodyMeasurement, CheckInState, GamificationState, SleepEntry } from '@/types'

// Data no fuso LOCAL (YYYY-MM-DD). Usar em todas as chaves de data do banco,
// para casar com o estado/localStorage (que usa data local). Com UTC, registros
// feitos à noite (21h-00h no Brasil, UTC-3) caíam no dia seguinte e "sumiam".
export const localDateStr = (d: Date = new Date()): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const toDateStr = (d: Date | string) =>
  typeof d === 'string' ? d : localDateStr(d)

// Helper para fazer writes via REST direto, evitando que promises do supabase-js
// sejam canceladas quando o React re-renderiza/desmonta o componente chamador.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Lê o access_token diretamente do localStorage (síncrono, sem aguardar getSession).
// supabase-js armazena a sessão em `sb-<project-ref>-auth-token`.
function readAccessTokenSync(): string {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const raw = localStorage.getItem(key)
        if (!raw) continue
        const parsed = JSON.parse(raw)
        if (parsed?.access_token) return parsed.access_token as string
      }
    }
  } catch { /* ignora */ }
  return SUPABASE_KEY
}

export async function dbFetch(
  method: 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  prefer?: string,
): Promise<Response> {
  const token = readAccessTokenSync()
  const headers: Record<string, string> = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
  if (prefer) headers['Prefer'] = prefer
  const init: RequestInit = { method, headers }
  if (body !== undefined) init.body = JSON.stringify(body)
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, init)
}

// GET via REST com o token lido síncronamente do localStorage. Evita o lock
// interno do supabase-js (navigator.locks) que pendura leituras logo após o
// boot ou após logout/login na mesma aba.
export async function dbGet(path: string): Promise<Response> {
  const token = readAccessTokenSync()
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
  })
}

// ── Água ────────────────────────────────────────────────────────────────────

export async function upsertDailyWater(
  userId: string, date: string, consumed: number, target: number
): Promise<void> {
  const r = await dbFetch(
    'POST',
    'daily_water?on_conflict=user_id,date',
    { user_id: userId, date, consumed, target, updated_at: new Date().toISOString() },
    'resolution=merge-duplicates',
  )
  if (!r.ok) console.warn('upsertDailyWater falhou:', r.status, await r.text().catch(() => ''))
}

// ── Refeições ────────────────────────────────────────────────────────────────

export async function insertMealDb(userId: string, meal: Meal): Promise<void> {
  const r = await dbFetch('POST', 'daily_meals', {
    id: meal.id,
    user_id: userId,
    date: toDateStr(meal.date),
    meal_type: meal.type,
    foods: meal.foods,
    total_calories: meal.totalCalories,
    total_protein: meal.totalProtein,
    total_carbs: meal.totalCarbs,
    total_fat: meal.totalFat,
    photo_url: meal.photoUrl ?? null,
    notes: meal.notes ?? null,
  })
  if (!r.ok) console.warn('insertMealDb falhou:', r.status, await r.text().catch(() => ''))
}

export async function deleteMealDb(userId: string, mealId: string): Promise<void> {
  const r = await dbFetch('DELETE', `daily_meals?id=eq.${mealId}&user_id=eq.${userId}`)
  if (!r.ok) console.warn('deleteMealDb falhou:', r.status)
}

// ── Treinos ──────────────────────────────────────────────────────────────────

export async function insertWorkoutDb(userId: string, workout: WorkoutSession): Promise<void> {
  const r = await dbFetch('POST', 'workout_sessions', {
    id: workout.id,
    user_id: userId,
    date: toDateStr(workout.date),
    type: workout.type,
    duration: workout.duration,
    calories_burned: workout.caloriesBurned ?? 0,
    intensity: workout.intensity,
    notes: workout.notes ?? null,
  })
  if (!r.ok) console.warn('insertWorkoutDb falhou:', r.status, await r.text().catch(() => ''))
}

// ── Peso ─────────────────────────────────────────────────────────────────────

export async function insertWeightEntryDb(userId: string, entry: WeightEntry): Promise<void> {
  const r = await dbFetch('POST', 'weight_entries', {
    id: entry.id,
    user_id: userId,
    date: toDateStr(entry.date),
    weight: entry.weight,
    notes: entry.notes ?? null,
  })
  if (!r.ok) console.warn('insertWeightEntryDb falhou:', r.status, await r.text().catch(() => ''))
}

// ── Sono ─────────────────────────────────────────────────────────────────────

export async function insertSleepDb(userId: string, entry: SleepEntry): Promise<void> {
  const r = await dbFetch('POST', 'daily_sleep', {
    id: entry.id,
    user_id: userId,
    date: entry.date,
    bedtime: entry.bedtime,
    wake_time: entry.wakeTime,
    duration: entry.duration,
    quality: entry.quality,
    notes: entry.notes ?? null,
  })
  if (!r.ok) console.warn('insertSleepDb falhou:', r.status, await r.text().catch(() => ''))
}

export async function deleteSleepDb(userId: string, id: string): Promise<void> {
  const r = await dbFetch('DELETE', `daily_sleep?id=eq.${id}&user_id=eq.${userId}`)
  if (!r.ok) console.warn('deleteSleepDb falhou:', r.status)
}

export async function loadSleepHistoryDb(userId: string): Promise<SleepEntry[]> {
  const { data } = await supabase
    .from('daily_sleep')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(365)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => ({
    id: r.id,
    date: r.date,
    bedtime: r.bedtime ?? '',
    wakeTime: r.wake_time ?? '',
    duration: r.duration ?? 0,
    quality: r.quality,
    notes: r.notes ?? undefined,
  }))
}

// ── Jejum ────────────────────────────────────────────────────────────────────

export async function insertFastingSessionDb(userId: string, session: FastingSession): Promise<void> {
  const r = await dbFetch('POST', 'fasting_sessions', {
    id: session.id,
    user_id: userId,
    start_time: session.startTime,
    end_time: session.endTime ?? null,
    target_duration: session.targetDuration,
    actual_duration: session.actualDuration ?? null,
    completed: session.completed,
    type: session.type,
  })
  if (!r.ok) console.warn('insertFastingSessionDb falhou:', r.status, await r.text().catch(() => ''))
}

export async function updateFastingSessionDb(
  userId: string, id: string,
  patch: { endTime?: Date; actualDuration?: number; completed?: boolean }
): Promise<void> {
  const r = await dbFetch('PATCH', `fasting_sessions?id=eq.${id}&user_id=eq.${userId}`, {
    end_time: patch.endTime ?? null,
    actual_duration: patch.actualDuration ?? null,
    completed: patch.completed ?? false,
  })
  if (!r.ok) console.warn('updateFastingSessionDb falhou:', r.status)
}

// ── Ciclo ────────────────────────────────────────────────────────────────────

export async function upsertCycleConfigDb(userId: string, config: CycleConfig): Promise<void> {
  const r = await dbFetch(
    'POST',
    'cycle_config?on_conflict=user_id',
    {
      user_id: userId,
      last_period_start: config.lastPeriodStart,
      average_cycle_duration: config.averageCycleDuration,
      average_period_duration: config.averagePeriodDuration,
      typical_variation: config.typicalVariation ?? 2,
      main_goal: config.mainGoal ?? null,
      restrictions: config.restrictions ?? [],
      updated_at: new Date().toISOString(),
    },
    'resolution=merge-duplicates',
  )
  if (!r.ok) console.warn('upsertCycleConfigDb falhou:', r.status, await r.text().catch(() => ''))
}

// ── Cardápio semanal IA ──────────────────────────────────────────────────────

export async function upsertWeeklyMenuDb(userId: string, menu: SavedWeeklyMenu): Promise<void> {
  const r = await dbFetch(
    'POST',
    'weekly_menus?on_conflict=user_id',
    {
      user_id: userId,
      id: menu.id,
      title: menu.title,
      description: menu.description,
      days: menu.days,
      tips: menu.tips,
      shopping_list: menu.shoppingList,
      created_at: new Date(menu.createdAt).toISOString(),
      accepted_at: new Date(menu.acceptedAt).toISOString(),
      updated_at: new Date().toISOString(),
    },
    'resolution=merge-duplicates',
  )
  if (!r.ok) console.warn('upsertWeeklyMenuDb falhou:', r.status, await r.text().catch(() => ''))
}

export async function deleteWeeklyMenuDb(userId: string): Promise<void> {
  const r = await dbFetch('DELETE', `weekly_menus?user_id=eq.${userId}`)
  if (!r.ok) console.warn('deleteWeeklyMenuDb falhou:', r.status)
}

export async function loadWeeklyMenuDb(userId: string): Promise<SavedWeeklyMenu | null> {
  const { data } = await supabase
    .from('weekly_menus')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data) return null

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    days: data.days,
    tips: data.tips,
    shoppingList: data.shopping_list,
    createdAt: new Date(data.created_at),
    acceptedAt: new Date(data.accepted_at),
  }
}

// ── Plano treino IA ──────────────────────────────────────────────────────────

export async function upsertAiWorkoutPlanDb(userId: string, plan: AIWorkoutPlan): Promise<void> {
  const r = await dbFetch(
    'POST',
    'ai_workout_plans?on_conflict=user_id',
    {
      user_id: userId,
      environment: plan.environment,
      generated_at: plan.generatedAt,
      measurements: plan.measurements,
      muscle_groups: plan.muscleGroups ?? [],
      home_equipment: plan.homeEquipment ?? null,
      plan: plan.plan,
      updated_at: new Date().toISOString(),
    },
    'resolution=merge-duplicates',
  )
  if (!r.ok) console.warn('upsertAiWorkoutPlanDb falhou:', r.status, await r.text().catch(() => ''))
}

// ── Carregar dados do dia ────────────────────────────────────────────────────

export async function loadTodayData(userId: string, todayStr: string): Promise<{
  water: WaterIntake | null
  meals: Meal[]
  workouts: WorkoutSession[]
  activeFasting: FastingSession | null
}> {
  const [waterRes, mealsRes, workoutsRes, fastingRes] = await Promise.all([
    supabase.from('daily_water').select('*').eq('user_id', userId).eq('date', todayStr).maybeSingle(),
    supabase.from('daily_meals').select('*').eq('user_id', userId).eq('date', todayStr),
    supabase.from('workout_sessions').select('*').eq('user_id', userId).eq('date', todayStr),
    supabase.from('fasting_sessions').select('*').eq('user_id', userId).eq('completed', false).order('created_at', { ascending: false }).limit(1),
  ])

  const water: WaterIntake | null = waterRes.data
    ? { date: new Date().toDateString(), target: waterRes.data.target, consumed: waterRes.data.consumed, glasses: Math.floor(waterRes.data.consumed / 200) }
    : null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meals: Meal[] = (mealsRes.data ?? []).map((r: any) => ({
    id: r.id,
    date: new Date(r.date + 'T00:00:00'),
    type: r.meal_type,
    foods: r.foods,
    totalCalories: r.total_calories,
    totalProtein: r.total_protein,
    totalCarbs: r.total_carbs,
    totalFat: r.total_fat,
    photoUrl: r.photo_url ?? undefined,
    notes: r.notes ?? undefined,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workouts: WorkoutSession[] = (workoutsRes.data ?? []).map((r: any) => ({
    id: r.id,
    date: new Date(r.date + 'T00:00:00'),
    type: r.type,
    duration: r.duration,
    caloriesBurned: r.calories_burned,
    intensity: r.intensity,
    notes: r.notes ?? undefined,
    completed: true,
  }))

  const fastingRow = fastingRes.data?.[0]
  const activeFasting: FastingSession | null = fastingRow ? {
    id: fastingRow.id,
    startTime: fastingRow.start_time,
    endTime: fastingRow.end_time ?? undefined,
    targetDuration: fastingRow.target_duration,
    actualDuration: fastingRow.actual_duration ?? undefined,
    completed: fastingRow.completed,
    type: fastingRow.type,
  } : null

  return { water, meals, workouts, activeFasting }
}

// ── Carregar histórico de peso ───────────────────────────────────────────────

export async function loadWeightHistoryDb(userId: string): Promise<WeightEntry[]> {
  const { data } = await supabase
    .from('weight_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(200)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => ({
    id: r.id,
    date: new Date(r.date + 'T00:00:00'),
    weight: r.weight,
    notes: r.notes ?? undefined,
  }))
}

// ── Carregar configurações ────────────────────────────────────────────────────

export async function loadUserConfig(userId: string): Promise<{
  cycleConfig: CycleConfig | null
  aiWorkoutPlan: AIWorkoutPlan | null
}> {
  const [cycleRes, planRes] = await Promise.all([
    supabase.from('cycle_config').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('ai_workout_plans').select('*').eq('user_id', userId).maybeSingle(),
  ])

  const cycleConfig: CycleConfig | null = cycleRes.data ? {
    lastPeriodStart: cycleRes.data.last_period_start,
    averageCycleDuration: cycleRes.data.average_cycle_duration,
    averagePeriodDuration: cycleRes.data.average_period_duration,
    typicalVariation: cycleRes.data.typical_variation,
    mainGoal: cycleRes.data.main_goal ?? undefined,
    restrictions: cycleRes.data.restrictions ?? [],
  } : null

  const aiWorkoutPlan: AIWorkoutPlan | null = planRes.data ? {
    environment: planRes.data.environment,
    generatedAt: planRes.data.generated_at,
    measurements: planRes.data.measurements,
    muscleGroups: planRes.data.muscle_groups ?? [],
    homeEquipment: planRes.data.home_equipment ?? undefined,
    plan: planRes.data.plan,
  } : null

  return { cycleConfig, aiWorkoutPlan }
}

// ── Medidas corporais ─────────────────────────────────────────────────────────

export async function insertBodyMeasurementDb(userId: string, entry: BodyMeasurement): Promise<void> {
  const r = await dbFetch('POST', 'body_measurements', {
    id: entry.id,
    user_id: userId,
    date: toDateStr(entry.date),
    weight: entry.weight ?? null,
    neck: entry.neck ?? null,
    chest: entry.chest ?? null,
    waist: entry.waist ?? null,
    hips: entry.hips ?? null,
    thigh: entry.thigh ?? null,
    arm: entry.arm ?? null,
    calf: entry.calf ?? null,
    body_fat: entry.bodyFat ?? null,
    notes: entry.notes ?? null,
  })
  if (!r.ok) console.warn('insertBodyMeasurementDb falhou:', r.status, await r.text().catch(() => ''))
}

export async function deleteBodyMeasurementDb(userId: string, id: string): Promise<void> {
  const r = await dbFetch('DELETE', `body_measurements?id=eq.${id}&user_id=eq.${userId}`)
  if (!r.ok) console.warn('deleteBodyMeasurementDb falhou:', r.status)
}

export async function loadBodyMeasurementsDb(userId: string): Promise<BodyMeasurement[]> {
  try {
    const { data } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(200)
    if (!data) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((r: any) => ({
      id: r.id,
      date: new Date(r.date + 'T00:00:00'),
      weight: r.weight ?? undefined,
      neck: r.neck ?? undefined,
      chest: r.chest ?? undefined,
      waist: r.waist ?? undefined,
      hips: r.hips ?? undefined,
      thigh: r.thigh ?? undefined,
      arm: r.arm ?? undefined,
      calf: r.calf ?? undefined,
      bodyFat: r.body_fat ?? undefined,
      notes: r.notes ?? undefined,
    }))
  } catch {
    return []
  }
}

// ── Check-in / Gamificação ───────────────────────────────────────────────────

export async function upsertCheckInDb(userId: string, state: CheckInState): Promise<void> {
  const r = await dbFetch(
    'POST',
    'daily_check_ins?on_conflict=user_id',
    {
      user_id: userId,
      history: state.history,
      current_streak: state.currentStreak,
      longest_streak: state.longestStreak,
      unlocked_badges: state.unlockedBadges,
      updated_at: new Date().toISOString(),
    },
    'resolution=merge-duplicates',
  )
  if (!r.ok) console.warn('upsertCheckInDb falhou:', r.status, await r.text().catch(() => ''))
}

export async function loadCheckInDb(userId: string): Promise<CheckInState | null> {
  const { data } = await supabase
    .from('daily_check_ins')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data) return null
  return {
    history: data.history ?? [],
    currentStreak: data.current_streak ?? 0,
    longestStreak: data.longest_streak ?? 0,
    unlockedBadges: data.unlocked_badges ?? [],
  }
}

// ── Gamificação por atividade (água / treino / sono) ─────────────────────────

export async function upsertGamificationDb(userId: string, state: GamificationState): Promise<void> {
  const r = await dbFetch(
    'POST',
    'user_gamification?on_conflict=user_id',
    {
      user_id: userId,
      streaks: state.streaks,
      unlocked_achievements: state.unlockedAchievements,
      updated_at: new Date().toISOString(),
    },
    'resolution=merge-duplicates',
  )
  if (!r.ok) console.warn('upsertGamificationDb falhou:', r.status, await r.text().catch(() => ''))
}

export async function loadGamificationDb(userId: string): Promise<GamificationState | null> {
  const { data } = await supabase
    .from('user_gamification')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data) return null
  return {
    streaks: data.streaks ?? {},
    unlockedAchievements: data.unlocked_achievements ?? [],
  }
}

// ── Relatório ─────────────────────────────────────────────────────────────────

export interface ReportData {
  water: Array<{ date: string; consumed: number; target: number }>
  meals: Meal[]
  workouts: WorkoutSession[]
  weightEntries: WeightEntry[]
  fastingSessions: FastingSession[]
}

export async function fetchReportData(
  userId: string, startDate: string, endDate: string
): Promise<ReportData> {
  const [waterRes, mealsRes, workoutsRes, weightRes, fastingRes] = await Promise.all([
    supabase.from('daily_water').select('date,consumed,target').eq('user_id', userId).gte('date', startDate).lte('date', endDate).order('date'),
    supabase.from('daily_meals').select('*').eq('user_id', userId).gte('date', startDate).lte('date', endDate).order('date'),
    supabase.from('workout_sessions').select('*').eq('user_id', userId).gte('date', startDate).lte('date', endDate).order('date'),
    supabase.from('weight_entries').select('*').eq('user_id', userId).gte('date', startDate).lte('date', endDate).order('date'),
    supabase.from('fasting_sessions').select('*').eq('user_id', userId).gte('created_at', startDate).lte('created_at', endDate + 'T23:59:59').order('created_at'),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meals: Meal[] = (mealsRes.data ?? []).map((r: any) => ({
    id: r.id, date: new Date(r.date + 'T00:00:00'), type: r.meal_type, foods: r.foods,
    totalCalories: r.total_calories, totalProtein: r.total_protein,
    totalCarbs: r.total_carbs, totalFat: r.total_fat,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workouts: WorkoutSession[] = (workoutsRes.data ?? []).map((r: any) => ({
    id: r.id, date: new Date(r.date + 'T00:00:00'), type: r.type,
    duration: r.duration, caloriesBurned: r.calories_burned, intensity: r.intensity,
    notes: r.notes ?? undefined, completed: true,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const weightEntries: WeightEntry[] = (weightRes.data ?? []).map((r: any) => ({
    id: r.id, date: new Date(r.date + 'T00:00:00'), weight: r.weight, notes: r.notes ?? undefined,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fastingSessions: FastingSession[] = (fastingRes.data ?? []).map((r: any) => ({
    id: r.id, startTime: r.start_time, endTime: r.end_time ?? undefined,
    targetDuration: r.target_duration, actualDuration: r.actual_duration ?? undefined,
    completed: r.completed, type: r.type,
  }))

  return {
    water: waterRes.data ?? [],
    meals, workouts, weightEntries, fastingSessions,
  }
}

// ── Fotos de progresso (Storage privado + tabela) ─────────────────────────────

const PROGRESS_BUCKET = 'progress-photos'

// Upload via REST com timeout real (AbortController). O storage do supabase-js
// não tem timeout e podia pendurar (lock de refresh de token), deixando o botão
// "Salvando..." preso para sempre. Aqui, se passar do tempo, a promise rejeita.
async function uploadToStorage(path: string, file: File, timeoutMs = 30000): Promise<void> {
  const token = readAccessTokenSync()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${PROGRESS_BUCKET}/${encodeURI(path)}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': file.type || 'application/octet-stream',
        'x-upsert': 'false',
      },
      body: file,
      signal: controller.signal,
    })
    if (!r.ok) throw new Error(`upload ${r.status}: ${await r.text().catch(() => '')}`)
  } finally {
    clearTimeout(timer)
  }
}

// Gera signed URL (o bucket é privado). Retorna null em falha — o caller usa fallback.
export async function signProgressPhotoUrl(
  filePath: string, expiresIn = 60 * 60 * 24 * 7, timeoutMs = 10000
): Promise<string | null> {
  const token = readAccessTokenSync()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${PROGRESS_BUCKET}/${encodeURI(filePath)}`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn }),
      signal: controller.signal,
    })
    if (!r.ok) return null
    const data = await r.json()
    return data?.signedURL ? `${SUPABASE_URL}/storage/v1${data.signedURL}` : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// Faz upload + insert. A URL salva fica no formato que loadProgressPhotosFromDb
// sabe ler (extrai o path por regex e re-assina na leitura).
export async function saveProgressPhotoDb(params: {
  userId: string; file: File; id: string; category: string; date: string; notes?: string; weight?: number
}): Promise<{ displayUrl: string; filePath: string }> {
  const ext = (params.file.name.split('.').pop() || 'jpg').toLowerCase()
  const filePath = `${params.userId}/${params.id}.${ext}`
  await uploadToStorage(filePath, params.file)
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${PROGRESS_BUCKET}/${filePath}`
  const r = await dbFetch('POST', 'progress_photos', {
    id: params.id,
    user_id: params.userId,
    url: publicUrl,
    category: params.category,
    date: params.date,
    notes: params.notes ?? null,
    weight: params.weight ?? null,
  })
  if (!r.ok) throw new Error(`insert ${r.status}: ${await r.text().catch(() => '')}`)
  const signed = await signProgressPhotoUrl(filePath)
  return { displayUrl: signed ?? publicUrl, filePath }
}
