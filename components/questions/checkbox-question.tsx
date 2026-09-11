import React, { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { OptionLabelContent } from "./shared/option-label-content"
import { QuestionWrapper } from "./shared/question-wrapper"
import { CheckboxQuestion as CheckboxQuestionType, Responses, Variables, ComputedValues } from "@/lib/types"
import { evaluateCondition } from "@/lib/conditions/condition-evaluator"
import { useLanguage } from "@/contexts/language-context"
import { useInstanceId } from "@/contexts/instance-id-context"

interface CheckboxQuestionProps {
  /** The question configuration */
  question: CheckboxQuestionType
  /** User responses */
  responses: Responses
  /** User variables, used for showIf/condition evaluation */
  variables: Variables
  /** User variables with `- TEXT` values composed in, used for text rendering */
  displayVariables: Variables
  /** Callback when user toggles an option */
  onResponse: (questionId: string, value: string[]) => void
  /** Free text typed into this question's `- TEXT` options, keyed by option value */
  otherTexts: Record<string, string>
  /** Callback when user types into a `- TEXT` option's input */
  onOtherTextChange: (optionValue: string, text: string) => void
  /** Starting tab index for accessibility */
  startTabIndex: number
  /** Computed variables from the current section */
  computedVariables?: ComputedValues
}

/**
 * Checkbox question component for multiple-choice selections
 *
 * Features:
 * - Multiple selections allowed (checkbox behavior)
 * - Maintains array of selected values, ordered to match option declaration order
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
  variables,
  displayVariables,
  onResponse,
  otherTexts,
  onOtherTextChange,
  startTabIndex,
  computedVariables
}: CheckboxQuestionProps) {
  const { t } = useLanguage()
  const instanceId = useInstanceId()

  // Get current response value - selected option values only, no encoded text
  const responseValue = responses[question.id]
  const selectedValues = Array.isArray(responseValue) ? responseValue : []

  // Track which option reveal panels are visible
  const [visibleReveals, setVisibleReveals] = useState<Set<string>>(new Set())

  const toggleReveal = (optionValue: string) => {
    setVisibleReveals(prev => {
      const next = new Set(prev)
      if (next.has(optionValue)) {
        next.delete(optionValue)
      } else {
        next.add(optionValue)
      }
      return next
    })
  }

  // Filter options based on conditions
  const visibleOptions = question.options.filter(option => {
    if (!option.showIf) return true
    return evaluateCondition(option.showIf, variables, computedVariables)
  })

  // Reorder a set of selected values to match option declaration order
  const orderSelection = (values: string[]): string[] =>
    question.options.map(opt => opt.value).filter(v => values.includes(v))

  const handleCheckboxChange = (optionValue: string, checked: boolean) => {
    const option = visibleOptions.find(opt => opt.value === optionValue)

    if (checked) {
      if (option?.exclusive) {
        // Selecting an exclusive option clears all other selections
        const clearedValues = selectedValues.filter(v => v !== optionValue)
        clearedValues.forEach(v => onOtherTextChange(v, ""))
        onResponse(question.id, [optionValue])
      } else {
        // Selecting a regular option clears any exclusive selections
        const exclusiveValues = new Set(
          visibleOptions.filter(opt => opt.exclusive).map(opt => opt.value)
        )
        const clearedExclusiveValues = selectedValues.filter(v => exclusiveValues.has(v))
        clearedExclusiveValues.forEach(v => onOtherTextChange(v, ""))

        const remaining = selectedValues.filter(v => !exclusiveValues.has(v))
        onResponse(question.id, orderSelection([...remaining, optionValue]))
      }
    } else {
      // Remove the option from the selected values
      onResponse(question.id, selectedValues.filter(v => v !== optionValue))
      onOtherTextChange(optionValue, "")
    }
  }

  // Handle text input focus - auto-select the checkbox
  const handleTextInputFocus = (optionValue: string) => {
    if (!selectedValues.includes(optionValue)) {
      handleCheckboxChange(optionValue, true)
    }
  }

  return (
    <QuestionWrapper question={question} variables={displayVariables} computedVariables={computedVariables}>
      <div className="space-y-3">
        {visibleOptions.map((option, optionIndex) => {
          // Calculate tab indices dynamically based on actual inputs
          // Count how many slots are needed before this option
          let slotsUsedBefore = 0
          for (let i = 0; i < optionIndex; i++) {
            const prevOption = visibleOptions[i]
            slotsUsedBefore += 1 // checkbox
            // Add slot for text input if this option has allowsOtherText
            if (prevOption.allowsOtherText) {
              slotsUsedBefore += 1
            }
          }

          const checkboxTabIndex = startTabIndex + slotsUsedBefore
          const textTabIndex = checkboxTabIndex + 1

          return (
            <div key={optionIndex} className="space-y-2">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id={`${instanceId}${question.id}-${optionIndex}`}
                  checked={selectedValues.includes(option.value)}
                  tabIndex={checkboxTabIndex}
                  shape={option.exclusive ? "circle" : "square"}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange(option.value, checked === true)
                  }
                  className="mt-1"
                />
                <OptionLabelContent
                  label={option.label}
                  hint={option.hint}
                  reveal={option.reveal}
                  tooltip={option.tooltip}
                  optionValue={option.value}
                  isRevealVisible={visibleReveals.has(option.value)}
                  onToggleReveal={toggleReveal}
                  variables={displayVariables}
                  computedVariables={computedVariables}
                  labelFor={`${instanceId}${question.id}-${optionIndex}`}
                />
              </div>
              {option.allowsOtherText && (
                <div className="ml-6">
                  <Input
                    type="text"
                    placeholder={t('placeholders.otherText')}
                    value={otherTexts[option.value] || ""}
                    onChange={(e) => onOtherTextChange(option.value, e.target.value)}
                    onFocus={() => handleTextInputFocus(option.value)}
                    className="mt-2"
                    tabIndex={textTabIndex}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </QuestionWrapper>
  )
}
