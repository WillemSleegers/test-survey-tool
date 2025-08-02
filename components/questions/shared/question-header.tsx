import React from "react"
import Markdown from "react-markdown"
import { replacePlaceholders } from "@/lib/text-processing/replacer"
import { Responses, ComputedVariables } from "@/lib/types"

interface QuestionHeaderProps {
  /** The main question text */
  text: string
  /** Optional additional description/hint text */
  subtext?: string
  /** User responses for placeholder replacement */
  responses: Responses
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
export function QuestionHeader({ text, subtext, responses, computedVariables }: QuestionHeaderProps) {
  const processedText = replacePlaceholders(text, responses, computedVariables)
  const processedSubtext = subtext ? replacePlaceholders(subtext, responses, computedVariables) : undefined

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