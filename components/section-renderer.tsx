"use client"

import React from "react"
import { replacePlaceholders } from "@/lib/text-processing/replacer"

import { VisibleSection, Responses, ComputedVariables } from "@/lib/types"
import { QuestionRenderer } from "./questions/question-renderer"
import Markdown from "react-markdown"

interface SectionRendererProps {
  section: VisibleSection
  responses: Responses
  onResponse: (questionId: string, value: string | string[] | Record<string, string | string[]>) => void
  startTabIndex: number
  computedVariables?: ComputedVariables
}

export function SectionRenderer({
  section,
  responses,
  onResponse,
  startTabIndex,
  computedVariables,
}: SectionRendererProps) {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      {(() => {
        const processedTitle = replacePlaceholders(section.title, responses, computedVariables).trim()
        const processedContent = section.content ? replacePlaceholders(section.content, responses, computedVariables).trim() : ''
        
        if (!processedTitle && !processedContent) return null
        
        return (
          <div className="whitespace-pre-wrap">
            {processedTitle && <Markdown>{processedTitle}</Markdown>}
            {processedContent && <Markdown>{processedContent}</Markdown>}
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
            if (prevQuestion.type === 'text' || prevQuestion.type === 'number') {
              inputCount = 1
            } else if (prevQuestion.type === 'multiple_choice') {
              // For radio buttons, use 1 slot if answered, all options if not answered
              const response = responses[prevQuestion.id]?.value
              const isAnswered = response !== undefined && response !== ""
              inputCount = isAnswered ? 1 : prevQuestion.options.length
            } else {
              // For checkboxes, always use all options
              inputCount = prevQuestion.options.length
            }
            questionStartTabIndex += inputCount
          }
          
          return (
            <QuestionRenderer
              key={question.id}
              question={question}
              responses={responses}
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
