import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { getTranslations, DEFAULT_LANGUAGE, type Language, type TranslationKeys } from '@/lib/i18n'

const STORAGE_KEY = 'bemai_language'
/**
 * Flag booleana: sinaliza que o usuário trocou o idioma MANUALMENTE (em Settings).
 * Enquanto essa flag não existir, o app segue sempre o idioma do navegador/SO,
 * mesmo que haja algum valor salvo em `bemai_language` de sessão anterior.
 *
 * Isso corrige o cenário: usuário abre o app em pt-BR, app salva 'pt-BR' no
 * localStorage, depois muda o idioma do celular para inglês — agora o app
 * deve passar a mostrar em inglês automaticamente, e não continuar em pt-BR.
 */
const MANUAL_KEY = 'bemai_language_manual'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: TranslationKeys
}

const LanguageContext = createContext<LanguageContextType | null>(null)

/**
 * Mapeia `navigator.language` / `navigator.languages` (ex: "pt-BR", "en-US",
 * "es-MX", "fr-CA") para um dos 4 idiomas suportados. Fallback: inglês.
 *
 * Usa `navigator.languages` (array ordenado de preferências) além de
 * `navigator.language` para cobrir casos onde o primeiro idioma não é suportado
 * mas o segundo sim.
 */
function detectBrowserLanguage(): Language {
  try {
    const candidates: string[] = []
    if (Array.isArray(navigator.languages)) {
      for (const l of navigator.languages) if (typeof l === 'string') candidates.push(l)
    }
    if (typeof navigator.language === 'string') candidates.push(navigator.language)

    for (const raw of candidates) {
      const lower = raw.toLowerCase()
      if (lower.startsWith('pt')) return 'pt-BR'
      if (lower.startsWith('es')) return 'es'
      if (lower.startsWith('fr')) return 'fr'
      if (lower.startsWith('en')) return 'en'
    }
  } catch { /* ignora */ }
  return DEFAULT_LANGUAGE
}

/**
 * Regra de resolução de idioma:
 * 1. Se o usuário escolheu manualmente em Settings (`MANUAL_KEY=1`),
 *    respeita o valor salvo em `bemai_language`.
 * 2. Caso contrário, SEMPRE detecta do navegador/SO a cada carga.
 *    Isso garante que mudar o idioma no celular reflita no app imediatamente.
 */
function resolveLanguage(): Language {
  try {
    const manual = localStorage.getItem(MANUAL_KEY) === '1'
    if (manual) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'pt-BR' || saved === 'en' || saved === 'fr' || saved === 'es') return saved
    }
  } catch { /* ignora */ }
  return detectBrowserLanguage()
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(resolveLanguage)

  // Persiste o idioma detectado/escolhido em localStorage para consumo de outras
  // partes do app (ex: prompts de IA que usam user.language).
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, language) } catch {}
  }, [language])

  /** Chamado quando usuário troca manualmente em Settings. Marca a flag. */
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    try {
      localStorage.setItem(STORAGE_KEY, lang)
      localStorage.setItem(MANUAL_KEY, '1')
    } catch { /* ignora */ }
  }

  // Re-resolve o idioma quando a aba volta ao foco (usuário pode ter mudado o
  // idioma do SO entre uma abertura e outra sem recarregar a página).
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const next = resolveLanguage()
        setLanguageState(prev => (prev === next ? prev : next))
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  // Sincroniza entre abas: se outra aba troca o idioma, esta recebe o evento.
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const val = e.newValue as Language
        if (val === 'pt-BR' || val === 'en' || val === 'fr' || val === 'es') {
          setLanguageState(val)
        }
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const t = getTranslations(language)

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useTranslation must be used within LanguageProvider')
  return ctx
}
