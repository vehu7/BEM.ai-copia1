// Sistema inteligente de geração de cardápio semanal offline

interface UserProfile {
  name: string
  goal: string
  currentWeight: number
  height: number
  age: number
  gender: string
  activityLevel: string
  medication: string
  dietaryPreferences: string[]
  targetCalories: number
  targetProtein: number
  targetCarbs: number
  targetFat: number
  targetFiber: number
}

interface DayMeal {
  type: string
  time: string
  foods: string[]
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

interface WeekDay {
  day: string
  dayOfWeek: string
  meals: DayMeal[]
  totalNutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
}

interface DietRecommendation {
  title: string
  description: string
  weekDays: WeekDay[]
  weeklyAverage: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
  tips: string[]
  shoppingList: string[]
}

export function generateOfflineDietRecommendation(user: UserProfile): DietRecommendation {
  const isVegetarian = user.dietaryPreferences.includes('vegetariano')
  const isVegan = user.dietaryPreferences.includes('vegano')
  const isLowCarb = user.dietaryPreferences.includes('low_carb')
  const isDiabetic = user.dietaryPreferences.includes('diabetes')
  const isGoalPerder = user.goal === 'perder_peso'
  const isGoalGanhar = user.goal === 'ganhar_massa'
  const onMedication = user.medication && user.medication !== 'nenhum'

  // Título e descrição personalizados
  const goalText = isGoalPerder ? 'Perda de Peso' : isGoalGanhar ? 'Ganho de Massa' : 'Manutenção'
  const title = `Cardápio Semanal - ${goalText}`
  const description = onMedication
    ? `Plano nutricional personalizado para ${goalText.toLowerCase()} com ajustes para medicação GLP-1. Foco em proteínas e fibras.`
    : `Plano nutricional completo para ${goalText.toLowerCase()} com alimentos brasileiros acessíveis e nutritivos.`

  // Gerar dias da semana
  const daysNames = [
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
    'Domingo'
  ]

  const weekDays: WeekDay[] = daysNames.map((day, index) => {
    const meals = generateDayMeals(user, index, {
      isVegetarian,
      isVegan,
      isLowCarb,
      isDiabetic,
      isGoalPerder,
      isGoalGanhar,
      onMedication
    })

    const totalNutrition = meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fat: acc.fat + meal.fat,
        fiber: acc.fiber + meal.fiber
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    )

    return {
      day,
      dayOfWeek: `Dia ${index + 1}`,
      meals,
      totalNutrition
    }
  })

  // Calcular média semanal
  const weeklyAverage = {
    calories: Math.round(weekDays.reduce((sum, day) => sum + day.totalNutrition.calories, 0) / 7),
    protein: Math.round(weekDays.reduce((sum, day) => sum + day.totalNutrition.protein, 0) / 7),
    carbs: Math.round(weekDays.reduce((sum, day) => sum + day.totalNutrition.carbs, 0) / 7),
    fat: Math.round(weekDays.reduce((sum, day) => sum + day.totalNutrition.fat, 0) / 7),
    fiber: Math.round(weekDays.reduce((sum, day) => sum + day.totalNutrition.fiber, 0) / 7)
  }

  // Dicas personalizadas
  const tips = generatePersonalizedTips(user, { isVegetarian, isVegan, isLowCarb, isDiabetic, isGoalPerder, isGoalGanhar, onMedication })

  // Lista de compras
  const shoppingList = generateShoppingList(user, { isVegetarian, isVegan, isLowCarb, isDiabetic })

  return {
    title,
    description,
    weekDays,
    weeklyAverage,
    tips,
    shoppingList
  }
}

