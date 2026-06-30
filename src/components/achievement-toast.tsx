import { useEffect, useRef } from 'react'
import type { XPAchievement } from '@/lib/gamification'

interface AchievementToastProps {
  achievement: XPAchievement
  xpGained: number
  onClose: () => void
}

/**
 * Toast de conquista — aparece no topo por 4 segundos com animação de entrada/saída.
 * Usa apenas Tailwind + style inline, sem libs externas.
 */
export function AchievementToast({ achievement, xpGained, onClose }: AchievementToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(onClose, 4000)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [onClose])

  return (
    <>
      <style>{`
        @keyframes achievementSlideDown {
          from { transform: translateY(-110%) scale(0.9); opacity: 0; }
          to   { transform: translateY(0)    scale(1);   opacity: 1; }
        }
        @keyframes achievementShine {
          0%   { opacity: 0.3; transform: translateX(-100%) skewX(-15deg); }
          50%  { opacity: 0.6; }
          100% { opacity: 0;   transform: translateX(200%)  skewX(-15deg); }
        }
        .achievement-toast-enter {
          animation: achievementSlideDown 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .achievement-shine::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%);
          animation: achievementShine 1.4s ease-in-out 0.5s both;
        }
      `}</style>

      <div
        className="achievement-toast-enter fixed top-4 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm"
        style={{ transform: 'translateX(-50%)' }}
      >
        <div
          className="achievement-shine relative overflow-hidden rounded-2xl shadow-2xl border border-white/20 flex items-center gap-4 px-4 py-3"
          style={{
            background: 'linear-gradient(135deg, oklch(0.52 0.16 145) 0%, oklch(0.65 0.18 145) 100%)',
            color: '#fff',
          }}
        >
          {/* Emoji grande */}
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-xl"
            style={{ fontSize: 48, lineHeight: 1, width: 60, height: 60, background: 'rgba(255,255,255,0.15)' }}
            aria-hidden
          >
            {achievement.emoji}
          </div>

          {/* Texto */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest opacity-80 mb-0.5">
              Conquista desbloqueada!
            </p>
            <p className="text-base font-black leading-tight truncate">{achievement.name}</p>
            <p className="text-xs opacity-80 leading-tight mt-0.5 line-clamp-1">{achievement.description}</p>
          </div>

          {/* XP badge */}
          <div
            className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl px-3 py-2"
            style={{ background: 'rgba(255,255,255,0.2)', minWidth: 52 }}
          >
            <span className="text-lg font-black leading-none">+{xpGained}</span>
            <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">XP</span>
          </div>

          {/* Botão fechar */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Fechar"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}
