"use client"

import React from "react"

import { QuestionRenderer } from "@/components/question-renderer"
import { SubsectionRenderer } from "@/components/subsection-renderer"

import { VisibleSectionContent, Responses } from "@/lib/types"

interface SectionContentProps {
  content: VisibleSectionContent
  responses: Responses
  onResponse: (questionId: string, value: string | string[]) => void
}

export function SectionContent({
  content,
  responses,
  onResponse,
}: SectionContentProps) {
  return (
    <div className="space-y-6">
      {/* Render main questions first */}
      {content.mainQuestions.map((question) => (
        <QuestionRenderer
          key={question.id}
          question={question}
          responses={responses}
          onResponse={onResponse}
        />
      ))}

      {/* Render subsections */}
      {content.subsections.map((subsection) => (
        <SubsectionRenderer
          key={subsection.title}
          subsection={subsection}
          responses={responses}
          onResponse={onResponse}
        />
      ))}
    </div>
  )
}
