import { useApp } from '@/contexts/AppContext'
import { plans } from '@/config/plans'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CheckCircle2, Mail, LogOut, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/contexts/LanguageContext'

export function TrialExpiredScreen() {
  const { user, logout } = useApp()
  const { t } = useTranslation()
  const tt = t.trial.expired

  const paidPlans = plans.filter(p => p.id !== 'free')

  const handleCheckout = (url: string) => {
    if (!url || url.includes('PLACEHOLDER')) {
      toast.error(tt.checkoutPlaceholderTitle, {
        description: tt.checkoutPlaceholderDesc,
      })
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-4 pt-8 pb-16 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <img
            src="/mascots/koala-zen.webp"
            alt=""
            aria-hidden="true"
            className="w-28 h-28 sm:w-32 sm:h-32 mx-auto object-contain drop-shadow-md"
          />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/15 text-warning text-xs font-bold uppercase tracking-wide">
            <AlertTriangle className="w-3.5 h-3.5" />
            {tt.title}
          </div>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {tt.subtitle}
          </p>
        </div>

        {/* Aviso do email */}
        <Card className="border-warning/40 bg-warning/10">
          <CardContent className="pt-5 pb-5">
            <div className="flex gap-3">
              <Mail className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="space-y-1.5 min-w-0">
                <p className="font-semibold text-sm text-warning">
                  {tt.emailTitle}
                </p>
                <p className="text-xs sm:text-sm text-foreground/80">
                  {tt.emailBody1}
                  {user?.email && (
                    <> <strong className="font-semibold break-all text-foreground">{user.email}</strong></>
                  )}
                  {!user?.email && ` ${tt.emailBodyFallback}`}
                  .
                </p>
                <p className="text-xs text-muted-foreground pt-1">
                  {tt.emailBodyNote}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de planos */}
        <div className="grid gap-4 sm:grid-cols-2 sm:items-stretch">
          {paidPlans.map(plan => (
            <Card
              key={plan.id}
              className={`flex flex-col ${plan.highlighted ? 'border-2 border-primary shadow-lg shadow-primary/10' : ''}`}
            >
              <CardHeader className="pb-3">
                {plan.highlighted && (
                  <Badge className="rounded-full px-3 py-1 gap-1 self-start mb-2 shadow-sm shadow-primary/30">
                    <Sparkles className="w-3 h-3 animate-pulse" />
                    {tt.mostPopular}
                  </Badge>
                )}
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1.5 pt-1">
                  <span className="font-display text-4xl font-extrabold tracking-tight text-primary">
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-sm text-muted-foreground">/ {plan.billingCycle}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-4">
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  size="lg"
                  variant={plan.highlighted ? 'default' : 'outline'}
                  onClick={() => handleCheckout(plan.guruCheckoutUrl)}
                >
                  {tt.subscribe} {plan.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Logout */}
        <div className="text-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            {tt.logout}
          </Button>
        </div>
      </div>
    </div>
  )
}
