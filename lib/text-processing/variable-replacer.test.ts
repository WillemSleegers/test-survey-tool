import { describe, it, expect } from "vitest"
import { processVariablePlaceholders } from "./variable-replacer"
import { replacePlaceholders } from "./replacer"

const DUTCH_LIST_FORMAT = { empty: "geen", conjunction: "en" }

describe("processVariablePlaceholders array formatting", () => {
  it("defaults to English 'none' for an empty array", () => {
    expect(processVariablePlaceholders("You selected: {colors}", { colors: [] }))
      .toBe("You selected: none")
  })

  it("defaults to English 'and' for an inline list", () => {
    expect(processVariablePlaceholders("{colors AS INLINE_LIST}", { colors: ["Red", "Blue"] }))
      .toBe("red and blue")
  })

  it("uses a provided listFormat for an empty array", () => {
    expect(processVariablePlaceholders("You selected: {colors}", { colors: [] }, DUTCH_LIST_FORMAT))
      .toBe("You selected: geen")
  })

  it("uses a provided listFormat's conjunction for a two-item inline list", () => {
    expect(processVariablePlaceholders("{colors AS INLINE_LIST}", { colors: ["Red", "Blue"] }, DUTCH_LIST_FORMAT))
      .toBe("red en blue")
  })

  it("uses a provided listFormat's conjunction for a three-item inline list", () => {
    expect(processVariablePlaceholders("{colors AS INLINE_LIST}", { colors: ["Red", "Blue", "Green"] }, DUTCH_LIST_FORMAT))
      .toBe("red, blue, en green")
  })
})

describe("replacePlaceholders listFormat threading", () => {
  it("passes a custom listFormat through to array formatting", () => {
    expect(replacePlaceholders("Selected: {colors}", { colors: [] }, undefined, DUTCH_LIST_FORMAT))
      .toBe("Selected: geen")
  })

  it("falls back to English when no listFormat is given", () => {
    expect(replacePlaceholders("Selected: {colors}", { colors: [] }))
      .toBe("Selected: none")
  })
})
