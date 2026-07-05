# Business Central Implementation Workbreakdown Draft

Status: draft
Purpose: Projektstruktur fuer Universaarl Business Central Implementierung, Buch, Kundenschulung, UAT und Playwright-Beweisfuehrung.
Last reviewed: 2026-07-05

This draft is a working structure. It should be improved in small steps before it becomes a Jira import template or a final book structure.

## Design principles

The project is not organized as a loose list of Business Central pages. It is organized as a realistic implementation program:

- Workstream: large delivery area and ownership boundary.
- Epic: fachliches Lieferpaket inside a workstream.
- Story: repeated project activity type inside an epic.
- Task: concrete action, data request, setup step, test, training item or decision.

The structure must serve four audiences at once:

- Implementation team: what must be designed, configured, tested and accepted.
- Customer/key users: what they must understand, decide, provide and learn.
- Book reader: why the Business Central setup exists and how it fits the company.
- Agent/Playwright system: what can be reproduced, evidenced and learned from.

## Source anchors

Use these as structure anchors before inventing new project categories:

- Microsoft MB-800: company setup, financials, sales, purchasing, inventory, fixed assets and operations.
  https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/mb-800
- Business Central setup overview: companies, general functionality, finance, banking, sales, purchasing, inventory, projects, fixed assets, warehouse, manufacturing, service and integrations.
  https://learn.microsoft.com/en-ca/dynamics365/business-central/setup
- Dynamics 365 Business Process Catalog: end-to-end processes, business process areas, business processes and scenarios.
  https://learn.microsoft.com/en-us/dynamics365/guidance/business-processes/about-catalog-levels
- Source to pay:
  https://learn.microsoft.com/en-us/dynamics365/guidance/business-processes/source-to-pay-overview
- Order to cash:
  https://learn.microsoft.com/en-us/dynamics365/guidance/business-processes/order-to-cash-areas-overview
- Inventory to deliver:
  https://learn.microsoft.com/en-us/dynamics365/guidance/business-processes/inventory-to-deliver-overview

## Recommended hierarchy

```text
Initiative
  Universaarl Business Central Implementation, Book, Training and Evidence System

Workstream
  Large fachliche or delivery domain

Epic
  Deliverable package inside a workstream

Story
  Repeated project activity type

Task
  Concrete action or artefact
```

## Standard story set per epic

Each implementation epic should normally contain these stories. Skip only with an explicit reason.

### Story: Discovery and customer data

Tasks:

- Identify customer owner and key users.
- List required customer decisions.
- List required customer data.
- Define data format and deadline.
- Check whether data is configuration data, master data, opening balance, open transaction or reference data.
- Record source system and data owner.
- Record data quality risks.

### Story: Fit-to-standard and solution design

Tasks:

- Describe the business process before Business Central.
- Map the process to standard Business Central.
- Identify gaps, variants and local requirements.
- Decide whether standard BC is enough.
- Record design decision and reason.
- Record dependencies to other epics.
- Define acceptance criteria.

### Story: Implementation route decision

Tasks:

- Compare manual UI setup, Assisted Setup, configuration package, Excel import, API, AL extension and no-change/park route.
- Prefer scalable routes for bulk setup and migration.
- Keep at least one understandable UI path for training and book explanation.
- Document affected tables/pages/fields when known.
- Define validation route after setup/import.
- Define rollback, cleanup or correction route.

### Story: BC setup and execution

Tasks:

- Confirm environment, company, role, language and work date.
- Capture before-state evidence.
- Execute only scoped, allowed changes.
- Capture after-state evidence.
- Reopen page or object to prove persistence.
- Record changed setup/master data/documents.
- Update state, coverage or evidence notes if required.

### Story: Playwright validation

Tasks:

- Define start state and required fixture data.
- Build repeatable navigation.
- Avoid unscoped force clicks, coordinate clicks and blind waits.
- Validate visible page, company, instance and target object.
- Validate expected BC result.
- Capture screenshot truth only when visible values prove the claim.
- Classify result as final, book-candidate, lab, rejected or blocked.

### Story: UAT and acceptance

Tasks:

