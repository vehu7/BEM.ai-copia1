import { useApp } from '@/contexts/AppContext'
import { useTranslation } from '@/contexts/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Plus, RotateCcw } from 'lucide-react'
import { ActivityStreak } from '@/components/activity-streak'
import { toast } from 'sonner'

const GLASS_SIZES = [
  { label: '50ml', value: 50 },
  { label: '200ml', value: 200 },
  { label: '300ml', value: 300 },
  { label: '500ml', value: 500 },
  { label: '1L', value: 1000 }
]

function getTodayWaterGoalKey(): string {
  return 'bem_water_goal_' + new Date().toISOString().slice(0, 10)
}

export function WaterTracker() {
  const { user, todayWater, addWater, resetWater, awardXP, triggerCelebration } = useApp()
  const { t } = useTranslation()

  if (!user) return null

  const progress = Math.min((todayWater.consumed / todayWater.target) * 100, 100)
  const remainingWater = Math.max(0, todayWater.target - todayWater.consumed)
  const isComplete = progress >= 100

  const handleAddWater = (amount: number) => {
    addWater(amount)
    // XP por registrar água
    awardXP('REGISTER_WATER')
    setTimeout(() => { toast.success('+5 XP ganhos!', { icon: '⚡' }) }, 800)

    // XP por atingir meta hídrica (só uma vez por dia)
    const newConsumed = todayWater.consumed + amount
    const key = getTodayWaterGoalKey()
    if (todayWater.target > 0 && newConsumed >= todayWater.target && !localStorage.getItem(key)) {
      localStorage.setItem(key, '1')
      awardXP('HIT_WATER_GOAL')
      setTimeout(() => triggerCelebration({
        kind: 'goal',
        title: 'Meta de hidratação! 💧',
        subtitle: `Você bebeu ${todayWater.target}ml hoje. Seu corpo agradece!`,
        xpGained: 20,
      }), 400)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto p-4 pb-24 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <img src="/mascots/koala-agua.png" alt="Mascote" className="w-32 h-32 mx-auto object-contain" />
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{t.water.title}</h1>
          <p className="text-muted-foreground">{t.water.subtitle}</p>
          <ActivityStreak activity="water" />
        </div>

        {/* Progresso + Adicionar água */}
        <Card className="border-primary/40">
          <CardContent className="pt-5 space-y-5">

            {/* Números e progresso */}
            <div className="text-center space-y-3">
              <div>
                <div className="font-display text-4xl font-extrabold tracking-tight text-primary">
                  {todayWater.consumed}ml
                </div>
                <div className="text-sm text-muted-foreground">
                  {t.common.of} {todayWater.target}ml
                </div>
              </div>
              <div className="space-y-1.5">
                <Progress value={progress} className="h-3" />
                <div className="text-sm">
                  {isComplete ? (
                    <span className="text-primary font-medium">
                      🎉 {t.water.goalReached}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {t.water.remaining} {remainingWater}ml ({Math.ceil(remainingWater / 200)} {t.water.cups})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Divisor */}
            <div className="border-t border-border" />

            {/* Botões de quantidade */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">{t.water.selectAmount}</p>
              <div className="grid grid-cols-2 gap-3">
                {GLASS_SIZES.map((size) => (
                  <Button
                    key={size.value}
                    variant="outline"
                    size="lg"
                    onClick={() => handleAddWater(size.value)}
                    className="h-auto py-4 flex flex-col gap-1"
                  >
                    <Plus className="w-5 h-5 text-primary" />
                    <span className="font-bold">{size.value === 200 ? t.water.cup200 : size.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {todayWater.consumed > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetWater}
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {t.water.resetDay}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Dicas */}
        <Card>
          <CardHeader>
            <CardTitle>{t.water.tipsTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium text-sm">{t.water.tip1Title}</p>
              <p className="text-xs text-muted-foreground">{t.water.tip1Desc}</p>
            </div>
            <div>
              <p className="font-medium text-sm">{t.water.tip2Title}</p>
              <p className="text-xs text-muted-foreground">{t.water.tip2Desc}</p>
            </div>
            <div>
              <p className="font-medium text-sm">{t.water.tip3Title}</p>
              <p className="text-xs text-muted-foreground">{t.water.tip3Desc}</p>
            </div>
            <div>
              <p className="font-medium text-sm">{t.water.tip4Title}</p>
              <p className="text-xs text-muted-foreground">{t.water.tip4Desc}</p>
            </div>
          </CardContent>
        </Card>

        {/* Benefícios */}
        <Card className="!bg-primary text-primary-foreground border-0">
          <CardHeader>
            <CardTitle>{t.water.whyImportant}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>✓ {t.water.benefit1}</p>
            <p>✓ {t.water.benefit2}</p>
            <p>✓ {t.water.benefit3}</p>
            <p>✓ {t.water.benefit4}</p>
            <p>✓ {t.water.benefit5}</p>
            <p>✓ {t.water.benefit6}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
