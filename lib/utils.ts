import { twMerge } from "tailwind-merge"
import { clsx, type ClassValue } from "clsx"

import { ConditionalPlaceholder, Responses } from "@/lib/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility functions for text processing
export const findMatchingBraces = (
  text: string,
  startIndex: number
): number => {
  let depth = 0
  for (let i = startIndex; i < text.length - 1; i++) {
    if (text.slice(i, i + 2) === "{{") {
      depth++
      i++ // Skip next character
    } else if (text.slice(i, i + 2) === "}}") {
      depth--
      if (depth === 0) {
        return i + 1 // Return end position (inclusive of last })
      }
      i++ // Skip next character
    }
  }
  return -1 // No matching brace found
}

export const parseConditionalContent = (
  content: string
): ConditionalPlaceholder | null => {
  // Parse IF THEN ELSE syntax
  const ifMatch = content.match(/^IF\s+(.+?)\s+THEN\s+(.+?)(?:\s+ELSE\s+(.+))?$/i)
  
  if (!ifMatch) {
    return null
  }

  const [, condition, trueText, falseText] = ifMatch

  return {
    condition: condition.trim(),
    trueText: trueText.trim(),
    falseText: falseText ? falseText.trim() : "", // Default to empty string if no ELSE part
  }
}

// Helper function to evaluate arithmetic expressions
const evaluateExpression = (expression: string, responses: Responses): number => {
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

export const evaluateCondition = (
  condition: string,
  responses: Responses
): boolean => {
  if (!condition) return true

  try {
    // Handle NOT operator
    if (condition.trim().toUpperCase().startsWith("NOT ")) {
      const innerCondition = condition.trim().substring(4).trim()
      return !evaluateCondition(innerCondition, responses)
    }

    // Handle OR conditions (using OR keyword or ||)
    if (condition.toUpperCase().includes(" OR ") || condition.includes("||")) {
      const parts = condition.toUpperCase().includes(" OR ") 
        ? condition.split(/\s+OR\s+/i)
        : condition.split("||")
      return parts.some((part) => evaluateCondition(part.trim(), responses))
    }

    // Handle AND conditions (using AND keyword or &&)
    if (condition.toUpperCase().includes(" AND ") || condition.includes("&&")) {
      const parts = condition.toUpperCase().includes(" AND ") 
        ? condition.split(/\s+AND\s+/i)
        : condition.split("&&")
      return parts.every((part) => evaluateCondition(part.trim(), responses))
    }

    // Handle implicit boolean testing (just variable name)
    if (/^\w+$/.test(condition.trim())) {
      const variable = condition.trim()
      const responseEntry = Object.values(responses).find(
        (r) => r.variable === variable
      )
      const value = responseEntry?.value
      
      // Return true if variable exists and has a non-empty value
      if (value === undefined) return false
      if (value === "") return false
      if (Array.isArray(value) && value.length === 0) return false
      return true
    }

    // Parse condition - now supports arithmetic expressions
    const match = condition.match(/(.+)\s*(==|!=|>=|<=|>|<)\s*(.+)/)
    if (!match) return true

    const [, leftSide, operator, rightSide] = match

    // Check if this is a simple variable comparison or arithmetic expression
    const isSimpleVariable = /^\w+$/.test(leftSide.trim())
    
    if (isSimpleVariable) {
      // Handle simple variable conditions (original logic)
      const variable = leftSide.trim()
      const rawValue = rightSide.trim()
      
      // Find response by variable name
      const responseEntry = Object.values(responses).find(
        (r) => r.variable === variable
      )
      const responseValue = responseEntry?.value

      // Check if the value is quoted (string comparison)
      const quotedMatch = rawValue.match(/^["'](.*)["']$/)
      if (quotedMatch) {
        // This is a quoted string comparison
        const value = quotedMatch[1] // Extract content between quotes
        
        // Handle empty string checks
        if (value === "") {
          if (responseEntry === undefined) {
            // Question was never shown - return based on operator
            return operator === "==" ? false : true
          }
          // Question was shown but empty
          const isEmpty = responseValue === "" || (Array.isArray(responseValue) && responseValue.length === 0)
          return operator === "==" ? isEmpty : !isEmpty
        }

        if (responseValue === undefined) return false

        // Handle array responses (checkbox questions) for quoted strings
        if (Array.isArray(responseValue)) {
          switch (operator) {
            case "==":
              // Check if array contains the value
              return responseValue.includes(value)
            case "!=":
              // Check if array doesn't contain the value
              return !responseValue.includes(value)
            default:
              return false // Other operators don't make sense for string/array comparisons
          }
        }

        // Handle string responses (radio, text questions) for quoted strings
        switch (operator) {
          case "==":
            return responseValue == value
          case "!=":
            return responseValue != value
          default:
            return false // Other operators don't make sense for string comparisons
        }
      } else {
        // This is an unquoted value - treat as numeric comparison
        const numValue = parseFloat(rawValue)
        if (isNaN(numValue)) return false // Invalid numeric value

        if (responseValue === undefined) return false

        // Handle array responses (checkbox questions) for numeric comparisons
        if (Array.isArray(responseValue)) {
          switch (operator) {
            case ">=":
              // Check if array length is >= value
              return responseValue.length >= numValue
            case "<=":
              // Check if array length is <= value
              return responseValue.length <= numValue
            case ">":
              // Check if array length is > value
              return responseValue.length > numValue
            case "<":
              // Check if array length is < value
              return responseValue.length < numValue
            case "==":
              // Check if array length equals value
              return responseValue.length === numValue
            case "!=":
              // Check if array length doesn't equal value
              return responseValue.length !== numValue
            default:
              return true
          }
        }

        // Handle numeric responses (number questions, or string numbers)
        const numResponse = parseFloat(String(responseValue))
        if (isNaN(numResponse)) return false // Response is not numeric

        switch (operator) {
          case "==":
            return numResponse === numValue
          case "!=":
            return numResponse !== numValue
          case ">=":
            return numResponse >= numValue
          case "<=":
            return numResponse <= numValue
          case ">":
            return numResponse > numValue
          case "<":
            return numResponse < numValue
          default:
            return true
        }
      }
    } else {
      // Handle arithmetic expressions
      const leftValue = evaluateExpression(leftSide.trim(), responses)
      const rightValue = parseFloat(rightSide.trim())
      
      if (isNaN(rightValue)) return false
      
      switch (operator) {
        case "==":
          return leftValue === rightValue
        case "!=":
          return leftValue !== rightValue
        case ">=":
          return leftValue >= rightValue
        case "<=":
          return leftValue <= rightValue
        case ">":
          return leftValue > rightValue
        case "<":
          return leftValue < rightValue
        default:
          return true
      }
    }
  } catch {
    return true
  }
}

export const processConditionalPlaceholders = (
  text: string,
  responses: Responses
): string => {
  let result = text
  let maxIterations = 20 // Prevent infinite loops

  while (maxIterations > 0 && result.includes("{{")) {
    maxIterations--

    // Find the first {{ and its matching }}
    const startIndex = result.indexOf("{{")
    if (startIndex === -1) break

    const endIndex = findMatchingBraces(result, startIndex)
    if (endIndex === -1) break

    const content = result.slice(startIndex + 2, endIndex - 1)

    const parsed = parseConditionalContent(content)
    if (parsed) {
      const conditionResult = evaluateCondition(parsed.condition, responses)
      const replacement = conditionResult ? parsed.trueText : parsed.falseText
      result =
        result.slice(0, startIndex) + replacement + result.slice(endIndex + 1)
    } else {
      // Invalid format, remove braces to prevent infinite loop
      result =
        result.slice(0, startIndex) + content + result.slice(endIndex + 1)
    }
  }

  return result
}

export const processVariablePlaceholders = (
  text: string,
  responses: Responses
): string => {
  return text.replace(/\{(\w+)\}/g, (match, variable) => {
    // Find response by variable name
    const responseEntry = Object.values(responses).find(
      (r) => r.variable === variable
    )
    const value = responseEntry?.value

    if (value === undefined) {
      return match
    }

    // Handle array values (from checkbox questions) - convert to markdown list
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return "none"
      } else if (value.length === 1) {
        return value[0]
      } else {
        // Convert to markdown unordered list (with leading and trailing newlines for proper rendering)
        return '\n' + value.map(item => `- ${item}`).join('\n') + '\n\n'
      }
    }

    // Handle string values (from radio, text, number questions)
    return String(value)
  })
}

export const replacePlaceholders = (
  text: string | undefined,
  responses: Responses
): string => {
  if (!text) return ""

  // First process conditional placeholders, then variable placeholders
  const afterConditionals = processConditionalPlaceholders(text, responses)
  return processVariablePlaceholders(afterConditionals, responses)
}
