import type { UserProfile, FoodSubstitution } from '@/types'

const CACHE_KEY = 'bemai_substitutions_cache_v1'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 dias

interface CacheEntry {
  key: string
  timestamp: number
  data: FoodSubstitution[]
}

function readCache(): CacheEntry[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CacheEntry[]
    const now = Date.now()
    return parsed.filter(e => now - e.timestamp < CACHE_TTL_MS)
  } catch {
    return []
  }
}

function writeCache(entries: CacheEntry[]) {
  try {
    // Mantém apenas as 100 entradas mais recentes para não estourar storage
    const recent = entries.slice(-100)
    localStorage.setItem(CACHE_KEY, JSON.stringify(recent))
  } catch {
    // ignora
  }
}

function restrictionsKey(user: UserProfile): string {
  const parts = (user.dietaryPreferences ?? []).filter(p => p !== 'nenhuma').sort().join(',')
  return parts || 'none'
}

function buildRestrictionsText(user: UserProfile): string {
  const RULES: Record<string, string> = {
    sem_lactose: 'SEM LACTOSE — não inclua leite, iogurte, queijos, manteiga, requeijão, creme de leite, leite condensado ou qualquer derivado lácteo comum. Use versões vegetais.',
    sem_gluten: 'SEM GLÚTEN — não inclua trigo, pão comum, macarrão de trigo, aveia não certificada, cevada, centeio, malte.',
    vegetariano: 'VEGETARIANO — não inclua carnes de qualquer tipo. Pode usar ovos e laticínios.',
    vegano: 'VEGANO — não inclua carnes, laticínios, ovos, mel ou qualquer derivado animal.',
    low_carb: 'LOW CARB — priorize alternativas com baixo teor de carboidratos.',
    diabetes: 'DIABETES — priorize alternativas de baixo índice glicêmico, sem açúcar adicionado.',
  }
  const active = (user.dietaryPreferences ?? []).filter(p => p !== 'nenhuma' && RULES[p])
  if (active.length === 0) return ''
  return '\n⚠️ RESTRIÇÕES CRÍTICAS (RESPEITE OBRIGATORIAMENTE):\n' +
    active.map(p => `• ${RULES[p]}`).join('\n')
}

/**
 * Gera substituições nutricionalmente equivalentes via IA (gpt-4o-mini).
 * Retorna 5-8 alternativas por alimento, com macros e notas breves.
 * Respeita as restrições alimentares do usuário.
 * Resultados são cacheados em localStorage por 7 dias (por alimento+restrições).
 */
export async function generateSubstitutions(
  foodNames: string[],
  user: UserProfile,
  options?: { country?: string }
): Promise<FoodSubstitution[]> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('OpenAI API key não configurada')

  const cleanFoods = foodNames
    .map(f => f.replace(/\s*\(.*?\)\s*/g, '').replace(/\s*[-–]\s*\d+.*$/g, '').trim())
    .filter(f => f.length > 2)

  if (cleanFoods.length === 0) return []

  const restrictKey = restrictionsKey(user)
  const cache = readCache()

  // Verifica cache: retorna hits e identifica misses
  const hits: FoodSubstitution[] = []
  const missing: string[] = []
  for (const food of cleanFoods) {
    const k = `${food.toLowerCase()}|${restrictKey}`
    const hit = cache.find(c => c.key === k)
    if (hit && hit.data.length > 0) {
      hits.push(...hit.data)
    } else {
      missing.push(food)
    }
  }

  if (missing.length === 0) return hits

  const country = options?.country ?? user.country ?? 'Brasil'
  const restrictionsText = buildRestrictionsText(user)

  const prompt = `Você é um nutricionista brasileiro. Para cada alimento da lista abaixo, sugira 6 substitutos nutricionalmente equivalentes e culturalmente adequados.
${restrictionsText}

PAÍS / REFERÊNCIA: ${country}

ALIMENTOS PARA SUBSTITUIR:
${missing.map((f, i) => `${i + 1}. ${f}`).join('\n')}

REGRAS:
- Cada substituto deve ter macros reais (TACO ou USDA como referência)
- A porção sugerida deve gerar calorias aproximadamente equivalentes ao alimento original
- Inclua notas breves (máx 4 palavras) explicando o benefício do substituto
${restrictionsText ? '- RESPEITE RIGOROSAMENTE as restrições listadas acima' : ''}

Retorne APENAS JSON válido (sem markdown):
{
  "substitutions": [
    {
      "original": "Nome do alimento original",
      "substitutes": [
        {
          "name": "Nome do substituto",
          "portion": "medida caseira (Xg)",
          "calories": 123,
          "protein": 5.0,
          "carbs": 20.0,
          "fat": 2.0,
          "notes": "breve benefício"
        }
      ]
    }
  ]
}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3000,
      temperature: 0.6,
    }),
  })

  if (!response.ok) throw new Error('Erro na API do OpenAI')

  const data = await response.json()
  const text = (data.choices[0].message.content as string).trim()
  const parsed = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
  const generated: FoodSubstitution[] = Array.isArray(parsed.substitutions) ? parsed.substitutions : []

  // Salva no cache
  const newCache = [...cache]
  for (const sub of generated) {
    const k = `${sub.original.toLowerCase()}|${restrictKey}`
    const existingIdx = newCache.findIndex(c => c.key === k)
    const entry: CacheEntry = { key: k, timestamp: Date.now(), data: [sub] }
    if (existingIdx >= 0) newCache[existingIdx] = entry
    else newCache.push(entry)
  }
  writeCache(newCache)

  return [...hits, ...generated]
}
