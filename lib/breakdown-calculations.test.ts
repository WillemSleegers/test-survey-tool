import { describe, it, expect } from "vitest"
import { getVisibleBreakdownOptions, sumBreakdownOptions } from "@/lib/breakdown-calculations"
import { BreakdownQuestion } from "@/lib/types"

function makeQuestion(options: BreakdownQuestion["options"]): BreakdownQuestion {
  return {
    id: "q1",
    type: "breakdown",
    text: "Breakdown",
    options,
  }
}

describe("getVisibleBreakdownOptions", () => {
  it("keeps options without SHOW_IF", () => {
    const question = makeQuestion([
      { value: "Rent", label: "Rent" },
      { value: "Food", label: "Food" },
    ])

    const visible = getVisibleBreakdownOptions(question, {}, {})

    expect(visible.map(v => v.index)).toEqual([0, 1])
  })

  it("filters out options whose SHOW_IF is false, preserving original indices", () => {
    const question = makeQuestion([
      { value: "Rent", label: "Rent" },
      { value: "Bonus", label: "Bonus", showIf: "has_bonus == Yes" },
      { value: "Food", label: "Food" },
    ])

    const visible = getVisibleBreakdownOptions(question, { has_bonus: "No" }, {})

    expect(visible.map(v => v.index)).toEqual([0, 2])
    expect(visible.map(v => v.option.label)).toEqual(["Rent", "Food"])
  })

  it("keeps options whose SHOW_IF is true", () => {
    const question = makeQuestion([
      { value: "Rent", label: "Rent" },
      { value: "Bonus", label: "Bonus", showIf: "has_bonus == Yes" },
    ])

    const visible = getVisibleBreakdownOptions(question, { has_bonus: "Yes" }, {})

    expect(visible.map(v => v.index)).toEqual([0, 1])
  })
})

describe("sumBreakdownOptions", () => {
  it("sums visible rows by their original option_N keys", () => {
    const question = makeQuestion([
      { value: "Rent", label: "Rent" },
      { value: "Bonus", label: "Bonus", showIf: "has_bonus == Yes" },
      { value: "Food", label: "Food" },
    ])
    const values = { option_0: "100", option_1: "50", option_2: "20" }

    const hiddenBonus = getVisibleBreakdownOptions(question, { has_bonus: "No" }, {})
    expect(sumBreakdownOptions(hiddenBonus, values, {}, {})).toBe(120)

    const shownBonus = getVisibleBreakdownOptions(question, { has_bonus: "Yes" }, {})
    expect(sumBreakdownOptions(shownBonus, values, {}, {})).toBe(170)
  })

  it("excludes rows marked EXCLUDE even when visible", () => {
    const question = makeQuestion([
      { value: "Rent", label: "Rent" },
      { value: "Note", label: "Note", exclude: true },
    ])
    const values = { option_0: "100", option_1: "999" }

    const visible = getVisibleBreakdownOptions(question, {}, {})

    expect(sumBreakdownOptions(visible, values, {}, {})).toBe(100)
  })

  it("subtracts rows marked SUBTRACT", () => {
    const question = makeQuestion([
      { value: "Revenue", label: "Revenue" },
      { value: "Cost", label: "Cost", subtract: true },
    ])
    const values = { option_0: "100", option_1: "40" }

    const visible = getVisibleBreakdownOptions(question, {}, {})

    expect(sumBreakdownOptions(visible, values, {}, {})).toBe(60)
  })

  it("resolves prefillValue placeholders for read-only rows", () => {
    const question = makeQuestion([
      { value: "Rent", label: "Rent" },
      { value: "Double", label: "Double", prefillValue: "{rent}" },
    ])
    const values = { option_0: "100" }

    const visible = getVisibleBreakdownOptions(question, { rent: 100 }, {})

    expect(sumBreakdownOptions(visible, values, { rent: 100 }, {})).toBe(200)
  })

  it("a hidden row is excluded from the total but keeps its stored value if it reappears", () => {
    const question = makeQuestion([
      { value: "Rent", label: "Rent" },
      { value: "Bonus", label: "Bonus", showIf: "has_bonus == Yes" },
    ])
    const values = { option_0: "100", option_1: "50" }

    const hidden = getVisibleBreakdownOptions(question, { has_bonus: "No" }, {})
    expect(sumBreakdownOptions(hidden, values, {}, {})).toBe(100)

    const shown = getVisibleBreakdownOptions(question, { has_bonus: "Yes" }, {})
    expect(sumBreakdownOptions(shown, values, {}, {})).toBe(150)
  })

  it("supports subtotal ranges spanning a hidden row", () => {
    const question = makeQuestion([
      { value: "Rent", label: "Rent" },
      { value: "Bonus", label: "Bonus", showIf: "has_bonus == Yes" },
      { value: "Food", label: "Food" },
      { value: "Subtotal", label: "Subtotal", subtotalLabel: "Subtotal" },
    ])
    const values = { option_0: "100", option_1: "50", option_2: "20" }

    const visible = getVisibleBreakdownOptions(question, { has_bonus: "No" }, {})
    // Subtotal covers indices [0, 3) — same range logic used by the component/hook
    const range = visible.filter(entry => entry.index >= 0 && entry.index < 3)

    expect(sumBreakdownOptions(range, values, {}, {})).toBe(120)
  })
})
