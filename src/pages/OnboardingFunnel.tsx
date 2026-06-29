import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Star, Sparkles, ChevronDown } from 'lucide-react'
import { useTranslation } from '@/contexts/LanguageContext'

/* ── assets ─────────────────────────────────────────────────────────────────── */
const mascot = '/mascots/koala-zen.webp'
const mascotTreino = '/mascots/koala-treino.png'

/* ── quiz images (generated with Nano Banana) ───────────────────────────────── */
const IMG = {
  hero: '/quiz/hero-before-after.png',
  bodyOver: '/quiz/body-overweight.png',
  bodySlightOver: '/quiz/body-slightly-over.png',
  bodyAvg: '/quiz/body-average.png',
  bodyFit: '/quiz/body-fit.png',
  goalSlim: '/quiz/goal-slim.png',
  goalToned: '/quiz/goal-toned.png',
  goalDefined: '/quiz/goal-defined.png',
}

/* ══════════════════════════════════════════════════════════════════════════════
   COMPONENTS
   ══════════════════════════════════════════════════════════════════════════════ */

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="px-6 pt-5 pb-1">
      <div className="w-full h-1.5 rounded-full overflow-hidden bg-background/40">
        <div className="h-full rounded-full transition-all duration-500 bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/* radio option (single select) */
function Opt({ label, emoji, selected, onSelect, image }: {
  label: string; emoji?: string; selected: boolean; onSelect: () => void; image?: string
}) {
  const pick = () => { try { navigator.vibrate?.(10) } catch { /* sem haptic */ } onSelect() }
  /* Card com imagem → layout vertical (grid 2×2) */
  if (image) {
    return (
      <button onClick={pick}
        className={`flex flex-col items-center rounded-2xl p-3 pb-4 transition-all border-2 aspect-square justify-center gap-2 shadow-sm cursor-pointer [touch-action:manipulation] active:scale-[0.97] ${selected ? 'bg-primary/15 border-primary' : 'bg-card border-transparent'}`}>
        <div className="w-24 h-24 rounded-xl overflow-hidden flex items-center justify-center bg-muted">
          <img src={image} alt="" className="w-full h-full object-contain" />
        </div>
        <span className="text-sm font-bold text-center leading-tight text-primary">{label}</span>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? 'border-primary' : 'border-border'}`}>
          {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
        </div>
      </button>
    )
  }

  /* Card padrão → layout horizontal */
  return (
    <button onClick={pick}
      className={`w-full flex items-center gap-3 rounded-2xl px-4 py-4 min-h-[56px] text-left transition-all border-2 shadow-sm cursor-pointer [touch-action:manipulation] active:scale-[0.98] ${selected ? 'bg-primary/15 border-primary' : 'bg-card border-transparent'}`}>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'border-primary' : 'border-border'}`}>
        {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
      </div>
      {emoji && <span className="text-xl flex-shrink-0">{emoji}</span>}
      <span className="text-base font-semibold flex-1 text-primary">{label}</span>
      {selected && <CheckCircle className="w-5 h-5 flex-shrink-0 text-primary" />}
    </button>
  )
}

/* checkbox option (multi select) */
function MultiOpt({ label, emoji, checked, onChange }: {
  label: string; emoji?: string; checked: boolean; onChange: () => void
}) {
  const pick = () => { try { navigator.vibrate?.(10) } catch { /* sem haptic */ } onChange() }
  return (
    <button onClick={pick}
      className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 min-h-[56px] text-left transition-all border-2 shadow-sm cursor-pointer [touch-action:manipulation] active:scale-[0.98] ${checked ? 'bg-primary/15 border-primary' : 'bg-card border-transparent'}`}>
      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary-foreground transition-transform ${checked ? 'border-primary bg-primary onb-pop' : 'border-border bg-transparent'}`}>
        {checked && '✓'}
      </div>
      {emoji && <span className="text-xl flex-shrink-0">{emoji}</span>}
      <span className="text-base font-semibold flex-1 text-primary">{label}</span>
    </button>
  )
}

