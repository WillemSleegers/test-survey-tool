"use client"

import { useState } from "react"
import { Upload } from "lucide-react"

import { Input } from "@/components/ui/input"

type FileUploadProps = {
  onFileLoaded: (content: string) => void
  onError: (error: string) => void
}

export function FileUpload({ onFileLoaded, onError }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const processFile = (file: File) => {
    const fileName = file.name.toLowerCase()
    const isTextFile = fileName.endsWith(".txt") || fileName.endsWith(".md")
    const isMimeTypeText =
      file.type === "text/plain" || file.type === "text/markdown"

    if (isTextFile || isMimeTypeText) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        onFileLoaded(content)
      }
      reader.onerror = () => {
        onError("Failed to read file")
      }
      reader.readAsText(file)
    } else {
      onError("Please upload a .txt or .md file")
    }
  }

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const file = event.target.files?.[0]
    if (file) {
      processFile(file)
      // Reset the input value so the same file can be uploaded again
      event.target.value = ""
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFile(files[0])
    }
  }

  const handleAreaClick = () => {
    const fileInput = document.getElementById("file-upload") as HTMLInputElement
    fileInput?.click()
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragOver
            ? "border-primary bg-accent"
            : "border-muted-foreground/60 hover:border-muted-foreground hover:bg-muted"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleAreaClick}
      >
        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <div>
          <p className="text-base text-foreground font-medium mb-1">
            Click to upload or drag & drop
          </p>
          <p className="text-sm text-muted-foreground">
            Supports .txt and .md files
          </p>
        </div>
        <Input
          id="file-upload"
          type="file"
          accept=".txt,.md"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  )
}
