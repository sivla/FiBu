# Project Template Refinement Backlog

Status: draft
Purpose: Schrittweise Ausarbeitung der Universaarl Projektstruktur bis zur Jira-faehigen Projektakte.
Last reviewed: 2026-07-06

## Guiding idea

The project template should become complete, but not by creating a huge static document in one pass. Each refinement should make one part more useful for Jira, BC consulting, customer training, book curation and Playwright evidence.

Current steering source: `UNIVERSAARL-EXECUTION-ROADMAP.md`.

Artifact classification source: `.agent/ACTIVE-ARTIFACT-CLASSIFICATION.md`.

Do not treat this backlog as a flat queue. The execution roadmap decides the current sequence: finish local freeze/resume checks, return with read-first `TARGET-075`, create a Foundation Readiness Decision, then move toward VAT/USt, Dimensions, Posting Groups and master-data readiness.

Active truth rule:

- `playthru / UNIVERSAARL-DE / Universaarl GmbH` is the only active implementation world.
- RM-DEMO, MCP_1_20260210, CRONUS, Rhein-Main and RM-* material may be read only as historical traceability or `legacy-purge-source`.
- A cleanup item is useful only when it converts a legacy pattern into neutral/Universaarl guidance, removes an active legacy next-step, or prevents a future regression.

## P0: Foundation structure

- Create project template index.
- Create complete project plan draft.
- Create project dashboard draft.
- Create real customer onboarding and project setup guide.
- Create agent operating model draft.
- Create concept realism review cadence.
- Create consulting-house benchmark review.
- Create goal transition protocol.
- Create first goal transition card.
- Create book-as-project-management model.
- Create initial book/project ticket backlog.
- Create simulated customer data package model.
- Create project cast and stakeholder model.
- Create end-to-end project storyline draft.
- Create first project scene cards.
- Create training strategy and curriculum.
- Create role-based training matrix.
- Create Playwright training evidence map.
- Create realism standard.
- Create spec-driven sideproject draft and first BCSpec pilot.
- Define Jira work item model.
- Define documentation cadence.
- Define artifact templates.
- Create initial customer data catalog.
- Create first data-request Jira candidate draft.
- Create initial decision log.
- Create initial risk register.
- Keep current workbreakdown draft aligned with workstreams and epics.

Status: started, core files exist as drafts

## P0: Active truth and legacy eradication

Use this only for changes that make a new consultant or agent less likely to resume the wrong world.

Immediate controls:

- keep `UNIVERSAARL-EXECUTION-ROADMAP.md`, dashboard and `current.json` aligned on `playthru / UNIVERSAARL-DE`
- keep `.agent/ACTIVE-ARTIFACT-CLASSIFICATION.md` aligned so active-control files stay few and obvious
- keep `TARGET-073` parked until a conscious resume decision changes that
- keep `TARGET-075` read-first and no-write
- classify legacy references as historical traceability, neutral pattern source, purge candidate or superseded-by-Universaarl
- do not mass-delete evidence without a replacement/supersession decision

Useful first cleanup candidates after the freeze/resume checks:

- package scripts or test names that imply RM/MCP/CRONUS is a normal active path
- README/current-state/dashboard lines that could steer a new agent to legacy
- book or training text that uses legacy as the current customer story
- Playwright helper learnings that can be made company-neutral

## P0: Skill system as practical operating memory

Use `.agent/SKILL-SYSTEM.md` only for reusable patterns that reduce risk, repeated context reading, legacy regression or BC/Playwright/book rework.

Immediate active skills:

- `playthru-context-check` before practical BC/Playwright work
- `read-first-page-proof` for TARGET-075 and Foundation read-first checks
- `bc-write-gate` before setup, master data, drafts, imports, cleanup, preview, posting or payment
- `legacy-reference-finder` when scripts/tests/book/state references can steer back to RM/MCP/CRONUS
- `state-sync-check` when Roadmap, Dashboard, State or Backlog next steps change

Do not build more skills until a concrete blocker, repeated pattern, training/UAT need, book-quality issue or migration risk justifies it.

## P1: Expand workstreams to Jira-ready detail

Refine in this order:

