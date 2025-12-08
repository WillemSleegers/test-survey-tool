"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

export type NavigationPosition = 'left' | 'right'

interface NavigationContextType {
  isVisible: boolean
  setIsVisible: (visible: boolean) => void
  position: NavigationPosition
  setPosition: (position: NavigationPosition) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisibleState] = useState<boolean>(true)
  const [position, setPositionState] = useState<NavigationPosition>('left')

  // Load navigation preferences from localStorage on mount
  useEffect(() => {
    const savedVisible = localStorage.getItem('survey-nav-visible')
    const savedPosition = localStorage.getItem('survey-nav-position') as NavigationPosition

    if (savedVisible !== null) {
      setIsVisibleState(savedVisible === 'true')
    }
    if (savedPosition && (savedPosition === 'left' || savedPosition === 'right')) {
      setPositionState(savedPosition)
    }
  }, [])

  // Save navigation visibility to localStorage when changed
  const setIsVisible = (visible: boolean) => {
    setIsVisibleState(visible)
    localStorage.setItem('survey-nav-visible', String(visible))
  }

  // Save navigation position to localStorage when changed
  const setPosition = (newPosition: NavigationPosition) => {
    setPositionState(newPosition)
    localStorage.setItem('survey-nav-position', newPosition)
  }

  return (
    <NavigationContext.Provider value={{ isVisible, setIsVisible, position, setPosition }}>
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
