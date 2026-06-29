import { useState, useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'
import { ACHIEVEMENTS, ACTIVITY_LABELS } from '@/data/achievements'
import { TIER_COLORS } from '@/data/badges'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const TIER_LABEL: Record<string, string> = {
  bronze: 'Bronze', prata: 'Prata', ouro: 'Ouro', platina: 'Platina', diamante: 'Diamante',
}

// Animação por nível: confete nas conquistas iniciais (bronze/prata),
// troféu dourado nas avançadas (ouro/platina/diamante).
const TIER_VIDEO: Record<string, string> = {
  bronze: '/mascots/celebracao-confete.mp4',
  prata: '/mascots/celebracao-confete.mp4',
  ouro: '/mascots/celebracao-trofeu.mp4',
  platina: '/mascots/celebracao-trofeu.mp4',
  diamante: '/mascots/celebracao-trofeu.mp4',
}

/**
 * Modal global de celebração de conquistas.
 * Observa `pendingAchievements` do AppContext e exibe uma a uma.
 * Renderizado uma vez, alto na árvore (App.tsx).
 */
export function AchievementCelebration() {
  const { pendingAchievements, dismissAchievements } = useApp()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (pendingAchievements.length > 0) setIndex(0)
  }, [pendingAchievements])

  if (pendingAchievements.length === 0) return null

  const achievement = ACHIEVEMENTS.find(a => a.id === pendingAchievements[index])
  if (!achievement) return null

  const total = pendingAchievements.length
  const isLast = index >= total - 1

  const handleNext = () => {
    if (isLast) dismissAchievements()
    else setIndex(i => i + 1)
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) dismissAchievements() }}>
      <DialogContent className="sm:max-w-sm text-center border-secondary/40">
        <DialogHeader>
          <DialogTitle className="sr-only">Conquista desbloqueada</DialogTitle>
          <DialogDescription className="sr-only">{achievement.name}</DialogDescription>
        </DialogHeader>

        {/* Animação da conquista — confete (níveis iniciais) ou troféu (avançados) */}
        <div className="mx-auto w-full aspect-video rounded-2xl overflow-hidden bg-accent/40">
          <video
            key={achievement.id}
            src={TIER_VIDEO[achievement.tier] ?? '/mascots/celebracao-confete.mp4'}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            poster="/mascots/bem-trofeu.png"
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-widest text-accent-foreground">
            ✨ Conquista desbloqueada
          </p>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
            {achievement.name}
          </h2>
          <p className="text-sm text-muted-foreground">{achievement.description}</p>
        </div>

        {/* Chip de tier + atividade */}
        <div className="flex items-center justify-center gap-2">
          <span className={`text-[11px] font-bold text-white px-2.5 py-0.5 rounded-full bg-gradient-to-r ${TIER_COLORS[achievement.tier]}`}>
            {TIER_LABEL[achievement.tier]}
          </span>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
            {ACTIVITY_LABELS[achievement.activity]}
          </span>
        </div>

        <Button onClick={handleNext} className="w-full" size="lg">
          {isLast ? 'Continuar' : `Próxima (${index + 1}/${total})`}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
