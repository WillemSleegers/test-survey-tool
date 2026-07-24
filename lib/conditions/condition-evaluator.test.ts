import { describe, it, expect, vi, afterEach } from "vitest"
import { evaluateCondition, evaluateMultiComparisonSum } from "./condition-evaluator"

afterEach(() => {
  vi.restoreAllMocks()
})

describe("basic comparisons", () => {
  it("compares numbers", () => {
    expect(evaluateCondition("age >= 18", { age: "20" })).toBe(true)
    expect(evaluateCondition("age >= 18", { age: "15" })).toBe(false)
    expect(evaluateCondition("age == 18", { age: 18 })).toBe(true)
    expect(evaluateCondition("age != 18", { age: 18 })).toBe(false)
    expect(evaluateCondition("age < -5", { age: "-10" })).toBe(true)
  })

  it("compares unquoted single-word strings", () => {
    expect(evaluateCondition("status == Employed", { status: "Employed" })).toBe(true)
    expect(evaluateCondition("status != Employed", { status: "Student" })).toBe(true)
  })

  it("compares unquoted multi-word strings", () => {
    const variables = { usage: "Several weeks or more" }
    expect(evaluateCondition("usage == Several weeks or more", variables)).toBe(true)
    expect(evaluateCondition("usage != Several weeks or more", variables)).toBe(false)
  })

  it("compares quoted strings, including values containing lowercase and/or", () => {
    const variables = { usage: "Several weeks or more", dept: "Research and Development" }
    expect(evaluateCondition('usage == "Several weeks or more"', variables)).toBe(true)
    expect(evaluateCondition('dept == "Research and Development"', variables)).toBe(true)
    expect(evaluateCondition("dept == 'Research and Development'", variables)).toBe(true)
  })

  it("supports keyword operators in uppercase", () => {
    expect(evaluateCondition("name IS John", { name: "John" })).toBe(true)
    expect(evaluateCondition("name IS_NOT John", { name: "Jane" })).toBe(true)
    expect(evaluateCondition("age GREATER_THAN 18", { age: "20" })).toBe(true)
    expect(evaluateCondition("age LESS_THAN_OR_EQUAL 18", { age: "18" })).toBe(true)
  })

  it("returns false for comparisons on unanswered variables", () => {
    expect(evaluateCondition("missing == Yes", {})).toBe(false)
    expect(evaluateCondition("missing != Yes", {})).toBe(false)
    expect(evaluateCondition("missing >= 3", {})).toBe(false)
  })
})

describe("regression: the sample-survey condition (unquoted value containing ' or ')", () => {
  const condition = "usage_time IS Several weeks or more AND surveys_created >= 3"

  it("is true for a qualifying respondent", () => {
    expect(
      evaluateCondition(condition, {
        usage_time: "Several weeks or more",
        surveys_created: "5",
      })
    ).toBe(true)
  })

  it("is false when the answer count is too low", () => {
    expect(
      evaluateCondition(condition, {
        usage_time: "Several weeks or more",
        surveys_created: "2",
      })
    ).toBe(false)
  })

  it("is false when a different option was chosen", () => {
    expect(
      evaluateCondition(condition, {
        usage_time: "Just started today",
        surveys_created: "5",
      })
    ).toBe(false)
  })
})

describe("logical operators", () => {
  const variables = { a: "yes", b: "", c: "yes" }

  it("evaluates AND and OR with conventional precedence (AND binds tighter)", () => {
    expect(evaluateCondition("a AND c", variables)).toBe(true)
    expect(evaluateCondition("a AND b", variables)).toBe(false)
    expect(evaluateCondition("b OR c", variables)).toBe(true)
    // a AND b OR c == (a AND b) OR c
    expect(evaluateCondition("a AND b OR c", variables)).toBe(true)
    expect(evaluateCondition("b AND a OR b", variables)).toBe(false)
  })

  it("supports && and ||", () => {
    expect(evaluateCondition("a && c", variables)).toBe(true)
    expect(evaluateCondition("b || c", variables)).toBe(true)
  })

  it("groups with parentheses", () => {
    expect(evaluateCondition("(a OR b) AND c", variables)).toBe(true)
    expect(evaluateCondition("(a OR b) AND b", variables)).toBe(false)
    expect(evaluateCondition("a AND (b OR c)", variables)).toBe(true)
    expect(evaluateCondition("NOT (a OR b)", variables)).toBe(false)
    expect(evaluateCondition("((a))", variables)).toBe(true)
  })

  it("binds NOT tighter than AND/OR", () => {
    // NOT a AND b == (NOT a) AND b
    expect(evaluateCondition("NOT a AND b", variables)).toBe(false)
    expect(evaluateCondition("NOT b AND a", variables)).toBe(true)
    expect(evaluateCondition("NOT b OR b", variables)).toBe(true)
    expect(evaluateCondition("NOT NOT a", variables)).toBe(true)
  })

  it("combines comparisons with logic", () => {
    const vars = { age: "20", consent: "Yes" }
    expect(evaluateCondition("age >= 18 AND consent == Yes", vars)).toBe(true)
    expect(evaluateCondition("(age >= 65 OR age < 30) AND consent == Yes", vars)).toBe(true)
    expect(evaluateCondition("age >= 65 OR consent == No", vars)).toBe(false)
  })

  it("treats lowercase and/or/not as plain words, not operators", () => {
    expect(evaluateCondition("pet == cats and dogs", { pet: "cats and dogs" })).toBe(true)
    expect(evaluateCondition("pet == cats or dogs", { pet: "cats or dogs" })).toBe(true)
  })
})

