"use client"

import { ChevronRight } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
      { title: "Text on Options", section: "option-text" as Section },
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
  return (
    <Sidebar className="border-none">
      <SidebarHeader className="border-none">
        <div className="px-2 py-1">
          <h2 className="text-lg font-semibold">Documentation</h2>
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0 overflow-x-hidden">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeSection === "overview"}
                  onClick={() => onSectionChange("overview")}
                >
                  <span>Overview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {navMain.map((group) => (
          <Collapsible key={group.title} defaultOpen className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel
                asChild
                className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
              >
                <CollapsibleTrigger>
                  {group.title}{" "}
                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.section}>
                        <SidebarMenuButton
                          isActive={activeSection === item.section}
                          onClick={() => onSectionChange(item.section)}
                        >
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}
