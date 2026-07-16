"use client"

import { renderExample } from "@/components/docs/doc-helpers"

export default function OptionExclusivePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Exclusive Options</h2>
        <p className="text-muted-foreground mt-1">
          Make a checkbox option deselect all other selections.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Usage</h3>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>Only applies to checkbox questions</li>
          <li>
            Use <code>- EXCLUSIVE</code> indented under an option
          </li>
          <li>
            Selecting an exclusive option deselects every other selected
            option
          </li>
          <li>
            Selecting any other option deselects any exclusive option that
            was selected
          </li>
          <li>
            A question can have more than one exclusive option (e.g.
            &quot;None of the above&quot; and &quot;Prefer not to say&quot;) -
            selecting one always deselects the other
          </li>
          <li>Useful for options like &quot;None of the above&quot;</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Example</h3>
        {renderExample(`Q: Which of these do you own?
CHECKBOX
- A car
- A bicycle
- A motorcycle
- None of the above
  - EXCLUSIVE
- Prefer not to say
  - EXCLUSIVE`)}
      </div>
    </div>
  )
}
