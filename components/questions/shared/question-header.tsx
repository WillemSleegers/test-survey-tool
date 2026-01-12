import { useState } from "react"
import Markdown from "react-markdown"
import { Info } from "lucide-react"
import { replacePlaceholders } from "@/lib/text-processing/replacer"
import { Variables, ComputedValues } from "@/lib/types"

interface QuestionHeaderProps {
  /** The main question text */
  text: string
  /** Optional additional description/hint text */
  subtext?: string
  /** Optional tooltip text that is initially hidden */
  tooltip?: string
  /** User variables for placeholder replacement */
  variables: Variables
  /** Computed variables from the current section */
  computedVariables?: ComputedValues
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
 *   variables={variables}
 * />
 */
export function QuestionHeader({ text, subtext, tooltip, variables, computedVariables }: QuestionHeaderProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)

  const processedText = replacePlaceholders(text, variables, computedVariables)
  const processedSubtext = subtext ? replacePlaceholders(subtext, variables, computedVariables) : undefined
  const processedTooltip = tooltip ? replacePlaceholders(tooltip, variables, computedVariables) : undefined

  return (
    <div className="space-y-1">
      <div className="relative">
        {processedTooltip && (
          <button
            type="button"
            onClick={() => setIsTooltipVisible(!isTooltipVisible)}
            className="absolute -left-8 top-0 shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Toggle additional information"
          >
            <Info className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
        <div>
          <Markdown>{processedText}</Markdown>
        </div>
      </div>
      {processedSubtext && (
        <div className="text-base text-muted-foreground">
          <Markdown>{processedSubtext}</Markdown>
        </div>
      )}
      {processedTooltip && isTooltipVisible && (
        <div className="text-base text-muted-foreground bg-muted p-3 rounded-md">
          <Markdown>{processedTooltip}</Markdown>
        </div>
      )}
    </div>
  )
}