import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useApp } from '@/contexts/AppContext'
import type { UserProfile, Gender, Goal, ActivityLevel, MedicationType, DietaryPreference, FastingExperience, SleepQuality, SavedWeeklyMenu } from '@/types'
import { calculateBMR, calculateTDEE, calculateCalorieTarget, calculateMacros, calculateWaterTarget } from '@/lib/health-utils'
import { calculateAITargets, generateWeeklyMenu } from '@/lib/gemini'
import { supabase } from '@/lib/supabase'
import { upsertWeeklyMenuDb } from '@/lib/db-sync'
import { TermsDialog } from '@/components/terms-dialog'
import { PrivacyDialog } from '@/components/privacy-dialog'
import { useTranslation } from '@/contexts/LanguageContext'

/* ── Styles (same as OnboardingNew) ─────────────────────────────────────────── */
const pill = "h-12 rounded-full bg-black/[0.12] border border-black/[0.06] px-5 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
const pillSelect = "h-12 rounded-full bg-black/[0.12] border border-black/[0.06] px-5 text-primary data-[placeholder]:!text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
const dropdownContent = "bg-background border-primary/20"
const dropdownItem = "text-primary focus:bg-black/[0.12] focus:text-primary cursor-pointer"

interface Props {
  open: boolean
  onComplete: () => void
}

