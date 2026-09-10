import { useState, useEffect } from "react"
import { Page } from "@/lib/types"

/**
 * Keep a requested page index inside the range of currently visible pages.
 *
 * The requested index is kept as-is rather than overwritten, so a respondent
 * whose answers temporarily hide the page they were on returns to it once
 * those pages become reachable again.
 */
export const clampPageIndex = (
  requestedPageIndex: number,
  totalVisiblePages: number
): number =>
  Math.min(Math.max(0, requestedPageIndex), Math.max(0, totalVisiblePages - 1))

/**
 * Hook for managing questionnaire navigation state and actions
 *
 * Handles:
 * - Current page tracking with bounds checking
 * - Navigation actions (next/previous)
 * - Tracking which pages the respondent has reached
 * - Auto-scroll on page changes
 * - Focus management for navigation buttons
 *
 * @param visiblePages - Pages the respondent can currently reach
 * @param disableAutoScroll - Disable auto-scroll to top on page change
 * @returns Navigation state and actions
 */
export function useQuestionnaireNavigation(visiblePages: Page[], disableAutoScroll = false) {
  const totalVisiblePages = visiblePages.length
  const [requestedPageIndex, setRequestedPageIndex] = useState<number>(0)
  const [visitedPageIds, setVisitedPageIds] = useState<Set<number>>(new Set())

  // Clamp during render rather than correcting afterwards in an effect, so an
  // out-of-range index is never rendered when pages become hidden
  const currentVisiblePageIndex = clampPageIndex(requestedPageIndex, totalVisiblePages)

  // The page being shown counts as visited even when the respondent arrived by
  // having later pages hidden rather than by navigating
  const currentPage = visiblePages[currentVisiblePageIndex]
  const visitedPages = currentPage
    ? new Set(visitedPageIds).add(currentPage.id)
    : visitedPageIds

  // Scroll to top when page changes (unless disabled)
  useEffect(() => {
    if (!disableAutoScroll) {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }, [currentVisiblePageIndex, disableAutoScroll])

  /**
   * Move to a page, recording it as visited and dropping focus from the
   * control that triggered the navigation.
   *
   * The page being left is recorded too, since the respondent reaches the
   * first page (and any page arrived at by clamping) without navigating.
   */
  const goToPage = (pageIndex: number): void => {
    setRequestedPageIndex(pageIndex)

    const destination = visiblePages[pageIndex]
    setVisitedPageIds((previous) => {
      const updated = new Set(previous)
      if (currentPage) updated.add(currentPage.id)
      if (destination) updated.add(destination.id)
      return updated.size === previous.size ? previous : updated
    })

    setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    }, 0)
  }

  /**
   * Navigate to next page
   */
  const nextPage = (): void => {
    if (currentVisiblePageIndex < totalVisiblePages - 1) {
      goToPage(currentVisiblePageIndex + 1)
    }
  }

  /**
   * Navigate to previous page
   */
  const prevPage = (): void => {
    if (currentVisiblePageIndex > 0) {
      goToPage(currentVisiblePageIndex - 1)
    }
  }

  /**
   * Jump directly to a specific page by index
   */
  const jumpToPage = (pageIndex: number): void => {
    if (pageIndex >= 0 && pageIndex < totalVisiblePages) {
      goToPage(pageIndex)
    }
  }

  return {
    currentVisiblePageIndex,
    visitedPages,
    nextPage,
    prevPage,
    jumpToPage,
    isFirstPage: currentVisiblePageIndex === 0,
    isLastPage: currentVisiblePageIndex === totalVisiblePages - 1,
  }
}
