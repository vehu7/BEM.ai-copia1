import type { UserProfile, MealStructure, MenuPreferences } from '@/types'

/** Converte as preferências persistidas do cardápio nas options de generateWeeklyMenu.
 * Usado pelas gerações automáticas (cadastro/boot) para respeitar o que o usuário já escolheu. */
export function menuPreferencesToOptions(prefs?: MenuPreferences | null): {
  excludedFoods?: string[]
  country?: string
  highCalorieDays?: string[]
  fastingProtocol?: string
  highCalMealPriority?: string
  mealStructure?: MealStructure
} | undefined {
  if (!prefs) return undefined
  const frac = prefs.mealStructureMode === 'fracionado'
  return {
    excludedFoods: prefs.excludedFoods,
    country: prefs.country,
    highCalorieDays: prefs.highCalorieDays,
    fastingProtocol: prefs.fastingProtocol ?? undefined,
    highCalMealPriority: prefs.highCalMealPriority,
    mealStructure: prefs.mealStructureMode
      ? { includeMorningSnack: frac, includeAfternoonSnack: frac, includeSupper: frac }
      : undefined,
  }
}

/**
 * Calcula metas nutricionais e de hidratação personalizadas via IA.
 * Considera medicação GLP-1, objetivo, atividade, sono e preferências.
 */
export async function calculateAITargets(data: {
  name: string
  age: number
  gender: string
  height: number
  currentWeight: number
  targetWeight: number
  goal: string
  activityLevel: string
  medication: string
  medicationDosage?: string
  hadBariatricSurgery?: boolean
  dietaryPreferences: string[]
  averageSleepHours: number
}): Promise<{
  bmr: number
  tdee: number
  targetCalories: number
  targetProtein: number
  targetCarbs: number
  targetFat: number
  targetFiber: number
  targetWater: number
  explanation: string
}> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('OpenAI API key não configurada')

  const goalMap: Record<string, string> = {
    perder_peso: 'perder peso com déficit calórico',
    ganhar_massa: 'ganhar massa muscular com superávit calórico',
    manter_peso: 'manter o peso atual',
    saude_geral: 'melhorar saúde geral e bem-estar'
  }
  const activityMap: Record<string, string> = {
    sedentario: 'sedentário (pouco ou nenhum exercício)',
    leve: 'levemente ativo (1-3 dias/semana)',
    moderado: 'moderadamente ativo (3-5 dias/semana)',
    intenso: 'muito ativo (6-7 dias/semana)',
    muito_intenso: 'extremamente ativo / atleta'
  }
  // Bariátrica e GLP-1 são INDEPENDENTES (paciente pode ter ambos)
  const isGlp1 = data.medication !== 'nenhum'
  const isBariatric = !!data.hadBariatricSurgery
  const medicationInfo = isGlp1
    ? `USO DE MEDICAÇÃO GLP-1: ${data.medication}${data.medicationDosage ? ` — ${data.medicationDosage}` : ''}. Este medicamento suprime fortemente o apetite, retarda o esvaziamento gástrico e reduz drasticamente a ingestão calórica espontânea. Considere obrigatoriamente: (1) meta calórica menor e segura (mínimo 900 kcal); (2) proteína elevada (≥1.8g/kg) para preservar massa muscular; (3) fibras elevadas (≥28g) para saúde digestiva; (4) meta de água +500ml vs pessoa sem medicação (hidratação crítica para reduzir náuseas).`
    : 'Sem uso de medicação para controle de peso.'
  const bariatricInfo = isBariatric
    ? `CIRURGIA BARIÁTRICA prévia. Pós-bariátrico exige: (1) meta calórica reduzida e segura (mínimo 900 kcal, geralmente entre 900 e 1400 kcal/dia conforme tempo de pós-op); (2) proteína prioritária e obrigatória (≥1.5g/kg, alvo entre 60-90g/dia em pequenas refeições frequentes); (3) volume total reduzido (5-6 refeições muito pequenas); (4) hidratação fracionada (não beber junto com refeição) — água total +400ml para evitar desidratação; (5) fibras moderadas para evitar gases e cólicas; (6) ZERO açúcar refinado e gorduras saturadas para prevenir síndrome de dumping; (7) suplementação implícita (B12, ferro, cálcio, vitamina D — orientar a procurar nutricionista).`
    : ''

  const prompt = `Você é um nutricionista e personal trainer brasileiro especializado em prescrição nutricional personalizada.

DADOS DO USUÁRIO:
- Nome: ${data.name}
- Idade: ${data.age} anos | Sexo: ${data.gender}
- Altura: ${data.height} cm | Peso atual: ${data.currentWeight} kg | Peso desejado: ${data.targetWeight} kg
- Objetivo: ${goalMap[data.goal] || data.goal}
- Atividade: ${activityMap[data.activityLevel] || data.activityLevel}
- Sono médio: ${data.averageSleepHours} horas/noite
- Restrições alimentares: ${data.dietaryPreferences.length > 0 ? data.dietaryPreferences.join(', ') : 'nenhuma'}
- ${medicationInfo}
${bariatricInfo ? `- ${bariatricInfo}` : ''}

TAREFA: Calcule as metas nutricionais e de hidratação diárias PERSONALIZADAS.
Use Mifflin-St Jeor para BMR, aplique fator de atividade para TDEE, ajuste por objetivo e medicação.
Meta de água: base 35ml/kg + ajuste atividade + ajuste GLP-1 se aplicável.

Retorne APENAS JSON válido (sem markdown):
{
  "bmr": inteiro,
  "tdee": inteiro,
  "targetCalories": inteiro,
  "targetProtein": inteiro (gramas),
  "targetCarbs": inteiro (gramas),
  "targetFat": inteiro (gramas),
  "targetFiber": inteiro (gramas),
  "targetWater": inteiro (ml),
  "explanation": "1-2 frases resumindo as principais escolhas"
}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as any).error?.message || 'Erro na API do OpenAI')
  }

  const result = await response.json()
  return JSON.parse(result.choices[0].message.content)
}

/**
 * Comprime uma imagem base64 para reduzir tamanho antes de enviar à API
 */
function compressImage(imageData: string, maxWidth = 1024, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const ratio = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const compressed = canvas.toDataURL('image/jpeg', quality)
      resolve(compressed.split(',')[1])
    }
    img.onerror = () => {
      const base64 = imageData.includes(',') ? imageData.split(',')[1] : imageData
      resolve(base64)
    }
    img.src = imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`
  })
}

/**
 * Usa OpenAI para estimar valores nutricionais a partir do nome e marca do produto
 */
async function estimateNutritionByName(name: string, brand: string): Promise<{
  portion: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sodium: number
  sugar: number
  saturatedFat: number
  omega3: number
  cholesterol: number
}> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('OpenAI API key não configurada')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Você é nutricionista especializado em produtos alimentícios brasileiros. Forneça valores nutricionais reais com base na tabela TACO/IBGE e rótulos de produtos brasileiros. NUNCA retorne 0 para calorias. Se não souber os valores exatos, estime com base em produtos similares.`
        },
        {
          role: 'user',
          content: `Produto: ${name}${brand ? ` (${brand})` : ''}\nForneça a tabela nutricional por porção típica deste produto brasileiro.\nRetorne JSON: {"portion":"porção ex: 100g","calories":número,"protein":número,"carbs":número,"fat":número,"fiber":número,"sodium":mg,"sugar":g,"saturatedFat":g,"omega3":g,"cholesterol":mg}`
        }
      ],
      max_tokens: 200
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as any).error?.message || 'Erro na API do OpenAI')
  }

  const data = await response.json()
  return JSON.parse(data.choices[0].message.content)
}

/**
 * Busca produto pelo EAN na Cosmos (Bluesoft) e obtém nutrição via OpenAI
 */
export async function fetchProductByCosmos(barcode: string): Promise<{
  name: string
  portion: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sodium: number
  sugar: number
  saturatedFat: number
  omega3: number
  cholesterol: number
  barcode: string
}> {
  const cosmosToken = import.meta.env.VITE_COSMOS_TOKEN
  if (!cosmosToken || cosmosToken === 'SEU_TOKEN_COSMOS_AQUI') {
    throw new Error('Token da Cosmos não configurado')
  }

  const cosmosResponse = await fetch(
    `https://api.cosmos.bluesoft.com.br/gtins/${barcode}`,
    {
      headers: {
        'X-Cosmos-Token': cosmosToken,
        'Content-Type': 'application/json',
      }
    }
  )

  if (cosmosResponse.status === 404) throw new Error('Produto não encontrado')
  if (!cosmosResponse.ok) throw new Error('Erro ao consultar Cosmos')

  const cosmosData = await cosmosResponse.json()

  const name = cosmosData.description || cosmosData.gtin_name || 'Produto'
  const brand = cosmosData.brand?.name || ''

  const nutrition = await estimateNutritionByName(name, brand)

  const calories = Math.round(Number(nutrition.calories) || 0)
  if (calories === 0) throw new Error('Não foi possível obter dados nutricionais')

  return {
    name: brand ? `${name} (${brand})` : name,
    portion: String(nutrition.portion || '100g'),
    calories,
    protein: Math.round(Number(nutrition.protein || 0) * 10) / 10,
    carbs: Math.round(Number(nutrition.carbs || 0) * 10) / 10,
    fat: Math.round(Number(nutrition.fat || 0) * 10) / 10,
    fiber: Math.round(Number(nutrition.fiber || 0) * 10) / 10,
    sodium: Math.round(Number(nutrition.sodium || 0)),
    sugar: Math.round(Number(nutrition.sugar || 0) * 10) / 10,
    saturatedFat: Math.round(Number(nutrition.saturatedFat || 0) * 10) / 10,
    omega3: Math.round(Number(nutrition.omega3 || 0) * 100) / 100,
    cholesterol: Math.round(Number(nutrition.cholesterol || 0)),
    barcode
  }
}

/**
 * Usa OpenAI Vision para extrair o número EAN de uma foto de código de barras.
 * Retorna apenas o número — o produto é então buscado via Cosmos.
 */
export async function readEANFromPhoto(imageData: string): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('OpenAI API key não configurada')

  const base64 = await compressImage(imageData, 1600, 0.9)

  const prompt = `Observe esta imagem e encontre o código de barras EAN.
Leia os números impressos abaixo (ou acima) das listras do código de barras.
Retorne APENAS os dígitos numéricos do EAN, sem espaços, sem traços, sem texto adicional.
Exemplo de resposta: 7891000315507
Se não conseguir ler o número, retorne: ERRO`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}`, detail: 'high' } }
        ]
      }],
      max_tokens: 50
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as any).error?.message || 'Erro na API do OpenAI')
  }

  const data = await response.json()
  const text = (data.choices[0].message.content as string).trim().replace(/\D/g, '')

  if (!text || text.length < 8) throw new Error('Não foi possível ler o código de barras na foto')

  return text
}

/**
 * Analisa uma foto de alimento e retorna TODOS os alimentos identificados usando OpenAI Vision
 */
export async function analyzeFoodPhoto(imageData: string, _user: UserProfile | null): Promise<Array<{
  name: string
  portion: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sodium: number
  sugar: number
  saturatedFat: number
  omega3: number
  cholesterol: number
}>> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('OpenAI API key não configurada')

  const base64 = await compressImage(imageData)

  const prompt = `Você é um nutricionista especializado em alimentos brasileiros.
Analise esta foto e identifique TODOS os alimentos visíveis.
Retorne APENAS um array JSON válido (sem markdown, sem texto adicional):
[
  {
    "name": "Nome do alimento em português",
    "portion": "porção estimada (ex: 100g, 1 unidade, 1 prato)",
    "calories": número,
    "protein": gramas de proteína,
    "carbs": gramas de carboidratos,
    "fat": gramas de gordura total,
    "fiber": gramas de fibra,
    "sodium": mg de sódio,
    "sugar": gramas de açúcar,
    "saturatedFat": gramas de gordura saturada,
    "omega3": gramas de ômega-3,
    "cholesterol": mg de colesterol
  }
]
Liste TODOS os componentes visíveis separadamente (ex: se for um prato, liste arroz, feijão, frango, salada, etc. individualmente).
Se houver apenas um alimento, retorne um array com um único objeto.
Se não conseguir identificar com certeza, estime com base no que parecer mais provável.
Use valores baseados na tabela TACO/IBGE para alimentos brasileiros.`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}`, detail: 'low' } }
        ]
      }],
      max_tokens: 800
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as any).error?.message || 'Erro na API do OpenAI')
  }

  const data = await response.json()
  const text = (data.choices[0].message.content as string).trim()
  const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const parsed = JSON.parse(jsonText)

  if (!Array.isArray(parsed)) return [parsed]
  return parsed
}

// ── Cardápio semanal: helpers de robustez ────────────────────────────────────

/** Chamada ao OpenAI com timeout + retry; devolve JSON parseado ou lança erro.
 *  Usa STREAMING (SSE) quando o ambiente suporta (produção/_ab real): assim a UI recebe o
 *  progresso REAL via onStream (alimentos/dias chegando) e o timeout é por INATIVIDADE — só
 *  aborta se a rede travar ~45s sem dado, em vez de um teto fixo que mataria geração lenta porém viva.
 *  No harness (stub de fetch sem body) cai no caminho JSON normal, sem mudar a validação. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callOpenAIMenuJson(apiKey: string, prompt: string, maxTokens: number, attempts = 3, onStream?: (s: { chars: number; mealsDone: number; daysDone: number }) => void): Promise<any> {
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    const ctrl = new AbortController()
    let timer = setTimeout(() => ctrl.abort(), 45000) // inatividade: ~45s sem nenhum token = rede travada
    const bump = () => { clearTimeout(timer); timer = setTimeout(() => ctrl.abort(), 45000) }
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'gpt-4o', response_format: { type: 'json_object' }, messages: [{ role: 'user', content: prompt }], max_tokens: maxTokens, stream: true }),
        signal: ctrl.signal,
      })
      if (!response.ok) throw new Error(`OpenAI HTTP ${response.status}: ${(await response.text().catch(() => '')).slice(0, 200)}`)

      let content = ''
      let finishReason: string | null = null
      const body = response.body
      if (body && typeof body.getReader === 'function') {
        // STREAMING: lê os eventos SSE, acumula delta.content e reporta o progresso real.
        const reader = body.getReader()
        const decoder = new TextDecoder()
        let lineBuf = ''
        let lastMeals = -1, lastDays = -1, lastEmit = 0
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          bump()
          lineBuf += decoder.decode(value, { stream: true })
          const lines = lineBuf.split('\n')
          lineBuf = lines.pop() ?? '' // guarda a linha incompleta para o próximo chunk
          for (const raw of lines) {
            const line = raw.trim()
            if (!line || !line.startsWith('data:')) continue
            const payload = line.slice(5).trim()
            if (payload === '[DONE]') continue
            try {
              const evt = JSON.parse(payload)
              const ch = evt.choices?.[0]
              const delta = ch?.delta?.content
              if (typeof delta === 'string') content += delta
              if (ch?.finish_reason) finishReason = ch.finish_reason
            } catch { /* linha SSE parcial — completa no próximo chunk */ }
          }
          if (onStream) {
            const mealsDone = (content.match(/"foods"\s*:/g) || []).length
            const daysDone = (content.match(/"day"\s*:/g) || []).length
            if (mealsDone !== lastMeals || daysDone !== lastDays || content.length - lastEmit >= 180) {
              lastMeals = mealsDone; lastDays = daysDone; lastEmit = content.length
              onStream({ chars: content.length, mealsDone, daysDone })
            }
          }
        }
      } else {
        // Sem stream (harness determinístico): resposta JSON completa de uma vez.
        const data = await response.json()
        const choice = data.choices?.[0]
        content = (choice?.message?.content as string) ?? ''
        finishReason = choice?.finish_reason ?? null
      }

      const text = content.trim()
      try {
        return JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
      } catch (parseErr) {
        // finish_reason 'length' = resposta cortada no max_tokens (JSON incompleto). Mensagem clara.
        if (finishReason === 'length') throw new Error('Resposta da IA truncada (max_tokens): cardápio grande demais')
        throw parseErr
      }
    } catch (e) {
      lastErr = e
      console.warn(`[cardápio] tentativa ${i + 1}/${attempts} falhou:`, e instanceof Error ? e.message : e)
      if (i < attempts - 1) await new Promise(r => setTimeout(r, 800 * (i + 1)))
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Falha ao chamar a IA')
}

