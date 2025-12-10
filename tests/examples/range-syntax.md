# RANGE Syntax Examples

Q: How satisfied are you with our service?
RANGE: 1-10
VARIABLE: satisfaction

Q: Which ratings apply to this product? (select all that apply)
RANGE: 1-5
CHECKBOX
VARIABLE: product_ratings

Q: Please rate the following aspects:
- Q: Service quality
  - VARIABLE: service_quality
- Q: Response time
  - VARIABLE: response_time
- Q: Overall experience
  - VARIABLE: overall_experience
RANGE: 1-7

Q: Rate the temperature preference
RANGE: -5-5
VARIABLE: temperature

Q: How likely are you to recommend us? (Net Promoter Score)
RANGE: 0-10
VARIABLE: nps_score
