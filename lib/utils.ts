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
  // Split on | while respecting nested {{ }}
  const parts: string[] = []
  let current = ""
  let depth = 0

  for (let i = 0; i < content.length; i++) {
    const char = content[i]

    if (content.slice(i, i + 2) === "{{") {
      depth++
      current += content.slice(i, i + 2)
      i++ // Skip next character
    } else if (content.slice(i, i + 2) === "}}") {
      depth--
      current += content.slice(i, i + 2)
      i++ // Skip next character
    } else if (char === "|" && depth === 0) {
      parts.push(current)
      current = ""
    } else {
      current += char
    }
  }

  if (current) {
    parts.push(current)
  }

  if (parts.length !== 3) {
    return null
  }

  return {
    condition: parts[0].trim(),
    trueText: parts[1],
    falseText: parts[2],
  }
}

export const evaluateCondition = (
  condition: string,
  responses: Responses
): boolean => {
  if (!condition) return true

  try {
    // Handle OR conditions
    if (condition.includes("||")) {
      return condition
        .split("||")
        .some((part) => evaluateCondition(part.trim(), responses))
    }

    // Handle AND conditions
    if (condition.includes("&&")) {
      return condition
        .split("&&")
        .every((part) => evaluateCondition(part.trim(), responses))
    }

    // Parse simple condition
    const match = condition.match(/(\w+)\s*(==|!=|>=|<=|>|<)\s*(.+)/)
    if (!match) return true

    const [, variable, operator, value] = match

    // Find response by variable name
    const responseEntry = Object.values(responses).find(
      (r) => r.variable === variable
    )
    const responseValue = responseEntry?.value

    if (responseValue === undefined) return false

    // Type conversion
    const numValue = isNaN(value as any) ? value : parseFloat(value)
    const numResponse = isNaN(responseValue as any)
      ? responseValue
      : parseFloat(responseValue)

    switch (operator) {
      case "==":
        return responseValue == value
      case "!=":
        return responseValue != value
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

    const fullMatch = result.slice(startIndex, endIndex + 1)
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
    return value !== undefined ? value : match
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
