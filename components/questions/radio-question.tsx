import React, { useState, useEffect } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { QuestionWrapper } from "./shared/question-wrapper"
import { Question, Responses, Variables, ComputedVariables } from "@/lib/types"
import { evaluateCondition } from "@/lib/conditions/condition-evaluator"
import { replacePlaceholders } from "@/lib/text-processing/replacer"
import { useLanguage } from "@/contexts/language-context"
import Markdown from "react-markdown"

interface RadioQuestionProps {
  /** The question configuration */
  question: Question
  /** User responses */
  responses: Responses
  /** User variables */
  variables: Variables
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
  variables,
  onResponse,
  startTabIndex,
  computedVariables
}: RadioQuestionProps) {
  const { t } = useLanguage()
  // Get current response value and parse it
  const responseValue = responses[question.id]
  const responseString = typeof responseValue === "string" ? responseValue : ""
  
  // Parse response - only treat as "other text" if the base option actually allows it
  const parseResponse = (response: string) => {
    const colonIndex = response.indexOf(": ")
    if (colonIndex === -1) {
      return { baseValue: response, otherText: "" }
    }
    
    const potentialBaseValue = response.substring(0, colonIndex)
    const potentialOtherText = response.substring(colonIndex + 2)
    
    // Check if this base value corresponds to an option that allows other text
    const matchingOption = question.options.find(opt => opt.value === potentialBaseValue)
    if (matchingOption?.allowsOtherText) {
      return { baseValue: potentialBaseValue, otherText: potentialOtherText }
    }
    
    // Otherwise, treat the entire response as the base value
    return { baseValue: response, otherText: "" }
  }
  
  const { baseValue, otherText } = parseResponse(responseString)
  
  const [currentOtherText, setCurrentOtherText] = useState(otherText)
  const isAnswered = baseValue !== ""

  // Update local other text state when response changes
  useEffect(() => {
    setCurrentOtherText(otherText)
  }, [otherText])

  // Filter options based on conditions
  const visibleOptions = question.options.filter(option => {
    if (!option.showIf) return true
    return evaluateCondition(option.showIf, variables, computedVariables)
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
  const handleOtherTextChange = (optionValue: string, text: string) => {
    setCurrentOtherText(text)
    if (text.trim()) {
      // Update response with combined value
      onResponse(question.id, `${optionValue}: ${text}`)
    } else if (baseValue === optionValue) {
      // If text is empty but this option is selected, just store the option
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
    <QuestionWrapper question={question} variables={variables} computedVariables={computedVariables}>
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
                  <Markdown>
                    {replacePlaceholders(option.label, variables, computedVariables)}
                  </Markdown>
                </Label>
              </div>
              {option.allowsOtherText && (
                <div className="ml-6">
                  <Input
                    type="text"
                    placeholder={t('placeholders.otherText')}
                    value={option.value === baseValue ? currentOtherText : ""}
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