import { describe, it, expect } from 'vitest'
import { parseQuestionnaire } from './parser'
import { isQuestion } from './types'

describe('parseQuestionnaire', () => {
  describe('question ID uniqueness', () => {
    it('should generate unique question IDs across multiple blocks', () => {
      const input = `
BLOCK: Block 1

# Page 1

Q: Question in block 1
- Yes
- No
VARIABLE: q1_var

BLOCK: Block 2

# Page 2

Q: Question in block 2
- Option A
- Option B
VARIABLE: q2_var

Q: Another question in block 2
TEXT
VARIABLE: q3_var
`

      const result = parseQuestionnaire(input)

      // Collect all question IDs
      const questionIds: string[] = []
      result.blocks.forEach(block => {
        block.pages.forEach(page => {
          page.sections.forEach(section => {
            section.items.forEach(item => {
              if (isQuestion(item)) {
                questionIds.push(item.id)
              }
            })
          })
        })
      })

      // Verify we have 3 questions
      expect(questionIds).toHaveLength(3)

      // Verify all IDs are unique
      const uniqueIds = new Set(questionIds)
      expect(uniqueIds.size).toBe(questionIds.length)

      // Verify IDs are sequential
      expect(questionIds).toEqual(['Q1', 'Q2', 'Q3'])
    })

    it('should generate unique question IDs when content exists before first BLOCK marker', () => {
      const input = `
# Intro Page

This is some intro content.

BLOCK: Block 1

# Page 1

Q: First question
- Yes
- No
VARIABLE: first_answer

BLOCK: Block 2
SHOW_IF: first_answer == "Yes"

# Page 2

Q: Second question
- A
- B
`

      const result = parseQuestionnaire(input)

      // Collect all question IDs
      const questionIds: string[] = []
      result.blocks.forEach(block => {
        block.pages.forEach(page => {
          page.sections.forEach(section => {
            section.items.forEach(item => {
              if (isQuestion(item)) {
                questionIds.push(item.id)
              }
            })
          })
        })
      })

      // Verify all IDs are unique
      const uniqueIds = new Set(questionIds)
      expect(uniqueIds.size).toBe(questionIds.length)
    })

    it('should maintain unique IDs across blocks with multiple pages each', () => {
      const input = `
BLOCK: Block 1

# Page 1
Q: Q on page 1
TEXT

# Page 2
Q: Q on page 2
NUMBER

BLOCK: Block 2

# Page 3
Q: Q on page 3
ESSAY

# Page 4
Q: Q on page 4
- Yes
- No
`

      const result = parseQuestionnaire(input)

      // Collect all question IDs
      const questionIds: string[] = []
      result.blocks.forEach(block => {
        block.pages.forEach(page => {
          page.sections.forEach(section => {
            section.items.forEach(item => {
              if (isQuestion(item)) {
                questionIds.push(item.id)
              }
            })
          })
        })
      })

      // Verify we have 4 questions with unique IDs
      expect(questionIds).toHaveLength(4)
      const uniqueIds = new Set(questionIds)
      expect(uniqueIds.size).toBe(4)
      expect(questionIds).toEqual(['Q1', 'Q2', 'Q3', 'Q4'])
    })
  })

  describe('block SHOW_IF parsing', () => {
    it('should parse SHOW_IF condition on blocks', () => {
      const input = `
BLOCK: Block 1

# Page 1

Q: Do you want more?
- Yes
- No
VARIABLE: wants_more

BLOCK: Block 2
SHOW_IF: wants_more == "Yes"

# Page 2

Q: Extra question
TEXT
`

      const result = parseQuestionnaire(input)

      expect(result.blocks).toHaveLength(2)
      expect(result.blocks[0].showIf).toBeUndefined()
      expect(result.blocks[1].showIf).toBe('wants_more == "Yes"')
    })
  })
})
