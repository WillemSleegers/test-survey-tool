import { Page, Question, Variables, Responses, OtherTexts, BreakdownQuestion, isQuestion } from "@/lib/types"
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

/**
 * Builds a display-only copy of `variables` where checkbox/radio values backed
 * by a `- TEXT` option are combined with their typed text for rendering in
 * question/page text (e.g. `{variable AS LIST}`).
 *
 * `variables` itself must stay as plain selected option value(s) — `showIf`
 * conditions and expressions match against it, and appending free text there
 * would silently break `interests == "Other"`-style comparisons. The returned
 * object is safe to use anywhere text is rendered instead of `variables`: it's
 * identical except for the composed entries.
 *
 * Composition never invents punctuation — it joins the option's own label
 * with the typed text using a single space, so the label controls how the
 * two read together (e.g. label "Other, namely:" + text "painting" produces
 * "Other, namely: painting", not a doubled-up separator).
 */
export function applyOtherText(
  variables: Variables,
  questionnaire: Page[],
  otherTexts: OtherTexts
): Variables {
  const { questionLookup, questionVariableMap } = buildQuestionMaps(questionnaire)
  const displayVariables: Variables = { ...variables }

  questionLookup.forEach((question, questionId) => {
    if (question.type !== "checkbox" && question.type !== "multiple_choice") return

    const textsForQuestion = otherTexts[questionId]
    if (!textsForQuestion) return

    const variableName = questionVariableMap.get(questionId)
    if (!variableName) return

    const composeValue = (value: string): string => {
      const text = textsForQuestion[value]?.trim()
      if (!text) return value

      const option = question.options.find(opt => opt.value === value)
      if (!option?.allowsOtherText) return value

      return `${value.trimEnd()} ${text}`
    }

    const value = displayVariables[variableName]
    if (Array.isArray(value)) {
      displayVariables[variableName] = value.map(composeValue)
    } else if (typeof value === "string") {
      displayVariables[variableName] = composeValue(value)
    }
  })

  return displayVariables
}
