import { describe, expect, it } from "vitest"
import { parseQuestionnaire } from "@/lib/parser"
import { isQuestion } from "@/lib/types"

describe("Parser - Option Exclusive", () => {
  it("should parse - EXCLUSIVE modifier on checkbox option", () => {
    const input = `Q: Select all that apply
CHECKBOX
- Option A
- Option B
- None of the above
  - EXCLUSIVE`

    const result = parseQuestionnaire(input)
    const question = result.blocks[0].pages[0].sections[0].items[0]

    expect(question).toHaveProperty("type", "checkbox")
    if (isQuestion(question) && question.type === "checkbox") {
      expect(question.options).toHaveLength(3)
      expect(question.options[2].label).toBe("None of the above")
      expect(question.options[2].exclusive).toBe(true)
      expect(question.options[0].exclusive).toBeUndefined()
      expect(question.options[1].exclusive).toBeUndefined()
    }
  })

  it("should allow EXCLUSIVE on multiple options", () => {
    const input = `Q: Select all that apply
CHECKBOX
- Option A
- Option B
- None of the above
  - EXCLUSIVE
- Don't know
  - EXCLUSIVE`

    const result = parseQuestionnaire(input)
    const question = result.blocks[0].pages[0].sections[0].items[0]

    expect(question).toHaveProperty("type", "checkbox")
    if (isQuestion(question) && question.type === "checkbox") {
      expect(question.options).toHaveLength(4)
      expect(question.options[2].exclusive).toBe(true)
      expect(question.options[3].exclusive).toBe(true)
    }
  })

  it("should allow EXCLUSIVE on a middle option", () => {
    const input = `Q: Select all that apply
CHECKBOX
- Option A
- None of the above
  - EXCLUSIVE
- Option B`

    const result = parseQuestionnaire(input)
    const question = result.blocks[0].pages[0].sections[0].items[0]

    expect(question).toHaveProperty("type", "checkbox")
    if (isQuestion(question) && question.type === "checkbox") {
      expect(question.options).toHaveLength(3)
      expect(question.options[1].label).toBe("None of the above")
      expect(question.options[1].exclusive).toBe(true)
      expect(question.options[0].exclusive).toBeUndefined()
      expect(question.options[2].exclusive).toBeUndefined()
    }
  })
})
