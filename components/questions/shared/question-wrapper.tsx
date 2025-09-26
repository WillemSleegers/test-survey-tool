import React from "react"
import { QuestionHeader } from "./question-header"
import { Question, Variables, ComputedVariables } from "@/lib/types"

interface QuestionWrapperProps {
  /** The question data containing text and subtext */
  question: Question
  /** User variables for placeholder replacement */
  variables: Variables
  /** The input component to render */
  children: React.ReactNode
  /** Computed variables from the current section */
  computedVariables?: ComputedVariables
}

/**
 * Wrapper component that provides consistent layout and styling for all question types
 * 
 * Layout structure:
 * - Question header (title + subtext)
 * - Input component (passed as children)
 * - Consistent spacing between elements
 * 
 * @example
 * <QuestionWrapper question={question} responses={responses}>
 *   <RadioGroup>...</RadioGroup>
 * </QuestionWrapper>
 */
export function QuestionWrapper({ question, variables, children, computedVariables }: QuestionWrapperProps) {
  return (
    <div className="space-y-3">
      <QuestionHeader
        text={question.text}
        subtext={question.subtext}
        variables={variables}
        computedVariables={computedVariables}
      />
      {children}
    </div>
  )
}