import { describe, it, expect } from 'vitest'
import { parseQuestionnaire } from '@/lib/parser'
import type { Question } from '@/lib/types'
import { isQuestion, isText } from '@/lib/types'

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

describe('Parser - Question Structure', () => {
  it('should preserve question IDs', () => {
    const text = `Q: First question
TEXT

Q: Second question
NUMBER`

    const questions = getQuestions(text)
    // questions already available

    expect(questions[0].id).toBe('Q1')
    expect(questions[1].id).toBe('Q2')
  })

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
})

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

describe('Parser - PREFIX and SUFFIX', () => {
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

describe('Parser - Content vs TEXT Question Discrimination', () => {
  it('should distinguish between text content and TEXT questions', () => {
    const text = `This is plain text content.

Q: What is your name?
TEXT

More plain text after the question.`

    const result = parseQuestionnaire(text)
    const section = result.blocks[0].pages[0].sections[0]

    expect(section.items).toHaveLength(3)
    expect(isText(section.items[0])).toBe(true)
    expect(section.items[1].type).toBe('text')
    expect(isText(section.items[2])).toBe(true)

    if (isText(section.items[0])) {
      expect(section.items[0].value).toBe('This is plain text content.')
    }
    if (isQuestion(section.items[1]) && section.items[1].type === 'text') {
      expect(section.items[1].text).toBe('What is your name?')
    }
    if (isText(section.items[2])) {
      expect(section.items[2].value).toBe('More plain text after the question.')
    }
  })

  it('should handle interleaved content and questions', () => {
    const text = `# Test Page

Introduction text.

Q: First question?
TEXT

Text between questions.

Q: Second question?
NUMBER

Final text.`

    const result = parseQuestionnaire(text)
    const section = result.blocks[0].pages[0].sections[0]

    expect(section.items).toHaveLength(5)
    expect(isText(section.items[0])).toBe(true)
    expect(section.items[1].type).toBe('text')
    expect(isText(section.items[2])).toBe(true)
    expect(section.items[3].type).toBe('number')
    expect(isText(section.items[4])).toBe(true)
  })
})

describe('Parser - Blank Line Handling', () => {
  it('should handle blank lines between question and options', () => {
    const text = `Q: Do you like surveys?

- Yes
- No`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('multiple_choice')
    if (question.type === 'multiple_choice') {
      expect(question.options).toHaveLength(2)
      expect(question.options[0].label).toBe('Yes')
      expect(question.options[1].label).toBe('No')
    }
  })

  it('should handle multiple blank lines between question and options', () => {
    const text = `Q: Select your preference


- Option A
- Option B
- Option C`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('multiple_choice')
    if (question.type === 'multiple_choice') {
      expect(question.options).toHaveLength(3)
    }
  })

  it('should end question when blank line is followed by non-option content', () => {
    const text = `Q: First question?
TEXT

This is separate content, not part of the question.

Q: Second question?
NUMBER`

    const result = parseQuestionnaire(text)
    const section = result.blocks[0].pages[0].sections[0]

    expect(section.items).toHaveLength(3)
    expect(section.items[0].type).toBe('text')
    expect(isText(section.items[1])).toBe(true)
    expect(section.items[2].type).toBe('number')
  })

  it('should handle blank lines in checkbox questions', () => {
    const text = `Q: Select all that apply

- Option 1
- Option 2
- Option 3
CHECKBOX`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('checkbox')
    if (question.type === 'checkbox') {
      expect(question.options).toHaveLength(3)
    }
  })

  it('should handle blank lines before matrix options', () => {
    const text = `Q: Rate these items

- Q: Item 1
- Q: Item 2

- Excellent
- Good
- Fair`

    const questions = getQuestions(text)
    const question = questions[0]

    expect(question.type).toBe('matrix')
    if (question.type === 'matrix') {
      expect(question.subquestions).toHaveLength(2)
      expect(question.options).toHaveLength(3)
    }
  })
})
