import { BASIC_SAMPLE_TEXT, INTERMEDIATE_SAMPLE_TEXT, ADVANCED_SAMPLE_TEXT } from "@/lib/constants"

export function TextFormatGuide() {
  return (
    <div className="space-y-2">
      <div className="text-xl font-semibold">Text Format Guide</div>

      <div className="space-y-6">
        <div>
          <h4 className="text-base font-medium mb-3">Basic</h4>
          <div className="bg-muted p-3 rounded mb-3 text-sm font-mono whitespace-pre-wrap">
            {BASIC_SAMPLE_TEXT}
          </div>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>
              <code># Title</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>Each # starts a new page with an (optional) title</li>
                <li>Not including a title simply creates a new page</li>
              </ul>
            </li>
            <li>
              <code>## Section</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>Creates a section within a page</li>
                <li>
                  This is usually followed by text to provide additional
                  instructions
                </li>
              </ul>
            </li>
            <li>
              <code>Q: Question text?</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>Creates a question</li>
                <li>Content on following lines gets appended to question text</li>
              </ul>
            </li>
            <li>
              <code>TEXT / ESSAY / NUMBER / CHECKBOX</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>Defines the question type</li>
                <li>
                  Should be placed immediately below the question or last
                  question option
                </li>
                <li>By default a question is a multiple choice question</li>
              </ul>
            </li>
            <li>
              <code>- Option text</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>Creates a multiple-choice option</li>
              </ul>
            </li>
            <li>
              All text supports Markdown formatting
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>**bold text** for emphasis</li>
                <li>*italic text* for subtle emphasis</li>
                <li>- bullet points and other formatting</li>
              </ul>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-base font-medium mb-3">Intermediate</h4>
          <div className="bg-muted p-3 rounded mb-3 text-sm font-mono whitespace-pre-wrap">
            {INTERMEDIATE_SAMPLE_TEXT}
          </div>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>
              <code>VARIABLE: name</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>Stores the response to the question into a variable</li>
                <li>
                  Can be used to insert the response into texts later in the
                  survey or for use in conditions
                </li>
                <li>
                  Should be placed after the question or last question option
                </li>
              </ul>
            </li>
            <li>
              <code>{`{name}`}</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>
                  Replaces the variable text with the value of the variable
                </li>
                <li>Variables can be used in page texts and question texts.</li>
              </ul>
            </li>
            <li>
              <code>{`{count1 + count2}`}</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>
                  Arithmetic expressions: add, subtract, multiply, divide
                  variables
                </li>
                <li>Supports parentheses for complex operations</li>
              </ul>
            </li>
            <li>
              <code>{`{interests AS LIST}`}</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>Formats checkbox variables as bullet lists.</li>
                <li>
                  Without AS LIST, checkbox variables display as bullet lists by default
                </li>
              </ul>
            </li>
            <li>
              <code>{`{interests AS INLINE_LIST}`}</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>
                  Formats checkbox variables as comma-separated inline text
                </li>
                <li>
                  Automatically lowercases items for natural sentence flow
                </li>
                <li>
                  Uses Oxford commas: &quot;sports, music, and technology&quot;
                </li>
                <li>Perfect for inserting lists within question text</li>
              </ul>
            </li>
            <li>
              <code>HINT: Extra info</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>
                  Adds muted text below question for additional instructions
                </li>
                <li>
                  Place immediately after the question line; before question
                  options
                </li>
                <li>
                  Content on following lines gets appended to the hint text
                </li>
              </ul>
            </li>
            <li>
              <code>TOOLTIP: Additional context</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>
                  Adds collapsible information icon next to question text
                </li>
                <li>
                  Tooltip content is hidden by default and shown on click
                </li>
                <li>
                  Place after HINT (if present); before question options
                </li>
                <li>
                  Content on following lines gets appended to the tooltip text
                </li>
                <li>
                  Supports Markdown formatting (bold, italic, links, etc.)
                </li>
                <li>
                  <strong>Note:</strong> Use <code>*</code> or numbered lists for
                  bullets, not <code>-</code> (which starts options)
                </li>
              </ul>
            </li>
            <li>
              <code>- TEXT</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>Adds text input to a question option</li>
                <li>Shows up when the question option is selected</li>
                <li>
                  Useful to allow respondents to elaborate on a question option
                </li>
                <li>
                  Should be placed directly under the option with two indented
                  spaces
                </li>
              </ul>
            </li>
            <li>
              <code>SHOW_IF: condition</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>Hides/shows questions conditionally</li>
                <li>
                  Should be placed below a question or below the question
                  options to apply to the question
                </li>
                <li>
                  Can also be placed after blocks, pages, or individual question
                  options (see the Advanced section below)
                </li>
              </ul>
            </li>
            <li>
              Basic conditions:
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>
                  <code>name IS John</code>: Variable equals or includes
                  &quot;John&quot; exactly
                </li>
                <li>
                  <code>interests IS NOT Sports</code>: Variable does not equal
                  or include &quot;Sports&quot;
                </li>
                <li>
                  <code>NOT interests</code>: Variable is empty/unanswered
                </li>
              </ul>
            </li>
            <li>
              <code>- Q: Matrix row text</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>Creates a matrix question row (sub-question)</li>
                <li>Multiple <code>- Q:</code> lines create multiple rows sharing the same options</li>
                <li>Regular <code>- Option</code> lines after matrix rows become shared response options</li>
                <li>Can be used with CHECKBOX for multiple selections per row</li>
                <li>Can be used with NUMBER for numeric input fields</li>
                <li>Creates a table layout where each row is a separate question</li>
              </ul>
            </li>
            <li>
              <code>TOTAL_LABEL: label text</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>Displays column totals for numeric matrix questions</li>
                <li>Only works with matrix questions using NUMBER type</li>
                <li>Adds a row at the bottom summing each column with custom label</li>
                <li>Should be placed after the NUMBER keyword</li>
                <li>Example: <code>TOTAL_LABEL: Total Hours</code></li>
              </ul>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-base font-medium mb-3">Advanced</h4>
          <div className="bg-muted p-3 rounded mb-3 text-sm font-mono whitespace-pre-wrap">
            {ADVANCED_SAMPLE_TEXT}
          </div>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>
              <code>BLOCK: name</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>Groups pages together for conditional logic</li>
                <li>All pages until the next BLOCK belong to this block</li>
                <li>
                  Can be used in combination with SHOW_IF to hide multiple pages
                  at once
                </li>
                <li>
                  Note: BLOCKs are for logic only - use NAV for respondent navigation
                </li>
              </ul>
            </li>
            <li>
              <code>NAV: name</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>Creates a navigation item in the survey sidebar</li>
                <li>All pages until the next NAV belong to this item</li>
                <li>Defaults to level 1 (top-level) navigation</li>
                <li>
                  Appears as clickable item in navigation for respondents to jump to sections
                </li>
                <li>
                  Shows completion status (visited/current/upcoming) automatically
                </li>
              </ul>
            </li>
            <li>
              <code>LEVEL: 1</code> or <code>LEVEL: 2</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>Must come immediately after NAV declaration</li>
                <li>Sets the hierarchy level of the navigation item</li>
                <li>Level 1 = top-level navigation (default, can be omitted)</li>
                <li>Level 2 = nested under the previous level 1 item</li>
                <li>
                  Useful for organizing long surveys with hierarchical structure
                </li>
                <li>
                  Level 1 items with level 2 children become collapsible sections
                </li>
              </ul>
            </li>
            <li>
              <code>COMPUTE: var = expression</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>Calculates a variable based on the expression</li>
                <li>Can be block-level or page-level</li>
                <li>Uses arithmetic expressions and conditions</li>
              </ul>
            </li>
            <li>
              <code>{`{{IF condition THEN text ELSE text}}`}</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>Inserts conditional text within question text</li>
                <li>
                  Can be used to dynamically change question wording based on
                  previous responses
                </li>
                <li>ELSE part is optional</li>
              </ul>
            </li>
            <li>
              <code>{`{var1 + var2}`}</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>
                  Arithmetic expressions: add, subtract, multiply, divide
                  variables
                </li>
                <li>Can be used in question text or computed variables</li>
                <li>Supports parentheses for complex operations</li>
              </ul>
            </li>
            <li>
              <code>- SHOW_IF: condition</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>Conditionally shows question options</li>
                <li>Should be placed after option with two indented spaces</li>
              </ul>
            </li>
            <li>
              Condition operators:
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>
                  <code>== / IS</code>: Equal comparison
                </li>
                <li>
                  <code>!= / IS_NOT</code>: Not equal comparison
                </li>
                <li>
                  <code>&& / AND</code>: Logical AND
                </li>
                <li>
                  <code>|| / OR</code>: Logical OR
                </li>
                <li>
                  <code>NOT</code>: Logical negation
                </li>
                <li>Both symbols and text work interchangeably</li>
              </ul>
            </li>
            <li>
              <code>STARTS_WITH</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>
                  Tests multiple variables with a common prefix at once
                </li>
                <li>
                  <code>STARTS_WITH crime == Yes</code>: Any variable starting
                  with &quot;crime&quot; equals &quot;Yes&quot;
                </li>
                <li>
                  <code>STARTS_WITH fraud != No</code>: Any variable starting
                  with &quot;fraud&quot; doesn&apos;t equal &quot;No&quot;
                </li>
                <li>
                  Uses OR logic: true if ANY matching variable meets the
                  condition
                </li>
                <li>Useful for grouped questions with common prefixes</li>
              </ul>
            </li>
            <li>
              More condition examples:
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>
                  <code>interests == Technology</code>: Checkbox contains
                  &quot;Technology&quot;
                </li>
                <li>
                  <code>experience != Beginner</code>: Not equal to
                  &quot;Beginner&quot;
                </li>
                <li>
                  <code>age {">"}= 18</code>: Age is 18 or older
                </li>
                <li>
                  <code>age {"<"}= 65</code>: Age is 65 or younger
                </li>
                <li>
                  <code>rating {">"} 3</code>: Rating greater than 3
                </li>
                <li>
                  <code>score {"<"} 50</code>: Score less than 50
                </li>
                <li>
                  <code>selections {">"}= 2</code>: At least 2 checkbox options
                  selected
                </li>
                <li>
                  <code>name IS John OR name IS Jane</code>: Either John or Jane
                </li>
                <li>
                  <code>
                    age {">"}= 18 AND rating {">"}= 4
                  </code>
                  : Both age and rating requirements met
                </li>
                <li>
                  <code>rating {"<"} 3 && feedback</code>: Low rating AND
                  feedback exists
                </li>
                <li>
                  <code>age {"<"}= 25 || student IS true</code>: Young or is a
                  student
                </li>
                <li>
                  <code>total != var1 + var2</code>: Total doesn&apos;t equal
                  sum of var1 and var2
                </li>
                <li>
                  <code>NOT (completed && submitted)</code>: Either not
                  completed or not submitted
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
