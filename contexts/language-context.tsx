"use client"

import React, { createContext, useContext, useState } from 'react'
import { Language, translations, t } from '@/lib/translations'
import { useStoredValue, writeStoredValue } from '@/hooks/use-local-storage'

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (path: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const STORAGE_KEY = 'survey-language'

const asLanguage = (value: string | null): Language | undefined =>
  value && value in translations ? (value as Language) : undefined

export function LanguageProvider({ children, defaultLanguage }: { children: React.ReactNode, defaultLanguage?: Language }) {
  const storedLanguage = asLanguage(useStoredValue(STORAGE_KEY))
  const [chosenLanguage, setChosenLanguage] = useState<Language | undefined>(undefined)

  // An explicit choice wins, then a pinned default, then the saved preference
  const language = chosenLanguage ?? defaultLanguage ?? storedLanguage ?? 'nl'

  const setLanguage = (newLanguage: Language) => {
    setChosenLanguage(newLanguage)
    writeStoredValue(STORAGE_KEY, newLanguage)
  }

  // Translation helper function
  const translate = (path: string): string => t(language, path)

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translate }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
