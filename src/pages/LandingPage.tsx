import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Brain, Droplets, Utensils, Dumbbell, Moon, Timer,
  ChevronDown, ChevronRight, Check, Star, Pill, Heart,
  BarChart3, Zap, Shield, Users,
  ArrowRight, Menu, X,
} from 'lucide-react'
import { useTranslation } from '@/contexts/LanguageContext'

// ── Helpers ────────────────────────────────────────────────────────────────

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ── Configs não-traduzíveis (icon / color / imagem) ──────────────────────
// Textos (title/desc/etc) vêm do i18n via `t.landingPage.*`

const FEATURE_KEYS = ['nutrition', 'chat', 'hydration', 'workout', 'sleep', 'fasting', 'progress', 'cycle'] as const
const FEATURE_CONFIG: Record<(typeof FEATURE_KEYS)[number], { icon: typeof Utensils; color: string; bg: string }> = {
  nutrition: { icon: Utensils, color: '#4a8c4e', bg: '#e8f4e8' },
  chat: { icon: Brain, color: '#8b5cf6', bg: '#ede9fe' },
  hydration: { icon: Droplets, color: '#3b82f6', bg: '#dbeafe' },
  workout: { icon: Dumbbell, color: '#f97316', bg: '#ffedd5' },
  sleep: { icon: Moon, color: '#6366f1', bg: '#e0e7ff' },
  fasting: { icon: Timer, color: '#10b981', bg: '#d1fae5' },
  progress: { icon: BarChart3, color: '#f59e0b', bg: '#fef3c7' },
  cycle: { icon: Heart, color: '#ec4899', bg: '#fce7f3' },
}

const AUDIENCE_KEYS = ['glp1', 'bariatric', 'everyone', 'fasting'] as const
const AUDIENCE_CONFIG: Record<(typeof AUDIENCE_KEYS)[number], { icon: typeof Pill }> = {
  glp1: { icon: Pill },
  bariatric: { icon: Shield },
  everyone: { icon: Users },
  fasting: { icon: Zap },
}

const STEP_KEYS = ['onboarding', 'plan', 'progress'] as const
const STEP_NUMS: Record<(typeof STEP_KEYS)[number], string> = {
  onboarding: '01',
  plan: '02',
  progress: '03',
}

const TESTIMONIAL_KEYS = ['ana', 'bruno', 'carla', 'daniel', 'eduarda'] as const

const FAQ_KEYS = ['free', 'noExpert', 'glp1', 'bariatric', 'privacy', 'mobile', 'fasting', 'personalized'] as const

const PROBLEM_KEYS = ['noData', 'generic', 'context', 'fragmented'] as const
const PROBLEM_ICONS: Record<(typeof PROBLEM_KEYS)[number], string> = {
  noData: '📊',
  generic: '🍽️',
  context: '💊',
  fragmented: '😴',
}

const STAT_KEYS = ['users', 'weight', 'modules', 'personalized', 'menus', 'rating', 'privacy', 'start'] as const

// ── Component ─────────────────────────────────────────────────────────────

function TestimonialAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const colors = [
    'from-emerald-400 to-teal-500',
    'from-violet-400 to-purple-500',
    'from-rose-400 to-pink-500',
    'from-amber-400 to-orange-500',
    'from-blue-400 to-indigo-500',
  ]
  const colorIndex = name.charCodeAt(0) % colors.length
  return (
    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 border-2 border-primary/40`}>
      {initials}
    </div>
  )
}

function StatsCarousel() {
  const { t } = useTranslation()
  const stats = STAT_KEYS.map(k => t.landingPage.stats[k])
  return (
    <section className="py-8 overflow-hidden bg-primary">
      <div
        className="flex"
        style={{ animation: 'statsScroll 20s linear infinite', width: `${stats.length * 2 * 25}vw` }}
      >
        {[...stats, ...stats].map((s, i) => (
          <div key={i} className="text-center px-6 flex-shrink-0" style={{ width: '25vw' }}>
            <p className="text-2xl font-black text-white">{s.v}</p>
            <p className="text-xs font-semibold mt-0.5 text-white/90">{s.l}</p>
            <p className="text-xs mt-0.5 leading-tight text-white/50">{s.sub}</p>
          </div>
        ))}
      </div>
      <style>{`@keyframes statsScroll { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </section>
  )
}

