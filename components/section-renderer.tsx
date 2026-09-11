"use client"

import React, { useState } from "react"
import { replacePlaceholders } from "@/lib/text-processing/replacer"

import { Section, Responses, Variables, OtherTexts, ComputedValues, isText, isQuestion } from "@/lib/types"
import { QuestionRenderer } from "./questions/question-renderer"
import Markdown from "react-markdown"
import { markdownImageComponents, remarkPlugins } from "@/lib/markdown-components"
import { RevealButton } from "@/components/shared/reveal-button"
import { TooltipButton } from "@/components/shared/tooltip-button"
import { useLanguage } from "@/contexts/language-context"

interface SectionRendererProps {
  section: Section
  responses: Responses
  variables: Variables
  displayVariables: Variables
  onResponse: (questionId: string, value: string | string[] | number | boolean | Record<string, string>) => void
  otherTexts: OtherTexts
  onOtherTextChange: (questionId: string, optionValue: string, text: string) => void
  startTabIndex: number
  computedVariables?: ComputedValues
}

export function SectionRenderer({
  section,
  responses,
  variables,
  displayVariables,
  onResponse,
  otherTexts,
  onOtherTextChange,
  startTabIndex,
  computedVariables,
}: SectionRendererProps) {
  const [isRevealVisible, setIsRevealVisible] = useState(false)
  const { t } = useLanguage()
  const listFormat = { empty: t('lists.none'), conjunction: t('lists.and') }

  const processedReveal = section.reveal
    ? replacePlaceholders(section.reveal, displayVariables, computedVariables, listFormat)
    : null

  const processedTooltip = section.tooltip
    ? replacePlaceholders(section.tooltip, displayVariables, computedVariables, listFormat)
    : null

  const renderContentItem = (content: string) => (
    <Markdown
      remarkPlugins={remarkPlugins}
      components={{
        ...markdownImageComponents,
        code: (props) => {
          const { children, className, ...rest } = props as {
            className?: string
            children?: React.ReactNode
          }

          // Inline code (no className)
          if (!className) {
            return (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...rest}>
                {children}
              </code>
            )
          }

          // Block code (wrapped in pre, will be styled by pre component)
          return (
            <code className="font-mono text-sm" {...rest}>
              {children}
            </code>
          )
        },
        pre: ({ children }) => (
          <div className="my-4 bg-muted p-4 rounded-lg overflow-x-auto">
            {children}
          </div>
        ),
      }}
    >
      {content}
    </Markdown>
  )

  // Calculate tab indices for questions
  let currentTabIndex = startTabIndex
  const questionTabIndices = new Map<string, number>()

  for (const item of section.items) {
    if (isQuestion(item)) {
      questionTabIndices.set(item.id, currentTabIndex)

      // Calculate input count for this question
      let inputCount
      if (item.type === 'essay' || item.type === 'number' || item.type === 'text') {
        inputCount = 1
      } else if (item.type === 'multiple_choice') {
        // For radio buttons, use 1 slot if answered, all options if not answered
        const responseValue = responses[item.id]
        const isAnswered = responseValue !== undefined && responseValue !== ""
        inputCount = isAnswered ? 1 : item.options.length
      } else if (item.type === 'checkbox') {
        // For checkboxes, always use all options
        inputCount = item.options.length
      } else if (item.type === 'matrix' || item.type === 'breakdown') {
        // For matrix and breakdown, use options length
        inputCount = item.options.length
      } else {
        // Default fallback
        inputCount = 1
      }
      currentTabIndex += inputCount
    }
  }

  return (
    <>
      {/* Section Title */}
      {(section.title || processedReveal) && (
        <div>
          {section.title ? (
            <div>
              <span className="[&_p]:inline">
                <Markdown remarkPlugins={remarkPlugins} components={markdownImageComponents}>{section.title}</Markdown>
              </span>
              {processedTooltip && <TooltipButton content={processedTooltip} />}
              {processedReveal && (
                <RevealButton
                  onClick={() => setIsRevealVisible(!isRevealVisible)}
                  className="ms-1"
                  ariaLabel="Toggle section information"
                />
              )}
            </div>
          ) : (
            processedReveal && (
              <RevealButton
                onClick={() => setIsRevealVisible(!isRevealVisible)}
                ariaLabel="Toggle section information"
              />
            )
          )}
          {processedReveal && isRevealVisible && (
            <div className="text-base text-muted-foreground bg-muted/50 p-3 rounded-md mt-2">
              <Markdown remarkPlugins={remarkPlugins} components={markdownImageComponents}>{processedReveal}</Markdown>
            </div>
          )}
        </div>
      )}

      {/* Interleaved Section Items (text and questions) */}
      {section.items.map((item, index) => {
        if (isText(item)) {
          const processedText = replacePlaceholders(item.value, displayVariables, computedVariables, listFormat).trim()
          return processedText ? (
            <React.Fragment key={`content-${index}`}>
              {renderContentItem(processedText)}
            </React.Fragment>
          ) : null
        } else {
          // Question item
          const questionStartTabIndex = questionTabIndices.get(item.id) || startTabIndex

          return (
            <QuestionRenderer
              key={item.id}
              question={item}
              responses={responses}
              variables={variables}
              displayVariables={displayVariables}
              onResponse={onResponse}
              otherTexts={otherTexts}
              onOtherTextChange={onOtherTextChange}
              startTabIndex={questionStartTabIndex}
              computedVariables={computedVariables}
            />
          )
        }
      })}
    </>
  )
}
