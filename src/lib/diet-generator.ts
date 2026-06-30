// Geração de cardápio semanal offline — nutricionista simulado com diferenciação real por objetivo

interface UserProfile {
  name: string
  goal: string
  currentWeight: number
  height: number
  age: number
  gender: string
  activityLevel: string
  medication: string
  hadBariatricSurgery?: boolean
  dietaryPreferences: string[]
  excludedFoods?: string[]
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

interface Flags {
  isVegetarian: boolean
  isVegan: boolean
  isLowCarb: boolean
  isDiabetic: boolean
  isGlutenFree: boolean
  isLactoseFree: boolean
  isGoalPerder: boolean
  isGoalGanhar: boolean
  onMedication: boolean
  isBariatric: boolean
  excludedFoods: string[]
}

export function generateOfflineDietRecommendation(user: UserProfile): DietRecommendation {
  const flags: Flags = {
    isVegetarian: user.dietaryPreferences.includes('vegetariano'),
    isVegan: user.dietaryPreferences.includes('vegano'),
    isLowCarb: user.dietaryPreferences.includes('low_carb'),
    isDiabetic: user.dietaryPreferences.includes('diabetes'),
    isGlutenFree: user.dietaryPreferences.includes('sem_gluten'),
    isLactoseFree: user.dietaryPreferences.includes('sem_lactose'),
    isGoalPerder: user.goal === 'perder_peso',
    isGoalGanhar: user.goal === 'ganhar_massa',
    onMedication: !!(user.medication && user.medication !== 'nenhum'),
    isBariatric: !!user.hadBariatricSurgery,
    excludedFoods: user.excludedFoods ?? [],
  }

  const goalText = flags.isGoalPerder ? 'Perda de Peso' : flags.isGoalGanhar ? 'Ganho de Massa' : 'Manutenção e Saúde'
  const title = `Cardápio Semanal — ${goalText}`

  const clinicalContext = flags.isBariatric
    ? 'Plano pós-cirurgia bariátrica: porções pequenas, textura macia, refeições fracionadas, proteína ≥1,5g/kg.'
    : flags.onMedication
    ? 'Plano com ajustes clínicos para GLP-1: refeições menores e mais frequentes, foco em proteína (≥1,8g/kg) e fibras.'
    : ''

  const restrictionContext = [
    flags.isVegan && 'alimentação vegana',
    flags.isVegetarian && !flags.isVegan && 'alimentação vegetariana (ovos e laticínios permitidos)',
    flags.isGlutenFree && 'sem glúten',
    flags.isLactoseFree && 'sem lactose',
    flags.isLowCarb && 'low carb',
    flags.isDiabetic && 'adaptado para diabetes',
  ].filter(Boolean).join(', ')

  const description = [clinicalContext, `Plano nutricional baseado em comida brasileira do dia a dia para ${goalText.toLowerCase()}.`, restrictionContext && `Restrições respeitadas: ${restrictionContext}.`]
    .filter(Boolean).join(' ')

  const daysNames = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo']

  const weekDays: WeekDay[] = daysNames.map((day, index) => {
    const meals = generateDayMeals(user, index, flags)
    const totalNutrition = meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fat: acc.fat + meal.fat,
        fiber: acc.fiber + meal.fiber,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    )
    return { day, dayOfWeek: `Dia ${index + 1}`, meals, totalNutrition }
  })

  const weeklyAverage = {
    calories: Math.round(weekDays.reduce((sum, d) => sum + d.totalNutrition.calories, 0) / 7),
    protein: Math.round(weekDays.reduce((sum, d) => sum + d.totalNutrition.protein, 0) / 7),
    carbs: Math.round(weekDays.reduce((sum, d) => sum + d.totalNutrition.carbs, 0) / 7),
    fat: Math.round(weekDays.reduce((sum, d) => sum + d.totalNutrition.fat, 0) / 7),
    fiber: Math.round(weekDays.reduce((sum, d) => sum + d.totalNutrition.fiber, 0) / 7),
  }

  const tips = generatePersonalizedTips(user, flags)
  const shoppingList = generateShoppingList(user, flags)

  return { title, description, weekDays, weeklyAverage, tips, shoppingList }
}

// Substitui alimentos proibidos por restrições de glúten, lactose ou lista de excluídos.
// Chamado DEPOIS da seleção por objetivo para não duplicar a lógica de base.
function applyRestrictions(foods: string[], flags: Flags): string[] {
  let result = foods.map(item => {
    const lower = item.toLowerCase()

    if (flags.isGlutenFree) {
      if (/pão integral|pão de forma|pãozinho/.test(lower))
        return 'Tapioca – 1 unidade (50g)'
      if (/macarrão/.test(lower))
        return 'Arroz integral cozido – 3 col. sopa (60g)'
      if (/cuscuz nordestino/.test(lower))
        return 'Arroz branco cozido – 3 col. sopa (60g)'
      if (/aveia em flocos/.test(lower))
        return 'Quinoa cozida – 3 col. sopa (45g)'
    }

    if (flags.isLactoseFree) {
      if (/queijo minas frescal|queijo branco|queijo prato|queijo parmesão/.test(lower))
        return 'Peito de peru fatiado – 2 fatias (40g)'
      if (/leite integral|leite desnatado|leite com/.test(lower))
        return 'Leite de aveia – 1 copo (200ml)'
      if (/leite de soja/.test(lower))
        return item // já é sem lactose
      if (/iogurte grego natural|iogurte natural desnatado|iogurte natural/.test(lower))
        return 'Iogurte sem lactose – 1 pote (170g)'
    }

    return item
  })

  // Remove alimentos explicitamente excluídos pelo usuário
  if (flags.excludedFoods.length > 0) {
    result = result.filter(item =>
      !flags.excludedFoods.some(ex =>
        item.toLowerCase().includes(ex.toLowerCase())
      )
    )
  }

  return result
}

