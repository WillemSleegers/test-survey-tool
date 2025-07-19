"use client"

import React from "react"

import { VisibleSectionContent, Responses } from "@/lib/types"
import { QuestionRenderer } from "./question-renderer"
import { SubsectionRenderer } from "./subsection-renderer"

interface SectionContentProps {
  content: VisibleSectionContent
  responses: Responses
  onResponse: (questionId: string, value: string) => void
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
