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

- `Block`: Top-level container with pages and computed variables
- `Page`: Contains questions, sections, and content
- `Question`: Individual survey questions with various types
- `Section`: Groups questions within pages
- `ComputedVariable`: Dynamic calculations based on responses

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

### ❌ DO NOT USE:

- `useMemo()` - React Compiler handles memoization automatically
- `useCallback()` - React Compiler optimizes function references
- `React.memo()` - Compiler optimizes component re-renders
- Manual optimization patterns that interfere with compiler analysis

### ✅ DO USE:

- Simple, clean component code - let the compiler optimize
- Standard React hooks (`useState`, `useEffect`, etc.)
- Pure functions and predictable state updates
- Avoid side effects during render (compiler expects pure render functions)

### Key Principles:

- Write code as if there's no performance optimization needed
- React Compiler will handle memoization and re-render optimization
- Focus on correctness and readability over manual performance tuning
- Avoid setState calls during render cycles - they interfere with compiler analysis

## Code Style Guidelines

### Comments:

- Keep comments concise and factual
- Avoid referential comments that mention previous versions or changes
- Comments should describe current behavior, not historical context
- Example: Use "Add slots for text inputs" not "Add slots for text inputs (now always visible)"

### Code Cleanliness:
- Prefer a clean codebase over maintaining backwards compatibility
- Avoid legacy aliases or deprecated exports
- Remove unused code rather than commenting it out
- Refactor directly rather than adding workarounds

### Linting and Code Quality:
- **Never use ESLint disable comments** (`// eslint-disable`, `/* eslint-disable */`)
- **Never use TypeScript suppressions** (`@ts-ignore`, `@ts-expect-error`)
- Fix underlying issues instead of suppressing warnings
- For intentionally unused parameters, use `void parameterName` or proper underscore naming
- Maintain zero build warnings without rule suppressions

### Documentation and Examples:
- Keep survey examples realistic and purposeful - avoid forced feature demonstrations
- Use progressive examples that build naturally (Basic → Intermediate → Advanced)
- Centralize reusable content in constants.ts rather than duplicating
- Maintain consistent terminology ("survey" vs "questionnaire") throughout user-facing text

### Development Workflow:
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

### Communication Guidelines:

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
