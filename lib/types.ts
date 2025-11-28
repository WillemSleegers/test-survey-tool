export type Option = {
  value: string
  label: string
  hint?: string
  showIf?: string
  allowsOtherText?: boolean
}

export type OptionGroup = {
  label?: string
  options: Option[]
  subtotalLabel?: string
}

export type MatrixRow = {
  id: string
  text: string
  variable?: string
}

export type Question = {
  id: string
  text: string
  subtext?: string
  tooltip?: string
  type: "multiple_choice" | "checkbox" | "text" | "essay" | "number" | "matrix" | "number_list"
  options: Option[]
  optionGroups?: OptionGroup[]
  matrixRows?: MatrixRow[]
  inputType?: "multiple_choice" | "checkbox" | "text" | "essay" | "number"
  totalLabel?: string
  prefix?: string
  suffix?: string
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
  value: string | string[] | boolean | number | Record<string, string | string[]>
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
export type OptionHintData = { hint: string }
export type InputTypeData = { type: Question["type"] }
export type VariableData = { variable: string }
export type ShowIfData = { showIf: string }
export type ContentData = { content: string }
export type ComputeData = { name: string; expression: string }
export type BlockData = { name: string }
export type TotalLabelData = { totalLabel: string }
export type SubtotalLabelData = { subtotalLabel: string }
export type PrefixData = { prefix: string }
export type SuffixData = { suffix: string }
export type TooltipData = { tooltip: string }
export type MatrixRowVariableData = { variable: string }

export type MatrixRowData = { id: string; text: string }

export type ParsedLine =
  | { type: "page"; raw: string; data: PageData }
  | { type: "section"; raw: string; data: SectionData }
  | { type: "question"; raw: string; data: QuestionData }
  | { type: "subtext"; raw: string; data: SubtextData }
  | { type: "tooltip"; raw: string; data: TooltipData }
  | { type: "option"; raw: string; data: OptionData }
  | { type: "option_show_if"; raw: string; data: OptionShowIfData }
  | { type: "option_other_text"; raw: string; data: OptionOtherTextData }
  | { type: "option_hint"; raw: string; data: OptionHintData }
  | { type: "matrix_row"; raw: string; data: MatrixRowData }
  | { type: "matrix_row_variable"; raw: string; data: MatrixRowVariableData }
  | { type: "input_type"; raw: string; data: InputTypeData }
  | { type: "variable"; raw: string; data: VariableData }
  | { type: "show_if"; raw: string; data: ShowIfData }
  | { type: "content"; raw: string; data: ContentData }
  | { type: "compute"; raw: string; data: ComputeData }
  | { type: "block"; raw: string; data: BlockData }
  | { type: "total_label"; raw: string; data: TotalLabelData }
  | { type: "subtotal_label"; raw: string; data: SubtotalLabelData }
  | { type: "prefix"; raw: string; data: PrefixData }
  | { type: "suffix"; raw: string; data: SuffixData }

export type ParserState = {
  blocks: Block[]
  currentBlock: Block | null
  currentPage: Page | null
  currentSection: Section | null
  currentQuestion: Question | null
  subtextBuffer: string[] | null
  questionCounter: number
}
