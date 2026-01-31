"use client"

import { renderExample } from "@/components/docs/doc-helpers"

export default function NumberPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Number Input</h2>
        <p className="text-muted-foreground mt-1">
          Single-line input that only accepts numeric values.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Usage</h3>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>NUMBER creates a numeric input field</li>
          <li>Only accepts numeric values</li>
          <li>Place NUMBER immediately after the question line</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Example</h3>
        {renderExample(`Q: How old are you?
NUMBER`)}
      </div>
    </div>
  )
}
