"use client"

import { renderExample } from "@/components/docs/doc-helpers"

export default function NavigationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Navigation</h2>
        <p className="text-muted-foreground mt-1">
          Create navigation items in the survey sidebar for easier
          navigation.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Usage</h3>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>
            Add <code>NAVIGATION:</code> after a page title to include it in
            the survey sidebar
          </li>
          <li>
            Use <code>NAVIGATION: 1</code> for top-level items
          </li>
          <li>
            Use <code>NAVIGATION: 2</code> for nested items under the
            previous level 1
          </li>
          <li>The page title becomes the navigation label</li>
          <li>
            Sidebar shows completion status (visited/current/upcoming)
            automatically
          </li>
          <li>
            Level 1 items with level 2 children become collapsible sections
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Example</h3>
        {renderExample(`# **Welcome**
NAVIGATION: 1

Q: What is your name?
TEXT

# **Demographics**
NAVIGATION: 1

Next are several demographics questions.

# **Age**
NAVIGATION: 2

Q: What is your age?
NUMBER

# **Location**
NAVIGATION: 2

Q: Where do you live?
TEXT

# **Feedback**
NAVIGATION: 1

Q: How was your experience?
- Excellent
- Good
- Fair
- Poor`)}
      </div>
    </div>
  )
}
