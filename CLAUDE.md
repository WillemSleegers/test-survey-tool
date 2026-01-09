# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IMPORTANT: Context Reset Protocol

**When starting a new conversation or after a context reset, ALWAYS read this CLAUDE.md file first.** This ensures you have the latest project guidelines, quality standards, and development practices before beginning any work.

## Project Overview

Test Survey Tool (TST) is a Next.js React application that converts structured text files into interactive survey questionnaires. Users upload or paste text files with a specific format, and the app renders them as dynamic surveys with conditional logic, computed variables, and multi-page navigation.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production version

## Architecture Overview

### Core Structure

- **Next.js 16** with App Router (`app/` directory) and Turbopack
- **TypeScript** with strict configuration
- **React 19** with React Compiler
- **Tailwind CSS** for styling with Radix UI components
- **shadcn/ui** component library

### Key Application Flow

1. **Text Parsing** (`lib/parser.ts`): Converts structured text into questionnaire objects
2. **Condition System** (`lib/conditions/`): Handles dynamic show/hide logic and computed variables
3. **State Management**: Custom hooks manage responses, navigation, and visibility
4. **Rendering**: Component hierarchy renders questions with conditional logic

### Core Data Types (`lib/types.ts`)

The questionnaire data follows a four-level hierarchy:

```
Block (id, name, showIf?)
└── Page[] (id, title, showIf?, computedVariables)
    └── Section[] (id, title?, showIf?)
        └── SectionItem[] (Text | Question)
```

**Detailed structure:**

- `Block`: Top-level container

  - `id` (number): Unique block identifier
  - `name` (string): Block name/label
  - `pages` (Page[]): Array of pages in this block
  - `computedVariables` (ComputedVariable[]): Block-level calculations
  - `showIf` (string, optional): Conditional visibility expression

- `Page`: Second-level container (defined with `#` or `# Title`)

  - `id` (number): Unique page identifier (for navigation and comparison)
  - `title` (string): Page title
  - `sections` (Section[]): Array of sections on this page
  - `computedVariables` (ComputedVariable[]): Page-level calculations
  - `tooltip`, `showIf`, `navLevel` (optional): Additional metadata

- `Section`: Third-level container (defined with `##` or `## Title`)

  - `id` (number): Unique section identifier (within the page)
  - `items` (SectionItem[]): Array of content items (Text or Question). Use type guard functions `isText(item)` or `isQuestion(item)` to discriminate
  - `title` (string, optional): Section title (undefined for implicit default section)
  - `tooltip`, `showIf` (optional): Additional metadata
  - Sections can be explicit (has `##` marker) or implicit (default section for content before first `##`)

- `Text`: Plain text/markdown content

  - `value` (string): The text content (markdown supported)
  - No `type` property (discriminated from Question using `isText()` type guard)

- `Question`: Individual survey questions with various types

  - All questions share base fields: `type`, `id`, `text`, `subtext?`, `tooltip?`, `variable?`, `showIf?`
  - `type` discriminates the question variant: `"text"`, `"number"`, `"essay"`, `"multiple_choice"`, `"checkbox"`, `"matrix"`, `"breakdown"`
  - Type-specific fields vary by question type

- `ComputedVariable`: Dynamic calculations based on responses
  - `name` (string): Variable identifier
  - `expression` (string): Calculation expression
  - `value` (boolean | string | number, optional): Computed result

### Text Format Parser (`lib/parser.ts`)

The parser converts structured text using these patterns:

- `#` or `# Title` - Page headers
- `## Section` - Section headers
- `Q:` or `Q1:` - Questions
- `HINT:` - Question subtexts
- `- Option` - Multiple choice options
- `TEXT`, `ESSAY`, `NUMBER`, `CHECKBOX` - Input types
- `VARIABLE:` - Assigns variables to questions
- `SHOW_IF:` - Conditional display logic
- `COMPUTE:` - Variable calculations
- `BLOCK:` - Groups pages together

