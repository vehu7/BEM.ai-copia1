import { useState, useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Clock, Play, StopCircle, History, TrendingUp } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { FastingSession, FastingLogEntry, FastingFeeling } from '@/types'
import { toast } from 'sonner'
import { useTranslation } from '@/contexts/LanguageContext'

const FASTING_TYPE_KEYS = ['16_8', '18_6', '20_4', '24h', '12_12', '14_10'] as const
const FASTING_TYPE_HOURS: Record<string, number> = { '16_8': 16, '18_6': 18, '20_4': 20, '24h': 24, '12_12': 12, '14_10': 14 }
const FASTING_TYPE_DIFFICULTY: Record<string, string> = { '16_8': 'iniciante', '18_6': 'intermediario', '20_4': 'avancado', '24h': 'avancado', '12_12': 'iniciante', '14_10': 'iniciante' }

const STORAGE_KEY = 'fasting_history'

const FEELING_EMOJIS: Record<FastingFeeling, { emoji: string; color: string }> = {
  com_muita_energia: { emoji: '⚡', color: 'text-success' },
  bem: { emoji: '😊', color: 'text-info' },
  normal: { emoji: '😐', color: 'text-muted-foreground' },
  cansado: { emoji: '😴', color: 'text-warning' },
  sem_energia: { emoji: '🥱', color: 'text-chart-3' },
  faminto: { emoji: '😫', color: 'text-destructive' },
  sem_fome: { emoji: '🙂', color: 'text-info' },
}