/* image card (for body goal 3-col) */
function ImgCard({ label, image, selected, onSelect }: {
  label: string; image: string; selected: boolean; onSelect: () => void
}) {
  return (
    <button onClick={() => { try { navigator.vibrate?.(10) } catch { /* sem haptic */ } onSelect() }} className="flex flex-col items-center gap-2 cursor-pointer [touch-action:manipulation] active:scale-[0.97] transition-transform">
      <div className={`rounded-2xl overflow-hidden transition-all border-[3px] ${selected ? 'border-primary ring-2 ring-primary' : 'border-transparent shadow-sm'}`}>
        <img src={image} alt={label} className="w-full h-36 object-cover" />
      </div>
      <div className="flex items-center gap-1.5">
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selected ? 'border-primary' : 'border-border'}`}>
          {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
        </div>
        <span className="text-sm font-bold text-primary">{label}</span>
      </div>
    </button>
  )
}

/* testimonial card */
function TestCard({ name, text, stars }: { name: string; text: string; stars: number }) {
  return (
    <div className="rounded-2xl px-4 py-3.5 bg-card shadow-sm border border-primary/10">
      <div className="flex items-center gap-0.5 mb-1.5">
        {Array.from({ length: stars }).map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-warning text-warning" />)}
      </div>
      <p className="text-sm italic mb-1.5 text-primary">{text}</p>
      <p className="text-xs font-bold text-primary/50">— {name}</p>
    </div>
  )
}

/* metric bar (like reference diagnostic) */
function MetricBar({ label, value, max, color, tag }: {
  label: string; value: number; max: number; color: string; tag?: string
}) {
  const pct = (value / max) * 100
  // Anima a barra enchendo de 0 até o valor + número contando junto (gráfico suave).
  const [w, setW] = useState(0)
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setW(pct); setShown(value); return }
    const raf = requestAnimationFrame(() => setW(pct))
    const start = performance.now()
    const dur = 1100
    let id = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      const eased = 0.5 - Math.cos(Math.PI * t) / 2 // easeInOut
      setShown(Math.round(value * eased))
      if (t < 1) id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); cancelAnimationFrame(id) }
  }, [pct, value])
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm font-bold text-primary">
        <span>{label}</span>
        {tag && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15">{tag}</span>}
      </div>
      <div className="w-full h-4 rounded-full overflow-hidden relative bg-card/50">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${w}%`, transition: 'width 1100ms ease-out' }} />
        <div className="absolute top-0 h-full flex items-center ease-out" style={{ left: `${w}%`, transform: 'translateX(-50%)', transition: 'left 1100ms ease-out' }}>
          <div className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-primary-foreground bg-primary">{shown}%</div>
        </div>
      </div>
    </div>
  )
}

