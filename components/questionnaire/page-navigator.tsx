"use client"

import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { evaluateCondition } from "@/lib/conditions/condition-evaluator"
import { Page, Responses, ComputedVariables } from "@/lib/types"

interface PageNavigatorProps {
  /** All questionnaire pages */
  questionnaire: Page[]
  /** Currently visible pages */
  visiblePages: Page[]
  /** Current visible page index */
  currentVisiblePageIndex: number
  /** Current user responses */
  responses: Responses
  /** Function to get computed variables for a page */
  getComputedVariables: (page: Page) => ComputedVariables
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
  visiblePages,
  currentVisiblePageIndex,
  responses,
  getComputedVariables,
  onJumpToPage,
  onResetToUpload,
}: PageNavigatorProps) {
  const [isOpen, setIsOpen] = useState(false)

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

  const currentPage = visiblePages[currentVisiblePageIndex]
  const currentPageComputedVars = currentPage
    ? getComputedVariables(currentPage)
    : {}

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
            {/* Page List */}
            <div>
              <h3 className="font-medium mb-3">
                Pages ({visiblePages.length}/{questionnaire.length}{" "}
                visible)
              </h3>
              <div className="space-y-1">
                {questionnaire.map((page, globalIndex) => {
                  const isVisible = evaluateCondition(
                    page.showIf || "",
                    responses,
                    getComputedVariables(page)
                  )

                  // Find the visible page index for this page
                  const visibleIndex = visiblePages.findIndex(
                    (p) => p === page
                  )
                  const isCurrent = visibleIndex === currentVisiblePageIndex

                  return (
                    <div
                      key={globalIndex}
                      className={`flex items-center gap-2 p-2 rounded text-sm transition-all ${
                        isCurrent
                          ? "bg-primary/10 border border-primary/20"
                          : isVisible
                          ? "hover:bg-muted cursor-pointer"
                          : "opacity-50"
                      }`}
                      onClick={
                        isVisible && visibleIndex !== -1
                          ? () => onJumpToPage(visibleIndex)
                          : undefined
                      }
                    >
                      {/* Status indicator */}
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          isVisible ? "bg-green-500" : "bg-red-500"
                        }`}
                      />

                      {/* Page info */}
                      <div className="flex-1 min-w-0">
                        <div
                          className={`truncate ${
                            isCurrent ? "font-medium" : ""
                          }`}
                        >
                          {page.title || `Page ${globalIndex + 1}`}
                        </div>
                        {page.showIf && (
                          <div className="text-xs text-muted-foreground truncate">
                            SHOW_IF: {page.showIf}
                          </div>
                        )}
                      </div>
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
            {Object.keys(currentPageComputedVars).length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">
                  Computed Variables (Current Page)
                </h3>
                <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                  <pre>
                    {JSON.stringify(currentPageComputedVars, null, 2)}
                  </pre>
                </div>
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
