# Skill: next-test-selector

Use this skill to choose exactly one next run.

## Inputs

- `.agent/state/current.json`
- `.agent/state/coverage_state.json`
- active case file
- relevant gate only if posting, setup or company action might happen

## Decision order

1. Finish a started evidence/process block before starting a new area.
2. Prefer the active case in `current.json` unless a hard safety blocker exists.
3. Never choose Shopify/Online Store for FiBu Buch 5.
4. Do not repeat old reference postings without a new explicit evidence purpose.
5. If the next case could create setup, drafts or postings, load `posting-gate.md`.

## Output

Write one short decision into `last_run_summary.json` and the active case file:

- selected case
- work type
- allowed actions
- forbidden actions
- why this is the next smallest useful step
