# Breakdown with Custom Subtotal

Q: Budget with custom calculation

- HEADER: Income
- Salary
  VARIABLE: salary
- Bonus
  VARIABLE: bonus
- SUBTOTAL: Total Income
  CUSTOM: {{salary + bonus}}
- SEPARATOR
- HEADER: Expenses
- Rent
  VARIABLE: rent
- Food
  VARIABLE: food
- SUBTOTAL: Total Expenses
  CUSTOM: {{rent + food}}
- SEPARATOR
- Net Income
  VALUE: {{salary + bonus - rent - food}}
  EXCLUDE
  BREAKDOWN
  TOTAL: Balance
  PREFIX: $
