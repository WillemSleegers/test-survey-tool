"use client"

import { renderExample } from "@/components/docs/doc-helpers"

export default function TooltipsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Tooltips</h2>
        <p className="text-muted-foreground mt-1">
          Add collapsible information icons next to questions.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Usage</h3>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>
            Use <code>TOOLTIP: text</code> to add a collapsible information icon
          </li>
          <li>Tooltip content is hidden by default and shown on click</li>
          <li>
            For multi-line tooltips, use triple-quote delimiters:{" "}
            <code>TOOLTIP: &quot;&quot;&quot;</code> ...{" "}
            <code>&quot;&quot;&quot;</code>
          </li>
          <li>Supports Markdown formatting (bold, italic, links, etc.)</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Example</h3>
        {renderExample(`Q: How many years of experience do you have?
TOOLTIP: Used to determine your seniority level
NUMBER

Q: What is your annual income?
HINT: Please provide your gross income
TOOLTIP: """
**Why we ask this**

This helps us understand our user demographics.
All data is anonymized and encrypted.
"""
NUMBER`)}
      </div>
    </div>
  )
}