### Condition System (`lib/conditions/`)

Sophisticated conditional logic supporting:

- Simple comparisons (`Q1 == yes` or `Q1 == "yes"`)
- Logical operators (`AND`, `OR`, `NOT`)
- Arithmetic expressions
- Wildcard matching
- Computed variable evaluation

### Component Architecture

- **Question Renderers** (`components/questions/`): Type-specific question components
- **Navigation** (`components/questionnaire/`): Page navigation and progress
- **Hooks** (`hooks/`): State management for responses, visibility, navigation
- **Context** (`contexts/`): Language provider for i18n

### State Management Pattern

Custom hooks manage questionnaire state:

- `use-questionnaire-responses`: Response data management
- `use-questionnaire-navigation`: Page navigation logic
- `use-visible-pages`: Conditional page visibility
- `use-page-completion`: Track completion status

### Styling System

- **Tailwind CSS** with custom configuration
- **Radix UI** primitives for accessible components
- **shadcn/ui** component variants using class-variance-authority
- **Responsive design** with mobile-first approach

### Type Safety

Strong TypeScript usage throughout:

- Discriminated unions for parser types
- Type guard functions (`isText()`, `isQuestion()`) for SectionItem discrimination
- Comprehensive type definitions in `lib/types.ts`
- Strict compiler settings in `tsconfig.json`

## Development Notes

- The parser is the core of the application - changes here affect the entire text format
- Condition evaluation is performance-critical and heavily tested
- Components follow a consistent pattern with shared wrapper components
- State management is deliberately kept simple with React hooks rather than external libraries
- The app is designed to work entirely client-side with no backend requirements

## React Compiler Guidelines

**IMPORTANT**: This project uses React 19 with React Compiler. Follow these guidelines:

### ❌ DO NOT USE

- `useMemo()` - React Compiler handles memoization automatically
- `useCallback()` - React Compiler optimizes function references
- `React.memo()` - Compiler optimizes component re-renders
- Manual optimization patterns that interfere with compiler analysis

### ✅ DO USE

- Simple, clean component code - let the compiler optimize
- Standard React hooks (`useState`, `useEffect`, etc.)
- Pure functions and predictable state updates
- Avoid side effects during render (compiler expects pure render functions)

### Key Principles

- Write code as if there's no performance optimization needed
- React Compiler will handle memoization and re-render optimization
- Focus on correctness and readability over manual performance tuning
- Avoid setState calls during render cycles - they interfere with compiler analysis

## Code Style Guidelines

### Comments

- Keep comments concise and factual
- Avoid referential comments that mention previous versions or changes
- Comments should describe current behavior, not historical context
- Example: Use "Add slots for text inputs" not "Add slots for text inputs (now always visible)"

### Code Cleanliness

- Prefer a clean codebase over maintaining backwards compatibility
- Avoid legacy aliases or deprecated exports
- Remove unused code rather than commenting it out
- Refactor directly rather than adding workarounds

### Linting and Code Quality

- **Never use ESLint disable comments** (`// eslint-disable`, `/* eslint-disable */`)
- **Never use TypeScript suppressions** (`@ts-ignore`, `@ts-expect-error`)
- Fix underlying issues instead of suppressing warnings
- For intentionally unused parameters, use `void parameterName` or proper underscore naming
- Maintain zero build warnings without rule suppressions

### Documentation and Examples

- Keep survey examples realistic and purposeful - avoid forced feature demonstrations
- Use progressive examples that build naturally (Basic → Intermediate → Advanced)
- Centralize reusable content in constants.ts rather than duplicating
- Maintain consistent terminology ("survey" vs "questionnaire") throughout user-facing text

### Development Workflow

- Always build (`npm run build`) after significant changes to catch TypeScript errors
- Check TODO.md for prioritized development items
- Test core functionality after parser or component changes
- Commit frequently with descriptive messages explaining the "why" not just the "what"

