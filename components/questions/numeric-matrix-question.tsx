import React, { useState } from "react"
import Markdown from "react-markdown"
import { Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { QuestionWrapper } from "./shared/question-wrapper"
import { Question, Responses, Variables, ComputedVariables } from "@/lib/types"
import { evaluateCondition } from "@/lib/conditions/condition-evaluator"
import { replacePlaceholders } from "@/lib/text-processing/replacer"

interface NumericMatrixQuestionProps {
  /** The question configuration */
  question: Question
  /** User responses */
  responses: Responses
  /** User variables */
  variables: Variables
  /** Callback when user enters a value */
  onResponse: (questionId: string, value: string | string[] | number | boolean) => void
  /** Starting tab index for accessibility */
  startTabIndex: number
  /** Computed variables from the current section */
  computedVariables?: ComputedVariables
}

/**
 * Numeric matrix question component for presenting multiple questions with numeric inputs
 *
 * Features:
 * - Multiple sub-questions (rows) with numeric input fields for each column
 * - Optional column totals when showTotal is enabled
 * - Responsive table layout
 * - Proper accessibility with labels and tab indexing
 *
 * Response format:
 * - Each matrix row generates a separate response entry per column
 * - Response key format: "{subquestionId}_{columnIndex}"
 * - Response value: string representation of number
 *
 * @example
 * <NumericMatrixQuestion
 *   question={question}
 *   responses={responses}
 *   variables={variables}
 *   onResponse={handleResponse}
 *   startTabIndex={1}
 * />
 */
export function NumericMatrixQuestion({
  question,
  responses,
  variables,
  onResponse,
  startTabIndex,
  computedVariables
}: NumericMatrixQuestionProps) {
  // startTabIndex is required by interface but currently unused
  void startTabIndex

  // Track which subquestion tooltips are visible
  const [visibleTooltips, setVisibleTooltips] = useState<Set<string>>(new Set())

  const toggleTooltip = (subquestionId: string) => {
    setVisibleTooltips(prev => {
      const next = new Set(prev)
      if (next.has(subquestionId)) {
        next.delete(subquestionId)
      } else {
        next.add(subquestionId)
      }
      return next
    })
  }

  if (!question.subquestions || question.subquestions.length === 0) {
    return null
  }

  // Filter options based on conditions
  const visibleOptions = question.options.filter(option => {
    if (!option.showIf) return true
    return evaluateCondition(option.showIf, variables, computedVariables)
  })

  // If no options, create a single default column for responses
  const hasOptions = visibleOptions.length > 0
  const responseColumns = hasOptions ? visibleOptions : [{ value: "response", label: "" }]

  // Handle numeric input for a specific cell
  const handleCellResponse = (subquestionId: string, columnIndex: number, value: string) => {
    const cellId = `${subquestionId}_${columnIndex}`
    onResponse(cellId, value)
  }

  // Get current response value for a specific cell
  const getCellResponse = (subquestion: { id: string; value?: string }, columnIndex: number): string => {
    // If subquestion has a pre-filled value, use it (with placeholder replacement)
    if (subquestion.value) {
      return replacePlaceholders(subquestion.value, variables, computedVariables)
    }

    // Otherwise get from responses
    const cellId = `${subquestion.id}_${columnIndex}`
    const responseValue = responses[cellId]
    return typeof responseValue === "string" ? responseValue : String(responseValue || "")
  }

  // Calculate column total up to a specific subquestion index (inclusive)
  const calculateColumnSubtotal = (columnIndex: number, endIndex: number, startIndex: number = 0): number => {
    if (!question.subquestions) return 0

    let total = 0
    for (let i = startIndex; i <= endIndex; i++) {
      const subquestion = question.subquestions[i]
      if (!subquestion) continue

      const value = getCellResponse(subquestion, columnIndex)
      const numericValue = parseFloat(value)
      if (!isNaN(numericValue)) {
        // Subtract if the subquestion has the subtract flag, otherwise add
        if (subquestion.subtract) {
          total -= numericValue
        } else {
          total += numericValue
        }
      }
    }
    return total
  }

  // Calculate column totals
  const calculateColumnTotal = (columnIndex: number): number => {
    if (!question.subquestions) return 0
    return calculateColumnSubtotal(columnIndex, question.subquestions.length - 1)
  }

  const prefix = question.prefix || ""
  const suffix = question.suffix || ""

  return (
    <QuestionWrapper question={question} variables={variables} computedVariables={computedVariables}>
      <div className="overflow-x-auto">
        <Table>
          {hasOptions && (
            <TableHeader>
              <TableRow>
                <TableHead className="text-left font-medium"></TableHead>
                {responseColumns.map(option => (
                  <TableHead key={option.value} className="text-center text-base font-normal min-w-[120px] max-w-[160px] whitespace-normal align-bottom px-3 py-2">
                    <Markdown>
                      {replacePlaceholders(option.label, variables, computedVariables)}
                    </Markdown>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
          )}
          <TableBody>
            {question.subquestions.map((subquestion, subquestionIndex) => {
              const hasAdditionalContent = !!subquestion.subtext || (!!subquestion.tooltip && visibleTooltips.has(subquestion.id))
              const alignment = hasAdditionalContent ? "align-top" : "align-middle"

              // Find the start index for subtotal calculation (after previous subtotal or from beginning)
              let subtotalStartIndex = 0
              for (let i = subquestionIndex - 1; i >= 0; i--) {
                if (question.subquestions && question.subquestions[i].subtotalLabel) {
                  subtotalStartIndex = i + 1
                  break
                }
              }

              return (
                <React.Fragment key={subquestion.id}>
                  <TableRow>
                    <TableCell className={`${alignment} whitespace-normal`}>
                      <div className="space-y-1">
                        <div className="flex items-start gap-1">
                          {subquestion.tooltip && (
                            <button
                              type="button"
                              onClick={() => toggleTooltip(subquestion.id)}
                              className="shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
                              aria-label="Toggle additional information"
                            >
                              <Info className="w-5 h-5 text-muted-foreground" />
                            </button>
                          )}
                          <div className="flex-1 text-base font-normal">
                            <Markdown>{replacePlaceholders(subquestion.text, variables, computedVariables)}</Markdown>
                          </div>
                        </div>
                        {subquestion.subtext && (
                          <div className="text-base text-muted-foreground">
                            <Markdown>{replacePlaceholders(subquestion.subtext, variables, computedVariables)}</Markdown>
                          </div>
                        )}
                        {subquestion.tooltip && visibleTooltips.has(subquestion.id) && (
                          <div className="text-base text-muted-foreground bg-muted/50 p-3 rounded-md">
                            <Markdown>{replacePlaceholders(subquestion.tooltip, variables, computedVariables)}</Markdown>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {responseColumns.map((option, columnIndex) => (
                      <TableCell key={option.value} className="text-right align-middle">
                        <div className="flex items-center justify-end gap-1">
                          {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}
                          <Input
                            type="number"
                            value={getCellResponse(subquestion, columnIndex)}
                            onChange={(e) => handleCellResponse(subquestion.id, columnIndex, e.target.value)}
                            className="text-right w-24 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                            readOnly={!!subquestion.value}
                            disabled={!!subquestion.value}
                          />
                          {suffix && <span className="text-sm text-muted-foreground whitespace-nowrap">{suffix}</span>}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                  {subquestion.subtotalLabel && (
                    <TableRow className="font-semibold bg-muted/50">
                      <TableCell className="text-left text-base">
                        {subquestion.subtotalLabel}
                      </TableCell>
                      {responseColumns.map((option, columnIndex) => (
                        <TableCell key={option.value} className="text-right">
                          <div className="flex items-center justify-end text-base">
                            {prefix && <span>{prefix}</span>}
                            <span>{calculateColumnSubtotal(columnIndex, subquestionIndex, subtotalStartIndex)}</span>
                            {suffix && <span className="whitespace-nowrap">{suffix}</span>}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  )}
                </React.Fragment>
              )
            })}
            {question.totalLabel && (
              <TableRow className="font-semibold bg-muted/50">
                <TableCell className="text-left text-base">
                  {question.totalLabel}
                </TableCell>
                {responseColumns.map((option, columnIndex) => (
                  <TableCell key={option.value} className="text-right">
                    <div className="flex items-center justify-end text-base">
                      {prefix && <span>{prefix}</span>}
                      <span>{calculateColumnTotal(columnIndex)}</span>
                      {suffix && <span className="whitespace-nowrap">{suffix}</span>}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </QuestionWrapper>
  )
}
