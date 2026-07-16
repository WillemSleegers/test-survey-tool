import { describe, it, expect } from "vitest"
import { isArithmeticExpression } from "./expression-evaluator"
import { evaluateCondition } from "./condition-evaluator"

describe("isArithmeticExpression", () => {
  it("treats a hyphenated word as not arithmetic when unquoted variable name", () => {
    expect(isArithmeticExpression("age")).toBe(false)
  })

  it("still detects real arithmetic expressions", () => {
    expect(isArithmeticExpression("age + 5")).toBe(true)
    expect(isArithmeticExpression("rent - discount")).toBe(true)
  })

  it("does not treat a quoted string containing a hyphenated compound word as arithmetic", () => {
    expect(isArithmeticExpression('"milieu-investering"')).toBe(false)
    expect(isArithmeticExpression('"Afval- of perscontainer"')).toBe(false)
  })
})

describe("evaluateCondition with hyphenated quoted values", () => {
  it("matches a checkbox selection whose label contains a hyphenated compound word", () => {
    const variables = { investment: ["Filter- of afzuigingssysteem"] }
    expect(
      evaluateCondition('investment == "Filter- of afzuigingssysteem"', variables, {})
    ).toBe(true)
  })

  it("does not match when the hyphenated label was not selected", () => {
    const variables = { investment: ["Zonnepanelen"] }
    expect(
      evaluateCondition('investment == "Filter- of afzuigingssysteem"', variables, {})
    ).toBe(false)
  })
})
