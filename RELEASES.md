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

- **Single-pass parsing architecture**: Refactored `parseSection`, `parsePage`, and `parseBlock` to use state machines
  - Fixed bug where multi-line delimited tooltip content was rendered twice (as metadata and as content)
  - Each parser uses specific state names describing exactly what's being parsed (e.g., `'tooltip' | 'showif' | 'content'` instead of vague `'normal'`)
  - Structural markers (`#`, `##`, `BLOCK:`) extracted immediately before entering state machine
  - `parseSection`: Single-pass state machine extracts section metadata (TOOLTIP, SHOW_IF) and builds content/questions in one loop
  - `parsePage`: Single-pass state machine extracts page metadata (NAVIGATION, TOOLTIP, COMPUTE) before building sections inline
  - `parseBlock`: Single-pass state machine extracts block metadata (SHOW_IF, COMPUTE) before building pages inline
  - Removed unused helper functions: `identifySections`, `identifyPages`, `parseComputedVariables`
  - Benefits: No duplicate content bugs, no keyword leakage between levels, more efficient parsing, explicit state-driven logic

- **Multi-line hints and tooltips for options**: Fixed option-level delimited content parsing
  - `parseOptions` and `parseBreakdownOptions` now handle multi-line HINT/TOOLTIP content correctly
  - Delimited content collection moved outside the `- ` prefix check to capture all lines
  - Supports option-level syntax: `- HINT: ---` followed by multi-line content then `---`
  - `identifyQuestions` updated to skip delimited keyword blocks when identifying question boundaries

- **CUSTOM keyword support**: Added missing parser support for custom subtotal calculations
  - `CUSTOM:` keyword now recognized as breakdown option metadata
  - Enables custom expressions for SUBTOTAL calculations: `CUSTOM: {{salary + bonus}}`
  - Previously treated as separate option row; now correctly parsed as SUBTOTAL metadata

- **Consistent TOTAL styling**: Removed hardcoded styling from TOTAL rows
  - Removed `font-bold`/`font-semibold` classes from TOTAL row rendering
  - Added Markdown rendering to TOTAL labels for user-controlled styling
  - TOTAL labels now support Markdown formatting like SUBTOTAL labels: `**Total Revenue**`
  - Removed redundant `hover:bg-transparent` classes from all TableRow elements

### Breaking Changes

- **Navigation syntax change**: Replaced `NAV:` + `LEVEL:` with single `NAVIGATION:` keyword
  - Old syntax: `NAV: Section Name` followed by `LEVEL: 1`
  - New syntax: `NAVIGATION: 1` placed after page title (page title becomes navigation label)
  - Navigation is now page-based metadata instead of separate structure
  - Pages have unique IDs for reliable navigation highlighting
  - Single source of truth - no page duplication between BLOCKS and navigation

### New Features

- **Interleaved text and questions**: Text can now appear between questions in natural flow
  - Questions end at blank lines, allowing content to be interspersed with questions
  - Section structure changed to ordered `items` array (content and question items)
  - Example:

    ```text
    Q: First question?
    TEXT

    Here's some explanatory text between questions.

    Q: Second question?
    NUMBER
    ```

### Improvements

- **Parser maintainability**: Extracted helper functions to reduce duplication
  - Added `parseComputedVariables()` helper - eliminated duplication between `parsePage()` and `parseBlock()`
  - Added `createOption()` helper - reduced boilerplate in option creation across 4 locations
  - Reduced parser by 28+ lines while maintaining readability

- **Type system cleanup**: Removed redundant and confusing types
  - Removed `VisiblePageContent` wrapper type - now use `Section[]` directly
  - Removed `MatrixOption` type - matrix questions now use standard `Option` type
  - Removed unused `Subquestion` fields: `subtract`, `subtotalLabel`, `value`
  - Renamed `ComputedVariables` → `ComputedValues` for clarity (map of values, not array of definitions)
  - Removed `ParsedQuestion` type that duplicated the `Question` discriminated union

- **Simplified parser data structures**: Removed unnecessary object wrappers and dead code
  - Eliminated `Chunk` wrapper type - chunks are now just `string[]` instead of `{ lines: string[] }`
  - Removed `Line` wrapper type - lines are now plain strings instead of `{ line: string, index: number }`
  - Removed unused `index`, `startIndex`, and `endIndex` fields that were assigned but never read
  - Eliminated `shouldParse` flag that was tracked throughout the entire parsing pipeline
  - Reduced parser complexity by ~60 lines of unnecessary object creation and field tracking
  - Code fences in section content are preserved naturally for markdown rendering
  - No functional changes - parser works exactly the same way with simpler data structures

- **Section titles now display**: Section headings (after `##`) are now rendered as visible h2 elements
  - Section `content` field is now optional (no empty strings stored)
  - Updated documentation examples to demonstrate section usage
  - Fixed section content rendering bug where page titles appeared as section content

### Documentation

- **Improved documentation page design and readability**:
  - Simplified Overview example to showcase markdown-like text format without BLOCKS or NAVIGATION
  - Unified navbar component across all pages with proper width matching
  - Improved typography: larger font sizes for primary content, muted colors reserved for secondary content only
  - Consistent Usage section styling: all sections now use bullet points instead of mixed patterns
  - Added visual styling for inline code elements (monospace, background, padding, rounded corners)
  - Removed "Documentation" header from sidebar for cleaner design
  - Fixed Overview item styling in sidebar to match other items
  - Updated Questions section description to be more concrete
  - Added comprehensive documentation system guidelines to CLAUDE.md

- **Improved documentation UX**:
  - Reversed example order: code appears first, then rendered result (follows standard technical documentation pattern)
  - Fixed auto-scroll bug: documentation examples no longer cause page to scroll to top when navigating between survey pages
  - Removed outdated text-format-guide component reference from CLAUDE.md

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
