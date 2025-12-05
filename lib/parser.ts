import {
  Question,
  Page,
  Block,
  NavItem,
  PageData,
  Section,
  QuestionData,
  SubtextData,
  TooltipData,
  OptionData,
  OptionShowIfData,
  OptionOtherTextData,
  OptionSubtractData,
  SubquestionData,
  SubquestionSubtractData,
  SubquestionValueData,
  InputTypeData,
  VariableData,
  ShowIfData,
  TotalLabelData,
  TotalColumnData,
  SubtotalLabelData,
  PrefixData,
  SuffixData,
  ColumnData,
  OptionExcludeData,
  OptionHeaderData,
  OptionSeparatorData,
  CustomData,
  ContentData,
  ComputeData,
  BlockData,
  NavItemData,
  NavLevelData,
  ParsedLine,
  ParserState,
  Option,
} from "@/lib/types"
import {
  validateVariableNames,
  validateConditionReferences,
  validateComputedVariableReferences,
} from "@/lib/validation"

// Helper function to remove leading indentation (2+ spaces or 1 tab)
const removeIndentation = (line: string): string => {
  if (line.startsWith('\t')) {
    return line.substring(1)
  }
  // Match 2 or more leading spaces and remove them
  const match = line.match(/^(\s{2,})/)
  if (match) {
    return line.substring(match[1].length)
  }
  return line
}

// Helper function to filter out delimiter markers and join buffer
const joinBuffer = (buffer: string[]): string => {
  return buffer.filter(line => line !== "---DELIMITER---").join('\n')
}

// Line classification functions

const classifyLine = (line: string, state: ParserState): ParsedLine["type"] => {
  const trimmed = line.trim()

  if (trimmed.startsWith("# ") || trimmed === "#") return "page"
  if (trimmed.match(/^Q:/)) return "question"
  if (trimmed.startsWith("HINT:")) return "subtext"
  if (trimmed.startsWith("TOOLTIP:")) return "tooltip"

  // Check for delimiter (---) - if we have an active buffer, treat as content
  // The delimiter both opens (after seeing TOOLTIP:/HINT:) and closes the buffer
  const hasActiveBuffer = !!(
    state.tooltipBuffer ||
    state.subtextBuffer ||
    state.subquestionTooltipBuffer ||
    state.subquestionSubtextBuffer ||
    state.optionTooltipBuffer ||
    state.optionSubtextBuffer
  )

  // If buffer is active, check if we have real content to distinguish opening from closing delimiter
  if (hasActiveBuffer) {
    const hasRealContent = (buffer: string[] | null) => {
      if (!buffer || buffer.length === 0) return false
      return buffer.some(line => line.trim().length > 0)
    }

    const bufferHasContent =
      hasRealContent(state.tooltipBuffer) ||
      hasRealContent(state.subtextBuffer) ||
      hasRealContent(state.subquestionTooltipBuffer) ||
      hasRealContent(state.subquestionSubtextBuffer) ||
      hasRealContent(state.optionTooltipBuffer) ||
      hasRealContent(state.optionSubtextBuffer)

    // If we see --- and buffer has content, this is the CLOSING delimiter
    // Return "content" so handleContent can process it and close the buffer
    if (trimmed === "---" && bufferHasContent) {
      return "content"
    }

    // If buffer has content (we're between delimiters), treat everything as content
    if (bufferHasContent) {
      return "content"
    }

    // If --- with empty buffer, this is OPENING delimiter - also return "content"
    if (trimmed === "---") {
      return "content"
    }
  }

  // Check for structured keywords (when no buffer is active)
  if (["TEXT", "ESSAY", "NUMBER", "CHECKBOX", "BREAKDOWN"].includes(trimmed)) return "input_type"
  if (trimmed.startsWith("VARIABLE:")) return "variable"
  if (trimmed.startsWith("SHOW_IF:")) return "show_if"
  if (trimmed.startsWith("TOTAL:")) return "total_label"
  if (trimmed.startsWith("TOTAL_COLUMN:")) return "total_column"
  if (trimmed.startsWith("SUBTOTAL:")) return "subtotal_label"
  if (trimmed.startsWith("CUSTOM:")) return "content"  // CUSTOM is only valid under options
  if (trimmed.startsWith("PREFIX:")) return "prefix"
  if (trimmed.startsWith("SUFFIX:")) return "suffix"
  if (trimmed.startsWith("COMPUTE:")) return "compute"
  if (trimmed.startsWith("NAV:")) return "nav_item"
  if (trimmed.startsWith("LEVEL:")) return "nav_level"
  if (trimmed.startsWith("BLOCK:")) return "block"

  if (trimmed.match(/^-\s*([A-Z]\))?(.+)/) || trimmed.match(/^-\s+(.+)/)) {
    // Check if this is a matrix row (- Q: ...)
    if (trimmed.match(/^-\s*Q:/)) {
      return state.currentQuestion ? "matrix_row" : "content"
    }
    // Check if this is a subquestion hint (- HINT: ...)
    if (trimmed.match(/^-\s*HINT:/)) {
      if (state.currentSubquestion) return "subquestion_hint"
      if (state.currentQuestion && state.currentQuestion.options.length > 0) return "option_hint"
      return "content"
    }
    // Check if this is a subquestion tooltip (- TOOLTIP: ...)
    if (trimmed.match(/^-\s*TOOLTIP:/)) {
      if (state.currentSubquestion) return "subquestion_tooltip"
      if (state.currentQuestion && state.currentQuestion.options.length > 0) return "option_tooltip"
      return "content"
    }
    // Check if this is a subtract flag (- SUBTRACT)
    if (trimmed.match(/^-\s*SUBTRACT\s*$/)) {
      if (state.currentSubquestion) return "subquestion_subtract"
      if (state.currentQuestion && state.currentQuestion.options.length > 0) return "option_subtract"
      return "content"
    }
    // Check if this is a subquestion value (- VALUE: ...)
    if (trimmed.match(/^-\s*VALUE:/)) {
      if (state.currentSubquestion) return "subquestion_value"
      if (state.currentQuestion && state.currentQuestion.options.length > 0) return "option_value"
      return "content"
    }
    // Check if this is an option variable (- VARIABLE: ...)
    if (trimmed.match(/^-\s*VARIABLE:/)) {
      if (state.currentQuestion && state.currentQuestion.options.length > 0) return "option_variable"
      return "content"
    }
    // Check if this is an option column (- COLUMN: ...)
    if (trimmed.match(/^-\s*COLUMN:/)) {
      if (state.currentQuestion && state.currentQuestion.options.length > 0) return "option_column"
      return "content"
    }
    // Check if this is an exclude flag (- EXCLUDE)
    if (trimmed.match(/^-\s*EXCLUDE\s*$/)) {
      if (state.currentQuestion && state.currentQuestion.options.length > 0) return "option_exclude"
      return "content"
    }
    // Check if this is a custom calculation (- CUSTOM: ...)
    if (trimmed.match(/^-\s*CUSTOM:/)) {
      if (state.currentQuestion && state.currentQuestion.options.length > 0) return "option_custom"
      return "content"
    }
    // Check if this is a header label (- HEADER: ...)
    if (trimmed.match(/^-\s*HEADER:/)) {
      if (state.currentQuestion) return "option_header"
      return "content"
    }
    // Check if this is a separator (- SEPARATOR)
    if (trimmed.match(/^-\s*SEPARATOR\s*$/)) {
      if (state.currentQuestion) return "option_separator"
      return "content"
    }
    // Check if this is a subtotal label (- SUBTOTAL: ...)
    if (trimmed.match(/^-\s*SUBTOTAL:/)) {
      if (state.currentQuestion && state.currentQuestion.options.length > 0) return "option_subtotal"
      return "content"
    }
    // Check if this is a conditional option modifier
    if (trimmed.match(/^-\s*SHOW_IF:/)) {
      return state.currentQuestion ? "option_show_if" : "content"
    }
    // Check if this is an other text modifier (only if we have a current question)
    if (trimmed.match(/^-\s*TEXT\s*$/)) {
      return state.currentQuestion ? "option_other_text" : "content"
    }
    return state.currentQuestion ? "option" : "content"
  }

  return "content"
}

// Line parsing functions

const parsePage = (line: string): PageData => {
  const trimmed = line.trim()
  if (trimmed === "#") {
    return { title: "" }
  }
  return { title: trimmed.substring(2).trim() }
}


