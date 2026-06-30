import type { IMCData, MacroNutrients, ActivityLevel, Goal, Gender, MedicationType, SleepQuality } from '@/types'

// Classes Tailwind por qualidade de sono (badge: fundo translúcido + texto).
// Strings literais para o JIT do Tailwind detectar.
export function getSleepQualityBadge(quality: SleepQuality): string {
  switch (quality) {
    case 'excelente': return 'bg-success/15 text-success'
    case 'bom':       return 'bg-primary/15 text-primary'
    case 'regular':   return 'bg-warning/15 text-warning'
    case 'ruim':      return 'bg-destructive/15 text-destructive'
    default:          return 'bg-muted text-muted-foreground'
  }
}

// Classes para botão de seleção de qualidade quando ativo (borda + fundo + texto).
export function getSleepQualitySelected(quality: SleepQuality): string {
  switch (quality) {
    case 'excelente': return 'border-success bg-success/15 text-success'
    case 'bom':       return 'border-primary bg-primary/15 text-primary'
    case 'regular':   return 'border-warning bg-warning/15 text-warning'
    case 'ruim':      return 'border-destructive bg-destructive/15 text-destructive'
    default:          return 'border-border bg-muted text-muted-foreground'
  }
}

export function calculateIMC(weight: number, height: number): IMCData {
  const heightInMeters = height / 100
  const imc = weight / (heightInMeters * heightInMeters)

  let category: IMCData['category']
  let description: string

  if (imc < 18.5) {
    category = 'abaixo'
    description = 'Abaixo do peso'
  } else if (imc >= 18.5 && imc < 25) {
    category = 'normal'
    description = 'Peso normal'
  } else if (imc >= 25 && imc < 30) {
    category = 'sobrepeso'
    description = 'Sobrepeso'
  } else if (imc >= 30 && imc < 35) {
    category = 'obesidade_i'
    description = 'Obesidade Grau I'
  } else if (imc >= 35 && imc < 40) {
    category = 'obesidade_ii'
    description = 'Obesidade Grau II'
  } else {
    category = 'obesidade_iii'
    description = 'Obesidade Grau III'
  }

  return {
    value: Math.round(imc * 10) / 10,
    category,
    description
  }
}

export function calculateBMR(weight: number, height: number, age: number, gender: Gender): number {
  // Fórmula de Mifflin-St Jeor
  if (gender === 'masculino') {
    return 10 * weight + 6.25 * height - 5 * age + 5
  } else {
    // feminino, outro ou prefiro não informar usa cálculo feminino como base
    return 10 * weight + 6.25 * height - 5 * age - 161
  }
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const multipliers = {
    sedentario: 1.2,
    leve: 1.375,
    moderado: 1.55,
    intenso: 1.725,
    muito_intenso: 1.9
  }

  return bmr * multipliers[activityLevel]
}

export function calculateCalorieTarget(
  tdee: number,
  goal: Goal,
  medication: MedicationType
): number {
  let target = tdee

  // Ajuste baseado no objetivo
  if (goal === 'perder_peso') {
    target = tdee - 500 // déficit de 500 calorias
  } else if (goal === 'ganhar_massa') {
    target = tdee + 300 // superávit de 300 calorias
  }

  // Ajuste para medicamentos GLP-1 (reduzem apetite)
  if (medication !== 'nenhum' && goal === 'perder_peso') {
    // Com medicação, pode reduzir um pouco mais, mas com segurança
    target = Math.max(target - 200, 1200) // nunca abaixo de 1200 cal
  }

  // Limite mínimo de segurança
  return Math.max(target, 1200)
}

export function calculateMacros(
  calories: number,
  goal: Goal,
  weight: number
): MacroNutrients {
  let proteinPerKg: number
  let fatPercentage: number

  if (goal === 'ganhar_massa') {
    proteinPerKg = 2.0 // 2g por kg para hipertrofia
    fatPercentage = 0.25 // 25% de gordura
  } else if (goal === 'perder_peso') {
    proteinPerKg = 1.8 // 1.8g por kg para preservar massa
    fatPercentage = 0.30 // 30% de gordura
  } else {
    proteinPerKg = 1.5 // 1.5g por kg para manutenção
    fatPercentage = 0.30
  }

  const protein = weight * proteinPerKg
  const proteinCalories = protein * 4

  const fat = (calories * fatPercentage) / 9
  const fatCalories = fat * 9

  const carbCalories = Math.max(0, calories - proteinCalories - fatCalories)
  const carbs = carbCalories / 4

  const fiber = Math.round(calories / 1000 * 14) // 14g por 1000 calorias

  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    fiber
  }
}