- Define key-user scenario.
- Define test data.
- Define expected business result.
- Define expected ledger/subledger/document/report evidence where relevant.
- Execute or document UAT route.
- Capture defects, questions and decisions.
- Record acceptance or open blocker.

### Story: Training and customer handbook

Tasks:

- Define learning objectives.
- Identify target roles.
- Explain BC concept in customer language.
- Write daily-use steps.
- Add common mistakes and corrections.
- Add exercises for sandbox practice.
- Add control questions.
- Mark which actions are normal-user, key-user or admin actions.

### Story: Book curation

Tasks:

- Convert raw evidence into readable book text.
- Remove internal agent/test vocabulary from book prose.
- Explain why the setup matters for Universaarl.
- Separate source claim, sandbox observation, assumption and recommendation.
- Add chapter continuity to previous and next topics.
- Reject or park weak evidence.

### Story: Risks, decisions and operations

Tasks:

- Record risks and mitigation.
- Record open decisions and owner.
- Record dependencies to cutover, reporting, security or integrations.
- Define go-live readiness gate.
- Define support and hypercare note.

## Workstreams and epics

### Workstream 1: Project Governance and Delivery Method

Purpose: The project must behave like a real BC implementation, not like isolated automation.

Epics:

- Project charter and scope
- Jira structure and work item policy
- Decision log and risk register
- Success-by-Design and implementation governance mapping
- Definition of ready and definition of done
- Change control and issue handling
- Book/editorial governance

Example tasks:

- Define which workstreams are in scope for Universaarl phase 1.
- Define which workstreams are book-only, sandbox-only or real setup.
- Create Jira naming convention for Workstream, Epic, Story and Task.
- Create decision log template with source/evidence fields.
- Create risk register template with severity and owner.
- Define when a customer sign-off is needed.
- Define when a Playwright proof is required before book finalization.

### Workstream 2: Universaarl Case Study and Core System Basis

Purpose: Establish the fictional company, BC environment and basic operating context.

Epics:

- Company story and organizational model
- Environment and company setup
- Company information and localization
- Role centers, profiles and navigation baseline
- Base calendar and general settings
- Number series foundation
- Email, document layouts and report selection baseline
- Tenant/company registry and evidence boundaries

Example tasks:

- Define Universaarl legal entities and first target company.
- Decide which companies are phase 1 and which are later.
- Collect company address, tax/VAT identifiers, bank details and fiscal year.
- Decide active language, region and work date convention.
- Set or verify company information.
- Define number series policy for master data and documents.
- Prove number series assignment after reopen.
- Write beginner chapter for company context and navigation.

### Workstream 3: Finance Foundation and Control Model

Purpose: Build the accounting base before master data and transactional processes.

Epics:

- General Ledger Setup and accounting periods
- Chart of accounts and account categories
- Posting groups and posting setup
- VAT/USt setup
- Dimensions and reporting structure
- Journal templates and batches
- Bank accounts and payment setup
- Fixed assets foundation
- Financial controls and period close

Example tasks:

- Collect target chart of accounts and local accounting assumptions.
- Decide SKR04-oriented starter scope and compliance boundary.
- Create or verify required G/L accounts.
- Define customer, vendor, inventory, bank and fixed asset posting groups.
- Define general business/product posting groups.
- Define VAT business/product posting groups.
- Configure or verify VAT posting setup.
- Define global and shortcut dimensions.
- Define journal templates and batches.
- Verify G/L entries, customer/vendor entries, VAT entries or value entries after later process tests.
- Write chapter section explaining account determination.

### Workstream 4: Commercial Master Data and Product Model

Purpose: Define the master data used by sales, purchasing, inventory and reporting.

Epics:

- Customer master data
- Vendor master data
- Items, services and non-inventory items
- Units of measure
- Item categories, attributes and variants
- Stockkeeping units where needed
- Prices, discounts and conditions
- Master data templates
- Master data quality and ownership

Example tasks:

- Request customer list, vendor list and item/service catalog.
- Classify items as inventory, service or non-inventory.
- Define base units of measure and alternate purchase/sales units.
- Define item categories and attributes.
- Decide whether variants are needed or whether separate items are clearer.
- Define item templates, customer templates and vendor templates.
- Decide import route for master data.
- Create one manual example record for training.
- Import or prepare bulk data through configuration package when justified.
- Validate that master data can be used in sales and purchasing documents.

