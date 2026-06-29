import type { UserProfile, WeightEntry, BodyMeasurement, SleepEntry, CycleConfig } from '@/types'

export interface ProgressAnalysisInput {
  user: UserProfile
  weightHistory: WeightEntry[]
  bodyMeasurements: BodyMeasurement[]
  sleepHistory: SleepEntry[]
  cycleConfig: CycleConfig | null
}

export interface ProgressAnalysisResult {
  overview: string
  positives: string[]
  challenges: Array<{ issue: string; reason: string }>
  stagnation: Array<{ period: string; reason: string }>
  recommendations: string[]
}

export async function generateProgressAnalysis(
  input: ProgressAnalysisInput
): Promise<ProgressAnalysisResult> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('Chave de API não configurada')

  const { user, weightHistory, bodyMeasurements, sleepHistory, cycleConfig } = input

  const goalMap: Record<string, string> = {
    perder_peso: 'perder peso',
    ganhar_massa: 'ganhar massa muscular',
    manter_peso: 'manter o peso',
    saude_geral: 'melhorar saúde geral',
  }
  const activityMap: Record<string, string> = {
    sedentario: 'sedentário',
    leve: 'levemente ativo',
    moderado: 'moderadamente ativo',
    intenso: 'muito ativo',
    muito_intenso: 'extremamente ativo',
  }

  // Prepara histórico de peso ordenado
  const sortedWeights = [...weightHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const weightSummary = sortedWeights.slice(-20).map(e => ({
    data: new Date(e.date).toLocaleDateString('pt-BR'),
    peso: `${e.weight}kg`,
    obs: e.notes || '',
  }))

  // Prepara histórico de composição corporal
  const sortedMeasurements = [...bodyMeasurements].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  const measurementSummary = sortedMeasurements.slice(-10).map(e => {
    const parts: string[] = []
    if (e.bodyFat !== undefined) parts.push(`gordura: ${e.bodyFat}%`)
    if (e.waist !== undefined) parts.push(`cintura: ${e.waist}cm`)
    if (e.hips !== undefined) parts.push(`quadril: ${e.hips}cm`)
    if (e.arm !== undefined) parts.push(`braço: ${e.arm}cm`)
    return { data: new Date(e.date).toLocaleDateString('pt-BR'), medidas: parts.join(', '), obs: e.notes || '' }
  })

  // Resumo de sono
  const avgSleep = sleepHistory.length > 0
    ? (sleepHistory.slice(0, 30).reduce((s, e) => s + e.duration, 0) / Math.min(sleepHistory.length, 30)).toFixed(1)
    : null
  const sleepQualities = sleepHistory.slice(0, 14).map(e => e.quality)
  const poorSleepCount = sleepQualities.filter(q => q === 'ruim' || q === 'regular').length

  // Ciclo menstrual — só relevante para usuárias não masculinas
  const isMale = user.gender === 'masculino'
  const hasCycle = !isMale && cycleConfig !== null

  const cycleInfo = !isMale
    ? `- Acompanha ciclo menstrual no app: ${hasCycle ? 'sim' : 'não'}`
    : ''

  const cycleInstruction = !isMale
    ? '3. Se houver ciclo menstrual, considere que a fase lútea pode causar retenção de líquido de 1-3kg e que isso NÃO é ganho de gordura real'
    : ''

  const coachRole = isMale
    ? 'Você é um coach de saúde e bem-estar especializado em análise de progresso. Analise os dados abaixo e gere um feedback personalizado, empático e motivador em português do Brasil.'
    : 'Você é uma coach de saúde e bem-estar especializada em análise de progresso feminino. Analise os dados de progresso abaixo e gere um feedback personalizado, empático e motivador em português do Brasil.'

  const prompt = `${coachRole}

PERFIL:
- Nome: ${user.name}
- Objetivo: ${goalMap[user.goal] || user.goal}
- Atividade física: ${activityMap[user.activityLevel] || user.activityLevel}
- Sono médio registrado no app: ${user.averageSleepHours}h/noite
- Medicação GLP-1: ${user.medication !== 'nenhum' ? user.medication : 'nenhuma'}
${cycleInfo}
- IMC atual: ${(user.currentWeight / Math.pow(user.height / 100, 2)).toFixed(1)}
- Meta: ${user.currentWeight}kg → ${user.targetWeight}kg

HISTÓRICO DE PESO (${sortedWeights.length} registros):
${JSON.stringify(weightSummary, null, 2)}

COMPOSIÇÃO CORPORAL E MEDIDAS (${sortedMeasurements.length} registros):
${measurementSummary.length > 0 ? JSON.stringify(measurementSummary, null, 2) : 'Nenhum registro ainda'}

SONO:
- Média de horas dormidas (últimos registros): ${avgSleep ? `${avgSleep}h` : 'sem dados'}
- Dias com sono ruim ou regular nos últimos 14 registros: ${poorSleepCount}

INSTRUÇÕES:
1. Identifique períodos de evolução e estagnação no peso/medidas
2. Faça associações inteligentes (ex: peso estacionado + sono ruim = cortisol elevado dificultando resultados)
${cycleInstruction}
4. Seja específico(a) com os dados — cite datas e valores reais quando possível
5. Tom: empático, motivador, profissional — como um(a) coach que conhece bem a pessoa
6. NÃO mencione inteligência artificial, modelos de IA ou qualquer tecnologia

Retorne APENAS JSON válido (sem markdown):
{
  "overview": "2-3 frases resumindo o progresso geral de forma personalizada",
  "positives": ["ponto positivo 1", "ponto positivo 2", "ponto positivo 3"],
  "challenges": [
    { "issue": "desafio identificado", "reason": "possível explicação/causa" }
  ],
  "stagnation": [
    { "period": "período em que não houve evolução (ex: março/2025)", "reason": "provável motivo baseado nos dados" }
  ],
  "recommendations": ["conselho personalizado 1", "conselho personalizado 2", "conselho personalizado 3", "conselho personalizado 4"]
}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1200,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    throw new Error((err as any).error?.message || 'Erro ao gerar análise')
  }

  const data = await response.json()
  return JSON.parse(data.choices[0].message.content) as ProgressAnalysisResult
}
