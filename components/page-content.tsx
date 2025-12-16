"use client"

import React from "react"

import { SectionRenderer } from "@/components/section-renderer"

import { Section, Responses, Variables, ComputedVariables } from "@/lib/types"

interface PageContentProps {
  content: Section[]
  responses: Responses
  variables: Variables
  onResponse: (questionId: string, value: string | string[] | number | boolean | Record<string, string>) => void
  computedVariables?: ComputedVariables
}

export function PageContent({
  content,
  responses,
  variables,
  onResponse,
  computedVariables,
}: PageContentProps) {
  // Calculate the tab index for each question based on total inputs needed by previous questions
  let currentTabIndex = 1
  
  return (
    <div className="space-y-6">
      {/* Render sections */}
      {content.map((section, index) => {
        const sectionStartTabIndex = currentTabIndex
        
        // Update currentTabIndex for this section's questions
        section.questions.forEach(question => {
          let inputCount
          if (question.type === 'text' || question.type === 'essay' || question.type === 'number') {
            inputCount = 1
          } else if (question.type === 'multiple_choice') {
            // For radio buttons, use 1 slot if answered, all options if not answered
            const responseValue = responses[question.id]
            const isAnswered = responseValue !== undefined && responseValue !== ""
            inputCount = isAnswered ? 1 : question.options.length
          } else if (question.type === 'checkbox') {
            // For checkboxes, always use all options
            inputCount = question.options.length
          } else if (question.type === 'matrix' || question.type === 'breakdown') {
            // For matrix and breakdown, use options length
            inputCount = question.options.length
          } else {
            // Default fallback
            inputCount = 1
          }
          currentTabIndex += inputCount
        })
        
        return (
          <SectionRenderer
            key={`section-${index}`}
            section={section}
            responses={responses}
            variables={variables}
            onResponse={onResponse}
            startTabIndex={sectionStartTabIndex}
            computedVariables={computedVariables}
          />
        )
      })}
    </div>
  )
}
