import { useId } from "react"
import Markdown from "react-markdown"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import {
  markdownImageComponents,
  remarkPlugins,
} from "@/lib/markdown-components"
import { Button } from "../ui/button"

interface TooltipButtonProps {
  /** Already placeholder-resolved Markdown content to show in the popover */
  content: string
}

function InfoFilledIcon({ className }: { className?: string }) {
  const maskId = useId()

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <mask id={maskId}>
        <rect width="24" height="24" fill="white" />
        <circle cx="12" cy="7.5" r="1.6" fill="black" />
        <rect
          x="10.4"
          y="10.5"
          width="3.2"
          height="7.5"
          rx="1.6"
          fill="black"
        />
      </mask>
      <circle cx="12" cy="12" r="10" fill="gray" mask={`url(#${maskId})`} />
    </svg>
  )
}

export function TooltipButton({ content }: TooltipButtonProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-5 hover:bg-transparent"
          aria-label="Show tooltip"
        >
          <InfoFilledIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Markdown
          remarkPlugins={remarkPlugins}
          components={markdownImageComponents}
        >
          {content}
        </Markdown>
      </PopoverContent>
    </Popover>
  )
}
