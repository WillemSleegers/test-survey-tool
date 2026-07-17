import { Variables } from "@/lib/types"
import {
  compareStringValue,
  compareNumericValue,
  isNumericValue,
  type ResponseValue,
} from "./value-comparators"
import { convertValueToNumber } from "./value-converter"

/**
 * Tokenizer and evaluator for survey condition and arithmetic expressions.
 *
 * Grammar (loosest to tightest binding):
 *   condition   := andExpr (OR andExpr)*
 *   andExpr     := notExpr (AND notExpr)*
 *   notExpr     := NOT* primary
 *   primary     := "(" condition ")" | comparison
 *   comparison  := operand (cmpOp operand)?          — split at the LAST top-level operator
 *   operand     := comparison-sum | arithmetic | STARTS_WITH prefix | value
 *   arithmetic  := additive with * / and unary minus, parentheses
 *
 * Keywords (AND, OR, NOT, IS, IS_NOT, GREATER_THAN, LESS_THAN,
 * GREATER_THAN_OR_EQUAL, LESS_THAN_OR_EQUAL, STARTS_WITH) are recognized
 * in UPPERCASE only, so unquoted values like "Several weeks or more" stay
 * plain text. Unquoted values may span multiple words; they end at a
 * keyword, comparison operator, or arithmetic operator.
 *
 * A comparison-sum adds up multiple comparisons, each counting 1 when true:
 * "a == Yes + b == Yes + 1". It is recognized when at least two top-level
 * additive terms together contain at least two comparison operators.
 *
 * Malformed input throws ConditionParseError; callers decide the fallback.
 */

export class ConditionParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ConditionParseError"
  }
}

// ============================================================================
// TOKENIZER
// ============================================================================

type TokenType =
  | "lparen"
  | "rparen"
  | "arith" // + - * /
  | "cmp" // == != >= <= > <
  | "and"
  | "or"
  | "not"
  | "starts_with"
  | "string" // quoted; text holds the unquoted content
  | "word"

type Token = {
  type: TokenType
  text: string
  start: number
  end: number
}

