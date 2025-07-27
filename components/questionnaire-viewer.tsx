"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import Markdown from "react-markdown"

import { Button } from "@/components/ui/button"
import { SectionContent } from "@/components/section-content"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import {
  evaluateCondition,
  replacePlaceholders,
  isSectionVisible,
} from "@/lib/utils"

import { Responses, Section, VisibleSectionContent } from "@/lib/types"

interface QuestionnaireViewerProps {
  questionnaire: Section[]
}

export function QuestionnaireViewer({
  questionnaire,
}: QuestionnaireViewerProps) {
  const [responses, setResponses] = useState<Responses>({})
  const [currentVisibleSectionIndex, setCurrentVisibleSectionIndex] =
    useState<number>(0)
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)

  // Check if debug mode is enabled via URL hash
  const isDebugMode =
    typeof window !== "undefined" && window.location.hash === "#debug"

  // Get only visible sections
  const visibleSections = useMemo(() => {
    return questionnaire.filter((section) =>
      isSectionVisible(section, responses)
    )
  }, [questionnaire, responses])

  // Make sure current section index is valid when visible sections change
  useEffect(() => {
    if (currentVisibleSectionIndex >= visibleSections.length) {
      setCurrentVisibleSectionIndex(Math.max(0, visibleSections.length - 1))
    }
  }, [visibleSections.length, currentVisibleSectionIndex])

  // Scroll to top when section changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentVisibleSectionIndex])

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
    if (currentVisibleSectionIndex < visibleSections.length - 1) {
      setCurrentVisibleSectionIndex(currentVisibleSectionIndex + 1)
    }
  }

  const prevSection = (): void => {
    if (currentVisibleSectionIndex > 0) {
      setCurrentVisibleSectionIndex(currentVisibleSectionIndex - 1)
    }
  }

  const handleComplete = (): void => {
    setShowCompletionDialog(true)
  }

  if (!questionnaire || questionnaire.length === 0) {
    return null
  }

  if (visibleSections.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              No sections are currently visible based on your responses.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentSection = visibleSections[currentVisibleSectionIndex]
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
              disabled={currentVisibleSectionIndex === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {currentVisibleSectionIndex === visibleSections.length - 1 ? (
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
      {isDebugMode && (
        <>
          {Object.keys(responses).length > 0 && (
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

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">
                Section Visibility (for testing)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>Total sections: {questionnaire.length}</p>
                <p>Visible sections: {visibleSections.length}</p>
                <p>
                  Current visible section index:{" "}
                  {currentVisibleSectionIndex + 1} of {visibleSections.length}
                </p>
                <div className="mt-4">
                  <p className="font-medium mb-2">Section visibility:</p>
                  {questionnaire.map((section, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isSectionVisible(section, responses)
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      />
                      <span
                        className={`${
                          isSectionVisible(section, responses)
                            ? ""
                            : "line-through text-muted-foreground"
                        }`}
                      >
                        Section {index + 1}: {section.title || "(Untitled)"}
                        {section.showIf && ` [SHOW_IF: ${section.showIf}]`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <AlertDialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Survey Complete!</AlertDialogTitle>
            <AlertDialogDescription>
              Thank you for completing the questionnaire. Your responses have been recorded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
