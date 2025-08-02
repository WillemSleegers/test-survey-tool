import { Responses } from "@/lib/types"
import { ComparisonOperator } from "./condition-parser"

/**
 * Represents a response value that can be compared
 */
export type ResponseValue = string | string[] | boolean | number | undefined

/**
 * Determines if a raw value string should be treated as numeric
 * 
 * @param rawValue - The raw string value 
 * @returns True if the value represents a number
 */
export function isNumericValue(rawValue: string): boolean {
  const numValue = parseFloat(rawValue)
  return !isNaN(numValue) && rawValue.trim() === numValue.toString()
}

/**
 * Extracts the actual comparison value from a raw string
 * Handles both quoted strings ("value") and unquoted values
 * 
 * @param rawValue - The raw value string from the condition
 * @returns The extracted value without quotes
 */
export function extractComparisonValue(rawValue: string): string {
  const quotedMatch = rawValue.match(/^["'](.*)["']$/)
  return quotedMatch ? quotedMatch[1] : rawValue
}

/**
 * Compares a string/array response value against a target string
 * 
 * @param responseValue - The response value (string or array)
 * @param targetValue - The value to compare against
 * @param operator - The comparison operator
 * @returns The comparison result
 */
export function compareStringValue(
  responseValue: ResponseValue, 
  targetValue: string, 
  operator: ComparisonOperator
): boolean {
  if (responseValue === undefined) return false

  // Handle array responses (checkbox questions)
  if (Array.isArray(responseValue)) {
    switch (operator) {
      case "==":
        return responseValue.includes(targetValue)
      case "!=":
        return !responseValue.includes(targetValue)
      default:
        return false // Other operators don't make sense for string/array comparisons
    }
  }

  // Handle string responses (radio, text questions)
  switch (operator) {
    case "==":
      return responseValue === targetValue
    case "!=":
      return responseValue !== targetValue
    default:
      return false // Other operators don't make sense for string comparisons
  }
}

/**
 * Compares a numeric response value against a target number
 * 
 * @param responseValue - The response value (string or array)
 * @param targetValue - The numeric value to compare against
 * @param operator - The comparison operator
 * @returns The comparison result
 */
export function compareNumericValue(
  responseValue: ResponseValue,
  targetValue: number,
  operator: ComparisonOperator
): boolean {
  if (responseValue === undefined) return false

  // Handle array responses (checkbox questions) - use array length
  if (Array.isArray(responseValue)) {
    const arrayLength = responseValue.length
    switch (operator) {
      case ">=": return arrayLength >= targetValue
      case "<=": return arrayLength <= targetValue  
      case ">": return arrayLength > targetValue
      case "<": return arrayLength < targetValue
      case "==": return arrayLength === targetValue
      case "!=": return arrayLength !== targetValue
      default: return false
    }
  }

  // Handle numeric responses (number questions, or string numbers)
  const numResponse = parseFloat(String(responseValue))
  if (isNaN(numResponse)) return false

  switch (operator) {
    case "==": return numResponse === targetValue
    case "!=": return numResponse !== targetValue
    case ">=": return numResponse >= targetValue
    case "<=": return numResponse <= targetValue
    case ">": return numResponse > targetValue
    case "<": return numResponse < targetValue
    default: return false
  }
}

/**
 * Handles special case comparisons for empty string checks
 * 
 * @param variable - The variable name
 * @param responseValue - The response value
 * @param responses - All responses  
 * @param operator - The comparison operator
 * @returns The comparison result for empty string checks
 */
export function compareEmptyString(
  variable: string,
  responseValue: ResponseValue,
  responses: Responses,
  operator: ComparisonOperator
): boolean {
  const responseEntry = Object.values(responses).find(r => r.variable === variable)
  
  if (responseEntry === undefined) {
    // Question was never shown - return based on operator
    return operator === "==" ? false : true
  }
  
  // Question was shown but empty
  const isEmpty = responseValue === "" || (Array.isArray(responseValue) && responseValue.length === 0)
  return operator === "==" ? isEmpty : !isEmpty
}