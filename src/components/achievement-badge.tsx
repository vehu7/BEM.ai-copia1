import type { XPAchievement, AchievementCategory } from '@/lib/gamification'
import { CATEGORY_COLORS } from '@/lib/gamification'

interface AchievementBadgeProps {
  achievement: XPAchievement
  earned: boolean
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_MAP = {
  sm: { outer: 48, inner: 36, emoji: 20, borderWidth: 2 },
  md: { outer: 64, inner: 48, emoji: 28, borderWidth: 3 },
  lg: { outer: 80, inner: 60, emoji: 36, borderWidth: 3 },
}

/**
 * Badge SVG para cada conquista.
 * Exibe o emoji da conquista dentro de um círculo com borda colorida por categoria.
 * Se `earned=false`, aplica grayscale + opacidade 40%.
 * Se `earned=true`, adiciona animação de brilho sutil via CSS pulse.
 */
export function AchievementBadge({ achievement, earned, size = 'md' }: AchievementBadgeProps) {
  const { outer, inner, emoji: emojiSize, borderWidth } = SIZE_MAP[size]
  const color = CATEGORY_COLORS[achievement.category as AchievementCategory]
  const half = outer / 2
  const innerHalf = inner / 2
  const gradId = `grad-${achievement.id}`
  const glowId = `glow-${achievement.id}`

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: outer, height: outer }}
      title={`${achievement.name}${earned ? '' : ' (bloqueada)'}`}
    >
      {earned && (
        <style>{`
          @keyframes badgePulse-${achievement.id} {
            0%, 100% { opacity: 1; transform: scale(1); }
            50%       { opacity: 0.85; transform: scale(1.04); }
          }
          .badge-pulse-${achievement.id} {
            animation: badgePulse-${achievement.id} 3s ease-in-out infinite;
          }
        `}</style>
      )}

      <svg
        width={outer}
        height={outer}
        viewBox={`0 0 ${outer} ${outer}`}
        xmlns="http://www.w3.org/2000/svg"
        className={earned ? `badge-pulse-${achievement.id}` : ''}
        style={{
          filter: earned ? 'none' : 'grayscale(1)',
          opacity: earned ? 1 : 0.4,
        }}
        aria-label={achievement.name}
        role="img"
      >
        <defs>
          {/* Gradiente radial sutil para o fundo */}
          <radialGradient id={gradId} cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0.06" />
          </radialGradient>

          {/* Filtro de brilho para badges earned */}
          {earned && (
            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          )}
        </defs>

        {/* Círculo de fundo com gradiente */}
        <circle
          cx={half}
          cy={half}
          r={innerHalf}
          fill={`url(#${gradId})`}
        />

        {/* Borda colorida da categoria */}
        <circle
          cx={half}
          cy={half}
          r={innerHalf}
          fill="none"
          stroke={color}
          strokeWidth={borderWidth}
          opacity={earned ? 1 : 0.6}
        />

        {/* Segundo anel externo (decorativo, menos opaco) */}
        <circle
          cx={half}
          cy={half}
          r={half - 2}
          fill="none"
          stroke={color}
          strokeWidth={1}
          strokeDasharray="3 4"
          opacity={earned ? 0.35 : 0.2}
        />

        {/* Emoji centralizado via foreignObject */}
        <foreignObject
          x={(outer - emojiSize * 1.4) / 2}
          y={(outer - emojiSize * 1.4) / 2}
          width={emojiSize * 1.4}
          height={emojiSize * 1.4}
        >
          <div
            style={{
              fontSize: emojiSize,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              userSelect: 'none',
            }}
          >
            {achievement.emoji}
          </div>
        </foreignObject>
      </svg>
    </div>
  )
}
