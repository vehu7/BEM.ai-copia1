import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useApp } from '@/contexts/AppContext'
import type { UserProfile, Gender, Goal, ActivityLevel, MedicationType, DietaryPreference, FastingExperience, SleepQuality } from '@/types'
import { calculateBMR, calculateTDEE, calculateCalorieTarget, calculateMacros, calculateWaterTarget } from '@/lib/health-utils'
import { calculateAITargets } from '@/lib/gemini'
import { TermsDialog } from '@/components/terms-dialog'
import { PrivacyDialog } from '@/components/privacy-dialog'

// Inputs: verde translúcido escurecido (como nos screenshots)
const pill = "h-12 rounded-full bg-black/[0.12] border border-black/[0.06] px-5 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
const pillSelect = "h-12 rounded-full bg-black/[0.12] border border-black/[0.06] px-5 text-primary data-[placeholder]:!text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
const dropdownContent = "bg-background border-primary/20"
const dropdownItem = "text-primary focus:bg-black/[0.12] focus:text-primary cursor-pointer"

export function OnboardingNew() {
  const { savePendingProfile } = useApp()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [isCalculating, setIsCalculating] = useState(false)
  const [showTermsDialog, setShowTermsDialog] = useState(false)
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false)
  const [formData, setFormData] = useState({
    language: 'pt-BR',
    name: '',
    birthDate: '',
    gender: '' as Gender,
    height: '',
    currentWeight: '',
    targetWeight: '',
    bodyFatPercentage: '',
    goal: '' as Goal,
    activityLevel: '' as ActivityLevel,
    dietaryPreferences: [] as DietaryPreference[],
    mealsPerDay: '3',
    breakfastTime: '08:00',
    lunchTime: '12:00',
    dinnerTime: '19:00',
    weightUnit: 'kg' as 'kg' | 'lbs',
    heightUnit: 'cm' as 'cm' | 'ft',
    hasSnacks: false,
    averageSleepHours: '',
    sleepQuality: '' as SleepQuality,
    fastingExperience: '' as FastingExperience,
    interestedInFasting: false,
    medication: 'nenhum' as MedicationType,
    medicationDosage: '',
    hasLimitation: false,
    limitationDescription: '',
    consentTerms: false,
    consentPrivacyPolicy: false,
    consentDataProcessing: false
  })

  const totalSteps = 10

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1)
    else handleComplete()
  }

  const handleComplete = async () => {
    setIsCalculating(true)

    const [dd, mm, yyyy] = formData.birthDate.split('/')
    const birthDate = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd))
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear() -
      (today.getMonth() < birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0)
    const height = formData.heightUnit === 'ft'
      ? Math.round(parseFloat(formData.height) * 30.48)
      : parseInt(formData.height)
    const currentWeight = formData.weightUnit === 'lbs'
      ? Math.round(parseFloat(formData.currentWeight) * 0.453592 * 10) / 10
      : parseFloat(formData.currentWeight)
    const targetWeight = formData.weightUnit === 'lbs'
      ? Math.round(parseFloat(formData.targetWeight) * 0.453592 * 10) / 10
      : parseFloat(formData.targetWeight)
    const bodyFatPercentage = formData.bodyFatPercentage ? parseFloat(formData.bodyFatPercentage) : undefined
    const sleepHours = parseFloat(formData.averageSleepHours) || 7

    // Fórmulas como fallback caso a IA falhe
    const fallbackBmr = calculateBMR(currentWeight, height, age, formData.gender)
    const fallbackTdee = calculateTDEE(fallbackBmr, formData.activityLevel)
    const fallbackCalories = calculateCalorieTarget(fallbackTdee, formData.goal, formData.medication)
    const fallbackMacros = calculateMacros(fallbackCalories, formData.goal, currentWeight)
    const fallbackWater = calculateWaterTarget(currentWeight, formData.activityLevel)
    let fallbackFiber = fallbackMacros.fiber
    if (formData.medication !== 'nenhum') fallbackFiber = Math.round(fallbackFiber * 1.5)

    let aiTargets = {
      bmr: Math.round(fallbackBmr),
      tdee: Math.round(fallbackTdee),
      targetCalories: Math.round(fallbackCalories),
      targetProtein: fallbackMacros.protein,
      targetCarbs: fallbackMacros.carbs,
      targetFat: fallbackMacros.fat,
      targetFiber: fallbackFiber,
      targetWater: fallbackWater,
    }

    try {
      const result = await calculateAITargets({
        name: formData.name,
        age,
        gender: formData.gender,
        height,
        currentWeight,
        targetWeight,
        goal: formData.goal,
        activityLevel: formData.activityLevel,
        medication: formData.medication,
        medicationDosage: formData.medicationDosage || undefined,
        dietaryPreferences: formData.dietaryPreferences,
        averageSleepHours: sleepHours,
      })
      aiTargets = {
        bmr: result.bmr,
        tdee: result.tdee,
        targetCalories: result.targetCalories,
        targetProtein: result.targetProtein,
        targetCarbs: result.targetCarbs,
        targetFat: result.targetFat,
        targetFiber: result.targetFiber,
        targetWater: result.targetWater,
      }
    } catch (err) {
      console.warn('Cálculo IA falhou, usando fórmulas:', err)
    }

    const user: UserProfile = {
      id: (crypto.randomUUID?.() ?? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16) })),
      name: formData.name,
      age,
      gender: formData.gender,
      height,
      startingWeight: currentWeight,
      currentWeight,
      targetWeight,
      bodyFatPercentage,
      goal: formData.goal,
      activityLevel: formData.activityLevel,
      dietaryPreferences: formData.dietaryPreferences,
      mealRoutine: {
        mealsPerDay: parseInt(formData.mealsPerDay),
        breakfastTime: formData.breakfastTime,
        lunchTime: formData.lunchTime,
        dinnerTime: formData.dinnerTime,
        hasSnacks: formData.hasSnacks
      },
      averageSleepHours: sleepHours,
      sleepQuality: formData.sleepQuality,
      fastingExperience: formData.fastingExperience,
      interestedInFasting: formData.interestedInFasting,
      medication: formData.medication,
      medicationDosage: formData.medicationDosage || undefined,
      medicalLimitations: {
        hasLimitation: formData.hasLimitation,
        description: formData.limitationDescription || undefined
      },
      consentTerms: formData.consentTerms,
      consentPrivacyPolicy: formData.consentPrivacyPolicy,
      consentDataProcessing: formData.consentDataProcessing,
      ...aiTargets,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    savePendingProfile(user)
    setIsCalculating(false)
    navigate('/registrar')
  }

  const canProceed = () => {
    switch (step) {
      case 1: return formData.name.length > 0
      case 2: return !!(formData.birthDate.length === 10 && formData.gender)
      case 3: return !!(formData.height && formData.currentWeight && formData.targetWeight)
      case 4: return !!(formData.goal && formData.activityLevel)
      case 5: return true
      case 6: return !!(formData.mealsPerDay && formData.averageSleepHours && formData.sleepQuality)
      case 7: return !!formData.fastingExperience
      case 8: return true
      case 9: return !formData.hasLimitation || formData.limitationDescription.trim().length > 0
      case 10: return formData.consentTerms && formData.consentPrivacyPolicy && formData.consentDataProcessing
      default: return false
    }
  }

  const toggleDietaryPreference = (pref: DietaryPreference) => {
    const current = formData.dietaryPreferences
    if (current.includes(pref)) {
      setFormData({ ...formData, dietaryPreferences: current.filter(p => p !== pref) })
    } else {
      setFormData({ ...formData, dietaryPreferences: [...current, pref] })
    }
  }

  if (isCalculating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
        <div className="text-center">
          <img
            src="/mascots/koala-zen.webp"
            alt="Mascote"
            className="w-36 h-36 object-contain mx-auto mb-6 animate-pulse"
          />
          <h2 className="text-2xl font-black mb-3 text-foreground">
            Criando seu plano...
          </h2>
          <p className="text-sm mb-6 px-4 text-muted-foreground">
            Calculando suas metas de calorias, macros e hidratação com base no seu perfil completo
            {formData.medication !== 'nenhum' ? ` e no uso de ${formData.medication}` : ''}.
          </p>
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-primary"
                style={{
                  animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`
                }}
              />
            ))}
          </div>
        </div>
        <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0.8);opacity:0.5} 40%{transform:scale(1.2);opacity:1} }`}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* Bolinhas de progresso */}
      <div className="flex justify-center gap-1.5 pt-10 pb-4">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${i + 1 <= step ? 'bg-primary' : 'bg-card/50'}`}
          />
        ))}
      </div>

      {/* Conteúdo do step */}
      <div className="flex-1 px-6 pb-28 flex flex-col">

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="flex flex-col items-center text-center">
            <h1 className="text-5xl font-black mb-5 text-foreground">Bem.AI</h1>
            <img src="/mascots/koala-zen.webp" alt="Mascote" className="w-40 h-40 object-contain mb-5" />
            <p className="text-base font-bold leading-snug mb-1 text-foreground">
              Vamos criar seu plano personalizado de saúde!
            </p>
            <p className="text-sm mb-6 text-muted-foreground">
              Seu companheiro de saúde e bem-estar
            </p>
            {/* Idioma */}
            <div className="w-full bg-card rounded-2xl p-5 shadow-sm mb-3">
              <p className="text-sm font-semibold text-center mb-3 text-foreground">
                Idioma / Language
              </p>
              <Select value={formData.language} onValueChange={(v) => setFormData({ ...formData, language: v })}>
                <SelectTrigger className={pillSelect}>
                  <SelectValue placeholder="Selecione o idioma" />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/20">
                  <SelectItem className="text-primary focus:bg-primary/10 focus:text-primary cursor-pointer" value="pt-BR">Portugues (Brasil)</SelectItem>
                  <SelectItem className="text-primary focus:bg-primary/10 focus:text-primary cursor-pointer" value="en">English</SelectItem>
                  <SelectItem className="text-primary focus:bg-primary/10 focus:text-primary cursor-pointer" value="es">Espanol</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Card branco com o campo nome */}
            <div className="w-full bg-card rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-semibold text-center mb-3 text-foreground">
                Qual o seu nome?
              </p>
              <Input
                placeholder="Digite seu nome"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={pill}
              />
            </div>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-1 text-foreground">Conte um pouco sobre você</h2>
              <p className="text-sm text-muted-foreground">
                Essas informações ajudam a personalizar seu plano
              </p>
            </div>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="DD/MM/AAAA"
              value={formData.birthDate}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
                let masked = digits
                if (digits.length > 4) masked = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4)
                else if (digits.length > 2) masked = digits.slice(0, 2) + '/' + digits.slice(2)
                setFormData({ ...formData, birthDate: masked })
              }}
              className={pill}
            />
            <Select value={formData.gender} onValueChange={(v: Gender) => setFormData({ ...formData, gender: v })}>
              <SelectTrigger className={pillSelect}>
                <SelectValue placeholder="Qual é o seu sexo?" />
              </SelectTrigger>
              <SelectContent className="bg-card border-primary/20">
                <SelectItem className="text-primary focus:bg-primary/10 focus:text-primary cursor-pointer" value="masculino">Masculino</SelectItem>
                <SelectItem className="text-primary focus:bg-primary/10 focus:text-primary cursor-pointer" value="feminino">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-1 text-foreground">Suas medidas</h2>
              <p className="text-sm text-muted-foreground">
                Vamos calcular seu IMC e metas personalizadas
              </p>
            </div>

            {/* Altura */}
            <div className="space-y-2">
              <div className="flex gap-2">
                {(['cm', 'ft'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setFormData({ ...formData, heightUnit: u, height: '' })}
                    className={`flex-1 h-9 rounded-full text-sm font-semibold transition-all ${formData.heightUnit === u ? 'bg-primary text-primary-foreground' : 'bg-black/[0.12] text-primary'}`}
                  >
                    {u === 'cm' ? 'Centímetros (cm)' : 'Pés (ft)'}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                step={formData.heightUnit === 'ft' ? '0.01' : '1'}
                placeholder={formData.heightUnit === 'cm' ? 'Altura em cm (ex: 170)' : 'Altura em ft (ex: 5.7)'}
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className={pill}
              />
            </div>

            {/* Peso */}
            <div className="space-y-2">
              <div className="flex gap-2">
                {(['kg', 'lbs'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setFormData({ ...formData, weightUnit: u, currentWeight: '', targetWeight: '' })}
                    className={`flex-1 h-9 rounded-full text-sm font-semibold transition-all ${formData.weightUnit === u ? 'bg-primary text-primary-foreground' : 'bg-black/[0.12] text-primary'}`}
                  >
                    {u === 'kg' ? 'Quilos (kg)' : 'Libras (lbs)'}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                step="0.1"
                placeholder={`Peso atual em ${formData.weightUnit}`}
                value={formData.currentWeight}
                onChange={(e) => setFormData({ ...formData, currentWeight: e.target.value })}
                className={pill}
              />
              <Input
                type="number"
                step="0.1"
                placeholder={`Peso desejado em ${formData.weightUnit}`}
                value={formData.targetWeight}
                onChange={(e) => setFormData({ ...formData, targetWeight: e.target.value })}
                className={pill}
              />
            </div>

            <Input
              type="number"
              step="0.1"
              placeholder="Percentual de gordura (opcional)"
              value={formData.bodyFatPercentage}
              onChange={(e) => setFormData({ ...formData, bodyFatPercentage: e.target.value })}
              className={pill}
            />
            <p className="text-xs text-center px-2 text-muted-foreground">
              Se você não souber, deixe em branco. Usaremos outras fórmulas.
            </p>
          </div>
        )}

        {/* ── STEP 4 ── */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-1 text-foreground">Qual seu objetivo?</h2>
              <p className="text-sm text-muted-foreground">
                Vamos traçar o melhor caminho para você
              </p>
            </div>
            <Select value={formData.goal} onValueChange={(v: Goal) => setFormData({ ...formData, goal: v })}>
              <SelectTrigger className={pillSelect}>
                <SelectValue placeholder="Selecione seu objetivo" />
              </SelectTrigger>
              <SelectContent className={dropdownContent}>
                <SelectItem className={dropdownItem} value="perder_peso">Perder peso</SelectItem>
                <SelectItem className={dropdownItem} value="ganhar_massa">Ganhar massa muscular</SelectItem>
                <SelectItem className={dropdownItem} value="manter_peso">Manter peso</SelectItem>
                <SelectItem className={dropdownItem} value="saude_geral">Saúde geral</SelectItem>
              </SelectContent>
            </Select>
            <Select value={formData.activityLevel} onValueChange={(v: ActivityLevel) => setFormData({ ...formData, activityLevel: v })}>
              <SelectTrigger className={pillSelect}>
                <SelectValue placeholder="Nível de atividade física" />
              </SelectTrigger>
              <SelectContent className={dropdownContent}>
                <SelectItem className={dropdownItem} value="sedentario">Sedentário (pouco ou nenhum exercício)</SelectItem>
                <SelectItem className={dropdownItem} value="leve">Leve (1-3 dias/semana)</SelectItem>
                <SelectItem className={dropdownItem} value="moderado">Moderado (3-5 dias/semana)</SelectItem>
                <SelectItem className={dropdownItem} value="intenso">Intenso (6-7 dias/semana)</SelectItem>
                <SelectItem className={dropdownItem} value="muito_intenso">Muito intenso (atleta)</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-center pt-4">
              <img src="/mascots/koala-treino.png" alt="Mascote treino" className="w-48 h-48 object-contain" />
            </div>
          </div>
        )}

        {/* ── STEP 5 ── */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-1 text-foreground">Preferências Alimentares</h2>
              <p className="text-sm text-muted-foreground">
                Marque todas que se aplicam a você
              </p>
            </div>
            <div className="space-y-4">
              {([
                ['nenhuma', 'Nenhuma restrição'],
                ['vegetariano', 'Vegetariano'],
                ['vegano', 'Vegano'],
                ['sem_lactose', 'Sem lactose'],
                ['sem_gluten', 'Sem glúten'],
                ['low_carb', 'Low carb'],
                ['diabetes', 'Diabetes (controle de açúcar)'],
              ] as [DietaryPreference, string][]).map(([value, label]) => (
                <div key={value} className="flex items-center gap-3">
                  <Checkbox
                    id={value}
                    checked={formData.dietaryPreferences.includes(value)}
                    onCheckedChange={() => toggleDietaryPreference(value)}
                  />
                  <label
                    htmlFor={value}
                    className={`text-sm font-semibold cursor-pointer ${formData.dietaryPreferences.includes(value) ? 'text-primary' : 'text-foreground'}`}
                  >
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 6 ── */}
        {step === 6 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-1 text-foreground">Sua Rotina</h2>
              <p className="text-sm text-muted-foreground">Vamos entender seu dia a dia</p>
            </div>
            <Select value={formData.mealsPerDay} onValueChange={(v) => setFormData({ ...formData, mealsPerDay: v })}>
              <SelectTrigger className={pillSelect}>
                <SelectValue placeholder="Quantas refeições você faz por dia?" />
              </SelectTrigger>
              <SelectContent className={dropdownContent}>
                <SelectItem className={dropdownItem} value="2">2 refeições</SelectItem>
                <SelectItem className={dropdownItem} value="3">3 refeições</SelectItem>
                <SelectItem className={dropdownItem} value="4">4 refeições</SelectItem>
                <SelectItem className={dropdownItem} value="5">5 refeições</SelectItem>
                <SelectItem className={dropdownItem} value="6">6 refeições</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-3 px-1">
              <Checkbox
                id="snacks"
                checked={formData.hasSnacks}
                onCheckedChange={(c) => setFormData({ ...formData, hasSnacks: c as boolean })}
              />
              <label htmlFor="snacks" className="text-sm font-semibold cursor-pointer text-primary">
                Faço lanches entre as refeições
              </label>
            </div>
            <Input
              type="number"
              step="0.5"
              placeholder="Quantas horas você dorme por noite?"
              value={formData.averageSleepHours}
              onChange={(e) => setFormData({ ...formData, averageSleepHours: e.target.value })}
              className={pill}
            />
            <Select value={formData.sleepQuality} onValueChange={(v: SleepQuality) => setFormData({ ...formData, sleepQuality: v })}>
              <SelectTrigger className={pillSelect}>
                <SelectValue placeholder="Como você acorda?" />
              </SelectTrigger>
              <SelectContent className={dropdownContent}>
                <SelectItem className={dropdownItem} value="ruim">Ruim (acordo cansado)</SelectItem>
                <SelectItem className={dropdownItem} value="regular">Regular (durmo mal às vezes)</SelectItem>
                <SelectItem className={dropdownItem} value="bom">Bom (durmo bem na maioria das noites)</SelectItem>
                <SelectItem className={dropdownItem} value="excelente">Excelente (durmo profundamente)</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-center pt-4">
              <img src="/mascots/koala-sono.png" alt="Mascote sono" className="w-48 h-48 object-contain" />
            </div>
          </div>
        )}

        {/* ── STEP 7 ── */}
        {step === 7 && (
          <div className="flex flex-col flex-1 gap-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-1 text-foreground">Jejum Intermitente</h2>
              <p className="text-sm text-muted-foreground">
                Você já praticou ou tem interesse?
              </p>
            </div>
            <Select value={formData.fastingExperience} onValueChange={(v: FastingExperience) => setFormData({ ...formData, fastingExperience: v })}>
              <SelectTrigger className={pillSelect}>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className={dropdownContent}>
                <SelectItem className={dropdownItem} value="nunca">Nunca pratiquei</SelectItem>
                <SelectItem className={dropdownItem} value="iniciante">Iniciante (poucas vezes)</SelectItem>
                <SelectItem className={dropdownItem} value="intermediario">Intermediário (faço regularmente)</SelectItem>
                <SelectItem className={dropdownItem} value="avancado">Avançado (pratico há mais de 6 meses)</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-start gap-3 px-1">
              <Checkbox
                id="fasting"
                checked={formData.interestedInFasting}
                onCheckedChange={(c) => setFormData({ ...formData, interestedInFasting: c as boolean })}
              />
              <label htmlFor="fasting" className="text-sm font-semibold cursor-pointer leading-snug text-primary">
                Tenho interesse em incluir jejum no meu plano
              </label>
            </div>
            <div className="rounded-2xl p-4 mt-auto bg-foreground">
              <p className="text-sm leading-relaxed text-background/88">
                O jejum intermitente pode ser uma ferramenta eficaz, mas não é obrigatório. Você pode ativá-lo ou desativá-lo a qualquer momento.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 8 ── */}
        {step === 8 && (
          <div className="flex flex-col flex-1 gap-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-1 text-foreground">Medicação (opcional)</h2>
              <p className="text-sm text-muted-foreground">
                Você usa algum medicamento para controle de peso?
              </p>
            </div>
            <Select value={formData.medication} onValueChange={(v: MedicationType) => setFormData({ ...formData, medication: v })}>
              <SelectTrigger className={pillSelect}>
                <SelectValue placeholder="Selecione se usa algum" />
              </SelectTrigger>
              <SelectContent className={dropdownContent}>
                <SelectItem className={dropdownItem} value="nenhum">Não uso medicação</SelectItem>
                <SelectItem className={dropdownItem} value="ozempic">Ozempic (Semaglutida)</SelectItem>
                <SelectItem className={dropdownItem} value="saxenda">Saxenda (Liraglutida)</SelectItem>
                <SelectItem className={dropdownItem} value="victoza">Victoza (Liraglutida)</SelectItem>
                <SelectItem className={dropdownItem} value="mounjaro">Mounjaro (Tirzepatida)</SelectItem>
                <SelectItem className={dropdownItem} value="wegovy">Wegovy (Semaglutida)</SelectItem>
                <SelectItem className={dropdownItem} value="outro_glp1">Outro GLP-1</SelectItem>
              </SelectContent>
            </Select>
            {formData.medication !== 'nenhum' && (
              <Input
                placeholder="Dosagem (opcional) — Ex: 1mg semanal"
                value={formData.medicationDosage}
                onChange={(e) => setFormData({ ...formData, medicationDosage: e.target.value })}
                className={pill}
              />
            )}
            <div className="rounded-2xl p-4 mt-auto bg-foreground">
              <p className="text-sm leading-relaxed text-background/88">
                <span className="font-semibold text-background">ℹ️ Importante: </span>
                Este app não substitui orientação médica. Sempre consulte seu médico sobre medicamentos e planos alimentares.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 9 ── */}
        {step === 9 && (
          <div className="flex flex-col flex-1 gap-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-1 text-foreground">Saúde e Limitações</h2>
              <p className="text-sm text-muted-foreground">
                Informações importantes para sua segurança
              </p>
            </div>
            <div className="flex items-start gap-3 px-1">
              <Checkbox
                id="limitation"
                checked={formData.hasLimitation}
                onCheckedChange={(c) => setFormData({ ...formData, hasLimitation: c as boolean })}
              />
              <label htmlFor="limitation" className="text-sm font-semibold cursor-pointer leading-snug text-primary">
                Tenho alguma condição médica ou limitação física
              </label>
            </div>
            {formData.hasLimitation && (
              <>
                <Input
                  placeholder="Descreva suas limitações"
                  value={formData.limitationDescription}
                  onChange={(e) => setFormData({ ...formData, limitationDescription: e.target.value })}
                  className={pill}
                />
                <p className="text-xs px-1 text-muted-foreground">
                  Essas informações nos ajudam a recomendar exercícios mais adequados.
                </p>
              </>
            )}
            {/* Card âmbar claro — como no screenshot */}
            <div className="rounded-2xl p-4 mt-auto bg-warning/15 border border-warning">
              <p className="text-sm font-semibold mb-1 text-warning">⚠️ Atenção:</p>
              <p className="text-sm leading-relaxed text-warning">
                Se você tem condições como diabetes, hipertensão, problemas cardíacos, transtornos alimentares ou está grávida/amamentando, consulte um médico antes de iniciar qualquer programa de exercícios ou mudança alimentar.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 10 ── */}
        {step === 10 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-1 text-foreground">Privacidade e Consentimento</h2>
              <p className="text-sm text-muted-foreground">Seus dados, suas regras (LGPD)</p>
            </div>
            <div className="rounded-2xl p-4 bg-foreground">
              <p className="text-sm font-semibold text-background mb-3">Como seus dados são usados:</p>
              <ul className="space-y-2 text-sm text-background/88">
                <li>✓ Armazenados apenas no seu dispositivo</li>
                <li>✓ Não compartilhados com terceiros</li>
                <li>✓ Você pode exportar ou apagar a qualquer momento</li>
                <li>✓ Conformidade total com LGPD (Lei nº 13.709/2018)</li>
              </ul>
            </div>
            <div className="space-y-4 px-1">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={formData.consentTerms}
                  onCheckedChange={(c) => setFormData({ ...formData, consentTerms: c as boolean })}
                />
                <label htmlFor="terms" className="text-sm font-semibold cursor-pointer leading-snug text-primary">
                  Li e aceito os{' '}
                  <span className="underline" onClick={(e) => { e.preventDefault(); setShowTermsDialog(true) }}>
                    Termos de Uso
                  </span>
                </label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="privacy"
                  checked={formData.consentPrivacyPolicy}
                  onCheckedChange={(c) => setFormData({ ...formData, consentPrivacyPolicy: c as boolean })}
                />
                <label htmlFor="privacy" className="text-sm font-semibold cursor-pointer leading-snug text-primary">
                  Li e aceito a{' '}
                  <span className="underline" onClick={(e) => { e.preventDefault(); setShowPrivacyDialog(true) }}>
                    Política de Privacidade
                  </span>
                </label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="processing"
                  checked={formData.consentDataProcessing}
                  onCheckedChange={(c) => setFormData({ ...formData, consentDataProcessing: c as boolean })}
                />
                <label htmlFor="processing" className="text-sm font-semibold cursor-pointer leading-snug text-primary">
                  Autorizo o processamento dos meus dados de saúde para personalização do plano
                </label>
              </div>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Você pode revogar esses consentimentos a qualquer momento nas configurações.
            </p>
          </div>
        )}

      </div>

      {/* Botão fixo no rodapé */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-3">
        <button
          onClick={handleNext}
          disabled={!canProceed()}
          className="w-full py-4 rounded-full bg-primary text-primary-foreground text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
        >
          {step === totalSteps ? '⊙ Criar Meu Plano!' : 'Continuar →'}
        </button>
      </div>

      <TermsDialog open={showTermsDialog} onOpenChange={setShowTermsDialog} />
      <PrivacyDialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog} />
    </div>
  )
}
