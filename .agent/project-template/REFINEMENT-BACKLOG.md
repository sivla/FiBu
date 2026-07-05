# Project Template Refinement Backlog

Status: draft
Purpose: Schrittweise Ausarbeitung der Universaarl Projektstruktur bis zur Jira-faehigen Projektakte.
Last reviewed: 2026-07-05

## Guiding idea

The project template should become complete, but not by creating a huge static document in one pass. Each refinement should make one part more useful for Jira, BC consulting, customer training, book curation and Playwright evidence.

## P0: Foundation structure

- Create project template index.
- Create complete project plan draft.
- Create project dashboard draft.
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

Current status: first Jira-ready candidates for `DR-CORE-001`, `DR-CORE-002`, `DR-MD-001`, `DR-MD-002` and `DR-MD-003` exist in `DATA-REQUEST-JIRA-CANDIDATES-DRAFT.md`. Next refinement should apply the realism standard, then convert accepted candidates into Jira import rows or simulated data tables.

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
- VAT/USt boundary
- dimensions
- customer/vendor/item master data
- purchasing process
- sales process
- inventory quantity/value
- UAT execution

Each module must define audience, learning objective, exercise, handbook output, source/evidence status, Playwright/UAT link and acceptance criteria.

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

`WS02-CASE-STUDY-CORE`, `WS04-MASTER-DATA-PRODUCT`, the first training module cards and `DATA-REQUEST-JIRA-CANDIDATES-DRAFT.md` now exist as drafts. The next useful refinement is to review those data-request candidates against realism, ownership, validation, route and evidence gates, while using `BCSPEC-PILOT-001-MASTER-DATA-PRODUCT-TRAINING.md` to test whether a spec-driven layer improves the work. That is the fastest way to make the next live Foundation/Master-Data pilot better rather than merely more automated.
