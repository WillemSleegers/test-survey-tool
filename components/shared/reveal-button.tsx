import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RevealButtonProps {
  onClick: () => void
  className?: string
  ariaLabel?: string
}

export function RevealButton({ onClick, className, ariaLabel = "Toggle additional information" }: RevealButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn("relative size-7 shrink-0 rounded-full hover:bg-muted", className)}
      aria-label={ariaLabel}
    >
      <Info className="absolute inset-0 m-auto size-5 text-muted-foreground" />
    </Button>
  )
}
