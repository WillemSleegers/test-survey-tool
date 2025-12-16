# Personal Information

Q: What is your name?
TEXT
VARIABLE: name

Q: What is your email address?
TEXT
VARIABLE: email

Q: What is your phone number?
TEXT
VARIABLE: phone

# Work Experience

Q: What is your current employment status?
- Employed full-time
- Employed part-time
- Self-employed
- Unemployed
- Student
- Retired
VARIABLE: employment

Q: What industry do you work in?
TEXT
VARIABLE: industry
SHOW_IF: employment == "Employed full-time" OR employment == "Employed part-time" OR employment == "Self-employed"

Q: How many years of experience do you have?
NUMBER
VARIABLE: years_experience
SHOW_IF: employment == "Employed full-time" OR employment == "Employed part-time" OR employment == "Self-employed"

# Education

Q: What is your highest level of education?
- High school diploma
- Associate degree
- Bachelor's degree
- Master's degree
- Doctoral degree
- Other
VARIABLE: education

Q: What field did you study?
TEXT
VARIABLE: field_of_study
SHOW_IF: education != "High school diploma"

# Additional Information

Q: How did you hear about this opportunity?
TEXT
VARIABLE: referral_source

Q: Is there anything else you would like us to know?
ESSAY