const parseQuestion = (line: string, questionCounter: number): QuestionData => {
  const trimmed = line.trim()
  
  return {
    id: `Q${questionCounter}`,
    text: trimmed.substring(2).trim(),
  }
}

const parseSubtext = (line: string): SubtextData => {
  const trimmed = line.trim()
  return {
    subtext: trimmed.substring(5).trim(), // Remove "HINT:" prefix
  }
}

const parseTooltip = (line: string): TooltipData => {
  const trimmed = line.trim()
  return {
    tooltip: trimmed.substring(8).trim(), // Remove "TOOLTIP:" prefix
  }
}

const parseSubquestionHint = (line: string): SubtextData => {
  const trimmed = line.trim()
  // Remove "- HINT:" prefix (with possible spaces)
  const match = trimmed.match(/^-\s*HINT:\s*(.*)/)
  return {
    subtext: match ? match[1] : "",
  }
}

const parseSubquestionTooltip = (line: string): TooltipData => {
  const trimmed = line.trim()
  // Remove "- TOOLTIP:" prefix (with possible spaces)
  const match = trimmed.match(/^-\s*TOOLTIP:\s*(.*)/)
  return {
    tooltip: match ? match[1] : "",
  }
}

const parseSubquestionSubtract = (): SubquestionSubtractData => {
  return {
    subtract: true,
  }
}

const parseSubquestionValue = (line: string): SubquestionValueData => {
  const trimmed = line.trim()
  // Remove "- VALUE:" prefix (with possible spaces)
  const match = trimmed.match(/^-\s*VALUE:\s*(.*)/)
  return {
    value: match ? match[1] : "",
  }
}

const parseOption = (line: string): OptionData => {
  const trimmed = line.trim()
  const optionText = trimmed.substring(1).trim()
  return { text: optionText }
}

const parseSubquestion = (line: string, state: ParserState): SubquestionData => {
  const trimmed = line.trim()
  // Remove "- Q:" prefix
  const text = trimmed.replace(/^-\s*Q:\s*/, '').trim()

  // Generate ID as questionId_rowNumber (e.g., Q1_1, Q1_2, etc.)
  const currentQuestionId = state.currentQuestion?.id || "Q0"

  // Count existing subquestions - check both question-level (matrix) and option-level (breakdown)
  let existingSubquestionCount = state.currentQuestion?.subquestions?.length || 0

  // For breakdown questions, also count subquestions in options
  if (state.currentQuestion?.options) {
    for (const option of state.currentQuestion.options) {
      existingSubquestionCount += option.subquestions?.length || 0
    }
  }

  const rowNumber = existingSubquestionCount + 1
  const id = `${currentQuestionId}_${rowNumber}`

  return { id, text }
}

const parseInputType = (line: string): InputTypeData => {
  const trimmed = line.trim()
  switch (trimmed) {
    case "TEXT":
      return { type: "text" }
    case "ESSAY":
      return { type: "essay" }
    case "NUMBER":
      return { type: "number" }
    case "CHECKBOX":
      return { type: "checkbox" }
    case "BREAKDOWN":
      return { type: "breakdown" }
    default:
      return { type: "multiple_choice" }
  }
}

const parseVariable = (line: string): VariableData => {
  const variable = line.trim().substring(9).trim()
  return { variable }
}

const parseShowIf = (line: string): ShowIfData => ({
  showIf: line.trim().substring(8).trim(),
})

const parseTotalLabel = (line: string): TotalLabelData => {
  const trimmed = line.trim()
  const totalLabel = trimmed.substring(6).trim() // Remove "TOTAL:" prefix
  return { totalLabel }
}

const parseTotalColumn = (line: string): TotalColumnData => {
  const trimmed = line.trim()
  const columnStr = trimmed.substring(13).trim() // Remove "TOTAL_COLUMN:" prefix
  const totalColumn = parseInt(columnStr, 10)

  if (isNaN(totalColumn) || totalColumn < 1) {
    throw new Error(`Invalid TOTAL_COLUMN syntax: ${line}. Expected a positive number (1, 2, etc.)`)
  }

  return { totalColumn }
}

const parseSubtotalLabel = (line: string): SubtotalLabelData => {
  const trimmed = line.trim()
  const subtotalLabel = trimmed.substring(9).trim() // Remove "SUBTOTAL:" prefix
  return { subtotalLabel }
}

const parsePrefix = (line: string): PrefixData => {
  const trimmed = line.trim()
  const prefix = trimmed.substring(7).trim() // Remove "PREFIX:" prefix
  return { prefix }
}

const parseSuffix = (line: string): SuffixData => {
  const trimmed = line.trim()
  const suffix = trimmed.substring(7).trim() // Remove "SUFFIX:" prefix
  return { suffix }
}

const parseOptionShowIf = (line: string): OptionShowIfData => {
  const trimmed = line.trim()
  // Remove "- SHOW_IF:" prefix and any leading whitespace
  const conditionText = trimmed.replace(/^-\s*SHOW_IF:\s*/, '')
  return { showIf: conditionText }
}

const parseOptionOtherText = (): OptionOtherTextData => ({
  allowsOtherText: true,
})

const parseOptionSubtract = (): OptionSubtractData => ({
  subtract: true,
})

const parseOptionExclude = (): OptionExcludeData => ({
  exclude: true,
})

const parseOptionHeader = (line: string): OptionHeaderData => {
  const trimmed = line.trim()
  const match = trimmed.match(/^-\s*HEADER:\s*(.*)/)
  return { label: match ? match[1] : "" }
}

const parseOptionSeparator = (): OptionSeparatorData => ({
  separator: true,
})

const parseOptionCustom = (line: string): CustomData => {
  const trimmed = line.trim()
  const match = trimmed.match(/^-\s*CUSTOM:\s*(.*)/)
  return { custom: match ? match[1] : "" }
}

const parseOptionSubtotal = (line: string): SubtotalLabelData => {
  const trimmed = line.trim()
  const match = trimmed.match(/^-\s*SUBTOTAL:\s*(.*)/)
  return { subtotalLabel: match ? match[1] : "" }
}

const parseOptionHint = (line: string): SubtextData => {
  const trimmed = line.trim()
  const match = trimmed.match(/^-\s*HINT:\s*(.*)/)
  return { subtext: match ? match[1] : "" }
}

const parseOptionValue = (line: string): SubquestionValueData => {
  const trimmed = line.trim()
  const match = trimmed.match(/^-\s*VALUE:\s*(.*)/)
  return { value: match ? match[1] : "" }
}

const parseOptionVariable = (line: string): VariableData => {
  const trimmed = line.trim()
  const match = trimmed.match(/^-\s*VARIABLE:\s*(.*)/)
  return { variable: match ? match[1] : "" }
}

const parseOptionColumn = (line: string): ColumnData => {
  const trimmed = line.trim()
  const match = trimmed.match(/^-\s*COLUMN:\s*(.*)/)
  const columnStr = match ? match[1] : ""
  const column = parseInt(columnStr, 10)

  if (isNaN(column) || column < 1) {
    throw new Error(`Invalid COLUMN syntax: ${line}. Expected a positive number (1, 2, etc.)`)
  }

  return { column }
}

const parseOptionTooltip = (line: string): TooltipData => {
  const trimmed = line.trim()
  const match = trimmed.match(/^-\s*TOOLTIP:\s*(.*)/)
  return { tooltip: match ? match[1] : "" }
}

const parseContent = (line: string): ContentData => ({
  content: line,
})

const parseBlock = (line: string): BlockData => {
  const trimmed = line.trim()
  const name = trimmed.substring(6).trim() // Remove "BLOCK:" prefix
  return { name }
}

const parseNavItem = (line: string): NavItemData => {
  const trimmed = line.trim()
  const name = trimmed.substring(4).trim() // Remove "NAV:" prefix
  return { name }
}

const parseNavLevel = (line: string): NavLevelData => {
  const trimmed = line.trim()
  const levelStr = trimmed.substring(6).trim() // Remove "LEVEL:" prefix
  const level = parseInt(levelStr, 10)

  if (isNaN(level) || level < 1) {
    throw new Error(`Invalid LEVEL syntax: ${line}. Expected a positive number (1, 2, etc.)`)
  }

  return { level }
}

