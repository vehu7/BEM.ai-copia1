import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/contexts/AppContext'
import { AchievementBadge } from '@/components/achievement-badge'
import {
  XP_ACHIEVEMENTS,
  getLevelForXP,
  getProgressToNextLevel,
  getLevelName,
  CATEGORY_LABELS,
} from '@/lib/gamification'
import type { AchievementCategory, XPAchievement } from '@/lib/gamification'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type FilterCategory = 'todas' | AchievementCategory

const FILTER_OPTIONS: { value: FilterCategory; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'primeiros_passos', label: '🌱 Primeiros Passos' },
  { value: 'hidratacao', label: '💧 Hidratação' },
  { value: 'nutricao', label: '🥗 Nutrição' },
  { value: 'treino', label: '💪 Treino' },
  { value: 'sono', label: '😴 Sono' },
  { value: 'progresso', label: '🏆 Progresso' },
]

export function Achievements() {
  const { user } = useApp()
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('todas')
  const [selectedBadge, setSelectedBadge] = useState<XPAchievement | null>(null)

  const totalXP = user?.totalXP ?? 0
  const earnedIds: string[] = user?.xpAchievements ?? []
  const currentLevel = getLevelForXP(totalXP)
  const xpProgress = getProgressToNextLevel(totalXP)
  const gender = user?.gender
  const levelName = getLevelName(currentLevel.level - 1, gender)

  const totalBadges = XP_ACHIEVEMENTS.length
  const unlockedCount = earnedIds.length

  // Filter then sort: earned first, then locked
  const filtered = XP_ACHIEVEMENTS.filter(
    a => activeFilter === 'todas' || a.category === activeFilter
  )
  const sorted = [
    ...filtered.filter(a => earnedIds.includes(a.id)),
    ...filtered.filter(a => !earnedIds.includes(a.id)),
  ]

  const earnedBadge = selectedBadge ? earnedIds.includes(selectedBadge.id) : false

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-2xl mx-auto">

        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent transition-colors"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold leading-tight">Minhas Conquistas</h1>
            <p className="text-xs text-muted-foreground">
              {unlockedCount} de {totalBadges} desbloqueadas
            </p>
          </div>
        </div>

        <div className="px-4 pt-5 space-y-5">

          {/* Barra de XP / Nível */}
          <div className="rounded-2xl bg-card border border-border p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl leading-none" aria-hidden>{currentLevel.emoji}</span>
                <div>
                  <p className="font-bold text-sm leading-tight">{levelName}</p>
                  <p className="text-xs text-muted-foreground">Nível {currentLevel.level}</p>
                </div>
              </div>
              <span className="text-sm font-bold text-primary tabular-nums">{totalXP} XP</span>
            </div>
            <div className="space-y-1">
              <Progress value={xpProgress.percentage} className="h-2.5" />
              {!xpProgress.isMaxLevel ? (
                <p className="text-[11px] text-muted-foreground text-right">
                  {xpProgress.current}/{xpProgress.required} XP para o próximo nível
                </p>
              ) : (
                <p className="text-[11px] text-primary font-semibold text-right">Nível máximo atingido! 💎</p>
              )}
            </div>
          </div>

          {/* Filtros por categoria */}
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
              {FILTER_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setActiveFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                    activeFilter === opt.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Separador de categoria */}
          {activeFilter !== 'todas' && (
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {CATEGORY_LABELS[activeFilter as AchievementCategory]}
              <span className="ml-2 font-normal normal-case">
                ({sorted.filter(a => earnedIds.includes(a.id)).length}/{sorted.length} desbloqueadas)
              </span>
            </p>
          )}

          {/* Grid de badges */}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pb-4">
            {sorted.map(achievement => {
              const earned = earnedIds.includes(achievement.id)
              return (
                <button
                  key={achievement.id}
                  onClick={() => setSelectedBadge(achievement)}
                  className="flex flex-col items-center gap-1 group focus:outline-none"
                  title={achievement.name}
                >
                  <AchievementBadge achievement={achievement} earned={earned} size="md" />
                  <span className={`text-[10px] text-center leading-tight line-clamp-2 max-w-[64px] transition-colors ${
                    earned ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}>
                    {achievement.name}
                  </span>
                </button>
              )
            })}
          </div>

          {sorted.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-sm">Nenhuma conquista nesta categoria</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalhe do badge */}
      <Dialog open={!!selectedBadge} onOpenChange={open => { if (!open) setSelectedBadge(null) }}>
        <DialogContent className="max-w-xs mx-auto">
          <button
            onClick={() => setSelectedBadge(null)}
            className="absolute right-4 top-4 w-6 h-6 flex items-center justify-center rounded-full bg-muted hover:bg-accent transition-colors"
            aria-label="Fechar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          {selectedBadge && (
            <div className="flex flex-col items-center gap-4 py-2">
              <AchievementBadge achievement={selectedBadge} earned={earnedBadge} size="lg" />

              <DialogHeader className="text-center space-y-1">
                <DialogTitle className="text-base font-bold">{selectedBadge.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">{selectedBadge.description}</p>
              </DialogHeader>

              <div className={`w-full rounded-xl p-3 text-center space-y-1 ${earnedBadge ? 'bg-primary/10' : 'bg-muted/60'}`}>
                {earnedBadge ? (
                  <>
                    <p className="text-xs text-muted-foreground">Conquista desbloqueada</p>
                    <p className="text-sm font-bold text-primary">+{selectedBadge.xpReward} XP ganhos</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground font-medium">Como desbloquear</p>
                    <p className="text-sm text-foreground">{selectedBadge.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Recompensa: +{selectedBadge.xpReward} XP</p>
                  </>
                )}
              </div>

              <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-accent">
                {CATEGORY_LABELS[selectedBadge.category]}
              </span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
