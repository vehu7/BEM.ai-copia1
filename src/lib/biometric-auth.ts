// ── Biometric Auth (WebAuthn platform authenticator) ─────────────────────────
// Usa o autenticador nativo do dispositivo (Face ID, Touch ID, Windows Hello)
// sem armazenar nenhum dado biométrico — o SO faz o reconhecimento.

const BIOMETRIC_CRED_KEY    = 'bemai_biometric_cred'
const BIOMETRIC_SESSION_KEY = 'bemai_biometric_session'

// ── Disponibilidade ───────────────────────────────────────────────────────────
// Considera disponível se o browser suporta WebAuthn, independente do resultado
// de isUserVerifyingPlatformAuthenticatorAvailable — esse método retorna false
// em alguns PWAs/browsers mesmo com Face ID/fingerprint disponíveis.

export async function checkBiometricAvailability(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false

  // Tenta a verificação específica de plataforma; se não existir, usa fallback.
  const fn = (window.PublicKeyCredential as any).isUserVerifyingPlatformAuthenticatorAvailable
  if (typeof fn === 'function') {
    try {
      const available = await fn.call(window.PublicKeyCredential)
      if (available) return true
    } catch {
      // ignora e cai no fallback
    }
  }

  // Fallback: se o browser suporta WebAuthn em geral, mostra a opção e deixa
  // o próprio sistema operacional decidir se consegue autenticar.
  return true
}

// ── Registro (primeira ativação) ──────────────────────────────────────────────

export async function registerBiometric(
  userId: string,
  email: string,
  displayName: string,
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32))

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Bem.AI', id: window.location.hostname },
        user: {
          id: new TextEncoder().encode(userId),
          name: email,
          displayName,
        },
        pubKeyCredParams: [
          { alg: -7,   type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'preferred',
          requireResidentKey: false,
        },
        timeout: 60000,
      },
    }) as PublicKeyCredential | null

    if (!credential) return { ok: false, error: 'Nenhuma credencial retornada' }

    localStorage.setItem(BIOMETRIC_CRED_KEY, JSON.stringify({
      credentialId: Array.from(new Uint8Array(credential.rawId)),
      userId,
      email,
    }))

    return { ok: true, error: null }
  } catch (e: any) {
    // NotAllowedError  → usuário cancelou ou tempo esgotado
    // NotSupportedError → dispositivo não suporta autenticador de plataforma
    // InvalidStateError → credencial já existe para este usuário
    const name: string = e?.name ?? ''
    if (name === 'NotAllowedError') return { ok: false, error: 'Cancelado pelo usuário ou tempo esgotado' }
    if (name === 'NotSupportedError') return { ok: false, error: 'Seu dispositivo não suporta biometria via web' }
    if (name === 'InvalidStateError') return { ok: false, error: 'Biometria já registrada para esta conta' }
    return { ok: false, error: e?.message ?? 'Erro ao registrar biometria' }
  }
}

// ── Autenticação ──────────────────────────────────────────────────────────────

export async function authenticateWithBiometric(): Promise<{ ok: boolean; error: string | null }> {
  const stored = localStorage.getItem(BIOMETRIC_CRED_KEY)
  if (!stored) return { ok: false, error: 'Nenhuma biometria cadastrada' }

  const { credentialId } = JSON.parse(stored) as { credentialId: number[] }
  const challenge = crypto.getRandomValues(new Uint8Array(32))

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{
          id: new Uint8Array(credentialId),
          type: 'public-key',
        }],
        userVerification: 'preferred',
        timeout: 60000,
      },
    })
    if (!assertion) return { ok: false, error: 'Autenticação cancelada' }
    return { ok: true, error: null }
  } catch (e: any) {
    const name: string = e?.name ?? ''
    if (name === 'NotAllowedError') return { ok: false, error: 'Cancelado ou tempo esgotado' }
    return { ok: false, error: e?.message ?? 'Falha na autenticação biométrica' }
  }
}

// ── Sessão (refresh token guardado para restaurar login) ──────────────────────

export function saveBiometricSession(refreshToken: string): void {
  localStorage.setItem(BIOMETRIC_SESSION_KEY, refreshToken)
}

export function getBiometricSession(): string | null {
  return localStorage.getItem(BIOMETRIC_SESSION_KEY)
}

// ── Estado ────────────────────────────────────────────────────────────────────

export function isBiometricEnabled(): boolean {
  return (
    localStorage.getItem(BIOMETRIC_CRED_KEY) !== null &&
    localStorage.getItem(BIOMETRIC_SESSION_KEY) !== null
  )
}

export function clearBiometricData(): void {
  localStorage.removeItem(BIOMETRIC_CRED_KEY)
  localStorage.removeItem(BIOMETRIC_SESSION_KEY)
}

export function getBiometricEmail(): string | null {
  const stored = localStorage.getItem(BIOMETRIC_CRED_KEY)
  if (!stored) return null
  try { return (JSON.parse(stored) as { email: string }).email } catch { return null }
}