describe("quoting requirements (regression: operator characters and keywords in values)", () => {
  it("an unquoted '+' is read as addition, silently matching the wrong value", () => {
    expect(evaluateCondition("code == A+B", { code: "C+D" })).toBe(true)
    expect(evaluateCondition('code == "A+B"', { code: "C+D" })).toBe(false)
    expect(evaluateCondition('code == "A+B"', { code: "A+B" })).toBe(true)
  })

  it("an unquoted uppercase keyword splits the condition, silently changing its meaning", () => {
    expect(evaluateCondition("status == Yes AND No", { status: "Yes AND No" })).toBe(false)
    expect(evaluateCondition('status == "Yes AND No"', { status: "Yes AND No" })).toBe(true)
    expect(evaluateCondition('status == "Yes AND No"', { status: "Something else" })).toBe(false)
  })

  it("an unquoted '>' is read as a second comparison and fails safe (visible) regardless of match", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    expect(evaluateCondition("plan == Level > Basic", { plan: "Level > Basic" })).toBe(true)
    expect(evaluateCondition("plan == Level > Basic", { plan: "totally different" })).toBe(true)
    expect(warn).toHaveBeenCalled()
    expect(evaluateCondition('plan == "Level > Basic"', { plan: "Level > Basic" })).toBe(true)
    expect(evaluateCondition('plan == "Level > Basic"', { plan: "totally different" })).toBe(false)
  })
})

describe("bare variable tests", () => {
  it("tests truthiness of a bare variable", () => {
    expect(evaluateCondition("answered", { answered: "Yes" })).toBe(true)
    expect(evaluateCondition("answered", { answered: "" })).toBe(false)
    expect(evaluateCondition("answered", {})).toBe(false)
    expect(evaluateCondition("flag", { flag: true })).toBe(true)
    expect(evaluateCondition("flag", { flag: false })).toBe(false)
    expect(evaluateCondition("picks", { picks: ["a"] })).toBe(true)
    expect(evaluateCondition("picks", { picks: [] })).toBe(false)
  })

  it("treats any number, including 0, as answered", () => {
    expect(evaluateCondition("count", { count: 0 })).toBe(true)
  })

  it("handles literal true/false and empty conditions", () => {
    expect(evaluateCondition("true", {})).toBe(true)
    expect(evaluateCondition("false", {})).toBe(false)
    expect(evaluateCondition("", {})).toBe(true)
    expect(evaluateCondition("   ", {})).toBe(true)
  })
})

describe("checkbox array responses", () => {
  const variables = { picks: ["Dogs", "Cats"] }

  it("== tests inclusion, != tests exclusion", () => {
    expect(evaluateCondition("picks == Dogs", variables)).toBe(true)
    expect(evaluateCondition("picks == Birds", variables)).toBe(false)
    expect(evaluateCondition("picks != Birds", variables)).toBe(true)
    expect(evaluateCondition("picks != Dogs", variables)).toBe(false)
  })

  it("ordered operators compare selection count", () => {
    expect(evaluateCondition("picks >= 2", variables)).toBe(true)
    expect(evaluateCondition("picks > 2", variables)).toBe(false)
    expect(evaluateCondition("picks <= 2", variables)).toBe(true)
  })

  it("matches hyphenated quoted labels", () => {
    const vars = { investment: ["Filter- of afzuigingssysteem"] }
    expect(evaluateCondition('investment == "Filter- of afzuigingssysteem"', vars)).toBe(true)
    expect(evaluateCondition('investment != "Filter- of afzuigingssysteem"', vars)).toBe(false)
  })
})

describe("empty-string checks", () => {
  it('var == "" is true for unanswered or empty, false otherwise', () => {
    expect(evaluateCondition('name == ""', {})).toBe(true)
    expect(evaluateCondition('name == ""', { name: "" })).toBe(true)
    expect(evaluateCondition('name == ""', { name: "John" })).toBe(false)
    expect(evaluateCondition('picks == ""', { picks: [] })).toBe(true)
    expect(evaluateCondition('picks == ""', { picks: ["a"] })).toBe(false)
  })

  it('var != "" is the negation for answered variables', () => {
    expect(evaluateCondition('name != ""', { name: "John" })).toBe(true)
    expect(evaluateCondition('name != ""', { name: "" })).toBe(false)
    expect(evaluateCondition('name != ""', {})).toBe(false)
  })
})

