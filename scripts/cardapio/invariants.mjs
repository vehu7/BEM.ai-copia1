// ─────────────────────────────────────────────────────────────────────────────
// ORÁCULO DE INVARIANTES DO CARDÁPIO (fonte única de asserções das 2 camadas).
//
// É um verificador INDEPENDENTE do pós-processamento de gemini.ts: usa listas e
// lógica próprias (não importa as funções internas), de propósito — assim ele pega
// REGRESSÃO de produção (se uma guarda parar de remover algo, o oráculo acusa).
//
// Separa invariantes DUROS (têm que valer SEMPRE — falha = bug) de metas
// BEST-EFFORT (o código tenta dentro do orçamento calórico; reportadas, não falham).
// ─────────────────────────────────────────────────────────────────────────────

export const norm = (s) =>
  String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim()

// Nome-base do alimento (antes da medida) — para detectar repetição/lista de compras.
const baseName = (f) => norm(String(typeof f === 'object' && f ? (f.name ?? '') : f).split('–')[0].split('(')[0])

// Compostos vegetais que CONTÊM um radical "proibido" mas são permitidos.
const SAFE_COMPOUNDS = [
  'leite de coco', 'leite de amendoa', 'leite de aveia', 'leite de soja', 'leite de castanha',
  'leite de arroz', 'leite de amendoim', 'leite vegetal', 'couve manteiga', 'couve flor',
  'feijao manteiga', 'manteiga de amendoim', 'manteiga ghee', 'queijo vegetal', 'queijo vegano',
  'iogurte de coco', 'iogurte vegetal', 'requeijao vegetal', 'creme vegetal', 'doce de coco',
  'proteina vegetal', 'leite condensado de coco',
].map(norm)
const PLANT_QUALIFIERS = ['sem lactose', 'zero lactose', 'sem leite', 'vegano', 'vegana', 'vegetal', 'de coco', 'de amendoa', 'de aveia', 'de soja', 'de castanha', 'de amendoim', 'tofu', 'ghee'].map(norm)
const GLUTEN_QUALIFIERS = ['sem gluten', 'gluten free'].map(norm)

