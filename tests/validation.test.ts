import { describe, it, expect } from 'vitest'
import { parseQuestionnaire } from '@/lib/parser'

describe('Validation - Duplicate variable names', () => {
  it('rejects a duplicate variable name across matrix subquestions', () => {
    const text = `Q: Rate these aspects
- Q: Aspect one
  - VARIABLE: rating
- Q: Aspect two
  - VARIABLE: rating

- Good
- Bad`

    expect(() => parseQuestionnaire(text)).toThrow(/Duplicate variable names found[\s\S]*"rating"/)
  })

  it('rejects a duplicate variable name between a question and a breakdown option', () => {
    const text = `Q: How many hours do you work?
NUMBER
VARIABLE: hours

Q: Cost breakdown
BREAKDOWN

- Labor costs
  - VARIABLE: hours

TOTAL: Total Costs`

    expect(() => parseQuestionnaire(text)).toThrow(/Duplicate variable names found[\s\S]*"hours"/)
  })

  it('rejects a duplicate name between a question variable and a computed variable', () => {
    const text = `# Page One
COMPUTE: score = 1 + 1

Q: What is your score?
NUMBER
VARIABLE: score`

    expect(() => parseQuestionnaire(text)).toThrow(/Duplicate variable names found[\s\S]*"score"/)
  })

  it('allows multiple COMPUTE lines for the same name within one page (default-then-override)', () => {
    const text = `# Page One
COMPUTE: level = "Low"
COMPUTE: level = IF score >= 5 THEN "High"

Q: What is your score?
NUMBER
VARIABLE: score`

    expect(() => parseQuestionnaire(text)).not.toThrow()
  })
})

describe('Validation - Section and matrix-subquestion SHOW_IF references', () => {
  it('rejects a section SHOW_IF referencing an undefined variable', () => {
    const text = `# Page One

Q: Do you agree?
- Yes
- No
VARIABLE: agree

## Follow-up
SHOW_IF: undefined_var == "yes"

Q: Tell us more
TEXT`

    expect(() => parseQuestionnaire(text)).toThrow(
      /Section "Follow-up" SHOW_IF references undefined variables: undefined_var/
    )
  })

  it('allows a section SHOW_IF referencing a defined variable', () => {
    const text = `# Page One

Q: Do you agree?
- Yes
- No
VARIABLE: agree

## Follow-up
SHOW_IF: agree == "Yes"

Q: Tell us more
TEXT`

    expect(() => parseQuestionnaire(text)).not.toThrow()
  })

  it('rejects a matrix subquestion SHOW_IF referencing an undefined variable', () => {
    const text = `Q: Rate these aspects
- Q: Aspect one
  - SHOW_IF: undefined_var == "yes"
- Q: Aspect two

- Good
- Bad`

    expect(() => parseQuestionnaire(text)).toThrow(
      /Question "Q1" subquestion "Aspect one" SHOW_IF references undefined variables: undefined_var/
    )
  })
})