### Data Format Changes Require System-Wide Updates

**CRITICAL**: When changing how data is stored or keyed (e.g., response keys, variable names, option identifiers), you MUST update ALL locations that read or write that data.

**Common patterns that require coordinated updates:**

1. **Question response storage format changes**:

   - Component that renders the question (e.g., `breakdown-question.tsx`)
   - Hook that extracts variables from responses (e.g., `use-questionnaire-responses.ts`)
   - Any utility functions that calculate values (e.g., `calculateBreakdownTotal`)

2. **Option/subquestion identifier changes**:
   - Where data is written (onChange handlers)
   - Where data is read (display calculations, totals, subtotals)
   - Where variables are extracted (variable derivation logic)
   - Where data is accessed for conditional logic

**Before changing a data format:**

1. **Search** for all locations that reference the old format
2. **Document** what needs to change in each location
3. **Update** all locations together in a single logical change
4. **Test** that variables and calculations still work correctly

**Example**: Changing breakdown question storage from slugified keys (`option_label_text`) to index keys (`option_0`):

- ✅ Update component: `optionToKey`, `handleRowChange`, `calculateTotal`, `calculateSubtotal`
- ✅ Update hooks: `calculateBreakdownTotal`, option variable extraction, subtotal variable calculation
- ✅ Test that question-level variables, option-level variables, and subtotal variables all work
- ❌ Don't update just the component and forget the hooks

**Red flags:**

- "I updated the component but forgot the hook"
- "Variables stopped working after my change"
- "The calculation logic uses a different key format than the storage"

### Communication Guidelines

- **Never agree with or validate user statements before verifying them**
- If a user claims something exists in the codebase, search for it first before responding
- Don't say "You're right!" or similar affirmations until you've confirmed the facts
- Be honest about uncertainty: "Let me check..." is better than premature agreement
- Verify first, respond second

## Quality Assurance Guidelines

### Use a Systematic Approach, Not Reactive Responses

**CRITICAL**: Before making any changes, follow this systematic process:

1. **UNDERSTAND** - Read relevant files completely to understand the current state
2. **PLAN** - Use TodoWrite to break down what needs to be done step by step
3. **EXECUTE** - Make changes systematically according to your plan
4. **VERIFY** - Check that the result makes sense and is complete

**Avoid reactive patterns:**

- ❌ Making immediate changes based on requests
- ❌ Partial fixes that leave inconsistencies
- ❌ Jumping between different parts of a task randomly
- ❌ "I'll just put this here for now" thinking

**Example**: If asked to move documentation, first read the entire file, plan what needs to move where, execute all moves together, then verify consistency.

### Always Sanity-Check Your Work

**CRITICAL**: Before completing any task, always pause and ask yourself: "Does this make sense?"

This applies to:

- **Code organization**: Is this component in the right place?
- **Documentation placement**: Does this belong with similar-complexity features?
- **API design**: Would this interface confuse users?
- **File structure**: Is this logical for someone else to find?
- **Feature behavior**: Would users expect this to work this way?

**Red flags that should trigger re-evaluation:**

- "I'll just put this here for now"
- Rushing to complete without considering broader context
- Focusing only on technical implementation without considering user experience
- Making decisions based on convenience rather than logic

**Example**: Matrix questions require understanding basic questions AND table layouts - putting them in "Basic" documentation doesn't make sense even if it's technically easier.

### Documentation Guidelines

When documenting new features, carefully consider the learning progression and prerequisite knowledge required.

## Documentation System

This application includes an integrated documentation page at `/docs` that teaches users the text format syntax through interactive examples.

### Documentation Architecture

**File locations:**

- Main documentation page: `app/docs/page.tsx`
- Navigation sidebar: `components/app-sidebar.tsx`
- Reusable examples: `lib/constants.ts` (for examples used in multiple places)

