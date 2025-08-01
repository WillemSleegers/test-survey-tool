import React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"

interface NavigationButtonsProps {
  /** Current section index */
  currentSectionIndex: number
  /** Total number of sections */
  totalSections: number
  /** Whether all questions in current section are answered */
  allQuestionsAnswered: boolean
  /** Total tab-accessible inputs for tab index calculation */
  totalInputs: number
  /** Navigate to previous section */
  onPrevious: () => void
  /** Navigate to next section */
  onNext: () => void
  /** Handle completion */
  onComplete: () => void
}

/**
 * Navigation buttons for questionnaire sections
 * 
 * Features:
 * - Previous/Next navigation with proper disabled states
 * - Complete button on final section
 * - Proper tab indexing relative to form inputs
 * - Internationalized button text
 * - Focus management for accessibility
 */
export function NavigationButtons({
  currentSectionIndex,
  totalSections,
  allQuestionsAnswered,
  totalInputs,
  onPrevious,
  onNext,
  onComplete,
}: NavigationButtonsProps) {
  const { t } = useLanguage()
  const isFirstSection = currentSectionIndex === 0
  const isLastSection = currentSectionIndex === totalSections - 1

  return (
    <div className="flex justify-between pt-6">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstSection}
        className="flex items-center gap-2"
        tabIndex={allQuestionsAnswered ? -1 : totalInputs + 1}
      >
        <ChevronLeft className="h-4 w-4" />
        {t('navigation.previous')}
      </Button>

      {isLastSection ? (
        <Button
          onClick={onComplete}
          className="flex items-center gap-2 bg-primary hover:bg-primary/75"
          tabIndex={totalInputs + 2}
        >
          {t('navigation.complete')}
        </Button>
      ) : (
        <Button 
          onClick={onNext} 
          className="flex items-center gap-2"
          tabIndex={totalInputs + 2}
        >
          {t('navigation.next')}
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}