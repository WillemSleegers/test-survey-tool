export const SAMPLE_TEXT = `# Personal Information

## Basic Details
Please answer the following questions about yourself.

Q1: What is your name?
TEXT

Q2: What is your age?
- Under 18
- 18-25
- Over 25

# Interests & Preferences

## Your Interests
Now let's learn about your preferences.

Q3: What is your name?
TEXT
VARIABLE: user_name

Q4: Hello {user_name}, what are your interests?
HINT: Select all that apply
- Sports
- Music
- Technology
CHECKBOX
VARIABLE: user_interests

Q5: Do you like programming?
- Yes
- No
SHOW_IF: user_interests == Technology

# Advanced Features

## Technical Skills
This section demonstrates advanced conditional logic.

Q6: What is your name?
TEXT
VARIABLE: name

Q7: What is your age?
NUMBER
VARIABLE: age

Q8: Hello {name}, what are your interests?
HINT: Select all that apply
- Sports
- Music
- Technology
CHECKBOX
VARIABLE: interests

# Advanced Logic
COMPUTE: is_adult = age >= 18
COMPUTE: likes_tech = interests == Technology

Q9: What programming languages do you know?
- Basic scripting
- JavaScript
  - SHOW_IF: is_adult
- Advanced frameworks
  - SHOW_IF: likes_tech AND is_adult
VARIABLE: programming

# Advanced Topics
SHOW_IF: is_adult AND likes_tech

## Expert Level
This page only appears for adults interested in technology.

Q10: {{IF likes_tech THEN As a tech enthusiast ELSE As someone interested in tech}}, what's your experience level?
- Beginner
- Intermediate  
- Expert
VARIABLE: experience

Q11: Which development areas interest you most?
HINT: Select your top interests
- Web Development
- Mobile Apps
- Data Science
  - SHOW_IF: programming
- Machine Learning
  - SHOW_IF: programming
CHECKBOX
VARIABLE: dev_areas`
