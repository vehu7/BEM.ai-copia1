// Teste de unidade (sem API) — espelha findMenuViolations + repairViolations de gemini.ts (v2).
// Cobre os achados da revisão adversarial: blindagem por palavra-chave (não isenta tudo),
// acento (camarao->Camarão), plural (frango->Frangos), hífen (couve flor->couve-flor).

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim()
const normKw = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/-/g, ' ')

function excludedHit(haystack, needle) {
  if (!needle) return false
  const isLetter = (c) => c != null && /\p{L}/u.test(c)
  let from = 0
  for (;;) {
    const idx = haystack.indexOf(needle, from)
    if (idx === -1) return false
    if (!isLetter(haystack[idx - 1])) {
      const rest = haystack.slice(idx + needle.length)
      const suffix = (rest.match(/^(es|s)?/) || [''])[0]
      if (!isLetter(rest[suffix.length])) return true
    }
    from = idx + 1
  }
}

const SAFE_COMPOUNDS = [
  'leite de coco', 'leite de amendoa', 'leite de aveia', 'leite de soja', 'leite de castanha',
  'leite de arroz', 'leite de amendoim', 'leite vegetal',
  'couve manteiga', 'couve flor', 'feijao manteiga', 'manteiga de amendoim', 'manteiga ghee',
  'queijo vegetal', 'queijo vegano', 'iogurte de coco', 'iogurte vegetal', 'requeijao vegetal',
].map(norm)
const PLANT_QUALIFIERS = ['sem lactose', 'zero lactose', 'sem leite', 'vegano', 'vegana', 'vegetal', 'de coco', 'de amendoa', 'de aveia', 'de soja', 'de castanha', 'de amendoim', 'tofu', 'ghee'].map(norm)
const PLANT_OK_KEYWORDS = new Set(['leite', 'iogurte', 'queijo', 'requeij', 'creme de leite', 'manteiga', 'leite condensado', 'doce de leite', 'whey', 'nata', 'coalhada', 'ricota', 'mussarela', 'mucarela', 'parmes', 'queijo minas', 'queijo frescal', 'ovo'].map(norm))
const GLUTEN_QUALIFIERS = ['sem gluten', 'gluten free'].map(norm)
const DAIRY_RADICALS = new Set(['leite', 'manteiga', 'queijo', 'iogurte', 'creme', 'nata', 'requeijao'].map(norm))

const FORBIDDEN_KEYWORDS = {
  sem_lactose: ['leite', 'iogurte', 'queijo', 'requeij', 'creme de leite', 'manteiga', 'leite condensado', 'doce de leite', 'whey', 'nata', 'coalhada', 'ricota', 'mussarela', 'muçarela', 'parmes', 'queijo minas', 'queijo frescal'],
  sem_gluten: ['trigo', 'pão francês', 'pão de forma', 'macarrão de trigo', 'cevada', 'centeio', 'malte', 'farinha de trigo', 'aveia'],
  vegetariano: ['frango', 'carne', 'bovina', 'porco', 'suíno', 'peixe', 'salmão', 'tilápia', 'sardinha', 'atum', 'camarão', 'presunto', 'bacon', 'linguiça', 'salsicha', 'frutos do mar'],
  vegano: ['frango', 'carne', 'bovina', 'porco', 'peixe', 'salmão', 'tilápia', 'sardinha', 'atum', 'camarão', 'presunto', 'bacon', 'linguiça', 'salsicha', 'ovo', 'leite', 'iogurte', 'queijo', 'requeij', 'mel ', 'manteiga', 'whey'],
}

function findMenuViolations(days, restrictions, excluded) {
  const out = []
  const exclLower = (excluded ?? []).map(e => norm(e)).filter(e => e.length >= 3)
  for (const day of days ?? []) for (const meal of day?.meals ?? []) for (const f of meal?.foods ?? []) {
    const name = (typeof f === 'object' && f !== null ? (f.name ?? '') : String(f))
    const lower = norm(name)
    if (!lower) continue
    const hasPlantQual = PLANT_QUALIFIERS.some(q => lower.includes(q))
    const hasGlutenQual = GLUTEN_QUALIFIERS.some(q => lower.includes(q))
    for (const r of restrictions) {
      const kws = FORBIDDEN_KEYWORDS[r]; if (!kws) continue
      for (const rawKw of kws) {
        const kw = normKw(rawKw)
        if (!lower.includes(kw)) continue
        if (SAFE_COMPOUNDS.some(c => c.includes(kw) && lower.includes(c))) continue
        if (hasPlantQual && PLANT_OK_KEYWORDS.has(kw)) continue
        if (r === 'sem_gluten' && hasGlutenQual) continue
        out.push({ food: name, rule: r }); break
      }
    }
    for (const ex of exclLower) {
      if (!excludedHit(lower, ex)) continue
      if (DAIRY_RADICALS.has(ex) && SAFE_COMPOUNDS.some(c => c.includes(ex) && lower.includes(c))) continue
      out.push({ food: name, rule: `excluído: ${ex}` })
    }
  }
  return out
}

