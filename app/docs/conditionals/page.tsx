"use client"

import Link from "next/link"
import { renderExample } from "@/components/docs/doc-helpers"

export default function ConditionalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Conditionals</h2>
        <p className="text-muted-foreground mt-1">
          Control what content appears based on user responses.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-xl font-semibold">Conditional Logic (SHOW_IF)</h3>
          <p>Show or hide questions based on previous answers.</p>

          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Usage</h4>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                Use <code>SHOW_IF: condition</code> to conditionally hide/show
                questions
              </li>
              <li>
                Place below a question or after question options to apply to
                that question
              </li>
              <li>
                Can also be placed after blocks, pages, or individual question
                options
              </li>
              <li>
                Supports operators: ==, !=, &gt;, &lt;, &gt;=, &lt;=, AND, OR,
                NOT
              </li>
              <li>
                For complex multi-line conditions, use triple-quote delimiters:{" "}
                <code>SHOW_IF: &quot;&quot;&quot;</code> ...{" "}
                <code>&quot;&quot;&quot;</code>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Example</h4>
            {renderExample(`Q: Do you have pets?
- Yes
- No
VARIABLE: has_pets

Q: What kind of pet?
- Dog
- Cat
- Bird
- Other
SHOW_IF: has_pets == Yes`)}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-semibold">Conditional Options</h3>
          <p>
            Use <code>- SHOW_IF:</code> to conditionally show or hide individual
            options based on previous responses.
          </p>

          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Usage</h4>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                <code>- SHOW_IF:</code> is placed as a sub-item under the option
                it controls
              </li>
              <li>The option is hidden when the condition is false</li>
              <li>
                Works with multiple choice, checkbox, and matrix questions
              </li>
              <li>
                Uses the same condition syntax as question-level{" "}
                <code>SHOW_IF:</code>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Example</h4>
            {renderExample(`Q: Are you a business customer?
- Yes
- No
VARIABLE: business

Q: What type of account do you need?
- Personal
- Business
  - SHOW_IF: business == Yes
- Enterprise
  - SHOW_IF: business == Yes`)}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-semibold">Conditional Text</h3>
          <p>Display dynamic text based on variables and conditions.</p>

          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Usage</h4>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                Use <code>{"{IF condition THEN text ELSE text}"}</code> syntax
                for conditional text
              </li>
              <li>
                Inserts conditional text within question text or page text
              </li>
              <li>
                Dynamically changes question wording based on previous responses
              </li>
              <li>ELSE part is optional</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Example</h4>
            {renderExample(`Q: Are you a student?
- Yes
- No
VARIABLE: student

Q: {{IF student == Yes THEN What is your major? ELSE What is your occupation?}}
TEXT`)}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-semibold">STARTS_WITH Operator</h3>
          <p>Test multiple variables with a common prefix at once.</p>

          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Usage</h4>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                Use <code>STARTS_WITH prefix == value</code> to test multiple
                variables with a common prefix
              </li>
              <li>
                Tests if ANY variable starting with the prefix meets the
                condition
              </li>
              <li>
                Uses OR logic: true if at least one matching variable satisfies
                the condition
              </li>
              <li>
                Example: <code>STARTS_WITH fraud == Yes</code> checks all
                variables starting with &quot;fraud&quot;
              </li>
              <li>
                Useful for grouped questions with common variable naming
                patterns
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Example</h4>
            {renderExample(`Q: Did you witness fraud?
- Yes
- No
VARIABLE: crime_fraud

Q: Did you witness theft?
- Yes
- No
VARIABLE: crime_theft

# **Follow-up**
SHOW_IF: STARTS_WITH crime == Yes

Q: Please provide details
ESSAY`)}
          </div>
        </div>
      </div>
    </div>
  )
}
