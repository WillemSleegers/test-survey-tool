

export type Block = {
  id: number
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
  id: number
  title: string
  reveal?: string
  tooltip?: string
  sections: Section[]
  showIf?: string
  computedVariables: ComputedVariable[]
  navLevel?: number  // Optional navigation level (1 = top-level, 2 = nested, etc.)
}

export type Text = {
  value: string
}

export type SectionItem = Text | Question

// Type guards for discriminating between Text and Question
export function isText(item: SectionItem): item is Text {
  return 'value' in item
}

export function isQuestion(item: SectionItem): item is Question {
  return 'type' in item
}

export type Section = {
  id: number
  title?: string
  reveal?: string
  tooltip?: string
  items: SectionItem[]
  showIf?: string
}

// Base fields common to all questions
type QuestionBase = {
  id: string
  text: string
  subtext?: string
  reveal?: string
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

// Base fields common to all option types
type BaseOption = {
  value: string
  label: string
  hint?: string
  reveal?: string
  tooltip?: string
  showIf?: string
}

export type BreakdownOption = BaseOption & {
  subtract?: boolean
  prefillValue?: string
  variable?: string
  column?: number
  exclude?: boolean
  header?: boolean
  subtotalLabel?: string
  separator?: boolean
  custom?: string
  prefix?: string
  suffix?: string
}

export type BreakdownQuestion = QuestionBase & {
  type: "breakdown"
  options: BreakdownOption[]
  totalLabel?: string
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

export type Subquestion = {
  id: string
  text: string
  subtext?: string
  reveal?: string
  tooltip?: string
  variable?: string
  showIf?: string
}


export type Option = BaseOption & {
  allowsOtherText?: boolean
  exclusive?: boolean
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

export type ComputedValues = {
  [variableName: string]: boolean | string | number
}

export type ConditionalPlaceholder = {
  condition: string
  trueText: string
  falseText: string
}

