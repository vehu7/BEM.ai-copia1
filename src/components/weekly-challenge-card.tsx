import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useApp } from '@/contexts/AppContext'
import { getWeeklyChallenges, daysUntilWeekEnd, type WeeklyChallenge } from '@/lib/gamification'

// ── Tipos de persistência ─────────────────────────────────────────────────────

interface ChallengeState {
  accepted: boolean
  progress: number
  completed: boolean
}

type WeekStorage = Record<string, ChallengeState>

function getWeekNumber(): number {
  return Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
}

function storageKey(): string {
  return `bem_challenges_${getWeekNumber()}`
}

function loadStorage(): WeekStorage {
  try {
    const raw = localStorage.getItem(storageKey())
    return raw ? (JSON.parse(raw) as WeekStorage) : {}
  } catch {
    return {}
  }
}

function saveStorage(data: WeekStorage): void {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(data))
  } catch {
    // quota exceeded — fail silently
  }
}

// ── Componente ────────────────────────────────────────────────────────────────

export function WeeklyChallengeCard() {
  const { awardXP, triggerCelebration } = useApp()

  const challenges = getWeeklyChallenges()
  const daysLeft = daysUntilWeekEnd()

  const [storage, setStorage] = useState<WeekStorage>(loadStorage)

  // Sincroniza storage → localStorage sempre que muda
  useEffect(() => {
    saveStorage(storage)
  }, [storage])

  const getState = useCallback(
    (id: string): ChallengeState =>
      storage[id] ?? { accepted: false, progress: 0, completed: false },
    [storage]
  )

  const accept = (challenge: WeeklyChallenge) => {
    setStorage(prev => ({
      ...prev,
      [challenge.id]: { accepted: true, progress: 0, completed: false },
    }))
  }

  const incrementProgress = (challenge: WeeklyChallenge) => {
    const state = getState(challenge.id)
    if (!state.accepted || state.completed) return

    const newProgress = Math.min(state.progress + 1, challenge.goal)
    const nowCompleted = newProgress >= challenge.goal

    setStorage(prev => ({
      ...prev,
      [challenge.id]: { accepted: true, progress: newProgress, completed: nowCompleted },
    }))

    if (nowCompleted) {
      awardXP('COMPLETE_WEEKLY_CHALLENGE')
      triggerCelebration?.({
        kind: 'challenge',
        title: 'Desafio concluído! 🏆',
        subtitle: challenge.title,
        xpGained: challenge.xpReward,
      })
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            🎯 Desafios da Semana
          </CardTitle>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {daysLeft === 0 ? 'Último dia!' : `${daysLeft} dia${daysLeft > 1 ? 's' : ''} restante${daysLeft > 1 ? 's' : ''}`}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {challenges.map((challenge, idx) => {
          const state = getState(challenge.id)
          return (
            <div key={challenge.id}>
              {idx > 0 && <div className="border-t mb-3" />}
              <ChallengeRow
                challenge={challenge}
                state={state}
                onAccept={() => accept(challenge)}
                onIncrement={() => incrementProgress(challenge)}
              />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// ── Linha individual de desafio ───────────────────────────────────────────────

interface ChallengeRowProps {
  challenge: WeeklyChallenge
  state: ChallengeState
  onAccept: () => void
  onIncrement: () => void
}

function ChallengeRow({ challenge, state, onAccept, onIncrement }: ChallengeRowProps) {
  const percentage = state.accepted
    ? Math.round((state.progress / challenge.goal) * 100)
    : 0

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span className="text-lg leading-none mt-0.5">{challenge.emoji}</span>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight">{challenge.title}</p>
            <p className="text-xs text-muted-foreground leading-snug mt-0.5">
              {challenge.description}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          {state.completed ? (
            <span
              className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap"
              style={{
                background: 'color-mix(in oklch, var(--color-celebration) 15%, transparent)',
                color: 'var(--color-celebration)',
              }}
            >
              ✓ Concluído! +{challenge.xpReward} XP
            </span>
          ) : state.accepted ? (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 px-2"
              onClick={onIncrement}
            >
              +1 {challenge.unit.replace(/s$/, '')}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2 bg-primary/10 text-primary hover:bg-primary/20"
              onClick={onAccept}
            >
              Participar →
            </Button>
          )}
        </div>
      </div>

      {state.accepted && !state.completed && (
        <div className="flex items-center gap-2">
          <Progress value={percentage} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground shrink-0">
            {state.progress}/{challenge.goal} {challenge.unit}
          </span>
        </div>
      )}

      {state.accepted && state.completed && (
        <div className="flex items-center gap-2">
          <Progress value={100} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground shrink-0">
            {challenge.goal}/{challenge.goal} {challenge.unit}
          </span>
        </div>
      )}
    </div>
  )
}
