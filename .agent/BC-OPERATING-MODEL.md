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

## Sandbox instance boundary

The hard Business Central boundary is the sandbox instance `MCP_1_20260210`.

- Never leave `MCP_1_20260210`.
- Company switches are allowed inside `MCP_1_20260210` when the active case allows them and the result documents previous company, target company, purpose, timestamp and reuse/cleanup status.
- New sandbox companies are allowed inside `MCP_1_20260210` only with clear test names, source/template notes, purpose, setup status and registry/state evidence.
- Evidence must always state the instance and company.
- If the visible URL or shell suggests another instance, stop immediately and write a blocked result.

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

Posting-like actions are not never-actions inside `MCP_1_20260210`; they are default-locked actions that become allowed only when the active case explicitly unlocks them. The evidence plan must name the source document, expected posted document or register if visible, expected ledger/entry trace and whether the result is intentionally kept or cleaned up.

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
