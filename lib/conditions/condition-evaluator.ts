import { Responses, ComputedVariables } from "@/lib/types"
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
 * - Computed variables: References to computed variables defined in sections
 * 
 * @param condition - The condition string to evaluate
 * @param responses - Object containing all user responses
 * @param computedVariables - Optional computed variables from current section
 * @returns True if condition is met, false otherwise
 * 
 * @example
 * evaluateCondition("age >= 18", responses) // Check if age is 18 or more
 * evaluateCondition("experience IS Advanced", responses) // Check exact match
 * evaluateCondition("age >= 18 AND experience", responses) // Multiple conditions
 * evaluateCondition("has_crime", responses, computedVars) // Use computed variable
 */
export function evaluateCondition(
  condition: string, 
  responses: Responses, 
  computedVariables?: ComputedVariables
): boolean {
  // Empty condition always passes
  if (!condition) return true

  try {
    // Create extended responses that includes computed variables
    const extendedResponses = createExtendedResponses(responses, computedVariables)

    // Handle NOT operator
    if (hasNotOperator(condition)) {
      return evaluateNotCondition(condition, extendedResponses, (cond) => 
        evaluateCondition(cond, responses, computedVariables)
      )
    }

    // Handle OR conditions  
    if (hasOrOperator(condition)) {
      return evaluateOrCondition(condition, extendedResponses, (cond) => 
        evaluateCondition(cond, responses, computedVariables)
      )
    }

    // Handle AND conditions
    if (hasAndOperator(condition)) {
      return evaluateAndCondition(condition, extendedResponses, (cond) => 
        evaluateCondition(cond, responses, computedVariables)
      )
    }

    // Handle literal boolean values first
    const trimmedCondition = condition.trim()
    if (trimmedCondition === "true") return true
    if (trimmedCondition === "false") return false

    // Handle simple boolean testing (just variable name)
    if (isSimpleBooleanTest(condition)) {
      return evaluateSimpleBooleanTest(trimmedCondition, extendedResponses)
    }

    // Parse comparison condition
    const parsed = parseCondition(condition)
    if (!parsed) return true // Invalid condition defaults to true

    const { leftSide, operator, rightSide } = parsed

    // Handle arithmetic expressions vs simple variable comparisons
    if (isArithmeticExpression(leftSide) || isArithmeticExpression(rightSide)) {
      return evaluateArithmeticComparison(leftSide, operator, rightSide, extendedResponses)
    } else {
      return evaluateVariableComparison(leftSide, operator, rightSide, extendedResponses)
    }
  } catch {
    // Any error in evaluation defaults to true (fail-safe)
    return true
  }
}

/**
 * Creates an extended responses object that includes computed variables as pseudo-responses
 * This allows computed variables to be referenced in conditions just like regular variables
 */
function createExtendedResponses(
  responses: Responses,
  computedVariables?: ComputedVariables
): Responses {
  if (!computedVariables) {
    return responses
  }
  
  const extended = { ...responses }
  
  // Add computed variables as pseudo-responses
  Object.entries(computedVariables).forEach(([name, value]) => {
    const pseudoQuestionId = `__computed_${name}`
    extended[pseudoQuestionId] = {
      value: value,
      variable: name
    }
  })
  
  return extended
}

/**
 * Evaluates arithmetic expression comparisons like "age + 5 >= 25" or "var1 != var2 + var3"
 */
function evaluateArithmeticComparison(
  leftSide: string,
  operator: string, 
  rightSide: string,
  responses: Responses
): boolean {
  // Handle left side - could be arithmetic expression or simple variable
  let leftValue: number
  if (isArithmeticExpression(leftSide)) {
    leftValue = evaluateExpression(leftSide, responses)
  } else {
    // Simple variable name - get its numeric value
    const responseEntry = Object.values(responses).find(r => r.variable === leftSide.trim())
    const value = responseEntry?.value
    leftValue = value === undefined ? 0 : parseFloat(String(value))
    if (isNaN(leftValue)) return false
  }
  
  // Handle right side - could be arithmetic expression or just a number
  let rightValue: number
  if (isArithmeticExpression(rightSide)) {
    rightValue = evaluateExpression(rightSide, responses)
  } else {
    rightValue = parseFloat(rightSide)
    if (isNaN(rightValue)) return false
  }
  
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