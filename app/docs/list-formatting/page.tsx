"use client"

import { renderExample } from "@/components/docs/doc-helpers"

export default function ListFormattingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">List Formatting</h2>
        <p className="text-muted-foreground mt-1">
          Format checkbox variables as bullet lists or inline text.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Usage</h3>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>
            <code>{"{variable AS LIST}"}</code> - Formats checkbox variables as
            bullet lists (default behavior)
          </li>
          <li>
            <code>{"{variable AS INLINE_LIST}"}</code> - Formats checkbox
            variables as comma-separated inline text
          </li>
          <li>
            INLINE_LIST automatically lowercases items for natural sentence flow
          </li>
          <li>
            Uses Oxford commas (e.g., &quot;sports, music, and technology&quot;)
          </li>
          <li>
            Perfect for inserting lists within question text or page content
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Example</h3>
        {renderExample(`# **Interests Survey**
Q: What are your interests?
- Sports
- Music
- Technology
- Reading
CHECKBOX
VARIABLE: interests

# **Summary**
## Your interests as a list:
{interests AS LIST}

## Your interests inline:
You selected {interests AS INLINE_LIST} as your interests.`)}
      </div>
    </div>
  )
}
