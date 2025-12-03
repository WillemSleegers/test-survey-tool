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
  SubquestionData,
  SubquestionSubtractData,
  SubquestionValueData,
  InputTypeData,
  VariableData,
  ShowIfData,
  TotalLabelData,
  SubtotalLabelData,
  PrefixData,
  SuffixData,
  ContentData,
  ComputeData,
  BlockData,
  NavItemData,
  NavLevelData,
  ParsedLine,
  ParserState,
} from "@/lib/types"
import {
  validateVariableNames,
  validateConditionReferences,
  validateComputedVariableReferences,
} from "@/lib/validation"

// Line classification functions

const classifyLine = (line: string, state: ParserState): ParsedLine["type"] => {
  const trimmed = line.trim()

  if (trimmed.startsWith("# ") || trimmed === "#") return "page"
  if (trimmed.match(/^Q:/)) return "question"
  if (trimmed.startsWith("HINT:")) return "subtext"
  if (trimmed.startsWith("TOOLTIP:")) return "tooltip"
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
    // Check if this is a subquestion subtract flag (- SUBTRACT)
    if (trimmed.match(/^-\s*SUBTRACT\s*$/)) {
      return state.currentSubquestion ? "subquestion_subtract" : "content"
    }
    // Check if this is a subquestion value (- VALUE: ...)
    if (trimmed.match(/^-\s*VALUE:/)) {
      return state.currentSubquestion ? "subquestion_value" : "content"
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
  if (["TEXT", "ESSAY", "NUMBER", "CHECKBOX", "BREAKDOWN"].includes(trimmed)) return "input_type"
  if (trimmed.startsWith("VARIABLE:")) return "variable"
  if (trimmed.startsWith("SHOW_IF:")) return "show_if"
  if (trimmed.startsWith("TOTAL:")) return "total_label"
  if (trimmed.startsWith("SUBTOTAL:")) return "subtotal_label"
  if (trimmed.startsWith("PREFIX:")) return "prefix"
  if (trimmed.startsWith("SUFFIX:")) return "suffix"
  if (trimmed.startsWith("COMPUTE:")) return "compute"
  if (trimmed.startsWith("NAV:")) return "nav_item"
  if (trimmed.startsWith("LEVEL:")) return "nav_level"
  if (trimmed.startsWith("BLOCK:")) return "block"

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

const parseOptionHint = (line: string): SubtextData => {
  const trimmed = line.trim()
  const match = trimmed.match(/^-\s*HINT:\s*(.*)/)
  return { subtext: match ? match[1] : "" }
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
    case "option_hint":
      return { type, raw: line, data: parseOptionHint(line) }
    case "option_tooltip":
      return { type, raw: line, data: parseOptionTooltip(line) }
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
  }
}

const handleSubtext = (state: ParserState, data: SubtextData): ParserState => {
  if (!state.currentQuestion) return state

  // If we have a current matrix row, assign subtext to it
  if (state.currentSubquestion) {
    // Update the matrix row with subtext
    const updatedSubquestions = state.currentQuestion.subquestions?.map(row =>
      row.id === state.currentSubquestion!.id
        ? { ...row, subtext: data.subtext }
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
        subtext: data.subtext,
      },
    }
  }

  // Otherwise assign to the question itself (original behavior)
  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      subtext: data.subtext,
    },
    // Start collecting multiline subtext
    subtextBuffer: [data.subtext],
  }
}

const handleTooltip = (state: ParserState, data: TooltipData): ParserState => {
  if (!state.currentQuestion) return state

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      tooltip: data.tooltip,
    },
    // Start collecting multiline tooltip
    tooltipBuffer: [data.tooltip],
  }
}

