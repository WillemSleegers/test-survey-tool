# TODO

## Condition Parser Rewrite (umbrella plan)

Several verified bugs (AND/OR splitting, parentheses, NOT precedence, quote handling, string comparisons) and two architecture items (`new Function`, fail-open evaluation) share one root cause: conditions are evaluated by string-splitting instead of real parsing. Decision: replace the internals with a proper tokenizer + recursive-descent parser. Items below marked *(subsumed by parser rewrite)* are fixed by this work and only need a regression test of their own.

- [x] Build a condition expression parser in `lib/conditions/` — **done** (`lib/conditions/expression-parser.ts`): tokenizer with uppercase-only keywords, conventional precedence (`NOT` > `AND` > `OR`), parentheses, comparison sums, arithmetic without `new Function`; `evaluateCondition` signature unchanged; `logical-operators.ts` deleted; golden corpus in `lib/conditions/condition-evaluator.test.ts`; documented in the docs conditionals page and RELEASES
- [x] Parse-time validation switch-on (step 5 / PR 2) — **done**: `validateConditionSyntax` in `lib/validation.ts` checks every `SHOW_IF` (blocks, pages, sections, questions, options, matrix subquestions) and `COMPUTE` (IF-chain aware) via a dry-run of the condition parser, throwing aggregated located errors; `findUndefinedVariables` rewritten on the tokenizer (`collectConditionVariableReferences`); `condition-parser.ts`/`normalizeOperators` deleted; announced in RELEASES; tests in `tests/parser-condition-syntax.test.ts`

## Bugs (verified)

- [x] Fix AND/OR splitting breaking on unquoted values containing " or " / " and " — **done** via parser rewrite; regression tests cover the sample-survey condition quoted and unquoted
  - `splitOnOr`/`splitOnAnd` (`lib/conditions/logical-operators.ts:47,68`) split case-insensitively and ignore quotes
  - The sample survey is broken by this: `COMPUTE: experienced_user = usage_time IS Several weeks or more AND surveys_created >= 3` (`lib/constants.ts:62`) splits on the " or " inside the option label, so `experienced_user` is always false and the "Overall Assessment" block never shows
  - Quoting the value only appears to work by accident: the split still cuts through quotes and the fail-open default rescues it
  - **Plan**: uppercase-only keywords + quote-aware tokenizer in the parser rewrite. Regression test: the exact sample-survey condition, quoted and unquoted, plus values containing " and "
- [x] Fix question-type detection rejecting options that start with "Q" — **done**: `determineQuestionType` now shares an `isOptionMetadataLine` helper with `parseOptions`, so option detection and option parsing agree; tests in `tests/parser-questions.test.ts`
- [x] Handle parentheses in logical conditions — **done** via parser rewrite; truth-table regression tests added
  - `(a OR b) AND c` with `c` empty evaluates to true: the OR split produces fragments like `"(a"` that fail to parse and default to true
  - **Plan**: parentheses become grouping in the AST. Regression tests: `(a OR b) AND c`, `a AND (b OR c)`, nested groups, with truth tables
- [x] Pass section `reveal` through `getVisiblePageContent` — **done**: `getVisiblePageContent` now spreads the original section instead of listing fields; `section-renderer.tsx` renders the reveal button/panel for titleless sections too; hook tests in `hooks/use-visible-pages.test.ts`
- [x] Strip quotes from `STARTS_WITH` comparison values — **done**: STARTS_WITH is a parser construct now; quoted and unquoted values both tested
  - `STARTS_WITH crime == Yes` works but `STARTS_WITH crime == "Yes"` fails
  - `lib/conditions/expression-evaluator.ts:201` compares against the raw right side instead of using `extractComparisonValue` like normal comparisons
  - **Plan**: one-line fix now (run `rightSide` through `extractComparisonValue` in `evaluateStartsWithComparison`) with a test for both quoted and unquoted; the parser rewrite later models `STARTS_WITH` as an AST node so it shares the normal comparison path
