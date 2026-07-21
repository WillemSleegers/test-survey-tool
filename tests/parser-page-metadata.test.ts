import { describe, it, expect } from 'vitest'
import { parseQuestionnaire } from '@/lib/parser'

describe('Parser - Page-level bare REVEAL/TOOLTIP followed by keywords', () => {
  it('preserves NAVIGATION: after a bare REVEAL:', () => {
    const text = `# Page Title
REVEAL:
NAVIGATION: 2

Q: Some question?
TEXT`

    const page = parseQuestionnaire(text).blocks[0].pages[0]

    expect(page.navLevel).toBe(2)
    expect(page.reveal).toBeUndefined()
  })

  it('preserves COMPUTE: after a bare REVEAL:', () => {
    const text = `# Page Title
REVEAL:
COMPUTE: total = 1 + 1

Q: Some question?
TEXT`

    const page = parseQuestionnaire(text).blocks[0].pages[0]

    expect(page.computedVariables).toHaveLength(1)
    expect(page.computedVariables[0]).toEqual({ name: 'total', expression: '1 + 1' })
    expect(page.reveal).toBeUndefined()
  })

  it('preserves SHOW_IF: after a bare REVEAL:', () => {
    const text = `# Page Title
REVEAL:
SHOW_IF: q1 == yes

Q: Some question?
TEXT
VARIABLE: q1`

    const page = parseQuestionnaire(text).blocks[0].pages[0]

    expect(page.showIf).toBe('q1 == yes')
    expect(page.reveal).toBeUndefined()
  })

  it('preserves TOOLTIP: after a bare REVEAL:', () => {
    const text = `# Page Title
REVEAL:
TOOLTIP: some tooltip text

Q: Some question?
TEXT`

    const page = parseQuestionnaire(text).blocks[0].pages[0]

    expect(page.tooltip).toBe('some tooltip text')
    expect(page.reveal).toBeUndefined()
  })

  it('a second REVEAL: after a bare REVEAL: is processed as its own keyword', () => {
    const text = `# Page Title
REVEAL:
REVEAL: actual reveal text

Q: Some question?
TEXT`

    const page = parseQuestionnaire(text).blocks[0].pages[0]

    expect(page.reveal).toBe('actual reveal text')
  })

  it('treats a bare REVEAL: immediately followed by plain text as unset (text becomes section content)', () => {
    const text = `# Page Title
REVEAL:
Some content line

Q: Some question?
TEXT`

    const page = parseQuestionnaire(text).blocks[0].pages[0]

    expect(page.reveal).toBeUndefined()
    expect(page.sections[0].items[0]).toEqual({ value: 'Some content line' })
  })
})
