"use client"

import React from "react"
import { replacePlaceholders } from "@/lib/utils"

import { VisibleSubsection, Responses } from "@/lib/types"
import { QuestionRenderer } from "./question-renderer"

interface SubsectionRendererProps {
  subsection: VisibleSubsection
  responses: Responses
  onResponse: (questionId: string, value: string) => void
}

export function SubsectionRenderer({
  subsection,
  responses,
  onResponse,
}: SubsectionRendererProps) {
  return (
    <div className="mt-8">
      {/* Subsection Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {replacePlaceholders(subsection.title, responses)}
        </h3>
        {subsection.content && (
          <p className="text-gray-600 mb-4">
            {replacePlaceholders(subsection.content, responses)}
          </p>
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
