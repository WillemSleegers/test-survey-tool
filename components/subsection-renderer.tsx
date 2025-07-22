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
}

export function SubsectionRenderer({
  subsection,
  responses,
  onResponse,
}: SubsectionRendererProps) {
  return (
    <div className="space-y-6">
      {/* Subsection Header */}
      <div className="whitespace-pre-wrap">
        <Markdown>{replacePlaceholders(subsection.title, responses)}</Markdown>
        {subsection.content && (
          <Markdown>
            {replacePlaceholders(subsection.content, responses)}
          </Markdown>
        )}
      </div>

      {/* Subsection Questions */}
      <div className="space-y-6">
        {subsection.questions.map((question) => (
          <QuestionRenderer
            key={question.id}
            question={question}
            responses={responses}
            onResponse={onResponse}
          />
        ))}
      </div>
    </div>
  )
}