1. `WS03-FINANCE-FOUNDATION`
2. `WS02-CASE-STUDY-CORE` - draft exists; refine later into Jira import candidates after data-request owners are assigned.
3. `WS04-MASTER-DATA-PRODUCT` - draft exists; refine later into Jira import candidates after data-request owners and route decisions are assigned.
4. `WS07-INVENTORY-COSTING-STOCK`
5. `WS05-PURCHASING-SOURCE-TO-PAY`
6. `WS06-SALES-ORDER-TO-CASH`
7. `WS08-WAREHOUSE-LOGISTICS`
8. `WS11-DATA-MIGRATION-INTEGRATION`
9. `WS09-SECURITY-WORKFLOWS-CONTROLS`
10. `WS10-REPORTING-ANALYTICS`
11. `WS13-UAT-TRAINING-CUTOVER`
12. `WS14-BOOK-PLAYWRIGHT-LEARNING`
13. `WS12-ADVANCED-AREAS`
14. `WS01-GOVERNANCE`

Reason: Finance and system foundation gate most later processes. Master data, inventory, purchasing and sales then become realistic rather than isolated clicks.

## P1: Apply real onboarding and setup model

Use `REAL-CUSTOMER-ONBOARDING-AND-PROJECT-SETUP-GUIDE-DRAFT.md` to align:

- `PROJECT-PLAN-DRAFT.md`
- `JIRA-WORK-ITEM-MODEL.md`
- `DOCUMENTATION-CADENCE.md`
- `SPEC-DRIVEN-SIDEPROJECT-DRAFT.md`
- `BOOK-AS-PROJECT-MANAGEMENT-MODEL.md`
- `TRAINING-STRATEGY-AND-CURRICULUM-DRAFT.md`

The goal is to make the project feel like a real customer onboarding and implementation, not an internal documentation lab.

Do first:

- define Confluence as the customer-visible knowledge/spec/handbook layer
- define Jira as the operational execution layer without new spec issue types
- define GitHub as the technical evidence/repo layer
- define Business Central sandbox/environment roles
- define which onboarding artifacts the customer receives before, during and after kickoff

## P1: Apply agent operating model

Use `AGENT-OPERATING-MODEL-DRAFT.md` before any further specialist-agent or subagent work.

The model must stay practical:

- one orchestrator owns project truth
- specialist roles produce bounded outputs
- no parallel writes to the same canonical files
- no parallel `playthru` execution
- model/taskclass choices follow `.agent/model-routing.md`
- stronger models are used for BC judgment, architecture, risky claims and final review, not mechanical cleanup

Do not automate a broader multi-agent system until manual specialist-role use proves better output, fewer correction loops and no sandbox/project-truth conflicts.

## P1: Run recurring concept realism reviews

Use `CONCEPT-REALISM-REVIEW-CADENCE-DRAFT.md` to keep the project concept honest.

First review should cover:

- whether the Confluence/Jira/GitHub/BC model is still realistic
- whether BCSpec should remain a pilot or be folded into Confluence/Jira templates
- whether the new agent operating model adds value or ceremony
- whether data requests, route cards, simulated tables and Playwright catalog are too many artifacts or the right level of control
- whether the customer could understand what they must deliver next

Every review must update the dashboard, backlog, decision log or risk register, or explicitly record a no-change verdict.

## P1: Apply consulting-house benchmark critically

Use `CONSULTING-HOUSE-BENCHMARK-REVIEW-DRAFT.md` as a market reality check, not as authority.

Apply first to:

- customer onboarding and kickoff readiness
- data-request Jira candidates and import-ready rows
- WS11 data migration/integration structure
- training, UAT, cutover and hypercare planning
- book sections that describe how a consultant should run the project

Each accepted external recommendation must become a concrete project artifact: data request, Jira item, decision, risk, route card, UAT/training item, Playwright evidence need or book curation boundary. Otherwise park or reject it.

## P1: Convert the book into project tickets

Use `BOOK-AS-PROJECT-MANAGEMENT-MODEL.md` and `BOOK-PROJECT-TICKET-BACKLOG-DRAFT.md` to ensure every major book chapter has:

- workstream and epic
- Jira-style ticket(s)
- customer data input or explicit no-data-needed note
- decision/risk where relevant
- BC implementation route
- Playwright/evidence route
- UAT scenario
- training/handbook output
- book curation output

## P1: Refine customer data catalog

Refine the initial catalog into Jira-ready data requests:

- company information
- fiscal/calendar setup
- chart of accounts
- tax/VAT setup assumptions
- dimensions
- bank accounts
- customers
- vendors
- items/services/non-inventory items
- units of measure
- prices/discounts
- opening balances
- open customer/vendor entries
- open sales/purchase documents
- inventory quantities and values
- users/roles
- approval rules
- reports
- integrations

Each data request should include owner, due date, format, validation rule and BC usage. The initial file exists as `CUSTOMER-DATA-CATALOG-DRAFT.md`.

Current status: first Jira-ready candidates for `DR-CORE-001`, `DR-CORE-002`, `DR-MD-001`, `DR-MD-002` and `DR-MD-003` exist in `DATA-REQUEST-JIRA-CANDIDATES-DRAFT.md`. The file now also contains a package-derived Jira ticket map for `UNIVERSAARL_CORE_CompanyInformation`, `UNIVERSAARL_CORE_OrganizationModel`, `UNIVERSAARL_MD_Customers`, `UNIVERSAARL_MD_Vendors` and `UNIVERSAARL_MD_ItemsServices`, including dependency tickets. Next refinement should turn those rows into import-ready Jira rows or project tickets.

Realism review status: the first five candidates were reviewed in `REALISM-REVIEW-DATA-REQUESTS-2026-07-05.md`. They are planning-ready but intentionally not BC-setup-ready. Next work should create simulated data tables and validation columns before live setup or import planning.

Simulation status: first simulated tables now exist in `SIMULATED-DATA-TABLES-CORE-MD-DRAFT.md`. They expose blockers for numbering, posting groups, VAT groups, payment terms, UOM and inventory posting setup before any live master-data creation. Those blockers are now mirrored in the Jira candidate dependency queue.

Route decision status: first route decision cards now exist in `ROUTE-DECISION-CARDS-FOUNDATION-MASTER-DATA-DRAFT.md`. They recommend read-first proof and gated setup before number series, posting groups, payment terms, UOM or item/master-data work.

Playwright catalog status: read-first scenario catalog now exists in `PLAYWRIGHT-SCENARIO-CATALOG-WS02-WS03-WS04-DRAFT.md`. It maps company context, navigation, setup dependency pages and master-data card/list checks to training, route decisions and stop rules.

## P1: Build simulated customer data packets

Use `CUSTOMER-DATA-SIMULATION-DRAFT.md` to create the first realistic data packets:

- company information
- organization model
- chart of accounts
- posting group inputs
- VAT assumptions
- dimensions
- customers
- vendors
- items/services/non-inventory items
- opening inventory

Do not create final imported data without deciding whether the route is UI, configuration package, Excel import, API or parked.

## P1: Build story scenes and character-driven chapters

Use `PROJECT-CAST-AND-STAKEHOLDERS-DRAFT.md` and `PROJECT-STORYLINE-DRAFT.md` to turn abstract workstreams into realistic project scenes:

- kickoff
- company discovery
- first data request
- first data quality issue
- finance discovery
- posting group decision
- VAT boundary review
- master data review
- purchasing UAT
- sales UAT
- inventory opening decision
- training readiness
- go-live simulation
- retrospective

Each scene should produce project artifacts, not just dialogue: tickets, data requests, decisions, risks, BC work, evidence, UAT/training or book output.

## P1: Build professional training package

Use these files:

- `TRAINING-STRATEGY-AND-CURRICULUM-DRAFT.md`
- `ROLE-BASED-TRAINING-MATRIX-DRAFT.md`
- `PLAYWRIGHT-TRAINING-EVIDENCE-MAP-DRAFT.md`
- `.agent/CUSTOMER-HANDBOOK-TRAINING-STANDARD.md`

Create training module cards for:

- environment/company and evidence boundary - draft exists in `TRAINING-MODULE-CARDS-DRAFT.md`
- Business Central navigation - draft exists in `TRAINING-MODULE-CARDS-DRAFT.md`
- chart of accounts - draft exists in `TRAINING-MODULE-CARDS-DRAFT.md`
- posting groups - draft exists in `TRAINING-MODULE-CARDS-DRAFT.md`
- customer master data - draft exists in `TRAINING-MODULE-CARDS-DRAFT.md`; blocked by foundation dependencies
- vendor master data - draft exists in `TRAINING-MODULE-CARDS-DRAFT.md`; blocked by foundation and payment-boundary dependencies
- items, services and non-inventory items - draft exists in `TRAINING-MODULE-CARDS-DRAFT.md`; blocked by product model, UOM, posting, VAT, inventory posting and costing decisions
- VAT/USt boundary - draft exists in `TRAINING-MODULE-CARDS-DRAFT.md`; blocked by official source, tax-review boundary and Universaarl setup-row evidence
- dimensions - draft exists in `TRAINING-MODULE-CARDS-DRAFT.md`; blocked by organization model confirmation, setup route and read-first Dimensions/Dimension Values proof
- purchasing process
- sales process
- inventory quantity/value
- UAT execution

