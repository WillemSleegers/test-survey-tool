export const SAMPLE_TEXT = `# **This is a page header**
This text appears at the top of the first page. Each # symbol creates a new page in your survey.

Q1: What is your name?
<This gray text below questions is optional - it provides additional context>
TEXT
VARIABLE: name

Q2: Which color do you prefer?
<Pick your favorite from the options below>
- Red
- Blue
- Green
- Yellow
VARIABLE: color

# **Page Two: More Questions**
SHOW_IF: color != ""

Welcome back, {name}! Since you chose {color}, let's continue with more questions.

## **This is a subsection header**
Subsections (##) create headers within the same page - they don't create new pages.

Q3: How old are you?
<Enter your age as a number>
NUMBER
VARIABLE: age

#

Q4: {{age >= 18|As an adult|As someone under 18}}, what activities do you enjoy?
<This question text changes based on your age. Select all that apply>
- Reading
- Sports
- Music
- Gaming
- Cooking
CHECKBOX
VARIABLE: activities

Q5: How would you rate your experience with {color} items?
<Rate from 1-5, where 5 is the highest>
- 1 (Poor)
- 2 (Fair) 
- 3 (Good)
- 4 (Very Good)
- 5 (Excellent)
VARIABLE: rating

## **Advanced Features Demo**

Q6: {{rating >= 4|Since you rated {color} highly|Given your {rating} rating}}, would you recommend {color} to others?
<This question appears conditionally based on your previous answers>
- Definitely yes
- Probably yes
- Not sure
- Probably no
- Definitely no
VARIABLE: recommend
SHOW_IF: age >= 13

Q7: Tell us more about your {color} preference:
<This is a text area for longer responses>
TEXT
VARIABLE: explanation

# **Conditional Page**
SHOW_IF: recommend == "Definitely yes" || recommend == "Probably yes"

This entire page only appears if you said you'd recommend {color} to others!

Q8: What specific aspects of {color} would you highlight?
<Since you'd recommend it, tell us what makes it special>
- Visual appeal
- Versatility
- Personal meaning
- Popular choice
- Other reasons
CHECKBOX

Q9: Any final thoughts about {color}?
<Optional - share anything else you'd like to say>
TEXT

# **Advanced User Section**
SHOW_IF: age >= 25

This section only appears for users 25 and older. Notice how all questions below inherit this condition automatically - no need to repeat "SHOW_IF: age >= 25" on each question!

Q10: What's your professional experience with {color}?
<Since you're 25+, tell us about work experience>
- 0-2 years
- 3-5 years  
- 6-10 years
- 10+ years
VARIABLE: work_experience

Q11: Would you consider {color} for business use?
<Professional perspective on {color}>
- Definitely
- Probably
- Not sure
- Probably not
- Definitely not
VARIABLE: business_use

Q12: Rate {color}'s versatility in professional settings
<Scale of 1-5 for professional applications>
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
- **Would Recommend:** {{recommend == ""|Not answered|{recommend}}}

{{age >= 18|As an adult|As a young person}} who enjoys {activities}, your {color} preference makes sense!

Q10: How easy was this survey format to understand?
<Rate the clarity of the text-based format>
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