/** Recalcula o total de cada refeição a partir da SOMA REAL dos alimentos (fonte única). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeMenuTotals(parsed: any): void {
  for (const day of parsed?.days ?? []) {
    for (const meal of day?.meals ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const foods = (meal?.foods ?? []).filter((f: any) => typeof f === 'object' && f !== null)
      if (foods.length === 0) continue
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sum = (k: string) => foods.reduce((s: number, f: any) => s + (Number(f[k]) || 0), 0)
      meal.calories = Math.round(sum('calories'))
      meal.protein = Math.round(sum('protein') * 10) / 10
      meal.carbs = Math.round(sum('carbs') * 10) / 10
      meal.fat = Math.round(sum('fat') * 10) / 10
      meal.fiber = Math.round(sum('fiber') * 10) / 10
    }
  }
}

/** Saneia a estrutura do cardápio: remove refeições malformadas/sem alimentos e garante arrays. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeMenu(parsed: any): void {
  if (!parsed || !Array.isArray(parsed.days)) return
  for (const day of parsed.days) {
    if (!Array.isArray(day.meals)) { day.meals = []; continue }
    for (const m of day.meals) {
      // Descarta alimentos malformados (sem nome string válido) — evitam crash em quem lê f.name.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (Array.isArray(m?.foods)) m.foods = m.foods.filter((f: any) => typeof f === 'string' ? f.trim().length > 0 : (f && typeof f.name === 'string' && f.name.trim().length > 0))
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    day.meals = day.meals.filter((m: any) => m && typeof m === 'object' && Array.isArray(m.foods) && m.foods.length > 0)
  }
}

/** Formata número no padrão PT-BR (vírgula decimal, sem casas desnecessárias). */
function fmtPt(n: number): string {
  const r = Math.round(n * 10) / 10
  return Number.isInteger(r) ? String(r) : String(r).replace('.', ',')
}

/** Reescala a porção de um alimento (gramas + medida caseira + macros) por um fator. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function scaleFoodInPlace(food: any, scale: number): void {
  food.calories = Math.round((food.calories || 0) * scale)
  food.protein = Math.round((food.protein || 0) * scale * 10) / 10
  food.carbs = Math.round((food.carbs || 0) * scale * 10) / 10
  food.fat = Math.round((food.fat || 0) * scale * 10) / 10
  food.fiber = Math.round((food.fiber || 0) * scale * 10) / 10
  if (typeof food.name === 'string') {
    // 1) quantidade caseira (fração ou decimal) seguida da unidade — ex.: "2 fatias", "1/2 xícara"
    food.name = food.name.replace(
      /(\d+\/\d+|\d+(?:[.,]\d+)?)(\s*)(fatias?|unidades?|colheres?|conchas?|x[ií]caras?|ramos?|potes?|copos?|fil[ée]s?|postas?|bifes?|punhados?|rodelas?|lascas?|p[ãa]ezinhos?)/i,
      (_m: string, q: string, sp: string, unit: string) => {
        const val = q.includes('/') ? parseInt(q.split('/')[0]) / parseInt(q.split('/')[1]) : parseFloat(q.replace(',', '.'))
        return `${fmtPt(val * scale)}${sp}${unit}`
      }
    )
    // 2) gramas entre parênteses — ex.: "(50g)"
    food.name = food.name.replace(/(\d+(?:[.,]\d+)?)\s*g\b/i, (_m: string, g: string) => `${Math.round(parseFloat(g.replace(',', '.')) * scale)}g`)
  }
}

/** Ajusta as porções de cada dia para chegar perto da meta calórica (escala honesta). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enforceDayTargets(parsed: any, target?: number, highCalDays: string[] = []): void {
  if (!target) return
  for (const day of parsed?.days ?? []) {
    const meals = day?.meals ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const total = meals.reduce((s: number, m: any) => s + (m.calories || 0), 0)
    if (total <= 0) continue
    const tgt = highCalDays.includes(day.day) ? Math.round(target * 1.2) : target
    let scale = tgt / total
    if (Math.abs(scale - 1) <= 0.07) continue // já está perto da meta
    // Mira a meta exata; o teto só limita extremos. 3.0 p/ cima porque a IA às vezes gera
    // dias bem leves (~1000 kcal) e 2.2 não alcançava a meta de quem precisa de superávit.
    scale = Math.max(0.6, Math.min(4.0, scale))
    for (const meal of meals) for (const f of meal.foods ?? []) if (typeof f === 'object' && f !== null) scaleFoodInPlace(f, scale)
  }
}

/** Arredonda uma quantidade caseira para um valor humano (colher/xícara em passos de 0,5; contáveis inteiros). */
function humanizeQty(v: number, unit: string): number {
  if (!(v > 0)) return 0
  if (/colher|x[ií]cara|concha|copo|pote/.test(unit)) { const r = Math.round(v * 2) / 2; return r < 0.5 ? 0.5 : r }
  const r = Math.round(v); return r < 1 ? 1 : r // contáveis (unidade, fatia, filé, etc.): inteiro mínimo 1
}

/** Concorda a unidade de medida em número (ex.: "xícara" -> "xícaras" quando n != 1). */
function unitForm(raw: string, n: number): string {
  const u = raw.toLowerCase()
  const toSing: Record<string, string> = { colheres: 'colher', 'xícaras': 'xícara', xicaras: 'xícara', xicara: 'xícara', unidades: 'unidade', conchas: 'concha', copos: 'copo', fatias: 'fatia', 'filés': 'filé', files: 'filé', file: 'filé', postas: 'posta', bifes: 'bife', punhados: 'punhado', rodelas: 'rodela', potes: 'pote', ramos: 'ramo', 'pãezinhos': 'pãozinho', 'pãzinhos': 'pãozinho' }
  const sing = toSing[u] ?? u
  const toPlural: Record<string, string> = { colher: 'colheres', 'xícara': 'xícaras', unidade: 'unidades', concha: 'conchas', copo: 'copos', fatia: 'fatias', 'filé': 'filés', posta: 'postas', bife: 'bifes', punhado: 'punhados', rodela: 'rodelas', pote: 'potes', ramo: 'ramos', 'pãozinho': 'pãezinhos' }
  return n === 1 ? sing : (toPlural[sing] ?? (sing.endsWith('s') ? sing : sing + 's'))
}

/**
 * Deixa as porções em tom humano: "5,2 colheres" -> "5 colheres", "0,9 xícara" -> "1 xícara",
 * "3,5 unidades" -> "4 unidades". Ajusta gramas/ml e macros proporcionalmente para manter coerência.
 * O total do dia passa a ser aproximado (mais natural que números fracionados exatos).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function humanizePortions(parsed: any): void {
  const UNIT = /(\d+\/\d+|\d+(?:[.,]\d+)?)(\s*)(fatias?|unidades?|colheres?|conchas?|x[ií]caras?|ramos?|potes?|copos?|fil[ée]s?|postas?|bifes?|punhados?|rodelas?|p[ãa]ezinhos?)/i
  for (const day of parsed?.days ?? []) {
    for (const meal of day?.meals ?? []) {
       
      for (const f of meal?.foods ?? []) {
        if (!f || typeof f.name !== 'string') continue
        const m = f.name.match(UNIT)
        if (!m) continue
        const q0 = m[1].includes('/') ? parseInt(m[1].split('/')[0]) / parseInt(m[1].split('/')[1]) : parseFloat(m[1].replace(',', '.'))
        const human = humanizeQty(q0, m[3].toLowerCase())
        if (!(q0 > 0) || human <= 0 || human === q0) continue
        const eff = human / q0
        f.name = f.name
          .replace(m[0], `${fmtPt(human)}${m[2]}${unitForm(m[3], human)}`)
          .replace(/(\d+(?:[.,]\d+)?)\s*(g|ml)\b/i, (_x: string, n: string, u: string) => {
            const step = u.toLowerCase() === 'ml' ? 10 : 5
            return `${Math.max(step, Math.round((parseFloat(n.replace(',', '.')) * eff) / step) * step)}${u}`
          })
        f.calories = Math.round((f.calories || 0) * eff)
        f.protein = Math.round((f.protein || 0) * eff * 10) / 10
        f.carbs = Math.round((f.carbs || 0) * eff * 10) / 10
        f.fat = Math.round((f.fat || 0) * eff * 10) / 10
        f.fiber = Math.round((f.fiber || 0) * eff * 10) / 10
      }
    }
  }
}

// Açúcar/doces/bebidas açucaradas — removidos no reparo (não têm equivalente saudável de mesmos macros).
// "mel " com espaço de propósito (não casar "melancia"/"caramelo"); "refri " idem.
const SUGAR_REMOVE = ['acucar', 'rapadura', 'melado', 'mel ', 'refrigerante', 'refri ', 'doce de leite', 'brigadeiro', 'pudim', 'sorvete', 'bala ', 'pirulito', 'bombom', 'chocolate ao leite', 'leite condensado', 'geleia', 'bolo', 'biscoito recheado', 'suco', 'goiabada', 'pacoca', 'paçoca', 'cocada', 'quindim', 'beijinho', 'mousse', 'manjar', 'arroz doce', 'canjica', 'curau', 'marmelada', 'bananada', 'nutella', 'achocolatado']
// Cortes/derivados que escapam das keywords genéricas — completam vegetariano/vegano (carne), sem_lactose
// (queijos por nome próprio) e sem_gluten (massa por produto). Centralizados p/ não esquecer em uma lista.
const MEAT_CUTS = ['suíno', 'suino', 'lombo', 'pernil', 'bisteca', 'costela', 'fraldinha', 'maminha', 'picanha', 'cupim', 'acém', 'acem', 'músculo', 'musculo', 'fígado', 'figado', 'coxa', 'sobrecoxa', 'merluza', 'bacalhau', 'pescada', 'lula', 'polvo', 'mexilhão', 'mexilhao', 'mortadela', 'salame', 'patinho', 'coxão', 'coxao', 'alcatra', 'contrafilé', 'contrafile', 'filé mignon', 'file mignon', 'paleta']
const DAIRY_EXTRA = ['catupiry', 'cream cheese', 'requeijão cremoso', 'requeijao cremoso', 'provolone', 'gorgonzola', 'cheddar', 'cottage', 'queijo prato', 'coalho', 'gouda', 'brie', 'muzarela', 'achocolatado', 'chantilly', 'bechamel', 'molho branco', 'leite ninho', 'iogurte grego']
const GLUTEN_PRODUCTS = ['pizza', 'lasanha', 'nhoque', 'panqueca', 'bolacha', 'biscoito', 'torrada', 'bolo', 'pastel', 'esfiha', 'coxinha', 'empada', 'macarrão', 'macarrao', 'espaguete', 'talharim', 'penne', 'farinha de rosca', 'cerveja']
const EGG_FORMS = ['omelete', 'gema', 'clara de ovo', 'mexido de ovo'] // só vegano (ovo é ok p/ vegetariano)
// Proibido no café da manhã (regra da nutricionista): carnes vermelhas + sardinha + atum + salmão.
// Frango (carne branca) e peixe branco continuam permitidos no café.
const BREAKFAST_BANNED = ['carne', 'bovina', 'bife', 'patinho', 'alcatra', 'picanha', 'contrafile', 'contrafilé', 'file mignon', 'filé mignon', 'fraldinha', 'maminha', 'cupim', 'costela', 'acem', 'porco', 'suino', 'suíno', 'lombo', 'pernil', 'bisteca', 'bacon', 'linguica', 'linguiça', 'presunto', 'mortadela', 'salame', 'sardinha', 'atum', 'salmao', 'salmão']

// ALLOWLIST de comida brasileira: tokens (radicais de alimentos do dia a dia). Um alimento é
// considerado brasileiro se ALGUMA palavra significativa dele estiver aqui. O que não tiver NENHUMA
// palavra reconhecida é tratado como atípico (risoto de cevadinha, espargos, farro, mix de berries...)
// e trocado por equivalente brasileiro. Complementa a denylist (que pega compostos tipo "couve de bruxelas").
const ALLOWED_BR = new Set([
  'arroz', 'feijao', 'feijoada', 'tropeiro', 'baiao', 'tapioca', 'crepioca', 'cuscuz', 'mandioca', 'aipim', 'macaxeira', 'polvilho', 'batata', 'inhame', 'milho', 'fuba', 'polenta', 'angu', 'farofa', 'farinha', 'pao', 'paozinho', 'biscoito', 'bolacha', 'torrada', 'aveia', 'granola', 'macarrao', 'espaguete', 'talharim', 'nhoque', 'lasanha', 'panqueca', 'sanduiche', 'misto', 'pizza', 'coxinha', 'pastel', 'empada', 'esfiha', 'bolo', 'mingau', 'sopa', 'caldo', 'escondidinho', 'quirera', 'pamonha', 'cereal',
  'frango', 'galinha', 'peito', 'coxa', 'sobrecoxa', 'file', 'carne', 'boi', 'bovina', 'bife', 'patinho', 'alcatra', 'picanha', 'fraldinha', 'maminha', 'cupim', 'acem', 'musculo', 'costela', 'lombo', 'pernil', 'bisteca', 'porco', 'suino', 'linguica', 'salsicha', 'presunto', 'mortadela', 'salame', 'bacon', 'ovo', 'ovos', 'omelete', 'mexido', 'peixe', 'tilapia', 'sardinha', 'atum', 'merluza', 'pescada', 'bacalhau', 'salmao', 'truta', 'camarao', 'peru', 'almondega', 'hamburguer', 'iscas', 'desfiado', 'moida', 'moido',
  'lentilha', 'grao', 'ervilha', 'soja', 'fava', 'tofu',
  'leite', 'queijo', 'minas', 'mussarela', 'mucarela', 'muzarela', 'prato', 'coalho', 'requeijao', 'iogurte', 'coalhada', 'ricota', 'manteiga', 'nata', 'creme', 'whey', 'catupiry', 'cottage', 'parmesao', 'frescal',
  'banana', 'maca', 'mamao', 'manga', 'melancia', 'abacaxi', 'laranja', 'mexerica', 'tangerina', 'bergamota', 'uva', 'morango', 'abacate', 'goiaba', 'maracuja', 'acerola', 'caju', 'pera', 'pessego', 'ameixa', 'melao', 'limao', 'caqui', 'jaca', 'graviola', 'pitanga', 'fruta', 'frutas', 'vitamina', 'suco', 'coco', 'castanha', 'amendoim', 'amendoa', 'noz', 'nozes', 'pasta',
  'alface', 'rucula', 'agriao', 'espinafre', 'couve', 'repolho', 'acelga', 'tomate', 'cebola', 'alho', 'cenoura', 'beterraba', 'pepino', 'abobrinha', 'abobora', 'chuchu', 'quiabo', 'jilo', 'maxixe', 'vagem', 'brocolis', 'berinjela', 'pimentao', 'mandioquinha', 'salada', 'legumes', 'legume', 'verdura', 'vinagrete', 'salsa', 'cebolinha', 'coentro', 'palmito', 'escarola', 'almeirao', 'taioba', 'jambu', 'folhas',
  'azeite', 'oleo', 'sal', 'vinagre', 'oregano', 'colorau', 'cominho', 'pimenta', 'mel', 'rapadura', 'chia', 'linhaca', 'gergelim', 'cafe', 'cha', 'agua', 'cacau', 'chocolate', 'gelatina', 'pudim', 'doce',
].map(norm))
// Palavras de PREPARO/conector que não contam como "alimento brasileiro" (senão liberariam tudo).
const BR_STOPWORDS = new Set(['de', 'da', 'do', 'com', 'sem', 'ao', 'na', 'no', 'em', 'light', 'diet', 'zero', 'integral', 'natural', 'caseiro', 'caseira', 'grelhado', 'grelhada', 'grelhados', 'grelhadas', 'assado', 'assada', 'assados', 'assadas', 'cozido', 'cozida', 'cozidos', 'cozidas', 'refogado', 'refogada', 'refogados', 'frito', 'frita', 'fritos', 'fritas', 'desnatado', 'desnatada', 'magro', 'magra', 'fresco', 'fresca', 'picado', 'picada', 'temperado', 'temperada', 'recheado', 'recheada', 'vapor', 'forno', 'panela'].map(norm))
// Versões "fit"/estrangeiras de staples brasileiros: têm palavra brasileira mas NÃO são do dia a dia
// (arroz negro, arroz de couve-flor, feijão azuki, lasanha de berinjela, macarrão de abobrinha...).
const ATYPICAL_TERMS = ['arroz negro', 'arroz selvagem', 'arroz basmati', 'arroz arboreo', 'arroz jasmim', 'arroz de couve', 'arroz de brocolis', 'arroz 7 ', 'arroz sete ', 'arroz multigrao', 'arroz multigraos', 'de couve flor', 'azuki', 'macarrao de abobrinha', 'espaguete de abobrinha', 'macarrao de pupunha', 'macarrao de berinjela', 'lasanha de berinjela', 'parmegiana de berinjela', 'shirataki', 'konjac', 'pao low carb', 'pao nuvem', 'cloud bread', 'overnight',
  // pratos estrangeiros (head-noun) que a IA pode disfarçar com uma palavra brasileira ao lado
  // (ex.: "risoto de cevadinha COM abobrinha"). Aqui o termo vence qualquer palavra brasileira vizinha.
  'risoto', 'cevadinha', 'tabule', 'ratatouille', 'pesto', 'bulgur', 'gnocchi', 'waffle', 'crepe frances'].map(norm)
// Refinados com equivalente integral (trocados no reparo, mantendo macros).
const WHITE_SWAP = ['pao branco', 'pao frances', 'farinha branca', 'arroz branco']
// Fritura (GLP-1/bariátrica) — o reparo troca o método de preparo no nome (mantém o alimento).
const FRITURA_KEYWORDS = ['frito', 'frita', 'fritura', 'empanado', 'empanada', 'milanesa', 'nuggets']
// Pratos estrangeiros INEQUÍVOCOS e atípicos no Brasil — banidos quando país = Brasil (vale para todos).
// O reparo remove o item e as redes de segurança recompõem com comida brasileira (arroz/feijão/proteína).
// NÃO inclui itens que o brasileiro come (tofu p/ low-carb vegano, quinoa, cuscuz de milho nordestino).
const ATIPICO_BR_KEYWORDS = ['homus', 'hummus', 'falafel', 'shawarma', 'sushi', 'sashimi', 'temaki', 'teriyaki', 'edamame', 'wrap', 'tortilla', 'taco', 'burrito', 'guacamole', 'hamburguer de lentilha', 'hamburguer vegetal', 'hamburguer de grao', 'cuscuz marroquino', 'kale', 'quinoa', 'tempeh', 'seitan', 'misso', 'shoyu', 'pasta de grao', 'caril', 'curry', 'overnight', 'smoothie', 'porridge', 'tahine', 'tahini', 'chia pudding', 'poke', 'bowl',
  // Itens "fit"/atípicos vistos em prod (Veronica): NÃO são comida brasileira do dia a dia.
  // (granola, aveia, chia, iogurte grego, pasta de amendoim NÃO entram: são comuns no Brasil.)
  'cevada', 'berry', 'berries', 'blueberry', 'cranberry', 'mirtilo', 'mirtilos', 'couve de bruxelas', 'couves de bruxelas', 'avela', 'avelas', 'alcachofra', 'aspargo', 'aspargos', 'espargo', 'espargos', 'farro', 'damasco seco', 'tamara', 'macadamia']

const FORBIDDEN_KEYWORDS: Record<string, string[]> = {
  sem_lactose: ['leite', 'iogurte', 'queijo', 'requeij', 'creme de leite', 'manteiga', 'leite condensado', 'doce de leite', 'whey', 'nata', 'coalhada', 'ricota', 'mussarela', 'muçarela', 'parmes', 'queijo minas', 'queijo frescal', ...DAIRY_EXTRA],
  sem_gluten: ['trigo', 'pão francês', 'pao frances', 'pão de forma', 'pao de forma', 'pão integral', 'pao integral', 'macarrão de trigo', 'macarrao de trigo', 'macarrão integral', 'cevada', 'centeio', 'malte', 'cuscuz de trigo', 'farinha de trigo', 'aveia', ...GLUTEN_PRODUCTS],
  vegetariano: ['frango', 'carne', 'bovina', 'porco', 'suíno', 'suino', 'peixe', 'salmão', 'salmao', 'tilápia', 'tilapia', 'sardinha', 'atum', 'camarão', 'camarao', 'presunto', 'bacon', 'linguiça', 'linguica', 'salsicha', 'frutos do mar', 'patinho', 'coxão', 'alcatra', 'file de frango', 'filé de frango', ...MEAT_CUTS, 'gelatina'],
  vegano: ['frango', 'carne', 'bovina', 'porco', 'peixe', 'salmão', 'salmao', 'tilápia', 'tilapia', 'sardinha', 'atum', 'camarão', 'camarao', 'presunto', 'bacon', 'linguiça', 'linguica', 'salsicha', 'ovo', 'leite', 'iogurte', 'queijo', 'requeij', 'mel ', 'manteiga', 'whey', ...MEAT_CUTS, ...EGG_FORMS, ...DAIRY_EXTRA, 'gelatina', 'maionese'],
  // Diabetes: qualidade (sem açúcar refinado/farinha branca), SEM teto de carbo. Decisão do produto.
  diabetes: [...SUGAR_REMOVE, ...WHITE_SWAP],
  // Low carb: bane só o açúcar por keyword; o teto de 100g de carbo é forçado por enforceCarbCap.
  low_carb: [...SUGAR_REMOVE],
  // Sintética (GLP-1/bariátrica): zero açúcar refinado + sem fritura.
  metabolica: [...SUGAR_REMOVE, ...FRITURA_KEYWORDS],
  // Sintética (país = Brasil): bane pratos estrangeiros atípicos; o reparo remove e recompõe brasileiro.
  atipico_br: [...ATIPICO_BR_KEYWORDS],
  // Tofu é atípico no dia a dia brasileiro: banido para todos EXCETO vegano (única proteína low-carb vegetal).
  atipico_br_tofu: ['tofu'],
}

/** Minúsculas + sem acento + hífen vira espaço. Necessário porque no celular o usuário
 * digita exclusões sem acento ("camarao", "pao") e usa hífen/espaço de forma intercambiável. */
