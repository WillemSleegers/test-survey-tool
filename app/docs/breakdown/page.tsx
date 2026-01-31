"use client"

import { renderCodeBlock, renderExample } from "@/components/docs/doc-helpers"

export default function BreakdownPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Breakdown Questions</h2>
        <p className="text-muted-foreground mt-1">
          Table layout with number inputs for each row, with automatic
          totals.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Usage</h3>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>
            Creates a table with number inputs for collecting numeric data
            across multiple rows
          </li>
          <li>
            Add <code>BREAKDOWN</code> after the options to create a
            breakdown question
          </li>
          <li>Each option becomes a row with a number input field</li>
          <li>
            Add <code>TOTAL: label</code> to show an automatic sum at the
            bottom
          </li>
          <li>
            Option-level keywords use the <code>- </code> dash prefix
            (e.g., <code>- VARIABLE:</code>, <code>- SUBTRACT</code>)
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Example</h3>
        {renderExample(`Q: How many hours per week do you spend on each activity?
- Work
- Exercise
- Hobbies
- Sleep
TOTAL: **Total hours**
BREAKDOWN`)}
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Headers, Subtotals, and Separators</h3>
        <p>
          Use structural keywords to organize rows into logical groups with
          intermediate sums:
        </p>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>
            <code>- HEADER: label</code> — creates a header row (excluded
            from totals, supports Markdown)
          </li>
          <li>
            <code>- SEPARATOR</code> — adds an empty row for visual spacing
          </li>
          <li>
            <code>- SUBTOTAL: label</code> — displays an intermediate sum of
            rows since the previous subtotal or header
          </li>
          <li>
            <code>- SUBTRACT</code> — subtracts this row&apos;s value from
            the total instead of adding
          </li>
        </ul>
        {renderExample(`Q: Profit & loss statement
- HEADER: **Revenue**
- Product sales
  - VARIABLE: product_sales
- Service revenue
  - VARIABLE: service_revenue
- SUBTOTAL: **Total revenue**
  - VARIABLE: total_revenue
- SEPARATOR
- HEADER: **Expenses**
- Cost of goods sold
  - VARIABLE: cogs
  - SUBTRACT
- Operating expenses
  - VARIABLE: opex
  - SUBTRACT
- SUBTOTAL: **Total expenses**
  - VARIABLE: total_expenses
- SEPARATOR
PREFIX: €
TOTAL: **Profit**
BREAKDOWN`)}
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Prefix and Suffix</h3>
        <p>
          Add units or currency symbols to input fields:
        </p>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>
            <code>PREFIX: text</code> / <code>SUFFIX: text</code> — adds
            units to all input fields
          </li>
          <li>
            <code>- PREFIX: text</code> / <code>- SUFFIX: text</code> —
            overrides the question-level units for a specific row
          </li>
        </ul>
        {renderCodeBlock(`Q: Annual budget
PREFIX: €
SUFFIX: .00
- Salaries
- Marketing
- Operations
TOTAL: **Total budget**
BREAKDOWN`)}
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Row Variables</h3>
        <p>
          Assign variables to individual rows to reference their values
          elsewhere:
        </p>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>
            <code>- VARIABLE: name</code> — stores an individual row&apos;s
            value in a named variable
          </li>
          <li>
            <code>VARIABLE: name</code> (question-level) — stores the
            question total
          </li>
        </ul>
        {renderCodeBlock(`Q: Monthly expenses
- Rent
  - VARIABLE: rent
- Food
  - VARIABLE: food
- Transport
  - VARIABLE: transport
VARIABLE: total_expenses
BREAKDOWN`)}
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Advanced Keywords</h3>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>
            <code>- VALUE: expression</code> — makes a row read-only with a
            calculated value
          </li>
          <li>
            <code>- CUSTOM: {"{expression}"}</code> — replaces a
            subtotal&apos;s auto-sum with a custom calculation using
            variable placeholders
          </li>
          <li>
            <code>- COLUMN: N</code> — assigns the option to column N for
            multi-column layouts
          </li>
          <li>
            <code>- EXCLUDE</code> — displays the row but excludes it from
            total calculations
          </li>
        </ul>
      </div>
    </div>
  )
}