function generateDayMeals(user: UserProfile, dayIndex: number, flags: Flags): DayMeal[] {
  const { targetCalories, targetProtein, targetCarbs, targetFat, targetFiber } = user

  // Distribuição calórica por contexto clínico
  let distribution: Record<string, number>
  if (flags.onMedication || flags.isBariatric) {
    distribution = { cafe: 0.18, lanche1: 0.10, almoco: 0.28, lanche2: 0.12, jantar: 0.24, ceia: 0.08 }
  } else if (flags.isGoalGanhar) {
    distribution = { cafe: 0.25, lanche1: 0.12, almoco: 0.35, lanche2: 0.13, jantar: 0.25, ceia: 0 }
  } else if (flags.isGoalPerder) {
    distribution = { cafe: 0.22, lanche1: 0.08, almoco: 0.38, lanche2: 0.08, jantar: 0.24, ceia: 0 }
  } else {
    distribution = { cafe: 0.25, lanche1: 0.10, almoco: 0.35, lanche2: 0.10, jantar: 0.20, ceia: 0 }
  }

  const meals: DayMeal[] = []
  const mk = (type: string, time: string, frac: number) =>
    generateMealByType(type, time,
      targetCalories * frac, targetProtein * frac, targetCarbs * frac, targetFat * frac, targetFiber * frac,
      flags, dayIndex)

  meals.push(mk('Café da Manhã', '07:30', distribution.cafe))
  if (distribution.lanche1 > 0) meals.push(mk('Lanche da Manhã', '10:00', distribution.lanche1))
  meals.push(mk('Almoço', '12:30', distribution.almoco))
  if (distribution.lanche2 > 0) meals.push(mk('Lanche da Tarde', '15:30', distribution.lanche2))
  meals.push(mk('Jantar', '19:00', distribution.jantar))
  if (distribution.ceia > 0) meals.push(mk('Ceia', '21:30', distribution.ceia))

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
  flags: Flags,
  dayIndex: number
): DayMeal {
  let foods: string[] = []
  const v = dayIndex % 3  // variação 0, 1, 2

  // ── CAFÉ DA MANHÃ ────────────────────────────────────────────────────────────
  if (type === 'Café da Manhã') {
    if (flags.isVegan) {
      foods = [
        ['Pão integral – 2 fatias (50g)', 'Pasta de amendoim – 1 col. sopa (15g)', 'Banana prata – 1 unidade (60g)', 'Leite de aveia – 1 copo (200ml)'],
        ['Tapioca – 1 unidade (50g)', 'Homus vegano – 2 col. sopa (40g)', 'Mamão papaia – 1 fatia (150g)', 'Chá verde – 1 xícara (200ml)'],
        ['Aveia em flocos – 4 col. sopa (40g)', 'Leite de soja – 1 copo (240ml)', 'Morango – 8 unidades (100g)', 'Sementes de chia – 1 col. chá (8g)'],
      ][v]
    } else if (flags.isVegetarian) {
      // Ovos e laticínios permitidos, sem carnes
      if (flags.isGoalGanhar) {
        foods = [
          ['Pão integral – 3 fatias (75g)', 'Ovos mexidos – 3 unidades (165g)', 'Queijo minas frescal – 1 fatia grande (40g)', 'Banana prata – 1 unidade (80g)', 'Café com leite – 1 copo (250ml)'],
          ['Aveia em flocos – 5 col. sopa (50g)', 'Leite integral – 1 copo (240ml)', 'Ovo cozido – 2 unidades (100g)', 'Mel – 1 col. sopa (15g)', 'Mamão – 1 fatia (150g)'],
          ['Tapioca recheada – 1 grande (70g)', 'Queijo branco – 2 fatias (50g)', 'Ovo frito no azeite – 2 unidades (110g)', 'Banana – 1 unidade (80g)', 'Café com leite – 1 xícara (200ml)'],
        ][v]
      } else if (flags.isGoalPerder) {
        foods = [
          ['Ovo cozido – 2 unidades (100g)', 'Pão integral – 1 fatia (25g)', 'Queijo minas light – 1 fatia (30g)', 'Mamão papaia – 1 fatia pequena (120g)', 'Café com leite desnatado – 1 xícara (200ml)'],
          ['Iogurte natural desnatado – 1 pote (170g)', 'Aveia em flocos – 2 col. sopa (20g)', 'Morango – 6 unidades (90g)', 'Canela em pó – 1 pitada'],
          ['Omelete de 2 ovos – (110g)', 'Tapioca – 1 unidade pequena (30g)', 'Queijo branco light – 1 fatia (30g)', 'Chá verde – 1 xícara (200ml)', 'Kiwi – 1 unidade (70g)'],
        ][v]
      } else {
        foods = [
          ['Pão integral – 2 fatias (50g)', 'Ovo cozido – 2 unidades (100g)', 'Queijo minas frescal – 1 fatia (35g)', 'Café com leite – 1 xícara (200ml)', 'Mamão – 1 fatia (100g)'],
          ['Tapioca – 1 unidade (50g)', 'Queijo branco – 1 fatia (40g)', 'Ovo cozido – 1 unidade (50g)', 'Banana prata – 1 unidade (60g)'],
          ['Aveia em flocos – 3 col. sopa (30g)', 'Leite desnatado – 1 copo (240ml)', 'Ovo cozido – 1 unidade (50g)', 'Morango – 5 unidades (80g)'],
        ][v]
      }
    } else if (flags.isLowCarb) {
      foods = [
        ['Omelete – 3 ovos (165g)', 'Queijo minas frescal – 1 fatia (35g)', 'Abacate – 3 col. sopa (45g)', 'Café preto – 1 xícara (50ml)'],
        ['Ovos mexidos – 3 unidades (165g)', 'Queijo prato – 2 fatias (30g)', 'Tomate cereja – 6 unidades (90g)', 'Café com leite desnatado – 1 xícara (200ml)'],
        ['Iogurte grego natural – 1 pote (170g)', 'Castanha do Pará – 3 unidades (15g)', 'Morangos – 5 unidades (80g)', 'Café preto – 1 xícara (50ml)'],
      ][v]
    } else if (flags.isGoalGanhar) {
      foods = [
        ['Pão integral – 3 fatias (75g)', 'Ovos mexidos – 3 unidades (165g)', 'Queijo minas frescal – 1 fatia grande (40g)', 'Banana prata – 1 unidade (80g)', 'Café com leite – 1 copo (250ml)'],
        ['Aveia em flocos – 5 col. sopa (50g)', 'Leite integral – 1 copo (240ml)', 'Ovo cozido – 2 unidades (100g)', 'Mel – 1 col. sopa (15g)', 'Mamão – 1 fatia (150g)'],
        ['Tapioca recheada – 1 grande (70g)', 'Queijo branco – 2 fatias (50g)', 'Ovo frito no azeite – 2 unidades (110g)', 'Suco de laranja natural – 1 copo (250ml)'],
      ][v]
    } else if (flags.isGoalPerder) {
      foods = [
        ['Ovo cozido – 2 unidades (100g)', 'Pão integral – 1 fatia (25g)', 'Queijo minas light – 1 fatia (30g)', 'Mamão papaia – 1 fatia pequena (120g)', 'Café com leite desnatado – 1 xícara (200ml)'],
        ['Iogurte natural desnatado – 1 pote (170g)', 'Aveia em flocos – 2 col. sopa (20g)', 'Morango – 6 unidades (90g)', 'Canela em pó – 1 pitada'],
        ['Omelete de 2 ovos – (110g)', 'Tapioca – 1 unidade pequena (30g)', 'Queijo branco light – 1 fatia (30g)', 'Chá verde – 1 xícara (200ml)', 'Kiwi – 1 unidade (70g)'],
      ][v]
    } else {
      foods = [
        ['Pão integral – 2 fatias (50g)', 'Ovo cozido – 2 unidades (100g)', 'Queijo minas frescal – 1 fatia (35g)', 'Café com leite – 1 xícara (200ml)', 'Mamão – 1 fatia (100g)'],
        ['Tapioca – 1 unidade (50g)', 'Queijo branco – 1 fatia (40g)', 'Suco de laranja natural – 1/2 copo (120ml)', 'Banana prata – 1 unidade (60g)'],
        ['Aveia em flocos – 3 col. sopa (30g)', 'Leite desnatado – 1 copo (240ml)', 'Morango – 5 unidades (80g)', 'Mel – 1 col. chá (7g)'],
      ][v]
    }

  // ── LANCHES ─────────────────────────────────────────────────────────────────
  } else if (type === 'Lanche da Manhã' || type === 'Lanche da Tarde') {
    if (flags.isVegan) {
      foods = [
        ['Maçã – 1 unidade (130g)', 'Castanha de caju – 5 unidades (15g)'],
        ['Banana prata – 1 unidade (80g)', 'Amendoim torrado sem sal – 1 punhado (20g)'],
        ['Frutas mistas – 1 xícara (150g)', 'Sementes de girassol – 1 col. sopa (15g)'],
      ][v]
    } else if (flags.isVegetarian) {
      if (flags.isGoalGanhar) {
        foods = [
          ['Iogurte natural – 1 pote (170g)', 'Aveia – 2 col. sopa (20g)', 'Mel – 1 col. chá (7g)', 'Banana – 1 unidade (80g)'],
          ['Pão integral – 1 fatia (25g)', 'Queijo branco – 1 fatia (40g)', 'Banana – 1 unidade (80g)'],
          ['Ovo cozido – 2 unidades (100g)', 'Maçã – 1 unidade (130g)'],
        ][v]
      } else if (flags.isGoalPerder) {
        foods = [
          ['Iogurte natural desnatado – 1/2 pote (80g)', 'Morango – 5 unidades (75g)'],
          ['Kiwi – 1 unidade (80g)', 'Castanha do Pará – 2 unidades (10g)'],
          ['Cenoura baby – 8 unidades (80g)', 'Queijo minas light – 1 fatia (30g)'],
        ][v]
      } else {
        foods = [
          ['Iogurte natural – 1 pote (170g)', 'Banana prata – 1 unidade pequena (50g)'],
          ['Maçã – 1 unidade (130g)', 'Castanha de caju – 4 unidades (12g)'],
          ['Frutas da estação – 1 porção (150g)', 'Queijo minas frescal – 1 fatia (30g)'],
        ][v]
      }
    } else if (flags.isLowCarb) {
      foods = [
        ['Iogurte grego natural – 1 pote (170g)', 'Castanha do Pará – 3 unidades (15g)'],
        ['Queijo minas frescal – 2 fatias (60g)', 'Pepino fatiado – 1/2 unidade (80g)'],
        ['Ovo cozido – 1 unidade (50g)', 'Azeite de oliva – 1 fio (5ml)', 'Cenoura baby – 5 unidades (60g)'],
      ][v]
    } else if (flags.isGoalGanhar) {
      foods = [
        ['Banana prata – 1 unidade grande (100g)', 'Pasta de amendoim – 1 col. sopa cheia (20g)', 'Leite integral – 1 copo (240ml)'],
        ['Pão integral – 1 fatia (25g)', 'Queijo branco – 1 fatia (40g)', 'Banana – 1 unidade (80g)'],
        ['Iogurte natural – 1 pote (170g)', 'Aveia – 2 col. sopa (20g)', 'Mel – 1 col. chá (7g)', 'Morango – 4 unidades (60g)'],
      ][v]
    } else if (flags.isGoalPerder) {
      foods = [
        ['Maçã – 1 unidade (130g)', 'Iogurte natural desnatado – 1/2 pote (80g)'],
        ['Cenoura baby – 8 unidades (80g)', 'Homus – 1 col. sopa (20g)'],
        ['Kiwi – 1 unidade (80g)', 'Castanha do Pará – 2 unidades (10g)'],
      ][v]
    } else {
      foods = [
        ['Iogurte natural – 1 pote (170g)', 'Banana prata – 1 unidade pequena (50g)'],
        ['Maçã – 1 unidade (130g)', 'Castanha de caju – 4 unidades (12g)'],
        ['Frutas da estação – 1 porção (150g)'],
      ][v]
    }

  // ── ALMOÇO ──────────────────────────────────────────────────────────────────
  } else if (type === 'Almoço') {
    if (flags.isVegan) {
      foods = [
        ['Arroz integral cozido – 4 col. sopa (80g)', 'Feijão preto cozido – 1 concha média (138g)', 'Tofu grelhado – 1 fatia grande (140g)', 'Brócolis refogado – 5 ramos (70g)', 'Alface americana – 4 folhas (80g)', 'Azeite – 1 col. chá (4ml)'],
        ['Macarrão integral cozido – 3 col. sopa (80g)', 'Grão-de-bico cozido – 3 col. sopa (90g)', 'Abobrinha refogada – 3 col. sopa (80g)', 'Tomate – 2 unidades médias (160g)', 'Alface – 4 folhas (60g)'],
        ['Lentilha cozida – 2 conchas (120g)', 'Arroz integral – 3 col. sopa (60g)', 'Abóbora assada – 2 col. sopa (80g)', 'Couve refogada – 4 folhas (60g)', 'Vinagrete – 2 col. sopa (50g)'],
      ][v]
    } else if (flags.isVegetarian) {
      // Sem carnes; ovos e laticínios permitidos
      if (flags.isGoalGanhar) {
        foods = [
          ['Arroz integral – 5 col. sopa (100g)', 'Feijão carioca – 1 concha cheia (150g)', 'Ovo cozido – 3 unidades (150g)', 'Queijo branco – 1 fatia (40g)', 'Brócolis – 1 xícara (100g)', 'Azeite – 1 col. sopa (8ml)'],
          ['Macarrão integral – 4 col. sopa (100g)', 'Lentilha cozida – 2 conchas (120g)', 'Ovo frito no azeite – 2 unidades (110g)', 'Salada de folhas – 1 prato (100g)'],
          ['Arroz branco – 5 col. sopa (100g)', 'Feijão preto – 1 concha cheia (150g)', 'Tofu grelhado – 1 fatia grande (140g)', 'Batata-doce cozida – 1 fatia (80g)', 'Cenoura – 3 col. sopa (60g)'],
        ][v]
      } else if (flags.isGoalPerder) {
        foods = [
          ['Arroz integral – 3 col. sopa (60g)', 'Feijão carioca – 0,5 concha (70g)', 'Ovo cozido – 2 unidades (100g)', 'Brócolis cozido – 1 xícara (120g)', 'Alface – 4 folhas (80g)', 'Azeite – 1 col. chá (4ml)'],
          ['Omelete de 3 ovos – (165g)', 'Arroz integral – 2 col. sopa (40g)', 'Feijão verde – 1 concha pequena (80g)', 'Couve refogada – 4 folhas (60g)', 'Tomate – 1 unidade (130g)'],
          ['Tofu grelhado – 1 fatia (120g)', 'Arroz integral – 2 col. sopa (40g)', 'Feijão preto – 0,5 concha (70g)', 'Salada de rúcula e tomate – 1 prato (100g)', 'Azeite – 1 col. chá (4ml)'],
        ][v]
      } else {
        foods = [
          ['Arroz integral – 4 col. sopa (80g)', 'Feijão carioca – 1 concha (138g)', 'Ovo cozido – 2 unidades (100g)', 'Brócolis cozido – 5 ramos (100g)', 'Cenoura – 3 col. sopa (60g)', 'Alface – 4 folhas (80g)'],
          ['Arroz branco – 4 col. sopa (80g)', 'Feijão preto – 1 concha (138g)', 'Tofu grelhado – 1 fatia (120g)', 'Abobrinha refogada – 3 col. sopa (80g)', 'Salada verde – 1 prato (80g)'],
          ['Macarrão integral – 3 col. sopa (80g)', 'Grão-de-bico – 2 col. sopa (60g)', 'Ovo cozido – 2 unidades (100g)', 'Molho de tomate – 3 col. sopa (60g)', 'Salada completa – 1 prato (100g)'],
        ][v]
      }
    } else if (flags.isLowCarb) {
      foods = [
        ['Frango grelhado – 1 filé médio (150g)', 'Brócolis cozido no vapor – 1 xícara (128g)', 'Couve-flor – 1 xícara (110g)', 'Alface crespa – 4 folhas (80g)', 'Azeite – 1 col. sopa (8ml)'],
        ['Carne moída refogada – 3 col. sopa (100g)', 'Abobrinha grelhada – 3 col. sopa (90g)', 'Rúcula – 1 prato raso (80g)', 'Tomate – 1 unidade (130g)', 'Azeite – 1 col. sopa (8ml)'],
        ['Filé de tilápia grelhado – 1 filé grande (180g)', 'Legumes salteados – 2 conchas (150g)', 'Alface americana – 4 folhas (80g)', 'Abacate – 3 col. sopa (50g)', 'Limão – suco de 1 unidade'],
      ][v]
    } else if (flags.isGoalGanhar) {
      foods = [
        ['Arroz branco cozido – 6 col. sopa (120g)', 'Feijão carioca – 1 concha cheia (150g)', 'Frango grelhado – 1 filé grande (200g)', 'Batata-doce cozida – 1 fatia grande (100g)', 'Salada verde – 1 prato (80g)', 'Azeite – 1 col. sopa (8ml)'],
        ['Arroz integral – 5 col. sopa (100g)', 'Feijão preto – 1 concha cheia (150g)', 'Carne bovina magra grelhada – 1 bife grande (180g)', 'Mandioca cozida – 1 pedaço (100g)', 'Brócolis – 1 xícara (100g)', 'Vinagrete – 3 col. sopa (60g)'],
        ['Macarrão integral – 4 col. sopa (100g)', 'Carne moída com molho de tomate – 4 col. sopa (150g)', 'Queijo parmesão – 1 col. sopa (10g)', 'Salada de folhas – 1 prato (100g)', 'Ovo cozido – 1 unidade (50g)'],
      ][v]
    } else if (flags.isGoalPerder) {
      foods = [
        ['Arroz integral cozido – 3 col. sopa (60g)', 'Feijão carioca – 0,5 concha (70g)', 'Frango grelhado – 1 filé médio (130g)', 'Brócolis cozido – 1 xícara (120g)', 'Cenoura – 4 col. sopa (80g)', 'Alface – 4 folhas (80g)', 'Azeite – 1 col. chá (4ml)'],
        ['Peixe assado (tilápia) – 1 filé (150g)', 'Arroz integral – 2 col. sopa (40g)', 'Feijão verde – 1 concha pequena (80g)', 'Couve refogada – 4 folhas (60g)', 'Tomate – 1 unidade (130g)', 'Pepino – 1/2 unidade (80g)'],
        ['Carne bovina magra grelhada – 1 bife médio (130g)', 'Batata-doce cozida – 1 fatia pequena (60g)', 'Feijão preto – 0,5 concha (70g)', 'Salada de rúcula e tomate – 1 prato (100g)', 'Limão – suco de 1 unidade', 'Azeite – 1 col. chá (4ml)'],
      ][v]
    } else {
      foods = [
        ['Arroz integral cozido – 4 col. sopa (80g)', 'Feijão carioca – 1 concha média (138g)', 'Frango grelhado – 1 filé médio (130g)', 'Brócolis cozido – 5 ramos (100g)', 'Cenoura cozida – 3 col. sopa (80g)', 'Alface – 4 folhas (80g)'],
        ['Arroz branco – 4 col. sopa (80g)', 'Feijão preto – 1 concha (138g)', 'Peixe assado – 1 filé (150g)', 'Batata-doce – 1 fatia (70g)', 'Cenoura – 3 col. sopa (60g)', 'Salada verde – 1 prato (80g)'],
        ['Macarrão integral – 3 col. sopa (80g)', 'Carne bovina magra – 1 bife pequeno (80g)', 'Molho de tomate – 3 col. sopa (60g)', 'Salada completa – 1 prato (120g)', 'Azeite – 1 col. chá (4ml)'],
      ][v]
    }

  // ── JANTAR ──────────────────────────────────────────────────────────────────
  } else if (type === 'Jantar') {
    if (flags.isVegan) {
      foods = [
        ['Sopa de legumes com lentilha – 1 tigela (250g)', 'Pão integral – 1 fatia (25g)', 'Alface – 4 folhas (60g)'],
        ['Arroz integral – 3 col. sopa (60g)', 'Feijão preto – 0,5 concha (70g)', 'Tofu grelhado – 1 fatia (100g)', 'Abobrinha refogada – 2 col. sopa (60g)'],
        ['Cuscuz nordestino – 1 rodela (80g)', 'Grão-de-bico refogado – 2 col. sopa (60g)', 'Cenoura cozida – 3 col. sopa (60g)', 'Couve refogada – 3 folhas (45g)'],
      ][v]
    } else if (flags.isVegetarian) {
      if (flags.isGoalGanhar) {
        foods = [
          ['Arroz integral – 4 col. sopa (80g)', 'Ovo cozido – 2 unidades (100g)', 'Feijão preto – 0,5 concha (70g)', 'Salada verde – 1 prato (80g)', 'Queijo branco – 1 fatia (35g)', 'Azeite – 1 col. sopa (8ml)'],
          ['Macarrão integral – 3 col. sopa (80g)', 'Omelete de 2 ovos – (110g)', 'Molho de tomate – 3 col. sopa (60g)', 'Rúcula com tomate – 1 prato (100g)'],
          ['Batata-doce cozida – 1 unidade (120g)', 'Tofu grelhado – 1 fatia (120g)', 'Brócolis no vapor – 1 xícara (100g)', 'Queijo prato – 1 fatia (25g)', 'Azeite – 1 col. sopa (8ml)'],
        ][v]
      } else if (flags.isGoalPerder) {
        foods = [
          ['Sopa de legumes com ovo – 1 tigela (250g)', 'Alface – 3 folhas (50g)'],
          ['Omelete de 2 ovos – (110g)', 'Queijo branco light – 1 fatia (30g)', 'Salada de folhas – 1 prato (80g)', 'Tomate – 1 unidade (130g)', 'Azeite – 1 col. chá (4ml)'],
          ['Tofu grelhado – 1 fatia (100g)', 'Cenoura cozida – 3 col. sopa (80g)', 'Couve refogada – 3 folhas (45g)', 'Limão – suco de 1 unidade'],
        ][v]
      } else {
        foods = [
          ['Omelete de 2 ovos – (110g)', 'Queijo frescal – 1 fatia (35g)', 'Salada verde – 1 prato (80g)', 'Tomate – 1 unidade (130g)'],
          ['Arroz integral – 3 col. sopa (60g)', 'Tofu grelhado – 1 fatia (100g)', 'Abobrinha – 3 col. sopa (80g)', 'Salada de alface – 4 folhas (60g)'],
          ['Sopa de legumes com lentilha – 1 tigela (250g)', 'Pão integral – 1 fatia (25g)'],
        ][v]
      }
    } else if (flags.isLowCarb) {
      foods = [
        ['Omelete de 3 ovos – (165g)', 'Queijo minas frescal – 1 fatia (35g)', 'Alface – 4 folhas (80g)', 'Azeite – 1 col. chá (4ml)'],
        ['Frango desfiado – 1 porção (120g)', 'Abobrinha grelhada – 3 col. sopa (80g)', 'Rúcula – 1 prato (80g)', 'Tomate – 1 unidade (130g)'],
        ['Peixe grelhado – 1 filé (150g)', 'Couve-flor no vapor – 1 xícara (120g)', 'Espinafre refogado – 3 col. sopa (80g)', 'Abacate – 2 col. sopa (30g)'],
      ][v]
    } else if (flags.isGoalGanhar) {
      foods = [
        ['Arroz integral – 4 col. sopa (80g)', 'Frango grelhado – 1 filé grande (180g)', 'Feijão preto – 0,5 concha (70g)', 'Salada verde – 1 prato (80g)', 'Azeite – 1 col. sopa (8ml)'],
        ['Macarrão integral – 3 col. sopa (80g)', 'Carne moída refogada – 3 col. sopa (100g)', 'Ovo cozido – 1 unidade (50g)', 'Rúcula com tomate – 1 prato (100g)'],
        ['Batata-doce cozida – 1 unidade (120g)', 'Peixe assado – 1 filé grande (180g)', 'Brócolis no vapor – 1 xícara (100g)', 'Queijo prato – 1 fatia (25g)', 'Azeite – 1 col. sopa (8ml)'],
      ][v]
    } else if (flags.isGoalPerder) {
      foods = [
        ['Sopa de frango com legumes – 1 tigela (250g)', 'Pão integral – 1 fatia (25g)', 'Alface – 3 folhas (50g)'],
        ['Omelete de 2 ovos – (110g)', 'Queijo branco light – 1 fatia (30g)', 'Salada de folhas – 1 prato (80g)', 'Tomate – 1 unidade (130g)', 'Azeite – 1 col. chá (4ml)'],
        ['Frango grelhado – 1 filé pequeno (100g)', 'Cenoura cozida – 3 col. sopa (80g)', 'Couve refogada – 3 folhas (45g)', 'Limão – suco de 1 unidade'],
      ][v]
    } else {
      foods = [
        ['Sopa de frango com legumes – 1 tigela (250g)', 'Pão integral – 1 fatia (25g)', 'Alface – 3 folhas (50g)'],
        ['Omelete de 2 ovos – (110g)', 'Queijo frescal – 1 fatia (35g)', 'Salada verde – 1 prato (80g)', 'Tomate – 1 unidade (130g)'],
        ['Arroz integral – 3 col. sopa (60g)', 'Frango grelhado – 1 filé pequeno (100g)', 'Abobrinha – 3 col. sopa (80g)', 'Salada de alface – 4 folhas (60g)'],
      ][v]
    }

  // ── CEIA (GLP-1 e bariátrica) ────────────────────────────────────────────────
  } else if (type === 'Ceia') {
    if (flags.isVegan) {
      foods = ['Chá de camomila – 1 xícara (200ml)', 'Castanha do Pará – 2 unidades (10g)']
    } else if (flags.isLowCarb) {
      foods = ['Queijo minas frescal – 1 fatia (30g)', 'Chá sem açúcar – 1 xícara (200ml)']
    } else {
      foods = ['Iogurte natural – 2/3 pote (113g)', 'Mel – 1 col. chá (7g)', 'Canela – 1 pitada']
    }
  }

  // Aplica restrições de sem_gluten, sem_lactose e alimentos excluídos
  foods = applyRestrictions(foods, flags)

  return {
    type,
    time,
    foods,
    calories: Math.round(cals),
    protein: Math.round(protein),
    carbs: Math.max(0, Math.round(carbs)),
    fat: Math.round(fat),
    fiber: Math.round(fiber),
  }
}

