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