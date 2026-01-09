import Link from "next/link"
import { Button } from "@/components/ui/button"

interface NavbarProps {
  maxWidth?: "4xl" | "7xl"
}

export function Navbar({ maxWidth = "4xl" }: NavbarProps) {
  const maxWidthClass = maxWidth === "7xl" ? "max-w-7xl" : "max-w-4xl"
  const paddingClass = maxWidth === "7xl" ? "px-4" : "px-6"

  return (
    <header>
      <div className={`${maxWidthClass} mx-auto ${paddingClass} h-16 flex items-center justify-between border-b border-border`}>
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <span className="text-lg font-semibold">TST</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/docs">Documentation</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/releases">Releases</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