const handleSubquestionHint = (state: ParserState, data: SubtextData): ParserState => {
  if (!state.currentQuestion || !state.currentSubquestion) return state

  // Check if subquestion is attached to an option (breakdown) or question (matrix)
  const hasOptions = state.currentQuestion.options.length > 0
  const hasQuestionSubquestions = (state.currentQuestion.subquestions?.length || 0) > 0

  if (hasOptions) {
    // Number_list: update subquestion in option
    const updatedOptions = state.currentQuestion.options.map(option => ({
      ...option,
      subquestions: option.subquestions?.map(sq =>
        sq.id === state.currentSubquestion!.id
          ? { ...sq, subtext: data.subtext }
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
        subtext: data.subtext,
      },
      subquestionSubtextBuffer: [data.subtext],
    }
  }

  if (hasQuestionSubquestions) {
    // Matrix: update subquestion at question level
    const updatedSubquestions = state.currentQuestion.subquestions?.map(row =>
      row.id === state.currentSubquestion!.id
        ? { ...row, subtext: data.subtext }
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
        subtext: data.subtext,
      },
      subquestionSubtextBuffer: [data.subtext],
    }
  }

  return state
}

const handleSubquestionTooltip = (state: ParserState, data: TooltipData): ParserState => {
  if (!state.currentQuestion || !state.currentSubquestion) return state

  const hasOptions = state.currentQuestion.options.length > 0

  if (hasOptions) {
    const updatedOptions = state.currentQuestion.options.map(option => ({
      ...option,
      subquestions: option.subquestions?.map(sq =>
        sq.id === state.currentSubquestion!.id
          ? { ...sq, tooltip: data.tooltip }
          : sq
      ),
    }))

    return {
      ...state,
      currentQuestion: { ...state.currentQuestion, options: updatedOptions },
      currentSubquestion: { ...state.currentSubquestion, tooltip: data.tooltip },
      subquestionTooltipBuffer: [data.tooltip],
    }
  }

  const updatedSubquestions = state.currentQuestion.subquestions?.map(row =>
    row.id === state.currentSubquestion!.id
      ? { ...row, tooltip: data.tooltip }
      : row
  ) || []

  return {
    ...state,
    currentQuestion: { ...state.currentQuestion, subquestions: updatedSubquestions },
    currentSubquestion: { ...state.currentSubquestion, tooltip: data.tooltip },
    subquestionTooltipBuffer: [data.tooltip],
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

  // Apply hint to the last option
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

const handleOptionTooltip = (state: ParserState, data: TooltipData): ParserState => {
  if (!state.currentQuestion || state.currentQuestion.options.length === 0) return state

  // Apply tooltip to the last option
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

  // Valid input types for matrix questions (excludes matrix and breakdown)
  const validInputTypes: Question["inputType"][] = ["multiple_choice", "checkbox", "text", "essay", "number"]
  const isValidInputType = (type: Question["type"]): type is NonNullable<Question["inputType"]> => {
    return validInputTypes.includes(type as Question["inputType"])
  }

  // For breakdown questions, finalize any ungrouped options
  let finalOptions = state.currentQuestion.options
  let finalOptionGroups = state.currentQuestion.optionGroups

  if (data.type === "breakdown") {
    // Finalize any ungrouped options
    if (finalOptionGroups && finalOptionGroups.length > 0) {
      // If we have ungrouped options and already have groups, add remaining options as a final group
      finalOptionGroups = [
        ...finalOptionGroups,
        {
          options: finalOptions,
        },
      ]
      finalOptions = []
    }
    // Otherwise, keep the options as-is (flat list without groups)
  }

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      type: questionType,
      // Store the actual input type for matrix questions to know if it should be radio or checkbox
      ...(isMatrixQuestion && data.type !== "matrix" && isValidInputType(data.type) && { inputType: data.type }),
      // For matrix questions, checkbox, and breakdown questions, preserve options
      options: (data.type === "checkbox" || isMatrixQuestion || data.type === "breakdown") ? finalOptions : [],
      ...(finalOptionGroups && finalOptionGroups.length > 0 && { optionGroups: finalOptionGroups }),
    },
    // Clear subtext and tooltip buffers when we encounter structured elements
    subtextBuffer: null,
    tooltipBuffer: null,
    subquestionSubtextBuffer: null,
    subquestionTooltipBuffer: null,
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

  // For breakdown questions, create an option group from the current options
  const currentOptions = state.currentQuestion.options
  if (currentOptions.length === 0) return state

  const newGroup = {
    options: currentOptions,
    subtotalLabel: data.subtotalLabel,
  }

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      optionGroups: [
        ...(state.currentQuestion.optionGroups || []),
        newGroup,
      ],
      // Clear options for the next group
      options: [],
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
  // If we have a subquestion tooltip buffer, append to subquestion tooltip
  if (state.currentQuestion && state.currentSubquestion && state.subquestionTooltipBuffer) {
    const updatedBuffer = [...state.subquestionTooltipBuffer, originalLine]
    const updatedSubquestions = state.currentQuestion.subquestions?.map(row =>
      row.id === state.currentSubquestion!.id
        ? { ...row, tooltip: updatedBuffer.join('\n') }
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
        tooltip: updatedBuffer.join('\n'),
      },
    }
  }

  // If we have a subquestion subtext buffer, append to subquestion hint
  if (state.currentQuestion && state.currentSubquestion && state.subquestionSubtextBuffer) {
    const updatedBuffer = [...state.subquestionSubtextBuffer, originalLine]
    const updatedSubquestions = state.currentQuestion.subquestions?.map(row =>
      row.id === state.currentSubquestion!.id
        ? { ...row, subtext: updatedBuffer.join('\n') }
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
        subtext: updatedBuffer.join('\n'),
      },
    }
  }

  // If we have a current question and an active tooltip buffer, append to tooltip
  if (state.currentQuestion && state.tooltipBuffer) {
    const updatedBuffer = [...state.tooltipBuffer, originalLine]
    return {
      ...state,
      tooltipBuffer: updatedBuffer,
      currentQuestion: {
        ...state.currentQuestion,
        tooltip: updatedBuffer.join('\n'),
      },
    }
  }

  // If we have a current question and an active subtext buffer, append to subtext
  if (state.currentQuestion && state.subtextBuffer) {
    const updatedBuffer = [...state.subtextBuffer, originalLine]
    return {
      ...state,
      subtextBuffer: updatedBuffer,
      currentQuestion: {
        ...state.currentQuestion,
        subtext: updatedBuffer.join('\n'),
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
    case "option_hint":
      return handleOptionHint(state, parsedLine.data)
    case "option_tooltip":
      return handleOptionTooltip(state, parsedLine.data)
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
