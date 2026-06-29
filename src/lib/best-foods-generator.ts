import type { BestFoodCategory } from '@/data/best-brazilian-foods'

const GOAL_TEXT: Record<string, string> = {
  perder_peso: 'perda de peso e emagrecimento saudável (déficit calórico, alta saciedade, low-glycemic)',
  ganhar_massa: 'ganho de massa muscular magra (superávit calórico limpo, alto teor proteico)',
  manter_peso: 'manutenção de peso e saúde metabólica (equilíbrio nutricional completo)',
  saude_geral: 'saúde geral, longevidade e bem-estar (anti-inflamatório, micronutrientes densos)',
}

export async function generateBestFoods(
  goal: string,
  country: string
): Promise<BestFoodCategory[]> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('API key não configurada')

  const goalDesc = GOAL_TEXT[goal] || 'saúde geral e bem-estar'

  const prompt = `Você é um nutricionista de elite, especialista em ${goalDesc}.

Objetivo do usuário: ${goalDesc}
País/referência cultural: ${country}

Gere uma lista de 6 categorias com os MELHORES alimentos do mundo para este objetivo específico.
Critérios OBRIGATÓRIOS:
- Foque nos alimentos com MAIOR densidade nutricional para o objetivo
- Inclua alimentos amplamente disponíveis em ${country}
- NÃO limite a alimentos regionais — inclua superfoods e alimentos de referência global sempre que sejam os melhores para o objetivo
- Cada alimento deve ter justificativa técnica e nutricional precisa
- Custo: baixo (acessível no dia a dia), médio (consumo regular viável), alto (ocasional/premium)

Retorne APENAS JSON válido (sem markdown):
[
  {
    "category": "Nome da categoria",
    "icon": "emoji único representativo",
    "description": "frase curta sobre por que é importante para o objetivo",
    "foods": [
      {
        "name": "Nome do alimento",
        "benefits": "benefícios nutricionais específicos para o objetivo (1-2 frases técnicas)",
        "portion": "porção recomendada (ex: 100g, 1 unidade, 2 colheres de sopa)",
        "costLevel": "baixo" | "médio" | "alto"
      }
    ]
  }
]

Regras:
- Exatamente 6 categorias
- 3 a 4 alimentos por categoria
- Seja específico nos benefícios (cite nutrientes, mecanismos)
- As categorias devem cobrir: proteínas, carboidratos, gorduras boas, vegetais/fibras, micronutrientes e hidratação/outros`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt + '\n\nIMPORTANTE: retorne {"foods": [...array acima...]}' }],
      max_tokens: 2000,
    }),
  })

  if (!response.ok) throw new Error('Erro ao gerar lista de alimentos')

  const data = await response.json()
  const parsed = JSON.parse(data.choices[0].message.content)
  const list = Array.isArray(parsed) ? parsed : (parsed.foods ?? [])
  if (!Array.isArray(list) || list.length === 0) throw new Error('Resposta inválida')
  return list as BestFoodCategory[]
}

export interface ShoppingTip {
  title: string
  description: string
}

export async function generateCountryShoppingTips(country: string): Promise<ShoppingTip[]> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('API key não configurada')

  const prompt = `Você é um especialista em nutrição e economia doméstica em ${country}.

Gere 5 dicas de compra e alimentação ESPECÍFICAS para quem mora em ${country}.
As dicas devem:
- Mencionar alimentos, lojas, hábitos ou práticas reais e comuns em ${country}
- Ser práticas e aplicáveis no dia a dia local
- NÃO repetir dicas genéricas universais (como "compre da safra" ou "congele porções")
- Considerar a cultura alimentar, produtos típicos e hábitos de mercado do país
Exemplos do que seria específico para um país: mercados típicos do país, alimentos base baratos da culinária local, combinações tradicionais nutritivas, marcas/tipos de produtos acessíveis, épocas de promoção típicas, etc.

Retorne APENAS JSON válido: {"tips": [{"title": "...", "description": "..."}]}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
    }),
  })

  if (!response.ok) throw new Error('Erro ao gerar dicas')
  const data = await response.json()
  const parsed = JSON.parse(data.choices[0].message.content)
  return (parsed.tips ?? []) as ShoppingTip[]
}
