import { describe, it, expect } from "vitest"
import { deriveVariables, applyOtherText } from "@/lib/response-variables"
import { Page, Responses, OtherTexts } from "@/lib/types"

function makePage(id: number, sections: Page["sections"]): Page {
  return { id, title: `Page ${id}`, sections, computedVariables: [] }
}

describe("deriveVariables", () => {
  it("extracts a simple question-level variable", () => {
    const questionnaire: Page[] = [
      makePage(1, [
        {
          id: 1,
          items: [{ id: "q1", type: "text", text: "Name", variable: "name" }],
        },
      ]),
    ]
    const responses: Responses = { q1: "Alice" }

    expect(deriveVariables(questionnaire, responses)).toEqual({ name: "Alice" })
  })

  it("extracts matrix subquestion variables", () => {
    const questionnaire: Page[] = [
      makePage(1, [
        {
          id: 1,
          items: [
            {
              id: "matrix1",
              type: "matrix",
              text: "Rate these",
              options: [
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ],
              subquestions: [{ id: "row1", text: "Row 1", variable: "row1_answer" }],
            },
          ],
        },
      ]),
    ]
    const responses: Responses = { row1: "yes" }

    expect(deriveVariables(questionnaire, responses)).toEqual({ row1_answer: "yes" })
  })

  it("calculates a breakdown question total and a subtotal that depends on it", () => {
    const questionnaire: Page[] = [
      makePage(1, [
        {
          id: 1,
          items: [
            {
              id: "bd1",
              type: "breakdown",
              text: "Expenses",
              variable: "total",
              options: [
                { value: "Rent", label: "Rent" },
                { value: "Food", label: "Food" },
                {
                  value: "Subtotal",
                  label: "Subtotal",
                  subtotalLabel: "Subtotal",
                  variable: "subtotal",
                },
              ],
            },
          ],
        },
      ]),
    ]
    const responses: Responses = { bd1: { option_0: "100", option_1: "50" } }

    expect(deriveVariables(questionnaire, responses)).toEqual({
      total: 150,
      subtotal: 150,
    })
  })

  it("resolves a CUSTOM subtotal that references a subtotal defined later in the option list", () => {
    const questionnaire: Page[] = [
      makePage(1, [
        {
          id: 1,
          items: [
            {
              id: "bd1",
              type: "breakdown",
              text: "Expenses",
              options: [
                {
                  value: "Combined",
                  label: "Combined",
                  subtotalLabel: "Combined",
                  custom: "{{rent_subtotal + food_subtotal}}",
                  variable: "combined",
                },
                { value: "Rent", label: "Rent" },
                {
                  value: "RentSubtotal",
                  label: "Rent Subtotal",
                  subtotalLabel: "Rent Subtotal",
                  variable: "rent_subtotal",
                },
                { value: "Food", label: "Food" },
                {
                  value: "FoodSubtotal",
                  label: "Food Subtotal",
                  subtotalLabel: "Food Subtotal",
                  variable: "food_subtotal",
                },
              ],
            },
          ],
        },
      ]),
    ]
    const responses: Responses = { bd1: { option_1: "100", option_3: "20" } }

    expect(deriveVariables(questionnaire, responses)).toEqual({
      rent_subtotal: 100,
      food_subtotal: 20,
      combined: 120,
    })
  })

  it("derives identical variables regardless of the order responses were inserted in", () => {
    // q_base defines `base`; q_bd's "Double" row prefills from {base} via VALUE
    const questionnaire: Page[] = [
      makePage(1, [
        {
          id: 1,
          items: [
            { id: "q_base", type: "number", text: "Base value", variable: "base" },
            {
              id: "q_bd",
              type: "breakdown",
              text: "Breakdown",
              options: [
                { value: "Rent", label: "Rent" },
                {
                  value: "Double",
                  label: "Double",
                  prefillValue: "{base}",
                  variable: "doubled",
                },
              ],
            },
          ],
        },
      ]),
    ]

    // Same content, inserted in questionnaire order
    const responsesAnsweredInOrder: Responses = {}
    responsesAnsweredInOrder["q_base"] = 10
    responsesAnsweredInOrder["q_bd"] = { option_0: "5" }

    // Same content, inserted in reverse order (e.g. user filled it in out of order)
    const responsesAnsweredOutOfOrder: Responses = {}
    responsesAnsweredOutOfOrder["q_bd"] = { option_0: "5" }
    responsesAnsweredOutOfOrder["q_base"] = 10

    const varsInOrder = deriveVariables(questionnaire, responsesAnsweredInOrder)
    const varsOutOfOrder = deriveVariables(questionnaire, responsesAnsweredOutOfOrder)

    expect(varsInOrder).toEqual(varsOutOfOrder)
    expect(varsInOrder.base).toBe(10)
    expect(varsInOrder.doubled).toBe(10)
  })
})

