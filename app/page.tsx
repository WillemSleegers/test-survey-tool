"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { FileUpload } from "@/components/file-upload"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TextFormatGuide } from "@/components/text-format-guide"
import { QuestionnaireViewer } from "@/components/questionnaire-viewer"
import { Settings } from "@/components/settings"

import { parseQuestionnaire } from "@/lib/parser"

import { Block } from "@/lib/types"

import { ADVANCED_SAMPLE_TEXT } from "@/lib/constants"

const QuestionnaireApp = () => {
  const [questionnaire, setQuestionnaire] = useState<Block[] | null>(null)
  const [error, setError] = useState<string>("")
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false)

  const handleFileLoaded = (content: string) => {
    try {
      const parsed = parseQuestionnaire(content)
      console.log(parsed)
      setQuestionnaire(parsed)
      setError("")
      setIsPreviewMode(true)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const loadSample = (): void => {
    try {
      const parsed = parseQuestionnaire(ADVANCED_SAMPLE_TEXT)
      console.log(parsed)
      setQuestionnaire(parsed)
      setError("")
      setIsPreviewMode(true)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleResetToUpload = () => {
    setQuestionnaire(null)
    setError("")
    setIsPreviewMode(false)
  }

  if (isPreviewMode && questionnaire) {
    return <QuestionnaireViewer questionnaire={questionnaire} onResetToUpload={handleResetToUpload} />
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 mb-8">
      {/* Header */}
      <div className="my-8 text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">TST</h1>
        <p className="text-lg text-muted-foreground">Test Survey Tool</p>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        <FileUpload onFileLoaded={handleFileLoaded} onError={setError} />

        <div className="flex items-center gap-4">
          <div className="flex-1 border-t border-border"></div>
          <span className="text-muted-foreground text-sm">OR</span>
          <div className="flex-1 border-t border-border"></div>
        </div>

        <div className="space-y-4 flex justify-center">
          <Button onClick={loadSample} variant="outline">
            Load Sample Questionnaire
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="border-t border-border pt-6">
          <Settings />
        </div>

        <div className="border-t border-border pt-6">
          <TextFormatGuide />
        </div>
      </div>
    </div>
  )
}

export default QuestionnaireApp
