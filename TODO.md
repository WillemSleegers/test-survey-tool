# TODO

## High Priority

- [x] Fix React key uniqueness issue with duplicate option values
  - ✅ Fixed in all question components (matrix, checkbox, radio, breakdown)
  - ✅ Changed from `option.value` to array index for stable, unique keys
  - ✅ Array indices are safe because options are never reordered
- [x] Implement delimiter-based multi-line parsing for tooltips/hints
  - ✅ Added support for `---` delimiters to mark complex tooltip/hint content
  - ✅ Delimiter must be on the same line as keyword (e.g., `TOOLTIP: ---`) to avoid lookahead issues
  - ✅ Simple single-line tooltips work without delimiters
  - ✅ Complex multi-line content with lists requires `---` opening and closing delimiters
  - ✅ Works for all contexts: question-level, option-level, and subquestion-level tooltips/hints
  - ✅ Backward compatible with single-line tooltips/hints
- [x] Implement COLUMN/EXCLUDE keywords for breakdown questions
  - ✅ Added `COLUMN:` keyword to organize breakdown options into multiple value columns
  - ✅ Added option-level `VARIABLE:` to store individual option values
  - ✅ Added `VALUE:` for calculated read-only option values
  - ✅ Added `EXCLUDE` keyword to display options without including in totals
  - ✅ All calculation functions respect exclude flag (calculateTotal, calculateSubtotal, calculateBreakdownTotal)
  - ✅ Removed `TOTAL_COLUMN:` - totals now always show in last column, use EXCLUDE instead
- [x] Add BREAKDOWN documentation to text-format-guide.tsx
  - ✅ Added comprehensive documentation covering all BREAKDOWN features
  - ✅ Documented: BREAKDOWN, COLUMN, VALUE, VARIABLE, EXCLUDE, SUBTRACT, SUBTOTAL
  - ✅ Added examples and clear explanations for each feature
- [x] Remove hardcoded bold styling from SUBTOTAL rows
  - ✅ Removed `font-bold` from both single-column and multi-column layouts
  - ✅ Users can now control formatting via Markdown (e.g., `**bold**`)
- [x] Fix forward slashes in question options causing variable comparison issues
  - ✅ Investigated condition evaluation logic
  - ✅ No actual bug found - string comparisons work correctly with forward slashes
  - ✅ Users can quote values if needed (e.g., `Q1 == "yes/no"`)
- [x] Remove React optimization hooks to comply with React 19 Compiler
  - ✅ Remove `useMemo()` from `components/questions/checkbox-question.tsx:61`
  - ✅ Remove `useMemo()` and `useCallback()` from `hooks/use-questionnaire-responses.ts`
  - ✅ Remove `useCallback()` and `useMemo()` from `hooks/use-visible-pages.ts`
  - ✅ Remove `useCallback()` and `useMemo()` from `hooks/use-lazy-computed-variables.ts`
- [x] Fix disabled validation functions in parser
  - ✅ Re-enabled validation functions in `lib/parser.ts:1115-1117`
  - ✅ Removed associated eslint-disable comments

## Medium Priority

- [ ] Add SHOW_IF support to sections
  - **Motivation**: Sections currently support content and tooltip but not conditional visibility
  - **Benefit**: Would enable conditional showing/hiding of entire groups of questions within a page
  - **Current state**: Sections provide organizational layer (Pages → Sections → Questions) with content, tooltip, and questions
  - **Implementation**:
    - Add `showIf?: string` field to Section type in `lib/types.ts`
    - Update parser to recognize SHOW_IF keyword at section level (similar to page-level SHOW_IF)
    - Update visibility logic in `hooks/use-visible-pages.ts` to evaluate section conditions
    - Ensure section visibility affects all questions within that section
  - **Use case**: Hide entire groups of related questions based on previous responses
  - **Priority**: Medium - Would provide useful organizational capability without breaking existing functionality
- [ ] Review tooltip icon positioning layout
  - Tooltip icons now positioned absolutely at -left-8 for consistent left-side placement
  - Main content container has pl-8 padding to accommodate icons
  - Table containers use -ml-8 pl-8 to prevent double-indentation while keeping icons visible
  - Should verify this approach is principled and doesn't cause issues with edge cases
  - Consider whether this pattern scales well for other absolutely positioned elements
