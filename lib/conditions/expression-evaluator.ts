import { Variables } from "@/lib/types"
import {
  evaluateArithmeticExpression,
  isComparisonSumExpression,
} from "./expression-parser"

/**
 * Evaluates arithmetic expressions like "age + 5" or "count1 * 2".
 * Variables resolve to their numeric value; unknown variables count as 0.
 * Malformed expressions return 0.
 *
 * @param expression - The arithmetic expression containing variables
 * @param variables - The variables object to get variable values from
 * @returns The numeric result of the expression evaluation
 *
 * @example
 * evaluateExpression("age + 5", variables) // If age = 25, returns 30
 * evaluateExpression("count * 2", variables) // If count = 3, returns 6
 */
export function evaluateExpression(expression: string, variables: Variables): number {
  try {
    return evaluateArithmeticExpression(expression, variables)
  } catch {
    return 0
  }
}

/**
 * Checks if an expression sums multiple comparisons, e.g.
 * "q1 == Yes + q2 == Yes + q3 == Yes". Requires at least two comparison
 * operators split across at least two top-level additive terms, so single
 * comparisons like "age + years >= 21" are left to the normal comparison path.
 */
export function isMultiComparisonExpression(expression: string): boolean {
  return isComparisonSumExpression(expression)
}

/**
 * Checks if a condition contains arithmetic expressions (not just simple variables)
 *
 * @param expression - The expression to check
 * @returns True if the expression contains arithmetic operators
 *
 * @example
 * isArithmeticExpression("age + 5") // true
 * isArithmeticExpression("var1 * var2") // true
 * isArithmeticExpression("age") // false
 * isArithmeticExpression("Ja, in de afgelopen 12 maanden") // false
 */
export function isArithmeticExpression(expression: string): boolean {
  // Check for arithmetic operators: +, -, *, /, (, )
  const trimmed = expression.trim()

  // If it's a simple word variable, it's not arithmetic
  if (/^\w+$/.test(trimmed)) {
    return false
  }

  // A quoted string literal (e.g. a SHOW_IF comparison value) is never
  // arithmetic, even if it contains a hyphen from a compound word like
  // "milieu-investering" that would otherwise look like subtraction
  if (/^["'].*["']$/.test(trimmed)) {
    return false
  }

  // Check for arithmetic operators with word boundaries (variables on both sides)
  // This matches patterns like "var1 + var2" or "age * 2" but not "text with + signs"
  return /\w+\s*[+\-*/]\s*\w+/.test(trimmed) || /^\(.*\)$/.test(trimmed)
}

/**
 * Checks if an expression is an IF-THEN-ELSE conditional (requires ELSE branch)
 */
export function isIfThenElseExpression(expression: string): boolean {
  const trimmed = expression.trim()
  return trimmed.startsWith('IF ') && trimmed.includes(' THEN ') && trimmed.includes(' ELSE ')
}

/**
 * Checks if an expression is a one-sided IF-THEN conditional (no ELSE branch).
 * Used for multi-COMPUTE patterns where a false condition leaves the previous value unchanged.
 */
export function isIfThenExpression(expression: string): boolean {
  const trimmed = expression.trim()
  return trimmed.startsWith('IF ') && trimmed.includes(' THEN ') && !trimmed.includes(' ELSE ')
}

/**
 * Parses a one-sided IF-THEN expression into condition and true branch.
 * Returns null if the expression doesn't match the expected syntax.
 */
export function parseIfThen(
  expression: string
): { condition: string; trueExpr: string } | null {
  const trimmed = expression.trim()
  const withoutIf = trimmed.slice('IF '.length)
  const thenIndex = withoutIf.indexOf(' THEN ')
  if (thenIndex === -1) return null
  return {
    condition: withoutIf.slice(0, thenIndex).trim(),
    trueExpr: withoutIf.slice(thenIndex + ' THEN '.length).trim(),
  }
}

/**
 * Checks if an expression is a quoted string literal
 */
export function isStringLiteral(expression: string): boolean {
  const trimmed = expression.trim()
  return (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
         (trimmed.startsWith("'") && trimmed.endsWith("'"))
}

/**
 * Parses an IF-THEN-ELSE expression into its three parts.
 * Returns null if the expression doesn't match the expected syntax.
 */
export function parseIfThenElse(
  expression: string
): { condition: string; trueExpr: string; falseExpr: string } | null {
  const trimmed = expression.trim()
  const withoutIf = trimmed.slice('IF '.length)
  const thenIndex = withoutIf.indexOf(' THEN ')
  if (thenIndex === -1) return null

  const condition = withoutIf.slice(0, thenIndex).trim()
  const rest = withoutIf.slice(thenIndex + ' THEN '.length)
  const elseIndex = rest.indexOf(' ELSE ')
  if (elseIndex === -1) return null

  return {
    condition,
    trueExpr: rest.slice(0, elseIndex).trim(),
    falseExpr: rest.slice(elseIndex + ' ELSE '.length).trim(),
  }
}

/**
 * Resolves a branch value token from an IF-THEN-ELSE expression.
 *
 * Resolution order:
 * 1. Quoted string → strip quotes, return string
 * 2. Numeric literal → return number
 * 3. Known variable → return its current value
 * 4. Unquoted text → treat as string literal (lenient fallback, consistent with SHOW_IF)
 *
 * Note: The variable-first resolution for unquoted tokens is intentionally lenient.
 * A future version may require explicit quotes for strings to remove the ambiguity.
 */
export function resolveValue(token: string, variables: Variables): string | number | boolean {
  const trimmed = token.trim()

  if (isStringLiteral(trimmed)) {
    return trimmed.slice(1, -1)
  }

  const num = parseFloat(trimmed)
  if (!isNaN(num) && String(num) === trimmed) {
    return num
  }

  if (trimmed in variables) {
    return variables[trimmed] as string | number | boolean
  }

  return trimmed
}
