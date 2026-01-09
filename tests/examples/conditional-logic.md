# Event Registration Form

Q: Will you attend the conference?
- Yes
- No
VARIABLE: attending

Q: Which days will you attend?
- Day 1 (Monday)
- Day 2 (Tuesday)
- Day 3 (Wednesday)
CHECKBOX
VARIABLE: days
SHOW_IF: attending == "Yes"

Q: Do you have any dietary restrictions?
- Yes
- No
VARIABLE: has_dietary
SHOW_IF: attending == "Yes"

Q: Please specify your dietary restrictions
TEXT
VARIABLE: dietary_details
SHOW_IF: has_dietary == "Yes"

Q: Will you need accommodation?
- Yes
- No
VARIABLE: needs_accommodation
SHOW_IF: attending == "Yes"

Q: How many nights?
NUMBER
VARIABLE: nights
SHOW_IF: needs_accommodation == "Yes"

Q: Any additional comments?
ESSAY
