import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { BADGES, TIER_COLORS, TIER_BG } from '@/data/badges'
import {
  Flame, Trophy, CheckCircle, Lock,
  Footprints, Target, Brain, Shield, Zap, Star, Crown,
} from 'lucide-react'
import { toast } from 'sonner'
import type { BadgeDefinition } from '@/types'

const ICON_MAP: Record<string, React.ElementType> = {
  Footprints, Flame, Target, Brain, Shield, Zap, Star, Crown, Trophy,
}

function BadgeCard({ badge, unlocked }: { badge: BadgeDefinition; unlocked: boolean }) {
  const Icon = ICON_MAP[badge.icon] ?? Trophy

  return (
    <div
      className={`relative flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all ${
        unlocked ? TIER_BG[badge.tier] : 'bg-muted/40 opacity-50'
      }`}
    >
      <div
        className={`w-11 h-11 rounded-full flex items-center justify-center ${
          unlocked
            ? `bg-gradient-to-br ${TIER_COLORS[badge.tier]} text-white shadow-md`
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {unlocked ? <Icon className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
      </div>
      <span className="text-[11px] font-bold text-center leading-tight">{badge.name}</span>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">{badge.description}</span>
    </div>
  )
}

export function DailyCheckin() {
  const { checkInState, performCheckIn } = useApp()
  const [showBadges, setShowBadges] = useState(false)

  const localToday = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()
  const alreadyCheckedIn = checkInState.history.some(e => e.date === localToday)

  const nextBadge = BADGES.find(b => !checkInState.unlockedBadges.includes(b.id))
  const progressToNext = nextBadge
    ? Math.min((checkInState.currentStreak / nextBadge.requiredDays) * 100, 100)
    : 100

  const handleCheckIn = () => {
    if (alreadyCheckedIn) return
    const newBadges = performCheckIn()
    if (newBadges.length > 0) {
      const badge = BADGES.find(b => b.id === newBadges[newBadges.length - 1])
      if (badge) {
        toast.success(`Nova medalha desbloqueada!`, {
          description: `${badge.name} — ${badge.description}`,
        })
      }
    } else {
      toast.success('Check-in feito!', {
        description: `Sequência: ${checkInState.currentStreak + 1} dia(s)`,
      })
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-primary" />
              Check-in Diário
            </span>
            <button
              onClick={() => setShowBadges(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-accent text-accent-foreground hover:brightness-95 transition-all"
            >
              <Trophy className="w-3 h-3" />
              {checkInState.unlockedBadges.length}/{BADGES.length} medalhas
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Streak info */}
          {alreadyCheckedIn ? (
            <div className="flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3">
              <div className="flex flex-col items-center flex-shrink-0">
                <span className="text-3xl font-black text-primary leading-none">{checkInState.currentStreak}</span>
                <span className="text-[10px] text-primary/80 font-semibold uppercase tracking-wide">dias</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground leading-tight">
                  {checkInState.currentStreak >= 30
                    ? 'Você é uma força da natureza! 🏆'
                    : checkInState.currentStreak >= 14
                    ? 'Duas semanas seguidas — incrível! 🌟'
                    : checkInState.currentStreak >= 7
                    ? 'Uma semana completa — você manda! 🔥'
                    : checkInState.currentStreak >= 3
                    ? 'Sequência forte — não pare agora! 💪'
                    : 'Check-in de hoje feito! Amanhã de novo 🎯'}
                </p>
                <p className="text-xs text-muted-foreground">Recorde pessoal: {checkInState.longestStreak} dia(s)</p>
              </div>
              <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-black text-foreground">
                  {checkInState.currentStreak}
                  <span className="text-sm font-normal text-muted-foreground ml-1">dia(s)</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Recorde: {checkInState.longestStreak} dia(s)
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleCheckIn}
                className="gap-2"
              >
                <Flame className="w-4 h-4" />
                Fazer Check-in
              </Button>
            </div>
          )}

          {/* Progress to next badge */}
          {nextBadge && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Próxima medalha: <span className="font-semibold text-accent-foreground">{nextBadge.name}</span>
                </span>
                <span className="text-muted-foreground tabular-nums">{checkInState.currentStreak}/{nextBadge.requiredDays}</span>
              </div>
              <Progress value={progressToNext} className="h-2" />
            </div>
          )}

          {!nextBadge && (
            <p className="text-xs text-primary font-medium text-center">
              Todas as medalhas desbloqueadas!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Badges dialog */}
      <Dialog open={showBadges} onOpenChange={setShowBadges}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Suas Medalhas
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {BADGES.map(badge => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                unlocked={checkInState.unlockedBadges.includes(badge.id)}
              />
            ))}
          </div>
          <div className="text-center text-xs text-muted-foreground mt-3 space-y-1">
            <p>Sequência atual: <strong>{checkInState.currentStreak}</strong> dia(s)</p>
            <p>Recorde pessoal: <strong>{checkInState.longestStreak}</strong> dia(s)</p>
            <p>Total de check-ins: <strong>{checkInState.history.length}</strong></p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
