

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
  tooltip?: string
  type: "multiple_choice" | "checkbox" | "text" | "essay" | "number" | "matrix" | "breakdown"
  options: Option[]
  optionGroups?: OptionGroup[]
  subquestions?: Subquestion[]
  inputType?: "multiple_choice" | "checkbox" | "text" | "essay" | "number"
  variable?: string
  showIf?: string
  totalLabel?: string
  prefix?: string
  suffix?: string
}

export type Subquestion = {
  id: string
  text: string
  subtext?: string
  tooltip?: string
  variable?: string
  subtract?: boolean
  subtotalLabel?: string
  value?: string
}


export type Option = {
  value: string
  label: string
  hint?: string
  tooltip?: string
  showIf?: string
  allowsOtherText?: boolean
  subquestions?: Subquestion[]
}

export type OptionGroup = {
  label?: string
  options: Option[]
  subtotalLabel?: string
}


export type Variables = {
  [variableName: string]: string | string[] | number | boolean | Record<string, string>
}

export type Responses = {
  [questionId: string]: string | string[] | number | boolean | Record<string, string>
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
export type TooltipData = { tooltip: string }
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
export type SubquestionSubtractData = { subtract: true }
export type SubquestionValueData = { value: string }
export type TotalLabelData = { totalLabel: string }
export type SubtotalLabelData = { subtotalLabel: string }
export type PrefixData = { prefix: string }
export type SuffixData = { suffix: string }

export type ParsedLine =
  | { type: "page"; raw: string; data: PageData }
  | { type: "question"; raw: string; data: QuestionData }
  | { type: "subtext"; raw: string; data: SubtextData }
  | { type: "tooltip"; raw: string; data: TooltipData }
  | { type: "option"; raw: string; data: OptionData }
  | { type: "option_show_if"; raw: string; data: OptionShowIfData }
  | { type: "option_other_text"; raw: string; data: OptionOtherTextData }
  | { type: "option_hint"; raw: string; data: SubtextData }
  | { type: "option_tooltip"; raw: string; data: TooltipData }
  | { type: "subquestion_hint"; raw: string; data: SubtextData }
  | { type: "subquestion_tooltip"; raw: string; data: TooltipData }
  | { type: "subquestion_subtract"; raw: string; data: SubquestionSubtractData }
  | { type: "subquestion_value"; raw: string; data: SubquestionValueData }
  | { type: "matrix_row"; raw: string; data: SubquestionData }
  | { type: "input_type"; raw: string; data: InputTypeData }
  | { type: "variable"; raw: string; data: VariableData }
  | { type: "show_if"; raw: string; data: ShowIfData }
  | { type: "total_label"; raw: string; data: TotalLabelData }
  | { type: "subtotal_label"; raw: string; data: SubtotalLabelData }
  | { type: "prefix"; raw: string; data: PrefixData }
  | { type: "suffix"; raw: string; data: SuffixData }
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
  tooltipBuffer: string[] | null
  subquestionSubtextBuffer: string[] | null
  subquestionTooltipBuffer: string[] | null
  questionCounter: number
}
