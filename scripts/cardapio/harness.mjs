// ─────────────────────────────────────────────────────────────────────────────
// CAMADA 1 — Harness determinístico do cardápio (sem custo de IA).
// Roda o generateWeeklyMenu REAL de produção com fetch stubado devolvendo cardápios
// ADVERSARIAIS (piores casos), e verifica com o oráculo de invariants.mjs que o
// pós-processamento corrige tudo. Determinístico: mesma entrada → mesmo resultado.
// Uso: node scripts/cardapio/harness.mjs
import { generateWeeklyMenu, calculateBMR, calculateTDEE, calculateCalorieTarget, calculateMacros, applyClinicalFloors } from './lib.mjs'
import { checkMenu } from './invariants.mjs'

// Silencia o ruído de console.warn/error de produção (despeja arrays no reparo); mantém console.log.
console.warn = () => {}
console.error = () => {}

const DAYS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo']
const MARK = ['Alface crespa', 'Rúcula', 'Tomate', 'Pepino', 'Cenoura ralada', 'Couve refogada', 'Escarola'] // único por dia

const EVENTS = {
  principais: ['Café da Manhã', 'Almoço', 'Jantar'],
  fracionado: ['Café da Manhã', 'Lanche da Manhã', 'Almoço', 'Lanche da Tarde', 'Jantar', 'Ceia'],
}

// Monta usuário + metas via funções REAIS.
function makeUser(o = {}) {
  const u = {
    id: 'harness', name: 'QA', email: 'qa@x.com', age: 40, gender: 'feminino', height: 165,
    currentWeight: 80, targetWeight: 70, goal: 'perder_peso', activityLevel: 'leve',
    dietaryPreferences: [], mealRoutine: { breakfastTime: '', lunchTime: '', dinnerTime: '', hasSnacks: false },
    medication: 'nenhum', medicationDosage: '', hadBariatricSurgery: false,
    medicalLimitations: { hasLimitation: false, description: '' }, country: 'Brasil', ...o,
  }
  const bmr = calculateBMR(u.currentWeight, u.height, u.age, u.gender)
  const tdee = calculateTDEE(bmr, u.activityLevel)
  const cal = calculateCalorieTarget(tdee, u.goal, u.medication)
  let macros = calculateMacros(cal, u.goal, u.currentWeight)
  macros = applyClinicalFloors(macros, { medication: u.medication, hadBariatricSurgery: u.hadBariatricSurgery, weight: u.currentWeight })
  return { ...u, targetCalories: Math.round(cal), targetProtein: macros.protein, targetCarbs: macros.carbs, targetFat: macros.fat, targetFiber: macros.fiber, targetWater: 2500 }
}

// Monta cardápio adversarial: 7 dias únicos (marcador por dia no ÚLTIMO evento).
// foodsFor(type, dayIndex) → array de alimentos para aquele evento.
function buildMenu(events, foodsFor) {
  const days = DAYS.map((day, i) => ({
    day,
    meals: events.map((type, mi) => {
      const foods = foodsFor(type, i).map((f) => ({ ...f }))
      if (mi === events.length - 1) foods.push({ name: `${MARK[i]} – 1 porção (60g)`, calories: 18, protein: 1.2, carbs: 3, fat: 0.2, fiber: 1.6 })
      return { type, name: type, foods }
    }),
  }))
  return { title: 'Adversarial', description: 'x', days, tips: ['a', 'b', 'c', 'd', 'e'], shoppingList: ['item fantasma removido'], substitutions: [] }
}

// fetch stub: 1ª chamada (geração principal) devolve o menu; chamadas de preenchimento → vazio.
function stub(menu) {
  global.fetch = async (_url, opts) => {
    const prompt = JSON.parse(opts.body).messages[0].content
    const isFill = /JÁ EXISTEM|NOVOS e DIFERENTES/.test(prompt)
    return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: JSON.stringify(isFill ? { days: [] } : menu) } }] }), text: async () => '' }
}
}

