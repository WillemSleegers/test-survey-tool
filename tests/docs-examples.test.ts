import { describe, it, expect } from "vitest"
import { readdirSync, readFileSync } from "fs"
import { join } from "path"
import { parseQuestionnaire } from "@/lib/parser"

/**
 * Every runnable docs example (rendered via renderExample) must parse
 * cleanly. Guards against stricter validation rejecting shipped examples.
 * Extracts renderExample(`...`) template literals from the docs source;
 * survey text contains no backticks, so a simple scan is safe.
 */
function extractExamples(source: string): string[] {
  const examples: string[] = []
  const marker = "renderExample(`"
  let index = source.indexOf(marker)
  while (index !== -1) {
    const start = index + marker.length
    const end = source.indexOf("`", start)
    if (end === -1) break
    examples.push(source.slice(start, end))
    index = source.indexOf(marker, end + 1)
  }
  return examples
}

const docsDir = join(__dirname, "..", "app", "docs")
const pageFiles = readdirSync(docsDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => join(docsDir, entry.name, "page.tsx"))

describe("docs examples parse cleanly", () => {
  for (const file of pageFiles) {
    const source = readFileSync(file, "utf8")
    const examples = extractExamples(source)
    examples.forEach((example, i) => {
      const section = file.split("/").slice(-2, -1)[0]
      it(`${section} example #${i + 1}`, () => {
        expect(() => parseQuestionnaire(example)).not.toThrow()
      })
    })
  }
})
