# Learning System

This project should learn from every run. A run is incomplete if it only produces a result file but does not improve at least one of evidence, book text, Playwright capability, skill guidance or a documented blocker.

## Learning loop

1. Capture the raw observation.
2. Classify it as one of:
   - `bc-domain-fact`
   - `ui-control-pattern`
   - `playwright-helper-pattern`
   - `book-reader-gap`
   - `safety-gate`
   - `source-research-needed`
   - `rejected-path`
3. Decide the durable home:
   - BC atlas or coverage file
   - `.agent/capabilities.json`
   - `.agent/skills/*.md`
   - `playwright/core/bc/*`
   - book draft or click guide
   - open questions register
4. Add a small verification path.
5. Reference the evidence or source that caused the learning.

## Promote to skill

Promote a learning into a skill when at least one is true:

- the same blocker happened twice
- the action is risky enough to require a repeatable gate
- the pattern is needed by more than one module
- an agent repeatedly needs domain knowledge that is not obvious from code
- source research is required before a final book claim

Do not create a skill only because a topic exists. Create it when it changes future behavior.

## Skill backlog

| Candidate | Trigger | First output |
| --- | --- | --- |
| `bc-source-research` | Business Central product, setup, VAT, GoBD, e-invoice, release or best-practice fact is not locally proven | source-backed claim card |
| `bc-active-editor` | A BC grid/list/card field looks editable but Playwright cannot prove a true editor | editor diagnosis JSON |
| `bc-live-run-freeze-review` | Live queue was paused or a case was blocked by repeated UI mechanics | resume/reorder decision |
| `book-claim-auditor` | A book paragraph mixes lab evidence, final claims and internal language | claim boundary patch plan |
| `bc-helper-consolidator` | A test repeats force clicks, timeouts or coordinate logic already seen elsewhere | helper extraction plan |

## Research rule

If the agent does not know a Business Central fact, it must research it before writing a final book claim. Use local evidence first for UI behavior. Use Microsoft Learn, release plans, official implementation guidance or official legal/tax sources for product and compliance claims.

When research is needed, write down:

- question
- source used
- claim allowed
- claim not allowed
- book wording boundary
- evidence/source reference

## Freeze rule

During an improvement freeze, learning work may edit `.agent`, scripts, docs and local helper code. It must not run or mutate Business Central.
