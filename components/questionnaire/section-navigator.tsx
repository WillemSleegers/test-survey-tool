"use client"

import { useState, useEffect } from "react"
import { ChevronRight, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { evaluateCondition } from "@/lib/conditions/condition-evaluator"
import { Section, Responses, ComputedVariables } from "@/lib/types"

interface SectionNavigatorProps {
  /** All questionnaire sections */
  questionnaire: Section[]
  /** Currently visible sections */
  visibleSections: Section[]
  /** Current visible section index */
  currentVisibleSectionIndex: number
  /** Current user responses */
  responses: Responses
  /** Function to get computed variables for a section */
  getComputedVariables: (section: Section) => ComputedVariables
  /** Function to jump to a specific section */
  onJumpToSection: (sectionIndex: number) => void
}

/**
 * Minimal section navigator for researchers
 * 
 * Features:
 * - Nearly invisible toggle button that only shows on hover
 * - Collapsible panel with section overview
 * - Quick jump to any visible section
 * - Shows section visibility status and conditions
 * - Includes debug information (responses, computed variables)
 */
export function SectionNavigator({
  questionnaire,
  visibleSections,
  currentVisibleSectionIndex,
  responses,
  getComputedVariables,
  onJumpToSection,
}: SectionNavigatorProps) {
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

  const currentSection = visibleSections[currentVisibleSectionIndex]
  const currentSectionComputedVars = currentSection ? getComputedVariables(currentSection) : {}

  return (
    <>
      {/* Nearly invisible toggle button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-40 w-8 h-8 p-0 opacity-20 hover:opacity-100 focus:opacity-100 transition-opacity duration-200"
        title={`Section Navigator (${navigator.platform?.includes('Mac') ? 'Cmd' : 'Ctrl'}+/)`}
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
            <h2 className="text-lg font-semibold">Section Navigator</h2>
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
            {/* Section List */}
            <div>
              <h3 className="text-sm font-medium mb-3">
                Sections ({visibleSections.length}/{questionnaire.length} visible)
              </h3>
              <div className="space-y-2">
                {questionnaire.map((section, globalIndex) => {
                  const isVisible = evaluateCondition(
                    section.showIf || "",
                    responses,
                    getComputedVariables(section)
                  )
                  
                  // Find the visible section index for this section
                  const visibleIndex = visibleSections.findIndex(s => s === section)
                  const isCurrent = visibleIndex === currentVisibleSectionIndex
                  
                  return (
                    <div
                      key={globalIndex}
                      className={`flex items-center gap-2 p-2 rounded text-sm ${
                        isCurrent
                          ? "bg-primary/10 border border-primary/20"
                          : isVisible
                          ? "hover:bg-muted cursor-pointer"
                          : "opacity-50"
                      }`}
                      onClick={
                        isVisible && visibleIndex !== -1
                          ? () => onJumpToSection(visibleIndex)
                          : undefined
                      }
                    >
                      {/* Status indicator */}
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          isVisible ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      
                      {/* Section info */}
                      <div className="flex-1 min-w-0">
                        <div className={`truncate ${isCurrent ? "font-medium" : ""}`}>
                          {section.title || `Section ${globalIndex + 1}`}
                        </div>
                        {section.showIf && (
                          <div className="text-xs text-muted-foreground truncate">
                            SHOW_IF: {section.showIf}
                          </div>
                        )}
                      </div>
                      
                      {/* Current indicator */}
                      {isCurrent && (
                        <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />
                      )}
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
            {Object.keys(currentSectionComputedVars).length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">
                  Computed Variables (Current Section)
                </h3>
                <div className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
                  <pre>{JSON.stringify(currentSectionComputedVars, null, 2)}</pre>
                </div>
              </div>
            )}

            {/* Keyboard Shortcuts */}
            <div>
              <h3 className="text-sm font-medium mb-3">Shortcuts</h3>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  <kbd className="px-1 py-0.5 bg-muted rounded">
                    {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? 'Cmd' : 'Ctrl'}+/
                  </kbd> Toggle navigator
                </div>
                <div><kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> Close navigator</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}