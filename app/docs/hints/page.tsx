"use client"

import { renderExample } from "@/components/docs/doc-helpers"

export default function HintsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Hints</h2>
        <p className="text-muted-foreground mt-1">
          Add helpful subtext to questions for additional context.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Usage</h3>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>
            Use <code>HINT: text</code> to add muted subtext below a
            question
          </li>
          <li>
            For multi-line hints, use triple-quote delimiters:{" "}
            <code>HINT: &quot;&quot;&quot;</code> ... <code>&quot;&quot;&quot;</code>
          </li>
          <li>
            Also works with <code>TOOLTIP:</code> and <code>SHOW_IF:</code>
          </li>
          <li>Supports Markdown formatting</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Example</h3>
        {renderExample(`Q: What is your email address?
HINT: We'll only use this to send you survey results
TEXT

Q: Describe your experience
HINT: """
Please be as detailed as possible.
Include specific examples where relevant.
"""
ESSAY`)}
      </div>
    </div>
  )
}
