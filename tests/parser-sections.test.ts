import { describe, it, expect } from 'vitest'
import { parseQuestionnaire } from '@/lib/parser'
import { isText } from '@/lib/types'

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

    // Should have 2 sections
    expect(page.sections).toHaveLength(2)

    // First section should be implicit default section with content before ##
    expect(page.sections[0].title).toBeUndefined()
    expect(page.sections[0].items).toHaveLength(2) // Text + question
    expect(isText(page.sections[0].items[0])).toBe(true)
    expect(page.sections[0].items[1].type).toBe('text')

    // Second section should be explicit "Section One"
    expect(page.sections[1].title).toBe('Section One')
    expect(page.sections[1].items).toHaveLength(2) // Text + question
  })

  it('should handle page with only explicit sections', () => {
    const text = `# Page Title

## Section One

Text in section one.

## Section Two

Text in section two.`

    const result = parseQuestionnaire(text)
    const page = result.blocks[0].pages[0]

    // Should have 2 sections, no implicit default section
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

    // Should have 1 implicit default section
    expect(page.sections).toHaveLength(1)
    expect(page.sections[0].title).toBeUndefined()
    expect(page.sections[0].items).toHaveLength(2)
  })
})
