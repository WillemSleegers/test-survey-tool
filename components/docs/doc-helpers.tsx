"use client"

import { useId } from "react"
import { parseQuestionnaire } from "@/lib/parser"
import { QuestionnaireViewer } from "@/components/questionnaire-viewer"
import { LanguageProvider } from "@/contexts/language-context"
import { InstanceIdProvider } from "@/contexts/instance-id-context"
import { Block, NavItem } from "@/lib/types"

function ExampleViewer({ blocks, navItems }: { blocks: Block[]; navItems: NavItem[] }) {
  const instanceId = useId()
  return (
    <LanguageProvider defaultLanguage="en">
      <InstanceIdProvider value={instanceId}>
        <QuestionnaireViewer
          questionnaire={blocks}
          navItems={navItems}
          onResetToUpload={() => {}}
          hidePageNavigator={true}
          disableAutoScroll={true}
        />
      </InstanceIdProvider>
    </LanguageProvider>
  )
}

export function renderCodeBlock(code: string) {
  return (
    <div className="bg-muted p-4 rounded-lg">
      <pre className="text-sm font-mono whitespace-pre-wrap">{code}</pre>
    </div>
  )
}

export function renderExample(code: string) {
  try {
    const parsed = parseQuestionnaire(code)
    return (
      <div className="space-y-0 rounded-lg border border-border overflow-hidden">
        <div className="bg-muted p-4">
          <pre className="text-sm font-mono whitespace-pre-wrap">{code}</pre>
        </div>
        <div className="bg-background p-6 border-t border-border">
          <ExampleViewer blocks={parsed.blocks} navItems={parsed.navItems} />
        </div>
      </div>
    )
  } catch (err) {
    return (
      <div className="space-y-0 rounded-lg border border-destructive overflow-hidden">
        <div className="bg-muted p-4">
          <pre className="text-sm font-mono whitespace-pre-wrap">{code}</pre>
        </div>
        <div className="bg-destructive/10 p-4 border-t border-destructive">
          <p className="text-sm text-destructive font-semibold">
            Parse Error:
          </p>
          <p className="text-sm text-destructive">{(err as Error).message}</p>
        </div>
      </div>
    )
  }
}
