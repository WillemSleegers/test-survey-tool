import React from "react"
import { Input } from "@/components/ui/input"
import { QuestionWrapper } from "./shared/question-wrapper"
import { useLanguage } from "@/contexts/language-context"
import { Question, Responses, Variables, ComputedVariables } from "@/lib/types"

interface NumberQuestionProps {
  /** The question configuration */
  question: Question
  /** User responses */
  responses: Responses
  /** User variables */
  variables: Variables
  /** Callback when user enters a number */
  onResponse: (questionId: string, value: string) => void
  /** Tab index for accessibility */
  tabIndex: number
  /** Computed variables from the current section */
  computedVariables?: ComputedVariables
}

/**
 * Number input question component for numeric responses
 * 
 * Features:
 * - HTML number input with browser validation
 * - Localized placeholder text
 * - Real-time response updates
 * - Accessible with proper labeling
 * - Consistent styling and layout
 * 
 * @example
 * <NumberQuestion
 *   question={question}
 *   responses={responses}
 *   onResponse={handleResponse}
 *   tabIndex={8}
 * />
 */
export function NumberQuestion({
  question,
  responses,
  variables,
  onResponse,
  tabIndex,
  computedVariables
}: NumberQuestionProps) {
  const { t } = useLanguage()
  
  // Get current response value (should be string representation of number)
  const responseValue = responses[question.id]
  const numberValue = typeof responseValue === "string" ? responseValue : String(responseValue || "")

  return (
    <QuestionWrapper question={question} variables={variables} computedVariables={computedVariables}>
      <Input
        type="number"
        value={numberValue}
        onChange={(e) => onResponse(question.id, e.target.value)}
        placeholder={t('placeholders.numberInput')}
        tabIndex={tabIndex}
      />
    </QuestionWrapper>
  )
}