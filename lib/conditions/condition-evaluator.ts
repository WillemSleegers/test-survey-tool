import { Variables, ComputedValues } from "@/lib/types"
import {
  evaluateConditionExpression,
  evaluateComparisonSum,
  ConditionParseError,
} from "./expression-parser"

/**
 * Main condition evaluator that handles all types of survey conditions
 *
 * Supports:
 * - Simple boolean tests: "variableName"
 * - Comparisons: "age >= 18", "name IS John", quoted and unquoted values
 * - Logical operators with conventional precedence: NOT binds tighter than
 *   AND, AND tighter than OR; parentheses group sub-conditions
 * - Arithmetic: "age + years >= 21"
 * - Array operations: "selections >= 2" (checkbox count), "selections == Yes"
 *   (checkbox inclusion)
 * - Comparison sums: "a == Yes + b == Yes >= 2"
 * - STARTS_WITH patterns: "STARTS_WITH crime == Yes"
 * - Computed variables, referenced like regular variables
 *
 * Keywords (AND, OR, NOT, IS, ...) are recognized in UPPERCASE only, so
 * unquoted answer values containing words like "or" stay plain text.
 *
 * Malformed conditions log a console warning and default to true (visible)
 * so a broken condition never hides content silently.
 *
 * @param condition - The condition string to evaluate
 * @param variables - Object containing all user variables
 * @param computedVariables - Optional computed variables from current scope
 * @returns True if condition is met, false otherwise
 *
 * @example
 * evaluateCondition("age >= 18", variables)
 * evaluateCondition("experience IS Advanced", variables)
 * evaluateCondition("(age >= 18 OR guardian == Yes) AND consent == Yes", variables)
 * evaluateCondition("has_crime", variables, computedVars)
 */
export function evaluateCondition(
  condition: string,
  variables: Variables,
  computedVariables?: ComputedValues
): boolean {
  if (!condition || !condition.trim()) return true

  const extendedVariables = createExtendedResponses(variables, computedVariables)

  try {
    return evaluateConditionExpression(condition, extendedVariables)
  } catch (error) {
    if (error instanceof ConditionParseError) {
      console.warn(
        `Invalid condition "${condition}": ${error.message} — defaulting to visible`
      )
    } else {
      console.warn(`Failed to evaluate condition "${condition}": ${error}`)
    }
    return true
  }
}

/**
 * Evaluates an expression that sums multiple comparisons, e.g.
 * "q1 == Yes + q2 == Yes + q3 == Yes" -> count of matching comparisons.
 * Each additive term is evaluated on its own: terms with a comparison
 * operator become 1/0, plain terms are evaluated arithmetically.
 */
export function evaluateMultiComparisonSum(
  expression: string,
  variables: Variables
): number {
  try {
    return evaluateComparisonSum(expression, variables)
  } catch (error) {
    console.warn(`Failed to evaluate comparison sum "${expression}": ${error}`)
    return 0
  }
}

/**
 * Creates an extended variables object that includes computed variables
 * This allows computed variables to be referenced in conditions just like regular variables
 */
function createExtendedResponses(
  variables: Variables,
  computedVariables?: ComputedValues
): Variables {
  if (!computedVariables) {
    return variables
  }
  return { ...variables, ...computedVariables }
}
