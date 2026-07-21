"use client"

import { renderExample } from "@/components/docs/doc-helpers"

export default function RevealPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Reveal</h2>
        <p className="text-muted-foreground mt-1">
          Add collapsible information icons next to questions.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Usage</h3>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>
            Use <code>REVEAL: text</code> to add a collapsible information icon
          </li>
          <li>Revealed content is hidden by default and shown inline on click</li>
          <li>
            For multi-line reveals, use triple-quote delimiters:{" "}
            <code>REVEAL: &quot;&quot;&quot;</code> ...{" "}
            <code>&quot;&quot;&quot;</code>
          </li>
          <li>Supports Markdown formatting (bold, italic, links, etc.)</li>
          <li>
            For information shown in a popover instead of inline, see{" "}
            <code>TOOLTIP:</code>
          </li>
          <li>
            Multiple choice and checkbox options support their own reveal
            too, with <code>- REVEAL:</code> indented under the option
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Example</h3>
        {renderExample(`Q: How many years of experience do you have?
REVEAL: Used to determine your seniority level
NUMBER

Q: What is your annual income?
HINT: Please provide your gross income
REVEAL: """
**Why we ask this**

This helps us understand our user demographics.
All data is anonymized and encrypted.
"""
NUMBER

Q: Which of these apply to your role?
- Manager
  - REVEAL: We ask this to tailor the follow-up questions on the next page
- Individual contributor
CHECKBOX`)}
      </div>
    </div>
  )
}
