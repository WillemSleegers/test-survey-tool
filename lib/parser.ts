import {
  Question,
  MultipleChoiceQuestion,
  CheckboxQuestion,
  TextQuestion,
  EssayQuestion,
  NumberQuestion,
  MatrixQuestion,
  BreakdownQuestion,
  Page,
  Block,
  NavItem,
  Section,
  SectionItem,
  Text,
  Option,
  BreakdownOption,
  Subquestion,
  ComputedVariable,
} from "@/lib/types"
import {
  validateVariableNames,
  validateConditionReferences,
  validateComputedVariableReferences,
} from "@/lib/validation"

// ============================================================================
// TYPES FOR CHUNKING
// ============================================================================

type QuestionChunk = {
  lines: string[]
  type: Question["type"]
  startIndex?: number // Track the starting index in the parent array
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Remove leading indentation (2+ spaces or 1 tab)
 */
const removeIndentation = (line: string): string => {
  if (line.startsWith('\t')) {
    return line.substring(1)
  }
  const match = line.match(/^(\s{2,})/)
  if (match) {
    return line.substring(match[1].length)
  }
  return line
}

/**
 * Check if line starts with pattern (after trimming)
 */
const startsWith = (line: string, pattern: string): boolean => {
  return line.trim().startsWith(pattern)
}

/**
 * Check if line matches a regex pattern
 */
const matches = (line: string, pattern: RegExp): boolean => {
  return pattern.test(line.trim())
}

/**
 * Extract value after a keyword (e.g., "VARIABLE: foo" → "foo")
 */
const extractAfterKeyword = (line: string, keyword: string): string => {
  const trimmed = line.trim()
  if (trimmed.startsWith(keyword)) {
    return trimmed.substring(keyword.length).trim()
  }
  return ""
}

/**
 * Find first occurrence of keyword in chunk and return its value
 * Returns undefined if not found
 */
const findKeyword = (lines: string[], keyword: string): string | undefined => {
  for (const line of lines) {
    if (startsWith(line, keyword)) {
      return extractAfterKeyword(line, keyword)
    }
  }
  return undefined
}

/**
 * Find all occurrences of a keyword in chunk
 */
const findAllKeywords = (lines: string[], keyword: string): string[] => {
  const results: string[] = []
  for (const line of lines) {
    if (startsWith(line, keyword)) {
      results.push(extractAfterKeyword(line, keyword))
    }
  }
  return results
}

/**
 * Parse multi-line content with delimiter support
 * Supports both single-line and delimited multi-line content
 */
const parseDelimitedContent = (
  lines: string[],
  keyword: string
): string | undefined => {
  let buffer: string[] = []
  let isCollecting = false
  let useDelimiters = false

  for (const line of lines) {
    const trimmed = line.trim()

    // Check for keyword with delimiter on same line
    if (trimmed.startsWith(keyword)) {
      const afterKeyword = trimmed.substring(keyword.length).trim()

      if (afterKeyword === '"""') {
        // Delimiter mode: keyword is on same line as opening delimiter
        useDelimiters = true
        isCollecting = true
        continue
      } else if (afterKeyword) {
        // Simple single-line mode
        return afterKeyword
      } else {
        // Keyword alone on line - start collecting for potential multi-line
        isCollecting = true
        useDelimiters = false
        continue
      }
    }

    if (isCollecting) {
      if (useDelimiters && trimmed === '"""') {
        // End delimiter found
        return buffer.join('\n')
      }

      if (!useDelimiters && (trimmed.startsWith("Q:") || trimmed.startsWith("#") || trimmed.startsWith("##") || trimmed.startsWith("BLOCK:") || trimmed.startsWith("NAV:"))) {
        // Hit another structural element - stop collecting
        return buffer.length > 0 ? buffer.join('\n') : undefined
      }

      buffer.push(removeIndentation(line))
    }
  }

  // If we were collecting, return what we have
  if (isCollecting && buffer.length > 0) {
    return buffer.join('\n')
  }

  return undefined
}

/**
 * Create an option with value and label set to the same string
 */
const createOption = (label: string, overrides?: Partial<Option>): Option => ({
  value: label,
  label: label,
  ...overrides,
})

// ============================================================================
// CHUNK IDENTIFICATION
// ============================================================================


/**
 * Identify block chunks from lines
 */
const identifyBlocks = (lines: string[]): string[][] => {
  const blockChunks: string[][] = []
  let currentBlockStart: number | null = null
  let firstBlockIndex: number | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (startsWith(trimmed, "BLOCK:")) {
      // Save previous block if any
      if (currentBlockStart !== null) {
        blockChunks.push(lines.slice(currentBlockStart, i))
      }

      // Track first BLOCK: marker
      if (firstBlockIndex === null) {
        firstBlockIndex = i
      }

      // Start new block
      currentBlockStart = i
    }
  }

  // If we found BLOCK: markers, check for content before first block
  if (firstBlockIndex !== null && firstBlockIndex > 0) {
    const beforeFirstBlock = lines.slice(0, firstBlockIndex)
    if (beforeFirstBlock.some(l => l.trim().length > 0)) {
      // Insert default block at beginning for content before first BLOCK:
      blockChunks.unshift(beforeFirstBlock)
    }
  }

  // Save final block
  if (currentBlockStart !== null) {
    blockChunks.push(lines.slice(currentBlockStart))
  }

  // If no BLOCK: markers found, treat all content as default block
  if (blockChunks.length === 0 && lines.length > 0) {
    if (lines.some(l => l.trim().length > 0)) {
      blockChunks.push(lines)
    }
  }

  return blockChunks
}

