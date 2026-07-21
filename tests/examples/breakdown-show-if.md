# Breakdown with Conditional Row

Q: Do you receive a bonus?

- Yes
- No
  VARIABLE: has_bonus

Q: Monthly income breakdown

- Salary
  - VARIABLE: salary
- Bonus
  - VARIABLE: bonus
  - SHOW_IF: has_bonus == Yes
- Freelance income
  - VARIABLE: freelance
  BREAKDOWN
  PREFIX: €
  TOTAL: Total income

#

SHOW_IF: has_bonus == No

Notice the Bonus row disappeared, and the total no longer counts it.
