import { useState } from "react"
import { Responses, Page } from "@/lib/types"

/**
 * Hook for managing questionnaire response state
 * 
 * Handles:
 * - Response storage and updates
 * - Question lookup and variable mapping
 * 
 * @param questionnaire - All questionnaire pages for question lookup
 * @returns Response state and handlers
 */
export function useQuestionnaireResponses(questionnaire: Page[]) {
  const [responses, setResponses] = useState<Responses>({})

  /**
   * Handle response updates with question lookup for variable mapping
   */
  const handleResponse = (
    questionId: string,
    value: string | string[] | Record<string, string | string[]>
  ): void => {
    const question =
      questionnaire
        ?.flatMap((p) => p.sections)
        .flatMap((section) => section.questions)
        .find((q) => q.id === questionId)

    if (question) {
      setResponses((prev) => {
        const newResponses = {
          ...prev,
          [questionId]: {
            value,
            variable: question.variable,
          },
        }

        // If this is a matrix question with matrix rows that have variables,
        // transform the matrix value to include variable information for each row
        if (question.type === "matrix" && question.matrixRows &&
            typeof value === "object" && value !== null && !Array.isArray(value)) {
          const matrixValue = value as Record<string, string | string[]>
          const transformedMatrixValue: Record<string, any> = {}

          question.matrixRows.forEach(row => {
            if (matrixValue[row.id] !== undefined) {
              const rowValue = matrixValue[row.id]
              if (row.variable) {
                // Store with variable information
                transformedMatrixValue[row.id] = {
                  value: rowValue,
                  variable: row.variable,
                }
              } else {
                // Store just the value if no variable
                transformedMatrixValue[row.id] = rowValue
              }
            }
          })

          // Update the question's value with the transformed matrix value
          newResponses[questionId] = {
            value: transformedMatrixValue,
            variable: question.variable,
          }
        }

        return newResponses
      })
    }
  }

  return {
    responses,
    handleResponse,
  }
}