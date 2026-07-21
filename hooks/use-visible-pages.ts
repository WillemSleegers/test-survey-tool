import { evaluateCondition } from "@/lib/conditions/condition-evaluator"
import { Page, Variables, Section, ComputedValues, isText } from "@/lib/types"

/**
 * Hook for managing page visibility and content filtering
 *
 * Handles:
 * - Page visibility based on SHOW_IF conditions
 * - Question filtering within visible pages
 * - Section content filtering
 *
 * @param questionnaire - All questionnaire pages
 * @param variables - Current user variables
 * @param getPageComputedVars - Returns the computed variables visible on a given page
 * @returns Visible pages and content getter function
 */
export function useVisiblePages(
  questionnaire: Page[],
  variables: Variables,
  getPageComputedVars: (page: Page) => ComputedValues
) {
  // Get only visible pages - based purely on SHOW_IF conditions and computed variables
  const visiblePages = questionnaire.filter((page) => {
    const pageComputedVars = getPageComputedVars(page)
    return evaluateCondition(page.showIf || "", variables, pageComputedVars)
  })

  // Get visible content for a page
  const getVisiblePageContent = (page: Page): Section[] => {
    const pageComputedVars = getPageComputedVars(page)

    // Filter sections based on SHOW_IF, then filter items within visible sections
    return page.sections
      .filter((section) => evaluateCondition(section.showIf || "", variables, pageComputedVars))
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (isText(item)) {
            return true
          } else {
            return evaluateCondition(item.showIf || "", variables, pageComputedVars)
          }
        }),
      }))
  }

  return {
    visiblePages,
    getVisiblePageContent,
  }
}
