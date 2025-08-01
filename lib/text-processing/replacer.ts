import { Responses } from "@/lib/types"
import { processConditionalPlaceholders } from "./placeholder-processor"
import { processVariablePlaceholders } from "./variable-replacer"

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
  responses: Responses
): string {
  if (!text) return ""

  // First process conditional placeholders, then variable placeholders
  const afterConditionals = processConditionalPlaceholders(text, responses)
  return processVariablePlaceholders(afterConditionals, responses)
}