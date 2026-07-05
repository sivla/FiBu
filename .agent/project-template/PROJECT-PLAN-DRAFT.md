# Universaarl Business Central Project Plan Draft

Status: draft
Purpose: Vollstaendiger Projektplan fuer die Universaarl Business Central Einfuehrung, das kuratierte Buch, Kundenschulung, UAT und Playwright-Beweisfuehrung.
Last reviewed: 2026-07-05

## Executive summary

Universaarl is treated as a real Business Central implementation program. The project does not only configure a sandbox. It builds a complete, evidence-backed implementation story:

- a realistic company and process model
- a Business Central solution design
- Jira-style project management
- customer data requests and decision tracking
- repeatable Playwright validation
- role-based customer training
- a curated book and handbook
- an agent learning system that turns findings into skills, helpers and capabilities

The project follows Microsoft Dynamics 365 implementation guidance as an orientation layer: governance, implementation strategy, data management, testing, UAT and deployment readiness are treated as first-class work, not as afterthoughts.

## Source anchors

Use these official sources as method anchors:

- Success by Design framework:
  https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/success-by-design
- Dynamics 365 implementation strategy:
  https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/implementation-strategy
- Project governance:
  https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/project-governance
- Configuration and migration data:
  https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/data-management-configuration-data-migration
- Testing strategy:
  https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/testing-strategy
- Business Central setup overview:
  https://learn.microsoft.com/en-ca/dynamics365/business-central/setup

## Objectives

Primary objectives:

- Build a realistic Business Central implementation for `UNIVERSAARL-DE` in environment `playthru`.
- Structure all work like a real customer project with workstreams, epics, stories, tasks, decisions, risks and data requests.
- Produce a curated Business Central book that reads like a fachlich guided implementation handbook.
- Produce role-based customer training material and UAT scenarios.
- Use Playwright as a repeatable evidence and training-scenario laboratory.
- Use official Microsoft sources for Business Central product, setup and implementation claims.
- Convert repeated execution problems into permanent project skills, helper APIs, checks or rules.

Non-objectives:

- Do not claim German tax or legal finality without explicit source, evidence and boundary.
- Do not treat raw Playwright logs as final book text.
- Do not build a Jira theater layer that does not guide decisions, data, setup, UAT or training.
- Do not let manual UI clicking become the default for bulk setup when configuration packages, imports or other scalable BC routes are better.

## Project approach

The project combines four methods:

1. Business Central consulting
   - Fit-to-standard thinking, setup route decisions, source-backed BC explanations and customer enablement.

2. Project management
   - Workstreams, epics, stories, tasks, decisions, risks, milestones, data requests and acceptance gates.

3. Evidence engineering
   - Playwright scenarios, screenshot truth, source claims, sandbox observations and repeatability checks.

4. Book production
   - Raw evidence is curated into readable chapters, customer handbook sections and training exercises.

## Success criteria

The project is successful when:

- Every important BC topic belongs to a workstream and epic.
- Every setup/process claim is either source-backed, sandbox-observed, Playwright-repeatable or clearly marked as assumption/recommendation.
- The customer data needed for each workstream is documented with owner, format, deadline and validation.
- The book has a visible red thread from company story to setup to process to evidence to training.
- Playwright can reproduce core scenarios without fragile blind clicking patterns.
- Jira-like tickets can be generated from the project plan without inventing structure again.
- Customer training answers what users must understand, do, check and escalate.
- Risks and decisions are visible instead of being hidden in chat or test logs.

## Scope

### In scope

- Universaarl case study and company model
- Business Central core setup
- Finance foundation
- Commercial master data and product model
- Purchasing / Source-to-Pay
- Sales / Order-to-Cash
- Inventory, costing and stock control
- Warehouse and physical logistics where meaningful
- Security, roles, permissions and workflows
- Reporting and management view
- Data migration and configuration packages
- UAT, training, cutover and hypercare planning
- Book, Playwright and agent learning system

### Later or conditional scope

- Fixed assets full operational process
- Jobs/projects
- Assembly, manufacturing and planning
- Service management
- Intercompany
- External integrations
- AL extensions
- Full Business Central MCP write usage
- Real publish/auth/debug AL flows

