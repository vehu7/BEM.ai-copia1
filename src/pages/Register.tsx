import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '@/contexts/AppContext'
import { useTranslation } from '@/contexts/LanguageContext'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

const inputClass = "h-12 rounded-full bg-input border border-border px-5 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40 shadow-none"

const primaryBtn = "w-full h-12 rounded-full font-bold text-sm bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:brightness-105 active:scale-[0.99]"

export function Register() {
  const { register, loginWithGoogle } = useApp()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)

  // Permite registro mesmo sem pending profile (perfil será completado depois via modal)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    const { error } = await loginWithGoogle()
    setGoogleLoading(false)
    if (error) toast.error(error)
  }

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      toast.error(t.register.fillAll)
      return
    }
    if (password !== confirmPassword) {
      toast.error(t.register.passwordsDontMatch)
      return
    }
    if (password.length < 6) {
      toast.error(t.register.passwordTooShort)
      return
    }

    setLoading(true)
    const { error } = await register(email, password)
    setLoading(false)

    if (error) {
      toast.error(t.register.error, { description: error })
      return
    }

    toast.success(t.register.success, { description: t.register.successDesc })
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <img
        src="/mascots/koala-zen.webp"
        alt="Mascote"
        className="w-24 h-24 object-contain mb-3"
      />
      <h1 className="font-display text-4xl font-extrabold tracking-tight mb-1 text-primary">Bem.AI</h1>
      <p className="text-sm mb-8 text-muted-foreground">
        {t.register.subtitle}
      </p>

      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-lg space-y-4">
        <h2 className="text-lg font-bold text-center text-foreground">
          {t.register.title}
        </h2>

        <Input
          type="email"
          placeholder={t.login.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        <Input
          type="password"
          placeholder={t.register.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
        <Input
          type="password"
          placeholder={t.register.confirmPassword}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
          className={inputClass}
        />

        <button
          onClick={handleRegister}
          disabled={loading}
          className={primaryBtn}
        >
          {loading ? t.register.submitting : t.register.submit}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">{t.common.or}</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full h-12 rounded-full font-semibold text-sm border border-border bg-card text-foreground flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-accent active:scale-[0.99]"
        >
          <GoogleIcon />
          {googleLoading ? 'Redirecionando...' : t.register.google}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          {t.register.hasAccount}{' '}
          <Link to="/login" className="underline font-semibold text-primary">
            {t.register.login}
          </Link>
        </p>
      </div>
    </div>
  )
}
