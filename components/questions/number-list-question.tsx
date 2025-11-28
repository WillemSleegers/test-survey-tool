import React from "react"
import { Input } from "@/components/ui/input"
import { QuestionWrapper } from "./shared/question-wrapper"
import { Question, Responses, ComputedVariables } from "@/lib/types"
import { replacePlaceholders } from "@/lib/text-processing/replacer"

interface NumberListQuestionProps {
  /** The question configuration */
  question: Question
  /** User responses */
  responses: Responses
  /** Callback when user enters a number */
  onResponse: (questionId: string, value: Record<string, string>) => void
  /** Starting tab index for accessibility */
  startTabIndex: number
  /** Computed variables from the current section */
  computedVariables?: ComputedVariables
}

/**
 * Number list question component for collecting multiple number inputs with automatic total
 *
 * Features:
 * - Multiple number input rows based on options
 * - Automatic sum calculation displayed at bottom
 * - Two-column layout: labels and inputs
 * - Individual row responses stored separately
 * - Optional total label customization
 *
 * Response format:
 * - Stored as Record<string, string> where keys are option values (slugified)
 * - Each row's input is stored separately
 * - Total is calculated, not stored
 *
 * @example
 * <NumberListQuestion
 *   question={question}
 *   responses={responses}
 *   onResponse={handleResponse}
 *   startTabIndex={1}
 * />
 */
export function NumberListQuestion({
  question,
  responses,
  onResponse,
  startTabIndex,
  computedVariables
}: NumberListQuestionProps) {
  // Get current responses (should be object with row IDs as keys)
  const responseValue = responses[question.id]?.value
  const currentValues = (typeof responseValue === "object" && responseValue !== null && !Array.isArray(responseValue))
    ? responseValue as Record<string, string>
    : {}

  // Convert option label to a slug for use as a key
  const optionToKey = (optionValue: string): string => {
    return optionValue.toLowerCase().replace(/[^a-z0-9]/g, '_')
  }

  // Handle input change for a specific row
  const handleRowChange = (optionValue: string, value: string) => {
    const key = optionToKey(optionValue)
    const newValues = { ...currentValues }

    if (value === "") {
      delete newValues[key]
    } else {
      newValues[key] = value
    }

    onResponse(question.id, newValues)
  }

  // Calculate the total for a specific set of options
  const calculateSubtotal = (options: typeof question.options): number => {
    let total = 0
    for (const option of options) {
      const key = optionToKey(option.value)
      const numValue = parseFloat(currentValues[key] || "")
      if (!isNaN(numValue)) {
        total += numValue
      }
    }
    return total
  }

  // Calculate the total from all numeric inputs
  const calculateTotal = (): number => {
    let total = 0
    for (const key in currentValues) {
      const numValue = parseFloat(currentValues[key])
      if (!isNaN(numValue)) {
        total += numValue
      }
    }
    return total
  }

  const total = calculateTotal()
  const totalLabel = question.totalLabel || "Total"
  const prefix = question.prefix || ""
  const suffix = question.suffix || ""

  // Determine if we're using groups or flat list
  const hasGroups = question.optionGroups && question.optionGroups.length > 0
  let tabIndexOffset = 0

  // Render a single option input
  const renderOptionInput = (option: typeof question.options[0], index: number) => {
    const key = optionToKey(option.value)
    const value = currentValues[key] || ""

    return (
      <div key={option.value} className="space-y-1">
        <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
          <div>
            <label htmlFor={`${question.id}-${key}`} className="text-base">
              {replacePlaceholders(option.label, responses, computedVariables)}
            </label>
            {option.hint && (
              <div className="text-sm text-muted-foreground mt-0.5">
                {replacePlaceholders(option.hint, responses, computedVariables)}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {prefix && <span className="text-muted-foreground">{prefix}</span>}
            <Input
              id={`${question.id}-${key}`}
              type="number"
              value={value}
              onChange={(e) => handleRowChange(option.value, e.target.value)}
              className="w-32 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              tabIndex={startTabIndex + index}
            />
            {suffix && <span className="text-muted-foreground whitespace-nowrap">{suffix}</span>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <QuestionWrapper question={question} responses={responses} computedVariables={computedVariables}>
      <div className="space-y-2">
        {hasGroups ? (
          <div className="space-y-4">
            {question.optionGroups!.map((group, groupIndex) => {
              const subtotal = calculateSubtotal(group.options)

              return (
                <div key={groupIndex} className="space-y-2">
                  {group.options.map((option, optionIndex) => {
                    const rendered = renderOptionInput(option, tabIndexOffset + optionIndex)
                    if (optionIndex === group.options.length - 1) {
                      tabIndexOffset += group.options.length
                    }
                    return rendered
                  })}

                  {/* Subtotal row */}
                  {group.subtotalLabel && (
                    <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
                      <div className="text-base font-medium">
                        {replacePlaceholders(group.subtotalLabel, responses, computedVariables)}
                      </div>
                      <div className="flex items-center">
                        {prefix && <span className="font-medium">{prefix}</span>}
                        <div className="w-32 text-right font-medium py-1">
                          {subtotal}
                        </div>
                        {suffix && <span className="font-medium whitespace-nowrap">{suffix}</span>}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <>
            {question.options.map((option, index) => renderOptionInput(option, index))}
          </>
        )}

        {/* Total row */}
        <div className="grid grid-cols-[1fr_auto] gap-4 items-center pt-2 mt-2 border-t border-border">
          <div className="text-base font-semibold">
            {replacePlaceholders(totalLabel, responses, computedVariables)}
          </div>
          <div className="flex items-center">
            {prefix && <span className="font-semibold text-lg">{prefix}</span>}
            <div className="w-32 text-right font-semibold text-lg py-2">
              {total}
            </div>
            {suffix && <span className="font-semibold text-lg whitespace-nowrap">{suffix}</span>}
          </div>
        </div>
      </div>
    </QuestionWrapper>
  )
}
