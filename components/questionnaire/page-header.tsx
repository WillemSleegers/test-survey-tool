import React from "react"
import Markdown from "react-markdown"
import { replacePlaceholders } from "@/lib/text-processing/replacer"
import { Page, Responses, ComputedVariables } from "@/lib/types"

interface PageHeaderProps {
  /** The page to render header for */
  page: Page
  /** User responses for placeholder replacement */
  responses: Responses
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
 * <PageHeader page={currentPage} responses={responses} />
 */
export function PageHeader({ page, responses, computedVariables }: PageHeaderProps) {
  const processedTitle = page.title.trim() 
    ? replacePlaceholders(page.title, responses, computedVariables).trim() 
    : ''
  const processedContent = page.content.trim() 
    ? replacePlaceholders(page.content, responses, computedVariables).trim() 
    : ''
  
  // Don't render anything if both title and content are empty
  if (!processedTitle && !processedContent) return null
  
  return (
    <div className="whitespace-pre-wrap">
      {processedTitle && (
        <div className="mb-6">
          <Markdown>{processedTitle}</Markdown>
        </div>
      )}
      {processedContent && (
        <Markdown>{processedContent}</Markdown>
      )}
    </div>
  )
}