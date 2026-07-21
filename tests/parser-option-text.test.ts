import { describe, expect, it } from "vitest"
import { parseQuestionnaire } from "@/lib/parser"
import { isQuestion } from "@/lib/types"

describe("Parser - Option Text Input", () => {
  it("should parse - TEXT modifier on option", () => {
    const input = `Q: What is your favorite hobby?
- Sports
- Reading
- Gaming
- Other
  - TEXT`

    const result = parseQuestionnaire(input)
    const question = result.blocks[0].pages[0].sections[0].items[0]

    expect(question).toHaveProperty("type", "multiple_choice")
    if (isQuestion(question) && question.type === "multiple_choice") {
      expect(question.options).toHaveLength(4)
      expect(question.options[3].label).toBe("Other")
      expect(question.options[3].allowsOtherText).toBe(true)
    }
  })

  it("should work with checkbox questions", () => {
    const input = `Q: Select all that apply
CHECKBOX
- Option A
- Option B
- Other
  - TEXT`

    const result = parseQuestionnaire(input)
    const question = result.blocks[0].pages[0].sections[0].items[0]

    expect(question).toHaveProperty("type", "checkbox")
    if (isQuestion(question) && question.type === "checkbox") {
      expect(question.options).toHaveLength(3)
      expect(question.options[2].label).toBe("Other")
      expect(question.options[2].allowsOtherText).toBe(true)
    }
  })

  it("should allow text input on middle options", () => {
    const input = `Q: What is your favorite hobby?
- Sports
- Gaming
  - TEXT
- Reading
- Music`

    const result = parseQuestionnaire(input)
    const question = result.blocks[0].pages[0].sections[0].items[0]

    expect(question).toHaveProperty("type", "multiple_choice")
    if (isQuestion(question) && question.type === "multiple_choice") {
      expect(question.options).toHaveLength(4)
      expect(question.options[1].label).toBe("Gaming")
      expect(question.options[1].allowsOtherText).toBe(true)
      expect(question.options[0].allowsOtherText).toBeUndefined()
      expect(question.options[2].allowsOtherText).toBeUndefined()
      expect(question.options[3].allowsOtherText).toBeUndefined()
    }
  })
})
