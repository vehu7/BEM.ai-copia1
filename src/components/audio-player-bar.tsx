import { useState } from 'react'
import { useAudio } from '@/contexts/AudioContext'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SkipBack, SkipForward, Play, Pause, X, Timer, Volume2, Repeat } from 'lucide-react'
import { cn } from '@/lib/utils'

const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

const TIMER_OPTIONS = [
  { label: 'Livre', value: 0 },
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
  { label: '20 min', value: 20 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
]

export function AudioPlayerBar() {
  const {
    currentTrack, isPlaying, loop, elapsed, trackDuration,
    timerMinutes, timerRemaining,
    togglePlay, toggleLoop, next, prev, seek, setTimer, stop, volume, setVolume,
  } = useAudio()

  const [isSeeking, setIsSeeking] = useState(false)
  const [seekValue, setSeekValue] = useState(0)

  if (!currentTrack) return null

  const displayElapsed = isSeeking ? seekValue : elapsed
  const timeLabel = timerMinutes > 0
    ? fmt(timerRemaining)
    : `${fmt(elapsed)} / ${fmt(trackDuration)}`

  return (
    <div className="fixed bottom-[88px] left-3 right-3 z-40 rounded-2xl shadow-2xl border bg-background/95 backdrop-blur-md overflow-hidden">
      {/* Linha 1: controles + nome + tempo + timer + fechar */}
      <div className="flex items-center gap-1.5 px-3 pt-3 pb-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={prev}>
          <SkipBack className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={togglePlay}>
          {isPlaying
            ? <Pause className="w-5 h-5" />
            : <Play className="w-5 h-5 ml-0.5" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={next}>
          <SkipForward className="w-4 h-4" />
        </Button>

        {/* Loop */}
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8 shrink-0', loop && 'text-primary')}
          onClick={toggleLoop}
          title={loop ? 'Loop ativado' : 'Loop desativado'}
        >
          <Repeat className="w-4 h-4" />
        </Button>

        {/* Nome da faixa */}
        <span className="flex-1 text-sm font-medium truncate mx-1 min-w-0">
          {currentTrack.title}
        </span>

        {/* Tempo */}
        <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
          {timeLabel}
        </span>

        {/* Temporizador */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-8 w-8 shrink-0', timerMinutes > 0 && 'text-primary')}
            >
              <Timer className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-2" align="end" side="top">
            <p className="text-xs font-medium text-muted-foreground mb-2">Temporizador</p>
            <div className="grid grid-cols-2 gap-1">
              {TIMER_OPTIONS.map(opt => (
                <Button
                  key={opt.value}
                  variant={timerMinutes === opt.value ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setTimer(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Fechar */}
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={stop}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Linha 2: barra de progresso + volume */}
      <div className="flex items-center gap-3 px-3 pb-3">
        <Slider
          min={0}
          max={trackDuration || 1}
          step={1}
          value={[displayElapsed]}
          onValueChange={([v]) => { setIsSeeking(true); setSeekValue(v) }}
          onValueCommit={([v]) => { seek(v); setIsSeeking(false) }}
          className="flex-1"
        />
        <div className="flex items-center gap-1.5 shrink-0">
          <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
          <Slider
            min={0}
            max={1}
            step={0.05}
            value={[volume]}
            onValueChange={([v]) => setVolume(v)}
            className="w-16"
          />
        </div>
      </div>
    </div>
  )
}
