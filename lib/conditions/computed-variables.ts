import { Page, Responses, ComputedVariables, ComputedVariable } from "@/lib/types"
import { evaluateCondition } from "./condition-evaluator"
import { evaluateExpression, isArithmeticExpression } from "./expression-evaluator"

/**
 * Checks if an expression contains comparison operators, making it a boolean condition
 * rather than a pure arithmetic expression
 * 
 * @param expression - The expression to check
 * @returns True if the expression contains comparison operators (>, <, >=, <=, ==, !=)
 */
function isComparisonExpression(expression: string): boolean {
  const trimmed = expression.trim()
  // Check for comparison operators or wildcard patterns
  return /[><=!]=?|[><]/.test(trimmed) || trimmed.includes('*')
}

/**
 * Evaluates all computed variables for a given page
 * 
 * Supports both boolean and numeric computed variables:
 * - Boolean: "age >= 18" -> true/false
 * - Numeric: "count + 5" -> number
 * - Ternary: "age >= 18 ? 1 : 0" -> number (1 or 0)
 * 
 * @param page - The page containing computed variables
 * @param responses - Current user responses
 * @returns Object mapping computed variable names to their evaluated values
 */
export function evaluateComputedVariables(
  page: Page,
  responses: Responses,
  existingComputedVariables?: ComputedVariables
): ComputedVariables {
  // Start with existing computed variables (e.g., from block level)
  const computedVars: ComputedVariables = { ...existingComputedVariables }
  
  // Sort computed variables to handle dependencies
  // Variables that depend on other computed variables should be evaluated after their dependencies
  const sortedVariables = topologicalSort(page.computedVariables)
  
  for (const computedVar of sortedVariables) {
    try {
      // Create a responses object that includes computed variables evaluated so far
      const extendedResponses = createExtendedResponses(responses, computedVars)
      
      // Determine if this is a pure arithmetic expression (numeric) or a condition (boolean)
      let result: boolean | number
      
      if (isComparisonExpression(computedVar.expression)) {
        // Expression contains comparison operators, evaluate as boolean condition
        result = evaluateCondition(computedVar.expression, extendedResponses)
      } else if (isArithmeticExpression(computedVar.expression)) {
        // Pure arithmetic expression, evaluate as numeric
        result = evaluateExpression(computedVar.expression, extendedResponses)
      } else {
        // Simple condition (variable name, etc.), evaluate as boolean
        result = evaluateCondition(computedVar.expression, extendedResponses)
      }
      
      computedVars[computedVar.name] = result
      
      // Store the evaluated value for debugging purposes
      computedVar.value = result
    } catch (error) {
      // If evaluation fails, default to false for conditions or 0 for arithmetic
      console.warn(`Failed to evaluate computed variable "${computedVar.name}": ${error}`)
      const defaultValue = isArithmeticExpression(computedVar.expression) ? 0 : false
      computedVars[computedVar.name] = defaultValue
      computedVar.value = defaultValue
    }
  }
  
  return computedVars
}

/**
 * Creates an extended responses object that includes computed variables as pseudo-responses
 * This allows computed variables to be referenced in conditions just like regular variables
 */
function createExtendedResponses(
  responses: Responses,
  computedVars: ComputedVariables
): Responses {
  const extended = { ...responses }
  
  // Add computed variables as pseudo-responses
  Object.entries(computedVars).forEach(([name, value]) => {
    // Create a synthetic question ID for the computed variable
    const pseudoQuestionId = `__computed_${name}`
    extended[pseudoQuestionId] = {
      value: value,
      variable: name
    }
  })
  
  return extended
}

/**
 * Simple topological sort for computed variables to handle dependencies
 * This ensures that variables are evaluated in the correct order
 */
function topologicalSort(variables: ComputedVariable[]): ComputedVariable[] {
  // For now, we'll use a simple approach: variables that reference other computed variables
  // should be evaluated after the variables they reference
  
  const graph: Map<string, string[]> = new Map()
  const inDegree: Map<string, number> = new Map()
  
  // Initialize
  variables.forEach(v => {
    graph.set(v.name, [])
    inDegree.set(v.name, 0)
  })
  
  // Build dependency graph
  variables.forEach(variable => {
    const dependencies = extractVariableReferences(variable.expression)
    dependencies.forEach(dep => {
      if (graph.has(dep)) {
        // dep -> variable.name (dep must be evaluated before variable.name)
        graph.get(dep)!.push(variable.name)
        inDegree.set(variable.name, (inDegree.get(variable.name) || 0) + 1)
      }
    })
  })
  
  // Kahn's algorithm
  const queue: string[] = []
  const result: ComputedVariable[] = []
  
  // Find variables with no dependencies
  inDegree.forEach((degree, name) => {
    if (degree === 0) {
      queue.push(name)
    }
  })
  
  while (queue.length > 0) {
    const current = queue.shift()!
    const variable = variables.find(v => v.name === current)
    if (variable) {
      result.push(variable)
    }
    
    // Process neighbors
    const neighbors = graph.get(current) || []
    neighbors.forEach(neighbor => {
      const newDegree = (inDegree.get(neighbor) || 0) - 1
      inDegree.set(neighbor, newDegree)
      if (newDegree === 0) {
        queue.push(neighbor)
      }
    })
  }
  
  // If we couldn't sort all variables, there might be a circular dependency
  // In that case, just return the original order
  if (result.length !== variables.length) {
    console.warn("Possible circular dependency in computed variables, using original order")
    return variables
  }
  
  return result
}

/**
 * Extracts variable references from an expression
 * This is a simple implementation that looks for word patterns that could be variable names
 */
function extractVariableReferences(expression: string): string[] {
  const variables: Set<string> = new Set()
  
  // Simple regex to find potential variable names
  // This matches word sequences that could be variable names
  const variablePattern = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g
  let match
  
  while ((match = variablePattern.exec(expression)) !== null) {
    const word = match[0]
    // Skip keywords and operators
    if (!isKeywordOrOperator(word)) {
      variables.add(word)
    }
  }
  
  return Array.from(variables)
}

/**
 * Checks if a word is a keyword or operator that shouldn't be treated as a variable
 */
function isKeywordOrOperator(word: string): boolean {
  const keywords = new Set([
    'AND', 'OR', 'NOT', 'IS', 'THEN', 'ELSE', 'IF',
    'true', 'false', 'null', 'undefined'
  ])
  
  return keywords.has(word.toUpperCase())
}