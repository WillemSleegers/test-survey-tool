import { Variables, ComputedVariables } from "@/lib/types"
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
import { evaluateExpression, isArithmeticExpression, evaluateStartsWithComparison } from "./expression-evaluator"
import { convertValueToNumber } from "./value-converter"

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
 * - STARTS_WITH patterns: "STARTS_WITH crime == Yes"
 * - Computed variables: References to computed variables defined in sections
 * 
 * @param condition - The condition string to evaluate
 * @param variables - Object containing all user variables
 * @param computedVariables - Optional computed variables from current section
 * @returns True if condition is met, false otherwise
 * 
 * @example
 * evaluateCondition("age >= 18", variables) // Check if age is 18 or more
 * evaluateCondition("experience IS Advanced", variables) // Check exact match
 * evaluateCondition("age >= 18 AND experience", variables) // Multiple conditions
 * evaluateCondition("has_crime", variables, computedVars) // Use computed variable
 */
export function evaluateCondition(
  condition: string, 
  variables: Variables, 
  computedVariables?: ComputedVariables
): boolean {
  // Empty condition always passes
  if (!condition) return true


  try {
    // Create extended variables that includes computed variables
    const extendedResponses = createExtendedResponses(variables, computedVariables)

    // Handle NOT operator
    if (hasNotOperator(condition)) {
      return evaluateNotCondition(condition, extendedResponses, (cond) => 
        evaluateCondition(cond, variables, computedVariables)
      )
    }

    // Handle OR conditions  
    if (hasOrOperator(condition)) {
      return evaluateOrCondition(condition, extendedResponses, (cond) => 
        evaluateCondition(cond, variables, computedVariables)
      )
    }

    // Handle AND conditions
    if (hasAndOperator(condition)) {
      return evaluateAndCondition(condition, extendedResponses, (cond) => 
        evaluateCondition(cond, variables, computedVariables)
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

    // Handle STARTS_WITH patterns in comparisons
    if (leftSide.trim().startsWith('STARTS_WITH ')) {
      const prefix = leftSide.trim().substring('STARTS_WITH '.length).trim()
      return evaluateStartsWithComparison(prefix, operator, rightSide, extendedResponses)
    }

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
 * Creates an extended variables object that includes computed variables
 * This allows computed variables to be referenced in conditions just like regular variables
 */
function createExtendedResponses(
  variables: Variables,
  computedVariables?: ComputedVariables
): Variables {
  if (!computedVariables) {
    return variables
  }

  const extended = { ...variables }

  // Add computed variables directly
  Object.entries(computedVariables).forEach(([name, value]) => {
    extended[name] = value
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
  variables: Variables
): boolean {
  // Handle left side - could be arithmetic expression or simple variable
  let leftValue: number
  if (isArithmeticExpression(leftSide)) {
    leftValue = evaluateExpression(leftSide, variables)
  } else {
    // Simple variable name - get its numeric value using clean converter
    const variableName = leftSide.trim()
    leftValue = convertValueToNumber(variables[variableName])
  }
  
  // Handle right side - could be arithmetic expression, variable name, or literal number
  let rightValue: number
  if (isArithmeticExpression(rightSide)) {
    rightValue = evaluateExpression(rightSide, variables)
  } else {
    // Check if right side is a variable name
    const variableName = rightSide.trim()
    if (variables[variableName] !== undefined) {
      rightValue = convertValueToNumber(variables[variableName])
    } else {
      rightValue = parseFloat(rightSide)
      if (isNaN(rightValue)) rightValue = 0
    }
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
  variables: Variables
): boolean {
  // Get variable value directly
  const responseValue: ResponseValue = variables[variable]
  
  // Check if rawValue is actually another variable name
  const rightVariableName = rawValue.trim()
  const rightVariableValue = variables[rightVariableName]
  
  if (rightVariableValue !== undefined) {
    // Variable-to-variable comparison using clean converter utilities
    const leftNum = convertValueToNumber(responseValue)
    const rightNum = convertValueToNumber(rightVariableValue)
    
    
    // Perform numeric comparison
    switch (operator) {
      case "==": return leftNum === rightNum
      case "!=": return leftNum !== rightNum
      case ">=": return leftNum >= rightNum
      case "<=": return leftNum <= rightNum
      case ">": return leftNum > rightNum
      case "<": return leftNum < rightNum
      default: return true
    }
  }
  
  // Original logic for literal value comparison
  const value = extractComparisonValue(rawValue)
  
  // Handle empty string checks (special case)
  if (value === "") {
    return compareEmptyString(variable, responseValue, variables, operator as ComparisonOperator)
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