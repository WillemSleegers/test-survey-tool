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

Q1: What is your name?
TEXT

Q2: What is your age?
- Under 18
- 18-25
- Over 25`}
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>
              <code># Title</code> - Create pages (each # starts a new page)
            </li>
            <li>
              <code>## Section</code> - Create sections within a page
            </li>
            <li>
              <code>Q1: Question text?</code> - Add numbered questions
            </li>
            <li>
              <code>- Option text</code> - Multiple choice options (default:
              radio buttons)
            </li>
            <li>
              <code>TEXT / NUMBER / CHECKBOX</code> - Input types
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-base font-medium mb-3">Intermediate</h4>
          <div className="bg-muted p-3 rounded mb-3 text-sm font-mono whitespace-pre-wrap">
            {`# Personal Information

## Basic Details
Please answer the following questions about yourself.

Q1: What is your name?
TEXT
VARIABLE: name

Q2: Hello {name}, what are your interests?
HINT: Select all that apply
- Sports
- Music
- Technology
CHECKBOX
VARIABLE: interests

Q3: Do you like programming?
- Yes
- No
SHOW_IF: name`}
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>
              <code>VARIABLE: name</code> - Store responses for later use
            </li>
            <li>
              <code>HINT: Extra info</code> - Add muted text below question for
              additional instructions
            </li>
            <li>
              <code>{`{name}`}</code> - Insert saved variables
            </li>
            <li>
              <code>SHOW_IF: condition</code> - Hide/show questions
              conditionally (place after question)
            </li>
            <li>
              Conditions:
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>
                  <code>name IS John</code>: Text equals &quot;John&quot;
                  exactly
                </li>
                <li>
                  <code>name IS NOT Admin</code>: Text does not equal
                  &quot;Admin&quot;
                </li>
                <li>
                  <code>NOT completed</code>: Question is empty/unanswered
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

Q1: What is your name?
TEXT
VARIABLE: name

Q2: What is your age?
NUMBER
VARIABLE: age

Q3: Hello {name}, what are your interests?
HINT: Select all that apply
- Sports
- Music
- Technology
CHECKBOX
VARIABLE: interests

# Advanced Logic
COMPUTE: is_adult = age >= 18
COMPUTE: likes_tech = interests == Technology

Q4: What programming languages do you know?
- Basic scripting
- JavaScript
  - SHOW_IF: is_adult
- Advanced frameworks
  - SHOW_IF: likes_tech AND is_adult
VARIABLE: programming

# Advanced Topics
SHOW_IF: is_adult AND likes_tech

Q5: {{IF likes_tech THEN As a tech enthusiast ELSE As someone interested in tech}}, what's your experience level?
- Beginner
- Intermediate  
- Expert`}
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>
              <code>COMPUTE: var = expression</code> - Calculate variables from
              responses
            </li>
            <li>
              <code>{`{{IF condition THEN text ELSE text}}`}</code> - Insert
              conditional text within question text
            </li>
            <li>
              <code>- SHOW_IF: condition</code> - Conditionally show question
              options (place after option)
            </li>
            <li>
              <code>SHOW_IF: condition</code> - Hide/show pages/sections (place
              after # or ## line)
            </li>
            <li>
              Operators: Both symbols and text work (<code>== / IS</code>,{" "}
              <code>!= / IS_NOT</code>, <code>&& / AND</code>,{" "}
              <code>|| / OR</code>)
            </li>
            <li>
              Complex conditions:
              <ul className="list-disc list-inside ml-4 mt-1">
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
