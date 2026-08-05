# Release Notes

## Version 0.5.1

### Bug Fixes

- **Fixed checkbox/radio `- TEXT` options corrupting their stored value and breaking `SHOW_IF`**: typed text was encoded directly into the response string (e.g. `"Other, namely:" + ": " + "painting"`), which produced a doubled separator whenever the option's own label already ended in punctuation (`"Other, namely:: painting"`), and made `SHOW_IF`/`==` comparisons against the bare option value silently stop matching as soon as any text was typed. Typed text is now stored separately from the selected value, so `responses`/`{variable}` always hold the plain option value(s) selected — conditions keep matching regardless of typed text — while `{variable AS LIST}`/`{variable AS INLINE_LIST}` and other text placeholders join the option's label with its typed text using a single space (`"Other, namely: painting"`), so the label's own punctuation controls how they read together instead of the app inventing a separator
- **Fixed checkbox response order following click order instead of option order**: a checkbox question's stored array (and therefore `{variable AS LIST}`) reflected the order options were checked in, not the order they're declared in the survey. Selections are now always ordered to match the question's option list

### Internal

- `- TEXT` other-text is now lifted into `useQuestionnaireResponses` (an `otherTexts` map alongside `responses`) instead of living in local `useState` inside `checkbox-question.tsx`/`radio-question.tsx`. A new pure `applyOtherText` (`lib/response-variables.ts`) composes it into a separate `displayVariables` object for text rendering, while `variables` (used for `SHOW_IF`/expressions) stays plain. `displayVariables`/`otherTexts` are threaded alongside the existing `variables`/`responses` props through `page-content.tsx` → `section-renderer.tsx` → `question-renderer.tsx` → the question components; removed the now-redundant colon-parsing duplicated in `checkbox-question.tsx`, `radio-question.tsx`, and `lib/utils/tab-index-calculator.ts`

## Version 0.5.0

### Changes

- **Rewritten condition engine**: `SHOW_IF` and `COMPUTE` expressions are now evaluated by a real expression parser instead of string splitting. What this changes for surveys:
  - **Parentheses work**: `SHOW_IF: (age >= 65 OR age < 30) AND consent == Yes` now groups correctly (previously it silently mis-evaluated)
  - **Keywords are UPPERCASE-only**: `AND`, `OR`, `NOT`, `IS`, `IS_NOT`, `STARTS_WITH` etc. are only recognized in uppercase, so unquoted answer values containing words like "or" ("Several weeks or more") are no longer torn apart. Lowercase `and`/`or`/`not` are now treated as plain text
  - **`NOT` binds tighter than `AND`/`OR`**: `NOT a AND b` now means `(NOT a) AND b` (conventional precedence); previously it negated everything after it. No surveys or examples in this repository used the old interpretation
  - **String comparisons fixed**: comparing two text variables (`name1 == name2`) now compares their text; previously both sides were coerced to numbers, making any two non-numeric values "equal"
  - **`STARTS_WITH` accepts quoted values**: `STARTS_WITH crime == "Yes"` now works the same as the unquoted form
  - **No more JavaScript evaluation**: arithmetic is evaluated by the parser itself instead of generated JavaScript code, so survey text can never execute code
- **Malformed conditions are now rejected when a survey is loaded**: every `SHOW_IF` and `COMPUTE` expression — on blocks, pages, sections, questions, options, and matrix subquestions — is syntax-checked at parse time, and errors name the exact location (e.g. `Question "Q3" option "Sometimes" SHOW_IF "mode == (": Unbalanced parentheses`). Previously a broken condition silently kept its content visible; surveys that relied on that will now fail to load until the condition is fixed. The runtime evaluator keeps a fail-safe default (content stays visible plus a console warning) as a last resort for conditions that slip past validation
- **Variable validation is more thorough**: duplicate variable names are now caught across *all* variable-defining locations — question, matrix subquestion, breakdown option, and computed variables — not just question-level `VARIABLE:`. `SHOW_IF` undefined-variable checks now also cover sections and matrix subquestions, matching the coverage questions and options already had
- **`EXCLUSIVE` checkbox options**: A checkbox option can now be marked `- EXCLUSIVE` (indented under the option, like `- TEXT`) so selecting it deselects every other selected option, and selecting any other option deselects it. Useful for options like "None of the above". A question can have more than one exclusive option; selecting one always deselects the others. Exclusive options render with a circular, radio-style indicator to signal this to respondents

