import React from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { QuestionWrapper } from "./shared/question-wrapper"
import { useLanguage } from "@/contexts/language-context"
import { Question, Responses, Variables, ComputedVariables } from "@/lib/types"

interface TextQuestionProps {
  /** The question configuration */
  question: Question
  /** User responses */
  responses: Responses
  /** User variables */
  variables: Variables
  /** Callback when user types in the textarea */
  onResponse: (questionId: string, value: string) => void
  /** Tab index for accessibility */
  tabIndex: number
  /** Computed variables from the current section */
  computedVariables?: ComputedVariables
}

/**
 * Text input question component for free-form text responses
 * 
 * Features:
 * - Single-line input for "text" type (names, short answers)
 * - Multi-line textarea for "essay" type (longer responses)
 * - Localized placeholder text
 * - Real-time response updates
 * - Accessible with proper labeling
 * - Consistent styling and layout
 * 
 * @example
 * <TextQuestion
 *   question={question}
 *   responses={responses}
 *   onResponse={handleResponse}
 *   tabIndex={7}
 * />
 */
export function TextQuestion({
  question,
  responses,
  variables,
  onResponse,
  tabIndex,
  computedVariables
}: TextQuestionProps) {
  const { t } = useLanguage()
  
  // Get current response value (should be string)
  const responseValue = responses[question.id]
  const textValue = typeof responseValue === "string" ? responseValue : ""

  return (
    <QuestionWrapper question={question} variables={variables} computedVariables={computedVariables}>
      {question.type === "text" ? (
        <Input
          type="text"
          value={textValue}
          onChange={(e) => onResponse(question.id, e.target.value)}
          placeholder={t('placeholders.textInput')}
          tabIndex={tabIndex}
        />
      ) : (
        <Textarea
          value={textValue}
          onChange={(e) => onResponse(question.id, e.target.value)}
          placeholder={t('placeholders.textInput')}
          className="min-h-[100px]"
          tabIndex={tabIndex}
        />
      )}
    </QuestionWrapper>
  )
}