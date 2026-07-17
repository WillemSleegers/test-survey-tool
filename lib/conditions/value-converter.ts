import { Variables } from "@/lib/types"
import type { ResponseValue } from "./value-comparators"

/**
 * Converts any response value to a numeric representation
 * 
 * @param value - The response value to convert
 * @returns Numeric representation of the value
 * 
 * Conversion rules:
 * - undefined/null/empty -> 0
 * - Array -> array.length
 * - Boolean -> 1 or 0
 * - String boolean representations ("true", "yes", "ja") -> 1
 * - String boolean representations ("false", "no", "nee") -> 0
 * - Other strings -> parseFloat or 0 if NaN
 * - Numbers -> as-is
 */
export function convertValueToNumber(value: ResponseValue): number {
  if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
    return 0
  }
  
  if (Array.isArray(value)) {
    return value.length
  }
  
  if (typeof value === "boolean") {
    return value ? 1 : 0
  }
  
  if (typeof value === "number") {
    return value
  }
  
  if (typeof value === "string") {
    const lowerValue = value.toLowerCase()
    if (lowerValue === "true" || lowerValue === "yes" || lowerValue === "ja") {
      return 1
    }
    if (lowerValue === "false" || lowerValue === "no" || lowerValue === "nee") {
      return 0
    }

    const numValue = parseFloat(value)
    return isNaN(numValue) ? 0 : numValue
  }

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    // Matrix object - return the count of answered rows
    return Object.keys(value).length
  }

  return 0
}

