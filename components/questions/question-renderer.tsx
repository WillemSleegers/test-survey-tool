import React from "react"
import { Question, Responses, Variables, ComputedVariables } from "@/lib/types"
import { RadioQuestion } from "./radio-question"
import { CheckboxQuestion } from "./checkbox-question"
import { TextQuestion } from "./text-question"
import { NumberQuestion } from "./number-question"
import { MatrixQuestion } from "./matrix-question"
import { BreakdownQuestion } from "./breakdown-question"

interface QuestionRendererProps {
  /** The question to render */
  question: Question
  /** All user responses */
  responses: Responses
  /** All user variables */
  variables: Variables
  /** Callback when user provides a response */
  onResponse: (questionId: string, value: string | string[] | number | boolean | Record<string, string>) => void
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
 * - "text": Single-line input for short text responses
 * - "essay": Multi-line textarea for longer text responses
 * - "number": Number input for numeric values
 * - "matrix": Matrix/table format with multiple sub-questions sharing options
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
  variables,
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
          variables={variables}
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
          variables={variables}
          onResponse={(questionId, value) => onResponse(questionId, value)}
          startTabIndex={startTabIndex}
          computedVariables={computedVariables}
        />
      )

    case "text":
    case "essay":
      return (
        <TextQuestion
          question={question}
          responses={responses}
          variables={variables}
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
          variables={variables}
          onResponse={(questionId, value) => onResponse(questionId, value)}
          tabIndex={startTabIndex}
          computedVariables={computedVariables}
        />
      )

    case "matrix":
      return (
        <MatrixQuestion
          question={question}
          responses={responses}
          variables={variables}
          onResponse={(questionId, value) => onResponse(questionId, value)}
          startTabIndex={startTabIndex}
          computedVariables={computedVariables}
        />
      )

    case "breakdown":
      return (
        <BreakdownQuestion
          question={question}
          responses={responses}
          variables={variables}
          onResponse={(questionId, value) => onResponse(questionId, value)}
          startTabIndex={startTabIndex}
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