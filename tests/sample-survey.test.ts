import { it, expect } from "vitest"
import { parseQuestionnaire } from "@/lib/parser"
import { evaluateComputedValues } from "@/lib/conditions/computed-variables"
import { evaluateCondition } from "@/lib/conditions/condition-evaluator"
import { SAMPLE_SURVEY } from "@/lib/constants"
import { Page } from "@/lib/types"

it("sample survey: experienced_user compute works end-to-end", () => {
  const { blocks } = parseQuestionnaire(SAMPLE_SURVEY)
  const feedbackBlock = blocks.find(b => b.name === "Feature Feedback")!
  expect(feedbackBlock.computedVariables).toHaveLength(1)

  const syntheticPage: Page = {
    id: 0,
    title: "",
    sections: [],
    computedVariables: feedbackBlock.computedVariables,
  }

  const qualified = evaluateComputedValues(syntheticPage, {
    usage_time: "Several weeks or more",
    surveys_created: "5",
  })
  expect(qualified.experienced_user).toBe(true)

  const notQualified = evaluateComputedValues(syntheticPage, {
    usage_time: "Just started today",
    surveys_created: "5",
  })
  expect(notQualified.experienced_user).toBe(false)

  const overallBlock = blocks.find(b => b.name === "Overall Assessment")!
  expect(evaluateCondition(overallBlock.showIf!, {}, qualified)).toBe(true)
  expect(evaluateCondition(overallBlock.showIf!, {}, notQualified)).toBe(false)
})
