import { Link, useLocation } from 'react-router-dom'
import { Home, MessageCircle, Apple, Settings, Heart, Dumbbell, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/contexts/AppContext'
import { useTranslation } from '@/contexts/LanguageContext'

export function MobileNav() {
  const location = useLocation()
  const { user } = useApp()
  const { t } = useTranslation()

  const NAV_ITEMS = [
    { to: '/', icon: Home, label: t.nav.home },
    { to: '/meals', icon: Apple, label: t.nav.meals },
    { to: '/workouts', icon: Dumbbell, label: t.nav.workout },
    { to: '/sleep', icon: Moon, label: t.nav.sleep },
    { to: '/chat', icon: MessageCircle, label: t.nav.chat },
    { to: '/ciclo', icon: Heart, label: t.nav.cycle, femaleOnly: true },
    { to: '/settings', icon: Settings, label: t.nav.settings },
  ]
  const isCiclo = location.pathname === '/ciclo'
  const isFemale = user?.gender === 'feminino'

  const navBg = isCiclo ? '#c0687a' : '#4a8c4e'
  const activeIconColor = isCiclo ? '#8b2a3a' : '#2d6a30'

  const visibleItems = NAV_ITEMS.filter(item => !item.femaleOnly || isFemale)

  return (
    <nav className="fixed bottom-4 left-3 right-3 z-40">
      <div
        className="rounded-2xl shadow-xl px-2 py-2 transition-colors duration-300"
        style={{ backgroundColor: navBg }}
      >
        <div className="flex items-center justify-around">
          {visibleItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex flex-col items-center gap-1 px-1.5 py-2 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-white shadow-md scale-105'
                    : 'active:scale-95'
                )}
              >
                <Icon
                  className="w-5 h-5"
                  style={{ color: isActive ? activeIconColor : 'rgba(255,255,255,0.9)', strokeWidth: isActive ? 2.5 : 2 }}
                />
                <span
                  className="text-[10px] font-normal leading-none"
                  style={{ color: isActive ? activeIconColor : 'rgba(255,255,255,0.85)' }}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
