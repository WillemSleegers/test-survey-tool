"use client"

import { renderExample } from "@/components/docs/doc-helpers"

export default function MarkdownPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Markdown Formatting</h2>
        <p className="text-muted-foreground mt-1">
          All text supports Markdown formatting.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Usage</h3>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>All text supports Markdown formatting</li>
          <li>
            Use <code>**bold text**</code> for emphasis
          </li>
          <li>
            Use <code>*italic text*</code> for subtle emphasis
          </li>
          <li>Supports bullet points, links, and other formatting</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Example</h3>
        {renderExample(`# **Survey Instructions**

## **Welcome**
Please answer **honestly** and *thoughtfully*. Your feedback is important to us.

Q: Do you agree with the **terms and conditions**?
- Yes
- No`)}
      </div>
    </div>
  )
}