// ── alimentos adversariais reutilizáveis ─────────────────────────────────────
const F = {
  paoSoCarbo: { name: 'Pão francês – 3 unidades (150g)', calories: 410, protein: 8, carbs: 80, fat: 4, fiber: 2 }, // café só de pão
  acucar: { name: 'Açúcar refinado – 1 colher (15g)', calories: 60, protein: 0, carbs: 15, fat: 0, fiber: 0 },
  refri: { name: 'Refrigerante – 1 copo (300ml)', calories: 130, protein: 0, carbs: 33, fat: 0, fiber: 0 },
  arrozBranco: { name: 'Arroz branco – 8 colheres (250g)', calories: 320, protein: 6, carbs: 70, fat: 0.6, fiber: 1 },
  farinhaBranca: { name: 'Bolo de farinha branca – 1 fatia (80g)', calories: 250, protein: 3, carbs: 45, fat: 7, fiber: 0.5 },
  atumFrito: { name: 'Atum frito – 1 posta (180g)', calories: 520, protein: 34, carbs: 0, fat: 32, fiber: 0 }, // >400 e fritura
  bifeFrito: { name: 'Bife à milanesa frito – 1 unidade (160g)', calories: 470, protein: 30, carbs: 18, fat: 28, fiber: 0 },
  carbExtra: { name: 'Macarrão – 1 prato (300g)', calories: 420, protein: 12, carbs: 84, fat: 2, fiber: 3 }, // p/ low_carb estourar
  batata: { name: 'Batata cozida – 2 unidades (260g)', calories: 230, protein: 5, carbs: 52, fat: 0.3, fiber: 4 },
  // proibidos por restrição
  frango: { name: 'Frango grelhado – 1 filé (120g)', calories: 198, protein: 37, carbs: 0, fat: 4, fiber: 0 },
  carne: { name: 'Carne bovina – 1 bife (120g)', calories: 250, protein: 32, carbs: 0, fat: 13, fiber: 0 },
  camarao: { name: 'Camarão refogado – 1 porção (100g)', calories: 99, protein: 24, carbs: 0, fat: 0.3, fiber: 0 },
  ovo: { name: 'Ovos mexidos – 2 unidades (100g)', calories: 147, protein: 13, carbs: 1, fat: 10, fiber: 0 },
  queijo: { name: 'Queijo mussarela – 2 fatias (40g)', calories: 120, protein: 9, carbs: 1, fat: 9, fiber: 0 },
  leite: { name: 'Leite integral – 1 copo (200ml)', calories: 120, protein: 6, carbs: 9, fat: 6, fiber: 0 },
  iogurte: { name: 'Iogurte natural – 1 pote (170g)', calories: 102, protein: 10, carbs: 8, fat: 3, fiber: 0 },
  trigo: { name: 'Macarrão de trigo – 1 prato (250g)', calories: 350, protein: 11, carbs: 70, fat: 2, fiber: 3 },
  // permitidos que NÃO podem ser falso-positivo
  leiteCoco: { name: 'Leite de coco – 100ml', calories: 197, protein: 2, carbs: 3, fat: 20, fiber: 0 },
  ovomaltine: { name: 'Ovomaltine – 2 colheres (20g)', calories: 80, protein: 2, carbs: 15, fat: 1, fiber: 1 },
  paoSemGluten: { name: 'Pão sem glúten – 2 fatias (50g)', calories: 130, protein: 3, carbs: 24, fat: 2, fiber: 2 },
  // atípicos
  homus: { name: 'Homus – 2 colheres (60g)', calories: 110, protein: 4, carbs: 10, fat: 6, fiber: 3 },
  quinoa: { name: 'Salada de quinoa – 1 prato (150g)', calories: 180, protein: 6, carbs: 32, fat: 3, fiber: 4 },
  sushi: { name: 'Sushi de salmão – 6 peças (180g)', calories: 300, protein: 12, carbs: 50, fat: 6, fiber: 1 },
  hamLentilha: { name: 'Hambúrguer de lentilha – 1 unidade (120g)', calories: 210, protein: 11, carbs: 28, fat: 6, fiber: 7 },
  cuscuzMarroquino: { name: 'Cuscuz marroquino – 1 xícara (150g)', calories: 220, protein: 7, carbs: 44, fat: 1, fiber: 3 },
  tofu: { name: 'Tofu grelhado – 1 fatia (120g)', calories: 170, protein: 18, carbs: 3, fat: 10, fiber: 1 },
  // hipertensão/colesterol
  presunto: { name: 'Presunto – 3 fatias (60g)', calories: 90, protein: 11, carbs: 1, fat: 5, fiber: 0 },
  salsicha: { name: 'Salsicha – 2 unidades (100g)', calories: 260, protein: 11, carbs: 3, fat: 23, fiber: 0 },
  enlatado: { name: 'Milho enlatado – 1 lata (200g)', calories: 160, protein: 5, carbs: 34, fat: 2, fiber: 4 },
  bacon: { name: 'Bacon frito – 4 fatias (60g)', calories: 320, protein: 9, carbs: 0, fat: 31, fiber: 0 },
  torresmo: { name: 'Torresmo – 1 porção (80g)', calories: 440, protein: 12, carbs: 0, fat: 44, fiber: 0 },
  banha: { name: 'Banha de porco – 1 colher (15g)', calories: 135, protein: 0, carbs: 0, fat: 15, fiber: 0 },
  // leves (forçam boosters → testa variedade no dia)
  fruta: { name: 'Maçã – 1 unidade (130g)', calories: 68, protein: 0.4, carbs: 18, fat: 0.2, fiber: 3 },
  torrada: { name: 'Torrada – 2 unidades (30g)', calories: 110, protein: 3, carbs: 22, fat: 1, fiber: 1 },
  // glúten por PRODUTO (nome sem "trigo")
  pizza: { name: 'Pizza de calabresa – 2 fatias (200g)', calories: 540, protein: 22, carbs: 60, fat: 22, fiber: 3 },
  lasanha: { name: 'Lasanha à bolonhesa – 1 porção (300g)', calories: 450, protein: 24, carbs: 45, fat: 18, fiber: 3 },
  macarraoComum: { name: 'Macarrão à carbonara – 1 prato (280g)', calories: 420, protein: 14, carbs: 68, fat: 11, fiber: 3 },
  bolacha: { name: 'Bolacha água e sal – 4 unidades (30g)', calories: 130, protein: 3, carbs: 22, fat: 4, fiber: 1 },
  paoDeQueijo: { name: 'Pão de queijo – 2 unidades (60g)', calories: 180, protein: 4, carbs: 20, fat: 9, fiber: 0 }, // sem glúten (permitido)
  // laticínios que escapam de "queijo"/"leite"
  catupiry: { name: 'Pão com catupiry – 1 unidade (80g)', calories: 250, protein: 7, carbs: 28, fat: 12, fiber: 1 },
  creamCheese: { name: 'Bagel com cream cheese – 1 unidade (110g)', calories: 320, protein: 9, carbs: 40, fat: 14, fiber: 2 },
  provolone: { name: 'Provolone grelhado – 2 fatias (50g)', calories: 175, protein: 12, carbs: 1, fat: 14, fiber: 0 },
  gorgonzola: { name: 'Salada com gorgonzola – 1 prato (120g)', calories: 160, protein: 8, carbs: 6, fat: 12, fiber: 2 },
  // doces tradicionais (diabetes/metabólica)
  goiabada: { name: 'Goiabada com queijo – 1 fatia (80g)', calories: 230, protein: 3, carbs: 48, fat: 3, fiber: 1 },
  pacoca: { name: 'Paçoca – 2 unidades (40g)', calories: 200, protein: 4, carbs: 24, fat: 10, fiber: 1 },
  mousse: { name: 'Mousse de maracujá – 1 taça (120g)', calories: 240, protein: 3, carbs: 32, fat: 11, fiber: 0 },
  // derivados animais não-carne (vegano)
  gelatina: { name: 'Gelatina de morango – 1 taça (120g)', calories: 80, protein: 2, carbs: 18, fat: 0, fiber: 0 },
  maionese: { name: 'Sanduíche com maionese – 1 unidade (150g)', calories: 300, protein: 9, carbs: 30, fat: 16, fiber: 2 },
  iogurteMel: { name: 'Iogurte com mel – 1 pote (170g)', calories: 160, protein: 9, carbs: 24, fat: 3, fiber: 0 },
  tapiocaMel: { name: 'Tapioca com mel – 1 unidade (100g)', calories: 220, protein: 2, carbs: 50, fat: 1, fiber: 1 },
  carneSoja: { name: 'Carne de soja refogada – 1 porção (100g)', calories: 160, protein: 18, carbs: 12, fat: 4, fiber: 5 }, // vegana (não pode ser trocada)
  // cortes de porco (exclusão composta "carne de porco")
  lomboSuino: { name: 'Lombo suíno assado – 1 fatia (120g)', calories: 250, protein: 28, carbs: 0, fat: 15, fiber: 0 },
  pernil: { name: 'Pernil assado – 1 porção (120g)', calories: 270, protein: 27, carbs: 0, fat: 17, fiber: 0 },
  bisteca: { name: 'Bisteca suína – 1 unidade (130g)', calories: 290, protein: 26, carbs: 0, fat: 20, fiber: 0 },
  // plural irregular
  paes: { name: 'Pães caseiros integrais – 2 fatias (60g)', calories: 160, protein: 6, carbs: 30, fat: 2, fiber: 3 },
  // carbo barato (low_carb difícil) e carbo espalhado
  melancia: { name: 'Melancia – 1 fatia (200g)', calories: 60, protein: 1, carbs: 15, fat: 0.2, fiber: 1 },
  manga: { name: 'Manga – 1 unidade (200g)', calories: 120, protein: 1.5, carbs: 30, fat: 0.5, fiber: 3 },
  abobora: { name: 'Abóbora cozida – 1 porção (150g)', calories: 80, protein: 2, carbs: 18, fat: 0.3, fiber: 3 },
  beterraba: { name: 'Beterraba cozida – 1 porção (120g)', calories: 50, protein: 2, carbs: 12, fat: 0.1, fiber: 3 },
  cenouraCozida: { name: 'Cenoura cozida – 1 porção (120g)', calories: 50, protein: 1, carbs: 12, fat: 0.2, fiber: 3 },
  arrozIntegral: { name: 'Arroz integral – 4 colheres (150g)', calories: 165, protein: 4, carbs: 35, fat: 1, fiber: 3 },
  feijaoPreto: { name: 'Feijão preto – 1 concha (140g)', calories: 109, protein: 7, carbs: 19, fat: 0.7, fiber: 9 },
  // proteína densa (bariátrica, #11)
  frangoDenso: { name: 'Peito de frango grelhado – 1 filé grande (200g)', calories: 330, protein: 62, carbs: 0, fat: 7, fiber: 0 },
  carneDensa: { name: 'Patinho grelhado – 1 bife (180g)', calories: 320, protein: 56, carbs: 0, fat: 10, fiber: 0 },
  // café com carne (a IA às vezes põe carne/atum no café da manhã)
  bifeCafe: { name: 'Bife grelhado – 1 unidade (120g)', calories: 250, protein: 32, carbs: 0, fat: 13, fiber: 0 },
  atumCafe: { name: 'Atum em água – 1 lata (100g)', calories: 116, protein: 26, carbs: 0, fat: 1, fiber: 0 },
  // fit/atípicos brasileiros (Veronica)
  cevada: { name: 'Cevada cozida – 0,5 xícara (90g)', calories: 110, protein: 3, carbs: 22, fat: 0.4, fiber: 4 },
  berryMix: { name: 'Berry mix congelado – 1 porção (130g)', calories: 70, protein: 1, carbs: 17, fat: 0.4, fiber: 4 },
  couveBruxelas: { name: 'Couves de Bruxelas – 1 xícara (90g)', calories: 38, protein: 3, carbs: 8, fat: 0.3, fiber: 3 },
  avelas: { name: 'Avelãs – 1 punhado (14g)', calories: 88, protein: 2, carbs: 2, fat: 8.5, fiber: 1 },
  // atípicos NÃO listados na denylist (a allowlist tem que pegar por ausência de palavra brasileira)
  risotoCevadinha: { name: 'Risoto de cevadinha com abobrinha – 2 xícaras (200g)', calories: 220, protein: 6, carbs: 40, fat: 4, fiber: 4 }, // palavra BR ao lado (abobrinha) não pode salvar o risoto
  espargos: { name: 'Espargos grelhados – 1 porção (90g)', calories: 40, protein: 3, carbs: 4, fat: 0.4, fiber: 2 },
  farro: { name: 'Farro cozido – 1/2 xícara (90g)', calories: 150, protein: 5, carbs: 30, fat: 1, fiber: 4 },
  ratatouille: { name: 'Ratatouille – 1 porção (150g)', calories: 90, protein: 2, carbs: 12, fat: 4, fiber: 4 },
  // staples com qualificador ATÍPICO (palavra brasileira + versão fit/estrangeira)
  arrozNegro: { name: 'Arroz negro – 4 colheres (100g)', calories: 130, protein: 3, carbs: 28, fat: 1, fiber: 2 },
  arrozCouveFlor: { name: 'Arroz de couve-flor – 1 xícara (120g)', calories: 30, protein: 2, carbs: 5, fat: 0.3, fiber: 2 },
  feijaoAzuki: { name: 'Feijão azuki – 1 concha (120g)', calories: 130, protein: 8, carbs: 23, fat: 0.2, fiber: 7 },
  lasanhaBerinjela: { name: 'Lasanha de berinjela e ricota – 1 porção (240g)', calories: 280, protein: 14, carbs: 18, fat: 16, fiber: 5 },
}

