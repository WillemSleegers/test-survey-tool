import { useState } from "react"
import { Responses, Section } from "@/lib/types"

/**
 * Hook for managing questionnaire response state
 * 
 * Handles:
 * - Response storage and updates
 * - Question lookup and variable mapping
 * 
 * @param questionnaire - All questionnaire sections for question lookup
 * @returns Response state and handlers
 */
export function useQuestionnaireResponses(questionnaire: Section[]) {
  const [responses, setResponses] = useState<Responses>({})

  /**
   * Handle response updates with question lookup for variable mapping
   */
  const handleResponse = (
    questionId: string,
    value: string | string[]
  ): void => {
    const question =
      questionnaire
        ?.flatMap((s) => s.questions)
        .find((q) => q.id === questionId) ||
      questionnaire
        ?.flatMap((s) => s.subsections || [])
        .flatMap((sub) => sub.questions)
        .find((q) => q.id === questionId)

    if (question) {
      setResponses((prev) => ({
        ...prev,
        [questionId]: {
          value,
          variable: question.variable,
        },
      }))
    }
  }

  return {
    responses,
    handleResponse,
  }
}