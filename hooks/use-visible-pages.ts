import React from "react"
import { evaluateCondition } from "@/lib/conditions/condition-evaluator"
import { evaluateComputedValues } from "@/lib/conditions/computed-variables"
import { Page, Question, Variables, Section, ComputedValues } from "@/lib/types"

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
 * @param blockComputedValues - Computed variables from block level (optional)
 * @returns Visible pages and content getter function
 */
export function useVisiblePages(
  questionnaire: Page[], 
  variables: Variables, 
  blockComputedValues?: ComputedValues,
  getPageComputedVars?: (page: Page) => ComputedValues
) {
  // Get only visible pages - based purely on SHOW_IF conditions and computed variables
  const visiblePages = questionnaire.filter((page) => {
    // Use lazy computed variables if provided, otherwise fall back to eager evaluation
    const pageComputedVars = getPageComputedVars ?
      getPageComputedVars(page) :
      evaluateComputedValues(page, variables, blockComputedValues)

    return evaluateCondition(page.showIf || "", variables, pageComputedVars)
  })

  // Get visible content for a page
  const getVisiblePageContent = (page: Page): Section[] => {
    // Use lazy computed variables if provided, otherwise fall back to eager evaluation
    const pageComputedVars = getPageComputedVars ?
      getPageComputedVars(page) :
      evaluateComputedValues(page, variables, blockComputedValues)

    // Filter section items based on individual SHOW_IF conditions
    return page.sections.map((section) => ({
      title: section.title,
      tooltip: section.tooltip,
      items: section.items.filter((item) => {
        if (item.type === 'content') {
          // Content is always visible
          return true
        } else {
          // Filter questions based on SHOW_IF
          return evaluateCondition(item.question.showIf || "", variables, pageComputedVars)
        }
      }),
    }))
  }

  return {
    visiblePages,
    getVisiblePageContent,
  }
}