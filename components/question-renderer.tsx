"use client"

import React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { replacePlaceholders } from "@/lib/utils"

import { Question, Responses } from "@/lib/types"

interface QuestionRendererProps {
  question: Question
  responses: Responses
  onResponse: (questionId: string, value: string | string[]) => void
}

export function QuestionRenderer({
  question,
  responses,
  onResponse,
}: QuestionRendererProps) {
  const questionText = replacePlaceholders(question.text, responses)
  const questionSubtext = replacePlaceholders(question.subtext, responses)
  const responseValue = responses[question.id]?.value

  switch (question.type) {
    case "multiple_choice":
      // For radio buttons, value should always be string
      const radioValue = typeof responseValue === "string" ? responseValue : ""

      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-base font-medium">{questionText}</p>
            {questionSubtext && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {questionSubtext}
              </p>
            )}
          </div>
          <RadioGroup
            value={radioValue}
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

    case "checkbox":
      // For checkboxes, value should be string array
      const checkboxValues = Array.isArray(responseValue) ? responseValue : []

      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-base font-medium">{questionText}</p>
            {questionSubtext && (
              <p className="text-sm text-muted-foreground">{questionSubtext}</p>
            )}
          </div>
          <div className="space-y-3">
            {question.options.map((option, optionIndex) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${optionIndex}`}
                  checked={checkboxValues.includes(option.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onResponse(question.id, [...checkboxValues, option.value])
                    } else {
                      onResponse(
                        question.id,
                        checkboxValues.filter((v) => v !== option.value)
                      )
                    }
                  }}
                />
                <Label
                  htmlFor={`${question.id}-${optionIndex}`}
                  className="cursor-pointer text-sm font-normal"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )

    case "text":
      // For text inputs, value should be string
      const textValue = typeof responseValue === "string" ? responseValue : ""

      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-base font-medium">{questionText}</p>
            {questionSubtext && (
              <p className="text-sm text-muted-foreground">{questionSubtext}</p>
            )}
          </div>
          <Textarea
            value={textValue}
            onChange={(e) => onResponse(question.id, e.target.value)}
            placeholder="Enter your response..."
            className="min-h-[100px]"
          />
        </div>
      )

    case "number":
      // For number inputs, value should be string
      const numberValue = typeof responseValue === "string" ? responseValue : ""

      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-base font-medium">{questionText}</p>
            {questionSubtext && (
              <p className="text-sm text-muted-foreground">{questionSubtext}</p>
            )}
          </div>
          <Input
            type="number"
            value={numberValue}
            onChange={(e) => onResponse(question.id, e.target.value)}
            placeholder="Enter a number..."
          />
        </div>
      )

    default:
      return null
  }
}
