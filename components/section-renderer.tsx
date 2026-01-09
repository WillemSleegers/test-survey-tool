"use client"

import React, { useState } from "react"
import { Info } from "lucide-react"
import { replacePlaceholders } from "@/lib/text-processing/replacer"

import { Section, Responses, Variables, ComputedValues, isText, isQuestion } from "@/lib/types"
import { QuestionRenderer } from "./questions/question-renderer"
import Markdown from "react-markdown"

interface SectionRendererProps {
  section: Section
  responses: Responses
  variables: Variables
  onResponse: (questionId: string, value: string | string[] | number | boolean | Record<string, string>) => void
  startTabIndex: number
  computedVariables?: ComputedValues
}

export function SectionRenderer({
  section,
  responses,
  variables,
  onResponse,
  startTabIndex,
  computedVariables,
}: SectionRendererProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)

  const processedTooltip = section.tooltip
    ? replacePlaceholders(section.tooltip, variables, computedVariables)
    : null

  const renderContentItem = (content: string) => (
    <Markdown
      components={{
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
      {section.title && (
        <div className="relative">
          {processedTooltip && (
            <button
              type="button"
              onClick={() => setIsTooltipVisible(!isTooltipVisible)}
              className="absolute left-0 top-0 p-1 rounded-full hover:bg-muted transition-colors -translate-x-8"
              aria-label="Toggle section information"
            >
              <Info className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
          <div>
            <Markdown>{section.title}</Markdown>
          </div>
          {processedTooltip && isTooltipVisible && (
            <div className="text-base text-muted-foreground bg-muted/50 p-3 rounded-md mt-2">
              <Markdown>{processedTooltip}</Markdown>
            </div>
          )}
        </div>
      )}

      {/* Interleaved Section Items (text and questions) */}
      {section.items.map((item, index) => {
        if (isText(item)) {
          const processedText = replacePlaceholders(item.value, variables, computedVariables).trim()
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
              onResponse={onResponse}
              startTabIndex={questionStartTabIndex}
              computedVariables={computedVariables}
            />
          )
        }
      })}
    </>
  )
}