- **Multi-line `Q:` text**: Question text can now span multiple lines using `"""` delimiters, the same convention already used by `HINT:`, `REVEAL:`, and `TOOLTIP:`. This lets a question reference a bulleted or numbered list of examples as part of its own text (e.g. "has your employer provided any of the following measures: ...") without those list items being mistaken for answer options
  - Example: `Q: """` on its own line, the markdown content (including a `-` or `*` list), then a closing `"""` on its own line, followed by the actual options

- **Summed comparisons in `COMPUTE:`**: A computed variable can now add up multiple comparisons, e.g. `COMPUTE: hazard_total = heat == Yes + cold == Yes + severe == Yes`, counting 1 for each matching term. Plain numbers can be mixed into the sum, and the result can be used like any other computed variable (placeholders, `SHOW_IF`)

- **`TOOLTIP:` is now a popover, `REVEAL:` is the old inline panel**: The previous `TOOLTIP:` keyword toggled an inline info panel below the element; that behavior is now `REVEAL:`. `TOOLTIP:` instead shows a small popover next to the text on click, for shorter contextual hints. Both are supported on pages, sections, questions, all option types (including multiple-choice and checkbox), and matrix subquestions, and can be combined
  - Existing surveys using `TOOLTIP:` for inline panels should switch to `REVEAL:` to keep the same behavior

- **`HINT:`, `TOOLTIP:`, and `REVEAL:` now render on multiple-choice and checkbox options**: these were already parsed on every option type but silently ignored for anything other than breakdown options. A `- HINT:`/`- TOOLTIP:`/`- REVEAL:` indented under a `-` option now shows the same muted subtext, popover, and collapsible panel as elsewhere

- **Tooltip and reveal icons now sit consistently next to the text everywhere**: pages, sections, questions, breakdown/matrix/multiple-choice/checkbox options previously used two different layouts — a fixed left-margin icon for `REVEAL:` and an icon trailing the text for `TOOLTIP:` — which drifted apart once a label wrapped to multiple lines (the left-margin icon centers on the whole block; text-trailing follows the last line). Both icons now trail the text everywhere, in the same order (tooltip, then reveal), and are sized to fit inside a line of text instead of overhanging it. The page no longer reserves a left icon gutter (`pl-8`), since nothing is positioned there anymore

- **Empty checkbox variables and list conjunctions are now localized**: `{selections}` on an unanswered checkbox variable rendered as the English word "none" and `{colors AS INLINE_LIST}` always joined the last item with "and", regardless of the survey's language setting. Both now follow the current language (Dutch: "geen"/"en")

- **Block-level computed variables are now global**: A `COMPUTE:` defined at block level is visible everywhere in the survey, not just within its own block
  - Block-level computeds can reference each other across blocks (resolved by dependency order)
  - A `SHOW_IF:` on any block, page, section, or question can now reference a computed defined in any other block
  - Page-level computeds remain page-scoped, seeded with the global block-level set
  - Names must be unique across blocks — defining the same compute name in two different blocks is now a validation error
  - Multiple `COMPUTE:` statements for the same name within a single block are still allowed (the default-then-override pattern)

- **Fixed documentation sidebar scrolling**: The sidebar now scrolls independently on long pages instead of overflowing the viewport

- **Updated dependencies**: Bumped all packages to latest versions; added a postcss override to resolve a XSS vulnerability (GHSA-qx2v-qp2m-jg93)