// distribui violações nas refeições conforme a estrutura
function spread(events, opts) {
  // opts.café/almoço/jantar/lanche arrays; fallback para café/principal
  return (type, i) => {
    const t = type.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    if (t.includes('almoco')) return opts.almoco ? opts.almoco(i) : []
    if (t.includes('jantar')) return opts.jantar ? opts.jantar(i) : []
    if (t.includes('lanche') || t.includes('ceia')) return opts.lanche ? opts.lanche(i) : [F.fruta, F.torrada]
    return opts.cafe ? opts.cafe(i) : []
  }
}

// ── cenários ─────────────────────────────────────────────────────────────────
const scenarios = []
const add = (name, opts) => scenarios.push({ name, ...opts })

const optStruct = (mode) => ({ country: 'Brasil', mealStructure: { includeMorningSnack: mode === 'fracionado', includeAfternoonSnack: mode === 'fracionado', includeSupper: mode === 'fracionado' } })

// S1/S2 GLP-1 nas 2 estruturas
for (const mode of ['principais', 'fracionado']) {
  add(`GLP-1 ${mode}`, {
    user: makeUser({ medication: 'saxenda' }),
    options: optStruct(mode),
    menu: buildMenu(EVENTS[mode], spread(EVENTS[mode], {
      cafe: () => [F.paoSoCarbo, F.acucar], almoco: () => [F.arrozBranco, F.refri], jantar: () => [F.atumFrito], lanche: () => [F.fruta, F.refri],
    })),
    spec: { glp1: true, metabolica: true, expectedEvents: EVENTS[mode], country: 'Brasil', protFloor: null, fiberFloor: 30 },
  })
}
// S3 bariátrica fracionado (teto 200)
add('Bariátrica fracionado', {
  user: makeUser({ hadBariatricSurgery: true, goal: 'manter_peso' }),
  options: optStruct('fracionado'),
  menu: buildMenu(EVENTS.fracionado, spread(EVENTS.fracionado, { cafe: () => [F.paoSoCarbo], almoco: () => [F.arrozBranco, F.atumFrito], jantar: () => [F.bifeFrito], lanche: () => [F.fruta, F.acucar] })),
  spec: { bariatric: true, metabolica: true, expectedEvents: EVENTS.fracionado, country: 'Brasil', fiberFloor: 30 },
})
// S4 GLP-1 + bariátrica (bariátrica vence: 200)
add('GLP-1 + bariátrica (vence 200)', {
  user: makeUser({ medication: 'mounjaro', hadBariatricSurgery: true }),
  options: optStruct('fracionado'),
  menu: buildMenu(EVENTS.fracionado, spread(EVENTS.fracionado, { cafe: () => [F.paoSoCarbo, F.ovo], almoco: () => [F.arrozBranco, F.atumFrito], jantar: () => [F.bifeFrito], lanche: () => [F.fruta] })),
  spec: { glp1: true, bariatric: true, metabolica: true, expectedEvents: EVENTS.fracionado, country: 'Brasil' },
})
// S5 diabético (sem teto de carbo)
add('Diabético principais', {
  user: makeUser({ dietaryPreferences: ['diabetes'], goal: 'manter_peso' }),
  options: optStruct('principais'),
  menu: buildMenu(EVENTS.principais, spread(EVENTS.principais, { cafe: () => [F.paoSoCarbo, F.acucar], almoco: () => [F.arrozBranco, F.frango], jantar: () => [F.farinhaBranca, F.carne] })),
  spec: { restrictions: ['diabetes'], expectedEvents: EVENTS.principais, country: 'Brasil' },
})
// S6 low_carb (teto 100g)
add('Low_carb principais', {
  user: makeUser({ dietaryPreferences: ['low_carb'], goal: 'manter_peso' }),
  options: optStruct('principais'),
  menu: buildMenu(EVENTS.principais, spread(EVENTS.principais, { cafe: () => [F.paoSoCarbo, F.acucar], almoco: () => [F.arrozBranco, F.carbExtra], jantar: () => [F.batata, F.carne] })),
  spec: { restrictions: ['low_carb'], lowCarb: true, expectedEvents: EVENTS.principais, country: 'Brasil' },
})
// S7 vegano fracionado
add('Vegano fracionado', {
  user: makeUser({ dietaryPreferences: ['vegano'], goal: 'manter_peso' }),
  options: optStruct('fracionado'),
  menu: buildMenu(EVENTS.fracionado, spread(EVENTS.fracionado, { cafe: () => [F.paoSoCarbo, F.leite, F.leiteCoco], almoco: () => [F.arrozBranco, F.frango], jantar: () => [F.carne, F.queijo], lanche: () => [F.iogurte, F.ovo] })),
  spec: { restrictions: ['vegano'], expectedEvents: EVENTS.fracionado, country: 'Brasil', vegan: true, mustKeep: ['leite de coco'] },
})
// S8 vegano + low_carb (tofu liberado)
add('Vegano + low_carb', {
  user: makeUser({ dietaryPreferences: ['vegano', 'low_carb'], goal: 'manter_peso' }),
  options: optStruct('principais'),
  menu: buildMenu(EVENTS.principais, spread(EVENTS.principais, { cafe: () => [F.paoSoCarbo], almoco: () => [F.arrozBranco, F.carbExtra, F.frango], jantar: () => [F.batata, F.queijo] })),
  spec: { restrictions: ['vegano', 'low_carb'], lowCarb: true, expectedEvents: EVENTS.principais, country: 'Brasil', vegan: true },
})
// S9 sem_lactose
add('Sem lactose principais', {
  user: makeUser({ dietaryPreferences: ['sem_lactose'], goal: 'manter_peso' }),
  options: optStruct('principais'),
  menu: buildMenu(EVENTS.principais, spread(EVENTS.principais, { cafe: () => [F.leite, F.queijo, F.leiteCoco], almoco: () => [F.arrozBranco, F.frango], jantar: () => [F.carne, F.iogurte] })),
  spec: { restrictions: ['sem_lactose'], expectedEvents: EVENTS.principais, country: 'Brasil', mustKeep: ['leite de coco'] },
})
// S10 sem_gluten
add('Sem glúten principais', {
  user: makeUser({ dietaryPreferences: ['sem_gluten'], goal: 'manter_peso' }),
  options: optStruct('principais'),
  menu: buildMenu(EVENTS.principais, spread(EVENTS.principais, { cafe: () => [F.trigo, F.paoSemGluten], almoco: () => [F.arrozBranco, F.frango], jantar: () => [F.carne, F.batata] })),
  spec: { restrictions: ['sem_gluten'], expectedEvents: EVENTS.principais, country: 'Brasil', mustKeep: ['pão sem glúten'] },
})
// S11 atípicos no Brasil
add('Atípicos no Brasil', {
  user: makeUser({ goal: 'manter_peso' }),
  options: optStruct('principais'),
  menu: buildMenu(EVENTS.principais, spread(EVENTS.principais, { cafe: () => [F.homus, F.quinoa], almoco: () => [F.sushi, F.hamLentilha], jantar: () => [F.cuscuzMarroquino, F.carne] })),
  spec: { expectedEvents: EVENTS.principais, country: 'Brasil' },
})
// S12 tofu não-vegano no Brasil
add('Tofu não-vegano (Brasil)', {
  user: makeUser({ goal: 'manter_peso' }),
  options: optStruct('principais'),
  menu: buildMenu(EVENTS.principais, spread(EVENTS.principais, { cafe: () => [F.paoSoCarbo, F.ovo], almoco: () => [F.arrozBranco, F.tofu], jantar: () => [F.carne, F.tofu] })),
  spec: { expectedEvents: EVENTS.principais, country: 'Brasil', vegan: false },
})
// S13 país != Brasil (atípico permitido)
add('País Itália (atípico OK)', {
  user: makeUser({ goal: 'manter_peso', country: 'Itália' }),
  options: { country: 'Itália', mealStructure: { includeMorningSnack: false, includeAfternoonSnack: false, includeSupper: false } },
  menu: buildMenu(EVENTS.principais, spread(EVENTS.principais, { cafe: () => [F.paoSoCarbo], almoco: () => [{ name: 'Risoto de funghi – 1 prato (300g)', calories: 380, protein: 9, carbs: 60, fat: 10, fiber: 2 }, F.carne], jantar: () => [{ name: 'Macarrão ao pesto – 1 prato (280g)', calories: 420, protein: 12, carbs: 70, fat: 11, fiber: 3 }] })),
  spec: { expectedEvents: EVENTS.principais, country: 'Itália', allowAtipico: true },
})
// S14 exclusões + falso-positivo
add('Exclusões + falso-positivo', {
  user: makeUser({ goal: 'manter_peso' }),
  options: { country: 'Brasil', excludedFoods: ['frango', 'camarão', 'ovo', 'leite'], mealStructure: { includeMorningSnack: false, includeAfternoonSnack: false, includeSupper: false } },
  menu: buildMenu(EVENTS.principais, spread(EVENTS.principais, { cafe: () => [F.paoSoCarbo, F.ovomaltine, F.leiteCoco], almoco: () => [F.frango, F.camarao], jantar: () => [F.ovo, F.leite, F.carne] })),
  spec: { excluded: ['frango', 'camarão', 'ovo', 'leite'], expectedEvents: EVENTS.principais, country: 'Brasil', mustKeep: ['ovomaltine', 'leite de coco'] },
})
// S15 hipertensão
add('Hipertensão (medicalLimitations)', {
  user: makeUser({ goal: 'manter_peso', medicalLimitations: { hasLimitation: true, description: 'Hipertensão / pressão alta' } }),
  options: optStruct('principais'),
  menu: buildMenu(EVENTS.principais, spread(EVENTS.principais, { cafe: () => [F.paoSoCarbo, F.presunto], almoco: () => [F.arrozBranco, F.salsicha, F.enlatado], jantar: () => [F.carne, F.batata] })),
  spec: { excluded: ['presunto', 'salsicha', 'linguiça', 'bacon', 'mortadela', 'salame', 'enlatado', 'embutido'], expectedEvents: EVENTS.principais, country: 'Brasil' },
})
// S16 colesterol
add('Colesterol alto (medicalLimitations)', {
  user: makeUser({ goal: 'manter_peso', medicalLimitations: { hasLimitation: true, description: 'Colesterol alto' } }),
  options: optStruct('principais'),
  menu: buildMenu(EVENTS.principais, spread(EVENTS.principais, { cafe: () => [F.paoSoCarbo, F.bacon], almoco: () => [F.arrozBranco, F.torresmo], jantar: () => [F.carne, F.banha] })),
  spec: { excluded: ['bacon', 'torresmo', 'banha', 'linguiça'], expectedEvents: EVENTS.principais, country: 'Brasil' },
})
// S17 variedade no dia (alimentos leves forçam boosters)
add('Variedade no dia (boosters)', {
  user: makeUser({ medication: 'ozempic' }),
  options: optStruct('fracionado'),
  menu: buildMenu(EVENTS.fracionado, spread(EVENTS.fracionado, { cafe: () => [F.torrada, F.fruta], almoco: () => [F.arrozBranco, F.fruta], jantar: () => [F.batata, F.fruta], lanche: () => [F.fruta] })),
  spec: { glp1: true, metabolica: true, expectedEvents: EVENTS.fracionado, country: 'Brasil', fiberFloor: 30 },
})

