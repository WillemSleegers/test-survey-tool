import { describe, it, expect } from 'vitest'
import { parseQuestionnaire } from '@/lib/parser'
import { isText, isQuestion } from '@/lib/types'

describe('Parser - Section Handling', () => {
  it('should handle content before first explicit section', () => {
    const text = `# Page Title

This is text before any section.

Q: Question before section?
TEXT

## Section One

Text in section one.

Q: Question in section?
NUMBER`

    const result = parseQuestionnaire(text)
    const page = result.blocks[0].pages[0]

    expect(page.sections).toHaveLength(2)

    // First section should be implicit default section with content before ##
    expect(page.sections[0].title).toBeUndefined()
    expect(page.sections[0].items).toHaveLength(2)
    expect(isText(page.sections[0].items[0])).toBe(true)
    if (isQuestion(page.sections[0].items[1])) {
      expect(page.sections[0].items[1].type).toBe('text')
    }

    // Second section should be explicit "Section One"
    expect(page.sections[1].title).toBe('Section One')
    expect(page.sections[1].items).toHaveLength(2)
  })

  it('should handle page with only explicit sections', () => {
    const text = `# Page Title

## Section One

Text in section one.

## Section Two

Text in section two.`

    const result = parseQuestionnaire(text)
    const page = result.blocks[0].pages[0]

    expect(page.sections).toHaveLength(2)
    expect(page.sections[0].title).toBe('Section One')
    expect(page.sections[1].title).toBe('Section Two')
  })

  it('should handle page with no explicit sections', () => {
    const text = `# Page Title

This is text without any sections.

Q: A question?
TEXT`

    const result = parseQuestionnaire(text)
    const page = result.blocks[0].pages[0]

    expect(page.sections).toHaveLength(1)
    expect(page.sections[0].title).toBeUndefined()
    expect(page.sections[0].items).toHaveLength(2)
  })

  it('should handle page title immediately followed by section marker', () => {
    const text = `# Page Title
## Section One

Text in section one.`

    const result = parseQuestionnaire(text)
    const page = result.blocks[0].pages[0]

    expect(page.sections).toHaveLength(1)
    expect(page.sections[0].title).toBe('Section One')
  })

  it('should handle blank line between page title and section marker', () => {
    const text = `# Page Title

## Section One

Text in section one.`

    const result = parseQuestionnaire(text)
    const page = result.blocks[0].pages[0]

    expect(page.sections).toHaveLength(1)
    expect(page.sections[0].title).toBe('Section One')
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
    expect(isQuestion(section.items[1])).toBe(true)
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
    if (isQuestion(section.items[1])) {
      expect(section.items[1].type).toBe('text')
    }
    expect(isText(section.items[2])).toBe(true)
    if (isQuestion(section.items[3])) {
      expect(section.items[3].type).toBe('number')
    }
    expect(isText(section.items[4])).toBe(true)
  })
})

describe('Parser - Blank Line Handling', () => {
  it('should handle blank lines between question and options', () => {
    const text = `Q: Do you like surveys?

- Yes
- No`

    const result = parseQuestionnaire(text)
    const question = result.blocks[0].pages[0].sections[0].items.filter(isQuestion)[0]

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

    const result = parseQuestionnaire(text)
    const question = result.blocks[0].pages[0].sections[0].items.filter(isQuestion)[0]

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
    if (isQuestion(section.items[0])) {
      expect(section.items[0].type).toBe('text')
    }
    expect(isText(section.items[1])).toBe(true)
    if (isQuestion(section.items[2])) {
      expect(section.items[2].type).toBe('number')
    }
  })

  it('should handle blank lines in checkbox questions', () => {
    const text = `Q: Select all that apply

- Option 1
- Option 2
- Option 3
CHECKBOX`

    const result = parseQuestionnaire(text)
    const question = result.blocks[0].pages[0].sections[0].items.filter(isQuestion)[0]

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

    const result = parseQuestionnaire(text)
    const question = result.blocks[0].pages[0].sections[0].items.filter(isQuestion)[0]

    expect(question.type).toBe('matrix')
    if (question.type === 'matrix') {
      expect(question.subquestions).toHaveLength(2)
      expect(question.options).toHaveLength(3)
    }
  })
})
