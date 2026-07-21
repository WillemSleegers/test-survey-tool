import Markdown from "react-markdown"
import { remarkPlugins } from "@/lib/markdown-components"
import { Label } from "@/components/ui/label"
import { RevealButton } from "@/components/shared/reveal-button"
import { TooltipButton } from "@/components/shared/tooltip-button"
import { Variables, ComputedValues } from "@/lib/types"
import { replacePlaceholders } from "@/lib/text-processing/replacer"
import { useLanguage } from "@/contexts/language-context"

interface OptionLabelContentProps {
  label: string
  hint?: string
  reveal?: string
  tooltip?: string
  optionValue: string
  isRevealVisible: boolean
  onToggleReveal: (value: string) => void
  variables: Variables
  computedVariables?: ComputedValues
  /** When set, wraps the label text in a `<Label htmlFor>` so clicking it activates the given input */
  labelFor?: string
}

/**
 * Renders an option's label with its optional hint, tooltip, and reveal panel.
 *
 * The tooltip and reveal buttons trail the label text inline (after any tooltip,
 * the reveal icon comes last) rather than in a fixed gutter position, so they stay
 * anchored to the label regardless of whether it wraps to multiple lines. They're
 * siblings of the (optional) `<Label>` rather than nested inside it, so clicking
 * them doesn't also toggle the associated form control via the browser's native
 * label-click forwarding.
 */
export function OptionLabelContent({
  label,
  hint,
  reveal,
  tooltip,
  optionValue,
  isRevealVisible,
  onToggleReveal,
  variables,
  computedVariables,
  labelFor,
}: OptionLabelContentProps) {
  const { t } = useLanguage()
  const listFormat = { empty: t('lists.none'), conjunction: t('lists.and') }

  const labelText = (
    <span className="[&_p]:inline">
      <Markdown remarkPlugins={remarkPlugins}>{replacePlaceholders(label, variables, computedVariables, listFormat)}</Markdown>
    </span>
  )

  return (
    <div>
      <div className="text-base">
        {labelFor ? (
          <Label htmlFor={labelFor} className="inline text-base cursor-pointer font-normal">
            {labelText}
          </Label>
        ) : (
          labelText
        )}
        {tooltip && (
          <TooltipButton content={replacePlaceholders(tooltip, variables, computedVariables, listFormat)} />
        )}
        {reveal && (
          <RevealButton onClick={() => onToggleReveal(optionValue)} className="ms-1" />
        )}
      </div>
      {hint && (
        <div className="text-base text-muted-foreground mt-0.5 font-normal">
          <Markdown remarkPlugins={remarkPlugins}>{replacePlaceholders(hint, variables, computedVariables, listFormat)}</Markdown>
        </div>
      )}
      {reveal && isRevealVisible && (
        <div className="text-base text-muted-foreground bg-muted p-3 rounded-md mt-2 font-normal">
          <Markdown remarkPlugins={remarkPlugins}>{replacePlaceholders(reveal, variables, computedVariables, listFormat)}</Markdown>
        </div>
      )}
    </div>
  )
}
