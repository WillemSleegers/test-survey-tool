"use client"

import React, { useState } from "react"
import { Info } from "lucide-react"
import { replacePlaceholders } from "@/lib/text-processing/replacer"

import { VisibleSection, Responses, Variables, ComputedVariables } from "@/lib/types"
import { QuestionRenderer } from "./questions/question-renderer"
import Markdown from "react-markdown"

interface SectionRendererProps {
  section: VisibleSection
  responses: Responses
  variables: Variables
  onResponse: (questionId: string, value: string | string[] | number | boolean | Record<string, string>) => void
  startTabIndex: number
  computedVariables?: ComputedVariables
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

  return (
    <div className="space-y-6">
      {/* Section Title */}
      {section.title && (
        <h2 className="text-2xl font-semibold">{section.title}</h2>
      )}

      {/* Section Content */}
      {(() => {
        const processedContent = section.content ? replacePlaceholders(section.content, variables, computedVariables).trim() : ''

        if (!processedContent) return null

        const processedTooltip = section.tooltip
          ? replacePlaceholders(section.tooltip, variables, computedVariables)
          : null

        return (
          <div className="whitespace-pre-wrap space-y-2">
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
                  {processedContent}
                </Markdown>
              </div>
            </div>
            {processedTooltip && isTooltipVisible && (
              <div className="text-base text-muted-foreground bg-muted/50 p-3 rounded-md">
                <Markdown>{processedTooltip}</Markdown>
              </div>
            )}
          </div>
        )
      })()}

      {/* Section Questions */}
      <div className="space-y-6">
        {section.questions.map((question, index) => {
          // Calculate tab index for this question by counting inputs in previous questions
          let questionStartTabIndex = startTabIndex
          for (let i = 0; i < index; i++) {
            const prevQuestion = section.questions[i]
            let inputCount
            if (prevQuestion.type === 'text' || prevQuestion.type === 'essay' || prevQuestion.type === 'number') {
              inputCount = 1
            } else if (prevQuestion.type === 'multiple_choice') {
              // For radio buttons, use 1 slot if answered, all options if not answered
              const responseValue = responses[prevQuestion.id]
              const isAnswered = responseValue !== undefined && responseValue !== ""
              inputCount = isAnswered ? 1 : prevQuestion.options.length
            } else if (prevQuestion.type === 'checkbox') {
              // For checkboxes, always use all options
              inputCount = prevQuestion.options.length
            } else if (prevQuestion.type === 'matrix' || prevQuestion.type === 'breakdown') {
              // For matrix and breakdown, use options length
              inputCount = prevQuestion.options.length
            } else {
              // Default fallback
              inputCount = 1
            }
            questionStartTabIndex += inputCount
          }
          
          return (
            <QuestionRenderer
              key={question.id}
              question={question}
              responses={responses}
              variables={variables}
              onResponse={onResponse}
              startTabIndex={questionStartTabIndex}
              computedVariables={computedVariables}
            />
          )
        })}
      </div>
    </div>
  )
}
