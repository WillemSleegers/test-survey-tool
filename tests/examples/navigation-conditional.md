# Screening
NAVIGATION: 1

Q: Do you own a car?
- Yes
- No
VARIABLE: owns_car

# Car Details
NAVIGATION: 1
SHOW_IF: owns_car == "Yes"

Q: What make is your car?
TEXT
VARIABLE: car_make

Q: What model is your car?
TEXT
VARIABLE: car_model

# Wrap-Up
NAVIGATION: 1

Q: Any final comments?
ESSAY
