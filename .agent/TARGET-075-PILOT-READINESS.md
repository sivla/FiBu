# TARGET-075 Pilot Readiness

Status: prepared, freeze still active
Case: `TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK`
Purpose: first read-only return pilot after the improvement freeze.

## Decision

TARGET-075 remains the best first pilot after the freeze because it checks the Universaarl Foundation context without setup writes, master data, drafts, Preview Posting or Posting.

Do not resume TARGET-073 as the next live case. TARGET-073 is parked until a materially new active-editor/helper hypothesis exists.

## Quality audit review

`npm run agent:quality:audit` was reviewed before this readiness note. The audit does not block TARGET-075, but it limits what TARGET-075 may prove.

| Audit risk | Decision for TARGET-075 |
| --- | --- |
| `tsconfig.json` covers only 5 of 450 TypeScript files | Do not use `tsc` as proof of full project health. Use local agent checks plus Playwright `--list` for this pilot. |
| Direct `storageState` references exist | TARGET-075 must start with auth/context checks. Wrong auth, wrong instance or wrong company blocks the pilot. |
| Many waits, force clicks and coordinate clicks exist in legacy tests | TARGET-075 stays read-only. No force-click value entry, no coordinate editing, no unscoped `New/Edit/Post/OK`. |

## Required before live execution

- `npm run agent:resume:check`
- `npm run agent:preflight`
- `npm run check:encoding`
- `npx playwright test --list playwright/projects/fibu-book5/tests/target-075-chart-of-accounts-reopen-and-setup-consistency-check.spec.ts`
- explicit freeze lift or active-case confirmation that TARGET-075 may run
- stored auth must resolve to `playthru / UNIVERSAARL-DE`

## Allowed pilot actions

- Open Business Central only after freeze lift.
- Confirm instance `playthru`.
- Confirm company `UNIVERSAARL-DE`.
- Open Foundation pages read-only.
- Capture screenshot truth and compact evidence.
- Classify what is visible, missing, unclear or unsafe to verify.

## Still forbidden in TARGET-075

- setup write
- master data write
- document or draft creation
- Preview Posting
- Posting
- payment
- cleanup/delete
- API shortcut
- TARGET-073 Page 472 active-editor retry

## Book effect

TARGET-075 can support a beginner-facing Foundation boundary: which chart/setup context is visible before the book moves into master data or process documents.

It cannot prove final SKR04 completeness, VAT correctness, posting readiness, master-data readiness, or German compliance.
