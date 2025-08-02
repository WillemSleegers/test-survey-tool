import React from "react"
import { Question, Responses, ComputedVariables } from "@/lib/types"
import { RadioQuestion } from "./radio-question"
import { CheckboxQuestion } from "./checkbox-question"
import { TextQuestion } from "./text-question"
import { NumberQuestion } from "./number-question"

interface QuestionRendererProps {
  /** The question to render */
  question: Question
  /** All user responses */
  responses: Responses
  /** Callback when user provides a response */
  onResponse: (questionId: string, value: string | string[]) => void
  /** Starting tab index for this question */
  startTabIndex: number
  /** Computed variables from the current section */
  computedVariables?: ComputedVariables
}

/**
 * Main question renderer that dispatches to the appropriate question type component
 * 
 * Supported question types:
 * - "multiple_choice": Radio buttons for single selection
 * - "checkbox": Checkboxes for multiple selections  
 * - "text": Textarea for free-form text input
 * - "number": Number input for numeric values
 * 
 * This component acts as a dispatcher, routing each question to its specialized
 * component while maintaining a consistent interface for parent components.
 * 
 * @example
 * <QuestionRenderer
 *   question={question}
 *   responses={responses}
 *   onResponse={handleResponse}
 *   startTabIndex={1}
 * />
 */
export function QuestionRenderer({
  question,
  responses,
  onResponse,
  startTabIndex,
  computedVariables,
}: QuestionRendererProps) {
  switch (question.type) {
    case "multiple_choice":
      return (
        <RadioQuestion
          question={question}
          responses={responses}
          onResponse={(questionId, value) => onResponse(questionId, value)}
          startTabIndex={startTabIndex}
          computedVariables={computedVariables}
        />
      )

    case "checkbox":
      return (
        <CheckboxQuestion
          question={question}
          responses={responses}
          onResponse={(questionId, value) => onResponse(questionId, value)}
          startTabIndex={startTabIndex}
          computedVariables={computedVariables}
        />
      )

    case "text":
      return (
        <TextQuestion
          question={question}
          responses={responses}
          onResponse={(questionId, value) => onResponse(questionId, value)}
          tabIndex={startTabIndex}
          computedVariables={computedVariables}
        />
      )

    case "number":
      return (
        <NumberQuestion
          question={question}
          responses={responses}
          onResponse={(questionId, value) => onResponse(questionId, value)}
          tabIndex={startTabIndex}
          computedVariables={computedVariables}
        />
      )

    default:
      // Exhaustive check - TypeScript will error if we miss a case
      const _exhaustive: never = question.type
      console.warn(`Unknown question type: ${_exhaustive}`)
      return null
  }
}