function generateDayMeals(
  user: UserProfile,
  dayIndex: number,
  preferences: any
): DayMeal[] {
  const targetCals = user.targetCalories
  const targetProtein = user.targetProtein
  const targetCarbs = user.targetCarbs
  const targetFat = user.targetFat
  const targetFiber = user.targetFiber

  // Distribuição calórica por refeição
  const distribution = preferences.onMedication
    ? { cafe: 0.20, lanche1: 0.10, almoco: 0.30, lanche2: 0.10, jantar: 0.25, ceia: 0.05 }
    : { cafe: 0.25, lanche1: 0.10, almoco: 0.35, lanche2: 0.10, jantar: 0.20, ceia: 0 }

  const meals: DayMeal[] = []

  // Café da Manhã
  const cafe = generateMealByType('Café da Manhã', '07:30', targetCals * distribution.cafe, targetProtein * distribution.cafe, targetCarbs * distribution.cafe, targetFat * distribution.cafe, targetFiber * distribution.cafe, preferences, dayIndex)
  meals.push(cafe)

  // Lanche da Manhã
  const lanche1 = generateMealByType('Lanche da Manhã', '10:00', targetCals * distribution.lanche1, targetProtein * distribution.lanche1, targetCarbs * distribution.lanche1, targetFat * distribution.lanche1, targetFiber * distribution.lanche1, preferences, dayIndex)
  meals.push(lanche1)

  // Almoço
  const almoco = generateMealByType('Almoço', '12:30', targetCals * distribution.almoco, targetProtein * distribution.almoco, targetCarbs * distribution.almoco, targetFat * distribution.almoco, targetFiber * distribution.almoco, preferences, dayIndex)
  meals.push(almoco)

  // Lanche da Tarde
  const lanche2 = generateMealByType('Lanche da Tarde', '15:30', targetCals * distribution.lanche2, targetProtein * distribution.lanche2, targetCarbs * distribution.lanche2, targetFat * distribution.lanche2, targetFiber * distribution.lanche2, preferences, dayIndex)
  meals.push(lanche2)

  // Jantar
  const jantar = generateMealByType('Jantar', '19:00', targetCals * distribution.jantar, targetProtein * distribution.jantar, targetCarbs * distribution.jantar, targetFat * distribution.jantar, targetFiber * distribution.jantar, preferences, dayIndex)
  meals.push(jantar)

  // Ceia (opcional)
  if (distribution.ceia > 0) {
    const ceia = generateMealByType('Ceia', '21:30', targetCals * distribution.ceia, targetProtein * distribution.ceia, targetCarbs * distribution.ceia, targetFat * distribution.ceia, targetFiber * distribution.ceia, preferences, dayIndex)
    meals.push(ceia)
  }

  return meals
}

