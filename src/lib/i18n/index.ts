import ptBR from './pt-BR'
import en from './en'
import fr from './fr'
import es from './es'
import type { Language } from './types'
import type { TranslationKeys } from './pt-BR'
export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './types'
export type { Language } from './types'
export type { TranslationKeys } from './pt-BR'

const translations: Record<Language, TranslationKeys> = {
  'pt-BR': ptBR,
  en,
  fr,
  es,
}

export function getTranslations(language: Language): TranslationKeys {
  return translations[language] ?? translations['pt-BR']
}
