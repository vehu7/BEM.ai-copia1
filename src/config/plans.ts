// ============================================================
// BEM.ai - Configuracao de Planos (Digital Manager Guru)
// ============================================================

export const GURU_PRODUCT_ID = '1777323339'

export interface Plan {
  id: 'free' | 'premium' | 'premium_anual'
  name: string
  price: number
  /** Descricao curta do ciclo de cobranca */
  billingCycle: string
  features: string[]
  guruCheckoutUrl: string
  guruOfferId: string
  /** Destaque visual no pricing card */
  highlighted?: boolean
}

export interface FreePlan extends Plan {
  trialDays: number
}

export const plans: (Plan | FreePlan)[] = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    billingCycle: '7 dias gratis, depois basico',
    trialDays: 7,
    features: [
      'Cardapio semanal gerado por IA (1x por semana)',
      'Registro de refeicoes e rastreamento de macros',
      'Rastreamento de agua, sono e peso',
      'Acompanhamento de ciclo menstrual',
      'Dicas diarias personalizadas',
      'Acesso a dashboard de saude',
    ],
    guruCheckoutUrl: '',
    guruOfferId: '',
  } as FreePlan,
  {
    id: 'premium',
    name: 'Premium',
    price: 29.9,
    billingCycle: 'por mes',
    features: [
      'Tudo do plano gratuito',
      'Cardapio personalizado ilimitado (gerado por IA)',
      'Chat ilimitado com a BEM (IA nutricionista)',
      'Plano de treinos personalizado por IA',
      'Relatorio PDF para compartilhar com medico/nutricionista',
      'Receitas exclusivas e calculadora de substituicoes',
      'Modo GLP-1/Pos-bariatrica especializado',
      'Suporte prioritario',
    ],
    guruCheckoutUrl: 'https://clkdmg.site/subscribe/bemai-premium-mensal',
    guruOfferId: 'a1a58ba9-4276-44c1-aa3a-2c797dd03399',
    highlighted: true,
  },
  {
    id: 'premium_anual',
    name: 'Premium Anual',
    price: 199.9,
    billingCycle: 'por ano',
    features: [
      'Tudo do Premium mensal',
      'Economia de 44% vs mensal',
      'Acesso antecipado a novas funcionalidades',
      'Badge exclusiva "BEM Elite Anual"',
    ],
    guruCheckoutUrl: 'https://clkdmg.site/subscribe/bemai-premium-anual',
    guruOfferId: 'a1a58c01-d60b-41c8-950c-b833fe9b2873',
  },
]

// ============================================================
// Helper functions
// ============================================================

/**
 * Retorna um plano pelo seu id.
 * Se nao encontrar, retorna `undefined`.
 */
export function getPlanById(planId: string): Plan | undefined {
  return plans.find((plan) => plan.id === planId)
}

/**
 * Retorna um plano a partir do Guru Offer ID recebido no webhook.
 * Se nao encontrar, retorna `undefined`.
 */
export function getPlanByGuruOfferId(offerId: string): Plan | undefined {
  return plans.find((plan) => plan.guruOfferId === offerId)
}

/**
 * Retorna a URL de checkout do plano, forcando cartao de credito como
 * unica forma de pagamento para planos recorrentes (premium mensal e anual).
 * Acordado com o cliente: recorrencia somente via cartao.
 */
export function getCheckoutUrl(plan: Plan): string {
  if (!plan.guruCheckoutUrl) return ''
  if (plan.id === 'free') return plan.guruCheckoutUrl
  try {
    const url = new URL(plan.guruCheckoutUrl)
    url.searchParams.set('payment_method', 'credit_card')
    url.searchParams.set('recurrence', 'true')
    return url.toString()
  } catch {
    const separator = plan.guruCheckoutUrl.includes('?') ? '&' : '?'
    return `${plan.guruCheckoutUrl}${separator}payment_method=credit_card&recurrence=true`
  }
}
