import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react'

export interface AudioTrack {
  id: string
  title: string
  url: string
}

interface AudioCtxType {
  currentTrack: AudioTrack | null
  queue: AudioTrack[]
  isPlaying: boolean
  loop: boolean
  volume: number
  elapsed: number
  trackDuration: number
  timerMinutes: number
  timerRemaining: number
  play: (track: AudioTrack, queue?: AudioTrack[]) => void
  togglePlay: () => void
  toggleLoop: () => void
  next: () => void
  prev: () => void
  seek: (s: number) => void
  setVolume: (v: number) => void
  setTimer: (m: number) => void
  stop: () => void
}

const AudioCtx = createContext<AudioCtxType | null>(null)

export function AudioProvider({ children }: { children: ReactNode }) {
  // Singleton – nunca recriado entre re-renders
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const loopRef = useRef(false)
  const getAudio = () => {
    if (!audioRef.current) audioRef.current = new Audio()
    return audioRef.current
  }

  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null)
  const [queue, setQueue] = useState<AudioTrack[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [loop, setLoop] = useState(false)
  const [volume, setVolumeState] = useState(0.6)
  const [elapsed, setElapsed] = useState(0)
  const [trackDuration, setTrackDuration] = useState(0)
  const [timerMinutes, setTimerMinutes] = useState(0)
  const [timerRemaining, setTimerRemaining] = useState(0)

  // Registra eventos do elemento de áudio. Re-registra quando a queue muda
  // para que o closure de `onEnded` sempre veja a queue atualizada.
  useEffect(() => {
    const audio = getAudio()

    const onTimeUpdate = () => setElapsed(Math.floor(audio.currentTime))
    const onDurationChange = () =>
      setTrackDuration(isFinite(audio.duration) ? Math.floor(audio.duration) : 0)
    const onEnded = () => {
      setCurrentTrack(prev => {
        if (!prev || queue.length === 0) return prev
        const idx = queue.findIndex(t => t.id === prev.id)
        const isLast = idx === queue.length - 1
        // Se é a última faixa e loop está desligado, para a reprodução
        if (isLast && !loopRef.current) {
          setIsPlaying(false)
          setElapsed(0)
          return prev
        }
        const nxt = queue[(idx + 1) % queue.length]
        const a = getAudio()
        a.src = nxt.url
        a.currentTime = 0
        a.play().catch(() => {})
        setElapsed(0)
        setTrackDuration(0)
        return nxt
      })
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
    }
  }, [queue])

  // Temporizador de sessão
  useEffect(() => {
    if (!isPlaying || timerMinutes === 0 || timerRemaining <= 0) return
    const id = setInterval(() => {
      setTimerRemaining(r => {
        if (r <= 1) {
          getAudio().pause()
          setIsPlaying(false)
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [isPlaying, timerMinutes, timerRemaining])

  const toggleLoop = useCallback(() => {
    setLoop(v => {
      loopRef.current = !v
      return !v
    })
  }, [])

  const play = useCallback((track: AudioTrack, newQueue?: AudioTrack[]) => {
    const audio = getAudio()
    if (newQueue) setQueue(newQueue)
    setCurrentTrack(track)
    audio.src = track.url
    audio.currentTime = 0
    audio.volume = volume
    audio.play().catch(() => {})
    setIsPlaying(true)
    setElapsed(0)
    setTrackDuration(0)
  }, [volume])

  const togglePlay = useCallback(() => {
    const audio = getAudio()
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().catch(() => {})
      setIsPlaying(true)
    }
  }, [isPlaying])

  const next = useCallback(() => {
    if (!currentTrack || queue.length === 0) return
    const audio = getAudio()
    const idx = queue.findIndex(t => t.id === currentTrack.id)
    const nxt = queue[(idx + 1) % queue.length]
    setCurrentTrack(nxt)
    audio.src = nxt.url
    audio.currentTime = 0
    audio.play().catch(() => {})
    setIsPlaying(true)
    setElapsed(0)
    setTrackDuration(0)
  }, [currentTrack, queue])

  const prev = useCallback(() => {
    if (!currentTrack || queue.length === 0) return
    const audio = getAudio()
    // Se passou mais de 3 s, reinicia a faixa atual
    if (audio.currentTime > 3) {
      audio.currentTime = 0
      setElapsed(0)
      return
    }
    const idx = queue.findIndex(t => t.id === currentTrack.id)
    const prv = queue[(idx - 1 + queue.length) % queue.length]
    setCurrentTrack(prv)
    audio.src = prv.url
    audio.currentTime = 0
    audio.play().catch(() => {})
    setIsPlaying(true)
    setElapsed(0)
    setTrackDuration(0)
  }, [currentTrack, queue])

  const seek = useCallback((s: number) => {
    const audio = getAudio()
    audio.currentTime = s
    setElapsed(s)
  }, [])

  const setVolume = useCallback((v: number) => {
    setVolumeState(v)
    getAudio().volume = v
  }, [])

  const setTimer = useCallback((m: number) => {
    setTimerMinutes(m)
    setTimerRemaining(m * 60)
  }, [])

  const stop = useCallback(() => {
    const audio = getAudio()
    audio.pause()
    audio.src = ''
    setIsPlaying(false)
    setCurrentTrack(null)
    setElapsed(0)
    setTrackDuration(0)
    setTimerRemaining(0)
    setTimerMinutes(0)
  }, [])

  return (
    <AudioCtx.Provider value={{
      currentTrack, queue, isPlaying, loop, volume, elapsed, trackDuration,
      timerMinutes, timerRemaining,
      play, togglePlay, toggleLoop, next, prev, seek, setVolume, setTimer, stop,
    }}>
      {children}
    </AudioCtx.Provider>
  )
}

export function useAudio() {
  const ctx = useContext(AudioCtx)
  if (!ctx) throw new Error('useAudio must be used inside AudioProvider')
  return ctx
}
