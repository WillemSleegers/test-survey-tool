import { describe, it, expect } from 'vitest'
import { parseQuestionnaire } from '@/lib/parser'

describe('Parser - Question Type Detection', () => {
  it('should parse multiple choice question', () => {
    const text = `Q: What is your favorite color?

- Red
- Blue
- Green`

    const result = parseQuestionnaire(text)
    const question = result.blocks[0].pages[0].sections[0].questions[0]

    expect(question.type).toBe('multiple_choice')
    expect(question.options).toHaveLength(3)
  })

  it('should parse checkbox question', () => {
    const text = `Q: Which colors do you like?

- Red
- Blue
- Green
CHECKBOX`

    const result = parseQuestionnaire(text)
    const question = result.blocks[0].pages[0].sections[0].questions[0]

    expect(question.type).toBe('checkbox')
    expect(question.options).toHaveLength(3)
  })

  it('should parse text question', () => {
    const text = `Q: What is your name?
TEXT`

    const result = parseQuestionnaire(text)
    const question = result.blocks[0].pages[0].sections[0].questions[0]

    expect(question.type).toBe('text')
  })

  it('should parse essay question', () => {
    const text = `Q: Tell us about yourself
ESSAY`

    const result = parseQuestionnaire(text)
    const question = result.blocks[0].pages[0].sections[0].questions[0]

    expect(question.type).toBe('essay')
  })

  it('should parse number question', () => {
    const text = `Q: How old are you?
NUMBER`

    const result = parseQuestionnaire(text)
    const question = result.blocks[0].pages[0].sections[0].questions[0]

    expect(question.type).toBe('number')
  })

  it('should parse matrix question with subquestions and options', () => {
    const text = `Q: How do you rate these features?

- Q: Feature A
- Q: Feature B
- Q: Feature C

- Excellent
- Good
- Fair
- Poor`

    const result = parseQuestionnaire(text)
    const question = result.blocks[0].pages[0].sections[0].questions[0]

    expect(question.type).toBe('matrix')
    expect(question.subquestions).toHaveLength(3)
    expect(question.options).toHaveLength(4)
  })

  it('should parse matrix question with variables on subquestions', () => {
    const text = `Q: How strongly do you agree or disagree with the following statements?

- Q: Statement one
  - VARIABLE: statement_one
- Q: Statement two
  - VARIABLE: statement_two

- Strongly Agree
- Agree
- Neutral
- Disagree
- Strongly Disagree`

    const result = parseQuestionnaire(text)
    const question = result.blocks[0].pages[0].sections[0].questions[0]

    expect(question.type).toBe('matrix')
    expect(question.subquestions).toHaveLength(2)
    expect(question.subquestions?.[0].variable).toBe('statement_one')
    expect(question.subquestions?.[1].variable).toBe('statement_two')
    expect(question.options).toHaveLength(5)
  })

  it('should parse breakdown question', () => {
    const text = `Q: How much do you spend per month?

- Rent
- Groceries
- Transportation
BREAKDOWN
PREFIX: €
TOTAL: Total`

    const result = parseQuestionnaire(text)
    const question = result.blocks[0].pages[0].sections[0].questions[0]

    expect(question.type).toBe('breakdown')
    expect(question.options).toHaveLength(3)
    expect(question.prefix).toBe('€')
    expect(question.totalLabel).toBe('Total')
  })

  it('should parse matrix question without blank lines between subquestions and options', () => {
    const text = `Q: Rate these items

- Q: Item 1
- Q: Item 2
- Option A
- Option B`

    const result = parseQuestionnaire(text)
    const question = result.blocks[0].pages[0].sections[0].questions[0]

    expect(question.type).toBe('matrix')
    expect(question.subquestions).toHaveLength(2)
    expect(question.options).toHaveLength(2)
  })

  it('should parse matrix question with SHOW_IF on subquestions', () => {
    const text = `Q: How satisfied are you with these aspects?

- Q: Aspect one
  - SHOW_IF: some_condition == "yes"
- Q: Aspect two
- Q: Aspect three
  - SHOW_IF: another_condition == "true"

- Very satisfied
- Satisfied
- Neutral`

    const result = parseQuestionnaire(text)
    const question = result.blocks[0].pages[0].sections[0].questions[0]

    expect(question.type).toBe('matrix')
    expect(question.subquestions).toHaveLength(3)
    expect(question.subquestions?.[0].showIf).toBe('some_condition == "yes"')
    expect(question.subquestions?.[1].showIf).toBeUndefined()
    expect(question.subquestions?.[2].showIf).toBe('another_condition == "true"')
    expect(question.options).toHaveLength(3)
  })
})

describe('Parser - Question Structure', () => {
  it('should preserve question IDs', () => {
    const text = `Q: First question
TEXT

Q: Second question
NUMBER`

    const result = parseQuestionnaire(text)
    const questions = result.blocks[0].pages[0].sections[0].questions

    expect(questions[0].id).toBe('Q1')
    expect(questions[1].id).toBe('Q2')
  })

  it('should handle HINT text', () => {
    const text = `Q: What is your email?
HINT: We will never share your email
TEXT`

    const result = parseQuestionnaire(text)
    const question = result.blocks[0].pages[0].sections[0].questions[0]

    expect(question.subtext).toBe('We will never share your email')
  })

  it('should handle VARIABLE assignment', () => {
    const text = `Q: What is your name?
VARIABLE: user_name
TEXT`

    const result = parseQuestionnaire(text)
    const question = result.blocks[0].pages[0].sections[0].questions[0]

    expect(question.variable).toBe('user_name')
  })
})
