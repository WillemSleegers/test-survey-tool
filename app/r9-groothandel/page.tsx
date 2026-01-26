"use client"

import { QuestionnaireViewer } from "@/components/questionnaire-viewer"
import { parseQuestionnaire } from "@/lib/parser"
import { useEffect, useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { useNavigation } from "@/contexts/navigation-context"

export default function R9GroothandelPage() {
  const [surveyData, setSurveyData] = useState<ReturnType<
    typeof parseQuestionnaire
  > | null>(null)
  const [error, setError] = useState<string>("")
  const { setLanguage } = useLanguage()
  const { setIsVisible, setPosition, setAllowUnvisitedNavigation } =
    useNavigation()

  useEffect(() => {
    // Configure survey settings
    setLanguage("nl")
    setIsVisible(true)
    setPosition("left")
    setAllowUnvisitedNavigation(true)

    // Fetch and parse the survey file
    fetch("/api/surveys/r9-groothandel")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load survey")
        return res.text()
      })
      .then((content) => {
        const parsed = parseQuestionnaire(content)
        setSurveyData(parsed)
      })
      .catch((err) => {
        setError(err.message)
      })
  }, [setLanguage, setIsVisible, setPosition, setAllowUnvisitedNavigation])

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-red-600">Error loading survey: {error}</div>
      </div>
    )
  }

  if (!surveyData) {
    return (
      <div className="container mx-auto p-8">
        <div>Loading survey...</div>
      </div>
    )
  }

  return (
    <QuestionnaireViewer
      questionnaire={surveyData.blocks}
      navItems={surveyData.navItems}
      onResetToUpload={() => {
        window.location.href = "/"
      }}
    />
  )
}
