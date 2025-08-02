import React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { QuestionWrapper } from "./shared/question-wrapper"
import { Question, Responses, ComputedVariables } from "@/lib/types"
import { evaluateCondition } from "@/lib/conditions/condition-evaluator"

interface CheckboxQuestionProps {
  /** The question configuration */
  question: Question
  /** User responses */
  responses: Responses
  /** Callback when user toggles an option */
  onResponse: (questionId: string, value: string[]) => void
  /** Starting tab index for accessibility */
  startTabIndex: number
  /** Computed variables from the current section */
  computedVariables?: ComputedVariables
}

/**
 * Checkbox question component for multiple-choice selections
 * 
 * Features:
 * - Multiple selections allowed (checkbox behavior)
 * - Maintains array of selected values
 * - All options remain tabbable (unlike radio buttons)
 * - Accessible with proper labels and IDs
 * - Consistent styling and layout
 * 
 * Tab behavior:
 * - All options are always tabbable (tabIndex: startTabIndex + optionIndex)
 * - No smart skipping since multiple selections are allowed
 * 
 * @example
 * <CheckboxQuestion
 *   question={question}
 *   responses={responses}
 *   onResponse={handleResponse}
 *   startTabIndex={5}
 * />
 */
export function CheckboxQuestion({ 
  question, 
  responses, 
  onResponse, 
  startTabIndex,
  computedVariables
}: CheckboxQuestionProps) {
  // Get current response values (should be string array)
  const responseValue = responses[question.id]?.value
  const checkboxValues = Array.isArray(responseValue) ? responseValue : []

  // Filter options based on conditions
  const visibleOptions = question.options.filter(option => {
    if (!option.showIf) return true
    return evaluateCondition(option.showIf, responses, computedVariables)
  })

  const handleCheckboxChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      // Add the option to the selected values
      onResponse(question.id, [...checkboxValues, optionValue])
    } else {
      // Remove the option from the selected values
      onResponse(
        question.id,
        checkboxValues.filter((v) => v !== optionValue)
      )
    }
  }

  return (
    <QuestionWrapper question={question} responses={responses} computedVariables={computedVariables}>
      <div className="space-y-3">
        {visibleOptions.map((option, optionIndex) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={`${question.id}-${optionIndex}`}
              checked={checkboxValues.includes(option.value)}
              tabIndex={startTabIndex + optionIndex}
              onCheckedChange={(checked) => 
                handleCheckboxChange(option.value, checked === true)
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
      </div>
    </QuestionWrapper>
  )
}