/**
 * Identify page chunks within a block or nav chunk
 * Pages are marked by `#` or `# Title`
 * Page chunks include the title line (needed by parsePage to extract the title)
 */
/**
 * Identify question chunks within a section
 * Questions are marked by `Q:` or `Q1:`
 * Questions end at: blank line, next question, or structural marker
 */
const identifyQuestions = (lines: string[]): QuestionChunk[] => {
  const questionChunks: QuestionChunk[] = []
  let currentQuestionStart: number | null = null
  let inDelimitedContent = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Check for delimiter start (HINT: """, TOOLTIP: """, etc.)
    // Also check for option-level delimited keywords (- HINT: """, - TOOLTIP: """)
    const keywords = ['HINT:', 'TOOLTIP:', 'VARIABLE:', 'SHOW_IF:']
    for (const keyword of keywords) {
      if (startsWith(trimmed, keyword) || startsWith(trimmed, `- ${keyword}`)) {
        const afterKeyword = startsWith(trimmed, '- ')
          ? trimmed.substring(2 + keyword.length).trim()
          : trimmed.substring(keyword.length).trim()
        if (afterKeyword === '"""') {
          inDelimitedContent = true
          break
        }
      }
    }

    // Check for closing delimiter
    if (inDelimitedContent && trimmed === '"""') {
      inDelimitedContent = false
      continue
    }

    // Skip lines inside delimited content
    if (inDelimitedContent) {
      continue
    }

    // Check if this is a structural marker (ends current question)
    const isStructuralMarker = matches(trimmed, /^#/) || startsWith(trimmed, "BLOCK:") || startsWith(trimmed, "NAV:")

    if (isStructuralMarker) {
      // Save current question before hitting structural marker
      if (currentQuestionStart !== null) {
        const questionLines = lines.slice(currentQuestionStart, i)
        const type = determineQuestionType(questionLines)
        questionChunks.push({
          lines: questionLines,
          type,
          startIndex: currentQuestionStart,
        })
        currentQuestionStart = null
      }
      continue
    }

    // Check for question marker
    if (matches(trimmed, /^Q\d*:/)) {
      // Save previous question
      if (currentQuestionStart !== null) {
        const questionLines = lines.slice(currentQuestionStart, i)
        const type = determineQuestionType(questionLines)
        questionChunks.push({
          lines: questionLines,
          type,
          startIndex: currentQuestionStart,
        })
      }

      // Start new question
      currentQuestionStart = i
    } else if (currentQuestionStart !== null && !trimmed) {
      // Blank line - check if next non-blank line is an option
      let nextNonBlankIndex = i + 1
      while (nextNonBlankIndex < lines.length && !lines[nextNonBlankIndex].trim()) {
        nextNonBlankIndex++
      }

      const nextLine = nextNonBlankIndex < lines.length ? lines[nextNonBlankIndex].trim() : ''
      const isNextLineOption = matches(nextLine, /^-\s+/)

      // Only end question if next line is NOT an option
      if (!isNextLineOption) {
        const questionLines = lines.slice(currentQuestionStart, i)
        const type = determineQuestionType(questionLines)
        questionChunks.push({
          lines: questionLines,
          type,
          startIndex: currentQuestionStart,
        })
        currentQuestionStart = null
      }
    }
  }

  // Save final question if we're still in one
  if (currentQuestionStart !== null) {
    const questionLines = lines.slice(currentQuestionStart)
    const type = determineQuestionType(questionLines)
    questionChunks.push({
      lines: questionLines,
      type,
      startIndex: currentQuestionStart,
    })
  }

  return questionChunks
}

/**
 * Determine question type by scanning for keywords and patterns
 */
