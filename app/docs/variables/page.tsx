"use client"

import { renderExample } from "@/components/docs/doc-helpers"

export default function VariablesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Variables</h2>
        <p className="text-muted-foreground mt-1">
          Assign variable names to questions to reference their answers later.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Usage</h3>
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>
            Use <code>VARIABLE: name</code> to store the question&apos;s
            response
          </li>
          <li>
            Can be used to insert the response into texts later in the survey or
            for use in conditions
          </li>
          <li>Should be placed after the question or last question option</li>
          <li>
            Use <code>{"{name}"}</code> syntax to insert variable values into
            page texts and question texts
          </li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-semibold">Example</h3>
        {renderExample(`# **Personal Info**
Q: What is your name?
TEXT
VARIABLE: name

Q: What is your age?
NUMBER
VARIABLE: age

# **Summary**
Welcome {name}! You are {age} years old.`)}
      </div>
    </div>
  )
}