- [x] Fix string variable-to-variable comparisons coercing to numbers — **done**: ==/!= compare as strings unless both sides are numeric; ordered operators stay numeric; tested
  - `name1 == name2` returns true for "Alice" vs "Bob": `lib/conditions/condition-evaluator.ts:230-246` always compares variable-to-variable numerically, and non-numeric strings both become 0
  - Also means any unquoted right-hand value that happens to match a variable name silently changes meaning
  - **Plan**: in the AST evaluator, `==`/`!=` compare as strings unless both operands are numeric; ordered operators (`> < >= <=`) coerce numerically as today. Document in the conditionals docs that a bareword matching a variable name resolves to the variable (and quoting forces a literal). Tests: string-vs-string, string-vs-number, number-vs-number for every operator
- [x] Fix bare `REVEAL:` at page level swallowing NAVIGATION/COMPUTE lines — **done**: `parsePage`'s non-delimited metadata collection now treats all page-level keywords as terminators that return to keyword handling instead of `sections`; tests in `tests/parser-page-metadata.test.ts`. `parseSection`'s equivalent state machine still needs aligning — left for the parser dedup item
- [x] Decide and document `NOT` precedence — **done**: conventional precedence (NOT > AND > OR), documented in the docs conditionals page and RELEASES; repo grep found no surveys relying on the old interpretation
  - `NOT a AND b` currently evaluates as `NOT(a AND b)` (NOT is checked before AND/OR in `lib/conditions/condition-evaluator.ts:72`), not the conventional `(NOT a) AND b`
  - **Plan**: parser rewrite adopts conventional precedence (`NOT` binds tighter than `AND`/`OR`). This is a behavior change: grep existing survey files/tests for `NOT .* (AND|OR)` before shipping and call it out in RELEASES. Document precedence + parentheses in the conditionals docs page
- [x] Fix sample survey in `lib/constants.ts` — **done**: compute's comparison value is quoted (`IS "Several weeks or more"`); "suggesed" typo fixed; covered by `tests/sample-survey.test.ts`

## Validation Gaps

- [x] Validate duplicate variable names on matrix subquestions and breakdown options — **done**: `collectVariableDefinitions` in `lib/validation.ts` collects question, subquestion, breakdown-option, and computed (block/page, per-scope deduped) variable definitions into one `Map<name, location[]>`; `validateVariableNames` rewritten on top of it; `validateConditionReferences`/`validateComputedVariableReferences` reuse it instead of the old `addSectionVariables` duplication. Tests in `tests/validation.test.ts`
- [x] Validate section-level and matrix-subquestion `SHOW_IF` references — **done**: `validateConditionReferences` now checks `section.showIf` per section and `subquestion.showIf` per matrix question; tests in `tests/validation.test.ts`
- [x] Reconsider fail-open condition evaluation — **done**: malformed conditions are rejected at parse time with located errors; the runtime keeps a fail-safe default (visible + console warning) as a last resort; docs conditionals page updated

## Parsed-but-Ignored Features

- [ ] Implement breakdown option `- SHOW_IF:` filtering *(decision: implement, not remove)*
  - Parsed (`lib/parser.ts:911`) and validated, but `components/questions/breakdown-question.tsx` never filters options by it — every row always renders
  - **Plan**:
    1. Add a shared `getVisibleBreakdownOptions(question, variables, computedVariables)` helper in a new `lib/breakdown-calculations.ts` (seed for the existing "Extract shared calculation logic" idea) that returns options with their **original indices**, so `option_N` response keys stay stable when visibility changes
    2. Component: render only visible options; totals/subtotals sum only visible rows (hidden rows keep their stored response but are excluded from calculations, consistent with how hidden questions keep data)
    3. Hook: `calculateBreakdownTotal` and the subtotal pass in `use-questionnaire-responses.ts` use the same helper so derived variables match what's displayed (per the CLAUDE.md rule on coordinated data-format updates)
    4. Tests: hidden row excluded from total; row re-appearing restores its value; subtotal ranges spanning a hidden row; docs example on the breakdown page
