import { AppSidebar } from "@/components/app-sidebar"
import { Navbar } from "@/components/navbar"

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar maxWidth="7xl" />

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-8">
            <AppSidebar />
            <div className="flex-1 max-w-4xl">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
