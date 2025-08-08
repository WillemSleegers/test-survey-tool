import { useState, useEffect } from "react"

/**
 * Hook for managing questionnaire navigation state and actions
 * 
 * Handles:
 * - Current page tracking with bounds checking
 * - Navigation actions (next/previous)
 * - Auto-scroll on page changes
 * - Focus management for navigation buttons
 * 
 * @param totalVisiblePages - Number of visible pages
 * @returns Navigation state and actions
 */
export function useQuestionnaireNavigation(totalVisiblePages: number) {
  const [currentVisiblePageIndex, setCurrentVisiblePageIndex] = useState<number>(0)

  // Make sure current page index is valid when visible pages change
  useEffect(() => {
    if (currentVisiblePageIndex >= totalVisiblePages) {
      setCurrentVisiblePageIndex(Math.max(0, totalVisiblePages - 1))
    }
  }, [totalVisiblePages, currentVisiblePageIndex])

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentVisiblePageIndex])

  /**
   * Navigate to next page with focus management
   */
  const nextPage = (): void => {
    if (currentVisiblePageIndex < totalVisiblePages - 1) {
      setCurrentVisiblePageIndex(currentVisiblePageIndex + 1)
      // Remove focus from button after navigation
      setTimeout(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
      }, 0)
    }
  }

  /**
   * Navigate to previous page with focus management
   */
  const prevPage = (): void => {
    if (currentVisiblePageIndex > 0) {
      setCurrentVisiblePageIndex(currentVisiblePageIndex - 1)
      // Remove focus from button after navigation
      setTimeout(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
      }, 0)
    }
  }

  /**
   * Jump directly to a specific page by index
   */
  const jumpToPage = (pageIndex: number): void => {
    if (pageIndex >= 0 && pageIndex < totalVisiblePages) {
      setCurrentVisiblePageIndex(pageIndex)
      // Remove focus from any active element after navigation
      setTimeout(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
      }, 0)
    }
  }

  return {
    currentVisiblePageIndex,
    nextPage,
    prevPage,
    jumpToPage,
    isFirstPage: currentVisiblePageIndex === 0,
    isLastPage: currentVisiblePageIndex === totalVisiblePages - 1,
  }
}