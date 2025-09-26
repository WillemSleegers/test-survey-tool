"use client"

import React from "react"
import { replacePlaceholders } from "@/lib/text-processing/replacer"

import { VisibleSection, Responses, Variables, ComputedVariables } from "@/lib/types"
import { QuestionRenderer } from "./questions/question-renderer"
import Markdown from "react-markdown"

interface SectionRendererProps {
  section: VisibleSection
  responses: Responses
  variables: Variables
  onResponse: (questionId: string, value: string | string[] | number | boolean) => void
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
  return (
    <div className="space-y-6">
      {/* Section Header */}
      {(() => {
        const processedContent = section.content ? replacePlaceholders(section.content, variables, computedVariables).trim() : ''

        if (!processedContent) return null

        return (
          <div className="whitespace-pre-wrap">
            <Markdown>{processedContent}</Markdown>
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
              const responseValue = responses[prevQuestion.id]
              const isAnswered = responseValue !== undefined && responseValue !== ""
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
