export const BASIC_SURVEY = `# **Survey Tool Evaluation**

## **About This Survey**
Help us improve our survey creation tool by sharing your experience using it.

Q: How did you first learn about this survey tool?
- Online search
- Recommendation from colleague
- Social media
- Documentation or tutorial
- Other

Q: Which features have you tried so far?
HINT: *Select all that apply*
- Creating **basic surveys**
- Using conditional logic
- Adding computed variables
- Testing surveys with others
CHECKBOX

Q: On a scale of 1-10, how easy was it to create your first survey?
NUMBER

Q: What has been your **biggest challenge** or frustration with the tool?
ESSAY`

export const INTERMEDIATE_SURVEY = `# **Survey Tool Evaluation**

## **About This Survey**
Help us improve our survey creation tool by sharing your experience using it.

Q: How did you first learn about this survey tool?
- Online search
- Recommendation from colleague
- Social media
- Documentation or tutorial
- Other
VARIABLE: discovery_method

Q: Which features have you tried so far?
HINT: *Select all that apply*
- Creating **basic surveys**
- Using conditional logic
- Adding computed variables
- Testing surveys with others
CHECKBOX
VARIABLE: features_tried

Q: On a scale of 1-10, how easy was it to create your first survey?
NUMBER
VARIABLE: ease_rating

Q: What has been your **biggest challenge** or frustration with the tool?
ESSAY
VARIABLE: main_challenge

#

## Follow-up Questions

Since you discovered us through {discovery_method}, we'd like to know more about your experience.

Q: {{IF ease_rating >= 8 THEN Given your positive experience ELSE To help improve your experience}}, what would be most helpful?
- Better documentation
- More example templates
- Video tutorials
- Live support chat
VARIABLE: preferred_help

Q: Would you recommend this tool to a colleague?
HINT: *Based on your rating of {ease_rating}/10*
- Definitely yes
- Probably yes
- Not sure
- Probably not
- Definitely not
SHOW_IF: ease_rating`

export const ADVANCED_SURVEY = `BLOCK: Initial Assessment

# **Survey Tool Evaluation**

## **About This Survey**
Help us improve our survey creation tool by sharing your experience using it.

Q: How did you first learn about this survey tool?
- Online search
- Recommendation from colleague
- Social media
- Documentation or tutorial
- Other
VARIABLE: discovery_method

Q: Which features have you tried so far?
HINT: *Select all that apply*
- Creating **basic surveys**
- Using conditional logic
- Adding computed variables
- Testing surveys with others
CHECKBOX
VARIABLE: features_tried

Q: On a scale of 1-10, how easy was it to create your first survey?
NUMBER
VARIABLE: ease_rating

Q: What has been your **biggest challenge** or frustration with the tool?
ESSAY
VARIABLE: main_challenge

COMPUTE: satisfied_user = ease_rating >= 7
COMPUTE: experienced_user = features_tried >= 2

BLOCK: Follow-up Questions

#

## Follow-up Questions

Since you discovered us through {discovery_method}, we'd like to know more about your experience.

Q: {{IF ease_rating >= 8 THEN Given your positive experience ELSE To help improve your experience}}, what would be most helpful?
- Better documentation
- More example templates
- Video tutorials
- Live support chat
VARIABLE: preferred_help

Q: Would you recommend this tool to a colleague?
HINT: *Based on your rating of {ease_rating}/10*
- Definitely yes
- Probably yes
- Not sure
- Probably not
- Definitely not
SHOW_IF: ease_rating
VARIABLE: recommendation

BLOCK: Detailed Feedback
SHOW_IF: satisfied_user

#

## **Additional Feedback**

{{IF satisfied_user THEN Thank you for your positive feedback! ELSE We appreciate your honest feedback.}} We'd love to learn more.

Q: How likely are you to use this tool for future projects?
- Very likely
- Somewhat likely
- Not sure
- Unlikely
- Very unlikely

Q: You mentioned {features_tried AS INLINE_LIST} as features you've tried. Which was most valuable?
- Creating **basic surveys**
  - SHOW_IF: features_tried IS Creating **basic surveys**
- Using conditional logic
  - SHOW_IF: features_tried IS Using conditional logic
- Adding computed variables
  - SHOW_IF: features_tried IS Adding computed variables
- Testing surveys with others
  - SHOW_IF: features_tried IS Testing surveys with others

BLOCK: Final Thoughts
SHOW_IF: experienced_user OR recommendation IS Definitely yes

# **Thank You**

{{IF experienced_user THEN As an experienced user ELSE Based on your willingness to recommend us}}, your insights are especially valuable.

Q: What's the **one thing** we could improve that would make the biggest difference?
ESSAY`

