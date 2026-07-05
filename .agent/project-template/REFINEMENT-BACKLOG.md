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
- Define Jira work item model.
- Define documentation cadence.
- Define artifact templates.
- Create initial customer data catalog.
- Create initial decision log.
- Create initial risk register.
- Keep current workbreakdown draft aligned with workstreams and epics.

Status: started, core files exist as drafts

## P1: Expand workstreams to Jira-ready detail

Refine in this order:

1. `WS03-FINANCE-FOUNDATION`
2. `WS02-CASE-STUDY-CORE`
3. `WS04-MASTER-DATA-PRODUCT`
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

The long-running goal is now transitioned into the project system. Next, expand `WS02-CASE-STUDY-CORE` so Universaarl has enough company story, organization model, roles, locations, evidence boundaries and training/book outputs to justify later finance and master-data decisions.