const parseCompute = (line: string): ComputeData => {
  const trimmed = line.trim()
  const content = trimmed.substring(8).trim() // Remove "COMPUTE:" prefix
  const equalIndex = content.indexOf('=')
  
  if (equalIndex === -1) {
    throw new Error(`Invalid COMPUTE syntax: ${line}. Expected format: COMPUTE: variableName = expression`)
  }
  
  const name = content.substring(0, equalIndex).trim()
  const expression = content.substring(equalIndex + 1).trim()
  
  if (!name || !expression) {
    throw new Error(`Invalid COMPUTE syntax: ${line}. Both variable name and expression are required`)
  }
  
  return { name, expression }
}

// Line processing functions

const parseLine = (line: string, state: ParserState): ParsedLine => {
  const type = classifyLine(line, state)

  switch (type) {
    case "page":
      return { type, raw: line, data: parsePage(line) }
    case "question":
      return { type, raw: line, data: parseQuestion(line, state.questionCounter) }
    case "subtext":
      return { type, raw: line, data: parseSubtext(line) }
    case "tooltip":
      return { type, raw: line, data: parseTooltip(line) }
    case "option":
      return { type, raw: line, data: parseOption(line) }
    case "option_show_if":
      return { type, raw: line, data: parseOptionShowIf(line) }
    case "option_other_text":
      return { type, raw: line, data: parseOptionOtherText() }
    case "option_subtract":
      return { type, raw: line, data: parseOptionSubtract() }
    case "option_hint":
      return { type, raw: line, data: parseOptionHint(line) }
    case "option_tooltip":
      return { type, raw: line, data: parseOptionTooltip(line) }
    case "option_value":
      return { type, raw: line, data: parseOptionValue(line) }
    case "option_variable":
      return { type, raw: line, data: parseOptionVariable(line) }
    case "option_column":
      return { type, raw: line, data: parseOptionColumn(line) }
    case "option_exclude":
      return { type, raw: line, data: parseOptionExclude() }
    case "option_custom":
      return { type, raw: line, data: parseOptionCustom(line) }
    case "option_header":
      return { type, raw: line, data: parseOptionHeader(line) }
    case "option_separator":
      return { type, raw: line, data: parseOptionSeparator() }
    case "option_subtotal":
      return { type, raw: line, data: parseOptionSubtotal(line) }
    case "subquestion_hint":
      return { type, raw: line, data: parseSubquestionHint(line) }
    case "subquestion_tooltip":
      return { type, raw: line, data: parseSubquestionTooltip(line) }
    case "subquestion_subtract":
      return { type, raw: line, data: parseSubquestionSubtract() }
    case "subquestion_value":
      return { type, raw: line, data: parseSubquestionValue(line) }
    case "matrix_row":
      return { type, raw: line, data: parseSubquestion(line, state) }
    case "input_type":
      return { type, raw: line, data: parseInputType(line) }
    case "variable":
      return { type, raw: line, data: parseVariable(line) }
    case "show_if":
      return { type, raw: line, data: parseShowIf(line) }
    case "total_label":
      return { type, raw: line, data: parseTotalLabel(line) }
    case "total_column":
      return { type, raw: line, data: parseTotalColumn(line) }
    case "subtotal_label":
      return { type, raw: line, data: parseSubtotalLabel(line) }
    case "prefix":
      return { type, raw: line, data: parsePrefix(line) }
    case "suffix":
      return { type, raw: line, data: parseSuffix(line) }
    case "content":
      return { type, raw: line, data: parseContent(line) }
    case "compute":
      return { type, raw: line, data: parseCompute(line) }
    case "block":
      return { type, raw: line, data: parseBlock(line) }
    case "nav_item":
      return { type, raw: line, data: parseNavItem(line) }
    case "nav_level":
      return { type, raw: line, data: parseNavLevel(line) }
    default:
      const _exhaustive: never = type
      throw new Error(`Unknown line type: ${_exhaustive}`)
  }
}

// State management

const createQuestion = (id: string, text: string): Question => ({
  id,
  text,
  type: "multiple_choice",
  options: [],
  subquestions: [],
})

const createBlock = (name: string): Block => ({
  name,
  showIf: undefined,
  pages: [],
  computedVariables: [],
})

const createNavItem = (name: string, level: number): NavItem => ({
  name,
  level,
  pages: [],
})

const createPage = (title: string): Page => {
  const page: Page = {
    title,
    sections: [],
    computedVariables: [],
  }
  // Start with a default section for questions
  const defaultSection = createSection()
  page.sections.push(defaultSection)
  return page
}

const createSection = (): Section => ({
  content: "",
  questions: [],
})

// Save current question to appropriate location
const saveCurrentQuestion = (state: ParserState): ParserState => {
  if (!state.currentQuestion) return state

  if (state.currentSection && state.currentQuestion && state.currentPage) {
    // Find the section in the page and update it
    const sectionIndex = state.currentPage.sections.findIndex(s => s === state.currentSection)
    if (sectionIndex !== -1) {
      const updatedSections = [...state.currentPage.sections]
      const section = state.currentSection as Section
      const question = state.currentQuestion as Question

      updatedSections[sectionIndex] = {
        content: section.content,
        questions: [...section.questions, question],
      }

      return {
        ...state,
        currentPage: {
          ...state.currentPage,
          sections: updatedSections,
        },
        currentSection: updatedSections[sectionIndex],
      }
    }
  }

  return state
}

// Save current section to current page
const saveCurrentSection = (state: ParserState): ParserState => {
  if (!state.currentSection || !state.currentPage) return state

  // Check if the section is already in the page (by reference)
  const sectionAlreadyExists = state.currentPage.sections.includes(state.currentSection)
  if (sectionAlreadyExists) {
    return state // Section is already saved, nothing to do
  }

  // Normalize whitespace-only content to empty string
  const normalizedSection = {
    ...state.currentSection,
    content: state.currentSection.content.trim() === ""
      ? ""
      : state.currentSection.content
  }

  return {
    ...state,
    currentPage: {
      ...state.currentPage,
      sections: [
        ...state.currentPage.sections,
        normalizedSection,
      ],
    },
  }
}

// Save current page to current block AND current nav item
const saveCurrentPage = (state: ParserState): ParserState => {
  if (!state.currentPage) return state

  const normalizedPage = state.currentPage
  let newState = { ...state }

  // Add page to current block if it exists
  if (state.currentBlock) {
    newState = {
      ...newState,
      currentBlock: {
        ...state.currentBlock,
        pages: [...state.currentBlock.pages, normalizedPage],
      }
    }
  }

  // Add page to current nav item if it exists
  if (state.currentNavItem) {
    newState = {
      ...newState,
      currentNavItem: {
        ...state.currentNavItem,
        pages: [...state.currentNavItem.pages, normalizedPage],
      }
    }
  }

  return newState
}

// Save current nav item to nav items array
const saveCurrentNavItem = (state: ParserState): ParserState => {
  if (!state.currentNavItem) return state

  return {
    ...state,
    navItems: [...state.navItems, state.currentNavItem],
  }
}

// Save current block to blocks array
const saveCurrentBlock = (state: ParserState): ParserState => {
  if (!state.currentBlock) return state

  return {
    ...state,
    blocks: [...state.blocks, state.currentBlock],
  }
}

// State reducers for each line type

const handleBlock = (state: ParserState, data: BlockData): ParserState => {
  // Save everything that's currently being built
  let newState = saveCurrentQuestion(state)
  newState = saveCurrentSection(newState)
  newState = saveCurrentPage(newState)
  newState = saveCurrentBlock(newState)

  // Start new block
  return {
    ...newState,
    currentBlock: createBlock(data.name),
    currentPage: null,
    currentSection: null,
    currentQuestion: null,
    currentSubquestion: null,
  }
}

const handleNavItem = (state: ParserState, data: NavItemData): ParserState => {
  // Save current nav item (and page/section/question)
  let newState = saveCurrentQuestion(state)
  newState = saveCurrentSection(newState)
  newState = saveCurrentPage(newState)
  newState = saveCurrentNavItem(newState)

  // Start new nav item with default level 1
  return {
    ...newState,
    currentNavItem: createNavItem(data.name, 1),
    currentNavLevel: 1,
    currentPage: null,
    currentSection: null,
    currentQuestion: null,
    currentSubquestion: null,
  }
}

const handleNavLevel = (state: ParserState, data: NavLevelData): ParserState => {
  // LEVEL must follow a NAV item
  if (!state.currentNavItem) {
    throw new Error('LEVEL must come immediately after a NAV declaration')
  }

  // Update the current nav item's level
  return {
    ...state,
    currentNavItem: {
      ...state.currentNavItem,
      level: data.level,
    },
    currentNavLevel: data.level,
  }
}

