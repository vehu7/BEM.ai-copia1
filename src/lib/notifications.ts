/**
 * Sistema de notificacoes do BEM.ai.
 * - Registra Service Worker
 * - Pede permissao de notificacao
 * - Envia lembretes esporadicos enquanto o app esta aberto
 * - Salva subscription para push via Supabase Edge Function
 */

import { supabase } from '@/lib/supabase'

// ── Mensagens esporadicas ────────────────────────────────────────────────────

const MESSAGES = {
  water: [
    { title: 'Hora da agua!', body: 'Nao esqueca de beber agua. Seu corpo agradece!' },
    { title: 'Hidrate-se!', body: 'Ja bebeu agua hoje? Mantenha-se hidratado(a).' },
    { title: 'Lembrete de agua', body: 'Uma pausa para um copo de agua faz toda a diferenca.' },
  ],
  meals: [
    { title: 'Registre suas refeicoes', body: 'Registrar o que voce come ajuda a manter o foco nos seus objetivos.' },
    { title: 'Como foi sua refeicao?', body: 'Lembre-se de anotar o que comeu para acompanhar seus macros.' },
  ],
  motivation: [
    { title: 'Voce esta no caminho certo!', body: 'Cada pequeno passo conta. Continue firme!' },
    { title: 'BEM esta com voce!', body: 'Lembre-se: consistencia supera perfeicao. Siga em frente!' },
    { title: 'Frase do dia', body: 'O segredo da mudanca e focar toda sua energia nao em lutar contra o velho, mas em construir o novo.' },
    { title: 'Motivacao', body: 'Nao desista! Os resultados vem com o tempo e a dedicacao.' },
  ],
  fasting: [
    { title: 'Foco no jejum!', body: 'Se esta em jejum, mantenha a hidratacao e a mente tranquila.' },
    { title: 'Jejum intermitente', body: 'Lembre-se: a janela de alimentacao e tao importante quanto o jejum.' },
  ],
  exercise: [
    { title: 'Hora de se movimentar!', body: 'A atividade fisica e essencial para o bem-estar. Que tal um treino hoje?' },
    { title: 'Nao esqueca do treino', body: 'Manter a regularidade nos exercicios faz toda a diferenca.' },
  ],
  tracking: [
    { title: 'Registre seu peso', body: 'Faz um tempo que voce nao registra seu peso. Que tal atualizar?' },
    { title: 'Acompanhe seu progresso', body: 'Registrar medidas e fotos ajuda a visualizar sua evolucao.' },
  ],
  general: [
    { title: 'A Bem esta aqui para ajudar', body: 'Precisa de algo? Abra o app e converse com a Bem!' },
    { title: 'Cuide de voce', body: 'Saude e bem-estar comecam com pequenas escolhas diarias.' },
  ],
}

type MessageCategory = keyof typeof MESSAGES

function getRandomMessage(): { title: string; body: string } {
  const categories: MessageCategory[] = Object.keys(MESSAGES) as MessageCategory[]
  const category = categories[Math.floor(Math.random() * categories.length)]
  const msgs = MESSAGES[category]
  return msgs[Math.floor(Math.random() * msgs.length)]
}

// ── Service Worker & Permissao ───────────────────────────────────────────────

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    return reg
  } catch {
    return null
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

// ── Salvar subscription no Supabase ──────────────────────────────────────────

export async function subscribeToPush(userId: string): Promise<boolean> {
  try {
    const reg = await registerServiceWorker()
    if (!reg) return false

    const granted = await requestNotificationPermission()
    if (!granted) return false

    // Tenta obter subscription existente ou criar nova
    let subscription = await reg.pushManager.getSubscription()
    if (!subscription) {
      // VAPID public key — gerar com: npx web-push generate-vapid-keys
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        // Sem VAPID key, usa apenas notificacoes locais
        return true
      }
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      })
    }

    // Salvar subscription no Supabase
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        subscription: JSON.stringify(subscription),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    return !error
  } catch {
    return false
  }
}

export async function unsubscribeFromPush(userId: string): Promise<void> {
  try {
    const reg = await navigator.serviceWorker?.ready
    if (reg) {
      const subscription = await reg.pushManager.getSubscription()
      if (subscription) await subscription.unsubscribe()
    }
    await supabase.from('push_subscriptions').delete().eq('user_id', userId)
  } catch { /* silently fail */ }
}

// ── Notificacoes locais (quando app esta aberto) ─────────────────────────────

let localTimerId: ReturnType<typeof setTimeout> | null = null

export function startLocalNotifications(): void {
  if (localTimerId) return
  scheduleNextLocalNotification()
}

export function stopLocalNotifications(): void {
  if (localTimerId) {
    clearTimeout(localTimerId)
    localTimerId = null
  }
}

function scheduleNextLocalNotification(): void {
  // Intervalo aleatorio entre 45min e 3h (nao macante)
  const minMs = 45 * 60 * 1000
  const maxMs = 180 * 60 * 1000
  const delay = minMs + Math.random() * (maxMs - minMs)

  localTimerId = setTimeout(() => {
    showLocalNotification()
    scheduleNextLocalNotification()
  }, delay)
}

function showLocalNotification(): void {
  if (Notification.permission !== 'granted') return

  // Nao notificar entre 22h e 8h
  const hour = new Date().getHours()
  if (hour >= 22 || hour < 8) return

  const msg = getRandomMessage()
  try {
    new Notification(msg.title, {
      body: msg.body,
      icon: '/favicon.ico',
      tag: 'bemai-local',
    })
  } catch { /* some browsers block new Notification() */ }
}

// ── Util ─────────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