const determineQuestionType = (lines: string[]): Question["type"] => {
  let hasSubquestions = false
  let hasOptions = false
  let hasRange = false
  let hasBreakdown = false
  let hasExplicitTextType = false
  let hasExplicitEssayType = false
  let hasExplicitNumberType = false
  let hasExplicitCheckboxType = false

  for (const line of lines) {

    const trimmed = line.trim()

    // Collect all information first before deciding type
    if (trimmed === "TEXT") hasExplicitTextType = true
    if (trimmed === "ESSAY") hasExplicitEssayType = true
    if (trimmed === "NUMBER") hasExplicitNumberType = true
    if (trimmed === "BREAKDOWN") hasBreakdown = true
    if (trimmed === "CHECKBOX") hasExplicitCheckboxType = true

    // Check for RANGE keyword
    if (startsWith(trimmed, "RANGE:")) {
      hasRange = true
    }

    // Check for matrix indicator (subquestions)
    if (matches(trimmed, /^-\s*Q\d*:/)) {
      hasSubquestions = true
    }

    // Check for options
    if (matches(trimmed, /^-\s+[^Q]/)) {
      hasOptions = true
    }
  }

  // Determine type based on collected information
  if (hasBreakdown) return "breakdown"

  // If has subquestions, it's a matrix (even if TEXT/ESSAY/CHECKBOX is specified - those become inputType)
  if (hasSubquestions) return "matrix"

  // Explicit type keywords (only if not matrix)
  if (hasExplicitTextType) return "text"
  if (hasExplicitEssayType) return "essay"
  if (hasExplicitNumberType) return "number"

  // If has options or RANGE, it's multiple choice or checkbox
  if (hasExplicitCheckboxType && (hasOptions || hasRange)) return "checkbox"
  if (hasOptions || hasRange) return "multiple_choice"

  // Default to text
  return "text"
}

// ============================================================================
// QUESTION PARSERS
// ============================================================================

/**
 * Shared question base parser
 */
const parseQuestionBase = (lines: string[], questionCounter: { count: number }) => {
  const id = `Q${questionCounter.count++}`

  // Extract question text (first line after Q:)
  const questionLine = lines.find((line) =>
    matches(line.trim(), /^Q\d*:/)
  )
  const text = questionLine
    ? questionLine.trim().replace(/^Q\d*:\s*/, '')
    : ''

  return {
    id,
    text,
    subtext: parseDelimitedContent(lines, "HINT:"),
    tooltip: parseDelimitedContent(lines, "TOOLTIP:"),
    variable: findKeyword(lines, "VARIABLE:"),
    showIf: findKeyword(lines, "SHOW_IF:"),
  }
}

/**
 * Parse text question
 */
const parseTextQuestion = (lines: string[], questionCounter: { count: number }): TextQuestion => {
  return {
    type: "text",
    ...parseQuestionBase(lines, questionCounter),
  }
}

/**
 * Parse essay question
 */
const parseEssayQuestion = (lines: string[], questionCounter: { count: number }): EssayQuestion => {
  return {
    type: "essay",
    ...parseQuestionBase(lines, questionCounter),
  }
}

/**
 * Parse number question
 */
const parseNumberQuestion = (lines: string[], questionCounter: { count: number }): NumberQuestion => {
  return {
    type: "number",
    ...parseQuestionBase(lines, questionCounter),
    prefix: findKeyword(lines, "PREFIX:"),
    suffix: findKeyword(lines, "SUFFIX:"),
  }
}

/**
 * Generate options from RANGE syntax
 */
const generateRangeOptions = (rangeStr: string): Option[] => {
  const match = rangeStr.match(/^(-?\d+)-(-?\d+)$/)
  if (!match) {
    throw new Error(`Invalid RANGE syntax: "${rangeStr}". Expected format: "start-end" (e.g., "1-10")`)
  }

  const start = parseInt(match[1], 10)
  const end = parseInt(match[2], 10)

  if (start > end) {
    throw new Error(`Invalid RANGE: start (${start}) must be less than or equal to end (${end})`)
  }

  const options: Option[] = []
  for (let i = start; i <= end; i++) {
    options.push(createOption(i.toString()))
  }

  return options
}

/**
 * Parse options for multiple choice and checkbox questions
 */