function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim()
}
/** Como norm, mas SEM aparar espaços nas pontas — preserva o radical "mel " (com espaço),
 * que existe de propósito para não casar dentro de "caramelo"/"melancia". */
function normKw(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/-/g, ' ')
}

/** Casa o termo excluído pelo usuário como palavra (com fronteira à esquerda), aceitando plural
 * (frango -> frangos, ovo -> ovos), mas sem casar no meio de outra palavra (ovo ≠ ovomaltine). */
function excludedHit(haystack: string, needle: string): boolean {
  if (!needle) return false
  const isLetter = (c: string | undefined) => c != null && /\p{L}/u.test(c)
  let from = 0
  for (;;) {
    const idx = haystack.indexOf(needle, from)
    if (idx === -1) return false
    if (!isLetter(haystack[idx - 1])) {
      const rest = haystack.slice(idx + needle.length)
      const suffix = (rest.match(/^(es|s)?/) || [''])[0]
      if (!isLetter(rest[suffix.length])) return true // fronteira direita, ou só plural
    }
    from = idx + 1
  }
}

/** Expande exclusões livres do usuário: sinônimos de corte de porco (carne de porco -> lombo/pernil/
 * bisteca) e plural irregular (pão -> pães, limão -> limões). Para o usuário não precisar listar tudo. */
const PORK_SYNONYMS = ['porco', 'suino', 'lombo', 'pernil', 'bisteca', 'costela suina', 'copa', 'panceta']
function expandExclusions(terms: string[]): string[] {
  const out = new Set<string>()
  for (const e of terms) {
    out.add(e)
    if (e.endsWith('ao')) { const r = e.slice(0, -2); out.add(r + 'aes'); out.add(r + 'oes'); out.add(r + 'aos') }
    if (/porco|suino/.test(e)) for (const s of PORK_SYNONYMS) out.add(norm(s))
  }
  return [...out]
}

/** Compostos que CONTÊM um radical "proibido" mas NÃO violam: couve-manteiga é vegetal,
 * leite de coco é vegetal, manteiga de amendoim não é laticínio. (já normalizados) */
const SAFE_COMPOUNDS = [
  'leite de coco', 'leite de amendoa', 'leite de aveia', 'leite de soja', 'leite de castanha',
  'leite de arroz', 'leite de amendoim', 'leite vegetal',
  'couve manteiga', 'couve flor',
  'feijao manteiga', 'manteiga de amendoim',
  'queijo vegetal', 'queijo vegano', 'iogurte de coco', 'iogurte vegetal', 'requeijao vegetal',
  // vegetais que contêm "carne" mas são veganos (não trocar por proteína animal)
  'carne de soja', 'carne vegetal', 'carne moida de soja', 'proteina de soja', 'maionese vegana', 'maionese vegetal',
  // sem glúten reais que contêm uma palavra de glúten (massa de arroz/milho, panqueca de banana)
  'pao de queijo', 'pao de tapioca', 'panqueca de banana', 'panqueca de tapioca', 'macarrao de arroz', 'macarrao de milho', 'macarrao de arroz integral',
].map(norm)
/** Qualificadores vegetais que LIBERAM apenas laticínio/ovo (NUNCA liberam carne/peixe). */
const PLANT_QUALIFIERS = ['sem lactose', 'zero lactose', 'sem leite', 'vegano', 'vegana', 'vegetal', 'de coco', 'de amendoa', 'de aveia', 'de soja', 'de castanha', 'de amendoim', 'tofu'].map(norm)
/** Palavras-chave proibidas que um qualificador vegetal pode liberar (laticínio e ovo). */
const PLANT_OK_KEYWORDS = new Set(['leite', 'iogurte', 'queijo', 'requeij', 'creme de leite', 'manteiga', 'leite condensado', 'doce de leite', 'whey', 'nata', 'coalhada', 'ricota', 'mussarela', 'mucarela', 'parmes', 'queijo minas', 'queijo frescal', 'ovo'].map(norm))
/** Qualificadores que liberam glúten (ex.: "aveia sem glúten", "pão sem glúten"). */
const GLUTEN_QUALIFIERS = ['sem gluten', 'gluten free'].map(norm)
/** Radicais de laticínio: excluir um desses não deve derrubar um composto seguro
 * (ex.: excluir "leite" não pode tirar "leite de coco", que é o substituto sem lactose). */
const DAIRY_RADICALS = new Set(['leite', 'manteiga', 'queijo', 'iogurte', 'creme', 'nata', 'requeijao'].map(norm))

/** Procura alimentos que violam restrições alimentares ou a lista de excluídos. */
function findMenuViolations(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  days: any[],
  restrictions: string[],
  excluded: string[],
): Array<{ day?: string; meal?: string; food: string; rule: string }> {
  const out: Array<{ day?: string; meal?: string; food: string; rule: string }> = []
  const exclLower = expandExclusions((excluded ?? []).map(e => norm(e)).filter(e => e.length >= 3))
  for (const day of days ?? []) {
    for (const meal of day?.meals ?? []) {
      for (const f of meal?.foods ?? []) {
        const name: string = (typeof f === 'object' && f !== null ? (f.name ?? '') : String(f))
        const lower = norm(name)
        if (!lower) continue
        const hasPlantQual = PLANT_QUALIFIERS.some(q => lower.includes(q))
        const hasGlutenQual = GLUTEN_QUALIFIERS.some(q => lower.includes(q))
        for (const r of restrictions) {
          const kws = FORBIDDEN_KEYWORDS[r]
          if (!kws) continue
          for (const rawKw of kws) {
            const kw = normKw(rawKw)
            // Keywords com espaço no fim ('mel ', 'refri ', 'bala ') são marcadores de PALAVRA INTEIRA:
            // casa por fronteira (pega "com mel" no fim) sem casar "melancia"/"caramelo"/"melado".
            const matched = rawKw.endsWith(' ') ? excludedHit(lower, norm(rawKw)) : lower.includes(kw)
            if (!matched) continue
            // 1) coberto por composto seguro que contém a PRÓPRIA palavra-chave ("leite" em "leite de coco")
            if (SAFE_COMPOUNDS.some(c => c.includes(kw) && lower.includes(c))) continue
            // 2) qualificador vegetal libera SÓ laticínio/ovo — nunca carne/peixe
            if (hasPlantQual && PLANT_OK_KEYWORDS.has(kw)) continue
            // 3) qualificador "sem glúten" libera as palavras-chave de glúten
            if (r === 'sem_gluten' && hasGlutenQual) continue
            out.push({ day: day.day, meal: meal.type, food: name, rule: r })
            break // uma violação por restrição basta
          }
        }
        for (const ex of exclLower) {
          if (!excludedHit(lower, ex)) continue
          if (DAIRY_RADICALS.has(ex) && SAFE_COMPOUNDS.some(c => c.includes(ex) && lower.includes(c))) continue
          out.push({ day: day.day, meal: meal.type, food: name, rule: `excluído: ${ex}` })
        }
      }
    }
  }
  return out
}

