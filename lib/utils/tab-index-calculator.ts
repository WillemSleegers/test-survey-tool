import { VisibleSectionContent, Responses, Question } from "@/lib/types"

/**
 * Calculates the total number of tab-accessible inputs in a section
 * 
 * Tab index logic:
 * - Text/Number questions: Always 1 input
 * - Radio questions: 1 input if answered (+ 1 for text if selected option has TEXT), all options if not answered
 * - Checkbox questions: Always all options (+ 1 for text per selected option with TEXT)
 * 
 * @param sectionContent - Visible content of the section
 * @param responses - Current user responses for answered state checking
 * @returns Total number of tab-accessible inputs
 * 
 * @example
 * // Section with 2 text, 1 answered radio (3 options, selected has TEXT), 1 checkbox (2 options)
 * calculateTotalTabInputs(content, responses) // Returns: 2 + 2 + 4 = 8
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
    const response = responses[question.id]?.value
    const responseString = typeof response === 'string' ? response : ''
    const isAnswered = responseString !== ""
    
    if (isAnswered) {
      // Parse response to check if selected option has text input
      const colonIndex = responseString.indexOf(': ')
      const selectedValue = colonIndex > -1 ? responseString.substring(0, colonIndex) : responseString
      
      // Cast to proper Question type to access options
      const typedQuestion = question as Question
      const selectedOption = typedQuestion.options.find(opt => opt.value === selectedValue)
      
      // Radio: 1 for selection + 1 for text input if option allows it
      return selectedOption?.allowsOtherText ? 2 : 1
    } else {
      // Not answered: all options are tabbable
      return question.options.length
    }
  } else if (question.type === 'checkbox') {
    // For checkboxes, we reserve 2 tab slots per option (checkbox + potential text)
    // This ensures consistent tab indexing regardless of selection state
    return question.options.length * 2
  } else {
    return question.options.length
  }
}