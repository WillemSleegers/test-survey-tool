import { BreakdownOption, BreakdownQuestion, Variables, ComputedValues } from "@/lib/types"
import { evaluateCondition } from "@/lib/conditions/condition-evaluator"
import { replacePlaceholders } from "@/lib/text-processing/replacer"

export type VisibleBreakdownOption = {
  option: BreakdownOption
  index: number
}

/**
 * Returns the breakdown options whose SHOW_IF condition passes, each paired
 * with its original index so `option_N` response keys stay stable when
 * visibility changes.
 */
export function getVisibleBreakdownOptions(
  question: BreakdownQuestion,
  variables: Variables,
  computedVariables?: ComputedValues
): VisibleBreakdownOption[] {
  return question.options
    .map((option, index) => ({ option, index }))
    .filter(
      ({ option }) =>
        !option.showIf || evaluateCondition(option.showIf, variables, computedVariables)
    )
}

/**
 * Sums a set of visible breakdown options, resolving prefill values and
 * respecting EXCLUDE/SUBTRACT. Hidden options should already be filtered out
 * of `options` (see getVisibleBreakdownOptions) so they never contribute.
 */
export function sumBreakdownOptions(
  options: VisibleBreakdownOption[],
  values: Record<string, string>,
  variables: Variables,
  computedVariables?: ComputedValues
): number {
  let total = 0
  for (const { option, index } of options) {
    if (option.exclude) continue

    const key = `option_${index}`
    let valueStr = values[key] || ""
    if (!valueStr && option.prefillValue) {
      valueStr = replacePlaceholders(option.prefillValue, variables, computedVariables)
    }

    const numValue = parseFloat(valueStr)
    if (!isNaN(numValue)) {
      total += option.subtract ? -numValue : numValue
    }
  }
  return total
}

/** Display value for each subtotal row, keyed by option index; null means unavailable (e.g. an unresolved CUSTOM formula). */
export type SubtotalDisplayValues = Map<number, number | null>

/**
 * Computes every subtotal row's value in one pass that doesn't depend on
 * table order: plain range-sum subtotals are computed first (they only sum
 * option values, never other subtotals), so a CUSTOM subtotal can reference
 * any plain subtotal's variable regardless of whether it appears above or
 * below it. CUSTOM subtotals are then resolved in declaration order, so a
 * CUSTOM may still chain off an earlier CUSTOM.
 */
export function computeSubtotalValues(
  question: BreakdownQuestion,
  responseValue: Record<string, string>,
  variables: Variables,
  computedVariables?: ComputedValues
): SubtotalDisplayValues {
  const visibleOptions = getVisibleBreakdownOptions(question, variables, computedVariables)

  const rangeSum = (optionIndex: number): number => {
    let startIndex = 0
    for (let i = optionIndex - 1; i >= 0; i--) {
      if (question.options[i].subtotalLabel || question.options[i].header) {
        startIndex = i + 1
        break
      }
    }
    const rangeEntries = visibleOptions.filter(
      entry => entry.index >= startIndex && entry.index < optionIndex
    )
    return sumBreakdownOptions(rangeEntries, responseValue, variables, computedVariables)
  }

  const display: SubtotalDisplayValues = new Map()
  const resolvedVariables: Variables = {}

  question.options.forEach((option, index) => {
    if (!option.subtotalLabel || option.custom) return
    const value = rangeSum(index)
    display.set(index, value)
    if (option.variable) resolvedVariables[option.variable] = value
  })

  question.options.forEach((option, index) => {
    if (!option.subtotalLabel || !option.custom) return
    const customValue = replacePlaceholders(option.custom, { ...variables, ...resolvedVariables }, computedVariables)
    const parsed = parseFloat(customValue)
    const value = (isNaN(parsed) || customValue.includes('\\{')) ? null : parsed
    display.set(index, value)
    if (option.variable && value !== null) resolvedVariables[option.variable] = value
  })

  return display
}

/** Maps each subtotal row's variable to its value, defaulting an unavailable CUSTOM value to 0. */
export function subtotalVariables(
  question: BreakdownQuestion,
  subtotals: SubtotalDisplayValues
): Variables {
  const result: Variables = {}
  question.options.forEach((option, index) => {
    if (!option.variable || !option.subtotalLabel) return
    const value = subtotals.get(index)
    if (value !== undefined) result[option.variable] = value ?? 0
  })
  return result
}
