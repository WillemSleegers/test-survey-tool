import { describe, it, expect } from 'vitest'
import { parseQuestionnaire } from '@/lib/parser'

describe('Parser - Edge Cases', () => {
  it('should handle page title immediately followed by section marker', () => {
    const text = `# Page Title
## Section One

Text in section one.`

    const result = parseQuestionnaire(text)
    const page = result.blocks[0].pages[0]

    console.log('Number of sections:', page.sections.length)
    console.log('Sections:', page.sections.map(s => ({ title: s.title, itemCount: s.items.length })))

    // Should have only 1 section (Section One), not an empty default section
    expect(page.sections).toHaveLength(1)
    expect(page.sections[0].title).toBe('Section One')
  })

  it('should handle blank line between page title and section marker', () => {
    const text = `# Page Title

## Section One

Text in section one.`

    const result = parseQuestionnaire(text)
    const page = result.blocks[0].pages[0]

    console.log('Number of sections:', page.sections.length)
    console.log('Sections:', page.sections.map(s => ({ title: s.title, itemCount: s.items.length })))

    // Should still have only 1 section
    expect(page.sections).toHaveLength(1)
    expect(page.sections[0].title).toBe('Section One')
  })
})