const KEYWORD_TOKENS: Record<string, { type: TokenType; text: string }> = {
  AND: { type: "and", text: "AND" },
  OR: { type: "or", text: "OR" },
  NOT: { type: "not", text: "NOT" },
  STARTS_WITH: { type: "starts_with", text: "STARTS_WITH" },
  IS: { type: "cmp", text: "==" },
  IS_NOT: { type: "cmp", text: "!=" },
  GREATER_THAN_OR_EQUAL: { type: "cmp", text: ">=" },
  LESS_THAN_OR_EQUAL: { type: "cmp", text: "<=" },
  GREATER_THAN: { type: "cmp", text: ">" },
  LESS_THAN: { type: "cmp", text: "<" },
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  const push = (type: TokenType, text: string, start: number, end: number) =>
    tokens.push({ type, text, start, end })

  while (i < source.length) {
    const char = source[i]
    const next = source[i + 1]

    if (/\s/.test(char)) {
      i++
      continue
    }

    if (char === '"' || char === "'") {
      const close = source.indexOf(char, i + 1)
      if (close === -1) {
        throw new ConditionParseError(`Unterminated ${char} quote`)
      }
      push("string", source.slice(i + 1, close), i, close + 1)
      i = close + 1
      continue
    }

    if (char === "(") {
      push("lparen", "(", i, i + 1)
      i++
      continue
    }
    if (char === ")") {
      push("rparen", ")", i, i + 1)
      i++
      continue
    }

    if ((char === "=" || char === "!") && next === "=") {
      push("cmp", char + "=", i, i + 2)
      i += 2
      continue
    }
    if (char === "=") {
      throw new ConditionParseError(`Single "=" is not an operator; use "=="`)
    }
    if (char === ">" || char === "<") {
      if (next === "=") {
        push("cmp", char + "=", i, i + 2)
        i += 2
      } else {
        push("cmp", char, i, i + 1)
        i++
      }
      continue
    }
    if (char === "&" && next === "&") {
      push("and", "&&", i, i + 2)
      i += 2
      continue
    }
    if (char === "|" && next === "|") {
      push("or", "||", i, i + 2)
      i += 2
      continue
    }
    if (char === "+" || char === "-" || char === "*" || char === "/") {
      push("arith", char, i, i + 1)
      i++
      continue
    }

    // Word: run of characters until whitespace or an operator boundary.
    // Single !, &, | and other punctuation stay part of the word so values
    // like "R&D" or "Hello!" survive.
    const start = i
    while (i < source.length) {
      const c = source[i]
      const n = source[i + 1]
      if (/[\s()"'+\-*/<>=]/.test(c)) break
      if (c === "!" && n === "=") break
      if (c === "&" && n === "&") break
      if (c === "|" && n === "|") break
      i++
    }
    const text = source.slice(start, i)
    const keyword = KEYWORD_TOKENS[text]
    if (keyword) {
      push(keyword.type, keyword.text, start, i)
    } else {
      push("word", text, start, i)
    }
  }

  return tokens
}

// ============================================================================
// TOKEN REGION HELPERS
// ============================================================================

type Region = { tokens: Token[]; source: string }

/** Source text spanned by a token slice, trimmed */
function sliceSource(region: Region, from: number, to: number): string {
  if (from >= to) return ""
  return region.source
    .slice(region.tokens[from].start, region.tokens[to - 1].end)
    .trim()
}

function subRegion(region: Region, from: number, to: number): Region {
  return { tokens: region.tokens.slice(from, to), source: region.source }
}

/** Indices of depth-0 tokens of the given types; validates paren balance */
function depthZeroIndices(region: Region, types: TokenType[]): number[] {
  const indices: number[] = []
  let depth = 0
  region.tokens.forEach((token, index) => {
    if (token.type === "lparen") depth++
    else if (token.type === "rparen") {
      depth--
      if (depth < 0) throw new ConditionParseError("Unbalanced parentheses")
    } else if (depth === 0 && types.includes(token.type)) {
      indices.push(index)
    }
  })
  if (depth !== 0) throw new ConditionParseError("Unbalanced parentheses")
  return indices
}

/** Split a region at the given depth-0 token indices (separators dropped) */
function splitAt(region: Region, indices: number[]): Region[] {
  const parts: Region[] = []
  let start = 0
  for (const index of indices) {
    parts.push(subRegion(region, start, index))
    start = index + 1
  }
  parts.push(subRegion(region, start, region.tokens.length))
  return parts
}

/** True when the region is a single parenthesized group: "( ... )" */
function isParenWrapped(region: Region): boolean {
  const { tokens } = region
  if (tokens.length < 2) return false
  if (tokens[0].type !== "lparen" || tokens[tokens.length - 1].type !== "rparen") {
    return false
  }
  let depth = 0
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === "lparen") depth++
    else if (tokens[i].type === "rparen") {
      depth--
      if (depth === 0) return i === tokens.length - 1
    }
  }
  return false
}

/**
 * Indices of depth-0 "+"/"-" tokens that separate additive terms.
 * A sign directly after another operator, comparison, or opening paren
 * (or at the start) is unary and does not separate terms.
 */
function additiveSplitIndices(region: Region): number[] {
  const indices: number[] = []
  let depth = 0
  region.tokens.forEach((token, index) => {
    if (token.type === "lparen") depth++
    else if (token.type === "rparen") depth--
    else if (
      depth === 0 &&
      token.type === "arith" &&
      (token.text === "+" || token.text === "-")
    ) {
      const prev = region.tokens[index - 1]
      const isUnary =
        !prev || prev.type === "arith" || prev.type === "cmp" || prev.type === "lparen"
      if (!isUnary) indices.push(index)
    }
  })
  return indices
}

