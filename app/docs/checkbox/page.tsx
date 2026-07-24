"use client"

import Link from "next/link"
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
          <li>
            Individual options also support their own{" "}
            <Link href="/docs/hints" className="text-primary hover:underline">
              hint
            </Link>
            ,{" "}
            <Link
              href="/docs/tooltip"
              className="text-primary hover:underline"
            >
              tooltip
            </Link>
            ,{" "}
            <Link href="/docs/reveal" className="text-primary hover:underline">
              reveal
            </Link>
            , and{" "}
            <Link
              href="/docs/conditionals"
              className="text-primary hover:underline"
            >
              conditional visibility
            </Link>
            , plus a{" "}
            <Link
              href="/docs/option-text"
              className="text-primary hover:underline"
            >
              text input
            </Link>{" "}
            when selected, or an{" "}
            <Link
              href="/docs/option-exclusive"
              className="text-primary hover:underline"
            >
              exclusive
            </Link>{" "}
            &quot;none of the above&quot;-style option
          </li>
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
