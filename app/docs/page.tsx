"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { BASIC_SAMPLE_TEXT, INTERMEDIATE_SAMPLE_TEXT, ADVANCED_SAMPLE_TEXT } from "@/lib/constants"

type Section =
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
  | "conditional-text"
  | "conditions"
  | "starts-with"
  | "hints"
  | "tooltips"
  | "option-text"
  | "markdown"
  | "example-basic"
  | "example-intermediate"
  | "example-advanced"

const navMain = [
  {
    title: "Survey Structure",
    items: [
      { title: "Overview", section: "overview" as Section },
      { title: "Pages", section: "pages" as Section },
      { title: "Sections", section: "sections" as Section },
      { title: "Blocks", section: "blocks" as Section },
      { title: "Navigation", section: "navigation" as Section },
    ],
  },
  {
    title: "Question Types",
    items: [
      { title: "Questions", section: "basic-questions" as Section },
      { title: "Text Input", section: "text" as Section },
      { title: "Number", section: "number" as Section },
      { title: "Multiple Choice", section: "multiple-choice" as Section },
      { title: "Checkbox", section: "checkbox" as Section },
      { title: "Breakdown", section: "breakdown" as Section },
      { title: "Matrix", section: "matrix" as Section },
    ],
  },
  {
    title: "Dynamic Features",
    items: [
      { title: "Variables", section: "variables" as Section },
      { title: "Arithmetic", section: "arithmetic" as Section },
      { title: "Computed Variables", section: "computed" as Section },
      { title: "List Formatting", section: "list-formatting" as Section },
      { title: "Conditional Text", section: "conditional-text" as Section },
      { title: "Conditional Logic", section: "conditions" as Section },
      { title: "STARTS_WITH", section: "starts-with" as Section },
    ],
  },
  {
    title: "Customization",
    items: [
      { title: "Hints", section: "hints" as Section },
      { title: "Tooltips", section: "tooltips" as Section },
      { title: "Text on Options", section: "option-text" as Section },
      { title: "Markdown", section: "markdown" as Section },
    ],
  },
  {
    title: "Examples",
    items: [
      { title: "Basic Example", section: "example-basic" as Section },
      { title: "With Variables", section: "example-intermediate" as Section },
      { title: "Advanced Example", section: "example-advanced" as Section },
    ],
  },
]

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<Section>("overview")

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar>
        <SidebarContent>
          {navMain.map((item) => (
            <SidebarGroup key={item.title}>
              <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {item.items.map((subItem) => (
                    <SidebarMenuItem key={subItem.section}>
                      <SidebarMenuButton
                        isActive={activeSection === subItem.section}
                        onClick={() => setActiveSection(subItem.section)}
                      >
                        {subItem.title}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="max-w-4xl mx-auto w-full">
            <DocumentationContent activeSection={activeSection} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function DocumentationContent({ activeSection }: { activeSection: Section }) {
  const renderCodeBlock = (code: string) => (
    <div className="bg-muted p-4 rounded-lg">
      <pre className="text-sm font-mono whitespace-pre-wrap">{code}</pre>
    </div>
  )

  switch (activeSection) {
    case "overview":
      return (
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Text Format Guide</h1>
          <p className="text-lg text-muted-foreground">
            Learn how to create surveys using the TST text format. Select a topic from the sidebar to get started.
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
        </div>
      )

    case "number":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Number Input</h2>
          <p>Numeric input with validation.</p>
          {renderCodeBlock(`Q: How old are you?
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
        </div>
      )

    case "checkbox":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Checkbox</h2>
          <p>Multiple selection - choose multiple options.</p>
          {renderCodeBlock(`Q: Which languages do you speak?
CHECKBOX
- English
- Spanish
- French`)}
        </div>
      )

    case "breakdown":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Breakdown</h2>
          <p>Display options in a table with number inputs for each row.</p>
          {renderCodeBlock(`Q: Rate these features (1-10)
BREAKDOWN
- Feature A
- Feature B
- Feature C`)}
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

    case "conditional-text":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Conditional Text</h2>
          <p>Display dynamic text based on variables and conditions.</p>
          {renderCodeBlock(`Q: Are you a student?
- Yes
- No
VARIABLE: student

Q: {{IF student == Yes THEN What is your major? ELSE What is your occupation?}}
TEXT`)}
        </div>
      )

    case "conditions":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Conditional Logic (SHOW_IF)</h2>
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
      )

    case "starts-with":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">STARTS_WITH Operator</h2>
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

    case "example-basic":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Basic Survey Example</h2>
          {renderCodeBlock(BASIC_SAMPLE_TEXT)}
        </div>
      )

    case "example-intermediate":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Survey with Variables & Conditions</h2>
          {renderCodeBlock(INTERMEDIATE_SAMPLE_TEXT)}
        </div>
      )

    case "example-advanced":
      return (
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Advanced Survey with Blocks & Computed Variables</h2>
          {renderCodeBlock(ADVANCED_SAMPLE_TEXT)}
        </div>
      )

    default:
      return null
  }
}
