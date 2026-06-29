import { dbFetch, dbGet } from '@/lib/db-sync'
import type { FoodItem } from '@/types'

export interface CustomFoodNutrition {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sodium?: number
  sugar?: number
}

export async function estimateFoodNutrition(
  name: string,
  portion: string
): Promise<CustomFoodNutrition> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('Chave de API não configurada')

  const prompt = `Você é um nutricionista especialista em alimentos brasileiros e internacionais. Estime os valores nutricionais com precisão para a porção informada.

Alimento: ${name}
Porção: ${portion}

Retorne APENAS JSON válido (sem markdown):
{
  "calories": número inteiro (kcal),
  "protein": número com 1 decimal (g),
  "carbs": número com 1 decimal (g),
  "fat": número com 1 decimal (g),
  "fiber": número com 1 decimal (g),
  "sodium": número inteiro (mg) ou null,
  "sugar": número com 1 decimal (g) ou null
}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 250,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    throw new Error((err as any).error?.message || 'Erro ao calcular valores nutricionais')
  }

  const data = await response.json()
  return JSON.parse(data.choices[0].message.content) as CustomFoodNutrition
}

export async function saveCustomFoodDb(food: FoodItem, userId: string): Promise<void> {
  // Via REST direto (dbFetch), não supabase-js: o upsert era cancelado quando o
  // dialog de adicionar alimento fechava/re-renderizava logo após salvar, então
  // o alimento "novo" nunca chegava ao banco.
  const r = await dbFetch('POST', 'custom_foods?on_conflict=id', {
    id: food.id,
    name: food.name,
    category: food.category,
    portion: food.portion,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    fiber: food.fiber ?? 0,
    sodium: food.sodium ?? null,
    sugar: food.sugar ?? null,
    saturated_fat: food.saturatedFat ?? null,
    omega3: food.omega3 ?? null,
    cholesterol: food.cholesterol ?? null,
    is_brazilian: food.isBrazilian,
    is_healthy: food.isHealthy,
    barcode: food.barcode ?? null,
    added_by: userId,
    created_at: new Date().toISOString(),
  }, 'resolution=merge-duplicates')
  if (!r.ok) {
    // Não estoura para o usuário — alimento continua disponível em memória.
    console.warn('Não foi possível salvar alimento customizado no Supabase:', r.status, await r.text().catch(() => ''))
  }
}

export async function loadCustomFoodsDb(): Promise<FoodItem[]> {
  // Via REST (dbGet) em vez de supabase-js: a leitura roda no mount de /meals,
  // às vezes antes da sessão do supabase-js hidratar, e o cliente retornava
  // vazio (ou pendurava) — então o alimento salvo não reaparecia na busca.
  const res = await dbGet('custom_foods?select=*&order=created_at.desc&limit=1000')
  if (!res.ok) {
    console.warn('Não foi possível carregar custom_foods:', res.status, await res.text().catch(() => ''))
    return []
  }
  const data = await res.json().catch(() => [])
  if (!Array.isArray(data)) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((r: any) => ({
    id: r.id,
    name: r.name,
    category: r.category ?? 'outro',
    portion: r.portion,
    calories: r.calories,
    protein: r.protein,
    carbs: r.carbs,
    fat: r.fat,
    fiber: r.fiber ?? 0,
    sodium: r.sodium ?? undefined,
    sugar: r.sugar ?? undefined,
    saturatedFat: r.saturated_fat ?? undefined,
    omega3: r.omega3 ?? undefined,
    cholesterol: r.cholesterol ?? undefined,
    isBrazilian: r.is_brazilian ?? false,
    isHealthy: r.is_healthy ?? true,
    barcode: r.barcode ?? undefined,
  }))
}
