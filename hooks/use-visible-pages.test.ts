import { describe, it, expect } from "vitest"
import { useVisiblePages } from "@/hooks/use-visible-pages"
import { Page } from "@/lib/types"

describe("useVisiblePages - getVisiblePageContent", () => {
  it("preserves section reveal and tooltip fields through filtering", () => {
    const page: Page = {
      id: 1,
      title: "Page 1",
      sections: [
        {
          id: 1,
          title: "Work Environment",
          reveal: "Covers your physical workspace and equipment.",
          tooltip: "A short tooltip.",
          items: [],
        },
      ],
      computedVariables: [],
    }

    const { getVisiblePageContent } = useVisiblePages([page], {})
    const sections = getVisiblePageContent(page)

    expect(sections).toHaveLength(1)
    expect(sections[0].reveal).toBe("Covers your physical workspace and equipment.")
    expect(sections[0].tooltip).toBe("A short tooltip.")
  })

  it("keeps titleless sections and their reveal content", () => {
    const page: Page = {
      id: 1,
      title: "Page 1",
      sections: [
        {
          id: 1,
          reveal: "Reveal text without a section title.",
          items: [],
        },
      ],
      computedVariables: [],
    }

    const { getVisiblePageContent } = useVisiblePages([page], {})
    const sections = getVisiblePageContent(page)

    expect(sections).toHaveLength(1)
    expect(sections[0].title).toBeUndefined()
    expect(sections[0].reveal).toBe("Reveal text without a section title.")
  })
})
