"use client"

import { useState, useMemo, useEffect } from "react"
import { PageContent } from "@/components/page-content"
import { useLanguage } from "@/contexts/language-context"

import { useQuestionnaireNavigation } from "@/hooks/use-questionnaire-navigation"
import { useVisiblePages } from "@/hooks/use-visible-pages"
import { useLazyComputedVariables } from "@/hooks/use-lazy-computed-variables"
import { evaluateCondition } from "@/lib/conditions/condition-evaluator" 
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
  
  // Initialize lazy computed variables system
  const { 
    getBlockComputedVariables, 
    getPageComputedVariables, 
    invalidateCache
  } = useLazyComputedVariables(questionnaire, responses)

  // Filter blocks by visibility, then flatten to pages
  const visibleBlockPages = useMemo(() => {
    const visiblePages: Page[] = []
    
    questionnaire.forEach(block => {
      // Get block-level computed variables (lazy evaluation)
      const currentBlockComputedVars = getBlockComputedVariables(block)
      
      const blockVisible = evaluateCondition(
        block.showIf || "",
        responses,
        currentBlockComputedVars
      )
      
      if (blockVisible) {
        // If block is visible, add all its pages
        visiblePages.push(...block.pages)
      }
    })
    
    return visiblePages
  }, [questionnaire, responses, getBlockComputedVariables])
  
  // Invalidate computed variable cache when responses change
  useEffect(() => {
    invalidateCache()
  }, [responses, invalidateCache])

  // Get visible pages and content filtering based on current responses  
  const { visiblePages, getVisiblePageContent } = useVisiblePages(
    visibleBlockPages, 
    responses, 
    {}, 
    getPageComputedVariables
  )
  
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
  
  // Get current block and page computed variables using lazy evaluation
  const currentBlockComputedVars: ComputedVariables = useMemo(() => {
    if (!currentPage) return {}
    
    // Find which block contains the current page
    const containingBlock = questionnaire.find(block => block.pages.includes(currentPage))
    return containingBlock ? getBlockComputedVariables(containingBlock) : {}
  }, [currentPage, questionnaire, getBlockComputedVariables])
  
  // Get page-level computed variables
  const currentPageComputedVars: ComputedVariables = useMemo(() => {
    if (!currentPage) return {}
    
    // Get all computed variables for this page (includes block-level variables)
    const allPageVars = getPageComputedVariables(currentPage)
    
    // Extract only the page-level ones
    const pageOnlyVars: ComputedVariables = {}
    currentPage.computedVariables.forEach(computedVar => {
      if (computedVar.name in allPageVars) {
        pageOnlyVars[computedVar.name] = allPageVars[computedVar.name]
      }
    })
    
    return pageOnlyVars
  }, [currentPage, getPageComputedVariables])
  
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
      <div className="max-w-4xl mx-auto px-6 py-6 text-center">
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
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
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
        getComputedVariables={getPageComputedVariables}
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