// ── cenários NOVOS (cobrem os 22 bugs da auditoria) ──────────────────────────
// NS1 sem_gluten por PRODUTO (pizza/lasanha/macarrão/bolacha) + pão de queijo permitido
add('Sem glúten produtos', {
  user: makeUser({ dietaryPreferences: ['sem_gluten'], goal: 'manter_peso' }),
  options: optStruct('principais'),
  menu: buildMenu(EVENTS.principais, spread(EVENTS.principais, { cafe: () => [F.bolacha, F.paoDeQueijo], almoco: () => [F.lasanha, F.frango], jantar: () => [F.pizza, F.macarraoComum] })),
  spec: { restrictions: ['sem_gluten'], expectedEvents: EVENTS.principais, country: 'Brasil', mustKeep: ['pão de queijo'] },
})
// NS2 sem_lactose queijos que escapam de "queijo"/"leite"
add('Sem lactose queijos finos', {
  user: makeUser({ dietaryPreferences: ['sem_lactose'], goal: 'manter_peso' }),
  options: optStruct('principais'),
  menu: buildMenu(EVENTS.principais, spread(EVENTS.principais, { cafe: () => [F.catupiry, F.creamCheese], almoco: () => [F.arrozBranco, F.provolone, F.frango], jantar: () => [F.gorgonzola, F.carne] })),
  spec: { restrictions: ['sem_lactose'], expectedEvents: EVENTS.principais, country: 'Brasil' },
})
// NS3 diabetes doces tradicionais
add('Diabetes doces tradicionais', {
  user: makeUser({ dietaryPreferences: ['diabetes'], goal: 'manter_peso' }),
  options: optStruct('principais'),
  menu: buildMenu(EVENTS.principais, spread(EVENTS.principais, { cafe: () => [F.paoSoCarbo, F.pacoca], almoco: () => [F.arrozBranco, F.frango], jantar: () => [F.goiabada, F.mousse, F.carne] })),
  spec: { restrictions: ['diabetes'], expectedEvents: EVENTS.principais, country: 'Brasil' },
})
// NS4 vegano: gelatina/maionese/mel + carne de soja (NÃO pode ser trocada)
add('Vegano derivados + carne de soja', {
  user: makeUser({ dietaryPreferences: ['vegano'], goal: 'manter_peso' }),
  options: optStruct('fracionado'),
  menu: buildMenu(EVENTS.fracionado, spread(EVENTS.fracionado, { cafe: () => [F.paoSoCarbo, F.iogurteMel], almoco: () => [F.arrozBranco, F.carneSoja], jantar: () => [F.maionese, F.frango], lanche: () => [F.gelatina, F.fruta] })),
  spec: { restrictions: ['vegano'], expectedEvents: EVENTS.fracionado, country: 'Brasil', vegan: true, mustKeep: ['carne de soja'] },
})
// NS5 mel sob diabetes (mel no fim do nome)
add('Mel sob diabetes', {
  user: makeUser({ dietaryPreferences: ['diabetes'], goal: 'manter_peso' }),
  options: optStruct('principais'),
  menu: buildMenu(EVENTS.principais, spread(EVENTS.principais, { cafe: () => [F.iogurteMel, F.tapiocaMel], almoco: () => [F.arrozBranco, F.frango], jantar: () => [F.carne, F.batata] })),
  spec: { restrictions: ['diabetes'], expectedEvents: EVENTS.principais, country: 'Brasil' },
})
// NS6 jejum 20:4 mas a IA devolve café + ceia (fora da janela)
add('Jejum 20:4 estrutura errada', {
  user: makeUser({ medication: 'ozempic', goal: 'perder_peso' }),
  options: { country: 'Brasil', fastingProtocol: '20:4' },
  menu: buildMenu(['Café da Manhã', 'Almoço', 'Jantar', 'Ceia'], spread(['Café da Manhã', 'Almoço', 'Jantar', 'Ceia'], { cafe: () => [F.paoSoCarbo, F.ovo], almoco: () => [F.arrozBranco, F.frango], jantar: () => [F.carne, F.batata], lanche: () => [F.iogurte] })),
  spec: { glp1: true, metabolica: true, expectedEvents: ['Almoço', 'Jantar'], country: 'Brasil' },
})
// NS7 fracionado pedido (6) mas a IA devolve 3 refeições
add('Fracionado virou 3 refeições', {
  user: makeUser({ medication: 'saxenda', goal: 'perder_peso' }),
  options: optStruct('fracionado'),
  menu: buildMenu(EVENTS.principais, spread(EVENTS.principais, { cafe: () => [F.paoSoCarbo, F.ovo], almoco: () => [F.arrozBranco, F.frango], jantar: () => [F.carne, F.batata] })),
  spec: { glp1: true, metabolica: true, expectedEvents: EVENTS.fracionado, country: 'Brasil' },
})
// NS8 low_carb vegano + exclui tofu/amendoim (pool low-carb VAZIO)
add('Low_carb vegano sem tofu/amendoim', {
  user: makeUser({ dietaryPreferences: ['vegano', 'low_carb'], goal: 'manter_peso' }),
  options: { country: 'Brasil', excludedFoods: ['tofu', 'amendoim'], mealStructure: { includeMorningSnack: false, includeAfternoonSnack: false, includeSupper: false } },
  menu: buildMenu(EVENTS.principais, spread(EVENTS.principais, { cafe: () => [F.arrozIntegral, F.fruta], almoco: () => [F.arrozIntegral, F.feijaoPreto, F.batata], jantar: () => [F.macarraoComum, F.abobora] })),
  spec: { restrictions: ['vegano', 'low_carb'], lowCarb: true, expectedEvents: EVENTS.principais, country: 'Brasil', vegan: true, excluded: ['tofu', 'amendoim'] },
})
// NS9 low_carb com carbo ESPALHADO em itens <=8g (sem "vítima") — cobre tb o caso "nenhum booster cabe"
add('Low_carb carbo espalhado', {
  user: makeUser({ dietaryPreferences: ['low_carb'], goal: 'manter_peso' }),
  options: optStruct('principais'),
  menu: buildMenu(EVENTS.principais, (type) => {
    const t = type.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    const k = (j) => ({ name: `Morango ${j} – 50g`, calories: 35, protein: 0.5, carbs: 8, fat: 0.1, fiber: 1 })
    if (t.includes('almoco')) return [F.frango, k(1), k(2), k(3), k(4), k(5)]
    if (t.includes('jantar')) return [F.carne, k(6), k(7), k(8), k(9), k(10)]
    return [k(11), k(12), k(13), k(14)]
  }),
  spec: { restrictions: ['low_carb'], lowCarb: true, expectedEvents: EVENTS.principais, country: 'Brasil' },
})
// NS11 bariátrica fracionada com proteína DENSA: refeições <=200 mantendo o PISO de proteína por
// refeição (não a porção gigante da IA); o dia atinge a proteína pela soma das 6 refeições.
add('Bariátrica proteína densa', {
  user: makeUser({ hadBariatricSurgery: true, currentWeight: 90, goal: 'manter_peso' }),
  options: optStruct('fracionado'),
  menu: buildMenu(EVENTS.fracionado, spread(EVENTS.fracionado, { cafe: () => [F.ovo, F.fruta], almoco: () => [F.frangoDenso, F.abobora], jantar: () => [F.carneDensa, F.abobora], lanche: () => [F.queijo, F.fruta] })),
  spec: { bariatric: true, expectedEvents: EVENTS.fracionado, country: 'Brasil', protFloorHard: 90 },
})
// NS12 exclusão composta "carne de porco" -> lombo/pernil/bisteca
add('Exclusão composta carne de porco', {
  user: makeUser({ goal: 'manter_peso' }),
  options: { country: 'Brasil', excludedFoods: ['carne de porco'], mealStructure: { includeMorningSnack: false, includeAfternoonSnack: false, includeSupper: false } },
  menu: buildMenu(EVENTS.principais, spread(EVENTS.principais, { cafe: () => [F.paoSoCarbo, F.ovo], almoco: () => [F.arrozBranco, F.lomboSuino], jantar: () => [F.pernil, F.bisteca] })),
  spec: { excluded: ['carne de porco'], expectedEvents: EVENTS.principais, country: 'Brasil' },
})
// NS13 plural irregular "pão" -> pães
add('Exclusão plural irregular pão', {
  user: makeUser({ goal: 'manter_peso' }),
  options: { country: 'Brasil', excludedFoods: ['pão'], mealStructure: { includeMorningSnack: false, includeAfternoonSnack: false, includeSupper: false } },
  menu: buildMenu(EVENTS.principais, spread(EVENTS.principais, { cafe: () => [F.paes, F.ovo], almoco: () => [F.arrozBranco, F.frango], jantar: () => [F.carne, F.batata] })),
  spec: { excluded: ['pão'], expectedEvents: EVENTS.principais, country: 'Brasil' },
})

