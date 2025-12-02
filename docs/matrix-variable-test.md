# Matrix Variable Test

Q: How strongly do you agree or disagree with the following statements?
- Q: Statement one
  VARIABLE: statement_one
- Q: Statement two
  VARIABLE: statement_two

- Strongly Agree
- Agree
- Neutral
- Disagree
- Strongly Disagree

# Test Page
SHOW_IF: statement_one != "" OR statement_two != ""

This page should only show if you answered the matrix question.

You answered: {statement_one} for statement one
You answered: {statement_two} for statement two
