# Option HINT/TOOLTIP/REVEAL Test

This example demonstrates HINT, TOOLTIP, and REVEAL on individual multiple choice and checkbox options.

Q: What is your employment status?
- Full-time
  - HINT: 32 or more hours per week
- Part-time
  - HINT: Fewer than 32 hours per week
- Self-employed
  - TOOLTIP: Includes freelance and contract work
- Not currently employed
  - REVEAL: We ask this to skip employer-related questions later in the survey

Q: Which of these benefits do you use?
- Health insurance
  - HINT: Includes dental and vision
- Retirement plan
  - TOOLTIP: Employer-matched contributions up to 4%
- Paid parental leave
  - REVEAL: """
Applies to births, adoptions, and foster placements.

Eligibility starts after 90 days of continuous employment.
"""
- None of the above
  - EXCLUSIVE
CHECKBOX