/** Proteínas de substituição para reparo (usadas só se não violarem restrição/exclusão). */
const PROTEIN_FALLBACKS = ['Carne bovina magra grelhada', 'Patinho moído refogado', 'Filé de tilápia grelhado', 'Peixe grelhado', 'Ovos mexidos', 'Omelete', 'Lombo suíno assado', 'Atum', 'Lentilha cozida', 'Grão-de-bico cozido']
/** Troca de laticínio -> análogo vegetal (mantém a proporção da porção). Ordem importa. */
const DAIRY_SWAPS: Array<[RegExp, string]> = [
  [/leite condensado/i, 'Leite condensado de coco'],
  [/creme de leite/i, 'Creme vegetal'],
  [/doce de leite/i, 'Doce de coco'],
  [/requeij[ãa]o/i, 'Requeijão vegetal'],
  [/iogurte/i, 'Iogurte de coco'],
  [/mussarela|muçarela|ricota|parmes[ãa]o|coalhada|queijo/i, 'Queijo vegetal'],
  [/manteiga/i, 'Creme vegetal'],
  [/\bnata\b/i, 'Creme vegetal'],
  [/whey/i, 'Proteína vegetal'],
  [/leite/i, 'Leite de amêndoas'],
]
/** Refinado -> integral (mantém macros): para diabetes/low_carb/metabólica. */
const HEALTHY_SWAPS: Array<[RegExp, string]> = [
  [/p[ãa]o franc[êe]s|p[ãa]o branco/i, 'Pão integral'],
  [/arroz branco/i, 'Arroz integral'],
  [/farinha branca/i, 'Farinha integral'],
]
function extractGrams(name: string): number | null {
  const m = name.match(/(\d+(?:[.,]\d+)?)\s*g\b/i)
  return m ? Math.round(parseFloat(m[1].replace(',', '.'))) : null
}
/**
 * Faz CUMPRIR as restrições no cardápio real da IA: troca laticínios pelo análogo sem lactose
 * e proteínas proibidas/excluídas por uma proteína permitida (mantendo calorias/macros), e como
 * último recurso remove o item. NÃO é o "fallback falso" antigo (que ignorava restrições): aqui
 * o cardápio continua sendo o da IA, só removemos/substituímos o que violou. Sempre honesto.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function repairViolations(parsed: any, restrictions: string[], excluded: string[]): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const violates = (food: any): ReturnType<typeof findMenuViolations> =>
    findMenuViolations([{ day: 'x', meals: [{ type: 'x', foods: [food] }] }], restrictions, excluded)
  // Pool de proteínas permitidas; rotaciona para não repetir a mesma proteína em todos os dias.
  const safePool = PROTEIN_FALLBACKS.filter(p => violates({ name: `${p} – 100g` }).length === 0)
  let protIdx = 0
  const nextProtein = (): string | null => (safePool.length ? safePool[protIdx++ % safePool.length] : null)

  for (const day of parsed?.days ?? []) {
    for (const meal of day?.meals ?? []) {
       
      for (const f of (meal?.foods ?? [])) {
        if (!f || typeof f.name !== 'string') continue
        const rules = violates(f).map(v => v.rule)
        if (rules.length === 0) continue
        const grams = extractGrams(f.name)
        // Laticínio sob sem_lactose/vegano (e não por exclusão) -> análogo vegetal, mantém números
        if (rules.some(r => r === 'sem_lactose' || r === 'vegano') && !rules.some(r => r.startsWith('excluído'))) {
          const swap = DAIRY_SWAPS.find(([re]) => re.test(f.name))
          if (swap) { f.name = grams ? `${swap[1]} – ${grams}g` : swap[1]; continue }
        }
        // Açúcar/farinha branca/fritura (diabetes/low_carb/metabólica): refinado->integral (mantém macros),
        // fritura->assado (troca só o método). Açúcar/doce/refri/suco puro NÃO é substituído por proteína:
        // deixa cair na varredura final (remoção honesta) e o enforceDayTargets recompõe as calorias.
        if (rules.some(r => r === 'diabetes' || r === 'low_carb' || r === 'metabolica' || r === 'atipico_br' || r === 'atipico_br_tofu') && !rules.some(r => r.startsWith('excluído'))) {
          const healthy = HEALTHY_SWAPS.find(([re]) => re.test(f.name))
          if (healthy) { f.name = grams ? `${healthy[1]} – ${grams}g` : healthy[1]; continue }
          if (/frit|empanad|milanesa|nuggets/i.test(norm(f.name))) {
            f.name = f.name.replace(/fritas\b/gi, 'assadas').replace(/fritos\b/gi, 'assados').replace(/frita\b/gi, 'assada').replace(/frito\b/gi, 'assado').replace(/à? ?milanesa|empanad[oa]s?/gi, 'grelhado').replace(/nuggets?/gi, 'iscas grelhadas')
            continue
          }
          continue // açúcar/doce/refri/suco/prato atípico: remoção na varredura final (redes recompõem brasileiro)
        }
        // Proteína proibida/excluída -> proteína permitida (rotacionada), mantém calorias/macros.
        // Se não houver nenhuma permitida, deixa como está: a varredura final remove o item.
        const rep = nextProtein()
        if (rep) f.name = grams ? `${rep} – ${grams}g` : rep
      }
      // Varredura final: remove o que ainda violar (raro) — nunca entrega item proibido
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      meal.foods = (meal.foods ?? []).filter((f: any) => violates(f).length === 0)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    day.meals = (day.meals ?? []).filter((m: any) => Array.isArray(m.foods) && m.foods.length > 0)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parsed.days = (parsed.days ?? []).filter((d: any) => Array.isArray(d.meals) && d.meals.length > 0)
}

/**
 * Decide a estrutura de refeições do cardápio (quais eventos alimentares gerar).
 * Prioridade: (1) jejum força janela reduzida; (2) escolha explícita do diálogo;
 * (3) default inteligente fracionado para GLP-1, bariátrica ou ganho de massa;
 * (4) mealRoutine do perfil (retrocompat). Retorna a lista NOMEADA de eventos
 * (rótulos humanos em PT-BR) para o prompt e o pós-processamento usarem a mesma fonte.
 */
function computeMealStructure(
  user: UserProfile,
  options?: { mealStructure?: MealStructure; fastingProtocol?: string },
): { fractioned: boolean; events: string[] | null } {
  // Jejum tem prioridade absoluta: reduz refeições, todas dentro da janela (sem café cedo / sem ceia).
  // Eventos EXPLÍCITOS por protocolo (não "events: null"), para a contagem ser forçada como na
  // estrutura normal (o fill-loop exige o número exato; antes a IA às vezes entregava 3-4).
  if (options?.fastingProtocol) {
    const p = options.fastingProtocol
    const fastingEvents = (p === '20:4' || p === '18:6')
      ? ['Almoço', 'Jantar']
      : p === '12:12'
        ? ['Café da Manhã', 'Almoço', 'Jantar']
        : ['Almoço', 'Lanche da Tarde', 'Jantar'] // 16:8 / 14:10 / default
    return { fractioned: false, events: fastingEvents }
  }

  const isGlp1 = !!user.medication && user.medication !== 'nenhum'
  const isBariatric = !!user.hadBariatricSurgery

  let ms = options?.mealStructure
  if (!ms) {
    // Default inteligente: fraciona para quem clinicamente precisa (GLP-1 / bariátrica)
    // ou ganho de massa; senão respeita o mealRoutine salvo (retrocompat).
    const smart = isGlp1 || isBariatric || user.goal === 'ganhar_massa' || (user.mealRoutine?.hasSnacks ?? false)
    ms = { includeMorningSnack: smart, includeAfternoonSnack: smart, includeSupper: smart }
  }

  const events = ['Café da Manhã']
  if (ms.includeMorningSnack) events.push('Lanche da Manhã')
  events.push('Almoço')
  if (ms.includeAfternoonSnack) events.push('Lanche da Tarde')
  events.push('Jantar')
  if (ms.includeSupper) events.push('Ceia')

  const fractioned = ms.includeMorningSnack || ms.includeAfternoonSnack || ms.includeSupper
  return { fractioned, events }
}

// ---- Boosters para o forçador de proteína/fibra (Camada B) ----
// Cada item já vem no formato canônico "Nome – medida (Xg)" para passar pelos regex de
// scaleFoodInPlace/humanizePortions e exibir bonito no app/PDF. Macros aproximados (TACO/USDA).
interface Booster { name: string; measure: string; grams: number; cal: number; p: number; c: number; f: number; fib: number }
const PROTEIN_BOOSTERS_ANIMAL: Booster[] = [
  { name: 'Ovos mexidos', measure: '2 unidades', grams: 100, cal: 147, p: 13, c: 1, f: 10, fib: 0 },
  { name: 'Peito de frango grelhado', measure: '1 filé', grams: 100, cal: 165, p: 31, c: 0, f: 3.6, fib: 0 },
  { name: 'Iogurte natural', measure: '1 pote', grams: 170, cal: 102, p: 10, c: 8, f: 3.4, fib: 0 },
  { name: 'Queijo branco', measure: '1 fatia', grams: 40, cal: 98, p: 7, c: 1, f: 7, fib: 0 },
  { name: 'Atum em água', measure: '1 lata', grams: 100, cal: 116, p: 26, c: 0, f: 1, fib: 0 },
  { name: 'Sardinha em lata', measure: '1 lata', grams: 84, cal: 130, p: 18, c: 0, f: 6, fib: 0 },
  { name: 'Frango desfiado', measure: '1 porção', grams: 80, cal: 132, p: 25, c: 0, f: 3, fib: 0 },
  { name: 'Carne moída magra', measure: '1 porção', grams: 80, cal: 154, p: 21, c: 0, f: 7, fib: 0 },
]
// Vegetais BRASILEIROS primeiro (feijão/lentilha/grão-de-bico, comuns na rotina). Tofu e pasta de
// amendoim só entram quando os de baixo carbo são necessários (vegano + low_carb), pois leguminosa tem carbo.
const PROTEIN_BOOSTERS_VEG: Booster[] = [
  { name: 'Feijão preto cozido', measure: '1 concha', grams: 140, cal: 109, p: 7, c: 19, f: 0.7, fib: 9 },
  { name: 'Lentilha cozida', measure: '1 concha', grams: 150, cal: 174, p: 13.5, c: 30, f: 0.6, fib: 11 },
  { name: 'Grão-de-bico cozido', measure: '0,5 xícara', grams: 120, cal: 164, p: 9, c: 27, f: 2.6, fib: 8 },
  { name: 'Tofu grelhado', measure: '1 fatia', grams: 100, cal: 144, p: 15, c: 3, f: 9, fib: 1 },
  { name: 'Pasta de amendoim', measure: '1 colher de sopa', grams: 20, cal: 118, p: 5, c: 4, f: 10, fib: 1.2 },
]
const FIBER_BOOSTERS: Booster[] = [
  { name: 'Aveia em flocos', measure: '3 colheres de sopa', grams: 30, cal: 117, p: 4, c: 20, f: 2.4, fib: 3 },
  { name: 'Mamão papaia', measure: '1 fatia', grams: 150, cal: 60, p: 0.7, c: 15, f: 0.2, fib: 2.7 },
  { name: 'Chia', measure: '1 colher de sopa', grams: 12, cal: 58, p: 2, c: 5, f: 3.7, fib: 5 },
  { name: 'Linhaça', measure: '1 colher de sopa', grams: 10, cal: 53, p: 2, c: 3, f: 4, fib: 3 },
  { name: 'Feijão carioca cozido', measure: '0,5 concha', grams: 80, cal: 76, p: 4.8, c: 13.6, f: 0.5, fib: 6 },
  { name: 'Brócolis no vapor', measure: '1 xícara', grams: 100, cal: 34, p: 2.8, c: 7, f: 0.4, fib: 3.3 },
  { name: 'Goiaba', measure: '1 unidade', grams: 130, cal: 68, p: 1, c: 14, f: 0.7, fib: 7 },
  { name: 'Ervilha cozida', measure: '0,5 xícara', grams: 80, cal: 67, p: 5, c: 11, f: 0.3, fib: 5 },
]
// Sob low_carb: só boosters de baixo carboidrato podem entrar (proteína e fibra).
const isLowCarbBooster = (b: Booster) => b.c <= 5
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function boosterToFood(b: Booster): any {
  return { name: `${b.name} – ${b.measure} (${b.grams}g)`, calories: b.cal, protein: b.p, carbs: b.c, fat: b.f, fiber: b.fib }
}
/** Classifica o tipo de refeição pelo rótulo humano (mesma lógica do "adicionar ao meu dia"). */
function mealKind(type: string): 'principal' | 'cafe' | 'lanche' {
  const t = (type || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (t.includes('almoco') || t.includes('jantar')) return 'principal'
  if (t.includes('lanche') || t.includes('ceia')) return 'lanche'
  return 'cafe'
}

/**
 * REDE DE SEGURANÇA (Camada B): garante o que o prompt pede mas a IA às vezes ignora —
 * proteína mínima POR refeição (resolve "café só de pão") e metas DIÁRIAS de proteína e
 * fibra. Roda por ÚLTIMO (depois de enforceDayTargets/humanizePortions) para ter a palavra
 * final, é SINGLE-PASS e determinística (sem loop até convergir) e só insere/escala itens
 * que NÃO violam restrição/exclusão. Calorias seguem como meta dura via normalizeMenuTotals
 * no fim; aceitamos leve folga calórica nos dias que precisaram de booster (proteína vence,
 * postura clínica para GLP-1). Reaproveita scaleFoodInPlace para manter name+macros em sincronia.
 */
function enforceProteinFiber(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parsed: any,
  ctx: { restrictions: string[]; excluded: string[]; isGlp1: boolean; protDay: number; fiberDay: number; targetCalories?: number; highCalDays?: string[] },
): void {
  const { restrictions, excluded, isGlp1, protDay, fiberDay } = ctx
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const violates = (food: any): boolean =>
    findMenuViolations([{ day: 'x', meals: [{ type: 'x', foods: [food] }] }], restrictions, excluded).length > 0
  const isVeg = restrictions.includes('vegetariano') || restrictions.includes('vegano')
  const isLowCarb = restrictions.includes('low_carb')
  // Pool de proteína permitido (vegetal primeiro se restrição veg; sempre filtrado por violates).
  // Sob low_carb, só boosters de baixo carbo (tofu, pasta de amendoim, ovo, atum) entram, para
  // não estourar o teto de 100g de carbo ao reforçar proteína.
  const protPool = (isVeg ? PROTEIN_BOOSTERS_VEG : [...PROTEIN_BOOSTERS_ANIMAL, ...PROTEIN_BOOSTERS_VEG])
    .filter(b => !violates(boosterToFood(b)))
    .filter(b => !isLowCarb || isLowCarbBooster(b))
  // Sob low_carb, fibra só de fontes low-carb (chia, linhaça, brócolis); não aveia/leguminosa.
  const fiberPool = FIBER_BOOSTERS.filter(b => !violates(boosterToFood(b))).filter(b => !isLowCarb || isLowCarbBooster(b))
  const protMinFor = (kind: 'principal' | 'cafe' | 'lanche') =>
    kind === 'principal' ? (isGlp1 ? 30 : 25) : kind === 'cafe' ? 20 : (isGlp1 ? 12 : 10)
  // Escolhe o 1º booster (rotacionado por dia, p/ variar) cujas calorias CABEM no orçamento.
  // 1ª passada prefere um item AINDA NÃO presente no dia (variedade); 2ª aceita qualquer que caiba.
  const pickFitting = (pool: Booster[], di: number, headroom: number, used?: Set<string>): Booster | null => {
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < pool.length; i++) {
        const b = pool[(di + i) % pool.length]
        if (b.cal > headroom) continue
        if (pass === 0 && used?.has(b.name.toLowerCase())) continue
        return b
      }
    }
    return null
  }
  // Nome-base de um alimento (antes da medida), em minúsculas, para detectar repetição no dia.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseName = (f: any): string => String(typeof f === 'object' && f ? (f.name ?? '') : f).split('–')[0].trim().toLowerCase()

  const days = parsed?.days ?? []
  days.forEach((day: any, di: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const meals = day?.meals ?? []
    if (meals.length === 0) return

    // ORÇAMENTO CALÓRICO: a meta de calorias é DURA. Só reforçamos proteína/fibra DENTRO de
    // +8% da meta do dia (proteína nunca pode estourar o emagrecimento do paciente GLP-1).
    const tgtKcal = ctx.targetCalories
      ? ((ctx.highCalDays ?? []).includes(day.day) ? Math.round(ctx.targetCalories * 1.2) : ctx.targetCalories)
      : 0
    const cap = tgtKcal ? tgtKcal * 1.08 : Infinity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dayKcal = () => meals.reduce((s: number, m: any) => s + (Number(m.calories) || 0), 0)
    const headroom = () => cap - dayKcal()
    let fiberAdds = 0
    // Nomes-base já presentes no dia (alimentos da IA + boosters inseridos) — p/ não repetir booster.
    const usedNames = new Set<string>()
    for (const m of meals) for (const f of (m.foods ?? [])) usedNames.add(baseName(f))

    // PASSO 1 — piso de proteína POR refeição (resolve "café só de pão"), só se couber no orçamento
    for (const meal of meals) {
      const foods = (meal.foods ?? []).filter((f: any) => typeof f === 'object' && f) // eslint-disable-line @typescript-eslint/no-explicit-any
      if (foods.length === 0) continue
      const kind = mealKind(meal.type)
      const need = protMinFor(kind)
      const cur = foods.reduce((s: number, f: any) => s + (Number(f.protein) || 0), 0) // eslint-disable-line @typescript-eslint/no-explicit-any
      if (cur >= need) continue
      // Existe fonte proteica DE VERDADE nesta refeição? Precisa ser DENSA em proteína (>=12g E a
      // proteína responder por >=30% das calorias), senão pão/cuscuz/macarrão (carbo com ~8g) seriam
      // escalados como "proteína", dobrando o carboidrato sem atingir o piso. Nesse caso, insere booster.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const src = foods.filter((f: any) => (Number(f.protein) || 0) >= 12 && (Number(f.protein) || 0) * 4 >= 0.3 * (Number(f.calories) || 1)).sort((a: any, b: any) => (b.protein || 0) - (a.protein || 0))[0]
      if (src) {
        // Escala SÓ a fonte proteica existente (teto 2x), e só o quanto couber no orçamento calórico.
        const wanted = Math.min(2, need / Math.max(cur, 1))
        const addKcalAtFull = (Number(src.calories) || 0) * (wanted - 1)
        const factor = addKcalAtFull <= headroom() ? wanted : 1 + Math.max(0, headroom()) / Math.max(Number(src.calories) || 1, 1)
        if (factor > 1.01) { scaleFoodInPlace(src, factor); normalizeMenuTotals({ days: [day] }) }
      } else if (protPool.length) {
        // Sem fonte proteica de verdade: insere 1 booster permitido que caiba no orçamento (e varie no dia).
        const b = pickFitting(protPool, di, headroom(), usedNames)
        if (b) { meal.foods.push(boosterToFood(b)); usedNames.add(b.name.toLowerCase()); normalizeMenuTotals({ days: [day] }) }
      }
    }

    normalizeMenuTotals({ days: [day] })

    // PASSO 2 — proteína DIÁRIA via SWAP calórico-neutro: a 1500 kcal não dá pra só ADICIONAR
    // proteína sem estourar calorias, então TROCAMOS o maior acompanhamento de carboidrato
    // (proteína baixa, carbo alto) por uma fonte de proteína de calorias parecidas. Mantém as
    // calorias na meta E sobe a proteína (postura proteína-primeiro do GLP-1). Máx. 3 trocas/dia.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dayProtein = () => meals.reduce((s: number, m: any) => s + (Number(m.protein) || 0), 0)
    let swaps = 0
    while (protDay > 0 && dayProtein() < protDay * 0.92 && swaps < 3 && protPool.length) {
      // Maior acompanhamento de carboidrato do dia (proteína < 6g, carbo > 8g).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let victim: { meal: any; idx: number; cal: number } | null = null
      for (const meal of meals) {
        const foods = meal.foods ?? []
        for (let k = 0; k < foods.length; k++) {
          const f = foods[k]
          if (!f || typeof f !== 'object') continue
          if ((Number(f.protein) || 0) < 6 && (Number(f.carbs) || 0) > 8) {
            const cal = Number(f.calories) || 0
            if (!victim || cal > victim.cal) victim = { meal, idx: k, cal }
          }
        }
      }
      if (!victim) break
      // Boosters permitidos cujas calorias <= as da vítima (troca nunca aumenta as calorias do dia).
      // Entre os 3 mais proteicos que cabem, prefere um AINDA NÃO usado no dia (variedade); senão rotaciona.
      const fits = protPool.filter(b => b.cal <= victim!.cal).sort((a, b) => b.p - a.p)
      if (!fits.length) break
      const top3 = fits.slice(0, 3)
      const fitB = top3.find(b => !usedNames.has(b.name.toLowerCase())) ?? top3[(di + swaps) % top3.length]
      victim.meal.foods.splice(victim.idx, 1, boosterToFood(fitB))
      usedNames.add(fitB.name.toLowerCase())
      normalizeMenuTotals({ days: [day] })
      swaps++
    }

    // PASSO 3 — fibra DIÁRIA (tolerância -10%), só se couber no orçamento
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dayFiber = () => meals.reduce((s: number, m: any) => s + (Number(m.fiber) || 0), 0)
    if (fiberDay > 0 && dayFiber() < fiberDay * 0.9 && fiberAdds < 1) {
      const b = pickFitting(fiberPool, di, headroom(), usedNames)
      if (b) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const target = [...meals].sort((a: any, b: any) => (a.fiber || 0) - (b.fiber || 0))[0]
        target.foods.push(boosterToFood(b))
        usedNames.add(b.name.toLowerCase())
        fiberAdds++
        normalizeMenuTotals({ days: [day] })
      }
    }
  })
}

