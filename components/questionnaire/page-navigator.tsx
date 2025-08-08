"use client"

import { useState, useEffect } from "react"
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { evaluateCondition } from "@/lib/conditions/condition-evaluator"
import { evaluateComputedVariables } from "@/lib/conditions/computed-variables"
import { Block, Page, Responses, ComputedVariables } from "@/lib/types"

interface PageNavigatorProps {
  /** All questionnaire blocks */
  questionnaire: Block[]
  /** All pages flattened from blocks */
  allPages: Page[]
  /** Currently visible pages */
  visiblePages: Page[]
  /** Current visible page index */
  currentVisiblePageIndex: number
  /** Current user responses */
  responses: Responses
  /** Function to get computed variables for a page */
  getComputedVariables: (page: Page) => ComputedVariables
  /** Current block's computed variables */
  currentBlockComputedVars: ComputedVariables
  /** Current page's computed variables (page-level only) */
  currentPageComputedVars: ComputedVariables
  /** Function to jump to a specific page */
  onJumpToPage: (pageIndex: number) => void
  /** Function to reset back to upload page */
  onResetToUpload: () => void
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
  visiblePages,
  currentVisiblePageIndex,
  responses,
  getComputedVariables,
  currentBlockComputedVars,
  currentPageComputedVars,
  onJumpToPage,
  onResetToUpload,
}: PageNavigatorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedBlocks, setExpandedBlocks] = useState<Set<number>>(new Set())

  // Auto-expand blocks containing the current page
  useEffect(() => {
    const currentPage = visiblePages[currentVisiblePageIndex]
    if (!currentPage) return

    // Find which block contains the current page
    questionnaire.forEach((block, blockIndex) => {
      if (block.pages.includes(currentPage)) {
        setExpandedBlocks(prev => new Set([...prev, blockIndex]))
      }
    })
  }, [currentVisiblePageIndex, visiblePages, questionnaire])

  // Helper function to check if a block is visible
  const isBlockVisible = (block: Block): boolean => {
    if (!block.showIf) return true
    
    // Create a mock page with block's computed variables to evaluate block visibility
    const mockPage: Page = {
      title: "",
      content: "",
      questions: [],
      sections: [],
      computedVariables: block.computedVariables
    }
    const blockComputedVars = evaluateComputedVariables(mockPage, responses)
    
    return evaluateCondition(block.showIf, responses, blockComputedVars)
  }

  // Toggle block expansion
  const toggleBlockExpansion = (blockIndex: number) => {
    const newExpanded = new Set(expandedBlocks)
    if (newExpanded.has(blockIndex)) {
      newExpanded.delete(blockIndex)
    } else {
      newExpanded.add(blockIndex)
    }
    setExpandedBlocks(newExpanded)
  }

  // Helper function to clean markdown from titles for navigation display
  const cleanTitle = (title: string): string => {
    return title
      .replace(/#+\s+/g, '') // Remove headers: ### Text -> Text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold: **text** -> text
      .replace(/\*(.*?)\*/g, '$1') // Remove italic: *text* -> text
      .replace(/`(.*?)`/g, '$1') // Remove inline code: `code` -> code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links: [text](url) -> text
      .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers: - item -> item
      .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered lists: 1. item -> item
      .split('\n')[0] // Take only first line
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
        title={`Page Navigator (${
          typeof navigator !== "undefined" &&
          navigator.userAgent?.includes("Mac")
            ? "Cmd"
            : "Ctrl"
        }+/)`}
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
                  const isExpanded = expandedBlocks.has(blockIndex)

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
                          <div className="w-4 h-4 flex-shrink-0">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </div>


                          {/* Block info */}
                          <div className="flex-1 min-w-0">
                            <div className="truncate font-medium">
                              BLOCK: {cleanTitle(block.name)}
                            </div>
                            {block.showIf && (
                              <div className="text-xs text-muted-foreground truncate">
                                SHOW_IF: {block.showIf}
                              </div>
                            )}
                            {block.computedVariables.length > 0 && (
                              <div className="text-xs text-primary/70">
                                {block.computedVariables.length} computed variable(s)
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Pages within block */}
                      {(isExpanded || !block.name) && block.pages.map((page, pageIndex) => {
                        const pageVisible = evaluateCondition(
                          page.showIf || "",
                          responses,
                          getComputedVariables(page)
                        )

                        // Find the visible page index for this page
                        const visibleIndex = visiblePages.findIndex(
                          (p) => p === page
                        )
                        const isCurrent = visibleIndex === currentVisiblePageIndex

                        // Calculate global page index
                        const globalPageIndex = questionnaire
                          .slice(0, blockIndex)
                          .reduce((acc, b) => acc + b.pages.length, 0) + pageIndex

                        return (
                          <div
                            key={`${blockIndex}-${pageIndex}`}
                            className={`flex items-center gap-2 p-2 rounded text-sm transition-all ${
                              block.name ? "ml-6" : ""
                            } ${
                              isCurrent
                                ? "bg-muted font-medium"
                                : pageVisible && blockVisible
                                ? "hover:bg-muted cursor-pointer"
                                : "opacity-50"
                            }`}
                            onClick={
                              pageVisible && blockVisible && visibleIndex !== -1
                                ? () => onJumpToPage(visibleIndex)
                                : undefined
                            }
                          >
                            {/* Page info */}
                            <div className="flex-1 min-w-0">
                              <div className="truncate font-medium">
                                {page.title ? cleanTitle(page.title) : `Page ${globalPageIndex + 1}`}
                              </div>
                              {page.showIf && (
                                <div className="text-xs text-muted-foreground truncate">
                                  SHOW_IF: {page.showIf}
                                </div>
                              )}
                              {page.computedVariables.length > 0 && (
                                <div className="text-xs text-primary/70">
                                  {page.computedVariables.length} computed variable(s)
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

            {/* Current Responses */}
            {Object.keys(responses).length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Current Responses</h3>
                <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                  <pre>{JSON.stringify(responses, null, 2)}</pre>
                </div>
              </div>
            )}

            {/* Computed Variables */}
            {(Object.keys(currentBlockComputedVars).length > 0 || Object.keys(currentPageComputedVars).length > 0) && (
              <div>
                <h3 className="text-sm font-medium mb-3">Computed Variables</h3>
                
                {/* Block-level variables */}
                {Object.keys(currentBlockComputedVars).length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-medium mb-2 text-muted-foreground">Current Block</h4>
                    <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                      <pre>{JSON.stringify(currentBlockComputedVars, null, 2)}</pre>
                    </div>
                  </div>
                )}
                
                {/* Page-level variables */}
                {Object.keys(currentPageComputedVars).length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium mb-2 text-muted-foreground">Current Page</h4>
                    <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                      <pre>{JSON.stringify(currentPageComputedVars, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Keyboard Shortcuts */}
            <div>
              <h3 className="font-medium mb-3">Shortcuts</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>
                  <kbd className="px-1 py-0.5 bg-muted rounded">
                    {typeof navigator !== "undefined" &&
                    navigator.userAgent?.includes("Mac")
                      ? "Cmd"
                      : "Ctrl"}{" "}
                    + /
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
