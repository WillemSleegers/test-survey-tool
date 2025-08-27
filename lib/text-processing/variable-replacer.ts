import { Responses } from "@/lib/types"
import { evaluateExpression, isArithmeticExpression } from "@/lib/conditions/expression-evaluator"

/**
 * Processes variable placeholders and arithmetic expressions in text
 * 
 * Features:
 * - Simple variables: {name} -> "John"
 * - Arithmetic expressions: {age + 5} -> "30" (if age = 25)
 * - Multiple variables: {count1 + count2} -> "7" (if count1 = 3, count2 = 4)
 * - Array values: {colors} -> "Red\n- Blue\n- Green" (markdown list)
 * - Array as list: {colors AS LIST} -> "Red\n- Blue\n- Green" (markdown list)
 * - Array as inline: {colors AS INLINE_LIST} -> "red, blue, and green" (lowercase, comma-separated)
 * - Empty arrays: {selections} -> "none"
 * - Missing variables: {unknown} -> "{unknown}" (unchanged)
 * 
 * @param text - Text containing variable placeholders and expressions
 * @param responses - User responses to get variable values from
 * @returns Text with placeholders replaced with actual values or computed results
 * 
 * @example
 * processVariablePlaceholders("Hello {name}!", responses)
 * // Returns "Hello John!" if name variable = "John"
 * 
 * processVariablePlaceholders("Total: {count1 + count2}", responses)
 * // Returns "Total: 7" if count1 = 3 and count2 = 4
 * 
 * processVariablePlaceholders("You selected: {colors}", responses)  
 * // Returns "You selected:\n- Red\n- Blue\n\n" if colors = ["Red", "Blue"]
 * 
 * processVariablePlaceholders("You reported: {crimes AS INLINE_LIST}", responses)
 * // Returns "You reported: theft, fraud, and violence" if crimes = ["THEFT", "FRAUD", "VIOLENCE"]
 */
export function processVariablePlaceholders(
  text: string,
  responses: Responses
): string {
  // Updated regex to capture any content inside braces (including expressions with spaces and operators)
  return text.replace(/\{([^}]+)\}/g, (match, content) => {
    const trimmedContent = content.trim()
    
    // Check for format modifiers (e.g., "variable AS LIST" or "variable AS INLINE_LIST")
    const formatMatch = trimmedContent.match(/^(.+?)\s+AS\s+(LIST|INLINE_LIST)$/i)
    if (formatMatch) {
      const [, variablePart, format] = formatMatch
      const variable = variablePart.trim()
      
      // Find response by variable name
      const responseEntry = Object.values(responses).find(
        (r) => r.variable === variable
      )
      const value = responseEntry?.value

      if (value === undefined) {
        // Escape curly braces to prevent react-markdown from interpreting them as JSX
        return match.replace(/[{}]/g, '\\$&') // Return escaped if variable not found
      }

      // Handle array values with formatting
      if (Array.isArray(value)) {
        return formatArrayValue(value, format.toLowerCase() as 'list' | 'inline_list')
      }

      // For non-array values, just return as string regardless of format
      if (typeof value === 'boolean') {
        return value ? 'true' : 'false'
      }
      
      if (typeof value === 'number') {
        return String(value)
      }
      
      return String(value)
    }
    
    // Check if this is an arithmetic expression or a simple variable
    if (isArithmeticExpression(trimmedContent)) {
      // Handle arithmetic expressions like "age + 5" or "count1 + count2"
      try {
        const result = evaluateExpression(trimmedContent, responses)
        return String(result)
      } catch {
        // Escape curly braces to prevent react-markdown from interpreting them as JSX
        return match.replace(/[{}]/g, '\\$&') // Return escaped if expression evaluation fails
      }
    } else {
      // Handle simple variables like "name" or "age"
      const variable = trimmedContent
      
      // Find response by variable name
      const responseEntry = Object.values(responses).find(
        (r) => r.variable === variable
      )
      const value = responseEntry?.value

      if (value === undefined) {
        // Escape curly braces to prevent react-markdown from interpreting them as JSX
        return match.replace(/[{}]/g, '\\$&') // Return escaped if variable not found
      }

      // Handle array values (from checkbox questions)
      if (Array.isArray(value)) {
        return formatArrayValue(value)
      }

      // Handle different value types
      if (typeof value === 'boolean') {
        return value ? 'true' : 'false'
      }
      
      if (typeof value === 'number') {
        return String(value)
      }
      
      // Handle string values (from radio, text, number questions)
      return String(value)
    }
  })
}

/**
 * Formats array values for display in text
 * 
 * @param value - Array of selected values
 * @param format - Optional format type ('list' or 'inline_list')
 * @returns Formatted string representation
 * 
 * @example
 * formatArrayValue([]) // "none"
 * formatArrayValue(["Red"]) // "Red"
 * formatArrayValue(["Red", "Blue"]) // "\n- Red\n- Blue\n\n"
 * formatArrayValue(["Red", "Blue", "Green"], "inline_list") // "red, blue, and green"
 */
function formatArrayValue(value: string[], format?: 'list' | 'inline_list'): string {
  if (value.length === 0) {
    return "none"
  } else if (value.length === 1) {
    // For inline_list with single item, lowercase it
    if (format === 'inline_list') {
      return value[0].toLowerCase()
    }
    return value[0]
  } else {
    if (format === 'inline_list') {
      // Convert to comma-separated list with Oxford comma and lowercase
      const lowercaseItems = value.map(item => item.toLowerCase())
      if (lowercaseItems.length === 2) {
        return `${lowercaseItems[0]} and ${lowercaseItems[1]}`
      } else {
        const allButLast = lowercaseItems.slice(0, -1)
        const last = lowercaseItems[lowercaseItems.length - 1]
        return `${allButLast.join(', ')}, and ${last}`
      }
    } else {
      // Convert to markdown unordered list with surrounding newlines (default behavior)
      return '\n' + value.map(item => `- ${item}`).join('\n') + '\n\n'
    }
  }
}