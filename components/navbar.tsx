import Link from "next/link"

export function Navbar() {
  return (
    <header>
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between border-b border-border">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <span className="text-xl font-bold">TST</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/docs" className="text-sm hover:underline">
            Documentation
          </Link>
          <Link href="/releases" className="text-sm hover:underline">
            Releases
          </Link>
        </nav>
      </div>
    </header>
  )
}
