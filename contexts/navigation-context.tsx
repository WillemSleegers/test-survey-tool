"use client"

import React, { createContext, useContext } from 'react'
import { useStoredFlag, useStoredValue, writeStoredValue } from '@/hooks/use-local-storage'

type NavigationPosition = 'left' | 'right'

interface NavigationContextType {
  isVisible: boolean
  setIsVisible: (visible: boolean) => void
  position: NavigationPosition
  setPosition: (position: NavigationPosition) => void
  allowUnvisitedNavigation: boolean
  setAllowUnvisitedNavigation: (allow: boolean) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

const VISIBLE_KEY = 'survey-nav-visible'
const POSITION_KEY = 'survey-nav-position'
const ALLOW_UNVISITED_KEY = 'survey-nav-allow-unvisited'

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const isVisible = useStoredFlag(VISIBLE_KEY, true)
  const allowUnvisitedNavigation = useStoredFlag(ALLOW_UNVISITED_KEY, false)
  const storedPosition = useStoredValue(POSITION_KEY)
  const position: NavigationPosition = storedPosition === 'right' ? 'right' : 'left'

  const setIsVisible = (visible: boolean) => {
    writeStoredValue(VISIBLE_KEY, String(visible))
  }

  const setPosition = (newPosition: NavigationPosition) => {
    writeStoredValue(POSITION_KEY, newPosition)
  }

  const setAllowUnvisitedNavigation = (allow: boolean) => {
    writeStoredValue(ALLOW_UNVISITED_KEY, String(allow))
  }

  return (
    <NavigationContext.Provider value={{ isVisible, setIsVisible, position, setPosition, allowUnvisitedNavigation, setAllowUnvisitedNavigation }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}
