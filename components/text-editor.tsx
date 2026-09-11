"use client"

import { useState } from "react"
import { removeStoredValue, writeStoredValue } from "@/hooks/use-local-storage"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Trash2 } from "lucide-react"

interface TextEditorProps {
  onLoadContent: (content: string) => void
  onCancel: () => void
}

const STORAGE_KEY = "tst-survey-draft"

export function TextEditor({ onLoadContent, onCancel }: TextEditorProps) {
  // The editor only mounts after the user opens it, so the draft can be read
  // during the first render instead of in a mount effect
  const [content, setContent] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? ""
  )

  const updateContent = (value: string) => {
    setContent(value)
    if (value) {
      writeStoredValue(STORAGE_KEY, value)
    }
  }

  const handleLoad = () => {
    if (content.trim()) {
      onLoadContent(content)
    }
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete your draft?")) {
      setContent("")
      removeStoredValue(STORAGE_KEY)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="survey-editor" className="text-sm font-medium">
          Enter your survey text below
        </label>
        <Textarea
          id="survey-editor"
          value={content}
          onChange={(e) => updateContent(e.target.value)}
          placeholder="# Page Title&#10;&#10;Q: Your first question?&#10;- Option 1&#10;- Option 2"
          className="min-h-[300px] font-mono text-sm"
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleLoad} disabled={!content.trim()}>
          Load Survey
        </Button>
        <Button onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button onClick={handleDelete} variant="destructive" disabled={!content.trim()}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Draft
        </Button>
      </div>
    </div>
  )
}
