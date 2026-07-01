import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/contexts/AppContext'
import { generateAIWorkoutPlan } from '@/lib/workout-generator'
import type { WorkoutGenerationOptions } from '@/lib/workout-generator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import type { WorkoutEnvironment, AIWorkoutDay, AIExercise, AIWorkoutPlan } from '@/types'
import { hasAccess } from '@/lib/subscription'
import { UpgradeGate } from '@/components/upgrade-gate'
import { ActivityStreak } from '@/components/activity-streak'
import { toast } from 'sonner'
import { useTranslation } from '@/contexts/LanguageContext'
import type { TranslationKeys } from '@/lib/i18n'
import {
  Dumbbell, Home, Building2, Sparkles,
  ChevronDown, ChevronUp, RotateCcw, AlertCircle, CheckCircle2, FileDown,
  Target, Timer, Repeat, Info, PlayCircle,
} from 'lucide-react'

const PLAN_DURATION_DAYS = 30

// Demonstração animada do exercício com skeleton enquanto o GIF carrega (vem do Supabase Storage).
function ExerciseGifImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className="relative w-full max-w-[260px] aspect-square mx-auto rounded-xl overflow-hidden bg-muted/40">
      {!loaded && <Skeleton className="absolute inset-0 h-full w-full rounded-xl" />}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        loading="lazy"
        className={`absolute inset-0 h-full w-full object-contain p-2 transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}

// IDs enviados para a IA (ficam em PT porque o prompt do GPT usa).
// Labels são traduzíveis via t.workouts.*
type MuscleKey = keyof TranslationKeys['workouts']['muscleGroups']
const MUSCLE_GROUPS: { id: string; key: MuscleKey }[] = [
  { id: 'Peito', key: 'chest' },
  { id: 'Costas', key: 'back' },
  { id: 'Ombros', key: 'shoulders' },
  { id: 'Bíceps', key: 'biceps' },
  { id: 'Tríceps', key: 'triceps' },
  { id: 'Abdômen / Core', key: 'abs' },
  { id: 'Glúteos', key: 'glutes' },
  { id: 'Quadríceps', key: 'quads' },
  { id: 'Posterior de coxa', key: 'hamstrings' },
  { id: 'Panturrilha', key: 'calves' },
]

type EquipmentKey = keyof TranslationKeys['workouts']['homeEquipment']
const HOME_EQUIPMENT: { id: string; key: EquipmentKey }[] = [
  { id: 'Halteres', key: 'dumbbells' },
  { id: 'Elásticos de resistência', key: 'bands' },
  { id: 'Barra fixa', key: 'pullupBar' },
  { id: 'Banco', key: 'bench' },
  { id: 'Kettlebell', key: 'kettlebell' },
  { id: 'Corda de pular', key: 'jumpRope' },
  { id: 'Colchonete', key: 'mat' },
  { id: 'Step / degrau', key: 'step' },
]

type PreferenceKey = keyof TranslationKeys['workouts']['preferences']
const WORKOUT_PREFERENCES: { id: string; key: PreferenceKey }[] = [
  { id: 'aerobico_hiit', key: 'aerobicHiit' },
  { id: 'maquinas', key: 'machines' },
  { id: 'sem_maquinas', key: 'freeWeights' },
  { id: 'misto', key: 'mixed' },
]

type ObjectiveKey = keyof TranslationKeys['workouts']['objectives']
const WORKOUT_OBJECTIVES: { id: string; key: ObjectiveKey }[] = [
  { id: 'perda_peso_resistencia', key: 'weightLoss' },
  { id: 'ganho_massa', key: 'muscleGain' },
  { id: 'definicao', key: 'definition' },
  { id: 'manutencao_saude', key: 'maintenance' },
  { id: 'resistencia_endurance', key: 'endurance' },
  { id: 'potencia_explosao', key: 'power' },
  { id: 'forca_pura', key: 'strength' },
]

type DurationKey = keyof TranslationKeys['workouts']['sessionDurations']
const SESSION_DURATIONS: { id: string; key: DurationKey }[] = [
  { id: '30', key: 'd30' },
  { id: '40', key: 'd40' },
  { id: '50', key: 'd50' },
  { id: '60', key: 'd60' },
]

function toggleItem(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]
}

function ChipButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border text-muted-foreground hover:border-primary/50'
      }`}
    >
      {label}
    </button>
  )
}

function daysElapsed(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24))
}

