"use client"

import { useState } from "react"
import Link from "next/link"

import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { BASIC_SAMPLE_TEXT } from "@/lib/constants"
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
  | "variables"
  | "arithmetic"
  | "computed"
  | "list-formatting"
  | "conditionals"
  | "hints"
  | "tooltips"
  | "option-text"
  | "markdown"

function DocsPageContent({ activeSection, setActiveSection }: { activeSection: Section, setActiveSection: (section: Section) => void }) {
  const { isMobile } = useSidebar()

  return (
    <>
      <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          {isMobile && <SidebarTrigger className="-ml-1" />}
          <Link href="/">
            <Button variant="ghost" size="sm">
              Back
            </Button>
          </Link>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="max-w-4xl mx-auto w-full">
            <DocumentationContent activeSection={activeSection} />
          </div>
        </div>
      </SidebarInset>
    </>
  )
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<Section>("overview")

  return (
    <SidebarProvider defaultOpen={true}>
      <DocsPageContent activeSection={activeSection} setActiveSection={setActiveSection} />
    </SidebarProvider>
  )
}

function DocumentationContent({ activeSection }: { activeSection: Section }) {
  const renderCodeBlock = (code: string) => (
    <div className="bg-muted p-4 rounded-lg">
      <pre className="text-sm font-mono whitespace-pre-wrap">{code}</pre>
    </div>
  )

  const renderExample = (code: string) => {
    try {
      const parsed = parseQuestionnaire(code)
      return (
        <div className="border border-border rounded-lg p-4 bg-background">
          <div className="text-xs font-semibold text-muted-foreground mb-3">PREVIEW</div>
          <QuestionnaireViewer
            questionnaire={parsed.blocks}
            navItems={parsed.navItems}
            onResetToUpload={() => {}}
          />
        </div>
      )
    } catch (err) {
      return null
    }
  }

  switch (activeSection) {
    case "overview":
      return (
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Documentation</h1>
          <p className="text-lg text-muted-foreground">
            Learn how to create surveys using the TST text format.
          </p>

          <h2 className="text-2xl font-bold pt-4">Basic Example</h2>
          <p>Here's a simple survey to get you started:</p>
          {renderCodeBlock(BASIC_SAMPLE_TEXT)}

          <p className="text-muted-foreground">
            Select a topic from the sidebar to learn about specific features and capabilities.
          </p>
        </div>
      )

    case "pages":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Pages</h2>
          <p>Pages are the top-level containers in your survey. Each page is displayed separately with navigation controls.</p>
          {renderCodeBlock(`# Page Title
or
#

The first creates a titled page, the second an untitled page.`)}
        </div>
      )

    case "sections":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Sections</h2>
          <p>Sections organize questions within a page. They're optional but help structure longer pages.</p>
          {renderCodeBlock(`## Section Title

Sections create visual groupings of related questions.`)}
        </div>
      )

    case "blocks":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Blocks</h2>
          <p>Group multiple pages together for conditional logic.</p>
          {renderCodeBlock(`BLOCK: Demographics
SHOW_IF: participate == Yes

# Age
Q: How old are you?
NUMBER

# Location
Q: Where do you live?
TEXT`)}
          <ul className="list-disc list-inside space-y-2">
            <li>Groups multiple pages together</li>
            <li>All pages until the next BLOCK belong to this block</li>
            <li>Can be used with SHOW_IF to hide/show multiple pages at once</li>
          </ul>
        </div>
      )

    case "navigation":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Navigation</h2>
          <p>Create navigation items in the survey sidebar for easier navigation.</p>
          {renderCodeBlock(`NAV: Introduction
# Welcome

NAV: Demographics
LEVEL: 2
# Basic Info

NAV: Contact
LEVEL: 2
# Contact Details`)}
          <ul className="list-disc list-inside space-y-2">
            <li>Creates a navigation item in the survey sidebar</li>
            <li>All pages until the next NAV belong to this item</li>
            <li>Use LEVEL: 1 or LEVEL: 2 to create nested navigation</li>
          </ul>
        </div>
      )

    case "basic-questions":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Questions</h2>
          <p>Questions are the core of your survey.</p>
          {renderCodeBlock(`Q: What is your name?
or
Q1: What is your name?

Both formats work. Use numbers when you want to reference questions explicitly.`)}
        </div>
      )

    case "text":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Text Input</h2>
          <p>Single-line text input (TEXT) or multi-line text area (ESSAY).</p>
          {renderCodeBlock(`Q: What is your name?
TEXT

Q: Tell us about yourself
ESSAY`)}
          {renderExample(`#
Q: What is your name?
TEXT

Q: Tell us about yourself
ESSAY`)}
        </div>
      )

    case "number":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Number Input</h2>
          <p>Numeric input with validation.</p>
          {renderCodeBlock(`Q: How old are you?
NUMBER`)}
          {renderExample(`#
Q: How old are you?
NUMBER`)}
        </div>
      )

    case "multiple-choice":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Multiple Choice</h2>
          <p>Radio button selection - choose one option.</p>
          {renderCodeBlock(`Q: What is your favorite color?
- Red
- Blue
- Green`)}
          {renderExample(`#
Q: What is your favorite color?
- Red
- Blue
- Green`)}
        </div>
      )

    case "checkbox":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Checkbox</h2>
          <p>Multiple selection - choose multiple options.</p>
          {renderCodeBlock(`Q: Which languages do you speak?
- English
- Spanish
- French
CHECKBOX`)}
          {renderExample(`#
Q: Which languages do you speak?
- English
- Spanish
- French
CHECKBOX`)}
        </div>
      )

    case "breakdown":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Breakdown</h2>
          <p>Display options in a table with number inputs for each row.</p>
          {renderCodeBlock(`Q: Rate these features (1-10)
- Feature A
- Feature B
- Feature C
BREAKDOWN`)}
          {renderExample(`#
Q: Rate these features (1-10)
- Feature A
- Feature B
- Feature C
BREAKDOWN`)}
        </div>
      )

    case "matrix":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Matrix</h2>
          <p>Table layout with rows and columns where each cell is a radio button.</p>
          {renderCodeBlock(`Q: Rate the following
- Q: Product quality
- Q: Customer service
- Poor
- Fair
- Good
- Excellent`)}
          {renderExample(`#
Q: Rate the following
- Q: Product quality
- Q: Customer service
- Poor
- Fair
- Good
- Excellent`)}
        </div>
      )

    case "variables":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Variables</h2>
          <p>Assign variable names to questions to reference their answers later.</p>
          {renderCodeBlock(`Q: What is your name?
TEXT
VARIABLE: name

# Welcome
Hello {name}!`)}
        </div>
      )

    case "arithmetic":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Arithmetic Expressions</h2>
          <p>Perform calculations using variables.</p>
          {renderCodeBlock(`Q: How many apples?
NUMBER
VARIABLE: apples

Q: How many oranges?
NUMBER
VARIABLE: oranges

# Summary
You have {apples + oranges} fruits total.`)}
        </div>
      )

    case "computed":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Computed Variables</h2>
          <p>Create calculated variables based on other answers.</p>
          {renderCodeBlock(`BLOCK: Budget
COMPUTE: total = rent + food + transport

# Monthly Expenses
Q: Monthly rent
NUMBER
VARIABLE: rent

# Summary
Total: {total}`)}
        </div>
      )

    case "list-formatting":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">List Formatting</h2>
          <p>Format checkbox variables as bullet lists or inline text.</p>
          {renderCodeBlock(`Q: Select interests
CHECKBOX
- Sports
- Music
- Technology
VARIABLE: interests

# Summary
Your interests: {interests AS LIST}
You selected {interests AS INLINE_LIST}.`)}
        </div>
      )

    case "conditionals":
      return (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Conditionals</h2>
          <p>Control what content appears based on user responses.</p>

          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">Conditional Logic (SHOW_IF)</h3>
            <p>Show or hide questions based on previous answers.</p>
            {renderCodeBlock(`Q: Do you have pets?
- Yes
- No
VARIABLE: has_pets

Q: What kind of pet?
SHOW_IF: has_pets == Yes
- Dog
- Cat
- Other`)}
            <p className="text-sm text-muted-foreground">
              Supports operators: ==, !=, &gt;, &lt;, &gt;=, &lt;=, AND, OR, NOT
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">Conditional Text</h3>
            <p>Display dynamic text based on variables and conditions.</p>
            {renderCodeBlock(`Q: Are you a student?
- Yes
- No
VARIABLE: student

Q: {{IF student == Yes THEN What is your major? ELSE What is your occupation?}}
TEXT`)}
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">STARTS_WITH Operator</h3>
            <p>Test multiple variables with a common prefix at once.</p>
            {renderCodeBlock(`Q: Did you witness fraud?
- Yes
- No
VARIABLE: fraud_witnessed

Q: Did you witness theft?
- Yes
- No
VARIABLE: fraud_theft

# Follow-up
SHOW_IF: STARTS_WITH fraud == Yes

Q: Provide details
ESSAY`)}
          </div>
        </div>
      )

    case "hints":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Hints</h2>
          <p>Add helpful subtext to questions for additional context.</p>
          {renderCodeBlock(`Q: Enter your email
HINT: We'll never share your email
TEXT`)}
        </div>
      )

    case "tooltips":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Tooltips</h2>
          <p>Add collapsible information icons next to questions.</p>
          {renderCodeBlock(`Q: What is your income?
TOOLTIP: This information is confidential
* All responses are anonymized
* Data is encrypted
NUMBER`)}
        </div>
      )

    case "option-text":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Text Inputs on Options</h2>
          <p>Add text input to specific options.</p>
          {renderCodeBlock(`Q: What is your favorite hobby?
- Sports
- Reading
- Other
  - TEXT`)}
          {renderExample(`#
Q: What is your favorite hobby?
- Sports
- Reading
- Other
  - TEXT`)}
        </div>
      )

    case "markdown":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Markdown Formatting</h2>
          <p>All text supports Markdown formatting.</p>
          {renderCodeBlock(`## Instructions
Please answer **honestly** and *thoughtfully*.

Q: Do you agree with the **terms**?
- Yes
- No`)}
        </div>
      )

    default:
      return null
  }
}
