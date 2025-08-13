export const SAMPLE_TEXT = `BLOCK: Personal information

# **Personal Information**

Please answer the following questions about yourself.

Q: What is your name?
TEXT
VARIABLE: name

Q: What is your age?
NUMBER
VARIABLE: age

#

Q: Hello {name}, what are your interests?
HINT: Select all that apply
- Sports
- Music
- Technology
CHECKBOX
VARIABLE: interests

BLOCK: Technology
SHOW_IF: interests == Technology

#

You indicated that technology is one of your interests.

Q: To what extent do you like programming?
- Not at all
- Somewhat
- Moderately
- Very much
- A great deal

Q: Do you know any programming languages?
- Yes
- No
VARIABLE: programming

# Programming Experience
SHOW_IF: programming == Yes

Q: Which programming languages do you know?
- C#
- Java
- Python
- JavaScript
- R
- Other
  - TEXT

BLOCK: General_questions

# Survey evaluation

Q: Which of the questions did you like?
- The personal information questions
- The interests question
- The technology questions
  - SHOW_IF: interests == Technology
CHECKBOX

Q: Two years from now, would you want to participate in this survey again, when you are {age + 2} years old?
- Yes
- No`