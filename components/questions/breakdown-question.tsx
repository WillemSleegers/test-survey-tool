import { useState } from "react"
import Markdown from "react-markdown"
import { remarkPlugins } from "@/lib/markdown-components"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { OptionLabelContent } from "./shared/option-label-content"
import { QuestionWrapper } from "./shared/question-wrapper"
import { BreakdownQuestion as BreakdownQuestionType, Responses, Variables, ComputedValues } from "@/lib/types"
import { replacePlaceholders } from "@/lib/text-processing/replacer"
import { useInstanceId } from "@/contexts/instance-id-context"
import { useLanguage } from "@/contexts/language-context"
import { getVisibleBreakdownOptions, sumBreakdownOptions, computeSubtotalValues, subtotalVariables } from "@/lib/breakdown-calculations"

const UNAVAILABLE_VALUE_PLACEHOLDER = '–'

interface BreakdownQuestionProps {
  question: BreakdownQuestionType
  responses: Responses
  variables: Variables
  onResponse: (questionId: string, value: Record<string, string>) => void
  startTabIndex: number
  computedVariables?: ComputedValues
}

interface OptionValueInputProps {
  isReadOnly: boolean
  hasUnresolvedPlaceholders: boolean
  value: string
  prefix: string
  suffix: string
  inputId: string
  tabIndex: number
  onChange: (value: string) => void
}

