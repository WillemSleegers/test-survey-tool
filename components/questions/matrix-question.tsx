import React, { useState } from "react"
import Markdown from "react-markdown"
import { Info } from "lucide-react"
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
import { Question, Responses, Variables, ComputedVariables } from "@/lib/types"
import { evaluateCondition } from "@/lib/conditions/condition-evaluator"
import { replacePlaceholders } from "@/lib/text-processing/replacer"

interface MatrixQuestionProps {
  /** The question configuration */
  question: Question
  /** User responses */
  responses: Responses
  /** User variables */
  variables: Variables
  /** Callback when user selects an option */
  onResponse: (
    questionId: string,
    value: string | string[] | number | boolean
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
  variables,
  onResponse,
  startTabIndex,
  computedVariables,
}: MatrixQuestionProps) {
  // startTabIndex is required by interface but currently unused - matrix questions use default tab behavior
  void startTabIndex

  // Track which subquestion tooltips are visible
  const [visibleTooltips, setVisibleTooltips] = useState<Set<string>>(new Set())

  const toggleTooltip = (subquestionId: string) => {
    setVisibleTooltips((prev) => {
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
  const visibleOptions = question.options.filter((option) => {
    if (!option.showIf) return true
    return evaluateCondition(option.showIf, variables, computedVariables)
  })

  // If no options, create a single default option for the response column
  const hasOptions = visibleOptions.length > 0
  const responseOptions = hasOptions
    ? visibleOptions
    : [{ value: "response", label: "" }]

  // Determine if this matrix should use checkboxes or radio buttons
  const isCheckboxMatrix = question.inputType === "checkbox"

  // Handle option selection for a matrix row
  const handleRowResponse = (subquestionId: string, value: string) => {
    // Always save response for this subquestion
    if (isCheckboxMatrix) {
      // For checkboxes, handle multiple selections
      const currentValues = Array.isArray(responses[subquestionId])
        ? (responses[subquestionId] as string[])
        : typeof responses[subquestionId] === "string"
        ? [responses[subquestionId] as string]
        : []

      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value) // Remove if already selected
        : [...currentValues, value] // Add if not selected

      onResponse(subquestionId, newValues)
    } else {
      // For radio buttons, single selection
      onResponse(subquestionId, value)
    }
  }

  // Get current response value for a matrix subquestion
  const getRowResponse = (subquestionId: string): string | string[] => {
    const responseValue = responses[subquestionId]

    if (isCheckboxMatrix) {
      return Array.isArray(responseValue)
        ? responseValue
        : responseValue
        ? [String(responseValue)]
        : []
    } else {
      return Array.isArray(responseValue)
        ? String(responseValue[0] || "")
        : String(responseValue || "")
    }
  }

  // Check if a specific option is selected for a matrix subquestion
  const isOptionSelected = (
    subquestionId: string,
    optionValue: string
  ): boolean => {
    const currentResponse = getRowResponse(subquestionId)

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
      variables={variables}
      computedVariables={computedVariables}
    >
      <div className="overflow-x-auto">
        <Table>
          {hasOptions && (
            <TableHeader>
              <TableRow>
                <TableHead className="text-left font-medium"></TableHead>
                {responseOptions.map((option) => (
                  <TableHead
                    key={option.value}
                    className="text-center text-base font-normal min-w-20 max-w-[120px] whitespace-normal align-bottom px-3 py-2"
                  >
                    <Markdown>
                      {replacePlaceholders(
                        option.label,
                        variables,
                        computedVariables
                      )}
                    </Markdown>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
          )}
          <TableBody>
            {question.subquestions.map((subquestion) => {
              const currentRowResponse = getRowResponse(subquestion.id)
              const currentValue =
                !isCheckboxMatrix && typeof currentRowResponse === "string"
                  ? currentRowResponse
                  : ""

              const hasAdditionalContent =
                !!subquestion.subtext ||
                (!!subquestion.tooltip && visibleTooltips.has(subquestion.id))
              const alignment = hasAdditionalContent
                ? "align-top"
                : "align-middle"

              return (
                <TableRow key={subquestion.id}>
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
                          <Markdown>
                            {replacePlaceholders(
                              subquestion.text,
                              variables,
                              computedVariables
                            )}
                          </Markdown>
                        </div>
                      </div>
                      {subquestion.subtext && (
                        <div className="text-base text-muted-foreground">
                          <Markdown>
                            {replacePlaceholders(
                              subquestion.subtext,
                              variables,
                              computedVariables
                            )}
                          </Markdown>
                        </div>
                      )}
                      {subquestion.tooltip &&
                        visibleTooltips.has(subquestion.id) && (
                          <div className="text-base text-muted-foreground bg-muted/50 p-3 rounded-md">
                            <Markdown>
                              {replacePlaceholders(
                                subquestion.tooltip,
                                variables,
                                computedVariables
                              )}
                            </Markdown>
                          </div>
                        )}
                    </div>
                  </TableCell>
                  {isCheckboxMatrix
                    ? // For checkboxes, render each option independently
                      responseOptions.map((option, optionIndex) => (
                        <TableCell
                          key={option.value}
                          className="text-center align-middle"
                        >
                          <div className="flex justify-center">
                            <Checkbox
                              id={`${question.id}-${subquestion.id}-${optionIndex}`}
                              checked={isOptionSelected(
                                subquestion.id,
                                option.value
                              )}
                              onCheckedChange={() =>
                                handleRowResponse(subquestion.id, option.value)
                              }
                            />
                            <Label
                              htmlFor={`${question.id}-${subquestion.id}-${optionIndex}`}
                              className="sr-only"
                            >
                              {subquestion.text}
                              {option.label ? `: ${option.label}` : ""}
                            </Label>
                          </div>
                        </TableCell>
                      ))
                    : // For radio buttons, render each option with native radio styling but shadcn appearance
                      responseOptions.map((option) => (
                        <TableCell
                          key={option.value}
                          className="text-center align-middle"
                        >
                          <div className="flex justify-center">
                            <label className="cursor-pointer">
                              <input
                                type="radio"
                                name={`${question.id}_${subquestion.id}`}
                                value={option.value}
                                checked={currentValue === option.value}
                                onChange={(e) =>
                                  handleRowResponse(
                                    subquestion.id,
                                    e.target.value
                                  )
                                }
                                className="peer sr-only"
                              />
                              <div className="border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 peer-aria-invalid:ring-destructive/20 dark:peer-aria-invalid:ring-destructive/40 peer-aria-invalid:border-destructive dark:bg-input/30 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none peer-focus-visible:ring-[3px] peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center">
                                {currentValue === option.value && (
                                  <div className="size-2 bg-primary-foreground rounded-full" />
                                )}
                              </div>
                              <span className="sr-only">
                                {subquestion.text}
                                {option.label ? `: ${option.label}` : ""}
                              </span>
                            </label>
                          </div>
                        </TableCell>
                      ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </QuestionWrapper>
  )
}
