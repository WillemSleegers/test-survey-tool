import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { evaluateCondition } from "@/lib/conditions/condition-evaluator"
import { Section, Responses } from "@/lib/types"

interface DebugInfoProps {
  /** Whether debug mode is enabled */
  isDebugMode: boolean
  /** Current user responses */
  responses: Responses
  /** All questionnaire sections */
  questionnaire: Section[]
  /** Currently visible sections */
  visibleSections: Section[]
  /** Current visible section index */
  currentVisibleSectionIndex: number
}

/**
 * Debug information component for questionnaire development and testing
 * 
 * Shows:
 * - Current responses in JSON format
 * - Section visibility status with conditions
 * - Navigation state information
 * 
 * Only renders when debug mode is enabled (URL contains #debug)
 */
export function DebugInfo({
  isDebugMode,
  responses,
  questionnaire,
  visibleSections,
  currentVisibleSectionIndex,
}: DebugInfoProps) {
  if (!isDebugMode) return null

  return (
    <>
      {/* Current Responses */}
      {Object.keys(responses).length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">
              Current Responses (for testing)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded overflow-auto">
              {JSON.stringify(responses, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Section Visibility */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">
            Section Visibility (for testing)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>Total sections: {questionnaire.length}</p>
            <p>Visible sections: {visibleSections.length}</p>
            <p>
              Current visible section index:{" "}
              {currentVisibleSectionIndex + 1} of {visibleSections.length}
            </p>
            <div className="mt-4">
              <p className="font-medium mb-2">Section visibility:</p>
              {questionnaire.map((section, index) => {
                const isVisible = evaluateCondition(section.showIf || "", responses)
                return (
                  <div key={index} className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isVisible ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <span
                      className={`${
                        isVisible ? "" : "line-through text-muted-foreground"
                      }`}
                    >
                      Section {index + 1}: {section.title || "(Untitled)"}
                      {section.showIf && ` [SHOW_IF: ${section.showIf}]`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}