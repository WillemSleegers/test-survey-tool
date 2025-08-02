import { useCallback, useMemo } from "react"
import { evaluateCondition } from "@/lib/conditions/condition-evaluator"
import { evaluateComputedVariables } from "@/lib/conditions/computed-variables"
import { Section, Responses, VisibleSectionContent, ComputedVariables } from "@/lib/types"

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
  // Compute all computed variables for all sections once
  const allComputedVariables = useMemo(() => {
    const computedVars: Map<Section, ComputedVariables> = new Map()
    questionnaire.forEach(section => {
      computedVars.set(section, evaluateComputedVariables(section, responses))
    })
    return computedVars
  }, [questionnaire, responses])

  // Get only visible sections - based purely on SHOW_IF conditions and computed variables
  const visibleSections = useMemo(() => {
    return questionnaire.filter((section) => {
      const sectionComputedVars = allComputedVariables.get(section) || {}
      return evaluateCondition(section.showIf || "", responses, sectionComputedVars)
    })
  }, [questionnaire, responses, allComputedVariables])

  // Get visible content for a section
  const getVisibleSectionContent = useCallback(
    (section: Section): VisibleSectionContent => {
      const sectionComputedVars = allComputedVariables.get(section) || {}
      
      // Filter main section questions based on their individual SHOW_IF conditions
      const mainQuestions = section.questions.filter((question) =>
        evaluateCondition(question.showIf || "", responses, sectionComputedVars)
      )

      // Filter subsections and their questions based on individual SHOW_IF conditions
      const visibleSubsections = section.subsections.map((subsection) => ({
        title: subsection.title,
        content: subsection.content,
        questions: subsection.questions.filter((question) =>
          evaluateCondition(question.showIf || "", responses, sectionComputedVars)
        ),
      }))

      return {
        mainQuestions,
        subsections: visibleSubsections,
      }
    },
    [responses, allComputedVariables]
  )

  return {
    visibleSections,
    getVisibleSectionContent,
    getComputedVariables: (section: Section) => allComputedVariables.get(section) || {},
  }
}