function OptionValueInput({ isReadOnly, hasUnresolvedPlaceholders, value, prefix, suffix, inputId, tabIndex, onChange }: OptionValueInputProps) {
  if (isReadOnly) {
    return (
      <div className="flex items-center justify-end text-muted-foreground">
        {hasUnresolvedPlaceholders ? UNAVAILABLE_VALUE_PLACEHOLDER : `${prefix}${value}${suffix}`}
      </div>
    )
  }
  return (
    <div className="flex items-center justify-end gap-1">
      {prefix && <span className="text-muted-foreground">{prefix}</span>}
      <Input
        id={inputId}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-24 ${suffix ? 'text-right' : 'text-left'} [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]`}
        tabIndex={tabIndex}
      />
      {suffix && <span className="text-muted-foreground whitespace-nowrap">{suffix}</span>}
    </div>
  )
}

export function BreakdownQuestion({
  question,
  responses,
  variables,
  onResponse,
  startTabIndex,
  computedVariables
}: BreakdownQuestionProps) {
  const instanceId = useInstanceId()
  const { t } = useLanguage()
  const listFormat = { empty: t('lists.none'), conjunction: t('lists.and') }

  const responseValue = responses[question.id]
  const currentValues = (typeof responseValue === "object" && responseValue !== null && !Array.isArray(responseValue))
    ? responseValue as Record<string, string>
    : {}

  const visibleEntries = getVisibleBreakdownOptions(question, variables, computedVariables)
  const subtotals = computeSubtotalValues(question, currentValues, variables, computedVariables)
  const localVariables: Variables = { ...variables, ...subtotalVariables(question, subtotals) }

  const optionToKey = (index: number): string => `option_${index}`

  const handleRowChange = (index: number, value: string) => {
    const key = optionToKey(index)
    const newValues = { ...currentValues }
    if (value === "") {
      delete newValues[key]
    } else {
      newValues[key] = value
    }
    onResponse(question.id, newValues)
  }

  const total = sumBreakdownOptions(visibleEntries, currentValues, variables, computedVariables)
  const totalLabel = question.totalLabel
  const questionPrefix = question.prefix || ""
  const questionSuffix = question.suffix || ""

  const hasColumns = visibleEntries.some(({ option }) => option.column !== undefined)

  const optionsByColumn = new Map<number, typeof question.options>()
  if (hasColumns) {
    visibleEntries.forEach(({ option }) => {
      const col = option.column ?? 1
      if (!optionsByColumn.has(col)) {
        optionsByColumn.set(col, [])
      }
      optionsByColumn.get(col)!.push(option)
    })
  }

  const [visibleReveals, setVisibleReveals] = useState<Set<string>>(new Set())

  const toggleReveal = (optionValue: string) => {
    setVisibleReveals(prev => {
      const next = new Set(prev)
      if (next.has(optionValue)) {
        next.delete(optionValue)
      } else {
        next.add(optionValue)
      }
      return next
    })
  }

  const getOptionValue = (option: typeof question.options[0], index: number) => {
    const key = optionToKey(index)
    const isReadOnly = !!option.prefillValue
    let value = currentValues[key] || ""
    let hasUnresolvedPlaceholders = false
    if (isReadOnly) {
      value = replacePlaceholders(option.prefillValue!, variables, computedVariables, listFormat)
      hasUnresolvedPlaceholders = value.includes('\\{')
    }
    return { key, isReadOnly, value, hasUnresolvedPlaceholders }
  }

  const renderOptionRows = (option: typeof question.options[0], index: number) => {
    if (option.header) {
      return (
        <TableRow key={index}>
          <TableCell className="text-base pl-0 whitespace-normal" colSpan={2}>
            <Markdown remarkPlugins={remarkPlugins}>{replacePlaceholders(option.label, variables, computedVariables, listFormat)}</Markdown>
          </TableCell>
        </TableRow>
      )
    }

    if (option.separator) {
      return (
        <TableRow key={index} className="border-b-0!">
          <TableCell className="h-12 pl-0" colSpan={2} />
        </TableRow>
      )
    }

    if (option.subtotalLabel) {
      const subtotal = subtotals.get(index) ?? null
      const prefix = option.prefix ?? questionPrefix
      const suffix = option.suffix ?? questionSuffix
      return (
        <TableRow key={index}>
          <TableCell className="align-middle whitespace-normal text-base pl-0">
            <OptionLabelContent
              label={option.subtotalLabel}
              hint={option.hint}
              reveal={option.reveal}
              tooltip={option.tooltip}
              optionValue={option.value}
              isRevealVisible={visibleReveals.has(option.value)}
              onToggleReveal={toggleReveal}
              variables={variables}
              computedVariables={computedVariables}
            />
          </TableCell>
          <TableCell className="text-right py-1">
            {subtotal !== null ? `${prefix}${subtotal}${suffix}` : UNAVAILABLE_VALUE_PLACEHOLDER}
          </TableCell>
        </TableRow>
      )
    }

    const { key, isReadOnly, value, hasUnresolvedPlaceholders } = getOptionValue(option, index)
    const prefix = option.prefix ?? questionPrefix
    const suffix = option.suffix ?? questionSuffix
    return (
      <TableRow key={index}>
        <TableCell className="align-middle whitespace-normal pl-0">
          <OptionLabelContent
            label={option.label}
            hint={option.hint}
            reveal={option.reveal}
            tooltip={option.tooltip}
            optionValue={option.value}
            isRevealVisible={visibleReveals.has(option.value)}
            onToggleReveal={toggleReveal}
            variables={variables}
            computedVariables={computedVariables}
          />
        </TableCell>
        <TableCell className="text-right align-middle">
          <OptionValueInput
            isReadOnly={isReadOnly}
            hasUnresolvedPlaceholders={hasUnresolvedPlaceholders}
            value={value}
            prefix={prefix}
            suffix={suffix}
            inputId={`${instanceId}${question.id}-${key}`}
            tabIndex={startTabIndex + index}
            onChange={(val) => handleRowChange(index, val)}
          />
        </TableCell>
      </TableRow>
    )
  }

  const renderColumnLayout = () => {
    const columnNumbers = Array.from(optionsByColumn.keys()).sort((a, b) => a - b)
    const numColumns = columnNumbers.length

    return (
      <div className="space-y-2">
        <Table>
          <TableBody>
            {visibleEntries.map(({ option, index }) => {
              if (option.header) {
                return (
                  <TableRow key={index}>
                    <TableCell className="text-base pl-0 whitespace-normal" colSpan={numColumns + 1}>
                      <Markdown remarkPlugins={remarkPlugins}>{replacePlaceholders(option.label, variables, computedVariables, listFormat)}</Markdown>
                    </TableCell>
                  </TableRow>
                )
              }

              if (option.separator) {
                return (
                  <TableRow key={index} className="border-b-0!">
                    <TableCell className="h-12 pl-0" colSpan={numColumns + 1} />
                  </TableRow>
                )
              }

              if (option.subtotalLabel) {
                const subtotal = subtotals.get(index) ?? null
                const subtotalCol = option.column ?? columnNumbers[columnNumbers.length - 1]
                const prefix = option.prefix ?? questionPrefix
                const suffix = option.suffix ?? questionSuffix
                return (
                  <TableRow key={index}>
                    <TableCell className="align-middle whitespace-normal text-base pl-0">
                      <OptionLabelContent
                        label={option.subtotalLabel}
                        hint={option.hint}
                        reveal={option.reveal}
                        tooltip={option.tooltip}
                        optionValue={option.value}
                        isRevealVisible={visibleReveals.has(option.value)}
                        onToggleReveal={toggleReveal}
                        variables={variables}
                        computedVariables={computedVariables}
                      />
                    </TableCell>
                    {columnNumbers.map((colNum) => (
                      <TableCell key={colNum} className="text-right py-1">
                        {colNum === subtotalCol ? (subtotal !== null ? `${prefix}${subtotal}${suffix}` : UNAVAILABLE_VALUE_PLACEHOLDER) : null}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              }

              const { key, isReadOnly, value, hasUnresolvedPlaceholders } = getOptionValue(option, index)
              const optionColumn = option.column ?? 1
              const prefix = option.prefix ?? questionPrefix
              const suffix = option.suffix ?? questionSuffix
              return (
                <TableRow key={index}>
                  <TableCell className="align-middle whitespace-normal pl-0">
                    <OptionLabelContent
                      label={option.label}
                      hint={option.hint}
                      reveal={option.reveal}
                      tooltip={option.tooltip}
                      optionValue={option.value}
                      isRevealVisible={visibleReveals.has(option.value)}
                      onToggleReveal={toggleReveal}
                      variables={variables}
                      computedVariables={computedVariables}
                    />
                  </TableCell>
                  {columnNumbers.map(colNum => (
                    <TableCell key={colNum} className="text-right align-middle">
                      {optionColumn === colNum ? (
                        <OptionValueInput
                          isReadOnly={isReadOnly}
                          hasUnresolvedPlaceholders={hasUnresolvedPlaceholders}
                          value={value}
                          prefix={prefix}
                          suffix={suffix}
                          inputId={`${instanceId}${question.id}-${key}`}
                          tabIndex={startTabIndex + index}
                          onChange={(val) => handleRowChange(index, val)}
                        />
                      ) : null}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}

            {totalLabel && (
              <TableRow className="border-t border-border">
                <TableCell className="text-base pt-4 pl-0 whitespace-normal">
                  <Markdown remarkPlugins={remarkPlugins}>{replacePlaceholders(totalLabel, variables, computedVariables, listFormat)}</Markdown>
                </TableCell>
                {columnNumbers.map((colNum, idx) => (
                  <TableCell key={colNum} className="text-right pt-4 py-2">
                    {idx === columnNumbers.length - 1 ? (
                      <>{questionPrefix}{total}{questionSuffix}</>
                    ) : null}
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <QuestionWrapper question={question} variables={variables} computedVariables={computedVariables}>
      <div className="space-y-2">
        {hasColumns ? (
          renderColumnLayout()
        ) : (
          <Table>
            <TableBody>
              {visibleEntries.map(({ option, index }) => renderOptionRows(option, index))}

              {totalLabel && (
                <TableRow className="border-t border-border">
                  <TableCell className="text-base pt-4 pl-0 whitespace-normal">
                    <Markdown remarkPlugins={remarkPlugins}>{replacePlaceholders(totalLabel, variables, computedVariables, listFormat)}</Markdown>
                  </TableCell>
                  <TableCell className="text-right pt-4 py-2">
                    {questionPrefix}{total}{questionSuffix}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </QuestionWrapper>
  )
}
