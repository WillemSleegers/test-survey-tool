"use client"

import { useLanguage } from "@/contexts/language-context"
import { useNavigation } from "@/contexts/navigation-context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "./ui/label"
import { Switch } from "./ui/switch"

export function Settings() {
  const { language, setLanguage } = useLanguage()
  const { isVisible, setIsVisible, position, setPosition } = useNavigation()

  return (
    <div className="space-y-6">
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Show Navigation</Label>
            <p className="text-sm text-muted-foreground">
              Display navigation sidebar during surveys
            </p>
          </div>
          <Switch
            checked={isVisible}
            onCheckedChange={setIsVisible}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Navigation Position</Label>
        <Select value={position} onValueChange={setPosition}>
          <SelectTrigger className="max-w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Position of navigation sidebar
        </p>
      </div>
    </div>
  )
}
