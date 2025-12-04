"use client"

import { useState, useEffect } from "react"
import { ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { NavItem, Page } from "@/lib/types"
import { useLanguage } from "@/contexts/language-context"

interface RespondentNavigatorProps {
  /** Navigation items with levels */
  navItems: NavItem[]
  /** Currently visible pages */
  visiblePages: Page[]
  /** Current visible page index */
  currentVisiblePageIndex: number
  /** Function to jump to a specific nav item */
  onJumpToNavItem: (navItem: NavItem) => void
}

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
  onJumpToNavItem,
}: RespondentNavigatorProps) {
  const { t } = useLanguage()
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const [visitedNavItems, setVisitedNavItems] = useState<Set<NavItem>>(
    new Set()
  )

  // Track visited nav items
  useEffect(() => {
    const currentPage = visiblePages[currentVisiblePageIndex]
    if (!currentPage) return

    // Find which nav item contains the current page
    const currentNavItem = navItems.find((item) =>
      item.pages.some((page) => page === currentPage)
    )

    if (currentNavItem) {
      setVisitedNavItems((prev) => {
        if (prev.has(currentNavItem)) {
          return prev
        }
        const newSet = new Set(prev)
        newSet.add(currentNavItem)
        return newSet
      })
    }
  }, [currentVisiblePageIndex, visiblePages, navItems])

  // Auto-expand the current level 1 item (if current page is in a level 2 item)
  useEffect(() => {
    const currentPage = visiblePages[currentVisiblePageIndex]
    if (!currentPage) return

    // Find current nav item
    const currentItemIndex = navItems.findIndex((item) =>
      item.pages.some((page) => page === currentPage)
    )

    if (currentItemIndex === -1) return

    const currentItem = navItems[currentItemIndex]

    // If it's a level 2 item, find and expand its parent level 1
    if (currentItem.level === 2) {
      // Find the nearest preceding level 1 item
      for (let i = currentItemIndex - 1; i >= 0; i--) {
        if (navItems[i].level === 1) {
          setExpandedItems((prev) => new Set([...prev, i]))
          break
        }
      }
    }
  }, [currentVisiblePageIndex, visiblePages, navItems])

  // Toggle item expansion
  const toggleItemExpansion = (itemIndex: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemIndex)) {
      newExpanded.delete(itemIndex)
    } else {
      newExpanded.add(itemIndex)
    }
    setExpandedItems(newExpanded)
  }

  // Helper to check if a nav item is current
  const isNavItemCurrent = (navItem: NavItem): boolean => {
    const currentPage = visiblePages[currentVisiblePageIndex]
    if (!currentPage) return false
    return navItem.pages.some((page) => page === currentPage)
  }

  // Helper to check if a nav item can be clicked (visited or current)
  const isNavItemClickable = (navItem: NavItem): boolean => {
    return visitedNavItems.has(navItem) || isNavItemCurrent(navItem)
  }

  // Helper to check if a level 1 item has level 2 children
  const hasChildren = (itemIndex: number): boolean => {
    const item = navItems[itemIndex]
    if (item.level !== 1) return false

    // Check if the next item exists and is level 2
    return (
      itemIndex + 1 < navItems.length && navItems[itemIndex + 1].level === 2
    )
  }

  // Helper to get children of a level 1 item
  const getChildren = (itemIndex: number): NavItem[] => {
    const item = navItems[itemIndex]
    if (item.level !== 1) return []

    const children: NavItem[] = []
    for (let i = itemIndex + 1; i < navItems.length; i++) {
      if (navItems[i].level === 1) break // Stop at next level 1
      if (navItems[i].level === 2) {
        children.push(navItems[i])
      }
    }
    return children
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

  // Build navigation structure (filtering out level 2 items, they'll be rendered as children)
  const topLevelItems = navItems
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.level === 1)

  return (
    <div className="w-64 flex-shrink-0">
      <div className="sticky top-6 space-y-3">
        <div className="font-semibold">{t("navigation.contents")}</div>
        <Card className="py-3">
          <CardContent className="px-4 ">
            {topLevelItems.map(({ item, index }) => {
              const isCurrent = isNavItemCurrent(item)
              const isVisited = visitedNavItems.has(item)
              const itemHasChildren = hasChildren(index)
              const isExpanded = expandedItems.has(index)
              const children = itemHasChildren ? getChildren(index) : []

              // Check if any child is visited (for parent status)
              const anyChildVisited = children.some((child) =>
                visitedNavItems.has(child)
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
                    className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-sm transition-all ${
                      isClickable
                        ? "cursor-pointer hover:bg-muted"
                        : "cursor-not-allowed opacity-50"
                    } ${
                      isCurrent || firstChildCurrent
                        ? "font-bold"
                        : isVisited || anyChildVisited
                        ? ""
                        : "text-muted-foreground"
                    }`}
                    onClick={() => {
                      if (!isClickable) return // Prevent navigation to unvisited items

                      if (itemHasChildren) {
                        // If has children, only toggle expansion
                        toggleItemExpansion(index)
                      } else {
                        // If no children, navigate to item
                        onJumpToNavItem(item)
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
                      <ChevronRight
                        className={`w-4 h-4 flex-shrink-0 transition-transform ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      />
                    )}
                  </div>

                  {/* Level 2 children */}
                  {isExpanded && itemHasChildren && (
                    <div className="ml-4 space-y-0.5 border-l-2 border-muted pl-2">
                      {children.map((child, childIdx) => {
                        const isChildCurrent = isNavItemCurrent(child)
                        const isChildVisited = visitedNavItems.has(child)
                        const isChildClickable = isNavItemClickable(child)

                        return (
                          <div
                            key={`${index}-${childIdx}`}
                            className={`flex items-center gap-2 py-1 px-1.5 rounded text-sm transition-all ${
                              isChildClickable
                                ? "cursor-pointer hover:bg-muted"
                                : "cursor-not-allowed opacity-50"
                            } ${
                              isChildCurrent
                                ? "font-bold"
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
