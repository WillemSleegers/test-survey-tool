import { Section, Variables } from "@/lib/types"

/**
 * Hook for checking page completion status
 *
 * Determines if all visible questions in a page have been answered
 * Handles different question types appropriately:
 * - Text/Number: Must have non-empty string value
 * - Checkbox: Must have at least one selected option
 * - Radio: Must have selected value
 *
 * @param sections - Visible sections of current page
 * @param variables - Current user variables
 * @returns Whether all questions are answered
 */
export function usePageCompletion(
  sections: Section[] | null,
  variables: Variables
): boolean {
  if (!sections) return false

  const allQuestions = sections.flatMap(sub => sub.questions)

  return allQuestions.every(question => {
    if (!question.variable) return true // Skip questions without variables

    const variableValue = variables[question.variable]
    if (question.type === 'checkbox') {
      return Array.isArray(variableValue) && variableValue.length > 0
    }
    return variableValue !== undefined && variableValue !== ''
  })
}