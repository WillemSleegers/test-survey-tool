"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { NavItem, Page } from "@/lib/types"
import { useLanguage } from "@/contexts/language-context"
import { useNavigation } from "@/contexts/navigation-context"

interface RespondentNavigatorProps {
  /** Navigation items with levels */
  navItems: NavItem[]
  /** Currently visible pages */
  visiblePages: Page[]
  /** Current visible page index */
  currentVisiblePageIndex: number
  /** Ids of pages the respondent has reached */
  visitedPages: Set<number>
  /** Function to jump to a specific nav item */
  onJumpToNavItem: (navItem: NavItem) => void
}

/** Manual expand/collapse choices, scoped to the page they were made on */
type ExpansionOverrides = {
  atPageIndex: number
  values: Map<number, boolean>
}

const NO_OVERRIDES: ExpansionOverrides = { atPageIndex: -1, values: new Map() }

/**
 * Respondent-friendly navigation sidebar
 *
 * Features:
 * - Level-based hierarchy (level 1 = top-level, level 2 = nested)
 * - Collapsible level 1 items that contain level 2 children
 * - Completion indicators (visited items)
 * - Current item highlighting
 * - Respects navigation visibility settings
 */
export function RespondentNavigator({
  navItems,
  visiblePages,
  currentVisiblePageIndex,
  visitedPages,
  onJumpToNavItem,
}: RespondentNavigatorProps) {
  const { t } = useLanguage()
  const { allowUnvisitedNavigation } = useNavigation()
  // Groups the respondent opened or closed by hand, remembered only until the
  // next navigation so moving pages re-expands whichever group is current
  const [expansionOverrides, setExpansionOverrides] = useState<ExpansionOverrides>(
    NO_OVERRIDES
  )

  // A nav item counts as visited once the respondent has reached any of its pages
  const isNavItemVisited = (navItem: NavItem): boolean =>
    navItem.pages.some((page) => visitedPages.has(page.id))

  // A nav item is visible if the respondent could currently reach at least
  // one of its pages (i.e. it isn't excluded by SHOW_IF given current answers)
  const visiblePageIds = new Set(visiblePages.map((page) => page.id))
  const isNavItemVisible = (navItem: NavItem): boolean =>
    navItem.pages.some((page) => visiblePageIds.has(page.id))

  // Group level-1 items with the level-2 items that follow them, keeping only
  // currently-visible items. A visible level-2 item whose level-1 parent is
  // hidden is promoted to a top-level entry so it isn't lost from the nav.
  const navGroups: { header: NavItem; children: NavItem[] }[] = []
  let activeGroup: { header: NavItem; children: NavItem[] } | null = null

  for (const item of navItems) {
    if (item.level === 1) {
      activeGroup = isNavItemVisible(item) ? { header: item, children: [] } : null
      if (activeGroup) navGroups.push(activeGroup)
      continue
    }

    if (!isNavItemVisible(item)) continue

    if (activeGroup) {
      activeGroup.children.push(item)
    } else {
      navGroups.push({ header: item, children: [] })
    }
  }

  const activeOverrides =
    expansionOverrides.atPageIndex === currentVisiblePageIndex
      ? expansionOverrides.values
      : NO_OVERRIDES.values

  // A group opens once the respondent reaches one of its children and stays
  // open afterwards, unless they closed it themselves
  const isGroupExpanded = (itemIndex: number): boolean => {
    const override = activeOverrides.get(itemIndex)
    if (override !== undefined) return override

    const group = navGroups[itemIndex]
    return group ? group.children.some(isNavItemVisited) : false
  }

  // Toggle item expansion
  const toggleItemExpansion = (itemIndex: number) => {
    const expanded = isGroupExpanded(itemIndex)
    setExpansionOverrides({
      atPageIndex: currentVisiblePageIndex,
      values: new Map(activeOverrides).set(itemIndex, !expanded),
    })
  }

  // Helper to check if a nav item is current
  const isNavItemCurrent = (navItem: NavItem): boolean => {
    const currentPage = visiblePages[currentVisiblePageIndex]
    if (!currentPage) return false

    // Compare by unique page ID
    return navItem.pages.some((page) => page.id === currentPage.id)
  }

  // Helper to check if a nav item can be clicked (visited or current, or if setting allows)
  const isNavItemClickable = (navItem: NavItem): boolean => {
    if (allowUnvisitedNavigation) return true
    return isNavItemVisited(navItem) || isNavItemCurrent(navItem)
  }

  // Clean markdown from titles
  const cleanTitle = (title: string): string => {
    return title
      .replace(/#+\s+/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .split("\n")[0]
      .trim()
  }

  return (
    <div className="w-64 shrink-0">
      <div className="sticky top-6 space-y-3">
        <div className="font-semibold">{t("navigation.contents")}</div>
        <Card className="py-3 shadow-xs">
          <CardContent className="px-4 py-0">
            {navGroups.map(({ header: item, children }, index) => {
              const isCurrent = isNavItemCurrent(item)
              const isVisited = isNavItemVisited(item)
              const itemHasChildren = children.length > 0
              const isExpanded = isGroupExpanded(index)

              // Check if any child is visited (for parent status)
              const anyChildVisited = children.some((child) =>
                isNavItemVisited(child)
              )
              const firstChild = children[0]
              const firstChildCurrent =
                firstChild && isNavItemCurrent(firstChild)

              // Check if item is clickable
              const isClickable = isNavItemClickable(item)

              return (
                <div key={index} className="space-y-0.5">
                  {/* Level 1 item */}
                  <div
                    className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-sm ${
                      isClickable
                        ? "cursor-pointer hover:bg-muted"
                        : "cursor-not-allowed opacity-50"
                    } ${
                      isCurrent || firstChildCurrent
                        ? "bg-muted font-semibold"
                        : isVisited || anyChildVisited
                        ? ""
                        : "text-muted-foreground"
                    }`}
                    onClick={() => {
                      if (!isClickable) return // Prevent navigation to unvisited items

                      // Navigate to the item
                      onJumpToNavItem(item)

                      // Auto-expand if it has children
                      if (itemHasChildren && !isExpanded) {
                        toggleItemExpansion(index)
                      }
                    }}
                  >
                    {/* Item title */}
                    <div className="flex-1 min-w-0">
                      <div className="wrap-break-word">
                        {item.name
                          ? cleanTitle(item.name)
                          : `Section ${index + 1}`}
                      </div>
                    </div>

                    {/* Chevron for expandable items */}
                    {itemHasChildren && (
                      <div
                        className="p-0.5 rounded hover:bg-accent shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleItemExpansion(index)
                        }}
                      >
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Level 2 children */}
                  {isExpanded && itemHasChildren && (
                    <div className="ml-4 space-y-0.5 border-l-2 border-muted pl-2">
                      {children.map((child, childIdx) => {
                        const isChildCurrent = isNavItemCurrent(child)
                        const isChildVisited = isNavItemVisited(child)
                        const isChildClickable = isNavItemClickable(child)

                        return (
                          <div
                            key={`${index}-${childIdx}`}
                            className={`flex items-center gap-2 py-1 px-1.5 rounded-lg text-sm ${
                              isChildClickable
                                ? "cursor-pointer hover:bg-muted"
                                : "cursor-not-allowed opacity-50"
                            } ${
                              isChildCurrent
                                ? "bg-muted font-semibold"
                                : isChildVisited
                                ? ""
                                : "text-muted-foreground"
                            }`}
                            onClick={() => {
                              if (!isChildClickable) return // Prevent navigation to unvisited items
                              onJumpToNavItem(child)
                            }}
                          >
                            {/* Child title */}
                            <div className="flex-1 min-w-0 wrap-break-word">
                              {child.name
                                ? cleanTitle(child.name)
                                : `Subsection ${childIdx + 1}`}
                            </div>
                          </div>
                        )
                      })}
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
