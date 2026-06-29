import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { getCycleDayInfo, getPhaseInfo, formatDateShort } from '@/lib/cycle-utils'
import type { CycleConfig } from '@/types'
import { useTranslation } from '@/contexts/LanguageContext'
import {
  AlertCircle,
  ChevronRight,
  RotateCcw,
  Leaf,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  CalendarHeart,
  Heart,
} from 'lucide-react'

// ─── Helpers ────────────────────────────────────────────────────────────────

function today(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ─── Onboarding Step 1 — Boas-vindas ────────────────────────────────────────

function OnboardingWelcome({ onNext }: { onNext: () => void }) {
  const { t } = useTranslation()
  const tc = t.cycle
  return (
    <div className="min-h-screen flex flex-col bg-rose-50 dark:bg-rose-950/40">
      <div className="max-w-md mx-auto w-full p-6 pb-28 flex flex-col gap-6 pt-10">
        <div className="text-center space-y-3">
          <img
            src="/mascots/koala-ciclo.webp"
            alt="Mascote"
            className="w-28 h-28 mx-auto object-contain drop-shadow-md"
          />
          <h1 className="text-3xl font-bold">{tc.title}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {tc.description}
          </p>
        </div>

        <Card className="border-pink-200 dark:border-pink-900 bg-pink-50/60 dark:bg-pink-950/30">
          <CardContent className="pt-5 flex gap-3">
            <AlertCircle className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground leading-relaxed">
              <p className="font-medium text-foreground mb-1">{tc.warningTitle}</p>
              {tc.warningText}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3 text-sm">
          {[
            { icon: '📅', text: 'Previsão da próxima menstruação' },
            { icon: '🥗', text: 'Dicas de nutrição por fase' },
            { icon: '💪', text: 'Exercícios adaptados ao ciclo' },
            { icon: '💡', text: 'Entenda sua energia e humor' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <span className="text-xl">{icon}</span>
              <span className="text-foreground">{text}</span>
            </div>
          ))}
        </div>

        <Button onClick={onNext} className="w-full !bg-pink-500 hover:!bg-pink-600 border-0" size="lg">
          Começar
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// ─── Onboarding Step 2 — Configurar ciclo ───────────────────────────────────

interface ConfigData {
  lastPeriodStart: string
  averageCycleDuration: number
  averagePeriodDuration: number
  typicalVariation: number
  isMenopausa?: boolean
}

function OnboardingConfigure({ onNext }: { onNext: (data: ConfigData) => void }) {
  const { t } = useTranslation()
  const tc = t.cycle
  const [isMenopausa, setIsMenopausa] = useState(false)
  const [form, setForm] = useState<Omit<ConfigData, 'isMenopausa'>>({
    lastPeriodStart: today(),
    averageCycleDuration: 28,
    averagePeriodDuration: 5,
    typicalVariation: 2,
  })
  const [error, setError] = useState('')

  const handleNext = () => {
    if (isMenopausa) {
      onNext({ ...form, isMenopausa: true })
      return
    }
    if (!form.lastPeriodStart) {
      setError('Informe a data do último início da menstruação.')
      return
    }
    if (form.averageCycleDuration < 21 || form.averageCycleDuration > 45) {
      setError('Duração do ciclo deve estar entre 21 e 45 dias.')
      return
    }
    if (form.averagePeriodDuration < 2 || form.averagePeriodDuration > 10) {
      setError('Duração da menstruação deve estar entre 2 e 10 dias.')
      return
    }
    onNext(form)
  }

  return (
    <div className="min-h-screen flex flex-col bg-rose-50 dark:bg-rose-950/40">
      <div className="max-w-md mx-auto w-full p-6 pb-28 space-y-6 pt-10">
        <div className="text-center space-y-2">
          <div className="text-5xl">📅</div>
          <h2 className="text-2xl font-bold">{tc.configure}</h2>
          <p className="text-sm text-muted-foreground">{tc.configureDesc}</p>
        </div>

        {/* Toggle Menopausa */}
        <Card className="border-pink-200 dark:border-pink-900">
          <CardContent className="pt-4 pb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Estou na menopausa</p>
              <p className="text-xs text-muted-foreground mt-0.5">Ativar dicas específicas para esta fase</p>
            </div>
            <button
              type="button"
              onClick={() => { setIsMenopausa(v => !v); setError('') }}
              className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${isMenopausa ? 'bg-pink-500' : 'bg-muted'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${isMenopausa ? 'left-6' : 'left-0.5'}`} />
            </button>
          </CardContent>
        </Card>

        {/* Info menopausa */}
        {isMenopausa && (
          <Card className="border-pink-200 dark:border-pink-900 bg-pink-50/60 dark:bg-pink-950/30">
            <CardContent className="pt-4 pb-4 text-sm text-muted-foreground leading-relaxed space-y-1.5">
              <p className="font-medium text-foreground">Dicas personalizadas para menopausa 🌸</p>
              <p>Você receberá orientações de nutrição, exercícios e bem-estar adaptadas especificamente para esta fase da vida.</p>
              <p className="text-xs">Clique em Continuar para personalizar suas preferências.</p>
            </CardContent>
          </Card>
        )}

        {/* Campos de ciclo (apenas se não for menopausa) */}
        {!isMenopausa && (
          <Card className="border-pink-200 dark:border-pink-900">
            <CardContent className="pt-5 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="lastPeriod">Data do último início da menstruação</Label>
                <Input
                  id="lastPeriod"
                  type="date"
                  value={form.lastPeriodStart}
                  max={today()}
                  onChange={e => setForm(p => ({ ...p, lastPeriodStart: e.target.value }))}
                  className="focus-visible:ring-pink-400 focus-visible:border-pink-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cycleDur">
                  Duração média do ciclo: <strong>{form.averageCycleDuration} dias</strong>
                </Label>
                <input
                  id="cycleDur"
                  type="range"
                  min={21}
                  max={45}
                  value={form.averageCycleDuration}
                  onChange={e => setForm(p => ({ ...p, averageCycleDuration: Number(e.target.value) }))}
                  className="w-full accent-pink-500"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>21 dias</span>
                  <span>45 dias</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="periodDur">
                  Duração média da menstruação: <strong>{form.averagePeriodDuration} dias</strong>
                </Label>
                <input
                  id="periodDur"
                  type="range"
                  min={2}
                  max={10}
                  value={form.averagePeriodDuration}
                  onChange={e => setForm(p => ({ ...p, averagePeriodDuration: Number(e.target.value) }))}
                  className="w-full accent-pink-500"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>2 dias</span>
                  <span>10 dias</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="variation">
                  Variação típica: <strong>±{form.typicalVariation} dias</strong>
                  <span className="text-muted-foreground font-normal"> (opcional)</span>
                </Label>
                <input
                  id="variation"
                  type="range"
                  min={0}
                  max={7}
                  value={form.typicalVariation}
                  onChange={e => setForm(p => ({ ...p, typicalVariation: Number(e.target.value) }))}
                  className="w-full accent-pink-500"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Ciclo regular</span>
                  <span>±7 dias</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <p className="text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </p>
        )}

        <Button onClick={handleNext} className="w-full !bg-pink-500 hover:!bg-pink-600 border-0" size="lg">
          Continuar
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// ─── Onboarding Step 3 — Preferências ───────────────────────────────────────

const GOAL_OPTIONS = [
  { value: 'saude', label: '💚 Manter saúde geral' },
  { value: 'emagrecimento', label: '⚖️ Emagrecimento' },
  { value: 'hipertrofia', label: '💪 Ganho muscular' },
  { value: 'performance', label: '🏃 Performance esportiva' },
] as const

const RESTRICTION_OPTIONS = [
  'Vegetariana', 'Vegana', 'Sem lactose', 'Sem glúten', 'Low carb', 'Intolerância à frutose',
]

function OnboardingPreferences({ onComplete, isMenopausa }: {
  onComplete: (prefs: { mainGoal?: CycleConfig['mainGoal']; restrictions?: string[]; wantsToGetPregnant?: boolean }) => void
  isMenopausa?: boolean
}) {
  const [mainGoal, setMainGoal] = useState<CycleConfig['mainGoal']>()
  const [restrictions, setRestrictions] = useState<string[]>([])
  const [wantsToGetPregnant, setWantsToGetPregnant] = useState<boolean | undefined>(undefined)

  const toggleRestriction = (r: string) =>
    setRestrictions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])

  return (
    <div className="min-h-screen flex flex-col bg-rose-50 dark:bg-rose-950/40">
      <div className="max-w-md mx-auto w-full p-6 pb-28 space-y-6 pt-10">
        <div className="text-center space-y-2">
          <div className="text-5xl">✨</div>
          <h2 className="text-2xl font-bold">Personalize as dicas</h2>
          <p className="text-sm text-muted-foreground">Tudo opcional — você pode alterar depois</p>
        </div>

        <div className="space-y-3">
          <Label>Objetivo principal</Label>
          <div className="grid grid-cols-1 gap-2">
            {GOAL_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setMainGoal(mainGoal === opt.value ? undefined : opt.value)}
                className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                  mainGoal === opt.value
                    ? 'border-pink-500 bg-pink-500/10 text-pink-500'
                    : 'border-border bg-card text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Intenção de engravidar (apenas para não-menopausa) */}
        {!isMenopausa && (
          <div className="space-y-3">
            <Label>Tem a intenção de engravidar neste momento?</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: true, label: '🤰 Sim' },
                { value: false, label: '🚫 Não' },
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => setWantsToGetPregnant(wantsToGetPregnant === opt.value ? undefined : opt.value)}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                    wantsToGetPregnant === opt.value
                      ? 'border-pink-500 bg-pink-500/10 text-pink-500'
                      : 'border-border bg-card text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Label>Restrições alimentares</Label>
          <div className="flex flex-wrap gap-2">
            {RESTRICTION_OPTIONS.map(r => (
              <button
                key={r}
                onClick={() => toggleRestriction(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  restrictions.includes(r)
                    ? 'border-pink-500 bg-pink-500/10 text-pink-500'
                    : 'border-border bg-card text-foreground'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={() => onComplete({ mainGoal, restrictions, wantsToGetPregnant })}
          className="w-full !bg-pink-500 hover:!bg-pink-600 border-0"
          size="lg"
        >
          Concluir
          <Heart className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// ─── Menopausa Overview ──────────────────────────────────────────────────────

function MenopausaOverview({ onReset }: { onReset: () => void }) {
  const [showNutrition, setShowNutrition] = useState(false)
  const [showExercise, setShowExercise] = useState(false)

  return (
    <div className="min-h-screen bg-rose-50 dark:bg-rose-950/40">
      <div className="max-w-md mx-auto p-4 pb-28 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-3xl font-bold">Ciclo</h1>
            <p className="text-sm text-muted-foreground">Menopausa</p>
          </div>
          <img
            src="/mascots/koala-ciclo.webp"
            alt="Mascote"
            className="w-20 h-20 object-contain drop-shadow-md"
          />
        </div>

        {/* Card principal menopausa */}
        <div className="rounded-2xl p-5 space-y-3 border-2 border-pink-300 bg-pink-50 dark:bg-pink-950/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Fase atual</p>
              <h2 className="text-2xl font-bold text-pink-600">Menopausa 🌸</h2>
            </div>
            <div className="text-4xl">🌺</div>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            Uma nova fase da vida com mudanças hormonais que merecem cuidado especial com alimentação, exercícios e bem-estar.
          </p>
        </div>

        {/* Nutrição */}
        <Card className="border-pink-100 dark:border-pink-900/50">
          <button onClick={() => setShowNutrition(v => !v)} className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-pink-500 dark:text-pink-400" />
                  Nutrição na menopausa
                </span>
                {showNutrition ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </CardTitle>
            </CardHeader>
          </button>
          {showNutrition && (
            <CardContent className="pt-0 space-y-2">
              {[
                'Aumente o cálcio (iogurte, leite, brócolis, tofu) para proteger os ossos',
                'Inclua vitamina D: exposição solar + ovos e peixes gordurosos',
                'Soja e linhaça: fontes de fitoestrógenos que podem aliviar fogachos',
                'Reduza ultraprocessados e açúcar para controlar o ganho de peso',
                'Priorize fibras para saúde intestinal e controle glicêmico',
                'Mantenha boa hidratação — a pele resseca mais nesta fase',
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-pink-500 dark:text-pink-400 mt-0.5">•</span>
                  <span>{tip}</span>
                </div>
              ))}
            </CardContent>
          )}
        </Card>

        {/* Exercícios */}
        <Card className="border-pink-100 dark:border-pink-900/50">
          <button onClick={() => setShowExercise(v => !v)} className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-pink-500 dark:text-pink-400" />
                  Exercícios recomendados
                </span>
                {showExercise ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </CardTitle>
            </CardHeader>
          </button>
          {showExercise && (
            <CardContent className="pt-0 space-y-2">
              {[
                'Musculação: preserva massa muscular e óssea — fundamental nesta fase',
                'Caminhadas regulares para saúde cardiovascular e controle de peso',
                'Yoga e pilates: reduzem estresse, melhoram flexibilidade e humor',
                'Exercícios de equilíbrio para prevenir quedas',
                'Pelo menos 150 min/semana de atividade moderada',
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-pink-500 dark:text-pink-400 mt-0.5">•</span>
                  <span>{tip}</span>
                </div>
              ))}
            </CardContent>
          )}
        </Card>

        {/* Dicas gerais */}
        <Card className="!bg-pink-500 dark:!bg-pink-950/80 border-0 text-white">
          <CardHeader className="pb-1 pt-3">
            <CardTitle className="text-sm text-white/80 font-semibold uppercase tracking-wide">
              💡 Bem-estar na menopausa
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3 space-y-2">
            {[
              'Mantenha consultas ginecológicas regulares',
              'Monitore pressão arterial e colesterol com mais frequência',
              'Cuide do sono: evite cafeína à noite e mantenha o ambiente fresco',
              'Gerencie o estresse com meditação ou respiração profunda',
              'Converse com seu médico sobre reposição hormonal se necessário',
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-white/90">
                <span className="mt-0.5">✓</span>
                <span>{tip}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 w-full py-3 text-sm text-pink-500 dark:text-pink-400 rounded-xl"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reconfigurar
        </button>
      </div>
    </div>
  )
}

// ─── Overview — Visão geral do ciclo ────────────────────────────────────────

function CycleOverview({ config, onReset }: { config: CycleConfig; onReset: () => void }) {
  const info = getCycleDayInfo(config)
  const phase = getPhaseInfo(info.phase)

  const [showNutrition, setShowNutrition] = useState(false)
  const [showExercise, setShowExercise] = useState(false)

  const cycleProgress = (info.dayOfCycle / config.averageCycleDuration) * 100

  const nextPeriodLabel =
    info.daysUntilNextPeriod <= 0
      ? 'Esta semana'
      : info.daysUntilNextPeriod === 1
      ? 'Amanhã'
      : `Em ${info.daysUntilNextPeriod} dias`

  return (
    <div className="min-h-screen bg-rose-50 dark:bg-rose-950/40">
      <div className="max-w-md mx-auto p-4 pb-28 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-3xl font-bold">Ciclo</h1>
            <p className="text-sm text-muted-foreground">Sua fase hoje</p>
          </div>
          <img
            src="/mascots/koala-ciclo.webp"
            alt="Mascote"
            className="w-20 h-20 object-contain drop-shadow-md"
          />
        </div>

        {/* Card fase principal */}
        <div className={`rounded-2xl p-5 space-y-3 border-2 ${phase.bgColor} ${phase.borderColor}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Fase atual
              </p>
              <h2 className={`text-2xl font-bold ${phase.color}`}>{phase.name}</h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Dia do ciclo</p>
              <p className={`text-4xl font-black ${phase.color}`}>{info.dayOfCycle}</p>
              <p className="text-xs text-muted-foreground">de {config.averageCycleDuration}</p>
            </div>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{phase.description}</p>
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Início do ciclo</span>
              <span>Dia {config.averageCycleDuration}</span>
            </div>
            <Progress value={cycleProgress} className="h-2 [&>div]:bg-pink-500" />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-muted-foreground">Energia:</span>
            <span className={`font-semibold ${phase.color}`}>{phase.energy}</span>
          </div>
        </div>

        {/* Previsões */}
        <Card className="border-pink-100 dark:border-pink-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarHeart className="w-4 h-4 text-pink-500 dark:text-pink-400" />
              Previsões do ciclo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Próxima menstruação */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Próxima menstruação</p>
                <p className="font-semibold text-sm">
                  {formatDateShort(info.nextPeriodStart)} – {formatDateShort(info.nextPeriodEnd)}
                </p>
              </div>
              <div className="text-right px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-900/25 text-rose-500 dark:text-rose-400">
                {nextPeriodLabel}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Ovulação */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Ovulação estimada</p>
                <p className="font-semibold text-sm">
                  {formatDateShort(info.ovulationWindowStart)} – {formatDateShort(info.ovulationWindowEnd)}
                </p>
              </div>
              <div className="text-right px-3 py-1.5 rounded-xl text-xs font-bold bg-pink-50 dark:bg-pink-900/25 text-pink-600 dark:text-pink-400">
                Janela fértil
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground pt-1">
              * Estimativas baseadas no seu ciclo médio de {config.averageCycleDuration} dias. Não é método contraceptivo.
            </p>
          </CardContent>
        </Card>

        {/* Dicas — Nutrição */}
        <Card className="border-pink-100 dark:border-pink-900/50">
          <button
            onClick={() => setShowNutrition(v => !v)}
            className="w-full"
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-pink-500 dark:text-pink-400" />
                  {phase.nutritionTitle}
                </span>
                {showNutrition ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </CardTitle>
            </CardHeader>
          </button>
          {showNutrition && (
            <CardContent className="pt-0 space-y-2">
              {phase.nutrition.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-pink-500 dark:text-pink-400 mt-0.5">•</span>
                  <span>{tip}</span>
                </div>
              ))}
            </CardContent>
          )}
        </Card>

        {/* Dicas — Exercício */}
        <Card className="border-pink-100 dark:border-pink-900/50">
          <button
            onClick={() => setShowExercise(v => !v)}
            className="w-full"
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-pink-500 dark:text-pink-400" />
                  {phase.exerciseTitle}
                </span>
                {showExercise ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </CardTitle>
            </CardHeader>
          </button>
          {showExercise && (
            <CardContent className="pt-0 space-y-2">
              {phase.exercise.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-pink-500 dark:text-pink-400 mt-0.5">•</span>
                  <span>{tip}</span>
                </div>
              ))}
            </CardContent>
          )}
        </Card>

        {/* Dicas gerais da fase */}
        <Card className="!bg-pink-500 dark:!bg-pink-950/80 border-0 text-white">
          <CardHeader className="pb-1 pt-3">
            <CardTitle className="text-sm text-white/80 font-semibold uppercase tracking-wide">
              💡 Dicas para a fase {phase.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3 space-y-2">
            {phase.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-white/90">
                <span className="mt-0.5">✓</span>
                <span>{tip}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Reconfigurar */}
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 w-full py-3 text-sm text-pink-500 dark:text-pink-400 rounded-xl"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reconfigurar ciclo
        </button>
      </div>
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

export function CicloMenstrual() {
  const { cycleConfig, setCycleConfig } = useApp()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [configData, setConfigData] = useState<ConfigData | null>(null)

  // Já configurado → mostrar visão geral
  if (cycleConfig) {
    if (cycleConfig.isMenopausa) {
      return <MenopausaOverview onReset={() => setCycleConfig(null)} />
    }
    return (
      <CycleOverview
        config={cycleConfig}
        onReset={() => setCycleConfig(null)}
      />
    )
  }

  // Onboarding
  if (step === 1) return <OnboardingWelcome onNext={() => setStep(2)} />

  if (step === 2) {
    return (
      <OnboardingConfigure
        onNext={(data) => {
          setConfigData(data)
          setStep(3)
        }}
      />
    )
  }

  return (
    <OnboardingPreferences
      isMenopausa={configData?.isMenopausa}
      onComplete={(prefs) => {
        if (!configData) return
        setCycleConfig({ ...configData, ...prefs })
      }}
    />
  )
}
