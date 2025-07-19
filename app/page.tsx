"use client"

import React, { useState, useCallback } from "react"
import { Upload, ChevronLeft, ChevronRight, FileText } from "lucide-react"
import Markdown from "react-markdown"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { evaluateCondition, replacePlaceholders } from "@/lib/utils"
import { Question, Responses, Section, Subsection } from "@/lib/types"
import { SAMPLE_TEXT } from "@/lib/constants"

export function QuestionnaireApp() {
  const [questionnaire, setQuestionnaire] = useState<Section[] | null>(null)
  const [responses, setResponses] = useState<Responses>({})

  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0)

  const [error, setError] = useState<string>("")
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false)

  // Parse the text format into structured data
  // Replace the parseQuestionnaire function with this:
  const parseQuestionnaire = useCallback((text: string): Section[] => {
    try {
      const sections: Section[] = []
      // Don't filter empty lines - preserve them for Markdown
      const lines = text.split("\n")

      let currentSection: Section | null = null
      let currentQuestion: Question | null = null
      let currentSubsection: Subsection | null = null
      let i = 0

      while (i < lines.length) {
        const line = lines[i]
        const trimmedLine = line.trim()

        // Section header (Markdown style)
        if (trimmedLine.startsWith("# ")) {
          if (currentSection) {
            if (currentQuestion) {
              if (currentSubsection) {
                currentSubsection.questions.push(currentQuestion)
              } else {
                currentSection.questions.push(currentQuestion)
              }
            }
            if (currentSubsection) {
              currentSection.subsections.push(currentSubsection)
            }
            sections.push(currentSection)
          }
          currentSection = {
            title: trimmedLine.substring(2).trim(),
            content: "",
            questions: [],
            subsections: [],
          }
          currentQuestion = null
          currentSubsection = null
        }
        // Subsection header
        else if (trimmedLine.startsWith("## ")) {
          if (currentQuestion) {
            if (currentSubsection) {
              currentSubsection.questions.push(currentQuestion)
            } else if (currentSection) {
              currentSection.questions.push(currentQuestion)
            }
          }
          if (currentSubsection && currentSection) {
            currentSection.subsections.push(currentSubsection)
          }
          currentSubsection = {
            title: trimmedLine.substring(3).trim(),
            content: "",
            questions: [],
          }
          currentQuestion = null
        }
        // Question
        else if (trimmedLine.match(/^Q\d+:/)) {
          if (currentQuestion) {
            if (currentSubsection) {
              currentSubsection.questions.push(currentQuestion)
            } else if (currentSection) {
              currentSection.questions.push(currentQuestion)
            }
          }
          const idMatch = trimmedLine.match(/^Q(\d+):/)
          currentQuestion = {
            id: idMatch ? idMatch[1] : "0",
            text: trimmedLine.substring(trimmedLine.indexOf(":") + 1).trim(),
            type: "multiple_choice",
            options: [],
          }
        }
        // Multiple choice option - ONLY when we're in a question context
        else if (
          currentQuestion &&
          (trimmedLine.match(/^-\s*([A-Z]\))?(.+)/) ||
            trimmedLine.match(/^-\s+(.+)/))
        ) {
          let optionText: string
          // Check for old format with letters first
          const oldFormatMatch = trimmedLine.match(/^-\s*[A-Z]\)\s*(.+)/)
          if (oldFormatMatch) {
            optionText = oldFormatMatch[1]
          } else {
            // New format without letters
            optionText = trimmedLine.substring(1).trim()
          }

          currentQuestion.options.push({
            value: optionText,
            label: optionText,
          })
        }
        // Input type
        else if (trimmedLine === "TEXT_INPUT") {
          if (currentQuestion) {
            currentQuestion.type = "text"
            currentQuestion.options = []
          }
        } else if (trimmedLine === "NUMBER_INPUT") {
          if (currentQuestion) {
            currentQuestion.type = "number"
            currentQuestion.options = []
          }
        }
        // Variable assignment
        else if (trimmedLine.startsWith("VARIABLE:")) {
          if (currentQuestion) {
            currentQuestion.variable = trimmedLine.substring(9).trim()
          }
        }
        // Conditional display
        else if (trimmedLine.startsWith("SHOW_IF:")) {
          if (currentQuestion) {
            currentQuestion.showIf = trimmedLine.substring(8).trim()
          }
        }
        // Section content - preserve original formatting including newlines
        else if (
          !trimmedLine.startsWith("Q") &&
          !trimmedLine.startsWith("VARIABLE:") &&
          !trimmedLine.startsWith("SHOW_IF:") &&
          !trimmedLine.includes("_INPUT")
        ) {
          if (currentSection && !currentQuestion) {
            if (currentSubsection) {
              // Preserve newlines for Markdown
              currentSubsection.content +=
                (currentSubsection.content ? "\n" : "") + line
            } else {
              // Preserve newlines for Markdown
              currentSection.content +=
                (currentSection.content ? "\n" : "") + line
            }
          }
        }

        i++
      }

      // Add the last section and question
      if (currentQuestion) {
        if (currentSubsection) {
          currentSubsection.questions.push(currentQuestion)
        } else if (currentSection) {
          currentSection.questions.push(currentQuestion)
        }
      }
      if (currentSubsection && currentSection) {
        currentSection.subsections.push(currentSubsection)
      }
      if (currentSection) {
        sections.push(currentSection)
      }

      return sections
    } catch (err) {
      throw new Error(
        "Failed to parse questionnaire format: " + (err as Error).message
      )
    }
  }, [])

  // Filter visible questions based on conditions
  const getVisibleQuestions = useCallback(
    (section: Section): Question[] => {
      const allQuestions: Question[] = [...section.questions]

      // Add questions from subsections
      section.subsections?.forEach((subsection) => {
        allQuestions.push(
          ...subsection.questions.map((q) => ({
            ...q,
            subsectionTitle: subsection.title,
            subsectionContent: subsection.content,
          }))
        )
      })

      return allQuestions.filter((question) =>
        evaluateCondition(question.showIf || "", responses)
      )
    },
    [responses]
  )

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string

        try {
          const parsed = parseQuestionnaire(content)
          setQuestionnaire(parsed)
          setCurrentSectionIndex(0)
          setResponses({})
          setError("")
          setIsPreviewMode(true)
        } catch (err) {
          setError((err as Error).message)
        }
      }
      reader.readAsText(file)
    }
  }

  const loadSample = (): void => {
    try {
      const parsed = parseQuestionnaire(SAMPLE_TEXT)
      console.log(parsed)
      console.log(parsed[0].content)
      setQuestionnaire(parsed)
      setCurrentSectionIndex(0)
      setResponses({})
      setError("")
      setIsPreviewMode(true)
    } catch (err) {
      setError((err as Error).message)
    }
  }

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
      if (question.variable) {
        // Store in responses for variables
        setResponses((prev) => ({
          ...prev,
          [questionId]: {
            value,
            variable: question.variable,
          },
        }))
      }
    }
  }

  const nextSection = (): void => {
    if (questionnaire && currentSectionIndex < questionnaire.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1)
    }
  }

  const prevSection = (): void => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1)
    }
  }

  const renderQuestion = (
    question: Question,
    index: number,
    questions: Question[]
  ) => {
    const questionText = replacePlaceholders(question.text, responses)

    // Check if we need to render a subsection header
    const shouldShowSubsectionHeader =
      question.subsectionTitle &&
      (index === 0 ||
        questions[index - 1].subsectionTitle !== question.subsectionTitle)

    const currentValue = responses[question.id]?.value || ""

    const questionElement = (() => {
      if (question.type === "multiple_choice") {
        return (
          <div className="space-y-3">
            <Label className="text-base font-medium">{questionText}</Label>
            <RadioGroup
              value={currentValue}
              onValueChange={(value) => handleResponse(question.id, value)}
            >
              {question.options.map((option, index) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option.value}
                    id={`${question.id}-${index}`}
                  />
                  <Label
                    htmlFor={`${question.id}-${index}`}
                    className="cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )
      }

      if (question.type === "text") {
        return (
          <div className="space-y-3">
            <Label className="text-base font-medium">{questionText}</Label>
            <Textarea
              value={currentValue}
              onChange={(e) => handleResponse(question.id, e.target.value)}
              placeholder="Enter your response..."
              className="min-h-[100px]"
            />
          </div>
        )
      }

      if (question.type === "number") {
        return (
          <div className="space-y-3">
            <Label className="text-base font-medium">{questionText}</Label>
            <Input
              type="number"
              value={currentValue}
              onChange={(e) => handleResponse(question.id, e.target.value)}
              placeholder="Enter a number..."
            />
          </div>
        )
      }

      return null
    })()

    return (
      <div key={question.id}>
        {shouldShowSubsectionHeader && (
          <div className="mb-4 mt-6 first:mt-0">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {question.subsectionTitle}
            </h3>
            {question.subsectionContent && (
              <p className="text-gray-600 mb-4">
                {replacePlaceholders(question.subsectionContent, responses)}
              </p>
            )}
          </div>
        )}
        {questionElement}
      </div>
    )
  }

  if (!isPreviewMode) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              QST - Quick Survey Tester
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Upload Questionnaire File
              </h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <Label
                  htmlFor="file-upload"
                  className="cursor-pointer text-blue-600 hover:text-blue-500"
                >
                  Choose a text file or drag and drop
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Supports .txt files
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-gray-500 text-sm">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Try Sample Questionnaire
              </h3>
              <Button onClick={loadSample} variant="outline" className="w-full">
                Load Sample Questionnaire
              </Button>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Text Format Guide</h3>
              <p className="text-sm text-gray-600">
                This is the exact format used in the sample questionnaire:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap">
                {SAMPLE_TEXT}
              </div>
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  <strong>Key features:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <code># Section</code> - Creates new pages
                  </li>
                  <li>
                    <code>## Subsection</code> - Headers within the same page
                  </li>
                  <li>
                    <code>Q1: Question text?</code> - Questions
                  </li>
                  <li>
                    <code>- Option text</code> - Multiple choice options (no
                    letters needed)
                  </li>
                  <li>
                    <code>TEXT_INPUT</code> / <code>NUMBER_INPUT</code> - Input
                    types
                  </li>
                  <li>
                    <code>VARIABLE: name</code> - Store response (optional)
                  </li>
                  <li>
                    <code>{`{variable}`}</code> - Simple variable replacement
                  </li>
                  <li>
                    <code>{`{{condition|true_text|false_text}}`}</code> -
                    Conditional text based on responses
                  </li>
                  <li>
                    <code>SHOW_IF: condition</code> - Conditional question
                    display
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!questionnaire) return null

  const currentSection = questionnaire[currentSectionIndex]
  const visibleQuestions = getVisibleQuestions(currentSection)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <Button variant="outline" onClick={() => setIsPreviewMode(false)}>
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
          {visibleQuestions.map((question, index) =>
            renderQuestion(question, index, visibleQuestions)
          )}

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
                onClick={() =>
                  alert(
                    "Questionnaire completed! In a real app, this would submit or export the data."
                  )
                }
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

export default QuestionnaireApp