function generatePersonalizedTips(_user: UserProfile, flags: Flags): string[] {
  const tips: string[] = []

  if (flags.isBariatric) {
    tips.push('Pós-bariátrica: priorize proteína em todas as refeições para evitar sarcopenia. Meta mínima: 60-80g de proteína/dia.')
    tips.push('Mastigue devagar (mínimo 20 mastigações por porção) e coma devagar — o seu estômago reduzido sinaliza saciedade mais rápido.')
    tips.push('Evite beber líquidos junto às refeições. Hidrate-se nos intervalos, em pequenos goles ao longo do dia.')
  } else if (flags.onMedication) {
    tips.push('Com GLP-1: faça refeições menores e mais frequentes. Mastigue devagar e pare ao sentir saciedade — o medicamento amplifica esse sinal.')
    tips.push('Priorize proteína no início de cada refeição para preservar massa muscular e controlar a glicemia.')
    tips.push('Hidrate-se bem: pelo menos 2,5L de água por dia, em goles pequenos ao longo do dia (não com as refeições).')
  }

  if (flags.isGoalPerder) {
    tips.push('Monte o prato com a técnica do prato saudável: metade de vegetais, um quarto de proteína magra e um quarto de carboidrato complexo.')
    tips.push('Beba um copo de água 20 minutos antes das refeições para aumentar a saciedade e reduzir a ingestão calórica.')
    tips.push('Prefira preparações grelhadas, assadas ou cozidas no vapor. Evite frituras e molhos prontos.')
  } else if (flags.isGoalGanhar) {
    tips.push('Para ganho de massa, não fique mais de 3-4 horas sem comer: seu músculo precisa de aminoácidos constantes para crescer.')
    tips.push('Consuma carboidratos (arroz, batata-doce, banana) antes e depois do treino para maximizar a energia e a recuperação muscular.')
    tips.push('Adicione fontes calóricas saudáveis como azeite, abacate, castanhas e queijo para atingir o superávit calórico sem inflar o volume das refeições.')
  } else {
    tips.push('Mantenha regularidade nos horários das refeições para estabilizar os níveis de glicemia e controlar o apetite ao longo do dia.')
    tips.push('Varie as proteínas ao longo da semana: frango, peixe, ovos, carne bovina e leguminosas garantem diferentes aminoácidos e micronutrientes.')
  }

  if (flags.isVegetarian || flags.isVegan) {
    tips.push('Combine leguminosas (feijão, lentilha, grão-de-bico) com cereais (arroz, milho) na mesma refeição para obter proteína completa com todos os aminoácidos essenciais.')
  }

  if (flags.isGlutenFree) {
    tips.push('Sem glúten: prefira tapioca, arroz, batata-doce e quinoa no lugar de pão e macarrão. Verifique os rótulos de alimentos industrializados para evitar contaminação cruzada.')
  }

  if (flags.isLactoseFree) {
    tips.push('Sem lactose: leites vegetais (aveia, soja, coco) e iogurtes sem lactose substituem os lácteos convencionais com boa tolerância e perfil nutricional similar.')
  }

  if (flags.isDiabetic) {
    tips.push('Distribua o consumo de carboidratos ao longo do dia em porções menores para evitar picos de glicemia. Priorize sempre carboidratos integrais.')
  }

  tips.push('Prepare o almoço e o jantar com antecedência (batch cooking) no fim de semana para facilitar a adesão ao plano durante a semana.')
  tips.push('Consulte um nutricionista presencialmente para ajustes personalizados, exames de sangue e avaliação do progresso real.')

  return tips.slice(0, 6)
}