// NS14 IA omite tips/shoppingList/substitutions -> a saída precisa vir com arrays (UI faz .map)
add('Resposta sem tips/lista (blindagem UI)', {
  user: makeUser({ goal: 'manter_peso' }),
  options: optStruct('principais'),
  menu: (() => {
    const m = buildMenu(EVENTS.principais, spread(EVENTS.principais, { cafe: () => [F.paoSoCarbo, F.ovo], almoco: () => [F.arrozBranco, F.frango], jantar: () => [F.carne, F.batata] }))
    delete m.tips; delete m.shoppingList; delete m.substitutions // a IA não mandou esses campos
    return m
  })(),
  spec: { expectedEvents: EVENTS.principais, country: 'Brasil' },
  arraysGuard: true, // checa no runner que out.tips/shoppingList/substitutions são arrays
})

// NS15 café com carne/atum (deve trocar por ovo/queijo) + itens fit atípicos (devem sair)
add('Café sem carne + fit atípico (Brasil)', {
  user: makeUser({ goal: 'ganhar_massa', medication: 'mounjaro' }),
  options: optStruct('principais'),
  menu: buildMenu(EVENTS.principais, spread(EVENTS.principais, {
    cafe: () => [F.bifeCafe, F.atumCafe, F.avelas],
    almoco: () => [F.arrozBranco, F.cevada, F.frango],
    jantar: () => [F.couveBruxelas, F.carne, F.berryMix],
  })),
  spec: { glp1: true, metabolica: true, expectedEvents: EVENTS.principais, country: 'Brasil' },
})