// Denylists INDEPENDENTES do oráculo (núcleo realista de cada restrição). Mais amplas que as de
// produção DE PROPÓSITO: o oráculo é o "ground truth" e acusa quando produção deixa algo passar.
const DAIRY = ['leite', 'iogurte', 'queijo', 'requeij', 'creme de leite', 'manteiga', 'leite condensado', 'doce de leite', 'whey', 'nata', 'coalhada', 'ricota', 'mussarela', 'mucarela', 'muzarela', 'parmes', 'catupiry', 'cream cheese', 'provolone', 'gorgonzola', 'cheddar', 'cottage', 'gouda', 'brie', 'coalho', 'queijo prato', 'achocolatado', 'chantilly', 'bechamel', 'molho branco', 'leite ninho', 'iogurte grego'].map(norm)
const MEAT = ['frango', 'carne', 'bovina', 'porco', 'suino', 'peixe', 'salmao', 'tilapia', 'sardinha', 'atum', 'camarao', 'presunto', 'bacon', 'linguica', 'salsicha', 'frutos do mar', 'patinho', 'coxao', 'alcatra', 'file de frango', 'maminha', 'picanha', 'cupim', 'mortadela', 'salame', 'lombo', 'pernil', 'bisteca', 'costela', 'fraldinha', 'acem', 'musculo', 'figado', 'coxa', 'sobrecoxa', 'merluza', 'bacalhau', 'pescada', 'lula', 'polvo', 'mexilhao'].map(norm)
const EGG = ['ovo', 'omelete', 'clara de ovo', 'gema', 'mexido de ovo'].map(norm) // proíbe só vegano (ovo é ok p/ vegetariano)
const ANIMAL_DERIV = ['gelatina', 'maionese', 'mel'].map(norm) // gelatina/mel: vegano E vegetariano; maionese: vegano (ovo)
// Compostos VEGETAIS que contêm "carne/leite" mas são liberados (não falso-positivo).
const VEG_SAFE = ['carne de soja', 'carne vegetal', 'carne moida de soja', 'proteina de soja', 'carne de jaca', 'maionese vegana', 'maionese vegetal'].map(norm)
const GLUTEN = ['trigo', 'pao frances', 'pao de forma', 'pao integral', 'macarrao', 'massa ', 'espaguete', 'talharim', 'penne', 'nhoque', 'lasanha', 'pizza', 'panqueca', 'bolacha', 'biscoito', 'torrada', 'bolo', 'pastel', 'esfiha', 'coxinha', 'empada', 'cevada', 'centeio', 'malte', 'cuscuz de trigo', 'farinha de trigo', 'farinha de rosca', 'aveia', 'cerveja'].map(norm)
const GLUTEN_SAFE = ['pao de queijo', 'pao de tapioca', 'panqueca de banana', 'panqueca de tapioca', 'panqueca de aveia', 'massa de tapioca'].map(norm)
const SUGAR = ['acucar', 'rapadura', 'melado', 'refrigerante', 'refri ', 'brigadeiro', 'pudim', 'sorvete', 'pirulito', 'bombom', 'chocolate ao leite', 'leite condensado', 'geleia', 'bolo', 'biscoito recheado', 'suco', 'doce de leite', 'goiabada', 'pacoca', 'cocada', 'quindim', 'beijinho', 'mousse', 'manjar', 'arroz doce', 'canjica', 'curau', 'marmelada', 'bananada', 'nutella'].map(norm)
const WHITE = ['pao branco', 'pao frances', 'farinha branca', 'arroz branco'].map(norm)
const FRITURA = ['frito', 'frita', 'fritura', 'empanado', 'empanada', 'milanesa', 'nuggets'].map(norm)
// Sinônimos de corte para exclusão composta (ex.: excluir "carne de porco" deve pegar lombo/pernil/bisteca).
const PORK_SYN = ['porco', 'suino', 'suina', 'lombo', 'pernil', 'bisteca', 'costela suina', 'copa', 'panceta', 'bacon', 'lombo suino']
const inVegSafe = (n) => VEG_SAFE.some((c) => n.includes(c))
const ATIPICO = ['homus', 'hummus', 'falafel', 'shawarma', 'sushi', 'sashimi', 'temaki', 'teriyaki', 'edamame', 'wrap', 'tortilla', 'taco', 'burrito', 'guacamole', 'hamburguer de lentilha', 'hamburguer vegetal', 'hamburguer de grao', 'cuscuz marroquino', 'kale', 'quinoa', 'tempeh', 'seitan', 'misso', 'shoyu', 'pasta de grao', 'caril', 'curry', 'overnight', 'smoothie', 'porridge', 'tahine', 'tahini', 'chia pudding', 'poke', 'bowl', 'cevada', 'berry', 'berries', 'blueberry', 'cranberry', 'mirtilo', 'mirtilos', 'couve de bruxelas', 'couves de bruxelas', 'avela', 'avelas', 'alcachofra', 'aspargo', 'aspargos', 'espargo', 'espargos', 'farro', 'damasco seco', 'tamara', 'macadamia',
  // versões fit/estrangeiras de staples (têm palavra brasileira mas são atípicas)
  'arroz negro', 'arroz selvagem', 'arroz basmati', 'arroz arboreo', 'arroz jasmim', 'arroz de couve', 'arroz de brocolis', 'de couve flor', 'azuki', 'macarrao de abobrinha', 'macarrao de pupunha', 'lasanha de berinjela', 'parmegiana de berinjela', 'shirataki', 'konjac', 'pao low carb', 'pao nuvem', 'risoto', 'cevadinha', 'tabule', 'ratatouille', 'pesto', 'bulgur', 'gnocchi', 'waffle'].map(norm)

const hasPlantQual = (n) => PLANT_QUALIFIERS.some((q) => n.includes(q))
const inSafeCompound = (n, kw) => SAFE_COMPOUNDS.some((c) => c.includes(kw) && n.includes(c))

