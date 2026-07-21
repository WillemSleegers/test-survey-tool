import { describe, it, expect } from 'vitest'
import { evaluateComputedValues } from './computed-variables'
import { evaluateCondition } from './condition-evaluator'
import { Page } from '@/lib/types'

function makePage(computedVariables: { name: string; expression: string }[]): Page {
  return {
    id: 1,
    title: 'Test',
    sections: [],
    computedVariables,
  }
}

describe('evaluateComputedValues', () => {
  describe('arithmetic expressions', () => {
    it('adds two variables', () => {
      const page = makePage([{ name: 'total', expression: 'rent + food' }])
      const result = evaluateComputedValues(page, { rent: 800, food: 300 })
      expect(result.total).toBe(1100)
    })
  })

  describe('boolean comparison expressions', () => {
    it('returns true when condition is met', () => {
      const page = makePage([{ name: 'is_adult', expression: 'age >= 18' }])
      const result = evaluateComputedValues(page, { age: 20 })
      expect(result.is_adult).toBe(true)
    })

    it('returns false when condition is not met', () => {
      const page = makePage([{ name: 'is_adult', expression: 'age >= 18' }])
      const result = evaluateComputedValues(page, { age: 15 })
      expect(result.is_adult).toBe(false)
    })
  })

  describe('string literal expressions', () => {
    it('returns a double-quoted string directly', () => {
      const page = makePage([{ name: 'category', expression: '"always"' }])
      const result = evaluateComputedValues(page, {})
      expect(result.category).toBe('always')
    })

    it('returns a single-quoted string directly', () => {
      const page = makePage([{ name: 'category', expression: "'always'" }])
      const result = evaluateComputedValues(page, {})
      expect(result.category).toBe('always')
    })
  })

  describe('IF-THEN-ELSE expressions', () => {
    it('returns true branch when condition is met (unquoted string)', () => {
      const page = makePage([{ name: 'label', expression: 'IF score >= 8 THEN High ELSE Low' }])
      const result = evaluateComputedValues(page, { score: 9 })
      expect(result.label).toBe('High')
    })

    it('returns false branch when condition is not met (unquoted string)', () => {
      const page = makePage([{ name: 'label', expression: 'IF score >= 8 THEN High ELSE Low' }])
      const result = evaluateComputedValues(page, { score: 5 })
      expect(result.label).toBe('Low')
    })

    it('returns true branch with quoted strings', () => {
      const page = makePage([{ name: 'label', expression: 'IF score >= 8 THEN "High" ELSE "Low"' }])
      const result = evaluateComputedValues(page, { score: 9 })
      expect(result.label).toBe('High')
    })

    it('returns false branch with quoted strings', () => {
      const page = makePage([{ name: 'label', expression: 'IF score >= 8 THEN "High" ELSE "Low"' }])
      const result = evaluateComputedValues(page, { score: 5 })
      expect(result.label).toBe('Low')
    })

    it('returns a numeric value from the branch', () => {
      const page = makePage([{ name: 'points', expression: 'IF score >= 8 THEN 1 ELSE 0' }])
      const result = evaluateComputedValues(page, { score: 9 })
      expect(result.points).toBe(1)
    })

    it('resolves a variable reference in the branch', () => {
      const page = makePage([{ name: 'result', expression: 'IF flag THEN label_a ELSE label_b' }])
      const result = evaluateComputedValues(page, { flag: true, label_a: 'Yes', label_b: 'No' })
      expect(result.result).toBe('Yes')
    })

    it('resolves the false branch variable reference', () => {
      const page = makePage([{ name: 'result', expression: 'IF flag THEN label_a ELSE label_b' }])
      const result = evaluateComputedValues(page, { flag: false, label_a: 'Yes', label_b: 'No' })
      expect(result.result).toBe('No')
    })

    it('works with string equality condition', () => {
      const page = makePage([{ name: 'status', expression: 'IF employed == Yes THEN "Employed" ELSE "Not employed"' }])
      const result = evaluateComputedValues(page, { employed: 'Yes' })
      expect(result.status).toBe('Employed')
    })
  })

  describe('IF-THEN without ELSE (one-sided)', () => {
    it('sets the value when condition is true', () => {
      const page = makePage([{ name: 'level', expression: 'IF score >= 8 THEN "High"' }])
      const result = evaluateComputedValues(page, { score: 9 })
      expect(result.level).toBe('High')
    })

    it('leaves the variable unset when condition is false', () => {
      const page = makePage([{ name: 'level', expression: 'IF score >= 8 THEN "High"' }])
      const result = evaluateComputedValues(page, { score: 5 })
      expect(result.level).toBeUndefined()
    })

    it('keeps the previous value when condition is false (default + override pattern)', () => {
      const page = makePage([
        { name: 'level', expression: '"Low"' },
        { name: 'level', expression: 'IF score >= 5 THEN "Medium"' },
        { name: 'level', expression: 'IF score >= 8 THEN "High"' },
      ])
      expect(evaluateComputedValues(page, { score: 3 }).level).toBe('Low')
      expect(evaluateComputedValues(page, { score: 6 }).level).toBe('Medium')
      expect(evaluateComputedValues(page, { score: 9 }).level).toBe('High')
    })

    it('evaluates multiple COMPUTE for the same name in declaration order', () => {
      const page = makePage([
        { name: 'level', expression: '"Low"' },
        { name: 'level', expression: 'IF score >= 5 THEN "Medium"' },
        { name: 'level', expression: 'IF score >= 8 THEN "High"' },
      ])
      // score=6: Low → Medium (5 passes) → Medium stays (8 fails)
      expect(evaluateComputedValues(page, { score: 6 }).level).toBe('Medium')
    })
  })

  describe('ELSE IF chaining', () => {
    it('returns the first matching branch', () => {
      const page = makePage([{
        name: 'level',
        expression: 'IF score >= 8 THEN "High" ELSE IF score >= 5 THEN "Medium" ELSE "Low"',
      }])
      expect(evaluateComputedValues(page, { score: 9 }).level).toBe('High')
      expect(evaluateComputedValues(page, { score: 6 }).level).toBe('Medium')
      expect(evaluateComputedValues(page, { score: 3 }).level).toBe('Low')
    })

    it('works with numeric branch values', () => {
      const page = makePage([{
        name: 'points',
        expression: 'IF score >= 8 THEN 2 ELSE IF score >= 5 THEN 1 ELSE 0',
      }])
      expect(evaluateComputedValues(page, { score: 9 }).points).toBe(2)
      expect(evaluateComputedValues(page, { score: 6 }).points).toBe(1)
      expect(evaluateComputedValues(page, { score: 3 }).points).toBe(0)
    })
  })

  describe('sum of comparisons', () => {
    it('counts how many variables equal a value', () => {
      const page = makePage([{
        name: 'total',
        expression: 'heat == Yes + cold == Yes + severe == Yes',
      }])
      const result = evaluateComputedValues(page, { heat: 'Yes', cold: 'No', severe: 'Yes' })
      expect(result.total).toBe(2)
    })

    it('returns 0 when none match', () => {
      const page = makePage([{
        name: 'total',
        expression: 'heat == Yes + cold == Yes + severe == Yes',
      }])
      const result = evaluateComputedValues(page, { heat: 'No', cold: 'No', severe: 'No' })
      expect(result.total).toBe(0)
    })

    it('feeds into a SHOW_IF comparison on another page', () => {
      const page = makePage([{
        name: 'total',
        expression: 'heat == Yes + cold == Yes + severe == Yes',
      }])
      const variables = { heat: 'Yes', cold: 'Yes', severe: 'No' }
      const result = evaluateComputedValues(page, variables)
      expect(result.total).toBe(2)
      expect(evaluateCondition('total > 1', { ...variables, ...result })).toBe(true)
    })

    it('does not affect a single comparison mixed with arithmetic (age + years >= 21)', () => {
      const page = makePage([{ name: 'eligible', expression: 'age + years >= 21' }])
      const result = evaluateComputedValues(page, { age: 15, years: 10 })
      expect(result.eligible).toBe(true)
    })

    it('supports mixing plain numbers into the sum', () => {
      const page = makePage([{
        name: 'score',
        expression: 'a == Yes + b == Yes + 1',
      }])
      const result = evaluateComputedValues(page, { a: 'Yes', b: 'No' })
      expect(result.score).toBe(2)
    })
  })

  describe('dependency ordering', () => {
    it('evaluates a computed variable that references another computed variable', () => {
      const page = makePage([
        { name: 'total', expression: 'rent + food' },
        { name: 'label', expression: 'IF total >= 1000 THEN "High" ELSE "Low"' },
      ])
      const result = evaluateComputedValues(page, { rent: 800, food: 300 })
      expect(result.total).toBe(1100)
      expect(result.label).toBe('High')
    })

    it('handles reverse declaration order correctly', () => {
      const page = makePage([
        { name: 'label', expression: 'IF total >= 1000 THEN "High" ELSE "Low"' },
        { name: 'total', expression: 'rent + food' },
      ])
      const result = evaluateComputedValues(page, { rent: 800, food: 300 })
      expect(result.total).toBe(1100)
      expect(result.label).toBe('High')
    })
  })

  describe('does not mutate shared parsed state', () => {
    it('does not write a value back onto the ComputedVariable objects', () => {
      const page = makePage([{ name: 'total', expression: 'rent + food' }])
      evaluateComputedValues(page, { rent: 800, food: 300 })
      expect(page.computedVariables[0]).not.toHaveProperty('value')
    })

    it('re-evaluating the same page object with different variables is independent (no leftover state)', () => {
      const page = makePage([{ name: 'total', expression: 'rent + food' }])
      const first = evaluateComputedValues(page, { rent: 800, food: 300 })
      const second = evaluateComputedValues(page, { rent: 100, food: 50 })
      expect(first.total).toBe(1100)
      expect(second.total).toBe(150)
    })
  })
})
