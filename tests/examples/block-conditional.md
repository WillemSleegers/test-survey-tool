# Block Conditional Routing Test

This test file demonstrates block-level SHOW_IF conditions.
Block 2 should only appear when the user selects "Yes" in Block 1.

BLOCK: Block 1 - Screening

# Screening Question

Q: Are you interested in providing additional feedback?
- Yes
- No
VARIABLE: wants_feedback

BLOCK: Block 2 - Feedback
SHOW_IF: wants_feedback == "Yes"

# Additional Feedback

Thank you for agreeing to provide feedback!

Q: How would you rate your overall experience?
- Excellent
- Good
- Fair
- Poor
VARIABLE: rating

Q: Please share any additional comments
ESSAY
VARIABLE: comments
