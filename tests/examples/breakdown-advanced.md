Q: Profit & loss statement

- HEADER: **Revenue**
- Product sales
- VARIABLE: product_sales
- COLUMN: 1
- Service revenue
- VARIABLE: service_revenue
- COLUMN: 2
- SUBTOTAL: **Total revenue**
- VARIABLE: total_revenue
- COLUMN: 2
- SEPARATOR
- HEADER: **Expenses**
- Cost of goods sold
- VARIABLE: cogs
- COLUMN: 1
- SUBTRACT
- Operating expenses
- COLUMN: 1
- VARIABLE: opex
- SUBTRACT
- SEPARATOR
  PREFIX: €
  TOTAL: **Profit**
  BREAKDOWN
