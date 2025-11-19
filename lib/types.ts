

export type Block = {
  name: string
  showIf?: string
  pages: Page[]
  computedVariables: ComputedVariable[]
}

export type NavItem = {
  name: string
  level: number
  pages: Page[]
}

export type Page = {
  title: string
  sections: Section[]
  showIf?: string
  computedVariables: ComputedVariable[]
}

export type Section = {
  content: string
  questions: Question[]
}

export type Question = {
  id: string
  text: string
  subtext?: string
  type: "multiple_choice" | "checkbox" | "text" | "essay" | "number" | "matrix"
  options: Option[]
  subquestions?: Subquestion[]
  inputType?: "multiple_choice" | "checkbox" | "text" | "essay" | "number"
  variable?: string
  showIf?: string
  totalLabel?: string
}

export type Subquestion = {
  id: string
  text: string
  subtext?: string
  variable?: string
}


export type Option = {
  value: string
  label: string
  showIf?: string
  allowsOtherText?: boolean
}


export type Variables = {
  [variableName: string]: string | string[] | number | boolean
}

export type Responses = {
  [questionId: string]: string | string[] | number | boolean
}

export type ComputedVariable = {
  name: string
  expression: string
  value?: boolean | string | number
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
  content: string
  questions: Question[]
}

export type VisiblePageContent = {
  sections: VisibleSection[]
}

// Parser-specific types with proper discriminated unions
export type PageData = { title: string }
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
export type NavItemData = { name: string }
export type NavLevelData = { level: number }

export type SubquestionData = { id: string; text: string }
export type TotalLabelData = { totalLabel: string }

export type ParsedLine =
  | { type: "page"; raw: string; data: PageData }
  | { type: "question"; raw: string; data: QuestionData }
  | { type: "subtext"; raw: string; data: SubtextData }
  | { type: "option"; raw: string; data: OptionData }
  | { type: "option_show_if"; raw: string; data: OptionShowIfData }
  | { type: "option_other_text"; raw: string; data: OptionOtherTextData }
  | { type: "matrix_row"; raw: string; data: SubquestionData }
  | { type: "input_type"; raw: string; data: InputTypeData }
  | { type: "variable"; raw: string; data: VariableData }
  | { type: "show_if"; raw: string; data: ShowIfData }
  | { type: "total_label"; raw: string; data: TotalLabelData }
  | { type: "content"; raw: string; data: ContentData }
  | { type: "compute"; raw: string; data: ComputeData }
  | { type: "block"; raw: string; data: BlockData }
  | { type: "nav_item"; raw: string; data: NavItemData }
  | { type: "nav_level"; raw: string; data: NavLevelData }

export type ParserState = {
  blocks: Block[]
  navItems: NavItem[]
  currentBlock: Block | null
  currentNavItem: NavItem | null
  currentNavLevel: number
  currentPage: Page | null
  currentSection: Section | null
  currentQuestion: Question | null
  currentSubquestion: Subquestion | null
  subtextBuffer: string[] | null
  questionCounter: number
}
