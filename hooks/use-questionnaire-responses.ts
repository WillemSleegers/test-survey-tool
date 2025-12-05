import { useState } from "react"
import { Variables, Responses, Page, Question, BreakdownQuestion } from "@/lib/types"
import { replacePlaceholders } from "@/lib/text-processing/replacer"

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

        // Subquestion variables (only for matrix questions)
        if (question.type === 'matrix' && question.subquestions) {
          question.subquestions.forEach(subquestion => {
            if (subquestion.variable) {
              questionVariableMap.set(subquestion.id, subquestion.variable)
            }
          })
        }

        // Option variables (for breakdown and other questions with options)
        if ('options' in question && question.options) {
          question.options.forEach(option => {
            if (option.variable) {
              // Create a unique key for this option: questionId + option value
              const key = option.value.toLowerCase().replace(/[^a-z0-9]/g, '_')
              const optionKey = `${question.id}:${key}`
              optionVariableMap.set(optionKey, option.variable)
            }
          })
        }
      })
    })
  })

  // Helper function to calculate breakdown question total
  const calculateBreakdownTotal = (
    question: BreakdownQuestion,
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

  // Derive variables from responses - done in two passes to handle dependencies
  const variables: Variables = {}

  // PASS 1: Extract all simple variables (question-level and non-subtotal option variables)
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

    // Handle option-level variables (for breakdown questions) - non-subtotals only
    if (question?.type === "breakdown" && typeof responseValue === "object" && responseValue !== null && !Array.isArray(responseValue)) {
      const breakdownResponse = responseValue as Record<string, string>

      question.options.forEach((option) => {
        if (option.variable && !option.subtotalLabel) {
          // For regular options with variables (not subtotals)
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

  // PASS 2: Calculate subtotal variables (which may depend on variables from pass 1)
  Object.entries(responses).forEach(([questionId, responseValue]) => {
    const question = questionLookup.get(questionId)

    if (question?.type === "breakdown" && typeof responseValue === "object" && responseValue !== null && !Array.isArray(responseValue)) {
      const breakdownResponse = responseValue as Record<string, string>

      question.options.forEach((option, optionIndex) => {
        if (option.variable && option.subtotalLabel) {
          // For subtotal rows, calculate the subtotal value
          let subtotal: number

          // If custom calculation is provided, use it; otherwise auto-calculate
          if (option.custom) {
            const customValue = replacePlaceholders(option.custom, variables, {})
            subtotal = parseFloat(customValue) || 0
          } else {
            // Calculate subtotal from the last subtotal/header to this position
            let startIndex = 0
            for (let i = optionIndex - 1; i >= 0; i--) {
              if (question.options[i].subtotalLabel || question.options[i].header) {
                startIndex = i + 1
                break
              }
            }

            const optionsToSum = question.options.slice(startIndex, optionIndex)
            subtotal = 0

            for (const opt of optionsToSum) {
              if (opt.exclude) continue

              const key = opt.value.toLowerCase().replace(/[^a-z0-9]/g, '_')

              // Get value - either from user input or from calculated prefillValue
              let valueStr = breakdownResponse[key] || ""
              if (!valueStr && opt.prefillValue) {
                // For read-only options with VALUE, calculate the value
                // Now variables from pass 1 are available
                valueStr = replacePlaceholders(opt.prefillValue, variables, {})
              }

              if (valueStr !== undefined && valueStr !== "") {
                const numValue = parseFloat(valueStr)
                if (!isNaN(numValue)) {
                  subtotal += opt.subtract ? -numValue : numValue
                }
              }
            }
          }

          variables[option.variable] = subtotal
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