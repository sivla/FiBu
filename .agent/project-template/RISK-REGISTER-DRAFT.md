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

### RISK-011 Training material teaches unproven behavior

Workstream: `WS13-UAT-TRAINING-CUTOVER`, `WS14-BOOK-PLAYWRIGHT-LEARNING`
Severity: P1
Probability: medium
Status: active

Impact:

Users may learn steps or checks that are not actually proven in Universaarl, leading to weak UAT, wrong expectations or misleading book content.

Mitigation:

- Use `PLAYWRIGHT-TRAINING-EVIDENCE-MAP-DRAFT.md`.
- Keep training modules in `draft`, `evidence-needed`, `technical-only` or `parked` until source/evidence/UAT gates are clear.
- Translate technical probes into customer-facing exercises only after validation.

### RISK-012 Project story becomes too demo-perfect

Workstream: all workstreams
Severity: P1
Probability: medium
Status: active

Impact:

The book may feel artificial if every data packet is complete, every role is available, every decision is easy and every Business Central path works on first try.

Mitigation:

- Use `REALISM-STANDARD-DRAFT.md`.
- Include realistic imperfections only when they teach project behavior.
- Convert imperfections into data requests, decisions, risks, UAT defects, training notes or book boundaries.
- Avoid drama that does not produce project value.

### RISK-013 Spec-driven layer duplicates Jira/project docs

Workstream: `WS01-GOVERNANCE`, `WS14-BOOK-PLAYWRIGHT-LEARNING`
Severity: P2
Probability: medium
Status: active

Impact:

BCSpec or OpenSpec-inspired files may become a second project-management system next to Jira/backlog/dashboard artifacts, increasing maintenance without improving BC setup, training, book quality or Playwright repeatability.

Mitigation:

- Run one pilot before creating a canonical `.agent/spec-driven/` tree.
- Require each BCSpec change to map to concrete workstreams, Jira issue candidates, customer data, evidence, training and book outputs.
- Archive, merge or reject completed BCSpec material instead of leaving parallel stale drafts.
- Prefer normal Jira/backlog templates for small single-file or low-risk changes.

### RISK-014 Real setup becomes artificial tool architecture

Workstream: `WS01-GOVERNANCE`, `WS14-BOOK-PLAYWRIGHT-LEARNING`
Severity: P1
Probability: medium
Status: active

Impact:

The project may over-focus on Confluence/Jira/OpenSpec/GitHub mechanics and stop feeling like a real Business Central customer implementation.

Mitigation:

- Use `REAL-CUSTOMER-ONBOARDING-AND-PROJECT-SETUP-GUIDE-DRAFT.md` as the operating model.
- Keep Jira simple and human-manageable.
- Use Confluence pages only when they explain project knowledge, requirements, decisions, training or handbook content.
- Use GitHub only for technical artifacts and evidence.
- Reject any tool structure that does not help a PM, consultant, architect, key user, trainer, customer or evidence reviewer.

### RISK-015 Multi-agent work creates conflicting project truth

Workstream: `WS01-GOVERNANCE`, `WS14-BOOK-PLAYWRIGHT-LEARNING`
Severity: P1
Probability: medium
Status: active

Impact:

Multiple agents may edit overlapping files, make inconsistent BC route decisions, duplicate Jira/Confluence structures, promote unreviewed claims or conflict in the `playthru` sandbox.

Mitigation:

- Use `AGENT-OPERATING-MODEL-DRAFT.md`.
- Keep one orchestrator accountable for project truth.
- Use specialist agents for bounded research, review, curation or cleanup.
- Require orchestrator merge before specialist output becomes canonical.
- Allow only one Playwright/BC execution agent in `playthru` at a time.
- Track whether agent roles reduce rework and conflicts; if not, scale back to single-agent execution.

### RISK-016 Concept review cadence becomes review theater

Workstream: `WS01-GOVERNANCE`, `WS14-BOOK-PLAYWRIGHT-LEARNING`
Severity: P2
Probability: medium
Status: active

Impact:

Recurring reviews may create more documentation without improving project realism, customer clarity, BC route quality, evidence quality, training usefulness or book curation.

Mitigation:

- Use `CONCEPT-REALISM-REVIEW-CADENCE-DRAFT.md`.
- Require each review to produce a no-change verdict, decision update, risk update, backlog change, parked/rejected item or source/evidence follow-up.
- Keep source hierarchy clear: Microsoft and Universaarl evidence outrank external advisory sources.
- Timebox session and weekly-style reviews.
- Reduce cadence if reviews do not lead to better project decisions.