function generateMealByType(
  type: string,
  time: string,
  cals: number,
  protein: number,
  carbs: number,
  fat: number,
  fiber: number,
  preferences: any,
  dayIndex: number
): DayMeal {
  let foods: string[] = []

  // Variação para cada dia da semana
  const variation = dayIndex % 3

  if (type === 'Café da Manhã') {
    if (preferences.isVegan) {
      foods = variation === 0
        ? ['Pão integral – 2 fatias (50g)', 'Pasta de amendoim – 1 colher de sopa (15g)', 'Banana prata – 1 unidade média (60g)', 'Leite de aveia – 1 copo (200ml)']
        : variation === 1
        ? ['Tapioca – 1 unidade (50g)', 'Coco ralado – 1 colher de sopa (10g)', 'Suco verde – 1 copo (200ml)', 'Castanha de caju – 4 unidades (15g)']
        : ['Aveia em flocos – 2 colheres de sopa (30g)', 'Leite de soja – 1 copo (200ml)', 'Mamão papaia – 3 colheres de sopa picado (210g)', 'Sementes de chia – 1 colher de chá (5g)']
    } else if (preferences.isLowCarb) {
      foods = variation === 0
        ? ['Omelete – 3 ovos (165g)', 'Queijo minas frescal – 1 fatia grande (35g)', 'Abacate – 3 colheres de sopa (45g)', 'Café com leite – 1 xícara (200ml)']
        : variation === 1
        ? ['Iogurte grego natural – 1 pote (170g)', 'Castanha do Pará – 2 unidades (10g)', 'Café – 1 xícara (50ml)']
        : ['Ovos mexidos – 3 unidades (165g)', 'Queijo prato – 2 fatias pequenas (23g)', 'Tomate – 3 fatias grandes (95g)', 'Café – 1 xícara (50ml)']
    } else {
      foods = variation === 0
        ? ['Pão integral – 2 fatias (50g)', 'Ovo cozido – 2 unidades inteiras (100g)', 'Queijo minas frescal – 1 fatia grande (35g)', 'Café com leite – 1 xícara (200ml)', 'Mamão – 1 fatia pequena (100g)']
        : variation === 1
        ? ['Tapioca – 1 unidade (50g)', 'Queijo branco light – 50g', 'Suco de laranja natural – 1/2 copo (120ml)', 'Banana prata – 1 unidade média (60g)']
        : ['Aveia em flocos – 2 colheres de sopa (30g)', 'Leite desnatado – 1 copo (240ml)', 'Morango – 5 unidades grandes (100g)', 'Mel de abelha – 1 colher de sopa (14g)']
    }
  } else if (type === 'Lanche da Manhã' || type === 'Lanche da Tarde') {
    if (preferences.isVegan) {
      foods = ['Maçã – 1 unidade pequena (80g)', 'Castanha de caju – 4 unidades (15g)']
    } else if (preferences.isLowCarb) {
      foods = ['Iogurte grego natural – 1 pote (170g)', 'Castanha do Pará – 2 unidades (10g)']
    } else {
      foods = ['Iogurte natural – 2/3 pote (133g)', 'Banana prata – 1 unidade pequena (35g)']
    }
  } else if (type === 'Almoço') {
    if (preferences.isVegan) {
      foods = variation === 0
        ? ['Arroz integral cozido – 1 colher de servir cheia (80g)', 'Feijão preto cozido – 1 concha média (138g)', 'Tofu grelhado – 4 pedaços grandes (140g)', 'Brócolis refogado – 5 colheres de sopa picado (56g)', 'Alface – 1 unidade pequena (120g)']
        : variation === 1
        ? ['Macarrão integral cozido – 3 colheres de sopa (80g)', 'Grão-de-bico cozido – 3 colheres de sopa (70g)', 'Abobrinha cozida – 3 colheres de sopa (80g)', 'Salada de folhas verdes – 1 prato raso (80g)']
        : ['Lentilha cozida – 3 colheres de servir (90g)', 'Vegetais assados – 2 conchas (150g)', 'Salada completa – 1 prato (120g)', 'Azeite de oliva – 1 colher de sopa (8ml)']
    } else if (preferences.isLowCarb) {
      foods = variation === 0
        ? ['Frango grelhado – 1 filé médio (150g)', 'Brócolis cozido – 5 ramos (128g)', 'Couve-flor cozida – 1 ramo grande (110g)', 'Alface – 1 unidade pequena (120g)']
        : variation === 1
        ? ['Carne moída – 3 colheres de sopa (75g)', 'Abobrinha cozida – 3 colheres de sopa (80g)', 'Salada de rúcula – 1 prato raso cheio (80g)', 'Azeite de oliva – 1 colher de sopa (8ml)']
        : ['Peixe assado – 1 filé grande (150g)', 'Legumes grelhados – 2 conchas (150g)', 'Rúcula – 1 prato raso cheio (80g)', 'Abacate – 3 colheres de sopa (45g)']
    } else {
      foods = variation === 0
        ? ['Arroz integral cozido – 1 colher de servir cheia (80g)', 'Feijão carioca – 1 concha média (138g)', 'Frango grelhado – 1 filé médio (100g)', 'Brócolis cozido – 5 ramos (128g)', 'Cenoura cozida – 4 colheres de sopa (100g)', 'Alface – 1 unidade pequena (120g)']
        : variation === 1
        ? ['Arroz integral cozido – 1 colher de servir cheia (80g)', 'Feijão carioca – 1 concha média (138g)', 'Peixe assado – 1 filé grande (150g)', 'Batata doce cozida – 1 fatia grande (92g)', 'Cenoura refogada – 2 colheres de sopa (45g)', 'Salada verde – 1 prato raso (80g)']
        : ['Macarrão integral cozido – 3 colheres de sopa (80g)', 'Carne assada – 1 fatia pequena (52g)', 'Molho de tomate – 3 colheres de sopa (45g)', 'Salada completa – 1 prato raso (120g)']
    }
  } else if (type === 'Jantar') {
    if (preferences.isVegan) {
      foods = ['Sopa de legumes – 1 concha (200g)', 'Pão integral – 1 fatia (25g)', 'Homus – 2 colheres de sopa (40g)', 'Alface – 1 unidade pequena (120g)']
    } else if (preferences.isLowCarb) {
      foods = ['Omelete – 2 ovos (110g)', 'Queijo minas frescal – 1 fatia grande (35g)', 'Alface – 1 unidade pequena (120g)', 'Azeite de oliva – 1 colher de sopa (8ml)']
    } else {
      foods = ['Sopa de frango com legumes – 1 concha (250g)', 'Pão integral – 1 fatia (25g)', 'Alface – 1 unidade pequena (120g)']
    }
  } else if (type === 'Ceia') {
    foods = preferences.isVegan
      ? ['Chá de camomila – 1 xícara (200ml)', 'Castanha do Pará – 2 unidades (10g)']
      : ['Iogurte natural – 2/3 pote (133g)', 'Mel de abelha – 1 colher de sopa (14g)']
  }

  return {
    type,
    time,
    foods,
    calories: Math.round(cals),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    fiber: Math.round(fiber)
  }
}

