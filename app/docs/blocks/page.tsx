"use client"

import Link from "next/link"
import { renderExample } from "@/components/docs/doc-helpers"

export default function BlocksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Blocks</h2>
        <p className="text-muted-foreground mt-1">
          Group multiple pages together for conditional logic.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Usage</h3>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>
            Use <code>BLOCK:</code> to group multiple pages together
          </li>
          <li>
            All pages following a BLOCK declaration belong to that block
            until the next BLOCK
          </li>
          <li>
            Combine blocks with <code>SHOW_IF</code> to conditionally
            show/hide multiple pages
          </li>
          <li>
            Block names appear as collapsible group headers in the{" "}
            <Link
              href="/docs/page-navigator"
              className="text-primary hover:underline"
            >
              Page Navigator
            </Link>{" "}
            panel, helping survey authors organize and test their surveys
          </li>
          <li>
            <strong>Note:</strong> BLOCKs are not visible to respondents —
            use NAVIGATION for respondent-facing sidebar navigation
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Example</h3>
        {renderExample(`# **Screening**
Q: Would you like to participate in our survey?
- Yes
- No
VARIABLE: participate

BLOCK: Main Survey
SHOW_IF: participate == Yes

# **Demographics**
Q: What is your age?
NUMBER

# **Feedback**
Q: How satisfied are you?
- Very satisfied
- Satisfied
- Neutral
- Dissatisfied`)}
      </div>
    </div>
  )
}
