export function TextFormatGuide() {
  return (
    <div className="space-y-2">
      <div className="text-xl font-semibold">Text Format Guide</div>

      <div className="space-y-6">
        <div>
          <h4 className="text-base font-medium mb-3">Basic</h4>
          <div className="bg-muted p-3 rounded mb-3 text-sm font-mono whitespace-pre-wrap">
            {`# Survey Tool Evaluation

## About This Survey
Help us improve our survey creation tool by sharing your experience using it.

Q: How did you first learn about this survey tool?
- Online search
- Recommendation from colleague
- Social media
- Documentation or tutorial
- Other

Q: Which features have you tried so far?
- Creating basic surveys
- Using conditional logic
- Adding computed variables
- Testing surveys with others
CHECKBOX

Q: On a scale of 1-10, how easy was it to create your first survey?
NUMBER

Q: What has been your biggest challenge or frustration with the tool?
ESSAY`}
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
          </ul>
        </div>

        <div>
          <h4 className="text-base font-medium mb-3">Intermediate</h4>
          <div className="bg-muted p-3 rounded mb-3 text-sm font-mono whitespace-pre-wrap">
            {`# Survey Tool Evaluation

## About This Survey
Help us improve our survey creation tool by sharing your experience using it.

Q: How long have you been using this survey tool?
- Just started today
- A few days
- About a week
- Several weeks or more
VARIABLE: usage_time

Q: Which features have you tried so far?
HINT: Select all that apply
- Creating basic surveys
- Using conditional logic (SHOW_IF)
- Adding computed variables
- Variable interpolation in text
- Other advanced features
  - TEXT
CHECKBOX
VARIABLE: features_tried

#

Q: Overall, how would you rate the learning curve?
- Very easy to learn
- Somewhat easy
- Moderate difficulty
- Quite difficult
- Very difficult

#
SHOW_IF: features_tried IS Using conditional logic (SHOW_IF)

Since you've tried conditional logic, we'd love your specific feedback.

Q: How intuitive did you find the SHOW_IF syntax?
- Very intuitive
- Mostly intuitive
- Somewhat confusing
- Very confusing`}
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
          </ul>
        </div>

        <div>
          <h4 className="text-base font-medium mb-3">Advanced</h4>
          <div className="bg-muted p-3 rounded mb-3 text-sm font-mono whitespace-pre-wrap">
            {`BLOCK: User Background

# Survey Tool Evaluation

## About This Survey
Help us improve our survey creation tool by sharing your experience using it.

Q: How long have you been using this survey tool?
- Just started today
- A few days
- About a week
- Several weeks or more
VARIABLE: usage_time

Q: How many surveys have you created so far?
NUMBER
VARIABLE: surveys_created

#

Q: Which features have you tried so far?
HINT: Select all that apply
- Creating basic surveys
- Using conditional logic (SHOW_IF)
- Adding computed variables
- Variable interpolation in text
CHECKBOX
VARIABLE: features_tried

COMPUTE: experienced_user = usage_time IS Several weeks or more AND surveys_created >= 3

BLOCK: Feature Feedback
SHOW_IF: features_tried

#

We'd like detailed feedback on the features you've used.

Q: How would you rate each feature you've used?
- Creating basic surveys
  - SHOW_IF: features_tried IS Creating basic surveys
- Using conditional logic (SHOW_IF)
  - SHOW_IF: features_tried IS Using conditional logic (SHOW_IF)
- Adding computed variables
  - SHOW_IF: features_tried IS Adding computed variables
- Variable interpolation in text
  - SHOW_IF: features_tried IS Variable interpolation in text

Q: {{IF experienced_user THEN As an experienced user ELSE As someone still learning}}, what would help you most?
- Better documentation
- More examples
- Video tutorials
- Simplified syntax

BLOCK: Overall Assessment
SHOW_IF: experienced_user

# Advanced User Feedback

Q: Would you recommend this tool to others?
- Yes
- No
VARIABLE: recommend

Q: You've created {surveys_created} surveys so far. {{IF recommend IS Yes THEN Thank you for being willing to recommend our tool! ELSE We hope we can improve your experience.}} What's the most important improvement we could make?
ESSAY`}
          </div>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>
              <code>BLOCK: name</code>
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>Groups pages together</li>
                <li>All pages until the next BLOCK belong to this block</li>
                <li>
                  Can be used in combination with SHOW_IF to hide multiple pages
                  at once
                </li>
                <li>
                  Can also be used to more easily navigate between sections of
                  the survey
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
              STARTS_WITH
              <ul className="list-[circle] list-inside ml-6 mt-1 space-y-1">
                <li>
                  Can be used to select and test multiple variables at once
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
