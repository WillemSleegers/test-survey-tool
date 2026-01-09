"use client"

import { useState } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { Navbar } from "@/components/navbar"
import { parseQuestionnaire } from "@/lib/parser"
import { QuestionnaireViewer } from "@/components/questionnaire-viewer"

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
            <div className="flex-1 max-w-4xl">
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
            <QuestionnaireViewer
              questionnaire={parsed.blocks}
              navItems={parsed.navItems}
              onResetToUpload={() => {}}
              hidePageNavigator={true}
              disableAutoScroll={true}
            />
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
            <h1 className="text-2xl font-semibold">Overview</h1>
            <p className="text-muted-foreground mt-1">
              Learn how to create surveys using the TST text format.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Basic Example</h2>
            <p>Here's a simple survey to get you started.</p>
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

          <p>
            Select a topic from the sidebar to learn about specific features and
            capabilities.
          </p>
        </div>
      )

    case "pages":
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Pages</h2>
            <p className="text-muted-foreground mt-1">
              Pages are the top-level containers in your survey. Each page is
              displayed separately with navigation controls.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Usage</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Each <code>#</code> starts a new page with an optional title</li>
              <li>Include a title after the <code>#</code>, or leave it blank for an untitled page</li>
              <li>Respondents navigate through pages using Next/Previous buttons</li>
              <li>Use multiple pages to break long surveys into manageable sections</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Example</h3>
            {renderExample(`# Welcome
Q: What is your name?
TEXT

# Contact
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
            <ul className="list-disc list-inside space-y-2">
              <li>Use <code>##</code> to create a section heading within a page</li>
              <li>Add optional content after the section title to provide context or instructions</li>
              <li>Section content supports Markdown formatting</li>
              <li>Sections can include tooltips with additional information</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Example</h3>
            {renderExample(`# Employee Survey

## Work Environment
Please rate the following aspects of your work environment. Your feedback helps us improve our workplace.

Q: How satisfied are you with your workspace?
- Very satisfied
- Satisfied
- Neutral
- Dissatisfied

Q: Do you have the tools you need?
- Yes
- No

## Team Collaboration
The next questions focus on how well your team works together.

Q: How often does your team meet?
- Daily
- Weekly
- Monthly
- Rarely

Q: Rate team communication
RANGE: 1-5`)}
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
            <ul className="list-disc list-inside space-y-2">
              <li>Use <code>BLOCK:</code> to group multiple pages together</li>
              <li>All pages following a BLOCK declaration belong to that block until the next BLOCK</li>
              <li>Combine blocks with <code>SHOW_IF</code> to conditionally show/hide multiple pages</li>
              <li><strong>Note:</strong> BLOCKs are for logic only - use NAVIGATION for respondent navigation</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Example</h3>
            {renderExample(`# Screening
Q: Would you like to participate in our survey?
- Yes
- No
VARIABLE: participate

BLOCK: Main Survey
SHOW_IF: participate == Yes

# Demographics
Q: What is your age?
NUMBER

# Feedback
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
            <ul className="list-disc list-inside space-y-2">
              <li>Add <code>NAVIGATION:</code> after a page title to include it in the survey sidebar</li>
              <li>Use <code>NAVIGATION: 1</code> for top-level items</li>
              <li>Use <code>NAVIGATION: 2</code> for nested items under the previous level 1</li>
              <li>The page title becomes the navigation label</li>
              <li>Sidebar shows completion status (visited/current/upcoming) automatically</li>
              <li>Level 1 items with level 2 children become collapsible sections</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Example</h3>
            {renderExample(`# Welcome
NAVIGATION: 1

Q: What is your name?
TEXT

# Demographics
NAVIGATION: 1

# Age
NAVIGATION: 2

Q: What is your age?
NUMBER

# Location
NAVIGATION: 2

Q: Where do you live?
TEXT

# Feedback
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
              Define questions of various types.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Usage</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Questions start with <code>Q:</code> or <code>Q1:</code>,{" "}
                <code>Q2:</code>, etc.
              </li>
              <li>
                Use numbers when you want to reference questions explicitly
              </li>
              <li>Question text must be on a single line after <code>Q:</code></li>
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
            <ul className="list-disc list-inside space-y-2">
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
              Numeric input with validation.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Usage</h3>
            <ul className="list-disc list-inside space-y-2">
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
            <ul className="list-disc list-inside space-y-2">
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
            <ul className="list-disc list-inside space-y-2">
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
              Display options in a table with number inputs for each row,
              automatically calculating totals.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Basic Usage</h3>
            {renderCodeBlock(`Q: Question text
- Option 1
- Option 2
- Option 3
BREAKDOWN`)}
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Creates a table with number inputs for each option</li>
              <li>Each option becomes a row with its own input field</li>
              <li>Automatically displays a total at the bottom</li>
              <li>Useful for numeric grids, ratings, or budget allocations</li>
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
            <h3 className="text-xl font-semibold">Multi-Column Layout</h3>
            <p className="text-sm">
              Use <code>COLUMN:</code> to organize breakdown options into
              multiple value columns:
            </p>
            {renderCodeBlock(`Q: Revenue breakdown (in thousands)
COLUMN: 1
COLUMN: 2
- Residential
- Commercial
- Industrial
BREAKDOWN`)}
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                <code>COLUMN: N</code> creates column N (must come before
                options)
              </li>
              <li>Each option gets an input field in each column</li>
              <li>The total is displayed in the last column</li>
              <li>
                Use <code>EXCLUDE</code> on specific rows to exclude them from
                the total
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Calculated Values</h3>
            <p className="text-sm">
              Use <code>VALUE:</code> to create read-only calculated rows:
            </p>
            {renderCodeBlock(`Q: Financial breakdown
- Revenue
- Costs
- Profit
  VALUE: revenue - costs
BREAKDOWN`)}
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                Rows with <code>VALUE:</code> display calculated results (not
                editable)
              </li>
              <li>Supports arithmetic expressions using other variables</li>
              <li>Calculated values are included in totals by default</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Excluding from Totals</h3>
            <p className="text-sm">
              Use <code>EXCLUDE</code> to display a row without including it in
              the total:
            </p>
            {renderCodeBlock(`Q: Budget allocation
- Department A
- Department B
- Total budget
  EXCLUDE
BREAKDOWN`)}
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                Options with <code>EXCLUDE</code> appear in the table but don't
                affect totals
              </li>
              <li>Useful for reference values or context information</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Option-Level Variables</h3>
            <p className="text-sm">
              Assign variables to individual option values:
            </p>
            {renderCodeBlock(`Q: Project hours
- Design
  VARIABLE: design_hours
- Development
  VARIABLE: dev_hours
- Testing
  VARIABLE: test_hours
VARIABLE: total_hours
BREAKDOWN`)}
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                Option-level <code>VARIABLE:</code> stores the specific option's
                value
              </li>
              <li>
                Question-level <code>VARIABLE:</code> stores the total
              </li>
              <li>Use these variables in calculations and conditional logic</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Subtotals</h3>
            <p className="text-sm">
              Use <code>SUBTOTAL:</code> to display intermediate sums within the
              table:
            </p>
            {renderCodeBlock(`Q: Department expenses
- Salaries
- Benefits
- SUBTOTAL: Personnel costs
- Equipment
- Supplies
- SUBTOTAL: Materials
BREAKDOWN`)}
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                Subtotal rows sum all previous options since the last subtotal
              </li>
              <li>
                Subtotals are displayed but not included in the final total
              </li>
              <li>
                Use Markdown for formatting (e.g., <code>**Bold text**</code>)
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Subtracting Values</h3>
            <p className="text-sm">
              Use <code>SUBTRACT</code> to subtract a value from the total
              instead of adding:
            </p>
            {renderCodeBlock(`Q: Cash flow
- Income
- Expenses
  SUBTRACT
BREAKDOWN`)}
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                Options with <code>SUBTRACT</code> are subtracted from the total
              </li>
              <li>Useful for calculating net values or differences</li>
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
            <ul className="list-disc list-inside space-y-2">
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
                Creates a table layout where each row is a separate question
              </li>
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
            <ul className="list-disc list-inside space-y-2">
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
            <ul className="list-disc list-inside space-y-2">
              <li>Use <code>{"{var1 + var2}"}</code> to add, subtract, multiply, or divide variables</li>
              <li>Supports parentheses for complex operations</li>
              <li>Can be used in question text, page text, or computed variables</li>
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
            <ul className="list-disc list-inside space-y-2">
              <li>Use <code>COMPUTE: variable = expression</code> to calculate a variable</li>
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
            <ul className="list-disc list-inside space-y-2">
              <li><code>{"{variable AS LIST}"}</code> - Formats checkbox variables as bullet lists (default behavior)</li>
              <li><code>{"{variable AS INLINE_LIST}"}</code> - Formats checkbox variables as comma-separated inline text</li>
              <li>INLINE_LIST automatically lowercases items for natural sentence flow</li>
              <li>Uses Oxford commas (e.g., "sports, music, and technology")</li>
              <li>Perfect for inserting lists within question text or page content</li>
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
              <h3 className="text-2xl font-semibold">
                Conditional Logic (SHOW_IF)
              </h3>
              <p>Show or hide questions based on previous answers.</p>

              <div className="space-y-3">
                <h4 className="text-xl font-semibold">Usage</h4>
                <ul className="list-disc list-inside space-y-2">
                  <li>Use <code>SHOW_IF: condition</code> to conditionally hide/show questions</li>
                  <li>Place below a question or after question options to apply to that question</li>
                  <li>Can also be placed after blocks, pages, or individual question options</li>
                  <li>Supports operators: ==, !=, &gt;, &lt;, &gt;=, &lt;=, AND, OR, NOT</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-xl font-semibold">Example</h4>
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
              <h3 className="text-2xl font-semibold">Conditional Text</h3>
              <p>Display dynamic text based on variables and conditions.</p>

              <div className="space-y-3">
                <h4 className="text-xl font-semibold">Usage</h4>
                <ul className="list-disc list-inside space-y-2">
                  <li>Use <code>{"{IF condition THEN text ELSE text}"}</code> syntax for conditional text</li>
                  <li>Inserts conditional text within question text or page text</li>
                  <li>Dynamically changes question wording based on previous responses</li>
                  <li>ELSE part is optional</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-xl font-semibold">Example</h4>
                {renderExample(`Q: Are you a student?
- Yes
- No
VARIABLE: student

Q: {{IF student == Yes THEN What is your major? ELSE What is your occupation?}}
TEXT`)}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-semibold">STARTS_WITH Operator</h3>
              <p>Test multiple variables with a common prefix at once.</p>

              <div className="space-y-3">
                <h4 className="text-xl font-semibold">Usage</h4>
                <ul className="list-disc list-inside space-y-2">
                  <li>Use <code>STARTS_WITH prefix == value</code> to test multiple variables with a common prefix</li>
                  <li>Tests if ANY variable starting with the prefix meets the condition</li>
                  <li>Uses OR logic: true if at least one matching variable satisfies the condition</li>
                  <li>Example: <code>STARTS_WITH fraud == Yes</code> checks all variables starting with "fraud"</li>
                  <li>Useful for grouped questions with common variable naming patterns</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-xl font-semibold">Example</h4>
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
            <ul className="list-disc list-inside space-y-2">
              <li>Use <code>HINT: text</code> to add muted subtext below a question</li>
              <li>Place immediately after the question line; before question options</li>
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
            <ul className="list-disc list-inside space-y-2">
              <li>Use <code>TOOLTIP: text</code> to add a collapsible information icon</li>
              <li>Tooltip content is hidden by default and shown on click</li>
              <li>Place after HINT (if present); before question options</li>
              <li>Content on following lines gets appended to the tooltip text</li>
              <li>Supports Markdown formatting (bold, italic, links, etc.)</li>
              <li><strong>Note:</strong> Use <code>*</code> or numbered lists for bullets, not <code>-</code> (which starts options)</li>
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
            <ul className="list-disc list-inside space-y-2">
              <li>Adds text input to a specific question option</li>
              <li>Shows when the option is selected</li>
              <li>Use <code>- TEXT</code> or <code>- ESSAY</code> indented under an option</li>
              <li>Useful to allow respondents to elaborate on their selection</li>
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
            <ul className="list-disc list-inside space-y-2">
              <li>Use <code>RANGE: start-end</code> to generate numeric options (e.g., <code>RANGE: 1-10</code>)</li>
              <li>Generates numeric options from start to end (inclusive)</li>
              <li>Works with multiple choice, checkbox, and matrix questions</li>
              <li>Supports negative numbers (e.g., <code>RANGE: -5-5</code>)</li>
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
            <ul className="list-disc list-inside space-y-2">
              <li>All text supports Markdown formatting</li>
              <li>Use <code>**bold text**</code> for emphasis</li>
              <li>Use <code>*italic text*</code> for subtle emphasis</li>
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

    default:
      return null
  }
}
