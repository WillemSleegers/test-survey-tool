import { VisibleSectionContent, Responses } from "@/lib/types"

/**
 * Calculates the total number of tab-accessible inputs in a section
 * 
 * Tab index logic:
 * - Text/Number questions: Always 1 input
 * - Radio questions: 1 input if answered, all options if not answered
 * - Checkbox questions: Always all options (can select multiple)
 * 
 * @param sectionContent - Visible content of the section
 * @param responses - Current user responses for answered state checking
 * @returns Total number of tab-accessible inputs
 * 
 * @example
 * // Section with 2 text, 1 answered radio (3 options), 1 checkbox (2 options)
 * calculateTotalTabInputs(content, responses) // Returns: 2 + 1 + 2 = 5
 */
export function calculateTotalTabInputs(
  sectionContent: VisibleSectionContent,
  responses: Responses
): number {
  const mainInputs = sectionContent.mainQuestions.reduce((sum, question) => {
    return sum + calculateQuestionInputCount(question, responses)
  }, 0)

  const subsectionInputs = sectionContent.subsections.reduce((sum, sub) => {
    return sum + sub.questions.reduce((subSum, question) => {
      return subSum + calculateQuestionInputCount(question, responses)
    }, 0)
  }, 0)

  return mainInputs + subsectionInputs
}

/**
 * Calculates input count for a single question based on type and answer state
 */
function calculateQuestionInputCount(
  question: { type: string; options: Array<unknown>; id: string },
  responses: Responses
): number {
  if (question.type === 'text' || question.type === 'number') {
    return 1
  } else if (question.type === 'multiple_choice') {
    // For radio buttons, use 1 slot if answered, all options if not answered
    const response = responses[question.id]?.value
    const isAnswered = response !== undefined && response !== ""
    return isAnswered ? 1 : question.options.length
  } else {
    // For checkboxes, always use all options
    return question.options.length
  }
}