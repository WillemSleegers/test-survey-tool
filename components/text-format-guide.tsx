"use client"

export function TextFormatGuide() {
  return (
    <div className="space-y-2">
      <div className="text-xl font-semibold">Text Format Guide</div>

      <div className="space-y-6">
        <div>
          <h4 className="text-base font-medium mb-3">Basic</h4>
          <div className="bg-muted p-3 rounded mb-3 text-sm font-mono whitespace-pre-wrap">
            {`# Personal Information

## Basic Details
Please answer the following questions about yourself.

Q: What is your name?
TEXT

Q: What is your age?
- Under 18
- 18-25
- Over 25`}
          </div>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>
              <code># Title</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>Creates a page with an (optional) title</li>
                <li>Each # starts a new page</li>
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
                <li>By default a question is multiple choice</li>
              </ul>
            </li>
            <li>
              <code>- Option text</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>Creates a multiple-choice option</li>
              </ul>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-base font-medium mb-3">Intermediate</h4>
          <div className="bg-muted p-3 rounded mb-3 text-sm font-mono whitespace-pre-wrap">
            {`# Personal Information

## Basic Details
Please answer the following questions about yourself.

Q: What is your name?
TEXT
VARIABLE: name

Q: Hello {name}, what are your interests?
HINT: Select all that apply
- Sports
- Music
- Technology
- Other
  - TEXT
CHECKBOX
VARIABLE: interests

Q: Do you like programming?
- Yes
- No
SHOW_IF: interests IS Technology`}
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
                <li>Inserts saved variables into question text or content</li>
                <li>Variables can be used anywhere in text</li>
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
                  Should be placed directly under the option with 2 indented
                  spaces
                </li>
              </ul>
            </li>

            <li>
              <code>SHOW_IF: condition</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>Hides/shows questions conditionally</li>
                <li>
                  Place after a question to only show the question when the
                  condition is true
                </li>
                <li>
                  Can also be placed after pages and blocks to hide entire pages
                  and blocks
                </li>
              </ul>
            </li>
            <li>
              Basic Conditions:
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
          </ul>
        </div>

        <div>
          <h4 className="text-base font-medium mb-3">Advanced</h4>
          <div className="bg-muted p-3 rounded mb-3 text-sm font-mono whitespace-pre-wrap">
            {`# Personal Information

## Basic Details
Please answer the following questions about yourself.

Q: What is your name?
TEXT
VARIABLE: name

Q: What is your age?
NUMBER
VARIABLE: age

Q: Hello {name}, what are your interests?
HINT: Select all that apply
- Sports
- Music
- Technology
CHECKBOX
VARIABLE: interests

Q: How many years have you worked in tech?
NUMBER
VARIABLE: tech_years

## Summary Section
Based on your age of {age} and {tech_years} years in tech, your total experience score is {age + tech_years}.

BLOCK: adult_tech
COMPUTE: is_adult = age >= 18
COMPUTE: likes_tech = interests == Technology
SHOW_IF: is_adult AND likes_tech

# Programming Experience

Q: What programming languages do you know?
- Basic scripting
- JavaScript
- Advanced frameworks
- Other
  - TEXT
VARIABLE: programming

# Experience Level

Q: {{IF likes_tech THEN As a tech enthusiast ELSE As someone interested in tech}}, what's your experience level?
- Beginner
- Intermediate  
- Expert

BLOCK: general_questions

# General Topics
These questions are for everyone.`}
          </div>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>
              <code>BLOCK: name</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>Group related pages together for conditional visibility</li>
                <li>Place at the beginning of a section</li>
                <li>All pages until next BLOCK belong to this block</li>
              </ul>
            </li>
            <li>
              <code>COMPUTE: var = expression</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>Calculate variables from responses</li>
                <li>Can be block-level or section-level</li>
                <li>Use arithmetic expressions and conditions</li>
              </ul>
            </li>
            <li>
              <code>{`{{IF condition THEN text ELSE text}}`}</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>Insert conditional text within question text</li>
                <li>Dynamically change question wording based on responses</li>
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
                <li>Conditionally show question options</li>
                <li>Place after option with two-space indent</li>
                <li>Option only appears when condition is true</li>
              </ul>
            </li>
            <li>
              <code>SHOW_IF: condition</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>Hide/show pages/sections/blocks</li>
                <li>Place after #, ##, or BLOCK line</li>
                <li>Entire section only appears when condition is true</li>
              </ul>
            </li>
            <li>
              Condition Operators:
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
              STARTS_WITH Patterns:
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>
                  <code>STARTS_WITH crime == Yes</code>: Any variable starting with &quot;crime&quot; equals &quot;Yes&quot;
                </li>
                <li>
                  <code>STARTS_WITH fraud != No</code>: Any variable starting with &quot;fraud&quot; doesn&apos;t equal &quot;No&quot;
                </li>
                <li>Uses OR logic: true if ANY matching variable meets the condition</li>
                <li>Useful for grouped questions with common prefixes</li>
                <li>No conflicts with markdown or JSX formatting</li>
              </ul>
            </li>
            <li>
              More Condition Examples:
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
