# **Survey Tool Evaluation**

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

Q: Which types of questions do you use in your surveys?
HINT: Select all that apply

- Multiple choice questions
- Checkbox questions
- Text/essay questions
- Number questions
- Matrix questions
  CHECKBOX

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

Q: How would you rate each aspect of the survey tool?

- Q: Ease of use
- Q: Documentation quality
- Q: Feature completeness
- Excellent
- Good
- Fair
- Poor

Q: How many hours per month do you spend using different features?
HINT: Enter estimated hours for each feature

- Creating surveys
- Testing surveys
- Analyzing results
  BREAKDOWN
  TOTAL: Total Hours
  SUFFIX:  hrs

#

SHOW_IF: features_tried IS Using conditional logic (SHOW_IF)

Since you've tried conditional logic, we'd love your specific feedback.

Q: You've created {surveys_created} surveys so far. What would help you most?

- Better documentation
- More examples
- Video tutorials
- Simplified syntax

#

Q: Overall, how would you rate the learning curve?

- Very easy to learn
- Somewhat easy
- Moderate difficulty
- Quite difficult
- Very difficult
