export const SAMPLE_TEXT = `# **Developer Background Survey**
Welcome! This survey helps us understand the software development community better.

Q1: What is your primary role in software development?
<Choose the option that best describes your current position>
- Frontend Developer
- Backend Developer
- Full-Stack Developer
- DevOps Engineer
- Data Scientist
- Mobile Developer
- Other
VARIABLE: role

# 

Q2: How many years of professional coding experience do you have?
<Count only paid professional experience>
- Less than 1 year
- 1-2 years
- 3-5 years
- 6-10 years
- More than 10 years
VARIABLE: experience
SHOW_IF: role != Other

Q3: Which programming languages do you use regularly?
<Select all languages you use at least monthly>
- JavaScript/TypeScript
- Python
- Java
- C#
- Go
- Rust
- PHP
- Other
CHECKBOX
VARIABLE: languages

Q4: How many projects are you currently working on?
<Include both personal and professional projects>
NUMBER
VARIABLE: project_count

Q5: What is your biggest challenge as a {role}?
<Please be specific and provide examples>
TEXT
VARIABLE: challenge

# **Work Environment**
Let's explore your current work situation as a {role}.

## **Team Dynamics**
Understanding how you work with others.

Q6: How large is your development team?
<Count only direct team members, not the entire department>
NUMBER
VARIABLE: team_size

Q7: Rate your team collaboration (1-10):
<1 = poor collaboration, 10 = excellent collaboration>
- 1-2 (Poor)
- 3-4 (Below average)
- 5-6 (Average)
- 7-8 (Good)
- 9-10 (Excellent)
VARIABLE: collaboration_rating

Q8: {{team_size >= 5|With your larger team|With your smaller team}}, what collaboration tools do you use?
<Select all that apply to your current workflow>
- Slack/Discord
- Microsoft Teams
- Zoom/Meet
- GitHub/GitLab
- Jira/Linear
- Notion/Confluence
- Other
CHECKBOX
SHOW_IF: collaboration_rating >= 5

## Development Practices
Your approach to coding and project management.

Q9: How often do you practice code reviews?
<Consider your typical work week>
- Never
- Rarely (monthly)
- Sometimes (weekly)
- Regularly (daily)
- Always (every commit)
VARIABLE: code_review_frequency

Q10: {{code_review_frequency == Always|Since you always do code reviews|Given your code review habits}}, how valuable do you find them?
<Rate the impact on code quality and team learning>
- Extremely valuable
- Very valuable
- Somewhat valuable
- Not very valuable
- Waste of time
SHOW_IF: code_review_frequency != Never

Q11: What development methodology does your team follow?
<Choose the primary methodology if you use multiple>
- Agile/Scrum
- Kanban
- Waterfall
- No formal methodology
- Other
VARIABLE: methodology

# Career Growth
Your thoughts on professional development as a {role}.

Q12: {{experience == Less than 1 year|As someone new to the field|With your {experience} of experience}}, what skills do you want to develop next?
<Describe your top 2-3 learning priorities>
TEXT
VARIABLE: learning_goals

Q13: Would you recommend a career in software development to others?
<Think about someone with similar interests and aptitude>
- Definitely yes
- Probably yes
- Not sure
- Probably no
- Definitely no
VARIABLE: recommend_career
SHOW_IF: experience != Less than 1 year

Q14: What advice would you give to someone starting as a {role}?
<Share your most important insights for beginners>
TEXT
SHOW_IF: recommend_career == Definitely yes || recommend_career == Probably yes

# Summary
Thank you for sharing your experience! You work with {{languages == JavaScript/TypeScript|JavaScript/TypeScript|{languages}}} as a {role} and {{team_size >= 5|collaborate with a larger team|work with a smaller team}} of {team_size} people.

## Your Profile:
- Role: {role}
- Experience: {experience}
- Team size: {team_size} people
- Current challenge: {challenge}
- Learning goals: {learning_goals}

Q15: Any final thoughts about your journey as a {role}?
<Optional - share anything else you'd like the community to know>
TEXT`