// ============================================================================
// TRUTHINESS AND VALUE COERCION
// ============================================================================

/**
 * Truthiness of a variable value used as a bare condition.
 * Numbers are always true (including 0): an answered number question
 * counts as answered.
 */
function truthiness(value: ResponseValue): boolean {
  if (value === undefined || value === null) return false
  if (typeof value === "boolean") return value
  if (typeof value === "number") return true
  if (typeof value === "string") return value !== ""
  if (Array.isArray(value)) return value.length > 0
  return Boolean(value)
}

/** One side of a comparison, resolved but not yet coerced */
type Operand =
  | { kind: "number"; value: number }
  | { kind: "variable"; name: string; value: ResponseValue } // value may be undefined
  | { kind: "literal"; text: string }

function operandToNumber(operand: Operand, variables: Variables): number {
  switch (operand.kind) {
    case "number":
      return operand.value
    case "variable":
      return convertValueToNumber(operand.value)
    case "literal": {
      if (operand.text in variables) {
        return convertValueToNumber(variables[operand.text])
      }
      const parsed = parseFloat(operand.text)
      return isNaN(parsed) ? 0 : parsed
    }
  }
}

function compareNumbers(left: number, right: number, op: string): boolean {
  switch (op) {
    case "==": return left === right
    case "!=": return left !== right
    case ">=": return left >= right
    case "<=": return left <= right
    case ">": return left > right
    case "<": return left < right
    default: return false
  }
}

// ============================================================================
// EVALUATION
// ============================================================================

/**
 * Evaluates a condition string against variables.
 * Throws ConditionParseError on malformed input.
 */
export function evaluateConditionExpression(
  source: string,
  variables: Variables
): boolean {
  const tokens = tokenize(source)
  if (tokens.length === 0) return true
  return evalOr({ tokens, source }, variables)
}

/**
 * Syntax-checks a condition without needing variables: evaluation visits
 * every branch, so a dry run against an empty variable set exercises the
 * full structure. Returns the parse error message, or null when valid.
 */
export function getConditionSyntaxError(source: string): string | null {
  try {
    evaluateConditionExpression(source, {})
    return null
  } catch (error) {
    if (error instanceof ConditionParseError) return error.message
    throw error
  }
}

/**
 * Syntax-checks a comparison-sum expression ("a == Yes + b == Yes + 1").
 * Returns the parse error message, or null when valid.
 */
export function getComparisonSumSyntaxError(source: string): string | null {
  try {
    evaluateComparisonSum(source, {})
    return null
  } catch (error) {
    if (error instanceof ConditionParseError) return error.message
    throw error
  }
}

/**
 * Collects the variable names a condition depends on, for reference
 * validation. Mirrors evaluation semantics:
 * - left side of a comparison is a variable reference; the right side is
 *   ambiguous (literal or variable) and is never collected
 * - words in arithmetic count as variable references on either side
 * - quoted strings, numeric literals, true/false, and STARTS_WITH prefixes
 *   are never references
 * Returns an empty array for malformed input — syntax validation reports
 * those separately.
 */
export function collectConditionVariableReferences(source: string): string[] {
  const references = new Set<string>()
  try {
    const tokens = tokenize(source)
    if (tokens.length > 0) collectOr({ tokens, source }, references)
  } catch {
    return []
  }
  return [...references]
}

function collectOr(region: Region, references: Set<string>): void {
  const parts = splitAt(region, depthZeroIndices(region, ["or"]))
  for (const part of parts) collectAnd(part, references)
}

function collectAnd(region: Region, references: Set<string>): void {
  const parts = splitAt(region, depthZeroIndices(region, ["and"]))
  for (const part of parts) collectNot(part, references)
}

