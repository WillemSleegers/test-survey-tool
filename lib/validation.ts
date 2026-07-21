import { Block, Page, ComputedVariable, isQuestion } from "@/lib/types"
import {
  getConditionSyntaxError,
  getComparisonSumSyntaxError,
  isComparisonSumExpression,
  collectConditionVariableReferences,
} from "@/lib/conditions/expression-parser"
import {
  isIfThenElseExpression,
  isIfThenExpression,
  parseIfThenElse,
  parseIfThen,
  isStringLiteral,
} from "@/lib/conditions/expression-evaluator"

function getAllPages(blocks: Block[]): Page[] {
  return blocks.flatMap(block => block.pages)
}

/**
 * Collects every variable definition in the questionnaire (question,
 * subquestion, breakdown option, and computed variables), keyed by name,
 * with one location string per place that name is defined. Multiple
 * COMPUTE lines for the same name within a single block or page count as
 * one definition (the default-then-override pattern), matching
 * validateBlockComputedNameUniqueness's per-block dedup.
 */
function collectVariableDefinitions(blocks: Block[]): Map<string, string[]> {
  const definitions = new Map<string, string[]>()
  const addDefinition = (name: string, location: string): void => {
    const existing = definitions.get(name)
    if (existing) {
      existing.push(location)
    } else {
      definitions.set(name, [location])
    }
  }

  for (const block of blocks) {
    const blockLabel = `Block "${block.name || '(unnamed block)'}"`
    for (const name of new Set(block.computedVariables.map(cv => cv.name))) {
      addDefinition(name, `${blockLabel} COMPUTE`)
    }

    for (const page of block.pages) {
      const pageLabel = `Page "${page.title}"`
      for (const name of new Set(page.computedVariables.map(cv => cv.name))) {
        addDefinition(name, `${pageLabel} COMPUTE`)
      }

      for (const section of page.sections) {
        for (const item of section.items) {
          if (!isQuestion(item)) continue
          const questionLabel = `Question "${item.id}"`

          if (item.variable) {
            addDefinition(item.variable, questionLabel)
          }
          if (item.type === 'matrix') {
            for (const subquestion of item.subquestions) {
              if (subquestion.variable) {
                addDefinition(
                  subquestion.variable,
                  `${questionLabel} subquestion "${subquestion.text}"`
                )
              }
            }
          }
          if (item.type === 'breakdown') {
            for (const option of item.options) {
              if (option.variable) {
                addDefinition(option.variable, `${questionLabel} option "${option.label}"`)
              }
            }
          }
        }
      }
    }
  }

  return definitions
}

/**
 * Validates that all variable names (question, subquestion, breakdown
 * option, and computed) are unique across the questionnaire.
 * Throws an error if any name is defined in more than one place.
 *
 * @param blocks - All parsed blocks to validate
 */
