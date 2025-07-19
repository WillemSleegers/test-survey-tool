"use client"

import React, { useState } from "react"
import { Upload } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FileUploadProps {
  onFileLoaded: (content: string) => void
  onError: (error: string) => void
  accept?: string
  supportedFormats?: string
}

export function FileUpload({
  onFileLoaded,
  onError,
  accept = ".txt",
  supportedFormats = ".txt files",
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const processFile = (file: File) => {
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
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
      onError(`Please upload a ${supportedFormats}`)
    }
  }

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const file = event.target.files?.[0]
    if (file) {
      processFile(file)
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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Upload Questionnaire File</h3>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-300"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <Label
          htmlFor="file-upload"
          className="cursor-pointer text-blue-600 hover:text-blue-500"
        >
          Choose a text file or drag and drop
        </Label>
        <Input
          id="file-upload"
          type="file"
          accept={accept}
          onChange={handleFileUpload}
          className="hidden"
        />
        <p className="text-sm text-gray-500 mt-2">
          Supports {supportedFormats}
        </p>
      </div>
    </div>
  )
}
