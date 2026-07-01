import { useState, useRef, useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Button } from '@/components/ui/button'
import { Send, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { hasAccess } from '@/lib/subscription'
import { UpgradeGate } from '@/components/upgrade-gate'
import { useTranslation } from '@/contexts/LanguageContext'
import type { Language } from '@/lib/i18n'
import type { UserProfile, Meal, WaterIntake, SleepEntry, WorkoutSession, CycleConfig } from '@/types'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

function buildUserContext(
  user: UserProfile | null,
  todayMeals: Meal[],
  todayWater: WaterIntake,
  sleepHistory: SleepEntry[],
  todayWorkouts: WorkoutSession[],
  cycleConfig: CycleConfig | null,
): string {
  if (!user) return ''

  const totalCalories = todayMeals.reduce((sum, m) => sum + (m.totalCalories ?? 0), 0)
  const totalProtein = todayMeals.reduce((sum, m) => sum + (m.totalProtein ?? 0), 0)
  const totalCarbs = todayMeals.reduce((sum, m) => sum + (m.totalCarbs ?? 0), 0)
  const totalFat = todayMeals.reduce((sum, m) => sum + (m.totalFat ?? 0), 0)
  const waterConsumed = todayWater.consumed
  const waterTarget = todayWater.target
  const lastSleep = sleepHistory[0]
  const todayWorkoutCount = todayWorkouts.length

  const lines: string[] = [
    `## Dados do usuário hoje (${new Date().toLocaleDateString('pt-BR')})`,
    `Nome: ${user.name}`,
    `Objetivo: ${user.goal}`,
    `Peso atual: ${user.currentWeight}kg | Meta: ${user.targetWeight}kg`,
    `Calorias: ${totalCalories}kcal consumidas de ${user.targetCalories ?? '?'}kcal alvo`,
    `Proteína: ${totalProtein.toFixed(0)}g de ${user.targetProtein ?? '?'}g alvo`,
    `Carboidratos: ${totalCarbs.toFixed(0)}g | Gordura: ${totalFat.toFixed(0)}g`,
    `Água: ${waterConsumed}ml de ${waterTarget}ml (${waterTarget > 0 ? Math.round((waterConsumed / waterTarget) * 100) : 0}%)`,
    `Treinos hoje: ${todayWorkoutCount}`,
    lastSleep
      ? `Último sono: ${lastSleep.duration}h (qualidade: ${lastSleep.quality})`
      : 'Sono: não registrado hoje',
  ]

  if (user.gender === 'feminino' && cycleConfig) {
    const daysSinceStart = Math.floor(
      (Date.now() - new Date(cycleConfig.lastPeriodStart).getTime()) / (1000 * 60 * 60 * 24),
    )
    const cycleDay = (daysSinceStart % (cycleConfig.averageCycleDuration ?? 28)) + 1
    let phase = 'folicular'
    if (cycleDay <= 5) phase = 'menstrual'
    else if (cycleDay <= 13) phase = 'folicular'
    else if (cycleDay <= 16) phase = 'ovulatória'
    else phase = 'lútea'
    lines.push(`Fase do ciclo: dia ${cycleDay} (fase ${phase})`)
  }

  if (user.medication && user.medication !== 'nenhum') {
    lines.push(
      `Medicação: ${user.medication}${user.medicationDosage ? ` (${user.medicationDosage})` : ''}`,
    )
  }
  if (user.hadBariatricSurgery) {
    lines.push('Pós-cirurgia bariátrica: sim')
  }

  return lines.join('\n')
}

function getCountryFromLocale(): string {
  const locale = navigator.language || 'pt-BR'
  const code = locale.split('-')[1]?.toUpperCase() || ''
  const map: Record<string, string> = {
    BR: 'Brasil', PT: 'Portugal', AR: 'Argentina', MX: 'México',
    CL: 'Chile', CO: 'Colômbia', PE: 'Peru', UY: 'Uruguai',
    PY: 'Paraguai', BO: 'Bolívia', VE: 'Venezuela', EC: 'Equador',
    US: 'Estados Unidos', ES: 'Espanha', FR: 'França', DE: 'Alemanha',
    IT: 'Itália', GB: 'Reino Unido', JP: 'Japão', CN: 'China',
    KR: 'Coreia do Sul', IN: 'Índia', AU: 'Austrália', CA: 'Canadá',
    AO: 'Angola', MZ: 'Moçambique',
  }
  return map[code] || 'Brasil'
}

function buildSystemPrompt(country: string, language: Language): string {
  const langMap: Record<Language, string> = {
    'pt-BR': 'Português (Brasil)',
    'en': 'English',
    'fr': 'Français',
    'es': 'Español',
  }
  const langName = langMap[language] || 'Português (Brasil)'
  return `Você é a Bem, uma assistente virtual de saúde e bem-estar representada por uma coala simpática 🐨. Use SEMPRE pronomes e flexões femininas para se referir a si mesma ("eu estou pronta", "estou aqui pra te ajudar", "fico feliz", "posso te sugerir"). Nunca use formas masculinas como "o Bem", "estou pronto" ou "seu amigo".

Seu propósito é exclusivamente ajudar pessoas com temas relacionados a:
- Nutrição e alimentação saudável
- Receitas e dicas culinárias saudáveis
- Exercícios físicos e atividade física
- Bem-estar mental e emocional
- Qualidade do sono
- Hidratação
- Emagrecimento e controle de peso
- Hábitos saudáveis no geral

LOCALIZAÇÃO DO USUÁRIO: ${country}
- Adapte SEMPRE suas respostas à realidade de quem mora em ${country}
- Mencione alimentos, ingredientes, marcas, lojas e hábitos comuns em ${country}
- Sugira receitas com ingredientes acessíveis em ${country}
- Considere a cultura alimentar, clima e costumes locais de ${country}
- Use medidas e referências que fazem sentido para ${country}

IDIOMA DA RESPOSTA (REGRA CRÍTICA):
- RESPONDA SEMPRE EM: ${langName}
- Mesmo se o usuário escrever em outro idioma, sua resposta DEVE ser em ${langName}
- Use nomes de alimentos e termos técnicos de nutrição em ${langName}

Personalidade:
- Chame-se sempre de Bem (no feminino: a Bem) e nunca revele que é uma IA ou um robô
- Seja descontraída, acolhedora e motivadora
- Entenda o momento emocional da pessoa e responda com empatia
- Use linguagem simples e acessível
- Pode usar o emoji 🐨 de forma natural para se expressar
- Jamais use emojis de robô ou tecnologia (🤖, 💻, etc.)
- Respostas curtas e diretas ao ponto

Se a pessoa perguntar algo fora dos temas de saúde e bem-estar, responda educadamente explicando que você é focada nesses assuntos e convide-a a explorar esses temas com você.`
}

export function ChatBem() {
  const { user } = useApp()
  const { t } = useTranslation()
  if (!hasAccess(user, 'ai-chat')) {
    return (
      <UpgradeGate
        featureName={t.trial.upgradeGate.chatFeatureName}
        description={t.trial.upgradeGate.chatDescription}
        icon={<MessageCircle className="w-9 h-9 text-primary" />}
      />
    )
  }
  return <ChatBemContent />
}

function ChatBemContent() {
  const { user, todayMeals, todayWater, sleepHistory, todayWorkouts, cycleConfig } = useApp()
  const { t, language } = useTranslation()
  const tc = t.chatBem
  const country = getCountryFromLocale()
  const SYSTEM_PROMPT = buildSystemPrompt(country, language)

  const SUGGESTIONS = [
    tc.suggestions.recipe,
    tc.suggestions.energy,
    tc.suggestions.sleep,
    tc.suggestions.motivation,
  ]

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Olá${user ? `, ${user.name}` : ''}! 🐨 Eu sou a Bem, sua assistente de saúde e bem-estar! Estou aqui pra te ajudar com nutrição, receitas saudáveis, exercícios e muito mais. Como posso te ajudar hoje?`,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const adjustTextareaHeight = () => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      setTimeout(() => textareaRef.current?.focus(), 50)
    }

    const assistantId = (Date.now() + 1).toString()
    const assistantTimestamp = new Date()

    setMessages(prev => [
      ...prev,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: assistantTimestamp,
      },
    ])

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY

      const userContext = buildUserContext(user, todayMeals, todayWater, sleepHistory, todayWorkouts, cycleConfig)
      const fullSystemPrompt = userContext
        ? `${SYSTEM_PROMPT}\n\n${userContext}`
        : SYSTEM_PROMPT

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          stream: true,
          messages: [
            { role: 'system', content: fullSystemPrompt },
            ...updatedMessages.map(m => ({ role: m.role, content: m.content })),
          ],
          max_tokens: 400,
          temperature: 0.7,
        }),
      })

      if (!response.ok) throw new Error('Erro na API')

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      let buffer = ''
      let streamDone = false

      setIsLoading(false)

      while (!streamDone) {
        const { done, value } = await reader.read()
        if (done) {
          buffer += decoder.decode()
          streamDone = true
        } else {
          buffer += decoder.decode(value, { stream: true })
        }

        // Processa apenas linhas completas e mantém o restante incompleto no
        // buffer para a próxima leitura. Sem isso, uma linha "data: ..." cortada
        // entre dois chunks da rede era descartada, sumindo com letras/palavras.
        const newlineIdx = buffer.lastIndexOf('\n')
        if (newlineIdx === -1 && !streamDone) continue
        const completePart = streamDone ? buffer : buffer.slice(0, newlineIdx)
        buffer = streamDone ? '' : buffer.slice(newlineIdx + 1)

        for (const rawLine of completePart.split('\n')) {
          const line = rawLine.trim()
          if (!line.startsWith('data:')) continue
          const data = line.slice(5).trim()
          if (data === '[DONE]') { streamDone = true; break }
          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices[0]?.delta?.content
            if (delta) {
              accumulated += delta
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId ? { ...m, content: accumulated } : m,
                ),
              )
            }
          } catch {
            // ignora chunks inválidos
          }
        }
      }
    } catch {
      toast.error(tc.errorToast)
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId ? { ...m, content: tc.fallbackMessage } : m,
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      sendMessage()
    }
  }

  const fmt = (d: Date) => d.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      <style>{`
        @keyframes bem-float {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          25% { transform: translateY(-5px) rotate(0deg); }
          75% { transform: translateY(-3px) rotate(1deg); }
        }
        @keyframes bem-blink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        .bem-mascot {
          animation: bem-float 3.5s ease-in-out infinite;
          transform-origin: center bottom;
        }
        .bem-mascot:hover {
          animation: bem-float 1.2s ease-in-out infinite;
          cursor: pointer;
        }
      `}</style>

      <div className="flex flex-col h-screen bg-background">

        {/* Header com mascote centralizado */}
        <div className="flex-shrink-0 flex flex-col items-center pt-5 pb-3 shadow-md z-10 bg-primary">
          <div className="bem-mascot">
            <img
              src="/avatar-chat.jpeg"
              alt="BEM"
              className="w-20 h-20 rounded-full object-cover border-4 border-primary-foreground/40 shadow-lg"
            />
          </div>
          <p className="text-primary-foreground font-bold text-base mt-2 tracking-wide">{tc.header.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-primary/30 animate-pulse" />
            <p className="text-primary-foreground/80 text-xs">{tc.header.status}</p>
          </div>
        </div>

        {/* Área de mensagens */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1" style={{ paddingBottom: '10rem' }}>
          {messages.map(msg => {
            const isUser = msg.role === 'user'
            if (!isUser && !msg.content) return null
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[78%] px-3 py-2 rounded-2xl shadow-sm ${
                    isUser
                      ? 'bg-primary rounded-tr-[4px]'
                      : 'bg-card rounded-tl-[4px]'
                  }`}
                >
                  <p className={`text-sm whitespace-pre-wrap leading-relaxed ${isUser ? 'text-primary-foreground' : 'text-foreground'}`}>{msg.content}</p>
                  <p className={`text-[10px] mt-1 text-right ${isUser ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                    {fmt(msg.timestamp)}
                  </p>
                </div>
              </div>
            )
          })}

          {/* Indicador "BEM está digitando..." */}
          {isLoading && (
            <div className="flex items-end gap-2 justify-start">
              <img src="/avatar-chat.jpeg" alt="BEM" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
              <div>
                <div className="bg-card rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm inline-flex gap-1 items-center">
                  <span className="w-2 h-2 rounded-full animate-bounce bg-primary" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full animate-bounce bg-primary" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full animate-bounce bg-primary" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-[10px] mt-0.5 ml-1 text-muted-foreground">{tc.typingIndicator}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Área inferior fixa — sugestões + input */}
        <div className="fixed bottom-16 left-0 right-0 z-20 px-3 space-y-2 pb-3">

          {/* Sugestões */}
          {messages.length <= 1 && !isLoading && (
            <div className="flex gap-2 flex-wrap">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-1.5 rounded-full bg-card backdrop-blur-sm border border-border shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input com textarea */}
          <div className="flex items-end gap-2 bg-card rounded-2xl shadow-lg px-3 py-2">
            <textarea
              ref={textareaRef}
              placeholder={tc.inputPlaceholder}
              value={input}
              onChange={e => { setInput(e.target.value); adjustTextareaHeight() }}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground text-foreground resize-none leading-relaxed"
              style={{ maxHeight: '120px', minHeight: '24px' }}
            />
            <Button
              size="icon"
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="w-8 h-8 rounded-full flex-shrink-0 bg-primary mb-0.5"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-center text-[10px] text-muted-foreground">{tc.sendHint}</p>
        </div>

      </div>
    </>
  )
}