export function validateVariableNames(blocks: Block[]): void {
  const definitions = collectVariableDefinitions(blocks)
  const duplicates: string[] = []

  for (const [name, locations] of definitions) {
    if (locations.length > 1) {
      duplicates.push(`"${name}" defined in: ${locations.join(', ')}`)
    }
  }

  if (duplicates.length > 0) {
    throw new Error(
      `Duplicate variable names found:\n${duplicates.join('\n')}\n` +
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
  const definedVariables = new Set(collectVariableDefinitions(blocks).keys())
  const allPages = getAllPages(blocks)

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
      if (section.showIf) {
        const missingVars = findUndefinedVariables(section.showIf, definedVariables)
        if (missingVars.length > 0) {
          const sectionLabel = section.title
            ? `Section "${section.title}"`
            : `Section on page "${page.title}"`
          errors.push(`${sectionLabel} SHOW_IF references undefined variables: ${missingVars.join(', ')}`)
        }
      }

      for (const item of section.items) {
        if (isQuestion(item)) {
          if (item.showIf) {
            const missingVars = findUndefinedVariables(item.showIf, definedVariables)
            if (missingVars.length > 0) {
              errors.push(`Question "${item.id}" SHOW_IF references undefined variables: ${missingVars.join(', ')}`)
            }
          }

          // Check options (only for questions that have options)
          if ('options' in item && item.options) {
            for (const option of item.options) {
              if (option.showIf) {
                const missingVars = findUndefinedVariables(option.showIf, definedVariables)
                if (missingVars.length > 0) {
                  errors.push(`Question "${item.id}" option "${option.label}" SHOW_IF references undefined variables: ${missingVars.join(', ')}`)
                }
              }
            }
          }

          if (item.type === 'matrix') {
            for (const subquestion of item.subquestions) {
              if (subquestion.showIf) {
                const missingVars = findUndefinedVariables(subquestion.showIf, definedVariables)
                if (missingVars.length > 0) {
                  errors.push(`Question "${item.id}" subquestion "${subquestion.text}" SHOW_IF references undefined variables: ${missingVars.join(', ')}`)
                }
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
 * Validates that block-level computed variable names are unique across blocks.
 * Block-level computeds share a single global namespace, so the same name
 * defined in two different blocks would silently overwrite. Multiple COMPUTE
 * statements for the same name within a single block are allowed (the
 * default-then-override pattern).
 *
 * @param blocks - All parsed blocks to validate
 */
export function validateBlockComputedNameUniqueness(blocks: Block[]): void {
  const definingBlocks = new Map<string, string[]>()

  for (const block of blocks) {
    const namesInThisBlock = new Set<string>()
    for (const computedVar of block.computedVariables) {
      namesInThisBlock.add(computedVar.name)
    }
    for (const name of namesInThisBlock) {
      const existing = definingBlocks.get(name) ?? []
      existing.push(block.name || '(unnamed block)')
      definingBlocks.set(name, existing)
    }
  }

  const collisions: string[] = []
  for (const [name, blockNames] of definingBlocks) {
    if (blockNames.length > 1) {
      collisions.push(`"${name}" defined in: ${blockNames.join(', ')}`)
    }
  }

  if (collisions.length > 0) {
    throw new Error(
      `Block-level computed variable names must be unique across blocks. Collisions:\n${collisions.join('\n')}`
    )
  }
}

/**
 * Validates that all variable references in computed variables exist
 *
 * @param blocks - All parsed blocks to validate
 */
export function validateComputedVariableReferences(blocks: Block[]): void {
  const definedVariables = new Set(collectVariableDefinitions(blocks).keys())
  const allPages = getAllPages(blocks)

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
 * Validates the syntax of every SHOW_IF condition and COMPUTE expression.
 * Throws an aggregated error listing each malformed expression with its
 * location, so broken conditions are rejected at upload time instead of
 * silently falling back at runtime.
 *
 * @param blocks - All parsed blocks to validate
 */
export function validateConditionSyntax(blocks: Block[]): void {
  const errors: string[] = []

  const checkShowIf = (location: string, condition?: string): void => {
    if (!condition) return
    const error = getConditionSyntaxError(condition)
    if (error) errors.push(`${location} SHOW_IF "${condition}": ${error}`)
  }
  const checkCompute = (location: string, computedVar: ComputedVariable): void => {
    const error = getComputeExpressionSyntaxError(computedVar.expression)
    if (error) {
      errors.push(
        `${location} COMPUTE "${computedVar.name} = ${computedVar.expression}": ${error}`
      )
    }
  }

  for (const block of blocks) {
    const blockLabel = `Block "${block.name || '(unnamed block)'}"`
    checkShowIf(blockLabel, block.showIf)
    block.computedVariables.forEach(cv => checkCompute(blockLabel, cv))

    for (const page of block.pages) {
      const pageLabel = `Page "${page.title}"`
      checkShowIf(pageLabel, page.showIf)
      page.computedVariables.forEach(cv => checkCompute(pageLabel, cv))

      for (const section of page.sections) {
        const sectionLabel = section.title
          ? `Section "${section.title}"`
          : `Section on page "${page.title}"`
        checkShowIf(sectionLabel, section.showIf)

        for (const item of section.items) {
          if (!isQuestion(item)) continue
          const questionLabel = `Question "${item.id}"`
          checkShowIf(questionLabel, item.showIf)

          if ('options' in item && item.options) {
            for (const option of item.options) {
              checkShowIf(`${questionLabel} option "${option.label}"`, option.showIf)
            }
          }
          if (item.type === 'matrix') {
            for (const subquestion of item.subquestions) {
              checkShowIf(
                `${questionLabel} subquestion "${subquestion.text}"`,
                subquestion.showIf
              )
            }
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Condition syntax errors:\n${errors.join('\n')}`)
  }
}

/**
 * Syntax-checks a COMPUTE expression, mirroring the classification used by
 * evaluateComputedValues: IF-THEN(-ELSE) chains, string literals,
 * comparison sums, then plain conditions/arithmetic.
 */
function getComputeExpressionSyntaxError(expression: string): string | null {
  const trimmed = expression.trim()
  if (isIfThenElseExpression(trimmed)) {
    const parsed = parseIfThenElse(trimmed)
    if (!parsed) return "Malformed IF-THEN-ELSE expression"
    return (
      getConditionSyntaxError(parsed.condition) ??
      getBranchSyntaxError(parsed.trueExpr) ??
      getBranchSyntaxError(parsed.falseExpr)
    )
  }
  if (isIfThenExpression(trimmed)) {
    const parsed = parseIfThen(trimmed)
    if (!parsed) return "Malformed IF-THEN expression"
    return (
      getConditionSyntaxError(parsed.condition) ??
      getBranchSyntaxError(parsed.trueExpr)
    )
  }
  if (isStringLiteral(trimmed)) return null
  if (isComparisonSumExpression(trimmed)) return getComparisonSumSyntaxError(trimmed)
  return getConditionSyntaxError(trimmed)
}

/**
 * Branch values resolve variable-first with a plain-text fallback, so free
 * text is always valid; only nested IF chains carry checkable syntax.
 */
function getBranchSyntaxError(branch: string): string | null {
  if (isIfThenElseExpression(branch) || isIfThenExpression(branch)) {
    return getComputeExpressionSyntaxError(branch)
  }
  return null
}

/**
 * Finds undefined variables in an expression or condition.
 * Variable references are collected by the condition tokenizer; branch
 * values of IF expressions are skipped (they fall back to plain text).
 */
function findUndefinedVariables(expression: string, definedVariables: Set<string>): string[] {
  const references = collectExpressionReferences(expression)
  return [...new Set(references.filter(name => !definedVariables.has(name)))]
}

function collectExpressionReferences(expression: string): string[] {
  const trimmed = expression.trim()
  if (isIfThenElseExpression(trimmed)) {
    const parsed = parseIfThenElse(trimmed)
    if (!parsed) return []
    return [
      ...collectConditionVariableReferences(parsed.condition),
      ...collectBranchReferences(parsed.trueExpr),
      ...collectBranchReferences(parsed.falseExpr),
    ]
  }
  if (isIfThenExpression(trimmed)) {
    const parsed = parseIfThen(trimmed)
    if (!parsed) return []
    return [
      ...collectConditionVariableReferences(parsed.condition),
      ...collectBranchReferences(parsed.trueExpr),
    ]
  }
  if (isStringLiteral(trimmed)) return []
  return collectConditionVariableReferences(trimmed)
}

function collectBranchReferences(branch: string): string[] {
  if (isIfThenElseExpression(branch) || isIfThenExpression(branch)) {
    return collectExpressionReferences(branch)
  }
  return []
}