function printWorkoutPlan(plan: AIWorkoutPlan, userName: string) {
  const { plan: p, environment, generatedAt, measurements, muscleGroups } = plan
  const date = new Date(generatedAt).toLocaleDateString('pt-BR')
  const envLabel = environment === 'casa' ? 'Em Casa' : environment === 'misto' ? 'Misto (Casa + Academia)' : 'Academia'

  const measurementItems = [
    measurements.weight ? { label: 'Peso', value: `${measurements.weight} kg` } : null,
    measurements.waist  ? { label: 'Cintura', value: `${measurements.waist} cm` } : null,
    measurements.hips   ? { label: 'Quadril', value: `${measurements.hips} cm` } : null,
    measurements.chest  ? { label: 'Peito', value: `${measurements.chest} cm` } : null,
    measurements.arm    ? { label: 'Braço', value: `${measurements.arm} cm` } : null,
  ].filter(Boolean) as { label: string; value: string }[]

  const measurementsHtml = measurementItems.length
    ? measurementItems.map(m => `<div class="meas-item"><span class="meas-label">${m.label}</span><span class="meas-value">${m.value}</span></div>`).join('')
    : ''

  const daysHtml = p.days.map((day, di) => {
    const exercises = day.exercises.map((ex, i) => {
      const tags = [
        ex.sets && ex.reps ? `${ex.sets} × ${ex.reps}` : null,
        ex.duration ?? null,
        ex.restTime ? `↺ ${ex.restTime}` : null,
      ].filter(Boolean)
      return `
        <div class="ex-row">
          <div class="ex-num">${i + 1}</div>
          <div class="ex-body">
            <div class="ex-name">${ex.name}</div>
            ${tags.length ? `<div class="ex-tags">${tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
            ${ex.notes ? `<div class="ex-note">${ex.notes}</div>` : ''}
          </div>
        </div>`
    }).join('')
    return `
      <div class="day-card">
        <div class="day-header">
          <div class="day-badge">${String.fromCharCode(65 + di)}</div>
          <div class="day-info">
            <div class="day-name">${day.name}</div>
            <div class="day-focus">${day.focus}</div>
          </div>
          <div class="day-count">${day.exercises.length} exercícios</div>
        </div>
        <div class="ex-list">${exercises}</div>
      </div>`
  }).join('')

  const warmupHtml = p.warmup?.length ? `
    <div class="section-card warm">
      <div class="section-header"><span class="section-icon">🔥</span><span class="section-label">Aquecimento</span></div>
      <div class="section-items">
        ${p.warmup.map((item, i) => `<div class="section-item"><span class="item-num">${i + 1}</span>${item}</div>`).join('')}
      </div>
    </div>` : ''

  const cooldownHtml = p.cooldown?.length ? `
    <div class="section-card cool">
      <div class="section-header"><span class="section-icon">❄️</span><span class="section-label">Resfriamento & Alongamento</span></div>
      <div class="section-items">
        ${p.cooldown.map((item, i) => `<div class="section-item"><span class="item-num">${i + 1}</span>${item}</div>`).join('')}
      </div>
    </div>` : ''

  const tipsHtml = p.tips?.length ? `
    <div class="tips-card">
      <div class="tips-header">💡 Dicas do seu Personal</div>
      ${p.tips.map(tip => `<div class="tip-item">${tip}</div>`).join('')}
    </div>` : ''

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${p.title}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root {
    --green: #285B2C;
    --green-light: #3d7a42;
    --green-bg: #f0f7f0;
    --green-border: #c8e6c9;
    --gray-50: #f9fafb;
    --gray-100: #f3f4f6;
    --gray-200: #e5e7eb;
    --gray-400: #9ca3af;
    --gray-600: #4b5563;
    --gray-900: #111827;
    --radius: 10px;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    color: var(--gray-900);
    background: #fff;
    padding: 32px 36px;
    font-size: 13px;
    line-height: 1.5;
  }

  /* ── HEADER ── */
  .page-header {
    background: linear-gradient(135deg, var(--green) 0%, var(--green-light) 100%);
    border-radius: var(--radius);
    padding: 20px 24px;
    color: white;
    margin-bottom: 20px;
    display: flex;
    gap: 20px;
    align-items: center;
  }
  .header-logo {
    width: 64px;
    height: 64px;
    object-fit: contain;
    flex-shrink: 0;
    filter: drop-shadow(0 2px 6px rgba(0,0,0,0.25));
  }
  .header-body { flex: 1; min-width: 0; }
  .header-app { font-size: 10px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; opacity: 0.75; margin-bottom: 4px; }
  .header-title { font-size: 19px; font-weight: 800; line-height: 1.2; margin-bottom: 4px; }
  .header-desc { font-size: 11.5px; opacity: 0.85; line-height: 1.4; }
  .header-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  .meta-pill {
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 20px;
    padding: 2px 10px;
    font-size: 10.5px;
    font-weight: 500;
  }

  /* ── STATS BAR ── */
  .stats-bar {
    display: flex;
    gap: 1px;
    background: var(--gray-200);
    border-radius: var(--radius);
    overflow: hidden;
    margin-bottom: 20px;
  }
  .stat-item {
    flex: 1;
    background: var(--gray-50);
    padding: 12px 8px;
    text-align: center;
  }
  .stat-value { font-size: 22px; font-weight: 800; color: var(--green); line-height: 1; }
  .stat-label { font-size: 10px; color: var(--gray-600); margin-top: 3px; font-weight: 500; }

  /* ── MEASUREMENTS ── */
  .meas-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
  }
  .meas-item {
    background: var(--green-bg);
    border: 1px solid var(--green-border);
    border-radius: 8px;
    padding: 6px 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 68px;
  }
  .meas-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--green); }
  .meas-value { font-size: 13px; font-weight: 700; color: var(--gray-900); }

  /* ── MUSCLE PRIORITIES ── */
  .priorities {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 20px;
    align-items: center;
  }
  .priorities-label { font-size: 10px; font-weight: 600; color: var(--gray-600); text-transform: uppercase; letter-spacing: 0.5px; margin-right: 2px; }
  .priority-chip {
    background: var(--green);
    color: white;
    border-radius: 20px;
    padding: 2px 10px;
    font-size: 10.5px;
    font-weight: 600;
  }

  /* ── SECTION TITLE ── */
  .section-title {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--gray-400);
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--gray-200);
  }

  /* ── DAY CARDS ── */
  .days-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
  .day-card {
    border: 1px solid var(--gray-200);
    border-radius: var(--radius);
    overflow: hidden;
    page-break-inside: avoid;
  }
  .day-header {
    background: var(--gray-50);
    border-bottom: 1px solid var(--gray-200);
    padding: 10px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .day-badge {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: var(--green);
    color: white;
    font-size: 13px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .day-info { flex: 1; min-width: 0; }
  .day-name { font-size: 11.5px; font-weight: 700; color: var(--gray-900); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .day-focus { font-size: 10px; color: var(--gray-600); }
  .day-count { font-size: 9.5px; color: var(--green); font-weight: 600; background: var(--green-bg); border-radius: 6px; padding: 2px 6px; white-space: nowrap; }
  .ex-list { padding: 4px 0; }
  .ex-row {
    display: flex;
    gap: 8px;
    padding: 7px 12px;
    border-bottom: 1px solid var(--gray-100);
    align-items: flex-start;
  }
  .ex-row:last-child { border-bottom: none; }
  .ex-num {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--green-bg);
    color: var(--green);
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .ex-body { flex: 1; min-width: 0; }
  .ex-name { font-size: 11.5px; font-weight: 600; color: var(--gray-900); }
  .ex-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 3px; }
  .tag {
    background: var(--gray-100);
    border-radius: 4px;
    padding: 1px 6px;
    font-size: 9.5px;
    font-weight: 500;
    color: var(--gray-600);
  }
  .ex-note { font-size: 9.5px; color: var(--gray-400); margin-top: 2px; font-style: italic; line-height: 1.3; }

  /* ── PREP SECTIONS ── */
  .prep-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 12px; }
  .section-card {
    border-radius: var(--radius);
    overflow: hidden;
    page-break-inside: avoid;
    border: 1px solid var(--gray-200);
  }
  .section-header {
    padding: 9px 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 700;
  }
  .warm .section-header { background: #fff7ed; color: #c2410c; border-bottom: 1px solid #fed7aa; }
  .cool .section-header { background: #eff6ff; color: #1d4ed8; border-bottom: 1px solid #bfdbfe; }
  .section-icon { font-size: 13px; }
  .section-items { padding: 8px 12px; background: var(--gray-50); }
  .section-item { display: flex; gap: 8px; padding: 3px 0; font-size: 11px; color: var(--gray-600); align-items: flex-start; line-height: 1.4; }
  .item-num { min-width: 16px; font-weight: 700; color: var(--gray-400); font-size: 10px; padding-top: 1px; }

  /* ── TIPS ── */
  .tips-card {
    background: var(--green-bg);
    border: 1px solid var(--green-border);
    border-radius: var(--radius);
    padding: 14px 16px;
    page-break-inside: avoid;
    margin-bottom: 20px;
  }
  .tips-header { font-size: 11.5px; font-weight: 700; color: var(--green); margin-bottom: 10px; }
  .tip-item { font-size: 11px; color: #2d4a2f; padding: 3px 0; line-height: 1.4; }
  .tip-item + .tip-item { border-top: 1px solid var(--green-border); padding-top: 6px; margin-top: 3px; }

  /* ── FOOTER ── */
  .page-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid var(--gray-200);
    font-size: 10px;
    color: var(--gray-400);
  }
  .footer-brand { font-weight: 600; color: var(--green); }

  @media print {
    body { padding: 16px 20px; }
    @page { margin: 0.8cm; size: A4; }
    .days-grid { grid-template-columns: repeat(2, 1fr); }
    .prep-grid { grid-template-columns: repeat(2, 1fr); }
  }
</style>
</head>
<body>

<!-- HEADER -->
<div class="page-header">
  <img class="header-logo" src="https://vmfhhwbbwnotugnrdjpm.supabase.co/storage/v1/object/public/icons_app/treino.png" alt="BEM.ai" />
  <div class="header-body">
    <div class="header-app">BEM.ai · Plano de Treino</div>
    <div class="header-title">${p.title}</div>
    <div class="header-desc">${p.description}</div>
    <div class="header-meta">
      <span class="meta-pill">👤 ${userName}</span>
      <span class="meta-pill">${environment === 'casa' ? '🏠' : environment === 'misto' ? '🏠🏋️' : '🏋️'} ${envLabel}</span>
      <span class="meta-pill">📅 ${date}</span>
      <span class="meta-pill">🗓 30 dias</span>
    </div>
  </div>
</div>

<!-- STATS -->
<div class="stats-bar">
  <div class="stat-item">
    <div class="stat-value">${p.daysPerWeek}×</div>
    <div class="stat-label">por semana</div>
  </div>
  <div class="stat-item">
    <div class="stat-value">${p.sessionDuration}</div>
    <div class="stat-label">min por sessão</div>
  </div>
  <div class="stat-item">
    <div class="stat-value">${p.days.length}</div>
    <div class="stat-label">dias de treino</div>
  </div>
  <div class="stat-item">
    <div class="stat-value">${p.days.reduce((acc, d) => acc + d.exercises.length, 0)}</div>
    <div class="stat-label">exercícios total</div>
  </div>
</div>

${measurementsHtml ? `
<!-- MEDIDAS -->
<div class="meas-bar">${measurementsHtml}</div>
` : ''}

${muscleGroups?.length ? `
<!-- PRIORIDADES -->
<div class="priorities">
  <span class="priorities-label">Foco:</span>
  ${muscleGroups.map(m => `<span class="priority-chip">${m}</span>`).join('')}
</div>
` : ''}

<!-- DIAS DE TREINO -->
<div class="section-title">Dias de Treino</div>
<div class="days-grid">${daysHtml}</div>

<!-- AQUECIMENTO & RESFRIAMENTO -->
${(warmupHtml || cooldownHtml) ? `<div class="section-title">Aquecimento & Resfriamento</div><div class="prep-grid">${warmupHtml}${cooldownHtml}</div>` : ''}

<!-- DICAS -->
${tipsHtml}

<!-- FOOTER -->
<div class="page-footer">
  <span class="footer-brand">BEM.ai</span>
  <span>Gerado em ${date} · Válido por 30 dias</span>
</div>

<script>window.onload = () => { window.print() }<\/script>
</body>
</html>`

  // Usa Blob com UTF-8 explícito para garantir que emojis e acentos sejam renderizados corretamente
  const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank', 'width=960,height=720')
  if (win) {
    win.addEventListener('load', () => URL.revokeObjectURL(url), { once: true })
  }
}

/**
 * Persiste os checks do treino no localStorage com reset diário automático.
 * Chave: `bemai_workout_checks_${dayName}` → `{ date: 'YYYY-MM-DD', checks: boolean[] }`
 */
function loadChecksForDay(dayName: string, length: number): boolean[] {
  try {
    const raw = localStorage.getItem(`bemai_workout_checks_${dayName}`)
    if (!raw) return Array(length).fill(false)
    const parsed = JSON.parse(raw) as { date: string; checks: boolean[] }
    const today = new Date().toISOString().split('T')[0]
    if (parsed.date !== today) return Array(length).fill(false) // reset diário
    if (!Array.isArray(parsed.checks) || parsed.checks.length !== length) return Array(length).fill(false)
    return parsed.checks
  } catch {
    return Array(length).fill(false)
  }
}

function saveChecksForDay(dayName: string, checks: boolean[]) {
  try {
    const today = new Date().toISOString().split('T')[0]
    localStorage.setItem(`bemai_workout_checks_${dayName}`, JSON.stringify({ date: today, checks }))
  } catch { /* ignore */ }
}

function WorkoutDayCard({ day, index }: { day: AIWorkoutDay; index: number }) {
  const { t } = useTranslation()
  const tw = t.workouts
  const [open, setOpen] = useState(index === 0)
  const [checked, setChecked] = useState<boolean[]>(() => loadChecksForDay(day.name, day.exercises.length))
  const [detailExercise, setDetailExercise] = useState<{ ex: AIExercise; position: number } | null>(null)

  // Persiste a cada mudança
  useEffect(() => {
    saveChecksForDay(day.name, checked)
  }, [day.name, checked])

  const doneCount = checked.filter(Boolean).length
  const allDone = doneCount === day.exercises.length
  const progress = Math.round((doneCount / day.exercises.length) * 100)

  const toggle = (i: number) => setChecked(prev => prev.map((v, idx) => idx === i ? !v : v))

  return (
    <>
      <Card className={`transition-colors ${allDone ? 'border-primary bg-primary/5' : ''}`}>
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-left"
          onClick={() => setOpen(v => !v)}
        >
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm flex items-center gap-1.5">
              {allDone && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
              <span className="truncate">{day.name}</span>
            </p>
            <p className="text-xs text-muted-foreground truncate">{day.focus}</p>
            {/* Barra de progresso */}
            {!allDone && doneCount > 0 && (
              <div className="w-full h-1 bg-muted rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <Badge variant={allDone ? 'default' : 'secondary'} className="text-xs">
              {doneCount}/{day.exercises.length}
            </Badge>
            {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>

        {open && (
          <CardContent className="pt-0 pb-4 space-y-2">
            <div className="h-px bg-border" />
            {day.exercises.map((ex, i) => (
              <div
                key={i}
                className={`group rounded-xl border transition-all ${
                  checked[i]
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <div className="flex gap-3 p-3">
                  {/* Check circle — grande, tocável */}
                  <button
                    onClick={() => toggle(i)}
                    aria-label={checked[i] ? tw.card.unmarkDone : tw.card.markDone}
                    className={`shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all ${
                      checked[i]
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground hover:border-primary hover:text-primary'
                    }`}
                  >
                    {checked[i] ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm leading-snug ${checked[i] ? 'line-through opacity-60' : ''}`}>
                      {ex.name}
                    </p>

                    {/* Badges: sets/reps/rest */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {ex.sets && ex.reps && (
                        <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-2.5 py-0.5 font-semibold">
                          <Repeat className="w-3 h-3" />
                          {ex.sets} × {ex.reps}
                        </span>
                      )}
                      {!ex.reps && ex.duration && (
                        <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-2.5 py-0.5 font-semibold">
                          <Timer className="w-3 h-3" />
                          {ex.duration}
                        </span>
                      )}
                      {ex.restTime && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
                          <Target className="w-3 h-3" />
                          {ex.restTime}
                        </span>
                      )}
                    </div>

                    {/* Descrição preview + botão "ver detalhes" (com demonstração animada) */}
                    {(ex.notes || ex.gifUrl) && !checked[i] && (
                      <>
                        {ex.notes && (
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                            {ex.notes}
                          </p>
                        )}
                        <button
                          onClick={() => setDetailExercise({ ex, position: i + 1 })}
                          className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          {ex.gifUrl ? <PlayCircle className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                          {ex.gifUrl ? 'Ver demonstração' : tw.card.viewFullDescription}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {allDone && (
              <div className="flex items-center justify-center gap-2 pt-2 text-sm font-semibold text-primary">
                <CheckCircle2 className="w-5 h-5" />
                {tw.card.complete}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Modal de descrição detalhada do exercício */}
      <Dialog open={!!detailExercise} onOpenChange={(o) => { if (!o) setDetailExercise(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-start gap-2">
              <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                {detailExercise?.position}
              </span>
              <span>{detailExercise?.ex.name}</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              {tw.card.viewFullDescription}
            </DialogDescription>
          </DialogHeader>
          {detailExercise && (
            <div className="space-y-4">
              {/* Demonstração animada (GIF da biblioteca de exercícios) com skeleton no carregamento */}
              {detailExercise.ex.gifUrl && (
                <ExerciseGifImage
                  src={detailExercise.ex.gifUrl}
                  alt={`Demonstração: ${detailExercise.ex.name}`}
                />
              )}

              {/* Badges de séries */}
              <div className="flex flex-wrap gap-2">
                {detailExercise.ex.sets && detailExercise.ex.reps && (
                  <span className="inline-flex items-center gap-1.5 text-sm bg-primary/10 text-primary rounded-full px-3 py-1 font-semibold">
                    <Repeat className="w-4 h-4" />
                    {detailExercise.ex.sets} {tw.exerciseModal.setsUnit} × {detailExercise.ex.reps}
                  </span>
                )}
                {!detailExercise.ex.reps && detailExercise.ex.duration && (
                  <span className="inline-flex items-center gap-1.5 text-sm bg-primary/10 text-primary rounded-full px-3 py-1 font-semibold">
                    <Timer className="w-4 h-4" />
                    {detailExercise.ex.duration}
                  </span>
                )}
                {detailExercise.ex.restTime && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground bg-muted rounded-full px-3 py-1">
                    <Target className="w-4 h-4" />
                    {tw.exerciseModal.rest} {detailExercise.ex.restTime}
                  </span>
                )}
              </div>

              {/* Descrição técnica completa */}
              {detailExercise.ex.notes && (
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                    {tw.exerciseModal.howToExecute}
                  </p>
                  <p className="text-sm leading-relaxed text-foreground">
                    {detailExercise.ex.notes}
                  </p>
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                {tw.exerciseModal.safetyNote}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Shared setup form ─────────────────────────────────────────────────────────

interface SetupFormProps {
  env: WorkoutEnvironment
  setEnv: (e: WorkoutEnvironment) => void
  mistoHomeSessions: number
  setMistoHomeSessions: (v: number) => void
  mistoAcadSessions: number
  setMistoAcadSessions: (v: number) => void
  workoutPreference: string
  setWorkoutPreference: (v: string) => void
  workoutCount: number
  setWorkoutCount: (v: number) => void
  addAerobic: boolean
  setAddAerobic: (v: boolean) => void
  sessionDuration: string
  setSessionDuration: (v: string) => void
  muscleGroups: string[]
  setMuscleGroups: (v: string[]) => void
  objectives: string[]
  setObjectives: (v: string[]) => void
  homeEquipment: string[]
  setHomeEquipment: (v: string[]) => void
  otherEquipment: string
  setOtherEquipment: (v: string) => void
  weight: string
  setWeight: (v: string) => void
  waist: string
  setWaist: (v: string) => void
  hips: string
  setHips: (v: string) => void
  chest: string
  setChest: (v: string) => void
  arm: string
  setArm: (v: string) => void
  showMeasurements: boolean
}

function SetupForm({
  env, setEnv,
  mistoHomeSessions, setMistoHomeSessions,
  mistoAcadSessions, setMistoAcadSessions,
  workoutPreference, setWorkoutPreference,
  workoutCount, setWorkoutCount,
  addAerobic, setAddAerobic,
  sessionDuration, setSessionDuration,
  muscleGroups, setMuscleGroups,
  objectives, setObjectives,
  homeEquipment, setHomeEquipment,
  otherEquipment, setOtherEquipment,
  weight, setWeight, waist, setWaist, hips, setHips, chest, setChest, arm, setArm,
  showMeasurements,
}: SetupFormProps) {
  const { t } = useTranslation()
  const tw = t.workouts
  const showHome = env === 'casa' || env === 'misto'

  const handleObjective = (id: string) => {
    if (objectives.includes(id)) setObjectives(objectives.filter(x => x !== id))
    else if (objectives.length < 3) setObjectives([...objectives, id])
  }

  return (
    <div className="space-y-4">
      {/* Ambiente */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{tw.setup.envTitle}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-2 pt-0">
          {[
            { id: 'casa', label: tw.setup.envHome, icon: <Home className="w-5 h-5" /> },
            { id: 'academia', label: tw.setup.envGym, icon: <Building2 className="w-5 h-5" /> },
            { id: 'misto', label: tw.setup.envMixed, icon: <Dumbbell className="w-5 h-5" /> },
          ].map(e => (
            <button
              key={e.id}
              onClick={() => setEnv(e.id as WorkoutEnvironment)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${
                env === e.id ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <span className={env === e.id ? 'text-primary' : 'text-muted-foreground'}>{e.icon}</span>
              <span className={`text-xs font-semibold ${env === e.id ? 'text-primary' : 'text-muted-foreground'}`}>
                {e.label}
              </span>
            </button>
          ))}
        </CardContent>
        {env === 'misto' && (
          <CardContent className="pt-0 pb-4">
            <p className="text-xs text-muted-foreground mb-2">{tw.setup.mixedSessionsLabel}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1"><Home className="w-3 h-3" />{tw.setup.mixedHome}</Label>
                <div className="flex gap-1.5">
                  {[1, 2, 3].map(n => (
                    <button
                      key={n}
                      onClick={() => setMistoHomeSessions(n)}
                      className={`w-9 h-9 rounded-lg text-sm font-bold border-2 transition-all ${mistoHomeSessions === n ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}
                    >{n}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1"><Building2 className="w-3 h-3" />{tw.setup.mixedGym}</Label>
                <div className="flex gap-1.5">
                  {[1, 2, 3].map(n => (
                    <button
                      key={n}
                      onClick={() => setMistoAcadSessions(n)}
                      className={`w-9 h-9 rounded-lg text-sm font-bold border-2 transition-all ${mistoAcadSessions === n ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}
                    >{n}</button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Preferência de treino */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{tw.setup.preferenceTitle}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {WORKOUT_PREFERENCES.map(p => (
              <ChipButton
                key={p.id}
                label={tw.preferences[p.key]}
                selected={workoutPreference === p.id}
                onClick={() => setWorkoutPreference(p.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quantidade de treinos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{tw.setup.countTitle}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setWorkoutCount(n)}
                className={`w-10 h-10 rounded-xl text-sm font-bold border-2 transition-all ${workoutCount === n ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}
              >{n}</button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Interesse em adicionar aeróbico */}
      {workoutPreference !== 'aerobico_hiit' && (
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{tw.setup.aerobicInterest}</p>
              <p className="text-xs text-muted-foreground">{tw.setup.aerobicDesc}</p>
            </div>
            <button
              type="button"
              onClick={() => setAddAerobic(!addAerobic)}
              className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${addAerobic ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${addAerobic ? 'left-6' : 'left-0.5'}`} />
            </button>
          </CardContent>
        </Card>
      )}

      {/* Preferência por tempo de treino */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{tw.setup.durationTitle}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {SESSION_DURATIONS.map(d => (
              <ChipButton
                key={d.id}
                label={tw.sessionDurations[d.key]}
                selected={sessionDuration === d.id}
                onClick={() => setSessionDuration(d.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Equipamentos (em casa ou misto) */}
      {showHome && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{tw.setup.equipmentTitle}</CardTitle>
            <p className="text-xs text-muted-foreground">{tw.setup.equipmentSub}</p>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex flex-wrap gap-2">
              {HOME_EQUIPMENT.map(eq => (
                <ChipButton
                  key={eq.id}
                  label={tw.homeEquipment[eq.key]}
                  selected={homeEquipment.includes(eq.id)}
                  onClick={() => setHomeEquipment(toggleItem(homeEquipment, eq.id))}
                />
              ))}
            </div>
            <Input
              placeholder={tw.setup.equipmentOther}
              value={otherEquipment}
              onChange={e => setOtherEquipment(e.target.value)}
              className="text-xs"
            />
          </CardContent>
        </Card>
      )}

      {/* Grupos musculares prioritários */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{tw.setup.muscleTitle}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {MUSCLE_GROUPS.map(mg => (
              <ChipButton
                key={mg.id}
                label={tw.muscleGroups[mg.key]}
                selected={muscleGroups.includes(mg.id)}
                onClick={() => setMuscleGroups(toggleItem(muscleGroups, mg.id))}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Objetivo do treino */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{tw.setup.objectiveTitle}</CardTitle>
          <p className="text-xs text-muted-foreground">{tw.setup.objectiveSub}</p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {WORKOUT_OBJECTIVES.map(obj => (
              <ChipButton
                key={obj.id}
                label={tw.objectives[obj.key]}
                selected={objectives.includes(obj.id)}
                onClick={() => handleObjective(obj.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Medidas */}
      {showMeasurements && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-1.5">
              <Label>{tw.setup.weightLabel}</Label>
              <Input type="number" placeholder={tw.setup.weightPlaceholder} value={weight} onChange={e => setWeight(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">{tw.setup.measurementsTitle}</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">{tw.setup.waistLabel}</Label>
                <Input type="number" placeholder="72" value={waist} onChange={e => setWaist(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{tw.setup.hipsLabel}</Label>
                <Input type="number" placeholder="95" value={hips} onChange={e => setHips(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{tw.setup.chestLabel}</Label>
                <Input type="number" placeholder="88" value={chest} onChange={e => setChest(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{tw.setup.armLabel}</Label>
                <Input type="number" placeholder="32" value={arm} onChange={e => setArm(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground font-bold leading-relaxed mt-2 px-1">
        {tw.setup.medicalDisclaimer}
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function Workouts() {
  const { user, aiWorkoutPlan, saveAiWorkoutPlan, clearAiWorkoutPlan } = useApp()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const tw = t.workouts
  const canGenerate = hasAccess(user, 'ai-workout')

  // ── Workout form preferences — persisted in localStorage ──
  function wfRead<T>(key: string, fallback: T): T {
    try {
      const v = localStorage.getItem(`bemai_wf_${key}`)
      return v !== null ? (JSON.parse(v) as T) : fallback
    } catch { return fallback }
  }

  // Initial generation form state
  const [selectedEnv, setSelectedEnv] = useState<WorkoutEnvironment>(() => wfRead('env', 'casa' as WorkoutEnvironment))
  const [selectedMistoHome, setSelectedMistoHome] = useState(() => wfRead('mistoHome', 1))
  const [selectedMistoAcad, setSelectedMistoAcad] = useState(() => wfRead('mistoAcad', 2))
  const [selectedPreference, setSelectedPreference] = useState(() => wfRead('pref', 'misto'))
  const [selectedCount, setSelectedCount] = useState(() => wfRead('count', 3))
  const [selectedAddAerobic, setSelectedAddAerobic] = useState(() => wfRead('aerobic', false))
  const [selectedDuration, setSelectedDuration] = useState(() => wfRead('duration', '50'))
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>(() => wfRead('muscles', []))
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>(() => wfRead('objectives', []))
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(() => wfRead('equipment', []))
  const [selectedOtherEquip, setSelectedOtherEquip] = useState(() => wfRead('otherEquip', ''))

  // Renewal form state
  const [renewEnv, setRenewEnv] = useState<WorkoutEnvironment>(() => wfRead('renv', 'casa' as WorkoutEnvironment))
  const [renewMistoHome, setRenewMistoHome] = useState(() => wfRead('rmistoHome', 1))
  const [renewMistoAcad, setRenewMistoAcad] = useState(() => wfRead('rmistoAcad', 2))
  const [renewPreference, setRenewPreference] = useState(() => wfRead('rpref', 'misto'))
  const [renewCount, setRenewCount] = useState(() => wfRead('rcount', 3))
  const [renewAddAerobic, setRenewAddAerobic] = useState(() => wfRead('raerobic', false))
  const [renewDuration, setRenewDuration] = useState(() => wfRead('rduration', '50'))
  const [renewMuscles, setRenewMuscles] = useState<string[]>(() => wfRead('rmuscles', []))
  const [renewObjectives, setRenewObjectives] = useState<string[]>(() => wfRead('robjectives', []))
  const [renewEquipment, setRenewEquipment] = useState<string[]>(() => wfRead('requipment', []))
  const [renewOtherEquip, setRenewOtherEquip] = useState(() => wfRead('rotherEquip', ''))
  const [renewWeight, setRenewWeight] = useState('')
  const [renewWaist, setRenewWaist] = useState('')
  const [renewHips, setRenewHips] = useState('')
  const [renewChest, setRenewChest] = useState('')
  const [renewArm, setRenewArm] = useState('')

  // Persist workout form preferences to localStorage
  useEffect(() => { localStorage.setItem('bemai_wf_env', JSON.stringify(selectedEnv)) }, [selectedEnv])
  useEffect(() => { localStorage.setItem('bemai_wf_mistoHome', JSON.stringify(selectedMistoHome)) }, [selectedMistoHome])
  useEffect(() => { localStorage.setItem('bemai_wf_mistoAcad', JSON.stringify(selectedMistoAcad)) }, [selectedMistoAcad])
  useEffect(() => { localStorage.setItem('bemai_wf_pref', JSON.stringify(selectedPreference)) }, [selectedPreference])
  useEffect(() => { localStorage.setItem('bemai_wf_count', JSON.stringify(selectedCount)) }, [selectedCount])
  useEffect(() => { localStorage.setItem('bemai_wf_aerobic', JSON.stringify(selectedAddAerobic)) }, [selectedAddAerobic])
  useEffect(() => { localStorage.setItem('bemai_wf_duration', JSON.stringify(selectedDuration)) }, [selectedDuration])
  useEffect(() => { localStorage.setItem('bemai_wf_muscles', JSON.stringify(selectedMuscles)) }, [selectedMuscles])
  useEffect(() => { localStorage.setItem('bemai_wf_objectives', JSON.stringify(selectedObjectives)) }, [selectedObjectives])
  useEffect(() => { localStorage.setItem('bemai_wf_equipment', JSON.stringify(selectedEquipment)) }, [selectedEquipment])
  useEffect(() => { localStorage.setItem('bemai_wf_otherEquip', JSON.stringify(selectedOtherEquip)) }, [selectedOtherEquip])
  useEffect(() => { localStorage.setItem('bemai_wf_renv', JSON.stringify(renewEnv)) }, [renewEnv])
  useEffect(() => { localStorage.setItem('bemai_wf_rmistoHome', JSON.stringify(renewMistoHome)) }, [renewMistoHome])
  useEffect(() => { localStorage.setItem('bemai_wf_rmistoAcad', JSON.stringify(renewMistoAcad)) }, [renewMistoAcad])
  useEffect(() => { localStorage.setItem('bemai_wf_rpref', JSON.stringify(renewPreference)) }, [renewPreference])
  useEffect(() => { localStorage.setItem('bemai_wf_rcount', JSON.stringify(renewCount)) }, [renewCount])
  useEffect(() => { localStorage.setItem('bemai_wf_raerobic', JSON.stringify(renewAddAerobic)) }, [renewAddAerobic])
  useEffect(() => { localStorage.setItem('bemai_wf_rduration', JSON.stringify(renewDuration)) }, [renewDuration])
  useEffect(() => { localStorage.setItem('bemai_wf_rmuscles', JSON.stringify(renewMuscles)) }, [renewMuscles])
  useEffect(() => { localStorage.setItem('bemai_wf_robjectives', JSON.stringify(renewObjectives)) }, [renewObjectives])
  useEffect(() => { localStorage.setItem('bemai_wf_requipment', JSON.stringify(renewEquipment)) }, [renewEquipment])
  useEffect(() => { localStorage.setItem('bemai_wf_rotherEquip', JSON.stringify(renewOtherEquip)) }, [renewOtherEquip])

  const [generating, setGenerating] = useState(false)
  const [showRenewal, setShowRenewal] = useState(false)
  const [showPrep, setShowPrep] = useState(false)

  const elapsed = aiWorkoutPlan ? daysElapsed(aiWorkoutPlan.generatedAt) : 0
  const isExpired = elapsed >= PLAN_DURATION_DAYS
  const progressPct = Math.min(100, (elapsed / PLAN_DURATION_DAYS) * 100)

  function buildOptions(
    preference: string, count: number, addAerobic: boolean,
    duration: string,
    mistoHome: number, mistoAcad: number,
    objectives: string[]
  ): WorkoutGenerationOptions {
    return {
      workoutPreference: preference,
      objectives,
      workoutCount: count,
      addAerobic,
      sessionDurationPref: duration,
      mistoHomeSessions: mistoHome,
      mistoAcadSessions: mistoAcad,
    }
  }

  const handleGenerate = async () => {
    if (!user) return
    if (!canGenerate) { navigate('/planos'); return }
    setGenerating(true)
    const equipment = selectedOtherEquip.trim()
      ? [...selectedEquipment, selectedOtherEquip.trim()]
      : selectedEquipment
    try {
      const plan = await generateAIWorkoutPlan(
        user, selectedEnv,
        { weight: user.currentWeight },
        selectedMuscles,
        equipment,
        buildOptions(selectedPreference, selectedCount, selectedAddAerobic, selectedDuration, selectedMistoHome, selectedMistoAcad, selectedObjectives)
      )
      saveAiWorkoutPlan(plan)
      toast.success(tw.generating.toastSuccess, { description: plan.plan.title })
    } catch (err: unknown) {
      toast.error(tw.generating.toastError, { description: err instanceof Error ? err.message : tw.generating.toastErrorDefault })
    } finally {
      setGenerating(false)
    }
  }

  const handleRenew = async () => {
    if (!user) return
    if (!canGenerate) { navigate('/planos'); return }
    const weight = parseFloat(renewWeight)
    if (!renewWeight || isNaN(weight) || weight < 20) { toast.error(tw.generating.toastInvalidWeight); return }
    setGenerating(true)
    setShowRenewal(false)
    const equipment = renewOtherEquip.trim()
      ? [...renewEquipment, renewOtherEquip.trim()]
      : renewEquipment
    try {
      const plan = await generateAIWorkoutPlan(user, renewEnv, {
        weight,
        waist: renewWaist ? parseFloat(renewWaist) : undefined,
        hips: renewHips ? parseFloat(renewHips) : undefined,
        chest: renewChest ? parseFloat(renewChest) : undefined,
        arm: renewArm ? parseFloat(renewArm) : undefined,
      }, renewMuscles, equipment,
        buildOptions(renewPreference, renewCount, renewAddAerobic, renewDuration, renewMistoHome, renewMistoAcad, renewObjectives)
      )
      saveAiWorkoutPlan(plan)
      setRenewWeight(''); setRenewWaist(''); setRenewHips(''); setRenewChest(''); setRenewArm('')
      toast.success(tw.generating.toastRenewSuccess, { description: plan.plan.title })
    } catch (err: unknown) {
      toast.error(tw.generating.toastError, { description: err instanceof Error ? err.message : tw.generating.toastErrorDefault })
    } finally {
      setGenerating(false)
    }
  }

  // ── Generating ──
  if (generating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">{tw.generating.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{tw.generating.subtitle}</p>
        </div>
      </div>
    )
  }

  // ── Renewal form ──
  if (showRenewal) {
    return (
      <div className="min-h-screen p-4 pb-28">
        <div className="max-w-sm mx-auto space-y-4 pt-4">
          <button className="text-sm text-muted-foreground" onClick={() => setShowRenewal(false)}>{tw.renewal.back}</button>
          <div>
            <h2 className="font-display text-xl font-extrabold tracking-tight">{tw.renewal.title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{tw.renewal.subtitle}</p>
          </div>

          <SetupForm
            env={renewEnv} setEnv={setRenewEnv}
            mistoHomeSessions={renewMistoHome} setMistoHomeSessions={setRenewMistoHome}
            mistoAcadSessions={renewMistoAcad} setMistoAcadSessions={setRenewMistoAcad}
            workoutPreference={renewPreference} setWorkoutPreference={setRenewPreference}
            workoutCount={renewCount} setWorkoutCount={setRenewCount}
            addAerobic={renewAddAerobic} setAddAerobic={setRenewAddAerobic}
            sessionDuration={renewDuration} setSessionDuration={setRenewDuration}
            muscleGroups={renewMuscles} setMuscleGroups={setRenewMuscles}
            objectives={renewObjectives} setObjectives={setRenewObjectives}
            homeEquipment={renewEquipment} setHomeEquipment={setRenewEquipment}
            otherEquipment={renewOtherEquip} setOtherEquipment={setRenewOtherEquip}
            weight={renewWeight} setWeight={setRenewWeight}
            waist={renewWaist} setWaist={setRenewWaist}
            hips={renewHips} setHips={setRenewHips}
            chest={renewChest} setChest={setRenewChest}
            arm={renewArm} setArm={setRenewArm}
            showMeasurements={true}
          />

          <Button onClick={handleRenew} className="w-full" size="lg">
            <Sparkles className="w-4 h-4 mr-2" />
            {tw.renewal.ctaButton}
          </Button>
        </div>
      </div>
    )
  }

  // ── No plan ──
  if (!aiWorkoutPlan) {
    if (!canGenerate) {
      return (
        <UpgradeGate
          featureName={t.trial.upgradeGate.workoutFeatureName}
          description={t.trial.upgradeGate.workoutDescription}
          icon={<Dumbbell className="w-9 h-9 text-primary" />}
        />
      )
    }
    return (
      <div className="min-h-screen p-4 pb-28">
        <div className="w-full max-w-sm mx-auto space-y-5 pt-4">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Dumbbell className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">{tw.empty.title}</h1>
            <p className="text-sm text-muted-foreground">{tw.empty.subtitle}</p>
          </div>

          <SetupForm
            env={selectedEnv} setEnv={setSelectedEnv}
            mistoHomeSessions={selectedMistoHome} setMistoHomeSessions={setSelectedMistoHome}
            mistoAcadSessions={selectedMistoAcad} setMistoAcadSessions={setSelectedMistoAcad}
            workoutPreference={selectedPreference} setWorkoutPreference={setSelectedPreference}
            workoutCount={selectedCount} setWorkoutCount={setSelectedCount}
            addAerobic={selectedAddAerobic} setAddAerobic={setSelectedAddAerobic}
            sessionDuration={selectedDuration} setSessionDuration={setSelectedDuration}
            muscleGroups={selectedMuscles} setMuscleGroups={setSelectedMuscles}
            objectives={selectedObjectives} setObjectives={setSelectedObjectives}
            homeEquipment={selectedEquipment} setHomeEquipment={setSelectedEquipment}
            otherEquipment={selectedOtherEquip} setOtherEquipment={setSelectedOtherEquip}
            weight={''} setWeight={() => {}}
            waist={''} setWaist={() => {}}
            hips={''} setHips={() => {}}
            chest={''} setChest={() => {}}
            arm={''} setArm={() => {}}
            showMeasurements={false}
          />

          <Button onClick={handleGenerate} className="w-full uppercase font-bold tracking-wide" size="lg">
            <Sparkles className="w-4 h-4 mr-2" />
            {tw.empty.ctaButton}
          </Button>
        </div>
      </div>
    )
  }

  // ── Has plan ──
  const { plan, environment } = aiWorkoutPlan

  return (
    <div className="min-h-screen">
      <div className="max-w-lg mx-auto px-4 pt-8 pb-28 space-y-3">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">
              {user?.gender === 'feminino' ? tw.dashboard.readyFemale : tw.dashboard.readyMale}
            </h1>
            <p className="text-sm text-muted-foreground">{tw.dashboard.planSubtitle}</p>
            <ActivityStreak activity="workout" className="mt-1.5" />
            {isExpired && (
              <Badge variant="destructive" className="gap-1 mt-1"><AlertCircle className="w-3 h-3" />{tw.dashboard.expired}</Badge>
            )}
            {/* Prioridades salvas */}
            {aiWorkoutPlan.muscleGroups?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {aiWorkoutPlan.muscleGroups.map(m => (
                  <Badge key={m} variant="outline" className="text-xs py-0">{m}</Badge>
                ))}
              </div>
            )}
          </div>
          <img
            src="/mascots/koala-treino.png"
            alt="Mascote treino"
            className="w-28 h-28 object-contain drop-shadow-md"
          />
        </div>

        {/* Disclaimer */}
        <p className="text-xs font-bold text-muted-foreground leading-relaxed px-1">
          {tw.dashboard.videoDisclaimer}
        </p>

        {/* Stats + progress */}
        <Card>
          <CardContent className="pt-3 pb-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4 text-muted-foreground">
                <span><strong className="text-foreground">{plan.daysPerWeek}×</strong> {tw.dashboard.perWeek}</span>
                <span><strong className="text-foreground">{plan.sessionDuration}</strong> {tw.dashboard.minutes}</span>
                <span><strong className="text-foreground">{plan.days.length}</strong> {tw.dashboard.days}</span>
                <span className="text-xs capitalize">{environment === 'casa' ? tw.dashboard.envHome : environment === 'misto' ? tw.dashboard.envMixed : tw.dashboard.envGym}</span>
              </div>
              <span className="text-xs text-muted-foreground">{elapsed}/{PLAN_DURATION_DAYS}{tw.dashboard.daysElapsed}</span>
            </div>
            <Progress value={progressPct} className="h-1.5" />
          </CardContent>
        </Card>

        {/* Workout days */}
        <div className="space-y-2">
          {plan.days.map((day, i) => (
            <WorkoutDayCard key={i} day={day} index={i} />
          ))}
        </div>

        {/* Aquecimento + Resfriamento */}
        {((plan.warmup?.length > 0) || (plan.cooldown?.length > 0)) && (
          <Card>
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left"
              onClick={() => setShowPrep(v => !v)}
            >
              <span className="text-sm font-semibold">{tw.dashboard.warmCoolTitle}</span>
              {showPrep ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {showPrep && (
              <CardContent className="pt-0 pb-3 space-y-3">
                <div className="h-px bg-border" />
                {plan.warmup?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{tw.dashboard.warmupLabel}</p>
                    {plan.warmup.map((item, i) => (
                      <p key={i} className="text-sm text-muted-foreground">{i + 1}. {item}</p>
                    ))}
                  </div>
                )}
                {plan.cooldown?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{tw.dashboard.cooldownLabel}</p>
                    {plan.cooldown.map((item, i) => (
                      <p key={i} className="text-sm text-muted-foreground">{i + 1}. {item}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )}

        {/* Tips */}
        {plan.tips?.length > 0 && (
          <Card className="!bg-primary text-primary-foreground border-0">
            <CardContent className="py-3 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1.5">{tw.dashboard.tipsLabel}</p>
              {plan.tips.slice(0, 3).map((tip, i) => (
                <p key={i} className="text-xs opacity-90">💡 {tip}</p>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setRenewEnv(environment)
              setRenewMuscles(aiWorkoutPlan.muscleGroups ?? [])
              setRenewEquipment(aiWorkoutPlan.homeEquipment ?? [])
              setRenewPreference(aiWorkoutPlan.workoutPreference ?? 'misto')
              setRenewObjectives(aiWorkoutPlan.objectives ?? [])
              setRenewCount(aiWorkoutPlan.workoutCount ?? 3)
              setRenewAddAerobic(aiWorkoutPlan.addAerobic ?? false)
              setRenewDuration(aiWorkoutPlan.sessionDurationPref ?? '50')
              setRenewMistoHome(aiWorkoutPlan.mistoHomeSessions ?? 1)
              setRenewMistoAcad(aiWorkoutPlan.mistoAcadSessions ?? 2)
              setShowRenewal(true)
            }}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {isExpired ? tw.dashboard.newPlan : tw.dashboard.renew}
          </Button>
          <Button
            variant="outline"
            onClick={() => printWorkoutPlan(aiWorkoutPlan, user?.name ?? 'Usuário')}
            title="Salvar como PDF"
          >
            <FileDown className="w-4 h-4" />
          </Button>
          {!isExpired && (
            <button
              onClick={() => clearAiWorkoutPlan()}
              className="text-xs text-muted-foreground px-3"
            >
              {tw.dashboard.restart}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
