"use client"

import { renderExample } from "@/components/docs/doc-helpers"

export default function MultipleChoicePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Multiple Choice</h2>
        <p className="text-muted-foreground mt-1">
          Radio button selection - choose one option.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Usage</h3>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>
            Creates radio button options where only one can be selected
          </li>
          <li>Each option starts with a dash (-) and space</li>
          <li>
            Default question type when options are present without CHECKBOX
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Example</h3>
        {renderExample(`Q: What is your favorite color?
- Red
- Blue
- Green`)}
      </div>
    </div>
  )
}
