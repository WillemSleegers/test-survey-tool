import { useState } from "react"
import { Responses, OtherTexts, Page } from "@/lib/types"
import { deriveVariables, applyOtherText } from "@/lib/response-variables"

/**
 * Hook for managing questionnaire responses and variables
 *
 * Handles:
 * - Response storage for all questions (by question ID)
 * - Variable derivation from responses (for questions with VARIABLE declarations)
 * - Automatic variable mapping
 * - Special handling for breakdown questions (stores calculated total)
 * - Free text typed into `- TEXT` options, kept separate from `responses` so
 *   stored values are never text-encoded
 *
 * @param questionnaire - All questionnaire pages for question lookup
 * @returns Response/variable state and handlers
 */
export function useQuestionnaireResponses(questionnaire: Page[]) {
  const [responses, setResponses] = useState<Responses>({})
  const [otherTexts, setOtherTexts] = useState<OtherTexts>({})

  const variables = deriveVariables(questionnaire, responses)
  const displayVariables = applyOtherText(variables, questionnaire, otherTexts)

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

  /**
   * Handle other-text updates for a `- TEXT` option, keyed by question and option value
   */
  const handleOtherTextChange = (
    questionId: string,
    optionValue: string,
    text: string
  ): void => {
    setOtherTexts(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [optionValue]: text
      }
    }))
  }

  return {
    responses,
    variables,
    displayVariables,
    otherTexts,
    handleResponse,
    handleOtherTextChange,
  }
}
