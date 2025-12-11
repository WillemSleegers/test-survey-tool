"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { QuestionnaireViewer } from "@/components/questionnaire-viewer"
import { useSurvey } from "@/contexts/survey-context"

export default function SurveyPage() {
  const router = useRouter()
  const { surveyData, setSurveyData } = useSurvey()

  useEffect(() => {
    // Redirect to home if no survey data
    if (!surveyData) {
      router.replace("/")
    }
  }, [surveyData, router])

  const handleResetToUpload = () => {
    setSurveyData(null)
    router.push("/")
  }

  if (!surveyData) {
    return null
  }

  return (
    <QuestionnaireViewer
      questionnaire={surveyData.blocks}
      navItems={surveyData.navItems}
      onResetToUpload={handleResetToUpload}
    />
  )
}
