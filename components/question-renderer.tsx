"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { replacePlaceholders } from "@/lib/utils"
import { Question, Responses } from "@/lib/types"

interface QuestionRendererProps {
  question: Question
  responses: Responses
  onResponse: (questionId: string, value: string) => void
}

export function QuestionRenderer({
  question,
  responses,
  onResponse,
}: QuestionRendererProps) {
  const questionText = replacePlaceholders(question.text, responses)
  const currentValue = responses[question.id]?.value || ""

  switch (question.type) {
    case "multiple_choice":
      return (
        <div className="space-y-3">
          <Label className="text-base font-medium">{questionText}</Label>
          <RadioGroup
            value={currentValue}
            onValueChange={(value) => onResponse(question.id, value)}
          >
            {question.options.map((option, optionIndex) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={option.value}
                  id={`${question.id}-${optionIndex}`}
                />
                <Label
                  htmlFor={`${question.id}-${optionIndex}`}
                  className="cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )

    case "text":
      return (
        <div className="space-y-3">
          <Label className="text-base font-medium">{questionText}</Label>
          <Textarea
            value={currentValue}
            onChange={(e) => onResponse(question.id, e.target.value)}
            placeholder="Enter your response..."
            className="min-h-[100px]"
          />
        </div>
      )

    case "number":
      return (
        <div className="space-y-3">
          <Label className="text-base font-medium">{questionText}</Label>
          <Input
            type="number"
            value={currentValue}
            onChange={(e) => onResponse(question.id, e.target.value)}
            placeholder="Enter a number..."
          />
        </div>
      )

    default:
      return null
  }
}