### Bug Fixes

- **Fixed page navigator block visibility**: The page navigator was re-evaluating block `SHOW_IF` conditions using the current page's computed variables instead of the global computed variables, which could cause it to show a different visibility state than the actual survey navigation. The navigator now derives block visibility directly from the viewer's own computation.

- **Hidden pages no longer clutter the nav sidebar**: `NAVIGATION` items were built once at parse time and shown unconditionally, so a page excluded by `SHOW_IF` still appeared in the respondent's sidebar (permanently greyed out). Nav items are now filtered by current page visibility, and reappear automatically once the respondent's answers make the page reachable again. A visible level-2 item whose level-1 parent is hidden is promoted to a top-level entry so it isn't lost from the nav.

- **Fixed dash-bulleted lists inside `"""` blocks being parsed as answer options**: A `-` line inside a delimited `HINT:`, `REVEAL:`, or `TOOLTIP:` block (e.g. a bullet list of examples) was being scraped by the option parser as a real, selectable option in addition to being rendered as text. Delimited content is now correctly excluded from option and question-type detection, so `-` and `*` lists inside any `"""` block render as plain lists and never become options

- **Fixed checkbox options rendering as circles**: All checkbox inputs, not just `EXCLUSIVE` ones, were rendering as full circles instead of rounded squares. The checkbox's corner radius used the theme's `--radius-lg` (10px), which exceeds half the checkbox's 16px size — the browser clamps that to a perfect circle regardless of the intended shape. Non-exclusive checkboxes now use a fixed 4px radius so they render as squares again; `EXCLUSIVE` options are unaffected and still render as circles

- **Fixed matrix tables being too wide with few response options**: The row-label column had a fixed 25% width, so with `table-fixed` layout the remaining 75% was split evenly across however many response-option columns existed — a 2-option matrix (e.g. Yes/No) ended up with very wide, mostly-empty columns. Response-option columns now use a fixed width instead, and the row-label column takes up the remaining space

- **Fixed question type detection rejecting options starting with "Q"**: A question whose options all began with the letter "Q" (e.g. "Quality", "Quantity") was parsed as a plain text question with no options — the option-detection check excluded any dash line starting with "Q" in an attempt to skip matrix subquestion markers (`- Q1: ...`). Option detection now shares the same logic used to actually build the option list, so only real subquestion markers and metadata lines are excluded

- **Fixed section `REVEAL:` content being silently dropped**: Section-level `REVEAL:` text was parsed correctly but never reached the page — the visibility-filtering step rebuilt each section object without copying the `reveal` field over. The reveal button and panel are also no longer restricted to sections that have a title

- **Fixed bare page-level `REVEAL:`/`TOOLTIP:` swallowing later keywords**: When a page used `REVEAL:` or `TOOLTIP:` with no text on the same line, any `NAVIGATION:`, `COMPUTE:`, or `SHOW_IF:` line that immediately followed was absorbed into the reveal/tooltip text instead of being processed — silently losing the page's nav level, computed variable, or visibility condition

- **Fixed the bundled sample survey**: quoted the `experienced_user` COMPUTE comparison value and fixed a typo, so "Load Sample Survey" shows its intended conditional block

- **Fixed breakdown option `SHOW_IF` being silently ignored**: `- SHOW_IF:` on a breakdown row was parsed and validated but never affected rendering — every row always showed regardless of the condition. Hidden rows are now excluded from the table and from totals/subtotals; their stored value is kept and restored if the row becomes visible again

- **Fixed order-dependent variable derivation**: variables were derived by walking responses in the order the respondent answered them, not the order questions appear in the survey. A breakdown row's `VALUE:` placeholder referencing another question's variable could resolve differently (or not at all) depending on the order the two questions were answered, e.g. via back-navigation. Variables are now derived by walking the questionnaire's own page/section/question order, so identical answers always produce identical variables

