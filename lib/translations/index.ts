import { en } from './en'
import { nl } from './nl'

export const translations = {
  en,
  nl,
} as const

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof en

// Type-safe function to get nested translation values
export function getTranslation(
  language: Language,
  key: keyof typeof en
): Record<string, unknown> {
  return translations[language][key]
}

// Helper function to get a specific nested translation
export function t(language: Language, path: string): string {
  const keys = path.split('.')
  let value: unknown = translations[language]
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key]
    } else {
      return path
    }
  }
  
  return typeof value === 'string' ? value : path
}