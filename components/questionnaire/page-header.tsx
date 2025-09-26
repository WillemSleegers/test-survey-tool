import React from "react"
import Markdown from "react-markdown"
import { replacePlaceholders } from "@/lib/text-processing/replacer"
import { Page, Variables, ComputedVariables } from "@/lib/types"

interface PageHeaderProps {
  /** The page to render header for */
  page: Page
  /** User variables for placeholder replacement */
  variables: Variables
  /** Computed variables from the current page */
  computedVariables?: ComputedVariables
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
  const processedTitle = page.title.trim()
    ? replacePlaceholders(page.title, variables, computedVariables).trim()
    : ''

  // Don't render anything if title is empty
  if (!processedTitle) return null

  return (
    <div className="whitespace-pre-wrap">
      <div className="mb-6">
        <Markdown>{processedTitle}</Markdown>
      </div>
    </div>
  )
}