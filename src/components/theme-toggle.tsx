import { Button } from "@/components/ui/button"
import { Moon, Sun, Clock } from "lucide-react"
import { useState } from "react"

const THEME_KEY = 'app-theme'
type AppTheme = 'light' | 'dark' | 'auto'

export function ThemeToggle() {
  const [theme, setThemeState] = useState<AppTheme>(
    () => (localStorage.getItem(THEME_KEY) as AppTheme) || 'auto'
  )

  const cycle = () => {
    const next: AppTheme = theme === 'auto' ? 'light' : theme === 'light' ? 'dark' : 'auto'
    localStorage.setItem(THEME_KEY, next)
    setThemeState(next)
    window.dispatchEvent(new Event('app-theme-change'))
  }

  const icon = theme === 'dark'
    ? <Sun className="size-4" />
    : theme === 'light'
    ? <Moon className="size-4" />
    : <Clock className="size-4" />

  const label = theme === 'dark' ? 'Escuro' : theme === 'light' ? 'Claro' : 'Auto'

  return (
    <Button
      variant="outline"
      onClick={cycle}
      className="gap-2 cursor-pointer"
      aria-label="Alternar tema"
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </Button>
  )
}
