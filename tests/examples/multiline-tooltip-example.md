# Multi-line Hint Example

This example demonstrates multi-line HINT text at the question level using delimiter syntax.

Q: **What is your total annual revenue?**
TOOLTIP: """
Please include all revenue sources:

- Product sales
- Service revenue
- Licensing fees
- Other income

Round to the nearest thousand dollars.
"""
NUMBER
PREFIX: $
SUFFIX: ,000

Q: **How many full-time employees do you have?**
HINT: Include all employees on your payroll, regardless of location or department.
NUMBER

Q: **What are your primary business challenges?**
TOOLTIP: """
Select all that apply. Consider challenges in:

- **Operations**: Supply chain, logistics, efficiency
- **Finance**: Cash flow, funding, profitability
- **People**: Hiring, retention, training
- **Growth**: Market expansion, product development

"""

- Supply chain issues
- Cash flow management
- Finding qualified talent
- Market competition
- Technology adoption
- Regulatory compliance
  CHECKBOX
