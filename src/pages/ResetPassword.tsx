import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useTranslation } from '@/contexts/LanguageContext'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'

const inputClass = "h-12 rounded-full bg-input border border-border px-5 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"

export function ResetPassword() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase embeds tokens in the URL hash after redirecting from the email link.
    // Calling getSession() is enough — the client SDK picks up the hash automatically.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true)
      } else {
        // Wait for onAuthStateChange in case the hash hasn't been processed yet
        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
            setReady(true)
            listener.subscription.unsubscribe()
          }
        })
      }
    })
  }, [])

  const handleSubmit = async () => {
    if (!password || !confirm) {
      toast.error(t.resetPassword.fillBoth)
      return
    }
    if (password.length < 6) {
      toast.error(t.resetPassword.passwordTooShort)
      return
    }
    if (password !== confirm) {
      toast.error(t.resetPassword.passwordsDontMatch)
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      toast.error(t.resetPassword.error, { description: error.message })
      return
    }

    toast.success(t.resetPassword.success)
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <img
        src="/mascots/koala-zen.webp"
        alt="Mascote"
        className="w-24 h-24 object-contain mb-3"
      />
      <h1 className="text-4xl font-black mb-1 text-primary">BEM.ai</h1>
      <p className="text-sm mb-8 text-muted-foreground">
        Sua companheira de saúde e bem-estar
      </p>

      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-lg space-y-4">
        <h2 className="text-lg font-bold text-center text-foreground">
          {t.resetPassword.title}
        </h2>

        {!ready ? (
          <p className="text-center text-sm text-muted-foreground">
            {t.resetPassword.checking}
          </p>
        ) : (
          <>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder={t.resetPassword.newPassword}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass + ' pr-12'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Input
              type="password"
              placeholder={t.resetPassword.confirmPassword}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className={inputClass}
            />

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-12 rounded-full font-bold text-sm bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? t.resetPassword.submitting : t.resetPassword.submit}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
