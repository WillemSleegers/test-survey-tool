"use client"

import { useState, useMemo, useEffect } from "react"
import { PageContent } from "@/components/page-content"
import { useLanguage } from "@/contexts/language-context"
import { useNavigation } from "@/contexts/navigation-context"

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
import { RespondentNavigator } from "@/components/questionnaire/respondent-navigator"
import { calculateTotalTabInputs } from "@/lib/utils/tab-index-calculator"

import { Block, Page, NavItem, ComputedVariables } from "@/lib/types"

interface QuestionnaireViewerProps {
  questionnaire: Block[]
  navItems: NavItem[]
  onResetToUpload: () => void
  hidePageNavigator?: boolean
}

export function QuestionnaireViewer({
  questionnaire,
  navItems,
  onResetToUpload,
  hidePageNavigator = false,
}: QuestionnaireViewerProps) {
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const { t } = useLanguage()
  const { isVisible: isNavVisible, position: navPosition } = useNavigation()

  // Response management - get all pages first for response tracking
  const allPages = questionnaire.flatMap(block => block.pages)
  const { responses, variables, handleResponse } = useQuestionnaireResponses(allPages)

  // Initialize lazy computed variables system
  const {
    getBlockComputedVariables,
    getPageComputedVariables,
    invalidateCache
  } = useLazyComputedVariables(questionnaire, variables)

  // Filter blocks by visibility, then flatten to pages
  const visibleBlockPages = useMemo(() => {
    const visiblePages: Page[] = []
    
    questionnaire.forEach(block => {
      // Get block-level computed variables (lazy evaluation)
      const currentBlockComputedVars = getBlockComputedVariables(block)
      
      const blockVisible = evaluateCondition(
        block.showIf || "",
        variables,
        currentBlockComputedVars
      )
      
      if (blockVisible) {
        // If block is visible, add all its pages
        visiblePages.push(...block.pages)
      }
    })
    
    return visiblePages
  }, [questionnaire, variables, getBlockComputedVariables])
  
  // Invalidate computed variable cache when variables change
  useEffect(() => {
    invalidateCache()
  }, [variables, invalidateCache])

  // Get visible pages and content filtering based on current variables  
  const { visiblePages, getVisiblePageContent } = useVisiblePages(
    visibleBlockPages, 
    variables, 
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

  // Navigation: jump to first visible page of a nav item
  const handleJumpToNavItem = (navItem: NavItem): void => {
    // Find the first page from this nav item that is visible
    for (const page of navItem.pages) {
      const pageIndex = visiblePages.findIndex(p => p === page)
      if (pageIndex !== -1) {
        jumpToPage(pageIndex)
        return
      }
    }
  }

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
  const allQuestionsAnswered = usePageCompletion(pageContent, variables)

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
  const totalInputs = calculateTotalTabInputs(pageContent, variables)

  return (
    <>
      <div className="flex justify-center px-6 py-6">
        <div className="flex gap-16 items-start w-full justify-center">
          {/* Respondent Navigator - NAV-based navigation for survey takers */}
          {isNavVisible && navPosition === 'left' && (
            <RespondentNavigator
              navItems={navItems}
              visiblePages={visiblePages}
              currentVisiblePageIndex={currentVisiblePageIndex}
              onJumpToNavItem={handleJumpToNavItem}
            />
          )}

          {/* Main content */}
          <div className="w-full max-w-4xl space-y-6 pl-8">
            <PageHeader
              page={currentPage}
              variables={variables}
              computedVariables={currentPageComputedVars}
            />

            <PageContent
              content={pageContent}
              responses={responses}
              variables={variables}
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

          {/* Right side navigator */}
          {isNavVisible && navPosition === 'right' && (
            <RespondentNavigator
              navItems={navItems}
              visiblePages={visiblePages}
              currentVisiblePageIndex={currentVisiblePageIndex}
              onJumpToNavItem={handleJumpToNavItem}
            />
          )}
        </div>
      </div>

      {/* Page Navigator - Developer/researcher tool with page-level detail */}
      {!hidePageNavigator && (
        <PageNavigator
          questionnaire={questionnaire}
          allPages={allPages}
          visiblePages={visiblePages}
          currentVisiblePageIndex={currentVisiblePageIndex}
          variables={variables}
          currentBlockComputedVars={currentBlockComputedVars}
          currentPageComputedVars={currentPageComputedVars}
          onJumpToPage={jumpToPage}
          onResetToUpload={onResetToUpload}
        />
      )}

      <CompletionDialog
        isOpen={showCompletionDialog}
        onOpenChange={setShowCompletionDialog}
      />
    </>
  )
}
