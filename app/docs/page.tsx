"use client"

import { useState } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { Navbar } from "@/components/navbar"
import { parseQuestionnaire } from "@/lib/parser"
import { QuestionnaireViewer } from "@/components/questionnaire-viewer"
import { LanguageProvider } from "@/contexts/language-context"

export type Section =
  | "overview"
  | "pages"
  | "sections"
  | "blocks"
  | "navigation"
  | "basic-questions"
  | "text"
  | "number"
  | "multiple-choice"
  | "checkbox"
  | "matrix"
  | "breakdown"
  | "option-text"
  | "numeric-ranges"
  | "variables"
  | "arithmetic"
  | "computed"
  | "list-formatting"
  | "conditionals"
  | "hints"
  | "tooltips"
  | "markdown"
  | "page-navigator"

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<Section>("overview")

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar maxWidth="7xl" />

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-8">
            <AppSidebar
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />
            <div className="flex-1 max-w-4xl" key={activeSection}>
              <DocumentationContent
                activeSection={activeSection}
                onSectionChange={setActiveSection}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DocumentationContent({
  activeSection,
  onSectionChange,
}: {
  activeSection: Section
  onSectionChange: (section: Section) => void
}) {
  const renderCodeBlock = (code: string) => (
    <div className="bg-muted p-4 rounded-lg">
      <pre className="text-sm font-mono whitespace-pre-wrap">{code}</pre>
    </div>
  )

  const renderExample = (code: string) => {
    try {
      const parsed = parseQuestionnaire(code)
      return (
        <div className="space-y-0 rounded-lg border border-border overflow-hidden">
          <div className="bg-muted p-4">
            <pre className="text-sm font-mono whitespace-pre-wrap">{code}</pre>
          </div>
          <div className="bg-background p-6 border-t border-border">
            <LanguageProvider defaultLanguage="en">
              <QuestionnaireViewer
                questionnaire={parsed.blocks}
                navItems={parsed.navItems}
                onResetToUpload={() => {}}
                hidePageNavigator={true}
                disableAutoScroll={true}
              />
            </LanguageProvider>
          </div>
        </div>
      )
    } catch (err) {
      return (
        <div className="space-y-0 rounded-lg border border-destructive overflow-hidden">
          <div className="bg-muted p-4">
            <pre className="text-sm font-mono whitespace-pre-wrap">{code}</pre>
          </div>
          <div className="bg-destructive/10 p-4 border-t border-destructive">
            <p className="text-sm text-destructive font-semibold">
              Parse Error:
            </p>
            <p className="text-sm text-destructive">{(err as Error).message}</p>
          </div>
        </div>
      )
    }
  }

  switch (activeSection) {
    case "overview":
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Overview</h2>
          </div>

          <div className="space-y-3">
            <p>
              Test Survey Tool (TST) converts structured plain text into
              interactive survey questionnaires. Write your survey in a simple
              text format with keywords like <code>Q:</code>, <code>TEXT</code>,
              and <code>SHOW_IF:</code>, and the tool renders it as a fully
              interactive survey with conditional logic, computed variables, and
              multi-page navigation.
            </p>
            <p>
              No coding is required. The text format is designed to be readable
              on its own while supporting advanced features like arithmetic
              expressions, dynamic visibility, and complex question types.
            </p>
            <p>
              The syntax is designed so that most features are opt-in. A basic
              survey only needs page markers (<code>#</code>), questions (
              <code>Q:</code>), and options (<code>-</code>). Advanced features
              like conditional logic, computed variables, and custom formatting
              can be added incrementally as needed.
            </p>
            <p>
              Text content supports Markdown formatting throughout — use{" "}
              <code>**bold**</code> for emphasis, <code>*italic*</code> for
              subtle emphasis, and other standard Markdown syntax in page
              titles, section headings, questions, hints, and tooltips.
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
  SHOW_IF: condition            ← Conditional block visibility
  COMPUTE: var = expression     ← Block-level computed variable

  # Page Title                  ← Starts a new page
    NAVIGATION: 1               ← Adds to sidebar navigation
    SHOW_IF: condition           ← Conditional page visibility
    COMPUTE: var = expression    ← Page-level computed variable

    ## Section Title             ← Groups questions within a page

      Q: Question text           ← Defines a question
        HINT: Subtext            ← Muted helper text
        TOOLTIP: More info       ← Collapsible info icon
        VARIABLE: name           ← Stores the response
        SHOW_IF: condition       ← Conditional visibility
        - Option 1               ← Answer option
        - Option 2
        TEXT / NUMBER / ESSAY    ← Input type
        BREAKDOWN / CHECKBOX     ← Question modifier`)}
            <p>
              The hierarchy is <code>BLOCK</code> &gt; <code>#</code> Page &gt;{" "}
              <code>##</code> Section &gt; <code>Q:</code> Question. Keywords
              like <code>VARIABLE:</code>, <code>SHOW_IF:</code>,{" "}
              <code>HINT:</code>, and <code>TOOLTIP:</code> attach to the
              element above them. Options (<code>- text</code>) belong to the
              preceding question. All levels support <code>SHOW_IF:</code> for
              conditional visibility.
            </p>
          </div>

          <p>
            Explore the sidebar topics to learn about each feature in detail,
            from basic question types to advanced conditional logic and computed
            variables.
          </p>
        </div>
      )

    case "pages":
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

    case "sections":
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Sections</h2>
            <p className="text-muted-foreground mt-1">
              Organize questions within a page using titled sections with
              optional descriptive content.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Usage</h3>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                Use <code>##</code> to create a section heading within a page
              </li>
              <li>
                Add optional content after the section title to provide context
                or instructions
              </li>
              <li>Section content supports Markdown formatting</li>
              <li>
                Add <code>TOOLTIP:</code> to attach collapsible information to a
                section heading
              </li>
              <li>
                Add <code>SHOW_IF:</code> to conditionally show or hide an
                entire section based on previous answers
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Example</h3>
            {renderExample(`# **Employee Survey**

Q: Are you a manager?
- Yes
- No
VARIABLE: is_manager

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

    case "blocks":
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
                <button
                  onClick={() => onSectionChange("page-navigator")}
                  className="text-primary hover:underline"
                >
                  Page Navigator
                </button>{" "}
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

    case "navigation":
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

    case "basic-questions":
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Questions</h2>
            <p className="text-muted-foreground mt-1">
              Define questions using the <code>Q:</code> prefix, with support
              for various input types and options.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Usage</h3>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                Each question is defined by a <code>Q:</code> line followed by
                its type and options
              </li>
              <li>
                Questions start with <code>Q:</code> or <code>Q1:</code>,{" "}
                <code>Q2:</code>, etc.
              </li>
              <li>
                Use numbers when you want to reference questions explicitly
              </li>
              <li>
                Question text must be on a single line after <code>Q:</code>
              </li>
              <li>
                By default, a question is a multiple choice question (unless you
                specify a type like TEXT, NUMBER, etc.)
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

    case "text":
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Text Input</h2>
            <p className="text-muted-foreground mt-1">
              Single-line text input (TEXT) or multi-line text area (ESSAY).
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Usage</h3>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>TEXT creates a single-line text input field</li>
              <li>ESSAY creates a multi-line text area for longer responses</li>
              <li>Place TEXT or ESSAY immediately after the question line</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Example</h3>
            {renderExample(`Q: What is your name?
TEXT

Q: Tell us about yourself
ESSAY`)}
          </div>
        </div>
      )

    case "number":
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Number Input</h2>
            <p className="text-muted-foreground mt-1">
              Single-line input that only accepts numeric values.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Usage</h3>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>NUMBER creates a numeric input field</li>
              <li>Only accepts numeric values</li>
              <li>Place NUMBER immediately after the question line</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Example</h3>
            {renderExample(`Q: How old are you?
NUMBER`)}
          </div>
        </div>
      )

    case "multiple-choice":
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

    case "checkbox":
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

    case "breakdown":
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Breakdown Questions</h2>
            <p className="text-muted-foreground mt-1">
              Table layout with number inputs for each row, with support for
              totals, subtotals, and calculated values.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Usage</h3>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                Creates a table with number inputs for collecting numeric data
                across multiple rows
              </li>
              <li>
                Add <code>BREAKDOWN</code> after the options to create a
                breakdown question
              </li>
              <li>Each option becomes a row with a number input field</li>
              <li>
                Option-level metadata uses the <code>- </code> dash prefix
                (e.g., <code>- VARIABLE:</code>, <code>- SUBTRACT</code>,{" "}
                <code>- COLUMN:</code>)
              </li>
              <li>
                Use <code>TOTAL:</code> for a total row, <code>
                - SUBTOTAL:</code> for intermediate sums, and{" "}
                <code>- CUSTOM:</code> for custom calculations
              </li>
              <li>
                Use <code>- HEADER:</code> and <code>- SEPARATOR</code> for
                visual organization
              </li>
              <li>
                Use <code>- VALUE:</code> for read-only calculated rows and{" "}
                <code>- SUBTRACT</code> for deductions
              </li>
              <li>
                Use <code>PREFIX:</code> / <code>SUFFIX:</code> for units and{" "}
                <code>- COLUMN: N</code> for multi-column layouts
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Basic Example</h3>
            {renderExample(`Q: How many hours per week do you spend on each activity?
- Work
- Exercise
- Hobbies
- Sleep
BREAKDOWN`)}
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Advanced Example</h3>
            <p>
              This example demonstrates multiple columns, headers, subtotals,
              custom calculations, variables, prefix/suffix, subtract, exclude,
              and a custom total label.
            </p>
            {renderExample(`Q: Profit & loss statement
- HEADER: **Revenue**
- Product sales
  - VARIABLE: product_sales
- Service revenue
  - VARIABLE: service_revenue
- SUBTOTAL: **Total revenue**
  - VARIABLE: total_revenue
- SEPARATOR
- HEADER: **Expenses**
- Cost of goods sold
  - VARIABLE: cogs
  - SUBTRACT
- Operating expenses
  - VARIABLE: opex
  - SUBTRACT
- SUBTOTAL: **Total expenses**
  - VARIABLE: total_expenses
- SEPARATOR
  PREFIX: €
  TOTAL: **Profit**
  BREAKDOWN`)}
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Keyword Reference</h3>
            <p>
              Question-level keywords are placed outside option lines.
              Option-level keywords use the <code>- </code> dash prefix.
            </p>
            <h4 className="text-lg font-semibold mt-4">Question-level</h4>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                <code>BREAKDOWN</code> — marks the question as a breakdown type
              </li>
              <li>
                <code>TOTAL: label</code> — sets a label for the total row
                (supports Markdown)
              </li>
              <li>
                <code>PREFIX: text</code> / <code>SUFFIX: text</code> — adds
                units to all input fields
              </li>
              <li>
                <code>VARIABLE: name</code> — stores the question total in a
                named variable
              </li>
            </ul>
            <h4 className="text-lg font-semibold mt-4">Option-level</h4>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                <code>- HEADER: label</code> — creates a header row for visual
                grouping (excluded from totals, supports Markdown)
              </li>
              <li>
                <code>- SEPARATOR</code> — adds an empty row for visual spacing
                (excluded from totals)
              </li>
              <li>
                <code>- SUBTOTAL: label</code> — displays an intermediate sum of
                rows since the previous subtotal or header
              </li>
              <li>
                <code>- CUSTOM: {"{expression}"}</code> — replaces a subtotal's
                auto-sum with a custom calculation using variable placeholders
              </li>
              <li>
                <code>- VALUE: expression</code> — makes a row read-only with a
                calculated value
              </li>
              <li>
                <code>- VARIABLE: name</code> — stores an individual row's value
                in a named variable
              </li>
              <li>
                <code>- COLUMN: N</code> — assigns the option to column N for
                multi-column layouts
              </li>
              <li>
                <code>- PREFIX: text</code> / <code>- SUFFIX: text</code> —
                overrides the question-level units for this row
              </li>
              <li>
                <code>- SUBTRACT</code> — subtracts this row's value from the
                total instead of adding
              </li>
              <li>
                <code>- EXCLUDE</code> — displays the row but excludes it from
                total calculations
              </li>
            </ul>
          </div>
        </div>
      )

    case "matrix":
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Matrix</h2>
            <p className="text-muted-foreground mt-1">
              Table layout with rows and columns where each cell is a radio
              button.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Usage</h3>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                Creates a table layout where multiple questions share the same
                set of response options
              </li>
              <li>
                Sub-questions start with <code>- Q:</code> within a question
              </li>
              <li>
                Multiple <code>- Q:</code> lines create multiple rows sharing
                the same options
              </li>
              <li>
                Regular <code>- Option</code> lines after matrix rows become
                shared response options
              </li>
              <li>Can be used with CHECKBOX for multiple selections per row</li>
              <li>
                <strong>Note:</strong> For numeric grids with totals, use
                BREAKDOWN questions instead
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Example</h3>
            {renderExample(`Q: Rate the following
- Q: Product quality
- Q: Customer service
- Q: Value for money
- Poor
- Fair
- Good
- Excellent`)}
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Subquestion Variables</h3>
            <p>
              Assign variables to individual matrix rows to reference their
              responses elsewhere:
            </p>
            {renderCodeBlock(`Q: Rate the following
- Q: Product quality
  - VARIABLE: quality_rating
- Q: Customer service
  - VARIABLE: service_rating
- Q: Value for money
  - VARIABLE: value_rating
- Poor
- Fair
- Good
- Excellent`)}
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                <code>- VARIABLE:</code> on a matrix row stores that row's
                selected value
              </li>
              <li>
                Use these variables in conditions, computed expressions, or text
                placeholders
              </li>
              <li>
                Each subquestion variable stores the selected option text (e.g.,
                &quot;Good&quot;)
              </li>
            </ul>
          </div>
        </div>
      )

    case "variables":
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Variables</h2>
            <p className="text-muted-foreground mt-1">
              Assign variable names to questions to reference their answers
              later.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Usage</h3>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                Use <code>VARIABLE: name</code> to store the question's response
              </li>
              <li>
                Can be used to insert the response into texts later in the
                survey or for use in conditions
              </li>
              <li>
                Should be placed after the question or last question option
              </li>
              <li>
                Use <code>{"{name}"}</code> syntax to insert variable values
                into page texts and question texts
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Example</h3>
            {renderExample(`# Personal Info
Q: What is your name?
TEXT
VARIABLE: name

Q: What is your age?
NUMBER
VARIABLE: age

# Summary
Welcome {name}! You are {age} years old.`)}
          </div>
        </div>
      )

    case "arithmetic":
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Arithmetic Expressions</h2>
            <p className="text-muted-foreground mt-1">
              Perform calculations using variables.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Usage</h3>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                Use <code>{"{var1 + var2}"}</code> to add, subtract, multiply,
                or divide variables
              </li>
              <li>Supports parentheses for complex operations</li>
              <li>
                Can be used in question text, page text, or computed variables
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Example</h3>
            {renderExample(`# Budget Calculator
Q: Monthly rent
NUMBER
VARIABLE: rent

Q: Monthly food
NUMBER
VARIABLE: food

Q: Monthly transport
NUMBER
VARIABLE: transport

# Summary
Your monthly expenses:
- Rent: {rent}
- Food: {food}
- Transport: {transport}
- **Total: {rent + food + transport}**`)}
          </div>
        </div>
      )

    case "computed":
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Computed Variables</h2>
            <p className="text-muted-foreground mt-1">
              Create calculated variables based on other answers.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Usage</h3>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                Use <code>COMPUTE: variable = expression</code> to calculate a
                variable
              </li>
              <li>Can be placed at block-level or page-level</li>
              <li>Supports arithmetic expressions and conditions</li>
              <li>Evaluated dynamically as user answers questions</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Example</h3>
            {renderExample(`BLOCK: Budget
COMPUTE: total = rent + food + transport

# Monthly Expenses
Q: Monthly rent
NUMBER
VARIABLE: rent

Q: Monthly food
NUMBER
VARIABLE: food

Q: Monthly transport
NUMBER
VARIABLE: transport

# Budget Summary
Your total monthly expenses: **{total}**`)}
          </div>
        </div>
      )

    case "list-formatting":
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
                <code>{"{variable AS LIST}"}</code> - Formats checkbox variables
                as bullet lists (default behavior)
              </li>
              <li>
                <code>{"{variable AS INLINE_LIST}"}</code> - Formats checkbox
                variables as comma-separated inline text
              </li>
              <li>
                INLINE_LIST automatically lowercases items for natural sentence
                flow
              </li>
              <li>
                Uses Oxford commas (e.g., "sports, music, and technology")
              </li>
              <li>
                Perfect for inserting lists within question text or page content
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Example</h3>
            {renderExample(`# Interests Survey
Q: What are your interests?
- Sports
- Music
- Technology
- Reading
CHECKBOX
VARIABLE: interests

# Summary
## Your interests as a list:
{interests AS LIST}

## Your interests inline:
You selected {interests AS INLINE_LIST} as your interests.`)}
          </div>
        </div>
      )

    case "conditionals":
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Conditionals</h2>
            <p className="text-muted-foreground mt-1">
              Control what content appears based on user responses.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">
                Conditional Logic (SHOW_IF)
              </h3>
              <p>Show or hide questions based on previous answers.</p>

              <div className="space-y-3">
                <h4 className="text-lg font-semibold">Usage</h4>
                <ul className="list-disc list-outside ml-5 space-y-2">
                  <li>
                    Use <code>SHOW_IF: condition</code> to conditionally
                    hide/show questions
                  </li>
                  <li>
                    Place below a question or after question options to apply to
                    that question
                  </li>
                  <li>
                    Can also be placed after blocks, pages, or individual
                    question options
                  </li>
                  <li>
                    Supports operators: ==, !=, &gt;, &lt;, &gt;=, &lt;=, AND,
                    OR, NOT
                  </li>
                  <li>
                    For complex multi-line conditions, use triple-quote
                    delimiters: <code>SHOW_IF: """</code> ... <code>"""</code>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-lg font-semibold">Example</h4>
                {renderExample(`Q: Do you have pets?
- Yes
- No
VARIABLE: has_pets

Q: What kind of pet?
SHOW_IF: has_pets == Yes
- Dog
- Cat
- Bird
- Other`)}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold">Conditional Text</h3>
              <p>Display dynamic text based on variables and conditions.</p>

              <div className="space-y-3">
                <h4 className="text-lg font-semibold">Usage</h4>
                <ul className="list-disc list-outside ml-5 space-y-2">
                  <li>
                    Use <code>{"{IF condition THEN text ELSE text}"}</code>{" "}
                    syntax for conditional text
                  </li>
                  <li>
                    Inserts conditional text within question text or page text
                  </li>
                  <li>
                    Dynamically changes question wording based on previous
                    responses
                  </li>
                  <li>ELSE part is optional</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-lg font-semibold">Example</h4>
                {renderExample(`Q: Are you a student?
- Yes
- No
VARIABLE: student

Q: {{IF student == Yes THEN What is your major? ELSE What is your occupation?}}
TEXT`)}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-semibold">STARTS_WITH Operator</h3>
              <p>Test multiple variables with a common prefix at once.</p>

              <div className="space-y-3">
                <h4 className="text-lg font-semibold">Usage</h4>
                <ul className="list-disc list-outside ml-5 space-y-2">
                  <li>
                    Use <code>STARTS_WITH prefix == value</code> to test
                    multiple variables with a common prefix
                  </li>
                  <li>
                    Tests if ANY variable starting with the prefix meets the
                    condition
                  </li>
                  <li>
                    Uses OR logic: true if at least one matching variable
                    satisfies the condition
                  </li>
                  <li>
                    Example: <code>STARTS_WITH fraud == Yes</code> checks all
                    variables starting with "fraud"
                  </li>
                  <li>
                    Useful for grouped questions with common variable naming
                    patterns
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-lg font-semibold">Example</h4>
                {renderExample(`Q: Did you witness fraud?
- Yes
- No
VARIABLE: crime_fraud

Q: Did you witness theft?
- Yes
- No
VARIABLE: crime_theft

# Follow-up
SHOW_IF: STARTS_WITH crime == Yes

Q: Please provide details
ESSAY`)}
              </div>
            </div>
          </div>
        </div>
      )

    case "hints":
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Hints</h2>
            <p className="text-muted-foreground mt-1">
              Add helpful subtext to questions for additional context.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Usage</h3>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                Use <code>HINT: text</code> to add muted subtext below a
                question
              </li>
              <li>
                Place immediately after the question line; before question
                options
              </li>
              <li>Content on following lines gets appended to the hint text</li>
              <li>Supports Markdown formatting</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Example</h3>
            {renderExample(`Q: What is your email address?
HINT: We'll only use this to send you survey results
TEXT

Q: Which features do you use?
HINT: Select all that apply
- Feature A
- Feature B
- Feature C
CHECKBOX`)}
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Multi-Line Hints</h3>
            <p>
              For longer hint text that spans multiple lines, use triple-quote
              delimiters:
            </p>
            {renderCodeBlock(`Q: Describe your experience
HINT: """
Please be as detailed as possible.
Include specific examples where relevant.
Your feedback helps us improve our services.
"""
ESSAY`)}
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                Place <code>"""</code> after the keyword on the same line, then
                content on following lines
              </li>
              <li>
                Close with <code>"""</code> on its own line
              </li>
              <li>
                Also works with <code>TOOLTIP:</code> and <code>SHOW_IF:</code>
              </li>
              <li>Content between delimiters preserves line breaks</li>
            </ul>
          </div>
        </div>
      )

    case "tooltips":
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Tooltips</h2>
            <p className="text-muted-foreground mt-1">
              Add collapsible information icons next to questions.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Usage</h3>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                Use <code>TOOLTIP: text</code> to add a collapsible information
                icon
              </li>
              <li>Tooltip content is hidden by default and shown on click</li>
              <li>Place after HINT (if present); before question options</li>
              <li>
                Content on following lines gets appended to the tooltip text
              </li>
              <li>Supports Markdown formatting (bold, italic, links, etc.)</li>
              <li>
                <strong>Note:</strong> Use <code>*</code> or numbered lists for
                bullets, not <code>-</code> (which starts options)
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Example</h3>
            {renderExample(`Q: What is your annual income?
HINT: Please provide your gross income
TOOLTIP: Why we ask this
* This helps us understand our user demographics
* All data is anonymized and encrypted
* We never share individual responses
NUMBER`)}
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Multi-Line Tooltips</h3>
            <p>
              For longer tooltip content, use triple-quote delimiters (
              <code>"""</code>):
            </p>
            {renderCodeBlock(`Q: What is your annual income?
TOOLTIP: """
**Why we ask this**
This helps us understand our user demographics.
All data is anonymized and encrypted.
We never share individual responses.
"""
NUMBER`)}
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                Same delimiter syntax as hints: <code>"""</code> to open,{" "}
                <code>"""</code> to close
              </li>
              <li>Preserves line breaks and supports Markdown formatting</li>
            </ul>
          </div>
        </div>
      )

    case "option-text":
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Text Inputs on Options</h2>
            <p className="text-muted-foreground mt-1">
              Add text input to specific options.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Usage</h3>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>Adds text input to a specific question option</li>
              <li>Shows when the option is selected</li>
              <li>
                Use <code>- TEXT</code> or <code>- ESSAY</code> indented under
                an option
              </li>
              <li>
                Useful to allow respondents to elaborate on their selection
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Example</h3>
            {renderExample(`Q: What is your favorite hobby?
- Sports
- Reading
- Gaming
- Other
  - TEXT`)}
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">
              &quot;Other&quot; Option with Text Input
            </h3>
            <p>
              Use <code>- OTHER</code> to create an option that includes a text
              input for custom responses:
            </p>
            {renderExample(`Q: How did you hear about us?
- Search engine
- Social media
- Friend or colleague
- Other
  - OTHER`)}
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                <code>- OTHER</code> adds a text input that appears when the
                option is selected
              </li>
              <li>Works with both multiple choice and checkbox questions</li>
              <li>
                Functionally equivalent to <code>- TEXT</code>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Conditional Options</h3>
            <p>
              Use <code>- SHOW_IF:</code> to conditionally show or hide
              individual options based on previous responses:
            </p>
            {renderExample(`Q: Are you a business customer?
- Yes
- No
VARIABLE: business

Q: What type of account do you need?
- Personal
- Business
  - SHOW_IF: business == Yes
- Enterprise
  - SHOW_IF: business == Yes`)}
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                <code>- SHOW_IF:</code> is placed as a sub-item under the option
                it controls
              </li>
              <li>The option is hidden when the condition is false</li>
              <li>
                Works with multiple choice, checkbox, and matrix questions
              </li>
              <li>
                Uses the same condition syntax as question-level{" "}
                <code>SHOW_IF:</code> (see{" "}
                <button
                  onClick={() => onSectionChange("conditionals")}
                  className="text-primary hover:underline"
                >
                  Conditionals
                </button>
                )
              </li>
            </ul>
          </div>
        </div>
      )

    case "numeric-ranges":
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Numeric Ranges</h2>
            <p className="text-muted-foreground mt-1">
              Generate numeric options using shorthand syntax for rating scales.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Usage</h3>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                Use <code>RANGE: start-end</code> to generate numeric options
                (e.g., <code>RANGE: 1-10</code>)
              </li>
              <li>Generates numeric options from start to end (inclusive)</li>
              <li>
                Works with multiple choice, checkbox, and matrix questions
              </li>
              <li>
                Supports negative numbers (e.g., <code>RANGE: -5-5</code>)
              </li>
              <li>Can be mixed with manual options</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Example: Rating Scale</h3>
            {renderExample(`Q: How satisfied are you with our service?
RANGE: 1-10
VARIABLE: satisfaction`)}
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">
              Example: Matrix with Range
            </h3>
            {renderExample(`Q: Please rate the following aspects:
- Q: Quality
- Q: Service
- Q: Value
RANGE: 1-7`)}
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">
              Example: Net Promoter Score
            </h3>
            {renderExample(`Q: How likely are you to recommend us?
RANGE: 0-10
VARIABLE: nps_score`)}
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Example: Mixed Options</h3>
            {renderCodeBlock(`Q: Select an option
- Low
RANGE: 1-3
- High`)}
            <p className="text-sm">This creates options: Low, 1, 2, 3, High</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Conditional Options</h3>
            <p className="text-muted-foreground">
              Options can be conditionally shown using <code>- SHOW_IF:</code>.
              See the{" "}
              <button
                onClick={() => onSectionChange("conditionals")}
                className="text-primary hover:underline"
              >
                Conditionals section
              </button>{" "}
              for details.
            </p>
          </div>
        </div>
      )

    case "markdown":
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
            {renderExample(`# Survey Instructions

## Welcome
Please answer **honestly** and *thoughtfully*. Your feedback is important to us.

Q: Do you agree with the **terms and conditions**?
- Yes
- No`)}
          </div>
        </div>
      )

    case "page-navigator":
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Page Navigator</h2>
            <p className="text-muted-foreground mt-1">
              A debug panel for survey authors to inspect and navigate the
              survey structure.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Overview</h3>
            <p>
              The Page Navigator is a slide-out panel accessible from the
              top-right corner of any active survey. It is designed for survey
              authors and testers; not for respondents. It provides a structural
              overview of the entire survey so the survey author can quickly
              navigate between different pages of the survey. It also contains
              tools for debugging conditional logic, which can be useful to find
              syntax errors while designing the survey.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Opening the Navigator</h3>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>Click the menu icon in the top-right corner of the survey</li>
              <li>
                Or press <code>Cmd+/</code> (<code>Ctrl+/</code> on Windows) to
                toggle
              </li>
              <li>
                Press <code>Escape</code> to close, or click outside the panel
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Features</h3>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                See all pages grouped by block, with a count of how many are
                visible — useful for verifying the survey structure matches your
                intended layout
              </li>
              <li>
                Hidden pages and blocks appear dimmed with their{" "}
                <code>SHOW_IF</code> conditions displayed, so you can verify
                that conditions are working correctly
              </li>
              <li>
                Click any visible page to jump directly to it, making it easy to
                test different paths through the survey
              </li>
              <li>
                View all response variables and their current values as JSON,
                helpful for debugging computed expressions
              </li>
              <li>View block-level and page-level computed variable values</li>
              <li>Return to the upload page to load a different survey</li>
            </ul>
          </div>
        </div>
      )

    default:
      return null
  }
}
