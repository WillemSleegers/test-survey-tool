export type Option = {
  value: string
  label: string
}

export type Question = {
  id: string
  text: string
  subtext?: string
  type: "multiple_choice" | "checkbox" | "text" | "number"
  options: Option[]
  variable?: string
  showIf?: string
  subsectionTitle?: string
  subsectionContent?: string
}

export type Subsection = {
  title: string
  content: string
  questions: Question[]
}

export type ComputedVariable = {
  name: string
  expression: string
  value?: boolean | string | number
}

export type Section = {
  title: string
  content: string
  questions: Question[]
  subsections: Subsection[]
  showIf?: string
  computedVariables: ComputedVariable[]
}

export type Response = {
  value: string | string[]
  variable?: string
}

export type Responses = {
  [questionId: string]: Response
}

export type ComputedVariables = {
  [variableName: string]: boolean | string | number
}

export type ConditionalPlaceholder = {
  condition: string
  trueText: string
  falseText: string
}

export type VisibleSubsection = {
  title: string
  content: string
  questions: Question[]
}

export type VisibleSectionContent = {
  mainQuestions: Question[]
  subsections: VisibleSubsection[]
}

// Parser-specific types with proper discriminated unions
export type SectionData = { title: string }
export type SubsectionData = { title: string }
export type QuestionData = { id: string; text: string }
export type SubtextData = { subtext: string }
export type OptionData = { text: string }
export type InputTypeData = { type: Question["type"] }
export type VariableData = { variable: string }
export type ShowIfData = { showIf: string }
export type ContentData = { content: string }
export type ComputeData = { name: string; expression: string }

export type ParsedLine =
  | { type: "section"; raw: string; data: SectionData }
  | { type: "subsection"; raw: string; data: SubsectionData }
  | { type: "question"; raw: string; data: QuestionData }
  | { type: "subtext"; raw: string; data: SubtextData }
  | { type: "option"; raw: string; data: OptionData }
  | { type: "input_type"; raw: string; data: InputTypeData }
  | { type: "variable"; raw: string; data: VariableData }
  | { type: "show_if"; raw: string; data: ShowIfData }
  | { type: "content"; raw: string; data: ContentData }
  | { type: "compute"; raw: string; data: ComputeData }

export type ParserState = {
  sections: Section[]
  currentSection: Section | null
  currentSubsection: Subsection | null
  currentQuestion: Question | null
  subtextBuffer: string[] | null
}
