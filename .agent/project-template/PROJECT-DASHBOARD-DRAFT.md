# Project Dashboard Draft

Status: draft
Purpose: Kompakte Projektsteuerung fuer Universaarl BC Implementierung, Buch, Training und Playwright-Evidence.
Last reviewed: 2026-07-06

## How to use / Verwendung

Dieses Dashboard ist die Projektleiter-Sicht. Es bleibt kurz und verweist auf Detaildateien. Aktualisiere es nach echten Projektänderungen, nicht nach jeder kleinen Textkorrektur.

Aktive Wahrheit:

- Instanz: `playthru`
- Company: `UNIVERSAARL-DE`
- Referenzfirma: Universaarl GmbH
- Nächster Live-Pilot nach Freeze-Lift: `TARGET-075`
- Geparkter Live-Case: `TARGET-073`
- Legacy: RM-DEMO, MCP_1_20260210, CRONUS, Rhein-Main und RM-* sind keine aktive Projektwahrheit.

## Overall status / Gesamtstatus

| Area | Status | Note |
| --- | --- | --- |
| Project plan | draft | `PROJECT-PLAN-DRAFT.md` exists. |
| Execution roadmap | active-draft | `UNIVERSAARL-EXECUTION-ROADMAP.md` is the current steering source from improvement freeze to read-first foundation validation and later process playthrough. |
| Implementation operating system | active-control | The active truth is `playthru / UNIVERSAARL-DE / Universaarl GmbH`; legacy RM/MCP/CRONUS material is only traceability or `legacy-purge-source`. |
| Sprache und Terminologie | active-control | Deutsch ist führende Projektsprache; englische BC-/Tool-Begriffe bleiben nur als fachliche oder technische Hilfsbegriffe. |
| Legacy package-script guard | active-control | `agent:legacy:active-check` blocks direct package scripts that would resume old RM-DEMO/MCP/CRONUS company routes. |
| Real customer onboarding/setup | draft | `REAL-CUSTOMER-ONBOARDING-AND-PROJECT-SETUP-GUIDE-DRAFT.md` exists and defines the realistic Confluence/Jira/GitHub/BC operating model. |
| Agent operating model | draft | `AGENT-OPERATING-MODEL-DRAFT.md` defines orchestrator, specialist roles, model routing, review gates and exclusive `playthru` execution. |
| Concept realism review cadence | draft | `CONCEPT-REALISM-REVIEW-CADENCE-DRAFT.md` defines recurring source-backed checks for whether the overall project concept should adapt. |
| Consulting-house benchmark | draft | `CONSULTING-HOUSE-BENCHMARK-REVIEW-DRAFT.md` defines how partner/consulting recommendations are used as critical market benchmarks without becoming product authority. |
| Book as project model | draft | `BOOK-AS-PROJECT-MANAGEMENT-MODEL.md` exists. |
| Book ticket backlog | draft | `BOOK-PROJECT-TICKET-BACKLOG-DRAFT.md` exists. |
| Project cast | draft | `PROJECT-CAST-AND-STAKEHOLDERS-DRAFT.md` exists. |
| Project storyline | draft | `PROJECT-STORYLINE-DRAFT.md` exists. |
| Project scene cards | draft | `PROJECT-SCENE-CARDS-DRAFT.md` exists. |
| Training strategy | draft | `TRAINING-STRATEGY-AND-CURRICULUM-DRAFT.md` exists. |
| Role training matrix | draft | `ROLE-BASED-TRAINING-MATRIX-DRAFT.md` exists. |
| Training module cards | draft | Cards exist for environment/company, navigation, chart of accounts, posting groups, VAT/USt boundary, dimensions, customer master data, vendor master data and item/service/non-inventory master data; VAT/dimension and WS04 cards are dependency-blocked, not trainer-ready. |
| Playwright training evidence map | draft | `PLAYWRIGHT-TRAINING-EVIDENCE-MAP-DRAFT.md` exists. |
| Playwright scenario catalog | draft | Read-first WS02/WS03/WS04 scenario catalog exists; no live execution authorized. |
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
| Data request Jira candidates | draft | First five candidates exist and now include a package-derived Jira ticket map with dependency tickets for Company Information, organization model, customers, vendors and items/services. |
| Customer data simulation | draft | `CUSTOMER-DATA-SIMULATION-DRAFT.md` exists. |
| Simulated core/master data tables | draft | Five concrete simulated packages exist: `UNIVERSAARL_CORE_CompanyInformation`, `UNIVERSAARL_CORE_OrganizationModel`, `UNIVERSAARL_MD_Customers`, `UNIVERSAARL_MD_Vendors` and `UNIVERSAARL_MD_ItemsServices`; all are Jira-ready, none are BC-setup-ready yet. |
| Foundation/master-data route decisions | draft | Route cards exist for numbering, posting groups, payment terms and product/UOM setup before live master-data work. |
| Decision log | draft | Initial decisions captured. |
| Risk register | draft | Initial risks captured. |
| UAT/training plan | draft | Training strategy, role matrix, evidence map and module cards exist through finance foundation VAT/dimensions and WS04 master-data training; process cards still needed. |
| Book map | draft | `WORKSTREAM-BOOK-CHAPTER-MAP-DRAFT.md` maps workstreams, Jira anchors, customer data, UAT, training and evidence gates to curated book chapters. |
| Playwright scenario catalog | draft | Read-first context/navigation/setup-dependency scenarios exist for WS02/WS03/WS04. |

