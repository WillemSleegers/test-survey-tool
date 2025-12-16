# Monthly Budget Breakdown

Q: Please enter your monthly expenses in each category:
BREAKDOWN
PREFIX: $

- Housing (rent/mortgage)
  - VARIABLE: housing
- Utilities
  - VARIABLE: utilities
- Groceries
  - VARIABLE: groceries
- Transportation
  - VARIABLE: transportation
- Entertainment
  - VARIABLE: entertainment
- Healthcare
  - VARIABLE: healthcare
- Other expenses
  - VARIABLE: other

TOTAL: Total Monthly Expenses

Q: What is your monthly income?
NUMBER
PREFIX: $
VARIABLE: monthly_income

COMPUTE: remaining = monthly_income - Q1_total

Q: Based on your entries, you have ${remaining} remaining after expenses. Does this seem accurate?
- Yes
- No
SHOW_IF: remaining != ""