const handlePage = (state: ParserState, data: PageData): ParserState => {
  // Save everything that's currently being built
  let newState = saveCurrentQuestion(state)
  newState = saveCurrentSection(newState)
  newState = saveCurrentPage(newState)

  // Start new page
  const newPage = createPage(data.title)
  return {
    ...newState,
    currentPage: newPage,
    currentSection: newPage.sections[0], // Set the default section as current
    currentQuestion: null,
    currentSubquestion: null,
  }
}


const handleQuestion = (
  state: ParserState,
  data: QuestionData
): ParserState => {
  // Save current question
  let newState = saveCurrentQuestion(state)

  // If no page exists, create a default one
  if (!newState.currentPage) {
    const defaultPage = createPage("")
    newState = {
      ...newState,
      currentPage: defaultPage,
      currentSection: defaultPage.sections[0], // Set the default section as current
    }
  }

  // If no current section, ensure we have one
  if (!newState.currentSection && newState.currentPage) {
    if (newState.currentPage.sections.length === 0) {
      const defaultSection = createSection()
      newState.currentPage.sections.push(defaultSection)
      newState = {
        ...newState,
        currentSection: defaultSection,
      }
    } else {
      newState = {
        ...newState,
        currentSection: newState.currentPage.sections[0],
      }
    }
  }

  // Start new question and increment counter
  return {
    ...newState,
    currentQuestion: createQuestion(data.id, data.text),
    currentSubquestion: null,
    questionCounter: state.questionCounter + 1,
    // Clear subtext and tooltip buffers when starting new question
    subtextBuffer: null,
    tooltipBuffer: null,
    subquestionSubtextBuffer: null,
    subquestionTooltipBuffer: null,
    optionSubtextBuffer: null,
    optionTooltipBuffer: null,
  }
}

const handleSubtext = (state: ParserState, data: SubtextData): ParserState => {
  if (!state.currentQuestion) return state

  // Check if delimiter mode is being activated
  const isDelimiterMode = data.subtext === "---"

  // If we have a current matrix row, assign subtext to it
  if (state.currentSubquestion) {
    // Update the matrix row with subtext
    const updatedSubquestions = state.currentQuestion.subquestions?.map(row =>
      row.id === state.currentSubquestion!.id
        ? { ...row, subtext: isDelimiterMode ? "" : data.subtext }
        : row
    ) || []

    return {
      ...state,
      currentQuestion: {
        ...state.currentQuestion,
        subquestions: updatedSubquestions,
      },
      currentSubquestion: {
        ...state.currentSubquestion,
        subtext: isDelimiterMode ? "" : data.subtext,
      },
      // Only start buffer if in delimiter mode
      subquestionSubtextBuffer: isDelimiterMode ? ["---DELIMITER---"] : null,
    }
  }

  // Otherwise assign to the question itself
  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      subtext: isDelimiterMode ? "" : data.subtext,
    },
    // Only start buffer if in delimiter mode
    subtextBuffer: isDelimiterMode ? ["---DELIMITER---"] : null,
  }
}

const handleTooltip = (state: ParserState, data: TooltipData): ParserState => {
  if (!state.currentQuestion) return state

  // Check if delimiter mode is being activated
  const isDelimiterMode = data.tooltip === "---"

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      tooltip: isDelimiterMode ? "" : data.tooltip,
    },
    // Only start buffer if in delimiter mode
    tooltipBuffer: isDelimiterMode ? ["---DELIMITER---"] : null,
  }
}

const handleSubquestionHint = (state: ParserState, data: SubtextData): ParserState => {
  if (!state.currentQuestion || !state.currentSubquestion) return state

  // Check if delimiter mode is being activated
  const isDelimiterMode = data.subtext === "---"

  // Check if subquestion is attached to an option (breakdown) or question (matrix)
  const hasOptions = state.currentQuestion.options.length > 0
  const hasQuestionSubquestions = (state.currentQuestion.subquestions?.length || 0) > 0

  if (hasOptions) {
    // Number_list: update subquestion in option
    const updatedOptions = state.currentQuestion.options.map(option => ({
      ...option,
      subquestions: option.subquestions?.map(sq =>
        sq.id === state.currentSubquestion!.id
          ? { ...sq, subtext: isDelimiterMode ? "" : data.subtext }
          : sq
      ),
    }))

    return {
      ...state,
      currentQuestion: {
        ...state.currentQuestion,
        options: updatedOptions,
      },
      currentSubquestion: {
        ...state.currentSubquestion,
        subtext: isDelimiterMode ? "" : data.subtext,
      },
      subquestionSubtextBuffer: isDelimiterMode ? ["---DELIMITER---"] : null,
    }
  }

  if (hasQuestionSubquestions) {
    // Matrix: update subquestion at question level
    const updatedSubquestions = state.currentQuestion.subquestions?.map(row =>
      row.id === state.currentSubquestion!.id
        ? { ...row, subtext: isDelimiterMode ? "" : data.subtext }
        : row
    ) || []

    return {
      ...state,
      currentQuestion: {
        ...state.currentQuestion,
        subquestions: updatedSubquestions,
      },
      currentSubquestion: {
        ...state.currentSubquestion,
        subtext: isDelimiterMode ? "" : data.subtext,
      },
      subquestionSubtextBuffer: isDelimiterMode ? ["---DELIMITER---"] : null,
    }
  }

  return state
}

const handleSubquestionTooltip = (state: ParserState, data: TooltipData): ParserState => {
  if (!state.currentQuestion || !state.currentSubquestion) return state

  // Check if delimiter mode is being activated
  const isDelimiterMode = data.tooltip === "---"

  const hasOptions = state.currentQuestion.options.length > 0

  if (hasOptions) {
    const updatedOptions = state.currentQuestion.options.map(option => ({
      ...option,
      subquestions: option.subquestions?.map(sq =>
        sq.id === state.currentSubquestion!.id
          ? { ...sq, tooltip: isDelimiterMode ? "" : data.tooltip }
          : sq
      ),
    }))

    return {
      ...state,
      currentQuestion: { ...state.currentQuestion, options: updatedOptions },
      currentSubquestion: { ...state.currentSubquestion, tooltip: isDelimiterMode ? "" : data.tooltip },
      subquestionTooltipBuffer: isDelimiterMode ? ["---DELIMITER---"] : null,
    }
  }

  const updatedSubquestions = state.currentQuestion.subquestions?.map(row =>
    row.id === state.currentSubquestion!.id
      ? { ...row, tooltip: isDelimiterMode ? "" : data.tooltip }
      : row
  ) || []

  return {
    ...state,
    currentQuestion: { ...state.currentQuestion, subquestions: updatedSubquestions },
    currentSubquestion: { ...state.currentSubquestion, tooltip: isDelimiterMode ? "" : data.tooltip },
    subquestionTooltipBuffer: isDelimiterMode ? ["---DELIMITER---"] : null,
  }
}

const handleSubquestionSubtract = (state: ParserState, data: SubquestionSubtractData): ParserState => {
  if (!state.currentQuestion || !state.currentSubquestion) return state

  const hasOptions = state.currentQuestion.options.length > 0

  if (hasOptions) {
    const updatedOptions = state.currentQuestion.options.map(option => ({
      ...option,
      subquestions: option.subquestions?.map(sq =>
        sq.id === state.currentSubquestion!.id
          ? { ...sq, subtract: data.subtract }
          : sq
      ),
    }))

    return {
      ...state,
      currentQuestion: { ...state.currentQuestion, options: updatedOptions },
      currentSubquestion: { ...state.currentSubquestion, subtract: data.subtract },
    }
  }

  const updatedSubquestions = state.currentQuestion.subquestions?.map(row =>
    row.id === state.currentSubquestion!.id
      ? { ...row, subtract: data.subtract }
      : row
  ) || []

  return {
    ...state,
    currentQuestion: { ...state.currentQuestion, subquestions: updatedSubquestions },
    currentSubquestion: { ...state.currentSubquestion, subtract: data.subtract },
  }
}

const handleSubquestionValue = (state: ParserState, data: SubquestionValueData): ParserState => {
  if (!state.currentQuestion || !state.currentSubquestion) return state

  const hasOptions = state.currentQuestion.options.length > 0

  if (hasOptions) {
    const updatedOptions = state.currentQuestion.options.map(option => ({
      ...option,
      subquestions: option.subquestions?.map(sq =>
        sq.id === state.currentSubquestion!.id
          ? { ...sq, value: data.value }
          : sq
      ),
    }))

    return {
      ...state,
      currentQuestion: { ...state.currentQuestion, options: updatedOptions },
      currentSubquestion: { ...state.currentSubquestion, value: data.value },
    }
  }

  const updatedSubquestions = state.currentQuestion.subquestions?.map(row =>
    row.id === state.currentSubquestion!.id
      ? { ...row, value: data.value }
      : row
  ) || []

  return {
    ...state,
    currentQuestion: { ...state.currentQuestion, subquestions: updatedSubquestions },
    currentSubquestion: { ...state.currentSubquestion, value: data.value },
  }
}

