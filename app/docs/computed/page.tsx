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
          <li>Supports arithmetic expressions, conditions, and conditional string values</li>
          <li>Evaluated dynamically as user answers questions</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Arithmetic example</h3>
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

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Conditional values</h3>
        <p className="text-sm">
          Use <code>IF &lt;condition&gt; THEN &lt;value&gt; ELSE &lt;value&gt;</code> to assign
          a value based on a condition. The condition uses the same syntax as{" "}
          <code>SHOW_IF</code>. Values can be quoted strings, numbers, or
          references to other variables.
        </p>
        <ul className="list-disc list-outside ml-5 space-y-2 text-sm text-muted-foreground">
          <li>
            Unquoted values are first looked up as variable names, then treated
            as string literals if no matching variable exists
          </li>
          <li>
            Computed variables can reference other computed variables — they are
            evaluated in dependency order
          </li>
          <li>
            String results can be used in text placeholders and in{" "}
            <code>SHOW_IF</code> comparisons on pages, sections, or questions
          </li>
        </ul>
        {renderExample(`# Satisfaction

Q: How satisfied are you? (1-10)
NUMBER
VARIABLE: score

# Result
COMPUTE: level = IF score >= 8 THEN "High" ELSE "Low"

Your satisfaction level: **{level}**`)}
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Multiple categories</h3>
        <p className="text-sm">
          For more than two outcomes, use either <code>ELSE IF</code> chaining
          in a single expression, or multiple <code>COMPUTE</code> statements
          for the same variable.
        </p>
        <p className="text-sm">
          With multiple statements, start with a default value and override it
          with conditions in increasing specificity. Each statement is evaluated
          in order — a condition that is false leaves the current value
          unchanged.
        </p>
        {renderExample(`# Satisfaction

Q: How satisfied are you? (1-10)
NUMBER
VARIABLE: score

# Result
COMPUTE: level = "Low"
COMPUTE: level = IF score >= 5 THEN "Medium"
COMPUTE: level = IF score >= 8 THEN "High"

Your satisfaction level: **{level}**`)}
        <p className="text-sm">
          Alternatively, write it as a single chained expression:
        </p>
        {renderExample(`# Satisfaction

Q: How satisfied are you? (1-10)
NUMBER
VARIABLE: score

# Result
COMPUTE: level = IF score >= 8 THEN "High" ELSE IF score >= 5 THEN "Medium" ELSE "Low"

Your satisfaction level: **{level}**`)}
      </div>
    </div>
  )
}
