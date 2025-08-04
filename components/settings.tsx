"use client"

import { useLanguage } from "@/contexts/language-context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "./ui/label"

export function Settings() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="space-y-2">
      <div className="text-xl font-semibold">Settings</div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Survey Language</Label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="max-w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="nl">Nederlands</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Language for survey navigation and placeholders
        </p>
      </div>
    </div>
  )
}
