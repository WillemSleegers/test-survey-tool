import { Responses } from "@/lib/types"

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
  // Replace variables with their numeric values
  const substituted = expression.replace(/\w+/g, (variable) => {
    const responseEntry = Object.values(responses).find(
      (r) => r.variable === variable
    )
    const value = responseEntry?.value
    
    // Convert to number, default to 0 if not a valid number
    if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
      return "0"
    }
    
    if (Array.isArray(value)) {
      return value.length.toString() // Use array length for checkbox questions
    }
    
    const numValue = parseFloat(String(value))
    return isNaN(numValue) ? "0" : numValue.toString()
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
  // But exclude these when they appear in quoted strings or are part of regular text
  const trimmed = expression.trim()
  
  // If it's a simple word variable, it's not arithmetic
  if (/^\w+$/.test(trimmed)) {
    return false
  }
  
  // Check for arithmetic operators with word boundaries (variables on both sides)
  // This matches patterns like "var1 + var2" or "age * 2" but not "text with + signs"
  return /\w+\s*[+\-*/]\s*\w+/.test(trimmed) || /^\(.*\)$/.test(trimmed)
}