- **Question-level `VARIABLE:` on a matrix question is now a parse error**: matrix responses are stored per row, so a bare `VARIABLE:` at the question level (as opposed to `- VARIABLE:` under a row) was silently accepted but never populated — any condition, placeholder, or computed variable depending on it just silently never resolved. This now fails to load with a message pointing to the per-row `- VARIABLE:` syntax

- **Fixed forward-referencing `CUSTOM:` breakdown subtotals**: a `CUSTOM:` subtotal formula could only resolve another subtotal's variable if that subtotal appeared *above* it in the option list — the value was written into the lookup map row-by-row as the table rendered, so a reference to a subtotal defined further down silently failed. Subtotals are now precomputed as a single, order-independent pass before any `CUSTOM:` formula is evaluated, so a `CUSTOM:` row can reference any other subtotal's variable regardless of table position. This also fixes the same latent issue in variable derivation (`lib/response-variables.ts`), which shared the identical row-by-row logic

### Internal

- Reduced code duplication across `lib/parser.ts`, `lib/validation.ts`, and `components/questions/breakdown-question.tsx` (~245 lines removed)
- Consolidated variable-definition collection in `lib/validation.ts` into a single `collectVariableDefinitions` helper, reused by both the name-uniqueness and reference validators
- Extracted a shared `BaseOption` type for the fields `Option` and `BreakdownOption` actually have in common (`value`, `label`, `hint`, `reveal`, `tooltip`, `showIf`), and fixed type-narrowing errors in `parser-option-exclusive.test.ts`/`parser-option-text.test.ts` surfaced by `tsc --noEmit`
- Extracted breakdown row visibility/summing into `lib/breakdown-calculations.ts` and the two-pass variable derivation out of `use-questionnaire-responses.ts` into a pure, directly-testable `lib/response-variables.ts`; the hook is now a thin `useState` wrapper around it
- Extracted breakdown subtotal computation (`computeSubtotalValues`/`subtotalVariables`) into `lib/breakdown-calculations.ts`, shared by `breakdown-question.tsx` and `lib/response-variables.ts` instead of being duplicated
- Removed render-time mutation of shared parsed state: `evaluateComputedValues` no longer writes back onto `ComputedVariable.value` (the field is deleted from the type; nothing read it) — computed values are only ever returned, never stored on the parsed questionnaire
- Deduplicated parser state machines in `lib/parser.ts`: a `pushCurrentOption` helper replaces the triplicated option-push block in `parseOptions`; shared `beginMetadataCollection`/`stepMetadataCollection` helpers (single-line/bare/`"""`-delimited, parameterized by a terminator predicate) replace the near-identical `REVEAL`/`TOOLTIP`/`SHOW_IF` state machines duplicated across `parsePage` and `parseSection`
- Extracted `breakdown-question.tsx`'s option label rendering into `components/questions/shared/option-label-content.tsx`, shared by `radio-question.tsx` and `checkbox-question.tsx`
- Removed the gutter/absolute-positioning path for `REVEAL:` icons (`question-header.tsx`, `page-header.tsx`, `section-renderer.tsx`) in favor of the same text-trailing layout used by tooltips and options; deleted the now-unused `pl-8`/`-ml-8` gutter compensation from `questionnaire-viewer.tsx` and `components/ui/table.tsx`

## Version 0.4.0

Released May 2026

### New Features

- **Conditional string values in COMPUTE**: Computed variables can now return strings conditionally
  - `IF <condition> THEN <value> ELSE <value>`: `COMPUTE: label = IF score >= 8 THEN "High" ELSE "Low"`
  - `ELSE IF` chaining: `COMPUTE: label = IF score >= 8 THEN "High" ELSE IF score >= 5 THEN "Medium" ELSE "Low"`
  - One-sided `IF <condition> THEN <value>` (no `ELSE`): leaves the variable unchanged if the condition is false, enabling a default-then-override pattern with multiple `COMPUTE` statements for the same variable
  - Values can be quoted strings, numbers, or references to other variables
  - The condition uses the same syntax as `SHOW_IF`
  - String results can be used in text placeholders (`{label}`) and in `SHOW_IF` comparisons

