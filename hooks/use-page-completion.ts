import { VisiblePageContent, Responses } from "@/lib/types"

/**
 * Hook for checking page completion status
 * 
 * Determines if all visible questions in a page have been answered
 * Handles different question types appropriately:
 * - Text/Number: Must have non-empty string value
 * - Checkbox: Must have at least one selected option
 * - Radio: Must have selected value
 * 
 * @param pageContent - Visible content of current page
 * @param responses - Current user responses
 * @returns Whether all questions are answered
 */
export function usePageCompletion(
  pageContent: VisiblePageContent | null,
  responses: Responses
): boolean {
  if (!pageContent) return false

  const allQuestions = [
    ...pageContent.mainQuestions,
    ...pageContent.sections.flatMap(sub => sub.questions)
  ]

  return allQuestions.every(question => {
    const response = responses[question.id]?.value
    if (question.type === 'checkbox') {
      return Array.isArray(response) && response.length > 0
    }
    return response !== undefined && response !== ''
  })
}