/**
 * LOW CARB (decisão de produto): teto de 100g de carboidrato/dia, forçado por SWAP calórico-neutro.
 * Troca o maior acompanhamento de carbo (proteína baixa, carbo alto) por um booster de baixo carbo
 * de calorias <= as da vítima, até o dia ficar <= 100g (máx 5 trocas). Roda só quando low_carb ativo.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enforceCarbCap(parsed: any, ctx: { restrictions: string[]; excluded: string[] }): void {
  if (!ctx.restrictions.includes('low_carb')) return
  const CAP = 100
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const violates = (food: any): boolean =>
    findMenuViolations([{ day: 'x', meals: [{ type: 'x', foods: [food] }] }], ctx.restrictions, ctx.excluded).length > 0
  const isVeg = ctx.restrictions.includes('vegetariano') || ctx.restrictions.includes('vegano')
  // Boosters de baixo carbo permitidos, do menor carbo para o maior.
  const pool = (isVeg ? PROTEIN_BOOSTERS_VEG : [...PROTEIN_BOOSTERS_ANIMAL, ...PROTEIN_BOOSTERS_VEG])
    .filter(isLowCarbBooster).filter(b => !violates(boosterToFood(b))).sort((a, b) => a.c - b.c)
  // NÃO retornamos cedo se o pool estiver vazio: o teto de carbo é DURO. Sem booster para trocar
  // (ex.: vegano low_carb com tofu/amendoim excluídos), caímos no reparo por ENCOLHIMENTO abaixo.
  for (const day of parsed?.days ?? []) {
    const meals = day?.meals ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dayCarb = () => meals.reduce((s: number, m: any) => s + (Number(m.carbs) || 0), 0)
    let swaps = 0
    while (pool.length && dayCarb() > CAP && swaps < 8) {
      // Maior fonte de carbo do dia = vítima. Inclui leguminosas carbudas (grão, feijão, lentilha):
      // mesmo sendo "proteína", sob low_carb elas são trocadas por uma proteína LOW-CARB que preserva
      // (ou aumenta) a proteína da refeição. É a única forma de baixar carbo no vegano low_carb.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let victim: { meal: any; idx: number; cal: number; carbs: number; protein: number } | null = null
      for (const meal of meals) {
        const foods = meal.foods ?? []
        for (let k = 0; k < foods.length; k++) {
          const f = foods[k]
          if (!f || typeof f !== 'object') continue
          const carbs = Number(f.carbs) || 0
          if (carbs > 8 && (!victim || carbs > victim.carbs)) {
            victim = { meal, idx: k, cal: Number(f.calories) || 0, carbs, protein: Number(f.protein) || 0 }
          }
        }
      }
      if (!victim) break
      // Booster low-carb que NÃO perca proteína (>= a da vítima - 2) e caiba nas calorias; senão o de
      // menor carbo que caiba. Se nenhum cabe, sai do swap e o encolhimento abaixo fecha o teto.
      const b = pool.find(x => x.cal <= victim!.cal && x.p >= victim!.protein - 2)
        || pool.find(x => x.cal <= victim!.cal)
      if (!b) break
      victim.meal.foods.splice(victim.idx, 1, boosterToFood(b))
      normalizeMenuTotals({ days: [day] })
      swaps++
    }
    // REPARO POR ENCOLHIMENTO PROPORCIONAL (teto duro, nunca silencioso): se ainda passa de 100g —
    // pool vazio, nenhum booster coube, ou carbo espalhado em itens pequenos — encolhe TODOS os itens
    // com carbo pela razão CAP/dia (piso 0.3 por passada), repetindo até dayCarb <= CAP. Reduzir a
    // porção de carbo é honesto e não depende de existir substituto.
    let guard = 0
    while (dayCarb() > CAP && guard < 12) {
      guard++
      // mira 95g (não 100) para a margem absorver o arredondamento por item (senão para em 101g)
      const ratio = Math.max(0.3, (CAP * 0.95) / dayCarb())
      for (const meal of meals) for (const f of (meal.foods ?? [])) {
        if (f && typeof f === 'object' && (Number(f.carbs) || 0) > 1) scaleFoodInPlace(f, ratio)
      }
      normalizeMenuTotals({ days: [day] })
    }
  }
}

/**
 * TETO DE KCAL POR REFEIÇÃO (clínico): GLP-1 = 400 kcal; bariátrica = 200 kcal (a mais restritiva
 * vence quando ambos). Se a refeição passa do teto, reduz PRIMEIRO os itens não-proteicos (preserva
 * a proteína); só escala a proteína se ela sozinha já estourar. Roda por último (clamp de segurança).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enforceMealCalorieCap(parsed: any, ctx: { isGlp1: boolean; isBariatric: boolean }): void {
  const cap = ctx.isBariatric ? 200 : ctx.isGlp1 ? 400 : 0
  if (!cap) return
  for (const day of parsed?.days ?? []) {
    for (const meal of day?.meals ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const foods = (meal.foods ?? []).filter((f: any) => typeof f === 'object' && f)
      if (foods.length === 0) continue
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sumCal = () => foods.reduce((s: number, f: any) => s + (Number(f.calories) || 0), 0)
      if (sumCal() <= cap) continue
      // "Proteína de verdade" = densa (>=12g E proteína responde por >=30% das kcal). Pão/cuscuz com
      // ~8g NÃO contam (são carbo): assim o teto encolhe o carbo, não o trata como proteína a preservar.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isDense = (f: any) => (Number(f.protein) || 0) >= 12 && (Number(f.protein) || 0) * 4 >= 0.3 * (Number(f.calories) || 1)
      // PASSO 1 — encolhe primeiro os NÃO densos em proteína (carbo/gordura): tira o excedente deles.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const others = foods.filter((f: any) => !isDense(f))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const othersKcal = others.reduce((s: number, f: any) => s + (Number(f.calories) || 0), 0)
      if (othersKcal > 0) {
        const factor = Math.max(0.15, (othersKcal - Math.min(sumCal() - cap, othersKcal)) / othersKcal)
        for (const f of others) scaleFoodInPlace(f, factor)
      }
      // PASSO 2 — se AINDA passa do teto, a proteína densa sozinha estoura.
      if (sumCal() > cap) {
        if (ctx.isBariatric) {
          // BARIÁTRICA: refeição pequena DE VERDADE. Apara a PROTEÍNA até o teto, mas nunca abaixo do
          // PISO da refeição (não o máximo da IA). A proteína do dia vem da SOMA das 6 refeições.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const protItems = foods.filter((f: any) => isDense(f))
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const prot = protItems.reduce((s: number, f: any) => s + (Number(f.protein) || 0), 0)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const protKcal = protItems.reduce((s: number, f: any) => s + (Number(f.calories) || 0), 0)
          const kind = mealKind(meal.type)
          const floor = kind === 'principal' ? 25 : kind === 'cafe' ? 20 : 12
          const nonProtKcal = sumCal() - protKcal
          const sCap = protKcal > 0 ? Math.max(0, cap - nonProtKcal) / protKcal : 1
          const sFloor = prot > floor ? floor / prot : 1
          const sp = Math.min(1, Math.max(sCap, sFloor))
          for (const f of protItems) scaleFoodInPlace(f, sp)
        }
        // GLP-1 (teto 400, estômago maior): PROTEÍNA VENCE — deixa a refeição passar do teto.
      }
      normalizeMenuTotals({ days: [day] })
    }
  }
}

/** Classifica o tipo de refeição em chave canônica (distingue almoço de jantar, ao contrário de mealKind). */
function mealTypeKey(type: string): 'cafe' | 'almoco' | 'jantar' | 'lanche' {
  const t = (type || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (t.includes('almoco')) return 'almoco'
  if (t.includes('jantar')) return 'jantar'
  if (t.includes('lanche') || t.includes('ceia')) return 'lanche'
  return 'cafe'
}

/**
 * REFEIÇÃO MAIS CALÓRICA (highCalMealPriority): redistribui calorias de forma NEUTRA no total do dia
 * para a(s) refeição(ões) escolhida(s) (café/almoço/jantar) virar(em) a(s) maior(es). Respeita o teto
 * de kcal por refeição do GLP-1/bariátrica (o teto vence: se não dá pra ultrapassar as outras dentro
 * do teto, não força). Roda DEPOIS do teto por refeição.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enforceMealPriority(parsed: any, ctx: { priority?: string; isGlp1: boolean; isBariatric: boolean }): void {
  const pr = ctx.priority
  const targets = pr === 'cafe' ? ['cafe'] : pr === 'almoco' ? ['almoco'] : pr === 'jantar' ? ['jantar'] : pr === 'cafe_jantar' ? ['cafe', 'jantar'] : []
  if (!targets.length) return
  const cap = ctx.isBariatric ? 200 : ctx.isGlp1 ? 400 : Infinity
  for (const day of parsed?.days ?? []) {
    const meals = (day?.meals ?? []).filter((m: any) => Array.isArray(m?.foods) && m.foods.length > 0) // eslint-disable-line @typescript-eslint/no-explicit-any
    if (meals.length < 2) continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isTarget = (m: any) => targets.includes(mealTypeKey(m.type))
    const prMeals = meals.filter(isTarget)
    const others = meals.filter((m: any) => !isTarget(m)) // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!prMeals.length || !others.length) continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cal = (m: any) => Number(m.calories) || 0
    const D = meals.reduce((s: number, m: any) => s + cal(m), 0) // eslint-disable-line @typescript-eslint/no-explicit-any
    const maxOther = Math.max(...others.map(cal))
    if (Math.min(...prMeals.map(cal)) > maxOther) continue // prioritária já é a maior
    // Alvo: 15% acima da maior das outras, limitado pelo teto clínico. Se o teto não deixa passar, desiste.
    const desired = Math.min(cap, Math.round(maxOther * 1.15))
    if (desired <= maxOther) continue // teto vence: não dá pra tornar a prioritária a maior
    const Psum2 = desired * prMeals.length
    const Osum = D - prMeals.reduce((s: number, m: any) => s + cal(m), 0) // eslint-disable-line @typescript-eslint/no-explicit-any
    if (Osum <= 0 || Psum2 >= D * 0.9) continue // prioritárias consumiriam o dia todo
    const factorOthers = Math.max(0.3, (D - Psum2) / Osum)
    for (const m of prMeals) {
      const f = desired / Math.max(cal(m), 1)
      for (const food of m.foods) if (typeof food === 'object' && food) scaleFoodInPlace(food, f)
    }
    for (const m of others) for (const food of m.foods) if (typeof food === 'object' && food) scaleFoodInPlace(food, factorOthers)
    normalizeMenuTotals({ days: [day] })
  }
}

/**
 * ESTRUTURA DE REFEIÇÕES (determinística): garante que cada dia tenha EXATAMENTE os eventos
 * escolhidos (events), NA ORDEM. Fecha 3 buracos que antes dependiam só do prompt: (a) refeição
 * esvaziada pelo reparo que sumia; (b) jejum em que a IA gerava café/ceia FORA da janela; (c)
 * fracionado pedido (6) que a IA devolvia com 3. Remove refeições fora dos eventos e cria as
 * faltantes com um booster permitido (proteína + fibra), respeitando restrição/exclusão. Roda
 * ANTES do enforceDayTargets, que reequilibra as calorias do dia depois.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enforceMealStructure(parsed: any, ctx: { events: string[] | null; restrictions: string[]; excluded: string[]; isFasting?: boolean }): void {
  const events = ctx.events
  if (!events || !events.length) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const violates = (food: any): boolean =>
    findMenuViolations([{ day: 'x', meals: [{ type: 'x', foods: [food] }] }], ctx.restrictions, ctx.excluded).length > 0
  const isVeg = ctx.restrictions.includes('vegetariano') || ctx.restrictions.includes('vegano')
  const isLowCarb = ctx.restrictions.includes('low_carb')
  const protPool = (isVeg ? PROTEIN_BOOSTERS_VEG : [...PROTEIN_BOOSTERS_ANIMAL, ...PROTEIN_BOOSTERS_VEG])
    .filter(b => !violates(boosterToFood(b))).filter(b => !isLowCarb || isLowCarbBooster(b))
  const fiberPool = FIBER_BOOSTERS.filter(b => !violates(boosterToFood(b))).filter(b => !isLowCarb || isLowCarbBooster(b))
  const nrm = (t: string) => (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
  // Refeição mínima válida para um evento ausente: 1 proteína permitida + 1 fibra permitida.
  const buildMeal = (ev: string, di: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const foods: any[] = []
    if (protPool.length) foods.push(boosterToFood(protPool[di % protPool.length]))
    if (fiberPool.length) foods.push(boosterToFood(fiberPool[di % fiberPool.length]))
    return { type: ev, name: ev, foods }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(parsed?.days ?? []).forEach((day: any, di: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const present = (day?.meals ?? []).filter((m: any) => Array.isArray(m?.foods) && m.foods.length > 0)
    const used = new Set<number>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out: any[] = []
    for (const ev of events) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const idx = present.findIndex((mm: any, i: number) => !used.has(i) && nrm(mm.type) === nrm(ev))
      if (idx >= 0) { used.add(idx); out.push({ ...present[idx], type: ev }) }
      else out.push(buildMeal(ev, di))
    }
    // FORA do jejum, NÃO joga comida boa fora: mantém refeições extras que a IA gerou (rótulo divergente
    // ou refeição a mais). No JEJUM, descarta o que está fora da janela (café/ceia/lanche não previstos).
    if (!ctx.isFasting) present.forEach((m: any, i: number) => { if (!used.has(i)) out.push(m) }) // eslint-disable-line @typescript-eslint/no-explicit-any
    day.meals = out
  })
  normalizeMenuTotals(parsed)
}

/**
 * CAFÉ DA MANHÃ SEM CARNE (regra da nutricionista): troca carne vermelha / sardinha / atum / salmão
 * do café por uma proteína de café apropriada (ovo, queijo branco, iogurte; ou vegetal se vegano/veg),
 * escalada para ~as mesmas calorias. Frango e peixe branco no café continuam permitidos.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enforceBreakfastNoMeat(parsed: any, ctx: { restrictions: string[]; excluded: string[] }): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const violates = (food: any): boolean =>
    findMenuViolations([{ day: 'x', meals: [{ type: 'x', foods: [food] }] }], ctx.restrictions, ctx.excluded).length > 0
  const isVeg = ctx.restrictions.includes('vegetariano') || ctx.restrictions.includes('vegano')
  const isLowCarb = ctx.restrictions.includes('low_carb')
  // Proteínas apropriadas pro café: ovos, iogurte, queijo (animal) ou tofu/pasta de amendoim (vegetal).
  // Sob low_carb, só as de baixo carbo (ovos/queijo), senão iogurte (c8) reabriria o teto de carbo.
  const pool = (isVeg
    ? PROTEIN_BOOSTERS_VEG.filter(b => /tofu|amendoim/i.test(b.name))
    : PROTEIN_BOOSTERS_ANIMAL.filter(b => /ovo|iogurte|queijo/i.test(b.name))
  ).filter(b => !violates(boosterToFood(b))).filter(b => !isLowCarb || isLowCarbBooster(b))
  if (!pool.length) return
  const isBannedName = (name: string): boolean => {
    const n = norm(name)
    if (SAFE_COMPOUNDS.some(c => n.includes(c))) return false // carne de soja/vegetal liberada
    return BREAKFAST_BANNED.some(k => n.includes(norm(k)))
  }
  for (const day of parsed?.days ?? []) {
    let changed = false
    for (const meal of day?.meals ?? []) {
      if (mealKind(meal.type) !== 'cafe') continue
      const foods = meal.foods ?? []
      for (let k = 0; k < foods.length; k++) {
        const f = foods[k]
        if (!f || typeof f !== 'object' || typeof f.name !== 'string') continue
        if (!isBannedName(f.name)) continue
        const b = pool[k % pool.length]
        const sub = boosterToFood(b)
        const cal = Number(f.calories) || 0
        if (cal > 0 && sub.calories > 0) scaleFoodInPlace(sub, Math.max(0.5, Math.min(2, cal / sub.calories)))
        foods.splice(k, 1, sub)
        changed = true
      }
    }
    if (changed) normalizeMenuTotals({ days: [day] })
  }
}

// Equivalentes BRASILEIROS para a allowlist (carbo e fruta; proteína/fibra reusam os boosters).
const BR_CARBS: Booster[] = [
  { name: 'Arroz integral', measure: '4 colheres de sopa', grams: 120, cal: 154, p: 3.2, c: 33, f: 1.2, fib: 2.7 },
  { name: 'Mandioca cozida', measure: '1 pedaço', grams: 100, cal: 125, p: 1, c: 30, f: 0.3, fib: 1.8 },
  { name: 'Batata-doce cozida', measure: '1 unidade', grams: 120, cal: 103, p: 1.9, c: 24, f: 0.1, fib: 3.6 },
]
const BR_FRUITS: Booster[] = [
  { name: 'Banana', measure: '1 unidade', grams: 100, cal: 89, p: 1.1, c: 23, f: 0.3, fib: 2.6 },
  { name: 'Mamão papaia', measure: '1 fatia', grams: 150, cal: 60, p: 0.7, c: 15, f: 0.2, fib: 2.7 },
]

/** Um alimento é "brasileiro" se ALGUMA palavra significativa dele está na ALLOWED_BR (ou é composto
 * seguro tipo leite de coco / carne de soja). Senão é atípico (risoto de cevadinha, espargos, farro). */
function isBrazilianFood(name: string): boolean {
  // SÓ o nome do alimento, sem a medida ("Risoto – 2 xícaras (200g)" -> "risoto"): senão "xícaras",
  // "colheres" etc. casariam tokens por engano (ex.: "cara" dentro de "xícaras").
  const base = norm(String(name).split('–')[0].split('(')[0])
  // QUALIFICADORES ATÍPICOS vencem TUDO (inclusive o composto seguro "couve flor"): "arroz de couve-flor",
  // "arroz negro", "feijão azuki", "lasanha de berinjela"... têm palavra brasileira mas são versões fit.
  if (ATYPICAL_TERMS.some(t => base.includes(t))) return false
  if (SAFE_COMPOUNDS.some(c => base.includes(c))) return true
  const words = base.split(/[^a-z]+/).filter(w => w.length >= 3 && !BR_STOPWORDS.has(w))
  if (!words.length) return true // sem palavra significativa: não mexe
  // startsWith (não includes) p/ pegar plural (frango/frangos) sem casar pedaços ("cara" em "carambola").
  return words.some(w => ALLOWED_BR.has(w) || [...ALLOWED_BR].some(t => t.length >= 4 && (w.startsWith(t) || t.startsWith(w))))
}

/**
 * ALLOWLIST de comida brasileira (país = Brasil): troca por equivalente brasileiro qualquer alimento
 * que NÃO seja reconhecido como brasileiro (nenhuma palavra na ALLOWED_BR). Pega o que a denylist
 * não lista (risoto de cevadinha, espargos, farro, mix de berries...). Roda DEPOIS do reparo (a
 * denylist já tirou os compostos tipo "couve de bruxelas") e antes da estrutura/tetos.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enforceBrazilianAllowlist(parsed: any, ctx: { isBrazil: boolean; restrictions: string[]; excluded: string[] }): void {
  if (!ctx.isBrazil) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const violates = (food: any): boolean => findMenuViolations([{ day: 'x', meals: [{ type: 'x', foods: [food] }] }], ctx.restrictions, ctx.excluded).length > 0
  const isVeg = ctx.restrictions.includes('vegetariano') || ctx.restrictions.includes('vegano')
  const isLowCarb = ctx.restrictions.includes('low_carb')
  const protPool = (isVeg ? PROTEIN_BOOSTERS_VEG : [...PROTEIN_BOOSTERS_ANIMAL, ...PROTEIN_BOOSTERS_VEG]).filter(b => !violates(boosterToFood(b))).filter(b => !isLowCarb || isLowCarbBooster(b))
  const carbPool = (isLowCarb ? [] : BR_CARBS).filter(b => !violates(boosterToFood(b)))
  const fruitPool = (isLowCarb ? [] : BR_FRUITS).filter(b => !violates(boosterToFood(b)))
  const fiberPool = FIBER_BOOSTERS.filter(b => !violates(boosterToFood(b))).filter(b => !isLowCarb || isLowCarbBooster(b))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pick = (food: any): any | null => {
    const c = Number(food.carbs) || 0, p = Number(food.protein) || 0, cal = Number(food.calories) || 0
    let pool: Booster[] = []
    if (p >= 8 && p * 4 >= c * 4) pool = protPool
    else if (c > 10 && cal > 55) pool = carbPool.length ? carbPool : fiberPool
    else if (c > 8) pool = fruitPool.length ? fruitPool : fiberPool
    else pool = fiberPool
    if (!pool.length) pool = protPool.length ? protPool : fiberPool
    if (!pool.length) return null
    const sub = boosterToFood(pool[0])
    if (cal > 0 && sub.calories > 0) scaleFoodInPlace(sub, Math.max(0.4, Math.min(2.5, cal / sub.calories)))
    return sub
  }
  for (const day of parsed?.days ?? []) {
    let changed = false
    for (const meal of day?.meals ?? []) {
      const foods = meal.foods ?? []
      for (let k = 0; k < foods.length; k++) {
        const f = foods[k]
        if (!f || typeof f !== 'object' || typeof f.name !== 'string') continue
        if (isBrazilianFood(f.name)) continue
        const sub = pick(f)
        if (sub) { foods.splice(k, 1, sub); changed = true }
      }
    }
    if (changed) normalizeMenuTotals({ days: [day] })
  }
}

/** Regenera a LISTA DE COMPRAS a partir dos alimentos FINAIS do cardápio (após reparos/swaps/boosters),
 * em vez de usar a lista da IA (que pode citar item removido/trocado). Nomes-base únicos, sem medida. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function regenerateShoppingList(parsed: any): void {
  const seen = new Set<string>()
  const list: string[] = []
  for (const day of parsed?.days ?? []) {
    for (const meal of day?.meals ?? []) {
      for (const f of meal?.foods ?? []) {
        const name: string = typeof f === 'string' ? f : (f?.name ?? '')
        if (!name) continue
        let base = name.split('–')[0].split('(')[0].trim()
        base = base.replace(/\s*\d+\s*(g|ml|kg|un|unid|colher|x[ií]cara|fatia|unidade|concha|prato|posta|fil[ée]|lata|pote|punhado|rodela|ramo)s?\b.*$/i, '').trim()
        if (!base || base.length < 2) continue
        const key = base.toLowerCase()
        if (!seen.has(key)) { seen.add(key); list.push(base) }
      }
    }
  }
  if (list.length) parsed.shoppingList = list
}

/**
 * Gera cardápio personalizado semanal usando OpenAI.
 * Retorna alimentos com calorias individuais para validação precisa.
 */
export async function generateWeeklyMenu(user: UserProfile, options?: {
  excludedFoods?: string[]
  cyclePhase?: string
  highCalorieDays?: string[]
  country?: string
  fastingProtocol?: string
  highCalMealPriority?: string
  mealStructure?: MealStructure
  /** Progresso FIEL da geração (0-100) para a UI: a barra anda conforme os dias reais chegam da IA. */
  onProgress?: (p: { percent: number; label: string; day?: number; totalDays?: number }) => void
}): Promise<{
  title: string
  description: string
  days: Array<{
    day: string
    meals: Array<{
      type: string
      name: string
      foods: Array<{ name: string; calories: number; protein: number; carbs: number; fat: number; fiber?: number }>
      calories: number
      protein: number
      carbs: number
      fat: number
      fiber?: number
    }>
  }>
  tips: string[]
  shoppingList: string[]
  substitutions?: Array<{ original: string; alternatives: string[] }>
}> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('OpenAI API key não configurada')

  const goalText = user.goal === 'perder_peso'
    ? 'perder peso com déficit calórico moderado'
    : user.goal === 'ganhar_massa'
    ? 'ganhar massa muscular com superávit calórico'
    : user.goal === 'saude_geral'
    ? 'melhorar saúde geral e bem-estar'
    : 'manter o peso atual'

  // Bariátrica e GLP-1 são INDEPENDENTES (paciente pode ter ambos)
  const isGlp1 = !!user.medication && user.medication !== 'nenhum'
  const isBariatricMenu = !!user.hadBariatricSurgery
  const medicationText = isGlp1
    ? `MEDICAÇÃO GLP-1 EM USO: ${user.medication}${user.medicationDosage ? ` (${user.medicationDosage})` : ''}. OBRIGATÓRIO: (1) porções menores — refeições de no máximo 300-400 kcal; (2) proteína alta em cada refeição (mínimo 25-30g no almoço/jantar) para preservar músculo; (3) fibras elevadas (frutas, legumes, aveia) para regular trânsito intestinal; (4) evitar frituras, ultraprocessados e açúcar refinado; (5) incluir dicas específicas sobre alimentação com GLP-1.`
    : ''
  const bariatricText = isBariatricMenu
    ? `PACIENTE PÓS-BARIÁTRICA. REGRAS OBRIGATÓRIAS: (1) refeições MUITO pequenas — máximo 150-200 kcal cada, distribuídas em 5-6 refeições; (2) proteína prioritária SEMPRE primeiro no prato (20-25g/refeição principal, total 60-90g/dia); (3) ZERO açúcar refinado, doces, refrigerantes, sucos com açúcar (síndrome de dumping); (4) evitar gorduras saturadas, frituras e ultraprocessados; (5) texturas macias preferenciais (cozidos, purês, picadinhos) — evitar carne em fibras grossas, casca dura, amendoim inteiro; (6) consistência: nunca beber líquidos junto com refeição (intervalo 30 min antes/depois); (7) suplementação obrigatória: lembrar B12, ferro, cálcio, vitamina D nas dicas; (8) tipos de refeição: café, lanche manhã, almoço, lanche tarde, jantar, ceia opcional.`
    : ''

  // Estrutura de refeições (escolha do diálogo > default inteligente > perfil > jejum).
  const { fractioned, events: mealEvents } = computeMealStructure(user, options)

  // ── Progresso FIEL para a UI ────────────────────────────────────────────────
  // A barra reflete o trabalho REAL entregue: as refeições que chegam da IA (streaming), somando
  // TODAS as chamadas (geração principal + preenchimentos). A IA às vezes devolve poucos dias na 1ª
  // chamada e o resto vem nos preenchimentos — somar por refeições garantidas mantém a barra fiel
  // independentemente de como a IA divide o trabalho.
  const TOTAL_DAYS = 7
  const mealsPerDay = mealEvents?.length || 3
  const expectedTotalMeals = TOTAL_DAYS * mealsPerDay
  let progFrac = 0
  let lastPct = 0
  let mealsSecured = 0  // refeições já garantidas (= dias aceitos × refeições/dia); cresce a cada chamada
  let securedDays = 0
  const report = (percent: number, label: string, day?: number) => {
    const p = Math.max(lastPct, Math.max(0, Math.min(100, Math.round(percent)))) // nunca anda pra trás
    lastPct = p
    try { options?.onProgress?.({ percent: p, label, day, totalDays: TOTAL_DAYS }) } catch { /* noop */ }
  }
  // Usado por TODAS as chamadas à IA (principal e preenchimentos): o total de refeições garantidas +
  // as que estão chegando agora, sobre o total esperado, ocupa de 8% a 90%.
  const onMenuStream = (s: { chars: number; mealsDone: number; daysDone: number }) => {
    const total = Math.min(mealsSecured + s.mealsDone, expectedTotalMeals)
    const frac = total / expectedTotalMeals
    if (frac > progFrac) progFrac = frac
    const day = Math.min(securedDays + Math.max(s.daysDone, 1), TOTAL_DAYS)
    report(8 + 82 * progFrac, `Preparando o dia ${day} de ${TOTAL_DAYS}...`, day)
  }

  // Pisos EFETIVOS de proteína/fibra calculados aqui (não no perfil global): garante a meta
  // correta mesmo quando o targetProtein salvo está defasado (ex.: GLP-1 que nunca recomputou).
  const weightKg = user.currentWeight || 70
  const protPerKg = (isGlp1 || isBariatricMenu) ? 1.8 : user.goal === 'ganhar_massa' ? 2.0 : 1.5
  const effProteinFloor = Math.max(user.targetProtein ?? 0, Math.round(weightKg * protPerKg))
  // Fibra: 35g GLP-1 (prompt da cliente); mais baixo onde 35 é irreal (jejum tem poucas refeições;
  // bariátrica tem porções minúsculas e fibra alta é desaconselhada no pós-op).
  const effFiberFloor = options?.fastingProtocol ? 22
    : isBariatricMenu ? 25
    : isGlp1 ? Math.max(user.targetFiber ?? 25, 35)
    : Math.max(user.targetFiber ?? 25, 0)

  const calorieTarget = user.targetCalories
    ? `Meta calórica diária OBRIGATÓRIA: ${user.targetCalories} kcal/dia (margem aceitável ±5%, ou seja ${Math.round(user.targetCalories * 0.95)}–${Math.round(user.targetCalories * 1.05)} kcal)`
    : ''
  const macroTarget = user.targetProtein
    ? `Macros diários OBRIGATÓRIOS: proteína ${effProteinFloor}g (PISO, não pode ficar abaixo) | carboidratos ${user.targetCarbs ?? '?'}g | gorduras ${user.targetFat ?? '?'}g | fibras ${effFiberFloor}g (PISO) (margem aceitável ±10% por macro)`
    : ''

  // Só horários preferidos; a quantidade de refeições é governada pela estrutura abaixo (mealEvents).
  const mealRoutineText = user.mealRoutine && (user.mealRoutine.breakfastTime || user.mealRoutine.lunchTime || user.mealRoutine.dinnerTime)
    ? `Horários preferidos${user.mealRoutine.breakfastTime ? `; café da manhã ~${user.mealRoutine.breakfastTime}` : ''}${user.mealRoutine.lunchTime ? `; almoço ~${user.mealRoutine.lunchTime}` : ''}${user.mealRoutine.dinnerTime ? `; jantar ~${user.mealRoutine.dinnerTime}` : ''}`
    : ''

  const DIETARY_RULES: Record<string, string> = {
    sem_lactose: 'INTOLERÂNCIA À LACTOSE — PROIBIDO: leite de vaca, iogurte comum, queijos (minas, mussarela, prato, coalho, parmesão), requeijão, creme de leite, manteiga, leite condensado, doce de leite, chocolate ao leite, whey protein com lactose, sorvete de leite. USE APENAS alternativas sem lactose: leite de amêndoas, leite de coco, leite de aveia, leite de soja, iogurte de coco, queijo vegetal, manteiga ghee.',
    sem_gluten: 'DOENÇA CELÍACA / SEM GLÚTEN — PROIBIDO: trigo, pão francês, pão de forma comum, macarrão de trigo, pizza, biscoitos comuns, aveia não certificada, cevada, centeio, malte, cuscuz de trigo. USE APENAS: arroz, tapioca, mandioca, batata, quinoa, milho, pão sem glúten, macarrão de arroz/milho.',
    vegetariano: 'VEGETARIANO — PROIBIDO: todas as carnes (boi, porco, frango, peixe, frutos do mar, embutidos). PERMITIDO: ovos, laticínios, leguminosas.',
    vegano: 'VEGANO — PROIBIDO: todas as carnes, laticínios, ovos, mel e qualquer derivado animal. USE APENAS alimentos de origem vegetal.',
    low_carb: 'LOW CARB — limite a no máximo 100g de carboidratos por dia. Evite arroz, massas, pães, batata, açúcar, frutas muito doces. Priorize proteínas, gorduras boas e vegetais não amiláceos.',
    diabetes: 'DIABETES — evite açúcar refinado, doces, refrigerantes, sucos açucarados, farinha branca, pão branco. Priorize carboidratos integrais, proteínas magras, fibras e vegetais de baixo índice glicêmico.',
  }
  const relevantRestrictions = (user.dietaryPreferences ?? []).filter(p => p !== 'nenhuma' && DIETARY_RULES[p])
  const dietaryText = relevantRestrictions.length > 0
    ? `⚠️ RESTRIÇÕES CRÍTICAS (VIOLAR = RESPOSTA REJEITADA):\n${relevantRestrictions.map(p => `  • ${DIETARY_RULES[p]}`).join('\n')}`
    : ''

  // CONDIÇÃO CLÍNICA DECLARADA (medicalLimitations): texto livre vai pro prompt E condições comuns
  // viram exclusão determinística de ingredientes (hipertensão -> embutidos/enlatados; colesterol -> fritura).
  const medDesc = user.medicalLimitations?.hasLimitation ? (user.medicalLimitations.description ?? '').trim() : ''
  const medExclusions: string[] = []
  let medRuleText = ''
  if (medDesc) {
    const md = norm(medDesc)
    if (/hipertens|press[ãa]o alta|press[ãa]o arterial/.test(md)) {
      medExclusions.push('presunto', 'salsicha', 'linguiça', 'linguica', 'bacon', 'mortadela', 'salame', 'enlatado', 'embutido', 'salgadinho', 'atum em agua', 'atum em água', 'sardinha em lata', 'atum em lata', 'em conserva')
      medRuleText += ' HIPERTENSÃO: reduzir sódio — sem embutidos, enlatados, salgadinhos nem excesso de sal; preferir temperos naturais.'
    }
    if (/colesterol/.test(md)) {
      medExclusions.push('bacon', 'torresmo', 'banha', 'linguiça', 'linguica')
      medRuleText += ' COLESTEROL ALTO: evitar gordura saturada e frituras; preferir grelhados/cozidos e gorduras boas.'
    }
  }
  const medLimText = medDesc
    ? `⚠️ CONDIÇÃO DE SAÚDE DECLARADA: "${medDesc}". Adapte o cardápio com cautela a essa condição.${medRuleText}`
    : ''

  // Restrições FORÇADAS no pós-processamento: as do quiz + a sintética metabólica (GLP-1/bariátrica:
  // zero açúcar refinado + sem fritura). E a lista de exclusões soma os alimentos digitados + os médicos.
  const isBrazilCtx = /brasil/i.test(options?.country || user.country || 'Brasil')
  const isVeganCtx = relevantRestrictions.includes('vegano')
  const enforcedRestrictions = [
    ...relevantRestrictions,
    ...((isGlp1 || isBariatricMenu) ? ['metabolica'] : []),
    ...(isBrazilCtx ? ['atipico_br'] : []),
    // tofu só é permitido para vegano (precisa dele como proteína low-carb); para os demais, é atípico.
    ...((isBrazilCtx && !isVeganCtx) ? ['atipico_br_tofu'] : []),
  ]
  const allExcluded = [...(options?.excludedFoods ?? []), ...medExclusions]

  const excludedText = allExcluded.length > 0
    ? `🚫 ALIMENTOS EXCLUÍDOS — PROIBIDO usar em QUALQUER forma ou preparo: ${allExcluded.join(', ')}. Exemplo: se "frango" está excluído, NÃO use frango grelhado, assado, desfiado, à passarinho, coxa, sobrecoxa, filé nem caldo de frango. Substitua SEMPRE por outras proteínas/alimentos permitidos (carne bovina, peixe, ovo, leguminosas).`
    : ''

  const country = options?.country || user.country || 'Brasil'
  const isBrazil = /brasil/i.test(country)
  const countryText = `País / Referência cultural: ${country}`
  const brazilianFoodGuide = isBrazil
    ? `\n⚠️ REGRA CRÍTICA — COMIDA BRASILEIRA DO DIA A DIA (vale para TODOS, qualquer objetivo, restrição ou condição médica): o cardápio DEVE ser baseado no prato brasileiro tradicional. A BASE do almoço e jantar é SEMPRE arroz + feijão + uma proteína (frango, carne bovina, carne suína magra, ovos ou peixe como tilápia/sardinha) + salada/legume cozido. Use exclusivamente alimentos que qualquer brasileiro compra no supermercado/feira e come na rotina.\n- Café da manhã: pão francês, pão integral, tapioca, cuscuz nordestino, ovos mexidos/cozidos, queijo branco/minas, requeijão, leite, café com leite, banana, mamão, manga, melancia, abacaxi, aveia, granola, iogurte natural, vitamina de fruta.\n- Almoço/jantar: arroz branco/integral, feijão preto/carioca, frango grelhado/assado/desfiado, carne moída/bovina, bife, peixe (tilápia, sardinha, merluza), ovos, batata-doce, mandioca/aipim, purê de batata, abóbora, farofa, vinagrete, salada verde (alface, rúcula, tomate, pepino, cenoura), brócolis, couve refogada, quiabo, vagem, escarola.\n- Lanches/ceia: fruta, castanhas/amendoim, queijo branco, iogurte, pão integral com pasta de frango/atum/ovo, panqueca de banana, tapioca, vitamina.\n- 🚫 ABSOLUTAMENTE PROIBIDO (mesmo em dieta/restrição): pratos "fit"/estrangeiros e atípicos como hambúrguer de lentilha/grão-de-bico, homus, falafel, cuscuz marroquino, tofu no dia a dia, quinoa todo dia, edamame, teriyaki, sushi, ramen, wrap, tortilla, panqueca americana, bowls importados. TAMBÉM PROIBIDO as versões "fit" de comida brasileira: arroz negro/selvagem/basmati/arbóreo/de couve-flor, feijão azuki, lasanha/macarrão de berinjela/abobrinha/pupunha, pão low carb/nuvem (use arroz branco/integral e feijão preto/carioca/branco comuns). Substitua sempre por um prato brasileiro equivalente (ex.: em vez de "hambúrguer de lentilha" use "carne moída com feijão"; em vez de "homus" use "pasta de ovo ou de frango"; em vez de "cuscuz marroquino" use "arroz" ou "cuscuz nordestino de milho").\n- Use medidas caseiras familiares: colher de sopa, colher de servir, xícara, prato fundo, concha, fatia, unidade.`
    : ''

  const cycleText = options?.cyclePhase
    ? `Adaptar ao ciclo menstrual: sim — Fase atual: ${options.cyclePhase}. ${
        options.cyclePhase === 'menstrual' ? 'Priorize ferro, magnésio e alimentos anti-inflamatórios.'
        : options.cyclePhase === 'folicular' ? 'Priorize proteínas e alimentos ricos em estrogênio natural.'
        : options.cyclePhase === 'ovulatória' ? 'Priorize antioxidantes, zinco e alimentos leves.'
        : 'Priorize cálcio, vitamina B6 e alimentos que reduzem retenção de líquidos.'
      }`
    : ''

  const highCalDaysList = options?.highCalorieDays && options.highCalorieDays.length > 0
    ? options.highCalorieDays
    : []
  const highCalText = highCalDaysList.length > 0 && user.targetCalories
    ? `Dias com refeição mais calórica (+20%): ${highCalDaysList.join(', ')} (meta: ${Math.round(user.targetCalories * 1.2)} kcal SOMENTE nesses dias específicos, os demais dias mantêm ${user.targetCalories} kcal)`
    : ''

  const fastingText = options?.fastingProtocol
    ? `JEJUM INTERMITENTE: O usuário pratica protocolo ${options.fastingProtocol}. TODAS as refeições devem ficar concentradas APENAS dentro da janela alimentar correspondente — por exemplo, ${options.fastingProtocol === '16:8' ? 'janela de 8h (ex: 12h-20h)' : options.fastingProtocol === '18:6' ? 'janela de 6h (ex: 12h-18h)' : options.fastingProtocol === '20:4' ? 'janela de 4h (ex: 14h-18h)' : options.fastingProtocol === '14:10' ? 'janela de 10h (ex: 10h-20h)' : 'janela de 12h (ex: 8h-20h)'}. O jejum REDUZ o número de refeições: gere apenas ${options.fastingProtocol === '20:4' ? '1 a 2 refeições' : options.fastingProtocol === '18:6' ? '2 refeições' : '2 a 3 refeições'} no total, SEM ceia, SEM lanche da manhã antes da janela e SEM nenhuma refeição fora da janela alimentar.`
    : ''

  const mealPriorityMap: Record<string, string> = {
    cafe: 'Priorize o café da manhã como a refeição mais calórica do dia.',
    almoco: 'Priorize o almoço como a refeição mais calórica do dia.',
    jantar: 'Priorize o jantar como a refeição mais calórica do dia.',
    cafe_jantar: 'Priorize o café da manhã e o jantar como as refeições mais calóricas do dia.',
  }
  const mealPriorityText = options?.highCalMealPriority
    ? mealPriorityMap[options.highCalMealPriority] || ''
    : ''

  const activityMap: Record<string, string> = {
    sedentario: 'sedentário',
    leve: 'levemente ativo',
    moderado: 'moderadamente ativo',
    intenso: 'muito ativo',
    muito_intenso: 'extremamente ativo'
  }

  // IMC (contexto clínico) e guia de culinária por país (Camada 4 do agente nutricionista da cliente).
  const imc = user.height && user.currentWeight ? Math.round((user.currentWeight / Math.pow(user.height / 100, 2)) * 10) / 10 : 0
  const imcCtx = imc ? (imc < 18.5 ? 'abaixo do peso' : imc < 25 ? 'peso normal' : imc < 30 ? 'sobrepeso' : 'obesidade') : ''
  const CULINARY: Record<string, string> = {
    italia: 'massas integrais, azeite, tomate, peixe, ricota, polenta, vegetais mediterrâneos',
    japao: 'arroz japonês, peixe grelhado/cru, tofu, missô, edamame, algas, vegetais refogados',
    'estados unidos': 'frango assado, batata-doce, ovos, pão integral, manteigas de oleaginosas, saladas compostas',
    eua: 'frango assado, batata-doce, ovos, pão integral, manteigas de oleaginosas, saladas compostas',
    mexico: 'tortilhas integrais, feijão preto, frango, guacamole, vegetais coloridos',
    franca: 'pão integral, queijos com moderação, peixe, aves, vegetais, iogurte',
    argentina: 'carnes grelhadas, chimichurri, vegetais assados, empanadas integrais',
    portugal: 'bacalhau, arroz, leguminosas, azeite, vegetais cozidos',
  }
  const culinaryGuide = isBrazil
    ? brazilianFoodGuide
    : (CULINARY[norm(country)]
        ? `\nCULINÁRIA DE ${country}: use ${CULINARY[norm(country)]}. Pratos típicos variados desse país (tabela nutricional local). NÃO adapte pratos brasileiros.`
        : `\nUse alimentos típicos, acessíveis e do dia a dia de ${country}.`)

  const prompt = `Você é um nutricionista com 20 anos de experiência clínica. Gera cardápios semanais de 7 dias com qualidade profissional para o app Bem.AI. Leia e aplique TODOS os campos do perfil e TODAS as preferências abaixo; nenhum campo pode ser ignorado.

${dietaryText ? `${dietaryText}\n\n` : ''}${medLimText ? `${medLimText}\n\n` : ''}DADOS DO PERFIL DO USUÁRIO:
- Nome: ${user.name}
- Sexo: ${user.gender === 'masculino' ? 'Masculino' : user.gender === 'feminino' ? 'Feminino' : 'Outro'}
- Idade: ${user.age} anos
- Peso atual: ${user.currentWeight} kg
- Altura: ${user.height} cm${imc ? ` | IMC: ${imc} (${imcCtx})` : ''}
- Objetivo: ${goalText}
- Nível de atividade física: ${activityMap[user.activityLevel] || user.activityLevel}
- ${calorieTarget}
- ${macroTarget}
${mealRoutineText ? `- ${mealRoutineText}` : ''}
${medicationText ? `- ${medicationText}` : ''}
${bariatricText ? `- ${bariatricText}` : ''}

PREFERÊNCIAS DO CARDÁPIO:
- ${countryText}
${culinaryGuide}
${excludedText ? `- ${excludedText}` : ''}
${highCalText ? `- ${highCalText}` : ''}
${fastingText ? `- ${fastingText}` : ''}
${mealPriorityText ? `- ${mealPriorityText}` : ''}
${cycleText ? `- ${cycleText}` : ''}

REGRAS (gere o cardápio direto, sem explicar o raciocínio):
${isGlp1 ? '- GLP-1: refeições pequenas e densas em proteína, no máx ~400 kcal cada, fibra alta, hidratação.\n' : ''}${isBariatricMenu ? '- Pós-bariátrica: 6 refeições fracionadas, porções mínimas, proteína primeiro, zero açúcar, texturas macias.\n' : ''}- ESTRUTURA: ${mealEvents ? `EXATAMENTE estes ${mealEvents.length} eventos por dia, NESTA ordem (campo "type"): ${mealEvents.join(', ')}.${options?.fastingProtocol ? ' Todas dentro da janela do jejum, nada fora dela.' : fractioned ? ' Lanches e ceia leves (~80-180 kcal) mas SEMPRE com proteína.' : ' Sem lanches nem ceia.'}` : 'Café da Manhã, Almoço e Jantar (3 principais).'}
- PROTEÍNA: cada dia ≥ ${effProteinFloor}g total e ≥ ${effFiberFloor}g de fibra. Por refeição: almoço/jantar ≥ ${isGlp1 ? 30 : 25}g, café ≥ 20g, lanche/ceia ≥ ${isGlp1 ? 12 : 10}g. NENHUMA refeição sem proteína (café só de pão é proibido).
- CAFÉ DA MANHÃ sem carne vermelha, sardinha nem atum (use ovo, queijo, iogurte, requeijão, pão integral, tapioca, fruta, aveia).
- VARIEDADE: não repita a proteína principal em dias seguidos (≥5 proteínas na semana); varie as saladas. Café preto e chá sem açúcar NÃO entram como alimento.
${highCalDaysList.length > 0 ? `- Dias +20% (${highCalDaysList.join(', ')}) têm ~20% mais calorias que os demais.\n` : ''}${mealPriorityText ? '- A refeição principal escolhida é a mais calórica do dia.\n' : ''}${excludedText ? '- Exclusões e restrições têm prioridade ABSOLUTA sobre tudo.\n' : ''}- CONCISO: no MÁXIMO 3 alimentos por refeição principal e 2 por lanche/ceia, nomes curtos. Formato "Nome – medida caseira (Xg)" com o peso em gramas, e o campo "fiber" (g) em cada alimento e refeição (carne/ovo/laticínio ~0; pão/aveia/fruta/legume/leguminosa têm fibra).
- Cada dia somando${user.targetCalories ? ` ~${user.targetCalories} kcal (entre ${Math.round(user.targetCalories * 0.95)} e ${Math.round(user.targetCalories * 1.05)})` : ' a meta calórica'}; o total de cada refeição é a soma dos alimentos. Inclua 5 dicas curtas${isGlp1 ? ' (2+ sobre GLP-1)' : ''}${isBariatricMenu ? ' (2+ sobre pós-bariátrica)' : ''}.

Retorne APENAS um objeto JSON válido (sem markdown, sem receitas, sem campos além dos abaixo):
{
  "title": "Título do cardápio",
  "description": "Breve descrição",
  "days": [
    {
      "day": "Segunda-feira",
      "meals": [
        {
          "type": "Café da Manhã",
          "name": "Nome da refeição",
          "foods": [
            {"name": "Pão integral – 2 fatias (50g)", "calories": 124, "protein": 5.2, "carbs": 22.0, "fat": 1.4, "fiber": 3.4},
            {"name": "Ovo cozido – 1 unidade (50g)", "calories": 72, "protein": 6.3, "carbs": 0.6, "fat": 4.8, "fiber": 0}
          ],
          "calories": 196,
          "protein": 11.5,
          "carbs": 22.6,
          "fat": 6.2,
          "fiber": 3.4
        }
      ]
    }
  ],
  "tips": ["dica 1", "dica 2", "dica 3", "dica 4", "dica 5"],
  "shoppingList": ["item 1", "item 2", "item 3"]
}`

  const EXPECTED_DAYS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo']
  // 0 retries para violação: NÃO descartamos o cardápio variado para regenerar (isso, somado a um
  // timeout, colapsava em 7 dias clonados/iguais). Geramos uma vez (com dedup/variedade) e o
  // repairViolations faz cumprir restrições/exclusões NO LUGAR, preservando a variedade.
  const MAX_RETRIES = 0
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any = null
    let violations: ReturnType<typeof findMenuViolations> = []

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const attemptPrompt = attempt === 0
        ? prompt
        : `${prompt}\n\n🚫 A geração anterior incluiu ITENS PROIBIDOS: ${violations.slice(0, 10).map(v => `"${v.food}" (${v.rule})`).join('; ')}. Refaça o cardápio INTEIRO sem esses itens nem similares, respeitando 100% as restrições.`

      report(8, 'Conectando com a nutricionista IA...')
      parsed = await callOpenAIMenuJson(apiKey, attemptPrompt, 16384, 3, onMenuStream)

      // Saneia o que veio da geração principal (descarta refeições sem alimentos)
      sanitizeMenu(parsed)
      if (!parsed || !Array.isArray(parsed.days)) parsed = { ...(parsed || {}), days: [] }

      // Assinatura de conteúdo do dia (nomes dos alimentos) — para detectar dias repetidos.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const daySig = (d: any): string => (d?.meals ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .flatMap((m: any) => (m?.foods ?? []).map((f: any) => String(f?.name ?? '').split('–')[0].trim().toLowerCase()))
        .sort().join('|')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const accepted = new Map<string, any>()  // dia -> objeto (apenas dias ÚNICOS, com alimentos)
      const seenSigs = new Set<string>()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tryAccept = (d: any): boolean => {
        if (!d || !Array.isArray(d.meals) || d.meals.length === 0) return false
        const sig = daySig(d)
        if (!sig || seenSigs.has(sig)) return false // dia idêntico a outro = descartado (anti-repetição)
        const slot = (EXPECTED_DAYS.includes(d.day) && !accepted.has(d.day)) ? d.day : EXPECTED_DAYS.find(dn => !accepted.has(dn))
        if (!slot) return false
        seenSigs.add(sig)
        accepted.set(slot, { ...d, day: slot })
        return true
      }
      for (const d of parsed.days) tryAccept(d)
      securedDays = accepted.size; mealsSecured = securedDays * mealsPerDay // progresso: dias já garantidos

      // Completa dias faltantes/repetidos (loop, 16000 tokens, forçando variedade real)
      let faltam = EXPECTED_DAYS.filter(dn => !accepted.has(dn))
      let fillTries = 0
      while (faltam.length > 0 && fillTries < 3) {
        fillTries++
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const existingSummary = [...accepted.values()].map((d: any) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            `- ${d.day}: ${(d.meals || []).map((m: any) => `${m.type}: ${(m.foods || []).map((f: any) => String(f?.name || '').split('–')[0].trim()).join(', ')}`).join(' | ')}`).join('\n')
          // Mesma estrutura de refeições do cardápio principal (nomeada), para os dias
          // completados NÃO virem com contagem diferente (evita semana com dias de 6 e de 3).
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const refMeals = ([...accepted.values()][0] as any)?.meals?.length ?? (mealEvents?.length ?? 3)
          const structureRule = mealEvents
            ? `cada um com EXATAMENTE estes ${mealEvents.length} eventos NESTA ordem (campo type): ${mealEvents.join(', ')}`
            : `cada um com EXATAMENTE ${refMeals} refeições`
          const fillPrompt = `Gere ${faltam.length} dia(s) de cardápio NOVOS e DIFERENTES entre si, mantendo o mesmo padrão nutricional e as mesmas restrições.

OS DIAS ABAIXO JÁ EXISTEM — NÃO REPITA nenhuma combinação deles. Varie as proteínas (frango, peixe, carne, ovo, leguminosas), os acompanhamentos e as frutas:
${existingSummary}

${dietaryText ? dietaryText + '\n\n' : ''}${medLimText ? medLimText + '\n\n' : ''}${medicationText ? medicationText + '\n\n' : ''}${bariatricText ? bariatricText + '\n\n' : ''}REGRAS:
- Gere EXATAMENTE ${faltam.length} dia(s), ${structureRule}, com TODOS os alimentos preenchidos (nunca uma refeição sem foods)
- Metas diárias (PISO): proteína ≥ ${effProteinFloor}g e fibra ≥ ${effFiberFloor}g; cada refeição com fonte de proteína (almoço/jantar ≥ ${isGlp1 ? 30 : 25}g, café ≥ 20g, lanche/ceia ≥ ${isGlp1 ? 12 : 10}g)
- Cada novo dia DIFERENTE dos já existentes E diferente entre si
- Use "Nome – medida caseira (Xg)" e inclua calories/protein/carbs/fat/fiber por alimento e por refeição

Retorne APENAS JSON: { "days": [ { "day": "Nome-do-dia", "meals": [ ...mesma estrutura com fiber... ] } ] }`
          const fillParsed = await callOpenAIMenuJson(apiKey, fillPrompt, 16384, 3, onMenuStream)

          if (Array.isArray(fillParsed?.days)) for (const d of fillParsed.days) { sanitizeMenu({ days: [d] }); tryAccept(d) }
          securedDays = accepted.size; mealsSecured = securedDays * mealsPerDay // progresso: dias garantidos após o preenchimento
        } catch (e) {
          console.warn('[cardápio] preenchimento de dias faltantes falhou:', e instanceof Error ? e.message : e)
          break
        }
        faltam = EXPECTED_DAYS.filter(dn => !accepted.has(dn))
      }

      // Monta os 7 dias na ordem. Último recurso (raro): para um slot sem dia próprio, faz RODÍZIO
      // entre os dias únicos já aceitos (evita os 7 dias clonados IGUAIS quando há mais de um único).
       
      report(92, 'Ajustando porções e variedade...')
      const pool = [...accepted.values()]
      let cloneIdx = 0
      parsed.days = EXPECTED_DAYS
        .map(dn => {
          const real = accepted.get(dn)
          if (real) return real
          if (!pool.length) return null
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const base: any = pool[cloneIdx++ % pool.length]
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return { ...base, day: dn, meals: base.meals.map((m: any) => ({ ...m, foods: (m.foods || []).map((f: any) => ({ ...f })) })) }
        })
        .filter(Boolean)

      // Fonte única de cálculo: total de cada refeição = soma REAL dos alimentos
      normalizeMenuTotals(parsed)

      // Valida restrições/exclusões; se houver violação, regenera (até MAX_RETRIES)
      violations = findMenuViolations(parsed?.days ?? [], enforcedRestrictions, allExcluded)
      if (violations.length === 0) break
      console.warn(`[cardápio] tentativa ${attempt + 1}: ${violations.length} violação(ões) de restrição:`, violations.slice(0, 5))
    }

    // Se ainda houver violações após as tentativas, REPARA (troca/remove o item proibido) em vez
    // de falhar. O cardápio segue sendo o real da IA — só fazemos cumprir os filtros do usuário.
    if (violations.length > 0) {
      console.warn(`[cardápio] reparando ${violations.length} violação(ões) remanescente(s):`, violations.slice(0, 8))
      repairViolations(parsed, enforcedRestrictions, allExcluded)
      normalizeMenuTotals(parsed)
      violations = findMenuViolations(parsed?.days ?? [], enforcedRestrictions, allExcluded)
    }

    // Só falha se, em caso extremo, o reparo esvaziou o cardápio. Nunca entrega item proibido.
    if (!parsed?.days?.length || violations.length > 0) {
      throw new Error('A IA não respeitou as restrições após várias tentativas.')
    }

    // ALLOWLIST de comida brasileira: troca por equivalente brasileiro o que não for reconhecido
    // como comida do dia a dia (pega o que a denylist não lista: risoto de cevadinha, espargos, farro).
    enforceBrazilianAllowlist(parsed, { isBrazil, restrictions: enforcedRestrictions, excluded: allExcluded })

    // ESTRUTURA DE REFEIÇÕES (determinística): cada dia com EXATAMENTE os eventos escolhidos
    // (ou os do jejum) — reconstrói refeição esvaziada, remove café/ceia fora da janela do jejum,
    // completa o fracionado que veio com menos refeições. Roda ANTES do ajuste de calorias.
    enforceMealStructure(parsed, { events: mealEvents, restrictions: enforcedRestrictions, excluded: allExcluded, isFasting: !!options?.fastingProtocol })

    // Ajuste honesto de porções para chegar perto da meta calórica (gramas + medida + macros),
    // e re-normaliza os totais para que continuem sendo a soma real dos alimentos.
    enforceDayTargets(parsed, user.targetCalories, highCalDaysList)
    humanizePortions(parsed) // porções em tom humano (5 colheres, 1 xícara, 4 unidades)
    normalizeMenuTotals(parsed)

    // REDE DE SEGURANÇA — proteína por refeição + metas diárias de proteína/fibra. Só insere/escala
    // itens que não violam restrição/exclusão. normalizeMenuTotals fecha os totais como soma real.
    enforceProteinFiber(parsed, {
      restrictions: enforcedRestrictions,
      excluded: allExcluded,
      isGlp1,
      protDay: effProteinFloor,
      fiberDay: effFiberFloor,
      targetCalories: user.targetCalories,
      highCalDays: highCalDaysList,
    })

    // TETO CLÍNICO de kcal por refeição (GLP-1 400 / bariátrica 200) — por ÚLTIMO, como clamp de
    // segurança, preservando a proteína. normalizeMenuTotals fecha os totais.
    enforceMealCalorieCap(parsed, { isGlp1, isBariatric: isBariatricMenu })

    // REFEIÇÃO MAIS CALÓRICA escolhida no diálogo (redistribuição neutra, respeitando o teto acima).
    enforceMealPriority(parsed, { priority: options?.highCalMealPriority, isGlp1, isBariatric: isBariatricMenu })

    // LOW CARB por ÚLTIMO: teto de 100g/dia. Roda DEPOIS de proteína/fibra e dos tetos por refeição,
    // para que nenhum booster de baixo carbo (até 5g cada) reabra o estouro. Tem a palavra final.
    enforceCarbCap(parsed, { restrictions: enforcedRestrictions, excluded: allExcluded })

    // CAFÉ DA MANHÃ SEM CARNE/ATUM (regra da nutricionista) — por ÚLTIMO, depois do carbCap (que sob
    // low_carb poderia re-inserir atum no café). Troca carne vermelha/sardinha/atum por ovo/queijo.
    enforceBreakfastNoMeat(parsed, { restrictions: enforcedRestrictions, excluded: allExcluded })
    normalizeMenuTotals(parsed)

    // LISTA DE COMPRAS coerente: derivada dos alimentos FINAIS (após todos os reparos/swaps/boosters).
    report(96, 'Finalizando porções e lista de compras...')
    regenerateShoppingList(parsed)

    // BLINDAGEM do retorno: a IA às vezes omite tips/shoppingList/substitutions (ou vêm não-array);
    // a tela faz .map nesses campos. Garante arrays/strings para a UI nunca quebrar ao renderizar.
    parsed.title = typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title : 'Cardápio Semanal'
    parsed.description = typeof parsed.description === 'string' ? parsed.description : ''
    parsed.tips = Array.isArray(parsed.tips) ? parsed.tips : []
    parsed.shoppingList = Array.isArray(parsed.shoppingList) ? parsed.shoppingList : []
    parsed.substitutions = Array.isArray(parsed.substitutions) ? parsed.substitutions : []

    report(99, 'Quase pronto...')
    return parsed
  } catch (error: unknown) {
    console.error('Erro ao gerar cardápio:', error)
    throw new Error('Não foi possível gerar o cardápio. Tente novamente.')
  }
}
