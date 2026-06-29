import { useApp } from '@/contexts/AppContext'
import { Flame } from 'lucide-react'
import type { ActivityKind } from '@/types'

/**
 * Mini-indicador de sequência (streak) de uma atividade.
 * Usado nos cabeçalhos das telas de Água, Treino e Sono.
 */
export function ActivityStreak({ activity, className = '' }: { activity: ActivityKind; className?: string }) {
  const { gamification } = useApp()
  const streak = gamification.streaks[activity]

  if (!streak || streak.currentStreak < 1) return null

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full bg-accent text-accent-foreground px-3 py-1 text-xs font-bold ${className}`}>
      <Flame className="w-3.5 h-3.5" />
      {streak.currentStreak} {streak.currentStreak === 1 ? 'dia' : 'dias'}
    </div>
  )
}