/* loading screen */
function Loading({ title, sub, msgs, img, duration, onDone }: {
  title: string; sub?: string; msgs: string[]; img?: string; duration: number; onDone: () => void
}) {
  const [p, setP] = useState(0)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  const fired = useRef(false)
  useEffect(() => {
    fired.current = false
    setP(0)
    const step = 100 / (duration / 55)
    const id = setInterval(() => {
      setP(v => {
        const next = Math.min(v + step, 100)
        if (next >= 100 && !fired.current) {
          fired.current = true
          clearInterval(id)
          setTimeout(() => onDoneRef.current(), 400)
        }
        return next
      })
    }, 55)
    return () => clearInterval(id)
  }, [duration])
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
      <img src={img || mascot} alt="" className="w-28 h-28 object-contain mb-5 animate-pulse" />
      <h2 className="text-xl font-black mb-1 text-primary">{title}</h2>
      {sub && <p className="text-sm font-bold mb-4 text-destructive">{sub}</p>}
      <div className="w-full max-w-xs mb-5">
        <div className="w-full h-3 rounded-full overflow-hidden bg-background/40">
          <div className="h-full rounded-full transition-all duration-75 bg-primary" style={{ width: `${p}%` }} />
        </div>
        <p className="text-sm mt-1.5 font-bold text-primary/50">{Math.round(p)}%</p>
      </div>
      <div className="space-y-2 text-base text-primary">
        {msgs.map((m, i) => p > (i + 1) * (100 / (msgs.length + 1)) && (
          <p key={i} className="flex items-center justify-center gap-2" style={{ animation: 'fi .4s ease-in' }}>
            <CheckCircle className="w-4 h-4" /> {m}
          </p>
        ))}
      </div>
      <style>{`@keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}

/* ── section heading ────────────────────────────────────────────────────────── */
function Heading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="text-center mb-5">
      <h2 className="text-2xl font-black text-primary leading-tight">{title}</h2>
      {sub && <p className="text-base mt-1.5 text-primary/65">{sub}</p>}
    </div>
  )
}

/* ── CTA button ─────────────────────────────────────────────────────────────── */
function CTA({ label, onClick, icon }: { label: string; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="w-full py-4 rounded-full bg-primary text-primary-foreground text-base font-black uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all">
      {label} {icon}
    </button>
  )
}

/* ── helper ──────────────────────────────────────────────────────────────────── */
function toggle(arr: string[], v: string) {
  return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]
}

/**
 * Toggle onde alguns itens são "exclusivos": ao marcar um exclusivo, desmarca todos os outros;
 * ao marcar um item comum, desmarca qualquer exclusivo ativo.
 */
function toggleWithExclusive(arr: string[], v: string, exclusives: string[]) {
  const isExclusive = exclusives.includes(v)
  if (arr.includes(v)) return arr.filter(x => x !== v)
  if (isExclusive) return [v]
  return [...arr.filter(x => !exclusives.includes(x)), v]
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT — 19 STEPS
   ══════════════════════════════════════════════════════════════════════════════ */

const TESTIMONIAL_KEYS = ['ana', 'marcos', 'julia', 'roberto'] as const

export function OnboardingFunnel() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const tf = t.onboardingFunnel

  const [step, setStep] = useState(1)

  /* quiz state */
  const [age, setAge] = useState('')
  const [body, setBody] = useState('')
  const [metabolism, setMetabolism] = useState('')
  const [weightGoal, setWeightGoal] = useState('')
  const [otherGoals, setOtherGoals] = useState<string[]>([])
  const [goalBody, setGoalBody] = useState('')
  const [impact, setImpact] = useState<string[]>([])
  const [bodyResponds, setBodyResponds] = useState('')
  const [routine, setRoutine] = useState('')
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [commitment1, setCommitment1] = useState('')
  const [benefits, setBenefits] = useState<string[]>([])

  const auto = (fn: (v: string) => void, v: string) => { fn(v); setTimeout(() => setStep(s => s + 1), 350) }
  const next = () => setStep(s => s + 1)
  const goLogin = () => navigate('/login')
  const goRegister = () => navigate('/registrar')

  const pctMap: Record<number, number> = {
    1:5, 2:10, 3:16, 4:21, 5:26, 6:32, 7:37, 8:42, 9:47, 10:53,
    11:58, 12:63, 13:68, 14:74, 15:79, 16:84, 17:89, 18:95, 19:100
  }
  const isLoading = [5, 11, 15, 18].includes(step)
  const showProgress = !isLoading && step <= 17

  const canProceedFunnel = (): boolean => {
    switch (step) {
      case 6: return true
      case 7: return otherGoals.length > 0
      case 9: return impact.length > 0
      case 12: return true
      case 14: return symptoms.length > 0
      case 16: return true
      case 17: return !!commitment1 && benefits.length > 0
      default: return true
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {showProgress && <ProgressBar pct={pctMap[step] || 0} />}

      <div key={step} className="flex-1 px-6 pb-28 flex flex-col overflow-y-auto onb-step-in">

        {/* STEP 1 — HERO + IDADE */}
        {step === 1 && (
          <div className="flex flex-col items-center text-center pt-2">
            <h1 className="text-2xl font-black leading-tight mb-2 uppercase text-primary">
              {tf.step1.title1}{' '}
              <span className="underline decoration-2 underline-offset-4 decoration-card">{tf.step1.titleHighlight}</span>
            </h1>
            <div className="rounded-full px-4 py-1.5 mb-4 bg-primary">
              <p className="text-[11px] font-black text-primary-foreground uppercase tracking-wider">
                {tf.step1.badge}
              </p>
            </div>

            <div className="w-[75%] rounded-2xl overflow-hidden mb-5 shadow-lg mx-auto">
              <img src={IMG.hero} alt="" className="w-full object-contain" />
            </div>

            <h2 className="text-xl font-black mb-1 text-primary">
              {tf.step1.subtitle}
            </h2>
            <p className="text-base mb-4 text-primary/60">{tf.step1.helper}</p>

            <div className="w-full grid grid-cols-2 gap-2.5">
              {[
                { l: tf.step1.ageRanges.a, v: '18-25' },
                { l: tf.step1.ageRanges.b, v: '26-35' },
                { l: tf.step1.ageRanges.c, v: '36-45' },
                { l: tf.step1.ageRanges.d, v: '46-55' },
                { l: tf.step1.ageRanges.e, v: '56-65' },
                { l: tf.step1.ageRanges.f, v: '65+' },
              ].map(o => (
                <Opt key={o.v} label={o.l} selected={age === o.v} onSelect={() => auto(setAge, o.v)} />
              ))}
            </div>

            <div className="mt-5 rounded-2xl p-3 w-full bg-primary/15 border border-primary/20">
              <p className="text-sm text-primary">{tf.step1.info}</p>
            </div>
            <p className="text-[10px] mt-3 font-medium text-primary/40">{tf.step1.estimatedTime}</p>
          </div>
        )}

        {/* STEP 2 — CORPO ATUAL */}
        {step === 2 && (<div className="flex-1 flex flex-col justify-center">
          <Heading title={tf.step2.title} />
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: tf.step2.options.muitoAcima, v: 'muito_acima', img: IMG.bodyOver },
              { l: tf.step2.options.poucoAcima, v: 'pouco_acima', img: IMG.bodySlightOver },
              { l: tf.step2.options.normal, v: 'normal', img: IMG.bodyAvg },
              { l: tf.step2.options.emForma, v: 'em_forma', img: IMG.bodyFit },
            ].map(o => (
              <Opt key={o.v} label={o.l} image={o.img} selected={body === o.v} onSelect={() => auto(setBody, o.v)} />
            ))}
          </div>
        </div>)}

        {/* STEP 3 — METABOLISMO */}
        {step === 3 && (<div className="flex-1 flex flex-col justify-center">
          <Heading title={tf.step3.title} />
          <div className="space-y-2.5">
            <Opt label={tf.step3.slow} emoji="🐢" selected={metabolism === 'lento'} onSelect={() => auto(setMetabolism, 'lento')} />
            <Opt label={tf.step3.fast} emoji="🔥" selected={metabolism === 'acelerado'} onSelect={() => auto(setMetabolism, 'acelerado')} />
          </div>
        </div>)}

        {/* STEP 4 — META DE PESO */}
        {step === 4 && (<div className="flex-1 flex flex-col justify-center">
          <Heading title={tf.step4.title} />
          <div className="space-y-2.5">
            {[
              tf.step4.options.a, tf.step4.options.b, tf.step4.options.c,
              tf.step4.options.d, tf.step4.options.e, tf.step4.options.f, tf.step4.options.g,
            ].map(v => (
              <Opt key={v} label={v} selected={weightGoal === v} onSelect={() => auto(setWeightGoal, v)} />
            ))}
          </div>
        </div>)}

        {/* STEP 5 — LOADING 1 */}
        {step === 5 && (
          <Loading title={tf.step5.title} sub={tf.step5.subtitle} duration={3000} onDone={next}
            msgs={[tf.step5.msg1, tf.step5.msg2, tf.step5.msg3]} />
        )}

        {/* STEP 6 — PROVA SOCIAL */}
        {step === 6 && (
          <div className="pt-2 space-y-4">
            <Heading title={tf.step6.title} />
            <p className="text-center text-sm font-black underline text-primary">{tf.step6.sub}</p>
            {TESTIMONIAL_KEYS.map((k) => {
              const data = tf.testimonials[k]
              return <TestCard key={k} name={data.name} text={data.text} stars={5} />
            })}
            <p className="text-center text-xs font-bold text-destructive">{tf.step6.footer}</p>
          </div>
        )}

        {/* STEP 7 — OUTROS OBJETIVOS */}
        {step === 7 && (<>
          <Heading title={tf.step7.title} sub={tf.common.canMarkMultiple} />
          <div className="space-y-2.5">
            {[
              { l: tf.step7.options.belly, e: '🔥' },
              { l: tf.step7.options.sagging, e: '✨' },
              { l: tf.step7.options.pain, e: '💆' },
              { l: tf.step7.options.energy, e: '⚡' },
              { l: tf.step7.options.health, e: '💚' },
              { l: tf.step7.options.sleep, e: '😴' },
            ].map(o => (
              <MultiOpt key={o.l} label={o.l} emoji={o.e} checked={otherGoals.includes(o.l)} onChange={() => setOtherGoals(toggle(otherGoals, o.l))} />
            ))}
          </div>
        </>)}

        {/* STEP 8 — CORPO DOS SONHOS */}
        {step === 8 && (<div className="flex-1 flex flex-col justify-center">
          <Heading title={tf.step8.title} />
          <div className="grid grid-cols-3 gap-3">
            <ImgCard label={tf.step8.slim} image={IMG.goalSlim} selected={goalBody === 'slim'} onSelect={() => auto(setGoalBody, 'slim')} />
            <ImgCard label={tf.step8.toned} image={IMG.goalToned} selected={goalBody === 'toned'} onSelect={() => auto(setGoalBody, 'toned')} />
            <ImgCard label={tf.step8.defined} image={IMG.goalDefined} selected={goalBody === 'defined'} onSelect={() => auto(setGoalBody, 'defined')} />
          </div>
        </div>)}

        {/* STEP 9 — IMPACTO NA VIDA */}
        {step === 9 && (<>
          <Heading title={tf.step9.title} sub={tf.common.canChooseMultiple} />
          <div className="space-y-2.5">
            {[
              { l: tf.step9.options.esteem, e: '😟' },
              { l: tf.step9.options.tired, e: '😪' },
              { l: tf.step9.options.health, e: '🏥' },
              { l: tf.step9.options.mirror, e: '🪞' },
              { l: tf.step9.options.wellFeel, e: '😊' },
            ].map(o => (
              <MultiOpt
                key={o.l}
                label={o.l}
                emoji={o.e}
                checked={impact.includes(o.l)}
                onChange={() => setImpact(toggleWithExclusive(impact, o.l, [tf.step9.options.wellFeel]))}
              />
            ))}
          </div>
        </>)}

        {/* STEP 10 — CORPO NÃO RESPONDE */}
        {step === 10 && (<div className="flex-1 flex flex-col justify-center">
          <Heading title={tf.step10.title} />
          <div className="space-y-2.5">
            <Opt label={tf.step10.no} emoji="😩" selected={bodyResponds === 'nao'} onSelect={() => auto(setBodyResponds, 'nao')} />
            <Opt label={tf.step10.slow} emoji="😕" selected={bodyResponds === 'devagar'} onSelect={() => auto(setBodyResponds, 'devagar')} />
            <Opt label={tf.step10.yes} emoji="💪" selected={bodyResponds === 'sim'} onSelect={() => auto(setBodyResponds, 'sim')} />
          </div>
        </div>)}

        {/* STEP 11 — LOADING 2 */}
        {step === 11 && (
          <Loading title={tf.step11.title} sub={tf.step11.subtitle} duration={3000} onDone={next}
            msgs={[tf.step11.msg1, tf.step11.msg2, tf.step11.msg3]} />
        )}

        {/* STEP 12 — DIAGNÓSTICO */}
        {step === 12 && (
          <div className="pt-2 space-y-4">
            <div className="rounded-2xl p-4 text-center bg-primary">
              <p className="text-sm font-black text-primary-foreground uppercase">{tf.step12.badge}</p>
              <p className="text-sm text-primary-foreground/80 mt-1">{tf.step12.badgeSub}</p>
            </div>

            <p className="text-sm font-black text-center text-primary">{tf.step12.statsTitle}</p>

            <div className="rounded-2xl p-4 space-y-4 bg-card">
              <MetricBar label={tf.step12.burn} value={metabolism === 'lento' ? 27 : 58} max={100} color="bg-destructive" tag={tf.step12.youAreHere} />
              <MetricBar label={tf.step12.potentialWithPlan} value={89} max={100} color="bg-primary" tag={tf.step12.goal} />
            </div>

            <div className="rounded-2xl p-4 bg-primary/15 border border-primary/25">
              <p className="text-base text-primary">{tf.step12.solution}</p>
            </div>

            <p className="text-center text-sm font-black uppercase text-primary">
              {tf.step12.next}
            </p>
          </div>
        )}

        {/* STEP 13 — ROTINA */}
        {step === 13 && (<div className="flex-1 flex flex-col justify-center">
          <Heading title={tf.step13.title} />
          <div className="space-y-2.5">
            <Opt label={tf.step13.away} emoji="🚗" selected={routine === 'fora'} onSelect={() => auto(setRoutine, 'fora')} />
            <Opt label={tf.step13.home} emoji="🏠" selected={routine === 'casa'} onSelect={() => auto(setRoutine, 'casa')} />
            <Opt label={tf.step13.noWork} emoji="😊" selected={routine === 'nao'} onSelect={() => auto(setRoutine, 'nao')} />
          </div>
        </div>)}

        {/* STEP 14 — SINTOMAS */}
        {step === 14 && (<>
          <Heading title={tf.step14.title} sub={tf.common.canChooseSeveral} />
          <div className="space-y-2.5">
            {[
              { l: tf.step14.options.tired, e: '😪' },
              { l: tf.step14.options.pain, e: '😣' },
              { l: tf.step14.options.mood, e: '😤' },
              { l: tf.step14.options.anxiety, e: '😰' },
              { l: tf.step14.options.sleep, e: '🌙' },
              { l: tf.step14.options.none, e: '✅' },
            ].map(o => (
              <MultiOpt key={o.l} label={o.l} emoji={o.e} checked={symptoms.includes(o.l)} onChange={() => setSymptoms(toggle(symptoms, o.l))} />
            ))}
          </div>
        </>)}

        {/* STEP 15 — LOADING 3 */}
        {step === 15 && (
          <Loading title={tf.step15.title} sub={tf.step15.subtitle} duration={3500} onDone={next}
            img={mascotTreino} msgs={[tf.step15.msg1, tf.step15.msg2, tf.step15.msg3, tf.step15.msg4]} />
        )}

        {/* STEP 16 — SOLUÇÃO */}
        {step === 16 && (
          <div className="pt-2 space-y-4">
            <div className="rounded-2xl p-4 text-center bg-primary/15 border-2 border-primary">
              <p className="text-sm font-black uppercase text-primary">
                {tf.step16.badge}
              </p>
            </div>

            <p className="text-base text-center text-primary">
              {tf.step16.text}
            </p>

            <div className="rounded-2xl p-4 bg-card">
              <MetricBar label={tf.step16.potential} value={76} max={100} color="bg-primary" tag={tf.step16.youTag} />
            </div>

            <h3 className="text-center font-black text-primary">{tf.step16.seeResults}</h3>

            {TESTIMONIAL_KEYS.slice(0, 2).map((k) => {
              const data = tf.testimonials[k]
              return <TestCard key={k} name={data.name} text={data.text} stars={5} />
            })}

            <p className="text-center text-lg font-black text-primary">
              {tf.step16.question}
            </p>
          </div>
        )}

        {/* STEP 17 — COMPROMISSO + BENEFÍCIOS */}
        {step === 17 && (<>
          <Heading title={tf.step17.question1} />
          <div className="space-y-2.5 mb-6">
            <Opt label={tf.step17.commitYes} emoji="😍" selected={commitment1 === 'sim'} onSelect={() => setCommitment1('sim')} />
            <Opt label={tf.step17.commitTest} emoji="💪" selected={commitment1 === 'teste'} onSelect={() => setCommitment1('teste')} />
          </div>

          <Heading title={tf.step17.question2} sub={tf.common.canChooseSeveral} />
          <div className="space-y-2.5">
            {[
              { l: tf.step17.options.confident, e: '✨' },
              { l: tf.step17.options.clothes, e: '👗' },
              { l: tf.step17.options.mirror, e: '🪞' },
              { l: tf.step17.options.compliments, e: '👏' },
              { l: tf.step17.options.energy, e: '⚡' },
              { l: tf.step17.options.healthy, e: '💚' },
            ].map(o => (
              <MultiOpt key={o.l} label={o.l} emoji={o.e} checked={benefits.includes(o.l)} onChange={() => setBenefits(toggle(benefits, o.l))} />
            ))}
          </div>
        </>)}

        {/* STEP 18 — LOADING FINAL */}
        {step === 18 && (
          <div className="flex flex-col flex-1">
            <Loading title={tf.step18.title} sub={tf.step18.subtitle} duration={5000} onDone={next}
              msgs={[tf.step18.msg1, tf.step18.msg2, tf.step18.msg3, tf.step18.msg4]} />
            <div className="space-y-3 mt-4">
              {TESTIMONIAL_KEYS.slice(2).map((k) => {
                const data = tf.testimonials[k]
                return <TestCard key={k} name={data.name} text={data.text} stars={5} />
              })}
            </div>
          </div>
        )}

        {/* STEP 19 — CTA FINAL */}
        {step === 19 && (
          <div className="pt-2 space-y-5">
            <div className="text-center">
              <img src={mascot} alt="" className="w-28 h-28 object-contain mx-auto mb-3" />
              <h2 className="text-2xl font-black leading-tight text-primary">
                {tf.step19.title}
              </h2>
              <p className="text-base mt-2 text-primary/70">
                {tf.step19.subtitle}
              </p>
            </div>

            <CTA label={tf.step19.ctaMain} onClick={goRegister} icon={<Sparkles className="w-5 h-5" />} />

            <h3 className="text-center font-black uppercase text-sm text-primary">
              {tf.step19.whatYouGet}
            </h3>

            {(['app', 'chat', 'tracking', 'menu', 'workouts', 'glp1'] as const).map((k, i) => {
              const item = tf.step19.features[k]
              return (
                <div key={i} className="rounded-2xl px-4 py-3 bg-card shadow-sm">
                  <p className="text-base font-bold text-primary">{item.t}</p>
                  <p className="text-sm mt-0.5 text-primary/60">{item.d}</p>
                </div>
              )
            })}

            <div className="flex flex-wrap gap-2 justify-center">
              {[tf.step19.benefits.free, tf.step19.benefits.noCommitment, tf.step19.benefits.cancel].map(t => (
                <span key={t} className="text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 bg-primary/15 text-primary">
                  <CheckCircle className="w-3 h-3" /> {t}
                </span>
              ))}
            </div>

            <CTA label={tf.step19.ctaCreate} onClick={goRegister} icon={<Sparkles className="w-5 h-5" />} />

            <h3 className="text-center font-black uppercase text-sm mt-2 text-primary">
              {tf.step19.approvedBy}
            </h3>

            {TESTIMONIAL_KEYS.map((k) => {
              const data = tf.testimonials[k]
              return <TestCard key={k} name={data.name} text={data.text} stars={5} />
            })}

            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { v: '2k+', l: tf.step19.social.users },
                { v: '4.9', l: tf.step19.social.rating },
                { v: '92%', l: tf.step19.social.satisfaction },
              ].map((s, i) => (
                <div key={i} className="rounded-xl py-3 bg-card">
                  <p className="text-xl font-black text-primary">{s.v}</p>
                  <p className="text-[10px] font-bold text-primary/50">{s.l}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-5 text-center bg-foreground">
              <p className="text-base font-black text-background mb-2">{tf.step19.ctaFree}</p>
              <p className="text-sm text-background/80">
                {tf.step19.ctaFreeSubtitle}
              </p>
            </div>

            <CTA label={tf.step19.ctaStart} onClick={goRegister} icon={<Sparkles className="w-5 h-5" />} />

            <button onClick={goLogin} className="w-full py-3 text-sm font-semibold text-center text-primary/50">
              {tf.common.haveAccount}
            </button>

            <h3 className="text-center font-black text-base pt-2 text-primary">{tf.step19.faqTitle}</h3>
            {(['free', 'restrictive', 'glp1', 'howGet'] as const).map((k, i) => {
              const faq = tf.step19.faqs[k]
              return (
                <details key={i} className="rounded-2xl overflow-hidden bg-card">
                  <summary className="px-4 py-3.5 text-base font-bold cursor-pointer flex items-center justify-between text-primary [touch-action:manipulation]">
                    {faq.q} <ChevronDown className="w-4 h-4 flex-shrink-0" />
                  </summary>
                  <p className="px-4 pb-3 text-sm text-primary/70 leading-relaxed">{faq.a}</p>
                </details>
              )
            })}

            <div className="h-8" />
          </div>
        )}

      </div>

      {/* ── FIXED BOTTOM BUTTON ─────────────────────────────────────────────── */}
      {[6, 7, 9, 12, 14, 16, 17].includes(step) && (
        <div className="fixed bottom-0 left-0 right-0 px-5 pb-6 pt-3 bg-gradient-to-t from-background from-30% to-transparent">
          <button onClick={next} disabled={!canProceedFunnel()}
            className="w-full h-14 px-5 rounded-full bg-primary text-primary-foreground font-black uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontSize: step === 16 ? '0.8rem' : '0.875rem' }}>
            {step === 16 ? tf.step16.ctaButton : step === 12 ? tf.step12.ctaButton : tf.common.continue}
          </button>
        </div>
      )}

      {/* "Já tenho conta" on step 1 */}
      {step === 1 && (
        <div className="fixed bottom-0 left-0 right-0 px-6 pb-4 bg-gradient-to-t from-background from-30% to-transparent">
          <button onClick={goLogin} className="w-full py-2 text-xs font-semibold text-primary/40">
            {tf.common.haveAccount}
          </button>
        </div>
      )}
    </div>
  )
}
