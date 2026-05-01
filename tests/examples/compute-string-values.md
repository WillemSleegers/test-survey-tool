# Employee Survey

BLOCK: Questions

# Work Environment

Q: How satisfied are you with your work environment? (1-10)
NUMBER
VARIABLE: env_score

Q: How satisfied are you with your work-life balance? (1-10)
NUMBER
VARIABLE: balance_score

Q: How satisfied are you with your compensation? (1-10)
NUMBER
VARIABLE: comp_score

BLOCK: Results
COMPUTE: overall = env_score + balance_score + comp_score
COMPUTE: overall_label = IF overall >= 24 THEN "Excellent" ELSE IF overall >= 15 THEN "Good" ELSE "Needs improvement"

# Your Results
COMPUTE: env_level = "Low"
COMPUTE: env_level = IF env_score >= 5 THEN "Medium"
COMPUTE: env_level = IF env_score >= 8 THEN "High"

COMPUTE: balance_level = IF balance_score >= 8 THEN "High" ELSE IF balance_score >= 5 THEN "Medium" ELSE "Low"

COMPUTE: comp_level = IF comp_score >= 8 THEN "High" ELSE "Low"

Here is a summary of your responses:

Work environment satisfaction: **{env_level}**
Work-life balance satisfaction: **{balance_level}**
Compensation satisfaction: **{comp_level}**

Overall score: **{overall}** out of 30 — **{overall_label}**

Q: What would most improve your experience at work?
ESSAY
VARIABLE: improvement_suggestion
SHOW_IF: overall_label == Needs improvement
