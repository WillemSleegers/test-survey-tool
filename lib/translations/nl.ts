export const nl = {
  navigation: {
    previous: "Vorige",
    next: "Volgende",
    complete: "Enquête Voltooien",
  },
  placeholders: {
    textInput: "Voer je antwoord in...",
    numberInput: "Voer een nummer in...",
  },
  completion: {
    title: "Vragenlijst voltooid!",
    description:
      "Bedankt voor het invullen van de vragenlijst. Uw antwoorden zijn vastgelegd.",
    close: "Sluiten",
  },
  language: {
    select: "Selecteer Taal",
    english: "Engels",
    dutch: "Nederlands",
  },
  upload: {
    clickOrDrag: "Klik om een bestand te importeren of drag-and-drop",
    supportedFiles: "Ondersteunt .txt en .md bestanden",
    failedToRead: "Kon bestand niet lezen",
    invalidFileType: "Importeer een .txt of .md bestand",
  },
  errors: {
    noSections:
      "Er zijn momenteel geen secties zichtbaar op basis van uw antwoorden.",
  },
  mainPage: {
    title: "TST",
    subtitle: "Test Survey Tool",
    or: "OF",
    loadSample: "Laad Voorbeeld Vragenlijst",
  },
  guide: {
    title: "Tekstformaat Help",
    keyFeatures: "Functies:",
    features: {
      section: "Maakt nieuwe pagina's",
      subsection: "Koppen binnen dezelfde pagina",
      question: "Vragen",
      description:
        "Optionele verduidelijkende tekst onder de vraag (getoond in gedempte kleur)",
      options: "Meerkeuzeopties (geen letters nodig)",
      inputTypes: "Invoertypes",
      variable: "Antwoord opslaan (optioneel)",
      replacement: "Eenvoudige variabele vervanging",
      conditional: "Voorwaardelijke tekst gebaseerd op antwoorden",
      showIf: "Voorwaardelijke weergave",
      afterQuestions: "Na vragen: Verberg individuele vragen",
      afterSections: "Na sectiekoppen: Sla hele pagina's over",
      example: "Voorbeeld:",
      autoHidden: "Secties met alleen titels worden automatisch verborgen",
    },
  },
} as const
