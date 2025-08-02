import React from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { QuestionWrapper } from "./shared/question-wrapper"
import { Question, Responses, ComputedVariables } from "@/lib/types"

interface RadioQuestionProps {
  /** The question configuration */
  question: Question
  /** User responses */
  responses: Responses
  /** Callback when user selects an option */
  onResponse: (questionId: string, value: string) => void
  /** Starting tab index for accessibility */
  startTabIndex: number
  /** Computed variables from the current section */
  computedVariables?: ComputedVariables
}

/**
 * Radio button question component for single-choice selections
 * 
 * Features:
 * - Single selection only (radio button behavior)
 * - Smart tab indexing: only selected option is tabbable when answered
 * - Accessible with proper labels and IDs
 * - Consistent styling and layout
 * 
 * Tab behavior:
 * - Unanswered: All options are tabbable (tabIndex: startTabIndex + optionIndex)
 * - Answered: Only selected option is tabbable (others get tabIndex: -1)
 * 
 * @example
 * <RadioQuestion
 *   question={question}
 *   responses={responses}  
 *   onResponse={handleResponse}
 *   startTabIndex={1}
 * />
 */
export function RadioQuestion({ 
  question, 
  responses, 
  onResponse, 
  startTabIndex,
  computedVariables
}: RadioQuestionProps) {
  // Get current response value
  const responseValue = responses[question.id]?.value
  const radioValue = typeof responseValue === "string" ? responseValue : ""
  const isAnswered = radioValue !== ""

  return (
    <QuestionWrapper question={question} responses={responses} computedVariables={computedVariables}>
      <RadioGroup
        value={radioValue}
        onValueChange={(value) => onResponse(question.id, value)}
      >
        {question.options.map((option, optionIndex) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem
              value={option.value}
              id={`${question.id}-${optionIndex}`}
              tabIndex={
                isAnswered 
                  ? (option.value === radioValue ? startTabIndex : -1)
                  : startTabIndex + optionIndex
              }
            />
            <Label
              htmlFor={`${question.id}-${optionIndex}`}
              className="cursor-pointer text-base font-normal"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </QuestionWrapper>
  )
}