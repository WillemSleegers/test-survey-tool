import { Variables, ConditionalPlaceholder, ComputedVariables } from "@/lib/types"
import { evaluateCondition } from "../conditions/condition-evaluator"

/**
 * Finds the matching closing braces for conditional placeholders
 * Handles nested braces correctly
 * 
 * @param text - The text containing braces
 * @param startIndex - Index of the opening {{ 
 * @returns Index of the matching }} or -1 if not found
 */
export function findMatchingBraces(text: string, startIndex: number): number {
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

/**
 * Parses conditional placeholder content like "IF condition THEN text ELSE text"
 * Handles nested braces properly with manual parsing
 * 
 * @param content - The content between {{ and }}
 * @returns Parsed conditional object or null if invalid format
 * 
 * @example
 * parseConditionalContent("IF age >= 18 THEN Adult ELSE Minor")
 * // Returns: { condition: "age >= 18", trueText: "Adult", falseText: "Minor" }
 * 
 * parseConditionalContent("IF x THEN {{IF y THEN nested}} ELSE other")
 * // Returns: { condition: "x", trueText: "{{IF y THEN nested}}", falseText: "other" }
 */
export function parseConditionalContent(content: string): ConditionalPlaceholder | null {
  const trimmed = content.trim()
  
  // Must start with IF (case insensitive)
  if (!trimmed.match(/^IF\s+/i)) {
    return null
  }

  // Use proper keyword finding that handles nested braces
  if (!trimmed.startsWith('IF ')) return null
  
  const thenIndex = findKeyword(trimmed, 'THEN', 0)
  if (thenIndex === -1) return null
  
  const elseIndex = findKeyword(trimmed, 'ELSE', thenIndex)
  
  // Extract parts - findKeyword finds the keyword position, account for surrounding spaces
  const condition = trimmed.slice(3, thenIndex - 1) // After "IF " and before " THEN"
  
  let trueText: string
  let falseText: string
  
  if (elseIndex === -1) {
    // No ELSE part
    trueText = trimmed.slice(thenIndex + 5) // After " THEN "
    falseText = ""
  } else {
    // Has ELSE part
    trueText = trimmed.slice(thenIndex + 5, elseIndex - 1) // Between " THEN " and " ELSE"
    falseText = trimmed.slice(elseIndex + 5) // After " ELSE "
  }

  return {
    condition,
    trueText,
    falseText,
  }
}

/**
 * Finds a keyword (THEN/ELSE) while respecting nested braces
 * Only matches keywords that are not inside nested {{ }} braces
 */
function findKeyword(text: string, keyword: string, startPos: number): number {
  let braceDepth = 0
  let pos = startPos
  
  while (pos <= text.length - keyword.length) {
    // Check for opening braces
    if (pos < text.length - 1 && text.slice(pos, pos + 2) === '{{') {
      braceDepth++
      pos += 2
      continue
    }
    
    // Check for closing braces
    if (pos < text.length - 1 && text.slice(pos, pos + 2) === '}}') {
      braceDepth--
      pos += 2
      continue
    }
    
    // Only check for keyword when we're not inside nested braces
    if (braceDepth === 0) {
      // Check if we have the keyword at this position
      const potentialKeyword = text.slice(pos, pos + keyword.length)
      if (potentialKeyword.toUpperCase() === keyword.toUpperCase()) {
        // Make sure it's a word boundary (not part of another word)
        const beforeChar = pos > 0 ? text[pos - 1] : ' '
        const afterChar = pos + keyword.length < text.length ? text[pos + keyword.length] : ' '
        
        if (/\s/.test(beforeChar) && /\s/.test(afterChar)) {
          return pos
        }
      }
    }
    
    pos++
  }
  
  return -1
}

/**
 * Processes conditional placeholders in text like {{IF condition THEN text ELSE text}}
 * 
 * Supports:
 * - {{IF age >= 18 THEN You are an adult ELSE You are a minor}}
 * - {{IF experience THEN You have experience}} (ELSE part optional)
 * - Nested conditionals
 * - Computed variables from sections
 * 
 * @param text - Text containing conditional placeholders
 * @param variables - User variables to evaluate conditions against
 * @param computedVariables - Optional computed variables from current section
 * @returns Text with conditional placeholders resolved
 * 
 * @example
 * processConditionalPlaceholders(
 *   "{{IF age >= 18 THEN Welcome adult ELSE Access denied}}",
 *   variables
 * )
 * // Returns "Welcome adult" if age >= 18, otherwise "Access denied"  
 */
export function processConditionalPlaceholders(
  text: string,
  variables: Variables,
  computedVariables?: ComputedVariables
): string {
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
      const conditionResult = evaluateCondition(parsed.condition, variables, computedVariables)
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