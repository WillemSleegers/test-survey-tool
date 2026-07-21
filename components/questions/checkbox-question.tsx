import React, { useState, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { OptionLabelContent } from "./shared/option-label-content"
import { QuestionWrapper } from "./shared/question-wrapper"
import { CheckboxQuestion as CheckboxQuestionType, Responses, Variables, ComputedValues } from "@/lib/types"
import { evaluateCondition } from "@/lib/conditions/condition-evaluator"
import { replacePlaceholders } from "@/lib/text-processing/replacer"
import { useLanguage } from "@/contexts/language-context"
import { useInstanceId } from "@/contexts/instance-id-context"

interface CheckboxQuestionProps {
  /** The question configuration */
  question: CheckboxQuestionType
  /** User responses */
  responses: Responses
  /** User variables */
  variables: Variables
  /** Callback when user toggles an option */
  onResponse: (questionId: string, value: string[]) => void
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
  variables,
  onResponse,
  startTabIndex,
  computedVariables
}: CheckboxQuestionProps) {
  const { t } = useLanguage()
  const instanceId = useInstanceId()

  // Get current response value (should be string array)
  const responseValue = responses[question.id]
  const rawCheckboxValues = Array.isArray(responseValue) ? responseValue : []
  
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

  // Initialize other texts from raw values
  useEffect(() => {
    const initialOtherTexts: Record<string, string> = {}
    const currentValues = Array.isArray(responseValue) ? responseValue : []

    currentValues.forEach(value => {
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
  }, [responseValue, question.options])

  // Filter options based on conditions
  const visibleOptions = question.options.filter(option => {
    if (!option.showIf) return true
    return evaluateCondition(option.showIf, variables, computedVariables)
  })

  const handleCheckboxChange = (optionValue: string, checked: boolean) => {
    const option = visibleOptions.find(opt => opt.value === optionValue)
    
    if (checked) {
      // Add the option to the selected values
      const valueToAdd = option?.allowsOtherText && otherTexts[optionValue]
        ? `${optionValue}: ${otherTexts[optionValue]}`
        : optionValue

      if (option?.exclusive) {
        // Selecting an exclusive option clears all other selections
        onResponse(question.id, [valueToAdd])

        const clearedValues = selectedBaseValues.filter(v => v !== optionValue)
        if (clearedValues.length > 0) {
          setOtherTexts(prev => {
            const updated = { ...prev }
            clearedValues.forEach(v => delete updated[v])
            return updated
          })
        }
      } else {
        // Selecting a regular option clears any exclusive selections
        const exclusiveValues = new Set(
          visibleOptions.filter(opt => opt.exclusive).map(opt => opt.value)
        )
        const otherValues = rawCheckboxValues.filter(v => {
          const parsed = parseCheckboxValue(v)
          return !exclusiveValues.has(parsed.baseValue)
        })
        onResponse(question.id, [...otherValues, valueToAdd])

        const clearedExclusiveValues = selectedBaseValues.filter(v => exclusiveValues.has(v))
        if (clearedExclusiveValues.length > 0) {
          setOtherTexts(prev => {
            const updated = { ...prev }
            clearedExclusiveValues.forEach(v => delete updated[v])
            return updated
          })
        }
      }
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
    <QuestionWrapper question={question} variables={variables} computedVariables={computedVariables}>
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
                  checked={selectedBaseValues.includes(option.value)}
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
                  variables={variables}
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
      </div>
    </QuestionWrapper>
  )
}