### Out of scope until explicitly unlocked

- Real production tenant changes
- Unreviewed tenant secrets or auth material in committed files
- Blind publish, debug or auth actions
- Final tax/legal advice
- Unsupported mass deletion or cleanup without dependency analysis

## Workstreams

Use the canonical workstreams from the workbreakdown draft:

1. `WS01-GOVERNANCE`: Project governance and delivery method
2. `WS02-CASE-STUDY-CORE`: Universaarl case study and system basis
3. `WS03-FINANCE-FOUNDATION`: Finance foundation and control model
4. `WS04-MASTER-DATA-PRODUCT`: Commercial master data and product model
5. `WS05-PURCHASING-SOURCE-TO-PAY`: Purchasing and vendor process
6. `WS06-SALES-ORDER-TO-CASH`: Sales and customer process
7. `WS07-INVENTORY-COSTING-STOCK`: Inventory, costing and stock control
8. `WS08-WAREHOUSE-LOGISTICS`: Warehouse and physical logistics
9. `WS09-SECURITY-WORKFLOWS-CONTROLS`: Security, workflows and operational controls
10. `WS10-REPORTING-ANALYTICS`: Reporting, analytics and management view
11. `WS11-DATA-MIGRATION-INTEGRATION`: Data migration, configuration packages and integration
12. `WS12-ADVANCED-AREAS`: Advanced business areas
13. `WS13-UAT-TRAINING-CUTOVER`: UAT, training, cutover and hypercare
14. `WS14-BOOK-PLAYWRIGHT-LEARNING`: Book, Playwright and agent learning system

## Phase plan

### Phase 0: Mobilize project

Goal: Establish project management, scope and working rules.

Deliverables:

- Project plan draft
- Jira work item model
- Workstream and epic structure
- Documentation cadence
- Decision log
- Risk register
- Customer data catalog
- Source/evidence policy
- Sandbox and live-action guardrails

Exit gate:

- Workstreams and issue model exist.
- Project roles and cadence are defined.
- High-level risks and decisions are visible.
- No live BC work is required to complete this phase.

### Phase 1: Discover company and process model

Goal: Understand Universaarl like a real customer.

Deliverables:

- Company profile
- Legal entity and country model
- Process inventory
- Role and department model
- Customer data request catalog
- Initial reporting needs
- Initial training audience map
- Book narrative outline

Exit gate:

- The company story is specific enough to justify setup decisions.
- Required customer data is known for Finance, Master Data, Purchasing, Sales and Inventory.
- Unknowns are logged as data requests, risks or decisions.

### Phase 2: Design solution blueprint

Goal: Decide how standard BC should be configured and where scalable implementation routes are needed.

Deliverables:

- Fit-to-standard notes
- Workstream design decisions
- Setup route decision cards
- Configuration package strategy
- Migration strategy
- UAT scenario skeleton
- Training matrix skeleton
- Book chapter map

Exit gate:

- Foundation setup route is decided.
- Bulk data routes are not defaulted to manual clicks.
- Each major design decision states source/evidence basis.

### Phase 3: Build finance and system foundation

Goal: Establish the setup that later processes depend on.

Deliverables:

- Company and environment context proof
- Chart of accounts scope
- Posting group model
- VAT/USt setup boundary
- Dimensions and reporting structure
- Number series foundation
- Journal/bank foundation
- Foundation Playwright read-only and controlled-write scenarios
- Finance foundation handbook chapter

Exit gate:

- Foundation objects are visible, proven, parked or rejected.
- No book chapter claims final readiness without source/evidence.
- Process workstreams know their dependencies.

### Phase 4: Build master data and migration foundation

Goal: Prepare customer, vendor, item/service and reference data realistically.

Deliverables:

- Master data templates
- Customer/vendor/item data requests
- Product model design
- Units, categories, attributes and variants decision
- Configuration package/import plan
- Manual UI learning route for examples
- Data validation plan
- Master data training material

Exit gate:

- Master data routes are selected by data volume and learning need.
- At least one example record can be explained manually.
- Bulk routes have validation and rollback/park strategy.

