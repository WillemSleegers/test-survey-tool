"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { Section } from "@/app/docs/page"

const navMain = [
  {
    title: "Survey Structure",
    items: [
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
    title: "Question Options",
    items: [
      { title: "Text on Options", section: "option-text" as Section },
      { title: "Numeric Ranges", section: "numeric-ranges" as Section },
    ],
  },
  {
    title: "Dynamic Features",
    items: [
      { title: "Variables", section: "variables" as Section },
      { title: "Arithmetic", section: "arithmetic" as Section },
      { title: "Computed Variables", section: "computed" as Section },
      { title: "List Formatting", section: "list-formatting" as Section },
      { title: "Conditionals", section: "conditionals" as Section },
    ],
  },
  {
    title: "Customization",
    items: [
      { title: "Hints", section: "hints" as Section },
      { title: "Tooltips", section: "tooltips" as Section },
      { title: "Markdown", section: "markdown" as Section },
    ],
  },
]

export function AppSidebar({
  activeSection,
  onSectionChange,
}: {
  activeSection: Section
  onSectionChange: (section: Section) => void
}) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(navMain.map((g) => g.title))
  )

  const toggleGroup = (title: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(title)) {
      newExpanded.delete(title)
    } else {
      newExpanded.add(title)
    }
    setExpandedGroups(newExpanded)
  }

  return (
    <div className="w-64 shrink-0">
      <div className="sticky top-6">
        <Card className="py-3 shadow-xs">
          <CardContent className="px-4 py-0">
            <div
              className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-sm cursor-pointer hover:bg-muted ${
                activeSection === "overview" ? "bg-muted font-semibold" : "font-medium"
              }`}
              onClick={() => onSectionChange("overview")}
            >
              Overview
            </div>

            {navMain.map((group) => {
              const isExpanded = expandedGroups.has(group.title)

              return (
                <div key={group.title} className="space-y-0.5 mt-2">
                  <div
                    className="flex items-center gap-2 py-1.5 px-2 rounded-lg text-sm cursor-pointer hover:bg-muted font-medium"
                    onClick={() => toggleGroup(group.title)}
                  >
                    <div className="flex-1">{group.title}</div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </div>

                  {isExpanded && (
                    <div className="ml-4 space-y-0.5 pl-2">
                      {group.items.map((item) => (
                        <div
                          key={item.section}
                          className={`flex items-center gap-2 py-1 px-1.5 rounded text-sm cursor-pointer hover:bg-muted ${
                            activeSection === item.section
                              ? "bg-muted font-semibold"
                              : ""
                          }`}
                          onClick={() => onSectionChange(item.section)}
                        >
                          {item.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
