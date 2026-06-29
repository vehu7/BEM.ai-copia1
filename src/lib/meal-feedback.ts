// Sistema inteligente de feedback offline para refeições

interface UserProfile {
  goal: string
  targetCalories?: number
  targetProtein?: number
  targetCarbs?: number
  targetFat?: number
  medication?: string
  dietaryPreferences?: string[]
}

interface Meal {
  type: string
  foods: Array<{ name: string }>
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
}

export function generateMealFeedback(meal: Meal, user: UserProfile | null): string {
  if (!user) {
    return '👍 Refeição registrada! Continue acompanhando sua alimentação para alcançar seus objetivos!'
  }

  const isGoalPerder = user.goal === 'perder_peso'
  const isGoalGanhar = user.goal === 'ganhar_massa'
  const onMedication = user.medication && user.medication !== 'nenhum'

  // Análise de equilíbrio de macros
  const totalMacros = meal.totalProtein + meal.totalCarbs + meal.totalFat
  const proteinRatio = totalMacros > 0 ? (meal.totalProtein / totalMacros * 100) : 0
  const carbsRatio = totalMacros > 0 ? (meal.totalCarbs / totalMacros * 100) : 0
  const fatRatio = totalMacros > 0 ? (meal.totalFat / totalMacros * 100) : 0

  // Verificar se é uma refeição balanceada
  const isHighProtein = proteinRatio > 30
  const isLowProtein = proteinRatio < 15
  const isHighCarb = carbsRatio > 60
  const isHighFat = fatRatio > 40

  // Feedbacks específicos baseados no perfil e análise
  const feedbacks: string[] = []

  // Análise para medicação GLP-1
  if (onMedication) {
    if (isHighProtein) {
      feedbacks.push('💊 Ótimo! Proteína alta ajuda com a medicação. Continue assim!')
    } else if (isLowProtein) {
      feedbacks.push('💊 Com a medicação, tente aumentar a proteína nesta refeição!')
    }
    if (meal.totalCalories < 200 && meal.type !== 'lanche_manha' && meal.type !== 'lanche_tarde' && meal.type !== 'ceia') {
      feedbacks.push('💊 Refeição muito leve. Com medicação, mantenha nutrição adequada!')
    }
  }

  // Análise para perda de peso
  if (isGoalPerder) {
    if (meal.totalCalories > 800 && (meal.type === 'cafe' || meal.type === 'jantar')) {
      feedbacks.push('📉 Refeição calórica! Considere reduzir porções ou trocar por opções mais leves.')
    } else if (isHighProtein && meal.totalCalories < 600) {
      feedbacks.push('🌟 Perfeito! Alta proteína e calorias controladas. Você está no caminho certo!')
    } else if (isLowProtein) {
      feedbacks.push('🥩 Adicione mais proteína para aumentar saciedade e preservar músculos!')
    } else if (isHighCarb && meal.type === 'jantar') {
      feedbacks.push('🍚 Muitos carboidratos à noite. Que tal focar em proteínas e vegetais?')
    }
  }

  // Análise para ganho de massa
  if (isGoalGanhar) {
    if (meal.totalCalories < 400 && (meal.type === 'almoco' || meal.type === 'jantar')) {
      feedbacks.push('💪 Para ganhar massa, aumente as porções! Você precisa de mais calorias.')
    } else if (isHighProtein) {
      feedbacks.push('🏆 Excelente! Proteína alta é fundamental para ganhar massa muscular!')
    } else if (isLowProtein) {
      feedbacks.push('🥚 Adicione mais proteína! É essencial para construir músculos.')
    } else if (meal.totalCalories > 600 && isHighProtein) {
      feedbacks.push('💯 Perfeito! Refeição completa com calorias e proteínas adequadas!')
    }
  }

  // Análises gerais de equilíbrio
  if (feedbacks.length === 0) {
    if (isHighProtein && meal.totalCalories >= 300 && meal.totalCalories <= 700) {
      feedbacks.push('✅ Refeição equilibrada! Proteína adequada e calorias controladas!')
    } else if (isHighCarb && isLowProtein) {
      feedbacks.push('⚖️ Equilibre melhor! Adicione proteína para balancear os carboidratos.')
    } else if (isHighFat) {
      feedbacks.push('🥑 Gorduras OK, mas cuidado com o excesso. Equilibre com vegetais!')
    } else if (meal.totalCalories < 200 && (meal.type === 'almoco' || meal.type === 'jantar')) {
      feedbacks.push('🍽️ Refeição leve demais! Adicione mais alimentos nutritivos.')
    } else {
      feedbacks.push('👍 Refeição registrada! Continue acompanhando para alcançar suas metas!')
    }
  }

  // Dicas adicionais baseadas no horário
  const now = new Date()
  const hour = now.getHours()

  if (meal.type === 'cafe' && hour < 9 && isHighProtein) {
    feedbacks.push('🌅 Café da manhã proteico no horário certo! Ótimo começo de dia!')
  }

  if (meal.type === 'jantar' && hour >= 21 && meal.totalCalories > 600) {
    feedbacks.push('🌙 Jantar tarde e pesado pode atrapalhar o sono. Tente jantar mais cedo!')
  }

  // Retornar o primeiro feedback relevante (máximo 2 linhas)
  return feedbacks[0] || '👍 Refeição registrada com sucesso! Continue assim!'
}