- [ ] Reject question-level `VARIABLE:` on matrix questions *(decision: parse error)*
  - Matrix responses are stored per subquestion ID, so `responses[question.id]` never exists and the question-level variable is never populated (`hooks/use-questionnaire-responses.ts:33-34`)
  - **Plan**: in `parseMatrixQuestion`, if a top-level (non-dash) `VARIABLE:` line is present, throw a descriptive error pointing to the per-subquestion `- VARIABLE:` syntax. Remove the now-dead matrix branch registering `item.variable` in the responses hook. Parser test for the error; check docs/examples contain no offending usage

## Architecture / Code Quality

- [x] Remove `useMemo` from questionnaire-viewer
  - Removed both `useMemo` wrappers along with the `useState` cache and invalidation effect; `visibleBlockPages` and `currentComputedVars` are now plain per-render derived values
- [x] Rework lazy computed-variables caching (replaces "Simplify lazy vs eager" idea below)
  - Added pure helpers `computeGlobalValues(blocks, variables)` and `computePageValues(page, variables, globalValues)` to `lib/conditions/computed-variables.ts`; deleted `hooks/use-lazy-computed-variables.ts` and its `setComputedCache`/invalidation effect
  - `use-visible-pages.ts` now requires `getPageComputedVars` (no more eager-fallback branch or unused `blockComputedValues` param) — one evaluation path
  - Verified: `npm run build` and full test suite pass (205 tests); dev server boots and serves `/` and `/survey` with no runtime warnings
- [ ] Remove render-time mutation of shared state
  - `evaluateComputedValues` writes `computedVar.value` back onto the parsed questionnaire (`lib/conditions/computed-variables.ts:59,81,87`)
  - Breakdown rendering mutates `localVariables` while mapping rows (`components/questions/breakdown-question.tsx:233`), making `CUSTOM:` subtotals order-dependent — a custom referencing a later subtotal silently fails
  - **Plan**: (1) grep for readers of `.value` on `ComputedVariable` (PageNavigator/debug UI) and point them at the returned `ComputedValues` map instead, then delete the writes and the `value` field from the type; (2) in breakdown, precompute all subtotal values in a single pure pass before rendering (loop options once, building a `subtotals: Record<variable, number>` map used for `CUSTOM:` placeholder resolution), which also makes forward references work — add a test for a CUSTOM referencing a later subtotal
