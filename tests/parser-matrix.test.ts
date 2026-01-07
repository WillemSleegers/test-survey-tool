import { describe, it, expect } from 'vitest'
import { parseQuestionnaire } from '@/lib/parser'
import type { Question } from '@/lib/types'
import { isQuestion } from '@/lib/types'

// Helper function to get questions from parsed result
function getQuestions(text: string): Question[] {
  const result = parseQuestionnaire(text)
  return result.blocks[0].pages[0].sections[0].items.filter(isQuestion)
}

describe('Parser - Matrix Question Features', () => {
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

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('matrix')
    if (question.type === 'matrix') {
      expect(question.subquestions).toHaveLength(2)
      expect(question.subquestions[0].variable).toBe('statement_one')
      expect(question.subquestions[1].variable).toBe('statement_two')
      expect(question.options).toHaveLength(5)
    }
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

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('matrix')
    if (question.type === 'matrix') {
      expect(question.subquestions).toHaveLength(3)
      expect(question.subquestions[0].showIf).toBe('some_condition == "yes"')
      expect(question.subquestions[1].showIf).toBeUndefined()
      expect(question.subquestions[2].showIf).toBe('another_condition == "true"')
      expect(question.options).toHaveLength(3)
    }
  })
})
