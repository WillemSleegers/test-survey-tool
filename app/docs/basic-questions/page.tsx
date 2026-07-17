"use client"

import { renderExample } from "@/components/docs/doc-helpers"

export default function BasicQuestionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Questions</h2>
        <p className="text-muted-foreground mt-1">
          Define questions using the <code>Q:</code> prefix, with support for
          various input types and options.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Usage</h3>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>
            Each question is defined by starting a line with the <code>Q:</code>{" "}
            prefix
          </li>
          <li>
            Questions start with <code>Q:</code> or <code>Q1:</code>,{" "}
            <code>Q2:</code>, etc.
          </li>
          <li>Use numbers when you want to reference questions explicitly</li>
          <li>
            Question text is normally a single line after <code>Q:</code>.
            Wrap it in <code>&quot;&quot;&quot;</code> delimiters to write
            multi-line, multi-paragraph markdown instead:{" "}
            <code>Q: &quot;&quot;&quot;</code> on its own line, the markdown
            content, then a closing <code>&quot;&quot;&quot;</code> on its
            own line. Lines starting with <code>-</code> or{" "}
            <code>*</code> inside the delimited block render as a bullet
            list and are never treated as answer options — useful when the
            question itself needs to reference a list.
          </li>
          <li>
            Questions default to a text input question or, when options are
            specified, a multiple choice question
          </li>
          <li>
            Place a question type keyword (e.g., TEXT, NUMBER, MATRIX) directly
            after the question or question options to set the question type
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Example</h3>
        {renderExample(`Q: What is your name?
        
Q: What is your favorite color?
- Red
- Blue
- Green

Q: How old are you?
NUMBER`)}
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Multi-line question text</h3>
        <p className="text-sm">
          Use <code>&quot;&quot;&quot;</code> delimiters for any question text
          that spans multiple lines or paragraphs. This also covers the case
          where the question needs to reference a list, without turning that
          list into answer options.
        </p>
        {renderExample(`Q: """
Which of these measures has your employer provided?

- Climate-appropriate clothing/gear
- Information and training about handling climate-related risks
"""
- Yes
- No`)}
      </div>
    </div>
  )
}
