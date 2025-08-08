import React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"

interface NavigationButtonsProps {
  /** Current page index */
  currentPageIndex: number
  /** Total number of pages */
  totalPages: number
  /** Whether all questions in current page are answered */
  allQuestionsAnswered: boolean
  /** Total tab-accessible inputs for tab index calculation */
  totalInputs: number
  /** Navigate to previous page */
  onPrevious: () => void
  /** Navigate to next page */
  onNext: () => void
  /** Handle completion */
  onComplete: () => void
}

/**
 * Navigation buttons for questionnaire pages
 *
 * Features:
 * - Previous/Next navigation with proper disabled states
 * - Complete button on final page
 * - Proper tab indexing relative to form inputs
 * - Internationalized button text
 * - Focus management for accessibility
 */
export function NavigationButtons({
  currentPageIndex,
  totalPages,
  totalInputs,
  onPrevious,
  onNext,
  onComplete,
}: NavigationButtonsProps) {
  const { t } = useLanguage()
  const isFirstPage = currentPageIndex === 0
  const isLastPage = currentPageIndex === totalPages - 1

  return (
    <div className="flex justify-between pt-6">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstPage}
        className="flex items-center gap-2"
        tabIndex={totalInputs + 2}
      >
        <ChevronLeft className="h-4 w-4" />
        {t("navigation.previous")}
      </Button>

      {isLastPage ? (
        <Button
          onClick={onComplete}
          className="flex items-center gap-2 bg-primary hover:bg-primary/75"
          tabIndex={totalInputs + 1}
        >
          {t("navigation.complete")}
        </Button>
      ) : (
        <Button
          onClick={onNext}
          className="flex items-center gap-2"
          tabIndex={totalInputs + 1}
        >
          {t("navigation.next")}
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
