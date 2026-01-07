import { describe, it, expect } from 'vitest'
import { parseQuestionnaire } from '@/lib/parser'
import type { Question } from '@/lib/types'
import { isQuestion } from '@/lib/types'

// Helper function to get questions from parsed result
function getQuestions(text: string): Question[] {
  const result = parseQuestionnaire(text)
  return result.blocks[0].pages[0].sections[0].items.filter(isQuestion)
}

describe('Parser - Breakdown Question Features', () => {
  it('should parse breakdown with COLUMN for multi-column layout', () => {
    const text = `Q: Revenue breakdown
BREAKDOWN

- Product A
  - COLUMN: 1
- Product B
  - COLUMN: 1

- Service X
  - COLUMN: 2
- Service Y
  - COLUMN: 2

TOTAL: Total Revenue`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('breakdown')
    if (question.type === 'breakdown') {
      expect(question.options).toHaveLength(4)
      expect(question.options[0].column).toBe(1)
      expect(question.options[1].column).toBe(1)
      expect(question.options[2].column).toBe(2)
      expect(question.options[3].column).toBe(2)
    }
  })

  it('should parse breakdown with EXCLUDE flag', () => {
    const text = `Q: Budget calculation
BREAKDOWN

- Revenue
- Costs
  - EXCLUDE

TOTAL: Net`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('breakdown')
    if (question.type === 'breakdown') {
      expect(question.options[1].exclude).toBe(true)
    }
  })

  it('should parse breakdown with VALUE for calculated fields', () => {
    const text = `Q: Financial summary
BREAKDOWN

- Revenue
- Tax Rate
  - VALUE: revenue * 0.2
  - EXCLUDE

TOTAL: Total`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('breakdown')
    if (question.type === 'breakdown') {
      expect(question.options[1].prefillValue).toBe('revenue * 0.2')
      expect(question.options[1].exclude).toBe(true)
    }
  })

  it('should parse breakdown with VARIABLE on options', () => {
    const text = `Q: Cost breakdown
BREAKDOWN

- Labor costs
  - VARIABLE: labor
- Material costs
  - VARIABLE: materials

TOTAL: Total Costs`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('breakdown')
    if (question.type === 'breakdown') {
      expect(question.options[0].variable).toBe('labor')
      expect(question.options[1].variable).toBe('materials')
    }
  })

  it('should parse breakdown with SUBTRACT', () => {
    const text = `Q: Calculate net income
BREAKDOWN

- Revenue
- Expenses
  - SUBTRACT

TOTAL: Net Income`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('breakdown')
    if (question.type === 'breakdown') {
      expect(question.options[1].subtract).toBe(true)
    }
  })

  it('should parse breakdown with HEADER rows', () => {
    const text = `Q: Financial statement
BREAKDOWN

- HEADER: Income
- Revenue
- Sales

- HEADER: Expenses
- Costs

TOTAL: Net`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('breakdown')
    if (question.type === 'breakdown') {
      expect(question.options[0].header).toBe(true)
      expect(question.options[0].exclude).toBe(true)
      expect(question.options[3].header).toBe(true)
    }
  })

  it('should parse breakdown with SUBTOTAL rows', () => {
    const text = `Q: Revenue breakdown
BREAKDOWN

- Product A
- Product B
- SUBTOTAL: Product Revenue

- Service X
- Service Y
- SUBTOTAL: Service Revenue

TOTAL: Total Revenue`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('breakdown')
    if (question.type === 'breakdown') {
      expect(question.options[2].subtotalLabel).toBe('Product Revenue')
      expect(question.options[2].exclude).toBe(true)
      expect(question.options[5].subtotalLabel).toBe('Service Revenue')
    }
  })

  it('should parse breakdown with option-level PREFIX and SUFFIX', () => {
    const text = `Q: Mixed units
BREAKDOWN

- Amount in dollars
  - PREFIX: $
- Amount in euros
  - PREFIX: €
- Percentage
  - SUFFIX: %`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('breakdown')
    if (question.type === 'breakdown') {
      expect(question.options[0].prefix).toBe('$')
      expect(question.options[1].prefix).toBe('€')
      expect(question.options[2].suffix).toBe('%')
    }
  })

  it('should parse breakdown with question-level PREFIX and SUFFIX', () => {
    const text = `Q: Currency amounts
BREAKDOWN
PREFIX: $
SUFFIX: USD

- Item 1
- Item 2

TOTAL: Total`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('breakdown')
    if (question.type === 'breakdown') {
      expect(question.prefix).toBe('$')
      expect(question.suffix).toBe('USD')
    }
  })
})