function collectNot(region: Region, references: Set<string>): void {
  let start = 0
  while (start < region.tokens.length && region.tokens[start].type === "not") {
    start++
  }
  const inner = subRegion(region, start, region.tokens.length)
  if (inner.tokens.length === 0) return
  if (isParenWrapped(inner)) {
    collectOr(subRegion(inner, 1, inner.tokens.length - 1), references)
    return
  }
  collectComparisonRegion(inner, references)
}

function collectComparisonRegion(region: Region, references: Set<string>): void {
  const { tokens } = region
  if (tokens.length === 0) return
  if (tokens[0].type === "starts_with") return

  if (isComparisonSumRegion(region)) {
    const parts = splitAt(region, additiveSplitIndices(region))
    for (const part of parts) {
      if (depthZeroIndices(part, ["cmp"]).length >= 1) {
        collectComparisonRegion(part, references)
      } else {
        collectArithmeticReferences(part, references)
      }
    }
    return
  }

  const cmpIndices = depthZeroIndices(region, ["cmp"])
  if (cmpIndices.length === 0) {
    if (tokens.length === 1 && tokens[0].type === "word") {
      addWordReference(tokens[0].text, references)
    } else if (hasDepthZeroArith(region)) {
      collectArithmeticReferences(region, references)
    }
    return
  }

  const splitIndex = cmpIndices[cmpIndices.length - 1]
  collectComparisonSide(subRegion(region, 0, splitIndex), "left", references)
  collectComparisonSide(
    subRegion(region, splitIndex + 1, tokens.length),
    "right",
    references
  )
}

function collectComparisonSide(
  region: Region,
  side: "left" | "right",
  references: Set<string>
): void {
  const { tokens } = region
  if (tokens.length === 0) return
  if (depthZeroIndices(region, ["cmp"]).length > 0) {
    if (isComparisonSumRegion(region)) collectComparisonRegion(region, references)
    return
  }
  if (hasDepthZeroArith(region) || isParenWrapped(region)) {
    collectArithmeticReferences(region, references)
    return
  }
  if (side === "left" && tokens.length === 1 && tokens[0].type === "word") {
    addWordReference(tokens[0].text, references)
  }
  // Right-side barewords stay uncollected: they may be literals
}

function collectArithmeticReferences(region: Region, references: Set<string>): void {
  for (const token of region.tokens) {
    if (token.type === "word") addWordReference(token.text, references)
  }
}

function addWordReference(word: string, references: Set<string>): void {
  if (word === "true" || word === "false") return
  if (isNumericValue(word)) return
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(word)) return
  references.add(word)
}

// OR/AND evaluate all parts without short-circuiting so that a single
// evaluation pass visits every branch — this is what lets a dry run against
// empty variables double as a full syntax check (getConditionSyntaxError).

function evalOr(region: Region, variables: Variables): boolean {
  const orIndices = depthZeroIndices(region, ["or"])
  if (orIndices.length === 0) return evalAnd(region, variables)
  return splitAt(region, orIndices)
    .map(part => evalAnd(requireNonEmpty(part, "OR"), variables))
    .some(Boolean)
}

function evalAnd(region: Region, variables: Variables): boolean {
  const andIndices = depthZeroIndices(region, ["and"])
  if (andIndices.length === 0) return evalNot(region, variables)
  return splitAt(region, andIndices)
    .map(part => evalNot(requireNonEmpty(part, "AND"), variables))
    .every(Boolean)
}

function requireNonEmpty(region: Region, operator: string): Region {
  if (region.tokens.length === 0) {
    throw new ConditionParseError(`Missing operand for ${operator}`)
  }
  return region
}

function evalNot(region: Region, variables: Variables): boolean {
  let negations = 0
  let start = 0
  while (start < region.tokens.length && region.tokens[start].type === "not") {
    negations++
    start++
  }
  const inner = requireNonEmpty(subRegion(region, start, region.tokens.length), "NOT")
  const result = evalPrimary(inner, variables)
  return negations % 2 === 0 ? result : !result
}

