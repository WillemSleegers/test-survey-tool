"use client"

import { renderExample } from "@/components/docs/doc-helpers"

export default function SectionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Sections</h2>
        <p className="text-muted-foreground mt-1">
          Organize questions within a page using titled sections with optional
          descriptive content.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Usage</h3>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>
            Use <code>##</code> to create a section heading within a page
          </li>
          <li>
            Add optional content after the section title to provide context or
            instructions
          </li>
          <li>Section content supports Markdown formatting</li>
          <li>
            Add <code>TOOLTIP:</code> to attach collapsible information to a
            section heading
          </li>
          <li>
            Add <code>SHOW_IF:</code> to conditionally show or hide an entire
            section based on previous answers
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Example</h3>
        {renderExample(`# **Employee Survey**

## **Work Environment**
TOOLTIP: Work environment covers your physical workspace, equipment, office facilities, and day-to-day working conditions.

Please rate the following aspects of your work environment.

Q: How satisfied are you with your workspace?
- Very satisfied
- Satisfied
- Neutral
- Dissatisfied

Q: Do you have the tools you need?
- Yes
- No

Q: Are you a manager?
- Yes
- No
VARIABLE: is_manager

## **Team Management**
SHOW_IF: is_manager == Yes

These questions are only relevant for managers.

Q: How many direct reports do you have?
NUMBER

Q: How often do you hold one-on-ones?
- Weekly
- Biweekly
- Monthly
- Rarely`)}
      </div>
    </div>
  )
}
