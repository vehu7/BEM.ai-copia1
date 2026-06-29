import { useState, useRef } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Flame,
  Droplet,
  Activity,
  Apple,
  Clock,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Camera,
  Mail
} from 'lucide-react'
import { calculateIMC, getIMCColor, formatWeight, getMedicationInfo } from '@/lib/health-utils'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '@/contexts/LanguageContext'

export function PlanSummary() {
  const { user, setUser } = useApp()
  const { t } = useTranslation()
  const tp = t.planSummary
  const navigate = useNavigate()
  const [photo, setPhoto] = useState<string | null>((user as any)?.profilePhoto || null)
  const inputRef = useRef<HTMLInputElement>(null)

  if (!user) {
    navigate('/')
    return null
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      setPhoto(base64)
      setUser({ ...user, profilePhoto: base64 } as any)
    }
    reader.readAsDataURL(file)
  }

  const imc = calculateIMC(user.currentWeight, user.height)
  const weightDiff = Math.abs(user.currentWeight - user.targetWeight)
  const medicationInfo = getMedicationInfo(user.medication)

  const dietaryLabels: Record<string, string> = {
    nenhuma: t.profileSetup.step5.none,
    vegetariano: t.profileSetup.step5.vegetarian,
    vegano: t.profileSetup.step5.vegan,
    sem_lactose: t.profileSetup.step5.noLactose,
    sem_gluten: t.profileSetup.step5.noGluten,
    low_carb: t.profileSetup.step5.lowCarb,
    diabetes: t.profileSetup.step5.diabetes,
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto p-4 pb-24 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pt-6">
          <h2 className="text-3xl font-bold text-primary">
            {tp.greeting} {user.name}! 👋
          </h2>
          <div className="relative">
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            <button
              onClick={() => inputRef.current?.click()}
              className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-border shadow-lg bg-black/10 flex items-center justify-center"
            >
              {photo ? (
                <>
                  <img src={photo} alt="Foto de perfil" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Camera className="w-5 h-5 text-primary" />
                  <span className="text-[9px] text-primary font-medium">{tp.photo}</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Estatísticas atuais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">{tp.currentIMC}</div>
                <div className={`text-3xl font-bold ${getIMCColor(imc.category)}`}>
                  {imc.value}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{imc.description}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">{tp.currentWeight}</div>
                <div className="text-3xl font-bold">{formatWeight(user.currentWeight)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {tp.goal} {formatWeight(user.targetWeight)}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">{tp.difference}</div>
                <div className="text-3xl font-bold text-primary">{weightDiff.toFixed(1)} kg</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {user.goal === 'perder_peso' ? tp.toLose : user.goal === 'ganhar_massa' ? tp.toGain : tp.toMaintain}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">{tp.age}</div>
                <div className="text-3xl font-bold">{user.age}</div>
                <div className="text-xs text-muted-foreground mt-1">{tp.ageUnit}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metas Nutricionais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-secondary" />
              {tp.dailyGoals}
            </CardTitle>
            <CardDescription>{tp.dailyGoalsDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Calorias */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{tp.calories}</span>
                <span className="text-2xl font-bold text-primary">{user.targetCalories} kcal</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {tp.bmr} {user.bmr?.toFixed(0)} kcal • {tp.tdee} {user.tdee?.toFixed(0)} kcal
              </div>
            </div>

            {/* Macros */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">{tp.proteins}</div>
                <div className="text-2xl font-bold text-primary">{user.targetProtein}g</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {((user.targetProtein! * 4) / user.targetCalories! * 100).toFixed(0)}%
                </div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">{tp.carbs}</div>
                <div className="text-2xl font-bold text-secondary">{user.targetCarbs}g</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {((user.targetCarbs! * 4) / user.targetCalories! * 100).toFixed(0)}%
                </div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">{tp.fats}</div>
                <div className="text-2xl font-bold text-chart-2">{user.targetFat}g</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {((user.targetFat! * 9) / user.targetCalories! * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Fibras e Água */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Apple className="w-8 h-8 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">{tp.fibers}</div>
                  <div className="text-xl font-bold">{user.targetFiber}g</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Droplet className="w-8 h-8 text-chart-1" />
                <div>
                  <div className="text-xs text-muted-foreground">{tp.water}</div>
                  <div className="text-xl font-bold">{user.targetWater}ml</div>
                </div>
              </div>
            </div>

            {user.medication !== 'nenhum' && (
              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="font-medium text-primary">{tp.adjustments} {medicationInfo.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {medicationInfo.description}. {tp.fiberNote}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rotina */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              {tp.yourRoutine}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-2">{tp.mealsPerDay}</div>
                <div className="font-medium">{user.mealRoutine.mealsPerDay} {tp.mealsUnit}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">{tp.sleepHours}</div>
                <div className="font-medium">{user.averageSleepHours}{tp.perNight}</div>
              </div>
            </div>
            {user.dietaryPreferences.length > 0 && user.dietaryPreferences[0] !== 'nenhuma' && (
              <div>
                <div className="text-sm text-muted-foreground mb-2">{tp.dietaryPrefs}</div>
                <div className="flex gap-2 flex-wrap">
                  {user.dietaryPreferences.map((pref) => (
                    <Badge key={pref} variant="secondary">
                      {dietaryLabels[pref]}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Atividade Física */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              {tp.physicalActivity}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <div className="font-medium">{tp.activityLevel}</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {user.activityLevel.replace('_', ' ')}
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            {user.interestedInFasting && (
              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                <div>
                  <div className="font-medium text-primary">{tp.fastingLabel}</div>
                  <div className="text-sm text-muted-foreground">
                    {tp.experience} {user.fastingExperience}
                  </div>
                </div>
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aviso de email para assinatura */}
        <Card className="border-warning/40 bg-warning/15">
          <CardContent className="pt-5 pb-5">
            <div className="flex gap-3">
              <Mail className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="font-semibold text-sm text-warning">
                  {tp.emailWarningTitle}
                </p>
                <p className="text-xs sm:text-sm text-warning">
                  {tp.emailWarningBody}
                  {user.email && (
                    <> <strong className="font-semibold break-all">{user.email}</strong></>
                  )}
                  {!user.email && ` ${tp.emailWarningFallback}`}
                  .
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Próximos passos */}
        <div className="rounded-2xl p-6 shadow-lg space-y-3 bg-primary text-primary-foreground">
          <h3 className="text-xl font-bold text-primary-foreground">{tp.nextSteps}</h3>
          {[tp.step1, tp.step2, tp.step3, tp.step4].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                <span className="font-bold text-primary-foreground text-sm">{i + 1}</span>
              </div>
              <div className="text-sm text-primary-foreground">{step}</div>
            </div>
          ))}
        </div>

        {/* Botão de ação */}
        <Button size="lg" className="w-full" onClick={() => navigate('/')}>
          {tp.goToDashboard}
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>

        <div className="text-center text-sm text-muted-foreground pb-8">
          <p>{tp.reminder}</p>
          <p className="mt-1">{tp.support} 💚</p>
        </div>
      </div>
    </div>
  )
}
