import { Page, Question, Variables, Responses, BreakdownQuestion, isQuestion } from "@/lib/types"
import { replacePlaceholders } from "@/lib/text-processing/replacer"
import { getVisibleBreakdownOptions, sumBreakdownOptions, computeSubtotalValues, subtotalVariables } from "@/lib/breakdown-calculations"

type QuestionMaps = {
  questionLookup: Map<string, Question>
  questionVariableMap: Map<string, string>
  orderedResponseIds: string[]
}

function buildQuestionMaps(questionnaire: Page[]): QuestionMaps {
  const questionLookup = new Map<string, Question>()
  const questionVariableMap = new Map<string, string>()
  const orderedResponseIds: string[] = []

  questionnaire?.forEach(page => {
    page.sections.forEach(section => {
      section.items.forEach(item => {
        if (!isQuestion(item)) return

        questionLookup.set(item.id, item)

        if (item.variable) {
          questionVariableMap.set(item.id, item.variable)
        }

        if (item.type === "matrix" && item.subquestions) {
          item.subquestions.forEach(subquestion => {
            if (subquestion.variable) {
              questionVariableMap.set(subquestion.id, subquestion.variable)
            }
            orderedResponseIds.push(subquestion.id)
          })
        } else {
          orderedResponseIds.push(item.id)
        }
      })
    })
  })

  return { questionLookup, questionVariableMap, orderedResponseIds }
}

function calculateBreakdownTotal(
  question: BreakdownQuestion,
  responseValue: Record<string, string>,
  variables: Variables
): number {
  const visibleOptions = getVisibleBreakdownOptions(question, variables, {})
  return sumBreakdownOptions(visibleOptions, responseValue, variables, {})
}

function isBreakdownResponse(
  question: Question | undefined,
  responseValue: unknown
): responseValue is Record<string, string> {
  return (
    question?.type === "breakdown" &&
    typeof responseValue === "object" &&
    responseValue !== null &&
    !Array.isArray(responseValue)
  )
}

/**
 * Derives variables from responses, walking the questionnaire in its own
 * page/section/question order rather than response insertion order — two
 * respondents answering the same questions in a different order (e.g. via
 * back-navigation) end up with identical variables.
 *
 * Two passes handle dependencies: simple variables first, then subtotals
 * (which may reference variables from the first pass).
 */
export function deriveVariables(questionnaire: Page[], responses: Responses): Variables {
  const { questionLookup, questionVariableMap, orderedResponseIds } = buildQuestionMaps(questionnaire)
  const variables: Variables = {}

  // PASS 1: question-level and non-subtotal option variables
  orderedResponseIds.forEach(questionId => {
    const responseValue = responses[questionId]
    if (responseValue === undefined) return

    const question = questionLookup.get(questionId)
    const variableName = questionVariableMap.get(questionId)

    if (variableName) {
      variables[variableName] = isBreakdownResponse(question, responseValue)
        ? calculateBreakdownTotal(question as BreakdownQuestion, responseValue, variables)
        : responseValue
    }

    if (isBreakdownResponse(question, responseValue)) {
      const breakdownResponse = responseValue
      ;(question as BreakdownQuestion).options.forEach((option, index) => {
        if (!option.variable || option.subtotalLabel) return

        const key = `option_${index}`
        let valueStr = breakdownResponse[key] || ""
        if (!valueStr && option.prefillValue) {
          valueStr = replacePlaceholders(option.prefillValue, variables, {})
        }

        if (valueStr !== "") {
          const numValue = parseFloat(valueStr)
          if (!isNaN(numValue)) {
            variables[option.variable] = numValue
          }
        }
      })
    }
  })

  // PASS 2: subtotal variables, which may depend on PASS 1 variables
  orderedResponseIds.forEach(questionId => {
    const responseValue = responses[questionId]
    if (responseValue === undefined) return

    const question = questionLookup.get(questionId)
    if (!isBreakdownResponse(question, responseValue)) return

    const breakdownQuestion = question as BreakdownQuestion
    const subtotals = computeSubtotalValues(breakdownQuestion, responseValue, variables, {})
    Object.assign(variables, subtotalVariables(breakdownQuestion, subtotals))
  })

  return variables
}
