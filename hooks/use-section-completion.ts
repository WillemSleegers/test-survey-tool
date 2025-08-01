import { VisibleSectionContent, Responses } from "@/lib/types"

/**
 * Hook for checking section completion status
 * 
 * Determines if all visible questions in a section have been answered
 * Handles different question types appropriately:
 * - Text/Number: Must have non-empty string value
 * - Checkbox: Must have at least one selected option
 * - Radio: Must have selected value
 * 
 * @param sectionContent - Visible content of current section
 * @param responses - Current user responses
 * @returns Whether all questions are answered
 */
export function useSectionCompletion(
  sectionContent: VisibleSectionContent | null,
  responses: Responses
): boolean {
  if (!sectionContent) return false

  const allQuestions = [
    ...sectionContent.mainQuestions,
    ...sectionContent.subsections.flatMap(sub => sub.questions)
  ]

  return allQuestions.every(question => {
    const response = responses[question.id]?.value
    if (question.type === 'checkbox') {
      return Array.isArray(response) && response.length > 0
    }
    return response !== undefined && response !== ''
  })
}