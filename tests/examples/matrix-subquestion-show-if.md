# Matrix with Conditional Subquestions

Q: Do you have children?

- Yes
- No
  VARIABLE: has_children

Q: Please rate your satisfaction with these parenting aspects:

- Q: Work-life balance
  - VARIABLE: work_life_balance
- Q: Daycare quality
  - VARIABLE: daycare_satisfaction
  - SHOW_IF: has_children == "Yes"
- Q: School quality
  - VARIABLE: school_satisfaction
  - SHOW_IF: has_children == "Yes"
- Very Satisfied
- Satisfied
- Neutral
- Unsatisfied
- Very Unsatisfied
