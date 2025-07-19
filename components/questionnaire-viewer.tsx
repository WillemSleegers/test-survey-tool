"use client"

import React, { useState, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Markdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { evaluateCondition, replacePlaceholders } from "@/lib/utils"
import {
  Question,
  Responses,
  Section,
  VisibleSectionContent,
} from "@/lib/types"
import { SectionContent } from "./section-content"

interface QuestionnaireViewerProps {
  questionnaire: Section[]
  onBack: () => void
}

export function QuestionnaireViewer({
  questionnaire,
  onBack,
}: QuestionnaireViewerProps) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0)
  const [responses, setResponses] = useState<Responses>({})

  // Get visible content for a section (preserving hierarchy)
  const getVisibleSectionContent = useCallback(
    (section: Section): VisibleSectionContent => {
      // Filter main section questions
      const mainQuestions = section.questions.filter((question) =>
        evaluateCondition(question.showIf || "", responses)
      )

      // Filter subsections and their questions
      const visibleSubsections = section.subsections
        .map((subsection) => ({
          title: subsection.title,
          content: subsection.content,
          questions: subsection.questions.filter((question) =>
            evaluateCondition(question.showIf || "", responses)
          ),
        }))
        .filter((subsection) => subsection.questions.length > 0) // Only show subsections with visible questions

      return {
        mainQuestions,
        subsections: visibleSubsections,
      }
    },
    [responses]
  )

  const handleResponse = (questionId: string, value: string): void => {
    const question =
      questionnaire
        ?.flatMap((s) => s.questions)
        .find((q) => q.id === questionId) ||
      questionnaire
        ?.flatMap((s) => s.subsections || [])
        .flatMap((sub) => sub.questions)
        .find((q) => q.id === questionId)

    if (question) {
      setResponses((prev) => ({
        ...prev,
        [questionId]: {
          value,
          variable: question.variable,
        },
      }))
    }
  }

  const nextSection = (): void => {
    if (currentSectionIndex < questionnaire.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1)
    }
  }

  const prevSection = (): void => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1)
    }
  }

  const handleComplete = (): void => {
    alert(
      "Questionnaire completed! In a real app, this would submit or export the data."
    )
  }

  if (!questionnaire || questionnaire.length === 0) {
    return null
  }

  const currentSection = questionnaire[currentSectionIndex]
  const sectionContent = getVisibleSectionContent(currentSection)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <Button variant="outline" onClick={onBack}>
          ← Back to Upload
        </Button>
        <div className="text-sm text-gray-500">
          Section {currentSectionIndex + 1} of {questionnaire.length}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <Markdown>
              {replacePlaceholders(currentSection.title, responses)}
            </Markdown>
          </CardTitle>
          {currentSection.content && (
            <Markdown>
              {replacePlaceholders(currentSection.content, responses)}
            </Markdown>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <SectionContent
            content={sectionContent}
            responses={responses}
            onResponse={handleResponse}
          />

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={prevSection}
              disabled={currentSectionIndex === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {currentSectionIndex === questionnaire.length - 1 ? (
              <Button
                onClick={handleComplete}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                Complete Survey
              </Button>
            ) : (
              <Button onClick={nextSection} className="flex items-center gap-2">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {Object.keys(responses).length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">
              Current Responses (for testing)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-gray-50 p-4 rounded overflow-auto">
              {JSON.stringify(responses, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
