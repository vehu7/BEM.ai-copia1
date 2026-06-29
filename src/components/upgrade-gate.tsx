import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Lock, Sparkles, ArrowRight } from 'lucide-react'
import { useTranslation } from '@/contexts/LanguageContext'

interface UpgradeGateProps {
  featureName: string
  description: string
  icon?: React.ReactNode
}

/**
 * Tela genérica mostrada quando uma feature exige Premium (durante o trial).
 * Usada no chat IA e na geração de treinos.
 */
export function UpgradeGate({ featureName, description, icon }: UpgradeGateProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const tu = t.trial.upgradeGate

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pb-24">
      <Card className="max-w-md w-full border-primary/30">
        <CardContent className="pt-8 pb-6 space-y-5 text-center">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                {icon ?? <Lock className="w-9 h-9 text-primary" />}
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-warning flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4 text-warning-foreground" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="font-display text-xl font-extrabold tracking-tight">{featureName} {tu.isPremium}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          <div className="bg-primary/5 rounded-lg p-3 text-xs text-muted-foreground">
            {tu.trialFeatures} <strong>{tu.trialFeaturesHighlight1}</strong>,{' '}
            <strong>{tu.trialFeaturesHighlight2}</strong>{' '}
            <strong>{tu.trialFeaturesHighlight3}</strong>.
          </div>

          <Button size="lg" className="w-full cursor-pointer" onClick={() => navigate('/planos')}>
            {tu.viewPlans}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <button
            onClick={() => navigate('/')}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {tu.backHome}
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
