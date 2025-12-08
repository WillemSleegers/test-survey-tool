import { useState } from "react"
import Markdown from "react-markdown"
import { Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { QuestionWrapper } from "./shared/question-wrapper"
import { BreakdownQuestion as BreakdownQuestionType, Responses, Variables, ComputedVariables } from "@/lib/types"
import { replacePlaceholders } from "@/lib/text-processing/replacer"

interface BreakdownQuestionProps {
  /** The question configuration */
  question: BreakdownQuestionType
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
 * - Automatic sum calculation displayed at bottom
 * - Single or multi-column layouts with COLUMN keyword
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

  // Convert option index to a string key for storage
  const optionToKey = (index: number): string => {
    return `option_${index}`
  }

  // Handle input change for a specific row
  const handleRowChange = (index: number, value: string) => {
    const key = optionToKey(index)
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

      // Find the index of this option in the original question.options array
      const index = question.options.indexOf(option)
      const key = optionToKey(index)

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

  // Calculate the total from main options only (not subquestions)
  const calculateTotal = (): number => {
    let total = 0

    // If totalColumn is specified, only sum values from that column
    const targetColumn = question.totalColumn

    // Only sum values from main options
    for (let index = 0; index < question.options.length; index++) {
      const option = question.options[index]

      // Skip excluded options
      if (option.exclude) {
        continue
      }

      // Skip options not in the target column (if specified)
      if (targetColumn !== undefined && option.column !== targetColumn) {
        continue
      }

      const key = optionToKey(index)

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
  const questionPrefix = question.prefix || ""
  const questionSuffix = question.suffix || ""

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

  // Render a single option as a table row
  const renderOptionRows = (option: typeof question.options[0], index: number) => {
    const key = optionToKey(index)

    // If this is a header row, render it without an input field
    if (option.header) {
      return (
        <TableRow key={index} className="font-bold hover:bg-transparent">
          <TableCell className="text-base pl-0 whitespace-normal" colSpan={2}>
            <Markdown>{replacePlaceholders(option.label, variables, computedVariables)}</Markdown>
          </TableCell>
        </TableRow>
      )
    }

    // If this is a separator row, render a blank row
    if (option.separator) {
      return (
        <TableRow key={index} className="hover:bg-transparent border-b-0!">
          <TableCell className="h-12 pl-0" colSpan={2}>
            {/* Blank row for spacing */}
          </TableCell>
        </TableRow>
      )
    }

    // If this is a subtotal row, calculate and render the subtotal
    if (option.subtotalLabel) {
      let subtotal: number

      // If custom calculation is provided, use it; otherwise auto-calculate
      if (option.custom) {
        const customValue = replacePlaceholders(option.custom, variables, computedVariables)
        subtotal = parseFloat(customValue) || 0
      } else {
        // Calculate subtotal from the last subtotal/header (or start) to current position
        const optionIndex = question.options.indexOf(option)
        let startIndex = 0

        // Find the last subtotal or header before this one
        for (let i = optionIndex - 1; i >= 0; i--) {
          if (question.options[i].subtotalLabel || question.options[i].header) {
            startIndex = i + 1
            break
          }
        }

        const optionsToSum = question.options.slice(startIndex, optionIndex)
        subtotal = calculateSubtotal(optionsToSum)
      }

      const isTooltipVisible = visibleTooltips.has(option.value)
      const prefix = option.prefix ?? questionPrefix
      const suffix = option.suffix ?? questionSuffix

      return (
        <TableRow key={index} className="font-bold hover:bg-transparent">
          <TableCell className="align-middle whitespace-normal text-base pl-0">
            <div className="relative">
              {option.tooltip && (
                <button
                  type="button"
                  onClick={() => toggleTooltip(option.value)}
                  className="absolute -left-8 top-0 shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
                  aria-label="Toggle additional information"
                >
                  <Info className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
              <div>
                <div className="text-base">
                  <Markdown>{replacePlaceholders(option.subtotalLabel, variables, computedVariables)}</Markdown>
                </div>
                {option.hint && (
                  <div className="text-base text-muted-foreground mt-0.5 font-normal">
                    <Markdown>{replacePlaceholders(option.hint, variables, computedVariables)}</Markdown>
                  </div>
                )}
                {option.tooltip && isTooltipVisible && (
                  <div className="text-base text-muted-foreground bg-muted p-3 rounded-md mt-2 font-normal">
                    <Markdown>{replacePlaceholders(option.tooltip, variables, computedVariables)}</Markdown>
                  </div>
                )}
              </div>
            </div>
          </TableCell>
          <TableCell className="text-right py-1">
            {prefix}{subtotal}{suffix}
          </TableCell>
        </TableRow>
      )
    }

    // Determine if this option is read-only (has prefillValue)
    const isReadOnly = !!option.prefillValue

    // Use prefillValue if present (replaces placeholders on every render)
    let value = currentValues[key] || ""
    if (isReadOnly) {
      value = replacePlaceholders(option.prefillValue!, variables, computedVariables)
    }

    const isTooltipVisible = visibleTooltips.has(option.value)
    const prefix = option.prefix ?? questionPrefix
    const suffix = option.suffix ?? questionSuffix

    return (
      <TableRow key={index} className="hover:bg-transparent">
        <TableCell className="align-middle whitespace-normal pl-0">
          <div className="relative">
            {option.tooltip && (
              <button
                type="button"
                onClick={() => toggleTooltip(option.value)}
                className="absolute -left-8 top-0 shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
                aria-label="Toggle additional information"
              >
                <Info className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
            <div>
              <div className="text-base">
                <Markdown>{replacePlaceholders(option.label, variables, computedVariables)}</Markdown>
              </div>
              {option.hint && (
                <div className="text-base text-muted-foreground mt-0.5 font-normal">
                  <Markdown>{replacePlaceholders(option.hint, variables, computedVariables)}</Markdown>
                </div>
              )}
              {option.tooltip && isTooltipVisible && (
                <div className="text-base text-muted-foreground bg-muted p-3 rounded-md mt-2 font-normal">
                  <Markdown>{replacePlaceholders(option.tooltip, variables, computedVariables)}</Markdown>
                </div>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell className="text-right align-middle">
          {isReadOnly ? (
            <div className="flex items-center justify-end text-muted-foreground">
              {prefix}{value}{suffix}
            </div>
          ) : (
            <div className="flex items-center justify-end gap-1">
              {prefix && <span className="text-muted-foreground">{prefix}</span>}
              <Input
                id={`${question.id}-${key}`}
                type="number"
                value={value}
                onChange={(e) => handleRowChange(index, e.target.value)}
                className={`w-24 ${suffix ? 'text-right' : 'text-left'} [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]`}
                tabIndex={startTabIndex + index}
              />
              {suffix && <span className="text-muted-foreground whitespace-nowrap">{suffix}</span>}
            </div>
          )}
        </TableCell>
      </TableRow>
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
              // If this is a header row, render it without input fields
              if (option.header) {
                return (
                  <TableRow key={index} className="font-bold hover:bg-transparent">
                    <TableCell className="text-base pl-0 whitespace-normal" colSpan={numColumns + 1}>
                      <Markdown>{replacePlaceholders(option.label, variables, computedVariables)}</Markdown>
                    </TableCell>
                  </TableRow>
                )
              }

              // If this is a separator row, render a blank row
              if (option.separator) {
                return (
                  <TableRow key={index} className="hover:bg-transparent border-b-0!">
                    <TableCell className="h-12 pl-0" colSpan={numColumns + 1}>
                      {/* Blank row for spacing */}
                    </TableCell>
                  </TableRow>
                )
              }

              // If this is a subtotal row, calculate and render the subtotal
              if (option.subtotalLabel) {
                let subtotal: number

                // If custom calculation is provided, use it; otherwise auto-calculate
                if (option.custom) {
                  const customValue = replacePlaceholders(option.custom, variables, computedVariables)
                  subtotal = parseFloat(customValue) || 0
                } else {
                  // Calculate subtotal from the last subtotal/header (or start) to current position
                  let startIndex = 0
                  for (let i = index - 1; i >= 0; i--) {
                    if (question.options[i].subtotalLabel || question.options[i].header) {
                      startIndex = i + 1
                      break
                    }
                  }

                  const optionsToSum = question.options.slice(startIndex, index)
                  subtotal = calculateSubtotal(optionsToSum)
                }

                // Determine which column to show the subtotal in - use option.column if specified, otherwise last column
                const subtotalCol = option.column ?? columnNumbers[columnNumbers.length - 1]
                const isTooltipVisible = visibleTooltips.has(option.value)
                const prefix = option.prefix ?? questionPrefix
                const suffix = option.suffix ?? questionSuffix

                return (
                  <TableRow key={index} className="font-bold hover:bg-transparent">
                    <TableCell className="align-middle whitespace-normal text-base pl-0">
                      <div className="relative">
                        {option.tooltip && (
                          <button
                            type="button"
                            onClick={() => toggleTooltip(option.value)}
                            className="absolute -left-8 top-0 shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
                            aria-label="Toggle additional information"
                          >
                            <Info className="w-5 h-5 text-muted-foreground" />
                          </button>
                        )}
                        <div>
                          <div className="text-base">
                            <Markdown>{replacePlaceholders(option.subtotalLabel, variables, computedVariables)}</Markdown>
                          </div>
                          {option.hint && (
                            <div className="text-base text-muted-foreground mt-0.5 font-normal">
                              <Markdown>{replacePlaceholders(option.hint, variables, computedVariables)}</Markdown>
                            </div>
                          )}
                          {option.tooltip && isTooltipVisible && (
                            <div className="text-base text-muted-foreground bg-muted p-3 rounded-md mt-2 font-normal">
                              <Markdown>{replacePlaceholders(option.tooltip, variables, computedVariables)}</Markdown>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    {columnNumbers.map((colNum) => (
                      <TableCell key={colNum} className="text-right py-1">
                        {colNum === subtotalCol ? `${prefix}${subtotal}${suffix}` : null}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              }

              const key = optionToKey(index)
              const isReadOnly = !!option.prefillValue
              let value = currentValues[key] || ""
              if (isReadOnly) {
                value = replacePlaceholders(option.prefillValue!, variables, computedVariables)
              }
              const isTooltipVisible = visibleTooltips.has(option.value)
              const optionColumn = option.column ?? 1
              const prefix = option.prefix ?? questionPrefix
              const suffix = option.suffix ?? questionSuffix

              return (
                <TableRow key={index} className="hover:bg-transparent">
                  {/* Label column (always shown) */}
                  <TableCell className="align-middle whitespace-normal pl-0">
                    <div className="relative">
                      {option.tooltip && (
                        <button
                          type="button"
                          onClick={() => toggleTooltip(option.value)}
                          className="absolute -left-8 top-0 shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
                          aria-label="Toggle additional information"
                        >
                          <Info className="w-5 h-5 text-muted-foreground" />
                        </button>
                      )}
                      <div>
                        <div className="text-base">
                          <Markdown>{replacePlaceholders(option.label, variables, computedVariables)}</Markdown>
                        </div>
                        {option.hint && (
                          <div className="text-base text-muted-foreground mt-0.5">
                            <Markdown>{replacePlaceholders(option.hint, variables, computedVariables)}</Markdown>
                          </div>
                        )}
                        {option.tooltip && isTooltipVisible && (
                          <div className="text-base text-muted-foreground bg-muted p-3 rounded-md mt-2">
                            <Markdown>{replacePlaceholders(option.tooltip, variables, computedVariables)}</Markdown>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Value columns - render empty cells for non-matching columns */}
                  {columnNumbers.map(colNum => (
                    <TableCell key={colNum} className="text-right align-middle">
                      {optionColumn === colNum ? (
                        isReadOnly ? (
                          <div className="flex items-center justify-end text-muted-foreground">
                            {prefix}{value}{suffix}
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            {prefix && <span className="text-muted-foreground">{prefix}</span>}
                            <Input
                              id={`${question.id}-${key}`}
                              type="number"
                              value={value}
                              onChange={(e) => handleRowChange(index, e.target.value)}
                              className={`w-24 ${suffix ? 'text-right' : 'text-left'} [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]`}
                              tabIndex={startTabIndex + index}
                            />
                            {suffix && <span className="text-muted-foreground whitespace-nowrap">{suffix}</span>}
                          </div>
                        )
                      ) : null}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}

            {/* Total row */}
            {totalLabel && (
              <TableRow className="font-bold border-t border-border">
                <TableCell className="text-base pt-4 pl-0 whitespace-normal">
                  {replacePlaceholders(totalLabel, variables, computedVariables)}
                </TableCell>
                {columnNumbers.map((colNum, idx) => (
                  <TableCell key={colNum} className="text-right pt-4 py-2">
                    {/* Only show total in the last column or the totalColumn if specified */}
                    {(question.totalColumn === colNum || (!question.totalColumn && idx === columnNumbers.length - 1)) ? (
                      <>{questionPrefix}{total}{questionSuffix}</>
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
        ) : (
          <Table>
            <TableBody>
              {question.options.map((option, index) => renderOptionRows(option, index))}

              {/* Total row */}
              {totalLabel && (
                <TableRow className="font-semibold border-t border-border">
                  <TableCell className="text-base pt-4 pl-0 whitespace-normal">
                    {replacePlaceholders(totalLabel, variables, computedVariables)}
                  </TableCell>
                  <TableCell className="text-right pt-4 py-2">
                    {questionPrefix}{total}{questionSuffix}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </QuestionWrapper>
  )
}
