# Sandbox Instance Autopilot Mode

Purpose: keep Business Central autonomy consistent for FiBu Buch 5 without weakening the hard instance boundary.

## Hard boundary

- The Business Central instance must stay `MCP_1_20260210`.
- Never operate in production or another instance.
- Never show or commit `.env`, `playwright/.auth/`, reports, traces, videos, screenshots or secrets unless explicitly requested and safe.
- Do not invent business truth. Evidence must state what was observed and what remains unproved.

## Instance-scoped autonomy

Inside `MCP_1_20260210`, `RM-DEMO` is the laboratory and pre-production company for the book. The autopilot may use sandbox freedom when the active case allows it and evidence is written:

- switch company
- create a clearly named test company
- click `New/Neu`
- edit or delete sandbox records
- create and clean up drafts
- open dropdowns and dialogs
- provoke errors for learning
- run Preview Posting or Posting only when the active case and posting gate allow it
- make setup changes only when the active case and setup gate allow it

`Post`, `Preview Posting`, `Ship`, `Invoice`, `Payment`, acquisition and depreciation are not never-actions inside the sandbox instance. They are default-locked actions that become allowed when the active case explicitly unlocks them and defines the expected evidence trace.

In state files, `forbiddenActions` means hard stop / never allowed. `defaultLockedActions` means locked by default, but unlockable by an explicit active case or gate with evidence, trace and cleanup/keep documentation.

Default-locked actions are gates, not bans. A sandbox run may unlock and execute them in the same bounded case when instance/company, fachliche Pruefung, expected effect, evidence plan, trace/cleanup or keep status, and correction path are explicit.

All `RM-DEMO` results are laboratory evidence. They may improve book drafts, clickguides, learning notes and process designs as `labor-draft`, `labor-proven`, `labor-blocked` or `labor-sufficient-for-book-draft`, but they must not become `german-final-proof`. Relevant process screenshots and entries must later be rebuilt in a German target instance as `german-final-candidate` or `german-final-proof`.

## Documentation required

Every sandbox-changing action must document:

- instance
- previous company and active/target company
- page or process area
- record type and document number, if any
- purpose
- action timestamp when available
- result
- cleanup status or trace status

New companies must also document source/template, setup status, future use and whether they are test-only.

## Default working model

- Standard runs are single-agent with phases: `preflight -> context -> dry-run -> run-plan -> execute one bounded step -> result -> state`.
- Gate-is-not-stop: A successful gate must either continue into the next safe Business Central process step or update the active case so the next run continues the process route. Do not treat a header, line, screenshot or result JSON as the whole process when Preview, Posting, Ledger Trace or Book Sync are the real route.
- Specialist coverage: each run should improve at least one row or fact in `BC-COVERAGE-MATRIX.md`, the BC atlases, screenshot inventory, blocker atlas, bookdraft/clickguide, or Playwright capability notes.
- Knowledge first: before a new discovery route, check existing coverage, page/field/action/posting atlases, screenshot inventory, error atlas, latest evidence and active case notes.
- Process over fragment: prefer complete routes such as document -> values -> Preview -> Posting -> Ledger Trace -> Book Sync. Use micro-gates only to isolate risk, map missing UI mechanics or prove a blocker.
- Every run must produce at least one finished unit: laboratory evidence, Playwright capability improvement, concrete bookdraft/clickguide substance, controlled setup/posting/execute trace or a clear labor/final classification.
- Pure review loops, state-only movement, micro-cases without book/evidence/Playwright value and framework work without a current blocker are not sufficient.
- `agent:subagent-plan` is optional. Use it for strong-model review, book changes, posting/setup judgement, conflicting evidence/state, large diffs, blocked/failed live runs or unclear next-case selection.
- UI-first remains the default. API shortcuts need explicit case permission.

## Stop if

- The URL or UI no longer shows `MCP_1_20260210`.
- Company context is unclear before a data-changing action.
- Cleanup or trace status is unknown after creating a draft or posting.
- The active case does not allow the risky action being considered.
- A blocker is declared while safe UI routes, existing evidence or a concrete helper improvement remain available.
