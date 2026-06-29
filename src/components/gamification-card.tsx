import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { ACHIEVEMENTS, ACTIVITY_LABELS } from '@/data/achievements'
import { TIER_COLORS, TIER_BG } from '@/data/badges'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Trophy, Flame, ChevronRight, Lock,
  Droplet, Droplets, GlassWater, Waves, CloudRain,
  Dumbbell, Activity, Zap, Moon, Cloud, Star, Sparkles, Crown,
} from 'lucide-react'
import type { ActivityKind, AchievementDefinition } from '@/types'

const ICONS: Record<string, React.ElementType> = {
  Droplet, Droplets, GlassWater, Waves, CloudRain,
  Dumbbell, Activity, Flame, Zap, Trophy, Moon, Cloud, Star, Sparkles, Crown,
}

const ACTIVITY_ICON: Record<ActivityKind, React.ElementType> = {
  water: Droplet, workout: Dumbbell, sleep: Moon,
}

const ACTIVITY_ORDER: ActivityKind[] = ['water', 'workout', 'sleep']

// Conquistas de nível alto ganham a medalha BEM.ai no lugar do ícone simples.
const HIGH_TIERS = ['ouro', 'platina', 'diamante']

function AchievementItem({ achievement, unlocked }: { achievement: AchievementDefinition; unlocked: boolean }) {
  const Icon = ICONS[achievement.icon] ?? Trophy
  const isHighTier = unlocked && HIGH_TIERS.includes(achievement.tier)
  return (
    <div className={`flex items-center gap-3 rounded-xl p-3 transition-all ${unlocked ? TIER_BG[achievement.tier] : 'bg-muted/40 opacity-60'}`}>
      {isHighTier ? (
        <img src="/mascots/medalha.png" alt="Medalha" className="w-11 h-11 object-contain flex-shrink-0 drop-shadow-sm" />
      ) : (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          unlocked ? `bg-gradient-to-br ${TIER_COLORS[achievement.tier]} text-white shadow-sm` : 'bg-muted text-muted-foreground'
        }`}>
          {unlocked ? <Icon className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground leading-tight">{achievement.name}</p>
        <p className="text-xs text-muted-foreground leading-tight">{achievement.description}</p>
      </div>
    </div>
  )
}

export function GamificationCard() {
  const { gamification } = useApp()
  const [showGallery, setShowGallery] = useState(false)

  const unlockedCount = gamification.unlockedAchievements.length
  const total = ACHIEVEMENTS.length

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-secondary" />
              Conquistas
            </span>
            <button
              onClick={() => setShowGallery(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-accent text-accent-foreground hover:brightness-95 transition-all"
            >
              {unlockedCount}/{total}
              <ChevronRight className="w-3 h-3" />
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {ACTIVITY_ORDER.map(activity => {
              const Icon = ACTIVITY_ICON[activity]
              const streak = gamification.streaks[activity]
              return (
                <button
                  key={activity}
                  onClick={() => setShowGallery(true)}
                  className="flex flex-col items-center gap-1 rounded-xl bg-muted/50 hover:bg-accent p-3 transition-colors"
                >
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="text-[11px] text-muted-foreground font-medium">{ACTIVITY_LABELS[activity]}</span>
                  <span className="flex items-center gap-1 text-sm font-bold text-foreground">
                    {streak.currentStreak > 0 && <Flame className="w-3.5 h-3.5 text-secondary" />}
                    {streak.currentStreak}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Galeria de conquistas */}
      <Dialog open={showGallery} onOpenChange={setShowGallery}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-secondary" />
              Suas Conquistas
            </DialogTitle>
          </DialogHeader>

          {/* Herói: troféu quando já tem conquistas; koala animado no estado inicial */}
          <div className="flex flex-col items-center gap-1 -mt-1">
            {unlockedCount === 0 ? (
              <>
                <img src="/mascots/bem-feliz.png" alt="Mascote comemorando" className="w-28 h-28 object-contain" />
                <p className="text-sm text-muted-foreground text-center px-4">
                  Sua primeira conquista está chegando! É só bater suas metas do dia. 🌟
                </p>
              </>
            ) : (
              <>
                <img src="/mascots/trofeu.png" alt="Troféu BEM.ai" className="w-24 h-24 object-contain drop-shadow-md" />
                <p className="text-sm font-semibold text-foreground">{unlockedCount} de {total} conquistas</p>
              </>
            )}
          </div>

          <div className="space-y-4 mt-2">
            {ACTIVITY_ORDER.map(activity => {
              const list = ACHIEVEMENTS.filter(a => a.activity === activity)
              const streak = gamification.streaks[activity]
              return (
                <div key={activity} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground">{ACTIVITY_LABELS[activity]}</h3>
                    {streak.currentStreak > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary">
                        <Flame className="w-3.5 h-3.5" />
                        {streak.currentStreak} {streak.currentStreak === 1 ? 'dia' : 'dias'} · recorde {streak.longestStreak}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {list.map(a => (
                      <AchievementItem
                        key={a.id}
                        achievement={a}
                        unlocked={gamification.unlockedAchievements.includes(a.id)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