function generateShoppingList(_user: UserProfile, flags: Flags): string[] {
  const items: string[] = []

  // Proteínas — variam por objetivo e restrição
  if (flags.isVegan) {
    items.push('Tofu firme (500g)', 'Grão-de-bico (500g)', 'Lentilha (500g)', 'Feijão preto (1kg)', 'Feijão carioca (1kg)', 'Pasta de amendoim integral (300g)')
  } else if (flags.isVegetarian) {
    items.push('Ovos (2 dúzias)', 'Tofu firme (400g)', 'Grão-de-bico (500g)', 'Lentilha (500g)', 'Feijão (1kg)')
    if (!flags.isLactoseFree) {
      items.push('Queijo minas frescal (400g)', 'Iogurte grego natural (4 potes)')
    } else {
      items.push('Iogurte sem lactose (4 potes)', 'Queijo sem lactose (300g)')
    }
  } else if (flags.isGoalGanhar) {
    items.push('Peito de frango (1,5kg)', 'Carne bovina magra — patinho ou músculo (800g)', 'Ovos (2 dúzias)', 'Peixe — tilápia ou merluza (700g)', 'Atum em água (3 latas)', 'Feijão (1kg)')
    if (!flags.isLactoseFree) items.push('Queijo branco (400g)', 'Iogurte natural (1L)')
    else items.push('Iogurte sem lactose (1L)')
  } else if (flags.isGoalPerder) {
    items.push('Peito de frango (1kg)', 'Filé de tilápia (600g)', 'Ovos (1 dúzia)', 'Atum em água (2 latas)', 'Feijão carioca (500g)')
    if (!flags.isLactoseFree) items.push('Iogurte natural desnatado (4 potes)')
    else items.push('Iogurte sem lactose desnatado (4 potes)')
  } else {
    items.push('Peito de frango (1kg)', 'Ovos (1 dúzia)', 'Carne magra (500g)', 'Peixe (500g)', 'Feijão (1kg)')
  }

  // Carboidratos — respeitando sem_gluten e low_carb
  if (!flags.isLowCarb) {
    if (flags.isGlutenFree) {
      // Sem glúten: sem pão integral, sem macarrão de trigo
      if (flags.isGoalGanhar) {
        items.push('Arroz integral (2kg)', 'Arroz branco (1kg)', 'Batata-doce (1,5kg)', 'Tapioca granulada (500g)', 'Mandioca (1kg)', 'Banana (2 dúzias)', 'Quinoa (300g)')
      } else if (flags.isGoalPerder) {
        items.push('Arroz integral (1kg)', 'Batata-doce (700g)', 'Tapioca granulada (300g)')
      } else {
        items.push('Arroz integral (1kg)', 'Batata-doce (1kg)', 'Tapioca granulada (300g)', 'Mandioca (700g)')
      }
    } else {
      if (flags.isGoalGanhar) {
        items.push('Arroz integral (2kg)', 'Arroz branco (1kg)', 'Batata-doce (1,5kg)', 'Macarrão integral (500g)', 'Pão integral (2 pacotes)', 'Aveia em flocos (500g)', 'Banana (2 dúzias)')
      } else if (flags.isGoalPerder) {
        items.push('Arroz integral (1kg)', 'Batata-doce (700g)', 'Aveia em flocos (400g)', 'Pão integral (1 pacote)')
      } else {
        items.push('Arroz integral (1kg)', 'Batata-doce (1kg)', 'Pão integral (1 pacote)', 'Aveia em flocos (400g)', 'Macarrão integral (500g)')
      }
    }
  }

  // Gorduras boas
  items.push('Azeite extra-virgem (500ml)', 'Castanhas mistas (200g)', 'Abacate (3 unidades)')
  if (flags.isVegan || flags.isGoalGanhar) {
    items.push('Pasta de amendoim integral (300g)', 'Sementes de chia (150g)', 'Linhaça dourada (150g)')
  }

  // Vegetais
  if (flags.isGoalPerder) {
    items.push('Brócolis (2 unidades)', 'Couve-flor (1 unidade)', 'Abobrinha (1kg)', 'Cenoura (1kg)', 'Espinafre (200g)', 'Rúcula (2 maços)', 'Alface (2 unidades)', 'Tomate (1kg)', 'Pepino (4 unidades)', 'Chuchu (4 unidades)')
  } else {
    items.push('Brócolis (2 unidades)', 'Cenoura (1kg)', 'Tomate (1kg)', 'Alface (2 unidades)', 'Abobrinha (700g)', 'Couve (1 maço)')
  }

  // Frutas
  if (flags.isGoalGanhar) {
    items.push('Banana (2 dúzias)', 'Mamão (2 unidades)', 'Laranja (1kg)', 'Maçã (6 unidades)')
  } else {
    items.push('Banana (1 dúzia)', 'Mamão (1 unidade)', 'Maçã (6 unidades)', 'Morango (500g)', 'Kiwi (6 unidades)')
  }

  // Laticínios / Alternativas
  if (flags.isVegan) {
    items.push('Leite de aveia (1L)', 'Leite de soja (1L)', 'Iogurte de coco (4 potes)')
  } else if (flags.isLactoseFree) {
    items.push('Leite de aveia (2L)', 'Iogurte sem lactose (1L)')
    if (!flags.isGoalPerder) items.push('Queijo sem lactose (300g)')
  } else {
    items.push('Leite desnatado (2L)', 'Iogurte natural (1L)')
    if (!flags.isGoalPerder) items.push('Queijo minas (300g)')
  }

  // Temperos e extras
  items.push('Alho (1 cabeça)', 'Cebola (1kg)', 'Limão (6 unidades)', 'Temperos naturais — salsa, cebolinha, coentro', 'Vinagre de maçã', 'Canela em pó', 'Cúrcuma/açafrão-da-terra')

  return items
}
