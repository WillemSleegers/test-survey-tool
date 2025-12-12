"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { Block, NavItem } from "@/lib/types"

interface SurveyData {
  blocks: Block[]
  navItems: NavItem[]
}

interface SurveyContextType {
  surveyData: SurveyData | null
  setSurveyData: (data: SurveyData | null) => void
}

const SurveyContext = createContext<SurveyContextType | undefined>(undefined)

export function SurveyProvider({ children }: { children: ReactNode }) {
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null)

  return (
    <SurveyContext.Provider value={{ surveyData, setSurveyData }}>
      {children}
    </SurveyContext.Provider>
  )
}

export function useSurvey() {
  const context = useContext(SurveyContext)
  if (context === undefined) {
    throw new Error("useSurvey must be used within a SurveyProvider")
  }
  return context
}