### Workstream 5: Purchasing and Source-to-Pay

Purpose: Cover supplier selection, purchase documents, goods/services received, vendor invoices and vendor payment handoff.

Epics:

- Purchasing policy and vendor relationship model
- Purchases and Payables Setup
- Purchase quotes and purchase orders
- Purchase receipts
- Purchase invoices and credit memos
- Purchase prices, discounts and item charges
- Vendor invoice controls
- Vendor payment handoff
- Purchasing UAT and training

Example tasks:

- Document current purchasing process.
- Collect approval needs and purchasing roles.
- Define vendor groups and payment terms.
- Verify Purchases and Payables Setup.
- Create purchase order scenario.
- Receive items or services in controlled scenario.
- Post or preview purchase invoice only when explicitly unlocked.
- Trace vendor ledger entries and G/L entries after posting.
- Train purchasing users on order, receipt, invoice and correction flow.
- Explain when direct purchase invoice is enough and when purchase order is required.

### Workstream 6: Sales and Order-to-Cash

Purpose: Cover sales policy, customers, sales documents, shipment/invoicing and customer payment handoff.

Epics:

- Sales policy and customer model
- Sales and Receivables Setup
- Sales quotes and sales orders
- Sales shipments
- Sales invoices and credit memos
- Sales prices, discounts and conditions
- Customer credit and dunning boundary
- Customer payment handoff
- Sales UAT and training

Example tasks:

- Document current sales process.
- Collect sales roles, approval needs and pricing logic.
- Define customer groups, payment terms and shipment policy.
- Verify Sales and Receivables Setup.
- Create sales quote scenario.
- Convert quote to order where in scope.
- Ship and invoice only when explicitly unlocked.
- Trace customer ledger entries and G/L entries after posting.
- Train sales users on quote, order, shipment, invoice and correction flow.
- Explain availability check and inventory dependency.

### Workstream 7: Inventory, Costing and Stock Control

Purpose: Manage item quantity, value, inventory posting and inventory-to-GL reconciliation.

Epics:

- Inventory Setup
- Locations for inventory purposes
- Inventory posting groups and inventory posting setup
- Item ledger entries and value entries
- Opening inventory and item journals
- Inventory valuation and cost adjustment
- Physical inventory and stock corrections
- Transfers between locations
- Inventory reports and reconciliation

Example tasks:

- Collect opening stock quantities and values by item/location.
- Decide costing method assumptions.
- Verify Inventory Setup and item number series.
- Define inventory posting group and inventory account mapping.
- Create controlled item journal route for opening stock or adjustment.
- Validate item ledger entries and value entries.
- Reconcile inventory value to G/L.
- Train users on inventory count, adjustment and reclassification.
- Explain difference between item, item ledger entry, value entry and G/L entry.

### Workstream 8: Warehouse and Physical Logistics

Purpose: Model physical warehouse work separately from item master data and inventory valuation.

Epics:

- Warehouse scope decision
- Locations, zones and bins
- Inbound warehouse process
- Put-away process
- Picking process
- Outbound warehouse process
- Warehouse item tracking
- Warehouse roles and training

Example tasks:

- Collect warehouse locations, storage areas and handling processes.
- Decide simple location handling versus warehouse management.
- Define bins and zones only where they create value.
- Configure location card fields required for selected process.
- Test inbound goods flow.
- Test outbound shipment/picking flow.
- Validate that warehouse process updates inventory correctly.
- Train warehouse users on daily process and exception handling.

### Workstream 9: Security, Workflows and Operational Controls

Purpose: Make the system usable and controllable by real customer roles.

Epics:

- User model and role centers
- Permission sets and security groups
- Approval workflows
- Change log and auditability
- Job queues and background processing
- Document controls and blocked records
- Operational support model

Example tasks:

- Collect user list, departments and role mapping.
- Define key-user, normal-user and admin responsibilities.
- Assign role centers and permission sets.
- Define approval workflows for purchase/sales/financial processes.
- Configure workflow users and notification paths.
- Decide change log scope.
- Define support process and escalation route.
- Train admins and key users separately from normal users.

### Workstream 10: Reporting, Analytics and Management View

