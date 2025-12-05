import { Block, Page, NavItem } from "@/lib/types"
import { normalizeOperators } from "@/lib/conditions/condition-parser"

/**
 * Collects all pages from blocks
 */
function getAllPages(blocks: Block[]): Page[] {
  return blocks.flatMap(block => block.pages)
}

/**
 * Validates that all variable names are unique across the questionnaire
 * Throws an error if duplicate variable names are found
 *
 * @param blocks - All parsed blocks to validate
 */
export function validateVariableNames(blocks: Block[]): void {
  const variableNames = new Set<string>()
  const duplicates: string[] = []

  // Get all pages from all blocks
  const allPages = getAllPages(blocks)

  for (const page of allPages) {
    for (const section of page.sections) {
      for (const question of section.questions) {
        if (question.variable) {
          if (variableNames.has(question.variable)) {
            duplicates.push(question.variable)
          } else {
            variableNames.add(question.variable)
          }
        }
      }
    }
  }

  if (duplicates.length > 0) {
    const uniqueDuplicates = [...new Set(duplicates)]
    throw new Error(
      `Duplicate variable names found: ${uniqueDuplicates.join(', ')}. ` +
      'Each variable name must be unique across the entire questionnaire.'
    )
  }
}

/**
 * Validates that all variable references in conditions exist
 * Checks SHOW_IF conditions in blocks, pages, questions, and options
 *
 * @param blocks - All parsed blocks to validate
 */
