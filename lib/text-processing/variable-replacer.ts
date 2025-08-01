import { Responses } from "@/lib/types"

/**
 * Processes variable placeholders in text like {variableName}
 * 
 * Features:
 * - Single values: {name} -> "John"
 * - Array values: {colors} -> "Red\n- Blue\n- Green" (markdown list)
 * - Empty arrays: {selections} -> "none"
 * - Missing variables: {unknown} -> "{unknown}" (unchanged)
 * 
 * @param text - Text containing variable placeholders
 * @param responses - User responses to get variable values from
 * @returns Text with variable placeholders replaced with actual values
 * 
 * @example
 * processVariablePlaceholders("Hello {name}!", responses)
 * // Returns "Hello John!" if name variable = "John"
 * 
 * processVariablePlaceholders("You selected: {colors}", responses)  
 * // Returns "You selected:\n- Red\n- Blue\n\n" if colors = ["Red", "Blue"]
 */
export function processVariablePlaceholders(
  text: string,
  responses: Responses
): string {
  return text.replace(/\{(\w+)\}/g, (match, variable) => {
    // Find response by variable name
    const responseEntry = Object.values(responses).find(
      (r) => r.variable === variable
    )
    const value = responseEntry?.value

    if (value === undefined) {
      return match // Return unchanged if variable not found
    }

    // Handle array values (from checkbox questions)
    if (Array.isArray(value)) {
      return formatArrayValue(value)
    }

    // Handle string values (from radio, text, number questions)
    return String(value)
  })
}

/**
 * Formats array values for display in text
 * 
 * @param value - Array of selected values
 * @returns Formatted string representation
 * 
 * @example
 * formatArrayValue([]) // "none"
 * formatArrayValue(["Red"]) // "Red"
 * formatArrayValue(["Red", "Blue"]) // "\n- Red\n- Blue\n\n"
 */
function formatArrayValue(value: string[]): string {
  if (value.length === 0) {
    return "none"
  } else if (value.length === 1) {
    return value[0]
  } else {
    // Convert to markdown unordered list (with leading and trailing newlines for proper rendering)
    return '\n' + value.map(item => `- ${item}`).join('\n') + '\n\n'
  }
}