import { useState } from "react"
import { Responses, Page } from "@/lib/types"
import { deriveVariables } from "@/lib/response-variables"

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

  const variables = deriveVariables(questionnaire, responses)

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
