"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Language, translations, t } from '@/lib/translations'

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (path: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children, defaultLanguage }: { children: React.ReactNode, defaultLanguage?: Language }) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage ?? 'nl')

  // Load language preference from localStorage on mount (skip if defaultLanguage is provided)
  useEffect(() => {
    if (defaultLanguage) return
    const savedLanguage = localStorage.getItem('survey-language') as Language
    if (savedLanguage && translations[savedLanguage]) {
      setLanguageState(savedLanguage)
    }
  }, [defaultLanguage])

  // Save language preference to localStorage when changed
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
    localStorage.setItem('survey-language', newLanguage)
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