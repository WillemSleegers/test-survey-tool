import { Variables, ComputedVariables } from "@/lib/types"
import { processConditionalPlaceholders } from "./placeholder-processor"
import { processVariablePlaceholders } from "./variable-replacer"

/**
 * Creates an extended variables object that includes computed variables
 * as regular variables so they can be referenced like user variables
 */
function createExtendedVariables(
  variables: Variables,
  computedVariables?: ComputedVariables
): Variables {
  if (!computedVariables) {
    return variables
  }

  return { ...variables, ...computedVariables }
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
 * @param variables - User variables for condition evaluation and variable replacement
 * @param computedVariables - Optional computed variables from current section
 * @returns Fully processed text with all placeholders resolved
 * 
 * @example
 * replacePlaceholders(
 *   "{{IF age >= 18 THEN Welcome {name} ELSE Access denied}}",
 *   variables
 * )
 * // Returns "Welcome John" if age >= 18 and name = "John"
 */
export function replacePlaceholders(
  text: string | undefined,
  variables: Variables,
  computedVariables?: ComputedVariables
): string {
  if (!text) return ""

  // Create extended variables that includes computed variables
  const extendedVariables = createExtendedVariables(variables, computedVariables)

  // First process conditional placeholders, then variable placeholders
  const afterConditionals = processConditionalPlaceholders(text, extendedVariables, computedVariables)
  return processVariablePlaceholders(afterConditionals, extendedVariables)
}