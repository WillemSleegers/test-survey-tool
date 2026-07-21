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
