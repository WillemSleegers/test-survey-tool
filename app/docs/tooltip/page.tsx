"use client"

import { renderExample } from "@/components/docs/doc-helpers"

export default function TooltipPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Tooltip</h2>
        <p className="text-muted-foreground mt-1">
          Add an information icon that shows a popover next to questions.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Usage</h3>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>
            Use <code>TOOLTIP: text</code> to add an icon that shows a popover
          </li>
          <li>The popover appears near the icon on click and closes on click-away</li>
          <li>
            For multi-line tooltips, use triple-quote delimiters:{" "}
            <code>TOOLTIP: &quot;&quot;&quot;</code> ...{" "}
            <code>&quot;&quot;&quot;</code>
          </li>
          <li>Supports Markdown formatting (bold, italic, links, etc.)</li>
          <li>
            For information shown inline instead of in a popover, see{" "}
            <code>REVEAL:</code>
          </li>
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
