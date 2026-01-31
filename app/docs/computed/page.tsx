"use client"

import { renderExample } from "@/components/docs/doc-helpers"

export default function ComputedPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Computed Variables</h2>
        <p className="text-muted-foreground mt-1">
          Create calculated variables based on other answers.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Usage</h3>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>
            Use <code>COMPUTE: variable = expression</code> to calculate a
            variable
          </li>
          <li>Can be placed at block-level or page-level</li>
          <li>Supports arithmetic expressions and conditions</li>
          <li>Evaluated dynamically as user answers questions</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Example</h3>
        {renderExample(`# **Monthly Expenses**
Q: Monthly rent
NUMBER
VARIABLE: rent

Q: Monthly food
NUMBER
VARIABLE: food

Q: Monthly transport
NUMBER
VARIABLE: transport

BLOCK: Summary
COMPUTE: total = rent + food + transport

# **Budget Summary**
Your total monthly expenses: **{total}**`)}
      </div>
    </div>
  )
}
