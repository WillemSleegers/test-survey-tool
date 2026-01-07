import { describe, it, expect } from 'vitest'
import { parseQuestionnaire } from '@/lib/parser'
import type { Question } from '@/lib/types'
import { isQuestion } from '@/lib/types'

// Helper function to get questions from parsed result
function getQuestions(text: string): Question[] {
  const result = parseQuestionnaire(text)
  return result.blocks[0].pages[0].sections[0].items.filter(isQuestion)
}

describe('Parser - RANGE Syntax', () => {
  it('should parse RANGE for multiple choice question', () => {
    const text = `Q: Rate your satisfaction
RANGE: 1-10`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('multiple_choice')
    if (question.type === 'multiple_choice') {
      expect(question.options).toHaveLength(10)
      expect(question.options[0].value).toBe('1')
      expect(question.options[0].label).toBe('1')
      expect(question.options[9].value).toBe('10')
      expect(question.options[9].label).toBe('10')
    }
  })

  it('should parse RANGE for checkbox question', () => {
    const text = `Q: Select applicable ratings
RANGE: 1-5
CHECKBOX`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('checkbox')
    if (question.type === 'checkbox') {
      expect(question.options).toHaveLength(5)
      expect(question.options[0].value).toBe('1')
      expect(question.options[4].value).toBe('5')
    }
  })

  it('should parse RANGE for matrix question', () => {
    const text = `Q: Rate the following aspects
- Q: Quality
- Q: Service
- Q: Value
RANGE: 1-7`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('matrix')
    if (question.type === 'matrix') {
      expect(question.subquestions).toHaveLength(3)
      expect(question.options).toHaveLength(7)
      expect(question.options[0].value).toBe('1')
      expect(question.options[6].value).toBe('7')
    }
  })

  it('should parse negative RANGE values', () => {
    const text = `Q: Rate the temperature
RANGE: -5-5`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('multiple_choice')
    if (question.type === 'multiple_choice') {
      expect(question.options).toHaveLength(11)
      expect(question.options[0].value).toBe('-5')
      expect(question.options[5].value).toBe('0')
      expect(question.options[10].value).toBe('5')
    }
  })

  it('should parse RANGE starting from 0', () => {
    const text = `Q: How likely are you to recommend us?
RANGE: 0-10`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('multiple_choice')
    if (question.type === 'multiple_choice') {
      expect(question.options).toHaveLength(11)
      expect(question.options[0].value).toBe('0')
      expect(question.options[10].value).toBe('10')
    }
  })

  it('should parse RANGE with VARIABLE', () => {
    const text = `Q: Rate your satisfaction
RANGE: 1-10
VARIABLE: satisfaction_score`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('multiple_choice')
    if (question.type === 'multiple_choice') {
      expect(question.options).toHaveLength(10)
      expect(question.variable).toBe('satisfaction_score')
    }
  })

  it('should allow mixing RANGE with manual options', () => {
    const text = `Q: Select an option
- Low
RANGE: 1-3
- High`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('multiple_choice')
    if (question.type === 'multiple_choice') {
      expect(question.options).toHaveLength(5)
      expect(question.options[0].value).toBe('Low')
      expect(question.options[1].value).toBe('1')
      expect(question.options[2].value).toBe('2')
      expect(question.options[3].value).toBe('3')
      expect(question.options[4].value).toBe('High')
    }
  })

  it('should throw error for invalid RANGE syntax', () => {
    const text = `Q: Rate
RANGE: 1 to 10`

    expect(() => parseQuestionnaire(text)).toThrow('Invalid RANGE syntax')
  })

  it('should throw error when start is greater than end', () => {
    const text = `Q: Rate
RANGE: 10-1`

    expect(() => parseQuestionnaire(text)).toThrow('Invalid RANGE: start (10) must be less than or equal to end (1)')
  })
})