const parseOptions = (lines: string[]): Option[] => {
  const options: Option[] = []
  let currentOption: Partial<Option> | null = null
  let collectingHint = false
  let collectingTooltip = false
  let hintBuffer: string[] = []
  let tooltipBuffer: string[] = []

  for (const line of lines) {

    const trimmed = line.trim()

    // Handle delimited content collection (must be before other checks)
    if (collectingHint || collectingTooltip) {
      if (trimmed === '"""') {
        // End delimiter
        if (collectingHint && currentOption) {
          currentOption.hint = hintBuffer.join('\n')
          collectingHint = false
        }
        if (collectingTooltip && currentOption) {
          currentOption.tooltip = tooltipBuffer.join('\n')
          collectingTooltip = false
        }
        continue
      } else {
        // Collecting multi-line content
        if (collectingHint) {
          hintBuffer.push(trimmed)
        }
        if (collectingTooltip) {
          tooltipBuffer.push(trimmed)
        }
        continue
      }
    }

    // Check for RANGE keyword
    if (startsWith(trimmed, "RANGE:")) {
      // Save current option if any
      if (currentOption) {
        options.push(createOption(currentOption.label || '', {
          hint: currentOption.hint,
          tooltip: currentOption.tooltip,
          showIf: currentOption.showIf,
          allowsOtherText: currentOption.allowsOtherText,
        }))
        currentOption = null
      }

      // Generate and add range options
      const rangeStr = extractAfterKeyword(trimmed, "RANGE:")
      const rangeOptions = generateRangeOptions(rangeStr)
      options.push(...rangeOptions)
      continue
    }

    // Check for option line: "- Option text" (not "- Q:")
    if (matches(trimmed, /^-\s+/) && !matches(trimmed, /^-\s*Q\d*:/)) {
      const content = trimmed.replace(/^-\s+/, '')

      // Skip subquestion metadata (these belong to subquestions not options)
      // We need to distinguish from option-level SHOW_IF by checking if there's a current option
      const isSubquestionMetadata =
        (startsWith(content, "VARIABLE:")) ||
        (startsWith(content, "SHOW_IF:") && !currentOption)

      if (isSubquestionMetadata) {
        continue // Skip this line, it's metadata for a subquestion
      }

      // Check if this is option metadata or a new option
      const isOptionMetadata =
        content === "OTHER" ||
        startsWith(content, "SHOW_IF:") ||
        startsWith(content, "HINT:") ||
        startsWith(content, "TOOLTIP:") ||
        content === '"""'

      if (isOptionMetadata && currentOption) {
        // This is metadata for the current option
        if (content === "OTHER") {
          currentOption.allowsOtherText = true
        } else if (startsWith(content, "SHOW_IF:")) {
          currentOption.showIf = extractAfterKeyword(content, "SHOW_IF:")
        } else if (startsWith(content, "HINT:")) {
          const hintValue = extractAfterKeyword(content, "HINT:")
          if (hintValue === '"""') {
            collectingHint = true
            hintBuffer = []
          } else if (hintValue) {
            currentOption.hint = hintValue
          } else {
            collectingHint = true
            hintBuffer = []
          }
        } else if (startsWith(content, "TOOLTIP:")) {
          const tooltipValue = extractAfterKeyword(content, "TOOLTIP:")
          if (tooltipValue === '"""') {
            collectingTooltip = true
            tooltipBuffer = []
          } else if (tooltipValue) {
            currentOption.tooltip = tooltipValue
          } else {
            collectingTooltip = true
            tooltipBuffer = []
          }
        }
      } else {
        // This is a new option
        if (currentOption) {
          options.push(createOption(currentOption.label || '', {
            hint: currentOption.hint,
            tooltip: currentOption.tooltip,
            showIf: currentOption.showIf,
            allowsOtherText: currentOption.allowsOtherText,
          }))
        }

        currentOption = { label: content }
        collectingHint = false
        collectingTooltip = false
        hintBuffer = []
        tooltipBuffer = []
      }
    }
  }

  // Save final option
  if (currentOption) {
    options.push(createOption(currentOption.label || '', {
      hint: currentOption.hint,
      tooltip: currentOption.tooltip,
      showIf: currentOption.showIf,
      allowsOtherText: currentOption.allowsOtherText,
    }))
  }

  return options
}

/**
 * Parse multiple choice question
 */
const parseMultipleChoiceQuestion = (lines: string[], questionCounter: { count: number }): MultipleChoiceQuestion => {
  return {
    type: "multiple_choice",
    ...parseQuestionBase(lines, questionCounter),
    options: parseOptions(lines),
  }
}

/**
 * Parse checkbox question
 */
const parseCheckboxQuestion = (lines: string[], questionCounter: { count: number }): CheckboxQuestion => {
  return {
    type: "checkbox",
    ...parseQuestionBase(lines, questionCounter),
    options: parseOptions(lines),
  }
}

/**
 * Parse subquestions for matrix questions
 */
const parseSubquestions = (lines: string[], baseId: string): Subquestion[] => {
  const subquestions: Subquestion[] = []
  let currentSubquestion: Partial<Subquestion> | null = null
  let subquestionIndex = 0

  for (const line of lines) {

    const trimmed = line.trim()

    // Check for subquestion line: "- Q: Subquestion text"
    if (matches(trimmed, /^-\s*Q\d*:/)) {
      // Save previous subquestion
      if (currentSubquestion) {
        subquestions.push(currentSubquestion as Subquestion)
      }

      // Start new subquestion
      const subqText = trimmed.replace(/^-\s*Q\d*:\s*/, '')
      currentSubquestion = {
        id: `${baseId}_${subquestionIndex++}`,
        text: subqText,
      }
    }
    // Check for metadata lines: "- VARIABLE:", "- SHOW_IF:", etc.
    else if (currentSubquestion && matches(trimmed, /^-\s+/)) {
      const content = trimmed.replace(/^-\s+/, '')

      if (startsWith(content, "VARIABLE:")) {
        currentSubquestion.variable = extractAfterKeyword(content, "VARIABLE:")
      } else if (startsWith(content, "SHOW_IF:")) {
        currentSubquestion.showIf = extractAfterKeyword(content, "SHOW_IF:")
      } else if (startsWith(content, "HINT:")) {
        currentSubquestion.subtext = extractAfterKeyword(content, "HINT:")
      } else if (startsWith(content, "TOOLTIP:")) {
        currentSubquestion.tooltip = extractAfterKeyword(content, "TOOLTIP:")
      }
    }
  }

  // Save final subquestion
  if (currentSubquestion) {
    subquestions.push(currentSubquestion as Subquestion)
  }

  return subquestions
}

/**
 * Parse matrix question
 */
const parseMatrixQuestion = (lines: string[], questionCounter: { count: number }): MatrixQuestion => {
  const base = parseQuestionBase(lines, questionCounter)

  // Determine input type (TEXT, ESSAY, CHECKBOX, or default radio)
  let inputType: "checkbox" | "text" | "essay" | undefined
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === "CHECKBOX") inputType = "checkbox"
    else if (trimmed === "TEXT") inputType = "text"
    else if (trimmed === "ESSAY") inputType = "essay"
  }

  // Parse subquestions and options
  const subquestions = parseSubquestions(lines, base.id)
  const options = parseOptions(lines)

  return {
    type: "matrix",
    ...base,
    subquestions,
    options,
    inputType,
  }
}

/**
 * Parse breakdown options
 */
const parseBreakdownOptions = (lines: string[]): BreakdownOption[] => {
  const options: BreakdownOption[] = []
  let currentOption: Partial<BreakdownOption> | null = null
  let collectingHint = false
  let collectingTooltip = false
  let hintBuffer: string[] = []
  let tooltipBuffer: string[] = []

  for (const line of lines) {

    const trimmed = line.trim()

    // Handle delimited content collection (must be before other checks)
    if (collectingHint || collectingTooltip) {
      if (trimmed === '"""') {
        // End delimiter
        if (collectingHint && currentOption) {
          currentOption.hint = hintBuffer.join('\n')
          collectingHint = false
        }
        if (collectingTooltip && currentOption) {
          currentOption.tooltip = tooltipBuffer.join('\n')
          collectingTooltip = false
        }
        continue
      } else {
        // Collecting multi-line content
        if (collectingHint) {
          hintBuffer.push(trimmed)
        }
        if (collectingTooltip) {
          tooltipBuffer.push(trimmed)
        }
        continue
      }
    }

    // Check for special option types
    if (matches(trimmed, /^-\s+HEADER:/)) {
      if (currentOption) {
        options.push(currentOption as BreakdownOption)
      }
      const headerText = trimmed.replace(/^-\s+HEADER:\s*/, '')
      currentOption = {
        value: headerText,
        label: headerText,
        header: true,
        exclude: true,
      }
    } else if (matches(trimmed, /^-\s+SUBTOTAL:/)) {
      if (currentOption) {
        options.push(currentOption as BreakdownOption)
      }
      const subtotalText = trimmed.replace(/^-\s+SUBTOTAL:\s*/, '')
      currentOption = {
        value: subtotalText,
        label: subtotalText,
        subtotalLabel: subtotalText,
        exclude: true,
      }
    } else if (trimmed === '- SEPARATOR') {
      if (currentOption) {
        options.push(currentOption as BreakdownOption)
      }
      currentOption = {
        value: '',
        label: '',
        separator: true,
        exclude: true,
      }
    } else if (matches(trimmed, /^-\s+/) && !matches(trimmed, /^-\s*Q\d*:/)) {
      const content = trimmed.replace(/^-\s+/, '')

      // Check if this is metadata or a new option
      const isMetadata =
        content === "EXCLUDE" ||
        content === "SUBTRACT" ||
        startsWith(content, "COLUMN:") ||
        startsWith(content, "VALUE:") ||
        startsWith(content, "VARIABLE:") ||
        startsWith(content, "PREFIX:") ||
        startsWith(content, "SUFFIX:") ||
        startsWith(content, "SHOW_IF:") ||
        startsWith(content, "HINT:") ||
        startsWith(content, "TOOLTIP:") ||
        startsWith(content, "CUSTOM:")

      if (isMetadata && currentOption) {
        // This is metadata for the current option
        if (content === "EXCLUDE") {
          currentOption.exclude = true
        } else if (content === "SUBTRACT") {
          currentOption.subtract = true
        } else if (startsWith(content, "COLUMN:")) {
          const colValue = extractAfterKeyword(content, "COLUMN:")
          currentOption.column = parseInt(colValue, 10)
        } else if (startsWith(content, "VALUE:")) {
          currentOption.prefillValue = extractAfterKeyword(content, "VALUE:")
        } else if (startsWith(content, "VARIABLE:")) {
          currentOption.variable = extractAfterKeyword(content, "VARIABLE:")
        } else if (startsWith(content, "PREFIX:")) {
          currentOption.prefix = extractAfterKeyword(content, "PREFIX:")
        } else if (startsWith(content, "SUFFIX:")) {
          currentOption.suffix = extractAfterKeyword(content, "SUFFIX:")
        } else if (startsWith(content, "SHOW_IF:")) {
          currentOption.showIf = extractAfterKeyword(content, "SHOW_IF:")
        } else if (startsWith(content, "CUSTOM:")) {
          currentOption.custom = extractAfterKeyword(content, "CUSTOM:")
        } else if (startsWith(content, "HINT:")) {
          const hintValue = extractAfterKeyword(content, "HINT:")
          if (hintValue === '"""') {
            collectingHint = true
            hintBuffer = []
          } else if (hintValue) {
            currentOption.hint = hintValue
          } else {
            collectingHint = true
            hintBuffer = []
          }
        } else if (startsWith(content, "TOOLTIP:")) {
          const tooltipValue = extractAfterKeyword(content, "TOOLTIP:")
          if (tooltipValue === '"""') {
            collectingTooltip = true
            tooltipBuffer = []
          } else if (tooltipValue) {
            currentOption.tooltip = tooltipValue
          } else {
            collectingTooltip = true
            tooltipBuffer = []
          }
        }
      } else {
        // This is a new regular option
        if (currentOption) {
          options.push(currentOption as BreakdownOption)
        }
        currentOption = {
          value: content,
          label: content,
        }
      }
    }
  }

  // Save final option
  if (currentOption) {
    options.push(currentOption as BreakdownOption)
  }

  return options
}

/**
 * Parse breakdown question
 */
const parseBreakdownQuestion = (lines: string[], questionCounter: { count: number }): BreakdownQuestion => {
  return {
    type: "breakdown",
    ...parseQuestionBase(lines, questionCounter),
    options: parseBreakdownOptions(lines),
    totalLabel: findKeyword(lines, "TOTAL:"),
    prefix: findKeyword(lines, "PREFIX:"),
    suffix: findKeyword(lines, "SUFFIX:"),
  }
}

/**
 * Dispatch to type-specific question parser
 */
const parseQuestionByType = (chunk: QuestionChunk, questionCounter: { count: number }): Question => {
  switch (chunk.type) {
    case "text":
      return parseTextQuestion(chunk.lines, questionCounter)
    case "essay":
      return parseEssayQuestion(chunk.lines, questionCounter)
    case "number":
      return parseNumberQuestion(chunk.lines, questionCounter)
    case "multiple_choice":
      return parseMultipleChoiceQuestion(chunk.lines, questionCounter)
    case "checkbox":
      return parseCheckboxQuestion(chunk.lines, questionCounter)
    case "matrix":
      return parseMatrixQuestion(chunk.lines, questionCounter)
    case "breakdown":
      return parseBreakdownQuestion(chunk.lines, questionCounter)
    default:
      throw new Error(`Unknown question type: ${(chunk as QuestionChunk).type}`)
  }
}

// ============================================================================
// HIERARCHICAL PARSERS
// ============================================================================

/**
 * Parse a section chunk
 * Single-pass state machine that builds interleaved content/questions and extracts metadata
 */
const parseSection = (lines: string[], questionCounter: { count: number }, sectionIdCounter: { count: number }): Section => {
  const questionChunks = identifyQuestions(lines)
  const sectionId = sectionIdCounter.count++

  // Extract section title immediately
  let title: string | undefined
  for (const line of lines) {
    const trimmed = line.trim()
    if (matches(trimmed, /^##/)) {
      title = trimmed.replace(/^##\s*/, '').trim()
      break
    }
  }

  // Build question lookup map
  const lineToQuestion = new Map<number, QuestionChunk>()
  for (const qChunk of questionChunks) {
    if (qChunk.startIndex !== undefined) {
      lineToQuestion.set(qChunk.startIndex, qChunk)
    }
  }

  // State for single-pass parsing
  let tooltip: string | undefined
  let showIf: string | undefined
  const items: SectionItem[] = []
  let contentBuffer: string[] = []

  // State machine: parsing specific section elements
  type State = 'tooltip' | 'showif' | 'content'
  let state: State = 'content'
  let metadataBuffer: string[] = []
  let useDelimiters = false

  const flushContent = () => {
    if (contentBuffer.length > 0) {
      const value = contentBuffer.join('\n').trim()
      if (value) {
        items.push({ value })
      }
      contentBuffer = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Handle metadata collection states
    if (state === 'tooltip' || state === 'showif') {
      if (useDelimiters && trimmed === '"""') {
        // End of delimited metadata
        if (state === 'tooltip') {
          tooltip = metadataBuffer.join('\n')
        } else {
          showIf = metadataBuffer.join('\n')
        }
        state = 'content'
        metadataBuffer = []
        useDelimiters = false
        continue
      }

      // Non-delimiter mode: stop collecting if we hit structural elements
      if (!useDelimiters && (trimmed.startsWith('Q:') || matches(trimmed, /^Q\d+:/) || matches(trimmed, /^##/))) {
        if (state === 'tooltip') {
          tooltip = metadataBuffer.length > 0 ? metadataBuffer.join('\n') : undefined
        } else {
          showIf = metadataBuffer.length > 0 ? metadataBuffer.join('\n') : undefined
        }
        state = 'content'
        metadataBuffer = []
        useDelimiters = false
        // Don't continue - let this line be processed normally
      } else {
        // Collect metadata content
        metadataBuffer.push(removeIndentation(line))
        continue
      }
    }

    // Skip section title marker (already extracted)
    if (matches(trimmed, /^##/)) {
      continue
    }

    // Check for TOOLTIP keyword
    if (trimmed.startsWith('TOOLTIP:')) {
      flushContent()
      const afterKeyword = trimmed.substring('TOOLTIP:'.length).trim()
      if (afterKeyword === '"""') {
        state = 'tooltip'
        useDelimiters = true
      } else if (afterKeyword) {
        tooltip = afterKeyword
      } else {
        state = 'tooltip'
        useDelimiters = false
      }
      continue
    }

    // Check for SHOW_IF keyword
    if (trimmed.startsWith('SHOW_IF:')) {
      flushContent()
      const afterKeyword = trimmed.substring('SHOW_IF:'.length).trim()
      if (afterKeyword === '"""') {
        state = 'showif'
        useDelimiters = true
      } else if (afterKeyword) {
        showIf = afterKeyword
      } else {
        state = 'showif'
        useDelimiters = false
      }
      continue
    }

    // Handle questions
    if (lineToQuestion.has(i)) {
      flushContent()
      const qChunk = lineToQuestion.get(i)!
      const question = parseQuestionByType(qChunk, questionCounter)
      items.push(question)
      i += qChunk.lines.length - 1
      continue
    }

    // Everything else is content
    if (trimmed) {
      contentBuffer.push(line)
    } else if (contentBuffer.length > 0) {
      // Preserve blank lines between content (push empty line to maintain paragraph spacing)
      contentBuffer.push('')
    }
  }

  // Flush any remaining content or metadata
  flushContent()
  if (state === 'tooltip' && metadataBuffer.length > 0) {
    tooltip = metadataBuffer.join('\n')
  }
  if (state === 'showif' && metadataBuffer.length > 0) {
    showIf = metadataBuffer.join('\n')
  }

  return {
    id: sectionId,
    title,
    tooltip,
    items,
    showIf,
  }
}

/**
 * Parse a page chunk
 * Single-pass state machine that extracts page metadata and builds section chunks
 */
const parsePage = (lines: string[], questionCounter: { count: number }, pageIdCounter: { count: number}): Page => {
  const pageId = pageIdCounter.count++
  const sectionIdCounter = { count: 1 }

  // Extract page title immediately
  let title = ''
  for (const line of lines) {
    const trimmed = line.trim()
    if (matches(trimmed, /^#\s/) || trimmed === '#') {
      title = trimmed.replace(/^#\s*/, '').trim()
      break
    }
  }

  // State for parsing
  let tooltip: string | undefined
  let navLevel: number | undefined
  const computedVariables: ComputedVariable[] = []
  const sectionLines: string[][] = []
  let currentSectionLines: string[] = []

  // State machine: parsing specific page elements
  type State = 'navigation' | 'tooltip' | 'compute' | 'sections'
  let state: State = 'navigation'
  let metadataBuffer: string[] = []
  let useDelimiters = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip page title (already extracted)
    if (matches(trimmed, /^#\s/) || trimmed === '#') {
      continue
    }

    // Handle tooltip metadata collection
    if (state === 'tooltip') {
      if (useDelimiters && trimmed === '"""') {
        tooltip = metadataBuffer.join('\n')
        state = 'navigation'
        metadataBuffer = []
        useDelimiters = false
        continue
      }

      // Non-delimiter mode: stop if we hit section content or other keywords
      if (!useDelimiters && (trimmed.startsWith('Q:') || matches(trimmed, /^Q\d+:/) || matches(trimmed, /^##/) || (trimmed && !trimmed.startsWith('NAVIGATION:') && !trimmed.startsWith('COMPUTE:')))) {
        tooltip = metadataBuffer.length > 0 ? metadataBuffer.join('\n') : undefined
        state = 'sections'
        metadataBuffer = []
        // Don't continue - process this line as section content
      } else {
        metadataBuffer.push(removeIndentation(line))
        continue
      }
    }

    // Handle page-level keywords (before we reach section content)
    if (state !== 'sections') {
      // Extract NAVIGATION
      if (trimmed.startsWith('NAVIGATION:')) {
        const navValue = trimmed.substring('NAVIGATION:'.length).trim()
        navLevel = navValue ? parseInt(navValue, 10) : undefined
        continue
      }

      // Extract TOOLTIP
      if (trimmed.startsWith('TOOLTIP:')) {
        const afterKeyword = trimmed.substring('TOOLTIP:'.length).trim()
        if (afterKeyword === '"""') {
          state = 'tooltip'
          useDelimiters = true
        } else if (afterKeyword) {
          tooltip = afterKeyword
        } else {
          state = 'tooltip'
          useDelimiters = false
        }
        continue
      }

      // Extract COMPUTE variables
      if (trimmed.startsWith('COMPUTE:')) {
        const computeContent = trimmed.substring('COMPUTE:'.length).trim()
        if (computeContent) {
          const match = computeContent.match(/^(\w+)\s*=\s*(.+)$/)
          if (match) {
            computedVariables.push({
              name: match[1],
              expression: match[2],
            })
          }
        }
        continue
      }

      // If we hit anything that's not a page-level keyword, transition to sections
      if (trimmed) {
        state = 'sections'
        // Fall through to process this line as section content
      } else {
        continue
      }
    }

    // In sections state: build section chunks
    if (state === 'sections') {
      // Check for section marker
      if (matches(trimmed, /^##/)) {
        // Save current section if it has content
        if (currentSectionLines.length > 0) {
          sectionLines.push(currentSectionLines)
          currentSectionLines = []
        }
      }

      // Add line to current section
      currentSectionLines.push(line)
    }
  }

  // Save final section
  if (currentSectionLines.length > 0) {
    sectionLines.push(currentSectionLines)
  }

  // Parse all sections
  const sections = sectionLines.map(sLines => parseSection(sLines, questionCounter, sectionIdCounter))

  return {
    id: pageId,
    title,
    tooltip,
    sections,
    computedVariables,
    navLevel,
  }
}

/**
 * Parse a block chunk
 * Single-pass state machine that extracts block metadata and builds page chunks
 */
const parseBlock = (lines: string[], blockIdCounter: { count: number }, pageIdCounter: { count: number }): Block => {
  const blockId = blockIdCounter.count++
  const questionCounter = { count: 1 }

  // Extract block name immediately
  let name = ''
  for (const line of lines) {
    if (startsWith(line, "BLOCK:")) {
      name = extractAfterKeyword(line, "BLOCK:")
      break
    }
  }

  // State for parsing
  let showIf: string | undefined
  const computedVariables: ComputedVariable[] = []
  const pageLines: string[][] = []
  let currentPageLines: string[] = []

  // State machine: parsing specific block elements
  type State = 'showif' | 'compute' | 'pages'
  let state: State = 'showif'

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip block name (already extracted)
    if (startsWith(trimmed, "BLOCK:")) {
      continue
    }

    // Handle block-level keywords (before we reach page content)
    if (state !== 'pages') {
      // Extract SHOW_IF
      if (trimmed.startsWith('SHOW_IF:')) {
        showIf = extractAfterKeyword(trimmed, 'SHOW_IF:')
        continue
      }

      // Extract COMPUTE variables
      if (trimmed.startsWith('COMPUTE:')) {
        const computeContent = trimmed.substring('COMPUTE:'.length).trim()
        if (computeContent) {
          const match = computeContent.match(/^(\w+)\s*=\s*(.+)$/)
          if (match) {
            computedVariables.push({
              name: match[1],
              expression: match[2],
            })
          }
        }
        continue
      }

      // If we hit a page marker, transition to pages
      if (matches(trimmed, /^#\s/) || trimmed === '#') {
        state = 'pages'
        // Fall through to process this line as page content
      } else if (trimmed) {
        // Any other non-empty line means we're in page content
        state = 'pages'
        // Fall through to process this line as page content
      } else {
        continue
      }
    }

    // In pages state: build page chunks
    if (state === 'pages') {
      // Check for page marker
      if (matches(trimmed, /^#\s/) || trimmed === '#') {
        // Save current page if it has content
        if (currentPageLines.length > 0) {
          pageLines.push(currentPageLines)
          currentPageLines = []
        }
      }

      // Add line to current page
      currentPageLines.push(line)
    }
  }

  // Save final page
  if (currentPageLines.length > 0) {
    pageLines.push(currentPageLines)
  }

  // Parse all pages
  const pages = pageLines.map(pLines => parsePage(pLines, questionCounter, pageIdCounter))

  return {
    id: blockId,
    name,
    showIf,
    pages,
    computedVariables,
  }
}


// ============================================================================
// MAIN EXPORT
// ============================================================================

export const parseQuestionnaire = (text: string): { blocks: Block[], navItems: NavItem[] } => {
  try {
    const rawLines = text.split("\n")
    const lines: string[] = rawLines

    // Identify blocks
    const blockChunks = identifyBlocks(lines)

    // Create ID counters for unique identification
    const blockIdCounter = { count: 1 }
    const pageIdCounter = { count: 1 }

    // Parse blocks
    const blocks = blockChunks.map(chunk => parseBlock(chunk, blockIdCounter, pageIdCounter))

    // Derive navigation items from pages with navLevel metadata
    const navItems = deriveNavItemsFromPages(blocks)

    // Run validation checks
    validateVariableNames(blocks)
    validateConditionReferences(blocks)
    validateComputedVariableReferences(blocks)

    return { blocks, navItems }
  } catch (err) {
    throw new Error(
      "Failed to parse questionnaire format: " + (err as Error).message
    )
  }
}

/**
 * Derive navigation items from pages that have navLevel metadata
 * Pages with navLevel become nav items, using their title as the nav label
 */
const deriveNavItemsFromPages = (blocks: Block[]): NavItem[] => {
  const navItems: NavItem[] = []

  // Collect all pages from all blocks
  const allPages = blocks.flatMap(block => block.pages)

  // Group pages by their navLevel
  for (const page of allPages) {
    if (page.navLevel !== undefined) {
      // Create a nav item for this page
      navItems.push({
        name: page.title,
        level: page.navLevel,
        pages: [page],
      })
    }
  }

  return navItems
}
