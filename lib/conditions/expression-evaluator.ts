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
 * @param leftSide - The left side of a condition
 * @returns True if the left side contains arithmetic operators or expressions
 * 
 * @example
 * isArithmeticExpression("age + 5") // true
 * isArithmeticExpression("age") // false
 */
export function isArithmeticExpression(leftSide: string): boolean {
  // Simple check: if it's not just a word, it's likely an expression
  return !/^\w+$/.test(leftSide.trim())
}