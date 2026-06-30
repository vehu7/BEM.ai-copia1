import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// O Guru envia 2 tipos de webhook com estruturas diferentes:
// 1) `transaction`  — quando uma cobrança rola (compra, reembolso, falha de cartão).
//    Status relevante em `body.status` ('approved', 'refunded', 'refused', 'pending').
//    Detalhes da assinatura aninhados em `body.subscription`.
// 2) `subscription` — quando o status da assinatura muda (cancelada, expirada).
//    Status relevante em `body.last_status`.
//
// Esta função normaliza ambos para um formato interno único antes de processar.

interface GuruPayload {
  api_token?: string
  webhook_type?: string
  // transaction
  id?: string
  status?: string
  contact?: { email?: string | null; name?: string | null }
  subscription?: {
    id?: string
    last_status?: string
    started_at?: string | null
    canceled_at?: string | null
    charged_every_days?: number
  }
  invoice?: {
    cycle?: number
    period_start?: string | null
    period_end?: string | null
    charge_at?: string | null
    status?: string
  }
  payment?: { method?: string | null }
  // subscription (formato legado/alternativo)
  last_status?: string
  subscriber?: { email?: string | null; name?: string | null }
  dates?: {
    cycle_start_date?: string | null
    cycle_end_date?: string | null
    next_cycle_at?: string | null
  }
  current_invoice?: { cycle?: number }
  payment_method?: string | null
  // comum aos dois
  product?: {
    offer?: { id?: string; name?: string }
  }
}

interface NormalizedWebhook {
  guruSubId: string
  rawStatus: string
  email: string | null
  name: string | null
  offerId: string
  cycle: number
  cycleStart: string | null
  cycleEnd: string | null
  nextCycleAt: string | null
  paymentMethod: string | null
}

function normalize(body: GuruPayload): NormalizedWebhook {
  // ID da assinatura — preferir subscription.id (estável entre eventos), fallback pro id raiz
  const guruSubId = body.subscription?.id ?? body.id ?? ''

  // Status — em transaction usamos subscription.last_status (mais confiável que status da transação),
  // depois body.last_status (formato subscription), depois body.status (último fallback)
  const rawStatus =
    body.subscription?.last_status ??
    body.last_status ??
    body.status ??
    'inactive'

  const email = body.contact?.email ?? body.subscriber?.email ?? null
  const name = body.contact?.name ?? body.subscriber?.name ?? null
  const offerId = body.product?.offer?.id ?? ''

  const cycle = body.invoice?.cycle ?? body.current_invoice?.cycle ?? 0
  const cycleStart = body.invoice?.period_start ?? body.dates?.cycle_start_date ?? null
  const cycleEnd = body.invoice?.period_end ?? body.dates?.cycle_end_date ?? null
  const nextCycleAt = body.invoice?.charge_at ?? body.dates?.next_cycle_at ?? null

  const paymentMethod = body.payment?.method ?? body.payment_method ?? null

  return {
    guruSubId,
    rawStatus,
    email,
    name,
    offerId,
    cycle,
    cycleStart,
    cycleEnd,
    nextCycleAt,
    paymentMethod,
  }
}

// Mapeia o status do Guru para o status interno usado em guru_subscriptions.
function mapGuruStatus(status: string): string {
  const map: Record<string, string> = {
    // assinatura
    active: 'active',
    started: 'inactive',
    pastdue: 'overdue',
    inactive: 'inactive',
    canceled: 'cancelled',
    cancelled: 'cancelled',
    expired: 'expired',
    trial: 'trial',
    // transação (caso subscription.last_status não esteja disponível)
    approved: 'active',
    refunded: 'cancelled',
    refused: 'inactive',
    pending: 'inactive',
  }
  return map[status.toLowerCase()] || 'inactive'
}

// Mapeia o Offer ID do Guru para o plano interno do app.
// Esses IDs vêm do painel Digital Manager Guru (aba Ofertas do produto BEM.ai Premium).
const OFFER_ID_TO_PLAN: Record<string, 'premium' | 'premium_anual'> = {
  'a1a58ba9-4276-44c1-aa3a-2c797dd03399': 'premium',        // BEM.ai Premium Mensal — R$29,90/mês
  'a1a58c01-d60b-41c8-950c-b833fe9b2873': 'premium_anual',  // BEM.ai Premium Anual — R$199,90/ano
}

function mapOfferIdToPlan(offerId: string): 'free' | 'premium' | 'premium_anual' {
  return OFFER_ID_TO_PLAN[offerId] ?? 'premium'
}