function evalPrimary(region: Region, variables: Variables): boolean {
  if (isParenWrapped(region)) {
    return evalOr(subRegion(region, 1, region.tokens.length - 1), variables)
  }
  return evalComparisonRegion(region, variables)
}

/**
 * Evaluates a comparison-level region (no top-level AND/OR/NOT).
 * When multiple comparison operators are present, the LAST one is the main
 * comparison and each side may be a comparison-sum.
 */
function evalComparisonRegion(region: Region, variables: Variables): boolean {
  const { tokens } = region
  if (tokens.length === 0) throw new ConditionParseError("Empty condition")

  if (tokens[0].type === "starts_with") {
    return evalStartsWith(region, variables)
  }

  const cmpIndices = depthZeroIndices(region, ["cmp"])

  if (cmpIndices.length === 0) {
    // No comparison: bare value test
    if (tokens.length === 1) {
      const token = tokens[0]
      if (token.type === "string") return token.text !== ""
      if (token.type === "word") {
        if (token.text === "true") return true
        if (token.text === "false") return false
        return truthiness(variables[token.text])
      }
      throw new ConditionParseError(`Unexpected "${token.text}"`)
    }
    if (additiveSplitIndices(region).length > 0 || hasDepthZeroArith(region)) {
      // Pure arithmetic used as a condition: any number is truthy
      evalArithmetic(region, variables)
      return true
    }
    throw new ConditionParseError(
      `"${sliceSource(region, 0, tokens.length)}" is not a valid condition`
    )
  }

  const splitIndex = cmpIndices[cmpIndices.length - 1]
  const op = tokens[splitIndex].text
  const left = subRegion(region, 0, splitIndex)
  const right = subRegion(region, splitIndex + 1, tokens.length)

  const leftOperand = evalOperandSide(left, "left", variables)
  const rightOperand = evalOperandSide(right, "right", variables)

  return compareOperands(leftOperand, op, rightOperand, variables)
}

function hasDepthZeroArith(region: Region): boolean {
  return depthZeroIndices(region, ["arith"]).length > 0
}

/** Resolves one side of a comparison into an operand */
function evalOperandSide(
  region: Region,
  side: "left" | "right",
  variables: Variables
): Operand {
  const { tokens } = region
  if (tokens.length === 0) {
    throw new ConditionParseError(`Missing ${side} side of comparison`)
  }

  const cmpIndices = depthZeroIndices(region, ["cmp"])
  if (cmpIndices.length > 0) {
    if (isComparisonSumRegion(region)) {
      return { kind: "number", value: evalComparisonSumRegion(region, variables) }
    }
    throw new ConditionParseError(
      `Chained comparison in "${sliceSource(region, 0, tokens.length)}"`
    )
  }

  if (hasDepthZeroArith(region) || isParenWrapped(region)) {
    return { kind: "number", value: evalArithmetic(region, variables) }
  }

  if (tokens.length === 1 && tokens[0].type === "string") {
    return { kind: "literal", text: tokens[0].text }
  }

  // Bareword (possibly multi-word): variable lookup first, then literal
  const text = sliceSource(region, 0, tokens.length)
  if (tokens.length === 1 && isNumericValue(text)) {
    return { kind: "number", value: parseFloat(text) }
  }
  if (side === "left" || text in variables) {
    return { kind: "variable", name: text, value: variables[text] }
  }
  return { kind: "literal", text }
}

