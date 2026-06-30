import { useEffect, useState } from 'react'
import { X, Share, MoreVertical, PlusSquare, Download } from 'lucide-react'

type Platform = 'ios' | 'android' | null

function detectPlatform(): Platform {
  const ua = navigator.userAgent

  // Já está instalado como PWA
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)

  if (isStandalone) return null

  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return null
}

const STORAGE_KEY = 'pwa-prompt-dismissed'
// Em vez de sumir para sempre, o aviso reaparece após este prazo.
const DISMISS_MS = 30 * 24 * 60 * 60 * 1000 // 30 dias

export function PwaInstallPrompt() {
  const [platform, setPlatform] = useState<Platform>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Guardamos um timestamp de "esconder até". Valores antigos ('1' = permanente)
    // viram 1 → no passado → o aviso volta a aparecer (era o comportamento desejado).
    const dismissedUntil = Number(localStorage.getItem(STORAGE_KEY))
    if (dismissedUntil && Date.now() < dismissedUntil) return

    const p = detectPlatform()
    if (p) {
      setPlatform(p)
      // pequeno delay para não aparecer junto com a animação de login
      const t = setTimeout(() => setVisible(true), 1200)
      return () => clearTimeout(t)
    }
  }, [])

  const dismiss = (permanent: boolean) => {
    setVisible(false)
    if (permanent) localStorage.setItem(STORAGE_KEY, String(Date.now() + DISMISS_MS))
  }

  if (!visible || !platform) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 sm:items-center">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => dismiss(false)}
      />

      {/* card */}
      <div className="relative w-full max-w-sm rounded-2xl p-6 shadow-xl bg-card">
        {/* fechar */}
        <button
          onClick={() => dismiss(false)}
          className="absolute top-3 right-3 p-1 rounded-full text-primary/50 hover:text-primary"
        >
          <X className="w-5 h-5" />
        </button>

        {/* header */}
        <div className="flex items-center gap-3 mb-4">
          <img
            src="/mascots/koala-zen.webp"
            alt="BEM.ai"
            className="w-12 h-12 object-contain"
          />
          <div>
            <h2 className="text-base font-black text-primary">
              Instale o BEM.ai!
            </h2>
            <p className="text-xs text-muted-foreground">
              Acesso rápido direto da sua tela inicial
            </p>
          </div>
        </div>

        <div className="w-full h-px mb-4 bg-primary/15" />

        {platform === 'ios' && <IosSteps />}
        {platform === 'android' && <AndroidSteps />}

        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={() => dismiss(true)}
            className="w-full h-11 rounded-full font-bold bg-primary text-primary-foreground text-sm"
          >
            Entendido!
          </button>
          <button
            onClick={() => dismiss(true)}
            className="text-xs text-center text-muted-foreground"
          >
            Não mostrar novamente
          </button>
        </div>
      </div>
    </div>
  )
}

function Step({ number, icon, children }: { number: number; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black bg-primary text-primary-foreground">
        {number}
      </div>
      <div className="flex-1 text-sm text-primary">
        <div className="flex items-center gap-1.5 flex-wrap">
          {icon}
          {children}
        </div>
      </div>
    </div>
  )
}

function IosSteps() {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide mb-3 text-muted-foreground">
        Safari no iPhone / iPad
      </p>
      <Step number={1} icon={<Share className="w-4 h-4 flex-shrink-0" />}>
        Toque no botão <strong>Compartilhar</strong> na barra inferior do Safari
      </Step>
      <Step number={2} icon={<PlusSquare className="w-4 h-4 flex-shrink-0" />}>
        Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>
      </Step>
      <Step number={3} icon={<span className="text-base">✅</span>}>
        Confirme tocando em <strong>Adicionar</strong> no canto superior direito
      </Step>
    </div>
  )
}

function AndroidSteps() {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide mb-3 text-muted-foreground">
        Chrome no Android
      </p>
      <Step number={1} icon={<MoreVertical className="w-4 h-4 flex-shrink-0" />}>
        Toque no menu <strong>(⋮)</strong> no canto superior direito do Chrome
      </Step>
      <Step number={2} icon={<Download className="w-4 h-4 flex-shrink-0" />}>
        Selecione <strong>"Instalar aplicativo"</strong> ou{' '}
        <strong>"Adicionar à tela inicial"</strong>
      </Step>
      <Step number={3} icon={<span className="text-base">✅</span>}>
        Toque em <strong>Instalar</strong> para confirmar
      </Step>
    </div>
  )
}

/** Instruções de instalação (Android + iOS) reutilizáveis fora do popup — ex.: tela de Configurações. */
export function PwaInstallInstructions() {
  return (
    <div className="space-y-6">
      <AndroidSteps />
      <IosSteps />
    </div>
  )
}
