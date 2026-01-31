# Section Conditional Visibility Test

This test demonstrates SHOW_IF on sections.
Select "Yes" below to reveal the Team Management section.

Q: Are you a manager?
- Yes
- No
VARIABLE: is_manager

## **Team Management**
SHOW_IF: is_manager == Yes

These questions are only relevant for managers.

Q: How many direct reports do you have?
NUMBER
VARIABLE: direct_reports

Q: How often do you hold one-on-ones?
- Weekly
- Biweekly
- Monthly
- Rarely

## **General Feedback**

Q: How satisfied are you with your role?
- Very satisfied
- Satisfied
- Neutral
- Dissatisfied
