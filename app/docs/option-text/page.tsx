"use client"

import { renderExample } from "@/components/docs/doc-helpers"

export default function OptionTextPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Text Inputs on Options</h2>
        <p className="text-muted-foreground mt-1">
          Add text input to specific options.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Usage</h3>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>Adds text input to a specific question option</li>
          <li>
            Use <code>- TEXT</code> indented under an option
          </li>
          <li>Useful to allow respondents to elaborate on their selection</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Example</h3>
        {renderExample(`Q: What is your favorite hobby?
- Sports
- Reading
- Gaming
- Other
  - TEXT`)}
      </div>
    </div>
  )
}
