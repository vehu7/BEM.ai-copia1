import type { BrazilianRecipe } from '@/data/brazilian-recipes'

const GOAL_TEXT: Record<string, string> = {
  perder_peso:  'emagrecimento saudável (baixa caloria, alta saciedade, pouco processado)',
  ganhar_massa: 'ganho de massa muscular magra (alto teor proteico, carboidratos complexos)',
  manter_peso:  'manutenção de peso e equilíbrio nutricional',
  saude_geral:  'saúde geral, longevidade e bem-estar (anti-inflamatório, nutriente-denso)',
}

const CACHE_PREFIX = 'recipes_cache_v1_'

function cacheKey(goal: string, country: string) {
  return CACHE_PREFIX + goal + '_' + country.toLowerCase().replace(/\s+/g, '_')
}

export function getCachedRecipes(goal: string, country: string): BrazilianRecipe[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(goal, country))
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    // Cache válido por 7 dias
    if (Date.now() - ts > 7 * 24 * 60 * 60 * 1000) return null
    return data as BrazilianRecipe[]
  } catch {
    return null
  }
}

function setCachedRecipes(goal: string, country: string, recipes: BrazilianRecipe[]) {
  try {
    localStorage.setItem(cacheKey(goal, country), JSON.stringify({ data: recipes, ts: Date.now() }))
  } catch { /* quota exceeded — ignore */ }
}

export async function generateRecipes(
  goal: string,
  country: string
): Promise<BrazilianRecipe[]> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('API key não configurada')

  const goalDesc = GOAL_TEXT[goal] || 'saúde geral e bem-estar'

  const prompt = `Chef nutricionista especializado em ${goalDesc}. País: ${country}.

Gere 5 receitas saudáveis de ${country} para ${goalDesc}.
Seja CONCISO: ingredientes em lista curta, instruções em no máximo 4 passos diretos.

Retorne JSON: {"recipes":[...]} com este formato exato por receita:
{"id":"slug","name":"Nome","description":"1 frase","prepTime":20,"servings":2,"estimatedCost":"Baixo custo","difficulty":"fácil","tags":["Tag1","Tag2"],"ingredients":["qtd + item"],"instructions":["Passo curto 1","Passo curto 2","Passo curto 3"],"nutrition":{"calories":300,"protein":25,"carbs":30,"fat":8,"fiber":4},"tips":"1 dica curta"}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
    }),
  })

  if (!response.ok) throw new Error('Erro ao gerar receitas')

  const data = await response.json()
  const parsed = JSON.parse(data.choices[0].message.content)
  const list: BrazilianRecipe[] = parsed.recipes ?? []
  if (!Array.isArray(list) || list.length === 0) throw new Error('Resposta inválida')

  setCachedRecipes(goal, country, list)
  return list
}
