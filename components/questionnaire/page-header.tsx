import React, { useState } from "react"
import Markdown from "react-markdown"
import { remarkPlugins } from "@/lib/markdown-components"
import { replacePlaceholders } from "@/lib/text-processing/replacer"
import { Page, Variables, ComputedValues } from "@/lib/types"
import { RevealButton } from "@/components/shared/reveal-button"
import { TooltipButton } from "@/components/shared/tooltip-button"

interface PageHeaderProps {
  /** The page to render header for */
  page: Page
  /** User variables for placeholder replacement */
  variables: Variables
  /** Computed variables from the current page */
  computedVariables?: ComputedValues
}

/**
 * Renders the header section of a questionnaire page
 * 
 * Features:
 * - Processes placeholders in title and content
 * - Renders content as Markdown for formatting support  
 * - Only renders if there's actual content to show
 * - Handles empty/whitespace-only content gracefully
 * 
 * @example
 * <PageHeader page={currentPage} variables={variables} />
 */
export function PageHeader({ page, variables, computedVariables }: PageHeaderProps) {
  const [isRevealVisible, setIsRevealVisible] = useState(false)

  const processedTitle = page.title.trim()
    ? replacePlaceholders(page.title, variables, computedVariables).trim()
    : ''

  // Don't render anything if title is empty
  if (!processedTitle) return null

  const processedReveal = page.reveal
    ? replacePlaceholders(page.reveal, variables, computedVariables)
    : null

  const processedTooltip = page.tooltip
    ? replacePlaceholders(page.tooltip, variables, computedVariables)
    : null

  return (
    <div className="mb-6 space-y-2">
      <div className="relative">
        {processedReveal && (
          <RevealButton
            onClick={() => setIsRevealVisible(!isRevealVisible)}
            className="absolute left-0 top-1/2 -translate-x-8 -translate-y-1/2"
            ariaLabel="Toggle page information"
          />
        )}
        <div>
          <span className="[&_p]:inline">
            <Markdown remarkPlugins={remarkPlugins}>{processedTitle}</Markdown>
          </span>
          {processedTooltip && <TooltipButton content={processedTooltip} />}
        </div>
      </div>
      {processedReveal && isRevealVisible && (
        <div className="text-base text-muted-foreground bg-muted/50 p-3 rounded-md">
          <Markdown remarkPlugins={remarkPlugins}>{processedReveal}</Markdown>
        </div>
      )}
    </div>
  )
}