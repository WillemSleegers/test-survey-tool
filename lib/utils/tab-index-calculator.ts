import { VisiblePageContent, Variables, Question } from "@/lib/types"

/**
 * Calculates the total number of tab-accessible inputs in a page
 * 
 * Tab index logic:
 * - Text/Number questions: Always 1 input
 * - Radio questions: 1 input if answered (+ 1 for text if selected option has TEXT), all options + text inputs if not answered
 * - Checkbox questions: All options + text inputs for options with TEXT
 * 
 * @param pageContent - Visible content of the page
 * @param variables - Current user variables for answered state checking
 * @returns Total number of tab-accessible inputs
 * 
 * @example
 * // Page with 2 text, 1 answered radio (3 options, selected has TEXT), 1 checkbox (2 options)
 * calculateTotalTabInputs(content, variables) // Returns: 2 + 2 + 4 = 8
 */
export function calculateTotalTabInputs(
  pageContent: VisiblePageContent,
  variables: Variables
): number {
  const sectionInputs = pageContent.sections.reduce((sum, sub) => {
    return sum + sub.questions.reduce((subSum, question) => {
      return subSum + calculateQuestionInputCount(question, variables)
    }, 0)
  }, 0)

  return sectionInputs
}

/**
 * Calculates input count for a single question based on type and answer state
 */
function calculateQuestionInputCount(
  question: Question,
  variables: Variables
): number {
  if (question.type === 'text' || question.type === 'essay' || question.type === 'number') {
    return 1
  } else if (question.type === 'breakdown') {
    // Breakdown: one input per option plus inputs for subquestions
    let inputCount = question.options.length

    // Add inputs for subquestions within options
    for (const option of question.options) {
      if (option.subquestions) {
        inputCount += option.subquestions.length
      }
    }

    return inputCount
  } else if (question.type === 'multiple_choice') {
    const variableValue = question.variable ? variables[question.variable] : undefined
    const responseString = typeof variableValue === 'string' ? variableValue : ''
    const isAnswered = responseString !== ""
    
    if (isAnswered) {
      // Parse response properly - only treat as "other text" if the base option actually allows it
      const parseResponse = (response: string) => {
        const colonIndex = response.indexOf(': ')
        if (colonIndex === -1) {
          return response
        }

        const potentialBaseValue = response.substring(0, colonIndex)
        const matchingOption = question.options.find(opt => opt.value === potentialBaseValue)

        if (matchingOption?.allowsOtherText) {
          return potentialBaseValue
        }

        // Otherwise, treat the entire response as the selected value
        return response
      }

      const selectedValue = parseResponse(responseString)
      const selectedOption = question.options.find(opt => opt.value === selectedValue)

      // Radio: 1 for selection + 1 for text input if option allows it
      return selectedOption?.allowsOtherText ? 2 : 1
    } else {
      // Not answered: all options are tabbable + any text inputs for options with TEXT
      const textInputCount = question.options.filter(opt => opt.allowsOtherText).length
      return question.options.length + textInputCount
    }
  } else if (question.type === 'checkbox') {
    // For checkboxes, count actual slots needed: 1 per checkbox + 1 per text input
    let totalSlots = question.options.length // All checkboxes

    // Add slots for all text inputs
    const textInputCount = question.options.filter(opt => opt.allowsOtherText).length
    totalSlots += textInputCount

    return totalSlots
  } else if (question.type === 'matrix') {
    // For matrix questions, return the number of options (columns)
    return question.options.length
  } else {
    // Default fallback for any other question types
    return 1
  }
}