- **String literal COMPUTE values**: Assign a fixed string to a computed variable with `COMPUTE: category = "high"`

- **Single-line breaks in text**: Single newlines in text content now render as line breaks, making it possible to place text on new lines without creating a new paragraph

### Improvements

- **Package updates**: Updated all dependencies to their latest versions

### Bug Fixes

- **Breakdown option variables recognized in SHOW_IF**: Variables defined on breakdown question options (via `- VARIABLE:`) are now correctly recognized during validation, so referencing them in `SHOW_IF` conditions no longer produces a false "undefined variable" error

### Removed

- **Static survey pages**: Removed all hardcoded survey routes (e.g. `/r1-groothandel`, `/r8-bouw`) along with their API routes and source files — these were added to share URLs that immediately loaded a specific survey, but are no longer needed

---

## Version 0.3.1

Released January 2026

### New Features

- **Section SHOW_IF support**: Sections can now be conditionally shown or hidden based on variables and responses
  - Uses the same `SHOW_IF:` syntax as pages and questions
  - Hidden sections and their questions are excluded from page completion tracking
  - Example: `SHOW_IF: is_manager == Yes` on a `##` section heading

- **Section TOOLTIP documentation**: Section-level tooltips are now documented with interactive examples
  - The tooltip rendering was already implemented but undocumented — an info icon appears next to the section heading and toggles the tooltip content
  - Uses the same `TOOLTIP:` syntax as pages and questions (including multi-line `"""` delimiters)

- **Page Navigator documentation**: Added dedicated documentation page explaining the Page Navigator feature
  - Covers overview, how to open it, and its features (page status indicators, jump-to-page, completion tracking)

### Breaking Changes

- **Removed `- ESSAY` and `- OTHER` option modifiers**: Only `- TEXT` is now supported for adding text inputs to options
  - `- ESSAY` and `- OTHER` were functionally identical to `- TEXT` and have been removed to simplify the syntax
  - Surveys using `- ESSAY` or `- OTHER` on options should replace them with `- TEXT`

### Improvements

- **URL-based documentation routing**: Each documentation section now has its own URL
  - Refreshing the page stays on the current section instead of resetting to Overview
  - Sections are bookmarkable and shareable (e.g., `/docs/matrix`, `/docs/conditionals`)
  - Implemented as static Next.js routes with a shared layout

- **Polished documentation**
  - Went over the documentation pages and added clarifications where needed, improved consistency between pages, and improved styling

- **Documentation language override**: Documentation examples now always render in English regardless of the user's language setting
  - Added `defaultLanguage` prop to `LanguageProvider` to force a specific language
  - Prevents Dutch placeholders and button labels from appearing in documentation

- **Expanded Overview page**: Added detailed introductory text explaining what TST does and its design philosophy

- **Collapsible navigation sections**: The chevron on expandable navigation items is now an independent click target
  - Clicking the chevron toggles expand/collapse without navigating
  - Clicking the item text still navigates (and auto-expands if collapsed)
  - Previously, expanded sections could not be collapsed

### Bug fixes

- **Documentation state bug**: Fixed a bug where navigation between pages in one documentation example affected the navigation state in another documentation example
  - Added `key={activeSection}` to force React to remount examples when navigating between sections
  - Previously, navigating in one section's example could affect examples on other pages

---

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
  - Delimited content collection moved outside the `-` prefix check to capture all lines
  - Supports option-level syntax: `- HINT: """` followed by multi-line content then `"""`
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

- **Changed to more formal Dutch placeholders**
  - Changed "Voer je antwoord in..." to "Voer uw antwoord in...

### Breaking Changes