const handleOption = (state: ParserState, data: OptionData): ParserState => {
  if (!state.currentQuestion) return state

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      options: [
        ...state.currentQuestion.options,
        {
          value: data.text,
          label: data.text
        },
      ],
    },
    // Clear subtext and tooltip buffers when we encounter structured elements
    subtextBuffer: null,
    tooltipBuffer: null,
    subquestionSubtextBuffer: null,
    subquestionTooltipBuffer: null,
    optionSubtextBuffer: null,
    optionTooltipBuffer: null,
  }
}

const handleOptionShowIf = (state: ParserState, data: OptionShowIfData): ParserState => {
  if (!state.currentQuestion || state.currentQuestion.options.length === 0) return state

  // Apply the condition to the last option
  const lastOptionIndex = state.currentQuestion.options.length - 1
  const updatedOptions = [...state.currentQuestion.options]
  updatedOptions[lastOptionIndex] = {
    ...updatedOptions[lastOptionIndex],
    showIf: data.showIf
  }

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      options: updatedOptions,
    },
  }
}

const handleOptionHint = (state: ParserState, data: SubtextData): ParserState => {
  if (!state.currentQuestion || state.currentQuestion.options.length === 0) return state

  // Check if delimiter mode is being activated
  const isDelimiterMode = data.subtext === "---"

  if (isDelimiterMode) {
    // Delimiter mode: create buffer
    return {
      ...state,
      optionSubtextBuffer: ["---DELIMITER---"],
    }
  } else {
    // Single-line hint: apply immediately to last option
    const lastOptionIndex = state.currentQuestion.options.length - 1
    const updatedOptions = [...state.currentQuestion.options]
    updatedOptions[lastOptionIndex] = {
      ...updatedOptions[lastOptionIndex],
      hint: data.subtext
    }
    return {
      ...state,
      currentQuestion: {
        ...state.currentQuestion,
        options: updatedOptions,
      },
    }
  }
}

const handleOptionTooltip = (state: ParserState, data: TooltipData): ParserState => {
  if (!state.currentQuestion || state.currentQuestion.options.length === 0) return state

  // Check if delimiter mode is being activated
  const isDelimiterMode = data.tooltip === "---"

  if (isDelimiterMode) {
    // Delimiter mode: create buffer
    return {
      ...state,
      optionTooltipBuffer: ["---DELIMITER---"],
    }
  } else {
    // Single-line tooltip: apply immediately to last option
    const lastOptionIndex = state.currentQuestion.options.length - 1
    const updatedOptions = [...state.currentQuestion.options]
    updatedOptions[lastOptionIndex] = {
      ...updatedOptions[lastOptionIndex],
      tooltip: data.tooltip
    }
    return {
      ...state,
      currentQuestion: {
        ...state.currentQuestion,
        options: updatedOptions,
      },
    }
  }
}

const handleOptionValue = (state: ParserState, data: SubquestionValueData): ParserState => {
  if (!state.currentQuestion || state.currentQuestion.options.length === 0) return state

  const lastOptionIndex = state.currentQuestion.options.length - 1
  const updatedOptions = [...state.currentQuestion.options]
  updatedOptions[lastOptionIndex] = {
    ...updatedOptions[lastOptionIndex],
    prefillValue: data.value
  }

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      options: updatedOptions,
    },
  }
}

const handleOptionOtherText = (state: ParserState, data: OptionOtherTextData): ParserState => {
  if (!state.currentQuestion || state.currentQuestion.options.length === 0) return state

  // Apply the allowsOtherText flag to the last option
  const lastOptionIndex = state.currentQuestion.options.length - 1
  const updatedOptions = [...state.currentQuestion.options]
  updatedOptions[lastOptionIndex] = {
    ...updatedOptions[lastOptionIndex],
    allowsOtherText: data.allowsOtherText
  }

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      options: updatedOptions,
    },
  }
}

const handleOptionSubtract = (state: ParserState, data: OptionSubtractData): ParserState => {
  if (!state.currentQuestion || state.currentQuestion.options.length === 0) return state

  // Apply the subtract flag to the last option
  const lastOptionIndex = state.currentQuestion.options.length - 1
  const updatedOptions = [...state.currentQuestion.options]
  updatedOptions[lastOptionIndex] = {
    ...updatedOptions[lastOptionIndex],
    subtract: data.subtract
  }

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      options: updatedOptions,
    },
  }
}

const handleOptionExclude = (state: ParserState, data: OptionExcludeData): ParserState => {
  if (!state.currentQuestion || state.currentQuestion.options.length === 0) return state

  // Apply the exclude flag to the last option
  const lastOptionIndex = state.currentQuestion.options.length - 1
  const updatedOptions = [...state.currentQuestion.options]
  updatedOptions[lastOptionIndex] = {
    ...updatedOptions[lastOptionIndex],
    exclude: data.exclude
  }

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      options: updatedOptions,
    },
  }
}

const handleOptionCustom = (state: ParserState, data: CustomData): ParserState => {
  if (!state.currentQuestion || state.currentQuestion.options.length === 0) return state

  // Apply the custom calculation to the last option (typically a subtotal)
  const lastOptionIndex = state.currentQuestion.options.length - 1
  const updatedOptions = [...state.currentQuestion.options]
  updatedOptions[lastOptionIndex] = {
    ...updatedOptions[lastOptionIndex],
    custom: data.custom
  }

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      options: updatedOptions,
    },
  }
}

const handleOptionHeader = (state: ParserState, data: OptionHeaderData): ParserState => {
  if (!state.currentQuestion) return state

  // Create a new option for the header
  const newOption: Option = {
    value: data.label,
    label: data.label,
    header: true,
    exclude: true  // Headers are automatically excluded from calculations
  }

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      options: [...state.currentQuestion.options, newOption],
    },
  }
}

const handleOptionSeparator = (state: ParserState, data: OptionSeparatorData): ParserState => {
  if (!state.currentQuestion) return state

  // Create a new option for the separator (blank row)
  const newOption: Option = {
    value: `separator-${state.currentQuestion.options.length}`,
    label: "",
    separator: true,
    exclude: true  // Separators are automatically excluded from calculations
  }

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      options: [...state.currentQuestion.options, newOption],
    },
  }
}

const handleOptionVariable = (state: ParserState, data: VariableData): ParserState => {
  if (!state.currentQuestion || state.currentQuestion.options.length === 0) return state

  // Apply the variable to the last option
  const lastOptionIndex = state.currentQuestion.options.length - 1
  const updatedOptions = [...state.currentQuestion.options]
  updatedOptions[lastOptionIndex] = {
    ...updatedOptions[lastOptionIndex],
    variable: data.variable
  }

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      options: updatedOptions,
    },
  }
}

const handleOptionColumn = (state: ParserState, data: ColumnData): ParserState => {
  if (!state.currentQuestion || state.currentQuestion.options.length === 0) return state

  // Apply the column to the last option
  const lastOptionIndex = state.currentQuestion.options.length - 1
  const updatedOptions = [...state.currentQuestion.options]
  updatedOptions[lastOptionIndex] = {
    ...updatedOptions[lastOptionIndex],
    column: data.column
  }

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      options: updatedOptions,
    },
  }
}

