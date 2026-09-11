"use client"

import { useState, useEffect, useSyncExternalStore } from "react"
import { Menu, X, ChevronDown, ChevronRight, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Block, Page, Variables, ComputedValues } from "@/lib/types"

interface PageNavigatorProps {
  /** All questionnaire blocks */
  questionnaire: Block[]
  /** All pages flattened from blocks */
  allPages: Page[]
  /** Pages from blocks that passed block-level visibility (before page-level filtering) */
  visibleBlockPages: Page[]
  /** Currently visible pages */
  visiblePages: Page[]
  /** Current visible page index */
  currentVisiblePageIndex: number
  /** Current user variables */
  variables: Variables
  /** Computed variables visible on the current page (global block-level + current page) */
  currentComputedVars: ComputedValues
  /** Function to jump to a specific page */
  onJumpToPage: (pageIndex: number) => void
  /** Function to reset back to upload page */
  onResetToUpload: () => void
}

/** Manual expand/collapse choices, scoped to the page they were made on */
type ExpansionOverrides = {
  atPageIndex: number
  values: Map<number, boolean>
}

const NO_OVERRIDES: ExpansionOverrides = { atPageIndex: -1, values: new Map() }

/**
 * Platform detection for the keyboard-shortcut hint, read on the client only
 * so the server and the first client render agree
 */
const subscribeToNothing = () => () => {}

function useIsMac(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => navigator.userAgent?.includes("Mac") ?? false,
    () => false
  )
}

/**
 * Minimal page navigator for researchers
 *
 * Features:
 * - Nearly invisible toggle button that only shows on hover
 * - Collapsible panel with page overview
 * - Quick jump to any visible page
 * - Shows page visibility status and conditions
 * - Includes debug information (responses, computed variables)
 */
