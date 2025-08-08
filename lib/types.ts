export type Option = {
  value: string
  label: string
  showIf?: string
  allowsOtherText?: boolean
}

export type Question = {
  id: string
  text: string
  subtext?: string
  type: "multiple_choice" | "checkbox" | "text" | "essay" | "number"
  options: Option[]
  variable?: string
  showIf?: string
  sectionTitle?: string
  sectionContent?: string
}

export type Section = {
  title: string
  content: string
  questions: Question[]
}

export type ComputedVariable = {
  name: string
  expression: string
  value?: boolean | string | number
}

export type Block = {
  name: string
  showIf?: string
  pages: Page[]
  computedVariables: ComputedVariable[]
}

export type Page = {
  title: string
  content: string
  questions: Question[]
  sections: Section[]
  showIf?: string
  computedVariables: ComputedVariable[]
}

export type Response = {
  value: string | string[] | boolean | number
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

export type VisibleSection = {
  title: string
  content: string
  questions: Question[]
}

export type VisiblePageContent = {
  mainQuestions: Question[]
  sections: VisibleSection[]
}

// Parser-specific types with proper discriminated unions
export type PageData = { title: string }
export type SectionData = { title: string }
export type QuestionData = { id: string; text: string }
export type SubtextData = { subtext: string }
export type OptionData = { text: string; showIf?: string }
export type OptionShowIfData = { showIf: string }
export type OptionOtherTextData = { allowsOtherText: true }
export type InputTypeData = { type: Question["type"] }
export type VariableData = { variable: string }
export type ShowIfData = { showIf: string }
export type ContentData = { content: string }
export type ComputeData = { name: string; expression: string }
export type BlockData = { name: string }

export type ParsedLine =
  | { type: "page"; raw: string; data: PageData }
  | { type: "section"; raw: string; data: SectionData }
  | { type: "question"; raw: string; data: QuestionData }
  | { type: "subtext"; raw: string; data: SubtextData }
  | { type: "option"; raw: string; data: OptionData }
  | { type: "option_show_if"; raw: string; data: OptionShowIfData }
  | { type: "option_other_text"; raw: string; data: OptionOtherTextData }
  | { type: "input_type"; raw: string; data: InputTypeData }
  | { type: "variable"; raw: string; data: VariableData }
  | { type: "show_if"; raw: string; data: ShowIfData }
  | { type: "content"; raw: string; data: ContentData }
  | { type: "compute"; raw: string; data: ComputeData }
  | { type: "block"; raw: string; data: BlockData }

export type ParserState = {
  blocks: Block[]
  currentBlock: Block | null
  currentPage: Page | null
  currentSection: Section | null
  currentQuestion: Question | null
  subtextBuffer: string[] | null
  questionCounter: number
}
