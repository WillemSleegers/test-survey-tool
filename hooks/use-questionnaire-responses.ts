import { useState } from "react"
import { Variables, Responses, Page, Question } from "@/lib/types"

/**
 * Hook for managing questionnaire responses and variables
 *
 * Handles:
 * - Response storage for all questions (by question ID)
 * - Variable derivation from responses (for questions with VARIABLE declarations)
 * - Automatic variable mapping
 * - Special handling for breakdown questions (stores calculated total)
 *
 * @param questionnaire - All questionnaire pages for question lookup
 * @returns Response/variable state and handlers
 */
export function useQuestionnaireResponses(questionnaire: Page[]) {
  const [responses, setResponses] = useState<Responses>({})

  // Create lookup maps for questions and subquestions with variables
  const questionVariableMap = new Map<string, string>() // questionId -> variableName
  const questionLookup = new Map<string, Question>() // questionId -> Question
  const optionVariableMap = new Map<string, string>() // optionKey -> variableName

  questionnaire?.forEach(page => {
    page.sections.forEach(section => {
      section.questions.forEach(question => {
        // Store question for lookup
        questionLookup.set(question.id, question)

        // Regular question variable
        if (question.variable) {
          questionVariableMap.set(question.id, question.variable)
        }

        // Subquestion variables
        question.subquestions?.forEach(subquestion => {
          if (subquestion.variable) {
            questionVariableMap.set(subquestion.id, subquestion.variable)
          }
        })

        // Option variables (for breakdown questions with VARIABLE at option level)
        question.options?.forEach(option => {
          if (option.variable) {
            // Create a unique key for this option: questionId + option value
            const key = option.value.toLowerCase().replace(/[^a-z0-9]/g, '_')
            const optionKey = `${question.id}:${key}`
            optionVariableMap.set(optionKey, option.variable)
          }
        })
      })
    })
  })

  // Helper function to calculate breakdown question total
  const calculateBreakdownTotal = (
    question: Question,
    responseValue: Record<string, string>
  ): number => {
    let total = 0

    // If totalColumn is specified, only sum values from that column
    const targetColumn = question.totalColumn

    // Sum values from main options
    for (const option of question.options) {
      // Skip excluded options
      if (option.exclude) {
        continue
      }

      // Skip options not in the target column (if specified)
      if (targetColumn !== undefined && option.column !== targetColumn) {
        continue
      }

      const key = option.value.toLowerCase().replace(/[^a-z0-9]/g, '_')
      const numValue = parseFloat(responseValue[key] || "")
      if (!isNaN(numValue)) {
        if (option.subtract) {
          total -= numValue
        } else {
          total += numValue
        }
      }
    }

    return total
  }

  // Derive variables from responses
  const variables: Variables = {}

  // For each response, check if it should be mapped to a variable
  Object.entries(responses).forEach(([questionId, responseValue]) => {
    const question = questionLookup.get(questionId)

    // Handle question-level variables
    const variableName = questionVariableMap.get(questionId)
    if (variableName) {
      // For breakdown questions with question-level variable, store the calculated total
      if (question?.type === "breakdown" && typeof responseValue === "object" && responseValue !== null && !Array.isArray(responseValue)) {
        variables[variableName] = calculateBreakdownTotal(question, responseValue as Record<string, string>)
      } else {
        variables[variableName] = responseValue
      }
    }

    // Handle option-level variables (for breakdown questions)
    if (question?.type === "breakdown" && typeof responseValue === "object" && responseValue !== null && !Array.isArray(responseValue)) {
      const breakdownResponse = responseValue as Record<string, string>

      // Extract variables from each option's input value
      question.options.forEach(option => {
        if (option.variable) {
          const key = option.value.toLowerCase().replace(/[^a-z0-9]/g, '_')
          const value = breakdownResponse[key]

          // Store the numeric value if it exists and is valid
          if (value !== undefined && value !== "") {
            const numValue = parseFloat(value)
            if (!isNaN(numValue)) {
              variables[option.variable] = numValue
            }
          }
        }
      })
    }
  })

  /**
   * Handle response updates - stores by question ID and auto-derives variables
   */
  const handleResponse = (
    questionId: string,
    value: string | string[] | number | boolean | Record<string, string>
  ): void => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  return {
    responses,
    variables,
    handleResponse,
  }
}