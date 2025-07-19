"use client"

import React from "react"

interface TextFormatGuideProps {
  sampleText: string
}

export function TextFormatGuide({ sampleText }: TextFormatGuideProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Text Format Guide</h3>
      <p className="text-sm text-gray-600">
        This is the exact format used in the sample questionnaire:
      </p>
      <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap">
        {sampleText}
      </div>
      <div className="text-sm text-gray-600 space-y-2">
        <p>
          <strong>Key features:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <code># Section</code> - Creates new pages
          </li>
          <li>
            <code>## Subsection</code> - Headers within the same page
          </li>
          <li>
            <code>Q1: Question text?</code> - Questions
          </li>
          <li>
            <code>- Option text</code> - Multiple choice options (no letters
            needed)
          </li>
          <li>
            <code>TEXT_INPUT</code> / <code>NUMBER_INPUT</code> - Input types
          </li>
          <li>
            <code>VARIABLE: name</code> - Store response (optional)
          </li>
          <li>
            <code>{`{variable}`}</code> - Simple variable replacement
          </li>
          <li>
            <code>{`{{condition|true_text|false_text}}`}</code> - Conditional
            text based on responses
          </li>
          <li>
            <code>SHOW_IF: condition</code> - Conditional question display
          </li>
        </ul>
      </div>
    </div>
  )
}
