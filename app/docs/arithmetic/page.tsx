"use client"

import { renderExample } from "@/components/docs/doc-helpers"

export default function ArithmeticPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Arithmetic Expressions</h2>
        <p className="text-muted-foreground mt-1">
          Perform calculations using variables.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Usage</h3>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>
            Use <code>{"{var1 + var2}"}</code> to add, subtract, multiply,
            or divide variables
          </li>
          <li>Supports parentheses for complex operations</li>
          <li>
            Can be used in question text, page text, or computed variables
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Example</h3>
        {renderExample(`# Budget Calculator
Q: Monthly rent
NUMBER
VARIABLE: rent

Q: Monthly food
NUMBER
VARIABLE: food

Q: Monthly transport
NUMBER
VARIABLE: transport

# Summary
Your monthly expenses:
- Rent: {rent}
- Food: {food}
- Transport: {transport}
- **Total: {rent + food + transport}**`)}
      </div>
    </div>
  )
}