- [x] Remove subquestions feature from BREAKDOWN questions
  - ✅ Investigation showed BREAKDOWN never supported subquestions
  - ✅ The `- Q:` syntax only works for MATRIX questions
  - ✅ BreakdownOption type already excludes subquestions
  - No action needed - this was a misunderstanding
- [x] Clean up legacy mainQuestions array
  - ✅ Removed always-empty `mainQuestions` array from `hooks/use-visible-pages.ts:46`
  - ✅ Updated `VisiblePageContent` type to remove mainQuestions
  - ✅ Verified no code depends on this legacy structure
- [x] Update the README
  - ✅ Removed duplicate TODOs that are now in TODO.md
  - ✅ Updated project description and setup instructions

## Low Priority

- [x] Clean up ESLint disables
  - ✅ Removed unnecessary `@typescript-eslint/no-unused-vars` disables
  - ✅ Fixed underlying issues rather than suppressing warnings
- [x] Remove old format support in parser
  - ✅ Evaluated and removed old `"- A) Option"` format support (line 85-89)
  - ✅ Simplified parser logic by removing unused legacy pattern
- [x] Remove debugging code
  - ✅ Removed `computedCache` exposure from `useLazyComputedVariables`
- [ ] Prevent mouse/trackpad scrolling affecting number inputs in Chrome

## Ideas to Explore

- [ ] Add INTEGER input type for whole numbers only
  - **Use case**: Many survey questions require whole numbers (employee count, age, quantity) where decimals don't make sense
  - **Current limitation**: NUMBER type accepts any numeric value including decimals
  - **Proposal**: Add INTEGER keyword as an input type alongside NUMBER
  - **Example**:
    ```text
    Q: How many employees work at your location?
    INTEGER

    Q: What is your annual revenue in thousands?
    NUMBER
    ```
  - **Implementation**:
    - Add INTEGER to input type keywords in parser
    - Use `<input type="number" step="1">` for integer inputs
    - Consider adding integer validation (reject decimal input)
    - Works with all question types that support NUMBER (standard questions, breakdown columns)
  - **Priority**: Medium - Common use case, improves UX and data quality

- [ ] Add VALIDATE syntax for question validation with custom error messages
  - **Use case**: Provide real-time validation feedback when responses don't meet specified conditions
  - **Syntax**: Add `VALIDATE:` keyword followed by condition expression and error message
  - **Example**:
    ```text
    Q: How many employees does your location have?
    NUMBER
    VALIDATE: Q1 > 0, "Please enter a positive number"
    VALIDATE: Q1 < 10000, "Please verify this number seems unusually high"
    ```
  - **Features**:
    - Multiple validation rules per question
    - Custom error messages displayed to respondent
    - Validation runs on blur or value change
    - Prevents navigation if validation fails
    - Could support cross-question validation (e.g., `Q2 > Q1`)
  - **Implementation considerations**:
    - Parse validation conditions similar to SHOW_IF conditions
    - Store validation rules in question type definitions
    - Add validation state management to response hooks
    - Display error messages near question input
    - Consider validation timing (on change, on blur, on submit)
    - Handle validation for all question types (TEXT, NUMBER, BREAKDOWN, etc.)
  - **Priority**: Medium - Would significantly improve data quality and user experience

- [ ] Add SUFFIX support for BREAKDOWN questions to handle thousands formatting

  - **Use case**: Allow writing "1" to display as "1,000" when values represent thousands
  - **Problem**: When totaling many values like "1000", the sum displays as "1000,000" instead of "1,000,000"
  - **Challenge**: The suffix separator (e.g., ",000") doesn't automatically apply to calculated totals
  - **Potential solution**: SUFFIX keyword that applies formatting to individual inputs but converts to actual numbers for calculations, then reformats the total
  - **Example syntax**:

    ```text
    Q1: BREAKDOWN
    - Option 1: NUMBER
    - Option 2: NUMBER
    SUFFIX: ,000
    ```

  - **Implementation considerations**:
    - Need to strip suffix when storing/calculating values
    - Need to reapply suffix formatting to totals and subtotals
    - Should work with single-column and multi-column breakdowns
    - Consider interaction with VALUE (computed values) and EXCLUDE options
  - **Priority**: Low - Nice-to-have for user convenience, but users can manually add thousands separators if needed

