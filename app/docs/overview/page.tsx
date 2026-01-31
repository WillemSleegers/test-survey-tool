"use client"

import { renderCodeBlock, renderExample } from "@/components/docs/doc-helpers"

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Overview</h2>
      </div>

      <div className="space-y-3">
        <p>
          Test Survey Tool (TST) converts structured plain text into interactive
          survey questionnaires. Write your survey in a simple text format with
          keywords like <code>Q:</code>, <code>TEXT</code>, and{" "}
          <code>SHOW_IF:</code>, and the tool renders it as a fully interactive
          survey with conditional logic, computed variables, and multi-page
          navigation.
        </p>
        <p>
          No coding is required. The text format is designed to be readable on
          its own while supporting advanced features like arithmetic
          expressions, dynamic visibility, and complex question types.
        </p>
        <p>
          The syntax is designed so that most features are opt-in. A basic
          survey only needs page markers (<code>#</code>), questions (
          <code>Q:</code>), and options (<code>-</code>). Advanced features like
          conditional logic, computed variables, and custom formatting can be
          added incrementally as needed.
        </p>
        <p>
          Text content supports Markdown formatting throughout — use{" "}
          <code>**bold**</code> for emphasis, <code>*italic*</code> for subtle
          emphasis, and other standard Markdown syntax in page titles, section
          headings, questions, hints, and tooltips.
        </p>
        <p>
          Everything runs entirely in your browser — no data is sent to a server
          or saved anywhere.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Basic Example</h2>
        <p>Here is a simple survey to get you started.</p>
        {renderExample(`# **Welcome**

Q: What is your name?
TEXT

Q: What is your email?
TEXT

# **Feedback**

Q: How would you rate your experience?
- Excellent
- Good
- Fair
- Poor

Q: Would you recommend us to others?
- Yes
- No

Q: Any additional comments?
ESSAY`)}
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Syntax Structure</h2>
        <p>
          Surveys follow a four-level hierarchy. Each level is defined by a
          keyword prefix:
        </p>
        {renderCodeBlock(`BLOCK: Block Name              ← Groups pages (optional)
  SHOW_IF: condition             ← Conditional block visibility
  COMPUTE: var = expression      ← Block-level computed variable

  # Page Title                   ← Starts a new page
    NAVIGATION: 1                ← Adds to sidebar navigation
    SHOW_IF: condition           ← Conditional page visibility
    COMPUTE: var = expression    ← Page-level computed variable

    Text can go here.

    ## Section Title             ← Groups questions within a page (optional)

    Text can go here, too.

      Q: Question text           ← Defines a question
        HINT: Subtext            ← Muted helper text
        TOOLTIP: More info       ← Collapsible info icon
        VARIABLE: name           ← Stores the response
        SHOW_IF: condition       ← Conditional visibility
        - Option 1               ← Answer option
        - Option 2
        TEXT / NUMBER / etc.     ← Question type
        PREFIX: Text / etc.      ← Question modifier`)}
        <p>
          The hierarchy is <code>BLOCK</code> &gt; <code>#</code> Page &gt;{" "}
          <code>##</code> Section &gt; <code>Q:</code> Question or text.
          Keywords like <code>VARIABLE:</code>, <code>SHOW_IF:</code>,{" "}
          <code>HINT:</code>, and <code>TOOLTIP:</code> attach to the element
          above them. Options (<code>- text</code>) belong to the preceding
          question. All levels (blocks, pages, sections) support{" "}
          <code>SHOW_IF:</code> for conditional visibility.
        </p>
      </div>

      <p>
        Explore the sidebar topics to learn about each feature in detail, from
        basic question types to advanced conditional logic and computed
        variables.
      </p>
    </div>
  )
}
