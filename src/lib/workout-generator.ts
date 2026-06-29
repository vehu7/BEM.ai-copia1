import type { UserProfile, AIWorkoutPlan, WorkoutEnvironment } from '@/types'
import { EXERCISE_LIBRARY_NAMES, findExerciseGif } from '@/data/exercise-gifs'

interface GenerationMeasurements {
  weight: number
  waist?: number
  hips?: number
  chest?: number
  arm?: number
}

export interface WorkoutGenerationOptions {
  workoutPreference?: string   // 'aerobico_hiit' | 'maquinas' | 'sem_maquinas' | 'misto'
  objectives?: string[]
  workoutCount?: number        // 1-5
  addAerobic?: boolean
  sessionDurationPref?: string // '30' | '40' | '50' | '60'
  cycleAware?: boolean
  cyclePhase?: string
  mistoHomeSessions?: number
  mistoAcadSessions?: number
}

const OBJECTIVE_TEXT: Record<string, string> = {
  perda_peso_resistencia: 'perda de peso e resistência cardiovascular',
  ganho_massa: 'ganho de massa muscular e hipertrofia',
  definicao: 'definição muscular e redução de gordura',
  manutencao_saude: 'manutenção do corpo atual e saúde geral',
  resistencia_endurance: 'resistência e endurance físico',
  potencia_explosao: 'potência e explosão muscular',
  forca_pura: 'força pura e desenvolvimento de força máxima',
}

const PREFERENCE_TEXT: Record<string, string> = {
  aerobico_hiit: 'SOMENTE exercícios aeróbicos e HIIT (sem musculação)',
  maquinas: 'treinos em máquinas (leg press, puxador, supino máquina, etc.)',
  sem_maquinas: 'treinos com pesos livres e utensílios (halteres, barras, anilhas, peso corporal) — SEM máquinas',
  misto: 'treinos mistos combinando máquinas e pesos livres',
}