export function generateImageAnalysisFallback(_mealType: string): string {
  const tips = [
    `📸 **Análise de imagem indisponível no momento**\n\nVocê pode adicionar os alimentos manualmente:\n1. Use a busca para encontrar alimentos\n2. Adicione as quantidades aproximadas\n3. O app calculará os nutrientes automaticamente\n\nRegistrar manualmente é rápido e preciso! 💪`,

    `📱 **Sistema offline ativado**\n\nPara registrar sua refeição:\n✅ Use o campo de busca acima\n✅ Selecione os alimentos da lista\n✅ Ajuste as porções conforme necessário\n\nTemos centenas de alimentos brasileiros cadastrados! 🇧🇷`,

    `🔍 **Dica rápida**\n\nDigite o nome do alimento (ex: "arroz", "frango", "feijão") e selecione da lista. As informações nutricionais são precisas e baseadas em dados oficiais!\n\nÉ mais confiável que análise de foto! 📊`
  ]

  return tips[Math.floor(Math.random() * tips.length)]
}

export function generateBarcodeProductFallback(barcode: string): {
  name: string
  brand: string
  serving: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
} {
  // Gerar sugestão baseada no tipo de código de barras
  const isSnack = barcode.startsWith('789') || barcode.startsWith('790')
  const isDairy = barcode.startsWith('779') || barcode.startsWith('780')
  const isBeverage = barcode.startsWith('750') || barcode.startsWith('751')

  if (isSnack) {
    return {
      name: 'Produto não encontrado no banco de dados',
      brand: 'Marca desconhecida',
      serving: '100g',
      calories: 400,
      protein: 5,
      carbs: 60,
      fat: 15,
      fiber: 3
    }
  }

  if (isDairy) {
    return {
      name: 'Produto lácteo não identificado',
      brand: 'Marca desconhecida',
      serving: '200ml',
      calories: 150,
      protein: 8,
      carbs: 12,
      fat: 7,
      fiber: 0
    }
  }

  if (isBeverage) {
    return {
      name: 'Bebida não identificada',
      brand: 'Marca desconhecida',
      serving: '350ml',
      calories: 140,
      protein: 0,
      carbs: 35,
      fat: 0,
      fiber: 0
    }
  }

  return {
    name: 'Produto não encontrado',
    brand: 'Use a busca manual',
    serving: '100g',
    calories: 250,
    protein: 10,
    carbs: 35,
    fat: 8,
    fiber: 2
  }
}
