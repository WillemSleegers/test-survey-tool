# SUBTOTAL with HINT and REVEAL Test

This example demonstrates using HINT and REVEAL on SUBTOTAL rows.

Q: Quarterly Revenue Breakdown

- Product Sales
- Service Revenue
- SUBTOTAL: Operating Revenue
- HINT: This includes all revenue from primary business operations
- REVEAL: Operating revenue is calculated before deducting any operating expenses or other costs
- VARIABLE: operating_revenue
- SEPARATOR
- Interest Income
- Investment Gains
- SUBTOTAL: Non-Operating Revenue
- HINT: Revenue from secondary sources
- REVEAL: Non-operating revenue includes all income not directly related to core business activities, such as interest earned on cash reserves and gains from investment portfolios
- VARIABLE: non_operating_revenue
- SEPARATOR
- SUBTOTAL: Total Revenue
- CUSTOM: {{operating_revenue + non_operating_revenue}}
- HINT: Sum of all revenue sources
- REVEAL: This is the total revenue figure that will be used to calculate profit margins and other financial metrics
  BREAKDOWN
  PREFIX: $
  SUFFIX: k
