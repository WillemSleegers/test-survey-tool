import {
  Question,
  Page,
  Block,
  PageData,
  Section,
  SectionData,
  QuestionData,
  SubtextData,
  TooltipData,
  OptionData,
  OptionShowIfData,
  OptionOtherTextData,
  OptionHintData,
  MatrixRowData,
  MatrixRowVariableData,
  InputTypeData,
  VariableData,
  ShowIfData,
  ContentData,
  ComputeData,
  BlockData,
  TotalLabelData,
  SubtotalLabelData,
  PrefixData,
  SuffixData,
  ParsedLine,
  ParserState,
} from "@/lib/types"
import { normalizeOperators } from "@/lib/conditions/condition-parser"

// Line classification functions

const classifyLine = (line: string, state: ParserState): ParsedLine["type"] => {
  const trimmed = line.trim()
  const original = line

  if (trimmed.startsWith("# ") || trimmed === "#") return "page"
  if (trimmed.startsWith("## ")) return "section"
  if (trimmed.match(/^Q\d+:/) || trimmed.match(/^Q:/)) return "question"

  // HINT can be for questions (no indent) or options (indented)
  if (trimmed.startsWith("HINT:")) {
    // Check if this is indented (option hint) or not (question hint)
    const hasIndent = original !== trimmed && original.startsWith(" ")
    if (hasIndent && state.currentQuestion && state.currentQuestion.options.length > 0) {
      return "option_hint"
    }
    return "subtext"
  }

  // TOOLTIP is always for questions
  if (trimmed.startsWith("TOOLTIP:")) {
    return "tooltip"
  }

  if (trimmed.match(/^-\s*([A-Z]\))?(.+)/) || trimmed.match(/^-\s+(.+)/)) {
    // Check if this is a matrix row (- Q: ...)
    if (trimmed.match(/^-\s*Q:/)) {
      return state.currentQuestion ? "matrix_row" : "content"
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
  if (["TEXT", "ESSAY", "NUMBER", "CHECKBOX"].includes(trimmed)) return "input_type"

  // VARIABLE can be for questions (no indent) or matrix rows (indented)
  if (trimmed.startsWith("VARIABLE:")) {
    const hasIndent = original !== trimmed && original.startsWith(" ")
    if (hasIndent && state.currentQuestion && state.currentQuestion.matrixRows && state.currentQuestion.matrixRows.length > 0) {
      return "matrix_row_variable"
    }
    return "variable"
  }

  if (trimmed.startsWith("SHOW_IF:")) return "show_if"
  if (trimmed.startsWith("COMPUTE:")) return "compute"
  if (trimmed.startsWith("BLOCK:")) return "block"
  if (trimmed.startsWith("TOTAL_LABEL:")) return "total_label"
  if (trimmed.startsWith("SUBTOTAL_LABEL:")) return "subtotal_label"
  if (trimmed.startsWith("PREFIX:")) return "prefix"
  if (trimmed.startsWith("SUFFIX:")) return "suffix"

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

const parseSection = (line: string): SectionData => ({
  title: line.trim().substring(3).trim(),
})

const parseQuestion = (line: string, questionCounter: number): QuestionData => {
  const trimmed = line.trim()
  const numberedMatch = trimmed.match(/^(Q\d+):/)
  const unnumberedMatch = trimmed.match(/^Q:/)
  
  if (numberedMatch) {
    return {
      id: numberedMatch[1],
      text: trimmed.substring(trimmed.indexOf(":") + 1).trim(),
    }
  } else if (unnumberedMatch) {
    return {
      id: `Q${questionCounter}`,
      text: trimmed.substring(2).trim(),
    }
  }
  
  // Fallback (shouldn't happen with proper classification)
  return {
    id: `Q${questionCounter}`,
    text: trimmed.substring(trimmed.indexOf(":") + 1).trim(),
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

const parseOption = (line: string): OptionData => {
  const trimmed = line.trim()
  const oldFormatMatch = trimmed.match(/^-\s*[A-Z]\)\s*(.+)/)

  if (oldFormatMatch) {
    return { text: oldFormatMatch[1] }
  }

  const optionText = trimmed.substring(1).trim()
  return { text: optionText }
}

const parseOptionHint = (line: string): OptionHintData => {
  const trimmed = line.trim()
  return {
    hint: trimmed.substring(5).trim(), // Remove "HINT:" prefix
  }
}

const parseMatrixRow = (line: string, _questionCounter: number): MatrixRowData => { // eslint-disable-line @typescript-eslint/no-unused-vars
  const trimmed = line.trim()
  // Remove "- Q:" prefix
  const text = trimmed.replace(/^-\s*Q:\s*/, '').trim()
  // Generate a unique ID for the matrix row based on the text
  const id = text.toLowerCase().replace(/[^a-z0-9]/g, '_')
  return { id, text }
}

const parseMatrixRowVariable = (line: string): MatrixRowVariableData => {
  const trimmed = line.trim()
  return {
    variable: trimmed.substring(9).trim(), // Remove "VARIABLE:" prefix
  }
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
    default:
      return { type: "multiple_choice" }
  }
}

const parseVariable = (line: string): VariableData => ({
  variable: line.trim().substring(9).trim(),
})

const parseShowIf = (line: string): ShowIfData => ({
  showIf: line.trim().substring(8).trim(),
})

const parseOptionShowIf = (line: string): OptionShowIfData => {
  const trimmed = line.trim()
  // Remove "- SHOW_IF:" prefix and any leading whitespace
  const conditionText = trimmed.replace(/^-\s*SHOW_IF:\s*/, '')
  return { showIf: conditionText }
}

const parseOptionOtherText = (): OptionOtherTextData => ({
  allowsOtherText: true,
})

const parseContent = (line: string): ContentData => ({
  content: line,
})

const parseBlock = (line: string): BlockData => {
  const trimmed = line.trim()
  const name = trimmed.substring(6).trim() // Remove "BLOCK:" prefix
  return { name }
}

const parseTotalLabel = (line: string): TotalLabelData => {
  const trimmed = line.trim()
  const totalLabel = trimmed.substring(12).trim() // Remove "TOTAL_LABEL:" prefix
  return { totalLabel }
}

const parseSubtotalLabel = (line: string): SubtotalLabelData => {
  const trimmed = line.trim()
  const subtotalLabel = trimmed.substring(15).trim() // Remove "SUBTOTAL_LABEL:" prefix
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
    case "section":
      return { type, raw: line, data: parseSection(line) }
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
    case "matrix_row":
      return { type, raw: line, data: parseMatrixRow(line, state.questionCounter) }
    case "matrix_row_variable":
      return { type, raw: line, data: parseMatrixRowVariable(line) }
    case "input_type":
      return { type, raw: line, data: parseInputType(line) }
    case "variable":
      return { type, raw: line, data: parseVariable(line) }
    case "show_if":
      return { type, raw: line, data: parseShowIf(line) }
    case "content":
      return { type, raw: line, data: parseContent(line) }
    case "compute":
      return { type, raw: line, data: parseCompute(line) }
    case "block":
      return { type, raw: line, data: parseBlock(line) }
    case "total_label":
      return { type, raw: line, data: parseTotalLabel(line) }
    case "subtotal_label":
      return { type, raw: line, data: parseSubtotalLabel(line) }
    case "prefix":
      return { type, raw: line, data: parsePrefix(line) }
    case "suffix":
      return { type, raw: line, data: parseSuffix(line) }
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
  matrixRows: [],
})

const createBlock = (name: string): Block => ({
  name,
  showIf: undefined,
  pages: [],
  computedVariables: [],
})

const createPage = (title: string): Page => ({
  title,
  content: "",
  questions: [],
  sections: [],
  computedVariables: [],
})

const createSection = (title: string): Section => ({
  title,
  content: "",
  questions: [],
})

// Save current question to appropriate location
const saveCurrentQuestion = (state: ParserState): ParserState => {
  if (!state.currentQuestion) return state

  if (state.currentSection) {
    return {
      ...state,
      currentSection: {
        ...state.currentSection,
        questions: [
          ...state.currentSection.questions,
          state.currentQuestion,
        ],
      },
    }
  }

  if (state.currentPage) {
    return {
      ...state,
      currentPage: {
        ...state.currentPage,
        questions: [...state.currentPage.questions, state.currentQuestion],
      },
    }
  }

  return state
}

// Save current section to current page
const saveCurrentSection = (state: ParserState): ParserState => {
  if (!state.currentSection || !state.currentPage) return state

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

// Save current page to current block
const saveCurrentPage = (state: ParserState): ParserState => {
  if (!state.currentPage) return state

  // Normalize whitespace-only content to empty string
  const normalizedPage = {
    ...state.currentPage,
    content: state.currentPage.content.trim() === "" 
      ? "" 
      : state.currentPage.content
  }

  // If no current block, create a default one
  if (!state.currentBlock) {
    return {
      ...state,
      currentBlock: {
        name: "",
        showIf: undefined,
        pages: [normalizedPage],
        computedVariables: []
      }
    }
  }

  return {
    ...state,
    currentBlock: {
      ...state.currentBlock,
      pages: [...state.currentBlock.pages, normalizedPage],
    }
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
  }
}

const handlePage = (state: ParserState, data: PageData): ParserState => {
  // Save everything that's currently being built
  let newState = saveCurrentQuestion(state)
  newState = saveCurrentSection(newState)
  newState = saveCurrentPage(newState)

  // Start new page
  return {
    ...newState,
    currentPage: createPage(data.title),
    currentSection: null,
    currentQuestion: null,
  }
}

const handleSection = (
  state: ParserState,
  data: SectionData
): ParserState => {
  // Save current question and section
  let newState = saveCurrentQuestion(state)
  newState = saveCurrentSection(newState)

  // Start new section
  return {
    ...newState,
    currentSection: createSection(data.title),
    currentQuestion: null,
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
    newState = {
      ...newState,
      currentPage: createPage(""),
    }
  }

  // Start new question and increment counter
  return {
    ...newState,
    currentQuestion: createQuestion(data.id, data.text),
    questionCounter: state.questionCounter + 1,
    // Clear subtext buffer when starting new question
    subtextBuffer: null,
  }
}

const handleSubtext = (state: ParserState, data: SubtextData): ParserState => {
  if (!state.currentQuestion) return state

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
    // Clear subtext buffer when we encounter structured elements
    subtextBuffer: null,
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

const handleOptionHint = (state: ParserState, data: OptionHintData): ParserState => {
  if (!state.currentQuestion || state.currentQuestion.options.length === 0) return state

  // Apply the hint to the last option
  const lastOptionIndex = state.currentQuestion.options.length - 1
  const updatedOptions = [...state.currentQuestion.options]
  updatedOptions[lastOptionIndex] = {
    ...updatedOptions[lastOptionIndex],
    hint: data.hint
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

const handleMatrixRow = (state: ParserState, data: MatrixRowData): ParserState => {
  if (!state.currentQuestion) return state

  // Set question type to matrix when we encounter the first matrix row
  const updatedType = state.currentQuestion.matrixRows?.length === 0 ? "matrix" : state.currentQuestion.type

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      type: updatedType,
      matrixRows: [
        ...(state.currentQuestion.matrixRows || []),
        {
          id: data.id,
          text: data.text
        },
      ],
    },
    // Clear subtext buffer when we encounter structured elements
    subtextBuffer: null,
  }
}

const handleMatrixRowVariable = (state: ParserState, data: MatrixRowVariableData): ParserState => {
  if (!state.currentQuestion || !state.currentQuestion.matrixRows || state.currentQuestion.matrixRows.length === 0) return state

  // Apply the variable to the last matrix row
  const lastRowIndex = state.currentQuestion.matrixRows.length - 1
  const updatedRows = [...state.currentQuestion.matrixRows]
  updatedRows[lastRowIndex] = {
    ...updatedRows[lastRowIndex],
    variable: data.variable
  }

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      matrixRows: updatedRows,
    },
  }
}

const handleInputType = (
  state: ParserState,
  data: InputTypeData
): ParserState => {
  if (!state.currentQuestion) return state

  // For matrix questions, preserve the matrix type but store the input behavior
  const isMatrixQuestion = state.currentQuestion.matrixRows && state.currentQuestion.matrixRows.length > 0

  // Check if this is a number_list question (has options/rows and NUMBER input type)
  const isNumberListQuestion = data.type === "number" && state.currentQuestion.options.length > 0

  const questionType = isMatrixQuestion ? "matrix" : isNumberListQuestion ? "number_list" : data.type

  // Build updated question with proper typing
  const updatedQuestion: Question = {
    ...state.currentQuestion,
    type: questionType,
    // For matrix questions, number_list, and checkbox questions, preserve options
    options: (data.type === "checkbox" || isMatrixQuestion || isNumberListQuestion) ? state.currentQuestion.options : [],
  }

  // Only set inputType for matrix questions (not number_list)
  if (isMatrixQuestion && data.type !== "matrix" && !isNumberListQuestion) {
    // inputType is only for matrix questions and excludes "number_list"
    const validInputTypes: Array<"multiple_choice" | "checkbox" | "text" | "essay" | "number"> = ["multiple_choice", "checkbox", "text", "essay", "number"]
    if (validInputTypes.includes(data.type as any)) {
      updatedQuestion.inputType = data.type as "multiple_choice" | "checkbox" | "text" | "essay" | "number"
    }
  }

  return {
    ...state,
    currentQuestion: updatedQuestion,
    // Clear subtext buffer when we encounter structured elements
    subtextBuffer: null,
  }
}

const handleVariable = (
  state: ParserState,
  data: VariableData
): ParserState => {
  if (!state.currentQuestion) return state

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      variable: data.variable,
    },
    // Clear subtext buffer when we encounter structured elements
    subtextBuffer: null,
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

const handleContent = (
  state: ParserState,
  data: ContentData,
  originalLine: string
): ParserState => {
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
  
  // If we have a current question but no subtext buffer, append to question text
  if (state.currentQuestion) {
    return {
      ...state,
      currentQuestion: {
        ...state.currentQuestion,
        text: state.currentQuestion.text + "\n\n" + originalLine,
      },
    }
  }

  if (state.currentSection) {
    return {
      ...state,
      currentSection: {
        ...state.currentSection,
        content: state.currentSection.content
          ? state.currentSection.content + "\n" + originalLine
          : originalLine,
      },
    }
  }

  if (state.currentPage) {
    return {
      ...state,
      currentPage: {
        ...state.currentPage,
        content: state.currentPage.content
          ? state.currentPage.content + "\n" + originalLine
          : originalLine,
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

  // Get current ungrouped options (those in the options array but not in any group yet)
  const existingGroups = state.currentQuestion.optionGroups || []
  const groupedOptionsCount = existingGroups.reduce((sum, group) => sum + group.options.length, 0)
  const ungroupedOptions = state.currentQuestion.options.slice(groupedOptionsCount)

  // Create a new group with the ungrouped options
  const newGroup = {
    options: ungroupedOptions,
    subtotalLabel: data.subtotalLabel,
  }

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      optionGroups: [...existingGroups, newGroup],
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
    case "section":
      return handleSection(state, parsedLine.data)
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
    case "matrix_row":
      return handleMatrixRow(state, parsedLine.data)
    case "matrix_row_variable":
      return handleMatrixRowVariable(state, parsedLine.data)
    case "input_type":
      return handleInputType(state, parsedLine.data)
    case "variable":
      return handleVariable(state, parsedLine.data)
    case "show_if":
      return handleShowIf(state, parsedLine.data)
    case "content":
      return handleContent(state, parsedLine.data, parsedLine.raw)
    case "compute":
      return handleCompute(state, parsedLine.data)
    case "block":
      return handleBlock(state, parsedLine.data)
    case "total_label":
      return handleTotalLabel(state, parsedLine.data)
    case "subtotal_label":
      return handleSubtotalLabel(state, parsedLine.data)
    case "prefix":
      return handlePrefix(state, parsedLine.data)
    case "suffix":
      return handleSuffix(state, parsedLine.data)
    default:
      // Exhaustiveness check - TypeScript will error if we miss a case
      const _exhaustive: never = parsedLine
      throw new Error(`Unhandled line type: ${_exhaustive}`)
  }
}

// Validation functions

/**
 * Validates that all variable names are unique across the questionnaire
 * Throws an error if duplicate variable names are found
 * 
 * @param blocks - All parsed blocks to validate
 */
function validateVariableNames(blocks: Block[]): void {
  const variableNames = new Set<string>()
  const duplicates: string[] = []

  // Check all questions in all blocks/pages/sections
  for (const block of blocks) {
    for (const page of block.pages) {
      // Check page-level questions
      for (const question of page.questions) {
        if (question.variable) {
          if (variableNames.has(question.variable)) {
            duplicates.push(question.variable)
          } else {
            variableNames.add(question.variable)
          }
        }
      }
      
      // Check section questions
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
function validateConditionReferences(blocks: Block[]): void {
  // Collect all defined variable names
  const definedVariables = new Set<string>()
  for (const block of blocks) {
    for (const page of block.pages) {
      // Add page-level computed variables
      for (const computedVar of page.computedVariables) {
        definedVariables.add(computedVar.name)
      }
      
      // Add question variables
      for (const question of page.questions) {
        if (question.variable) {
          definedVariables.add(question.variable)
        }
        // Add matrix row variables
        if (question.matrixRows) {
          for (const row of question.matrixRows) {
            if (row.variable) {
              definedVariables.add(row.variable)
            }
          }
        }
      }

      // Add section question variables
      for (const section of page.sections) {
        for (const question of section.questions) {
          if (question.variable) {
            definedVariables.add(question.variable)
          }
          // Add matrix row variables
          if (question.matrixRows) {
            for (const row of question.matrixRows) {
              if (row.variable) {
                definedVariables.add(row.variable)
              }
            }
          }
        }
      }
    }
    
    // Add block-level computed variables
    for (const computedVar of block.computedVariables) {
      definedVariables.add(computedVar.name)
    }
  }

  // Check all condition references
  const errors: string[] = []
  
  for (const block of blocks) {
    // Check block SHOW_IF
    if (block.showIf) {
      const missingVars = findUndefinedVariables(block.showIf, definedVariables)
      if (missingVars.length > 0) {
        errors.push(`Block "${block.name}" SHOW_IF references undefined variables: ${missingVars.join(', ')}`)
      }
    }
    
    for (const page of block.pages) {
      // Check page SHOW_IF
      if (page.showIf) {
        const missingVars = findUndefinedVariables(page.showIf, definedVariables)
        if (missingVars.length > 0) {
          errors.push(`Page "${page.title}" SHOW_IF references undefined variables: ${missingVars.join(', ')}`)
        }
      }
      
      // Check question SHOW_IF
      for (const question of page.questions) {
        if (question.showIf) {
          const missingVars = findUndefinedVariables(question.showIf, definedVariables)
          if (missingVars.length > 0) {
            errors.push(`Question "${question.id}" SHOW_IF references undefined variables: ${missingVars.join(', ')}`)
          }
        }
        
        // Check option SHOW_IF
        for (const option of question.options) {
          if (option.showIf) {
            const missingVars = findUndefinedVariables(option.showIf, definedVariables)
            if (missingVars.length > 0) {
              errors.push(`Question "${question.id}" option "${option.label}" SHOW_IF references undefined variables: ${missingVars.join(', ')}`)
            }
          }
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
function validateComputedVariableReferences(blocks: Block[]): void {
  // Collect all defined variable names (including computed variables)
  const definedVariables = new Set<string>()
  for (const block of blocks) {
    // Add block-level computed variables first (they can reference each other)
    for (const computedVar of block.computedVariables) {
      definedVariables.add(computedVar.name)
    }
    
    for (const page of block.pages) {
      // Add page-level computed variables
      for (const computedVar of page.computedVariables) {
        definedVariables.add(computedVar.name)
      }
      
      // Add question variables
      for (const question of page.questions) {
        if (question.variable) {
          definedVariables.add(question.variable)
        }
        // Add matrix row variables
        if (question.matrixRows) {
          for (const row of question.matrixRows) {
            if (row.variable) {
              definedVariables.add(row.variable)
            }
          }
        }
      }

      // Add section question variables
      for (const section of page.sections) {
        for (const question of section.questions) {
          if (question.variable) {
            definedVariables.add(question.variable)
          }
          // Add matrix row variables
          if (question.matrixRows) {
            for (const row of question.matrixRows) {
              if (row.variable) {
                definedVariables.add(row.variable)
              }
            }
          }
        }
      }
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
    
    for (const page of block.pages) {
      for (const computedVar of page.computedVariables) {
        const missingVars = findUndefinedVariables(computedVar.expression, definedVariables)
        if (missingVars.length > 0) {
          errors.push(`Computed variable "${computedVar.name}" references undefined variables: ${missingVars.join(', ')}`)
        }
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
  
  // Normalize operators first (convert IS to ==, etc.)
  const normalizedExpression = normalizeOperators(expression)
  
  // Handle different types of expressions
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
  } else if (expression.includes(' AND ') || expression.includes(' OR ')) {
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
  
  return [...new Set(undefinedVars)] // Remove duplicates
}

/**
 * Checks if a string looks like a valid variable name (not a literal value)
 */
function isValidVariableName(str: string): boolean {
  // Variable names should match the pattern: letters/underscore, followed by letters/numbers/underscores
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(str)
}

// Main function

export const parseQuestionnaire = (text: string): Block[] => {
  try {
    const lines = text.split("\n")

    const initialState: ParserState = {
      blocks: [],
      currentBlock: null,
      currentPage: null,
      currentSection: null,
      currentQuestion: null,
      subtextBuffer: null,
      questionCounter: 1,
    }

    const finalState = lines.reduce((state, line) => {
      const parsedLine = parseLine(line, state)
      return reduceParsedLine(state, parsedLine)
    }, initialState)

    // Save any remaining work
    let result = saveCurrentQuestion(finalState)
    result = saveCurrentSection(result)
    result = saveCurrentPage(result)
    result = saveCurrentBlock(result)

    // Run validation checks
    validateVariableNames(result.blocks)
    validateConditionReferences(result.blocks)
    validateComputedVariableReferences(result.blocks)

    // If no blocks were defined, create a default block with all pages
    if (result.blocks.length === 0 && result.currentPage) {
      result = saveCurrentPage(result)
      result = {
        ...result,
        blocks: [{
          name: "",
          showIf: undefined,
          pages: result.currentPage ? [result.currentPage] : [],
          computedVariables: []
        }]
      }
    } else if (result.blocks.length === 0) {
      result = {
        ...result,
        blocks: [{
          name: "",
          showIf: undefined,
          pages: [],
          computedVariables: []
        }]
      }
    }

    return result.blocks
  } catch (err) {
    throw new Error(
      "Failed to parse questionnaire format: " + (err as Error).message
    )
  }
}
