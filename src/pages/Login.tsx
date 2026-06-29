import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '@/contexts/AppContext'
import { useTranslation } from '@/contexts/LanguageContext'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { X, ScanFace } from 'lucide-react'

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

export function Login() {
  const { login, loginWithGoogle, resetPassword, isBiometricAvailable, isBiometricEnabled, enableBiometric, loginWithBiometric } = useApp()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [biometricLoading, setBiometricLoading] = useState(false)

  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  // Oferta de ativação biométrica após login bem-sucedido
  const [showBiometricOffer, setShowBiometricOffer] = useState(false)
  const [enablingBiometric, setEnablingBiometric] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error(t.login.fillEmailPassword)
      return
    }

    setLoading(true)
    const { error } = await login(email, password)
    setLoading(false)

    if (error) {
      toast.error(error)
      return
    }

    // Oferecer biometria se disponível e ainda não ativada
    if (isBiometricAvailable && !isBiometricEnabled) {
      setShowBiometricOffer(true)
    } else {
      navigate('/')
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    const { error } = await loginWithGoogle()
    setGoogleLoading(false)
    if (error) toast.error(error)
  }

  const handleBiometricLogin = async () => {
    setBiometricLoading(true)
    const { error } = await loginWithBiometric()
    setBiometricLoading(false)

    if (error) {
      toast.error(error)
      return
    }

    navigate('/')
  }

  const handleEnableBiometric = async () => {
    setEnablingBiometric(true)
    const { error } = await enableBiometric()
    setEnablingBiometric(false)

    if (error) {
      toast.error(error)
    } else {
      toast.success(t.login.quickAccessActivated)
    }
    navigate('/')
  }

  const handleResetPassword = async () => {
    if (!resetEmail) {
      toast.error('Informe seu e-mail')
      return
    }

    setResetLoading(true)
    const { error } = await resetPassword(resetEmail)
    setResetLoading(false)

    if (error) {
      toast.error(error)
      return
    }

    setResetSent(true)
  }

  const closeReset = () => {
    setShowReset(false)
    setResetEmail('')
    setResetSent(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <img
        src="/mascots/koala-zen.webp"
        alt="Mascote"
        className="w-24 h-24 object-contain mb-3"
      />
      <h1 className="font-display text-4xl font-extrabold tracking-tight mb-1 text-primary">{t.login.appName}</h1>
      <p className="text-sm mb-8 text-muted-foreground">
        {t.login.tagline}
      </p>

      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-lg space-y-4">
        <h2 className="text-lg font-bold text-center text-foreground">
          {t.login.title}
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
          placeholder={t.login.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          className={inputClass}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className={primaryBtn}
        >
          {loading ? t.login.submitting : t.login.submit}
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
          {googleLoading ? t.login.redirecting : t.login.google}
        </button>

        {/* Botão biométrico — só aparece se já ativado */}
        {isBiometricEnabled && (
          <button
            onClick={handleBiometricLogin}
            disabled={biometricLoading}
            className="w-full h-12 rounded-full font-bold text-sm border-2 border-primary text-primary flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:bg-primary/5 active:scale-[0.99]"
          >
            <ScanFace className="w-5 h-5" />
            {biometricLoading ? t.login.verifying : t.login.biometric}
          </button>
        )}

        <p className="text-center text-xs text-muted-foreground">
          {t.login.noAccount}{' '}
          <Link to="/registrar" className="underline font-semibold text-primary">
            {t.login.createAccount}
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          <button
            onClick={() => { setResetEmail(email); setShowReset(true) }}
            className="underline"
          >
            {t.login.forgotPassword}
          </button>
        </p>
      </div>

      {/* Modal redefinir senha */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 sm:items-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeReset} />
          <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4">
            <button
              onClick={closeReset}
              className="absolute top-3 right-3 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {!resetSent ? (
              <>
                <div className="text-center">
                  <h3 className="text-base font-black mb-1 text-foreground">
                    {t.login.resetTitle}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t.login.resetDesc}
                  </p>
                </div>
                <Input
                  type="email"
                  placeholder={t.login.email}
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                  className={inputClass}
                />
                <button
                  onClick={handleResetPassword}
                  disabled={resetLoading}
                  className={primaryBtn}
                >
                  {resetLoading ? t.login.sending : t.login.sendLink}
                </button>
              </>
            ) : (
              <div className="text-center py-2 space-y-3">
                <div className="text-4xl">📬</div>
                <h3 className="text-base font-black text-foreground">
                  {t.login.emailSent}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t.login.emailSentDesc}
                </p>
                <button
                  onClick={closeReset}
                  className={primaryBtn}
                >
                  {t.common.close}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal oferta biométrica pós-login */}
      {showBiometricOffer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 sm:items-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto bg-primary/15">
                <ScanFace className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-base font-black text-foreground">
                {t.login.enableBiometric}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t.login.enableBiometricDesc}
              </p>
            </div>

            <button
              onClick={handleEnableBiometric}
              disabled={enablingBiometric}
              className={primaryBtn}
            >
              {enablingBiometric ? t.login.activating : t.login.activateBiometric}
            </button>

            <button
              onClick={() => { setShowBiometricOffer(false); navigate('/') }}
              className="w-full h-10 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.login.notNow}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
