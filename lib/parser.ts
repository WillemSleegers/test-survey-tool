import {
  Question,
  Page,
  Block,
  PageData,
  Section,
  QuestionData,
  SubtextData,
  OptionData,
  OptionShowIfData,
  OptionOtherTextData,
  SubquestionData,
  InputTypeData,
  VariableData,
  ShowIfData,
  ContentData,
  ComputeData,
  BlockData,
  ParsedLine,
  ParserState,
} from "@/lib/types"
import { normalizeOperators } from "@/lib/conditions/condition-parser"

// Line classification functions

const classifyLine = (line: string, state: ParserState): ParsedLine["type"] => {
  const trimmed = line.trim()

  if (trimmed.startsWith("# ") || trimmed === "#") return "page"
  if (trimmed.match(/^Q:/)) return "question"
  if (trimmed.startsWith("HINT:")) return "subtext"
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
  if (trimmed.startsWith("VARIABLE:")) return "variable"
  if (trimmed.startsWith("SHOW_IF:")) return "show_if"
  if (trimmed.startsWith("COMPUTE:")) return "compute"
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
  const existingSubquestionCount = state.currentQuestion?.subquestions?.length || 0
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
    case "option":
      return { type, raw: line, data: parseOption(line) }
    case "option_show_if":
      return { type, raw: line, data: parseOptionShowIf(line) }
    case "option_other_text":
      return { type, raw: line, data: parseOptionOtherText() }
    case "matrix_row":
      return { type, raw: line, data: parseSubquestion(line, state) }
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

// Save current page to current block
const saveCurrentPage = (state: ParserState): ParserState => {
  if (!state.currentPage) return state

  // Pages no longer have content, so just use the current page as is
  const normalizedPage = state.currentPage

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
    currentSubquestion: null,
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
    // Clear subtext buffer when starting new question
    subtextBuffer: null,
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
    // Clear subtext buffer when we encounter structured elements
    subtextBuffer: null,
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

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      type: questionType,
      // Store the actual input type for matrix questions to know if it should be radio or checkbox
      ...(isMatrixQuestion && data.type !== "matrix" && { inputType: data.type }),
      // For matrix questions, always preserve options. For regular checkbox questions, preserve options too.
      options: (data.type === "checkbox" || isMatrixQuestion) ? state.currentQuestion.options : [],
    },
    // Clear subtext buffer when we encounter structured elements
    subtextBuffer: null,
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
      // Clear subtext buffer when we encounter structured elements
      subtextBuffer: null,
    }
  }

  // Otherwise, assign to the question itself
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
  _data: ContentData,
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
    case "option":
      return handleOption(state, parsedLine.data)
    case "option_show_if":
      return handleOptionShowIf(state, parsedLine.data)
    case "option_other_text":
      return handleOptionOtherText(state, parsedLine.data)
    case "matrix_row":
      return handleSubquestion(state, parsedLine.data)
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
      
      // Add section question variables
      for (const section of page.sections) {
        for (const question of section.questions) {
          if (question.variable) {
            definedVariables.add(question.variable)
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
  // Collect all defined variable names (both question variables and computed variables)
  const definedVariables = new Set<string>()

  for (const block of blocks) {
    for (const page of block.pages) {
      // Add section question variables first
      for (const section of page.sections) {
        for (const question of section.questions) {
          if (question.variable) {
            definedVariables.add(question.variable)
          }
          // Add subquestion variables
          if (question.subquestions) {
            for (const subquestion of question.subquestions) {
              if (subquestion.variable) {
                definedVariables.add(subquestion.variable)
              }
            }
          }
        }
      }

      // Then add page-level computed variables (they can reference question variables from same page)
      for (const computedVar of page.computedVariables) {
        definedVariables.add(computedVar.name)
      }
    }

    // Finally add block-level computed variables (they can reference everything)
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
      currentSubquestion: null,
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
