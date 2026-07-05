# Project Dashboard Draft

Status: draft
Purpose: Kompakte Projektsteuerung fuer Universaarl BC Implementierung, Buch, Training und Playwright-Evidence.
Last reviewed: 2026-07-05

## How to use

This dashboard is the project manager view. It should stay short and point to the detailed files. Update it after meaningful project changes, not after every tiny edit.

## Overall status

| Area | Status | Note |
| --- | --- | --- |
| Project plan | draft | `PROJECT-PLAN-DRAFT.md` exists. |
| Workbreakdown | draft | Workstreams and epics exist in `BC-IMPLEMENTATION-WORKBREAKDOWN-DRAFT.md`. |
| Jira model | draft | Issue model, labels, statuses and DoR/DoD exist. |
| Finance workstream | draft | First detailed workstream draft exists. |
| Customer data catalog | draft | Initial data requests exist, not yet Jira-ready. |
| Decision log | draft | Initial decisions captured. |
| Risk register | draft | Initial risks captured. |
| UAT/training plan | early | Templates exist; full role matrix still needed. |
| Book map | missing | Workstream-to-chapter mapping still needed. |
| Playwright scenario catalog | missing | Needs mapping to workstreams and UAT. |

## Current milestone

Current milestone: `M0 Project mobilized`

Goal:

- Build the project management foundation before expanding every workstream.

M0 exit criteria:

- Project plan exists.
- Workbreakdown exists.
- Jira model exists.
- Documentation cadence exists.
- Artifact templates exist.
- Customer data catalog exists.
- Decision log exists.
- Risk register exists.
- First workstream is expanded as pattern.

Status: mostly drafted, not yet reviewed as final.

## Workstream readiness

| Workstream | Structure | Jira detail | Data requests | UAT/training | Book/evidence |
| --- | --- | --- | --- | --- | --- |
| WS01 Governance | draft | partial | n/a | partial | partial |
| WS02 Case Study/Core | draft | missing | partial | missing | missing |
| WS03 Finance Foundation | draft | draft | partial | draft | draft |
| WS04 Master Data/Product | draft | missing | partial | missing | missing |
| WS05 Purchasing | draft | missing | missing | missing | missing |
| WS06 Sales | draft | missing | missing | missing | missing |
| WS07 Inventory | draft | missing | partial | missing | missing |
| WS08 Warehouse | draft | missing | missing | missing | missing |
| WS09 Security/Workflows | draft | missing | partial | missing | missing |
| WS10 Reporting | draft | missing | missing | missing | missing |
| WS11 Data Migration/Integration | draft | missing | partial | missing | missing |
| WS12 Advanced Areas | draft | missing | missing | missing | missing |
| WS13 UAT/Training/Cutover | draft | missing | partial | draft | missing |
| WS14 Book/Playwright/Learning | draft | missing | n/a | partial | partial |

## Top open decisions

| ID | Decision | Status |
| --- | --- | --- |
| DEC-001 | Treat repo as real BC implementation project | accepted |
| DEC-002 | Separate product model, inventory and warehouse | accepted |
| DEC-003 | Use Finance Foundation as first detailed workstream | accepted |
| DEC-004 | Compare scalable BC implementation routes | accepted |
| DEC-005 | Official sources above community sources | accepted |

## Top active risks

| ID | Risk | Severity | Status |
| --- | --- | --- | --- |
| RISK-001 | Raw automation becomes book content | P0 | active |
| RISK-002 | Missing customer data causes arbitrary setup | P0 | active |
| RISK-005 | VAT and compliance claims overreach evidence | P0 | active |
| RISK-004 | Playwright routes are not repeatable | P1 | active |
| RISK-009 | Parallel agent changes create worktree conflicts | P1 | active |

## Next recommended work

1. Expand `WS02-CASE-STUDY-CORE`.
2. Expand `WS04-MASTER-DATA-PRODUCT`.
3. Create role-based training matrix.
4. Create workstream-to-book-chapter map.
5. Create Playwright scenario catalog mapped to UAT and evidence needs.
6. Convert customer data catalog into Jira `Data Request` candidates.
7. Create project plan review checklist.

## Update rule

When a new file, workstream or major decision is added:

- update this dashboard
- update `README.md` if it is a new core artifact
- update `REFINEMENT-BACKLOG.md` if the next-step order changes
- add a decision or risk if the route changes
