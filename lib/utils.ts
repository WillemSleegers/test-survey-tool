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

    // Handle array responses (checkbox questions)
    if (Array.isArray(responseValue)) {
      switch (operator) {
        case "==":
          // Check if array contains the value
          return responseValue.includes(value)
        case "!=":
          // Check if array doesn't contain the value
          return !responseValue.includes(value)
        case ">=":
          // Check if array length is >= value
          const minLength = parseFloat(value)
          return responseValue.length >= minLength
        case "<=":
          // Check if array length is <= value
          const maxLength = parseFloat(value)
          return responseValue.length <= maxLength
        case ">":
          // Check if array length is > value
          const minLengthExclusive = parseFloat(value)
          return responseValue.length > minLengthExclusive
        case "<":
          // Check if array length is < value
          const maxLengthExclusive = parseFloat(value)
          return responseValue.length < maxLengthExclusive
        default:
          return true
      }
    }

    // Handle string responses (radio, text, number questions)
    const numValue =
      typeof value === "string" && !isNaN(Number(value))
        ? parseFloat(value)
        : value
    const numResponse =
      typeof responseValue === "string" && !isNaN(Number(responseValue))
        ? parseFloat(responseValue)
        : responseValue

    switch (operator) {
      case "==":
        return responseValue == value
      case "!=":
        return responseValue != value
      case ">=":
        return typeof numResponse === "number" && typeof numValue === "number"
          ? numResponse >= numValue
          : false
      case "<=":
        return typeof numResponse === "number" && typeof numValue === "number"
          ? numResponse <= numValue
          : false
      case ">":
        return typeof numResponse === "number" && typeof numValue === "number"
          ? numResponse > numValue
          : false
      case "<":
        return typeof numResponse === "number" && typeof numValue === "number"
          ? numResponse < numValue
          : false
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

    // Handle array values (from checkbox questions)
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return "none"
      } else if (value.length === 1) {
        return value[0]
      } else if (value.length === 2) {
        return `${value[0]} and ${value[1]}`
      } else {
        const allButLast = value.slice(0, -1).join(", ")
        const last = value[value.length - 1]
        return `${allButLast}, and ${last}`
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