function Testimonials3D() {
  const { t } = useTranslation()
  const total = TESTIMONIAL_KEYS.length
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setActive(v => (v + 1) % total), 4000)
    return () => clearInterval(id)
  }, [total])

  const getPos = (i: number) => {
    let diff = i - active
    if (diff > total / 2) diff -= total
    if (diff < -total / 2) diff += total
    return diff
  }

  return (
    <section className="py-20 overflow-hidden" style={{ background: 'linear-gradient(160deg, #f0f9f0, #e8f4e8)' }}>
      <FadeIn className="text-center mb-14 px-5">
        <p className="text-xs font-bold uppercase tracking-widest mb-3 text-primary">{t.landingPage.testimonials.tag}</p>
        <h2 className="text-3xl sm:text-4xl font-black leading-tight text-foreground">
          {t.landingPage.testimonials.title1}<br />
          <span className="text-primary">{t.landingPage.testimonials.title2}</span>
        </h2>
      </FadeIn>

      <div className="relative flex justify-center items-center" style={{ height: '360px', perspective: '1000px' }}>
        {TESTIMONIAL_KEYS.map((key, i) => {
          const data = t.landingPage.testimonials.items[key]
          const pos = getPos(i)
          const isCenter = pos === 0
          const isVisible = Math.abs(pos) <= 1
          const tx = pos * 220
          const ry = pos * -35
          const scale = isCenter ? 1 : 0.82
          const opacity = isCenter ? 1 : 0.5
          const zIndex = isCenter ? 10 : 5 - Math.abs(pos)

          return (
            <div
              key={key}
              onClick={() => !isCenter && setActive(i)}
              style={{
                position: 'absolute',
                width: '280px',
                transform: `translateX(${tx}px) rotateY(${ry}deg) scale(${scale})`,
                opacity: isVisible ? opacity : 0,
                zIndex,
                transition: 'all 0.6s cubic-bezier(0.25,0.46,0.45,0.94)',
                cursor: isCenter ? 'default' : 'pointer',
                pointerEvents: isVisible ? 'auto' : 'none',
              }}
            >
              <div
                className={`rounded-2xl p-5 flex flex-col gap-3 bg-card ${isCenter ? 'border-2 border-primary shadow-[0_24px_60px_rgba(40,91,44,0.2)]' : 'border border-primary/20 shadow-[0_4px_20px_rgba(0,0,0,0.07)]'}`}
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-foreground/80">"{data.text}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-primary/10">
                  <TestimonialAvatar name={data.name} />
                  <div>
                    <p className="font-semibold text-sm text-foreground">{data.name}</p>
                    <p className="text-xs text-primary">{data.role}</p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-center text-xs mt-4 px-6 text-primary/60">
        {t.landingPage.testimonials.disclaimer}
      </p>

      <div className="flex justify-center items-center gap-1.5 mt-4 px-5">
        {TESTIMONIAL_KEYS.map((_, i) => (
          <button key={i} onClick={() => setActive(i)}
            className={`rounded-full transition-all duration-300 ${active === i ? 'bg-primary' : 'bg-primary/40'}`}
            style={{ width: active === i ? '20px' : '6px', height: '6px' }} />
        ))}
      </div>
    </section>
  )
}

export function LandingPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const featuresRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{ backgroundColor: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent', backdropFilter: scrolled ? 'blur(12px)' : 'none', borderBottom: scrolled ? '1px solid #e8e8e8' : 'none' }}
      >
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="https://vmfhhwbbwnotugnrdjpm.supabase.co/storage/v1/object/public/icons_app/alimentacao.png" alt="BEM.ai" className="w-8 h-8 object-contain" />
            <span className="font-bold text-lg text-primary">BEM.ai</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollTo(featuresRef)} className="text-sm font-medium text-primary transition-colors hover:text-primary/80">{t.landingPage.nav.features}</button>
            <button onClick={() => navigate('/login')} className="text-sm font-medium text-primary transition-colors hover:text-primary/80">{t.landingPage.nav.login}</button>
            <button
              onClick={() => navigate('/onboarding')}
              className="px-5 py-2.5 rounded-full text-sm font-semibold bg-primary text-primary-foreground transition-all hover:opacity-90 active:scale-95"
            >
              {t.landingPage.nav.start}
            </button>
          </nav>

          <div className="flex md:hidden items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-sm font-semibold px-3 py-1.5 rounded-full border border-primary text-primary">{t.landingPage.nav.login}</button>
            <button onClick={() => setMenuOpen(v => !v)} className="text-primary">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-card border-t border-border px-5 py-4 space-y-3">
            <button onClick={() => scrollTo(featuresRef)} className="block w-full text-left text-sm font-medium py-2 text-primary">{t.landingPage.nav.features}</button>
            <button onClick={() => navigate('/onboarding')} className="w-full py-3 rounded-full text-sm font-semibold bg-primary text-primary-foreground">
              {t.landingPage.nav.start}
            </button>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section
        className="relative flex flex-col items-center justify-start px-5 pt-20 pb-6 text-center overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #f0f9f0 0%, #e8f4e8 40%, #d4ecce 100%)' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 bg-primary/40" style={{ filter: 'blur(80px)' }} />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-20 bg-primary" style={{ filter: 'blur(80px)' }} />
        </div>

        <div className="relative max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-6 text-foreground">
            {t.landingPage.hero.title1}{' '}
            <span className="text-primary">{t.landingPage.hero.title2}</span>{' '}
            {t.landingPage.hero.title3}{' '}
            <span
              className="relative inline-block text-primary"
            >
              {t.landingPage.hero.title4}
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 6C50 2 150 2 198 6" stroke="#9BC89B" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </span>
          </h1>

          <p className="text-lg sm:text-xl mb-10 max-w-xl mx-auto leading-relaxed text-primary/80">
            {t.landingPage.hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <button
              onClick={() => navigate('/onboarding')}
              className="flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold bg-primary text-primary-foreground shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
            >
              {t.landingPage.hero.ctaStart}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollTo(featuresRef)}
              className="flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-primary transition-all hover:bg-white/50 border border-primary/25"
            >
              {t.landingPage.hero.ctaHow}
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="flex -space-x-2">
              {[
                { initials: 'AM', palette: 'from-emerald-500 to-teal-600' },
                { initials: 'BL', palette: 'from-violet-500 to-purple-600' },
                { initials: 'CR', palette: 'from-rose-500 to-pink-600' },
                { initials: 'DS', palette: 'from-amber-500 to-orange-600' },
                { initials: 'EF', palette: 'from-blue-500 to-indigo-600' },
              ].map(({ initials, palette }, i) => (
                <div key={i} className={`w-8 h-8 rounded-full bg-gradient-to-br ${palette} flex items-center justify-center text-white font-bold text-xs border-2 border-white flex-shrink-0`}>
                  {initials}
                </div>
              ))}
            </div>
            <div className="flex flex-col items-start">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
              </div>
              <span className="text-xs text-primary/70">{t.landingPage.hero.socialProof}</span>
            </div>
          </div>
        </div>

        <div className="relative mt-8 max-w-sm mx-auto">
          <div className="absolute inset-0 rounded-3xl bg-primary/20" style={{ filter: 'blur(20px)', transform: 'scale(0.9) translateY(10%)' }} />
          <img
            src="/zen.png"
            alt="BEM.ai mascote"
            className="relative w-48 h-48 sm:w-56 sm:h-56 object-contain mx-auto drop-shadow-xl"
          />
        </div>
      </section>

      <StatsCarousel />

      {/* ── DOR / PROBLEMA ── */}
      <section className="py-20 px-5" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3 text-primary/80">{t.landingPage.problem.tag}</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              {t.landingPage.problem.title1} <span className="text-primary/80">{t.landingPage.problem.title2}</span>
            </h2>
          </FadeIn>
          <div className="grid sm:grid-cols-2 gap-4">
            {PROBLEM_KEYS.map((k, i) => {
              const item = t.landingPage.problem.items[k]
              return (
                <FadeIn key={k} delay={i * 100}>
                  <div className="rounded-2xl p-5" style={{ backgroundColor: '#262626', border: '1px solid #333' }}>
                    <span className="text-2xl">{PROBLEM_ICONS[k]}</span>
                    <h3 className="font-bold text-white mt-2 mb-1">{item.t}</h3>
                    <p className="text-sm leading-relaxed text-white/60">{item.d}</p>
                  </div>
                </FadeIn>
              )
            })}
          </div>
          <FadeIn delay={400} className="text-center mt-10">
            <p className="text-lg font-semibold text-primary/80">
              {t.landingPage.problem.solution}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ── */}
      <section ref={featuresRef} className="py-20 px-5 bg-card">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3 text-primary">{t.landingPage.features.tag}</p>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight text-foreground">
              {t.landingPage.features.title1}<br />
              <span className="text-primary">{t.landingPage.features.title2}</span>
            </h2>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURE_KEYS.map((k, i) => {
              const data = t.landingPage.features.items[k]
              const { icon: Icon, color, bg } = FEATURE_CONFIG[k]
              return (
                <FadeIn key={k} delay={i * 60}>
                  <div className="rounded-2xl p-5 h-full transition-all hover:shadow-md hover:-translate-y-0.5 border border-border">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: bg }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <h3 className="font-bold text-sm mb-1.5 text-foreground">{data.title}</h3>
                    <p className="text-xs leading-relaxed text-foreground/50">{data.desc}</p>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── PARA QUEM É ── */}
      <section className="py-20 px-5" style={{ background: 'linear-gradient(160deg, #f0f9f0, #e8f4e8)' }}>
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3 text-primary">{t.landingPage.audiences.tag}</p>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight text-foreground">
              {t.landingPage.audiences.title1}<br />
              <span className="text-primary">{t.landingPage.audiences.title2}</span>
            </h2>
          </FadeIn>
          <div className="grid sm:grid-cols-2 gap-5">
            {AUDIENCE_KEYS.map((k, i) => {
              const data = t.landingPage.audiences.items[k]
              const { icon: Icon } = AUDIENCE_CONFIG[k]
              return (
                <FadeIn key={k} delay={i * 100}>
                  <div className="bg-card rounded-2xl p-6 shadow-sm h-full border border-primary/20">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-primary/10">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-base mb-0.5 text-foreground">{data.title}</h3>
                    <p className="text-xs mb-3 font-medium text-primary">{data.subtitle}</p>
                    <p className="text-sm leading-relaxed text-foreground/50">{data.desc}</p>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section className="py-20 px-5 bg-card">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3 text-primary">{t.landingPage.howItWorks.tag}</p>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground">
              {t.landingPage.howItWorks.title}
            </h2>
          </FadeIn>
          <div className="grid sm:grid-cols-3 gap-8">
            {STEP_KEYS.map((k, i) => {
              const data = t.landingPage.howItWorks.steps[k]
              return (
                <FadeIn key={k} delay={i * 120}>
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 font-black text-xl bg-primary text-primary-foreground">
                      {STEP_NUMS[k]}
                    </div>
                    <h3 className="font-bold text-base mb-2 text-foreground">{data.title}</h3>
                    <p className="text-sm leading-relaxed text-foreground/50">{data.desc}</p>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      <Testimonials3D />

      {/* ── MASCOTS SHOWCASE ── */}
      <section className="py-20 px-5 bg-primary">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              {t.landingPage.mascots.title1}<br />
              <span className="text-primary-foreground/70">{t.landingPage.mascots.title2}</span>
            </h2>
          </FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { img: '/mascote-alimentacao.png', label: t.landingPage.mascots.nutrition },
              { img: '/mascote-agua.png',        label: t.landingPage.mascots.hydration },
              { img: '/treino.png',              label: t.landingPage.mascots.workout },
              { img: '/sleep.png',               label: t.landingPage.mascots.sleep },
            ].map((m, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="text-center">
                  <div className="rounded-2xl p-4 mb-3 mx-auto w-fit bg-white/10">
                    <img src={m.img} alt={m.label} className="w-20 h-20 object-contain" />
                  </div>
                  <p className="text-sm font-semibold text-white">{m.label}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-5 bg-card">
        <div className="max-w-2xl mx-auto">
          <FadeIn className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3 text-primary">{t.landingPage.faq.tag}</p>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground">{t.landingPage.faq.title}</h2>
          </FadeIn>
          <div className="space-y-2">
            {FAQ_KEYS.map((k, i) => {
              const faq = t.landingPage.faq.items[k]
              return (
                <FadeIn key={k} delay={i * 40}>
                  <div
                    className={`rounded-2xl overflow-hidden transition-all ${openFaq === i ? 'border border-primary' : 'border border-border'}`}
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left"
                    >
                      <span className="font-semibold text-sm pr-4 text-foreground">{faq.q}</span>
                      <ChevronDown
                        className="w-4 h-4 flex-shrink-0 transition-transform text-primary"
                        style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      />
                    </button>
                    {openFaq === i && (
                      <div className="px-5 pb-4">
                        <p className="text-sm leading-relaxed text-foreground/50">{faq.a}</p>
                      </div>
                    )}
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section
        className="py-24 px-5 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1a2e1a 0%, #285B2C 50%, #3d7a42 100%)' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 bg-primary/40" style={{ filter: 'blur(60px)' }} />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-10 bg-primary/40" style={{ filter: 'blur(60px)' }} />
        </div>
        <FadeIn className="relative max-w-2xl mx-auto">
          <img
            src="/zen.png"
            alt="mascote"
            className="w-28 h-28 object-contain mx-auto mb-6 drop-shadow-xl"
          />
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
            {t.landingPage.finalCta.title1}<br />{t.landingPage.finalCta.title2}
          </h2>
          <p className="text-base mb-10 leading-relaxed text-white/75">
            {t.landingPage.finalCta.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/onboarding')}
              className="flex items-center gap-2 px-10 py-4 rounded-full text-base font-bold transition-all hover:opacity-90 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 bg-card text-primary"
            >
              {t.landingPage.finalCta.ctaButton}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
            {[
              t.landingPage.finalCta.benefits.noCard,
              t.landingPage.finalCta.benefits.quick,
              t.landingPage.finalCta.benefits.cancel,
            ].map(label => (
              <div key={label} className="flex items-center gap-1.5 text-xs font-medium text-white/70">
                <Check className="w-3 h-3" />
                {label}
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 px-5" style={{ backgroundColor: '#0f1a0f', borderTop: '1px solid #1e2e1e' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="https://vmfhhwbbwnotugnrdjpm.supabase.co/storage/v1/object/public/icons_app/alimentacao.png" alt="BEM.ai" className="w-7 h-7 object-contain" />
            <span className="font-bold text-sm text-white">BEM.ai</span>
          </div>
          <p className="text-xs text-center text-white/40">
            © {new Date().getFullYear()} BEM.ai. {t.landingPage.footer.rights}
          </p>
          <div className="flex gap-4">
            <button onClick={() => navigate('/login')} className="text-xs text-white/40 transition-colors hover:text-white">{t.landingPage.footer.login}</button>
            <button onClick={() => navigate('/onboarding')} className="text-xs text-white/40 transition-colors hover:text-white">{t.landingPage.footer.start}</button>
          </div>
        </div>
      </footer>

    </div>
  )
}
