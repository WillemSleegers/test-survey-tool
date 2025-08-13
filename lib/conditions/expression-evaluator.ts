import { Responses } from "@/lib/types"
import { getKnownVariables, getVariableNumericValue } from "./value-converter"

/**
 * Evaluates arithmetic expressions by substituting variables with their values
 * 
 * @param expression - The arithmetic expression containing variables
 * @param responses - The responses object to get variable values from
 * @returns The numeric result of the expression evaluation
 * 
 * @example
 * evaluateExpression("age + 5", responses) // If age = 25, returns 30
 * evaluateExpression("count * 2", responses) // If count = 3, returns 6
 */ 
export function evaluateExpression(expression: string, responses: Responses): number {
  // Get all known variable names, sorted by length to avoid partial matches
  const knownVariables = getKnownVariables(responses)
  
  // Replace each known variable with its numeric value
  let substituted = expression
  for (const variable of knownVariables) {
    const numericValue = getVariableNumericValue(variable, responses).toString()
    
    // Replace all occurrences of this variable name with its numeric value
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
    substituted = substituted.replace(regex, numericValue)
  }
  
  // Handle any remaining unknown variables by replacing them with 0
  substituted = substituted.replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g, (match) => {
    // If it's still a variable name (not a number), replace with 0
    if (isNaN(parseFloat(match))) {
      return '0'
    }
    return match
  })
  
  try {
    // Use Function constructor to safely evaluate mathematical expressions
    // This supports +, -, *, /, (), and basic math
    const result = new Function(`return ${substituted}`)()
    return typeof result === 'number' ? result : 0
  } catch {
    return 0
  }
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
  
  // Check for arithmetic operators with word boundaries (variables on both sides)
  // This matches patterns like "var1 + var2" or "age * 2" but not "text with + signs"
  return /\w+\s*[+\-*/]\s*\w+/.test(trimmed) || /^\(.*\)$/.test(trimmed)
}

/**
 * Evaluates STARTS_WITH comparison expressions like "STARTS_WITH fraude == Ja, in de afgelopen 12 maanden"
 * This allows matching multiple variables with a common prefix against the same value
 * 
 * @param prefix - The variable prefix to match (e.g., "fraude")
 * @param operator - The comparison operator (==, !=, etc.)
 * @param rightSide - The value to compare against
 * @param responses - The responses object containing variable values
 * @returns True if any matching variables satisfy the condition (OR logic)
 * 
 * @example
 * evaluateStartsWithComparison("fraude", "==", "Ja, in de afgelopen 12 maanden", responses)
 * // Returns true if any variable starting with "fraude" equals the specified value
 */
export function evaluateStartsWithComparison(
  prefix: string,
  operator: string,
  rightSide: string,
  responses: Responses
): boolean {
  const prefixPattern = prefix.trim()
  
  if (!prefixPattern) {
    return false // Empty prefix
  }
  
  // Find all variables that start with the prefix
  const matchingVariables: string[] = []
  
  Object.values(responses).forEach(responseEntry => {
    if (responseEntry.variable && responseEntry.variable.startsWith(prefixPattern)) {
      matchingVariables.push(responseEntry.variable)
    }
  })
  
  if (matchingVariables.length === 0) {
    return false // No matching variables found
  }
  
  // Evaluate the condition for each matching variable
  // Use OR logic - return true if any variable satisfies the condition
  return matchingVariables.some(variable => {
    const responseEntry = Object.values(responses).find(r => r.variable === variable)
    const responseValue = responseEntry?.value
    
    // Handle different comparison operators
    switch (operator) {
      case "==":
        return String(responseValue) === rightSide.trim()
      case "!=":
        return String(responseValue) !== rightSide.trim()
      case ">=":
        return parseFloat(String(responseValue) || '0') >= parseFloat(rightSide)
      case "<=":
        return parseFloat(String(responseValue) || '0') <= parseFloat(rightSide)
      case ">":
        return parseFloat(String(responseValue) || '0') > parseFloat(rightSide)
      case "<":
        return parseFloat(String(responseValue) || '0') < parseFloat(rightSide)
      default:
        return false
    }
  })
}