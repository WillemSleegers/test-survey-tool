import { Variables } from "@/lib/types"

/**
 * Evaluates a condition. This is forward-declared to avoid circular imports
 * The actual implementation will be provided by the condition-evaluator
 */
export type ConditionEvaluator = (condition: string, variables: Variables) => boolean

/**
 * Checks if a condition contains NOT operator
 * 
 * @param condition - The condition string to check
 * @returns True if condition starts with NOT
 */
export function hasNotOperator(condition: string): boolean {
  return condition.trim().toUpperCase().startsWith("NOT ")
}

/**
 * Removes the NOT operator from a condition
 * 
 * @param condition - The condition string with NOT
 * @returns The condition without the NOT operator
 */
export function removeNotOperator(condition: string): string {
  return condition.trim().substring(4).trim()
}

/**
 * Checks if a condition contains OR operators
 * 
 * @param condition - The condition string to check
 * @returns True if condition contains OR operators
 */
export function hasOrOperator(condition: string): boolean {
  return condition.toUpperCase().includes(" OR ") || condition.includes("||")
}

/**
 * Splits a condition on OR operators
 * 
 * @param condition - The condition string to split
 * @returns Array of condition parts
 */
export function splitOnOr(condition: string): string[] {
  if (condition.toUpperCase().includes(" OR ")) {
    return condition.split(/\s+OR\s+/i)
  }
  return condition.split("||")
}

/**
 * Checks if a condition contains AND operators
 * 
 * @param condition - The condition string to check
 * @returns True if condition contains AND operators
 */
export function hasAndOperator(condition: string): boolean {
  return condition.toUpperCase().includes(" AND ") || condition.includes("&&")
}

/**
 * Splits a condition on AND operators
 * 
 * @param condition - The condition string to split
 * @returns Array of condition parts
 */
export function splitOnAnd(condition: string): string[] {
  if (condition.toUpperCase().includes(" AND ")) {
    return condition.split(/\s+AND\s+/i)
  }
  return condition.split("&&")
}

/**
 * Evaluates a NOT condition by negating the inner condition result
 * 
 * @param condition - The condition with NOT operator
 * @param variables - The variables object
 * @param evaluateCondition - Function to evaluate the inner condition
 * @returns The negated result
 */
export function evaluateNotCondition(
  condition: string,
  variables: Variables,
  evaluateCondition: ConditionEvaluator
): boolean {
  const innerCondition = removeNotOperator(condition)
  return !evaluateCondition(innerCondition, variables)
}

/**
 * Evaluates an OR condition (returns true if any part is true)
 * 
 * @param condition - The condition with OR operators
 * @param variables - The variables object  
 * @param evaluateCondition - Function to evaluate each part
 * @returns True if any part evaluates to true
 */
export function evaluateOrCondition(
  condition: string,
  variables: Variables,
  evaluateCondition: ConditionEvaluator
): boolean {
  const parts = splitOnOr(condition)
  return parts.some(part => evaluateCondition(part.trim(), variables))
}

/**
 * Evaluates an AND condition (returns true only if all parts are true)
 * 
 * @param condition - The condition with AND operators
 * @param variables - The variables object
 * @param evaluateCondition - Function to evaluate each part  
 * @returns True only if all parts evaluate to true
 */
export function evaluateAndCondition(
  condition: string,
  variables: Variables,
  evaluateCondition: ConditionEvaluator
): boolean {
  const parts = splitOnAnd(condition)
  return parts.every(part => evaluateCondition(part.trim(), variables))
}