import React from "react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { QuestionWrapper } from "./shared/question-wrapper"
import { Question, Responses, ComputedVariables } from "@/lib/types"
import { evaluateCondition } from "@/lib/conditions/condition-evaluator"
import { replacePlaceholders } from "@/lib/text-processing/replacer"

interface MatrixQuestionProps {
  /** The question configuration */
  question: Question
  /** User responses */
  responses: Responses
  /** Callback when user selects an option */
  onResponse: (
    questionId: string,
    value: string | string[] | Record<string, string | string[]>
  ) => void
  /** Starting tab index for accessibility */
  startTabIndex: number
  /** Computed variables from the current section */
  computedVariables?: ComputedVariables
}

/**
 * Matrix question component for presenting multiple questions with shared options
 *
 * Features:
 * - Multiple sub-questions (rows) sharing the same response options (columns)
 * - Each row is an independent radio group
 * - Responsive table layout
 * - Proper accessibility with labels and tab indexing
 *
 * Response format:
 * - Each matrix row generates a separate response entry
 * - Response key format: "{questionId}_{rowId}"
 * - Response value: selected option value
 *
 * @example
 * <MatrixQuestion
 *   question={question}
 *   responses={responses}
 *   onResponse={handleResponse}
 *   startTabIndex={1}
 * />
 */
export function MatrixQuestion({
  question,
  responses,
  onResponse,
  startTabIndex: _startTabIndex, // eslint-disable-line @typescript-eslint/no-unused-vars
  computedVariables,
}: MatrixQuestionProps) {
  if (!question.matrixRows || question.matrixRows.length === 0) {
    return null
  }

  // Filter options based on conditions
  const visibleOptions = question.options.filter((option) => {
    if (!option.showIf) return true
    return evaluateCondition(option.showIf, responses, computedVariables)
  })

  // Determine if this matrix should use checkboxes or radio buttons
  const isCheckboxMatrix = question.inputType === "checkbox"

  // Handle option selection for a matrix row
  const handleRowResponse = (rowId: string, value: string) => {
    const currentResponse = responses[question.id]?.value
    const existingResponses =
      typeof currentResponse === "object" &&
      currentResponse !== null &&
      !Array.isArray(currentResponse)
        ? (currentResponse as Record<string, string | string[]>)
        : {}

    if (isCheckboxMatrix) {
      // For checkboxes, handle multiple selections
      const currentValues = Array.isArray(existingResponses[rowId])
        ? (existingResponses[rowId] as string[])
        : typeof existingResponses[rowId] === "string"
        ? [existingResponses[rowId] as string]
        : []

      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value) // Remove if already selected
        : [...currentValues, value] // Add if not selected

      if (newValues.length > 0) {
        existingResponses[rowId] = newValues
      } else {
        delete existingResponses[rowId]
      }
    } else {
      // For radio buttons, single selection
      existingResponses[rowId] = value
    }

    onResponse(question.id, existingResponses)
  }

  // Get current response for a matrix row from the object format
  const getRowResponse = (rowId: string): string | string[] => {
    const responseValue = responses[question.id]?.value

    if (
      typeof responseValue === "object" &&
      responseValue !== null &&
      !Array.isArray(responseValue)
    ) {
      const matrixResponses = responseValue as Record<string, string | string[]>
      const rowValue = matrixResponses[rowId]

      if (isCheckboxMatrix) {
        return Array.isArray(rowValue) ? rowValue : rowValue ? [rowValue] : []
      } else {
        return Array.isArray(rowValue) ? rowValue[0] || "" : rowValue || ""
      }
    }

    return isCheckboxMatrix ? [] : ""
  }

  // Check if a specific option is selected for a matrix row
  const isOptionSelected = (rowId: string, optionValue: string): boolean => {
    const currentResponse = getRowResponse(rowId)

    if (isCheckboxMatrix) {
      return (
        Array.isArray(currentResponse) && currentResponse.includes(optionValue)
      )
    } else {
      return currentResponse === optionValue
    }
  }

  return (
    <QuestionWrapper
      question={question}
      responses={responses}
      computedVariables={computedVariables}
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left font-medium"></TableHead>
              {visibleOptions.map((option) => (
                <TableHead
                  key={option.value}
                  className="text-center font-normal text-base min-w-20 whitespace-normal py-2"
                >
                  {replacePlaceholders(
                    option.label,
                    responses,
                    computedVariables
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {question.matrixRows.map((row) => {
              const currentRowResponse = getRowResponse(row.id)
              const currentValue =
                !isCheckboxMatrix && typeof currentRowResponse === "string"
                  ? currentRowResponse
                  : ""

              return (
                <TableRow key={row.id}>
                  <TableCell className="align-top max-w-md">
                    <Label className="text-base font-normal whitespace-normal">
                      {replacePlaceholders(
                        row.text,
                        responses,
                        computedVariables
                      )}
                    </Label>
                  </TableCell>
                  {isCheckboxMatrix
                    ? // For checkboxes, render each option independently
                      visibleOptions.map((option, optionIndex) => (
                        <TableCell
                          key={option.value}
                          className="text-center align-top"
                        >
                          <div className="flex justify-center">
                            <Checkbox
                              id={`${question.id}-${row.id}-${optionIndex}`}
                              checked={isOptionSelected(row.id, option.value)}
                              onCheckedChange={() =>
                                handleRowResponse(row.id, option.value)
                              }
                            />
                            <Label
                              htmlFor={`${question.id}-${row.id}-${optionIndex}`}
                              className="sr-only"
                            >
                              {row.text}: {option.label}
                            </Label>
                          </div>
                        </TableCell>
                      ))
                    : // For radio buttons, render each option with native radio styling but shadcn appearance
                      visibleOptions.map(
                        (
                          option,
                          _optionIndex // eslint-disable-line @typescript-eslint/no-unused-vars
                        ) => (
                          <TableCell
                            key={option.value}
                            className="text-center align-top"
                          >
                            <div className="flex justify-center">
                              <label className="cursor-pointer">
                                <input
                                  type="radio"
                                  name={`${question.id}_${row.id}`}
                                  value={option.value}
                                  checked={currentValue === option.value}
                                  onChange={(e) =>
                                    handleRowResponse(row.id, e.target.value)
                                  }
                                  className="peer sr-only"
                                />
                                <div className="border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 peer-aria-invalid:ring-destructive/20 dark:peer-aria-invalid:ring-destructive/40 peer-aria-invalid:border-destructive dark:bg-input/30 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none peer-focus-visible:ring-[3px] peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center">
                                  {currentValue === option.value && (
                                    <div className="size-2 bg-primary-foreground rounded-full" />
                                  )}
                                </div>
                                <span className="sr-only">
                                  {row.text}: {option.label}
                                </span>
                              </label>
                            </div>
                          </TableCell>
                        )
                      )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </QuestionWrapper>
  )
}
