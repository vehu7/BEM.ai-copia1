/**
 * Supabase Edge Function: send-notifications
 *
 * Envia push notifications esporadicas para usuarios do BEM.ai.
 * Deve ser chamada via cron (ex: a cada 2h) pelo Supabase Dashboard:
 *   Cron: 0 8,10,12,14,16,18,20 * * *  (8h as 20h, a cada 2h)
 *
 * Requisitos:
 * 1. Tabela `push_subscriptions` no Supabase:
 *    CREATE TABLE push_subscriptions (
 *      user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 *      subscription TEXT NOT NULL,
 *      updated_at TIMESTAMPTZ DEFAULT now()
 *    );
 *    ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
 *    CREATE POLICY "Users manage own subscription"
 *      ON push_subscriptions FOR ALL USING (auth.uid() = user_id);
 *
 * 2. Secrets no Supabase Dashboard:
 *    - VAPID_PRIVATE_KEY (gerar com: npx web-push generate-vapid-keys)
 *    - VAPID_PUBLIC_KEY
 *    - VAPID_EMAIL (ex: mailto:contato@vivabemapp.com)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MESSAGES = [
  { title: 'Hora da agua!', body: 'Nao esqueca de beber agua. Seu corpo agradece!' },
  { title: 'Hidrate-se!', body: 'Ja bebeu agua hoje? Mantenha-se hidratado(a).' },
  { title: 'Registre suas refeicoes', body: 'Anotar o que voce come ajuda a manter o foco.' },
  { title: 'Voce esta no caminho certo!', body: 'Cada pequeno passo conta. Continue firme!' },
  { title: 'BEM esta com voce!', body: 'Consistencia supera perfeicao. Siga em frente!' },
  { title: 'Hora de se movimentar!', body: 'A atividade fisica e essencial. Que tal um treino?' },
  { title: 'Cuide de voce', body: 'Saude e bem-estar comecam com pequenas escolhas diarias.' },
  { title: 'Foco no jejum!', body: 'Se esta em jejum, mantenha a hidratacao e a mente tranquila.' },
  { title: 'Acompanhe seu progresso', body: 'Registrar medidas e fotos ajuda a ver sua evolucao.' },
  { title: 'Motivacao do dia', body: 'O segredo e focar toda energia em construir o novo.' },
  { title: 'Lembrete', body: 'BEM esta aqui para ajudar! Abra o app e converse.' },
  { title: 'Nao esqueca do treino', body: 'Regularidade nos exercicios faz toda a diferenca.' },
]

function getRandomMessage() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
}

// Web Push — envia via fetch (sem dependencia de lib)
async function sendWebPush(
  subscription: PushSubscription,
  payload: string,
  vapidEmail: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<boolean> {
  // Web Push requer a biblioteca web-push para gerar headers JWT/ECDH.
  // Em Deno (Edge Functions), usamos a API direta com crypto.
  // Para simplificar, usamos a abordagem com web-push via esm.sh.
  try {
    const webpush = await import('https://esm.sh/web-push@3.6.7')
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)
    await webpush.sendNotification(subscription, payload)
    return true
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode
    if (statusCode === 410 || statusCode === 404) {
      // Subscription expirada — sera removida
      return false
    }
    console.error('Push error:', err)
    return false
  }
}

Deno.serve(async (req) => {
  // Apenas POST ou invocacao por cron
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
  const vapidEmail = Deno.env.get('VAPID_EMAIL') || 'mailto:contato@vivabemapp.com'

  if (!vapidPublicKey || !vapidPrivateKey) {
    return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Buscar todas as subscriptions ativas
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('user_id, subscription')

  if (error || !subscriptions) {
    return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions' }), { status: 500 })
  }

  // Para cada subscription, 50% de chance de enviar (para ser esporadico)
  let sent = 0
  let failed = 0
  const expiredUserIds: string[] = []

  for (const row of subscriptions) {
    // 50% chance — torna as notificacoes esporadicas
    if (Math.random() > 0.5) continue

    try {
      const sub = JSON.parse(row.subscription)
      const msg = getRandomMessage()
      const payload = JSON.stringify({
        title: msg.title,
        body: msg.body,
        icon: '/favicon.ico',
        tag: 'bemai-push',
        url: '/',
      })

      const success = await sendWebPush(sub, payload, vapidEmail, vapidPublicKey, vapidPrivateKey)
      if (success) {
        sent++
      } else {
        expiredUserIds.push(row.user_id)
        failed++
      }
    } catch {
      failed++
    }
  }

  // Limpar subscriptions expiradas
  if (expiredUserIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('user_id', expiredUserIds)
  }

  return new Response(
    JSON.stringify({ sent, failed, expired: expiredUserIds.length, total: subscriptions.length }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
