import React, { useState, useEffect } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { QuestionWrapper } from "./shared/question-wrapper"
import { Question, Responses, ComputedVariables } from "@/lib/types"
import { evaluateCondition } from "@/lib/conditions/condition-evaluator"
import { useLanguage } from "@/contexts/language-context"

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
  const { t } = useLanguage()
  // Get current response value and parse it
  const responseValue = responses[question.id]?.value
  const responseString = typeof responseValue === "string" ? responseValue : ""
  
  // Check if this is an "other" response (format: "OptionValue: otherText")
  const colonIndex = responseString.indexOf(": ")
  const baseValue = colonIndex > -1 ? responseString.substring(0, colonIndex) : responseString
  const otherText = colonIndex > -1 ? responseString.substring(colonIndex + 2) : ""
  
  const [currentOtherText, setCurrentOtherText] = useState(otherText)
  const isAnswered = baseValue !== ""

  // Update local other text state when response changes
  useEffect(() => {
    setCurrentOtherText(otherText)
  }, [otherText])

  // Filter options based on conditions
  const visibleOptions = question.options.filter(option => {
    if (!option.showIf) return true
    return evaluateCondition(option.showIf, responses, computedVariables)
  })

  // Handle radio selection change
  const handleRadioChange = (value: string) => {
    const selectedOption = visibleOptions.find(opt => opt.value === value)
    if (selectedOption?.allowsOtherText && currentOtherText) {
      // If selecting an "other" option and we have text, include it
      onResponse(question.id, `${value}: ${currentOtherText}`)
    } else {
      // Regular option selection
      onResponse(question.id, value)
      // Clear other text if switching to non-other option
      if (!selectedOption?.allowsOtherText) {
        setCurrentOtherText("")
      }
    }
  }

  // Handle other text input change
  const handleOtherTextChange = (text: string) => {
    setCurrentOtherText(text)
    if (text.trim()) {
      // Update response with combined value
      onResponse(question.id, `${baseValue}: ${text}`)
    } else if (baseValue) {
      // If text is empty but option is selected, just store the option
      onResponse(question.id, baseValue)
    }
  }

  return (
    <QuestionWrapper question={question} responses={responses} computedVariables={computedVariables}>
      <RadioGroup
        value={baseValue}
        onValueChange={handleRadioChange}
      >
        {visibleOptions.map((option, optionIndex) => {
          const radioTabIndex = isAnswered 
            ? (option.value === baseValue ? startTabIndex : -1)
            : startTabIndex + optionIndex
          
          const textTabIndex = isAnswered && option.value === baseValue
            ? startTabIndex + 1  // Text input immediately follows selected radio
            : -1  // Not accessible if option not selected
          
          return (
            <div key={option.value} className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value={option.value}
                  id={`${question.id}-${optionIndex}`}
                  tabIndex={radioTabIndex}
                />
                <Label
                  htmlFor={`${question.id}-${optionIndex}`}
                  className="cursor-pointer text-base font-normal"
                >
                  {option.label}
                </Label>
              </div>
              {option.allowsOtherText && option.value === baseValue && (
                <div className="ml-6">
                  <Input
                    type="text"
                    placeholder={t('placeholders.otherText')}
                    value={currentOtherText}
                    onChange={(e) => handleOtherTextChange(e.target.value)}
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