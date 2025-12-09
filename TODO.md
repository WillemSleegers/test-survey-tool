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

- [ ] Review tooltip icon positioning layout
  - Tooltip icons now positioned absolutely at -left-8 for consistent left-side placement
  - Main content container has pl-8 padding to accommodate icons
  - Table containers use -ml-8 pl-8 to prevent double-indentation while keeping icons visible
  - Should verify this approach is principled and doesn't cause issues with edge cases
  - Consider whether this pattern scales well for other absolutely positioned elements
- [ ] Remove subquestions feature from BREAKDOWN questions
  - Currently BREAKDOWN supports subquestions with `- Q:` syntax for hierarchical breakdowns
  - This feature is unnecessary - flat options with descriptive labels work better
  - Subquestions add complexity (3-column layout) and confusion
  - The `- Q:` syntax was added for compatibility but creates ambiguity
  - Should remove this feature entirely and standardize on flat `- Option` syntax
  - Use descriptive labels like "Energiekosten: Waarvan aardgas" instead of parent-child structure
  - Simpler to understand and maintain, consistent with other BREAKDOWN questions
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

## Ideas to Explore

- [ ] Add SUFFIX support for BREAKDOWN questions to handle thousands formatting
  - **Use case**: Allow writing "1" to display as "1,000" when values represent thousands
  - **Problem**: When totaling many values like "1000", the sum displays as "1000,000" instead of "1,000,000"
  - **Challenge**: The suffix separator (e.g., ",000") doesn't automatically apply to calculated totals
  - **Potential solution**: SUFFIX keyword that applies formatting to individual inputs but converts to actual numbers for calculations, then reformats the total
  - **Example syntax**:

    ```text
    Q1: BREAKDOWN
    SUFFIX: ,000
    - Option 1: NUMBER
    - Option 2: NUMBER
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
- [ ] Refactor parser to use specialized parsing functions per question type
  - **Problem**: Current parser is a single large state machine handling all question types with shared conditional logic
  - **Proposal**: Split into specialized parser functions (e.g., `parseTextQuestion()`, `parseBreakdownQuestion()`, `parseMatrixQuestion()`)
  - **Approach**:
    1. Look ahead from `Q:` line to determine question type (scan for type keywords or `- Q:` pattern)
    2. Call specialized parser function for that type
    3. Each function returns the correct discriminated union type directly
    4. Extract shared logic (HINT, TOOLTIP, VARIABLE) into helper functions
  - **Benefits**:
    - Separation of concerns - each question type parser is isolated and self-contained
    - Simpler logic - no more "does this question type support this keyword?" conditionals
    - Easier to understand - each parser function is readable on its own
    - Easier to test - unit test each question type parser independently
    - No ParsedQuestion needed - return proper types directly
    - Easier to add new question types
  - **Challenges**:
    - Need to extract and reuse shared parsing logic (hints, tooltips, variables)
    - Look-ahead logic needs to scan for type keywords without consuming lines
    - Buffer management for multi-line content (TOOLTIP: ---, HINT: ---)
  - **Priority**: Medium - Would significantly reduce parser complexity, but requires careful design
  - **Next steps when ready**:
    1. Design look-ahead function to determine question type
    2. Create proof-of-concept for simplest type (TEXT) to validate approach
    3. Extract shared parsing helpers (parseHint, parseTooltip, parseVariable, etc.)
    4. Implement specialized parsers one by one
    5. Replace main parser logic to dispatch to specialized functions
- [ ] Add validation for incompatible feature combinations
  - Warn if breakdown option has both `prefillValue` (VALUE) and no `exclude` flag when in `totalColumn`
  - Warn if `COLUMN` used without `BREAKDOWN`
  - Warn if `TOTAL_COLUMN` references non-existent column number
  - Would help catch user errors early
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
