"use client"

import { useState, useCallback, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import Markdown from "react-markdown"

import { Button } from "@/components/ui/button"
import { SectionContent } from "@/components/section-content"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { evaluateCondition, replacePlaceholders } from "@/lib/utils"

import { Responses, Section, VisibleSectionContent } from "@/lib/types"

interface QuestionnaireViewerProps {
  questionnaire: Section[]
}

export function QuestionnaireViewer({
  questionnaire,
}: QuestionnaireViewerProps) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0)
  const [responses, setResponses] = useState<Responses>({})

  // Check if debug mode is enabled via URL hash
  const isDebugMode =
    typeof window !== "undefined" && window.location.hash === "#debug"

  // Scroll to top when section changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentSectionIndex])

  // Get visible content for a section
  const getVisibleSectionContent = useCallback(
    (section: Section): VisibleSectionContent => {
      // Filter main section questions
      const mainQuestions = section.questions.filter((question) =>
        evaluateCondition(question.showIf || "", responses)
      )

      // Filter subsections and their questions
      const visibleSubsections = section.subsections.map((subsection) => ({
        title: subsection.title,
        content: subsection.content,
        questions: subsection.questions.filter((question) =>
          evaluateCondition(question.showIf || "", responses)
        ),
      }))

      return {
        mainQuestions,
        subsections: visibleSubsections,
      }
    },
    [responses]
  )

  const handleResponse = (
    questionId: string,
    value: string | string[]
  ): void => {
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
    alert("Questionnaire completed!")
  }

  if (!questionnaire || questionnaire.length === 0) {
    return null
  }

  const currentSection = questionnaire[currentSectionIndex]
  const sectionContent = getVisibleSectionContent(currentSection)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardContent className="space-y-6">
          {(currentSection.title || currentSection.content) && (
            <div className="whitespace-pre-wrap">
              <Markdown>
                {replacePlaceholders(currentSection.title, responses)}
              </Markdown>
              <Markdown>
                {replacePlaceholders(currentSection.content, responses)}
              </Markdown>
            </div>
          )}
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
                className="flex items-center gap-2 bg-primary hover:bg-primary/75"
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

      {/* Debug Info - only shown if URL contains #debug */}
      {isDebugMode && Object.keys(responses).length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">
              Current Responses (for testing)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded overflow-auto">
              {JSON.stringify(responses, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