export function PageNavigator({
  questionnaire,
  allPages,
  visibleBlockPages,
  visiblePages,
  currentVisiblePageIndex,
  variables,
  currentComputedVars,
  onJumpToPage,
  onResetToUpload,
}: PageNavigatorProps) {
  const [isOpen, setIsOpen] = useState(false)
  // Blocks the researcher opened or closed by hand, remembered only until the
  // next navigation so moving pages re-expands whichever block is current
  const [expansionOverrides, setExpansionOverrides] = useState<ExpansionOverrides>(
    NO_OVERRIDES
  )
  const isMac = useIsMac()

  // Only the block containing the current page is expanded by default
  const currentPage = visiblePages[currentVisiblePageIndex]
  const currentBlockIndex = currentPage
    ? questionnaire.findLastIndex((block) => block.pages.includes(currentPage))
    : -1

  const activeOverrides =
    expansionOverrides.atPageIndex === currentVisiblePageIndex
      ? expansionOverrides.values
      : NO_OVERRIDES.values

  const isBlockExpanded = (blockIndex: number): boolean =>
    activeOverrides.get(blockIndex) ?? blockIndex === currentBlockIndex

  const isBlockVisible = (block: Block): boolean =>
    block.pages.some(p => visibleBlockPages.includes(p))

  // Toggle block expansion
  const toggleBlockExpansion = (blockIndex: number) => {
    const expanded = isBlockExpanded(blockIndex)
    setExpansionOverrides({
      atPageIndex: currentVisiblePageIndex,
      values: new Map(activeOverrides).set(blockIndex, !expanded),
    })
  }

  // Helper function to clean markdown from titles for navigation display
  const cleanTitle = (title: string): string => {
    return title
      .replace(/#+\s+/g, "") // Remove headers: ### Text -> Text
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold: **text** -> text
      .replace(/\*(.*?)\*/g, "$1") // Remove italic: *text* -> text
      .replace(/`(.*?)`/g, "$1") // Remove inline code: `code` -> code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links: [text](url) -> text
      .replace(/^\s*[-*+]\s+/gm, "") // Remove list markers: - item -> item
      .replace(/^\s*\d+\.\s+/gm, "") // Remove numbered lists: 1. item -> item
      .split("\n")[0] // Take only first line
      .trim()
  }

  // Close navigator on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }

    // Toggle navigator with Ctrl+/ (or Cmd+/ on Mac)
    const handleToggle = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault()
        setIsOpen(!isOpen)
      }
    }

    document.addEventListener("keydown", handleEscape)
    document.addEventListener("keydown", handleToggle)
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.removeEventListener("keydown", handleToggle)
    }
  }, [isOpen])

  return (
    <>
      {/* Nearly invisible toggle button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-40 w-8 h-8 p-0 opacity-20 hover:opacity-100 focus:opacity-100 transition-opacity duration-200"
        title={`Page Navigator (${isMac ? "Cmd" : "Ctrl"}+/)`}
      >
        <Menu className="w-4 h-4" />
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navigator Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-background border-l shadow-lg z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Page Navigator</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Blocks and Pages List */}
            <div>
              <h3 className="font-medium mb-3">
                Pages ({visiblePages.length}/{allPages.length} visible)
              </h3>
              <div className="space-y-1">
                {questionnaire.map((block, blockIndex) => {
                  const blockVisible = isBlockVisible(block)
                  const isExpanded = isBlockExpanded(blockIndex)

                  return (
                    <div key={blockIndex} className="space-y-1">
                      {/* Block header */}
                      {block.name && (
                        <div
                          className={`flex items-center gap-2 p-2 rounded text-sm transition-all cursor-pointer ${
                            blockVisible
                              ? "bg-primary/5 hover:bg-primary/10"
                              : "opacity-50 bg-muted/50"
                          }`}
                          onClick={() => toggleBlockExpansion(blockIndex)}
                        >
                          {/* Expand/collapse icon */}
                          <div className="w-4 h-4 shrink-0">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </div>

                          {/* Block info */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium wrap-break-word">
                              {cleanTitle(block.name)}
                            </div>
                            {block.showIf && (
                              <div className="text-xs text-muted-foreground wrap-break-word">
                                SHOW_IF: {block.showIf}
                              </div>
                            )}
                            {block.computedVariables.length > 0 && (
                              <div className="text-xs text-primary/70">
                                {block.computedVariables.length} computed
                                variable(s)
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Pages within block */}
                      {(isExpanded || !block.name) &&
                        block.pages.map((page, pageIndex) => {
                          // Skip expensive computation during render for non-visible pages
                          // Just check if page is in visible pages list
                          const pageVisible = visiblePages.includes(page)

                          // Find the visible page index for this page
                          const visibleIndex = visiblePages.findIndex(
                            (p) => p === page
                          )
                          const isCurrent =
                            visibleIndex === currentVisiblePageIndex

                          // Calculate global page index
                          const globalPageIndex =
                            questionnaire
                              .slice(0, blockIndex)
                              .reduce((acc, b) => acc + b.pages.length, 0) +
                            pageIndex

                          return (
                            <div
                              key={`${blockIndex}-${pageIndex}`}
                              className={`flex items-center gap-2 p-2 rounded text-sm transition-all ${
                                isCurrent
                                  ? "bg-muted font-medium"
                                  : pageVisible && blockVisible
                                  ? "hover:bg-muted cursor-pointer"
                                  : "opacity-50"
                              }`}
                              onClick={
                                pageVisible &&
                                blockVisible &&
                                visibleIndex !== -1
                                  ? () => onJumpToPage(visibleIndex)
                                  : undefined
                              }
                            >
                              {/* Current page indicator */}
                              <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                                {isCurrent && (
                                  <Circle className="w-3 h-3 fill-primary text-primary" />
                                )}
                              </div>

                              {/* Page info */}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium wrap-break-word">
                                  {page.title
                                    ? `Page ${
                                        globalPageIndex + 1
                                      }: ${cleanTitle(page.title)}`
                                    : `Page ${globalPageIndex + 1}`}
                                </div>
                                {page.showIf && (
                                  <div className="text-xs text-muted-foreground wrap-break-word">
                                    SHOW_IF: {page.showIf}
                                  </div>
                                )}
                                {page.computedVariables.length > 0 && (
                                  <div className="text-xs text-primary/70">
                                    {page.computedVariables.length} computed
                                    variable(s)
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Current Variables */}
            {Object.keys(variables).length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Current Variables</h3>
                <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                  <pre>{JSON.stringify(variables, null, 2)}</pre>
                </div>
              </div>
            )}

            {/* Computed Variables */}
            {Object.keys(currentComputedVars).length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Computed Variables</h3>
                <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                  <pre>{JSON.stringify(currentComputedVars, null, 2)}</pre>
                </div>
              </div>
            )}

            {/* Keyboard Shortcuts */}
            <div>
              <h3 className="font-medium mb-3">Shortcuts</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>
                  <kbd className="px-1 py-0.5 bg-muted rounded">
                    {isMac ? "Cmd" : "Ctrl"} + /
                  </kbd>
                  : Toggle navigator
                </div>
                <div>
                  <kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd>: Close
                  navigator
                </div>
              </div>
            </div>

            {/* New Survey Button */}
            <div>
              <Button
                onClick={() => {
                  onResetToUpload()
                  setIsOpen(false)
                }}
                variant="outline"
                className="w-full"
              >
                Exit survey
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
