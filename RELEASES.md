# Release Notes

## Version 0.3.0

Released December 2025

### Major Changes

- **Parser refactor**: Complete rewrite using chunk-based hierarchical architecture
  - Reduced parser code from ~2600 lines to ~1100 lines (60% reduction)
  - Hierarchical parsing: Questionnaire → Blocks/NavItems → Pages → Sections → Questions
  - Type-specific parsers for all 7 question types
  - Eliminated indentation-based parsing - dash markers now identify metadata
  - Improved maintainability and extensibility

### Improvements

- **Type system cleanup**: Removed redundant and confusing types
  - Removed `VisiblePageContent` wrapper type - now use `Section[]` directly
  - Removed `MatrixOption` type - matrix questions now use standard `Option` type
  - Removed unused `Subquestion` fields: `subtract`, `subtotalLabel`, `value`
  - Renamed `ComputedVariables` → `ComputedValues` for clarity (map of values, not array of definitions)
  - Removed `ParsedQuestion` type that duplicated the `Question` discriminated union

- **Simplified code fence handling**: Removed unnecessary complexity in parser
  - Eliminated `shouldParse` flag that was tracked throughout the entire parsing pipeline
  - Reduced parser complexity by ~40 lines of code fence tracking logic
  - Code fences in section content are preserved naturally for markdown rendering
  - No functional changes - markdown code blocks still render correctly

- **Section titles now display**: Section headings (after `##`) are now rendered as visible h2 elements
  - Section `content` field is now optional (no empty strings stored)
  - Updated documentation examples to demonstrate section usage
  - Fixed section content rendering bug where page titles appeared as section content

### Documentation

- Added 7 standard example files demonstrating text format features:
  - basic-survey.md - Common question types
  - conditional-logic.md - SHOW_IF demonstrations
  - matrix-questions.md - Matrix question variations
  - multi-page.md - Multi-page survey with sections
  - breakdown-budget.md - Basic breakdown with computed variables
  - breakdown-advanced.md - Advanced breakdown features
  - range-syntax.md - RANGE syntax examples

### Testing

- All 36 parser tests passing after refactor
- Expanded test coverage for RANGE syntax and breakdown features

---

## Version 0.2.2

Released December 2025

### New Features

- Added SHOW_IF support for matrix subquestions - rows can now be conditionally shown/hidden based on responses
- Added RANGE syntax for generating numeric options (e.g., `RANGE: 1-10` creates options 1, 2, 3, ..., 10)
- Redesigned documentation navigation with survey-style card layout
- Added dedicated `/survey` route for better browser back button behavior

### Improvements

- Browser back button now properly returns to home page from surveys
- Reduced shadow on navigation sidebars from `shadow-sm` to `shadow-xs` for more subtle styling
  - Navigation shadows now match input element styling for consistency

### Breaking Changes

- **Subquestion VARIABLE syntax changed**: Use `- VARIABLE:` (with dash) instead of `VARIABLE:` (without dash)
  - This makes all subquestion modifiers consistent with dash prefix: `- HINT:`, `- TOOLTIP:`, `- VARIABLE:`, `- SHOW_IF:`

### Bug Fixes

- Fixed matrix question parser bug where questions with subquestions were incorrectly classified as `multiple_choice` instead of `matrix` type

### Testing

- Added Vitest testing framework
- Added comprehensive parser test suite with 13 tests covering all question types
- Tests validate correct question type detection and conditional subquestion behavior

---

## Version 0.2.1

Released December 2025

### Bug Fixes

- Fixed React key uniqueness warnings by using array indices instead of option values as keys across all question types
- Fixed matrix question parsing bug where questions with subquestions were incorrectly classified as multiple_choice instead of matrix

### Improvements

- Removed hardcoded bold styling from SUBTOTAL rows - users can now control formatting via Markdown
- Added comprehensive BREAKDOWN documentation covering all features

### Removed

- Removed TOTAL_COLUMN feature - use EXCLUDE on individual rows instead for better flexibility

---

## Version 0.2.0

Released December 2025

### New Features

#### BREAKDOWN Question Type

Added a new question type for collecting numeric data in table format with automatic totals and subtotals.

- Automatic total calculation across all options
- Support for subtotal rows with automatic or custom calculations
- Multi-column layouts with column-specific totals
- Header rows and separator rows for visual organization
- Question and option-level PREFIX and SUFFIX to add units (e.g., currency information)
- Read-only calculated values using VALUE keyword
- VARIABLE support for storing individual row values (including totals)
- EXCLUDE keyword to display options without including in totals
- SUBTRACT keyword for deductions in calculations

#### TOOLTIP Support

Added tooltips for contextual help.

- Tooltips work at page-, section-, question-, and option-level tooltips on page titles
- Multi-line tooltip support with delimiter syntax (TOOLTIP: ---)

#### Documentation

Added a dedicated documentation page.

- Organized by topic: Survey Structure, Question Types, Dynamic Features, Customization
- Live interactive previews for every feature
- Side-by-side code and rendered output
- Sidebar with nested navigation

#### Text Editor with Auto-Save

Added a text editor to draft surveys directly in the app with automatic localStorage persistence.

### Improvements

#### Improved multi-line HINT text

- HINT text can now reliably span multiple lines using triple dashes (---) as a delimiter

#### Navigation

- Navigation visibility now defaults to on with "Hide Navigation" toggle
- Improved parent navigation items - now clickable to jump to first child page
- More stable hover and active states

#### UI/UX

- Improved section spacing for better visual hierarchy

#### Settings

- Default language changed to Dutch (nl) to match typical survey content

#### Developer Experience

- Implemented discriminated union types for better type safety

### Removed

- Removed navigation validation that prevented surveys without explicit NAV declarations

---

## Version 0.1.0

Initial Release

### Core Features

#### Text-Based Survey Creation

Create surveys using a simple text format that gets parsed into an interactive questionnaire.

#### Question Types

- Multiple choice (radio buttons)
- Checkbox (multi-select)
- Text input (single line)
- Essay (multi-line textarea)
- Number input
- Matrix questions (table layout with rows and columns)

#### Survey Structure

- Multi-page surveys with navigation
- Sections for organizing questions
- Blocks for grouping pages

#### Dynamic Features

- Variables for storing and referencing responses
- Conditional logic (SHOW_IF) for dynamic surveys
- Conditional text for dynamic question wording
- Computed variables with arithmetic expressions
- STARTS_WITH operator for testing multiple variables

#### Customization

- Hints for additional question context
- Markdown formatting support
- List formatting (bullet lists and inline lists)

#### File Handling

- Upload .txt or .md files
- Drag and drop support

#### Help

- Load Sample Survey
- Text Syntax Guide

#### Settings

- Language selection (Dutch/English)
- Navigation visibility toggle
- Navigation position (left/right)
