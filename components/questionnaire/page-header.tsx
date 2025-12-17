import React, { useState } from "react"
import Markdown from "react-markdown"
import { Info } from "lucide-react"
import { replacePlaceholders } from "@/lib/text-processing/replacer"
import { Page, Variables, ComputedValues } from "@/lib/types"

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
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)

  const processedTitle = page.title.trim()
    ? replacePlaceholders(page.title, variables, computedVariables).trim()
    : ''

  // Don't render anything if title is empty
  if (!processedTitle) return null

  const processedTooltip = page.tooltip
    ? replacePlaceholders(page.tooltip, variables, computedVariables)
    : null

  return (
    <div className="whitespace-pre-wrap">
      <div className="mb-6 space-y-2">
        <div className="relative">
          {processedTooltip && (
            <button
              type="button"
              onClick={() => setIsTooltipVisible(!isTooltipVisible)}
              className="absolute left-0 top-0 p-1 rounded-full hover:bg-muted transition-colors -translate-x-8"
              aria-label="Toggle page information"
            >
              <Info className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
          <div className="text-2xl">
            <Markdown>{processedTitle}</Markdown>
          </div>
        </div>
        {processedTooltip && isTooltipVisible && (
          <div className="text-base text-muted-foreground bg-muted/50 p-3 rounded-md">
            <Markdown>{processedTooltip}</Markdown>
          </div>
        )}
      </div>
    </div>
  )
}