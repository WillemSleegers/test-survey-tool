import { useState, useEffect } from "react"

/**
 * Hook for managing questionnaire navigation state and actions
 * 
 * Handles:
 * - Current section tracking with bounds checking
 * - Navigation actions (next/previous)
 * - Auto-scroll on section changes
 * - Focus management for navigation buttons
 * 
 * @param totalVisibleSections - Number of visible sections
 * @returns Navigation state and actions
 */
export function useQuestionnaireNavigation(totalVisibleSections: number) {
  const [currentVisibleSectionIndex, setCurrentVisibleSectionIndex] = useState<number>(0)

  // Make sure current section index is valid when visible sections change
  useEffect(() => {
    if (currentVisibleSectionIndex >= totalVisibleSections) {
      setCurrentVisibleSectionIndex(Math.max(0, totalVisibleSections - 1))
    }
  }, [totalVisibleSections, currentVisibleSectionIndex])

  // Scroll to top when section changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentVisibleSectionIndex])

  /**
   * Navigate to next section with focus management
   */
  const nextSection = (): void => {
    if (currentVisibleSectionIndex < totalVisibleSections - 1) {
      setCurrentVisibleSectionIndex(currentVisibleSectionIndex + 1)
      // Remove focus from button after navigation
      setTimeout(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
      }, 0)
    }
  }

  /**
   * Navigate to previous section with focus management
   */
  const prevSection = (): void => {
    if (currentVisibleSectionIndex > 0) {
      setCurrentVisibleSectionIndex(currentVisibleSectionIndex - 1)
      // Remove focus from button after navigation
      setTimeout(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
      }, 0)
    }
  }

  /**
   * Jump directly to a specific section by index
   */
  const jumpToSection = (sectionIndex: number): void => {
    if (sectionIndex >= 0 && sectionIndex < totalVisibleSections) {
      setCurrentVisibleSectionIndex(sectionIndex)
      // Remove focus from any active element after navigation
      setTimeout(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
      }, 0)
    }
  }

  return {
    currentVisibleSectionIndex,
    nextSection,
    prevSection,
    jumpToSection,
    isFirstSection: currentVisibleSectionIndex === 0,
    isLastSection: currentVisibleSectionIndex === totalVisibleSections - 1,
  }
}