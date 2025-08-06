export const SAMPLE_TEXT = `# Tutorial: Creating Surveys

## Welcome to the Test Survey Tool
This tool converts structured text into interactive surveys for testing question logic.

**Basic Syntax:**
- # Page Title - Creates new pages
- ## Section Title - Creates sections within pages  
- Q: Question text? - Creates questions (auto-numbered)
- TEXT / ESSAY / NUMBER / CHECKBOX - Question types
- VARIABLE: name - Stores responses for later use

Q: What's your name?
TEXT
VARIABLE: user_name

# Question Types

## Basic Question Types
**Multiple Choice:** List options with - Option text (no extra commands needed)
**Numbers:** Add NUMBER after the question
**Checkboxes:** List options, then add CHECKBOX 
**Text:** TEXT (short) or ESSAY (long)
**Hints:** Add HINT: helpful text after questions

Q: How did you find this tool?
- Search engine
- Recommendation  
- Social media
- Other
  - TEXT

Q: Rate your survey experience (1-10):
NUMBER
VARIABLE: rating

Q: How many surveys have you created before?
NUMBER
VARIABLE: previous_surveys

Q: What interests you most?
HINT: Select all that apply
You can choose multiple options from the list below.
This helps us understand your preferences better.
- Question design
- Logic and branching
- Data collection
CHECKBOX
VARIABLE: interests

Q: Any suggestions for improvement?
ESSAY
VARIABLE: suggestions

# Variables & Logic

## Using Your Responses
Hi {user_name}! Your answers can personalize later questions.

Based on your experience rating of {rating} and having created {previous_surveys} surveys before, your total experience score would be {rating + previous_surveys}.

**Variable Substitution:** Use {variable_name} anywhere in text
**Arithmetic Expressions:** Use {var1 + var2} for calculations
**Conditional Questions:** Add SHOW_IF: condition after questions  
**Conditional Text:** Use {{IF condition THEN text ELSE text}}

Q: Tell us about your survey needs:
TEXT
SHOW_IF: rating >= 7

Q: Is your combined experience score accurate?
HINT: This should match rating + previous surveys
- Yes, it matches {rating + previous_surveys}
- No, something seems wrong
SHOW_IF: rating + previous_surveys != 0

Q: {{IF rating >= 8 THEN Excellent! What specific features do you love ELSE What would make this tool better for you}}?
TEXT

# Advanced Features

## Computed Logic
**Computed Variables:** Use COMPUTE: name = expression to calculate values
**Conditional Options:** Add - SHOW_IF: condition after specific options
**Page Conditions:** Add SHOW_IF: condition after page titles

COMPUTE: is_interested = interests == Question design OR interests == Logic and branching
COMPUTE: high_rating = rating >= 8

Q: Advanced features you'd like to see:
- Multi-language support
- API integration
  - SHOW_IF: high_rating
- Advanced analytics
  - SHOW_IF: is_interested
- Other
  - TEXT
CHECKBOX

# Complete!
SHOW_IF: rating >= 5

## Thanks {user_name}!
{{IF high_rating THEN You're clearly a survey expert ELSE Thanks for trying this out}}!

**What you learned:**
- Pages (#) and sections (##)
- Question types: TEXT, ESSAY, NUMBER, CHECKBOX, Multiple Choice
- Variables: VARIABLE: name and {name}
- Conditions: SHOW_IF: condition
- Conditional text: {{IF condition THEN text ELSE text}}
- Computed variables: COMPUTE: name = expression

**Try the section navigator** (menu icon, top-right) to jump between sections and see your responses!

Q: Ready to create your own survey?
- Definitely!
- Need more practice
- Just exploring`