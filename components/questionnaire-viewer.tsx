"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { SectionContent } from "@/components/section-content"
import { useLanguage } from "@/contexts/language-context"

import { useQuestionnaireNavigation } from "@/hooks/use-questionnaire-navigation"
import { useVisibleSections } from "@/hooks/use-visible-sections"
import { useQuestionnaireResponses } from "@/hooks/use-questionnaire-responses"
import { useSectionCompletion } from "@/hooks/use-section-completion"
import { SectionHeader } from "@/components/questionnaire/section-header"
import { NavigationButtons } from "@/components/questionnaire/navigation-buttons"
import { CompletionDialog } from "@/components/questionnaire/completion-dialog"
import { SectionNavigator } from "@/components/questionnaire/section-navigator"
import { calculateTotalTabInputs } from "@/lib/utils/tab-index-calculator"

import { Section } from "@/lib/types"

interface QuestionnaireViewerProps {
  questionnaire: Section[]
}

export function QuestionnaireViewer({
  questionnaire,
}: QuestionnaireViewerProps) {
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const { t } = useLanguage()

  // Response management - initialize first
  const { responses, handleResponse } = useQuestionnaireResponses(questionnaire)
  
  // Get visible sections and content filtering based on current responses
  const { visibleSections, getVisibleSectionContent, getComputedVariables } = useVisibleSections(questionnaire, responses)
  
  // Navigation state and actions
  const {
    currentVisibleSectionIndex,
    nextSection,
    prevSection,
    jumpToSection,
  } = useQuestionnaireNavigation(visibleSections.length)

  // Get current section and its content
  const currentSection = visibleSections[currentVisibleSectionIndex]
  const sectionContent = currentSection ? getVisibleSectionContent(currentSection) : null
  const currentSectionComputedVars = currentSection ? getComputedVariables(currentSection) : undefined
  
  // Check completion status
  const allQuestionsAnswered = useSectionCompletion(sectionContent, responses)

  const handleComplete = (): void => {
    setShowCompletionDialog(true)
  }

  if (!questionnaire || questionnaire.length === 0) {
    return null
  }

  if (visibleSections.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              {t('errors.noSections')}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Safety check - if no current section, don't render anything
  if (!currentSection || !sectionContent) {
    return null
  }
  
  // Calculate total number of input elements for tab indexing
  const totalInputs = calculateTotalTabInputs(sectionContent, responses)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardContent className="space-y-6">
          <SectionHeader 
            section={currentSection} 
            responses={responses} 
            computedVariables={currentSectionComputedVars}
          />
          
          <SectionContent
            content={sectionContent}
            responses={responses}
            onResponse={handleResponse}
            computedVariables={currentSectionComputedVars}
          />

          <NavigationButtons
            currentSectionIndex={currentVisibleSectionIndex}
            totalSections={visibleSections.length}
            allQuestionsAnswered={allQuestionsAnswered}
            totalInputs={totalInputs}
            onPrevious={prevSection}
            onNext={nextSection}
            onComplete={handleComplete}
          />
        </CardContent>
      </Card>

      <SectionNavigator
        questionnaire={questionnaire}
        visibleSections={visibleSections}
        currentVisibleSectionIndex={currentVisibleSectionIndex}
        responses={responses}
        getComputedVariables={getComputedVariables}
        onJumpToSection={jumpToSection}
      />

      <CompletionDialog
        isOpen={showCompletionDialog}
        onOpenChange={setShowCompletionDialog}
      />
    </div>
  )
}
