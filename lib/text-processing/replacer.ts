import { Responses, ComputedVariables } from "@/lib/types"
import { processConditionalPlaceholders } from "./placeholder-processor"
import { processVariablePlaceholders } from "./variable-replacer"

/**
 * Creates an extended responses object that includes computed variables
 * as pseudo-responses so they can be referenced like regular variables
 */
function createExtendedResponses(
  responses: Responses,
  computedVariables?: ComputedVariables
): Responses {
  if (!computedVariables) {
    return responses
  }
  
  const extended = { ...responses }
  
  // Add computed variables as pseudo-responses
  Object.entries(computedVariables).forEach(([name, value]) => {
    const pseudoQuestionId = `__computed_${name}`
    extended[pseudoQuestionId] = {
      value: value,
      variable: name
    }
  })
  
  return extended
}

/**
 * Main text processing function that handles both conditional and variable placeholders
 * 
 * Processing order:
 * 1. First process conditional placeholders: {{IF condition THEN text ELSE text}}
 * 2. Then process variable placeholders: {variableName}
 * 
 * This order ensures that conditionals can contain variable references,
 * and the final result has all placeholders resolved.
 * 
 * @param text - Text containing placeholders to process
 * @param responses - User responses for condition evaluation and variable replacement
 * @param computedVariables - Optional computed variables from current section
 * @returns Fully processed text with all placeholders resolved
 * 
 * @example
 * replacePlaceholders(
 *   "{{IF age >= 18 THEN Welcome {name} ELSE Access denied}}", 
 *   responses
 * )
 * // Returns "Welcome John" if age >= 18 and name = "John"
 */
export function replacePlaceholders(
  text: string | undefined,
  responses: Responses,
  computedVariables?: ComputedVariables
): string {
  if (!text) return ""

  // Create extended responses that includes computed variables
  const extendedResponses = createExtendedResponses(responses, computedVariables)

  // First process conditional placeholders, then variable placeholders
  const afterConditionals = processConditionalPlaceholders(text, extendedResponses, computedVariables)
  return processVariablePlaceholders(afterConditionals, extendedResponses)
}