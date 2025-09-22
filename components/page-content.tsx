"use client"

import React from "react"

import { QuestionRenderer } from "@/components/questions/question-renderer"
import { SectionRenderer } from "@/components/section-renderer"

import { VisiblePageContent, Responses, ComputedVariables } from "@/lib/types"

interface PageContentProps {
  content: VisiblePageContent
  responses: Responses
  onResponse: (questionId: string, value: string | string[] | Record<string, string | string[]>) => void
  computedVariables?: ComputedVariables
}

export function PageContent({
  content,
  responses,
  onResponse,
  computedVariables,
}: PageContentProps) {
  // Calculate the tab index for each question based on total inputs needed by previous questions
  let currentTabIndex = 1
  
  return (
    <div className="space-y-6">
      {/* Render main questions first */}
      {content.mainQuestions.map((question) => {
        const questionTabIndex = currentTabIndex
        
        // Calculate how many inputs this question needs for tab indexing
        let inputCount
        if (question.type === 'text' || question.type === 'number') {
          inputCount = 1
        } else if (question.type === 'multiple_choice') {
          // For radio buttons, use 1 slot if answered, all options if not answered
          const response = responses[question.id]?.value
          const isAnswered = response !== undefined && response !== ""
          inputCount = isAnswered ? 1 : question.options.length
        } else {
          // For checkboxes, always use all options
          inputCount = question.options.length
        }
        
        currentTabIndex += inputCount
        
        return (
          <QuestionRenderer
            key={question.id}
            question={question}
            responses={responses}
            onResponse={onResponse}
            startTabIndex={questionTabIndex}
            computedVariables={computedVariables}
          />
        )
      })}

      {/* Render sections */}
      {content.sections.map((section) => {
        const sectionStartTabIndex = currentTabIndex
        
        // Update currentTabIndex for this section's questions
        section.questions.forEach(question => {
          let inputCount
          if (question.type === 'text' || question.type === 'number') {
            inputCount = 1
          } else if (question.type === 'multiple_choice') {
            // For radio buttons, use 1 slot if answered, all options if not answered
            const response = responses[question.id]?.value
            const isAnswered = response !== undefined && response !== ""
            inputCount = isAnswered ? 1 : question.options.length
          } else {
            // For checkboxes, always use all options
            inputCount = question.options.length
          }
          currentTabIndex += inputCount
        })
        
        return (
          <SectionRenderer
            key={section.title}
            section={section}
            responses={responses}
            onResponse={onResponse}
            startTabIndex={sectionStartTabIndex}
            computedVariables={computedVariables}
          />
        )
      })}
    </div>
  )
}