const PROTEIN_FALLBACKS = ['Carne bovina magra grelhada', 'Patinho moído refogado', 'Filé de tilápia grelhado', 'Peixe grelhado', 'Ovos mexidos', 'Omelete', 'Lombo suíno assado', 'Atum', 'Lentilha cozida', 'Grão-de-bico cozido']
const DAIRY_SWAPS = [
  [/leite condensado/i, 'Leite condensado de coco'], [/creme de leite/i, 'Creme vegetal'], [/doce de leite/i, 'Doce de coco'],
  [/requeij[ãa]o/i, 'Requeijão vegetal'], [/iogurte/i, 'Iogurte de coco'],
  [/mussarela|muçarela|ricota|parmes[ãa]o|coalhada|queijo/i, 'Queijo vegetal'], [/manteiga/i, 'Manteiga ghee'],
  [/\bnata\b/i, 'Creme vegetal'], [/whey/i, 'Proteína vegetal'], [/leite/i, 'Leite de amêndoas'],
]
const extractGrams = (name) => { const m = name.match(/(\d+(?:[.,]\d+)?)\s*g\b/i); return m ? Math.round(parseFloat(m[1].replace(',', '.'))) : null }
function repairViolations(parsed, restrictions, excluded) {
  const violates = (food) => findMenuViolations([{ meals: [{ foods: [food] }] }], restrictions, excluded)
  const safePool = PROTEIN_FALLBACKS.filter(p => violates({ name: `${p} – 100g` }).length === 0)
  let protIdx = 0
  const nextProtein = () => safePool.length ? safePool[protIdx++ % safePool.length] : null
  for (const day of parsed?.days ?? []) {
    for (const meal of day?.meals ?? []) {
      for (const f of (meal?.foods ?? [])) {
        if (!f || typeof f.name !== 'string') continue
        const rules = violates(f).map(v => v.rule); if (rules.length === 0) continue
        const grams = extractGrams(f.name)
        if (rules.some(r => r === 'sem_lactose' || r === 'vegano') && !rules.some(r => r.startsWith('excluído'))) {
          const swap = DAIRY_SWAPS.find(([re]) => re.test(f.name))
          if (swap) { f.name = grams ? `${swap[1]} – ${grams}g` : swap[1]; continue }
        }
        const rep = nextProtein()
        if (rep) f.name = grams ? `${rep} – ${grams}g` : rep
      }
      meal.foods = (meal.foods ?? []).filter(f => violates(f).length === 0)
    }
    day.meals = (day.meals ?? []).filter(m => Array.isArray(m.foods) && m.foods.length > 0)
  }
  parsed.days = (parsed.days ?? []).filter(d => Array.isArray(d.meals) && d.meals.length > 0)
}

// ---------- casos ----------
let ok = 0, total = 0
const food = (name, kcal = 100) => ({ name, calories: kcal, protein: 5, carbs: 5, fat: 5 })
function check(label, cond) { total++; if (cond) { ok++; console.log('OK   | ' + label) } else { console.log('FALHA| ' + label) } }
const vio = (name, restr = ['sem_lactose'], excl = []) => findMenuViolations([{ meals: [{ foods: [food(name)] }] }], restr, excl)

// 1) Falsos positivos que DEVEM passar (sem_lactose)
check('Couve manteiga NÃO é laticínio', vio('Couve manteiga refogada – 1/2 xícara (100g)').length === 0)
check('Feijão manteiga NÃO é laticínio', vio('Feijão manteiga cozido – 1 concha (140g)').length === 0)
check('Manteiga de amendoim NÃO é laticínio', vio('Manteiga de amendoim – 1 colher (20g)').length === 0)
check('Leite de coco é OK', vio('Leite de coco – 1 xícara (200ml)').length === 0)
check('Queijo vegetal é OK', vio('Queijo vegetal – 2 fatias (40g)').length === 0)
check('Vitaminas (não trava em "minas")', vio('Vitaminas de banana – 1 copo (250ml)').length === 0)
check('Manteiga ghee é OK', vio('Pão com manteiga ghee – 1 fatia (50g)').length === 0)
check('Aveia sem glúten é OK (sem_gluten)', vio('Aveia sem glúten – 3 colheres (30g)', ['sem_gluten']).length === 0)

// 2) Laticínio/glúten/carne REAL deve ser barrado
check('Café com leite (vaca) barrado', vio('Café com leite – 1 xícara (200ml)').length > 0)
check('Queijo minas barrado', vio('Tapioca com queijo minas – 1 unidade (120g)').length > 0)
check('Manteiga (comum) barrada', vio('Pão com manteiga – 1 fatia (50g)').length > 0)
check('Iogurte natural barrado', vio('Iogurte natural – 1 pote (170g)').length > 0)

