import { useState, useCallback } from 'react'
import { useApp, getTimeAwareMessage } from '@/contexts/AppContext'
import { ProfileSetupModal } from '@/components/profile-setup-modal'
import { MascotGreeting } from '@/components/mascot'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Droplet,
  Flame,
  Target,
  TrendingDown,
  Apple,
  Dumbbell,
  Clock,
  Sparkles,
  Plus,
  Scale,
  FileText,
  Moon,
  Coffee,
  UtensilsCrossed,
  Cookie,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
} from 'lucide-react'
import { calculateIMC, getIMCColor, formatWeight, getSleepQualityBadge } from '@/lib/health-utils'
import { DailyCheckin } from '@/components/daily-checkin'
import { GamificationCard } from '@/components/gamification-card'
import { WeeklyChallengeCard } from '@/components/weekly-challenge-card'
import { generateFullDashboardPDF } from '@/lib/report-generator'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '@/contexts/LanguageContext'
import type { WorkoutSession, WorkoutType } from '@/types'
import { toast } from 'sonner'

export function Dashboard() {
  const { user, todayWater, todayMeals, todayWorkouts, activeFasting, addWorkout, weightHistory, cycleConfig, aiWorkoutPlan, sleepHistory, bodyMeasurements, isProfileComplete, savedWeeklyMenu, checkInState, awardXP } = useApp()
  const [dailyMessage] = useState(getTimeAwareMessage)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [showProfileModal, setShowProfileModal] = useState(false)
  const onProfileComplete = useCallback(() => setShowProfileModal(false), [])
  const [isWorkoutDialogOpen, setIsWorkoutDialogOpen] = useState(false)
  const [workoutMode, setWorkoutMode] = useState<'manual' | 'plan'>('manual')
  const [selectedPlanDayIndex, setSelectedPlanDayIndex] = useState<number>(0)
  const [customDuration, setCustomDuration] = useState('')
  const [customType, setCustomType] = useState<WorkoutType>('caminhada')
  const [customIntensity, setCustomIntensity] = useState<'leve' | 'moderado' | 'intenso'>('moderado')
  const [workoutDate, setWorkoutDate] = useState(() => {
    const d = new Date()
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
  })
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [exportStartDate, setExportStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [exportEndDate, setExportEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [reportSections, setReportSections] = useState({
    profile: true,
    nutrition: true,
    sleep: true,
    bodyMeasurements: true,
    workoutPlan: true,
    weightHistory: true,
    water: false,
    meals: false,
    workouts: false,
    cycle: true,
  })
  const toggleSection = (key: keyof typeof reportSections) =>
    setReportSections(prev => ({ ...prev, [key]: !prev[key] }))

  if (!user) return null

  const hasProfileData = !!(user.height && user.currentWeight && user.targetCalories)

  const inferWorkoutType = (focus: string): WorkoutType => {
    const f = focus.toLowerCase()
    if (f.includes('cardio') || f.includes('corrida')) return 'corrida'
    if (f.includes('caminhada')) return 'caminhada'
    if (f.includes('yoga')) return 'yoga'
    if (f.includes('pilates')) return 'pilates'
    if (f.includes('nataÃ§Ã£o') || f.includes('natacao')) return 'natacao'
    if (f.includes('danÃ§a') || f.includes('danca')) return 'danca'
    return 'musculacao'
  }

  const handleCustomWorkout = () => {
    const caloriesPerMinute = { leve: 3, moderado: 5, intenso: 8 }

    let type = customType
    let duration = parseInt(customDuration)
    let planDayName: string | undefined

    if (workoutMode === 'plan' && aiWorkoutPlan) {
      const day = aiWorkoutPlan.plan.days[selectedPlanDayIndex]
      type = inferWorkoutType(day.focus)
      duration = duration || aiWorkoutPlan.plan.sessionDuration
      planDayName = `${day.name} â€” ${day.focus}`
    }

    if (!duration) return

    const workout: WorkoutSession = {
      id: crypto.randomUUID(),
      date: (() => { const [dd,mm,yyyy] = workoutDate.split('/'); return new Date(+yyyy, +mm-1, +dd, 12) })(),
      type,
      duration,
      caloriesBurned: Math.round(duration * caloriesPerMinute[customIntensity]),
      intensity: customIntensity,
      notes: planDayName,
      completed: true,
    }

    addWorkout(workout)
    setIsWorkoutDialogOpen(false)
    setCustomDuration('')
    setWorkoutMode('manual')
    // XP por registrar treino
    awardXP('REGISTER_WORKOUT')
    setTimeout(() => { toast.success('+15 XP ganhos!', { icon: '⚡' }) }, 800)
    toast.success(t.dashboard.workoutRegistered, {
      description: `${planDayName ?? type} â€” ${workout.caloriesBurned} ${t.dashboard.kcalBurned}`,
    })
  }

  const generateReport = () => {
    if (!user) return
    generateFullDashboardPDF(
      user,
      exportStartDate,
      exportEndDate,
      weightHistory,
      todayWater,
      todayMeals,
      todayWorkouts,
      cycleConfig,
      reportSections,
      sleepHistory,
      bodyMeasurements,
      aiWorkoutPlan,
    )
    setIsExportOpen(false)
    toast.success(t.dashboard.pdfGenerated, { description: t.dashboard.pdfGeneratedDesc })
  }

  // Garante que sempre usa o peso mais recente (historial ou perfil)
  const latestWeightFromHistory = weightHistory.length > 0
    ? [...weightHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].weight
    : null
  const latestWeight = latestWeightFromHistory ?? user.currentWeight
  const imc = hasProfileData ? calculateIMC(latestWeight, user.height) : null

  // Metas vÃªm do perfil PERSISTIDO (mantido correto por applyClinicalFloors em todo recÃ¡lculo de
  // peso), para nÃ£o oscilar entre telas (antes o Dashboard recalculava ao vivo e divergia da
  // tela de AlimentaÃ§Ã£o). O IMC segue calculado do peso mais recente (informativo).
  const calorieTarget = hasProfileData ? (user.targetCalories ?? 2000) : 2000
  const macros = hasProfileData
    ? { calories: user.targetCalories ?? 0, protein: user.targetProtein ?? 0, carbs: user.targetCarbs ?? 0, fat: user.targetFat ?? 0, fiber: user.targetFiber ?? 0 }
    : { protein: 0, carbs: 0, fat: 0, fiber: 0, calories: 0 }

  const totalCaloriesToday = todayMeals.reduce((sum, meal) => sum + meal.totalCalories, 0)
  const totalProteinToday = todayMeals.reduce((sum, meal) => sum + meal.totalProtein, 0)
  const totalCarbsToday = todayMeals.reduce((sum, meal) => sum + meal.totalCarbs, 0)
  const totalFatToday = todayMeals.reduce((sum, meal) => sum + meal.totalFat, 0)
  const caloriesRemaining = calorieTarget - totalCaloriesToday
  const waterProgress = Math.min((todayWater.consumed / todayWater.target) * 100, 100)

  const allFoodsToday = todayMeals.flatMap(meal => meal.foods.map(f => ({ ...f, qty: f.customQuantity || 1 })))
  const totalFiberToday = todayMeals.reduce((sum, meal) => sum + (meal.foods.reduce((s, f) => s + (f.fiber || 0) * (f.customQuantity || 1), 0)), 0)
  const totalSodiumToday = allFoodsToday.reduce((s, f) => s + (f.sodium || 0) * f.qty, 0)
  const totalSugarToday = allFoodsToday.reduce((s, f) => s + (f.sugar || 0) * f.qty, 0)
  const totalSatFatToday = allFoodsToday.reduce((s, f) => s + (f.saturatedFat || 0) * f.qty, 0)
  const totalOmega3Today = allFoodsToday.reduce((s, f) => s + (f.omega3 || 0) * f.qty, 0)
  const totalCholesterolToday = allFoodsToday.reduce((s, f) => s + (f.cholesterol || 0) * f.qty, 0)
  const hasMicroData = totalSodiumToday > 0 || totalSugarToday > 0 || totalSatFatToday > 0 || totalOmega3Today > 0 || totalCholesterolToday > 0

  const weightDiff = latestWeight - user.targetWeight
  const weightProgress = Math.abs(weightDiff)

  // â”€â”€ CardÃ¡pio de hoje â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // JS getDay(): 0=Dom, 1=Seg â€¦ 6=Sab â†’ menu index: 0=Seg â€¦ 6=Dom
  const todayMenuIndex = (new Date().getDay() + 6) % 7
  const todayMenuDay = savedWeeklyMenu?.days[todayMenuIndex]

  const MENU_TYPE_TO_MEAL_TYPE: Record<string, string> = {
    'CafÃ© da ManhÃ£': 'cafe',
    'Lanche da ManhÃ£': 'lanche_manha',
    'AlmoÃ§o': 'almoco',
    'Lanche da Tarde': 'lanche_tarde',
    'Jantar': 'jantar',
    'Ceia': 'ceia',
  }
  const MEAL_ICON: Record<string, React.ReactNode> = {
    'CafÃ© da ManhÃ£': <Coffee className="w-4 h-4" />,
    'Lanche da ManhÃ£': <Cookie className="w-4 h-4" />,
    'AlmoÃ§o': <UtensilsCrossed className="w-4 h-4" />,
    'Lanche da Tarde': <Cookie className="w-4 h-4" />,
    'Jantar': <UtensilsCrossed className="w-4 h-4" />,
    'Ceia': <Apple className="w-4 h-4" />,
  }

  // Detecta a prÃ³xima refeiÃ§Ã£o do dia com base no horÃ¡rio atual
  const currentHour = new Date().getHours()
  const nextMealName = (() => {
    if (currentHour < 9) return 'CafÃ© da ManhÃ£'
    if (currentHour < 11) return 'Lanche da ManhÃ£'
    if (currentHour < 13) return 'AlmoÃ§o'
    if (currentHour < 16) return 'Lanche da Tarde'
    if (currentHour < 20) return 'Jantar'
    return 'Ceia'
  })()

  // â”€â”€ Insight personalizado do dia â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const proteinPct = macros.protein > 0 ? (totalProteinToday / macros.protein) * 100 : 0
  const calPct = calorieTarget > 0 ? (totalCaloriesToday / calorieTarget) * 100 : 0
  const waterPct = todayWater.target > 0 ? (todayWater.consumed / todayWater.target) * 100 : 0

  const dailyInsight = (() => {
    if (calPct >= 100) return { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', icon: 'ðŸ”´', text: `VocÃª atingiu 100% das calorias diÃ¡rias. Prefira lanches leves como frutas ou iogurte para o restante do dia.` }
    if (calPct >= 85 && currentHour < 17) return { color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800', icon: 'âš ï¸', text: `VocÃª jÃ¡ consumiu ${Math.round(calPct)}% das calorias e ainda Ã© cedo. Planeje uma janta mais leve.` }
    if (proteinPct < 40 && currentHour >= 13) return { color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800', icon: 'ðŸ’ª', text: `Sua proteÃ­na estÃ¡ em ${Math.round(totalProteinToday)}g de ${macros.protein}g (${Math.round(proteinPct)}%). Priorize proteÃ­na nas prÃ³ximas refeiÃ§Ãµes: frango, ovo ou iogurte grego.` }
    if (waterPct < 40 && currentHour >= 14) return { color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-950/30 dark:border-cyan-800', icon: 'ðŸ’§', text: `VocÃª bebeu apenas ${todayWater.consumed}ml de ${todayWater.target}ml de Ã¡gua. Tente beber um copo agora!` }
    if (proteinPct >= 90 && calPct < 80) return { color: 'text-green-600', bg: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800', icon: 'âœ…', text: `Excelente! VocÃª jÃ¡ atingiu ${Math.round(proteinPct)}% da meta de proteÃ­na. Continue assim e complete as calorias com boas gorduras.` }
    if (totalCaloriesToday === 0 && currentHour >= 9) return { color: 'text-primary', bg: 'bg-primary/10 border-primary/20', icon: 'ðŸ½ï¸', text: `VocÃª ainda nÃ£o registrou nenhuma refeiÃ§Ã£o hoje. Comece pelo cafÃ© da manhÃ£ do seu cardÃ¡pio!` }
    return null
  })()

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-4 pb-28 space-y-6">
        {/* SaudaÃ§Ã£o contextual com dados reais */}
        {(() => {
          const pendingCount = [
            waterProgress < 100,
            hasProfileData && (totalCaloriesToday / calorieTarget) * 100 < 80,
            hasProfileData && proteinPct < 80,
          ].filter(Boolean).length
          return (
            <MascotGreeting
              name={user.name}
              streak={checkInState.currentStreak}
              pendingActions={pendingCount}
              waterPct={waterProgress}
              calPct={calPct}
              proteinPct={proteinPct}
            />
          )
        })()}

        {/* Quick Nav â€” chips de navegaÃ§Ã£o rÃ¡pida por seÃ§Ã£o */}
        <div className="flex gap-2 px-0 py-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {[
            { icon: 'ðŸ½ï¸', label: 'NutriÃ§Ã£o', anchor: 'sec-nutricao' },
            { icon: 'ðŸ’§', label: 'Ãgua',     anchor: 'sec-agua' },
            { icon: 'ðŸ’ª', label: 'Treino',   anchor: 'sec-treino' },
            { icon: 'ðŸ˜´', label: 'Sono',     anchor: 'sec-sono' },
          ].map(({ icon, label, anchor }) => (
            <button
              key={anchor}
              onClick={() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold whitespace-nowrap border border-primary/20 flex-shrink-0 active:scale-95 transition-transform"
            >
              <span>{icon}</span><span>{label}</span>
            </button>
          ))}
        </div>

        {/* Banner perfil incompleto â€” imediatamente apÃ³s Quick Nav */}
        {!isProfileComplete && (
          <>
            <button
              onClick={() => setShowProfileModal(true)}
              className="w-full rounded-2xl px-5 py-4 flex items-center gap-3 text-left bg-primary text-primary-foreground shadow-[0_4px_14px_-4px_oklch(0.52_0.16_145/0.4)] transition-all hover:-translate-y-px active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">{t.dashboard.completeProfile}</p>
                <p className="text-xs opacity-80">{t.dashboard.completeProfileDesc}</p>
              </div>
              <div className="opacity-70 text-lg">â†’</div>
            </button>
            <p className="text-muted-foreground text-sm text-center py-4">
              Complete seu perfil para ver suas metas personalizadas de nutriÃ§Ã£o, Ã¡gua e treino.
            </p>
          </>
        )}

        {/* â”€â”€ Resumo do Dia â€” visÃ­vel sem scroll, principal gatilho de aÃ§Ã£o â”€â”€ */}
        {isProfileComplete && hasProfileData && (
          <div className="rounded-2xl bg-card border border-border shadow-sm px-4 py-3 space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Meta do Dia</p>
            <div className="space-y-2">
              {/* Ãgua */}
              <div className="flex items-center gap-3">
                <Droplet className="w-4 h-4 text-chart-1 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Ãgua</span>
                    <span className={`font-semibold tabular-nums ${waterProgress >= 100 ? 'text-green-600' : 'text-foreground'}`}>
                      {todayWater.consumed}ml / {todayWater.target}ml
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-chart-1 transition-all duration-500"
                      style={{ width: `${Math.min(waterProgress, 100)}%` }}
                    />
                  </div>
                </div>
                {waterProgress >= 100 && <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />}
              </div>
              {/* ProteÃ­na */}
              <div className="flex items-center gap-3">
                <Dumbbell className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">ProteÃ­na</span>
                    <span className={`font-semibold tabular-nums ${proteinPct >= 100 ? 'text-green-600' : 'text-foreground'}`}>
                      {Math.round(totalProteinToday)}g / {macros.protein}g
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min(proteinPct, 100)}%` }}
                    />
                  </div>
                </div>
                {proteinPct >= 100 && <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />}
              </div>
              {/* Calorias */}
              <div className="flex items-center gap-3">
                <Flame className="w-4 h-4 text-chart-3 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Calorias</span>
                    <span className={`font-semibold tabular-nums ${calPct >= 100 ? 'text-destructive' : 'text-foreground'}`}>
                      {totalCaloriesToday} / {calorieTarget} kcal
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${calPct >= 100 ? 'bg-destructive' : 'bg-chart-3'}`}
                      style={{ width: `${Math.min(calPct, 100)}%` }}
                    />
                  </div>
                </div>
                {calPct >= 100 && <CheckCircle2 className="w-4 h-4 text-destructive flex-shrink-0" />}
              </div>
            </div>
            {/* CTA dinÃ¢mica â€” prÃ³xima aÃ§Ã£o sugerida */}
            {(() => {
              if (waterProgress < 30 && currentHour >= 8) return (
                <button onClick={() => navigate('/water')} className="w-full flex items-center justify-between rounded-xl bg-chart-1/10 border border-chart-1/20 px-3 py-2 text-sm text-chart-1 font-semibold hover:bg-chart-1/20 transition-colors">
                  <span>ðŸ’§ Beber Ã¡gua agora</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )
              if (todayMeals.length === 0 && currentHour >= 7) return (
                <button onClick={() => navigate('/meals')} className="w-full flex items-center justify-between rounded-xl bg-primary/10 border border-primary/20 px-3 py-2 text-sm text-primary font-semibold hover:bg-primary/20 transition-colors">
                  <span>ðŸ½ï¸ Registrar primeira refeiÃ§Ã£o</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )
              if (proteinPct < 50 && currentHour >= 12) return (
                <button onClick={() => navigate('/meals')} className="w-full flex items-center justify-between rounded-xl bg-primary/10 border border-primary/20 px-3 py-2 text-sm text-primary font-semibold hover:bg-primary/20 transition-colors">
                  <span>ðŸ’ª Adicionar proteÃ­na na prÃ³xima refeiÃ§Ã£o</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )
              if (waterProgress >= 100 && proteinPct >= 80 && calPct >= 80) return (
                <div className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-3 py-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-green-700 dark:text-green-400 font-semibold">Metas do dia quase completas â€” Ã³timo trabalho!</span>
                </div>
              )
              return null
            })()}
          </div>
        )}

        <ProfileSetupModal open={showProfileModal} onComplete={onProfileComplete} />

        {/* Mensagem motivacional do dia */}
        <div className="rounded-2xl px-5 py-4 flex items-start gap-3 bg-card border border-border shadow-sm">
          <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
          <p className="text-sm leading-relaxed italic text-foreground">{dailyMessage.message}</p>
        </div>

        {/* Insight personalizado do dia */}
        {dailyInsight && (
          <div className={`rounded-2xl px-5 py-4 flex items-start gap-3 border ${dailyInsight.bg}`}>
            <Lightbulb className={`w-4 h-4 flex-shrink-0 mt-0.5 ${dailyInsight.color}`} />
            <p className={`text-sm leading-relaxed ${dailyInsight.color}`}>{dailyInsight.text}</p>
          </div>
        )}

        {/* CardÃ¡pio de hoje */}
        {todayMenuDay && (
          <Card id="sec-nutricao">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <UtensilsCrossed className="w-4 h-4 text-primary" />
                    CardÃ¡pio de Hoje
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">{todayMenuDay.day}</CardDescription>
                </div>
                <button
                  onClick={() => navigate('/meals')}
                  className="flex items-center gap-1 text-xs text-primary font-medium"
                >
                  Ver completo <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {todayMenuDay.meals.map((meal, i) => {
                const mealType = MENU_TYPE_TO_MEAL_TYPE[meal.type]
                const isRegistered = todayMeals.some(m => m.type === mealType)
                const isNext = meal.type === nextMealName && !isRegistered

                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                      isRegistered
                        ? 'bg-primary/8 opacity-60'
                        : isNext
                        ? 'bg-primary/15 border border-primary/30'
                        : 'bg-muted/60'
                    }`}
                  >
                    {/* Ãcone da refeiÃ§Ã£o */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isRegistered ? 'bg-primary/20 text-primary' : isNext ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'}`}>
                      {isRegistered ? <CheckCircle2 className="w-4 h-4" /> : MEAL_ICON[meal.type] ?? <UtensilsCrossed className="w-4 h-4" />}
                    </div>

                    {/* InformaÃ§Ãµes */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-foreground truncate">{meal.type}</p>
                        {isNext && <Badge className="text-xs h-4 px-1.5 bg-primary text-primary-foreground">PrÃ³xima</Badge>}
                        {isRegistered && <Badge variant="outline" className="text-xs h-4 px-1.5 text-primary border-primary/30">Registrada âœ“</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{meal.calories} kcal Â· {meal.protein}g prot Â· {meal.carbs}g carb</p>
                    </div>

                    {/* BotÃ£o registrar */}
                    {!isRegistered && (
                      <button
                        onClick={() => navigate('/meals')}
                        className="text-xs text-primary font-medium flex-shrink-0 hover:underline"
                      >
                        Registrar
                      </button>
                    )}
                  </div>
                )
              })}

              {/* Resumo calÃ³rico do cardÃ¡pio */}
              <div className="flex justify-between items-center pt-1 px-1">
                <span className="text-xs text-muted-foreground">Total planejado</span>
                <span className="text-xs font-bold text-primary">
                  {todayMenuDay.meals.reduce((s, m) => s + m.calories, 0)} kcal
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Check-in diÃ¡rio */}
        <DailyCheckin />

        {/* Conquistas (gamificaÃ§Ã£o por atividade) */}
        <GamificationCard />

        {/* Desafios Semanais */}
        <WeeklyChallengeCard />

        {/* Status rÃ¡pido */}
        {hasProfileData && <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity${!isProfileComplete ? ' opacity-30 pointer-events-none' : ''}`}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                IMC
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-extrabold tracking-tight">{imc!.value}</div>
              <p className={`text-xs mt-0.5 ${getIMCColor(imc!.category)}`}>{imc!.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Scale className="w-4 h-4 text-primary" />
                {t.dashboard.currentWeightLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-extrabold tracking-tight">{formatWeight(latestWeight)}</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Meta: {formatWeight(user.targetWeight)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Flame className="w-4 h-4 text-chart-3" />
                {t.dashboard.calories}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-extrabold tracking-tight">{totalCaloriesToday}</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t.common.of} {calorieTarget} kcal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-primary" />
                {t.dashboard.protein}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-display text-3xl font-extrabold tracking-tight">{totalProteinToday}g</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t.common.of} {macros.protein}g
              </p>
            </CardContent>
          </Card>
        </div>}

        {/* Ãgua */}
        <Card id="sec-agua" className={!isProfileComplete ? 'opacity-30 pointer-events-none' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-chart-1" />
                  {t.dashboard.hydration}
                </CardTitle>
                <CardDescription>
                  {todayWater.consumed}ml de {todayWater.target}ml
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => navigate('/water')}>
                <Plus className="w-4 h-4 mr-1" />
                {t.common.add}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={waterProgress} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {waterProgress >= 100 ? `âœ… ${t.dashboard.goalReached}` : `${t.dashboard.remaining} ${todayWater.target - todayWater.consumed}ml`}
            </p>
          </CardContent>
        </Card>

        {/* Nutrição */}
        <Card className={!isProfileComplete ? 'opacity-30 pointer-events-none' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Apple className="w-5 h-5 text-destructive" />
                  {t.dashboard.nutritionToday}
                </CardTitle>
                <CardDescription>
                  {caloriesRemaining > 0 ? `${t.dashboard.canConsumeMore} ${caloriesRemaining} kcal` : `${t.dashboard.goalReached}`}
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => navigate('/meals')}>
                <Plus className="w-4 h-4 mr-1" />
                {t.dashboard.meal}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{t.dashboard.calories}</span>
                <span className="font-medium">{totalCaloriesToday} / {calorieTarget}</span>
              </div>
              <Progress value={(totalCaloriesToday / calorieTarget) * 100} className="h-2" />
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">{t.dashboard.protein}</div>
                <div className="text-lg font-bold text-primary">{Math.round(totalProteinToday)}g</div>
                <div className="text-xs text-muted-foreground">meta: {macros.protein}g</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">{t.dashboard.carbs}</div>
                <div className="text-lg font-bold text-secondary">{Math.round(totalCarbsToday)}g</div>
                <div className="text-xs text-muted-foreground">meta: {macros.carbs}g</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">{t.dashboard.fat}</div>
                <div className="text-lg font-bold text-chart-2">{Math.round(totalFatToday)}g</div>
                <div className="text-xs text-muted-foreground">meta: {macros.fat}g</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">{t.dashboard.fiber}</div>
                <div className="text-lg font-bold text-chart-3">{Math.round(totalFiberToday)}g</div>
                <div className="text-xs text-muted-foreground">meta: {macros.fiber}g</div>
              </div>
            </div>

            {hasMicroData && (
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1.5">{t.dashboard.micronutrients}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-muted-foreground">{t.dashboard.sodium}</span>
                    <span className="text-xs font-bold text-red-500">{Math.round(totalSodiumToday)}mg</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-muted-foreground">{t.dashboard.sugar}</span>
                    <span className="text-xs font-bold text-pink-500">{Math.round(totalSugarToday * 10) / 10}g</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-muted-foreground">{t.dashboard.saturatedFat}</span>
                    <span className="text-xs font-bold text-amber-600">{Math.round(totalSatFatToday * 10) / 10}g</span>
                  </div>
                  {totalOmega3Today > 0 && (
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-muted-foreground">{t.dashboard.omega3}</span>
                      <span className="text-xs font-bold text-cyan-600">{Math.round(totalOmega3Today * 100) / 100}g</span>
                    </div>
                  )}
                  {totalCholesterolToday > 0 && (
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-muted-foreground">{t.dashboard.cholesterol}</span>
                      <span className="text-xs font-bold text-purple-500">{Math.round(totalCholesterolToday)}mg</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {todayMeals.length === 0 && (
              <div className="text-center py-5 space-y-2">
                <p className="text-sm text-muted-foreground">{t.dashboard.noMealsToday}</p>
                <button
                  onClick={() => navigate('/meals')}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  + Registrar primeira refeiÃ§Ã£o
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sono */}
        {(() => {
          const last = sleepHistory[0]
          const qualityLabel: Record<string, string> = { excelente: 'Excelente', bom: 'Bom', regular: 'Regular', ruim: 'Ruim' }
          const formatH = (h: number) => { const hh = Math.floor(h); const mm = Math.round((h - hh) * 60); return mm > 0 ? `${hh}h ${mm}min` : `${hh}h` }
          return (
            <Card id="sec-sono">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Moon className="w-5 h-5 text-primary" />
                      {t.dashboard.sleep}
                    </CardTitle>
                    <CardDescription>
                      {last ? `${t.dashboard.lastNight} ${formatH(last.duration)}` : t.dashboard.noRecordYet}
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => navigate('/sleep')}>
                    <Plus className="w-4 h-4 mr-1" />
                    {t.common.register}
                  </Button>
                </div>
              </CardHeader>
              {last && (
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="font-display text-3xl font-extrabold tracking-tight text-primary">{formatH(last.duration)}</div>
                      <div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getSleepQualityBadge(last.quality)}`}>
                          {qualityLabel[last.quality]}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">{last.bedtime} â†’ {last.wakeTime}</p>
                      </div>
                    </div>
                    {sleepHistory.length > 1 && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{t.dashboard.average}</p>
                        <p className="text-sm font-bold">{formatH(Math.round(sleepHistory.reduce((s, e) => s + e.duration, 0) / sleepHistory.length * 10) / 10)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })()}

        {/* Atalhos rÃ¡pidos */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/fasting')}
            className="group flex items-center gap-3 p-4 rounded-2xl bg-card border border-border shadow-sm text-left transition-all hover:-translate-y-px hover:border-primary/60 hover:shadow-[0_6px_20px_-8px_oklch(0.52_0.16_145/0.3)] active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-primary/25">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{t.dashboard.fasting}</p>
              <p className="text-xs text-muted-foreground">
                {activeFasting ? t.dashboard.inProgress : t.dashboard.startProtocol}
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/meditation')}
            className="group flex items-center gap-3 p-4 rounded-2xl bg-card border border-border shadow-sm text-left transition-all hover:-translate-y-px hover:border-secondary/60 hover:shadow-[0_6px_20px_-8px_oklch(0.72_0.10_295/0.3)] active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-accent/80">
              <Sparkles className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{t.dashboard.meditationRelax}</p>
              <p className="text-xs text-muted-foreground">{t.dashboard.mindfulness}</p>
            </div>
          </button>
        </div>

        {/* Jejum Intermitente */}
        {activeFasting && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                {t.dashboard.fastingInProgress}
              </CardTitle>
              <CardDescription>
                {activeFasting.type.replace('_', ':')} - {activeFasting.targetDuration}h
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate('/fasting')} className="w-full">
                {t.common.seeDetails}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Treinos */}
        <Card id="sec-treino">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-primary" />
                  {t.dashboard.physicalActivity}
                </CardTitle>
                <CardDescription>
                  {todayWorkouts.length} {todayWorkouts.length !== 1 ? t.dashboard.workoutPlural : t.dashboard.workoutSingular}
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsWorkoutDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                {t.dashboard.workout}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* SugestÃ£o de treino do plano AI para hoje */}
            {aiWorkoutPlan && todayWorkouts.length === 0 && (() => {
              const planDay = aiWorkoutPlan.plan.days[todayMenuIndex % aiWorkoutPlan.plan.days.length]
              return planDay ? (
                <div className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-3">
                  <p className="text-xs font-semibold text-primary mb-1">Treino sugerido para hoje</p>
                  <p className="text-sm font-bold text-foreground">{planDay.name} â€” {planDay.focus}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {planDay.exercises.length} exercÃ­cios Â· {aiWorkoutPlan.plan.sessionDuration} min estimados
                  </p>
                  <button
                    onClick={() => { setWorkoutMode('plan'); setSelectedPlanDayIndex(todayMenuIndex % aiWorkoutPlan.plan.days.length); setIsWorkoutDialogOpen(true) }}
                    className="mt-2 text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    Registrar este treino <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              ) : null
            })()}

            {todayWorkouts.length > 0 ? (
              <div className="space-y-2">
                {todayWorkouts.map((workout) => (
                  <div key={workout.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium capitalize">{workout.notes ?? workout.type}</div>
                      <div className="text-sm text-muted-foreground">{workout.duration} min Â· {workout.intensity}</div>
                    </div>
                    <Badge variant="secondary">{workout.caloriesBurned} kcal</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 space-y-2">
                <p className="text-sm text-muted-foreground">{t.dashboard.noWorkoutsToday}</p>
                <button
                  onClick={() => setIsWorkoutDialogOpen(true)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  + Registrar treino de hoje
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de registro de treino */}
        <Dialog open={isWorkoutDialogOpen} onOpenChange={setIsWorkoutDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.dashboard.registerWorkout}</DialogTitle>
              <DialogDescription>{t.dashboard.addWorkoutDesc}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">

              {/* Toggle Manual / Do meu plano */}
              {aiWorkoutPlan && (
                <div className="flex rounded-lg overflow-hidden border border-border">
                  <button
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${workoutMode === 'manual' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                    onClick={() => setWorkoutMode('manual')}
                  >
                    {t.dashboard.manual}
                  </button>
                  <button
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${workoutMode === 'plan' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                    onClick={() => { setWorkoutMode('plan'); setCustomDuration(String(aiWorkoutPlan.plan.sessionDuration)) }}
                  >
                    {t.dashboard.fromMyPlan}
                  </button>
                </div>
              )}

              {/* Seletor de dia do plano */}
              {workoutMode === 'plan' && aiWorkoutPlan && (
                <div className="space-y-2">
                  <Label>{t.dashboard.planDay}</Label>
                  <Select value={String(selectedPlanDayIndex)} onValueChange={(v) => setSelectedPlanDayIndex(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aiWorkoutPlan.plan.days.map((day, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {day.name} â€” {day.focus}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Preview de exercÃ­cios do dia */}
                  <div className="rounded-lg bg-muted p-3 space-y-1 max-h-32 overflow-y-auto">
                    {aiWorkoutPlan.plan.days[selectedPlanDayIndex].exercises.map((ex, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        â€¢ {ex.name}{ex.sets ? ` â€” ${ex.sets}x${ex.reps}` : ex.duration ? ` â€” ${ex.duration}` : ''}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Tipo (apenas manual) */}
              {workoutMode === 'manual' && (
                <div className="space-y-2">
                  <Label htmlFor="workout-type">{t.dashboard.workoutType}</Label>
                  <Select value={customType} onValueChange={(value: WorkoutType) => setCustomType(value)}>
                    <SelectTrigger id="workout-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="caminhada">{t.dashboard.workoutTypes.caminhada}</SelectItem>
                      <SelectItem value="corrida">{t.dashboard.workoutTypes.corrida}</SelectItem>
                      <SelectItem value="pilates">{t.dashboard.workoutTypes.pilates}</SelectItem>
                      <SelectItem value="yoga">{t.dashboard.workoutTypes.yoga}</SelectItem>
                      <SelectItem value="musculacao">{t.dashboard.workoutTypes.musculacao}</SelectItem>
                      <SelectItem value="danca">{t.dashboard.workoutTypes.danca}</SelectItem>
                      <SelectItem value="natacao">{t.dashboard.workoutTypes.natacao}</SelectItem>
                      <SelectItem value="outro">{t.dashboard.workoutTypes.outro}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* DuraÃ§Ã£o */}
              <div className="space-y-2">
                <Label htmlFor="workout-duration">{t.dashboard.durationMin}</Label>
                <Input
                  id="workout-duration"
                  type="number"
                  placeholder="Ex: 45"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                />
              </div>

              {/* Intensidade */}
              <div className="space-y-2">
                <Label htmlFor="workout-intensity">{t.dashboard.intensity}</Label>
                <Select value={customIntensity} onValueChange={(value: 'leve' | 'moderado' | 'intenso') => setCustomIntensity(value)}>
                  <SelectTrigger id="workout-intensity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leve">{t.dashboard.intensities.leve}</SelectItem>
                    <SelectItem value="moderado">{t.dashboard.intensities.moderado}</SelectItem>
                    <SelectItem value="intenso">{t.dashboard.intensities.intenso}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Data */}
              <div className="space-y-2">
                <Label htmlFor="workout-date">{t.dashboard.workoutDate}</Label>
                <Input
                  id="workout-date"
                  type="text"
                  inputMode="numeric"
                  placeholder="DD/MM/AAAA"
                  value={workoutDate}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
                    let masked = digits
                    if (digits.length > 4) masked = digits.slice(0,2) + '/' + digits.slice(2,4) + '/' + digits.slice(4)
                    else if (digits.length > 2) masked = digits.slice(0,2) + '/' + digits.slice(2)
                    setWorkoutDate(masked)
                  }}
                />
              </div>

              {/* Preview de calorias */}
              {customDuration && (
                <p className="text-xs text-muted-foreground text-center">
                  {t.dashboard.estimate} <strong>{Math.round(parseInt(customDuration) * ({ leve: 3, moderado: 5, intenso: 8 }[customIntensity]))} kcal</strong> {t.dashboard.burned}
                </p>
              )}

              <Button onClick={handleCustomWorkout} className="w-full" disabled={!customDuration}>
                {t.common.register}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Progresso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-primary" />
              {t.dashboard.yourProgress}
            </CardTitle>
            <CardDescription>
              {user.goal === 'perder_peso' && `${t.dashboard.remaining} ${weightDiff > 0 ? weightProgress.toFixed(1) : '0'} ${t.dashboard.kgToGoal}`}
              {user.goal === 'ganhar_massa' && `${t.dashboard.remaining} ${weightDiff < 0 ? weightProgress.toFixed(1) : '0'} ${t.dashboard.kgToGoal}`}
              {user.goal === 'manter_peso' && `${t.dashboard.currentWeightLabel} ${formatWeight(latestWeight)}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => navigate('/progress')} className="w-full">
              {t.dashboard.seeFullHistory}
            </Button>
          </CardContent>
        </Card>

        {/* Exportar para mÃ©dico */}
        <button
          onClick={() => setIsExportOpen(true)}
          className="group w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm text-left transition-all hover:-translate-y-px hover:border-primary/60 hover:shadow-[0_6px_20px_-8px_oklch(0.52_0.16_145/0.3)] active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-primary/25">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{t.dashboard.exportHealthReport}</p>
            <p className="text-xs text-muted-foreground">{t.dashboard.exportHealthReportDesc}</p>
          </div>
        </button>

        {/* Dialog de exportaÃ§Ã£o */}
        <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {t.dashboard.exportReportTitle}
              </DialogTitle>
              <DialogDescription>
                {t.dashboard.exportReportDesc}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="export-start">{t.dashboard.startDate}</Label>
                  <Input
                    id="export-start"
                    type="date"
                    value={exportStartDate}
                    max={exportEndDate}
                    onChange={e => setExportStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="export-end">{t.dashboard.endDate}</Label>
                  <Input
                    id="export-end"
                    type="date"
                    value={exportEndDate}
                    min={exportStartDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={e => setExportEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">{t.dashboard.reportSections}</p>
                <div className="grid grid-cols-1 gap-2">
                  {([
                    { key: 'profile',          label: t.dashboard.reportProfile },
                    { key: 'nutrition',        label: t.dashboard.reportNutrition },
                    { key: 'weightHistory',    label: t.dashboard.reportWeight },
                    { key: 'water',            label: t.dashboard.reportWater },
                    { key: 'meals',            label: t.dashboard.reportMeals },
                    { key: 'workouts',         label: t.dashboard.reportWorkouts },
                    { key: 'sleep',            label: t.dashboard.reportSleep },
                    { key: 'bodyMeasurements', label: t.dashboard.reportMeasurements },
                    ...(aiWorkoutPlan ? [{ key: 'workoutPlan', label: t.dashboard.reportWorkoutPlan }] : []),
                    ...(cycleConfig   ? [{ key: 'cycle',       label: t.dashboard.reportCycle }] : []),
                  ] as { key: keyof typeof reportSections; label: string }[]).map(s => (
                    <label key={s.key} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <Checkbox
                        checked={reportSections[s.key]}
                        onCheckedChange={() => toggleSection(s.key)}
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>

              <Button onClick={generateReport} className="w-full" size="lg">
                <FileText className="w-4 h-4 mr-2" />
                {t.dashboard.generatePdf}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
