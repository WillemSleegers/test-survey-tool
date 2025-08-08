"use client"

import { useState, useMemo } from "react"
import { PageContent } from "@/components/page-content"
import { useLanguage } from "@/contexts/language-context"

import { useQuestionnaireNavigation } from "@/hooks/use-questionnaire-navigation"
import { useVisiblePages } from "@/hooks/use-visible-pages"
import { evaluateCondition } from "@/lib/conditions/condition-evaluator" 
import { evaluateComputedVariables } from "@/lib/conditions/computed-variables"
import { useQuestionnaireResponses } from "@/hooks/use-questionnaire-responses"
import { usePageCompletion } from "@/hooks/use-page-completion"
import { PageHeader } from "@/components/questionnaire/page-header"
import { NavigationButtons } from "@/components/questionnaire/navigation-buttons"
import { CompletionDialog } from "@/components/questionnaire/completion-dialog"
import { PageNavigator } from "@/components/questionnaire/page-navigator"
import { calculateTotalTabInputs } from "@/lib/utils/tab-index-calculator"

import { Block, Page, ComputedVariables } from "@/lib/types"

interface QuestionnaireViewerProps {
  questionnaire: Block[]
  onResetToUpload: () => void
}

export function QuestionnaireViewer({
  questionnaire,
  onResetToUpload,
}: QuestionnaireViewerProps) {
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const { t } = useLanguage()

  // Response management - get all pages first for response tracking
  const allPages = questionnaire.flatMap(block => block.pages)
  const { responses, handleResponse } = useQuestionnaireResponses(allPages)
  
  // Filter blocks by visibility, then flatten to pages
  const { visibleBlockPages, allBlockComputedVariables } = useMemo(() => {
    const visiblePages: Page[] = []
    const blockComputedVars: ComputedVariables = {}
    
    questionnaire.forEach(block => {
      // Evaluate block-level visibility  
      const mockPage: Page = {
        title: "",
        content: "",
        questions: [],
        sections: [],
        computedVariables: block.computedVariables
      }
      const currentBlockComputedVars = evaluateComputedVariables(mockPage, responses)
      
      const blockVisible = evaluateCondition(
        block.showIf || "",
        responses,
        currentBlockComputedVars
      )
      
      if (blockVisible) {
        // If block is visible, add all its pages and collect its computed variables
        visiblePages.push(...block.pages)
        Object.assign(blockComputedVars, currentBlockComputedVars)
      }
    })
    
    return { visibleBlockPages: visiblePages, allBlockComputedVariables: blockComputedVars }
  }, [questionnaire, responses])
  
  // Get visible pages and content filtering based on current responses  
  const { visiblePages, getVisiblePageContent, getComputedVariables } = useVisiblePages(visibleBlockPages, responses, allBlockComputedVariables)
  
  // Navigation state and actions
  const {
    currentVisiblePageIndex,
    nextPage,
    prevPage,
    jumpToPage,
  } = useQuestionnaireNavigation(visiblePages.length)

  // Get current page and its content
  const currentPage = visiblePages[currentVisiblePageIndex]
  const pageContent = currentPage ? getVisiblePageContent(currentPage) : null
  
  // Get current block and its computed variables
  const currentBlockComputedVars: ComputedVariables = (() => {
    if (!currentPage) return {}
    
    // Find which block contains the current page
    for (const block of questionnaire) {
      if (block.pages.includes(currentPage)) {
        // Evaluate this block's computed variables with current responses
        const mockPage: Page = {
          title: "",
          content: "",
          questions: [],
          sections: [],
          computedVariables: block.computedVariables
        }
        return evaluateComputedVariables(mockPage, responses)
      }
    }
    return {}
  })()
  
  // Get page-level computed variables (excluding block variables)
  const currentPageComputedVars: ComputedVariables = (() => {
    if (!currentPage) return {}
    
    const allVars = getComputedVariables(currentPage)
    const pageOnlyVars: ComputedVariables = {}
    
    // Only include variables that are defined at page level
    currentPage.computedVariables.forEach(computedVar => {
      if (computedVar.name in allVars) {
        pageOnlyVars[computedVar.name] = allVars[computedVar.name]
      }
    })
    
    return pageOnlyVars
  })()
  
  // Check completion status
  const allQuestionsAnswered = usePageCompletion(pageContent, responses)

  const handleComplete = (): void => {
    setShowCompletionDialog(true)
  }

  if (!questionnaire || questionnaire.length === 0) {
    return null
  }

  if (visiblePages.length === 0) {
    return (
      <div className="max-w-4xl mx-auto pt-16 px-6 pb-6 text-center py-12">
        <p className="text-muted-foreground">
          {t('errors.noPages')}
        </p>
      </div>
    )
  }

  // Safety check - if no current page, don't render anything
  if (!currentPage || !pageContent) {
    return null
  }
  
  // Calculate total number of input elements for tab indexing
  const totalInputs = calculateTotalTabInputs(pageContent, responses)

  return (
    <>
      <div className="max-w-4xl mx-auto pt-16 px-6 pb-6 space-y-6">
        <PageHeader 
          page={currentPage} 
          responses={responses} 
          computedVariables={currentPageComputedVars}
        />
        
        <PageContent
          content={pageContent}
          responses={responses}
          onResponse={handleResponse}
          computedVariables={{ ...currentBlockComputedVars, ...currentPageComputedVars }}
        />

        <NavigationButtons
          currentPageIndex={currentVisiblePageIndex}
          totalPages={visiblePages.length}
          allQuestionsAnswered={allQuestionsAnswered}
          totalInputs={totalInputs}
          onPrevious={prevPage}
          onNext={nextPage}
          onComplete={handleComplete}
        />
      </div>

      <PageNavigator
        questionnaire={questionnaire}
        allPages={allPages}
        visiblePages={visiblePages}
        currentVisiblePageIndex={currentVisiblePageIndex}
        responses={responses}
        getComputedVariables={getComputedVariables}
        currentBlockComputedVars={currentBlockComputedVars}
        currentPageComputedVars={currentPageComputedVars}
        onJumpToPage={jumpToPage}
        onResetToUpload={onResetToUpload}
      />

      <CompletionDialog
        isOpen={showCompletionDialog}
        onOpenChange={setShowCompletionDialog}
      />
    </>
  )
}
