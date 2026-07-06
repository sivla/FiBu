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

## Latest local gate snapshot

Last checked: 2026-07-06.

| Gate | Result | Meaning |
| --- | --- | --- |
| `git pull --ff-only` | passed | Branch was already up to date before the readiness refresh. |
| `npm run agent:preflight` | passed | Agent state, budgets, safety, model routing, capabilities and skills are locally consistent. |
| `npm run agent:quality:audit` | passed with known risk findings | The pilot may proceed only as read-first; TypeScript coverage, auth freshness and legacy Playwright flake surface remain bounded risks. |
| `npm run agent:resume:check` | passed locally | TARGET-075 is prepared after freeze lift; this check does not open Business Central and does not lift the freeze. |
| `npm run agent:freeze:status` | freeze active | Live execution remains blocked until the freeze is explicitly lifted or the active case confirms TARGET-075 may run. |
| `npm run fibu:target:foundation-consistency-pilot -- --check` | passed locally | The guarded TARGET-075 runner is ready without opening Business Central. |
| `npm run fibu:target:foundation-consistency-pilot -- --list` | passed, 1 test listed | The TARGET-075 spec is discoverable through the guarded runner. |
| `npm run check:encoding` | passed | Text encoding is clean enough for this readiness package. |

Current decision: stop broad cleanup here. The next useful project movement is either explicit freeze lift plus TARGET-075 live read-first execution, or a narrow local fix only if a gate changes from green to red.

## Required before live execution

- `npm run agent:resume:check`
- `npm run agent:freeze:status`
- `npm run agent:preflight`
- `npm run check:encoding`
- `npm run fibu:target:foundation-consistency-pilot -- --check`
- `npm run fibu:target:foundation-consistency-pilot -- --list`
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

## Required handoff after TARGET-075

After TARGET-075, create or update `FOUNDATION-READINESS-DECISION.md` before selecting any master-data, vendor, customer, item, setup-write, Preview Posting or Posting pilot.

That decision must classify the TARGET-075 evidence as proven, parked, blocked or not enough for setup readiness. A visible page is only read-first evidence; it is not a release to create master data.