/**
 * Aplica os PISOS CLÍNICOS às metas de proteína/fibra (fonte única, antes só vivia inline no setUser):
 * - GLP-1 ou bariátrica: fibra mínima 35g/dia.
 * - Bariátrica: proteína mínima 1.5 g/kg.
 * Deve ser chamado em TODO recálculo de metas (onboarding, edição de perfil, registro de peso, boot),
 * senão registrar peso rebaixa a meta clínica abaixo do piso.
 */
export function applyClinicalFloors(
  macros: MacroNutrients,
  opts: { medication: MedicationType; hadBariatricSurgery?: boolean; weight: number }
): MacroNutrients {
  let { protein, fiber } = macros
  const isGlp1 = opts.medication !== 'nenhum'
  if (isGlp1 || opts.hadBariatricSurgery) fiber = Math.max(fiber, 35)
  if (opts.hadBariatricSurgery) protein = Math.max(protein, Math.round(opts.weight * 1.5))
  return { ...macros, protein, fiber }
}

export function calculateWaterTarget(weight: number, activityLevel: ActivityLevel): number {
  // Base: 35ml por kg
  let baseWater = weight * 35

  // Ajuste por atividade física
  if (activityLevel === 'intenso' || activityLevel === 'muito_intenso') {
    baseWater += 500 // adiciona 500ml para quem treina intenso
  } else if (activityLevel === 'moderado') {
    baseWater += 250
  }

  return Math.round(baseWater)
}

export function getIMCColor(category: IMCData['category']): string {
  switch (category) {
    case 'abaixo':
      return 'text-chart-2'
    case 'normal':
      return 'text-primary'
    case 'sobrepeso':
      return 'text-chart-2'
    case 'obesidade_i':
    case 'obesidade_ii':
    case 'obesidade_iii':
      return 'text-destructive'
    default:
      return 'text-foreground'
  }
}

export function formatWeight(weight: number): string {
  return `${weight.toFixed(1)} kg`
}

export function formatHeight(height: number): string {
  const meters = Math.floor(height / 100)
  const cm = height % 100
  return `${meters},${cm.toString().padStart(2, '0')} m`
}

export function getMotivationalMessage(progress: number): string {
  if (progress >= 100) {
    return '🎉 Meta alcançada! Você é incrível!'
  } else if (progress >= 75) {
    return '💪 Está quase lá! Continue firme!'
  } else if (progress >= 50) {
    return '🌟 No meio do caminho! Você consegue!'
  } else if (progress >= 25) {
    return '🚀 Ótimo começo! Siga em frente!'
  } else {
    return '✨ Cada passo conta! Vamos juntos!'
  }
}

export function getMedicationInfo(medication: MedicationType): { name: string; description: string } {
  const info = {
    nenhum: {
      name: 'Sem medicação',
      description: 'Acompanhamento nutricional padrão'
    },
    ozempic: {
      name: 'Ozempic (Semaglutida)',
      description: 'Reduz apetite, ajuste de calorias recomendado'
    },
    saxenda: {
      name: 'Saxenda (Liraglutida)',
      description: 'Controla fome, hidratação extra importante'
    },
    victoza: {
      name: 'Victoza (Liraglutida)',
      description: 'Similar ao Saxenda, foco em nutrição'
    },
    mounjaro: {
      name: 'Mounjaro (Tirzepatida)',
      description: 'Potente redutor de apetite, proteína essencial'
    },
    wegovy: {
      name: 'Wegovy (Semaglutida)',
      description: 'Dose específica para peso, refeições menores'
    },
    outro_glp1: {
      name: 'Outro GLP-1',
      description: 'Acompanhamento personalizado recomendado'
    }
  }

  return info[medication]
}