describe("applyOtherText", () => {
  const checkboxQuestionnaire: Page[] = [
    makePage(1, [
      {
        id: 1,
        items: [
          {
            id: "q1",
            type: "checkbox",
            text: "Interests",
            variable: "interests",
            options: [
              { value: "Sports", label: "Sports" },
              { value: "Other, namely:", label: "Other, namely:", allowsOtherText: true },
            ],
          },
        ],
      },
    ]),
  ]

  const radioQuestionnaire: Page[] = [
    makePage(1, [
      {
        id: 1,
        items: [
          {
            id: "q1",
            type: "multiple_choice",
            text: "Preferred contact",
            variable: "contact",
            options: [
              { value: "Email", label: "Email" },
              { value: "Other:", label: "Other:", allowsOtherText: true },
            ],
          },
        ],
      },
    ]),
  ]

  it("joins a checkbox array item with typed text using a single space, however the label is punctuated", () => {
    const responses: Responses = { q1: ["Sports", "Other, namely:"] }
    const variables = deriveVariables(checkboxQuestionnaire, responses)
    const otherTexts: OtherTexts = { q1: { "Other, namely:": "painting" } }

    const displayVariables = applyOtherText(variables, checkboxQuestionnaire, otherTexts)

    expect(displayVariables.interests).toEqual(["Sports", "Other, namely: painting"])
    // No double punctuation, unlike naively appending ": " after a label that already ends in ":"
    expect(displayVariables.interests).not.toContain("Other, namely:: painting")
  })

  it("composes a radio (single string) variable the same way", () => {
    const responses: Responses = { q1: "Other:" }
    const variables = deriveVariables(radioQuestionnaire, responses)
    const otherTexts: OtherTexts = { q1: { "Other:": "carrier pigeon" } }

    const displayVariables = applyOtherText(variables, radioQuestionnaire, otherTexts)

    expect(displayVariables.contact).toBe("Other: carrier pigeon")
  })

  it("leaves the base variable untouched for conditions/matching (does not mutate the input)", () => {
    const responses: Responses = { q1: ["Sports", "Other, namely:"] }
    const variables = deriveVariables(checkboxQuestionnaire, responses)
    const otherTexts: OtherTexts = { q1: { "Other, namely:": "painting" } }

    applyOtherText(variables, checkboxQuestionnaire, otherTexts)

    expect(variables.interests).toEqual(["Sports", "Other, namely:"])
  })

  it("falls back to the plain label when no text has been typed", () => {
    const responses: Responses = { q1: ["Sports", "Other, namely:"] }
    const variables = deriveVariables(checkboxQuestionnaire, responses)
    const otherTexts: OtherTexts = { q1: { "Other, namely:": "   " } }

    const displayVariables = applyOtherText(variables, checkboxQuestionnaire, otherTexts)

    expect(displayVariables.interests).toEqual(["Sports", "Other, namely:"])
  })

  it("ignores other-text entries for options that don't allow it", () => {
    const responses: Responses = { q1: ["Sports"] }
    const variables = deriveVariables(checkboxQuestionnaire, responses)
    const otherTexts: OtherTexts = { q1: { Sports: "should be ignored" } }

    const displayVariables = applyOtherText(variables, checkboxQuestionnaire, otherTexts)

    expect(displayVariables.interests).toEqual(["Sports"])
  })

  it("is a no-op when there is no other-text for the question", () => {
    const responses: Responses = { q1: ["Sports"] }
    const variables = deriveVariables(checkboxQuestionnaire, responses)

    const displayVariables = applyOtherText(variables, checkboxQuestionnaire, {})

    expect(displayVariables).toEqual(variables)
  })
})
