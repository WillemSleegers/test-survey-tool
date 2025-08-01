import { Responses } from "@/lib/types"

/**
 * Represents a parsed condition with its components
 */
export interface ParsedCondition {
  leftSide: string
  operator: ComparisonOperator
  rightSide: string
}

/**
 * Supported comparison operators
 */
export type ComparisonOperator = "==" | "!=" | ">=" | "<=" | ">" | "<"

/**
 * Keywords that map to comparison operators
 */
const OPERATOR_KEYWORDS: Record<string, ComparisonOperator> = {
  IS_NOT: "!=",
  IS: "==", 
  GREATER_THAN_OR_EQUAL: ">=",
  LESS_THAN_OR_EQUAL: "<=",
  GREATER_THAN: ">",
  LESS_THAN: "<",
}

/**
 * Normalizes keyword operators to symbols in a condition string
 * 
 * @param condition - The condition string potentially containing keywords
 * @returns The condition string with keywords replaced by symbols
 * 
 * @example
 * normalizeOperators("age IS_NOT 18") // "age != 18"
 * normalizeOperators("experience IS Advanced") // "experience == Advanced"
 */
export function normalizeOperators(condition: string): string {
  let normalized = condition
  
  // Replace keywords with symbols (order matters - IS_NOT before IS)
  for (const [keyword, symbol] of Object.entries(OPERATOR_KEYWORDS)) {
    const regex = new RegExp(`\\s+${keyword}\\s+`, 'gi')
    normalized = normalized.replace(regex, ` ${symbol} `)
  }
  
  return normalized
}

/**
 * Parses a condition string into its components
 * 
 * @param condition - The condition string to parse
 * @returns ParsedCondition object or null if parsing fails
 * 
 * @example
 * parseCondition("age >= 18") // { leftSide: "age", operator: ">=", rightSide: "18" }
 * parseCondition("name IS John") // { leftSide: "name", operator: "==", rightSide: "John" }
 */
export function parseCondition(condition: string): ParsedCondition | null {
  const normalized = normalizeOperators(condition)
  const match = normalized.match(/(.+)\s*(==|!=|>=|<=|>|<)\s*(.+)/)
  
  if (!match) return null
  
  const [, leftSide, operator, rightSide] = match
  
  return {
    leftSide: leftSide.trim(),
    operator: operator as ComparisonOperator,
    rightSide: rightSide.trim(),
  }
}

/**
 * Checks if a condition is a simple boolean test (just a variable name)
 * 
 * @param condition - The condition string to check  
 * @returns True if condition is just a variable name
 * 
 * @example
 * isSimpleBooleanTest("age") // true
 * isSimpleBooleanTest("age >= 18") // false
 */
export function isSimpleBooleanTest(condition: string): boolean {
  return /^\w+$/.test(condition.trim())
}

/**
 * Evaluates a simple boolean condition (variable existence/non-emptiness)
 * 
 * @param variable - The variable name to check
 * @param responses - The responses object
 * @returns True if variable exists and has a non-empty value
 */
export function evaluateSimpleBooleanTest(variable: string, responses: Responses): boolean {
  const responseEntry = Object.values(responses).find(r => r.variable === variable)
  const value = responseEntry?.value
  
  if (value === undefined) return false
  if (value === "") return false
  if (Array.isArray(value) && value.length === 0) return false
  return true
}