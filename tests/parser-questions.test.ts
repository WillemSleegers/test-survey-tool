import { describe, it, expect } from 'vitest'
import { parseQuestionnaire } from '@/lib/parser'
import type { Question } from '@/lib/types'
import { isQuestion } from '@/lib/types'

// Helper function to get questions from parsed result
function getQuestions(text: string): Question[] {
  const result = parseQuestionnaire(text)
  return result.blocks[0].pages[0].sections[0].items.filter(isQuestion)
}

describe('Parser - Question Type Detection', () => {
  it('should parse multiple choice question', () => {
    const text = `Q: What is your favorite color?

- Red
- Blue
- Green`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('multiple_choice')
    if (question.type === 'multiple_choice') {
      expect(question.options).toHaveLength(3)
    }
  })

  it('should parse checkbox question', () => {
    const text = `Q: Which colors do you like?

- Red
- Blue
- Green
CHECKBOX`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('checkbox')
    if (question.type === 'checkbox') {
      expect(question.options).toHaveLength(3)
    }
  })

  it('should parse text question', () => {
    const text = `Q: What is your name?
TEXT`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('text')
  })

  it('should parse essay question', () => {
    const text = `Q: Tell us about yourself
ESSAY`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('essay')
  })

  it('should parse number question', () => {
    const text = `Q: How old are you?
NUMBER`

    const questions = getQuestions(text)
    const question = questions[0]

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

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('matrix')
    if (question.type === 'matrix') {
      expect(question.subquestions).toHaveLength(3)
      expect(question.options).toHaveLength(4)
    }
  })

  it('should parse matrix question without blank lines between subquestions and options', () => {
    const text = `Q: Rate these items

- Q: Item 1
- Q: Item 2
- Option A
- Option B`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('matrix')
    if (question.type === 'matrix') {
      expect(question.subquestions).toHaveLength(2)
      expect(question.options).toHaveLength(2)
    }
  })

  it('should parse breakdown question', () => {
    const text = `Q: How much do you spend per month?

- Rent
- Groceries
- Transportation
BREAKDOWN
PREFIX: €
TOTAL: Total`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('breakdown')
    if (question.type === 'breakdown') {
      expect(question.options).toHaveLength(3)
      expect(question.prefix).toBe('€')
      expect(question.totalLabel).toBe('Total')
    }
  })
})

describe('Parser - Question Type Switching', () => {
  it('should handle type change from multiple_choice to checkbox', () => {
    const text = `Q: Select items
- Option 1
- Option 2
CHECKBOX`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('checkbox')
    if (question.type === 'checkbox') {
      expect(question.options).toHaveLength(2)
    }
  })

  it('should handle type change from multiple_choice to text', () => {
    const text = `Q: Enter your response
- This will be ignored
TEXT`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('text')
  })

  it('should preserve matrix type when adding inputType', () => {
    const text = `Q: Provide feedback
- Q: Topic 1
- Q: Topic 2
- Option A
- Option B
TEXT`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('matrix')
    if (question.type === 'matrix') {
      expect(question.inputType).toBe('text')
      expect(question.subquestions).toHaveLength(2)
    }
  })
})

describe('Parser - Question Structure', () => {
  it('should preserve question IDs', () => {
    const text = `Q: First question
TEXT

Q: Second question
NUMBER`

    const questions = getQuestions(text)

    expect(questions[0].id).toBe('Q1')
    expect(questions[1].id).toBe('Q2')
  })
})
