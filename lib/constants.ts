export const SAMPLE_TEXT = `# **This is a page header**
This text appears at the top of the first page. Each # symbol creates a new page in your survey.

Q1: What is your name?
HINT: This gray text below questions is optional - it provides additional context
TEXT
VARIABLE: name

Q2: Which color do you prefer?
HINT: Pick your favorite from the options below
- Red
- Blue
- Green
- Yellow
VARIABLE: color

# **Page Two: More Questions**
SHOW_IF: color
COMPUTE: has_name = name
COMPUTE: is_adult = age >= 18

Welcome back, {name}! Since you chose {color}, let's continue with more questions.

## **This is a subsection header**
Subsections (##) create headers within the same page - they don't create new pages.

Q3: How old are you?
HINT: Enter your age as a number
NUMBER
VARIABLE: age

#

Q4: {{IF is_adult THEN As an adult ELSE As someone under 18}}, what activities do you enjoy?
HINT: This question text changes based on computed variables. Select all that apply
- Reading
- Sports
- Music
- Gaming
- Cooking
CHECKBOX
VARIABLE: activities

Q5: How would you rate your experience with {color} items?
HINT: Rate from 1-5, where 5 is the highest
- 1 (Poor)
- 2 (Fair) 
- 3 (Good)
- 4 (Very Good)
- 5 (Excellent)
VARIABLE: rating

## **Advanced Features Demo**

Q6: {{IF rating >= 4 THEN Since you rated {color} highly ELSE Given your {rating} rating}}, would you recommend {color} to others?
HINT: This question appears conditionally based on your previous answers
- Definitely yes
- Probably yes
- Not sure
- Probably no
- Definitely no
VARIABLE: recommend
SHOW_IF: is_adult OR age >= 13

Q7: Tell us more about your {color} preference:
HINT: This is a text area for longer responses
TEXT
VARIABLE: explanation

# **Conditional Page**
SHOW_IF: recommend == "Definitely yes" OR recommend == "Probably yes"
COMPUTE: would_recommend = recommend == "Definitely yes" OR recommend == "Probably yes"
COMPUTE: likes_color = rating >= 4

This entire page only appears if you said you'd recommend {color} to others!

Q8: {{IF likes_color THEN What specific aspects of {color} would you highlight ELSE What aspects of {color} could be improved}}?
HINT: {{IF would_recommend THEN Since you'd recommend it, tell us what makes it special ELSE Help us understand what could be better}}
- Visual appeal
- Versatility
- Personal meaning
- Popular choice
- Other reasons
CHECKBOX

Q9: Any final thoughts about {color}?
HINT: Optional - share anything else you'd like to say
TEXT

# **Advanced User Section**
SHOW_IF: age >= 25

This section only appears for users 25 and older. Notice how all questions below inherit this condition automatically - no need to repeat "SHOW_IF: age >= 25" on each question!

Q10: What's your professional experience with {color}?
HINT: Since you're 25+, tell us about work experience
- 0-2 years
- 3-5 years  
- 6-10 years
- 10+ years
VARIABLE: work_experience

Q11: Would you consider {color} for business use?
HINT: Professional perspective on {color}
- Definitely
- Probably
- Not sure
- Probably not
- Definitely not
VARIABLE: business_use

Q12: Rate {color}'s versatility in professional settings
HINT: Scale of 1-5 for professional applications
- 1 (Very Limited)
- 2 (Limited)
- 3 (Moderate)
- 4 (High)
- 5 (Excellent)
VARIABLE: professional_rating

# **Summary Page**
Thank you, {name}! Here's what you told us:

## **Your Responses:**
- **Name:** {name}
- **Favorite Color:** {color}
- **Age:** {age} years old
- **Activities:** {activities}
- **Rating:** {rating}/5 for {color} items
- **Would Recommend:** {{IF recommend THEN {recommend} ELSE Not answered}}

{{IF is_adult THEN As an adult ELSE As a young person}} who enjoys {activities}, your {color} preference makes sense!

Q10: How easy was this survey format to understand?
HINT: Rate the clarity of the text-based format
- Very easy
- Easy
- Moderate
- Difficult
- Very difficult

Q11: Would you use this tool to create your own surveys?
- Definitely
- Probably
- Maybe
- Probably not
- Definitely not`
