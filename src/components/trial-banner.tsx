import { useApp } from '@/contexts/AppContext'
import { getTrialStatus } from '@/lib/subscription'
import { Sparkles, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTranslation } from '@/contexts/LanguageContext'

const DISMISS_KEY_PREFIX = 'bemai_trial_banner_dismissed_'

export function TrialBanner() {
  const { user, sessionEmail } = useApp()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const status = getTrialStatus(user, sessionEmail)

  // Dismiss do dia — reaparece no próximo dia
  const todayKey = DISMISS_KEY_PREFIX + new Date().toISOString().split('T')[0]
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(todayKey) === '1')

  useEffect(() => {
    setDismissed(localStorage.getItem(todayKey) === '1')
  }, [todayKey])

  if (!user) return null
  if (status.isPremium) return null
  if (status.isTrialExpired) return null
  if (dismissed) return null

  const handleDismiss = () => {
    localStorage.setItem(todayKey, '1')
    setDismissed(true)
  }

  const dayText = status.daysRemaining === 1
    ? t.trial.banner.expiresToday
    : t.trial.banner.expiresInDays.replace('{days}', String(status.daysRemaining))

  const urgent = status.daysRemaining <= 2

  return (
    <div
      className={`w-full px-3 py-2 flex items-center justify-between gap-2 text-xs sm:text-sm ${
        urgent ? 'bg-warning text-warning-foreground' : 'bg-primary text-primary-foreground'
      }`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Sparkles className="w-4 h-4 flex-shrink-0" />
        <span className="truncate font-medium">{dayText}</span>
      </div>
      <button
        onClick={() => navigate('/planos')}
        className="flex-shrink-0 bg-black/10 hover:bg-black/20 active:bg-black/25 transition-colors rounded-full px-3 py-1 text-xs font-semibold cursor-pointer"
      >
        {t.trial.banner.subscribeNow}
      </button>
      <button
        onClick={handleDismiss}
        aria-label={t.trial.banner.close}
        className="flex-shrink-0 p-1 hover:bg-black/10 rounded-full transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