Each module must define audience, learning objective, exercise, handbook output, source/evidence status, Playwright/UAT link and acceptance criteria.

Current next useful refinement: after freeze/resume gate, build read-first Playwright proof for VAT setup and Dimensions/Dimension Values, or create purchasing/sales process cards only as dependency-blocked drafts that do not assume missing foundation evidence.

## P1: Apply realism standard

Use `REALISM-STANDARD-DRAFT.md` before promoting project, book, customer-data, training or evidence material.

Apply first to:

- `PROJECT-STORYLINE-DRAFT.md`
- `PROJECT-SCENE-CARDS-DRAFT.md`
- `CUSTOMER-DATA-SIMULATION-DRAFT.md`
- `BOOK-PROJECT-TICKET-BACKLOG-DRAFT.md`
- `ROLE-BASED-TRAINING-MATRIX-DRAFT.md`

The goal is to prevent demo-perfect artifacts. Realistic material should include owners, missing data, validation, role constraints, trade-offs, UAT feedback, training gaps and evidence boundaries where appropriate.

## P1: Run BCSpec sideproject pilot

Use these files:

- `SPEC-DRIVEN-SIDEPROJECT-DRAFT.md`
- `BCSPEC-PILOT-001-MASTER-DATA-PRODUCT-TRAINING.md`

Run the pilot only for one master-data/product refinement before adopting any larger OpenSpec structure.

The pilot must prove that BCSpec improves:

- customer data readiness
- route decisions
- Jira-ready tasks
- Playwright evidence planning
- UAT/training linkage
- book curation boundaries

Do not create a canonical `.agent/spec-driven/` tree or install OpenSpec until the pilot is reviewed.

After the pilot, decide whether to:

- keep BCSpec as a lightweight checklist
- create a local `.agent/spec-driven/` structure
- install OpenSpec and customize a schema
- reject the extra layer and fold useful parts into existing templates

## P1: Refine decision and risk registers

Refine the initial registers:

- `DECISION-LOG-DRAFT.md`
- `RISK-REGISTER-DRAFT.md`

Do not duplicate existing agent state. These are project-template artifacts for later Jira/customer-facing structure.

## P2: Create Jira import shape

Later create CSV-like or table-based files:

- workstreams as components
- epics as Jira epics
- recurring stories per epic
- task templates
- labels/custom fields

Only do this after at least Finance, Product/Master Data, Purchasing, Sales and Inventory are refined.

## P2: Connect book chapters

Map every workstream and epic to:

- book chapter
- chapter status
- source status
- sandbox evidence status
- Playwright repeatability status
- training output

Status: first draft exists in `WORKSTREAM-BOOK-CHAPTER-MAP-DRAFT.md`. It maps chapters to workstreams, Jira anchors, customer data, route/evidence gates, UAT/training links and next actions. Next refinement should use the map to prevent process cards or book sections from claiming readiness before foundation/master-data evidence exists.

## P2: Connect Playwright scenarios

Create a scenario catalog:

- setup proof scenarios
- master-data scenarios
- transaction scenarios
- ledger trace scenarios
- UAT scenarios
- screenshot truth requirements
- cleanup/keep rules

## P3: Project operating dashboard

Later create one compact dashboard:

- workstreams complete/active/parked
- P0/P1 risks
- open decisions
- missing customer data
- UAT readiness
- training readiness
- book readiness
- Playwright repeatability debt

## Current next best step

`UNIVERSAARL-EXECUTION-ROADMAP.md` is now the current control layer. The next useful refinement is not another broad planning document: run the freeze/resume checks, keep `TARGET-073` parked, use `TARGET-075` as the first read-first live pilot when allowed, and then create `FOUNDATION-READINESS-DECISION.md` before master-data or process work.
