import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <header>
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between border-b border-border">
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
