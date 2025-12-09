# Release Notes

## Version 0.2.1

Released December 2025

### Bug Fixes

- Fixed React key uniqueness warnings by using array indices instead of option values as keys across all question types

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
