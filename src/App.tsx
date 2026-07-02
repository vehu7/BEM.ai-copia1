import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useApp } from '@/contexts/AppContext'
import { ProfileSetupModal } from '@/components/profile-setup-modal'
import { MobileNav } from '@/components/mobile-nav'
import { AudioPlayerBar } from '@/components/audio-player-bar'
import { OnboardingFunnel } from '@/pages/OnboardingFunnel'
import { Register } from '@/pages/Register'
import { Login } from '@/pages/Login'
import { ResetPassword } from '@/pages/ResetPassword'
import { LandingPage } from '@/pages/LandingPage'
import { PlanSummary } from '@/pages/PlanSummary'
import { Plans } from '@/pages/Plans'
import { Dashboard } from '@/pages/Dashboard'
import { ChatBem } from '@/pages/ChatBem'
import { Meditation } from '@/pages/Meditation'
import { WaterTracker } from '@/pages/WaterTracker'
import { Alimentacao } from '@/pages/Alimentacao'
import { Fasting } from '@/pages/Fasting'
import { Progress } from '@/pages/Progress'
import { Settings } from '@/pages/Settings'
import { CicloMenstrual } from '@/pages/CicloMenstrual'
import { Workouts } from '@/pages/Workouts'
import { Sleep } from '@/pages/Sleep'
import { Achievements } from '@/pages/Achievements'
import { Toaster } from '@/components/ui/sonner'
import { Spinner } from '@/components/ui/spinner'
import { PwaInstallPrompt } from '@/components/pwa-install-prompt'
import { AchievementCelebration } from '@/components/achievement-celebration'
import { RecordCelebration } from '@/components/record-celebration'
import { CelebrationModal } from '@/components/celebration-modal'
import { TrialBanner } from '@/components/trial-banner'
import { TrialExpiredScreen } from '@/components/trial-expired-screen'
import { shouldShowTrialExpiredGate } from '@/lib/subscription'

function isDarkHour() {
  const hour = new Date().getHours()
  return hour >= 18 || hour < 6
}

function getThemeMode(): boolean {
  const saved = localStorage.getItem('app-theme')
  if (saved === 'dark') return true
  if (saved === 'light') return false
  return isDarkHour()
}

/* Gate que exibe o modal de perfil quando a feature requer perfil completo */
function RequireProfile({ children }: { children: React.ReactNode }) {
  const { isProfileComplete } = useApp()
  const [showModal, setShowModal] = useState(!isProfileComplete)
  const onComplete = useCallback(() => setShowModal(false), [])

  if (!isProfileComplete && showModal) {
    return <ProfileSetupModal open={true} onComplete={onComplete} />
  }
  return <>{children}</>
}

export function App() {
  const { isOnboarding, isAuthenticated, authLoading, user, sessionEmail, pendingCelebration, dismissCelebration } = useApp()
  const location = useLocation()
  const [darkMode, setDarkMode] = useState(getThemeMode)

  useEffect(() => {
    const update = () => setDarkMode(getThemeMode())
    window.addEventListener('app-theme-change', update)
    const interval = setInterval(update, 60_000)
    return () => {
      window.removeEventListener('app-theme-change', update)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [darkMode])

  // Rota pública — landing page
  if (location.pathname === '/lp') {
    return <LandingPage />
  }

  // Rota pública — sem nav, sem guard
  if (location.pathname === '/redefinir-senha') {
    return (
      <>
        <Routes>
          <Route path="/redefinir-senha" element={<ResetPassword />} />
        </Routes>
        <Toaster />
      </>
    )
  }

  // Aguardando Supabase resolver sessão
  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-primary">
        <Spinner className="size-10 text-primary-foreground" />
      </div>
    )
  }

  // Não autenticado
  if (!isAuthenticated) {
    return (
      <>
        <Routes>
          <Route path="/onboarding" element={<OnboardingFunnel />} />
          <Route path="/registrar" element={<Register />} />
          <Route path="/login" element={<Login />} />
          {/* Redireciona para onboarding se nunca fez, ou login se já fez */}
          <Route path="*" element={<Navigate to={isOnboarding ? '/onboarding' : '/login'} replace />} />
        </Routes>
        <Toaster />
      </>
    )
  }

  // Autenticado — trial expirado bloqueia o app
  if (shouldShowTrialExpiredGate(user, sessionEmail)) {
    return (
      <>
        <TrialExpiredScreen />
        <Toaster />
      </>
    )
  }

  // Autenticado — app completo
  return (
    <>
      <TrialBanner />
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/plan-summary" element={<PlanSummary />} />
          <Route path="/planos" element={<Plans />} />
          <Route path="/chat" element={<ChatBem />} />
          <Route path="/meditation" element={<Meditation />} />
          <Route path="/water" element={<WaterTracker />} />
          <Route path="/meals" element={<RequireProfile><Alimentacao /></RequireProfile>} />
          <Route path="/fasting" element={<Fasting />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/ciclo" element={user?.gender === 'feminino' ? <CicloMenstrual /> : <Navigate to="/" replace />} />
          <Route path="/workouts" element={<RequireProfile><Workouts /></RequireProfile>} />
          <Route path="/sleep" element={<Sleep />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/onboarding" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/registrar" element={<Navigate to="/" replace />} />
        </Routes>
        <AudioPlayerBar />
        <MobileNav />
      </div>
      <PwaInstallPrompt />
      <AchievementCelebration />
      <RecordCelebration />
      {pendingCelebration && (
        <CelebrationModal
          open={true}
          kind={pendingCelebration.kind}
          title={pendingCelebration.title}
          subtitle={pendingCelebration.subtitle}
          xpGained={pendingCelebration.xpGained}
          onClose={dismissCelebration}
        />
      )}
      <Toaster />
    </>
  )
}

export default App
