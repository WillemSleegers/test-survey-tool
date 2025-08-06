import {
  Question,
  Section,
  SectionData,
  Subsection,
  SubsectionData,
  QuestionData,
  SubtextData,
  OptionData,
  OptionShowIfData,
  OptionOtherTextData,
  InputTypeData,
  VariableData,
  ShowIfData,
  ContentData,
  ComputeData,
  ParsedLine,
  ParserState,
} from "@/lib/types"

// Line classification functions

const classifyLine = (line: string, state: ParserState): ParsedLine["type"] => {
  const trimmed = line.trim()

  if (trimmed.startsWith("# ") || trimmed === "#") return "section"
  if (trimmed.startsWith("## ")) return "subsection"
  if (trimmed.match(/^Q\d+:/) || trimmed.match(/^Q:/)) return "question"
  if (trimmed.startsWith("HINT:")) return "subtext"
  if (trimmed.match(/^-\s*([A-Z]\))?(.+)/) || trimmed.match(/^-\s+(.+)/)) {
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

  return "content"
}

// Line parsing functions

const parseSection = (line: string): SectionData => {
  const trimmed = line.trim()
  if (trimmed === "#") {
    return { title: "" }
  }
  return { title: trimmed.substring(2).trim() }
}

const parseSubsection = (line: string): SubsectionData => ({
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

const parseOption = (line: string): OptionData => {
  const trimmed = line.trim()
  const oldFormatMatch = trimmed.match(/^-\s*[A-Z]\)\s*(.+)/)

  if (oldFormatMatch) {
    return { text: oldFormatMatch[1] }
  }

  const optionText = trimmed.substring(1).trim()
  return { text: optionText }
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
    case "section":
      return { type, raw: line, data: parseSection(line) }
    case "subsection":
      return { type, raw: line, data: parseSubsection(line) }
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
})

const createSection = (title: string): Section => ({
  title,
  content: "",
  questions: [],
  subsections: [],
  computedVariables: [],
})

const createSubsection = (title: string): Subsection => ({
  title,
  content: "",
  questions: [],
})

// Save current question to appropriate location
const saveCurrentQuestion = (state: ParserState): ParserState => {
  if (!state.currentQuestion) return state

  if (state.currentSubsection) {
    return {
      ...state,
      currentSubsection: {
        ...state.currentSubsection,
        questions: [
          ...state.currentSubsection.questions,
          state.currentQuestion,
        ],
      },
    }
  }

  if (state.currentSection) {
    return {
      ...state,
      currentSection: {
        ...state.currentSection,
        questions: [...state.currentSection.questions, state.currentQuestion],
      },
    }
  }

  return state
}

// Save current subsection to current section
const saveCurrentSubsection = (state: ParserState): ParserState => {
  if (!state.currentSubsection || !state.currentSection) return state

  // Normalize whitespace-only content to empty string
  const normalizedSubsection = {
    ...state.currentSubsection,
    content: state.currentSubsection.content.trim() === "" 
      ? "" 
      : state.currentSubsection.content
  }

  return {
    ...state,
    currentSection: {
      ...state.currentSection,
      subsections: [
        ...state.currentSection.subsections,
        normalizedSubsection,
      ],
    },
  }
}

// Save current section to sections array
const saveCurrentSection = (state: ParserState): ParserState => {
  if (!state.currentSection) return state

  // Normalize whitespace-only content to empty string
  const normalizedSection = {
    ...state.currentSection,
    content: state.currentSection.content.trim() === "" 
      ? "" 
      : state.currentSection.content
  }

  return {
    ...state,
    sections: [...state.sections, normalizedSection],
  }
}

// State reducers for each line type

const handleSection = (state: ParserState, data: SectionData): ParserState => {
  // Save everything that's currently being built
  let newState = saveCurrentQuestion(state)
  newState = saveCurrentSubsection(newState)
  newState = saveCurrentSection(newState)

  // Start new section
  return {
    ...newState,
    currentSection: createSection(data.title),
    currentSubsection: null,
    currentQuestion: null,
  }
}

const handleSubsection = (
  state: ParserState,
  data: SubsectionData
): ParserState => {
  // Save current question and subsection
  let newState = saveCurrentQuestion(state)
  newState = saveCurrentSubsection(newState)

  // Start new subsection
  return {
    ...newState,
    currentSubsection: createSubsection(data.title),
    currentQuestion: null,
  }
}

const handleQuestion = (
  state: ParserState,
  data: QuestionData
): ParserState => {
  // Save current question
  const newState = saveCurrentQuestion(state)

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

const handleInputType = (
  state: ParserState,
  data: InputTypeData
): ParserState => {
  if (!state.currentQuestion) return state

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      type: data.type,
      options: data.type === "checkbox" ? state.currentQuestion.options : [],
    },
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

  if (state.currentSection) {
    return {
      ...state,
      currentSection: {
        ...state.currentSection,
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
  
  // If we have a current question but no subtext buffer, ignore content
  if (state.currentQuestion) return state

  if (state.currentSubsection) {
    return {
      ...state,
      currentSubsection: {
        ...state.currentSubsection,
        content: state.currentSubsection.content
          ? state.currentSubsection.content + "\n" + originalLine
          : originalLine,
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

  return state
}

const handleCompute = (state: ParserState, data: ComputeData): ParserState => {
  if (!state.currentSection) return state

  return {
    ...state,
    currentSection: {
      ...state.currentSection,
      computedVariables: [
        ...state.currentSection.computedVariables,
        { name: data.name, expression: data.expression },
      ],
    },
  }
}

// Main state reducer

const reduceParsedLine = (
  state: ParserState,
  parsedLine: ParsedLine
): ParserState => {
  switch (parsedLine.type) {
    case "section":
      return handleSection(state, parsedLine.data)
    case "subsection":
      return handleSubsection(state, parsedLine.data)
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
    default:
      // Exhaustiveness check - TypeScript will error if we miss a case
      const _exhaustive: never = parsedLine
      throw new Error(`Unhandled line type: ${_exhaustive}`)
  }
}

// Main function

export const parseQuestionnaire = (text: string): Section[] => {
  try {
    const lines = text.split("\n")

    const initialState: ParserState = {
      sections: [],
      currentSection: null,
      currentSubsection: null,
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
    result = saveCurrentSubsection(result)
    result = saveCurrentSection(result)

    return result.sections
  } catch (err) {
    throw new Error(
      "Failed to parse questionnaire format: " + (err as Error).message
    )
  }
}
