

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
  tooltip?: string
  sections: Section[]
  showIf?: string
  computedVariables: ComputedVariable[]
}

export type Section = {
  content: string
  tooltip?: string
  questions: Question[]
}

// Base fields common to all questions
type QuestionBase = {
  id: string
  text: string
  subtext?: string
  tooltip?: string
  variable?: string
  showIf?: string
}

export type MultipleChoiceQuestion = QuestionBase & {
  type: "multiple_choice"
  options: Option[]
}

export type CheckboxQuestion = QuestionBase & {
  type: "checkbox"
  options: Option[]
}

export type TextQuestion = QuestionBase & {
  type: "text"
}

export type EssayQuestion = QuestionBase & {
  type: "essay"
}

export type NumberQuestion = QuestionBase & {
  type: "number"
  prefix?: string
  suffix?: string
}

export type MatrixQuestion = QuestionBase & {
  type: "matrix"
  subquestions: Subquestion[]
  options: Option[]
  inputType?: "checkbox" | "text" | "essay"
}

export type BreakdownOption = Omit<Option, 'subquestions' | 'allowsOtherText'>

export type BreakdownQuestion = QuestionBase & {
  type: "breakdown"
  options: BreakdownOption[]
  totalLabel?: string
  totalColumn?: number
  prefix?: string
  suffix?: string
}

export type Question =
  | MultipleChoiceQuestion
  | CheckboxQuestion
  | TextQuestion
  | EssayQuestion
  | NumberQuestion
  | MatrixQuestion
  | BreakdownQuestion

// Internal parser type that allows all field combinations during parsing
// This gets converted to the proper discriminated Question type after parsing is complete
export type ParsedQuestion = {
  id: string
  text: string
  subtext?: string
  tooltip?: string
  type: "multiple_choice" | "checkbox" | "text" | "essay" | "number" | "matrix" | "breakdown"
  options: Option[]
  subquestions?: Subquestion[]
  inputType?: "checkbox" | "text" | "essay"
  variable?: string
  showIf?: string
  totalLabel?: string
  totalColumn?: number
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
  subtract?: boolean
  prefillValue?: string
  variable?: string
  column?: number
  exclude?: boolean
  header?: boolean
  subtotalLabel?: string
  separator?: boolean
  custom?: string
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
  tooltip?: string
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
export type OptionSubtractData = { subtract: true }
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
export type TotalColumnData = { totalColumn: number }
export type SubtotalLabelData = { subtotalLabel: string }
export type PrefixData = { prefix: string }
export type SuffixData = { suffix: string }
export type ColumnData = { column: number }
export type OptionExcludeData = { exclude: true }
export type OptionHeaderData = { label: string }
export type OptionSeparatorData = { separator: true }
export type CustomData = { custom: string }

export type ParsedLine =
  | { type: "page"; raw: string; data: PageData }
  | { type: "question"; raw: string; data: QuestionData }
  | { type: "subtext"; raw: string; data: SubtextData }
  | { type: "tooltip"; raw: string; data: TooltipData }
  | { type: "option"; raw: string; data: OptionData }
  | { type: "option_show_if"; raw: string; data: OptionShowIfData }
  | { type: "option_other_text"; raw: string; data: OptionOtherTextData }
  | { type: "option_subtract"; raw: string; data: OptionSubtractData }
  | { type: "option_hint"; raw: string; data: SubtextData }
  | { type: "option_tooltip"; raw: string; data: TooltipData }
  | { type: "option_value"; raw: string; data: SubquestionValueData }
  | { type: "option_variable"; raw: string; data: VariableData }
  | { type: "option_column"; raw: string; data: ColumnData }
  | { type: "option_exclude"; raw: string; data: OptionExcludeData }
  | { type: "option_header"; raw: string; data: OptionHeaderData }
  | { type: "option_separator"; raw: string; data: OptionSeparatorData }
  | { type: "option_subtotal"; raw: string; data: SubtotalLabelData }
  | { type: "option_custom"; raw: string; data: CustomData }
  | { type: "subquestion_hint"; raw: string; data: SubtextData }
  | { type: "subquestion_tooltip"; raw: string; data: TooltipData }
  | { type: "subquestion_subtract"; raw: string; data: SubquestionSubtractData }
  | { type: "subquestion_value"; raw: string; data: SubquestionValueData }
  | { type: "matrix_row"; raw: string; data: SubquestionData }
  | { type: "input_type"; raw: string; data: InputTypeData }
  | { type: "variable"; raw: string; data: VariableData }
  | { type: "show_if"; raw: string; data: ShowIfData }
  | { type: "total_label"; raw: string; data: TotalLabelData }
  | { type: "total_column"; raw: string; data: TotalColumnData }
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
  currentQuestion: ParsedQuestion | null
  currentSubquestion: Subquestion | null
  subtextBuffer: string[] | null
  tooltipBuffer: string[] | null
  pageTooltipBuffer: string[] | null
  sectionTooltipBuffer: string[] | null
  subquestionSubtextBuffer: string[] | null
  subquestionTooltipBuffer: string[] | null
  optionSubtextBuffer: string[] | null
  optionTooltipBuffer: string[] | null
  questionCounter: number
}