export function ProfileSetupModal({ open, onComplete }: Props) {
  const { user, setUser, session } = useApp()
  const { t } = useTranslation()
  const ts = t.profileSetup
  const [step, setStep] = useState(1)
  const [isCalculating, setIsCalculating] = useState(false)
  const [showTermsDialog, setShowTermsDialog] = useState(false)
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false)

  const [formData, setFormData] = useState({
    name: user?.name || '',
    birthDate: '',
    gender: (user?.gender === 'outro' ? '' : user?.gender || '') as Gender,
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
    hasLimitation: false,
    limitationDescription: '',
    consentTerms: false,
    consentPrivacyPolicy: false,
    consentDataProcessing: false,
  })

  const totalSteps = 10

  if (!open) return null

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1)
    else handleComplete()
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

  function mapToDb(profile: UserProfile, email: string) {
    return {
      name: profile.name, age: profile.age, gender: profile.gender, height: profile.height,
      current_weight: profile.currentWeight, target_weight: profile.targetWeight,
      body_fat_percentage: profile.bodyFatPercentage ?? null, goal: profile.goal,
      activity_level: profile.activityLevel, dietary_preferences: profile.dietaryPreferences,
      meal_routine: profile.mealRoutine, average_sleep_hours: profile.averageSleepHours,
      sleep_quality: profile.sleepQuality, fasting_experience: profile.fastingExperience,
      interested_in_fasting: profile.interestedInFasting, medication: profile.medication,
      medication_dosage: profile.medicationDosage ?? null,
      had_bariatric_surgery: profile.hadBariatricSurgery ?? false,
      medical_limitations: profile.medicalLimitations,
      consent_terms: profile.consentTerms, consent_privacy_policy: profile.consentPrivacyPolicy,
      consent_data_processing: profile.consentDataProcessing,
      bmr: profile.bmr ?? null, tdee: profile.tdee ?? null,
      target_calories: profile.targetCalories ?? null, target_protein: profile.targetProtein ?? null,
      target_carbs: profile.targetCarbs ?? null, target_fat: profile.targetFat ?? null,
      target_fiber: profile.targetFiber ?? null, target_water: profile.targetWater ?? null,
      email,
    }
  }

  const handleComplete = async () => {
    setIsCalculating(true)

    const [dd, mm, yyyy] = formData.birthDate.split('/')
    const birthDate = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd))
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear() -
      (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0)
    const height = formData.heightUnit === 'ft' ? Math.round(parseFloat(formData.height) * 30.48) : parseInt(formData.height)
    const currentWeight = formData.weightUnit === 'lbs' ? Math.round(parseFloat(formData.currentWeight) * 0.453592 * 10) / 10 : parseFloat(formData.currentWeight)
    const targetWeight = formData.weightUnit === 'lbs' ? Math.round(parseFloat(formData.targetWeight) * 0.453592 * 10) / 10 : parseFloat(formData.targetWeight)
    const bodyFatPercentage = formData.bodyFatPercentage ? parseFloat(formData.bodyFatPercentage) : undefined
    const sleepHours = parseFloat(formData.averageSleepHours) || 7

    const fallbackBmr = calculateBMR(currentWeight, height, age, formData.gender)
    const fallbackTdee = calculateTDEE(fallbackBmr, formData.activityLevel)
    const fallbackCalories = calculateCalorieTarget(fallbackTdee, formData.goal, formData.medication)
    const fallbackMacros = calculateMacros(fallbackCalories, formData.goal, currentWeight)
    const fallbackWater = calculateWaterTarget(currentWeight, formData.activityLevel)
    let fallbackFiber = fallbackMacros.fiber
    if (formData.medication !== 'nenhum') fallbackFiber = Math.round(fallbackFiber * 1.5)

    let aiTargets = { bmr: Math.round(fallbackBmr), tdee: Math.round(fallbackTdee), targetCalories: Math.round(fallbackCalories), targetProtein: fallbackMacros.protein, targetCarbs: fallbackMacros.carbs, targetFat: fallbackMacros.fat, targetFiber: fallbackFiber, targetWater: fallbackWater }

    try {
      const result = await calculateAITargets({ name: formData.name, age, gender: formData.gender, height, currentWeight, targetWeight, goal: formData.goal, activityLevel: formData.activityLevel, medication: formData.medication, medicationDosage: formData.medicationDosage || undefined, hadBariatricSurgery: formData.hadBariatricSurgery, dietaryPreferences: formData.dietaryPreferences, averageSleepHours: sleepHours })
      aiTargets = { bmr: result.bmr, tdee: result.tdee, targetCalories: result.targetCalories, targetProtein: result.targetProtein, targetCarbs: result.targetCarbs, targetFat: result.targetFat, targetFiber: result.targetFiber, targetWater: result.targetWater }
    } catch { /* fallback */ }

    const uid = session?.user?.id
    const email = session?.user?.email ?? ''

    const profile: UserProfile = {
      id: uid || crypto.randomUUID(),
      name: formData.name, age, gender: formData.gender, height,
      startingWeight: currentWeight, currentWeight, targetWeight, bodyFatPercentage,
      goal: formData.goal, activityLevel: formData.activityLevel,
      dietaryPreferences: formData.dietaryPreferences,
      mealRoutine: { mealsPerDay: parseInt(formData.mealsPerDay), breakfastTime: formData.breakfastTime, lunchTime: formData.lunchTime, dinnerTime: formData.dinnerTime, hasSnacks: formData.hasSnacks },
      averageSleepHours: sleepHours, sleepQuality: formData.sleepQuality,
      fastingExperience: formData.fastingExperience, interestedInFasting: formData.interestedInFasting,
      medication: formData.medication, medicationDosage: formData.medicationDosage || undefined,
      hadBariatricSurgery: formData.hadBariatricSurgery,
      medicalLimitations: { hasLimitation: formData.hasLimitation, description: formData.limitationDescription || undefined },
      consentTerms: formData.consentTerms, consentPrivacyPolicy: formData.consentPrivacyPolicy, consentDataProcessing: formData.consentDataProcessing,
      ...aiTargets, createdAt: new Date(), updatedAt: new Date(),
    }

    if (uid) {
      await supabase.from('profiles').upsert({ id: uid, ...mapToDb(profile, email) }, { onConflict: 'id' })
    }

    setUser(profile)

    if (uid) {
      generateWeeklyMenu(profile).then(menu => {
        const saved: SavedWeeklyMenu = { ...menu, id: crypto.randomUUID(), createdAt: new Date(), acceptedAt: new Date() }
        upsertWeeklyMenuDb(uid, saved)
      }).catch((e) => console.error('[cardápio] auto-geração (perfil) falhou:', e))
    }

    setIsCalculating(false)
    onComplete()
  }

  /* ── CALCULATING SCREEN ───────────────────────────────────────────────────── */
  if (isCalculating) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 bg-background">
        <img src="/mascots/koala-zen.webp" alt="Mascote" className="w-36 h-36 object-contain mb-6 animate-pulse" />
        <h2 className="text-2xl font-black mb-3 text-foreground">{ts.calculating.title}</h2>
        <p className="text-sm mb-6 px-4 text-center text-muted-foreground">
          {ts.calculating.desc}
          {formData.medication !== 'nenhum' ? ` ${ts.calculating.withMedPrefix} ${formData.medication}` : ''}.
        </p>
        <div className="flex justify-center gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2.5 h-2.5 rounded-full bg-primary" style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
        <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0.8);opacity:0.5} 40%{transform:scale(1.2);opacity:1} }`}</style>
      </div>
    )
  }

  /* ── RENDER (exact same design as OnboardingNew) ──────────────────────────── */
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">

      {/* Bolinhas de progresso */}
      <div className="flex justify-center gap-1.5 pt-10 pb-4">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i + 1 <= step ? 'bg-primary' : 'bg-card/50'}`}
          />
        ))}
      </div>

      {/* Conteúdo do step */}
      <div className="flex-1 px-6 pb-28 flex flex-col overflow-y-auto">

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="flex flex-col items-center text-center">
            <img src="/mascots/koala-zen.webp" alt="Mascote" className="w-32 h-32 object-contain mb-4" />
            <p className="text-base font-bold leading-snug mb-1 text-foreground">
              {ts.step1.welcomeTitle}
            </p>
            <p className="text-sm mb-6 text-muted-foreground">
              {ts.step1.welcomeSubtitle}
            </p>
            <div className="w-full bg-card rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-semibold text-center mb-3 text-primary">{ts.step1.nameLabel}</p>
              <Input placeholder={ts.step1.namePlaceholder} value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={pill} />
            </div>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-1 text-foreground">{ts.step2.title}</h2>
              <p className="text-sm text-muted-foreground">{ts.step2.subtitle}</p>
            </div>
            <Input type="text" inputMode="numeric" placeholder={ts.step2.birthDatePlaceholder} value={formData.birthDate}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
                let masked = digits
                if (digits.length > 4) masked = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4)
                else if (digits.length > 2) masked = digits.slice(0, 2) + '/' + digits.slice(2)
                setFormData({ ...formData, birthDate: masked })
              }} className={pill} />
            <Select value={formData.gender} onValueChange={(v: Gender) => setFormData({ ...formData, gender: v })}>
              <SelectTrigger className={pillSelect}><SelectValue placeholder={ts.step2.genderPlaceholder} /></SelectTrigger>
              <SelectContent className="bg-card border-primary/20">
                <SelectItem className="text-primary focus:bg-primary/10 focus:text-primary cursor-pointer" value="masculino">{ts.step2.masculine}</SelectItem>
                <SelectItem className="text-primary focus:bg-primary/10 focus:text-primary cursor-pointer" value="feminino">{ts.step2.feminine}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-1 text-foreground">{ts.step3.title}</h2>
              <p className="text-sm text-muted-foreground">{ts.step3.subtitle}</p>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                {(['cm', 'ft'] as const).map((u) => (
                  <button key={u} type="button" onClick={() => setFormData({ ...formData, heightUnit: u, height: '' })}
                    className={`flex-1 h-9 rounded-full text-sm font-semibold transition-all ${formData.heightUnit === u ? 'bg-primary text-primary-foreground' : 'bg-black/[0.12] text-primary'}`}>
                    {u === 'cm' ? ts.step3.cm : ts.step3.ft}
                  </button>
                ))}
              </div>
              <Input type="number" step={formData.heightUnit === 'ft' ? '0.01' : '1'}
                placeholder={formData.heightUnit === 'cm' ? ts.step3.heightPlaceholderCm : ts.step3.heightPlaceholderFt}
                value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} className={pill} />
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                {(['kg', 'lbs'] as const).map((u) => (
                  <button key={u} type="button" onClick={() => setFormData({ ...formData, weightUnit: u, currentWeight: '', targetWeight: '' })}
                    className={`flex-1 h-9 rounded-full text-sm font-semibold transition-all ${formData.weightUnit === u ? 'bg-primary text-primary-foreground' : 'bg-black/[0.12] text-primary'}`}>
                    {u === 'kg' ? ts.step3.kg : ts.step3.lbs}
                  </button>
                ))}
              </div>
              <Input type="number" step="0.1" placeholder={`${ts.step3.currentWeightPlaceholder} ${formData.weightUnit}`}
                value={formData.currentWeight} onChange={(e) => setFormData({ ...formData, currentWeight: e.target.value })} className={pill} />
              <Input type="number" step="0.1" placeholder={`${ts.step3.targetWeightPlaceholder} ${formData.weightUnit}`}
                value={formData.targetWeight} onChange={(e) => setFormData({ ...formData, targetWeight: e.target.value })} className={pill} />
            </div>
            <Input type="number" step="0.1" placeholder={ts.step3.bodyFatPlaceholder}
              value={formData.bodyFatPercentage} onChange={(e) => setFormData({ ...formData, bodyFatPercentage: e.target.value })} className={pill} />
            <p className="text-xs text-center px-2 text-muted-foreground">{ts.step3.bodyFatHelp}</p>
          </div>
        )}

        {/* ── STEP 4 ── */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-1 text-foreground">{ts.step4.title}</h2>
              <p className="text-sm text-muted-foreground">{ts.step4.subtitle}</p>
            </div>
            <Select value={formData.goal} onValueChange={(v: Goal) => setFormData({ ...formData, goal: v })}>
              <SelectTrigger className={pillSelect}><SelectValue placeholder={ts.step4.goalPlaceholder} /></SelectTrigger>
              <SelectContent className={dropdownContent}>
                <SelectItem className={dropdownItem} value="perder_peso">{ts.step4.goalLose}</SelectItem>
                <SelectItem className={dropdownItem} value="ganhar_massa">{ts.step4.goalGain}</SelectItem>
                <SelectItem className={dropdownItem} value="manter_peso">{ts.step4.goalMaintain}</SelectItem>
                <SelectItem className={dropdownItem} value="saude_geral">{ts.step4.goalHealth}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={formData.activityLevel} onValueChange={(v: ActivityLevel) => setFormData({ ...formData, activityLevel: v })}>
              <SelectTrigger className={pillSelect}><SelectValue placeholder={ts.step4.activityPlaceholder} /></SelectTrigger>
              <SelectContent className={dropdownContent}>
                <SelectItem className={dropdownItem} value="sedentario">{ts.step4.sedentary}</SelectItem>
                <SelectItem className={dropdownItem} value="leve">{ts.step4.light}</SelectItem>
                <SelectItem className={dropdownItem} value="moderado">{ts.step4.moderate}</SelectItem>
                <SelectItem className={dropdownItem} value="intenso">{ts.step4.intense}</SelectItem>
                <SelectItem className={dropdownItem} value="muito_intenso">{ts.step4.veryIntense}</SelectItem>
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
              <h2 className="text-xl font-bold mb-1 text-foreground">{ts.step5.title}</h2>
              <p className="text-sm text-muted-foreground">{ts.step5.subtitle}</p>
            </div>
            <div className="space-y-4">
              {([
                ['nenhuma', ts.step5.none], ['vegetariano', ts.step5.vegetarian], ['vegano', ts.step5.vegan],
                ['sem_lactose', ts.step5.noLactose], ['sem_gluten', ts.step5.noGluten], ['low_carb', ts.step5.lowCarb],
                ['diabetes', ts.step5.diabetes],
              ] as [DietaryPreference, string][]).map(([value, label]) => (
                <div key={value} className="flex items-center gap-3">
                  <Checkbox id={`m-${value}`} checked={formData.dietaryPreferences.includes(value)} onCheckedChange={() => toggleDietaryPreference(value)} />
                  <label htmlFor={`m-${value}`} className={`text-sm font-semibold cursor-pointer ${formData.dietaryPreferences.includes(value) ? 'text-primary' : 'text-foreground'}`}>{label}</label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 6 ── */}
        {step === 6 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-1 text-foreground">{ts.step6.title}</h2>
              <p className="text-sm text-muted-foreground">{ts.step6.subtitle}</p>
            </div>
            <Select value={formData.mealsPerDay} onValueChange={(v) => setFormData({ ...formData, mealsPerDay: v })}>
              <SelectTrigger className={pillSelect}><SelectValue placeholder={ts.step6.mealsPlaceholder} /></SelectTrigger>
              <SelectContent className={dropdownContent}>
                {['2', '3', '4', '5', '6'].map(v => (
                  <SelectItem key={v} className={dropdownItem} value={v}>{v} {ts.step6.mealsUnit}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-3 px-1">
              <Checkbox id="m-snacks" checked={formData.hasSnacks} onCheckedChange={(c) => setFormData({ ...formData, hasSnacks: c as boolean })} />
              <label htmlFor="m-snacks" className="text-sm font-semibold cursor-pointer text-primary">{ts.step6.snacks}</label>
            </div>
            <Input type="number" step="0.5" placeholder={ts.step6.sleepPlaceholder}
              value={formData.averageSleepHours} onChange={(e) => setFormData({ ...formData, averageSleepHours: e.target.value })} className={pill} />
            <Select value={formData.sleepQuality} onValueChange={(v: SleepQuality) => setFormData({ ...formData, sleepQuality: v })}>
              <SelectTrigger className={pillSelect}><SelectValue placeholder={ts.step6.wakeQualityPlaceholder} /></SelectTrigger>
              <SelectContent className={dropdownContent}>
                <SelectItem className={dropdownItem} value="ruim">{ts.step6.qualityPoor}</SelectItem>
                <SelectItem className={dropdownItem} value="regular">{ts.step6.qualityRegular}</SelectItem>
                <SelectItem className={dropdownItem} value="bom">{ts.step6.qualityGood}</SelectItem>
                <SelectItem className={dropdownItem} value="excelente">{ts.step6.qualityExcellent}</SelectItem>
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
              <h2 className="text-xl font-bold mb-1 text-foreground">{ts.step7.title}</h2>
              <p className="text-sm text-muted-foreground">{ts.step7.subtitle}</p>
            </div>
            <Select value={formData.fastingExperience} onValueChange={(v: FastingExperience) => setFormData({ ...formData, fastingExperience: v })}>
              <SelectTrigger className={pillSelect}><SelectValue placeholder={ts.step7.experiencePlaceholder} /></SelectTrigger>
              <SelectContent className={dropdownContent}>
                <SelectItem className={dropdownItem} value="nunca">{ts.step7.never}</SelectItem>
                <SelectItem className={dropdownItem} value="iniciante">{ts.step7.beginner}</SelectItem>
                <SelectItem className={dropdownItem} value="intermediario">{ts.step7.intermediate}</SelectItem>
                <SelectItem className={dropdownItem} value="avancado">{ts.step7.advanced}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-start gap-3 px-1">
              <Checkbox id="m-fasting" checked={formData.interestedInFasting} onCheckedChange={(c) => setFormData({ ...formData, interestedInFasting: c as boolean })} />
              <label htmlFor="m-fasting" className="text-sm font-semibold cursor-pointer leading-snug text-primary">{ts.step7.interested}</label>
            </div>
            <div className="rounded-2xl p-4 mt-auto bg-foreground">
              <p className="text-sm leading-relaxed text-background/88">{ts.step7.disclaimer}</p>
            </div>
          </div>
        )}

        {/* ── STEP 8 ── */}
        {step === 8 && (
          <div className="flex flex-col flex-1 gap-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-1 text-foreground">{ts.step8.title}</h2>
              <p className="text-sm text-muted-foreground">{ts.step8.subtitle}</p>
            </div>
            <Select value={formData.medication} onValueChange={(v: MedicationType) => setFormData({ ...formData, medication: v })}>
              <SelectTrigger className={pillSelect}><SelectValue placeholder={ts.step8.placeholder} /></SelectTrigger>
              <SelectContent className={dropdownContent}>
                <SelectItem className={dropdownItem} value="nenhum">{ts.step8.none}</SelectItem>
                <SelectItem className={dropdownItem} value="ozempic">Ozempic (Semaglutida)</SelectItem>
                <SelectItem className={dropdownItem} value="saxenda">Saxenda (Liraglutida)</SelectItem>
                <SelectItem className={dropdownItem} value="victoza">Victoza (Liraglutida)</SelectItem>
                <SelectItem className={dropdownItem} value="mounjaro">Mounjaro (Tirzepatida)</SelectItem>
                <SelectItem className={dropdownItem} value="wegovy">Wegovy (Semaglutida)</SelectItem>
                <SelectItem className={dropdownItem} value="outro_glp1">Outro GLP-1</SelectItem>
              </SelectContent>
            </Select>
            {formData.medication !== 'nenhum' && (
              <Input placeholder={ts.step8.dosagePlaceholder} value={formData.medicationDosage}
                onChange={(e) => setFormData({ ...formData, medicationDosage: e.target.value })} className={pill} />
            )}

            {/* Checkbox separado: cirurgia bariátrica pode coexistir com medicação */}
            <div className="flex items-start gap-3 px-1 pt-2">
              <Checkbox
                id="m-bariatric"
                checked={formData.hadBariatricSurgery}
                onCheckedChange={(c) => setFormData({ ...formData, hadBariatricSurgery: c as boolean })}
              />
              <label htmlFor="m-bariatric" className="text-sm font-semibold cursor-pointer leading-snug text-primary">
                {ts.step8.bariatric}
              </label>
            </div>

            <div className="rounded-2xl p-4 mt-auto bg-foreground">
              <p className="text-sm leading-relaxed text-background/88">
                <span className="font-semibold text-background">{ts.step8.disclaimerLabel} </span>
                {ts.step8.disclaimerText}
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 9 ── */}
        {step === 9 && (
          <div className="flex flex-col flex-1 gap-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-1 text-foreground">{ts.step9.title}</h2>
              <p className="text-sm text-muted-foreground">{ts.step9.subtitle}</p>
            </div>
            <div className="flex items-start gap-3 px-1">
              <Checkbox id="m-limitation" checked={formData.hasLimitation} onCheckedChange={(c) => setFormData({ ...formData, hasLimitation: c as boolean })} />
              <label htmlFor="m-limitation" className="text-sm font-semibold cursor-pointer leading-snug text-primary">{ts.step9.hasLimitation}</label>
            </div>
            {formData.hasLimitation && (
              <>
                <Input placeholder={ts.step9.describePlaceholder} value={formData.limitationDescription}
                  onChange={(e) => setFormData({ ...formData, limitationDescription: e.target.value })} className={pill} />
                <p className="text-xs px-1 text-muted-foreground">{ts.step9.helper}</p>
              </>
            )}
            <div className="rounded-2xl p-4 mt-auto bg-warning/15 border border-warning">
              <p className="text-sm font-semibold mb-1 text-warning">{ts.step9.warningTitle}</p>
              <p className="text-sm leading-relaxed text-warning">
                {ts.step9.warningText}
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 10 ── */}
        {step === 10 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-1 text-foreground">{ts.step10.title}</h2>
              <p className="text-sm text-muted-foreground">{ts.step10.subtitle}</p>
            </div>
            <div className="rounded-2xl p-4 bg-foreground">
              <p className="text-sm font-semibold text-background mb-3">{ts.step10.infoTitle}</p>
              <ul className="space-y-2 text-sm text-background/88">
                <li>✓ {ts.step10.info1}</li>
                <li>✓ {ts.step10.info2}</li>
                <li>✓ {ts.step10.info3}</li>
                <li>✓ {ts.step10.info4}</li>
              </ul>
            </div>
            <div className="space-y-4 px-1">
              <div className="flex items-start gap-3">
                <Checkbox id="m-terms" checked={formData.consentTerms} onCheckedChange={(c) => setFormData({ ...formData, consentTerms: c as boolean })} />
                <label htmlFor="m-terms" className="text-sm font-semibold cursor-pointer leading-snug text-primary">
                  {ts.step10.termsLabel} <span className="underline" onClick={(e) => { e.preventDefault(); setShowTermsDialog(true) }}>{ts.step10.termsLink}</span>
                </label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox id="m-privacy" checked={formData.consentPrivacyPolicy} onCheckedChange={(c) => setFormData({ ...formData, consentPrivacyPolicy: c as boolean })} />
                <label htmlFor="m-privacy" className="text-sm font-semibold cursor-pointer leading-snug text-primary">
                  {ts.step10.privacyLabel} <span className="underline" onClick={(e) => { e.preventDefault(); setShowPrivacyDialog(true) }}>{ts.step10.privacyLink}</span>
                </label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox id="m-processing" checked={formData.consentDataProcessing} onCheckedChange={(c) => setFormData({ ...formData, consentDataProcessing: c as boolean })} />
                <label htmlFor="m-processing" className="text-sm font-semibold cursor-pointer leading-snug text-primary">
                  {ts.step10.processing}
                </label>
              </div>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              {ts.step10.revoke}
            </p>
          </div>
        )}

      </div>

      {/* Botão fixo no rodapé */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-3 z-50 bg-gradient-to-b from-transparent to-background to-30%">
        <button onClick={handleNext} disabled={!canProceed()}
          className="w-full py-4 rounded-full bg-primary text-primary-foreground text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:brightness-105 active:scale-[0.99] flex items-center justify-center gap-2">
          {step === totalSteps ? ts.common.createPlan : ts.common.continue}
        </button>
      </div>

      <TermsDialog open={showTermsDialog} onOpenChange={setShowTermsDialog} />
      <PrivacyDialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog} />
    </div>
  )
}
