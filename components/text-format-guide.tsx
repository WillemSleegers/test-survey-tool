"use client"

import { useLanguage } from "@/contexts/language-context"

type TextFormatGuideProps = {
  sampleText: string
}

export function TextFormatGuide({ sampleText }: TextFormatGuideProps) {
  const { t } = useLanguage()
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('guide.title')}</h3>
      <div className="text-sm space-y-2">
        <p>
          <strong>{t('guide.keyFeatures')}</strong>
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <code># Section</code> - {t('guide.features.section')}
          </li>
          <li>
            <code>## Subsection</code> - {t('guide.features.subsection')}
          </li>
          <li>
            <code>Q1: Question text?</code> - {t('guide.features.question')}
          </li>
          <li>
            <code>&lt;Additional description&gt;</code> - {t('guide.features.description')}
          </li>
          <li>
            <code>- Option text</code> - {t('guide.features.options')}
          </li>
          <li>
            <code>TEXT</code> / <code>NUMBER</code> - {t('guide.features.inputTypes')}
          </li>
          <li>
            <code>VARIABLE: name</code> - {t('guide.features.variable')}
          </li>
          <li>
            <code>{`{variable}`}</code> - {t('guide.features.replacement')}
          </li>
          <li>
            <code>{`{{condition|true_text|false_text}}`}</code> - {t('guide.features.conditional')} (false part optional)
          </li>
          <li>
            <code>SHOW_IF: condition</code> - {t('guide.features.showIf')}
            <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
              <li>{t('guide.features.afterQuestions')}</li>
              <li>{t('guide.features.afterSections')}</li>
              <li>
                {t('guide.features.example')} <code># Advanced Topics</code> →{" "}
                <code>SHOW_IF: experience != Beginner</code>
              </li>
              <li>{t('guide.features.autoHidden')}</li>
            </ul>
          </li>
        </ul>
      </div>
      <div className="bg-muted p-4 rounded-lg text-xs font-mono whitespace-pre-wrap">
        {sampleText}
      </div>
    </div>
  )
}
