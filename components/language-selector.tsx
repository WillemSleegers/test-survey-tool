"use client"

import { useLanguage } from '@/contexts/language-context'
import { Language } from '@/lib/translations'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={t('language.select')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">{t('language.english')}</SelectItem>
        <SelectItem value="nl">{t('language.dutch')}</SelectItem>
      </SelectContent>
    </Select>
  )
}