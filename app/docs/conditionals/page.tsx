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
            <h4 className="text-lg font-semibold">Operator Precedence and Values</h4>
            <ul className="list-disc list-outside ml-5 space-y-2">
              <li>
                <code>NOT</code> binds tighter than <code>AND</code>, and{" "}
                <code>AND</code> binds tighter than <code>OR</code>:{" "}
                <code>a AND b OR c</code> means <code>(a AND b) OR c</code>
              </li>
              <li>
                Use parentheses to group:{" "}
                <code>(age &gt;= 65 OR age &lt; 30) AND consent == Yes</code>
              </li>
              <li>
                Keywords are recognized in UPPERCASE only, so unquoted answer
                values containing words like &quot;or&quot; stay plain text:{" "}
                <code>usage == Several weeks or more</code>
              </li>
              <li>
                Values may be quoted: <code>usage == &quot;Several weeks or
                more&quot;</code>
              </li>
              <li>
                Malformed conditions are rejected when the survey is loaded,
                with an error naming the block, page, section, question, or
                option they belong to
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-lg font-semibold">Quoting Values</h4>
            <p>
              Quote a value whenever it contains an operator character (
              <code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>,{" "}
              <code>&gt;</code>, <code>&lt;</code>, <code>=</code>) or an
              UPPERCASE keyword (<code>AND</code>, <code>OR</code>,{" "}
              <code>NOT</code>, <code>IS</code>, <code>IS_NOT</code>, ...).
              Otherwise the parser applies it as an operator instead of
              treating it as part of the text.
            </p>
            <p className="font-medium">Plain text needs no quotes:</p>
            <ul className="list-disc list-outside ml-5 space-y-1">
              <li>
                <code>usage == Several weeks or more</code>
              </li>
              <li>
                <code>status == Employed</code>
              </li>
            </ul>
            <p className="font-medium">
              A value containing an operator does:
            </p>
            <ul className="list-disc list-outside ml-5 space-y-1">
              <li>
                <code>code == &quot;A+B&quot;</code> — not{" "}
                <code>code == A+B</code>
              </li>
              <li>
                <code>status == &quot;Yes AND No&quot;</code> — not{" "}
                <code>status == Yes AND No</code>
              </li>
              <li>
                <code>plan == &quot;Level &gt; Basic&quot;</code> — not{" "}
                <code>plan == Level &gt; Basic</code>
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
                Works with multiple choice, checkbox, matrix, and breakdown
                questions
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
