import {
  Question,
  Section,
  SectionData,
  Subsection,
  SubsectionData,
} from "@/lib/types"

// Types for parsing
type QuestionData = { id: string; text: string }
type SubtextData = { subtext: string }
type OptionData = { text: string }
type InputTypeData = { type: Question["type"] }
type VariableData = { variable: string }
type ShowIfData = { showIf: string }
type ContentData = { content: string }

type ParsedLine =
  | { type: "section"; raw: string; data: SectionData }
  | { type: "subsection"; raw: string; data: SubsectionData }
  | { type: "question"; raw: string; data: QuestionData }
  | { type: "subtext"; raw: string; data: SubtextData }
  | { type: "option"; raw: string; data: OptionData }
  | { type: "input_type"; raw: string; data: InputTypeData }
  | { type: "variable"; raw: string; data: VariableData }
  | { type: "show_if"; raw: string; data: ShowIfData }
  | { type: "content"; raw: string; data: ContentData }

type ParserState = {
  sections: Section[]
  currentSection: Section | null
  currentSubsection: Subsection | null
  currentQuestion: Question | null
}

// Line classification functions

const classifyLine = (line: string): ParsedLine["type"] => {
  const trimmed = line.trim()

  if (trimmed.startsWith("# ") || trimmed === "#") return "section"
  if (trimmed.startsWith("## ")) return "subsection"
  if (trimmed.match(/^Q\d+:/)) return "question"
  if (trimmed.match(/^<.*>$/)) return "subtext"
  if (trimmed.match(/^-\s*([A-Z]\))?(.+)/) || trimmed.match(/^-\s+(.+)/))
    return "option"
  if (["TEXT", "NUMBER", "CHECKBOX"].includes(trimmed)) return "input_type"
  if (trimmed.startsWith("VARIABLE:")) return "variable"
  if (trimmed.startsWith("SHOW_IF:")) return "show_if"

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

const parseQuestion = (line: string): QuestionData => {
  const trimmed = line.trim()
  const idMatch = trimmed.match(/^(Q\d+):/)
  return {
    id: idMatch ? idMatch[1] : "Q0",
    text: trimmed.substring(trimmed.indexOf(":") + 1).trim(),
  }
}

const parseSubtext = (line: string): SubtextData => {
  const trimmed = line.trim()
  const match = trimmed.match(/^<(.*)>$/) // Extract text between < and >
  return {
    subtext: match ? match[1].trim() : trimmed,
  }
}

const parseOption = (line: string): OptionData => {
  const trimmed = line.trim()
  const oldFormatMatch = trimmed.match(/^-\s*[A-Z]\)\s*(.+)/)

  if (oldFormatMatch) {
    return { text: oldFormatMatch[1] }
  }

  return { text: trimmed.substring(1).trim() }
}

const parseInputType = (line: string): InputTypeData => {
  const trimmed = line.trim()
  switch (trimmed) {
    case "TEXT":
      return { type: "text" }
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

const parseContent = (line: string): ContentData => ({
  content: line,
})

// Line processing functions

const parseLine = (line: string): ParsedLine => {
  const type = classifyLine(line)

  switch (type) {
    case "section":
      return { type, raw: line, data: parseSection(line) }
    case "subsection":
      return { type, raw: line, data: parseSubsection(line) }
    case "question":
      return { type, raw: line, data: parseQuestion(line) }
    case "subtext":
      return { type, raw: line, data: parseSubtext(line) }
    case "option":
      return { type, raw: line, data: parseOption(line) }
    case "input_type":
      return { type, raw: line, data: parseInputType(line) }
    case "variable":
      return { type, raw: line, data: parseVariable(line) }
    case "show_if":
      return { type, raw: line, data: parseShowIf(line) }
    case "content":
      return { type, raw: line, data: parseContent(line) }
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

  return {
    ...state,
    currentSection: {
      ...state.currentSection,
      subsections: [
        ...state.currentSection.subsections,
        state.currentSubsection,
      ],
    },
  }
}

// Save current section to sections array
const saveCurrentSection = (state: ParserState): ParserState => {
  if (!state.currentSection) return state

  return {
    ...state,
    sections: [...state.sections, state.currentSection],
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

  // Start new question
  return {
    ...newState,
    currentQuestion: createQuestion(data.id, data.text),
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
        { value: data.text, label: data.text },
      ],
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
  }
}

const handleShowIf = (state: ParserState, data: ShowIfData): ParserState => {
  if (!state.currentQuestion) return state

  return {
    ...state,
    currentQuestion: {
      ...state.currentQuestion,
      showIf: data.showIf,
    },
  }
}

const handleContent = (
  state: ParserState,
  data: ContentData,
  originalLine: string
): ParserState => {
  // Don't add content if we're in a question context
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
    case "input_type":
      return handleInputType(state, parsedLine.data)
    case "variable":
      return handleVariable(state, parsedLine.data)
    case "show_if":
      return handleShowIf(state, parsedLine.data)
    case "content":
      return handleContent(state, parsedLine.data, parsedLine.raw)
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

    // Parse all lines into structured data
    const parsedLines = lines.map(parseLine)

    // Process lines through state reducer
    const finalState = parsedLines.reduce(reduceParsedLine, {
      sections: [],
      currentSection: null,
      currentSubsection: null,
      currentQuestion: null,
    })

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
