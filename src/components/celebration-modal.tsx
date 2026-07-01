import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export type CelebrationKind =
  | 'badge'       // ganhou conquista/badge
  | 'goal'        // bateu meta do dia (água, calorias, proteína)
  | 'challenge'   // completou desafio semanal
  | 'level'       // subiu de nível
  | 'streak'      // streak milestone (7, 14, 30 dias)

interface CelebrationModalProps {
  open: boolean
  kind: CelebrationKind
  title: string
  subtitle?: string
  xpGained?: number
  onClose: () => void
}

const CONFIG: Record<CelebrationKind, { mascot: string; video?: string; bg: string; accent: string; emoji: string }> = {
  badge: {
    mascot: '/mascots/koala-conquista.webp',
    video: '/mascots/conquista.mp4',
    bg: 'from-violet-900 to-indigo-900',
    accent: '#a78bfa',
    emoji: '🏅',
  },
  goal: {
    mascot: '/mascots/koala-celebracao.webp',
    video: '/mascots/celebracao-confete.mp4',
    bg: 'from-emerald-900 to-teal-900',
    accent: '#34d399',
    emoji: '🎯',
  },
  challenge: {
    mascot: '/mascots/bem-trofeu.png',
    video: '/mascots/celebracao-trofeu.mp4',
    bg: 'from-amber-900 to-orange-900',
    accent: '#fbbf24',
    emoji: '🏆',
  },
  level: {
    mascot: '/mascots/bem-trofeu.png',
    video: '/mascots/celebracao-trofeu.mp4',
    bg: 'from-blue-900 to-cyan-900',
    accent: '#38bdf8',
    emoji: '⭐',
  },
  streak: {
    mascot: '/mascots/koala-celebracao.webp',
    video: '/mascots/celebracao-confete.mp4',
    bg: 'from-rose-900 to-pink-900',
    accent: '#fb7185',
    emoji: '🔥',
  },
}

export function CelebrationModal({ open, kind, title, subtitle, xpGained, onClose }: CelebrationModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const cfg = CONFIG[kind]

  useEffect(() => {
    if (open && videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {})
    }
  }, [open])

  // Fecha ao pressionar Esc
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Fecha automaticamente após 4s
  useEffect(() => {
    if (!open) return
    const id = setTimeout(onClose, 4000)
    return () => clearTimeout(id)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-5"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-sm rounded-3xl overflow-hidden bg-gradient-to-br ${cfg.bg} shadow-2xl`}
        onClick={e => e.stopPropagation()}
        style={{
          animation: 'celebrationPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}
      >
        {/* Vídeo de fundo (loop desativado — toca 1x) */}
        {cfg.video && (
          <video
            ref={videoRef}
            src={cfg.video}
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}

        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Conteúdo */}
        <div className="relative z-10 flex flex-col items-center text-center px-7 pt-8 pb-8">
          {/* Mascote */}
          <div
            className="w-36 h-36 mb-4"
            style={{ animation: 'mascotBounce 0.6s ease 0.2s both' }}
          >
            <img
              src={cfg.mascot}
              alt="BEM comemora"
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </div>

          {/* Emoji flutuante */}
          <span
            className="text-4xl mb-3"
            style={{ animation: 'floatEmoji 1.5s ease-in-out infinite alternate' }}
          >
            {cfg.emoji}
          </span>

          {/* Título */}
          <h2
            className="text-2xl font-black text-white mb-2 leading-tight"
            style={{ animation: 'fadeSlideUp 0.5s ease 0.3s both' }}
          >
            {title}
          </h2>

          {/* Subtítulo */}
          {subtitle && (
            <p
              className="text-sm text-white/70 mb-4 leading-relaxed"
              style={{ animation: 'fadeSlideUp 0.5s ease 0.4s both' }}
            >
              {subtitle}
            </p>
          )}

          {/* XP ganho */}
          {xpGained && xpGained > 0 && (
            <div
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-sm"
              style={{
                background: `${cfg.accent}25`,
                border: `2px solid ${cfg.accent}`,
                color: cfg.accent,
                animation: 'fadeSlideUp 0.5s ease 0.5s both',
              }}
            >
              <span>⭐</span>
              <span>+{xpGained} XP</span>
            </div>
          )}

          {/* Barra de progresso que avança como o timer de fechar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden rounded-b-3xl">
            <div
              className="h-full rounded-full"
              style={{
                background: cfg.accent,
                animation: 'timerBar 4s linear forwards',
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes celebrationPop {
          0%   { opacity: 0; transform: scale(0.7) translateY(40px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes mascotBounce {
          0%   { opacity: 0; transform: scale(0.5) rotate(-10deg); }
          70%  { transform: scale(1.1) rotate(3deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes floatEmoji {
          from { transform: translateY(0px) rotate(-5deg); }
          to   { transform: translateY(-8px) rotate(5deg); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes timerBar {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  )
}
