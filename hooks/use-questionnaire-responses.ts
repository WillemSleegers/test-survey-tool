import { useState, useMemo } from "react"
import { Variables, Responses, Page } from "@/lib/types"

/**
 * Hook for managing questionnaire responses and variables
 *
 * Handles:
 * - Response storage for all questions (by question ID)
 * - Variable derivation from responses (for questions with VARIABLE declarations)
 * - Automatic variable mapping
 *
 * @param questionnaire - All questionnaire pages for question lookup
 * @returns Response/variable state and handlers
 */
export function useQuestionnaireResponses(questionnaire: Page[]) {
  const [responses, setResponses] = useState<Responses>({})

  // Create a lookup map for questions and subquestions with variables
  const questionVariableMap = useMemo(() => {
    const map = new Map<string, string>() // questionId -> variableName

    questionnaire?.forEach(page => {
      page.sections.forEach(section => {
        section.questions.forEach(question => {
          // Regular question variable
          if (question.variable) {
            map.set(question.id, question.variable)
          }

          // Subquestion variables
          question.subquestions?.forEach(subquestion => {
            if (subquestion.variable) {
              map.set(subquestion.id, subquestion.variable)
            }
          })
        })
      })
    })

    return map
  }, [questionnaire])

  // Derive variables from responses
  const variables = useMemo<Variables>(() => {
    const derivedVariables: Variables = {}

    // For each response, check if it should be mapped to a variable
    Object.entries(responses).forEach(([questionId, responseValue]) => {
      const variableName = questionVariableMap.get(questionId)
      if (variableName) {
        derivedVariables[variableName] = responseValue
      }
    })

    return derivedVariables
  }, [responses, questionVariableMap])

  /**
   * Handle response updates - stores by question ID and auto-derives variables
   */
  const handleResponse = (
    questionId: string,
    value: string | string[] | number | boolean
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