- [ ] Add page-level HINT support
  - Currently only TOOLTIP is supported at page level (requires clicking info icon)
  - HINT is supported for questions, options, and subquestions (always visible below element)
  - Consider adding page-level HINT that displays always-visible text below page title
  - Would provide consistent pattern: TOOLTIP = collapsible, HINT = always visible
  - Use case: Important instructions that should always be visible (e.g., "Round all amounts to thousands")
  - Would require parser changes and PageHeader component updates
- [x] Refactor Question type to use discriminated unions
  - ✅ Implemented discriminated union types for all 7 question types
  - ✅ Each question type (MultipleChoiceQuestion, CheckboxQuestion, TextQuestion, EssayQuestion, NumberQuestion, MatrixQuestion, BreakdownQuestion) has only relevant fields
  - ✅ Added ParsedQuestion as flexible internal type for parser
  - ✅ Updated all components to use specific types
  - ✅ TypeScript now enforces requirements and provides better type safety
  - Benefits: Component-level type safety, compile-time error detection, better IDE autocomplete
- [x] Refactor parser to use lookahead and proper discriminated unions
  - ✅ Implemented lookahead function `determineQuestionType()` that scans ahead to identify question type before creating question objects
  - ✅ Changed parser from reduce to for loop to enable line index tracking for lookahead
  - ✅ Created specialized option types: `Option`, `MatrixOption`, `BreakdownOption`
  - ✅ Converted `ParsedQuestion` to proper discriminated union where each variant has only relevant fields
  - ✅ Added type guard functions: `hasOptions()` and `hasSubquestions()` for safe property access
  - ✅ Updated all handler functions to use type guards before accessing type-specific properties
  - ✅ Modified `handleInputType` to properly handle type changes while maintaining discriminated union integrity
  - **Implementation Details**:
    - Lookahead scans for keywords: TEXT, ESSAY, NUMBER, BREAKDOWN, CHECKBOX, or `- Q:` (matrix indicator)
    - Default type is multiple_choice if no type keyword found
    - Type guards enable TypeScript to narrow union types for safe property access
    - Breakdown-specific handlers check `question.type === 'breakdown'` before accessing breakdown fields
    - Matrix-specific handlers check `hasSubquestions()` before accessing subquestions array
    - Option handlers check `hasOptions()` before accessing options array
  - **Benefits Achieved**:
    - Full type safety throughout parser - TypeScript enforces that only valid fields are accessed
    - No more ParsedOption "bag of all fields" - proper option types based on question type
    - Compile-time error detection prevents accessing properties on wrong question types
    - Better IDE autocomplete and code navigation
    - Easier to add new question types with confidence
  - **Note**: This is a stepping stone improvement. The parser still uses a single state machine rather than specialized parsing functions per type, but type safety is now enforced throughout
