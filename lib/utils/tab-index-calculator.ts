import { VisiblePageContent, Responses, Question } from "@/lib/types"

/**
 * Calculates the total number of tab-accessible inputs in a page
 * 
 * Tab index logic:
 * - Text/Number questions: Always 1 input
 * - Radio questions: 1 input if answered (+ 1 for text if selected option has TEXT), all options if not answered
 * - Checkbox questions: Always all options (+ 1 for text per selected option with TEXT)
 * 
 * @param pageContent - Visible content of the page
 * @param responses - Current user responses for answered state checking
 * @returns Total number of tab-accessible inputs
 * 
 * @example
 * // Page with 2 text, 1 answered radio (3 options, selected has TEXT), 1 checkbox (2 options)
 * calculateTotalTabInputs(content, responses) // Returns: 2 + 2 + 4 = 8
 */
export function calculateTotalTabInputs(
  pageContent: VisiblePageContent,
  responses: Responses
): number {
  const mainInputs = pageContent.mainQuestions.reduce((sum, question) => {
    return sum + calculateQuestionInputCount(question, responses)
  }, 0)

  const sectionInputs = pageContent.sections.reduce((sum, sub) => {
    return sum + sub.questions.reduce((subSum, question) => {
      return subSum + calculateQuestionInputCount(question, responses)
    }, 0)
  }, 0)

  return mainInputs + sectionInputs
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
      // Parse response properly - only treat as "other text" if the base option actually allows it
      const parseResponse = (response: string) => {
        const colonIndex = response.indexOf(': ')
        if (colonIndex === -1) {
          return response
        }
        
        const potentialBaseValue = response.substring(0, colonIndex)
        const typedQuestion = question as Question
        const matchingOption = typedQuestion.options.find(opt => opt.value === potentialBaseValue)
        
        if (matchingOption?.allowsOtherText) {
          return potentialBaseValue
        }
        
        // Otherwise, treat the entire response as the selected value
        return response
      }
      
      const selectedValue = parseResponse(responseString)
      
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
    // For checkboxes, count actual slots needed: 1 per checkbox + 1 per selected "other" text input
    const typedQuestion = question as Question
    let totalSlots = typedQuestion.options.length // All checkboxes
    
    // Add slots for text inputs that are currently showing
    typedQuestion.options.forEach(option => {
      if (option.allowsOtherText) {
        // Check if this option is selected by looking at responses
        const response = responses[question.id]?.value
        if (Array.isArray(response)) {
          const isSelected = response.some(value => {
            // Parse the response to get the base value
            const colonIndex = value.indexOf(': ')
            const baseValue = colonIndex > -1 ? value.substring(0, colonIndex) : value
            return baseValue === option.value
          })
          if (isSelected) {
            totalSlots += 1 // Add slot for text input
          }
        }
      }
    })
    
    return totalSlots
  } else {
    return question.options.length
  }
}