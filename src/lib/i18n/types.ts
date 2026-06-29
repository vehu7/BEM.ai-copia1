export type Language = 'pt-BR' | 'en' | 'fr' | 'es'

export interface LanguageOption {
  value: Language
  label: string
  flag: string
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { value: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
]

export const DEFAULT_LANGUAGE: Language = 'pt-BR'
