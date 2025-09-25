export const BASIC_SAMPLE_TEXT = `# **Survey Tool Evaluation**

## About This Survey
Help us improve our survey creation tool by sharing your experience using it.

Q: How long have you been using this survey tool?
- Just started today
- A few days
- About a week
- Several weeks or more

Q: How many surveys have you created so far?
NUMBER

#

Q: Which types of questions do you use in your surveys?
HINT: Select all that apply
- Multiple choice questions
- Checkbox questions
- Text/essay questions
- Number questions
- Matrix questions
CHECKBOX`

export const INTERMEDIATE_SAMPLE_TEXT = `# **Survey Tool Evaluation**

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
- Very difficult`

export const ADVANCED_SAMPLE_TEXT = `BLOCK: User Background

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

COMPUTE: experienced_user = usage_time IS Several weeks or more AND surveys_created >= 3

BLOCK: Feature Feedback
SHOW_IF: features_tried

#

We'd like detailed feedback on the features you've used.

Q: {{IF experienced_user THEN As an experienced user ELSE As someone still learning}}, what would help you most?
- Better documentation
- More examples
- Video tutorials
- Simplified syntax

BLOCK: Overall Assessment
SHOW_IF: experienced_user

# **Advanced User Feedback**

Q: Would you recommend this tool to others?
- Yes
- No
VARIABLE: recommend

Q: You've created {surveys_created} surveys so far. {{IF recommend IS Yes THEN Thank you for being willing to recommend our tool! ELSE We hope we can improve your experience.}} What's the most important improvement we could make?
ESSAY

BLOCK: Final Page

# **Thank You**

Thank you for taking the time to complete our survey! Your feedback helps us improve the survey creation tool and make it better for everyone.

{{IF recommend IS Yes THEN We appreciate your willingness to recommend the tool to others. ELSE The improvements you've suggesed will be used to improve the tool.}}

Your responses have not been recorded, because that's not what this tool does.`
