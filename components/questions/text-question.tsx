import React from "react"
import { Textarea } from "@/components/ui/textarea"
import { QuestionWrapper } from "./shared/question-wrapper"
import { useLanguage } from "@/contexts/language-context"
import { Question, Responses } from "@/lib/types"

interface TextQuestionProps {
  /** The question configuration */
  question: Question
  /** User responses */
  responses: Responses
  /** Callback when user types in the textarea */
  onResponse: (questionId: string, value: string) => void
  /** Tab index for accessibility */
  tabIndex: number
}

/**
 * Text input question component for free-form text responses
 * 
 * Features:
 * - Multi-line textarea for longer responses
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
  onResponse, 
  tabIndex 
}: TextQuestionProps) {
  const { t } = useLanguage()
  
  // Get current response value (should be string)
  const responseValue = responses[question.id]?.value
  const textValue = typeof responseValue === "string" ? responseValue : ""

  return (
    <QuestionWrapper question={question} responses={responses}>
      <Textarea
        value={textValue}
        onChange={(e) => onResponse(question.id, e.target.value)}
        placeholder={t('placeholders.textInput')}
        className="min-h-[100px]"
        tabIndex={tabIndex}
      />
    </QuestionWrapper>
  )
}