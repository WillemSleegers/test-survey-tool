# CLAUDE.md

## Project Overview

Test Survey Tool (TST) is a Next.js React application that converts structured text files into interactive survey questionnaires. Users upload or paste text files with a specific format, and the app renders them as dynamic surveys with conditional logic, computed variables, and multi-page navigation.

## Architecture Overview

### Core Structure

- **Next.js** with App Router (`app/` directory) and Turbopack
- **TypeScript** with strict configuration
- **React** with React Compiler
- **Tailwind CSS** for styling with Radix UI components
- **shadcn/ui** component library

### Key Application Flow

1. **Text Parsing** (`lib/parser.ts`): Converts structured text into questionnaire objects
2. **Condition System** (`lib/conditions/`): Handles dynamic show/hide logic and computed variables
3. **State Management**: Custom hooks manage responses, navigation, and visibility
4. **Rendering**: Component hierarchy renders questions with conditional logic

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
- `tests/examples/*.md` are scratch survey fixtures for manually exploring a feature (paste into the app) — they are not loaded by any automated test, so don't assume adding one adds regression coverage

## React Compiler Guidelines

**IMPORTANT**: This project uses React with React Compiler. Follow these guidelines:

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

- Always build (`pnpm build`) after significant changes to catch TypeScript errors
- This project uses **pnpm** — use `pnpm install` / `pnpm build` / `pnpm test`, never npm
- Check TODO.md for prioritized development items
- Test core functionality after parser or component changes
- Commit frequently with descriptive messages explaining the "why" not just the "what"
- Update `RELEASES.md` alongside any change worth recording (features, bug fixes, or internal refactors) — add a bullet under the current unreleased version's `### Changes`, `### Bug Fixes`, or `### Internal` section

### Data Format Changes Require System-Wide Updates

**CRITICAL**: When changing how data is stored or keyed (e.g., response keys, variable names, option identifiers), search for every location that reads or writes the old format first, then update them all in one change: the component that renders the question, any hook/helper that derives variables from responses, and any calculation utilities (totals, subtotals). Test that variables and calculations still work afterward — don't update just the component and forget the derivation/calculation side.

**Red flags**: "I updated the component but forgot the hook", "variables stopped working after my change", "the calculation logic uses a different key format than storage".

### Communication Guidelines

- **Never agree with or validate user statements before verifying them**
- If a user claims something exists in the codebase, search for it first before responding
- Don't say "You're right!" or similar affirmations until you've confirmed the facts
- Be honest about uncertainty: "Let me check..." is better than premature agreement
- Verify first, respond second

## Quality Assurance Guidelines

### Systematic Approach

Before changing code: read the relevant files completely, plan the steps (TodoWrite for anything non-trivial), execute them together rather than piecemeal, then verify the result makes sense. Avoid "I'll just put this here for now" partial fixes and jumping reactively between unrelated parts of a task.

### Sanity-Check Before Calling It Done

Ask whether the code organization, file placement, and behavior would make sense to someone encountering it fresh — not just whether it technically works. Example: matrix questions require both basic-question and table-layout knowledge, so they don't belong in "Basic" documentation even though implementing them there would be easier.

## Documentation System

The `/docs` route teaches the text format through interactive examples: one route per topic at `app/docs/<section>/page.tsx` (e.g. `app/docs/matrix/page.tsx`), sharing rendering helpers from `components/docs/doc-helpers.tsx`:

- `renderCodeBlock(code)` — renders a static syntax snippet
- `renderExample(code)` — parses `code` with `parseQuestionnaire()` and renders it live via `QuestionnaireViewer`, showing a parse error inline if it fails

`app/docs/page.tsx` just redirects to `/docs/overview`. The sidebar (`components/app-sidebar.tsx`) lists topics in a `navMain` array of `{ title, items: [{ title, section }] }` groups; the active item is derived from the URL pathname, not local state.

**Adding a new topic:**

1. Create `app/docs/<slug>/page.tsx`, following the shape of an existing simple page (e.g. `app/docs/overview/page.tsx`) — heading, description, `renderCodeBlock`/`renderExample` calls.
2. Add `{ title: "...", section: "<slug>" }` to the appropriate group in `navMain`.
3. Place it where its prerequisite concepts are already covered (see "Sanity-Check Before Calling It Done" above), and match the styling of neighboring pages rather than inventing new conventions.

**Docs-specific example rules** (see also "Documentation and Examples" under Code Style Guidelines):

- Every `renderExample()` call must actually parse — check it in the running docs page before committing.
- Don't start example text with `-` at the start of a line unless it's an intentional option — it's read as option syntax.
