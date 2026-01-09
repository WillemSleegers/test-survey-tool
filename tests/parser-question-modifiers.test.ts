import { describe, it, expect } from 'vitest'
import { parseQuestionnaire } from '@/lib/parser'
import type { Question } from '@/lib/types'
import { isQuestion } from '@/lib/types'

// Helper function to get questions from parsed result
function getQuestions(text: string): Question[] {
  const result = parseQuestionnaire(text)
  return result.blocks[0].pages[0].sections[0].items.filter(isQuestion)
}

describe('Parser - Question Modifiers', () => {
  it('should handle HINT text', () => {
    const text = `Q: What is your email?
HINT: We will never share your email
TEXT`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.subtext).toBe('We will never share your email')
  })

  it('should handle VARIABLE assignment', () => {
    const text = `Q: What is your name?
VARIABLE: user_name
TEXT`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.variable).toBe('user_name')
  })

  it('should parse NUMBER question with PREFIX and SUFFIX', () => {
    const text = `Q: What is your budget?
NUMBER
PREFIX: $
SUFFIX: per month`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('number')
    if (question.type === 'number') {
      expect(question.prefix).toBe('$')
      expect(question.suffix).toBe('per month')
    }
  })

  it('should not allow PREFIX on TEXT question', () => {
    const text = `Q: Enter text
TEXT
PREFIX: $`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('text')
    expect('prefix' in question).toBe(false)
  })
})