const handleSubquestion = (state: ParserState, data: SubquestionData): ParserState => {
  if (!state.currentQuestion) return state

  // Check if we have options (breakdown context) - attach subquestion to last option
  const hasOptions = state.currentQuestion.options.length > 0

  if (hasOptions) {
    // Breakdown: attach subquestion to the last option
    const lastOptionIndex = state.currentQuestion.options.length - 1
    const updatedOptions = [...state.currentQuestion.options]
    const lastOption = updatedOptions[lastOptionIndex]

    updatedOptions[lastOptionIndex] = {
      ...lastOption,
      subquestions: [
        ...(lastOption.subquestions || []),
        {
          id: data.id,
          text: data.text
        },
      ],
    }

    return {
      ...state,
      currentQuestion: {
        ...state.currentQuestion,
        options: updatedOptions,
      },
      currentSubquestion: {
        id: data.id,
        text: data.text
      },
      // Clear subtext and tooltip buffers when we encounter structured elements
      subtextBuffer: null,
      tooltipBuffer: null,
      subquestionSubtextBuffer: null,
      subquestionTooltipBuffer: null,
    optionSubtextBuffer: null,
    optionTooltipBuffer: null,
    }
  }

  // Matrix: attach to question-level subquestions
  // Set question type to matrix when we encounter the first matrix row
  const updatedType = state.currentQuestion.subquestions?.length === 0 ? "matrix" : state.currentQuestion.type

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      type: updatedType,
      subquestions: [
        ...(state.currentQuestion.subquestions || []),
        {
          id: data.id,
          text: data.text
        },
      ],
    },
    currentSubquestion: {
      id: data.id,
      text: data.text
    },
    // Clear subtext and tooltip buffers when we encounter structured elements
    subtextBuffer: null,
    tooltipBuffer: null,
    subquestionSubtextBuffer: null,
    subquestionTooltipBuffer: null,
    optionSubtextBuffer: null,
    optionTooltipBuffer: null,
  }
}

const handleInputType = (
  state: ParserState,
  data: InputTypeData
): ParserState => {
  if (!state.currentQuestion) return state

  // For matrix questions, preserve the matrix type but store the input behavior
  const isMatrixQuestion = state.currentQuestion.subquestions && state.currentQuestion.subquestions.length > 0

  const questionType = isMatrixQuestion ? "matrix" : data.type

  // Valid input types for matrix questions (excludes matrix, breakdown, and number)
  // Note: NUMBER is not supported for matrix questions - use BREAKDOWN instead
  const validInputTypes: Question["inputType"][] = ["multiple_choice", "checkbox", "text", "essay"]
  const isValidInputType = (type: Question["type"]): type is NonNullable<Question["inputType"]> => {
    return validInputTypes.includes(type as Question["inputType"])
  }

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      type: questionType,
      // Store the actual input type for matrix questions to know if it should be radio or checkbox
      ...(isMatrixQuestion && data.type !== "matrix" && isValidInputType(data.type) && { inputType: data.type }),
      // For matrix questions, checkbox, and breakdown questions, preserve options
      options: (data.type === "checkbox" || isMatrixQuestion || data.type === "breakdown") ? state.currentQuestion.options : [],
    },
    // Clear subtext and tooltip buffers when we encounter structured elements
    subtextBuffer: null,
    tooltipBuffer: null,
    subquestionSubtextBuffer: null,
    subquestionTooltipBuffer: null,
    optionSubtextBuffer: null,
    optionTooltipBuffer: null,
  }
}

const handleVariable = (
  state: ParserState,
  data: VariableData
): ParserState => {
  if (!state.currentQuestion) {
    return state
  }

  // If we have a current matrix row, assign the variable to it
  if (state.currentSubquestion) {
    // Update the matrix row with the variable
    const updatedSubquestions = state.currentQuestion.subquestions?.map(row =>
      row.id === state.currentSubquestion!.id
        ? { ...row, variable: data.variable }
        : row
    ) || []

    return {
      ...state,
      currentQuestion: {
        ...state.currentQuestion,
        subquestions: updatedSubquestions,
      },
      currentSubquestion: {
        ...state.currentSubquestion,
        variable: data.variable,
      },
      // Clear subtext and tooltip buffers when we encounter structured elements
      subtextBuffer: null,
      tooltipBuffer: null,
      subquestionSubtextBuffer: null,
      subquestionTooltipBuffer: null,
    optionSubtextBuffer: null,
    optionTooltipBuffer: null,
    }
  }

  // Otherwise, assign to the question itself
  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      variable: data.variable,
    },
    // Clear subtext and tooltip buffers when we encounter structured elements
    subtextBuffer: null,
    tooltipBuffer: null,
    subquestionSubtextBuffer: null,
    subquestionTooltipBuffer: null,
    optionSubtextBuffer: null,
    optionTooltipBuffer: null,
  }
}

const handleShowIf = (state: ParserState, data: ShowIfData): ParserState => {
  if (state.currentQuestion) {
    return {
      ...state,
      currentQuestion: {
        ...state.currentQuestion,
        showIf: data.showIf,
      },
    }
  }

  if (state.currentPage) {
    return {
      ...state,
      currentPage: {
        ...state.currentPage,
        showIf: data.showIf,
      },
    }
  }

  if (state.currentBlock) {
    return {
      ...state,
      currentBlock: {
        ...state.currentBlock,
        showIf: data.showIf,
      },
    }
  }

  return state
}

const handleTotalLabel = (state: ParserState, data: TotalLabelData): ParserState => {
  if (!state.currentQuestion) return state

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      totalLabel: data.totalLabel,
    },
  }
}

const handleTotalColumn = (state: ParserState, data: TotalColumnData): ParserState => {
  if (!state.currentQuestion) return state

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      totalColumn: data.totalColumn,
    },
  }
}

const handleSubtotalLabel = (state: ParserState, data: SubtotalLabelData): ParserState => {
  if (!state.currentQuestion) return state

  // For matrix questions with subquestions, attach subtotalLabel to the last subquestion
  const hasSubquestions = state.currentQuestion.subquestions && state.currentQuestion.subquestions.length > 0
  if (hasSubquestions) {
    const subquestions = state.currentQuestion.subquestions!
    const lastSubquestionIndex = subquestions.length - 1

    const updatedSubquestions = subquestions.map((sq, idx) =>
      idx === lastSubquestionIndex
        ? { ...sq, subtotalLabel: data.subtotalLabel }
        : sq
    )

    return {
      ...state,
      currentQuestion: {
        ...state.currentQuestion,
        subquestions: updatedSubquestions,
      },
      currentSubquestion: state.currentSubquestion
        ? { ...state.currentSubquestion, subtotalLabel: data.subtotalLabel }
        : null,
    }
  }

  // For breakdown questions, create a new option with subtotalLabel
  const newOption: Option = {
    value: data.subtotalLabel,
    label: data.subtotalLabel,
    subtotalLabel: data.subtotalLabel,
    exclude: true  // Subtotals are automatically excluded from the final total
  }

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      options: [...state.currentQuestion.options, newOption],
    },
  }
}

const handlePrefix = (state: ParserState, data: PrefixData): ParserState => {
  if (!state.currentQuestion) return state

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      prefix: data.prefix,
    },
  }
}

const handleSuffix = (state: ParserState, data: SuffixData): ParserState => {
  if (!state.currentQuestion) return state

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      suffix: data.suffix,
    },
  }
}

