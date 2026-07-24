"use client"

import Link from "next/link"
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
            when selected
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
