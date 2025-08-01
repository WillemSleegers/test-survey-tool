"use client"

import React from "react"
import { replacePlaceholders } from "@/lib/utils"

import { VisibleSubsection, Responses } from "@/lib/types"
import { QuestionRenderer } from "./question-renderer"
import Markdown from "react-markdown"

interface SubsectionRendererProps {
  subsection: VisibleSubsection
  responses: Responses
  onResponse: (questionId: string, value: string | string[]) => void
  startTabIndex: number
}

export function SubsectionRenderer({
  subsection,
  responses,
  onResponse,
  startTabIndex,
}: SubsectionRendererProps) {
  return (
    <div className="space-y-6">
      {/* Subsection Header */}
      {(() => {
        const processedTitle = replacePlaceholders(subsection.title, responses).trim()
        const processedContent = subsection.content ? replacePlaceholders(subsection.content, responses).trim() : ''
        
        if (!processedTitle && !processedContent) return null
        
        return (
          <div className="whitespace-pre-wrap">
            {processedTitle && <Markdown>{processedTitle}</Markdown>}
            {processedContent && <Markdown>{processedContent}</Markdown>}
          </div>
        )
      })()}

      {/* Subsection Questions */}
      <div className="space-y-6">
        {subsection.questions.map((question, index) => {
          // Calculate tab index for this question by counting inputs in previous questions
          let questionStartTabIndex = startTabIndex
          for (let i = 0; i < index; i++) {
            const prevQuestion = subsection.questions[i]
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
            />
          )
        })}
      </div>
    </div>
  )
}
