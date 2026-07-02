import type { UserProfile, SubscriptionPlan } from '@/types'

export const TRIAL_DURATION_DAYS = 7

/** Features cujo acesso é controlado pelo plano/trial. */
export type GatedFeature = 'ai-chat' | 'ai-workout' | 'nutriscan' | 'weekly-menu' | 'substitutions'

export interface TrialStatus {
  /** True se o usuário está no período de trial ativo (free + dentro dos 7 dias). */
  isTrialActive: boolean
  /** True se já expirou o trial e o usuário ainda é free. */
  isTrialExpired: boolean
  /** True se o usuário é premium (mensal ou anual) — trial não se aplica. */
  isPremium: boolean
  /** Dias restantes até o fim do trial (arredondado para cima, mínimo 0). */
  daysRemaining: number
  /** Plano atual do usuário. */
  plan: SubscriptionPlan
}

function isPremiumPlan(plan?: SubscriptionPlan): boolean {
  return plan === 'premium' || plan === 'premium_anual'
}

/** Emergency override: set `VITE_DISABLE_TRIAL_GATE=true` para liberar tudo. */
function isTrialGateDisabled(): boolean {
  try {
    return import.meta.env.VITE_DISABLE_TRIAL_GATE === 'true'
  } catch {
    return false
  }
}

/**
 * Whitelist de desenvolvimento: emails aqui têm acesso premium garantido
 * APENAS quando rodando em modo dev (localhost). Em produção (`npm run build`)
 * `import.meta.env.DEV` é `false`, então essa lista é totalmente ignorada.
 *
 * Uso: permite testar features premium localmente sem precisar alterar o banco.
 */
const DEV_PREMIUM_EMAILS: string[] = [
  'giovannid@gmail.com',
  'giovanni@lasy.ai',
]

/**
 * Whitelist de produção: emails com acesso premium garantido em qualquer ambiente.
 * Uso: contas de admin/equipe que devem ter acesso total permanente.
 */
const PROD_PREMIUM_EMAILS: string[] = [
  'veronicaresteves@gmail.com',
  'hsilverio87@gmail.com',
]

function isDevPremiumUser(user: UserProfile | null): boolean {
  try {
    if (!import.meta.env.DEV) return false
    if (!user?.email) return false
    return DEV_PREMIUM_EMAILS.includes(user.email.toLowerCase())
  } catch {
    return false
  }
}

function isProdPremiumUser(user: UserProfile | null, fallbackEmail?: string): boolean {
  const email = user?.email || fallbackEmail
  if (!email) return false
  return PROD_PREMIUM_EMAILS.includes(email.toLowerCase())
}

/**
 * Calcula o status do trial com base no perfil do usuário.
 * Fonte da verdade: `user.trialStartedAt` + `user.plan`.
 */
export function getTrialStatus(user: UserProfile | null, fallbackEmail?: string): TrialStatus {
  const plan: SubscriptionPlan = user?.plan ?? 'free'

  // Bypass para contas admin/equipe (funciona em qualquer ambiente).
  if (isProdPremiumUser(user, fallbackEmail) || isDevPremiumUser(user)) {
    return {
      isTrialActive: false,
      isTrialExpired: false,
      isPremium: true,
      daysRemaining: 0,
      plan: 'premium',
    }
  }

  if (!user || isPremiumPlan(plan)) {
    return {
      isTrialActive: false,
      isTrialExpired: false,
      isPremium: isPremiumPlan(plan),
      daysRemaining: 0,
      plan,
    }
  }

  // Free — verifica dias desde o início do trial.
  const startedAt = user.trialStartedAt ? new Date(user.trialStartedAt) : new Date()
  const now = new Date()
  const msSinceStart = now.getTime() - startedAt.getTime()
  const daysSinceStart = Math.floor(msSinceStart / (1000 * 60 * 60 * 24))
  const daysRemaining = Math.max(0, TRIAL_DURATION_DAYS - daysSinceStart)
  const isTrialExpired = daysRemaining <= 0

  return {
    isTrialActive: !isTrialExpired,
    isTrialExpired,
    isPremium: false,
    daysRemaining,
    plan,
  }
}

/**
 * Verifica se o usuário tem acesso a uma feature específica.
 *
 * Regras:
 * - Premium: acesso total.
 * - Free + trial ativo: acesso a nutriscan, cardápio e substituições. SEM acesso a chat e geração de treinos.
 * - Free + trial expirado: acesso negado a tudo.
 * - Override global via `VITE_DISABLE_TRIAL_GATE=true` libera tudo.
 */
export function hasAccess(user: UserProfile | null, feature: GatedFeature, fallbackEmail?: string): boolean {
  if (isTrialGateDisabled()) return true
  if (isProdPremiumUser(user, fallbackEmail) || isDevPremiumUser(user)) return true
  if (!user) return false

  const status = getTrialStatus(user, fallbackEmail)

  if (status.isPremium) return true
  if (status.isTrialExpired) return false

  // Trial ativo — libera somente as features permitidas no free
  const freeTrialFeatures: GatedFeature[] = ['nutriscan', 'weekly-menu', 'substitutions']
  return freeTrialFeatures.includes(feature)
}

/** True se o usuário está totalmente bloqueado e deve ver a tela de trial expirado. */
export function shouldShowTrialExpiredGate(user: UserProfile | null, fallbackEmail?: string): boolean {
  if (isTrialGateDisabled()) return false
  if (isProdPremiumUser(user, fallbackEmail) || isDevPremiumUser(user)) return false
  if (!user) return false
  const status = getTrialStatus(user, fallbackEmail)
  return status.isTrialExpired && !status.isPremium
}
