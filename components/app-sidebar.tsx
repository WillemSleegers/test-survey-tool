"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const navMain = [
  {
    title: "Survey Structure",
    items: [
      { title: "Pages", section: "pages" },
      { title: "Sections", section: "sections" },
      { title: "Blocks", section: "blocks" },
      { title: "Navigation", section: "navigation" },
    ],
  },
  {
    title: "Question Types",
    items: [
      { title: "Questions", section: "basic-questions" },
      { title: "Text Input", section: "text" },
      { title: "Number", section: "number" },
      { title: "Multiple Choice", section: "multiple-choice" },
      { title: "Checkbox", section: "checkbox" },
      { title: "Matrix", section: "matrix" },
      { title: "Breakdown", section: "breakdown" },
    ],
  },
  {
    title: "Question Options",
    items: [
      { title: "Text on Options", section: "option-text" },
      { title: "Numeric Ranges", section: "numeric-ranges" },
    ],
  },
  {
    title: "Dynamic Features",
    items: [
      { title: "Variables", section: "variables" },
      { title: "Arithmetic", section: "arithmetic" },
      { title: "Computed Variables", section: "computed" },
      { title: "List Formatting", section: "list-formatting" },
      { title: "Conditionals", section: "conditionals" },
    ],
  },
  {
    title: "Customization",
    items: [
      { title: "Hints", section: "hints" },
      { title: "Tooltips", section: "tooltips" },
      { title: "Markdown", section: "markdown" },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const activeSection = pathname.split("/").pop() || "overview"

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
            <Link
              href="/docs/overview"
              className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-sm hover:bg-muted ${
                activeSection === "overview" ? "bg-muted font-semibold" : "font-medium"
              }`}
            >
              Overview
            </Link>

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
                        <Link
                          key={item.section}
                          href={`/docs/${item.section}`}
                          className={`flex items-center gap-2 py-1 px-1.5 rounded text-sm hover:bg-muted ${
                            activeSection === item.section
                              ? "bg-muted font-semibold"
                              : ""
                          }`}
                        >
                          {item.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            <Link
              href="/docs/page-navigator"
              className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-sm hover:bg-muted mt-2 ${
                activeSection === "page-navigator" ? "bg-muted font-semibold" : "font-medium"
              }`}
            >
              Page Navigator
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