export async function generateAIWorkoutPlan(
  user: UserProfile,
  environment: WorkoutEnvironment,
  measurements: GenerationMeasurements,
  muscleGroups: string[] = [],
  homeEquipment: string[] = [],
  options: WorkoutGenerationOptions = {}
): Promise<AIWorkoutPlan> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('OpenAI API key não configurada')

  const {
    workoutPreference = 'misto',
    objectives = [],
    workoutCount = 3,
    addAerobic = false,
    sessionDurationPref = '50',
    cycleAware = false,
    cyclePhase,
    mistoHomeSessions = 1,
    mistoAcadSessions = 2,
  } = options

  const goalText = {
    perder_peso: 'perder peso e queimar gordura corporal',
    ganhar_massa: 'ganhar massa muscular e hipertrofia',
    manter_peso: 'manter o peso e melhorar condicionamento físico',
    saude_geral: 'saúde geral e bem-estar'
  }[user.goal] ?? 'saúde geral'

  const activityText = {
    sedentario: 'sedentário (sem atividade física regular)',
    leve: 'pouco ativo (1-2x por semana)',
    moderado: 'moderadamente ativo (3-4x por semana)',
    intenso: 'muito ativo (5-6x por semana)',
    muito_intenso: 'extremamente ativo (treinos diários)'
  }[user.activityLevel] ?? 'moderado'

  let envText: string
  if (environment === 'misto') {
    const homeEquipDesc = homeEquipment.length > 0
      ? `com os seguintes equipamentos disponíveis em casa: ${homeEquipment.join(', ')}`
      : 'com peso corporal em casa (sem equipamentos)'
    envText = `MISTO: ${mistoHomeSessions} sessão(ões) por semana EM CASA (${homeEquipDesc}) e ${mistoAcadSessions} sessão(ões) por semana NA ACADEMIA (com acesso completo a equipamentos). Indique claramente no nome de cada dia se é "Em Casa" ou "Academia".`
  } else if (environment === 'casa') {
    envText = homeEquipment.length > 0
      ? `em casa, com os seguintes equipamentos disponíveis: ${homeEquipment.join(', ')}`
      : 'em casa, apenas com peso corporal (sem equipamentos)'
  } else {
    envText = 'na academia, com acesso completo a equipamentos (máquinas, barras, halteres, cabos, anilhas)'
  }

  const muscleText = muscleGroups.length > 0
    ? `Grupos musculares PRIORITÁRIOS (dê ênfase especial a esses grupos em mais dias e exercícios): ${muscleGroups.join(', ')}`
    : 'Treino completo equilibrado sem prioridade específica'

  const medLine = user.medication && user.medication !== 'nenhum'
    ? `- Medicação em uso: ${user.medication}${user.medicationDosage ? ` (${user.medicationDosage})` : ''} — adapte o treino: evite exercícios de impacto muito alto, priorize recuperação adequada e respeite sinais de fadiga.`
    : ''

  const limitLine = user.medicalLimitations?.hasLimitation && user.medicalLimitations.description
    ? `- Limitações médicas/físicas: ${user.medicalLimitations.description} — ADAPTE todos os exercícios para respeitar essa condição.`
    : ''

  const dietPref = user.dietaryPreferences?.length > 0
    ? `- Preferências/restrições alimentares: ${user.dietaryPreferences.join(', ')} (considere nas dicas de nutrição pré/pós treino)`
    : ''

  const imc = measurements.weight / Math.pow(user.height / 100, 2)

  const objectivesText = objectives.length > 0
    ? `Objetivos específicos do treino: ${objectives.map(o => OBJECTIVE_TEXT[o] ?? o).join(', ')}`
    : `Objetivo geral: ${goalText}`

  const preferenceText = PREFERENCE_TEXT[workoutPreference] ?? 'treinos mistos'

  const durationLabel = sessionDurationPref === '60' ? '1 hora (60 minutos)' : `${sessionDurationPref} minutos`

  const aeroText = workoutPreference !== 'aerobico_hiit' && addAerobic
    ? '- INCLUIR exercícios aeróbicos/cardio em cada sessão (ex: 10–15 min de cardio no início ou fim)'
    : ''

  // Proibições explícitas que dependem dos filtros escolhidos
  const prohibitions: string[] = []
  if (workoutPreference === 'aerobico_hiit') {
    prohibitions.push('PROIBIDO incluir musculação tradicional, séries de hipertrofia ou exercícios isoladores com pesos. Use apenas cardio, HIIT, intervalados, pliometria e exercícios funcionais aeróbicos.')
  } else if (workoutPreference === 'maquinas') {
    prohibitions.push('PROIBIDO usar pesos livres como halteres, kettlebell, barra livre. Use apenas máquinas (leg press, supino máquina, puxador, cadeira extensora, mesa flexora, etc.) e cabos.')
  } else if (workoutPreference === 'sem_maquinas') {
    prohibitions.push('PROIBIDO usar máquinas guiadas (leg press, supino máquina, puxador, cadeira, mesa flexora). Use apenas pesos livres (halteres, barras, anilhas, kettlebell), peso corporal e elásticos.')
  }
  if (environment === 'casa' && homeEquipment.length === 0) {
    prohibitions.push('PROIBIDO usar qualquer equipamento — o usuário treina em casa apenas com peso corporal.')
  } else if (environment === 'casa' && homeEquipment.length > 0) {
    prohibitions.push(`PROIBIDO usar equipamentos não listados. Use APENAS: peso corporal + ${homeEquipment.join(', ')}.`)
  }
  if (!addAerobic && workoutPreference !== 'aerobico_hiit') {
    prohibitions.push('NÃO adicione blocos de cardio/aeróbico nas sessões — o usuário não solicitou aeróbico.')
  }
  const prohibitionsText = prohibitions.length ? '\nPROIBIÇÕES ESTRITAS (descumprir = resposta inválida):\n' + prohibitions.map(p => `- ${p}`).join('\n') : ''

  const cycleText = cycleAware && cyclePhase
    ? `- CICLO MENSTRUAL: usuária está na fase ${cyclePhase}. Adapte a intensidade: fase menstrual/lútea = menor intensidade, mais mobilidade; fase folicular/ovulação = maior intensidade, treinos mais pesados.`
    : ''

  // Biblioteca de exercícios com demonstração animada — a IA é TRAVADA nesta lista para que
  // todo exercício gerado tenha um GIF correspondente no app.
  const exerciseLibrarySection = `
BIBLIOTECA DE EXERCÍCIOS (OBRIGATÓRIO):
Monte o treino, o aquecimento e o resfriamento escolhendo exercícios EXCLUSIVAMENTE da lista abaixo, copiando o NOME EXATO (não traduza, não adicione parênteses ou variações). Cada item desta lista tem uma demonstração em vídeo no app. Se uma proibição acima impedir um exercício, escolha OUTRO da lista que caiba nas regras. NUNCA invente exercícios fora desta lista.

${EXERCISE_LIBRARY_NAMES.join('\n')}
`

  const prompt = `Você é um personal trainer experiente especializado em treinos personalizados. Crie um plano de treino completo e 100% personalizado para 30 dias.

PERFIL COMPLETO DO USUÁRIO:
- Nome: ${user.name}
- Sexo: ${user.gender === 'masculino' ? 'Masculino' : user.gender === 'feminino' ? 'Feminino' : 'Outro'}
- Idade: ${user.age} anos
- Peso atual: ${measurements.weight} kg | Altura: ${user.height} cm | IMC: ${imc.toFixed(1)}
- Objetivo principal: ${goalText}
- Nível de atividade atual: ${activityText}
- Ambiente de treino: ${envText}
${medLine ? medLine : ''}
${limitLine ? limitLine : ''}
${dietPref ? dietPref : ''}
${measurements.waist ? `- Cintura: ${measurements.waist} cm` : ''}
${measurements.hips ? `- Quadril: ${measurements.hips} cm` : ''}
${measurements.chest ? `- Peito: ${measurements.chest} cm` : ''}
${measurements.arm ? `- Braço: ${measurements.arm} cm` : ''}

PRIORIDADE MUSCULAR:
${muscleText}

OBJETIVOS DO TREINO:
${objectivesText}

PARÂMETROS OBRIGATÓRIOS:
- Preferência de treino: ${preferenceText}
- Quantidade de treinos diferentes: EXATAMENTE ${workoutCount} (Dia A, Dia B... até Dia ${String.fromCharCode(64 + workoutCount)})
- Duração por sessão: ${durationLabel}
${aeroText}
${cycleText}
${prohibitionsText}
${exerciseLibrarySection}

INSTRUÇÕES OBRIGATÓRIAS:
- Crie EXATAMENTE ${workoutCount} dia(s) de treino com letras (Dia A, Dia B...) para rotação durante 30 dias
- OBRIGATÓRIO: cada dia de treino deve ter EXATAMENTE entre 6 e 8 exercícios — nunca menos que 6
- Adapte o volume e intensidade ao nível de atividade do usuário
- Se há grupos musculares prioritários, dedique MAIS exercícios a eles
- Varie entre exercícios compostos e isoladores; cubra completamente cada grupo muscular do dia
- Aquecimento: 3 a 5 itens detalhados e específicos para o treino do dia
- Resfriamento: 3 a 4 alongamentos específicos para os músculos trabalhados
- Dicas: práticas, motivacionais e específicas para o perfil e objetivo do usuário
- Se houver limitação médica ou medicação, mencione nas dicas como adaptar o treino
- Se treino em casa sem equipamentos: use APENAS exercícios com peso corporal; se há equipamentos listados, use-os
- sessionDuration no JSON deve ser ${parseInt(sessionDurationPref) || 50}
- daysPerWeek no JSON deve ser ${workoutCount}
- Use português brasileiro em tudo

REGRAS DE NOMENCLATURA DOS EXERCÍCIOS:
- O campo "name" DEVE ser o nome EXATO de um exercício da BIBLIOTECA DE EXERCÍCIOS acima (copie e cole o nome, caractere por caractere).
- NÃO traduza, NÃO adicione parênteses, sufixos em inglês ou variações. NÃO crie exercícios fora da biblioteca.

REGRAS PARA O CAMPO "notes" (DESCRIÇÃO TÉCNICA):
Para cada exercício, o campo "notes" DEVE conter uma descrição detalhada com TODOS estes elementos em um parágrafo contínuo:
1. Posicionamento inicial: como o corpo deve estar posicionado antes de começar
2. Execução e biomecânica: pontos de atenção na postura, ativação muscular e alinhamento articular
3. Amplitude ideal: até onde ir no movimento e como controlar a fase excêntrica e concêntrica
4. Dica de evolução ou respiração: como progredir no exercício ou padrão respiratório recomendado
Exemplo: "Deite no banco inclinado a 30-45°, pés firmes no chão, escápulas retraídas. Segure os halteres com pegada neutra na linha dos ombros. Desça controlando em 2-3 segundos até os cotovelos ficarem na linha do peito, sem deixar os ombros subir. Empurre contraindo o peitoral no topo sem travar os cotovelos. Expire na subida, inspire na descida. Para progredir, aumente a carga em 5-10% quando completar todas as séries com boa forma."

Retorne APENAS JSON válido (sem markdown, sem bloco de código):
{
  "title": "Nome do plano personalizado",
  "description": "Descrição breve do plano, objetivos e benefícios",
  "daysPerWeek": ${workoutCount},
  "sessionDuration": ${parseInt(sessionDurationPref) || 50},
  "days": [
    {
      "name": "Dia A - Grupo Muscular",
      "focus": "Músculos trabalhados",
      "exercises": [
        {
          "name": "Nome técnico do exercício",
          "sets": 3,
          "reps": "12-15",
          "restTime": "60 segundos",
          "notes": "Descrição técnica completa: posicionamento inicial, biomecânica, amplitude ideal e dica de evolução/respiração"
        }
      ]
    }
  ],
  "warmup": [
    "Item de aquecimento detalhado"
  ],
  "cooldown": [
    "Alongamento específico: tempo"
  ],
  "tips": [
    "Dica prática personalizada 1",
    "Dica prática personalizada 2",
    "Dica prática personalizada 3"
  ]
}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8000
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    throw new Error((err as any).error?.message || 'Erro na API do OpenAI')
  }

  const data = await response.json()
  const text = (data.choices[0].message.content as string).trim()
  const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  let plan
  try {
    plan = JSON.parse(jsonText)
  } catch {
    throw new Error('Resposta inválida da IA. Tente novamente.')
  }

  // Anexa o GIF de demonstração a cada exercício (match nome -> biblioteca). Determinístico:
  // a IA foi travada na lista, então o casamento é direto; o fallback por contção cobre desvios.
  if (Array.isArray(plan?.days)) {
    for (const day of plan.days) {
      if (!Array.isArray(day?.exercises)) continue
      for (const ex of day.exercises) {
        if (ex && typeof ex.name === 'string') {
          const gif = findExerciseGif(ex.name)
          if (gif) ex.gifUrl = gif.url
        }
      }
    }
  }

  return {
    environment,
    generatedAt: new Date().toISOString(),
    measurements,
    muscleGroups,
    homeEquipment: environment === 'casa' || environment === 'misto' ? homeEquipment : undefined,
    workoutPreference,
    objectives,
    workoutCount,
    addAerobic,
    sessionDurationPref,
    mistoHomeSessions: environment === 'misto' ? mistoHomeSessions : undefined,
    mistoAcadSessions: environment === 'misto' ? mistoAcadSessions : undefined,
    plan
  }
}
