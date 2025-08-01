import React from "react"
import { QuestionHeader } from "./question-header"
import { Question, Responses } from "@/lib/types"

interface QuestionWrapperProps {
  /** The question data containing text and subtext */
  question: Question
  /** User responses for placeholder replacement */
  responses: Responses
  /** The input component to render */
  children: React.ReactNode
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
export function QuestionWrapper({ question, responses, children }: QuestionWrapperProps) {
  return (
    <div className="space-y-3">
      <QuestionHeader 
        text={question.text}
        subtext={question.subtext}
        responses={responses}
      />
      {children}
    </div>
  )
}