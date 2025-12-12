"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { FileUpload } from "@/components/file-upload"
import { TextEditor } from "@/components/text-editor"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings } from "@/components/settings"
import { Navbar } from "@/components/navbar"

import { parseQuestionnaire } from "@/lib/parser"
import { useSurvey } from "@/contexts/survey-context"

import { ADVANCED_SAMPLE_TEXT } from "@/lib/constants"

const QuestionnaireApp = () => {
  const router = useRouter()
  const { setSurveyData } = useSurvey()
  const [error, setError] = useState<string>("")
  const [showTextEditor, setShowTextEditor] = useState<boolean>(false)

  const handleFileLoaded = (content: string) => {
    try {
      const parsed = parseQuestionnaire(content)
      console.log(parsed)
      setSurveyData(parsed)
      router.push("/survey")
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const loadSample = (): void => {
    try {
      const parsed = parseQuestionnaire(ADVANCED_SAMPLE_TEXT)
      console.log(parsed)
      setSurveyData(parsed)
      router.push("/survey")
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleTextEditorLoad = (content: string) => {
    handleFileLoaded(content)
    setShowTextEditor(false)
  }

  const handleTextEditorCancel = () => {
    setShowTextEditor(false)
    setError("")
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 space-y-8 mb-8">
        {/* Header */}
        <div className="my-8 text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">TST</h1>
          <p className="text-lg text-muted-foreground">Test Survey Tool</p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
        {showTextEditor ? (
          <TextEditor
            onLoadContent={handleTextEditorLoad}
            onCancel={handleTextEditorCancel}
          />
        ) : (
          <>
            <FileUpload onFileLoaded={handleFileLoaded} onError={setError} />

            <div className="flex items-center gap-4">
              <div className="flex-1 border-t border-border"></div>
              <span className="text-muted-foreground text-sm">OR</span>
              <div className="flex-1 border-t border-border"></div>
            </div>

            <div className="space-y-4 flex justify-center gap-2">
              <Button onClick={() => setShowTextEditor(true)} variant="outline">
                Draft Survey
              </Button>
              <Button onClick={loadSample} variant="outline">
                Load Sample Survey
              </Button>
            </div>
          </>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="border-t border-border pt-6">
          <Settings />
        </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionnaireApp
