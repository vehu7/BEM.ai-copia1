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

// ── Feedback personalizado por step ──────────────────────────────────────────
function getFeedbackMessage(step: number, formData: ReturnType<typeof getInitialForm>): string | null {
  if (step === 3 && formData.name) {
    return `Olá, ${formData.name.split(' ')[0]}! Agora vamos entender seu ponto de partida.`
  }
  if (step === 4 && formData.currentWeight && formData.targetWeight) {
    const diff = parseFloat(formData.currentWeight) - parseFloat(formData.targetWeight)
    if (diff > 0) {
      return `${diff.toFixed(1)} kg de diferença — é uma meta totalmente alcançável com o plano certo. Vamos lá! 💪`
    }
    if (diff < 0) {
      return `Ganhar ${Math.abs(diff).toFixed(1)} kg de forma saudável é possível. Vamos montar seu plano!`
    }
    return `Manter o peso com saúde é uma excelente decisão. Vamos otimizar sua rotina!`
  }
  if (step === 5 && formData.goal) {
    const msgs: Record<string, string> = {
      perder_peso: 'Ótima escolha! Perda de peso sustentável com alimentação, não sofrimento.',
      ganhar_massa: 'Força e músculo para uma vida mais ativa — vamos construir isso juntas!',
      manter_peso: 'Consistência é o segredo. Vamos encontrar o equilíbrio ideal para você.',
      saude_geral: 'Saúde integral é o melhor investimento que existe. Foco no todo!'
    }
    return msgs[formData.goal] ?? null
  }
  if (step === 8 && formData.medication !== 'nenhum') {
    const meds: Record<string, string> = {
      ozempic: 'Ozempic detectado ✓ — ajustes específicos para semaglutida já foram aplicados ao seu perfil.',
      saxenda: 'Saxenda detectado ✓ — protocolo adaptado para liraglutida ativado.',
      victoza: 'Victoza detectado ✓ — plano ajustado para liraglutida.',
      mounjaro: 'Mounjaro detectado ✓ — tirzepatida exige ajustes únicos que já estamos aplicando.',
      wegovy: 'Wegovy detectado ✓ — plano de alta proteína e fibras configurado para semaglutida.',
      outro_glp1: 'GLP-1 detectado ✓ — protocolo adaptado para canetas emagrecedoras ativado.'
    }
    return meds[formData.medication] ?? null
  }
  return null
}

function getInitialForm() {
  return {
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
    hadBariatricSurgery: false,
    excludedFoodsInput: '',
    excludedFoods: [] as string[],
    hasLimitation: false,
    limitationDescription: '',
    consentTerms: false,
    consentPrivacyPolicy: false,
    consentDataProcessing: false
  }
}

