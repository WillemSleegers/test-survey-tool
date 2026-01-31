"use client"

import { renderCodeBlock, renderExample } from "@/components/docs/doc-helpers"

export default function NumericRangesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Numeric Ranges</h2>
        <p className="text-muted-foreground mt-1">
          Generate numeric options using shorthand syntax for rating scales.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Usage</h3>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>
            Use <code>RANGE: start-end</code> to generate numeric options
            (e.g., <code>RANGE: 1-10</code>)
          </li>
          <li>Generates numeric options from start to end (inclusive)</li>
          <li>
            Works with multiple choice, checkbox, and matrix questions
          </li>
          <li>
            Supports negative numbers (e.g., <code>RANGE: -5-5</code>)
          </li>
          <li>Can be mixed with manual options</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Example</h3>
        {renderExample(`Q: How satisfied are you with our service?
RANGE: 1-10
VARIABLE: satisfaction`)}
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Matrix with Range</h3>
        {renderExample(`Q: Please rate the following aspects:
- Q: Quality
- Q: Service
- Q: Value
RANGE: 1-7`)}
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Mixed Options</h3>
        <p className="text-sm">
          Ranges can be combined with manual options.
        </p>
        {renderCodeBlock(`Q: Select an option
- Low
RANGE: 1-3
- High`)}
        <p className="text-sm">This creates options: Low, 1, 2, 3, High</p>
      </div>
    </div>
  )
}
