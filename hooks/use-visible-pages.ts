import { useCallback, useMemo } from "react"
import { evaluateCondition } from "@/lib/conditions/condition-evaluator"
import { evaluateComputedVariables } from "@/lib/conditions/computed-variables"
import { Page, Question, Responses, VisiblePageContent, ComputedVariables } from "@/lib/types"

/**
 * Hook for managing page visibility and content filtering
 * 
 * Handles:
 * - Page visibility based on SHOW_IF conditions
 * - Question filtering within visible pages
 * - Section content filtering
 * 
 * @param questionnaire - All questionnaire pages
 * @param responses - Current user responses
 * @param blockComputedVariables - Computed variables from block level (optional)
 * @returns Visible pages and content getter function
 */
export function useVisiblePages(
  questionnaire: Page[], 
  responses: Responses, 
  blockComputedVariables?: ComputedVariables,
  getPageComputedVars?: (page: Page) => ComputedVariables
) {
  // Get only visible pages - based purely on SHOW_IF conditions and computed variables
  const visiblePages = useMemo(() => {
    return questionnaire.filter((page) => {
      // Use lazy computed variables if provided, otherwise fall back to eager evaluation
      const pageComputedVars = getPageComputedVars ? 
        getPageComputedVars(page) : 
        evaluateComputedVariables(page, responses, blockComputedVariables)
      
      return evaluateCondition(page.showIf || "", responses, pageComputedVars)
    })
  }, [questionnaire, responses, blockComputedVariables, getPageComputedVars])

  // Get visible content for a page
  const getVisiblePageContent = useCallback(
    (page: Page): VisiblePageContent => {
      // Use lazy computed variables if provided, otherwise fall back to eager evaluation
      const pageComputedVars = getPageComputedVars ? 
        getPageComputedVars(page) : 
        evaluateComputedVariables(page, responses, blockComputedVariables)
      
      // No main page questions since everything is in sections now
      const mainQuestions: Question[] = []

      // Filter sections and their questions based on individual SHOW_IF conditions
      const visibleSections = page.sections.map((section) => ({
        content: section.content,
        questions: section.questions.filter((question) =>
          evaluateCondition(question.showIf || "", responses, pageComputedVars)
        ),
      }))

      return {
        mainQuestions,
        sections: visibleSections,
      }
    },
    [responses, blockComputedVariables, getPageComputedVars]
  )

  return {
    visiblePages,
    getVisiblePageContent,
  }
}