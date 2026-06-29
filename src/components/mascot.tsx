import { useState, useEffect } from 'react'
import { Sparkles, Heart, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MascotProps {
  mood?: 'happy' | 'excited' | 'celebrating' | 'encouraging'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  message?: string
  showMessage?: boolean
}

export function Mascot({
  mood = 'happy',
  size = 'md',
  className,
  message,
  showMessage = false
}: MascotProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }

  const getMoodIcon = () => {
    switch (mood) {
      case 'excited':
        return <Sparkles className="w-6 h-6 text-secondary" />
      case 'celebrating':
        return <Heart className="w-6 h-6 text-destructive" />
      case 'encouraging':
        return <TrendingUp className="w-6 h-6 text-primary" />
      default:
        return <Heart className="w-6 h-6 text-primary" />
    }
  }

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="relative">
        {/* Corpo do mascote */}
        <div className={cn(
          'relative rounded-full bg-primary flex items-center justify-center shadow-lg transition-transform hover:scale-105',
          sizeClasses[size],
          mood === 'excited' && 'animate-bounce',
          mood === 'celebrating' && 'animate-pulse'
        )}>
          {/* Rosto sorridente */}
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Olhos */}
            <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-primary-foreground rounded-full" />
            <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-primary-foreground rounded-full" />

            {/* Boca sorridente */}
            <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2">
              <div className="w-8 h-4 border-b-2 border-primary-foreground rounded-b-full" />
            </div>
          </div>

          {/* Ícone de humor */}
          <div className="absolute -top-2 -right-2 bg-background rounded-full p-1 shadow-md">
            {getMoodIcon()}
          </div>
        </div>

        {/* Brilho animado */}
        {mood === 'celebrating' && (
          <div className="absolute -inset-2 bg-secondary/20 rounded-full animate-ping" />
        )}
      </div>

      {/* Mensagem do mascote */}
      {showMessage && message && (
        <div className="relative max-w-xs">
          <div className="bg-card border border-border rounded-3xl px-6 py-4 shadow-lg">
            <p className="text-base text-center font-medium leading-relaxed text-primary">
              {message}
            </p>
            {/* Setinha do balão */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card border-l-2 border-t-2 border-primary rotate-45" />
          </div>
        </div>
      )}
    </div>
  )
}

function ZenMascot() {
  return <img src="/mascots/koala-zen.webp" alt="Mascote zen" className="w-24 h-24 object-contain drop-shadow-md" />
}

function SleepMascot() {
  return <img src="/mascots/koala-sono.png" alt="Mascote dormindo" className="w-24 h-24 object-contain drop-shadow-md" />
}

function DarkMascot() {
  return <img src="https://vmfhhwbbwnotugnrdjpm.supabase.co/storage/v1/object/public/icons_app/modo%20escuro.png" alt="Mascote modo escuro" className="w-24 h-24 object-contain drop-shadow-md" />
}

function getIsDark() {
  const saved = localStorage.getItem('app-theme')
  if (saved === 'dark') return true
  if (saved === 'light') return false
  const hour = new Date().getHours()
  return hour >= 18 || hour < 6
}

export function MascotGreeting({ name }: { name: string }) {
  const hour = new Date().getHours()
  const [isDark, setIsDark] = useState(getIsDark)

  useEffect(() => {
    const update = () => setIsDark(getIsDark())
    window.addEventListener('app-theme-change', update)
    return () => window.removeEventListener('app-theme-change', update)
  }, [])

  let greeting = 'Oi'
  if (hour < 12) {
    greeting = 'Bom dia'
  } else if (hour < 18) {
    greeting = 'Boa tarde'
  } else {
    greeting = 'Boa noite'
  }

  const isNight = hour >= 18 || hour < 6

  const mascot = isDark ? <DarkMascot /> : isNight ? <SleepMascot /> : <ZenMascot />

  return (
    <div className="flex items-center justify-between gap-3 px-1 pt-2">
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-primary truncate">{greeting}, {name}!</h2>
        <p className="text-sm text-muted-foreground mt-0.5 truncate">Como você está hoje?</p>
      </div>
      <div className="flex-shrink-0">{mascot}</div>
    </div>
  )
}
