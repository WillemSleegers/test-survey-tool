import { describe, it, expect } from "vitest"
import { parseQuestionnaire } from "@/lib/parser"

const parse = (text: string) => () => parseQuestionnaire(text)

describe("condition syntax validation at parse time", () => {
  describe("rejects malformed SHOW_IF at every level", () => {
    it("block", () => {
      expect(
        parse(`Q: Base?
TEXT
VARIABLE: base

BLOCK: Later
SHOW_IF: (base == Yes

# Page
Q: Follow-up?
TEXT`)
      ).toThrow(/Block "Later" SHOW_IF.*parenthes/i)
    })

    it("page", () => {
      expect(
        parse(`# Page One
SHOW_IF: answer =
Q: Hello?
TEXT`)
      ).toThrow(/Page "Page One" SHOW_IF.*"="/)
    })

    it("section", () => {
      expect(
        parse(`# Page
## Details
SHOW_IF: a == b == c
Q: Hello?
TEXT`)
      ).toThrow(/Section "Details" SHOW_IF.*Chained comparison/)
    })

    it("question", () => {
      expect(
        parse(`# Page
Q: Hello?
TEXT
SHOW_IF: answer AND`)
      ).toThrow(/Question "Q1" SHOW_IF.*Missing operand for AND/)
    })

    it("option", () => {
      expect(
        parse(`# Page
Q: Pick one
- Always
- Sometimes
  - SHOW_IF: mode == "unclosed`)
      ).toThrow(/option "Sometimes" SHOW_IF.*Unterminated/)
    })

    it("matrix subquestion", () => {
      expect(
        parse(`# Page
Q: Rate these
- Q: Speed
- Q: Quality it depends
  - SHOW_IF: >= 3
- Good
- Bad`)
      ).toThrow(/subquestion.*SHOW_IF.*Missing left side/)
    })
  })

  describe("rejects malformed COMPUTE expressions", () => {
    it("bad condition inside IF-THEN-ELSE", () => {
      expect(
        parse(`# Page
Q: Score?
NUMBER
VARIABLE: score

# Next
COMPUTE: level = IF (score >= 8 THEN High ELSE Low
Q: Done?
TEXT`)
      ).toThrow(/COMPUTE "level.*parenthes/i)
    })

    it("single = instead of ==", () => {
      expect(
        parse(`# Page
COMPUTE: flag = answer = Yes
Q: Anything?
TEXT
VARIABLE: answer`)
      ).toThrow(/COMPUTE "flag.*"="/)
    })
  })

  describe("accepts every valid expression form", () => {
    it("parses a survey exercising the full condition grammar", () => {
      expect(
        parse(`# Page
COMPUTE: is_adult = age >= 18
COMPUTE: label = IF age >= 65 THEN "Senior" ELSE IF age >= 18 THEN "Adult" ELSE "Minor"
COMPUTE: greeting = "Welcome"
COMPUTE: hazard_count = hazards == Heat + hazards == Cold
COMPUTE: doubled = (age + hazard_count) * 2

Q: Age?
NUMBER
VARIABLE: age

Q: Consent?
- Yes
- No
VARIABLE: consent

Q: Hazards?
- Heat
- Cold
CHECKBOX
VARIABLE: hazards

# Follow-up
SHOW_IF: (is_adult OR consent == Yes) AND NOT consent == No

## Extra
SHOW_IF: STARTS_WITH haz == Heat

Q: Details on the usage of several weeks or more?
TEXT
SHOW_IF: label == Senior citizen or similar`)
      ).not.toThrow()
    })
  })

  describe("reference validation understands the new grammar", () => {
    it("flags undefined variables inside parenthesized logic", () => {
      expect(
        parse(`# Page
Q: Age?
NUMBER
VARIABLE: age

Q: Follow-up?
TEXT
SHOW_IF: (age >= 18 OR unknown_var == Yes) AND age < 65`)
      ).toThrow(/references undefined variables: unknown_var/)
    })

    it("flags undefined variables in arithmetic comparisons", () => {
      expect(
        parse(`# Page
Q: Age?
NUMBER
VARIABLE: age

Q: Follow-up?
TEXT
SHOW_IF: age + missing_years >= 21`)
      ).toThrow(/references undefined variables: missing_years/)
    })

    it("does not flag unquoted multi-word values or right-side literals", () => {
      expect(
        parse(`# Page
Q: Usage?
- Just started
- Several weeks or more
VARIABLE: usage

Q: Follow-up?
TEXT
SHOW_IF: usage == Several weeks or more`)
      ).not.toThrow()
    })
  })
})
