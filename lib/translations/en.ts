export const en = {
  navigation: {
    previous: "Previous",
    next: "Next",
    complete: "Complete Survey",
  },
  placeholders: {
    textInput: "Enter your response...",
    numberInput: "Enter a number...",
  },
  completion: {
    title: "Survey Complete!",
    description:
      "Thank you for completing the questionnaire. Your responses have been recorded.",
    close: "Close",
  },
  language: {
    select: "Select Language",
    english: "English",
    dutch: "Dutch",
  },
  upload: {
    clickOrDrag: "Click to upload or drag & drop",
    supportedFiles: "Supports .txt and .md files",
    failedToRead: "Failed to read file",
    invalidFileType: "Please upload a .txt or .md file",
  },
  errors: {
    noSections: "No sections are currently visible based on your responses.",
  },
  mainPage: {
    title: "TST",
    subtitle: "Test Survey Tool",
    or: "OR",
    loadSample: "Load Sample Questionnaire",
  },
  guide: {
    title: "Text Format Guide",
    keyFeatures: "Features:",
    features: {
      section: "Creates new pages",
      subsection: "Headers within the same page",
      question: "Questions",
      description:
        "Optional clarifying text below the question (shown in muted color)",
      options: "Multiple choice options (no letters needed)",
      inputTypes: "Input types",
      variable: "Store response (optional)",
      replacement: "Simple variable replacement",
      conditional: "Conditional text based on responses",
      showIf: "Conditional display",
      afterQuestions: "After questions: Hide individual questions",
      afterSections: "After section headers: Skip entire pages",
      example: "Example:",
      autoHidden: "Sections with only titles are automatically hidden",
    },
  },
} as const
