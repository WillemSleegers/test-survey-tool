"use client"

import { useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { FileUpload } from "@/components/file-upload"
import { TextEditor } from "@/components/text-editor"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { QuestionnaireViewer } from "@/components/questionnaire-viewer"
import { Settings } from "@/components/settings"
import { Navbar } from "@/components/navbar"

import { parseQuestionnaire } from "@/lib/parser"

import { Block, NavItem } from "@/lib/types"

import { ADVANCED_SAMPLE_TEXT } from "@/lib/constants"

type ParsedQuestionnaire = {
  blocks: Block[]
  navItems: NavItem[]
}

const QuestionnaireApp = () => {
  const [questionnaire, setQuestionnaire] = useState<ParsedQuestionnaire | null>(null)
  const [error, setError] = useState<string>("")
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false)
  const [showTextEditor, setShowTextEditor] = useState<boolean>(false)

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
    setShowTextEditor(false)
  }

  const handleTextEditorLoad = (content: string) => {
    handleFileLoaded(content)
    setShowTextEditor(false)
  }

  const handleTextEditorCancel = () => {
    setShowTextEditor(false)
    setError("")
  }

  if (isPreviewMode && questionnaire) {
    return (
      <QuestionnaireViewer
        questionnaire={questionnaire.blocks}
        navItems={questionnaire.navItems}
        onResetToUpload={handleResetToUpload}
      />
    )
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

        <div className="border-t border-border pt-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Help</h3>
            <div className="flex flex-col gap-2">
              <Link href="/docs" className="text-primary hover:underline">
                Documentation
              </Link>
              <Link href="/releases" className="text-primary hover:underline">
                Release Notes
              </Link>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionnaireApp
