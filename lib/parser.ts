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

      if (afterKeyword === "---") {
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
      if (useDelimiters && trimmed === "---") {
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

// ============================================================================
// CHUNK IDENTIFICATION
// ============================================================================

/**
 * Identify top-level chunks: BLOCK and NAV sections
 */
const identifyTopLevelChunks = (lines: string[]): {
  blockChunks: string[][]
  navChunks: string[][]
} => {
  const blockChunks: string[][] = []
  const navChunks: string[][] = []

  let currentBlockStart: number | null = null
  let currentNavStart: number | null = null
  let inBlock = false
  let inNav = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (startsWith(trimmed, "BLOCK:")) {
      // Save previous chunk
      if (inNav && currentNavStart !== null) {
        navChunks.push(lines.slice(currentNavStart, i))
      }
      if (inBlock && currentBlockStart !== null) {
        blockChunks.push(lines.slice(currentBlockStart, i))
      }

      // Start new block
      currentBlockStart = i
      inBlock = true
      inNav = false
      currentNavStart = null
    } else if (startsWith(trimmed, "NAV:")) {
      // Save previous chunk
      if (inBlock && currentBlockStart !== null) {
        blockChunks.push(lines.slice(currentBlockStart, i))
      }
      if (inNav && currentNavStart !== null) {
        navChunks.push(lines.slice(currentNavStart, i))
      }

      // Start new nav
      currentNavStart = i
      inNav = true
      inBlock = false
      currentBlockStart = null
    }
  }

  // Save final chunk
  if (inBlock && currentBlockStart !== null) {
    blockChunks.push(lines.slice(currentBlockStart))
  }
  if (inNav && currentNavStart !== null) {
    navChunks.push(lines.slice(currentNavStart))
  }

  // If no explicit blocks or navs, treat all lines as default block
  if (blockChunks.length === 0 && navChunks.length === 0 && lines.length > 0) {
    blockChunks.push(lines)
  }

  return { blockChunks, navChunks }
}

/**
 * Identify page chunks within a block or nav chunk
 * Pages are marked by `#` or `# Title`
 * Page chunks include the title line (needed by parsePage to extract the title)
 */
const identifyPages = (lines: string[]): string[][] => {
  const pageChunks: string[][] = []
  let currentPageStart: number | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Check for page marker: # or # Title (but not ## which is section)
    if (matches(trimmed, /^#\s/) || trimmed === "#") {
      // Save previous page
      if (currentPageStart !== null) {
        pageChunks.push(lines.slice(currentPageStart, i))
      }

      // Start new page (includes the title line)
      currentPageStart = i
    }
  }

  // Save final page
  if (currentPageStart !== null) {
    pageChunks.push(lines.slice(currentPageStart))
  }

  // If no pages found, treat entire chunk as default page
  if (pageChunks.length === 0 && lines.length > 0) {
    pageChunks.push(lines)
  }

  return pageChunks
}

/**
 * Identify section chunks within a page
 * Sections are marked by `##` or `## Section Title`
 */
const identifySections = (lines: string[]): string[][] => {
  const sectionChunks: string[][] = []
  let currentSectionStart: number | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip page markers
    if (matches(trimmed, /^#\s/) || trimmed === "#") {
      continue
    }

    // Check for section marker: ##
    if (matches(trimmed, /^##\s/) || trimmed === "##") {
      // Save previous section
      if (currentSectionStart !== null) {
        sectionChunks.push(lines.slice(currentSectionStart, i))
      }

      // Start new section
      currentSectionStart = i
    }
  }

  // Save final section
  if (currentSectionStart !== null) {
    sectionChunks.push(lines.slice(currentSectionStart))
  }

  // If no sections found, treat entire chunk as default section (excluding page title)
  if (sectionChunks.length === 0 && lines.length > 0) {
    const filteredLines = lines.filter((line) => {
      const trimmed = line.trim()
      // Exclude page title markers
      return !(matches(trimmed, /^#\s/) || trimmed === "#")
    })

    if (filteredLines.length > 0) {
      sectionChunks.push(filteredLines)
    }
  }

  return sectionChunks
}

/**
 * Identify question chunks within a section
 * Questions are marked by `Q:` or `Q1:`
 */
const identifyQuestions = (lines: string[]): QuestionChunk[] => {
  const questionChunks: QuestionChunk[] = []
  let currentQuestionStart: number | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip structural markers
    if (matches(trimmed, /^#/) || startsWith(trimmed, "BLOCK:") || startsWith(trimmed, "NAV:")) {
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
        })
      }

      // Start new question
      currentQuestionStart = i
    }
  }

  // Save final question
  if (currentQuestionStart !== null) {
    const questionLines = lines.slice(currentQuestionStart)
    const type = determineQuestionType(questionLines)
    questionChunks.push({
      lines: questionLines,
      type,
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
    const value = i.toString()
    options.push({
      value,
      label: value,
    })
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

    // Check for RANGE keyword
    if (startsWith(trimmed, "RANGE:")) {
      // Save current option if any
      if (currentOption) {
        options.push({
          value: currentOption.label || '',
          label: currentOption.label || '',
          hint: currentOption.hint,
          tooltip: currentOption.tooltip,
          showIf: currentOption.showIf,
          allowsOtherText: currentOption.allowsOtherText,
        })
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
        content === "---"

      if (isOptionMetadata && currentOption) {
        // This is metadata for the current option
        if (content === "OTHER") {
          currentOption.allowsOtherText = true
        } else if (startsWith(content, "SHOW_IF:")) {
          currentOption.showIf = extractAfterKeyword(content, "SHOW_IF:")
        } else if (startsWith(content, "HINT:")) {
          const hintValue = extractAfterKeyword(content, "HINT:")
          if (hintValue === "---") {
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
          if (tooltipValue === "---") {
            collectingTooltip = true
            tooltipBuffer = []
          } else if (tooltipValue) {
            currentOption.tooltip = tooltipValue
          } else {
            collectingTooltip = true
            tooltipBuffer = []
          }
        } else if (content === "---") {
          // End delimiter
          if (collectingHint) {
            currentOption.hint = hintBuffer.join('\n')
            collectingHint = false
          }
          if (collectingTooltip) {
            currentOption.tooltip = tooltipBuffer.join('\n')
            collectingTooltip = false
          }
        }
      } else if (collectingHint) {
        // Collecting multi-line hint content
        hintBuffer.push(trimmed)
      } else if (collectingTooltip) {
        // Collecting multi-line tooltip content
        tooltipBuffer.push(trimmed)
      } else {
        // This is a new option
        if (currentOption) {
          options.push({
            value: currentOption.label || '',
            label: currentOption.label || '',
            hint: currentOption.hint,
            tooltip: currentOption.tooltip,
            showIf: currentOption.showIf,
            allowsOtherText: currentOption.allowsOtherText,
          })
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
    options.push({
      value: currentOption.label || '',
      label: currentOption.label || '',
      hint: currentOption.hint,
      tooltip: currentOption.tooltip,
      showIf: currentOption.showIf,
      allowsOtherText: currentOption.allowsOtherText,
    })
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

  for (const line of lines) {

    const trimmed = line.trim()

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
        startsWith(content, "TOOLTIP:")

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
        } else if (startsWith(content, "HINT:")) {
          currentOption.hint = extractAfterKeyword(content, "HINT:")
        } else if (startsWith(content, "TOOLTIP:")) {
          currentOption.tooltip = extractAfterKeyword(content, "TOOLTIP:")
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
 */
const parseSection = (lines: string[], questionCounter: { count: number }): Section => {
  const questionChunks = identifyQuestions(lines)

  // Build a set of lines that belong to questions
  const questionLines = new Set<string>()
  for (const qChunk of questionChunks) {
    for (const line of qChunk.lines) {
      questionLines.add(line)
    }
  }

  // Extract section title
  let title: string | undefined
  for (const line of lines) {
    const trimmed = line.trim()
    if (matches(trimmed, /^##/)) {
      title = trimmed.replace(/^##\s*/, '').trim()
      break
    }
  }

  // Extract section content (lines that don't belong to questions)
  // Note: Code fences (```) are preserved in content for markdown rendering
  const contentLines: string[] = []
  for (const line of lines) {
    if (questionLines.has(line)) continue // Skip lines that belong to questions

    const trimmed = line.trim()

    // Skip structural markers
    if (matches(trimmed, /^##/)) continue

    // Add content line (skip section-level keywords)
    if (trimmed && !matches(trimmed, /^(TOOLTIP:|HINT:|VARIABLE:|SHOW_IF:)/)) {
      contentLines.push(line)
    }
  }

  const content = contentLines.join('\n')

  return {
    title,
    ...(content && { content }),
    tooltip: parseDelimitedContent(lines, "TOOLTIP:"),
    questions: questionChunks.map(qChunk => parseQuestionByType(qChunk, questionCounter)),
  }
}

/**
 * Parse a page chunk
 */
const parsePage = (lines: string[], questionCounter: { count: number }): Page => {
  const sectionChunks = identifySections(lines)

  // Extract page title
  const titleLine = lines.find((line) =>
    (matches(line.trim(), /^#\s/) || line.trim() === "#")
  )
  const title = titleLine
    ? titleLine.trim().replace(/^#\s*/, '')
    : ''

  // Parse computed variables (COMPUTE: lines)
  const computedVariables: ComputedVariable[] = []
  for (const line of lines) {
    if (startsWith(line, "COMPUTE:")) {
      const value = extractAfterKeyword(line, "COMPUTE:")
      const match = value.match(/^(\w+)\s*=\s*(.+)$/)
      if (match) {
        computedVariables.push({
          name: match[1],
          expression: match[2],
        })
      }
    }
  }

  return {
    title,
    tooltip: parseDelimitedContent(lines, "TOOLTIP:"),
    sections: sectionChunks.map(sChunk => parseSection(sChunk, questionCounter)),
    computedVariables,
  }
}

/**
 * Parse a block chunk
 */
const parseBlock = (lines: string[]): Block => {
  const pageChunks = identifyPages(lines)
  const questionCounter = { count: 1 }

  // Extract block name
  const blockLine = lines.find((line) =>
    startsWith(line, "BLOCK:")
  )
  const name = blockLine
    ? extractAfterKeyword(blockLine, "BLOCK:")
    : ''

  // Parse computed variables
  const computedVariables: ComputedVariable[] = []
  for (const line of lines) {
    if (startsWith(line, "COMPUTE:")) {
      const value = extractAfterKeyword(line, "COMPUTE:")
      const match = value.match(/^(\w+)\s*=\s*(.+)$/)
      if (match) {
        computedVariables.push({
          name: match[1],
          expression: match[2],
        })
      }
    }
  }

  return {
    name,
    showIf: findKeyword(lines, "SHOW_IF:"),
    pages: pageChunks.map(pChunk => parsePage(pChunk, questionCounter)),
    computedVariables,
  }
}

/**
 * Parse a nav item chunk
 */
const parseNavItem = (lines: string[]): NavItem => {
  const pageChunks = identifyPages(lines)
  const questionCounter = { count: 1 }

  // Extract nav item name
  const navLine = lines.find((line) =>
    startsWith(line, "NAV:")
  )
  const name = navLine
    ? extractAfterKeyword(navLine, "NAV:")
    : ''

  // Extract level (defaults to 1)
  const levelValue = findKeyword(lines, "LEVEL:")
  const level = levelValue ? parseInt(levelValue, 10) : 1

  return {
    name,
    level,
    pages: pageChunks.map(pChunk => parsePage(pChunk, questionCounter)),
  }
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export const parseQuestionnaire = (text: string): { blocks: Block[], navItems: NavItem[] } => {
  try {
    const rawLines = text.split("\n")
    const lines: string[] = rawLines

    // Identify top-level chunks
    const { blockChunks, navChunks } = identifyTopLevelChunks(lines)

    // Parse chunks
    const blocks = blockChunks.map(parseBlock)
    const navItems = navChunks.map(parseNavItem)

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
