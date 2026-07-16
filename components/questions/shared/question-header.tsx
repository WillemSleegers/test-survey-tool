import { useState } from "react"
import Markdown from "react-markdown"
import { replacePlaceholders } from "@/lib/text-processing/replacer"
import { Variables, ComputedValues } from "@/lib/types"
import { markdownImageComponents, remarkPlugins } from "@/lib/markdown-components"
import { RevealButton } from "@/components/shared/reveal-button"
import { TooltipButton } from "@/components/shared/tooltip-button"

interface QuestionHeaderProps {
  /** The main question text */
  text: string
  /** Optional additional description/hint text */
  subtext?: string
  /** Optional text that is revealed inline on click */
  reveal?: string
  /** Optional text shown in a popover on click */
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
 * - Collapsible reveal panel and popover tooltip, each with their own icon button
 *
 * @example
 * <QuestionHeader
 *   text="What is your age?"
 *   subtext="This helps us customize your experience"
 *   reveal="Additional information shown inline on demand"
 *   tooltip="Additional information shown in a popover on demand"
 *   variables={variables}
 * />
 */
export function QuestionHeader({ text, subtext, reveal, tooltip, variables, computedVariables }: QuestionHeaderProps) {
  const [isRevealVisible, setIsRevealVisible] = useState(false)

  const processedText = replacePlaceholders(text, variables, computedVariables)
  const processedSubtext = subtext ? replacePlaceholders(subtext, variables, computedVariables) : undefined
  const processedReveal = reveal ? replacePlaceholders(reveal, variables, computedVariables) : undefined
  const processedTooltip = tooltip ? replacePlaceholders(tooltip, variables, computedVariables) : undefined

  return (
    <div className="space-y-1">
      <div className="relative">
        {processedReveal && (
          <RevealButton
            onClick={() => setIsRevealVisible(!isRevealVisible)}
            className="absolute -left-8 top-1/2 -translate-y-1/2"
          />
        )}
        <div>
          <span className="[&_p]:inline">
            <Markdown remarkPlugins={remarkPlugins} components={markdownImageComponents}>{processedText}</Markdown>
          </span>
          {processedTooltip && <TooltipButton content={processedTooltip} />}
        </div>
      </div>
      {processedSubtext && (
        <div className="text-base text-muted-foreground">
          <Markdown remarkPlugins={remarkPlugins} components={markdownImageComponents}>{processedSubtext}</Markdown>
        </div>
      )}
      {processedReveal && isRevealVisible && (
        <div className="text-base text-muted-foreground bg-muted p-3 rounded-md">
          <Markdown remarkPlugins={remarkPlugins} components={markdownImageComponents}>{processedReveal}</Markdown>
        </div>
      )}
    </div>
  )
}