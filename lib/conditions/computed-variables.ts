import { Page, Variables, ComputedValues, ComputedVariable } from "@/lib/types"
import { evaluateCondition } from "./condition-evaluator"
import { evaluateExpression, isArithmeticExpression, isIfThenElseExpression, isIfThenExpression, isStringLiteral, parseIfThenElse, parseIfThen, resolveValue } from "./expression-evaluator"

/**
 * Checks if an expression contains comparison operators, making it a boolean condition
 * rather than a pure arithmetic expression
 * 
 * @param expression - The expression to check
 * @returns True if the expression contains comparison operators (>, <, >=, <=, ==, !=)
 */
function isComparisonExpression(expression: string): boolean {
  const trimmed = expression.trim()
  // Check for comparison operators or STARTS_WITH patterns
  return /[><=!]=?|[><]/.test(trimmed) || trimmed.includes('STARTS_WITH ')
}

/**
 * Evaluates all computed variables for a given page
 *
 * Supports boolean, numeric, and string computed variables:
 * - Boolean: "age >= 18" -> true/false
 * - Numeric: "count + 5" -> number
 * - String literal: '"adult"' -> "adult"
 * - IF-THEN-ELSE: "IF age >= 18 THEN Adult ELSE Minor" -> string/number/boolean
 * - IF-THEN (no ELSE): leaves the variable unchanged if condition is false;
 *   useful for multi-COMPUTE patterns with a default followed by conditional overrides
 * - ELSE IF chaining: "IF a THEN x ELSE IF b THEN y ELSE z"
 *
 * Multiple COMPUTE statements for the same variable are evaluated in declaration order,
 * enabling a "default + override" pattern:
 *   COMPUTE: level = "Low"
 *   COMPUTE: level = IF score >= 5 THEN "Medium"
 *   COMPUTE: level = IF score >= 8 THEN "High"
 *
 * @param page - The page containing computed variables
 * @param variables - Current user variables
 * @returns Object mapping computed variable names to their evaluated values
 */
export function evaluateComputedValues(
  page: Page,
  variables: Variables,
  existingComputedValues?: ComputedValues
): ComputedValues {
  const computedVars: ComputedValues = { ...existingComputedValues }
  const sortedVariables = topologicalSort(page.computedVariables)

  for (const computedVar of sortedVariables) {
    try {
      const extendedVariables = createExtendedVariables(variables, computedVars)
      const expr = computedVar.expression

      if (isIfThenExpression(expr)) {
        // One-sided IF: only update if condition is true, otherwise keep existing value
        const parsed = parseIfThen(expr)
        if (parsed && evaluateCondition(parsed.condition, extendedVariables)) {
          const value = resolveBranchValue(parsed.trueExpr, extendedVariables)
          computedVars[computedVar.name] = value
          computedVar.value = value
        }
        continue
      }

      let result: boolean | number | string

      if (isIfThenElseExpression(expr)) {
        result = evaluateIfThenElseExpr(expr, extendedVariables)
      } else if (isStringLiteral(expr)) {
        result = expr.trim().slice(1, -1)
      } else if (isComparisonExpression(expr)) {
        result = evaluateCondition(expr, extendedVariables)
      } else if (isArithmeticExpression(expr)) {
        result = evaluateExpression(expr, extendedVariables)
      } else {
        result = evaluateCondition(expr, extendedVariables)
      }

      computedVars[computedVar.name] = result
      computedVar.value = result
    } catch (error) {
      console.warn(`Failed to evaluate computed variable "${computedVar.name}": ${error}`)
      const expr = computedVar.expression
      const defaultValue = isIfThenElseExpression(expr) || isIfThenExpression(expr) ? '' : isArithmeticExpression(expr) ? 0 : false
      computedVars[computedVar.name] = defaultValue
      computedVar.value = defaultValue
    }
  }

  return computedVars
}

/**
 * Creates an extended variables object that includes computed variables
 * This allows computed variables to be referenced in conditions just like regular variables
 */
function createExtendedVariables(
  variables: Variables,
  computedVars: ComputedValues
): Variables {
  const extended = { ...variables }

  // Add computed variables directly
  Object.entries(computedVars).forEach(([name, value]) => {
    extended[name] = value
  })

  return extended
}

/**
 * Topological sort for computed variables based on inter-variable dependencies.
 * Multiple COMPUTE statements for the same variable are preserved in declaration order
 * and grouped together in the sorted output.
 */
function topologicalSort(variables: ComputedVariable[]): ComputedVariable[] {
  const uniqueNames = [...new Set(variables.map(v => v.name))]

  const graph: Map<string, string[]> = new Map()
  const inDegree: Map<string, number> = new Map()

  uniqueNames.forEach(name => {
    graph.set(name, [])
    inDegree.set(name, 0)
  })

  // Build dependency graph on unique names
  uniqueNames.forEach(name => {
    const allExpressions = variables.filter(v => v.name === name).map(v => v.expression)
    const deps = new Set(allExpressions.flatMap(extractVariableReferences))
    deps.forEach(dep => {
      if (graph.has(dep) && dep !== name) {
        graph.get(dep)!.push(name)
        inDegree.set(name, (inDegree.get(name) || 0) + 1)
      }
    })
  })

  // Kahn's algorithm on unique names
  const queue: string[] = []
  const sortedNames: string[] = []

  inDegree.forEach((degree, name) => {
    if (degree === 0) queue.push(name)
  })

  while (queue.length > 0) {
    const current = queue.shift()!
    sortedNames.push(current)
    const neighbors = graph.get(current) || []
    neighbors.forEach(neighbor => {
      const newDegree = (inDegree.get(neighbor) || 0) - 1
      inDegree.set(neighbor, newDegree)
      if (newDegree === 0) queue.push(neighbor)
    })
  }

  if (sortedNames.length !== uniqueNames.length) {
    console.warn("Possible circular dependency in computed variables, using original order")
    return variables
  }

  // Reconstruct full list: for each sorted name, include all entries in declaration order
  return sortedNames.flatMap(name => variables.filter(v => v.name === name))
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
    'AND', 'OR', 'NOT', 'IS', 'THEN', 'ELSE', 'IF', 'STARTS_WITH',
    'true', 'false', 'null', 'undefined'
  ])

  return keywords.has(word.toUpperCase())
}

/**
 * Evaluates an IF-THEN-ELSE expression against the given variables.
 * Supports ELSE IF chaining: the false branch may itself be an IF-THEN or IF-THEN-ELSE.
 * Lives here (not in expression-evaluator.ts) to avoid a circular import with condition-evaluator.ts.
 */
function evaluateIfThenElseExpr(
  expression: string,
  variables: Variables
): string | number | boolean {
  const parsed = parseIfThenElse(expression)
  if (!parsed) return ''
  const conditionResult = evaluateCondition(parsed.condition, variables)
  return resolveBranchValue(conditionResult ? parsed.trueExpr : parsed.falseExpr, variables)
}

/**
 * Resolves a branch value, handling nested IF-THEN-ELSE and IF-THEN expressions
 * to support ELSE IF chaining.
 */
function resolveBranchValue(expr: string, variables: Variables): string | number | boolean {
  if (isIfThenElseExpression(expr)) {
    return evaluateIfThenElseExpr(expr, variables)
  }
  if (isIfThenExpression(expr)) {
    const parsed = parseIfThen(expr)
    if (parsed && evaluateCondition(parsed.condition, variables)) {
      return resolveValue(parsed.trueExpr, variables)
    }
    return ''
  }
  return resolveValue(expr, variables)
}