import { Navbar } from "@/components/navbar"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { readFileSync } from "fs"
import { join } from "path"

export default function ReleasesPage() {
  const releasesPath = join(process.cwd(), "RELEASES.md")
  const releasesContent = readFileSync(releasesPath, "utf-8")

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12 pb-24">
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-4xl font-bold mb-8">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-3xl font-bold mt-12 mb-4">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-semibold mt-6 mb-3">{children}</h3>
              ),
              h4: ({ children }) => (
                <h4 className="font-semibold mt-4 mb-2">{children}</h4>
              ),
              p: ({ children }) => (
                <p className="text-sm text-muted-foreground my-2">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4 my-2">
                  {children}
                </ul>
              ),
              li: ({ children }) => <li>{children}</li>,
              em: ({ children }) => (
                <em className="text-sm text-muted-foreground not-italic">
                  {children}
                </em>
              ),
              strong: ({ children }) => <strong>{children}</strong>,
              hr: () => <hr className="my-8 border-border" />,
            }}
          >
            {releasesContent}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  )
}