function generatePersonalizedTips(_user: UserProfile, preferences: any): string[] {
  const tips = []

  if (preferences.onMedication) {
    tips.push('Com medicação GLP-1: coma devagar, mastigue bem e faça refeições menores e mais frequentes')
    tips.push('Priorize proteínas e fibras em todas as refeições para melhor saciedade')
  }

  if (preferences.isGoalPerder) {
    tips.push('Beba 2-3L de água por dia para acelerar o metabolismo')
    tips.push('Evite pular refeições - mantenha o metabolismo ativo')
  } else if (preferences.isGoalGanhar) {
    tips.push('Coma a cada 3-4 horas para manter anabolismo')
    tips.push('Adicione um shake de whey protein pós-treino')
  }

  tips.push('Prepare refeições antecipadamente nos finais de semana')
  tips.push('Varie as verduras e legumes para obter diferentes nutrientes')
  tips.push('Consulte um nutricionista para ajustes personalizados')

  return tips
}

function generateShoppingList(_user: UserProfile, preferences: any): string[] {
  const items = []

  // Proteínas
  if (preferences.isVegan) {
    items.push('Tofu (500g)', 'Grão de bico (500g)', 'Lentilha (500g)', 'Feijão preto (1kg)')
  } else if (preferences.isVegetarian) {
    items.push('Ovos (dúzia)', 'Queijo branco (500g)', 'Iogurte grego (1L)', 'Feijão (1kg)')
  } else {
    items.push('Peito de frango (1kg)', 'Ovos (dúzia)', 'Carne magra (500g)', 'Peixe (500g)', 'Feijão (1kg)')
  }

  // Carboidratos
  if (!preferences.isLowCarb) {
    items.push('Arroz integral (1kg)', 'Batata doce (1kg)', 'Pão integral (1 pacote)', 'Aveia (500g)', 'Macarrão integral (500g)')
  }

  // Gorduras
  items.push('Azeite extra virgem (500ml)', 'Castanhas mistas (200g)', 'Abacate (3 unidades)')

  if (preferences.isVegan) {
    items.push('Pasta de amendoim (300g)', 'Sementes de chia (100g)')
  }

  // Vegetais e Frutas
  items.push('Brócolis (2 unidades)', 'Cenoura (1kg)', 'Tomate (1kg)', 'Alface (2 unidades)', 'Banana (dúzia)', 'Maçã (6 unidades)', 'Mamão (1 unidade)')

  // Laticínios/Alternativas
  if (preferences.isVegan) {
    items.push('Leite de aveia (1L)', 'Leite de soja (1L)')
  } else {
    items.push('Leite desnatado (2L)', 'Queijo minas (300g)', 'Iogurte natural (1L)')
  }

  // Temperos e Extras
  items.push('Alho', 'Cebola', 'Limão', 'Temperos naturais', 'Azeite', 'Vinagre')

  return items
}
