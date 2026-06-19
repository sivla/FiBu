# Sandbox Instance Autopilot Mode

Purpose: keep Business Central autonomy consistent for FiBu Buch 5 without weakening the hard instance boundary.

## Hard boundary

- The Business Central instance must stay `MCP_1_20260210`.
- Never operate in production or another instance.
- Never show or commit `.env`, `playwright/.auth/`, reports, traces, videos, screenshots or secrets unless explicitly requested and safe.
- Do not invent business truth. Evidence must state what was observed and what remains unproved.

## Instance-scoped autonomy

Inside `MCP_1_20260210`, the autopilot may use sandbox freedom when the active case allows it and evidence is written:

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
- `agent:subagent-plan` is optional. Use it for strong-model review, book changes, posting/setup judgement, conflicting evidence/state, large diffs, blocked/failed live runs or unclear next-case selection.
- UI-first remains the default. API shortcuts need explicit case permission.

## Stop if

- The URL or UI no longer shows `MCP_1_20260210`.
- Company context is unclear before a data-changing action.
- Cleanup or trace status is unknown after creating a draft or posting.
- The active case does not allow the risky action being considered.
