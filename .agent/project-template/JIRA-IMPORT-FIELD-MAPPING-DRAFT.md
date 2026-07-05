# Jira Import Field Mapping Draft

Status: draft
Purpose: Field mapping for turning the Universaarl data-package Jira rows into a controlled Jira CSV/import shape.
Source: `JIRA-IMPORT-ROWS-DATA-PACKAGES-DRAFT.md`
Last reviewed: 2026-07-06

## Boundary

This file is an import-control artifact. It does not create Jira issues, does not authorize Business Central setup, and does not replace the team's actual Jira field configuration.

Use it before any CSV export or Jira import so the project team can confirm field names, workflow values and custom fields.

## Operating model

Default mode: single orchestrator.

Specialist input is optional. A Jira/Confluence Blueprint Agent may review this mapping if the actual Jira project has non-standard fields, but it must not rewrite canonical project files in parallel. The orchestrator owns the final import shape.

## Required Jira field mapping

| Source column | Target Jira field candidate | Import handling | Required | Validation rule |
| --- | --- | --- | --- | --- |
| Issue key candidate | External ID or local reference custom field | Keep stable local key; do not force Jira issue key. | yes | Must be unique in this import batch. |
| Issue type | Issue Type | Map to approved issue types only. | yes | Allowed: Data Request, Decision, Task. If Jira lacks Data Request or Decision, map to Task and preserve type in labels and description. |
| Summary | Summary | Import directly. | yes | Must be short, human-readable and start with the business need. |
| Workstream | Component, custom field or label | Prefer Component or custom Workstream field; fallback label. | yes | Must match the workstream catalogue. |
| Epic | Epic Link, Parent, custom field or label | Use project convention; do not create new hierarchy ad hoc. | yes | Must map to an existing or planned epic. Multiple values stay in description if Jira field allows only one. |
| Source package | Description and label | Preserve package provenance. | yes | Must reference one simulated package. |
| Customer owner | Custom field or Description | Use People field only if fictional project users exist; otherwise description. | yes | Must remain simulated/fictitious. |
| Internal owner | Assignee, custom field or Description | Assign only if actual Jira users exist; otherwise description. | yes | Must not invent real user accounts. |
| Priority | Priority | Map P1/P2/P3 to Jira priority scheme. | yes | Must use approved local priority mapping. |
| Status | Initial workflow status | Usually import as To Do/Backlog and keep source status in description. | yes | Do not import blocked rows as Done. |
| Blocks BC setup | Custom checkbox, label or Description | Preserve as control gate. | yes | Rows with yes must block write/setup tasks until resolved. |
| Depends on | Issue links after import or Description | Import as text first; add links after real issue keys exist. | no | Must not silently drop dependencies. |
| Labels | Labels | Import directly after cleanup. | yes | Lowercase, hyphenated where possible, no secret/customer-confidential values. |
| Acceptance criteria | Description | Put under an Acceptance criteria heading. | yes | Must be testable or reviewable. |
| UAT impact | Description | Put under UAT impact heading. | yes | Must name what UAT is unlocked or protected. |
| Training impact | Description | Put under Training/handbook impact heading. | yes | Must name role or module if known. |
| Playwright evidence need | Description and label | Preserve read-first/write/evidence need. | yes | Must say whether Playwright is read-only, write-gated or not needed. |
| Next action | Description or first checklist item | Preserve as immediate task direction. | yes | Must not authorize BC writes by itself. |

## Value mappings

### Issue type

| Source value | Preferred Jira issue type | Fallback if unavailable |
| --- | --- | --- |
| Data Request | Data Request | Task with labels `data-request`, `customer-data` |
| Decision | Decision | Task with labels `decision`, `needs-decision` |
| Task | Task | Task |

Do not create new Jira issue types just because the draft uses richer project language. If the target Jira project is simple, keep the semantics in labels, components and description sections.

### Priority

| Source value | Jira priority candidate | Meaning |
| --- | --- | --- |
| P1 | High | Needed before foundation, setup or master-data work can proceed safely. |
| P2 | Medium | Needed soon, but not blocking the immediate foundation checkpoint. |
| P3 | Low | Useful follow-up or later-phase refinement. |

### Status

| Source value | Import workflow candidate | Meaning |
| --- | --- | --- |
| jira-ready | Backlog or To Do | Ready for Jira creation, not necessarily ready for BC setup. |
| blocked | Blocked or To Do with `blocked` label | Needs decision/source/data before execution. |
| blocked-by-foundation | Blocked or To Do with `blocked-by-foundation` label | Wait for finance/setup foundation proof. |
| blocked-by-finance-foundation | Blocked or To Do with `blocked-by-finance-foundation` label | Wait for posting group/finance foundation. |
| blocked-by-vat-source-and-setup | Blocked or To Do with `blocked-by-vat` label | Wait for VAT source and setup decision. |
| ready-after-freeze | Backlog or To Do with `ready-after-freeze` label | May become executable after freeze/resume gate. |
| ready-after-foundation | Backlog or To Do with `ready-after-foundation` label | Depends on foundation readiness. |

## Description template

```text
Business purpose:

Source package:

Customer owner:

Internal owner:

Acceptance criteria:

BC setup gate:
- Blocks BC setup:
- Dependencies:
- Required decisions:

UAT impact:

Training/handbook impact:

Playwright evidence need:

Next action:

Notes:
- Values are simulated unless explicitly confirmed later.
- This issue does not authorize Business Central writes.
```

## Import readiness checklist

| Check | Required before import | Status |
| --- | --- | --- |
| Jira project key confirmed | yes | open |
| Supported issue types confirmed | yes | open |
| Priority mapping confirmed | yes | draft |
| Workstream storage chosen | yes | open |
| Epic/parent storage chosen | yes | open |
| Blocks BC setup storage chosen | yes | open |
| Dependency-link process chosen | yes | draft-after-import |
| Labels cleaned | yes | draft |
| Description template accepted | yes | draft |
| No real secrets/customer data | yes | required |

## First import batch recommendation

Start with a small batch, not the full project backlog:

1. `DR-CORE-COMPANY-001`
2. `DEC-CORE-TAX-001`
3. `DR-CORE-ORG-001`
4. `DEC-ORG-DIM-001`
5. `DR-MD-CUST-001`

Reason: this proves the import shape across Data Request, Decision, dependency, blocked setup and Playwright-read-first semantics without flooding Jira.

## Critical review

| Question | Answer |
| --- | --- |
| Jira-ready? | The mapping is ready for team review, not for blind import. |
| BC-setup-ready? | No. This is project-control work only. |
| Specialist needed? | Not for this draft. Use a Jira/Confluence Blueprint review only when actual Jira fields are known. |
| Biggest risk | Treating import status as implementation permission. Keep `Blocks BC setup` visible. |
| Next concrete step | Review `JIRA-IMPORT-PREVIEW-DATA-PACKAGES-FIRST-BATCH.csv` against the actual Jira project fields before any import. |
