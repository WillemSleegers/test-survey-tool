import React from "react"
import Markdown from "react-markdown"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { QuestionWrapper } from "./shared/question-wrapper"
import { Question, Responses, Variables, ComputedVariables } from "@/lib/types"
import { replacePlaceholders } from "@/lib/text-processing/replacer"

interface BreakdownQuestionProps {
  /** The question configuration */
  question: Question
  /** User responses */
  responses: Responses
  /** User variables */
  variables: Variables
  /** Callback when user enters a number */
  onResponse: (questionId: string, value: Record<string, string>) => void
  /** Starting tab index for accessibility */
  startTabIndex: number
  /** Computed variables from the current section */
  computedVariables?: ComputedVariables
}

/**
 * Breakdown question component for collecting multiple number inputs with automatic total
 *
 * Features:
 * - Multiple number input rows based on options
 * - Support for subquestions that break down each option
 * - Automatic sum calculation displayed at bottom
 * - Two or three column layout depending on subquestions
 * - Individual row responses stored separately
 * - Optional total label customization
 *
 * Response format:
 * - Stored as Record<string, string> where keys are option values (slugified)
 * - Each row's input is stored separately
 * - Total is calculated, not stored
 *
 * @example
 * <BreakdownQuestion
 *   question={question}
 *   responses={responses}
 *   onResponse={handleResponse}
 *   startTabIndex={1}
 * />
 */
export function BreakdownQuestion({
  question,
  responses,
  variables,
  onResponse,
  startTabIndex,
  computedVariables
}: BreakdownQuestionProps) {
  // Get current responses (should be object with row IDs as keys)
  const responseValue = responses[question.id]
  const currentValues = (typeof responseValue === "object" && responseValue !== null && !Array.isArray(responseValue))
    ? responseValue as Record<string, string>
    : {}

  // Convert option label to a slug for use as a key
  const optionToKey = (optionValue: string): string => {
    return optionValue.toLowerCase().replace(/[^a-z0-9]/g, '_')
  }

  // Convert subquestion ID to key
  const subquestionToKey = (subquestionId: string): string => {
    return subquestionId.toLowerCase().replace(/[^a-z0-9]/g, '_')
  }

  // Handle input change for a specific row (main option)
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

  // Handle input change for a subquestion
  const handleSubquestionChange = (subquestionId: string, value: string) => {
    const key = subquestionToKey(subquestionId)
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
        // Subtract if the option has the subtract flag, otherwise add
        if (option.subtract) {
          total -= numValue
        } else {
          total += numValue
        }
      }
    }
    return total
  }

  // Calculate the total from main options only (not subquestions)
  const calculateTotal = (): number => {
    let total = 0

    // Only sum values from main options
    for (const option of question.options) {
      const key = optionToKey(option.value)
      const numValue = parseFloat(currentValues[key] || "")
      if (!isNaN(numValue)) {
        // Subtract if the option has the subtract flag, otherwise add
        if (option.subtract) {
          total -= numValue
        } else {
          total += numValue
        }
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

  // Check if any options have subquestions
  const hasSubquestions = question.options.some(opt => opt.subquestions && opt.subquestions.length > 0)

  // Render a single option as table rows (main row + optional subquestion rows)
  const renderOptionRows = (option: typeof question.options[0], index: number) => {
    const key = optionToKey(option.value)
    const value = currentValues[key] || ""
    const optionHasSubquestions = option.subquestions && option.subquestions.length > 0

    return (
      <React.Fragment key={option.value}>
        {/* Main option row */}
        <TableRow>
          <TableCell className="align-middle whitespace-normal">
            <div>
              <div className="text-base">
                <Markdown>{replacePlaceholders(option.label, variables, computedVariables)}</Markdown>
              </div>
              {option.hint && (
                <div className="text-base text-muted-foreground mt-0.5">
                  <Markdown>{replacePlaceholders(option.hint, variables, computedVariables)}</Markdown>
                </div>
              )}
            </div>
          </TableCell>
          <TableCell className="text-right align-middle">
            <div className="flex items-center justify-end gap-1">
              {prefix && <span className="text-muted-foreground">{prefix}</span>}
              <Input
                id={`${question.id}-${key}`}
                type="number"
                value={value}
                onChange={(e) => handleRowChange(option.value, e.target.value)}
                className="w-24 text-right [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                tabIndex={startTabIndex + index}
              />
              {suffix && <span className="text-muted-foreground whitespace-nowrap">{suffix}</span>}
            </div>
          </TableCell>
          {hasSubquestions && <TableCell className="text-right align-middle" />}
        </TableRow>

        {/* Subquestion rows (indented, with input in column 2) */}
        {optionHasSubquestions && option.subquestions!.map((subquestion) => {
          const sqKey = subquestionToKey(subquestion.id)
          const sqValue = currentValues[sqKey] || ""

          return (
            <TableRow key={subquestion.id}>
              <TableCell className="align-middle whitespace-normal pl-8">
                <div className="text-base">
                  <Markdown>{replacePlaceholders(subquestion.text, variables, computedVariables)}</Markdown>
                </div>
              </TableCell>
              <TableCell className="text-right align-middle" />
              <TableCell className="text-right align-middle">
                <div className="flex items-center justify-end gap-1">
                  {prefix && <span>{prefix}</span>}
                  <Input
                    id={`${question.id}-${sqKey}`}
                    type="number"
                    value={sqValue}
                    onChange={(e) => handleSubquestionChange(subquestion.id, e.target.value)}
                    className="w-24 text-right [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                  {suffix && <span className="whitespace-nowrap">{suffix}</span>}
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </React.Fragment>
    )
  }

  return (
    <QuestionWrapper question={question} variables={variables} computedVariables={computedVariables}>
      <div className="space-y-2">
        {hasGroups ? (
          <div className="space-y-4">
            {question.optionGroups!.map((group, groupIndex) => {
              const subtotal = calculateSubtotal(group.options)

              return (
                <div key={groupIndex} className="space-y-2">
                  <Table>
                    <TableBody>
                      {group.options.map((option, optionIndex) => {
                        const rendered = renderOptionRows(option, tabIndexOffset + optionIndex)
                        if (optionIndex === group.options.length - 1) {
                          tabIndexOffset += group.options.length
                        }
                        return rendered
                      })}

                      {/* Subtotal row */}
                      {group.subtotalLabel && (
                        <TableRow className="font-medium">
                          <TableCell className="text-base">
                            {replacePlaceholders(group.subtotalLabel, variables, computedVariables)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {prefix && <span>{prefix}</span>}
                              <div className="w-24 text-right py-1">
                                {subtotal}
                              </div>
                              {suffix && <span className="whitespace-nowrap">{suffix}</span>}
                            </div>
                          </TableCell>
                          {hasSubquestions && <TableCell />}
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )
            })}
          </div>
        ) : (
          <Table>
            <TableBody>
              {question.options.map((option, index) => renderOptionRows(option, index))}

              {/* Total row */}
              <TableRow className="font-semibold border-t border-border">
                <TableCell className="text-base pt-4">
                  {replacePlaceholders(totalLabel, variables, computedVariables)}
                </TableCell>
                <TableCell className="text-right pt-4 py-2">
                  {prefix}{total}{suffix}
                </TableCell>
                {hasSubquestions && <TableCell />}
              </TableRow>
            </TableBody>
          </Table>
        )}
      </div>
    </QuestionWrapper>
  )
}
