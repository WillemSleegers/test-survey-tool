import { useCallback, useMemo } from "react"
import { evaluateCondition } from "@/lib/conditions/condition-evaluator"
import { evaluateComputedVariables } from "@/lib/conditions/computed-variables"
import { Page, Responses, VisiblePageContent, ComputedVariables } from "@/lib/types"

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
 * @returns Visible pages and content getter function
 */
export function useVisiblePages(questionnaire: Page[], responses: Responses) {
  // Compute all computed variables for all pages once
  const allComputedVariables = useMemo(() => {
    const computedVars: Map<Page, ComputedVariables> = new Map()
    questionnaire.forEach(page => {
      computedVars.set(page, evaluateComputedVariables(page, responses))
    })
    return computedVars
  }, [questionnaire, responses])

  // Get only visible pages - based purely on SHOW_IF conditions and computed variables
  const visiblePages = useMemo(() => {
    return questionnaire.filter((page) => {
      const pageComputedVars = allComputedVariables.get(page) || {}
      return evaluateCondition(page.showIf || "", responses, pageComputedVars)
    })
  }, [questionnaire, responses, allComputedVariables])

  // Get visible content for a page
  const getVisiblePageContent = useCallback(
    (page: Page): VisiblePageContent => {
      const pageComputedVars = allComputedVariables.get(page) || {}
      
      // Filter main page questions based on their individual SHOW_IF conditions
      const mainQuestions = page.questions.filter((question) =>
        evaluateCondition(question.showIf || "", responses, pageComputedVars)
      )

      // Filter sections and their questions based on individual SHOW_IF conditions
      const visibleSections = page.sections.map((section) => ({
        title: section.title,
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
    [responses, allComputedVariables]
  )

  return {
    visiblePages,
    getVisiblePageContent,
    getComputedVariables: (page: Page) => allComputedVariables.get(page) || {},
  }
}