const handleContent = (
  state: ParserState,
  _data: ContentData,
  originalLine: string
): ParserState => {
  const trimmed = originalLine.trim()

  // Handle delimiter (---) logic
  if (trimmed === "---") {
    // Check if any buffer is active
    const hasActiveBuffer = !!(
      state.tooltipBuffer ||
      state.subtextBuffer ||
      state.subquestionTooltipBuffer ||
      state.subquestionSubtextBuffer ||
      state.optionTooltipBuffer ||
      state.optionSubtextBuffer
    )

    if (hasActiveBuffer) {
      // Check if buffer has actual content (not just empty strings)
      // This distinguishes opening delimiter from closing delimiter
      const hasRealContent = (buffer: string[] | null) => {
        if (!buffer || buffer.length === 0) return false
        // Check if any item in buffer is non-empty after trimming
        return buffer.some(line => line.trim().length > 0)
      }

      const bufferHasContent =
        hasRealContent(state.tooltipBuffer) ||
        hasRealContent(state.subtextBuffer) ||
        hasRealContent(state.subquestionTooltipBuffer) ||
        hasRealContent(state.subquestionSubtextBuffer) ||
        hasRealContent(state.optionTooltipBuffer) ||
        hasRealContent(state.optionSubtextBuffer)

      if (bufferHasContent) {
        // This is a closing delimiter - apply buffer content and clear buffers
        let newState = { ...state }

        // Apply tooltip buffer to question
        if (state.tooltipBuffer && newState.currentQuestion) {
          newState.currentQuestion = {
            ...newState.currentQuestion,
            tooltip: joinBuffer(state.tooltipBuffer),
          }
        }

        // Apply subtext buffer to question
        if (state.subtextBuffer && newState.currentQuestion) {
          newState.currentQuestion = {
            ...newState.currentQuestion,
            subtext: joinBuffer(state.subtextBuffer),
          }
        }

        // Apply option tooltip buffer to last option
        if (state.optionTooltipBuffer && newState.currentQuestion) {
          const lastOptionIndex = newState.currentQuestion.options.length - 1
          if (lastOptionIndex >= 0) {
            const updatedOptions = [...newState.currentQuestion.options]
            updatedOptions[lastOptionIndex] = {
              ...updatedOptions[lastOptionIndex],
              tooltip: joinBuffer(state.optionTooltipBuffer),
            }
            newState.currentQuestion = {
              ...newState.currentQuestion,
              options: updatedOptions,
            }
          }
        }

        // Apply option subtext buffer to last option
        if (state.optionSubtextBuffer && newState.currentQuestion) {
          const lastOptionIndex = newState.currentQuestion.options.length - 1
          if (lastOptionIndex >= 0) {
            const updatedOptions = [...newState.currentQuestion.options]
            updatedOptions[lastOptionIndex] = {
              ...updatedOptions[lastOptionIndex],
              hint: joinBuffer(state.optionSubtextBuffer),
            }
            newState.currentQuestion = {
              ...newState.currentQuestion,
              options: updatedOptions,
            }
          }
        }

        // Apply subquestion tooltip buffer
        if (state.subquestionTooltipBuffer && state.currentSubquestion && newState.currentQuestion) {
          const hasOptions = newState.currentQuestion.options.length > 0
          if (hasOptions) {
            const updatedOptions = newState.currentQuestion.options.map(option => ({
              ...option,
              subquestions: option.subquestions?.map(sq =>
                sq.id === state.currentSubquestion!.id
                  ? { ...sq, tooltip: joinBuffer(state.subquestionTooltipBuffer!) }
                  : sq
              ),
            }))
            newState.currentQuestion = { ...newState.currentQuestion, options: updatedOptions }
          } else {
            const updatedSubquestions = newState.currentQuestion.subquestions?.map(row =>
              row.id === state.currentSubquestion!.id
                ? { ...row, tooltip: joinBuffer(state.subquestionTooltipBuffer!) }
                : row
            ) || []
            newState.currentQuestion = { ...newState.currentQuestion, subquestions: updatedSubquestions }
          }
        }

        // Apply subquestion subtext buffer
        if (state.subquestionSubtextBuffer && state.currentSubquestion && newState.currentQuestion) {
          const hasOptions = newState.currentQuestion.options.length > 0
          if (hasOptions) {
            const updatedOptions = newState.currentQuestion.options.map(option => ({
              ...option,
              subquestions: option.subquestions?.map(sq =>
                sq.id === state.currentSubquestion!.id
                  ? { ...sq, subtext: joinBuffer(state.subquestionSubtextBuffer!) }
                  : sq
              ),
            }))
            newState.currentQuestion = { ...newState.currentQuestion, options: updatedOptions }
          } else {
            const updatedSubquestions = newState.currentQuestion.subquestions?.map(row =>
              row.id === state.currentSubquestion!.id
                ? { ...row, subtext: joinBuffer(state.subquestionSubtextBuffer!) }
                : row
            ) || []
            newState.currentQuestion = { ...newState.currentQuestion, subquestions: updatedSubquestions }
          }
        }

        // Clear all buffers
        return {
          ...newState,
          tooltipBuffer: null,
          subtextBuffer: null,
          subquestionTooltipBuffer: null,
          subquestionSubtextBuffer: null,
          optionTooltipBuffer: null,
          optionSubtextBuffer: null,
        }
      } else {
        // This is an opening delimiter - mark that we've seen it by incrementing buffer length
        // Add a special delimiter marker so subsequent lines are captured as content
        const delimiterMarker = "---DELIMITER---"
        return {
          ...state,
          tooltipBuffer: state.tooltipBuffer ? [...state.tooltipBuffer, delimiterMarker] : state.tooltipBuffer,
          subtextBuffer: state.subtextBuffer ? [...state.subtextBuffer, delimiterMarker] : state.subtextBuffer,
          subquestionTooltipBuffer: state.subquestionTooltipBuffer ? [...state.subquestionTooltipBuffer, delimiterMarker] : state.subquestionTooltipBuffer,
          subquestionSubtextBuffer: state.subquestionSubtextBuffer ? [...state.subquestionSubtextBuffer, delimiterMarker] : state.subquestionSubtextBuffer,
          optionTooltipBuffer: state.optionTooltipBuffer ? [...state.optionTooltipBuffer, delimiterMarker] : state.optionTooltipBuffer,
          optionSubtextBuffer: state.optionSubtextBuffer ? [...state.optionSubtextBuffer, delimiterMarker] : state.optionSubtextBuffer,
        }
      }
    }
  }

  // Strip indentation from content lines when they're part of a buffer
  const cleanedLine = removeIndentation(originalLine)

  // If we have an option tooltip buffer, append to the last option's tooltip
  if (state.currentQuestion && state.optionTooltipBuffer && state.currentQuestion.options.length > 0) {
    const updatedBuffer = [...state.optionTooltipBuffer, cleanedLine]
    const lastOptionIndex = state.currentQuestion.options.length - 1
    const updatedOptions = [...state.currentQuestion.options]
    updatedOptions[lastOptionIndex] = {
      ...updatedOptions[lastOptionIndex],
      tooltip: joinBuffer(updatedBuffer),
    }

    return {
      ...state,
      optionTooltipBuffer: updatedBuffer,
      currentQuestion: {
        ...state.currentQuestion,
        options: updatedOptions,
      },
    }
  }

  // If we have an option subtext buffer, append to the last option's hint
  if (state.currentQuestion && state.optionSubtextBuffer && state.currentQuestion.options.length > 0) {
    const updatedBuffer = [...state.optionSubtextBuffer, cleanedLine]
    const lastOptionIndex = state.currentQuestion.options.length - 1
    const updatedOptions = [...state.currentQuestion.options]
    updatedOptions[lastOptionIndex] = {
      ...updatedOptions[lastOptionIndex],
      hint: joinBuffer(updatedBuffer),
    }

    return {
      ...state,
      optionSubtextBuffer: updatedBuffer,
      currentQuestion: {
        ...state.currentQuestion,
        options: updatedOptions,
      },
    }
  }

  // If we have a subquestion tooltip buffer, append to subquestion tooltip
  if (state.currentQuestion && state.currentSubquestion && state.subquestionTooltipBuffer) {
    const updatedBuffer = [...state.subquestionTooltipBuffer, cleanedLine]
    const updatedSubquestions = state.currentQuestion.subquestions?.map(row =>
      row.id === state.currentSubquestion!.id
        ? { ...row, tooltip: joinBuffer(updatedBuffer) }
        : row
    ) || []

    return {
      ...state,
      subquestionTooltipBuffer: updatedBuffer,
      currentQuestion: {
        ...state.currentQuestion,
        subquestions: updatedSubquestions,
      },
      currentSubquestion: {
        ...state.currentSubquestion,
        tooltip: joinBuffer(updatedBuffer),
      },
    }
  }

  // If we have a subquestion subtext buffer, append to subquestion hint
  if (state.currentQuestion && state.currentSubquestion && state.subquestionSubtextBuffer) {
    const updatedBuffer = [...state.subquestionSubtextBuffer, cleanedLine]
    const updatedSubquestions = state.currentQuestion.subquestions?.map(row =>
      row.id === state.currentSubquestion!.id
        ? { ...row, subtext: joinBuffer(updatedBuffer) }
        : row
    ) || []

    return {
      ...state,
      subquestionSubtextBuffer: updatedBuffer,
      currentQuestion: {
        ...state.currentQuestion,
        subquestions: updatedSubquestions,
      },
      currentSubquestion: {
        ...state.currentSubquestion,
        subtext: joinBuffer(updatedBuffer),
      },
    }
  }

  // If we have a current question and an active tooltip buffer, append to tooltip
  if (state.currentQuestion && state.tooltipBuffer) {
    const updatedBuffer = [...state.tooltipBuffer, cleanedLine]
    return {
      ...state,
      tooltipBuffer: updatedBuffer,
      currentQuestion: {
        ...state.currentQuestion,
        tooltip: joinBuffer(updatedBuffer),
      },
    }
  }

  // If we have a current question and an active subtext buffer, append to subtext
  if (state.currentQuestion && state.subtextBuffer) {
    const updatedBuffer = [...state.subtextBuffer, cleanedLine]
    return {
      ...state,
      subtextBuffer: updatedBuffer,
      currentQuestion: {
        ...state.currentQuestion,
        subtext: joinBuffer(updatedBuffer),
      },
    }
  }
  
  // If we have a current question but no subtext buffer, decide what to do with the content
  if (state.currentQuestion) {
    // Check if this looks like standalone content (not question structure)
    const trimmed = originalLine.trim()
    const isQuestionStructure =
      trimmed.startsWith('-') ||
      trimmed.startsWith('HINT:') ||
      trimmed.startsWith('VARIABLE:') ||
      trimmed.startsWith('SHOW_IF:') ||
      trimmed.match(/^(TEXT|ESSAY|NUMBER|CHECKBOX)$/) ||
      trimmed === ''

    // If this is standalone content and the question has structure, create new section
    if (!isQuestionStructure &&
        (state.currentQuestion.options.length > 0 ||
         (state.currentQuestion.subquestions && state.currentQuestion.subquestions.length > 0))) {

      // Save current question first (without the content line)
      const newState = saveCurrentQuestion(state)

      // Create a new section with this content and no title
      const newSection = createSection()
      newSection.content = originalLine

      if (newState.currentPage) {
        newState.currentPage.sections.push(newSection)
      }

      return {
        ...newState,
        currentSection: newSection,
        currentQuestion: null,
        currentSubquestion: null,
      }
    }

    // Otherwise append to question text (for question structure or empty questions)
    return {
      ...state,
      currentQuestion: {
        ...state.currentQuestion,
        text: state.currentQuestion.text + "\n\n" + originalLine,
      },
    }
  }

  if (state.currentSection) {
    // Update the current section's content
    const updatedSection = {
      ...state.currentSection,
      content: state.currentSection.content
        ? state.currentSection.content + "\n" + originalLine
        : originalLine,
    }

    // Also update the section in the page's sections array
    let updatedPage = state.currentPage
    if (state.currentPage) {
      const sectionIndex = state.currentPage.sections.findIndex(s => s === state.currentSection)
      if (sectionIndex !== -1) {
        const updatedSections = [...state.currentPage.sections]
        updatedSections[sectionIndex] = updatedSection
        updatedPage = {
          ...state.currentPage,
          sections: updatedSections
        }
      }
    }

    return {
      ...state,
      currentPage: updatedPage,
      currentSection: updatedSection,
    }
  }

  // No fallback to page content since pages no longer have content
  // All content should go to sections

  return state
}

