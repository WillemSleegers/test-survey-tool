"use client"

import { renderCodeBlock, renderExample } from "@/components/docs/doc-helpers"

export default function MatrixPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Matrix</h2>
        <p className="text-muted-foreground mt-1">
          Table layout with rows and columns where each cell is a radio button.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Usage</h3>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>
            Creates a table layout where multiple questions share the same set
            of response options
          </li>
          <li>
            Sub-questions start with <code>- Q:</code> within a question
          </li>
          <li>
            Multiple <code>- Q:</code> lines create multiple rows sharing the
            same options
          </li>
          <li>
            Regular <code>- Option</code> lines after matrix rows become shared
            response options
          </li>
          <li>Can be used with CHECKBOX for multiple selections per row</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Example</h3>
        {renderExample(`Q: Rate the following
- Q: Product quality
- Q: Customer service
- Q: Value for money
- Poor
- Fair
- Good
- Excellent`)}
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Subquestion Variables</h3>
        <p>
          Assign variables to individual matrix rows to reference their
          responses elsewhere:
        </p>
        {renderCodeBlock(`Q: Rate the following
- Q: Product quality
  - VARIABLE: quality_rating
- Q: Customer service
  - VARIABLE: service_rating
- Q: Value for money
  - VARIABLE: value_rating
- Poor
- Fair
- Good
- Excellent`)}
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>
            <code>- VARIABLE:</code> on a matrix row stores that row&apos;s
            selected value
          </li>
          <li>
            Use these variables in conditions, computed expressions, or text
            placeholders
          </li>
          <li>
            Each subquestion variable stores the selected option text (e.g.,
            &quot;Good&quot;)
          </li>
        </ul>
      </div>
    </div>
  )
}
