"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { FileUpload } from "@/components/file-upload"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TextFormatGuide } from "@/components/text-format-guide"
import { QuestionnaireViewer } from "@/components/questionnaire-viewer"
import { LanguageSelector } from "@/components/language-selector"
import { useLanguage } from "@/contexts/language-context"

import { parseQuestionnaire } from "@/lib/parser"

import { Section } from "@/lib/types"

import { SAMPLE_TEXT } from "@/lib/constants"

const QuestionnaireApp = () => {
  const [questionnaire, setQuestionnaire] = useState<Section[] | null>(null)
  const [error, setError] = useState<string>("")
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false)
  const { t } = useLanguage()

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
    return <QuestionnaireViewer questionnaire={questionnaire} />
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 mb-8">
      {/* Header with title and language selector */}
      <div className="my-8 flex flex-col items-center gap-4">
        <div className="text-center flex-1 space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            {t("mainPage.title")}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("mainPage.subtitle")}
          </p>
        </div>
        <LanguageSelector />
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <FileUpload onFileLoaded={handleFileLoaded} onError={setError} />

        <div className="flex items-center gap-4">
          <div className="flex-1 border-t border-border"></div>
          <span className="text-muted-foreground text-sm">
            {t("mainPage.or")}
          </span>
          <div className="flex-1 border-t border-border"></div>
        </div>

        <div className="space-y-4">
          <Button onClick={loadSample} variant="outline" className="w-full">
            {t("mainPage.loadSample")}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <TextFormatGuide sampleText={SAMPLE_TEXT} />
      </div>
    </div>
  )
}

export default QuestionnaireApp
