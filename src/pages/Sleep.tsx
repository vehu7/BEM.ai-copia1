import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { useTranslation } from '@/contexts/LanguageContext'
import { Moon, Trash2, Plus, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getSleepQualityBadge, getSleepQualitySelected } from '@/lib/health-utils'
import { ActivityStreak } from '@/components/activity-streak'
import type { SleepEntry, SleepQuality } from '@/types'

const qualityEmoji: Record<SleepQuality, string> = {
  excelente: '😴',
  bom: '🙂',
  regular: '😐',
  ruim: '😫',
}

function calcDuration(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(':').map(Number)
  const [wh, wm] = wakeTime.split(':').map(Number)
  const bedMin = bh * 60 + bm
  let wakeMin = wh * 60 + wm
  if (wakeMin <= bedMin) wakeMin += 24 * 60
  return Math.round((wakeMin - bedMin) / 60 * 10) / 10
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

const inputClass =
  'w-full h-11 rounded-lg px-4 text-sm bg-input border border-border text-foreground outline-none focus:ring-2 focus:ring-ring/40 transition-shadow'

export function Sleep() {
  const { sleepHistory, addSleepEntry, deleteSleepEntry } = useApp()
  const { t } = useTranslation()

  const qualityLabels: Record<SleepQuality, string> = {
    excelente: t.sleep.excellent,
    bom: t.sleep.good,
    regular: t.sleep.regular,
    ruim: t.sleep.poor,
  }

  const [showForm, setShowForm] = useState(false)
  const [bedtime, setBedtime] = useState('22:00')
  const [wakeTime, setWakeTime] = useState('06:30')
  const [quality, setQuality] = useState<SleepQuality>('bom')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])

  const duration = calcDuration(bedtime, wakeTime)

  const handleSave = () => {
    const entry: SleepEntry = {
      id: crypto.randomUUID(),
      date,
      bedtime,
      wakeTime,
      duration,
      quality,
      notes: notes.trim() || undefined,
    }
    addSleepEntry(entry)
    setShowForm(false)
    setNotes('')
    toast.success(t.sleep.registered, { description: `${formatDuration(duration)} — ${qualityLabels[quality]}` })
  }

  const avgDuration = sleepHistory.length
    ? Math.round(sleepHistory.reduce((s, e) => s + e.duration, 0) / sleepHistory.length * 10) / 10
    : null

  const lastEntry = sleepHistory[0] ?? null

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto p-4 pb-28 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 min-w-0">
            <Moon className="w-6 h-6 text-primary flex-shrink-0" />
            <h1 className="font-display text-2xl font-extrabold tracking-tight">{t.sleep.title}</h1>
            <ActivityStreak activity="sleep" />
          </div>
          <Button size="sm" className="rounded-full flex-shrink-0" onClick={() => setShowForm(v => !v)}>
            <Plus className="w-4 h-4 mr-1" />
            {t.common.register}
          </Button>
        </div>

        {/* Formulário */}
        {showForm && (
          <Card>
            <CardContent className="space-y-4">
              <h2 className="font-display text-base font-bold text-foreground">{t.sleep.newEntry}</h2>

              {/* Data */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">{t.sleep.date}</label>
                <input
                  type="date"
                  value={date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Horários */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t.sleep.bedtime}</label>
                  <input
                    type="time"
                    value={bedtime}
                    onChange={e => setBedtime(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">{t.sleep.wakeTime}</label>
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={e => setWakeTime(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Duração calculada */}
              <div className="text-center py-3 rounded-xl bg-primary/10">
                <span className="font-display text-2xl font-extrabold tracking-tight text-primary">{formatDuration(duration)}</span>
                <p className="text-xs mt-0.5 text-muted-foreground">{t.sleep.ofSleep}</p>
              </div>

              {/* Qualidade */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">{t.sleep.quality}</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(qualityEmoji) as SleepQuality[]).map(key => (
                    <button
                      key={key}
                      onClick={() => setQuality(key)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-xl border-2 transition-all text-xs font-semibold ${
                        quality === key
                          ? getSleepQualitySelected(key)
                          : 'border-border text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      <span className="text-xl">{qualityEmoji[key]}</span>
                      {qualityLabels[key]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">{t.sleep.notesOptional}</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={t.sleep.notesPlaceholder}
                  rows={2}
                  className="w-full rounded-lg px-4 py-2.5 text-sm bg-input border border-border text-foreground outline-none resize-none focus:ring-2 focus:ring-ring/40 transition-shadow"
                />
              </div>

              <Button onClick={handleSave} className="w-full" size="lg">
                {t.common.save}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        {sleepHistory.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <Moon className="w-4 h-4 mx-auto mb-1 text-primary" />
                <div className="font-display text-xl font-extrabold tracking-tight text-primary">
                  {lastEntry ? formatDuration(lastEntry.duration) : '—'}
                </div>
                <p className="text-xs mt-0.5 text-muted-foreground">{t.sleep.lastNight}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-4 h-4 mx-auto mb-1 text-primary" />
                <div className="font-display text-xl font-extrabold tracking-tight text-primary">
                  {avgDuration ? formatDuration(avgDuration) : '—'}
                </div>
                <p className="text-xs mt-0.5 text-muted-foreground">{t.sleep.generalAvg}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Histórico */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold px-1 text-foreground">{t.sleep.history}</h2>
          {sleepHistory.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Moon className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{t.sleep.noRecords}</p>
              </CardContent>
            </Card>
          ) : (
            sleepHistory.map(entry => (
              <Card key={entry.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="text-2xl">{qualityEmoji[entry.quality]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{formatDuration(entry.duration)}</span>
                      <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${getSleepQualityBadge(entry.quality)}`}>
                        {qualityLabels[entry.quality]}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5 text-muted-foreground">
                      {formatDate(entry.date)} · {entry.bedtime} → {entry.wakeTime}
                    </p>
                    {entry.notes && (
                      <p className="text-xs mt-0.5 truncate text-muted-foreground">{entry.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteSleepEntry(entry.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label={t.common.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

      </div>
    </div>
  )
}
