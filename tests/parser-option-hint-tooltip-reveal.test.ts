import { describe, it, expect } from 'vitest'
import { parseQuestionnaire } from '@/lib/parser'
import type { Question } from '@/lib/types'
import { isQuestion } from '@/lib/types'

function getQuestions(text: string): Question[] {
  const result = parseQuestionnaire(text)
  return result.blocks[0].pages[0].sections[0].items.filter(isQuestion)
}

describe('Parser - Option HINT/TOOLTIP/REVEAL', () => {
  it('parses HINT, TOOLTIP, and REVEAL on multiple choice options', () => {
    const text = `Q: How would you describe your role?
- Manager
  - HINT: Includes team leads and supervisors
  - TOOLTIP: Anyone with direct reports
  - REVEAL: We ask this to tailor follow-up questions
- Individual contributor`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('multiple_choice')
    if (question.type !== 'multiple_choice') return

    expect(question.options[0].hint).toBe('Includes team leads and supervisors')
    expect(question.options[0].tooltip).toBe('Anyone with direct reports')
    expect(question.options[0].reveal).toBe('We ask this to tailor follow-up questions')
    expect(question.options[1].hint).toBeUndefined()
    expect(question.options[1].tooltip).toBeUndefined()
    expect(question.options[1].reveal).toBeUndefined()
  })

  it('parses HINT, TOOLTIP, and REVEAL on checkbox options', () => {
    const text = `Q: Which benefits do you use?
- Health insurance
  - HINT: Includes dental and vision
- Retirement plan
  - TOOLTIP: Employer-matched contributions
  - REVEAL: Vesting starts after one year
CHECKBOX`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('checkbox')
    if (question.type !== 'checkbox') return

    expect(question.options[0].hint).toBe('Includes dental and vision')
    expect(question.options[1].tooltip).toBe('Employer-matched contributions')
    expect(question.options[1].reveal).toBe('Vesting starts after one year')
  })

  it('parses multi-line delimited HINT/TOOLTIP/REVEAL on options', () => {
    const text = `Q: Which measures has your employer provided?
- Flexible hours
  - REVEAL: """
Examples include:

- Adjustable start times
- Compressed work weeks
"""
- None of the above`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('multiple_choice')
    if (question.type !== 'multiple_choice') return

    expect(question.options[0].reveal).toContain('Adjustable start times')
    expect(question.options[0].reveal).toContain('Compressed work weeks')
  })
})