function compareOperands(
  left: Operand,
  op: string,
  right: Operand,
  variables: Variables
): boolean {
  // Arithmetic on either side forces a numeric comparison
  if (left.kind === "number" || right.kind === "number") {
    return compareNumbers(
      operandToNumber(left, variables),
      operandToNumber(right, variables),
      op
    )
  }

  const leftValue = left.kind === "variable" ? left.value : left.text
  const rightValue = right.kind === "variable" ? right.value : right.text

  // Empty-string check: "var == \"\"" tests unanswered/empty
  if (right.kind === "literal" && right.text === "") {
    if (leftValue === undefined) return op === "=="
    const isEmpty =
      leftValue === "" || (Array.isArray(leftValue) && leftValue.length === 0)
    return op === "==" ? isEmpty : !isEmpty
  }

  if (right.kind === "variable") {
    // Variable-to-variable: ordered operators compare numerically;
    // equality compares numerically only when both sides are numeric
    if (op !== "==" && op !== "!=") {
      return compareNumbers(
        convertValueToNumber(leftValue),
        convertValueToNumber(rightValue),
        op
      )
    }
    if (
      isNumericValue(String(leftValue)) &&
      isNumericValue(String(rightValue))
    ) {
      return compareNumbers(
        convertValueToNumber(leftValue),
        convertValueToNumber(rightValue),
        op
      )
    }
    return compareStringValue(leftValue, String(rightValue), op as "==" | "!=")
  }

  // Literal right side: numeric literals compare numerically
  // (arrays by length), other literals by string (arrays by inclusion)
  if (isNumericValue(right.text)) {
    return compareNumericValue(
      leftValue,
      parseFloat(right.text),
      op as "==" | "!=" | ">=" | "<=" | ">" | "<"
    )
  }
  return compareStringValue(leftValue, right.text, op as "==" | "!=")
}

/**
 * STARTS_WITH prefix op value — true when ANY variable whose name starts
 * with the prefix satisfies the comparison (OR logic).
 */
function evalStartsWith(region: Region, variables: Variables): boolean {
  const cmpIndices = depthZeroIndices(region, ["cmp"])
  if (cmpIndices.length !== 1) {
    throw new ConditionParseError("STARTS_WITH requires exactly one comparison")
  }
  const cmpIndex = cmpIndices[0]
  const prefix = sliceSource(region, 1, cmpIndex)
  if (!prefix) throw new ConditionParseError("STARTS_WITH requires a prefix")

  const op = region.tokens[cmpIndex].text
  const valueTokens = subRegion(region, cmpIndex + 1, region.tokens.length)
  if (valueTokens.tokens.length === 0) {
    throw new ConditionParseError("STARTS_WITH requires a comparison value")
  }
  const value =
    valueTokens.tokens.length === 1 && valueTokens.tokens[0].type === "string"
      ? valueTokens.tokens[0].text
      : sliceSource(valueTokens, 0, valueTokens.tokens.length)

  const matching = Object.keys(variables).filter(name => name.startsWith(prefix))
  if (matching.length === 0) return false

  return matching.some(name => {
    const responseValue = variables[name]
    switch (op) {
      case "==": return String(responseValue) === value
      case "!=": return String(responseValue) !== value
      case ">=": return parseFloat(String(responseValue) || "0") >= parseFloat(value)
      case "<=": return parseFloat(String(responseValue) || "0") <= parseFloat(value)
      case ">": return parseFloat(String(responseValue) || "0") > parseFloat(value)
      case "<": return parseFloat(String(responseValue) || "0") < parseFloat(value)
      default: return false
    }
  })
}

// ============================================================================
// COMPARISON SUMS
// ============================================================================

function isComparisonSumRegion(region: Region): boolean {
  if (depthZeroIndices(region, ["cmp"]).length < 2) return false
  return additiveSplitIndices(region).length > 0
}

/**
 * Evaluates a comparison-sum region: top-level additive terms where each
 * term with a comparison counts 1/0 and plain terms count their numeric value.
 */
function evalComparisonSumRegion(region: Region, variables: Variables): number {
  const indices = additiveSplitIndices(region)
  const parts = splitAt(region, indices)
  const signs = [1, ...indices.map(i => (region.tokens[i].text === "+" ? 1 : -1))]

  return parts.reduce((sum, part, index) => {
    if (part.tokens.length === 0) return sum
    const value =
      depthZeroIndices(part, ["cmp"]).length >= 1
        ? (evalComparisonRegion(part, variables) ? 1 : 0)
        : evalArithmetic(part, variables)
    return sum + signs[index] * value
  }, 0)
}