// NS16 allowlist: itens atípicos NÃO listados (risoto de cevadinha, espargos, farro, ratatouille)
// devem ser trocados por equivalente brasileiro (a comida brasileira de verdade permanece intacta).
add('Allowlist troca atípico não-listado', {
  user: makeUser({ goal: 'manter_peso' }),
  options: optStruct('principais'),
  menu: buildMenu(EVENTS.principais, spread(EVENTS.principais, {
    cafe: () => [F.paoSoCarbo, F.ovo],
    almoco: () => [F.risotoCevadinha, F.frango, F.feijaoPreto],
    jantar: () => [F.espargos, F.farro, F.ratatouille, F.carne],
  })),
  spec: { expectedEvents: EVENTS.principais, country: 'Brasil', mustNotContain: ['risoto', 'cevadinha', 'espargos', 'farro', 'ratatouille'] },
})

// NS17 staples com qualificador atípico (arroz negro, arroz de couve-flor, feijão azuki, lasanha de
// berinjela) — têm palavra brasileira mas devem ser trocados (arroz/feijão branco/integral comum).
add('Staple com qualificador atípico', {
  user: makeUser({ goal: 'manter_peso' }),
  options: optStruct('principais'),
  menu: buildMenu(EVENTS.principais, spread(EVENTS.principais, {
    cafe: () => [F.paoSoCarbo, F.ovo],
    almoco: () => [F.arrozNegro, F.feijaoAzuki, F.frango],
    jantar: () => [F.arrozCouveFlor, F.lasanhaBerinjela, F.carne],
  })),
  spec: { expectedEvents: EVENTS.principais, country: 'Brasil', mustNotContain: ['arroz negro', 'couve-flor', 'azuki', 'lasanha de berinjela'] },
})