export function validateConditionReferences(blocks: Block[]): void {
  // Collect all defined variable names
  const definedVariables = new Set<string>()
  const allPages = getAllPages(blocks)

  // Collect variables from all pages
  for (const page of allPages) {
    // Add page-level computed variables
    for (const computedVar of page.computedVariables) {
      definedVariables.add(computedVar.name)
    }

    // Add section question variables
    for (const section of page.sections) {
      for (const question of section.questions) {
        if (question.variable) {
          definedVariables.add(question.variable)
        }
        // Add subquestion variables (only for matrix questions)
        if (question.type === 'matrix' && question.subquestions) {
          for (const subquestion of question.subquestions) {
            if (subquestion.variable) {
              definedVariables.add(subquestion.variable)
            }
          }
        }
      }
    }
  }

  // Add block-level computed variables
  for (const block of blocks) {
    for (const computedVar of block.computedVariables) {
      definedVariables.add(computedVar.name)
    }
  }

  // Check all condition references
  const errors: string[] = []

  // Check block SHOW_IF conditions
  for (const block of blocks) {
    if (block.showIf) {
      const missingVars = findUndefinedVariables(block.showIf, definedVariables)
      if (missingVars.length > 0) {
        errors.push(`Block "${block.name}" SHOW_IF references undefined variables: ${missingVars.join(', ')}`)
      }
    }
  }

  // Check page and question SHOW_IF conditions
  for (const page of allPages) {
    if (page.showIf) {
      const missingVars = findUndefinedVariables(page.showIf, definedVariables)
      if (missingVars.length > 0) {
        errors.push(`Page "${page.title}" SHOW_IF references undefined variables: ${missingVars.join(', ')}`)
      }
    }

    // Check section questions
    for (const section of page.sections) {
      for (const question of section.questions) {
        if (question.showIf) {
          const missingVars = findUndefinedVariables(question.showIf, definedVariables)
          if (missingVars.length > 0) {
            errors.push(`Question "${question.id}" SHOW_IF references undefined variables: ${missingVars.join(', ')}`)
          }
        }

        // Check options (only for questions that have options)
        if ('options' in question && question.options) {
          for (const option of question.options) {
            if (option.showIf) {
              const missingVars = findUndefinedVariables(option.showIf, definedVariables)
              if (missingVars.length > 0) {
                errors.push(`Question "${question.id}" option "${option.label}" SHOW_IF references undefined variables: ${missingVars.join(', ')}`)
              }
            }
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Variable reference errors:\n${errors.join('\n')}`)
  }
}

/**
 * Validates that all variable references in computed variables exist
 *
 * @param blocks - All parsed blocks to validate
 */
export function validateComputedVariableReferences(blocks: Block[]): void {
  // Collect all defined variable names (both question variables and computed variables)
  const definedVariables = new Set<string>()
  const allPages = getAllPages(blocks)

  // Add section question variables first
  for (const page of allPages) {
    for (const section of page.sections) {
      for (const question of section.questions) {
        if (question.variable) {
          definedVariables.add(question.variable)
        }
        // Add subquestion variables (only for matrix questions)
        if (question.type === 'matrix' && question.subquestions) {
          for (const subquestion of question.subquestions) {
            if (subquestion.variable) {
              definedVariables.add(subquestion.variable)
            }
          }
        }
      }
    }

    // Then add page-level computed variables
    for (const computedVar of page.computedVariables) {
      definedVariables.add(computedVar.name)
    }
  }

  // Finally add block-level computed variables
  for (const block of blocks) {
    for (const computedVar of block.computedVariables) {
      definedVariables.add(computedVar.name)
    }
  }

  // Check computed variable expressions
  const errors: string[] = []

  for (const block of blocks) {
    for (const computedVar of block.computedVariables) {
      const missingVars = findUndefinedVariables(computedVar.expression, definedVariables)
      if (missingVars.length > 0) {
        errors.push(`Computed variable "${computedVar.name}" references undefined variables: ${missingVars.join(', ')}`)
      }
    }
  }

  for (const page of allPages) {
    for (const computedVar of page.computedVariables) {
      const missingVars = findUndefinedVariables(computedVar.expression, definedVariables)
      if (missingVars.length > 0) {
        errors.push(`Computed variable "${computedVar.name}" references undefined variables: ${missingVars.join(', ')}`)
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Computed variable reference errors:\n${errors.join('\n')}`)
  }
}

/**
 * Finds undefined variables in an expression or condition
 * More sophisticated parsing that understands comparison contexts
 */
function findUndefinedVariables(expression: string, definedVariables: Set<string>): string[] {
  const undefinedVars: string[] = []

  // Handle logical operators FIRST (before individual comparisons)
  if (expression.includes(' AND ') || expression.includes(' OR ')) {
    // Handle logical operators by splitting and checking each part
    const parts = expression.split(/\s+(?:AND|OR)\s+/)
    for (const part of parts) {
      undefinedVars.push(...findUndefinedVariables(part.trim(), definedVariables))
    }
  } else if (expression.startsWith('NOT ')) {
    // Handle NOT operator
    const innerExpression = expression.substring(4).trim()
    undefinedVars.push(...findUndefinedVariables(innerExpression, definedVariables))
  } else {
    // Normalize operators (convert IS to ==, etc.)
    const normalizedExpression = normalizeOperators(expression)

    // Handle individual comparisons
    if (normalizedExpression.includes('==') || normalizedExpression.includes('!=') || normalizedExpression.includes('>=') ||
        normalizedExpression.includes('<=') || normalizedExpression.includes('>') || normalizedExpression.includes('<')) {
      // This is a comparison - only check the left side (variable name)
      const comparisonMatch = normalizedExpression.match(/^(.+?)\s*(?:==|!=|>=|<=|>|<)\s*(.+)$/)
      if (comparisonMatch) {
        const leftSide = comparisonMatch[1].trim()
        // Only validate the left side as a variable, right side could be a literal value
        if (isValidVariableName(leftSide) && !definedVariables.has(leftSide)) {
          undefinedVars.push(leftSide)
        }
      }
    } else {
      // Simple variable reference or arithmetic expression
      const variableMatches = expression.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || []

      const keywords = new Set([
        'AND', 'OR', 'NOT', 'IS', 'THEN', 'ELSE', 'IF', 'IS_NOT',
        'GREATER_THAN', 'LESS_THAN', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN_OR_EQUAL',
        'true', 'false', 'null', 'undefined'
      ])

      for (const variable of variableMatches) {
        if (!keywords.has(variable) &&
            !definedVariables.has(variable) &&
            !/^\d/.test(variable) && // Not starting with a number
            isValidVariableName(variable)) {
          undefinedVars.push(variable)
        }
      }
    }
  }

  return [...new Set(undefinedVars)] // Remove duplicates
}

/**
 * Checks if a string looks like a valid variable name (not a literal value)
 */
function isValidVariableName(str: string): boolean {
  // Variable names should match the pattern: letters/underscore, followed by letters/numbers/underscores
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(str)
}

/**
 * Validates that navigation settings are compatible with the parsed questionnaire
 * Throws an error if navigation is enabled but no NAV items are defined
 *
 * @param navItems - The parsed navigation items
 * @param isNavVisible - Whether navigation is enabled in settings
 */
export function validateNavigationSettings(navItems: NavItem[], isNavVisible: boolean): void {
  if (isNavVisible && navItems.length === 0) {
    throw new Error(
      'Navigation is enabled but no NAV items are defined in your survey. ' +
      'Add NAV declarations or disable navigation in settings.'
    )
  }
}
