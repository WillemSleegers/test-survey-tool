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

- [ ] Simplify BREAKDOWN syntax to remove `- Q:` prefix requirement
  - Currently BREAKDOWN supports both `- Option` and `- Q: Option` syntax
  - The `- Q:` syntax was added for compatibility but creates confusion
  - Should standardize on simple `- Option` syntax for BREAKDOWN questions
  - Update PS-industrie.md to use simpler syntax once decided
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

- [ ] Refactor Question type to use discriminated unions
  - Current single Question type has many optional fields that don't apply to all question types
  - Using discriminated unions would provide better type safety and autocomplete
  - Each question type (MultipleChoiceQuestion, BreakdownQuestion, MatrixQuestion, etc.) would have only relevant fields
  - TypeScript could enforce requirements (e.g., breakdown must have options, matrix must have subquestions)
  - Would require refactoring parser and components but improve developer experience
  - **Recommendation**: Wait until text format stabilizes before attempting this large refactor
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
