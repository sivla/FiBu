# Risk Register Draft

Status: draft
Purpose: Projekt-, Fach-, Buch- und Automationsrisiken fuer Universaarl sichtbar halten.
Last reviewed: 2026-07-05

## Risk template

```text
Risk ID:
Title:
Workstream:
Severity: P0 | P1 | P2 | P3
Probability: low | medium | high
Impact:
Trigger:
Mitigation:
Owner:
Related data requests:
Related decisions:
Status:
```

## Severity rules

- `P0`: can cause wrong BC setup, unsafe write, false final book claim or unrecoverable project confusion.
- `P1`: can block a workstream, UAT, training or repeatable evidence.
- `P2`: causes rework, weaker book quality or less stable automation.
- `P3`: polish, clarity or later improvement.

## Initial risks

### RISK-001 Raw automation becomes book content

Workstream: `WS14-BOOK-PLAYWRIGHT-LEARNING`
Severity: P0
Probability: high
Status: active

Impact:

The book reads like a test log and may include internal agent language, unproven claims or confusing steps.

Mitigation:

- Require book curation story per epic.
- Separate raw evidence from reader-facing prose.
- Use book status values: raw, book-candidate, final, rejected, blocked.

### RISK-002 Missing customer data causes arbitrary setup

Workstream: all implementation workstreams
Severity: P0
Probability: high
Status: active

Impact:

Chart of accounts, posting groups, dimensions, items and process settings may be invented without business reason.

Mitigation:

- Use customer data catalog.
- Log missing data as blockers.
- Do not finalize setup claims without source, customer model or sandbox evidence.

### RISK-003 Finance foundation becomes too micro-case driven

Workstream: `WS03-FINANCE-FOUNDATION`
Severity: P1
Probability: high
Status: active

Impact:

The project spends too much time proving individual fields without producing coherent book, UAT or process progress.

Mitigation:

- Use workstream-level readiness gates.
- Prefer foundation checkpoints over endless field retries.
- Convert repeated UI issues into helpers/skills.

### RISK-004 Playwright routes are not repeatable

Workstream: `WS14-BOOK-PLAYWRIGHT-LEARNING`
Severity: P1
Probability: high
Status: active

Impact:

Evidence cannot be trusted, and future agents cannot reproduce BC behavior.

Mitigation:

- Use page context guard, active editor proof, screenshot truth and scoped action click.
- Reject fragile force-click/mouse-coordinate routes.
- Create helper backlog for repeated failures.

### RISK-005 VAT and compliance claims overreach evidence

Workstream: `WS03-FINANCE-FOUNDATION`
Severity: P0
Probability: medium
Status: active

Impact:

The book may imply tax correctness that was not proven or reviewed.

Mitigation:

- Keep tax-advisor/legal boundary explicit.
- Use official sources for product semantics.
- Require transaction evidence before claiming posting effects.

### RISK-006 Configuration packages used as shortcuts without understanding

Workstream: `WS11-DATA-MIGRATION-INTEGRATION`
Severity: P1
Probability: medium
Status: active

Impact:

Bulk setup/import may hide field dependencies and create weak training/book explanations.

Mitigation:

- Require implementation route decision.
- Document affected tables/fields.
- Validate imported results in UI and Playwright where possible.
- Teach both manual concept and scalable route.

### RISK-007 Roles and training designed too late

Workstream: `WS09-SECURITY-WORKFLOWS-CONTROLS`, `WS13-UAT-TRAINING-CUTOVER`
Severity: P1
Probability: medium
Status: active

Impact:

The project may configure processes that users cannot operate or approve.

Mitigation:

- Add role and training outputs to every epic.
- Maintain training matrix.
- Define key-user and normal-user boundaries.

### RISK-008 Project documentation becomes noise

Workstream: `WS01-GOVERNANCE`
Severity: P2
Probability: medium
Status: active

Impact:

Too many documents may obscure decisions instead of improving delivery.

Mitigation:

- Each document must answer purpose, owner, decision, data, evidence, training or book impact.
- Use refinement backlog and dashboard.
- Delete or park duplicative docs after audit.

### RISK-009 Parallel agent changes create worktree conflicts

Workstream: all
Severity: P1
Probability: medium
Status: active

Impact:

Concurrent edits may overwrite or confuse project state.

Mitigation:

- Avoid touching active live-run files unless necessary.
- Inspect git status before edits.
- Keep project-template changes isolated.
- Do not revert unrelated changes.

### RISK-010 MCP/tooling capabilities are assumed but unavailable

Workstream: `WS14-BOOK-PLAYWRIGHT-LEARNING`
Severity: P2
Probability: medium
Status: active

Impact:

Agents may plan workflows around tools not installed or not authorized.

Mitigation:

- Maintain MCP registry and local tooling status.
- Treat missing tools as documented constraints.
- Never commit real tenant/auth secrets.