const handleCompute = (state: ParserState, data: ComputeData): ParserState => {
  // If we have a current page, add to page-level COMPUTE
  if (state.currentPage) {
    return {
      ...state,
      currentPage: {
        ...state.currentPage,
        computedVariables: [
          ...state.currentPage.computedVariables,
          { name: data.name, expression: data.expression },
        ],
      },
    }
  }
  
  // If we have a current block but no current page, add to block-level COMPUTE
  if (state.currentBlock) {
    return {
      ...state,
      currentBlock: {
        ...state.currentBlock,
        computedVariables: [
          ...state.currentBlock.computedVariables,
          { name: data.name, expression: data.expression },
        ],
      },
    }
  }
  
  return state
}

// Main state reducer

const reduceParsedLine = (
  state: ParserState,
  parsedLine: ParsedLine
): ParserState => {
  switch (parsedLine.type) {
    case "page":
      return handlePage(state, parsedLine.data)
    case "question":
      return handleQuestion(state, parsedLine.data)
    case "subtext":
      return handleSubtext(state, parsedLine.data)
    case "tooltip":
      return handleTooltip(state, parsedLine.data)
    case "option":
      return handleOption(state, parsedLine.data)
    case "option_show_if":
      return handleOptionShowIf(state, parsedLine.data)
    case "option_other_text":
      return handleOptionOtherText(state, parsedLine.data)
    case "option_subtract":
      return handleOptionSubtract(state, parsedLine.data)
    case "option_hint":
      return handleOptionHint(state, parsedLine.data)
    case "option_tooltip":
      return handleOptionTooltip(state, parsedLine.data)
    case "option_value":
      return handleOptionValue(state, parsedLine.data)
    case "option_variable":
      return handleOptionVariable(state, parsedLine.data)
    case "option_column":
      return handleOptionColumn(state, parsedLine.data)
    case "option_exclude":
      return handleOptionExclude(state, parsedLine.data)
    case "option_custom":
      return handleOptionCustom(state, parsedLine.data)
    case "option_header":
      return handleOptionHeader(state, parsedLine.data)
    case "option_separator":
      return handleOptionSeparator(state, parsedLine.data)
    case "option_subtotal":
      return handleSubtotalLabel(state, parsedLine.data)
    case "subquestion_hint":
      return handleSubquestionHint(state, parsedLine.data)
    case "subquestion_tooltip":
      return handleSubquestionTooltip(state, parsedLine.data)
    case "subquestion_subtract":
      return handleSubquestionSubtract(state, parsedLine.data)
    case "subquestion_value":
      return handleSubquestionValue(state, parsedLine.data)
    case "matrix_row":
      return handleSubquestion(state, parsedLine.data)
    case "input_type":
      return handleInputType(state, parsedLine.data)
    case "variable":
      return handleVariable(state, parsedLine.data)
    case "show_if":
      return handleShowIf(state, parsedLine.data)
    case "total_label":
      return handleTotalLabel(state, parsedLine.data)
    case "total_column":
      return handleTotalColumn(state, parsedLine.data)
    case "subtotal_label":
      return handleSubtotalLabel(state, parsedLine.data)
    case "prefix":
      return handlePrefix(state, parsedLine.data)
    case "suffix":
      return handleSuffix(state, parsedLine.data)
    case "content":
      return handleContent(state, parsedLine.data, parsedLine.raw)
    case "compute":
      return handleCompute(state, parsedLine.data)
    case "block":
      return handleBlock(state, parsedLine.data)
    case "nav_item":
      return handleNavItem(state, parsedLine.data)
    case "nav_level":
      return handleNavLevel(state, parsedLine.data)
    default:
      // Exhaustiveness check - TypeScript will error if we miss a case
      const _exhaustive: never = parsedLine
      throw new Error(`Unhandled line type: ${_exhaustive}`)
  }
}

// Main function

export const parseQuestionnaire = (text: string): { blocks: Block[], navItems: NavItem[] } => {
  try {
    const lines = text.split("\n")

    // Track code fence state to avoid parsing content inside fences
    let insideCodeFence = false
    const processedLines: Array<{ line: string; shouldParse: boolean }> = []

    for (const line of lines) {
      const trimmed = line.trim()

      // Check if this line is a code fence delimiter
      if (trimmed.startsWith("```")) {
        insideCodeFence = !insideCodeFence
        // Keep fence lines but don't parse them
        processedLines.push({ line, shouldParse: false })
        continue
      }

      // Keep all lines, but mark whether they should be parsed
      processedLines.push({ line, shouldParse: !insideCodeFence })
    }

    // Create a default block to hold all pages when BLOCK: is not explicitly declared
    const defaultBlock = createBlock("")

    const initialState: ParserState = {
      blocks: [],
      navItems: [],
      currentBlock: defaultBlock,
      currentNavItem: null,
      currentNavLevel: 1,
      currentPage: null,
      currentSection: null,
      currentQuestion: null,
      currentSubquestion: null,
      subtextBuffer: null,
      tooltipBuffer: null,
      subquestionSubtextBuffer: null,
      subquestionTooltipBuffer: null,
      optionSubtextBuffer: null,
      optionTooltipBuffer: null,
      questionCounter: 1,
    }

    const finalState = processedLines.reduce((state, { line, shouldParse }) => {
      if (!shouldParse) {
        // Lines inside code fences are treated as content
        const contentLine: ParsedLine = { type: "content", raw: line, data: { content: line } }
        return reduceParsedLine(state, contentLine)
      }
      const parsedLine = parseLine(line, state)
      return reduceParsedLine(state, parsedLine)
    }, initialState)

    // Save any remaining work
    let result = saveCurrentQuestion(finalState)
    result = saveCurrentSection(result)
    result = saveCurrentPage(result)
    result = saveCurrentNavItem(result)
    result = saveCurrentBlock(result)

    // Run validation checks
    validateVariableNames(result.blocks)
    validateConditionReferences(result.blocks)
    validateComputedVariableReferences(result.blocks)

    return {
      blocks: result.blocks,
      navItems: result.navItems,
    }
  } catch (err) {
    throw new Error(
      "Failed to parse questionnaire format: " + (err as Error).message
    )
  }
}
