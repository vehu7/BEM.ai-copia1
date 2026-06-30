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

export const plans: Plan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    billingCycle: 'gratis para sempre',
    features: [
      'Acesso a meditacoes basicas',
      'Diario de bem-estar (3 registros/dia)',
      'Dicas diarias de saude',
      'Rastreamento basico de humor',
      'Conteudos introdutorios de mindfulness',
    ],
    guruCheckoutUrl: '',
    guruOfferId: '',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 29.9,
    billingCycle: 'por mes',
    features: [
      'Todas as funcionalidades do plano Gratuito',
      'Meditacoes guiadas ilimitadas',
      'Diario de bem-estar ilimitado',
      'Planos personalizados de saude',
      'Rastreamento avancado de humor e habitos',
      'Receitas saudaveis exclusivas',
      'Chat com inteligencia artificial',
      'Relatorios semanais de progresso',
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
      'Todas as funcionalidades do plano Premium',
      'Economia de mais de 44% em relacao ao mensal',
      'Acesso antecipado a novos recursos',
      'Consultorias mensais de bem-estar',
      'Conteudos exclusivos para assinantes anuais',
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