## Current milestone / Aktueller Meilenstein

Current milestone: `M0 Project mobilized`

Ziel:

- Projektbetrieb, aktive Wahrheit und Steuerungsartefakte stabil halten, bevor weitere Workstreams breit ausgebaut werden.

M0-Exit-Kriterien:

- Project plan exists.
- Workbreakdown exists.
- Jira model exists.
- Documentation cadence exists.
- Artifact templates exist.
- Customer data catalog exists.
- Decision log exists.
- Risk register exists.
- First workstream is expanded as pattern.

Status: größtenteils entworfen, noch nicht final abgenommen.

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
| DEC-013 | Use route decision cards before live foundation/master-data setup | proposed |
| DEC-014 | Use a governed agent operating model before automation | accepted |
| DEC-015 | Run recurring concept realism reviews | accepted |
| DEC-016 | Use consulting-house recommendations as a critical benchmark, not authority | accepted |
| DEC-017 | Use Universaarl implementation operating system as active truth | accepted |
| DEC-018 | Use German as leading project and book language | accepted |

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
| RISK-015 | Multi-agent work creates conflicting project truth | P1 | active |
| RISK-016 | Concept review cadence becomes review theater | P2 | active |
| RISK-017 | Consulting-house benchmark imports marketing bias | P2 | active |
| RISK-018 | Legacy material remains active steering truth | P0 | active |
| RISK-019 | Project artifacts drift into mixed-language customer text | P1 | active |

## Next recommended work / Nächste empfohlene Arbeit

1. Use `UNIVERSAARL-EXECUTION-ROADMAP.md` as the single current steering source.
2. Run the local freeze/resume checks before any Business Central or Playwright live work.
3. Keep `TARGET-073` parked; do not resume the VAT Page 472 active-editor loop.
4. Resume live work only with `TARGET-075` as read-first Chart of Accounts / Foundation consistency check.
5. After TARGET-075, create or update `FOUNDATION-READINESS-DECISION.md`.
6. Build VAT/USt, Dimensions and Posting Groups read-first proof before master data or process chapters.
7. Use `WORKSTREAM-BOOK-CHAPTER-MAP-DRAFT.md` and the training evidence map before process training cards or book patches.
8. Treat legacy RM/MCP/CRONUS references as purge candidates or historical traceability, not active next steps.
9. Convert customer-facing or book-relevant text to German-leading terminology whenever those files are substantively edited.
10. Expand Jira import rows, BCSpec or broader concept reviews only when they directly support the next BC/training/evidence step.

## Update rule

When a new file, workstream or major decision is added:

- update this dashboard
- update `README.md` if it is a new core artifact
- update `REFINEMENT-BACKLOG.md` if the next-step order changes
- add a decision or risk if the route changes
