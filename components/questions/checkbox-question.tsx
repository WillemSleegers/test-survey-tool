import React, { useState, useEffect, useMemo } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { QuestionWrapper } from "./shared/question-wrapper"
import { Question, Responses, ComputedVariables } from "@/lib/types"
import { evaluateCondition } from "@/lib/conditions/condition-evaluator"
import { replacePlaceholders } from "@/lib/text-processing/replacer"
import { useLanguage } from "@/contexts/language-context"

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
  const { t } = useLanguage()
  
  // Get current response values (should be string array)
  const responseValue = responses[question.id]?.value
  const rawCheckboxValues = useMemo(() => 
    Array.isArray(responseValue) ? responseValue : [], 
    [responseValue]
  )
  
  // Helper function to parse checkbox responses properly
  const parseCheckboxValue = (value: string) => {
    const colonIndex = value.indexOf(": ")
    if (colonIndex === -1) {
      return { original: value, baseValue: value, otherText: "" }
    }
    
    const potentialBaseValue = value.substring(0, colonIndex)
    const potentialOtherText = value.substring(colonIndex + 2)
    
    // Check if this base value corresponds to an option that allows other text
    const matchingOption = question.options.find(opt => opt.value === potentialBaseValue)
    if (matchingOption?.allowsOtherText) {
      return { 
        original: value, 
        baseValue: potentialBaseValue, 
        otherText: potentialOtherText 
      }
    }
    
    // Otherwise, treat the entire value as the base value
    return { original: value, baseValue: value, otherText: "" }
  }
  
  // Parse values to separate base options from "other" text
  const parsedValues = rawCheckboxValues.map(parseCheckboxValue)
  const selectedBaseValues = parsedValues.map(pv => pv.baseValue)
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({})

  // Initialize other texts from raw values
  useEffect(() => {
    const initialOtherTexts: Record<string, string> = {}
    rawCheckboxValues.forEach(value => {
      const colonIndex = value.indexOf(": ")
      if (colonIndex > -1) {
        const potentialBaseValue = value.substring(0, colonIndex)
        const potentialOtherText = value.substring(colonIndex + 2)
        
        // Check if this base value corresponds to an option that allows other text
        const matchingOption = question.options.find(opt => opt.value === potentialBaseValue)
        if (matchingOption?.allowsOtherText) {
          initialOtherTexts[potentialBaseValue] = potentialOtherText
        }
      }
    })
    setOtherTexts(initialOtherTexts)
  }, [rawCheckboxValues, question.options])

  // Filter options based on conditions
  const visibleOptions = question.options.filter(option => {
    if (!option.showIf) return true
    return evaluateCondition(option.showIf, responses, computedVariables)
  })

  const handleCheckboxChange = (optionValue: string, checked: boolean) => {
    const option = visibleOptions.find(opt => opt.value === optionValue)
    
    if (checked) {
      // Add the option to the selected values
      const valueToAdd = option?.allowsOtherText && otherTexts[optionValue] 
        ? `${optionValue}: ${otherTexts[optionValue]}` 
        : optionValue
      
      onResponse(question.id, [...rawCheckboxValues, valueToAdd])
    } else {
      // Remove the option from the selected values (including any "other" variant)
      const filteredValues = rawCheckboxValues.filter(v => {
        const parsed = parseCheckboxValue(v)
        return parsed.baseValue !== optionValue
      })
      onResponse(question.id, filteredValues)
      
      // Clear other text for this option
      setOtherTexts(prev => {
        const updated = { ...prev }
        delete updated[optionValue]
        return updated
      })
    }
  }

  const handleOtherTextChange = (optionValue: string, text: string) => {
    setOtherTexts(prev => ({ ...prev, [optionValue]: text }))
    
    // Update the response values
    const updatedValues = rawCheckboxValues.map(value => {
      const parsed = parseCheckboxValue(value)
      
      if (parsed.baseValue === optionValue) {
        return text.trim() ? `${optionValue}: ${text}` : optionValue
      }
      return value
    })
    
    onResponse(question.id, updatedValues)
  }

  // Handle text input focus - auto-select the checkbox
  const handleTextInputFocus = (optionValue: string) => {
    if (!selectedBaseValues.includes(optionValue)) {
      handleCheckboxChange(optionValue, true)
    }
  }

  return (
    <QuestionWrapper question={question} responses={responses} computedVariables={computedVariables}>
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
            <div key={option.value} className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${optionIndex}`}
                  checked={selectedBaseValues.includes(option.value)}
                  tabIndex={checkboxTabIndex}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange(option.value, checked === true)
                  }
                />
                <Label
                  htmlFor={`${question.id}-${optionIndex}`}
                  className="cursor-pointer text-base font-normal"
                >
                  {replacePlaceholders(option.label, responses, computedVariables)}
                </Label>
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
      </div>
    </QuestionWrapper>
  )
}