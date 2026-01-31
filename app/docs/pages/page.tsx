"use client"

import { renderExample } from "@/components/docs/doc-helpers"

export default function PagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Pages</h2>
        <p className="text-muted-foreground mt-1">
          Pages are the primary containers in your survey. Each page is
          displayed separately with navigation controls.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Usage</h3>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>
            Each <code>#</code> starts a new page
          </li>
          <li>
            Include a title after the <code>#</code>, or leave it blank for
            an untitled page
          </li>
          <li>
            Respondents navigate through pages using Next/Previous buttons
          </li>
          <li>
            Use multiple pages to break long surveys into manageable
            sections
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Example</h3>
        {renderExample(`# **Welcome**
Q: What is your name?
TEXT

# **Contact**
Q: What is your email?
TEXT`)}
      </div>
    </div>
  )
}
