"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon, CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  shape = "square",
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> & {
  /** Visual shape of the control. Use "circle" to signal an exclusive (radio-like) option. */
  shape?: "square" | "circle"
}) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-lg border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        shape === "circle" && "rounded-full",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        {shape === "circle" ? (
          <CircleIcon className="size-2 fill-current" />
        ) : (
          <CheckIcon className="size-3.5" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