// 3) BLOQUEADOR da revisão: qualificador/composto NÃO pode isentar OUTRA categoria
check('Vegano: "Queijo vegano com bacon" -> bacon barrado', vio('Queijo vegano grelhado com bacon – 100g', ['vegano']).some(v => v.rule === 'vegano'))
check('Vegetariano: "Frango ao curry com ghee" -> frango barrado', vio('Frango ao curry com ghee – 150g', ['vegetariano']).length > 0)
check('Sem glúten: "Pão de trigo com ghee" -> trigo barrado', vio('Pão de trigo com ghee – 2 fatias (60g)', ['sem_gluten']).length > 0)
check('Vegano: "Salada com queijo vegetal" -> OK (sem carne)', vio('Salada com queijo vegetal – 1 prato (150g)', ['vegano']).length === 0)

// 4) Exclusões: acento, plural, hífen, meio-de-palavra
check('Excluir "frango" barra "Frango grelhado"', vio('Frango grelhado – 1 filé (150g)', [], ['frango']).length > 0)
check('Excluir "camarao" (sem acento) barra "Camarão grelhado"', vio('Camarão grelhado – 100g', [], ['camarao']).length > 0)
check('Excluir "pao" (sem acento) barra "Pão francês"', vio('Pão francês – 1 unidade (50g)', [], ['pao']).length > 0)
check('Excluir "frango" barra plural "Frangos assados"', vio('Frangos assados – 200g', [], ['frango']).length > 0)
check('Excluir "ovo" barra plural "Ovos mexidos"', vio('Ovos mexidos – 2 unidades (100g)', [], ['ovo']).length > 0)
check('Excluir "ovo" NÃO barra "Ovomaltine" (meio de palavra)', vio('Vitamina com ovomaltine – 250ml', [], ['ovo']).length === 0)
check('Excluir "couve flor" barra "Couve-flor" (hífen)', vio('Couve-flor refogada – 1 xícara (100g)', [], ['couve flor']).length > 0)
check('Excluir "leite" NÃO derruba "leite de coco"', vio('Arroz com leite de coco – 1 xícara (150g)', ['sem_lactose'], ['leite']).length === 0)
check('Excluir "leite" DERRUBA "leite integral"', vio('Leite integral – 1 copo (200ml)', [], ['leite']).length > 0)

// 5) Reparo gracioso: cenário Verônica (sem lactose + excluir frango)
const menu = {
  days: [
    { day: 'Segunda', meals: [
      { type: 'Café', foods: [food('Café com leite – 1 xícara (200ml)', 120), food('Pão integral – 2 fatias (50g)', 130)] },
      { type: 'Almoço', foods: [food('Frango grelhado – 1 filé (150g)', 250), food('Arroz – 1 xícara (150g)', 200)] },
    ] },
    { day: 'Terça', meals: [
      { type: 'Almoço', foods: [food('Frango ao curry – 150g', 260), food('Feijão – 1 concha (140g)', 150)] },
    ] },
  ],
}
repairViolations(menu, ['sem_lactose'], ['frango'])
check('Reparo zera violações', findMenuViolations(menu.days, ['sem_lactose'], ['frango']).length === 0)
check('Reparo mantém os 2 dias', menu.days.length === 2)
check('Reparo elimina o frango', JSON.stringify(menu).toLowerCase().includes('frango') === false)
check('Reparo troca o "café com leite" puro', !menu.days[0].meals[0].foods.some(f => /caf[ée] com leite –/i.test(f.name)))
check('Reparo preserva calorias do almoço (~450)', Math.abs(menu.days[0].meals[1].foods.reduce((s, f) => s + f.calories, 0) - 450) < 5)

// 6) Reparo rotaciona a proteína (não repete a mesma em todos os dias)
const menu2 = { days: ['Seg', 'Ter', 'Qua', 'Qui'].map(d => ({ day: d, meals: [{ type: 'Almoço', foods: [food('Frango grelhado – 1 filé (150g)', 250)] }] })) }
repairViolations(menu2, ['sem_lactose'], ['frango'])
const proteinas = menu2.days.map(d => d.meals[0].foods[0].name.split('–')[0].trim())
check('Reparo rotaciona proteínas (>=2 distintas em 4 dias)', new Set(proteinas).size >= 2)
check('Reparo rotacionado zera violações', findMenuViolations(menu2.days, ['sem_lactose'], ['frango']).length === 0)

console.log(`\n${ok === total ? '✅ VALIDAÇÃO v2 + REPARO OK' : '❌ FALHAS'} (${ok}/${total})`)
process.exit(ok === total ? 0 : 1)
