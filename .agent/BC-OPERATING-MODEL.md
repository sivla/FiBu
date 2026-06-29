# Business Central Operating Model

This file defines how agents operate Business Central for FiBu Buch 5. It is a compact rule layer for UI-first, evidence-first work.

## Core rule

Every Business Central step must have:

- goal
- scope
- precondition
- action
- postcondition
- evidence

If one of these is missing, the agent must stop or downgrade the action to read-only diagnosis.

## Gate is not stop

A gate is a checkpoint, not the final product. If the checkpoint is green and the next Business Central step is clear, allowed by the active case and evidence-ready, continue toward the process route: document setup/context, enter values, capture Preview Posting when unlocked, execute/post when unlocked, trace ledgers, then sync book and coverage.

Do not end a run only because one header field, one line field, one screenshot or one result JSON exists. End only when the next step would be unsafe, unscoped, blocked, outside the active case, or missing a cleanup/trace plan.

Repeated blockers must become at least one of: Playwright pattern, BC atlas entry, book learning point, helper/capability improvement or explicit rejected path.

For Deep-/Execute-Laeufe gilt zusaetzlich Marathon mode: single-case completion is not enough. A final report is allowed only when `npm run agent:marathon:check` passes or a hard stop is documented. Read-only route comparisons do not count as execute progress.

## Active instance boundary

The hard Business Central boundary is the active instance in `.agent/state/current.json` and `.agent/state/project_state.json`.

- Current active target world is Universaarl: instance `playthru`, first target company `UNIVERSAARL-DE`, legal name `Universaarl GmbH`.
- Never leave the active State instance.
- Company switches are allowed inside the active instance when the active case allows them and the result documents previous company, target company, purpose, timestamp and reuse/cleanup status.
- New sandbox/target companies are allowed inside the active instance only with clear names, source/template notes, purpose, setup status and registry/state evidence. Creating `UNIVERSAARL-DE` is a book process, not a prerequisite.
- Evidence must always state the instance and company.
- If the visible URL or shell suggests another instance, stop immediately and write a blocked result.
- `MCP_1_20260210`, `RM-DEMO`, Rhein-Main/RM-* and CRONUS are legacy laboratory references. Keep their evidence intact, but do not use them as active target truth.

## UI-first rule

- Business Central work is UI-first by default.
- API shortcuts are forbidden unless a case explicitly allows and documents the exception.
- If data must be created or changed, the project needs a UI click path for it.
- Page Inspection and Personalize are diagnostic tools, not replacement paths for user-facing instructions.

## No blind clicks

Do not:

- press Enter in Tell Me when results are ambiguous
- click unscoped `New`, `Post`, `Preview`, `Ship`, `Invoice`, `Payment`, `OK` or `Yes`
- confirm a dialog before visible dialog text is captured
- claim a screenshot proves a value that is not visible

## Smart Decision Gate

Before any effective action, apply `.agent/SMART-DECISION-GATE.md` and write a Smart Decision Card in the case, result or evidence README. Effective actions include company creation/switching, setup or master-data changes, draft/document changes, dialog confirmation, wizard finish, Preview Posting, posting, payment, cleanup, reversal, content-changing book patches and final/proven coverage or atlas marking.

The decision must compare alternatives, check book context, source/evidence basis, expected effect, risk, fallback and beginner explanation. If the decision cannot be made, keep the route read-only and document the blocker instead of acting.

## Safety gates

These actions are default locked:

- Preview Posting
- Post
- Ship
- Invoice
- Ship and Invoice
- Payment
- acquisition
- depreciation
- setup change
- API shortcut

Company switch is not a global hard lock inside `MCP_1_20260210`; it is a case-controlled sandbox action with mandatory documentation.

Unlock risky actions only when the active case allows them, the company and instance are confirmed, expected result and evidence plan are known, and cleanup/no-duplicate rules are clear.

Posting-like actions are not never-actions inside a controlled sandbox/target instance; they are default-locked actions that become allowed only when the active case explicitly unlocks them. The evidence plan must name the source document, expected posted document or register if visible, expected ledger/entry trace and whether the result is intentionally kept or cleaned up.

`forbiddenActions` are hard stops. `defaultLockedActions` are gates: within the active State instance they may be unlocked by the active case when the fachliche Pruefung, evidence plan, trace/cleanup path and correction path are documented.

## Fachliche Pruefung before effective actions

Before setup changes, master-data changes, Preview Posting, posting, receive/invoice/payment, company changes or keep-draft decisions, document compactly:

- business case and target state
- affected modules, master data and setup
- expected source document, posted document/register and ledger/subledger/inventory/bank/tax effects
- risk, correction path and duplicate/cleanup or keep strategy
- screenshots/evidence to capture before and after

After the action, document actual effect, document/entry numbers if visible, expected-vs-actual delta, error/correction if any, and cleanup/trace status. A blocker is not an end state while safe UI routes or existing atlas/evidence knowledge remain untried.

Sandbox companies and drafts are replaceable learning objects; evidence, posted traces and documented findings are not.

## Screenshot truth

A screenshot is evidence only if the visible image shows the claimed business proof.

Examples:

- If codes are hidden, the screenshot is not proof for those codes.
- If the grid is too narrow, retake in wide layout or hide FactBox.
- If the image shows only a diagnostic/error path, label it as debugging or rejected.

## Evidence labels

Always separate:

- `labor`
- `book-candidate`
- `final`
- `rejected`
- `de-final-open`

CRONUS-USA lab evidence is not a German final proof.

## State over chat

The current repo state is authoritative. Old chat context is only a hint.

Start with `.agent/state/current.json`, project state, coverage state, active case and the compact context pack. Read large book or evidence files only when the state or selected skill requires it.

## Tools over guessing

Prefer deterministic local tools before model judgment:

- JSON validation
- capability check
- skill validation
- encoding check
- git diff check
- compact context pack

Escalate to Judge or Big Brain only for risk, contradiction, BC/FiBu judgment or architecture decisions.

## Skill budget

Default: load at most three skills.

Use more only when the active case or budget profile explicitly justifies it. More skills are useful only when each skill answers a different required gate.

## Book changes

Book patches must be:

- evidence-backed
- small
- status-labeled
- beginner-readable
- clear about lab vs final proof

Do not write broad BC theory without source or evidence.

## Zero Open Questions Gate

Every unclear Business Central object or behavior must be closed by evidence, source, allowed object analysis or a final classification. Use `playwright/projects/fibu-book5/BC-ZERO-OPEN-QUESTIONS-POLICY.md` and `.agent/state/open_questions_register.json`.

No final book claim, `complete` coverage mark or final atlas mark is allowed while the related register item is still unresolved. `open` is not an acceptable end-of-run status.

## Next Step Decision Gate

Before executing the next queue item, run the lookahead check from `.agent/NEXT-STEP-DECISION-GATE.md`. Review current state, last evidence, current company/page/setup situation, dependencies, source/evidence readiness and the next 3 to 5 planned cases.

The queue is a plan, not a dogma. If a case is obsolete, blocked, missing setup, missing source basis or better replaced by UI discovery, update the queue or case-state before executing.
