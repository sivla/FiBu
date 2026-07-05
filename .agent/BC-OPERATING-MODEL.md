# Business Central Operating Model

This file defines how agents operate Business Central for FiBu Buch 5. It is a compact rule layer for UI-first, evidence-first work.

Current consolidated project decision: `.agent/PROJECT-DECISION.md`.

Use that file as the short strategic layer before choosing a live case. It resolves the current freeze conflict: TARGET-073 stays parked, Superrechte remain usable inside the sandbox when the active case allows them, TARGET-074 is completed as the local checkpoint, and the prepared resume pilot is TARGET-075 as a read-first Chart of Accounts / Foundation consistency check rather than another VAT Page 472 editor retry.

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

## Case study architecture

Business Central work is part of a realistic Universaarl implementation, not a collection of isolated clicks. Use `.agent/CASE-STUDY-ARCHITECTURE-GATE.md` before larger setup, master-data, process or book decisions.

Every material decision should connect the BC concept to the company: legal entity, country, currency, fiscal year, SKR04-oriented chart, VAT, departments, locations, product/service portfolio, dimensions, users/roles, process flow and later reporting. If a step cannot be explained from the company story, it is probably too isolated for the book.

The book must explain why the setup exists for Universaarl, which downstream process will use it, and how success is checked in BC. Screenshots and Playwright evidence support that story; they do not replace it.

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

## Consultant setup route decision

For larger setup, migration or master-data topics, the agent must think like a Business Central consultant before choosing a click path. Manual UI entry is useful for learning, field understanding and screenshot evidence, but it is not automatically the best implementation route for a larger company.

Before changing chart of accounts, posting groups, VAT setup, dimensions, number series, templates, customers, vendors, items or bulk setup, compare at least these options when relevant: manual UI entry, assisted setup, configuration packages/RapidStart, Excel import/export, templates, API route, AL extension and a deliberate no-change/park decision. Prefer official Microsoft Learn or implementation guidance for product semantics and use local Universaarl evidence for the concrete UI result.

Configuration packages, imports and APIs are not shortcuts around fachliches Verstaendnis. If one of these routes is selected or proposed, the plan must still explain the affected tables/fields, validation step, dependency checks, rollback/cleanup strategy, reopen proof and how the book will teach both the individual UI concept and the scalable project route.

Before deleting or replacing data, check dependencies: posted entries, referenced setup, master-data usage, default data, system tables, company scope and possible side effects. If this cannot be assessed, do not delete; classify the record as kept, parked, superseded or needing a dedicated cleanup case.

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

## MCP and source tooling

Use `.agent/mcp/MCP-SERVER-REGISTRY.md` before adding or relying on MCP servers. Microsoft Learn Docs MCP is the preferred read-only source path for Business Central product facts; Business Central MCP and AL tooling require their documented gates before they can affect sandbox data, AL publish flows, or book claims. Keep private tenant, auth and connection details in ignored local config files, never in committed project state.

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

## UI Look and Feel Gate

Before declaring a Business Central UI blocker, apply `.agent/BC-UI-LOOK-AND-FEEL-GUIDE.md`. Check overlays, Help/Tour bubbles, FactBox purpose, FastTabs, grid size, focus/maximize controls, horizontal and vertical scroll areas, hidden columns, edit mode, Command Bar overflow and safe personalization/Page Inspection options.

UI-relevant Result JSONs should include `uiErgonomics` so the next run knows which layout routes were tried.
