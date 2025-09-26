import React from "react"
import Markdown from "react-markdown"
import { replacePlaceholders } from "@/lib/text-processing/replacer"
import { Variables, ComputedVariables } from "@/lib/types"

interface QuestionHeaderProps {
  /** The main question text */
  text: string
  /** Optional additional description/hint text */
  subtext?: string
  /** User variables for placeholder replacement */
  variables: Variables
  /** Computed variables from the current section */
  computedVariables?: ComputedVariables
}

/**
 * Renders the header section of a question including title and optional subtext
 * 
 * Features:
 * - Processes placeholders in both text and subtext
 * - Renders content as Markdown for formatting support
 * - Consistent styling across all question types
 * 
 * @example
 * <QuestionHeader 
 *   text="What is your age?" 
 *   subtext="This helps us customize your experience"
 *   responses={responses}
 * />
 */
export function QuestionHeader({ text, subtext, variables, computedVariables }: QuestionHeaderProps) {
  const processedText = replacePlaceholders(text, variables, computedVariables)
  const processedSubtext = subtext ? replacePlaceholders(subtext, variables, computedVariables) : undefined

  return (
    <div className="space-y-1">
      <Markdown>{processedText}</Markdown>
      {processedSubtext && (
        <div className="text-base text-muted-foreground whitespace-pre-wrap">
          <Markdown>{processedSubtext}</Markdown>
        </div>
      )}
    </div>
  )
}