export function Fasting() {
  const { activeFasting, startFasting, endFasting } = useApp()
  const { t } = useTranslation()
  const [currentTime, setCurrentTime] = useState(new Date())

  const FASTING_TYPES = FASTING_TYPE_KEYS.map(key => ({
    type: key as FastingSession['type'],
    name: t.fasting.protocols[key].name,
    description: t.fasting.protocols[key].description,
    hours: FASTING_TYPE_HOURS[key],
    difficulty: FASTING_TYPE_DIFFICULTY[key],
    benefits: t.fasting.protocols[key].benefits,
  }))

  const FEELING_VALUES: FastingFeeling[] = ['com_muita_energia', 'bem', 'normal', 'cansado', 'sem_energia', 'faminto', 'sem_fome']
  const FEELING_OPTIONS = FEELING_VALUES.map(value => ({
    value,
    label: t.fasting.feelings[value],
    emoji: FEELING_EMOJIS[value].emoji,
    color: FEELING_EMOJIS[value].color,
  }))
  const [showLogDialog, setShowLogDialog] = useState(false)
  const [selectedFeeling, setSelectedFeeling] = useState<FastingFeeling>('bem')
  const [notes, setNotes] = useState('')
  const [fastingHistory, setFastingHistory] = useState<FastingLogEntry[]>([])
  const [completedSession, setCompletedSession] = useState<FastingSession | null>(null)

  // Carregar histórico do localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Converter strings de data para objetos Date
        const history = parsed.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date)
        }))
        setFastingHistory(history)
      } catch (e) {
        console.error('Erro ao carregar histórico de jejum:', e)
      }
    }
  }, [])

  // Salvar histórico no localStorage
  const saveFastingHistory = (history: FastingLogEntry[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    setFastingHistory(history)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleStartFasting = (type: FastingSession['type'], hours: number) => {
    const session: FastingSession = {
      id: crypto.randomUUID(),
      startTime: new Date(),
      targetDuration: hours,
      completed: false,
      type
    }
    startFasting(session)
    toast.success(t.fasting.started, {
      description: `${hours}h ${t.fasting.startedDesc}`
    })
  }

  const handleEndFasting = () => {
    if (activeFasting) {
      setCompletedSession(activeFasting)
      setShowLogDialog(true)
    }
  }

  const handleSaveLog = () => {
    if (!completedSession) return

    const fastingType = FASTING_TYPES.find(f => f.type === completedSession.type)

    const logEntry: FastingLogEntry = {
      id: crypto.randomUUID(),
      date: new Date(),
      protocolType: completedSession.type,
      protocolName: fastingType?.name || completedSession.type,
      hours: completedSession.targetDuration,
      startTime: new Date(completedSession.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      endTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      feeling: selectedFeeling,
      notes: notes.trim() || undefined,
      completed: true
    }

    const newHistory = [logEntry, ...fastingHistory]
    saveFastingHistory(newHistory)

    endFasting()
    setShowLogDialog(false)
    setNotes('')
    setSelectedFeeling('bem')
    setCompletedSession(null)

    toast.success(t.fasting.recorded, {
      description: t.fasting.recordedDesc
    })
  }

  const getElapsedTime = () => {
    if (!activeFasting) return { hours: 0, minutes: 0, percentage: 0 }

    const start = new Date(activeFasting.startTime).getTime()
    const now = currentTime.getTime()
    const elapsed = (now - start) / 1000 / 60 / 60 // em horas

    const hours = Math.floor(elapsed)
    const minutes = Math.floor((elapsed - hours) * 60)
    const percentage = (elapsed / activeFasting.targetDuration) * 100

    return { hours, minutes, percentage: Math.min(percentage, 100) }
  }

  const getRemainingTime = () => {
    if (!activeFasting) return { hours: 0, minutes: 0 }

    const { hours, minutes } = getElapsedTime()
    const totalElapsedMinutes = hours * 60 + minutes
    const targetMinutes = activeFasting.targetDuration * 60
    const remainingMinutes = Math.max(0, targetMinutes - totalElapsedMinutes)

    return {
      hours: Math.floor(remainingMinutes / 60),
      minutes: remainingMinutes % 60
    }
  }

  const elapsed = getElapsedTime()
  const remaining = getRemainingTime()
  const isComplete = elapsed.percentage >= 100

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto p-4 pb-24 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Clock className="w-16 h-16 text-primary mx-auto" />
          <h1 className="text-3xl font-bold">{t.fasting.title}</h1>
          <p className="text-muted-foreground">{t.fasting.subtitle}</p>
        </div>

        {/* Jejum ativo */}
        {activeFasting ? (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>{t.fasting.inProgressTitle}</CardTitle>
              <CardDescription>
                {t.fasting.typeLabel} {activeFasting.type.replace('_', ':')} ({activeFasting.targetDuration}h)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Timer visual */}
              <div className="text-center space-y-4">
                <div className="relative w-48 h-48 mx-auto">
                  {/* Círculo de progresso */}
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 88}`}
                      strokeDashoffset={`${2 * Math.PI * 88 * (1 - elapsed.percentage / 100)}`}
                      className="text-primary transition-all duration-1000"
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Tempo no centro */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-4xl font-bold">
                      {String(elapsed.hours).padStart(2, '0')}:{String(elapsed.minutes).padStart(2, '0')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Math.round(elapsed.percentage)}%
                    </div>
                  </div>
                </div>

                {isComplete ? (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-primary">
                      🎉 {t.fasting.complete}
                    </div>
                    <p className="text-muted-foreground">
                      {t.fasting.completeDesc}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xl font-semibold">
                      {t.fasting.remaining} {String(remaining.hours).padStart(2, '0')}h{String(remaining.minutes).padStart(2, '0')}min
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t.fasting.startedAt} {new Date(activeFasting.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}
              </div>

              {/* Progresso */}
              <div className="space-y-2">
                <Progress value={elapsed.percentage} className="h-3" />
                <p className="text-xs text-center text-muted-foreground">
                  {elapsed.hours}h {elapsed.minutes}min de {activeFasting.targetDuration}h
                </p>
              </div>

              {/* Botão finalizar */}
              <Button
                variant="destructive"
                onClick={handleEndFasting}
                className="w-full"
              >
                <StopCircle className="w-4 h-4 mr-2" />
                {t.fasting.endFasting}
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Iniciar jejum */
          <div className="space-y-4">
            <h2 className="text-xl font-bold">{t.fasting.chooseType}</h2>
            <div className="grid gap-3">
              {FASTING_TYPES.map((fasting) => (
                <Card key={fasting.type} className="cursor-pointer hover:border-primary transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{fasting.name}</CardTitle>
                        <CardDescription>{fasting.description}</CardDescription>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleStartFasting(fasting.type, fasting.hours)}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        {t.common.start}
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Informações sobre jejum */}
        <Card>
          <CardContent className="pt-4 space-y-4 text-sm">

            {/* Benefícios */}
            <div>
              <p className="font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                <span>✅</span> {t.fasting.benefits}
              </p>
              <ul className="space-y-1 text-muted-foreground">
                {[
                  t.fasting.benefit1,
                  t.fasting.benefit2,
                  t.fasting.benefit3,
                  t.fasting.benefit4,
                  t.fasting.benefit5,
                  t.fasting.benefit6,
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="h-px bg-border" />

            {/* Bebidas permitidas */}
            <div>
              <p className="font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                <span>💧</span> {t.fasting.allowedDrinks}
              </p>
              <ul className="space-y-1 text-muted-foreground">
                {[
                  t.fasting.drink1,
                  t.fasting.drink2,
                  t.fasting.drink3,
                  t.fasting.drink4,
                  t.fasting.drink5,
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="h-px bg-border" />

            {/* Dicas */}
            <div>
              <p className="font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                <span>💡</span> {t.fasting.tips}
              </p>
              <ul className="space-y-1 text-muted-foreground">
                {[
                  t.fasting.tip1,
                  t.fasting.tip2,
                  t.fasting.tip3,
                  t.fasting.tip4,
                  t.fasting.tip5,
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </CardContent>
        </Card>

        {/* Aviso médico */}
        <Card className="bg-destructive/10 border-destructive">
          <CardContent className="py-2 px-3">
            <div className="flex items-start gap-2 text-center justify-center">
              <span className="text-sm leading-snug mt-0.5 shrink-0">⚠️</span>
              <p className="text-sm">
                <strong>{t.fasting.warning}</strong> {t.fasting.warningText}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de jejuns */}
        {fastingHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                {t.fasting.history}
              </CardTitle>
              <CardDescription>
                {fastingHistory.length} {fastingHistory.length !== 1 ? t.fasting.fastingPlural : t.fasting.fastingSingular} {fastingHistory.length !== 1 ? t.fasting.registeredPlural : t.fasting.registeredSingular}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Estatísticas resumidas */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold">{fastingHistory.length}</div>
                      <div className="text-xs text-muted-foreground">{t.fasting.totalFasts}</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold">
                        {Math.round(fastingHistory.reduce((sum, entry) => sum + entry.hours, 0) / fastingHistory.length)}h
                      </div>
                      <div className="text-xs text-muted-foreground">{t.fasting.avgHours}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de jejuns */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {fastingHistory.slice(0, 10).map((entry) => {
                  const feelingOption = FEELING_OPTIONS.find(f => f.value === entry.feeling)
                  return (
                    <Card key={entry.id} className="hover:bg-muted/50 transition-colors">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{entry.protocolName}</span>
                              <span className="text-xs text-muted-foreground">
                                ({entry.hours}h)
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {entry.date.toLocaleDateString('pt-BR')} • {entry.startTime} - {entry.endTime}
                            </div>
                            {entry.notes && (
                              <p className="text-sm text-muted-foreground mt-1 italic">
                                "{entry.notes}"
                              </p>
                            )}
                          </div>
                          <div className="text-center">
                            <div className={`text-2xl ${feelingOption?.color}`}>
                              {feelingOption?.emoji}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {feelingOption?.label.split(' ')[0]}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {fastingHistory.length > 10 && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  {t.fasting.showingLast} {fastingHistory.length}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de registro de jejum */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.fasting.howDidYouFeel}</DialogTitle>
            <DialogDescription>
              {t.fasting.howDidYouFeelDesc}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Seleção de sensação */}
            <div className="space-y-3">
              <Label>{t.fasting.feelingQuestion}</Label>
              <div className="grid grid-cols-2 gap-2">
                {FEELING_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedFeeling(option.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedFeeling === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-center space-y-1">
                      <div className={`text-2xl ${option.color}`}>{option.emoji}</div>
                      <div className="text-xs font-medium">{option.label}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Observações opcionais */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t.fasting.notesOptional}</Label>
              <Textarea
                id="notes"
                placeholder={t.fasting.notesPlaceholder}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowLogDialog(false)
                setNotes('')
                setSelectedFeeling('bem')
                setCompletedSession(null)
                endFasting()
              }}
              className="flex-1"
            >
              {t.common.skip}
            </Button>
            <Button onClick={handleSaveLog} className="flex-1">
              {t.fasting.saveRecord}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
