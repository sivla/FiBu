# Improvement Freeze

Status: active
Started: 2026-07-05

Consolidated decision: `.agent/PROJECT-DECISION.md`.

The freeze is not a permanent stop. It pauses TARGET-073 and prevents another blind VAT Page 472 editor retry. TARGET-074 is completed as the local foundation checkpoint. The prepared resume pilot is TARGET-075 as a read-first Chart of Accounts / Foundation consistency check when the resume conditions below are met.

## Purpose

Pause the live Business Central execution queue and improve the project system before another book/playthrough run.

The immediate goal is better book quality, better Playwright control of Business Central, stronger reusable skills, and clearer rules for when an agent must research instead of guessing.

## Frozen live queue

Active queue item at freeze start:

- `TARGET-073-VAT-PAGE472-ACTIVE-EDITOR-ROUTE-DECISION`
- Source state: `.agent/state/current.json`
- Case file: `.agent/state/cases/target-073-vat-page472-active-editor-route-decision.json`

Until this freeze is lifted, do not run Business Central live cases, do not continue VAT Page 472 editor probing, and do not execute setup, master data, draft, preview, posting, payment, cleanup or company-switch actions.

Allowed work during the freeze:

- local static audits
- helper and skill design
- capability registry cleanup
- book-quality rules
- source/research workflow improvements
- documentation consolidation
- selftests that do not open Business Central

## Resume conditions

Resume live queue only after:

- `npm run agent:preflight` passes
- `npm run check:encoding` passes
- `npm run agent:quality:audit` has been reviewed
- the next live case explicitly references the relevant skill/capability IDs
- the active case confirms whether the freeze is lifted or the queue is deliberately re-ordered
- TARGET-075 remains read-only unless a later case explicitly unlocks setup or master-data writes

## Immediate improvement priorities

1. Make TypeScript and Playwright risk visible before live work.
2. Convert repeated blockers into skills or capabilities.
3. Require source research for Business Central facts that are not proven by local evidence.
4. Separate book-reader text from internal evidence language.
5. Reduce direct, duplicated Playwright patterns in tests by moving stable patterns into `playwright/core/bc`.
