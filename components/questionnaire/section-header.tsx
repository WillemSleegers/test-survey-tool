import React from "react"
import Markdown from "react-markdown"
import { replacePlaceholders } from "@/lib/text-processing/replacer"
import { Section, Responses } from "@/lib/types"

interface SectionHeaderProps {
  /** The section to render header for */
  section: Section
  /** User responses for placeholder replacement */
  responses: Responses
}

/**
 * Renders the header section of a questionnaire section
 * 
 * Features:
 * - Processes placeholders in title and content
 * - Renders content as Markdown for formatting support  
 * - Only renders if there's actual content to show
 * - Handles empty/whitespace-only content gracefully
 * 
 * @example
 * <SectionHeader section={currentSection} responses={responses} />
 */
export function SectionHeader({ section, responses }: SectionHeaderProps) {
  const processedTitle = section.title.trim() 
    ? replacePlaceholders(section.title, responses).trim() 
    : ''
  const processedContent = section.content.trim() 
    ? replacePlaceholders(section.content, responses).trim() 
    : ''
  
  // Don't render anything if both title and content are empty
  if (!processedTitle && !processedContent) return null
  
  return (
    <div className="whitespace-pre-wrap">
      {processedTitle && (
        <Markdown>{processedTitle}</Markdown>
      )}
      {processedContent && (
        <Markdown>{processedContent}</Markdown>
      )}
    </div>
  )
}