- **Delimiter syntax change**: Replaced triple dashes (`---`) with triple quotes (`"""`) for multi-line content
  - **Reason**: Triple dashes conflict with Markdown setext heading syntax, causing Prettier to corrupt survey files
  - **Old syntax**: `HINT: ---` followed by content then `---`
  - **New syntax**: `HINT: """` followed by content then `"""`
  - **Impact**: All multi-line HINT and TOOLTIP blocks must be updated
  - **Migration**: Use find-and-replace to change `---` on delimiter lines to `"""`
  - **Benefit**: Survey `.md` files can now be safely formatted with Prettier without corruption

- **Navigation syntax change**: Replaced `NAV:` + `LEVEL:` with single `NAVIGATION:` keyword
  - Old syntax: `NAV: Section Name` followed by `LEVEL: 1`
  - New syntax: `NAVIGATION: 1` placed after page title (page title becomes navigation label)
  - Navigation is now page-based metadata instead of separate structure
  - Pages have unique IDs for reliable navigation highlighting
  - Single source of truth - no page duplication between BLOCKS and navigation

### New Features

- **Navigation settings**: Added setting to control whether respondents can jump to unvisited pages
  - New toggle in Settings: "Allow Navigation to Unvisited Pages"
  - Default behavior: respondents can only navigate to visited or current pages
  - When enabled: respondents can jump to any page in the navigation sidebar
  - Setting persists in localStorage across sessions

- **SEPARATOR support for breakdown questions**: Added missing parser support for separator rows
  - `- SEPARATOR` keyword now recognized in breakdown questions
  - Creates empty rows for visual organization between option groups
  - Example: Place separator between different cost categories
  - Separator rows are excluded from calculations automatically

- **Improved computed value display in breakdown questions**: Placeholder shown when values aren't available
  - When CUSTOM calculations reference unavailable variables, shows `–` instead of `€\{variable\}.000,-`
  - When VALUE (prefillValue) uses unavailable variables, shows `–` instead of escaped placeholders
  - Once variables become available, calculated values display normally with proper formatting
  - Applies to both SUBTOTAL rows with CUSTOM and regular options with VALUE

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

### Bug Fixes

- **Fixed duplicate question IDs across blocks**: Question IDs are now unique across all blocks
  - Bug introduced in 0.3.0 parser refactor: each block reset the question ID counter, causing questions in different blocks to have duplicate IDs (Q1, Q1, Q2 instead of Q1, Q2, Q3)
  - This caused block-level SHOW_IF conditions to fail because variable derivation would pick up the wrong question's variable
  - Added test suite to prevent regression

- **Fixed paragraph spacing in text content**: Text with blank lines between paragraphs now renders correctly
  - Fixed parser bug where blank lines between content paragraphs were incorrectly skipped
  - Removed redundant `questionLineSet` check that was marking blank lines as question lines
  - Added paragraph spacing CSS (`mb-4`) to properly space separate paragraphs
  - Added test suite for paragraph spacing with 4 test cases

- **Restored `- TEXT` option modifier**: This option-level modifier was lost during parser refactor
  - `- TEXT` sets the `allowsOtherText` flag on options
  - Allows respondents to provide free text input when selecting specific options
  - Works with both multiple choice and checkbox questions
  - Added test suite for option text inputs

### Improvements

- **Markdown-based text formatting**: Removed `whitespace-pre-wrap` CSS and let Markdown handle paragraph breaks naturally
  - Removed `whitespace-pre-wrap` from all text rendering components (section text, question hints/tooltips, page headers)
  - Added global CSS rules for paragraph and list spacing (`mb-3` with `last:mb-0`)
  - Content now uses standard Markdown convention: double newlines create separate paragraphs with proper spacing
  - Benefits: cleaner code, consistent spacing, proper semantic HTML, no CSS overrides needed
  - Removed redundant wrapper divs that only held the CSS class

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
