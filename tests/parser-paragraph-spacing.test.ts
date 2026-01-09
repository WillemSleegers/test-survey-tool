import { describe, expect, it } from "vitest"
import { parseQuestionnaire } from "@/lib/parser"

describe("Parser - Paragraph Spacing", () => {
  it("should preserve blank lines between text paragraphs", () => {
    const input = `
# Page One

First paragraph.

Second paragraph.

Third paragraph.
`
    const result = parseQuestionnaire(input)
    const page = result.blocks[0].pages[0]
    const section = page.sections[0]
    const textItem = section.items[0]

    expect(textItem).toHaveProperty("value")
    if ("value" in textItem) {
      // Should have double newlines between paragraphs
      expect(textItem.value).toContain("First paragraph.\n\nSecond paragraph.\n\nThird paragraph.")
    }
  })

  it("should preserve blank lines after TOOLTIP delimiter", () => {
    const input = `
# Page One

TOOLTIP: """
This is a tooltip.
"""

First paragraph after tooltip.

Second paragraph after tooltip.
`
    const result = parseQuestionnaire(input)
    const page = result.blocks[0].pages[0]
    const section = page.sections[0]
    const textItem = section.items[0]

    expect(textItem).toHaveProperty("value")
    if ("value" in textItem) {
      // Should have double newlines between paragraphs
      expect(textItem.value).toContain("First paragraph after tooltip.\n\nSecond paragraph after tooltip.")
    }
  })

  it("should not include leading blank lines", () => {
    const input = `
# Page One

TOOLTIP: """
Tooltip content
"""


First paragraph (has blank lines before it).
`
    const result = parseQuestionnaire(input)
    const page = result.blocks[0].pages[0]
    const section = page.sections[0]
    const textItem = section.items[0]

    expect(textItem).toHaveProperty("value")
    if ("value" in textItem) {
      // Should NOT start with newlines
      expect(textItem.value).toBe("First paragraph (has blank lines before it).")
    }
  })

  it("should match temp.md example structure", () => {
    const input = `# Page One

TOOLTIP: """
Tooltip content here.
"""

Let op: De definitie van omzet is vanaf dit jaar aangepast. Klik op het i-teken voor meer informatie over de posten die tot de omzet worden gerekend.

Rond alle bedragen af op 1000-tallen. Noteer € 23.669,- als 24
`
    const result = parseQuestionnaire(input)
    const page = result.blocks[0].pages[0]
    const section = page.sections[0]
    const textItem = section.items[0]

    expect(textItem).toHaveProperty("value")
    if ("value" in textItem) {
      // Should have double newlines between paragraphs
      expect(textItem.value).toContain("\n\n")
    }
  })
})