- [ ] Fix order-dependent variable derivation in responses hook
  - PASS 1 in `hooks/use-questionnaire-responses.ts:104-144` resolves `prefillValue` placeholders against a half-built `variables` object iterated in `responses` insertion order (the order the user answered questions)
  - Two users answering in different orders can get different prefill-derived variables
  - **Plan**: iterate in **questionnaire order** (walk pages/sections/questions, looking up each question's response) instead of `Object.entries(responses)`; keep the two-pass split (simple variables, then prefill/subtotal resolution). Extract the shared breakdown math into `lib/breakdown-calculations.ts` (same helper as the SHOW_IF item). Test: two response objects with identical values inserted in different orders produce identical `variables`
- [x] Replace `new Function` in expression evaluation — **done**: arithmetic evaluated by the parser; injection regression test asserts survey text cannot execute code
  - `lib/conditions/expression-evaluator.ts:42` evaluates survey-derived text as JS; low risk client-side, but arbitrary code execution if surveys are ever shared — a small arithmetic evaluator would close it
  - **Plan**: arithmetic is parsed and evaluated by the same AST as conditions (step 3 of the umbrella plan). Regression tests: nested parens, unary minus, division by zero, and inputs containing `;`, backticks, and `Math.` (must evaluate as plain tokens/0, never execute)
- [ ] Deduplicate parser state machines
  - The identical `createOption` push block appears three times in `parseOptions`
  - The page/section metadata state machines in `lib/parser.ts` are near-copies of each other
  - **Plan**: pure refactor PR, no format changes, behavior-locked by the existing test suite: (1) extract a `pushCurrentOption(options, currentOption)` helper; (2) extract a shared `collectMetadataValue(keyword, lines, terminators)` state machine (single-line / bare / `"""` modes) parameterized by terminator keywords, used by both `parsePage` and `parseSection` — do after the bare-`REVEAL:` bug fix so the fixed semantics are what gets shared
- [ ] Sanity check with `npm run build` + full test suite after each of the above; add a `tests/` regression file per fixed bug

## Documentation Accuracy

- [ ] Rewrite CLAUDE.md "Documentation System" section
  - Describes a single `app/docs/page.tsx` with a `Section` union and switch statement; the real architecture is one route per topic under `app/docs/*/page.tsx` with shared helpers in `components/docs/doc-helpers.tsx`
  - **Plan**: rewrite the section to describe: route-per-topic under `app/docs/<section>/page.tsx`, `renderExample`/`renderCodeBlock` from `doc-helpers.tsx`, `navMain` in `app-sidebar.tsx` with the active section derived from the pathname. Update the "Adding New Documentation" steps (create route directory, add nav item — no type union, no switch). Dry-run the instructions by following them for one existing page to confirm they match reality
- [ ] Correct RELEASES 0.5.0 TOOLTIP/REVEAL claims
  - Claims support on "pages, sections, questions, options, and matrix subquestions" — section REVEAL is broken (see bug above), and radio/checkbox options render neither reveal, tooltip, nor hint (only breakdown options do)
  - **Plan**: after fixing section reveal, either implement option-level reveal/tooltip on radio/checkbox (Low Priority item below) or reword the note to "pages, sections, questions, breakdown options, and matrix subquestions". Whichever lands first closes this; don't let the claim and the code disagree in the next release
- [ ] Localize "none" for empty checkbox arrays
  - Hardcoded English in `lib/text-processing/variable-replacer.ts:130` despite the language context and Dutch support (`ja`/`nee` in value-converter)
  - **Plan**: `formatArrayValue` also hardcodes English "and" for inline lists — fix both together. Add an optional `listFormat: { empty: string; conjunction: string }` parameter threaded through `replacePlaceholders`; components pass values from `useLanguage` (add `lists.none` / `lists.and` keys to the translations). Default stays English so non-component callers don't break. Test with a Dutch survey rendering an empty and a multi-item checkbox variable

## Medium Priority

- [ ] Review tooltip icon positioning layout
  - Tooltip icons now positioned absolutely at -left-8 for consistent left-side placement
  - Main content container has pl-8 padding to accommodate icons
  - Table containers use -ml-8 pl-8 to prevent double-indentation while keeping icons visible
  - Should verify this approach is principled and doesn't cause issues with edge cases
  - Consider whether this pattern scales well for other absolutely positioned elements
  - **Plan**: build a stress-test survey (reveal/tooltip at page, section, question, option, subquestion level; long wrapping labels; nested tables) and screenshot at mobile/tablet/desktop widths. If icons overlap or clip, refactor from absolute positioning to an inline icon slot in a shared header layout component; if it holds up, document the -left-8/pl-8 convention in CLAUDE.md so new components follow it

## Low Priority

- [ ] Render NUMBER question PREFIX/SUFFIX
  - `PREFIX:` and `SUFFIX:` are parsed on number questions (`lib/parser.ts:460-461`) and stored in the type (`lib/types.ts:80-81`)
  - `components/questions/number-question.tsx` does not use these fields
  - Should display prefix/suffix around the number input (e.g., `$ [input] per year`)
  - **Plan**: reuse the prefix/suffix presentation from breakdown's `OptionValueInput` (muted spans flanking the input) — extract it into a small shared component and use it in both places. Document PREFIX/SUFFIX on the number docs page with an example
- [ ] Render matrix TEXT and ESSAY input types
  - Matrix questions parse `inputType` for `text` and `essay` (`lib/parser.ts:714-720`, `lib/types.ts:88`)
  - Only `checkbox` inputType is rendered; `text` and `essay` fall through to radio buttons
  - Should render text inputs or text areas in each matrix cell instead of radio buttons
  - **Plan**: for `text`/`essay` there are no option columns — render one `Input`/`Textarea` per subquestion row (single "response" column), storing the value under `subquestion.id` like other matrix responses so variables keep working. Branch in `matrix-question.tsx` alongside `isCheckboxMatrix`; add a docs example and a parser+render test. Decide explicitly: options present + TEXT type = parse error (fold into "parser validation for malformed input")
- [ ] Render option-level HINT, TOOLTIP, and REVEAL on radio/checkbox questions
  - `- HINT:`, `- TOOLTIP:`, and `- REVEAL:` on options are parsed for all question types (`lib/parser.ts:579-614`)
  - Only breakdown options render these (`components/questions/breakdown-question.tsx:271-280`)
  - `radio-question.tsx` and `checkbox-question.tsx` ignore option hints, tooltips, and reveals
  - Should display muted subtext (hint), info popover (tooltip), or collapsible panel (reveal) on individual radio/checkbox options
  - Related: RELEASES 0.5.0 claims TOOLTIP/REVEAL work on options (see Documentation Accuracy section)
  - **Plan**: extract breakdown's `OptionLabelContent` into `components/questions/shared/option-label-content.tsx` and use it for radio/checkbox option labels (label + tooltip inline, hint below, reveal panel below with per-option `Set` state as in breakdown/matrix). Check tab order isn't disturbed (RevealButton is a button). Update the hints/tooltip/reveal docs pages and close the RELEASES claim
- [ ] Restore RANGE + type detection edge cases (watchlist, no action yet)
  - `CHECKBOX` with no options parses as text; `RANGE:` inside checkbox works (verified) — cover both in parser tests when next touching `determineQuestionType`

## Ideas to Explore

- [ ] Add INTEGER input type for whole numbers only
  - **Use case**: Many survey questions require whole numbers (employee count, age, quantity) where decimals don't make sense
  - **Current limitation**: NUMBER type accepts any numeric value including decimals
  - **Proposal**: Add INTEGER keyword as an input type alongside NUMBER
  - **Example**: ```text
    Q: How many employees work at your location?
    INTEGER

    Q: What is your annual revenue in thousands?
    NUMBER```

  - **Implementation**:
    - Add INTEGER to input type keywords in parser
    - Use `<input type="number" step="1">` for integer inputs
    - Consider adding integer validation (reject decimal input)
    - Works with all question types that support NUMBER (standard questions, breakdown columns)
  - **Priority**: Medium - Common use case, improves UX and data quality

- [ ] Add VALIDATE syntax for question validation with custom error messages
  - **Use case**: Provide real-time validation feedback when responses don't meet specified conditions
  - **Syntax**: Add `VALIDATE:` keyword followed by condition expression and error message
  - **Example**: `text
Q: How many employees does your location have?
NUMBER
VALIDATE: Q1 > 0, "Please enter a positive number"
VALIDATE: Q1 < 10000, "Please verify this number seems unusually high"`
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
  - **Note**: wait for the condition parser rewrite — VALIDATE expressions should reuse the new parser and its parse-time error reporting

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
  - **Plan**: add `HINT:` to `parsePage`'s keyword handling (same single/bare/delimited modes as REVEAL — reuse the shared metadata collector from the parser dedup item), add `subtext?` to the `Page` type, render as muted text under the title in `PageHeader`. Docs update on the pages + hints pages
- [ ] Add parser validation for malformed input
  - **Goal**: Provide clear error messages for common mistakes instead of silently ignoring them
  - **Validation rules**:
    - Throw error if TEXT/ESSAY/NUMBER question has options (e.g., `- Option` lines before `TEXT` keyword)
    - Throw error if breakdown-specific keywords used on non-breakdown questions (COLUMN, EXCLUDE, VALUE, SUBTRACT on non-breakdown)
    - Throw error if PREFIX/SUFFIX used on incompatible question types (currently silently ignored)
    - Throw error if matrix has subquestions but no options
    - Throw error if matrix has question-level VARIABLE (see Parsed-but-Ignored Features)
    - Warn if breakdown option has both `prefillValue` (VALUE) and no `exclude` flag when in `totalColumn`
  - **Benefits**: Users learn correct syntax immediately, fewer "why doesn't this work?" moments
  - **Implementation**: Add validation checks in handler functions that throw descriptive errors
  - **Plan**: implement as a post-parse validation pass alongside the existing validators (they already have the throw-aggregated-errors pattern); one rule per small function, one test per rule. Do after the condition parser lands so condition syntax errors come from the same release
- [ ] Extract shared calculation logic
  - Both `breakdown-question.tsx` and `use-questionnaire-responses.ts` have similar `calculateBreakdownTotal` logic
  - Could extract to shared utility function in `lib/breakdown-calculations.ts`
  - **Plan**: this happens naturally as part of the breakdown `SHOW_IF` item (shared visibility + totals helper) and the order-dependent derivation fix — fold it into whichever lands first rather than doing it standalone
- [ ] Add example questionnaires for documentation
  - Create `docs/examples/breakdown-with-columns.md` showing COLUMN/EXCLUDE usage
  - Create `docs/examples/conditional-logic-advanced.md` for complex SHOW_IF patterns
  - Would help users learn examples through working examples
  - **Plan**: write them as parseable `.md`/`.txt` fixtures under `tests/examples/` (like `checkbox-loop.md`) and add a test that parses every file in that directory, so examples can't rot; link or embed them from the relevant docs pages
- [ ] Enhanced variable validation
  - Validate variable names follow consistent naming convention
  - Check for variable shadowing (same name used in different scopes)
  - Warn about unused variables
  - **Plan**: build on the `collectVariableDefinitions` helper from the duplicate-names item; shadowing = page-computed name colliding with a question variable or block computed (currently silent); unused = defined but never referenced in any condition/placeholder/compute (needs the placeholder scanner too). Ship as warnings surfaced in the upload UI, not hard errors
- [ ] Mobile-first responsive design review
  - **Plan**: audit the main flows (upload, survey with matrix + breakdown tables, docs) at 360px/768px in dev tools; known suspects are wide tables (`overflow-x-auto` exists on matrix — verify breakdown), the -left-8 icon convention (see tooltip positioning item), and the side navigators. File concrete follow-ups per issue found rather than one big refactor
- [ ] ~~Simplify lazy vs eager computed variable evaluation~~ — superseded by "Rework lazy computed-variables caching" under Architecture / Code Quality
- [ ] Add dynamic/repeating pages driven by checkbox selections
  - **Use case**: "Loop" over an arbitrary checkbox selection (e.g. ask a follow-up per selected fruit) without pre-authoring one static page per possible option
  - **Current limitation**: pages are static and fixed in number at parse time; the only way to simulate a loop today is one `SHOW_IF`-gated page per checkbox option (see `tests/examples/checkbox-loop.md`), which doesn't scale to long or changing option lists
  - **Proposal**: a page-template construct (e.g. `REPEAT_FOR: variable`) that gets instantiated once per selected value at runtime
  - **Implementation considerations**:
    - Parser: new template page type, distinct from the current fixed per-page IDs assigned at parse time
    - Variables: need per-instance namespacing so responses don't collide (e.g. `fruits.apples.count` instead of a single `apples_per_week`)
    - Condition system: would need to support indexing/iterating over array variables
    - Response storage and variable extraction: must handle a variable number of instances
    - Navigation: nav items would need to expand dynamically to match the number of selected instances
  - **Priority**: Low - touches most core layers (parser, types, conditions, responses, navigation); current static-per-option pattern is an adequate stopgap for small, fixed option sets
