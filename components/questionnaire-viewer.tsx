"use client"

import { useState, useCallback, useEffect } from "react"
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
import { useLanguage } from "@/contexts/language-context"

import {
  evaluateCondition,
  replacePlaceholders,
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
  const { t } = useLanguage()

  // Check if debug mode is enabled via URL hash
  const isDebugMode =
    typeof window !== "undefined" && window.location.hash === "#debug"

  // Get only visible sections - now based purely on SHOW_IF conditions
  const visibleSections = questionnaire.filter((section) =>
    evaluateCondition(section.showIf || "", responses)
  )

  // Get visible content for a section
  const getVisibleSectionContent = useCallback(
    (section: Section): VisibleSectionContent => {
      // Questions inherit section visibility - they're only checked if section is already visible
      // Since we only call this for visible sections, we just need to check individual question conditions
      
      // Filter main section questions based on their individual SHOW_IF conditions
      const mainQuestions = section.questions.filter((question) =>
        evaluateCondition(question.showIf || "", responses)
      )

      // Filter subsections and their questions based on individual SHOW_IF conditions
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

  // Check if all questions in current section are answered
  const currentSection = visibleSections[currentVisibleSectionIndex]
  const allQuestionsAnswered = currentSection ? (() => {
    const sectionContent = getVisibleSectionContent(currentSection)
    const allQuestions = [
      ...sectionContent.mainQuestions,
      ...sectionContent.subsections.flatMap(sub => sub.questions)
    ]
    return allQuestions.every(question => {
      const response = responses[question.id]?.value
      if (question.type === 'checkbox') {
        return Array.isArray(response) && response.length > 0
      }
      return response !== undefined && response !== ''
    })
  })() : false

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

  // Initialize default responses for visible questions
  useEffect(() => {
    const currentSection = visibleSections[currentVisibleSectionIndex]
    if (!currentSection) return

    const sectionContent = getVisibleSectionContent(currentSection)
    const allVisibleQuestions = [
      ...sectionContent.mainQuestions,
      ...sectionContent.subsections.flatMap(sub => sub.questions)
    ]

    setResponses(prev => {
      const newResponses = { ...prev }
      let hasChanges = false

      allVisibleQuestions.forEach(question => {
        if (!newResponses[question.id]) {
          // Initialize with appropriate default value based on question type
          const defaultValue = question.type === 'checkbox' ? [] : ''
          newResponses[question.id] = {
            value: defaultValue,
            variable: question.variable,
          }
          hasChanges = true
        }
      })

      return hasChanges ? newResponses : prev
    })
  }, [currentVisibleSectionIndex, visibleSections, getVisibleSectionContent])

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
      // Remove focus from button after navigation
      setTimeout(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
      }, 0)
    }
  }

  const prevSection = (): void => {
    if (currentVisibleSectionIndex > 0) {
      setCurrentVisibleSectionIndex(currentVisibleSectionIndex - 1)
      // Remove focus from button after navigation
      setTimeout(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
      }, 0)
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
              {t('errors.noSections')}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Safety check - if no current section, don't render anything
  if (!currentSection) {
    return null
  }
  
  const sectionContent = getVisibleSectionContent(currentSection)
  
  // Calculate total number of input elements for tab indexing
  const totalInputs = sectionContent.mainQuestions.reduce((sum, question) => {
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
    return sum + inputCount
  }, 0) + sectionContent.subsections.reduce((sum, sub) => {
    return sum + sub.questions.reduce((subSum, question) => {
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
      return subSum + inputCount
    }, 0)
  }, 0)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardContent className="space-y-6">
          {(() => {
            const processedTitle = currentSection.title.trim() ? replacePlaceholders(currentSection.title, responses).trim() : ''
            const processedContent = currentSection.content.trim() ? replacePlaceholders(currentSection.content, responses).trim() : ''
            
            if (!processedTitle && !processedContent) return null
            
            return (
              <div className="whitespace-pre-wrap">
                {processedTitle && (
                  <Markdown>{processedTitle}</Markdown>
                )}
                {processedContent && (
                  <Markdown>{processedContent}</Markdown>
                )}
              </div>
            )
          })()}
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
              tabIndex={allQuestionsAnswered ? -1 : totalInputs + 1}
            >
              <ChevronLeft className="h-4 w-4" />
              {t('navigation.previous')}
            </Button>

            {currentVisibleSectionIndex === visibleSections.length - 1 ? (
              <Button
                onClick={handleComplete}
                className="flex items-center gap-2 bg-primary hover:bg-primary/75"
                tabIndex={totalInputs + 2}
              >
                {t('navigation.complete')}
              </Button>
            ) : (
              <Button 
                onClick={nextSection} 
                className="flex items-center gap-2"
                tabIndex={totalInputs + 2}
              >
                {t('navigation.next')}
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
                  {questionnaire.map((section, index) => {
                    const isVisible = evaluateCondition(section.showIf || "", responses)
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isVisible ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        <span
                          className={`${
                            isVisible ? "" : "line-through text-muted-foreground"
                          }`}
                        >
                          Section {index + 1}: {section.title || "(Untitled)"}
                          {section.showIf && ` [SHOW_IF: ${section.showIf}]`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <AlertDialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('completion.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('completion.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>{t('completion.close')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
