import type { CycleConfig, CyclePhase, CycleDayInfo } from '@/types'

export function getCycleDayInfo(config: CycleConfig): CycleDayInfo {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const lastStart = new Date(config.lastPeriodStart + 'T00:00:00')
  lastStart.setHours(0, 0, 0, 0)

  const daysSinceLastPeriod = Math.floor(
    (today.getTime() - lastStart.getTime()) / (1000 * 60 * 60 * 24)
  )

  const cyclesElapsed = Math.floor(daysSinceLastPeriod / config.averageCycleDuration)
  const dayOfCycle = (daysSinceLastPeriod % config.averageCycleDuration) + 1

  const currentCycleStart = new Date(lastStart)
  currentCycleStart.setDate(currentCycleStart.getDate() + cyclesElapsed * config.averageCycleDuration)

  // Próxima menstruação (janela ± variação)
  const nextPeriodCenter = new Date(currentCycleStart)
  nextPeriodCenter.setDate(nextPeriodCenter.getDate() + config.averageCycleDuration)

  const variation = config.typicalVariation ?? 2
  const nextPeriodStart = new Date(nextPeriodCenter)
  nextPeriodStart.setDate(nextPeriodStart.getDate() - variation)
  const nextPeriodEnd = new Date(nextPeriodCenter)
  nextPeriodEnd.setDate(nextPeriodEnd.getDate() + variation)

  // Ovulação: tipicamente 14 dias antes do próximo período
  const ovulationDay = config.averageCycleDuration - 14
  const ovulationWindowStart = new Date(currentCycleStart)
  ovulationWindowStart.setDate(ovulationWindowStart.getDate() + ovulationDay - 2)
  const ovulationWindowEnd = new Date(currentCycleStart)
  ovulationWindowEnd.setDate(ovulationWindowEnd.getDate() + ovulationDay + 1)

  // Fase atual
  let phase: CyclePhase
  if (dayOfCycle <= config.averagePeriodDuration) {
    phase = 'menstrual'
  } else if (dayOfCycle < ovulationDay - 1) {
    phase = 'folicular'
  } else if (dayOfCycle <= ovulationDay + 1) {
    phase = 'ovulacao'
  } else {
    phase = 'lutea'
  }

  const daysUntilNextPeriod = Math.max(
    0,
    Math.floor((nextPeriodCenter.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  )

  return {
    dayOfCycle,
    phase,
    nextPeriodStart,
    nextPeriodEnd,
    ovulationWindowStart,
    ovulationWindowEnd,
    daysUntilNextPeriod,
  }
}

export interface PhaseInfo {
  name: string
  emoji: string
  color: string
  bgColor: string
  borderColor: string
  ringColor: string
  description: string
  energy: string
  tips: string[]
  nutritionTitle: string
  nutrition: string[]
  exerciseTitle: string
  exercise: string[]
}

export function getPhaseInfo(phase: CyclePhase): PhaseInfo {
  const map: Record<CyclePhase, PhaseInfo> = {
    menstrual: {
      name: 'Menstrual',
      emoji: '🌑',
      color: 'text-rose-500 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-900/25',
      borderColor: 'border-rose-200 dark:border-rose-800',
      ringColor: '#f43f5e',
      description: 'Seu corpo está se renovando. É normal sentir desconforto — priorize o autocuidado.',
      energy: 'Baixa a moderada',
      tips: [
        'Hidrate-se bem — água reduz cólicas',
        'Bolsa de água quente alivia o desconforto abdominal',
        'Respeite seu ritmo sem culpa',
        'Sono de qualidade acelera a recuperação',
        'Evite excesso de sal, que piora o inchaço',
      ],
      nutritionTitle: 'Nutrição nessa fase',
      nutrition: [
        'Ferro: feijão, lentilha, espinafre, carne vermelha magra',
        'Vitamina C: laranja, morango (melhora absorção do ferro)',
        'Magnésio: castanhas, sementes, chocolate amargo 70%+',
        'Reduza sódio, açúcar refinado e cafeína em excesso',
      ],
      exerciseTitle: 'Exercício nessa fase',
      exercise: [
        'Yoga restaurativo e alongamento suave',
        'Caminhada leve ao ar livre',
        'Pilates de baixa intensidade',
        'Evite alta intensidade se sentir muita dor — escute seu corpo',
      ],
    },
    folicular: {
      name: 'Folicular',
      emoji: '🌒',
      color: 'text-pink-500 dark:text-pink-400',
      bgColor: 'bg-pink-50 dark:bg-pink-900/25',
      borderColor: 'border-pink-200 dark:border-pink-800',
      ringColor: '#ec4899',
      description: 'Energia crescente! Estrogênio em alta — ótima fase para novos desafios e metas.',
      energy: 'Crescente — aproveite!',
      tips: [
        'Ótimo momento para começar novos projetos',
        'Metabolismo levemente mais acelerado',
        'Criatividade e disposição em alta',
        'Ideal para estabelecer novas rotinas',
        'Aproveite para experimentar receitas e alimentos novos',
      ],
      nutritionTitle: 'Nutrição nessa fase',
      nutrition: [
        'Carboidratos complexos: aveia, batata-doce, quinoa',
        'Proteínas magras: frango, peixe, ovos, tofu',
        'Vegetais fermentados: chucrute, kefir (ajudam o estrogênio)',
        'Sementes de linhaça e abóbora',
      ],
      exerciseTitle: 'Exercício nessa fase',
      exercise: [
        'Treinos de força com progressão de carga',
        'Cardio moderado a intenso',
        'HIIT — seu corpo recupera bem nessa fase',
        'Experimente modalidades novas',
      ],
    },
    ovulacao: {
      name: 'Ovulação',
      emoji: '🌕',
      color: 'text-fuchsia-500 dark:text-fuchsia-400',
      bgColor: 'bg-fuchsia-50 dark:bg-fuchsia-900/25',
      borderColor: 'border-fuchsia-200 dark:border-fuchsia-800',
      ringColor: '#d946ef',
      description: 'Pico de energia e força! Você está no seu melhor momento físico e mental.',
      energy: 'Máxima — pico de performance',
      tips: [
        'Aproveite para bater recordes nos treinos',
        'Comunicação e sociabilidade estão em alta',
        'Pico de testosterona favorece força muscular',
        'Hidrate-se — o corpo retém menos água',
        'Foco e clareza mental elevados',
      ],
      nutritionTitle: 'Nutrição nessa fase',
      nutrition: [
        'Antioxidantes: frutas vermelhas, mirtilo, romã',
        'Proteínas magras para sustentar os treinos intensos',
        'Fibras: aceleram eliminação do excesso de estrogênio',
        'Evite alimentos inflamatórios: frituras, ultraprocessados',
      ],
      exerciseTitle: 'Exercício nessa fase',
      exercise: [
        'Musculação pesada — é o melhor momento!',
        'HIIT e cardio de alta intensidade',
        'Esportes e atividades desafiadoras',
        'Aproveite o pico de força e resistência',
      ],
    },
    lutea: {
      name: 'Lútea',
      emoji: '🌘',
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-950/30',
      borderColor: 'border-rose-300 dark:border-rose-700',
      ringColor: '#e11d48',
      description: 'Fase de introspecção e recolhimento. Ouça seu corpo com atenção e compaixão.',
      energy: 'Decrescente — priorize recuperação',
      tips: [
        'Magnésio alivia sintomas de TPM',
        'Reduza cafeína e álcool',
        'Exercícios moderados ajudam com o humor',
        'Pratique autocompaixão — oscilações são normais',
        'Sono regular estabiliza o humor',
      ],
      nutritionTitle: 'Nutrição nessa fase',
      nutrition: [
        'Magnésio: sementes de abóbora, espinafre, amêndoas',
        'Vitamina B6: banana, grão-de-bico, salmão',
        'Cálcio: leite, iogurte, brócolis (reduz TPM)',
        'Reduza sódio, açúcar e cafeína ao máximo',
      ],
      exerciseTitle: 'Exercício nessa fase',
      exercise: [
        'Pilates e yoga — foco em mobilidade',
        'Caminhadas em ritmo confortável',
        'Natação suave',
        'Ajuste a intensidade conforme sua energia diária',
      ],
    },
  }
  return map[phase]
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function formatDateFull(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
}