**How it works:**

1. User selects a topic from the sidebar (`AppSidebar` component)
2. `DocumentationContent` component renders the appropriate section based on `activeSection` state
3. Examples are rendered using `renderExample()` which:
   - Parses the text format using `parseQuestionnaire()`
   - Displays the raw text in a code block
   - Renders the live interactive result using `QuestionnaireViewer`
   - Shows parse errors if the example is invalid

**Section types:**

- Each documentation section is defined in the `Section` union type in `app/docs/page.tsx`
- Sections are organized into groups in `navMain` array in `components/app-sidebar.tsx`
- Each section case in the switch statement renders its own content

### Adding New Documentation

**To document a new feature:**

1. **Add the section type** to the `Section` union in `app/docs/page.tsx`:

   ```typescript
   export type Section =
     | "overview"
     | "pages"
     // ... existing sections
     | "your-new-section" // Add here
   ```

2. **Add navigation item** in `components/app-sidebar.tsx`:

   ```typescript
   const navMain = [
     {
       title: "Appropriate Group",
       items: [
         // ... existing items
         { title: "Your Feature Name", section: "your-new-section" as Section },
       ],
     },
   ]
   ```

3. **Add section content** in the switch statement in `app/docs/page.tsx`:

   ```typescript
   case "your-new-section":
     return (
       <div className="space-y-6">
         <div>
           <h2 className="text-2xl font-semibold">Feature Name</h2>
           <p className="text-muted-foreground mt-1">
             Brief description of what this feature does.
           </p>
         </div>

         <div className="space-y-3">
           <h3 className="text-xl font-semibold">Usage</h3>
           {renderCodeBlock(`Syntax example here`)}
           <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
             <li>Key point about usage</li>
             <li>Another important detail</li>
           </ul>
         </div>

         <div className="space-y-3">
           <h3 className="text-xl font-semibold">Example</h3>
           {renderExample(`Complete working example here`)}
         </div>
       </div>
     )
   ```

### Documentation Best Practices

**Writing examples:**

- Keep examples focused on demonstrating ONE feature clearly
- Use realistic survey scenarios, not contrived demonstrations
- Start with the simplest possible example, then show advanced usage
- Every example must be valid text format that parses correctly
- Test examples by viewing them in the docs page before committing

**Section organization:**

- Group related features together in the navigation sidebar
- Order sections from basic to advanced within each group
- Cross-reference related features when helpful (see "option-text" and "conditionals" sections)
- Use consistent heading hierarchy: `h2` for page title, `h3` for major subsections, `h4` for minor subsections

**Content guidelines:**

- Start with a brief description of what the feature does
- Show syntax in a code block using `renderCodeBlock()`
- Provide bullet points explaining key behaviors
- Include at least one complete working example using `renderExample()`
- Use consistent terminology matching the parser keywords
- Keep explanations concise - the live examples teach best

**Styling patterns:**

- Page titles: `h1` or `h2` with `text-2xl font-semibold`
- Subsection titles: `h3` with `text-xl font-semibold`
- Minor subsections: `h4` with `text-lg font-semibold`
- Descriptions under page titles: `text-muted-foreground mt-1` (truly secondary context)
- Instructional text and explanations: Use default text color (not muted - this is primary content)
- Introductory paragraphs before examples: `text-sm` with default color
- Cross-references and "see also" notes: `text-muted-foreground` (truly secondary)
- Bullet points: `text-sm text-muted-foreground` (can be smaller as they're typically concise)
- Use inline `<code>` tags for keywords and syntax references
- Use `space-y-6` between major sections, `space-y-3` between subsections

**Common pitfalls:**

- Don't use `-` for bullet points in examples (conflicts with option syntax)
- Don't forget to add the section to both the type union AND the switch statement
- Don't create examples that depend on features not yet explained
- Don't duplicate example text - use `lib/constants.ts` for reusable examples
