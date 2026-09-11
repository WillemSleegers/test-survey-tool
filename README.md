# Test Survey Tool

An application that converts structured text files into interactive survey questionnaires suitable for user testing.

## Features

- **Structured text input**: define surveys in plain text files
- **Interactive questionnaires**: converts input into a fully interactive survey
- **User testing ready**: designed for quick setup in user testing sessions

## Example

A survey is plain text. Pages start with `#`, questions with `Q:`, and answer options with `-`:

```text
# About You

Q: What is your name?
VARIABLE: name
TEXT

Q: How many surveys do you run in a year?
VARIABLE: surveys_per_year
NUMBER

# Follow-up
SHOW_IF: surveys_per_year > 5

Q: Hi {name}, which tools do you use?
- Qualtrics
- LimeSurvey
- Other, namely:
  - TEXT
```

Answers are stored in variables, which can be referenced in later text as `{name}` and used
to show or hide pages with `SHOW_IF:`. Most features are opt-in — a basic survey only needs
`#`, `Q:`, and `-`.

## Documentation

The [documentation](https://test-survey-tool.vercel.app/docs/overview) covers the full text
format, from pages and question types through variables, arithmetic, and conditional logic.
Every topic comes with a live example you can answer in the page.
