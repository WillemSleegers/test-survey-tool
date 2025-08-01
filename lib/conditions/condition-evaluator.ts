import { Responses } from "@/lib/types"
import { 
  parseCondition, 
  isSimpleBooleanTest, 
  evaluateSimpleBooleanTest,
  type ComparisonOperator
} from "./condition-parser"
import {
  compareStringValue,
  compareNumericValue,
  compareEmptyString,
  extractComparisonValue,
  isNumericValue,
  type ResponseValue
} from "./value-comparators"
import {
  hasNotOperator,
  hasOrOperator, 
  hasAndOperator,
  evaluateNotCondition,
  evaluateOrCondition,
  evaluateAndCondition
} from "./logical-operators"
import { evaluateExpression, isArithmeticExpression } from "./expression-evaluator"

/**
 * Main condition evaluator that handles all types of survey conditions
 * 
 * Supports:
 * - Simple boolean tests: "variableName" 
 * - Comparisons: "age >= 18", "name IS John"
 * - Logical operators: "age >= 18 AND rating >= 4"
 * - Negation: "NOT completed"
 * - Arithmetic: "age + years >= 21"
 * - Array operations: "selections >= 2" (for checkboxes)
 * 
 * @param condition - The condition string to evaluate
 * @param responses - Object containing all user responses
 * @returns True if condition is met, false otherwise
 * 
 * @example
 * evaluateCondition("age >= 18", responses) // Check if age is 18 or more
 * evaluateCondition("experience IS Advanced", responses) // Check exact match
 * evaluateCondition("age >= 18 AND experience", responses) // Multiple conditions
 */
export function evaluateCondition(condition: string, responses: Responses): boolean {
  // Empty condition always passes
  if (!condition) return true

  try {
    // Handle NOT operator
    if (hasNotOperator(condition)) {
      return evaluateNotCondition(condition, responses, evaluateCondition)
    }

    // Handle OR conditions  
    if (hasOrOperator(condition)) {
      return evaluateOrCondition(condition, responses, evaluateCondition)
    }

    // Handle AND conditions
    if (hasAndOperator(condition)) {
      return evaluateAndCondition(condition, responses, evaluateCondition)
    }

    // Handle simple boolean testing (just variable name)
    if (isSimpleBooleanTest(condition)) {
      return evaluateSimpleBooleanTest(condition.trim(), responses)
    }

    // Parse comparison condition
    const parsed = parseCondition(condition)
    if (!parsed) return true // Invalid condition defaults to true

    const { leftSide, operator, rightSide } = parsed

    // Handle arithmetic expressions vs simple variable comparisons
    if (isArithmeticExpression(leftSide)) {
      return evaluateArithmeticComparison(leftSide, operator, rightSide, responses)
    } else {
      return evaluateVariableComparison(leftSide, operator, rightSide, responses)
    }
  } catch {
    // Any error in evaluation defaults to true (fail-safe)
    return true
  }
}

/**
 * Evaluates arithmetic expression comparisons like "age + 5 >= 25"
 */
function evaluateArithmeticComparison(
  leftSide: string,
  operator: string, 
  rightSide: string,
  responses: Responses
): boolean {
  const leftValue = evaluateExpression(leftSide, responses)
  const rightValue = parseFloat(rightSide)
  
  if (isNaN(rightValue)) return false
  
  switch (operator) {
    case "==": return leftValue === rightValue
    case "!=": return leftValue !== rightValue
    case ">=": return leftValue >= rightValue
    case "<=": return leftValue <= rightValue
    case ">": return leftValue > rightValue
    case "<": return leftValue < rightValue
    default: return true
  }
}

/**
 * Evaluates simple variable comparisons like "age >= 18" or "name IS John"
 */
function evaluateVariableComparison(
  variable: string,
  operator: string,
  rawValue: string, 
  responses: Responses
): boolean {
  // Find response by variable name
  const responseEntry = Object.values(responses).find(r => r.variable === variable)
  const responseValue: ResponseValue = responseEntry?.value
  
  // Extract the comparison value (handles quoted strings)
  const value = extractComparisonValue(rawValue)
  
  // Handle empty string checks (special case)
  if (value === "") {
    return compareEmptyString(variable, responseValue, responses, operator as ComparisonOperator)
  }

  // Determine if this should be numeric or string comparison
  if (isNumericValue(rawValue)) {
    // Numeric comparison
    const numValue = parseFloat(rawValue)
    return compareNumericValue(responseValue, numValue, operator as ComparisonOperator)
  } else {
    // String comparison (either quoted or non-numeric unquoted)
    return compareStringValue(responseValue, value, operator as ComparisonOperator)
  }
}