### Phase 5: Build business processes

Goal: Implement and validate end-to-end business processes.

Deliverables:

- Purchasing / Source-to-Pay scenarios
- Sales / Order-to-Cash scenarios
- Inventory and costing scenarios
- Warehouse scenarios if in scope
- Posting/Preview gates
- Ledger and subledger trace plans
- Process UAT scripts
- Process handbook chapters

Exit gate:

- Each process has a clear start state, test data, steps, expected BC effect and evidence route.
- Process chapters explain why the setup exists and what the customer must learn.

### Phase 6: Reporting, controls and operations

Goal: Make the solution controllable and useful after transactions exist.

Deliverables:

- Role/permission model
- Workflow and approval model
- Reporting and dimension validation
- Management view requirements
- Audit/change-log boundary
- Job queue and operational controls where in scope
- Admin and key-user training material

Exit gate:

- Users and controls map to real roles.
- Reports and dimensions are tested with meaningful data where available.
- Operational risks are known.

### Phase 7: Test, UAT and training

Goal: Prove business readiness and train the customer.

Deliverables:

- Test plan
- UAT scenario catalog
- UAT execution evidence
- Defect backlog
- Training matrix
- Role-based training modules
- Customer handbook
- Book chapter readiness review

Exit gate:

- UAT scenarios map to business processes.
- Training covers daily work, exceptions, corrections and escalation.
- Defects and gaps are accepted, fixed, parked or rejected.

### Phase 8: Cutover, go-live and hypercare simulation

Goal: Treat the sandbox implementation like a real go-live readiness exercise.

Deliverables:

- Cutover plan
- Data load sequence
- Go/no-go checklist
- Communication plan
- Hypercare model
- Support triage model
- Lessons learned
- Backlog for next phase

Exit gate:

- Data, setup, UAT, training, risks and support readiness are visible.
- Unresolved blockers are explicit.
- Book clearly distinguishes simulated go-live from real production advice.

## Milestone roadmap

Milestones should be managed as gates, not just dates.

| Milestone | Gate | Main evidence |
| --- | --- | --- |
| M0 Project mobilized | Project plan and Jira model exist | Project template docs |
| M1 Company understood | Universaarl case study and data needs are clear | Company profile and data catalog |
| M2 Blueprint approved | Fit-to-standard and setup routes are decided | Decision records |
| M3 Finance foundation ready | Finance setup is proven/parked/rejected | Playwright and setup evidence |
| M4 Master data ready | Key master data routes and templates exist | Data validation evidence |
| M5 Core processes proven | P2P/O2C/Inventory scenarios are repeatable or bounded | Playwright/UAT evidence |
| M6 Reporting and controls ready | Roles, workflows and reporting are meaningful | UAT and training evidence |
| M7 Customer enablement ready | Training and handbook are usable | Training matrix and handbook |
| M8 Book readiness gate | Chapters are curated and claims are classified | Book curation audit |
| M9 Go-live simulation complete | Cutover/hypercare plan exists | Go/no-go checklist |

## Roles

Project roles:

- Executive sponsor: owns value and scope.
- Project manager: owns plan, cadence, blockers and communication.
- Business Central solution architect: owns solution coherence and design decisions.
- Functional consultant finance: owns finance foundation and finance process fit.
- Functional consultant supply chain: owns purchasing, sales, inventory and warehouse fit.
- Data migration lead: owns data catalog, mapping, imports and validation.
- Test/UAT lead: owns test plan, scenarios, outcomes and defect triage.
- Training lead: owns role-based enablement and customer handbook.
- Book editor/curator: owns readable narrative and final-claim quality.
- Playwright automation lead: owns repeatable evidence scenarios and helper quality.
- Agent learning owner: owns skills, capabilities, MCP/tooling and repeated-pattern improvements.

In this repo, one agent may perform several roles. The role must still be named in the work item so the thinking mode is clear.

## Cadence

Recommended rhythm:

- Per task: update issue/evidence status.
- Per session: summarize changed files, decisions, risks, blockers and next work.
- Per workstream: maintain epic status, data needs, UAT, training and book output.
- Per milestone: run readiness review and update project dashboard.
- Per long-running goal: request compact status, do not constantly redirect it.

