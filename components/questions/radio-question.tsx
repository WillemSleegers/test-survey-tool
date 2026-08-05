import React, { useState } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { OptionLabelContent } from "./shared/option-label-content"
import { QuestionWrapper } from "./shared/question-wrapper"
import { MultipleChoiceQuestion, Responses, Variables, ComputedValues } from "@/lib/types"
import { evaluateCondition } from "@/lib/conditions/condition-evaluator"
import { useLanguage } from "@/contexts/language-context"
import { useInstanceId } from "@/contexts/instance-id-context"

interface RadioQuestionProps {
  /** The question configuration */
  question: MultipleChoiceQuestion
  /** User responses */
  responses: Responses
  /** User variables, used for showIf/condition evaluation */
  variables: Variables
  /** User variables with `- TEXT` values composed in, used for text rendering */
  displayVariables: Variables
  /** Callback when user selects an option */
  onResponse: (questionId: string, value: string) => void
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
  variables,
  displayVariables,
  onResponse,
  otherTexts,
  onOtherTextChange,
  startTabIndex,
  computedVariables
}: RadioQuestionProps) {
  const { t } = useLanguage()
  const instanceId = useInstanceId()

  // Get current response value - the selected option value only, no encoded text
  const responseValue = responses[question.id]
  const baseValue = typeof responseValue === "string" ? responseValue : ""
  const isAnswered = baseValue !== ""

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

  // Handle radio selection change
  const handleRadioChange = (value: string) => {
    onResponse(question.id, value)
  }

  // Handle other text input change
  const handleOtherTextChange = (optionValue: string, text: string) => {
    onOtherTextChange(optionValue, text)
    if (baseValue !== optionValue) {
      onResponse(question.id, optionValue)
    }
  }

  // Handle text input focus - auto-select the option
  const handleTextInputFocus = (optionValue: string) => {
    if (baseValue !== optionValue) {
      handleRadioChange(optionValue)
    }
  }

  return (
    <QuestionWrapper question={question} variables={displayVariables} computedVariables={computedVariables}>
      <RadioGroup
        value={baseValue}
        onValueChange={handleRadioChange}
      >
        {visibleOptions.map((option, optionIndex) => {
          const radioTabIndex = isAnswered
            ? (option.value === baseValue ? startTabIndex : -1)
            : startTabIndex + optionIndex

          const textTabIndex = option.allowsOtherText
            ? (isAnswered && option.value === baseValue
                ? startTabIndex + 1  // Text input immediately follows selected radio
                : startTabIndex + optionIndex + 1)  // Sequential tab order for unselected
            : -1  // Not applicable if no other text allowed

          return (
            <div key={optionIndex} className="space-y-2">
              <div className="flex items-start space-x-2">
                <RadioGroupItem
                  value={option.value}
                  id={`${instanceId}${question.id}-${optionIndex}`}
                  tabIndex={radioTabIndex}
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
                    onChange={(e) => handleOtherTextChange(option.value, e.target.value)}
                    onFocus={() => handleTextInputFocus(option.value)}
                    className="mt-2"
                    tabIndex={textTabIndex}
                  />
                </div>
              )}
            </div>
          )
        })}
      </RadioGroup>
    </QuestionWrapper>
  )
}
