"use client"

import React from "react"

import { SectionRenderer } from "@/components/section-renderer"

import { Section, Responses, Variables, ComputedValues, isQuestion } from "@/lib/types"

interface PageContentProps {
  content: Section[]
  responses: Responses
  variables: Variables
  onResponse: (questionId: string, value: string | string[] | number | boolean | Record<string, string>) => void
  computedVariables?: ComputedValues
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

        // Update currentTabIndex for this section's items
        section.items.forEach(item => {
          if (isQuestion(item)) {
            let inputCount
            if (item.type === 'essay' || item.type === 'number') {
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
