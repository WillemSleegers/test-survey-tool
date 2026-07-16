# Fruit Preferences
NAVIGATION: 1

Q: Which fruits do you eat regularly?
- Apples
- Bananas
- Oranges
- Grapes
CHECKBOX
VARIABLE: fruits

# Apples
NAVIGATION: 1
SHOW_IF: fruits == "Apples"

Q: How many apples do you eat per week?
NUMBER
VARIABLE: apples_per_week

# Bananas
NAVIGATION: 1
SHOW_IF: fruits == "Bananas"

Q: How many bananas do you eat per week?
NUMBER
VARIABLE: bananas_per_week

# Oranges
NAVIGATION: 1
SHOW_IF: fruits == "Oranges"

Q: How many oranges do you eat per week?
NUMBER
VARIABLE: oranges_per_week

# Grapes
NAVIGATION: 1
SHOW_IF: fruits == "Grapes"

Q: How many grapes do you eat per week?
NUMBER
VARIABLE: grapes_per_week

# Thank You
NAVIGATION: 1

Thanks for sharing your fruit preferences with us!
