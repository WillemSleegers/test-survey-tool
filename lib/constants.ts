export const SAMPLE_TEXT = `
# Welcome Section
Welcome to our survey! Please answer all questions honestly.

This survey is about the following:
- A
- B

Q1: What is your primary role?
- Manager
- Developer
- Designer
- Other
`

export const SAMPLE_TEXT2 = `# Welcome Section
Welcome to our survey! Please answer all questions honestly.

Q1: What is your primary role?
- Manager
- Developer
- Designer
- Other
VARIABLE: role

Q2: How many years of experience do you have as a {role}?
- 0-2 years
- 3-5 years
- 6-10 years
- 10+ years
VARIABLE: experience
SHOW_IF: role != Other

Q3: What is your biggest challenge in your role as {role}?
TEXT_INPUT
VARIABLE: challenge

Q4: How many cars do you own?
NUMBER_INPUT
VARIABLE: cars

Q5: What color {{cars == 1|is your car|are your cars}}?
TEXT_INPUT

Q6: {{cars == 1|Since you have 1 car, what color is it|Since you have {cars} cars, what color is your favorite one}}?
TEXT_INPUT

Q7: Do you prefer driving your {{cars == 1|car|cars}} in the city or countryside?
- City
- Countryside
- Both equally
- Neither - I don't drive much

# Experience Section
Now let's talk about your experience as a {role}.

## Job Satisfaction
Let's explore how satisfied you are with your current position.

Q8: Rate your job satisfaction (1-10):
NUMBER_INPUT
VARIABLE: satisfaction

Q9: {{satisfaction >= 8|Since you're very satisfied|Since you're not fully satisfied}}, what would you change about your role as {role}?
TEXT_INPUT

Q10: How often do you work overtime?
- Never
- Rarely
- Sometimes
- Frequently
- Always

## Career Recommendations
Based on your experience, we'd like your perspective on this career path.

Q11: Would you recommend this career path to others?
- Definitely yes
- Probably yes
- Not sure
- Probably no
- Definitely no
VARIABLE: recommend
SHOW_IF: satisfaction >= 6

Q12: What advice would you give to someone starting as {{role == Manager|a manager|a {role}}}?
TEXT_INPUT
SHOW_IF: recommend == Definitely yes || recommend == Probably yes

# Final Section
Thank you for your responses! {{cars == 1|You have 1 car|You have {cars} cars}} and {{satisfaction >= 8|you're very satisfied|you could be more satisfied}} with your role as {role}.

- Your role: {role}
- Your experience level: {experience}
- Your satisfaction: {satisfaction}/10
- Your biggest challenge: {challenge}

Q13: Any final comments about your experience as a {role}?
TEXT_INPUT`
