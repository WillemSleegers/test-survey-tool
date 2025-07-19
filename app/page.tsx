"use client"

import React, { useState, useCallback } from "react"
import { FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Question, Section, Subsection } from "@/lib/types"
import { SAMPLE_TEXT } from "@/lib/constants"
import { QuestionnaireViewer } from "@/components/questionnaire-viewer"
import { TextFormatGuide } from "@/components/text-format-guide"
import { FileUpload } from "@/components/file-upload"

export function QuestionnaireApp() {
  const [questionnaire, setQuestionnaire] = useState<Section[] | null>(null)
  const [error, setError] = useState<string>("")
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false)

  // Parse the text format into structured data
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
          const idMatch = trimmedLine.match(/^(Q\d+):/) // Capture the full "Q1" part
          currentQuestion = {
            id: idMatch ? idMatch[1] : "Q0", // Store "Q1", "Q2", etc.
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

  const handleFileLoaded = (content: string) => {
    try {
      const parsed = parseQuestionnaire(content)
      setQuestionnaire(parsed)
      setError("")
      setIsPreviewMode(true)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const loadSample = (): void => {
    try {
      const parsed = parseQuestionnaire(SAMPLE_TEXT)
      console.log(parsed)
      setQuestionnaire(parsed)
      setError("")
      setIsPreviewMode(true)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (isPreviewMode && questionnaire) {
    return (
      <QuestionnaireViewer
        questionnaire={questionnaire}
        onBack={() => setIsPreviewMode(false)}
      />
    )
  }

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
          <FileUpload onFileLoaded={handleFileLoaded} onError={setError} />

          <div className="flex items-center gap-4">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="text-gray-500 text-sm">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Try Sample Questionnaire</h3>
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

          <TextFormatGuide sampleText={SAMPLE_TEXT} />
        </CardContent>
      </Card>
    </div>
  )
}

export default QuestionnaireApp
