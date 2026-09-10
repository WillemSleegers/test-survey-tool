"use client"

import { useState } from "react"
import { PageContent } from "@/components/page-content"
import { useLanguage } from "@/contexts/language-context"
import { useNavigation } from "@/contexts/navigation-context"

import { useQuestionnaireNavigation } from "@/hooks/use-questionnaire-navigation"
import { useVisiblePages } from "@/hooks/use-visible-pages"
import { evaluateCondition } from "@/lib/conditions/condition-evaluator"
import { computeGlobalValues, computePageValues } from "@/lib/conditions/computed-variables"
import { useQuestionnaireResponses } from "@/hooks/use-questionnaire-responses"
import { usePageCompletion } from "@/hooks/use-page-completion"
import { PageHeader } from "@/components/questionnaire/page-header"
import { NavigationButtons } from "@/components/questionnaire/navigation-buttons"
import { CompletionDialog } from "@/components/questionnaire/completion-dialog"
import { PageNavigator } from "@/components/questionnaire/page-navigator"
import { RespondentNavigator } from "@/components/questionnaire/respondent-navigator"
import { calculateTotalTabInputs } from "@/lib/utils/tab-index-calculator"

import { Block, Page, NavItem } from "@/lib/types"

interface QuestionnaireViewerProps {
  questionnaire: Block[]
  navItems: NavItem[]
  onResetToUpload: () => void
  hidePageNavigator?: boolean
  disableAutoScroll?: boolean
}

export function QuestionnaireViewer({
  questionnaire,
  navItems,
  onResetToUpload,
  hidePageNavigator = false,
  disableAutoScroll = false,
}: QuestionnaireViewerProps) {
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const { t } = useLanguage()
  const { isVisible: isNavVisible, position: navPosition } = useNavigation()

  // Response management - get all pages first for response tracking
  const allPages = questionnaire.flatMap(block => block.pages)
  const { responses, variables, displayVariables, otherTexts, handleResponse, handleOtherTextChange } = useQuestionnaireResponses(allPages)

  // Global block-level computed variables, shared across the whole survey
  const globalComputedVars = computeGlobalValues(questionnaire, variables)

  // Filter blocks by visibility, then flatten to pages
  const visibleBlockPages: Page[] = []
  questionnaire.forEach(block => {
    const blockVisible = evaluateCondition(
      block.showIf || "",
      variables,
      globalComputedVars
    )

    if (blockVisible) {
      visibleBlockPages.push(...block.pages)
    }
  })

  // Get visible pages and content filtering based on current variables
  const { visiblePages, getVisiblePageContent } = useVisiblePages(
    visibleBlockPages,
    variables,
    (page) => computePageValues(page, variables, globalComputedVars)
  )
  
  // Navigation state and actions
  const {
    currentVisiblePageIndex,
    visitedPages,
    nextPage,
    prevPage,
    jumpToPage,
  } = useQuestionnaireNavigation(visiblePages, disableAutoScroll)

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
  
  // All computed variables visible on the current page: global block-level set
  // merged with the current page's own computeds.
  const currentComputedVars = currentPage
    ? computePageValues(currentPage, variables, globalComputedVars)
    : globalComputedVars

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
          {/* Respondent Navigator - NAVIGATION-based navigation for survey takers */}
          {isNavVisible && navPosition === 'left' && navItems.length > 0 && (
            <RespondentNavigator
              navItems={navItems}
              visiblePages={visiblePages}
              currentVisiblePageIndex={currentVisiblePageIndex}
              visitedPages={visitedPages}
              onJumpToNavItem={handleJumpToNavItem}
            />
          )}

          {/* Main content */}
          <div className="w-full max-w-4xl space-y-6">
            <PageHeader
              page={currentPage}
              variables={displayVariables}
              computedVariables={currentComputedVars}
            />

            <PageContent
              content={pageContent}
              responses={responses}
              variables={variables}
              displayVariables={displayVariables}
              onResponse={handleResponse}
              otherTexts={otherTexts}
              onOtherTextChange={handleOtherTextChange}
              computedVariables={currentComputedVars}
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
          {isNavVisible && navPosition === 'right' && navItems.length > 0 && (
            <RespondentNavigator
              navItems={navItems}
              visiblePages={visiblePages}
              currentVisiblePageIndex={currentVisiblePageIndex}
              visitedPages={visitedPages}
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
          visibleBlockPages={visibleBlockPages}
          visiblePages={visiblePages}
          currentVisiblePageIndex={currentVisiblePageIndex}
          variables={variables}
          currentComputedVars={currentComputedVars}
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
