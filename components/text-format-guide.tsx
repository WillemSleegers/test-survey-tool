"use client"

import { useLanguage } from "@/contexts/language-context"

type TextFormatGuideProps = {
  sampleText: string
}

export function TextFormatGuide({ sampleText }: TextFormatGuideProps) {
  const { t } = useLanguage()

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t("guide.title")}</h3>
      <div className="text-sm space-y-2">
        <p>
          <strong>{t("guide.keyFeatures")}</strong>
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <code># Section</code> - {t("guide.features.section")}
          </li>
          <li>
            <code>## Subsection</code> - {t("guide.features.subsection")}
          </li>
          <li>
            <code>Q1: Question text?</code> - {t("guide.features.question")}
          </li>
          <li>
            <code>HINT: Additional description</code> -{" "}
            {t("guide.features.description")}
          </li>
          <li>
            <code>- Option text</code> - {t("guide.features.options")}
          </li>
          <li>
            <code>TEXT</code> / <code>NUMBER</code> -{" "}
            {t("guide.features.inputTypes")}
          </li>
          <li>
            <code>VARIABLE: name</code> - {t("guide.features.variable")}
          </li>
          <li>
            <code>{`{variable}`}</code> - {t("guide.features.replacement")}
          </li>
          <li>
            <code>{`{{IF condition THEN true_text ELSE false_text}}`}</code> -{" "}
            {t("guide.features.conditional")} (ELSE part optional)
            <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-xs">
              <li>
                <code>{`{{IF age >= 18 THEN As an adult ELSE As someone under 18}}`}</code>
              </li>
              <li>
                <code>{`{{IF rating >= 4 THEN Highly rated!}}`}</code> - IF THEN
                only (no ELSE part)
              </li>
              <li>
                <code>{`{{IF recommend THEN {recommend} ELSE Not answered}}`}</code>{" "}
                - Check if variable exists
              </li>
              <li>
                <code>{`{{IF NOT color THEN Please select a color ELSE You chose {color}}}`}</code>{" "}
                - Check if variable is empty
              </li>
              <li>
                <code>{`{{IF age >= 18 AND rating >= 4 THEN Adult with high rating ELSE Other}}`}</code>{" "}
                - Multiple conditions
              </li>
            </ul>
          </li>
          <li>
            <code>SHOW_IF: condition</code> - {t("guide.features.showIf")}
            <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
              <li>{t("guide.features.afterQuestions")}</li>
              <li>{t("guide.features.afterSections")}</li>
              <li>
                {t("guide.features.example")} <code># Advanced Topics</code> →{" "}
                <code>SHOW_IF: experience</code> (if experience exists) or{" "}
                <code>SHOW_IF: NOT experience</code> (if empty)
              </li>
              <li>
                <code>
                  SHOW_IF: age {">="} 18 AND rating {">="} 4
                </code>{" "}
                - Multiple conditions
              </li>
              <li>
                <code>SHOW_IF: experience IS Advanced</code> - Keyword operators
                (IS, IS_NOT, GREATER_THAN, LESS_THAN, etc.)
              </li>
              <li>{t("guide.features.autoHidden")}</li>
            </ul>
          </li>
        </ul>
      </div>
      <div className="bg-muted p-4 rounded-lg text-sm font-mono whitespace-pre-wrap">
        {sampleText}
      </div>
    </div>
  )
}
