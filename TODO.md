# TODO

## High Priority

- [x] Implement delimiter-based multi-line parsing for tooltips/hints
  - ✅ Added support for `---` delimiters to mark complex tooltip/hint content
  - ✅ Delimiter must be on the same line as keyword (e.g., `TOOLTIP: ---`) to avoid lookahead issues
  - ✅ Simple single-line tooltips work without delimiters
  - ✅ Complex multi-line content with lists requires `---` opening and closing delimiters
  - ✅ Works for all contexts: question-level, option-level, and subquestion-level tooltips/hints
  - ✅ Backward compatible with single-line tooltips/hints
- [x] Implement COLUMN/EXCLUDE keywords for breakdown questions
  - ✅ Added `COLUMN:` keyword to organize breakdown options into multiple value columns
  - ✅ Added `TOTAL_COLUMN:` to specify which column values contribute to total
  - ✅ Added option-level `VARIABLE:` to store individual option values
  - ✅ Added `VALUE:` for calculated read-only option values
  - ✅ Added `EXCLUDE` keyword to display options without including in totals
  - ✅ All calculation functions respect exclude flag (calculateTotal, calculateSubtotal, calculateBreakdownTotal)
- [ ] Add BREAKDOWN documentation to text-format-guide.tsx
  - Currently missing from user-facing documentation
  - Should document: BREAKDOWN, COLUMN, TOTAL_COLUMN, VALUE, VARIABLE (option-level), EXCLUDE, SUBTRACT
  - Belongs in "Intermediate" section (requires understanding tables and variables)
- [ ] Remove hardcoded bold styling from SUBTOTAL rows
  - Currently SUBTOTAL rows have `className="font-bold"` hardcoded in the component
  - This prevents users from controlling text styling via Markdown in the SUBTOTAL label
  - Should remove `font-bold` class and let users add `**bold**` in Markdown if desired
  - Applies to both single-column (line 266) and multi-column (line 466) layouts
  - Gives users full control over formatting (bold, italic, etc.) via Markdown
- [ ] Fix forward slashes in question options causing variable comparison issues
  - Forward slashes in option text break conditional logic when comparing variables to option values
  - Need to investigate escaping or normalization in condition evaluation
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