/** Public entry: "a == Yes + b == Yes + 1" → count/sum */
export function evaluateComparisonSum(source: string, variables: Variables): number {
  const tokens = tokenize(source)
  return evalComparisonSumRegion({ tokens, source }, variables)
}

/**
 * True when the expression sums multiple comparisons: at least two
 * comparison operators spread across at least two top-level additive terms.
 * Single comparisons with arithmetic ("age + years >= 21") stay false.
 */
export function isComparisonSumExpression(source: string): boolean {
  try {
    const tokens = tokenize(source)
    return isComparisonSumRegion({ tokens, source })
  } catch {
    return false
  }
}

// ============================================================================
// ARITHMETIC
// ============================================================================

/**
 * Evaluates a pure arithmetic expression: + - * /, parentheses, unary minus.
 * Variables resolve via convertValueToNumber; unknown words count as 0.
 * Throws ConditionParseError on malformed input.
 */
export function evaluateArithmeticExpression(
  source: string,
  variables: Variables
): number {
  const tokens = tokenize(source)
  if (tokens.length === 0) throw new ConditionParseError("Empty expression")
  return evalArithmetic({ tokens, source }, variables)
}

function evalArithmetic(region: Region, variables: Variables): number {
  const cursor = { index: 0 }
  const result = parseAdditive(region, cursor, variables)
  if (cursor.index !== region.tokens.length) {
    const extra = region.tokens[cursor.index]
    throw new ConditionParseError(`Unexpected "${extra.text}" in expression`)
  }
  return result
}

type Cursor = { index: number }

function parseAdditive(region: Region, cursor: Cursor, variables: Variables): number {
  let value = parseMultiplicative(region, cursor, variables)
  while (cursor.index < region.tokens.length) {
    const token = region.tokens[cursor.index]
    if (token.type !== "arith" || (token.text !== "+" && token.text !== "-")) break
    cursor.index++
    const rhs = parseMultiplicative(region, cursor, variables)
    value = token.text === "+" ? value + rhs : value - rhs
  }
  return value
}

function parseMultiplicative(region: Region, cursor: Cursor, variables: Variables): number {
  let value = parseUnary(region, cursor, variables)
  while (cursor.index < region.tokens.length) {
    const token = region.tokens[cursor.index]
    if (token.type !== "arith" || (token.text !== "*" && token.text !== "/")) break
    cursor.index++
    const rhs = parseUnary(region, cursor, variables)
    value = token.text === "*" ? value * rhs : value / rhs
  }
  return value
}

function parseUnary(region: Region, cursor: Cursor, variables: Variables): number {
  const token = region.tokens[cursor.index]
  if (token && token.type === "arith" && (token.text === "-" || token.text === "+")) {
    cursor.index++
    const value = parseUnary(region, cursor, variables)
    return token.text === "-" ? -value : value
  }
  return parsePrimaryNumber(region, cursor, variables)
}

function parsePrimaryNumber(region: Region, cursor: Cursor, variables: Variables): number {
  const token = region.tokens[cursor.index]
  if (!token) throw new ConditionParseError("Unexpected end of expression")

  if (token.type === "lparen") {
    cursor.index++
    const value = parseAdditive(region, cursor, variables)
    const close = region.tokens[cursor.index]
    if (!close || close.type !== "rparen") {
      throw new ConditionParseError("Missing closing parenthesis")
    }
    cursor.index++
    return value
  }

  if (token.type === "word") {
    cursor.index++
    if (isNumericValue(token.text)) return parseFloat(token.text)
    return convertValueToNumber(variables[token.text])
  }

  if (token.type === "string") {
    cursor.index++
    const parsed = parseFloat(token.text)
    return isNaN(parsed) ? 0 : parsed
  }

  throw new ConditionParseError(`Unexpected "${token.text}" in expression`)
}
