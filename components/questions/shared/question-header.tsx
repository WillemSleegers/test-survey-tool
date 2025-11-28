import React, { useState } from "react"
import Markdown from "react-markdown"
import { replacePlaceholders } from "@/lib/text-processing/replacer"
import { Responses, ComputedVariables } from "@/lib/types"
import { Info } from "lucide-react"

interface QuestionHeaderProps {
  /** The main question text */
  text: string
  /** Optional additional description/hint text */
  subtext?: string
  /** Optional tooltip text that is initially hidden */
  tooltip?: string
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
 * - Collapsible tooltip with info icon button
 *
 * @example
 * <QuestionHeader
 *   text="What is your age?"
 *   subtext="This helps us customize your experience"
 *   tooltip="Additional information shown on demand"
 *   responses={responses}
 * />
 */
export function QuestionHeader({ text, subtext, tooltip, responses, computedVariables }: QuestionHeaderProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)

  const processedText = replacePlaceholders(text, responses, computedVariables)
  const processedSubtext = subtext ? replacePlaceholders(subtext, responses, computedVariables) : undefined
  const processedTooltip = tooltip ? replacePlaceholders(tooltip, responses, computedVariables) : undefined

  return (
    <div className="space-y-1">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <Markdown>{processedText}</Markdown>
        </div>
        {processedTooltip && (
          <button
            type="button"
            onClick={() => setIsTooltipVisible(!isTooltipVisible)}
            className="shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Toggle additional information"
          >
            <Info className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>
      {processedSubtext && (
        <div className="text-base text-muted-foreground whitespace-pre-wrap">
          <Markdown>{processedSubtext}</Markdown>
        </div>
      )}
      {processedTooltip && isTooltipVisible && (
        <div className="text-base text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-md">
          <Markdown>{processedTooltip}</Markdown>
        </div>
      )}
    </div>
  )
}