export function OnboardingNew() {
  const { savePendingProfile } = useApp()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [isCalculating, setIsCalculating] = useState(false)
  const [showTermsDialog, setShowTermsDialog] = useState(false)
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false)
  const [formData, setFormData] = useState(getInitialForm())

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
      hadBariatricSurgery: formData.hadBariatricSurgery,
      medicalLimitations: {
        hasLimitation: formData.hasLimitation,
        description: formData.limitationDescription || undefined
      },
      consentTerms: formData.consentTerms,
      consentPrivacyPolicy: formData.consentPrivacyPolicy,
      consentDataProcessing: formData.consentDataProcessing,
      menuPreferences: formData.excludedFoods.length > 0 ? { excludedFoods: formData.excludedFoods } : undefined,
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

  // ── Tela de cálculo ──────────────────────────────────────────────────────
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
            Montando seu plano exclusivo...
          </h2>
          <p className="text-sm mb-2 px-4 text-muted-foreground">
            Nossa IA está cruzando seu perfil completo para criar metas de calorias, proteína, hidratação e sono
            {formData.medication !== 'nenhum' ? ` — com ajustes específicos para o uso de ${formData.medication}` : ''}.
          </p>
          <p className="text-xs mb-6 px-4 text-primary font-semibold">
            Isso leva menos de 10 segundos ✨
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

  // Mensagem de feedback personalizado para o step atual
  const feedbackMsg = getFeedbackMessage(step, formData)

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* Barra de progresso */}
      <div className="pt-10 pb-2 px-6">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-semibold text-primary">
            Passo {step} de {totalSteps}
          </span>
          <span className="text-xs text-muted-foreground">
            {Math.round((step / totalSteps) * 100)}% concluído
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-black/[0.08] overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Feedback personalizado visível */}
      {feedbackMsg && (
        <div className="mx-6 mt-3 mb-1 rounded-2xl px-4 py-3 bg-primary/10 border border-primary/20 flex items-start gap-2">
          <span className="text-base">🐨</span>
          <p className="text-sm font-semibold text-primary leading-snug">{feedbackMsg}</p>
        </div>
      )}

      {/* Conteúdo do step */}
      <div className="flex-1 px-6 pb-28 flex flex-col pt-4">

        {/* ── STEP 1 — Boas-vindas + Nome ── */}
        {step === 1 && (
          <div className="flex flex-col items-center text-center">
            <h1 className="text-5xl font-black mb-3 text-foreground">BEM.ai</h1>
            <img src="/mascots/koala-zen.webp" alt="Mascote" className="w-36 h-36 object-contain mb-4" />

            <p className="text-xl font-black leading-snug mb-2 text-foreground">
              Seu plano de saúde<br />feito só para você
            </p>
            <p className="text-sm mb-1 text-muted-foreground px-4">
              Nutrição, emagrecimento, GLP-1, pós-bariátrica e jejum — tudo personalizado em menos de 3 minutos.
            </p>

            {/* Social proof */}
            <div className="flex items-center gap-1.5 mb-5 mt-1">
              <div className="flex -space-x-1.5">
                {['🟢','🟢','🟢'].map((_, i) => (
                  <div key={i} className="w-5 h-5 rounded-full bg-primary/20 border-2 border-background" />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-primary">+1.200 mulheres</span> já usam o BEM.ai
              </p>
            </div>

            {/* Idioma */}
            <div className="w-full bg-card rounded-2xl p-4 shadow-sm mb-3">
              <p className="text-xs font-semibold text-center mb-2 text-muted-foreground uppercase tracking-wide">
                Idioma / Language
              </p>
              <Select value={formData.language} onValueChange={(v) => setFormData({ ...formData, language: v })}>
                <SelectTrigger className={pillSelect}>
                  <SelectValue placeholder="Selecione o idioma" />
                </SelectTrigger>
                <SelectContent className="bg-card border-primary/20">
                  <SelectItem className="text-primary focus:bg-primary/10 focus:text-primary cursor-pointer" value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem className="text-primary focus:bg-primary/10 focus:text-primary cursor-pointer" value="en">English</SelectItem>
                  <SelectItem className="text-primary focus:bg-primary/10 focus:text-primary cursor-pointer" value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nome */}
            <div className="w-full bg-card rounded-2xl p-4 shadow-sm">
              <p className="text-sm font-bold text-center mb-1 text-foreground">
                Como podemos te chamar?
              </p>
              <p className="text-xs text-center text-muted-foreground mb-3">
                Vamos personalizar cada mensagem para você
              </p>
              <Input
                placeholder="Digite seu primeiro nome"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={pill}
                autoFocus
              />
            </div>
          </div>
        )}

        {/* ── STEP 2 — Data e Gênero ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center mb-5">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                Passo 2 — Seu perfil
              </p>
              <h2 className="text-2xl font-black mb-1 text-foreground">
                Olá, {formData.name.split(' ')[0] || 'você'}! ✨
              </h2>
              <p className="text-sm text-muted-foreground">
                Esses dados calibram suas metas metabólicas com precisão clínica.
              </p>
            </div>

            <div className="w-full bg-card rounded-2xl p-4 shadow-sm space-y-3">
              <div>
                <p className="text-sm font-bold text-foreground mb-1">Sua data de nascimento</p>
                <p className="text-xs text-muted-foreground mb-2">Usada para calcular seu metabolismo basal (TMB)</p>
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
              </div>
              <div>
                <p className="text-sm font-bold text-foreground mb-1">Sexo biológico</p>
                <p className="text-xs text-muted-foreground mb-2">Necessário para as fórmulas de composição corporal</p>
                <Select value={formData.gender} onValueChange={(v: Gender) => setFormData({ ...formData, gender: v })}>
                  <SelectTrigger className={pillSelect}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-primary/20">
                    <SelectItem className="text-primary focus:bg-primary/10 focus:text-primary cursor-pointer" value="masculino">Masculino</SelectItem>
                    <SelectItem className="text-primary focus:bg-primary/10 focus:text-primary cursor-pointer" value="feminino">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Reforço de privacidade */}
            <p className="text-xs text-center text-muted-foreground px-4">
              🔒 Seus dados ficam apenas no seu dispositivo — nunca são compartilhados.
            </p>
          </div>
        )}

        {/* ── STEP 3 — Medidas ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center mb-5">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                Passo 3 — Suas medidas
              </p>
              <h2 className="text-2xl font-black mb-1 text-foreground">
                De onde você parte e onde quer chegar
              </h2>
              <p className="text-sm text-muted-foreground">
                Aqui calculamos seu IMC, TDEE e a diferença real para sua meta.
              </p>
            </div>

            {/* Altura */}
            <div className="w-full bg-card rounded-2xl p-4 shadow-sm space-y-2">
              <p className="text-sm font-bold text-foreground">Sua altura</p>
              <div className="flex gap-2">
                {(['cm', 'ft'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setFormData({ ...formData, heightUnit: u, height: '' })}
                    className={`flex-1 h-9 rounded-full text-sm font-semibold transition-all ${formData.heightUnit === u ? 'bg-primary text-primary-foreground' : 'bg-black/[0.12] text-primary'}`}
                  >
                    {u === 'cm' ? 'Centímetros' : 'Pés (ft)'}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                step={formData.heightUnit === 'ft' ? '0.01' : '1'}
                placeholder={formData.heightUnit === 'cm' ? 'Ex: 165' : 'Ex: 5.5'}
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className={pill}
              />
            </div>

            {/* Peso */}
            <div className="w-full bg-card rounded-2xl p-4 shadow-sm space-y-2">
              <p className="text-sm font-bold text-foreground">Peso atual e peso desejado</p>
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
                placeholder={`Peso atual em ${formData.weightUnit} (ex: 78)`}
                value={formData.currentWeight}
                onChange={(e) => setFormData({ ...formData, currentWeight: e.target.value })}
                className={pill}
              />
              <Input
                type="number"
                step="0.1"
                placeholder={`Meu peso ideal em ${formData.weightUnit} (ex: 65)`}
                value={formData.targetWeight}
                onChange={(e) => setFormData({ ...formData, targetWeight: e.target.value })}
                className={pill}
              />
            </div>

            <Input
              type="number"
              step="0.1"
              placeholder="% de gordura corporal (opcional)"
              value={formData.bodyFatPercentage}
              onChange={(e) => setFormData({ ...formData, bodyFatPercentage: e.target.value })}
              className={pill}
            />
            <p className="text-xs text-center px-2 text-muted-foreground">
              Não sabe a % de gordura? Deixe em branco — usamos outras fórmulas igualmente precisas.
            </p>
          </div>
        )}

        {/* ── STEP 4 — Objetivo e Atividade ── */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="text-center mb-5">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                Passo 4 — Seu objetivo
              </p>
              <h2 className="text-2xl font-black mb-1 text-foreground">
                O que você quer conquistar?
              </h2>
              <p className="text-sm text-muted-foreground">
                Sua resposta define sua meta calórica e a estratégia do plano.
              </p>
            </div>

            <div className="w-full bg-card rounded-2xl p-4 shadow-sm space-y-3">
              <div>
                <p className="text-sm font-bold text-foreground mb-2">Objetivo principal</p>
                <Select value={formData.goal} onValueChange={(v: Goal) => setFormData({ ...formData, goal: v })}>
                  <SelectTrigger className={pillSelect}>
                    <SelectValue placeholder="Selecione seu objetivo" />
                  </SelectTrigger>
                  <SelectContent className={dropdownContent}>
                    <SelectItem className={dropdownItem} value="perder_peso">Perder peso e gordura corporal</SelectItem>
                    <SelectItem className={dropdownItem} value="ganhar_massa">Ganhar músculo e força</SelectItem>
                    <SelectItem className={dropdownItem} value="manter_peso">Manter meu peso atual</SelectItem>
                    <SelectItem className={dropdownItem} value="saude_geral">Melhorar minha saúde geral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground mb-2">Nível de atividade física</p>
                <Select value={formData.activityLevel} onValueChange={(v: ActivityLevel) => setFormData({ ...formData, activityLevel: v })}>
                  <SelectTrigger className={pillSelect}>
                    <SelectValue placeholder="Com que frequência você se move?" />
                  </SelectTrigger>
                  <SelectContent className={dropdownContent}>
                    <SelectItem className={dropdownItem} value="sedentario">Sedentário(a) — quase não me exercito</SelectItem>
                    <SelectItem className={dropdownItem} value="leve">Leve — 1 a 3 dias por semana</SelectItem>
                    <SelectItem className={dropdownItem} value="moderado">Moderada — 3 a 5 dias por semana</SelectItem>
                    <SelectItem className={dropdownItem} value="intenso">Intensa — 6 a 7 dias por semana</SelectItem>
                    <SelectItem className={dropdownItem} value="muito_intenso">Atleta — treino de alta performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <img src="/mascots/koala-treino.png" alt="Mascote treino" className="w-40 h-40 object-contain" />
            </div>
          </div>
        )}

        {/* ── STEP 5 — Preferências Alimentares ── */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="text-center mb-5">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                Passo 5 — Alimentação
              </p>
              <h2 className="text-2xl font-black mb-1 text-foreground">
                O cardápio precisa ser seu
              </h2>
              <p className="text-sm text-muted-foreground">
                Selecione o que se aplica — seu plano vai respeitar cada detalhe.
              </p>
            </div>

            <div className="w-full bg-card rounded-2xl p-4 shadow-sm space-y-3">
              <p className="text-sm font-bold text-foreground">Restrições ou preferências alimentares</p>
              {([
                ['nenhuma', 'Nenhuma restrição — como de tudo'],
                ['vegetariano', 'Vegetariana'],
                ['vegano', 'Vegana'],
                ['sem_lactose', 'Sem lactose'],
                ['sem_gluten', 'Sem glúten'],
                ['low_carb', 'Low carb / keto'],
                ['diabetes', 'Controle de açúcar (diabetes)'],
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

            {/* Alimentos excluídos */}
            <div className="w-full bg-card rounded-2xl p-4 shadow-sm">
              <p className="text-sm font-bold mb-1 text-foreground">Tem algum alimento que você não come?</p>
              <p className="text-xs text-muted-foreground mb-3">
                Ex: camarão, amendoim, fígado — opcional, mas importante para seu cardápio
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Digite e pressione +"
                  value={formData.excludedFoodsInput}
                  onChange={(e) => setFormData({ ...formData, excludedFoodsInput: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      const val = formData.excludedFoodsInput.trim().replace(/,$/,'')
                      if (val && !formData.excludedFoods.includes(val.toLowerCase())) {
                        setFormData({ ...formData, excludedFoods: [...formData.excludedFoods, val.toLowerCase()], excludedFoodsInput: '' })
                      }
                    }
                  }}
                  className={pill + ' flex-1'}
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = formData.excludedFoodsInput.trim()
                    if (val && !formData.excludedFoods.includes(val.toLowerCase())) {
                      setFormData({ ...formData, excludedFoods: [...formData.excludedFoods, val.toLowerCase()], excludedFoodsInput: '' })
                    }
                  }}
                  className="h-12 w-12 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center flex-shrink-0"
                >
                  +
                </button>
              </div>
              {formData.excludedFoods.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.excludedFoods.map((food) => (
                    <span
                      key={food}
                      className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full"
                    >
                      {food}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, excludedFoods: formData.excludedFoods.filter(f => f !== food) })}
                        className="ml-1 text-primary/60 hover:text-primary"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 6 — Rotina e Sono ── */}
        {step === 6 && (
          <div className="space-y-4">
            <div className="text-center mb-5">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                Passo 6 — Sua rotina
              </p>
              <h2 className="text-2xl font-black mb-1 text-foreground">
                Saúde começa na rotina, não só no prato
              </h2>
              <p className="text-sm text-muted-foreground">
                Sono e refeições afetam diretamente seu metabolismo e hormônios.
              </p>
            </div>

            <div className="w-full bg-card rounded-2xl p-4 shadow-sm space-y-3">
              <div>
                <p className="text-sm font-bold text-foreground mb-2">Quantas refeições por dia?</p>
                <Select value={formData.mealsPerDay} onValueChange={(v) => setFormData({ ...formData, mealsPerDay: v })}>
                  <SelectTrigger className={pillSelect}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className={dropdownContent}>
                    <SelectItem className={dropdownItem} value="2">2 refeições principais</SelectItem>
                    <SelectItem className={dropdownItem} value="3">3 refeições (café, almoço, jantar)</SelectItem>
                    <SelectItem className={dropdownItem} value="4">4 refeições</SelectItem>
                    <SelectItem className={dropdownItem} value="5">5 refeições</SelectItem>
                    <SelectItem className={dropdownItem} value="6">6 refeições ou mais</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            </div>

            <div className="w-full bg-card rounded-2xl p-4 shadow-sm space-y-3">
              <p className="text-sm font-bold text-foreground">Qualidade do sono</p>
              <p className="text-xs text-muted-foreground">
                Dormir mal aumenta o cortisol e dificulta o emagrecimento. Ser honesta aqui ajuda muito.
              </p>
              <Input
                type="number"
                step="0.5"
                placeholder="Quantas horas você dorme por noite? (ex: 7)"
                value={formData.averageSleepHours}
                onChange={(e) => setFormData({ ...formData, averageSleepHours: e.target.value })}
                className={pill}
              />
              <Select value={formData.sleepQuality} onValueChange={(v: SleepQuality) => setFormData({ ...formData, sleepQuality: v })}>
                <SelectTrigger className={pillSelect}>
                  <SelectValue placeholder="Como você costuma acordar?" />
                </SelectTrigger>
                <SelectContent className={dropdownContent}>
                  <SelectItem className={dropdownItem} value="ruim">Ruim — acordo cansada e sem energia</SelectItem>
                  <SelectItem className={dropdownItem} value="regular">Regular — durmo mal às vezes</SelectItem>
                  <SelectItem className={dropdownItem} value="bom">Bom — durmo bem na maioria das noites</SelectItem>
                  <SelectItem className={dropdownItem} value="excelente">Excelente — durmo profundamente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-center pt-2">
              <img src="/mascots/koala-sono.png" alt="Mascote sono" className="w-40 h-40 object-contain" />
            </div>
          </div>
        )}

        {/* ── STEP 7 — Jejum Intermitente ── */}
        {step === 7 && (
          <div className="flex flex-col flex-1 gap-4">
            <div className="text-center mb-5">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                Passo 7 — Jejum
              </p>
              <h2 className="text-2xl font-black mb-1 text-foreground">
                Jejum intermitente — você já tentou?
              </h2>
              <p className="text-sm text-muted-foreground">
                Não é obrigatório, mas pode potencializar seus resultados. Você decide.
              </p>
            </div>

            <div className="w-full bg-card rounded-2xl p-4 shadow-sm space-y-3">
              <p className="text-sm font-bold text-foreground mb-1">Sua experiência com jejum</p>
              <Select value={formData.fastingExperience} onValueChange={(v: FastingExperience) => setFormData({ ...formData, fastingExperience: v })}>
                <SelectTrigger className={pillSelect}>
                  <SelectValue placeholder="Selecione sua experiência" />
                </SelectTrigger>
                <SelectContent className={dropdownContent}>
                  <SelectItem className={dropdownItem} value="nunca">Nunca pratiquei — prefiro não incluir</SelectItem>
                  <SelectItem className={dropdownItem} value="iniciante">Iniciante — já tentei poucas vezes</SelectItem>
                  <SelectItem className={dropdownItem} value="intermediario">Intermediária — faço regularmente</SelectItem>
                  <SelectItem className={dropdownItem} value="avancado">Avançada — pratico há mais de 6 meses</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-start gap-3 px-1 pt-1">
                <Checkbox
                  id="fasting"
                  checked={formData.interestedInFasting}
                  onCheckedChange={(c) => setFormData({ ...formData, interestedInFasting: c as boolean })}
                />
                <label htmlFor="fasting" className="text-sm font-semibold cursor-pointer leading-snug text-primary">
                  Quero incluir jejum no meu plano (protocolos 12:12, 16:8, OMAD)
                </label>
              </div>
            </div>

            <div className="rounded-2xl p-4 bg-foreground">
              <p className="text-sm leading-relaxed text-background/88">
                <span className="font-bold text-background">💡 Dica: </span>
                O jejum pode ser ativado ou desativado a qualquer momento — não se preocupe em decidir agora. O BEM.ai adapta seu cardápio à janela alimentar que você escolher.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 8 — Medicação e Bariátrica ── */}
        {step === 8 && (
          <div className="flex flex-col flex-1 gap-4">
            <div className="text-center mb-5">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                Passo 8 — Saúde e medicação
              </p>
              <h2 className="text-2xl font-black mb-1 text-foreground">
                Seu plano precisa saber do seu contexto
              </h2>
              <p className="text-sm text-muted-foreground">
                GLP-1 e pós-bariátrica têm necessidades únicas. Seja honesta — é para o seu bem.
              </p>
            </div>

            {/* Cirurgia Bariátrica */}
            <div className="w-full bg-card rounded-2xl p-4 shadow-sm">
              <p className="text-sm font-bold mb-3 text-foreground">Você já fez cirurgia bariátrica?</p>
              <div className="flex gap-2">
                {[{ label: 'Não', value: false }, { label: 'Sim', value: true }].map(({ label, value }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setFormData({ ...formData, hadBariatricSurgery: value })}
                    className={`flex-1 h-10 rounded-full text-sm font-semibold transition-all ${formData.hadBariatricSurgery === value ? 'bg-primary text-primary-foreground' : 'bg-black/[0.12] text-primary'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {formData.hadBariatricSurgery && (
              <div className="rounded-2xl p-3 bg-primary/10 border border-primary/20">
                <p className="text-xs leading-relaxed text-primary">
                  ✓ Perfil pós-bariátrica ativado — cardápio fracionado, proteína como prioridade máxima, porções menores e foco em B12, ferro, cálcio e vitamina D.
                </p>
              </div>
            )}

            <div className="w-full bg-card rounded-2xl p-4 shadow-sm space-y-3">
              <p className="text-sm font-bold text-foreground mb-1">Usa alguma medicação para controle de peso?</p>
              <Select value={formData.medication} onValueChange={(v: MedicationType) => setFormData({ ...formData, medication: v })}>
                <SelectTrigger className={pillSelect}>
                  <SelectValue placeholder="Selecione sua medicação" />
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
            </div>

            {formData.medication !== 'nenhum' && (
              <div className="rounded-2xl p-3 bg-primary/10 border border-primary/20">
                <p className="text-xs leading-relaxed text-primary">
                  ✓ Plano GLP-1 ativado — porções menores para náuseas, proteína ≥1,8g/kg para preservar músculo, fibras elevadas para saciedade máxima e metas de hidratação reforçadas.
                </p>
              </div>
            )}

            <div className="rounded-2xl p-3 bg-foreground">
              <p className="text-sm leading-relaxed text-background/88">
                <span className="font-semibold text-background">ℹ️ </span>
                O BEM.ai não substitui orientação médica. Consulte sempre seu médico sobre medicamentos e mudanças alimentares.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 9 — Saúde e Limitações ── */}
        {step === 9 && (
          <div className="flex flex-col flex-1 gap-4">
            <div className="text-center mb-5">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                Passo 9 — Sua segurança
              </p>
              <h2 className="text-2xl font-black mb-1 text-foreground">
                Quase lá! Só mais uma coisa.
              </h2>
              <p className="text-sm text-muted-foreground">
                Precisamos saber se há algo que precisa de atenção especial nos seus treinos ou cardápio.
              </p>
            </div>

            <div className="w-full bg-card rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-3 px-1">
                <Checkbox
                  id="limitation"
                  checked={formData.hasLimitation}
                  onCheckedChange={(c) => setFormData({ ...formData, hasLimitation: c as boolean })}
                />
                <label htmlFor="limitation" className="text-sm font-semibold cursor-pointer leading-snug text-primary">
                  Tenho alguma condição médica ou limitação física que o BEM.ai deve considerar
                </label>
              </div>
              {formData.hasLimitation && (
                <div className="mt-3 space-y-2">
                  <Input
                    placeholder="Ex: dor no joelho, hipertensão, tireoide..."
                    value={formData.limitationDescription}
                    onChange={(e) => setFormData({ ...formData, limitationDescription: e.target.value })}
                    className={pill}
                  />
                  <p className="text-xs px-1 text-muted-foreground">
                    Usamos isso para sugerir exercícios mais seguros e adequados para você.
                  </p>
                </div>
              )}
            </div>

            {/* Reforço positivo antes do aviso */}
            <div className="rounded-2xl p-4 bg-primary/10 border border-primary/20">
              <p className="text-sm font-bold text-primary mb-1">🎉 Você está quase pronto!</p>
              <p className="text-sm leading-relaxed text-primary">
                Depois deste passo e do próximo, sua IA já começa a montar seu plano exclusivo.
              </p>
            </div>

            <div className="rounded-2xl p-4 bg-warning/15 border border-warning">
              <p className="text-sm font-semibold mb-1 text-warning">⚠️ Atenção médica:</p>
              <p className="text-sm leading-relaxed text-warning">
                Se você tem diabetes, hipertensão, problemas cardíacos, transtornos alimentares ou está grávida/amamentando, consulte um médico antes de iniciar qualquer programa.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 10 — Privacidade e Consentimento ── */}
        {step === 10 && (
          <div className="space-y-4">
            <div className="text-center mb-5">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                Passo 10 — Seus dados
              </p>
              <h2 className="text-2xl font-black mb-1 text-foreground">
                Seus dados são seus. Sempre.
              </h2>
              <p className="text-sm text-muted-foreground">
                Conformidade total com a LGPD — transparência em cada dado que coletamos.
              </p>
            </div>

            <div className="rounded-2xl p-4 bg-foreground">
              <p className="text-sm font-semibold text-background mb-3">Como seus dados são protegidos:</p>
              <ul className="space-y-2 text-sm text-background/88">
                <li>✓ Dados de saúde armazenados com criptografia</li>
                <li>✓ Nunca compartilhados com terceiros ou anunciantes</li>
                <li>✓ Você pode exportar ou apagar tudo a qualquer momento</li>
                <li>✓ Em conformidade com LGPD (Lei nº 13.709/2018)</li>
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
                  Autorizo o BEM.ai a processar meus dados de saúde para personalizar meu plano
                </label>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Você pode revogar esses consentimentos a qualquer momento nas Configurações.
            </p>

            {/* Antecipação do que vem depois */}
            {formData.consentTerms && formData.consentPrivacyPolicy && formData.consentDataProcessing && (
              <div className="rounded-2xl p-4 bg-primary/10 border border-primary/20 animate-in fade-in duration-300">
                <p className="text-sm font-bold text-primary text-center">
                  ✨ Tudo pronto! Sua IA vai montar seu plano agora.
                </p>
                <p className="text-xs text-primary/80 text-center mt-1">
                  Calorias, macros, hidratação e cardápio — personalizados só para você.
                </p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Botão fixo no rodapé */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-3 bg-background/80 backdrop-blur-sm">
        <button
          onClick={handleNext}
          disabled={!canProceed()}
          className="w-full py-4 rounded-full bg-primary text-primary-foreground text-base font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          {step === totalSteps
            ? '✨ Criar Meu Plano Personalizado!'
            : step === 9
              ? 'Quase lá — Continuar →'
              : 'Continuar →'}
        </button>
        {step === 1 && (
          <p className="text-xs text-center text-muted-foreground mt-2">
            7 dias grátis · Sem cartão de crédito · Cancele quando quiser
          </p>
        )}
      </div>

      <TermsDialog open={showTermsDialog} onOpenChange={setShowTermsDialog} />
      <PrivacyDialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog} />
    </div>
  )
}
