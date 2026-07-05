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
| Real customer onboarding/setup | draft | `REAL-CUSTOMER-ONBOARDING-AND-PROJECT-SETUP-GUIDE-DRAFT.md` exists and defines the realistic Confluence/Jira/GitHub/BC operating model. |
| Book as project model | draft | `BOOK-AS-PROJECT-MANAGEMENT-MODEL.md` exists. |
| Book ticket backlog | draft | `BOOK-PROJECT-TICKET-BACKLOG-DRAFT.md` exists. |
| Project cast | draft | `PROJECT-CAST-AND-STAKEHOLDERS-DRAFT.md` exists. |
| Project storyline | draft | `PROJECT-STORYLINE-DRAFT.md` exists. |
| Project scene cards | draft | `PROJECT-SCENE-CARDS-DRAFT.md` exists. |
| Training strategy | draft | `TRAINING-STRATEGY-AND-CURRICULUM-DRAFT.md` exists. |
| Role training matrix | draft | `ROLE-BASED-TRAINING-MATRIX-DRAFT.md` exists. |
| Training module cards | draft | First cards exist for environment/company, navigation, chart of accounts and posting groups. |
| Playwright training evidence map | draft | `PLAYWRIGHT-TRAINING-EVIDENCE-MAP-DRAFT.md` exists. |
| Realism standard | draft | `REALISM-STANDARD-DRAFT.md` exists. |
| Data request realism review | draft | First five core/master-data requests were reviewed against realism gates; all are planning-ready but not BC-setup-ready. |
| Spec-driven sideproject | proposed | `SPEC-DRIVEN-SIDEPROJECT-DRAFT.md` and `BCSPEC-PILOT-001-MASTER-DATA-PRODUCT-TRAINING.md` test whether OpenSpec-style workflow helps this BC project. |
| Workbreakdown | draft | Workstreams and epics exist in `BC-IMPLEMENTATION-WORKBREAKDOWN-DRAFT.md`. |
| Jira model | draft | Issue model, labels, statuses and DoR/DoD exist. |
| Goal transition | active-transition | `GOAL-TRANSITION-PROTOCOL.md` and `GOAL-TRANSITION-CARD-2026-07-05.md` exist for the running long-goal agent. |
| Case study core workstream | draft | Detailed WS02 draft exists and links company story, roles, data requests, UAT, training, book and Playwright context. |
| Finance workstream | draft | First detailed workstream draft exists. |
| Master data/product workstream | draft | Detailed WS04 draft exists and compares manual UI, templates, configuration packages, Excel import, API and park routes. |
| Customer data catalog | draft | Initial data requests exist; Jira-ready candidates are tracked separately. |
| Data request Jira candidates | draft | First five candidates exist for core company/organization data and customer/vendor/item master data. |
| Customer data simulation | draft | `CUSTOMER-DATA-SIMULATION-DRAFT.md` exists. |
| Simulated core/master data tables | draft | First fictional planning tables exist for company information, organization model, customers, vendors and items/services; master-data setup remains blocked by dependencies. |
| Decision log | draft | Initial decisions captured. |
| Risk register | draft | Initial risks captured. |
| UAT/training plan | draft | Training strategy, role matrix, evidence map and first module cards exist; more role/process cards still needed. |
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
| WS02 Case Study/Core | draft | draft | partial | draft | draft |
| WS03 Finance Foundation | draft | draft | partial | draft | draft |
| WS04 Master Data/Product | draft | draft | partial | draft | draft |
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
| DEC-007 | Treat the complete book as project-management simulation | accepted |
| DEC-008 | Use recurring fictional characters to drive the project story | accepted |
| DEC-009 | Training material must be role-based and evidence-backed | accepted |
| DEC-010 | Realism is a quality gate for project/book/training artifacts | accepted |
| DEC-011 | Test BCSpec before adopting OpenSpec globally | proposed |
| DEC-012 | Use real customer onboarding and Atlassian-first project setup | accepted |

## Top active risks

| ID | Risk | Severity | Status |
| --- | --- | --- | --- |
| RISK-001 | Raw automation becomes book content | P0 | active |
| RISK-002 | Missing customer data causes arbitrary setup | P0 | active |
| RISK-005 | VAT and compliance claims overreach evidence | P0 | active |
| RISK-004 | Playwright routes are not repeatable | P1 | active |
| RISK-009 | Parallel agent changes create worktree conflicts | P1 | active |
| RISK-012 | Project story becomes too demo-perfect | P1 | active |
| RISK-013 | Spec-driven layer duplicates Jira/project docs | P2 | active |
| RISK-014 | Real setup becomes artificial tool architecture | P1 | active |

## Next recommended work

1. Create route decision cards for numbering, posting groups, payment terms and product posting setup.
2. Create Playwright scenario catalog mapped to WS02/WS03/WS04 UAT and evidence needs.
3. Run `BCSPEC-PILOT-001-MASTER-DATA-PRODUCT-TRAINING.md` as a small spec-driven pilot before adopting OpenSpec globally.
4. Turn `BOOK-PROJECT-TICKET-BACKLOG-DRAFT.md` into workstream-level Jira import candidates.
5. Apply `REALISM-STANDARD-DRAFT.md` to storyline, scene cards and broader customer data simulation.
6. Create workstream-to-book-chapter map.
7. Create project plan review checklist.
8. Expand training module cards for VAT, dimensions and customer/vendor/item master data.
9. After the freeze, resume live work with a read-first foundation/master-data preflight, not blind record creation.

## Update rule

When a new file, workstream or major decision is added:

- update this dashboard
- update `README.md` if it is a new core artifact
- update `REFINEMENT-BACKLOG.md` if the next-step order changes
- add a decision or risk if the route changes
