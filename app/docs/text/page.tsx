"use client"

import { renderExample } from "@/components/docs/doc-helpers"

export default function TextPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Text Input</h2>
        <p className="text-muted-foreground mt-1">
          Single-line text input (TEXT) or multi-line text area (ESSAY).
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Usage</h3>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>TEXT creates a single-line text input field</li>
          <li>ESSAY creates a multi-line text area for longer responses</li>
          <li>Place TEXT or ESSAY immediately after the question line</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Example</h3>
        {renderExample(`Q: What is your name?
TEXT

Q: Tell us about yourself
ESSAY`)}
      </div>
    </div>
  )
}
