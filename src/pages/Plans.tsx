import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/contexts/AppContext'
import { useTranslation } from '@/contexts/LanguageContext'
import { plans, type Plan } from '@/config/plans'
import { getTrialStatus } from '@/lib/subscription'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { toast } from 'sonner'
import {
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Lock,
  CreditCard,
  Receipt,
  Mail,
  AlertTriangle,
} from 'lucide-react'

function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

export function Plans() {
  const navigate = useNavigate()
  const { user } = useApp()
  const { t } = useTranslation()
  const tp = t.plans
  const status = getTrialStatus(user)

  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null)
  const [emailConfirmed, setEmailConfirmed] = useState(false)

  const monthly = plans.find(p => p.id === 'premium')
  const annual = plans.find(p => p.id === 'premium_anual')
  if (!monthly || !annual) return null

  const monthlyAnnualized = monthly.price * 12
  const savingsPercent = Math.round(((monthlyAnnualized - annual.price) / monthlyAnnualized) * 100)
  const annualPerMonth = annual.price / 12

  const requestCheckout = (plan: Plan) => {
    const url = plan.guruCheckoutUrl
    if (!url || url.includes('PLACEHOLDER')) {
      toast.error(tp.checkoutUnavailable.title, {
        description: tp.checkoutUnavailable.description,
      })
      return
    }
    setEmailConfirmed(false)
    setPendingPlan(plan)
  }

  const proceedToCheckout = () => {
    if (!pendingPlan) return
    window.open(pendingPlan.guruCheckoutUrl, '_blank', 'noopener,noreferrer')
    setPendingPlan(null)
  }

  const cancelCheckout = () => {
    setPendingPlan(null)
    setEmailConfirmed(false)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header sticky */}
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label={t.common.back}
            className="cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-base sm:text-lg truncate">{tp.header.title}</h1>
            {status.isTrialActive && (
              <p className="text-xs text-muted-foreground truncate">
                {status.daysRemaining === 1
                  ? tp.header.trialEndingToday
                  : tp.header.trialEnding.replace('{days}', String(status.daysRemaining))}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-10">
        {/* Hero */}
        <section className="text-center space-y-3 pt-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
            {tp.hero.title}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            {tp.hero.subtitle}
          </p>
        </section>

        {/* Trust pills */}
        <section className="flex flex-wrap items-center justify-center gap-2">
          <Badge variant="secondary" className="rounded-full font-medium gap-1.5">
            <Receipt className="w-3.5 h-3.5" />
            PIX
          </Badge>
          <Badge variant="secondary" className="rounded-full font-medium gap-1.5">
            <CreditCard className="w-3.5 h-3.5" />
            {tp.trustPills.creditCard}
          </Badge>
          <Badge variant="secondary" className="rounded-full font-medium gap-1.5">
            <Receipt className="w-3.5 h-3.5" />
            {tp.trustPills.boleto}
          </Badge>
          <Badge variant="secondary" className="rounded-full font-medium gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            {tp.trustPills.secure}
          </Badge>
        </section>

        {/* Plan cards */}
        <section className="grid gap-4 sm:grid-cols-2 sm:items-stretch">
          {/* Mensal */}
          <Card className="relative flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{monthly.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{tp.plans.monthlyDescription}</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-5">
              <div className="space-y-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-4xl font-extrabold tracking-tight">{formatBRL(monthly.price)}</span>
                  <span className="text-sm text-muted-foreground">/{tp.plans.perMonth}</span>
                </div>
                <p className="text-xs text-muted-foreground">{tp.plans.monthlyBilling}</p>
              </div>

              <ul className="space-y-2.5 flex-1">
                {monthly.features.map((feature, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                variant="outline"
                className="w-full cursor-pointer"
                onClick={() => requestCheckout(monthly)}
              >
                {tp.plans.subscribeMonthly}
              </Button>
            </CardContent>
          </Card>

          {/* Anual — destacado */}
          <Card className="relative flex flex-col border-2 border-primary shadow-lg shadow-primary/10">
            <CardHeader className="pb-3">
              <Badge className="rounded-full px-3 py-1 gap-1 self-start mb-2 shadow-sm shadow-primary/30">
                <Sparkles className="w-3 h-3 animate-pulse" />
                {tp.plans.bestValue}
              </Badge>
              <CardTitle className="text-lg flex items-center gap-2">
                {annual.name}
                <Badge variant="secondary" className="rounded-full text-[10px] font-bold">
                  -{savingsPercent}%
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">{tp.plans.annualDescription}</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-5">
              <div className="space-y-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-4xl font-extrabold tracking-tight">{formatBRL(annual.price)}</span>
                  <span className="text-sm text-muted-foreground">/{tp.plans.perYear}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {tp.plans.annualEquivalent.replace('{price}', formatBRL(annualPerMonth))}
                </p>
              </div>

              <ul className="space-y-2.5 flex-1">
                {annual.features.map((feature, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                className="w-full cursor-pointer"
                onClick={() => requestCheckout(annual)}
              >
                {tp.plans.subscribeAnnual}
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Garantia 7 dias */}
        <section>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-5 pb-5 flex gap-3 sm:gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/15 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm sm:text-base">{tp.guarantee.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {tp.guarantee.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Aviso e-mail (se autenticado) */}
        {user?.email && (
          <section>
            <Card className="border-border">
              <CardContent className="pt-5 pb-5 flex gap-3 items-start">
                <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-semibold">{tp.emailNotice.title}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {tp.emailNotice.body}{' '}
                    <strong className="text-foreground break-all">{user.email}</strong>.
                  </p>
                  <p className="text-xs text-muted-foreground/80 pt-0.5">
                    {tp.emailNotice.note}
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* FAQ */}
        <section className="space-y-4">
          <h3 className="font-display text-xl font-extrabold tracking-tight text-center">{tp.faq.title}</h3>
          <Accordion type="single" collapsible className="w-full">
            {tp.faq.items.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-sm sm:text-base font-semibold cursor-pointer">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* CTA final */}
        <section className="text-center space-y-3 pt-2">
          <img
            src="/mascots/koala-celebracao.webp"
            alt=""
            aria-hidden="true"
            className="w-32 h-32 sm:w-40 sm:h-40 mx-auto object-contain drop-shadow-lg"
          />
          <p className="text-sm text-muted-foreground">{tp.finalCta.subtitle}</p>
          <Button
            size="lg"
            className="cursor-pointer"
            onClick={() => requestCheckout(annual)}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {tp.finalCta.button}
          </Button>
        </section>
      </main>

      {/* Dialog de confirmacao de e-mail antes do checkout */}
      <Dialog open={pendingPlan !== null} onOpenChange={(o) => !o && cancelCheckout()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center mb-2">
              <Mail className="w-6 h-6 text-accent" />
            </div>
            <DialogTitle className="text-center">{tp.confirmEmail.title}</DialogTitle>
            <DialogDescription className="text-center">
              {tp.confirmEmail.description}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border-2 border-primary/40 bg-primary/5 px-4 py-3 space-y-1">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              {tp.confirmEmail.yourEmail}
            </p>
            <p className="font-bold text-base break-all">{user?.email ?? '—'}</p>
          </div>

          <div className="flex gap-3 rounded-lg bg-accent/10 border border-accent/30 p-3">
            <AlertTriangle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-foreground/90">
              {tp.confirmEmail.warning}
            </p>
          </div>

          <label
            htmlFor="confirm-email-checkbox"
            className="flex items-start gap-3 cursor-pointer select-none rounded-lg border bg-card px-3 py-3 hover:bg-muted/40 transition-colors"
          >
            <Checkbox
              id="confirm-email-checkbox"
              checked={emailConfirmed}
              onCheckedChange={(c) => setEmailConfirmed(c === true)}
              className="mt-0.5"
            />
            <span className="text-sm font-medium">
              {tp.confirmEmail.checkbox}
            </span>
          </label>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={cancelCheckout}
              className="cursor-pointer"
            >
              {tp.confirmEmail.cancel}
            </Button>
            <Button
              disabled={!emailConfirmed}
              onClick={proceedToCheckout}
              className="cursor-pointer"
            >
              {tp.confirmEmail.continueToPayment}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
