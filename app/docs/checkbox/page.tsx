"use client"

import { renderExample } from "@/components/docs/doc-helpers"

export default function CheckboxPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Checkbox</h2>
        <p className="text-muted-foreground mt-1">
          Multiple selection - choose multiple options.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Usage</h3>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>Creates checkbox options where multiple can be selected</li>
          <li>Add CHECKBOX after the last option</li>
          <li>Each option starts with a dash (-) and space</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Example</h3>
        {renderExample(`Q: Which languages do you speak?
- English
- Spanish
- French
CHECKBOX`)}
      </div>
    </div>
  )
}
