import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mascot } from '@/components/mascot'
import { useApp } from '@/contexts/AppContext'
import type { UserProfile, Gender, Goal, ActivityLevel, MedicationType } from '@/types'
import { ArrowRight, Heart, Target, Activity, Pill } from 'lucide-react'

export function Onboarding() {
  const { setUser, completeOnboarding } = useApp()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '' as Gender,
    height: '',
    currentWeight: '',
    targetWeight: '',
    goal: '' as Goal,
    activityLevel: '' as ActivityLevel,
    medication: 'nenhum' as MedicationType,
    medicationDosage: ''
  })

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = () => {
    const age = parseInt(formData.age)
    const height = parseInt(formData.height)
    const currentWeight = parseFloat(formData.currentWeight)
    const targetWeight = parseFloat(formData.targetWeight)

    const user: UserProfile = {
      id: crypto.randomUUID(),
      name: formData.name,
      age,
      gender: formData.gender,
      height,
      startingWeight: currentWeight,
      currentWeight,
      targetWeight,
      goal: formData.goal,
      activityLevel: formData.activityLevel,
      medication: formData.medication,
      medicationDosage: formData.medicationDosage || undefined,
      dietaryPreferences: [],
      mealRoutine: { mealsPerDay: 3, hasSnacks: false },
      averageSleepHours: 7,
      sleepQuality: 'bom' as const,
      fastingExperience: 'nunca' as const,
      interestedInFasting: false,
      medicalLimitations: { hasLimitation: false },
      consentTerms: true,
      consentPrivacyPolicy: true,
      consentDataProcessing: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setUser(user)
    completeOnboarding()
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name.length > 0
      case 2:
        return formData.age && formData.gender
      case 3:
        return formData.height && formData.currentWeight && formData.targetWeight
      case 4:
        return formData.goal && formData.activityLevel
      case 5:
        return true
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Mascot size="lg" mood="excited" showMessage message="Vamos começar sua jornada de saúde!" />
          <h1 className="text-4xl font-bold text-foreground mt-4">BEM.ai</h1>
          <p className="text-muted-foreground mt-2">Sua companheira de saúde e bem-estar</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary">Passo {step} de 5</span>
              <span className="text-sm text-muted-foreground">{Math.round((step / 5) * 100)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <Heart className="w-12 h-12 text-primary mx-auto mb-3" />
                  <CardTitle>Como podemos te chamar?</CardTitle>
                  <CardDescription>Vamos nos conhecer melhor!</CardDescription>
                </div>
                <div className="space-y-1.5">
                  <Label>Seu nome</Label>
                  <Input
                    placeholder="Digite seu nome"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <Activity className="w-12 h-12 text-primary mx-auto mb-3" />
                  <CardTitle>Conte um pouco sobre você</CardTitle>
                  <CardDescription>Essas informações ajudam a personalizar sua experiência</CardDescription>
                </div>
                <div className="space-y-1.5">
                  <Label>Idade</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 30"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Sexo biológico</Label>
                  <Select value={formData.gender} onValueChange={(value: Gender) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                      <SelectItem value="prefiro_nao_informar">Prefiro não informar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <Target className="w-12 h-12 text-primary mx-auto mb-3" />
                  <CardTitle>Suas medidas</CardTitle>
                  <CardDescription>Vamos calcular seu IMC e metas personalizadas</CardDescription>
                </div>
                <div className="space-y-1.5">
                  <Label>Altura (cm)</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 170"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Peso atual (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 75.5"
                    value={formData.currentWeight}
                    onChange={(e) => setFormData({ ...formData, currentWeight: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Peso desejado (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 70.0"
                    value={formData.targetWeight}
                    onChange={(e) => setFormData({ ...formData, targetWeight: e.target.value })}
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <Target className="w-12 h-12 text-primary mx-auto mb-3" />
                  <CardTitle>Qual seu objetivo?</CardTitle>
                  <CardDescription>Vamos traçar o melhor caminho para você</CardDescription>
                </div>
                <div className="space-y-1.5">
                  <Label>Objetivo principal</Label>
                  <Select value={formData.goal} onValueChange={(value: Goal) => setFormData({ ...formData, goal: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione seu objetivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="perder_peso">Perder peso</SelectItem>
                      <SelectItem value="ganhar_massa">Ganhar massa muscular</SelectItem>
                      <SelectItem value="manter_peso">Manter peso</SelectItem>
                      <SelectItem value="saude_geral">Saúde geral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Nível de atividade física</Label>
                  <Select value={formData.activityLevel} onValueChange={(value: ActivityLevel) => setFormData({ ...formData, activityLevel: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Como é sua rotina?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentario">Sedentário (pouco ou nenhum exercício)</SelectItem>
                      <SelectItem value="leve">Leve (1-3 dias/semana)</SelectItem>
                      <SelectItem value="moderado">Moderado (3-5 dias/semana)</SelectItem>
                      <SelectItem value="intenso">Intenso (6-7 dias/semana)</SelectItem>
                      <SelectItem value="muito_intenso">Muito intenso (atleta)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <Pill className="w-12 h-12 text-primary mx-auto mb-3" />
                  <CardTitle>Medicação (opcional)</CardTitle>
                  <CardDescription>Você usa algum medicamento para controle de peso?</CardDescription>
                </div>
                <div className="space-y-1.5">
                  <Label>Medicamento</Label>
                  <Select value={formData.medication} onValueChange={(value: MedicationType) => setFormData({ ...formData, medication: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione se usa algum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nenhum">Não uso medicação</SelectItem>
                      <SelectItem value="ozempic">Ozempic (Semaglutida)</SelectItem>
                      <SelectItem value="saxenda">Saxenda (Liraglutida)</SelectItem>
                      <SelectItem value="victoza">Victoza (Liraglutida)</SelectItem>
                      <SelectItem value="mounjaro">Mounjaro (Tirzepatida)</SelectItem>
                      <SelectItem value="wegovy">Wegovy (Semaglutida)</SelectItem>
                      <SelectItem value="outro_glp1">Outro GLP-1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.medication !== 'nenhum' && (
                  <div className="space-y-1.5">
                    <Label>Dosagem (opcional)</Label>
                    <Input
                      placeholder="Ex: 1mg semanal"
                      value={formData.medicationDosage}
                      onChange={(e) => setFormData({ ...formData, medicationDosage: e.target.value })}
                    />
                  </div>
                )}
                <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
                  ℹ️ <strong>Importante:</strong> Este app não substitui orientação médica. Sempre consulte seu médico sobre medicamentos e planos alimentares.
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                  Voltar
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1"
              >
                {step === 5 ? 'Começar!' : 'Continuar'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