// Casa termo como palavra (fronteira à esquerda, aceita plural), evitando casar no meio (ovo != ovomaltine).
function wordHit(haystack, needle) {
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

function eachFood(menu, fn) {
  for (const day of menu?.days ?? []) for (const meal of day?.meals ?? []) for (const f of meal?.foods ?? []) fn(f, meal, day)
}

const daySig = (d) => (d?.meals ?? []).flatMap((m) => (m?.foods ?? []).map((f) => baseName(f))).sort().join('|')

// ── Verificação principal ────────────────────────────────────────────────────
// spec: { restrictions, excluded, mustKeep, expectedEvents, glp1, bariatric, lowCarb,
//         diabetes, metabolica, country, vegan, target, highCalDays, priority,
//         protFloor, fiberFloor, allowAtipico }
export function checkMenu(menu, spec = {}) {
  const hard = []   // falha = bug
  const soft = []   // best-effort (reporta, não falha)
  const H = (cond, msg) => { if (!cond) hard.push(msg) }
  const S = (cond, msg) => { if (!cond) soft.push(msg) }

  const days = menu?.days ?? []

  // 1) 7 dias, nenhum vazio
  H(days.length === 7, `esperava 7 dias, veio ${days.length}`)
  for (const d of days) H((d?.meals?.length ?? 0) > 0, `dia "${d?.day}" sem refeições`)

  // 2) dias únicos (variedade)
  const sigs = days.map(daySig)
  H(new Set(sigs).size === days.length, `dias repetidos: ${new Set(sigs).size}/${days.length} únicos`)

  // 3) totais = soma real (refeição e alimentos)
  for (const d of days) for (const m of d.meals ?? []) {
    const fs = (m.foods ?? []).filter((f) => typeof f === 'object' && f)
    const sum = (k) => Math.round(fs.reduce((s, f) => s + (Number(f[k]) || 0), 0) * 10) / 10
    H(Math.round(Number(m.calories)) === Math.round(sum('calories')), `[${d.day}/${m.type}] kcal total ${m.calories} != soma ${sum('calories')}`)
    H(Math.abs(Number(m.protein) - sum('protein')) <= 0.2, `[${d.day}/${m.type}] proteína total ${m.protein} != soma ${sum('protein')}`)
  }

  // 4) estrutura de refeições (tipos por dia, na ordem)
  if (spec.expectedEvents) {
    for (const d of days) {
      const types = (d.meals ?? []).map((m) => m.type)
      H(types.length === spec.expectedEvents.length && types.every((t, i) => norm(t) === norm(spec.expectedEvents[i])),
        `[${d.day}] estrutura ${JSON.stringify(types)} != esperado ${JSON.stringify(spec.expectedEvents)}`)
    }
  }

  // 5) restrições (oráculo independente)
  const r = new Set(spec.restrictions ?? [])
  eachFood(menu, (f, m, d) => {
    const n = baseName(f)
    const tag = `[${d.day}/${m.type}] "${typeof f === 'object' ? f.name : f}"`
    const safe = inVegSafe(n) // carne de soja / maionese vegana etc.
    const melHit = wordHit(n, 'mel') // fronteira: pega "com mel" no fim, não "melancia"/"melado"
    const dairyHit = DAIRY.find((kw) => n.includes(kw) && !inSafeCompound(n, kw) && !hasPlantQual(n))
    const meatHit = !safe && MEAT.find((kw) => wordHit(n, kw))
    const eggHit = !safe && !hasPlantQual(n) && EGG.find((kw) => n.includes(kw))
    const ghee = n.includes('ghee')
    const derivHit = !safe && (n.includes('gelatina') || n.includes('maionese') || melHit || ghee)
    const glutenHit = !GLUTEN_SAFE.some((c) => n.includes(c)) && GLUTEN.find((kw) => n.includes(kw) && !GLUTEN_QUALIFIERS.some((q) => n.includes(q)))
    if (r.has('sem_lactose')) H(!dairyHit, `${tag} viola sem_lactose (${dairyHit})`)
    if (r.has('vegetariano')) { H(!meatHit, `${tag} viola vegetariano (${meatHit})`); H(!(n.includes('gelatina') || melHit), `${tag} viola vegetariano-derivado animal`) }
    if (r.has('vegano')) { H(!meatHit, `${tag} viola vegano-carne (${meatHit})`); H(!dairyHit, `${tag} viola vegano-laticínio (${dairyHit})`); H(!eggHit, `${tag} viola vegano-ovo (${eggHit})`); H(!derivHit, `${tag} viola vegano-derivado animal`) }
    if (r.has('sem_gluten')) H(!glutenHit, `${tag} viola sem_gluten (${glutenHit})`)
    if (r.has('diabetes')) { const s = [...SUGAR, ...WHITE].find((kw) => n.includes(kw)) || (melHit && 'mel'); H(!s, `${tag} viola diabetes (${s})`) }
    if (spec.metabolica || r.has('metabolica')) {
      const s = SUGAR.find((kw) => n.includes(kw) && !inSafeCompound(n, kw)) || (melHit && 'mel')
      const fr = FRITURA.find((kw) => n.includes(kw))
      H(!s, `${tag} viola metabólica-açúcar (${s})`); H(!fr, `${tag} viola metabólica-fritura (${fr})`)
    }
    if (r.has('low_carb')) { const s = SUGAR.find((kw) => n.includes(kw)) || (melHit && 'mel'); H(!s, `${tag} viola low_carb-açúcar (${s})`) }
  })

  // 6) exclusões do usuário + falso-positivo (mustKeep deve permanecer).
  // Expande a exclusão: sinônimos de corte de porco e plural irregular (pão->pães, limão->limões).
  const expandExcluded = (ex) => {
    const out = new Set([ex])
    if (ex.endsWith('ao')) { const root = ex.slice(0, -2); out.add(root + 'aes'); out.add(root + 'oes'); out.add(root + 'aos') }
    if (/porco|suino/.test(ex)) PORK_SYN.forEach((s) => out.add(norm(s)))
    return [...out].filter((e) => e.length >= 3)
  }
  for (const exRaw of (spec.excluded ?? []).map(norm).filter((e) => e.length >= 3)) {
    const needles = expandExcluded(exRaw)
    eachFood(menu, (f, m, d) => {
      const n = baseName(f)
      const hit = needles.find((nd) => wordHit(n, nd) && !inSafeCompound(n, nd) && !inVegSafe(n))
      if (hit) hard.push(`[${d.day}/${m.type}] "${typeof f === 'object' ? f.name : f}" deveria estar excluído (${exRaw}${hit !== exRaw ? ' via ' + hit : ''})`)
    })
  }
  for (const keep of (spec.mustKeep ?? [])) {
    let found = false
    eachFood(menu, (f) => { if (baseName(f).includes(norm(keep))) found = true })
    S(found, `mustKeep "${keep}" não apareceu (ok se a IA não usou; só alerta)`)
  }

  // 7) low_carb: teto de 100g de carbo/dia
  if (spec.lowCarb || r.has('low_carb')) {
    for (const d of days) {
      const carb = (d.meals ?? []).reduce((s, m) => s + (Number(m.carbs) || 0), 0)
      H(carb <= 100.5, `[${d.day}] carbo ${Math.round(carb)}g > teto 100g (low_carb)`)
    }
  }

  // 8) teto de kcal por refeição (GLP-1 400 / bariátrica 200). Decisão: PROTEÍNA VENCE o teto —
  // a parte NÃO-proteica nunca pode estourar o teto; a refeição só pode passar por causa da proteína.
  const cap = spec.bariatric ? 200 : spec.glp1 ? 400 : 0
  if (cap) {
    for (const d of days) for (const m of d.meals ?? []) {
      const fs = (m.foods ?? []).filter((f) => typeof f === 'object' && f)
      const nonProt = fs.filter((f) => (Number(f.protein) || 0) < 8).reduce((s, f) => s + (Number(f.calories) || 0), 0)
      H(nonProt <= cap + 0.5, `[${d.day}/${m.type}] kcal não-proteica ${Math.round(nonProt)} > teto ${cap}`)
      S(Number(m.calories) <= cap + 0.5, `[${d.day}/${m.type}] ${m.calories} kcal > teto ${cap} (ok se for proteína)`)
    }
  }

  // 9) atípicos brasileiros + tofu (país = Brasil)
  if (!spec.allowAtipico && /brasil/i.test(spec.country ?? 'Brasil')) {
    eachFood(menu, (f, m, d) => {
      const n = baseName(f)
      const a = ATIPICO.find((kw) => n.includes(kw))
      H(!a, `[${d.day}/${m.type}] prato atípico no Brasil: ${a} ("${typeof f === 'object' ? f.name : f}")`)
      if (!spec.vegan) H(!n.includes('tofu'), `[${d.day}/${m.type}] tofu fora de dieta vegana ("${typeof f === 'object' ? f.name : f}")`)
    })
  }

  // 9b) CAFÉ DA MANHÃ sem carne vermelha / sardinha / atum / salmão (regra da nutricionista)
  const BREAKFAST_BANNED = ['carne', 'bovina', 'bife', 'patinho', 'alcatra', 'picanha', 'fraldinha', 'maminha', 'cupim', 'costela', 'porco', 'suino', 'lombo', 'pernil', 'bisteca', 'bacon', 'linguica', 'presunto', 'mortadela', 'salame', 'sardinha', 'atum', 'salmao'].map(norm)
  const isCafe = (t) => norm(t).includes('cafe')
  for (const d of menu?.days ?? []) for (const m of (d.meals ?? [])) {
    if (!isCafe(m.type)) continue
    for (const f of (m.foods ?? [])) {
      const n = baseName(f)
      if (VEG_SAFE.some((c) => n.includes(c))) continue
      const b = BREAKFAST_BANNED.find((kw) => n.includes(kw))
      H(!b, `[${d.day}/Café] carne/atum no café da manhã: ${b} ("${typeof f === 'object' ? f.name : f}")`)
    }
  }

  // 9c) ALLOWLIST: termos atípicos não-listados que a allowlist deve ter trocado (risoto, cevadinha...)
  if (spec.mustNotContain) for (const term of spec.mustNotContain.map(norm)) {
    eachFood(menu, (f, m, d) => {
      if (baseName(f).includes(term)) hard.push(`[${d.day}/${m.type}] allowlist falhou (devia trocar "${term}"): "${typeof f === 'object' ? f.name : f}"`)
    })
  }

  // 10) lista de compras coerente (todo item existe em algum alimento final)
  const bases = new Set()
  eachFood(menu, (f) => bases.add(baseName(f)))
  for (const item of menu?.shoppingList ?? []) {
    const it = norm(item)
    if (it.length < 2) continue
    const ok = [...bases].some((b) => b.includes(it) || it.includes(b))
    S(ok, `lista de compras cita "${item}" que não bate com nenhum alimento final`)
  }

  // ── BEST-EFFORT ──────────────────────────────────────────────────────────
  if (spec.protFloor) for (const d of days) {
    const prot = (d.meals ?? []).reduce((s, m) => s + (Number(m.protein) || 0), 0)
    S(prot >= spec.protFloor * 0.92, `[${d.day}] proteína ${Math.round(prot)}g < piso ${spec.protFloor}g×0.92`)
  }
  // DURO: proteína diária não pode ser destruída pelo teto por refeição (decisão: proteína vence o teto).
  if (spec.protFloorHard) for (const d of days) {
    const prot = (d.meals ?? []).reduce((s, m) => s + (Number(m.protein) || 0), 0)
    H(prot >= spec.protFloorHard * 0.9, `[${d.day}] proteína ${Math.round(prot)}g < piso clínico ${spec.protFloorHard}g (teto cortou proteína)`)
  }
  if (spec.fiberFloor) for (const d of days) {
    const fib = (d.meals ?? []).reduce((s, m) => s + (Number(m.fiber) || 0), 0)
    S(fib >= spec.fiberFloor * 0.9, `[${d.day}] fibra ${Math.round(fib)}g < piso ${spec.fiberFloor}g×0.9`)
  }
  // toda refeição com fonte de proteína (>=8g) — fim do "café só de pão"
  for (const d of days) for (const m of d.meals ?? []) {
    const hasProt = (m.foods ?? []).some((f) => (Number(f.protein) || 0) >= 8)
    S(hasProt, `[${d.day}/${m.type}] sem fonte de proteína densa (>=8g)`)
  }
  // refeição mais calórica escolhida
  if (spec.priority) {
    const want = spec.priority === 'cafe_jantar' ? ['cafe', 'jantar'] : [spec.priority]
    const key = (t) => { const x = norm(t); return x.includes('almoco') ? 'almoco' : x.includes('jantar') ? 'jantar' : (x.includes('lanche') || x.includes('ceia')) ? 'lanche' : 'cafe' }
    for (const d of days) {
      const meals = (d.meals ?? []).filter((m) => m.foods?.length)
      if (meals.length < 2) continue
      const tg = meals.filter((m) => want.includes(key(m.type)))
      const ot = meals.filter((m) => !want.includes(key(m.type)))
      if (!tg.length || !ot.length) continue
      const minT = Math.min(...tg.map((m) => Number(m.calories) || 0))
      const maxO = Math.max(...ot.map((m) => Number(m.calories) || 0))
      S(minT >= maxO, `[${d.day}] prioridade ${spec.priority}: refeição-alvo ${minT} < maior outra ${maxO}`)
    }
  }
  // meta calórica do dia (banda)
  if (spec.target) for (const d of days) {
    const tgt = (spec.highCalDays ?? []).includes(d.day) ? spec.target * 1.2 : spec.target
    const tot = (d.meals ?? []).reduce((s, m) => s + (Number(m.calories) || 0), 0)
    S(tot >= tgt * 0.8 && tot <= tgt * 1.15, `[${d.day}] dia ${Math.round(tot)} kcal fora da banda de ${Math.round(tgt)} (0.8–1.15)`)
  }

  return { hard, soft, pass: hard.length === 0 }
}
