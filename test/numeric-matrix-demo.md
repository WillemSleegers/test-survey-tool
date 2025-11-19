# Numeric Matrix Questions Demo

This document demonstrates the numeric matrix question feature with optional column totals.

# Example 1: Budget Allocation with Totals

## Syntax

```
Q: Allocate your quarterly budget across departments (in thousands)
HINT: Enter the amount in $1000s for each quarter
- Q: Marketing
- Q: Engineering
- Q: Operations
- Q: Customer Support
- Q1
- Q2
- Q3
- Q4
NUMBER
TOTAL_LABEL: Quarterly Total
```

## Rendered Example

Q: Allocate your quarterly budget across departments (in thousands)
HINT: Enter the amount in $1000s for each quarter

- Q: Marketing
- Q: Engineering
- Q: Operations
- Q: Customer Support
- Q1
- Q2
- Q3
- Q4
  NUMBER
  TOTAL_LABEL: Quarterly Total

# Example 2: Time Tracking Without Totals

This example shows numeric matrix without a total row (by omitting `TOTAL_LABEL`).

## Syntax

```
Q: Rate your time spent on each activity (hours per week)
- Q: Meetings
- Q: Coding
- Q: Code Review
- Q: Documentation
- This Week
- Last Week
- Two Weeks Ago
NUMBER
```

## Rendered Example

Q: Rate your time spent on each activity (hours per week)

- Q: Meetings
- Q: Coding
- Q: Code Review
- Q: Documentation
- This Week
- Last Week
- Two Weeks Ago
  NUMBER

# Example 3: Sales Targets with Custom Label

This example uses a different total label to match the domain.

## Syntax

```
Q: Set monthly sales targets by region (in units)
HINT: Enter target number of units to sell
- Q: North America
- Q: Europe
- Q: Asia Pacific
- January
- February
- March
NUMBER
TOTAL_LABEL: Global Target
```

## Rendered Example

Q: Set monthly sales targets by region (in units)
HINT: Enter target number of units to sell

- Q: North America
- Q: Europe
- Q: Asia Pacific
- January
- February
- March
  NUMBER
  TOTAL_LABEL: Global Target

# Example 4: Expense Tracking

This example shows practical use for financial data entry.

## Syntax

```
Q: Enter your business expenses by category
HINT: Enter amounts in dollars
- Q: Travel
- Q: Office Supplies
- Q: Equipment
- Q: Training
- Q: Meals & Entertainment
- January
- February
- March
NUMBER
TOTAL_LABEL: Total Expenses
```

## Rendered Example

Q: Enter your business expenses by category
HINT: Enter amounts in dollars

- Q: Travel
- Q: Office Supplies
- Q: Equipment
- Q: Training
- Q: Meals & Entertainment
- January
- February
- March
  NUMBER
  TOTAL_LABEL: Total Expenses

# Technical Notes

## Response Storage

Each cell in a numeric matrix is stored separately:

- Format: `{subquestionId}_{columnIndex}`
- Example: `Q1_1_0`, `Q1_1_1`, `Q1_1_2` for the first row across three columns
- Values stored as strings (consistent with other number inputs)

## Total Calculation

- Totals are **display-only** and calculated in real-time
- Each column is summed independently
- Empty cells are treated as zero
- Totals update automatically as users enter values
- Format: Shows 2 decimal places (e.g., "150.00")

## Syntax Rules

1. Matrix rows must use `- Q:` prefix
2. Column headers use regular `- Option` syntax
3. `NUMBER` keyword must come after all matrix rows and columns
4. `TOTAL_LABEL:` is optional and must come after `NUMBER`
5. If `TOTAL_LABEL:` is omitted, no total row is displayed

## Styling

- Total row has a distinct background (`bg-muted/50`)
- Total row uses bold text (`font-semibold`)
- Label appears in the left column
- Column totals are center-aligned
- Consistent with other matrix question styling