Purpose: Turn setup and posted data into useful insight.

Epics:

- Financial statements and account schedules/financial reports
- Dimension-based reporting
- Sales reporting
- Purchasing reporting
- Inventory reporting
- Power BI and analysis mode boundary
- Management dashboard requirements

Example tasks:

- Collect management reporting requirements.
- Define required dimensions and account categories.
- Create or verify financial report structure.
- Validate dimension filters on entries.
- Validate sales, purchasing and inventory reports with sample data.
- Decide what belongs in BC versus Power BI.
- Train managers on saved views, filters and reports.

### Workstream 11: Data Migration, Configuration Packages and Integration

Purpose: Use realistic scalable tools for configuration and data movement.

Epics:

- Customer data request catalog
- Configuration package strategy
- Master data import
- Opening balances and open transactions
- Data cleansing and validation
- Integration inventory
- API/AL/extension boundary
- Migration rehearsal and cutover load

Example tasks:

- Separate configuration data, master data, balances and open transactions.
- Define required template per data object.
- Create data request list with owner, due date, format and validation rule.
- Decide where configuration packages are the preferred route.
- Export package to Excel where appropriate.
- Validate imported records in UI.
- Reconcile imported balances and open entries.
- Document integration candidates and data ownership.
- Define no-secret policy for local configs and MCP/tooling.

### Workstream 12: Advanced Business Areas

Purpose: Keep non-foundation modules visible without mixing them into first foundation tasks.

Epics:

- Jobs and project management
- Assembly management
- Manufacturing and planning
- Service management
- Intercompany
- Sustainability/quality where relevant
- Copilot and agents in BC where relevant

Example tasks:

- Decide whether area is phase 1, phase 2, book appendix or out of scope.
- Collect customer process and master data.
- Map to standard BC capability.
- Define dependencies to item, inventory, finance and warehouse setup.
- Create one demonstrable sandbox scenario if in scope.
- Define customer training need.
- Mark book status as final, book-candidate or parked.

### Workstream 13: UAT, Training, Cutover and Hypercare

Purpose: Prepare customer adoption and production readiness.

Epics:

- UAT plan and scenario catalog
- Role-based training plan
- Customer handbook
- Cutover plan
- Go-live checklist
- Hypercare and support
- Lessons learned and backlog

Example tasks:

- Define UAT scenarios per workstream.
- Assign key-user owners.
- Define training modules by role.
- Create handbook chapter checklist.
- Define cutover sequence and freeze window.
- Define data load timing and validation.
- Define go/no-go criteria.
- Define hypercare triage process.
- Convert UAT defects into backlog items.

### Workstream 14: Book, Playwright and Agent Learning System

Purpose: Make the repo a learning system that improves the book and future execution.

Epics:

- Book structure and chapter curation
- Evidence taxonomy and screenshot truth
- Playwright helper quality
- Business Central source research
- Skills and capabilities
- MCP and tooling usage
- Audit and refactoring backlog
- Coverage and final-claim governance

Example tasks:

- Map every book chapter to workstream, epic and proof status.
- Reject raw test logs as final book text.
- Create Playwright scenario per important business process.
- Convert repeated failures into helper, skill or rejected route.
- Use Microsoft Learn for product claims.
- Use sandbox evidence for concrete UI/result claims.
- Keep community sources as advisory, not authority.
- Run local checks before finalizing changes.
- Maintain a prioritized cleanup backlog.

## Open design questions

- Should Fixed Assets remain in Finance Foundation or become its own phase-1 workstream?
- Should Bank/Payments be inside Finance Foundation or become a separate operational workstream?
- Should Workstream 8 split simple inventory locations from full warehouse management?
- Should Intercompany become phase 2 workstream because Universaarl is a multi-company case study?
- Which workstreams are required for the first book volume, and which are later volumes?
- Which epics should become Jira Epics versus Jira Components/Labels?

## Next refinement step

The next useful step is not to add more categories. It is to pick one workstream and expand it to real Jira import shape:

```text
Workstream
Epic
Story
Task
Definition of Ready
Definition of Done
Required customer data
Required source/evidence
Playwright scenario
Training output
Book output
```

Recommended first refinement target: Finance Foundation and Control Model, because it gates most later BC processes.