## Governance gates

Use these gates before marking work as done:

- Scope gate: Does this work belong to a workstream and epic?
- Source gate: Are product/method claims backed by official sources or clearly marked?
- Evidence gate: Is the BC result observed or Playwright-repeatable where needed?
- Data gate: Was customer data identified and validated?
- Route gate: Was the implementation path chosen deliberately?
- Risk gate: Are risky actions, write actions and dependencies visible?
- Training gate: Does the customer know what to learn and practice?
- Book gate: Is raw evidence converted into readable, curated text?
- Learning gate: Did repeated problems become skills, helpers or rules?

## Project documentation set

Core PM docs:

- `PROJECT-PLAN-DRAFT.md`
- `BC-IMPLEMENTATION-WORKBREAKDOWN-DRAFT.md`
- `JIRA-WORK-ITEM-MODEL.md`
- `DOCUMENTATION-CADENCE.md`
- `PROJECT-ARTIFACT-TEMPLATES.md`
- `CUSTOMER-DATA-CATALOG-DRAFT.md`
- `DECISION-LOG-DRAFT.md`
- `RISK-REGISTER-DRAFT.md`
- `REFINEMENT-BACKLOG.md`

Workstream docs:

- `WORKSTREAM-03-FINANCE-FOUNDATION-JIRA-DRAFT.md`
- later: one Jira draft per workstream

Operational repo docs:

- `.agent/BC-OPERATING-MODEL.md`
- `.agent/LEARNING-SYSTEM.md`
- `.agent/mcp/MCP-SERVER-REGISTRY.md`
- `.agent/capabilities.json`
- `.agent/skills/*`

## Change control

A change requires a decision record when it affects:

- scope
- company model
- chart of accounts
- posting logic
- VAT/tax assumptions
- dimension model
- master data model
- implementation route
- migration strategy
- UAT acceptance
- training scope
- book final claims
- live/sandbox write permissions
- MCP/tooling permissions

## Risk management

Risks must be tracked when they can affect:

- BC correctness
- repeatability
- book quality
- customer training
- UAT acceptance
- data quality
- go-live readiness
- compliance boundaries
- project scope

High-risk examples:

- missing customer data
- unclear posting group design
- VAT claims without proof/source
- fragile Playwright routes
- raw test notes entering the book
- configuration packages used without validation
- untracked setup changes
- roles/permissions designed too late

## Data strategy

Data is split into:

- configuration data
- master data
- opening balances
- open transactions
- reference data
- test/training data

Configuration and migration data must be planned separately. Configuration packages, Excel imports and APIs are valid routes when they are better than manual UI, but each route needs field understanding, validation, correction and book/training explanation.

## Testing strategy

Testing is layered:

- source review
- local repo checks
- Playwright navigation and setup evidence
- process scenario tests
- ledger/subledger trace tests
- UAT scenarios
- regression checks after changes
- book claim audit

Functional tests should map to business processes and realistic customer data. Playwright is not just a click recorder; it is an evidence mechanism.

## Training strategy

Training is role-based:

- end users: daily process, exceptions, simple corrections
- key users: setup awareness, data quality, checks, UAT, escalation
- admins: users, roles, workflows, monitoring and support
- management: reports, dimensions, KPIs and controls

Each training topic should include:

- learning objective
- BC concepts
- daily-use steps
- common mistakes
- practice exercise
- control questions
- escalation rule

## Book strategy

The book is not a project dump. It is curated:

- company context first
- setup purpose before steps
- decisions before click paths
- evidence before final claims
- customer explanation before internal test details
- training and UAT implications after each major process

The book should read like a Business Central consultant guiding a real implementation.

## Immediate next actions

1. Create customer data catalog.
2. Create decision log.
3. Create risk register.
4. Expand `WS02-CASE-STUDY-CORE`.
5. Expand `WS04-MASTER-DATA-PRODUCT`.
6. Map existing book chapters and test cases to workstreams.
7. Create a simple project dashboard once enough workstream docs exist.