// Status que liberam acesso premium no app. Os demais (cancelled, expired, overdue, inactive)
// caem o usuário pra 'free' e a tela de trial-expired/paywall reaparece.
const PREMIUM_ACCESS_STATUSES = new Set(['active', 'trial'])

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const guruApiToken = Deno.env.get('GURU_API_TOKEN')

  if (!guruApiToken) {
    return new Response(JSON.stringify({ error: 'GURU_API_TOKEN not configured' }), { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const body: GuruPayload = await req.json()

    // Validate token (do body, não do header — o Guru não envia auth header)
    if (!body.api_token || body.api_token !== guruApiToken) {
      return new Response(JSON.stringify({ error: 'Invalid api_token' }), { status: 401 })
    }

    const webhookType = body.webhook_type || 'unknown'
    const n = normalize(body)
    const internalStatus = mapGuruStatus(n.rawStatus)

    if (!n.guruSubId) {
      console.error('[Guru Webhook] Payload sem subscription/id:', body)
      return new Response(JSON.stringify({ status: 'no_subscription_id' }), { status: 200 })
    }

    // Idempotency check — usa guruSubId + rawStatus como chave
    const { data: existing } = await supabase
      .from('guru_webhook_logs')
      .select('id')
      .eq('guru_id', n.guruSubId)
      .eq('status_received', n.rawStatus)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({ status: 'already_processed' }), { status: 200 })
    }

    // Resolve user
    let userId: string | null = null

    // 1. Check existing subscription by guru_subscription_id
    const { data: existingSub } = await supabase
      .from('guru_subscriptions')
      .select('user_id')
      .eq('guru_subscription_id', n.guruSubId)
      .maybeSingle()

    if (existingSub) {
      userId = existingSub.user_id
    }

    // 2. Try by email in auth.users
    if (!userId && n.email) {
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const found = users.find(u => u.email?.toLowerCase() === n.email!.toLowerCase())
      if (found) userId = found.id
    }

    // 3. Create user if not found (somente quando vai ativar premium — refund/cancel sem user é no-op)
    if (!userId && n.email && PREMIUM_ACCESS_STATUSES.has(internalStatus)) {
      const { data: newUser, error } = await supabase.auth.admin.createUser({
        email: n.email,
        email_confirm: true,
        user_metadata: { name: n.name || '' },
      })
      if (newUser?.user) {
        userId = newUser.user.id
        console.log(`[Guru Webhook] User created: ${n.email} -> ${userId}`)
      } else {
        console.error('[Guru Webhook] Failed to create user:', error)
      }
    }

    if (!userId) {
      await supabase.from('guru_webhook_logs').insert({
        webhook_type: webhookType,
        guru_id: n.guruSubId,
        status_received: n.rawStatus,
        raw_payload: body,
      })
      return new Response(
        JSON.stringify({ status: 'user_not_found', email: n.email }),
        { status: 200 }
      )
    }

    // Upsert subscription
    const { data: existingUserSub } = await supabase
      .from('guru_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    const planId = mapOfferIdToPlan(n.offerId)

    const subData = {
      user_id: userId,
      guru_subscription_id: n.guruSubId,
      guru_product_id: n.offerId,
      plan_id: planId,
      status: internalStatus,
      subscriber_email: n.email,
      subscriber_name: n.name,
      current_cycle: n.cycle,
      cycle_start_date: n.cycleStart,
      cycle_end_date: n.cycleEnd,
      next_cycle_at: n.nextCycleAt,
      payment_method: n.paymentMethod,
      updated_at: new Date().toISOString(),
    }

    if (existingUserSub) {
      await supabase.from('guru_subscriptions').update(subData).eq('user_id', userId)
    } else {
      await supabase.from('guru_subscriptions').insert(subData)
    }

    // Sincroniza profiles.plan — fonte da verdade do gating de features no app
    // (src/lib/subscription.ts lê user.plan, não guru_subscriptions).
    const profilePlan = PREMIUM_ACCESS_STATUSES.has(internalStatus) ? planId : 'free'
    const profileUpdate: Record<string, unknown> = { plan: profilePlan }
    if (n.email) profileUpdate.subscription_email = n.email

    const { error: profileErr } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userId)

    if (profileErr) {
      console.error('[Guru Webhook] Falha ao atualizar profiles.plan:', profileErr)
    }

    // Log webhook
    await supabase.from('guru_webhook_logs').insert({
      webhook_type: webhookType,
      guru_id: n.guruSubId,
      status_received: n.rawStatus,
      raw_payload: body,
      processed_at: new Date().toISOString(),
    })

    return new Response(
      JSON.stringify({
        status: 'processed',
        userId,
        plan: planId,
        profilePlan,
        subscriptionStatus: internalStatus,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[Guru Webhook] Error:', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
  }
})
