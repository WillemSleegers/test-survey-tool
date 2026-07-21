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
import { Info } from "lucide-react"

interface TooltipButtonProps {
  content: string
}

export function TooltipButton({ content }: TooltipButtonProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ms-1 mb-1 size-6 rounded-full font-sans align-middle hover:bg-muted"
          aria-label="Show tooltip"
        >
          {/* translate-x-0 is a no-op numerically, but forces its own compositing layer so the icon rasterizes on-pixel instead of inheriting sub-pixel rounding from upstream layout */}
          <Info className="size-4 translate-x-0 text-primary" />
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
