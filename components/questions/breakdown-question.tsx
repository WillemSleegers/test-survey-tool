import React, { useState } from "react"
import Markdown from "react-markdown"
import { Info } from "lucide-react"
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
      // Skip excluded options
      if (option.exclude) {
        continue
      }

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

    // If totalColumn is specified, only sum values from that column
    const targetColumn = question.totalColumn

    // Only sum values from main options
    for (const option of question.options) {
      // Skip excluded options
      if (option.exclude) {
        continue
      }

      // Skip options not in the target column (if specified)
      if (targetColumn !== undefined && option.column !== targetColumn) {
        continue
      }

      const key = optionToKey(option.value)

      // Get value - either from user input or from calculated prefillValue
      let valueStr = currentValues[key] || ""
      if (!valueStr && option.prefillValue) {
        // For read-only options with VALUE, calculate the value
        valueStr = replacePlaceholders(option.prefillValue, variables, computedVariables)
      }

      const numValue = parseFloat(valueStr)
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
  const totalLabel = question.totalLabel
  const prefix = question.prefix || ""
  const suffix = question.suffix || ""

  // Determine if we're using groups or flat list
  const hasGroups = question.optionGroups && question.optionGroups.length > 0
  let tabIndexOffset = 0

  // Check if any options have subquestions
  const hasSubquestions = question.options.some(opt => opt.subquestions && opt.subquestions.length > 0)

  // Check if we're using columns
  const hasColumns = question.options.some(opt => opt.column !== undefined)

  // Group options by column if columns are used
  const optionsByColumn = new Map<number, typeof question.options>()
  if (hasColumns) {
    question.options.forEach(option => {
      const col = option.column ?? 1 // Default to column 1 if not specified
      if (!optionsByColumn.has(col)) {
        optionsByColumn.set(col, [])
      }
      optionsByColumn.get(col)!.push(option)
    })
  }

  // State for tracking which option tooltips are visible
  const [visibleTooltips, setVisibleTooltips] = useState<Set<string>>(new Set())

  const toggleTooltip = (optionValue: string) => {
    setVisibleTooltips(prev => {
      const next = new Set(prev)
      if (next.has(optionValue)) {
        next.delete(optionValue)
      } else {
        next.add(optionValue)
      }
      return next
    })
  }

  // Render a single option as table rows (main row + optional subquestion rows)
  const renderOptionRows = (option: typeof question.options[0], index: number) => {
    const key = optionToKey(option.value)

    // Determine if this option is read-only (has prefillValue)
    const isReadOnly = !!option.prefillValue

    // Use prefillValue if present (replaces placeholders on every render)
    let value = currentValues[key] || ""
    if (isReadOnly) {
      value = replacePlaceholders(option.prefillValue!, variables, computedVariables)
    }

    const optionHasSubquestions = option.subquestions && option.subquestions.length > 0
    const isTooltipVisible = visibleTooltips.has(option.value)

    return (
      <React.Fragment key={option.value}>
        {/* Main option row */}
        <TableRow>
          <TableCell className="align-middle whitespace-normal">
            <div>
              <div className="flex items-start gap-1">
                {option.tooltip && (
                  <button
                    type="button"
                    onClick={() => toggleTooltip(option.value)}
                    className="shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
                    aria-label="Toggle additional information"
                  >
                    <Info className="w-5 h-5 text-muted-foreground" />
                  </button>
                )}
                <div className="flex-1">
                  <div className="text-base">
                    <Markdown>{replacePlaceholders(option.label, variables, computedVariables)}</Markdown>
                  </div>
                  {option.hint && (
                    <div className="text-base text-muted-foreground mt-0.5">
                      <Markdown>{replacePlaceholders(option.hint, variables, computedVariables)}</Markdown>
                    </div>
                  )}
                  {option.tooltip && isTooltipVisible && (
                    <div className="text-base text-muted-foreground bg-muted/50 p-3 rounded-md mt-2">
                      <Markdown>{replacePlaceholders(option.tooltip, variables, computedVariables)}</Markdown>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TableCell>
          <TableCell className="text-right align-middle">
            <div className="flex items-center justify-end gap-1">
              {prefix && <span className="text-muted-foreground">{prefix}</span>}
              {isReadOnly ? (
                <div className="w-24 text-right py-2 font-medium">
                  {value}
                </div>
              ) : (
                <Input
                  id={`${question.id}-${key}`}
                  type="number"
                  value={value}
                  onChange={(e) => handleRowChange(option.value, e.target.value)}
                  className="w-24 text-right [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                  tabIndex={startTabIndex + index}
                />
              )}
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

  // Render column-based layout - label in first column, inputs in different columns
  const renderColumnLayout = () => {
    // Get sorted column numbers to determine number of value columns
    const columnNumbers = Array.from(optionsByColumn.keys()).sort((a, b) => a - b)
    const numColumns = columnNumbers.length

    return (
      <div className="space-y-2">
        <Table>
          <TableBody>
            {/* Render each option as a row */}
            {question.options.map((option, index) => {
              const key = optionToKey(option.value)
              const isReadOnly = !!option.prefillValue
              let value = currentValues[key] || ""
              if (isReadOnly) {
                value = replacePlaceholders(option.prefillValue!, variables, computedVariables)
              }
              const isTooltipVisible = visibleTooltips.has(option.value)
              const optionColumn = option.column ?? 1

              return (
                <TableRow key={option.value}>
                  {/* Label column (always shown) */}
                  <TableCell className="align-middle whitespace-normal">
                    <div>
                      <div className="flex items-start gap-1">
                        {option.tooltip && (
                          <button
                            type="button"
                            onClick={() => toggleTooltip(option.value)}
                            className="shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
                            aria-label="Toggle additional information"
                          >
                            <Info className="w-5 h-5 text-muted-foreground" />
                          </button>
                        )}
                        <div className="flex-1">
                          <div className="text-base">
                            <Markdown>{replacePlaceholders(option.label, variables, computedVariables)}</Markdown>
                          </div>
                          {option.hint && (
                            <div className="text-base text-muted-foreground mt-0.5">
                              <Markdown>{replacePlaceholders(option.hint, variables, computedVariables)}</Markdown>
                            </div>
                          )}
                          {option.tooltip && isTooltipVisible && (
                            <div className="text-base text-muted-foreground bg-muted/50 p-3 rounded-md mt-2">
                              <Markdown>{replacePlaceholders(option.tooltip, variables, computedVariables)}</Markdown>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Value columns - render empty cells for non-matching columns */}
                  {columnNumbers.map(colNum => (
                    <TableCell key={colNum} className="text-right align-middle">
                      {optionColumn === colNum ? (
                        <div className="flex items-center justify-end gap-1">
                          {prefix && <span className="text-muted-foreground">{prefix}</span>}
                          {isReadOnly ? (
                            <div className="w-24 text-right py-2 font-medium">
                              {value}
                            </div>
                          ) : (
                            <Input
                              id={`${question.id}-${key}`}
                              type="number"
                              value={value}
                              onChange={(e) => handleRowChange(option.value, e.target.value)}
                              className="w-24 text-right [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                              tabIndex={startTabIndex + index}
                            />
                          )}
                          {suffix && <span className="text-muted-foreground whitespace-nowrap">{suffix}</span>}
                        </div>
                      ) : null}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}

            {/* Total row */}
            {totalLabel && (
              <TableRow className="font-semibold border-t border-border">
                <TableCell className="text-base pt-4">
                  {replacePlaceholders(totalLabel, variables, computedVariables)}
                </TableCell>
                {columnNumbers.map((colNum, idx) => (
                  <TableCell key={colNum} className="text-right pt-4 py-2">
                    {/* Only show total in the last column or the totalColumn if specified */}
                    {(question.totalColumn === colNum || (!question.totalColumn && idx === columnNumbers.length - 1)) ? (
                      <>{prefix}{total}{suffix}</>
                    ) : null}
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <QuestionWrapper question={question} variables={variables} computedVariables={computedVariables}>
      <div className="space-y-2">
        {hasColumns ? (
          renderColumnLayout()
        ) : hasGroups ? (
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

            {/* Total row after all groups */}
            {totalLabel && (
              <Table>
                <TableBody>
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
        ) : (
          <Table>
            <TableBody>
              {question.options.map((option, index) => renderOptionRows(option, index))}

              {/* Total row */}
              {totalLabel && (
                <TableRow className="font-semibold border-t border-border">
                  <TableCell className="text-base pt-4">
                    {replacePlaceholders(totalLabel, variables, computedVariables)}
                  </TableCell>
                  <TableCell className="text-right pt-4 py-2">
                    {prefix}{total}{suffix}
                  </TableCell>
                  {hasSubquestions && <TableCell />}
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </QuestionWrapper>
  )
}
