import { describe, it, expect } from "vitest"
import { clampPageIndex } from "@/hooks/use-questionnaire-navigation"

describe("clampPageIndex", () => {
  it("leaves an in-range index untouched", () => {
    expect(clampPageIndex(0, 5)).toBe(0)
    expect(clampPageIndex(3, 5)).toBe(3)
    expect(clampPageIndex(4, 5)).toBe(4)
  })

  it("clamps to the last page when pages become hidden", () => {
    expect(clampPageIndex(4, 3)).toBe(2)
    expect(clampPageIndex(9, 1)).toBe(0)
  })

  it("returns to the requested page once hidden pages come back", () => {
    const requested = 4
    expect(clampPageIndex(requested, 2)).toBe(1)
    expect(clampPageIndex(requested, 6)).toBe(4)
  })

  it("never goes below zero, including with no visible pages", () => {
    expect(clampPageIndex(0, 0)).toBe(0)
    expect(clampPageIndex(3, 0)).toBe(0)
    expect(clampPageIndex(-1, 5)).toBe(0)
  })
})
