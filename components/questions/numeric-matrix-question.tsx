import React from "react"
import Markdown from "react-markdown"
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

  if (!question.subquestions || question.subquestions.length === 0) {
    return null
  }

  // Filter options based on conditions
  const visibleOptions = question.options.filter(option => {
    if (!option.showIf) return true
    return evaluateCondition(option.showIf, variables, computedVariables)
  })

  // Handle numeric input for a specific cell
  const handleCellResponse = (subquestionId: string, columnIndex: number, value: string) => {
    const cellId = `${subquestionId}_${columnIndex}`
    onResponse(cellId, value)
  }

  // Get current response value for a specific cell
  const getCellResponse = (subquestionId: string, columnIndex: number): string => {
    const cellId = `${subquestionId}_${columnIndex}`
    const responseValue = responses[cellId]
    return typeof responseValue === "string" ? responseValue : String(responseValue || "")
  }

  // Calculate column totals
  const calculateColumnTotal = (columnIndex: number): number => {
    if (!question.subquestions) return 0

    let total = 0
    for (const subquestion of question.subquestions) {
      const value = getCellResponse(subquestion.id, columnIndex)
      const numericValue = parseFloat(value)
      if (!isNaN(numericValue)) {
        total += numericValue
      }
    }
    return total
  }

  return (
    <QuestionWrapper question={question} variables={variables} computedVariables={computedVariables}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left font-medium w-1/2 max-w-xs"></TableHead>
              {visibleOptions.map(option => (
                <TableHead key={option.value} className="text-center text-base font-normal min-w-[120px] max-w-[160px] whitespace-normal align-bottom px-3 py-2">
                  <Markdown>
                    {replacePlaceholders(option.label, variables, computedVariables)}
                  </Markdown>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {question.subquestions.map((subquestion) => (
              <TableRow key={subquestion.id}>
                <TableCell className="align-top w-1/2 max-w-xs whitespace-normal">
                  <div className="text-base font-normal">
                    <Markdown>{replacePlaceholders(subquestion.text, variables, computedVariables)}</Markdown>
                  </div>
                  {subquestion.subtext && (
                    <div className="text-sm text-muted-foreground mt-1">
                      <Markdown>{replacePlaceholders(subquestion.subtext, variables, computedVariables)}</Markdown>
                    </div>
                  )}
                </TableCell>
                {visibleOptions.map((option, columnIndex) => (
                  <TableCell key={option.value} className="text-center align-middle">
                    <Input
                      type="number"
                      value={getCellResponse(subquestion.id, columnIndex)}
                      onChange={(e) => handleCellResponse(subquestion.id, columnIndex, e.target.value)}
                      className="text-center"
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {question.totalLabel && (
              <TableRow className="font-semibold bg-muted/50">
                <TableCell className="text-left">
                  {question.totalLabel}
                </TableCell>
                {visibleOptions.map((option, columnIndex) => (
                  <TableCell key={option.value} className="text-center">
                    {calculateColumnTotal(columnIndex).toFixed(2)}
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
