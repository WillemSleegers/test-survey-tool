import { useCallback } from "react"
import { evaluateCondition } from "@/lib/conditions/condition-evaluator"
import { Section, Responses, VisibleSectionContent } from "@/lib/types"

/**
 * Hook for managing section visibility and content filtering
 * 
 * Handles:
 * - Section visibility based on SHOW_IF conditions
 * - Question filtering within visible sections
 * - Subsection content filtering
 * 
 * @param questionnaire - All questionnaire sections
 * @param responses - Current user responses
 * @returns Visible sections and content getter function
 */
export function useVisibleSections(questionnaire: Section[], responses: Responses) {
  // Get only visible sections - based purely on SHOW_IF conditions
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

  return {
    visibleSections,
    getVisibleSectionContent,
  }
}