# TODO

## High Priority

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

- [ ] Enhanced variable validation
- [ ] Mobile-first responsive design review
- [ ] Simplify lazy vs eager computed variable evaluation
  - Consider consolidating dual evaluation paths for computed variables
  - Remove fallback complexity if not essential