- [ ] Refactor parser to use type-driven chunk-based approach
  - **Motivation**: The discriminated union types define exactly what each question needs - the parser should directly mirror this structure
  - **Current problems**:
    - ~40 handler functions with scattered logic
    - Lookahead scans lines twice (once to determine type, again to parse)
    - Mutable state during parsing (question built up incrementally)
    - Type guards needed throughout to work around line-by-line approach
    - Validation is difficult because we don't have complete structure
  - **Proposed approach**: Hierarchical chunk-based parsing with type-specific parsers
    - Parse top-down: Questionnaire → Blocks/NavItems → Pages → Sections → Questions
    - Each level identifies its child chunks and delegates to specialized parsers
    - Type determination happens during chunk identification
  - **Implementation sketch**:
    ```typescript
    // Top level - identify blocks and nav items
    function parseQuestionnaire(lines) {
      const chunks = identifyTopLevelChunks(lines) // blocks, navItems
      return {
        blocks: chunks.blocks.map(parseBlock),
        navItems: chunks.navItems.map(parseNavItem)
      }
    }

    // Block level - identify pages within block
    function parseBlock(lines): Block {
      const pageChunks = identifyPages(lines)
      return {
        name: findKeyword(lines, "BLOCK"),
        showIf: findKeyword(lines, "SHOW_IF"),
        pages: pageChunks.map(parsePage),
        computedVariables: parseComputed(lines)
      }
    }

    // Page level - identify sections within page
    function parsePage(lines): Page {
      const sectionChunks = identifySections(lines)
      return {
        title: extractTitle(lines),
        tooltip: findKeyword(lines, "TOOLTIP"),
        sections: sectionChunks.map(parseSection),
        computedVariables: parseComputed(lines)
      }
    }

    // Section level - identify questions within section
    function parseSection(lines): Section {
      const questionChunks = identifyQuestions(lines)
      return {
        content: extractContent(lines),
        tooltip: findKeyword(lines, "TOOLTIP"),
        questions: questionChunks.map(chunk => parseQuestionByType(chunk))
      }
    }

    // Question level - dispatch to type-specific parser
    function parseQuestionByType(chunk): Question {
      const type = determineQuestionType(chunk.lines)
      switch (type) {
        case "breakdown": return parseBreakdown(chunk.lines)
        case "matrix": return parseMatrix(chunk.lines)
        case "multiple_choice": return parseMultipleChoice(chunk.lines)
        // etc for each type
      }
    }

    // Type-specific parsers - mirror the type definitions!
    const parseBreakdown = (lines): BreakdownQuestion => ({
      type: "breakdown",
      ...parseQuestionBase(lines),
      options: parseBreakdownOptions(lines),
      totalLabel: findKeyword(lines, "TOTAL"),
      prefix: findKeyword(lines, "PREFIX"),
      suffix: findKeyword(lines, "SUFFIX")
    })

    const parseMultipleChoice = (lines): MultipleChoiceQuestion => ({
      type: "multiple_choice",
      ...parseQuestionBase(lines),
      options: parseOptions(lines)
    })

    // Shared utilities
    const parseQuestionBase = (lines) => ({
      id: generateId(),
      text: extractQuestionText(lines),
      subtext: findKeyword(lines, "HINT"),
      tooltip: findKeyword(lines, "TOOLTIP"),
      variable: findKeyword(lines, "VARIABLE"),
      showIf: findKeyword(lines, "SHOW_IF")
    })
    ```
  - **Benefits**:
    - Parser mirrors type structure exactly - easy to understand
    - Type determination happens once during chunking - no need to scan lines twice
    - No mutable state - build complete objects
    - Validation is natural - have full structure before creating object
    - Dramatically fewer functions - ~7 type parsers + shared utilities vs ~40 handlers
    - Type-specific logic is localized in one place
  - **Challenges**:
    - Need robust boundary detection (when does a question end?)
    - Shared keyword parsing (HINT, TOOLTIP, etc.) must be well-factored
  - **Decision**: Pursue this refactor - types are clean and well-defined, making this the right time
- [ ] Add parser validation for malformed input
  - **Goal**: Provide clear error messages for common mistakes instead of silently ignoring them
  - **Validation rules**:
    - Throw error if TEXT/ESSAY/NUMBER question has options (e.g., `- Option` lines before `TEXT` keyword)
    - Throw error if breakdown-specific keywords used on non-breakdown questions (COLUMN, EXCLUDE, VALUE, SUBTRACT on non-breakdown)
    - Throw error if PREFIX/SUFFIX used on incompatible question types (currently silently ignored)
    - Throw error if matrix has subquestions but no options
    - Warn if breakdown option has both `prefillValue` (VALUE) and no `exclude` flag when in `totalColumn`
  - **Benefits**: Users learn correct syntax immediately, fewer "why doesn't this work?" moments
  - **Implementation**: Add validation checks in handler functions that throw descriptive errors
  - **Related**: Could remove complex type-switching logic in `handleInputType` once validation is in place
- [ ] Extract shared calculation logic
  - Both `breakdown-question.tsx` and `use-questionnaire-responses.ts` have similar `calculateBreakdownTotal` logic
  - Could extract to shared utility function in `lib/breakdown-calculations.ts`
  - Low priority - current duplication is minimal and contexts slightly differ
- [ ] Add example questionnaires for documentation
  - Create `docs/examples/breakdown-with-columns.md` showing COLUMN/EXCLUDE usage
  - Create `docs/examples/conditional-logic-advanced.md` for complex SHOW_IF patterns
  - Would help users learn features through working examples
- [ ] Enhanced variable validation
  - Validate variable names follow consistent naming convention
  - Check for variable shadowing (same name used in different scopes)
  - Warn about unused variables
- [ ] Mobile-first responsive design review
- [ ] Simplify lazy vs eager computed variable evaluation
  - Consider consolidating dual evaluation paths for computed variables
  - Remove fallback complexity if not essential