describe("variable-to-variable comparisons", () => {
  it("compares string variables as strings (regression: was numeric 0 == 0)", () => {
    expect(evaluateCondition("name1 == name2", { name1: "Alice", name2: "Bob" })).toBe(false)
    expect(evaluateCondition("name1 == name2", { name1: "Alice", name2: "Alice" })).toBe(true)
    expect(evaluateCondition("name1 != name2", { name1: "Alice", name2: "Bob" })).toBe(true)
  })

  it("compares numeric variables numerically", () => {
    expect(evaluateCondition("a == b", { a: "5", b: 5 })).toBe(true)
    expect(evaluateCondition("a >= b", { a: "10", b: "5" })).toBe(true)
    expect(evaluateCondition("a < b", { a: "10", b: "5" })).toBe(false)
  })
})

describe("arithmetic in conditions", () => {
  it("evaluates arithmetic on either side", () => {
    expect(evaluateCondition("age + 5 >= 25", { age: "20" })).toBe(true)
    expect(evaluateCondition("age + 5 >= 25", { age: "19" })).toBe(false)
    expect(evaluateCondition("total == rent + food", { total: 1100, rent: 800, food: 300 })).toBe(true)
    expect(evaluateCondition("a * 2 > b / 2", { a: "3", b: "10" })).toBe(true)
  })

  it("supports parenthesized arithmetic", () => {
    expect(evaluateCondition("(a + b) * 2 == 10", { a: "2", b: "3" })).toBe(true)
  })

  it("treats unknown variables in arithmetic as 0", () => {
    expect(evaluateCondition("known + missing == 5", { known: "5" })).toBe(true)
  })

  it("counts array variables by length in arithmetic", () => {
    expect(evaluateCondition("picks + 1 == 3", { picks: ["a", "b"] })).toBe(true)
  })

  it("does not execute JavaScript in expressions", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
    const globalWithMarker = globalThis as { __pwned?: boolean }
    delete globalWithMarker.__pwned
    evaluateCondition("globalThis.__pwned = true", {})
    evaluateCondition("constructor.constructor('globalThis.__pwned = true')() == 1", {})
    expect(globalWithMarker.__pwned).toBeUndefined()
  })
})

describe("comparison sums", () => {
  const variables = { q1: "Yes", q2: "Yes", q3: "No" }

  it("sums comparisons inside a condition", () => {
    expect(evaluateCondition("q1 == Yes + q2 == Yes + q3 == Yes >= 2", variables)).toBe(true)
    expect(evaluateCondition("q1 == Yes + q2 == Yes + q3 == Yes >= 3", variables)).toBe(false)
  })

  it("evaluateMultiComparisonSum counts matches and mixes in numbers", () => {
    expect(evaluateMultiComparisonSum("q1 == Yes + q2 == Yes + q3 == Yes", variables)).toBe(2)
    expect(evaluateMultiComparisonSum("q1 == Yes + q2 == Yes + 1", variables)).toBe(3)
    expect(evaluateMultiComparisonSum("q1 == Yes - q3 == Yes", variables)).toBe(1)
  })

  it("leaves single comparisons with arithmetic to the normal path", () => {
    expect(evaluateCondition("age + years >= 21", { age: "15", years: "10" })).toBe(true)
  })
})

describe("STARTS_WITH", () => {
  const variables = { crime_theft: "Yes", crime_fraud: "No", other: "Yes" }

  it("matches when any prefixed variable satisfies the comparison", () => {
    expect(evaluateCondition("STARTS_WITH crime == Yes", variables)).toBe(true)
    expect(evaluateCondition("STARTS_WITH crime == Maybe", variables)).toBe(false)
    expect(evaluateCondition("STARTS_WITH missing == Yes", variables)).toBe(false)
  })

  it("strips quotes from the comparison value (regression)", () => {
    expect(evaluateCondition('STARTS_WITH crime == "Yes"', variables)).toBe(true)
    expect(evaluateCondition("STARTS_WITH crime == 'Yes'", variables)).toBe(true)
  })

  it("supports numeric comparisons", () => {
    const nums = { score_a: "5", score_b: "2" }
    expect(evaluateCondition("STARTS_WITH score >= 4", nums)).toBe(true)
    expect(evaluateCondition("STARTS_WITH score > 5", nums)).toBe(false)
  })

  it("combines with logic", () => {
    expect(evaluateCondition("STARTS_WITH crime == Yes AND other == Yes", variables)).toBe(true)
    expect(evaluateCondition("NOT STARTS_WITH crime == Maybe", variables)).toBe(true)
  })
})

describe("computed variables", () => {
  it("reads computed variables like regular variables", () => {
    expect(evaluateCondition("is_adult", { age: "20" }, { is_adult: true })).toBe(true)
    expect(evaluateCondition("is_adult", { age: "10" }, { is_adult: false })).toBe(false)
    expect(evaluateCondition("total > 1", {}, { total: 2 })).toBe(true)
  })
})

describe("malformed conditions fail safe (visible) with a warning", () => {
  it.each([
    "(a",
    "a ==",
    "== b",
    "a = b",
    "a AND",
    "OR b",
    "some words without operators",
    'unterminated == "quote',
  ])("defaults to true for %j", condition => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    expect(evaluateCondition(condition, { a: "yes", b: "yes" })).toBe(true)
    expect(warn).toHaveBeenCalled()
  })
})
