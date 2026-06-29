import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Utensils, Loader2, Check, RefreshCw, ChevronRight } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { toast } from 'sonner'
import { generateWeeklyMenu } from '@/lib/gemini'
import { Progress } from '@/components/ui/progress'
import { FoodSubstitutionsDialog } from '@/components/food-substitutions-dialog'
import type { SavedWeeklyMenu, CycleConfig, MenuFood } from '@/types'
import { useTranslation } from '@/contexts/LanguageContext'

function getMenuFoodName(f: MenuFood): string {
  return typeof f === 'string' ? f : f.name
}

interface DayMeal {
  type: string
  time: string
  foods: MenuFood[]
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

interface WeekDay {
  day: string
  dayOfWeek: string
  meals: DayMeal[]
  totalNutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
}

interface DietRecommendation {
  title: string
  description: string
  weekDays: WeekDay[]
  weeklyAverage: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
  tips: string[]
  shoppingList: string[]
  aiSubstitutions?: Array<{ original: string; alternatives: string[] }>
}

const WEEK_DAYS = [
  { key: 'Segunda-feira', short: 'Seg' },
  { key: 'Terça-feira', short: 'Ter' },
  { key: 'Quarta-feira', short: 'Qua' },
  { key: 'Quinta-feira', short: 'Qui' },
  { key: 'Sexta-feira', short: 'Sex' },
  { key: 'Sábado', short: 'Sáb' },
  { key: 'Domingo', short: 'Dom' },
]

function getCurrentCyclePhase(config: CycleConfig): string {
  const lastPeriodStart = new Date(config.lastPeriodStart)
  const today = new Date()
  const diffDays = Math.floor((today.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24))
  const dayOfCycle = (diffDays % config.averageCycleDuration) + 1
  if (dayOfCycle <= config.averagePeriodDuration) return 'menstrual'
  if (dayOfCycle <= 13) return 'folicular'
  if (dayOfCycle <= 16) return 'ovulatória'
  return 'lútea'
}

export function DietRecommendationDialog() {
  const { user, saveWeeklyMenu, cycleConfig, updateMenuPreferences } = useApp()
  const { t } = useTranslation()
  const td = t.dietDialog
  const [isGenerating, setIsGenerating] = useState(false)
  const [genProgress, setGenProgress] = useState<{ percent: number; label: string }>({ percent: 0, label: '' })
  const [recommendation, setRecommendation] = useState<DietRecommendation | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Customization fields — PRÉ-PREENCHIDOS pelas preferências salvas (user.menuPreferences), para o
  // usuário não reconfigurar toda vez e as preferências serem aplicadas de forma consistente.
  const prefs = user?.menuPreferences
  const [excludedFoodsText, setExcludedFoodsText] = useState(() => prefs?.excludedFoods?.join(', ') ?? '')
  const [useCycleAware, setUseCycleAware] = useState(false)
  const [highCalorieDays, setHighCalorieDays] = useState<string[]>(() => prefs?.highCalorieDays ?? [])
  const [country, setCountry] = useState(() => prefs?.country ?? user?.country ?? 'Brasil')
  const [useFasting, setUseFasting] = useState(() => !!prefs?.fastingProtocol)
  const [fastingProtocol, setFastingProtocol] = useState(() => prefs?.fastingProtocol ?? '16:8')
  const [highCalMealPriority, setHighCalMealPriority] = useState(() => prefs?.highCalMealPriority ?? '')
  // Estrutura de refeições: usa a preferência salva; senão, default inteligente (fracionado para
  // GLP-1, bariátrica ou ganho de massa). NÃO reseta em "Gerar Novo".
  const wantsFractioned = !!user && (user.medication !== 'nenhum' || !!user.hadBariatricSurgery || user.goal === 'ganhar_massa')
  const [mealStructureMode, setMealStructureMode] = useState<'principais' | 'fracionado'>(
    () => prefs?.mealStructureMode ?? (wantsFractioned ? 'fracionado' : 'principais')
  )
  // Se o perfil ainda não tinha carregado quando o componente montou (primeiro acesso pós-login, cache
  // vazio), o default acima cai em 'principais'. Re-sincroniza para 'fracionado' quando o perfil
  // GLP-1/bariátrica/ganho de massa chega — desde que o usuário não tenha trocado à mão nem haja
  // preferência salva. Sem isso, GLP-1 abria em "Só principais" (causava cardápio de 3 refeições).
  const [structureTouched, setStructureTouched] = useState(false)
  useEffect(() => {
    if (structureTouched || prefs?.mealStructureMode) return
    setMealStructureMode(wantsFractioned ? 'fracionado' : 'principais')
  }, [wantsFractioned, prefs?.mealStructureMode, structureTouched])

  const isFemale = user?.gender === 'feminino'
  const hasCycleData = isFemale && !!cycleConfig

  const toggleHighCalDay = (day: string) => {
    setHighCalorieDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const generateDietRecommendation = async () => {
    if (!user) return
    setIsGenerating(true)
    setGenProgress({ percent: 0, label: 'Preparando seu cardápio...' })
    try {
      toast.info('Gerando cardápio personalizado...', { duration: 3000 })

      const excludedFoods = excludedFoodsText
        .split(/[,;\n]/)
        .map(s => s.trim())
        .filter(s => s.length > 0)

      const cyclePhase = (useCycleAware && hasCycleData && cycleConfig)
        ? getCurrentCyclePhase(cycleConfig)
        : undefined

      // Persiste as preferências para o diálogo pré-preencher e as próximas gerações respeitarem.
      updateMenuPreferences({
        excludedFoods,
        country: country.trim() || 'Brasil',
        mealStructureMode,
        fastingProtocol: useFasting ? fastingProtocol : null,
        highCalMealPriority: highCalMealPriority || undefined,
        highCalorieDays: highCalorieDays.length > 0 ? highCalorieDays : undefined,
      })

      // No jejum, a janela alimentar governa as refeições — não enviamos estrutura fracionada.
      const fractioned = mealStructureMode === 'fracionado'
      const geminiData = await generateWeeklyMenu(user, {
        excludedFoods,
        cyclePhase,
        highCalorieDays: highCalorieDays.length > 0 ? highCalorieDays : undefined,
        country: country.trim() || 'Brasil',
        fastingProtocol: useFasting ? fastingProtocol : undefined,
        highCalMealPriority: highCalMealPriority || undefined,
        mealStructure: useFasting ? undefined : {
          includeMorningSnack: fractioned,
          includeAfternoonSnack: fractioned,
          includeSupper: fractioned,
        },
        onProgress: (p) => setGenProgress({ percent: p.percent, label: p.label }),
      })

      // Os totais já vêm como a SOMA REAL dos alimentos (normalizado em generateWeeklyMenu).
      // Não escalamos para a meta aqui: isso desconectaria o total da soma dos alimentos
      // (era a causa de "a soma não confere"). A meta diária é mirada pela própria IA.

      const numDays = geminiData.days.length || 7
      const data: DietRecommendation = {
        title: geminiData.title,
        description: geminiData.description,
        weekDays: geminiData.days.map((day) => {
          const totalNutrition = day.meals.reduce((acc, meal) => ({
            calories: acc.calories + meal.calories,
            protein: acc.protein + meal.protein,
            carbs: acc.carbs + meal.carbs,
            fat: acc.fat + meal.fat,
            fiber: acc.fiber + (meal.fiber ?? 0)
          }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })
          totalNutrition.fiber = Math.round(totalNutrition.fiber * 10) / 10
          return {
            day: day.day, dayOfWeek: day.day,
            meals: day.meals.map((meal) => ({ type: meal.type, time: meal.type, foods: meal.foods, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat, fiber: meal.fiber ?? 0 })),
            totalNutrition
          }
        }),
        weeklyAverage: {
          calories: Math.round(geminiData.days.reduce((s, d) => s + d.meals.reduce((ms, m) => ms + m.calories, 0), 0) / numDays),
          protein: Math.round(geminiData.days.reduce((s, d) => s + d.meals.reduce((ms, m) => ms + m.protein, 0), 0) / numDays),
          carbs: Math.round(geminiData.days.reduce((s, d) => s + d.meals.reduce((ms, m) => ms + m.carbs, 0), 0) / numDays),
          fat: Math.round(geminiData.days.reduce((s, d) => s + d.meals.reduce((ms, m) => ms + m.fat, 0), 0) / numDays),
          fiber: Math.round(geminiData.days.reduce((s, d) => s + d.meals.reduce((ms, m) => ms + (m.fiber ?? 0), 0), 0) / numDays)
        },
        tips: geminiData.tips,
        shoppingList: geminiData.shoppingList,
        aiSubstitutions: geminiData.substitutions,
      }
      setGenProgress({ percent: 100, label: 'Pronto!' })
      setRecommendation(data)
      toast.success('Cardápio gerado!', { description: 'Plano completo de 7 dias' })
    } catch (error: unknown) {
      // Sem fallback falso: nunca mostramos um cardápio degradado como se fosse o real.
      console.error('[cardápio] falha na geração:', error)
      toast.error('Não foi possível gerar o cardápio agora', {
        description: 'A IA está instável no momento. Toque em gerar novamente em instantes.',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAcceptMenu = () => {
    if (!recommendation) return
    const savedMenu: SavedWeeklyMenu = {
      id: crypto.randomUUID(),
      title: recommendation.title,
      description: recommendation.description,
      days: recommendation.weekDays.map(day => ({
        day: day.day,
        meals: day.meals.map(meal => ({ type: meal.type, name: meal.type, foods: meal.foods, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat, fiber: meal.fiber }))
      })),
      tips: recommendation.tips,
      shoppingList: recommendation.shoppingList,
      substitutions: recommendation.aiSubstitutions,
      createdAt: new Date(),
      acceptedAt: new Date()
    }
    saveWeeklyMenu(savedMenu)
    toast.success('Cardápio salvo!')
    setIsDialogOpen(false)
    setRecommendation(null)
  }

  const handleGenerateNew = () => {
    setRecommendation(null)
    generateDietRecommendation()
  }

  if (!user) return null

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <button className="group flex items-center gap-3 px-4 py-3 bg-background hover:bg-accent rounded-xl shadow-sm border border-border w-full active:scale-[0.98] transition-all text-left">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/15">
            <Utensils className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground leading-tight">{td.title}</p>
            <p className="text-xs text-muted-foreground leading-snug mt-0.5">{td.subtitle}</p>
          </div>
          <ChevronRight className="w-4 h-4 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
      </DialogTrigger>

      <DialogContent
        className="flex flex-col p-0 gap-0 overflow-hidden max-h-[92vh] sm:max-w-xl bg-card text-foreground"
      >
        {/* Header fixo */}
        <DialogHeader className="flex-shrink-0 px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base text-foreground">
            <Utensils className="w-4 h-4 text-primary" />
            {td.title}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {td.subtitle}
          </DialogDescription>
        </DialogHeader>

        {/* Estado inicial */}
        {!recommendation && !isGenerating && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

            {/* Resumo do perfil */}
            <div className="rounded-xl p-3 space-y-1.5 bg-muted">
              <p className="text-xs font-semibold mb-1 text-primary">Seu Perfil</p>
              <p className="text-xs text-foreground">
                <strong>Objetivo:</strong> {user.goal === 'perder_peso' ? 'Perder peso' : user.goal === 'ganhar_massa' ? 'Ganhar massa' : user.goal === 'saude_geral' ? 'Saúde geral' : 'Manter peso'}
              </p>
              <p className="text-xs text-foreground"><strong>Meta calórica:</strong> {user.targetCalories} kcal/dia</p>
              <p className="text-xs text-foreground"><strong>Proteína:</strong> {user.targetProtein}g | <strong>Fibras:</strong> {user.targetFiber}g</p>
              {user.medication !== 'nenhum' && (
                <p className="text-[10px] text-muted-foreground">⚠️ Adaptado para uso de {user.medication}</p>
              )}
            </div>

            {/* Personalização */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-foreground">Personalizar Cardápio</p>

              {/* Estrutura de refeições (pedido da cliente: escolher na hora de gerar) */}
              <div>
                <label className="text-[11px] font-medium block mb-1.5 text-muted-foreground">
                  Estrutura de refeições
                </label>
                {useFasting ? (
                  <p className="text-[11px] px-3 py-2 rounded-lg bg-muted text-muted-foreground">
                    No jejum intermitente, o cardápio concentra as refeições na janela, sem lanches nem ceia.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { key: 'principais', label: 'Só principais', sub: 'Café, almoço e jantar' },
                        { key: 'fracionado', label: 'Com lanches + ceia', sub: 'Fraciona em 6 refeições' },
                      ].map(opt => (
                        <button
                          key={opt.key}
                          onClick={() => { setStructureTouched(true); setMealStructureMode(opt.key as 'principais' | 'fracionado') }}
                          className={`px-3 py-2 rounded-lg text-left transition-colors border ${
                            mealStructureMode === opt.key
                              ? 'bg-primary text-white border-primary'
                              : 'bg-card text-foreground border-border'
                          }`}
                        >
                          <span className="block text-[11px] font-semibold leading-tight">{opt.label}</span>
                          <span className={`block text-[10px] leading-tight mt-0.5 ${mealStructureMode === opt.key ? 'text-white/80' : 'text-muted-foreground'}`}>{opt.sub}</span>
                        </button>
                      ))}
                    </div>
                    {mealStructureMode === 'fracionado' && (
                      <p className="text-[10px] mt-1 text-muted-foreground">
                        Lanches e ceia ajudam a fracionar a alimentação e atingir a proteína, ideal para quem usa GLP-1.
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* País/Nacionalidade */}
              <div>
                <label className="text-[11px] font-medium block mb-1 text-muted-foreground">
                  País / Referência cultural
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  placeholder="Ex: Brasil, Portugal, Itália..."
                  className="w-full text-xs px-3 py-2 rounded-lg border outline-none focus:ring-1 border-border text-foreground bg-card"
                />
              </div>

              {/* Alimentos a excluir */}
              <div>
                <label className="text-[11px] font-medium block mb-1 text-muted-foreground">
                  Alimentos que não quer no cardápio
                </label>
                <textarea
                  value={excludedFoodsText}
                  onChange={e => setExcludedFoodsText(e.target.value)}
                  placeholder="Ex: carne de porco, camarão, amendoim..."
                  rows={2}
                  className="w-full text-xs px-3 py-2 rounded-lg border outline-none focus:ring-1 resize-none border-border text-foreground bg-card"
                />
                <p className="text-[10px] mt-0.5 text-muted-foreground">Separe por vírgula ou enter</p>
              </div>

              {/* Dias mais calóricos */}
              <div>
                <label className="text-[11px] font-medium block mb-1.5 text-muted-foreground">
                  Dias com refeição mais calórica (+20% calorias)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {WEEK_DAYS.map(d => (
                    <button
                      key={d.key}
                      onClick={() => toggleHighCalDay(d.key)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                        highCalorieDays.includes(d.key) ? 'bg-primary text-white' : 'bg-border text-muted-foreground'
                      }`}
                    >
                      {d.short}
                    </button>
                  ))}
                </div>
                {highCalorieDays.length > 0 && user.targetCalories && (
                  <p className="text-[10px] mt-1 text-primary">
                    {highCalorieDays.join(', ')}: {Math.round(user.targetCalories * 1.2)} kcal
                  </p>
                )}
              </div>

              {/* Jejum intermitente */}
              <div className="rounded-xl p-3 border border-primary/10 bg-primary/5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-[11px] font-semibold text-primary">Considerar jejum intermitente</p>
                    <p className="text-[10px] text-muted-foreground">Adapta horarios e distribuicao das refeicoes</p>
                  </div>
                  <button
                    onClick={() => setUseFasting(v => !v)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${
                      useFasting ? 'bg-primary' : 'bg-border'
                    }`}
                  >
                    <span
                      className="absolute top-0.5 w-4 h-4 bg-card rounded-full shadow transition-transform"
                      style={{ left: useFasting ? '20px' : '2px' }}
                    />
                  </button>
                </div>
                {useFasting && (
                  <div className="flex flex-wrap gap-1.5">
                    {['12:12', '14:10', '16:8', '18:6', '20:4'].map(p => (
                      <button
                        key={p}
                        onClick={() => setFastingProtocol(p)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                          fastingProtocol === p ? 'bg-primary text-white' : 'bg-border text-muted-foreground'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Prioridade de refeição calórica */}
              <div>
                <label className="text-[11px] font-medium block mb-1.5 text-muted-foreground">
                  Refeicao principal (mais calorica)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: '', label: 'Automatico' },
                    { key: 'cafe', label: 'Cafe da manha' },
                    { key: 'almoco', label: 'Almoco' },
                    { key: 'jantar', label: 'Jantar' },
                    { key: 'cafe_jantar', label: 'Cafe + Jantar' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setHighCalMealPriority(opt.key)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                        highCalMealPriority === opt.key ? 'bg-primary text-white' : 'bg-border text-muted-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ciclo menstrual (apenas para mulheres) */}
              {isFemale && (
                <div className="rounded-xl p-3 border border-primary/10 bg-primary/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-primary">Adaptar ao ciclo menstrual</p>
                      {hasCycleData && cycleConfig && (
                        <p className="text-[10px] text-muted-foreground">
                          Fase atual: {getCurrentCyclePhase(cycleConfig)}
                        </p>
                      )}
                      {!hasCycleData && (
                        <p className="text-[10px] text-muted-foreground">Configure seu ciclo em Saúde para habilitar</p>
                      )}
                    </div>
                    <button
                      onClick={() => hasCycleData && setUseCycleAware(v => !v)}
                      disabled={!hasCycleData}
                      className={`w-10 h-5 rounded-full relative transition-colors disabled:opacity-40 ${
                        useCycleAware && hasCycleData ? 'bg-primary' : 'bg-border'
                      }`}
                    >
                      <span
                        className="absolute top-0.5 w-4 h-4 bg-card rounded-full shadow transition-transform"
                        style={{ left: useCycleAware && hasCycleData ? '20px' : '2px' }}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Botão gerar */}
            <button
              onClick={generateDietRecommendation}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm text-white active:scale-95 transition-transform bg-primary"
            >
              <Utensils className="w-4 h-4" />
              Gerar Cardápio Agora
            </button>
          </div>
        )}

        {/* Gerando — barra FIEL: avança conforme os dias reais chegam da IA (streaming) */}
        {isGenerating && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 py-12">
            <Loader2 className="w-9 h-9 animate-spin text-primary" />
            <div className="w-full max-w-xs space-y-2">
              <Progress value={genProgress.percent} className="h-2.5" />
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground truncate">{genProgress.label || 'Gerando seu cardápio...'}</span>
                <span className="font-bold text-primary tabular-nums shrink-0">{Math.round(genProgress.percent)}%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center max-w-xs leading-relaxed">
              Estamos montando seus 7 dias com comida brasileira do seu jeito. Isso leva cerca de um minuto.
            </p>
          </div>
        )}

        {/* Resultado */}
        {recommendation && !isGenerating && (
          <>
            <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-4">

              {/* Título */}
              <div>
                <p className="font-bold text-sm text-foreground">{recommendation.title}</p>
                <p className="text-xs mt-0.5 text-muted-foreground">{recommendation.description}</p>
                {recommendation.weekDays[0] && (
                  <span className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                    {recommendation.weekDays[0].meals.length} refeições por dia
                  </span>
                )}
              </div>

              {/* Média nutricional */}
              <div className="rounded-xl p-3 border border-border">
                <p className="text-[11px] font-semibold mb-2.5 text-primary">Média Nutricional Diária</p>
                <div className="flex justify-between text-center">
                  {[
                    { v: recommendation.weeklyAverage.calories, l: 'kcal', c: 'text-primary' },
                    { v: `${recommendation.weeklyAverage.protein}g`, l: 'Prot.', c: 'text-chart-5' },
                    { v: `${recommendation.weeklyAverage.carbs}g`, l: 'Carbs', c: 'text-chart-3' },
                    { v: `${recommendation.weeklyAverage.fat}g`, l: 'Gord.', c: 'text-warning' },
                    { v: `${recommendation.weeklyAverage.fiber}g`, l: 'Fibras', c: 'text-primary' },
                  ].map(item => (
                    <div key={item.l}>
                      <div className={`text-sm font-bold ${item.c}`}>{item.v}</div>
                      <div className="text-[9px] text-muted-foreground">{item.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dias */}
              <div className="space-y-3">
                <p className="font-semibold text-xs text-foreground">Cardápio Semanal</p>
                {recommendation.weekDays.map((day, di) => (
                  <div key={di} className="rounded-xl overflow-hidden border border-border">
                    <div className="flex items-center justify-between px-3 py-2 bg-muted">
                      <p className="font-semibold text-xs text-primary">{day.day}</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white bg-primary">
                        {day.totalNutrition.calories} kcal
                      </span>
                    </div>
                    <div className="px-3 py-2.5 space-y-2.5">
                      {day.meals.map((meal, mi) => (
                        <div key={mi} className="border-l-2 pl-2.5 border-primary/30">
                          <p className="font-semibold text-[11px] mb-0.5 text-foreground">{meal.type}</p>
                          <ul className="space-y-0.5 mb-1.5">
                            {meal.foods.map((food, fi) => (
                              <li key={fi} className="text-[11px] flex items-start gap-1">
                                <span className="text-primary">•</span>
                                <span className="text-muted-foreground">
                                  {getMenuFoodName(food)}
                                  {typeof food === 'object' && food.calories > 0 && (
                                    <span className="ml-1 text-[10px] text-muted-foreground">({food.calories} kcal)</span>
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                          <div className="flex flex-wrap gap-2 text-[10px]">
                            <span className="font-semibold text-primary">{meal.calories} kcal</span>
                            <span className="text-chart-5">P:{meal.protein}g</span>
                            <span className="text-chart-3">C:{meal.carbs}g</span>
                            <span className="text-warning">G:{meal.fat}g</span>
                            <span className="text-primary">Fib:{meal.fiber}g</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Dicas */}
              <div className="rounded-xl p-3 space-y-2 border border-border">
                <p className="font-semibold text-[11px] flex items-center gap-1.5 text-primary">
                  <Utensils className="w-3.5 h-3.5" />
                  Dicas da Bem
                </p>
                {recommendation.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs">
                    <span className="text-primary">✓</span>
                    <span className="text-foreground">{tip}</span>
                  </div>
                ))}
              </div>

              {/* Lista de compras */}
              <div className="rounded-xl p-3 border border-border">
                <p className="font-semibold text-[11px] mb-2 text-foreground">Lista de Compras</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {recommendation.shoppingList.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-primary">□</span>
                      <span className="text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-5 pb-5 pt-3 space-y-2 border-t border-border">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleAcceptMenu}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white active:scale-95 transition-transform bg-primary"
                >
                  <Check className="w-4 h-4" />
                  Aceitar
                </button>
                <button
                  onClick={handleGenerateNew}
                  disabled={isGenerating}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm disabled:opacity-60 active:scale-95 transition-transform bg-muted text-primary"
                >
                  <RefreshCw className="w-4 h-4" />
                  Gerar Novo
                </button>
              </div>
              <FoodSubstitutionsDialog
                menu={{
                  id: '',
                  title: recommendation.title,
                  description: recommendation.description,
                  days: recommendation.weekDays.map(day => ({
                    day: day.day,
                    meals: day.meals.map(meal => ({ type: meal.type, name: meal.type, foods: meal.foods, calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat, fiber: meal.fiber }))
                  })),
                  tips: recommendation.tips,
                  shoppingList: recommendation.shoppingList,
                  createdAt: new Date(),
                  acceptedAt: new Date(),
                }}
                aiSubstitutions={recommendation.aiSubstitutions}
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