// ── runner ───────────────────────────────────────────────────────────────────
let totalHard = 0, totalSoftScenarios = 0
const softSummary = []
console.log(`\n══ CAMADA 1 — ${scenarios.length} cenários adversariais (código real, determinístico) ══\n`)
for (const sc of scenarios) {
  stub(sc.menu)
  let out, err
  try { out = await generateWeeklyMenu(sc.user, sc.options) } catch (e) { err = e }
  if (err) { console.log(`✗ ${sc.name}: ERRO — ${err.message}`); totalHard++; continue }
  const { hard, soft } = checkMenu(out, sc.spec)
  // Blindagem da UI: tips/shoppingList/substitutions têm que ser arrays (a tela faz .map neles).
  if (sc.arraysGuard || true) {
    for (const k of ['tips', 'shoppingList', 'substitutions']) {
      if (!Array.isArray(out[k])) hard.push(`out.${k} não é array (UI quebraria no .map)`)
    }
  }
  const pass = hard.length === 0
  totalHard += hard.length
  if (soft.length) { totalSoftScenarios++; softSummary.push({ name: sc.name, soft }) }
  console.log(`${pass ? '✅' : '❌'} ${sc.name}${pass ? '' : `  (${hard.length} duro)`}`)
  if (!pass) for (const h of hard) console.log(`     · ${h}`)
}

console.log(`\n── BEST-EFFORT (não falha o teste, só observa) ──`)
for (const s of softSummary) { console.log(`  ◦ ${s.name}:`); for (const x of s.soft.slice(0, 6)) console.log(`      - ${x}`) }

console.log(`\n══ RESULTADO: ${totalHard === 0 ? '✅ TODOS os invariantes DUROS passaram' : `❌ ${totalHard} violação(ões) DURA(s)`} | ${scenarios.length} cenários ══\n`)
process.exit(totalHard === 0 ? 0 : 1)
