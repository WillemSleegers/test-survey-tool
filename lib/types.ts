export type Option = {
  value: string
  label: string
}

export type Question = {
  id: string
  text: string
  type: "multiple_choice" | "text" | "number"
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

export type Section = {
  title: string
  content: string
  questions: Question[]
  subsections: Subsection[]
}

export type Response = {
  value: string
  variable?: string
}

export type Responses = {
  [questionId: string]: Response
}

export type ConditionalPlaceholder = {
  condition: string
  trueText: string
  falseText: string
}
