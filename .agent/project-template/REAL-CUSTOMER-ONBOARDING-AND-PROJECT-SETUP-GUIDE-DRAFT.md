# Real Customer Onboarding and Project Setup Guide Draft

Status: draft
Purpose: Reales Setup fuer Kunden-Onboarding, Projektstart, Confluence/Jira/GitHub/Business-Central-Arbeitsweise und wiederverwendbaren BC-Implementierungsblueprint.
Last reviewed: 2026-07-05

## Core decision

The project should be modeled like a real Business Central customer implementation, not like an artificial documentation exercise.

Recommended real-world operating model:

- Confluence is the project knowledge base, specification layer, customer handbook and training library.
- Jira is the operational project control system for work, owners, due dates, status, blockers and delivery tracking.
- GitHub is the technical workbench for repository work, Playwright, scripts, evidence files and automation improvements.
- Business Central sandbox environments are the product workspace for setup, validation, UAT preparation and training proof.
- Spec-driven work is a discipline inside Confluence/Jira, not a separate visible customer tool unless it proves value.

Do not introduce a new Jira issue type for specs. Larger epics and important route decisions get Confluence spec pages linked to normal Jira epics, stories and tasks.

## Source basis

This guide follows these current official patterns:

- Microsoft Dynamics 365 Success by Design recommends product-aligned project governance, early risk detection, recommended practices and reflection/discovery/alignment reviews.
- The Dynamics 365 implementation guide is written for program leaders, project managers, solution architects, system administrators and business stakeholders.
- Microsoft governance guidance says Dynamics 365 projects are business transformation projects, not only technical projects, and governance should be defined early and adapted during the lifecycle.
- Microsoft data guidance separates configuration data from migration data and requires planning, testing, monitoring, owners, dependencies and migration strategy.
- Microsoft training guidance says training plans should start early, be iterative, include scope, audience, schedule, delivery approach, validation, risks, environment and materials.
- Atlassian positions Jira as work tracking and Confluence as knowledge/project collaboration.
- GitHub Projects and Issues are appropriate for repo-integrated technical planning, not as the main customer-facing PM system for this project.

Primary references:

- https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/success-by-design
- https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/overview
- https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/project-governance
- https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/data-management-configuration-data-migration
- https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/training-strategy-training-plan-scope-and-audience
- https://learn.microsoft.com/en-us/dynamics365/guidance/implementation-guide/training-strategy-process-and-best-practices
- https://www.atlassian.com/software/confluence/jira-integration
- https://confluence.atlassian.com/jira
- https://docs.github.com/en/issues/planning-and-tracking-with-projects

## What the customer sees

The customer should see a professional, boring-in-the-best-way project setup:

- a clear kickoff deck or kickoff page
- project plan and milestone view
- roles and responsibilities
- decision log
- risk and issue log
- data-request tracker
- workshop calendar and agendas
- Solution Blueprint pages
- UAT plan and test scripts
- training plan and training materials
- customer handbook
- go-live readiness checklist
- hypercare/support model

The customer should not need to understand internal labels such as `BCSpec`, Playwright helper debt, agent prompts or repository internals.

## What the internal team maintains

The implementation team maintains the deeper machinery:

- Confluence spec templates for each major epic/workstream
- Jira boards, filters, components, labels and delivery views
- GitHub repo, scripts, Playwright evidence and automation helpers
- source/evidence status for final book or handbook claims
- project realism checks
- agent-learning and tooling backlog

Internal material may be technical. Customer-facing material must be curated.

## Project setup sequence

### 0. Internal project creation

Before inviting the customer:

- create Jira project
- create Confluence project space
- create GitHub repo or technical workspace if needed
- create Teams/meeting channel if used
- define initial roles and access model
- create draft project plan
- create draft workstreams and first epics
- create decision/risk/data-request registers
- create onboarding checklist
- create BC environment strategy
- define naming conventions for Jira, Confluence, GitHub and Business Central companies/environments

Output:

- internal ready-to-kickoff checklist
- draft project structure
- kickoff agenda
- initial customer data request pack

### 1. Customer onboarding kickoff

Kickoff should align people, scope, process and responsibilities.

Required agenda:

- project goals and success criteria
- scope and explicit out-of-scope
- project roles, escalation and decision rights
- tool model: Confluence for knowledge, Jira for work/status, BC sandbox for validation
- phase model and milestones
- data-request approach
- workshop cadence
- UAT/training expectations
- source/evidence and compliance boundaries
- immediate next actions

Output:

- approved kickoff notes
- confirmed roles
- confirmed communication cadence
- first decisions and risks
- first data requests assigned

### 2. Discovery and fit-to-standard

This phase clarifies how the customer works and where standard Business Central should be used.

Workshops:

- company/legal entity and localization context
- finance foundation
- chart of accounts, dimensions and posting setup
- customers/vendors/items/services
- purchasing
- sales
- inventory and warehouse
- users, permissions, approvals and controls
- reporting
- migration/opening balances/open transactions
- training and UAT readiness

Output:

- Confluence discovery notes
- Jira stories/tasks for open follow-ups
- data-request gaps
- route decisions
- initial Solution Blueprint sections
- risks for nonstandard or unclear requirements

### 3. Blueprint and route approval

This phase turns discovery into decisions.

Each major workstream needs:

- business process summary
- fit-to-standard decision
- required customer data
- implementation route
- evidence/UAT/training route
- open assumptions
- risks and dependencies

Output:

- Solution Blueprint draft
- approved or parked route decisions
- Jira epics and stories refined to ready status
- data packages validated enough for setup

### 4. Build, configuration and controlled proof

This is where the team configures Business Central and proves behavior.

Rules:

- no blind setup without source, customer data, decision or marked assumption
- compare route candidates where relevant: manual UI, Assisted Setup, templates, configuration packages, Excel import, API, AL extension or park/no-change
- Playwright validates important visible behavior; it does not replace consultant review or UAT
- raw screenshots and logs are internal evidence until curated

Output:

- configured sandbox
- evidence notes
- updated decisions/risks
- Jira tasks completed or blocked
- draft handbook/training sections

### 5. Data migration and readiness

Data work starts early and continues through the project.

Required data categories:

- configuration data
- master data
- opening balances
- open customer/vendor entries
- open sales/purchase documents
- inventory quantities and values
- users/roles/permissions
- reports and integrations

Each data request must define:

- owner
- due date
- format
- required fields
- validation rules
- BC usage
- import route candidate
- risks if missing
- status

Output:

- data-request tracker
- data quality findings
- migration strategy
- test load results
- cutover data checklist

### 6. UAT and training

Training and UAT are not last-minute events.

Training planning starts at project start. Training materials are updated as solution details become real.

UAT needs:

- business-role owner
- realistic test data
- expected result
- pass/fail criteria
- defect path
- evidence boundary

Training needs:

- audience
- learning objectives
- exercises
- common mistakes
- escalation rules
- handbook output
- validation method

Output:

- UAT scripts
- UAT defect log
- role-based training plan
- training materials
- customer handbook sections

### 7. Cutover, go-live and hypercare

Go-live readiness must combine process, data, users and support.

Readiness checks:

- critical configuration approved
- data migration accepted
- UAT pass or accepted exceptions
- users trained
- open risks reviewed
- cutover plan approved
- support model ready
- rollback/contingency known

Output:

- go-live checklist
- cutover runbook
- hypercare plan
- known issues register
- retrospective notes

## Confluence structure

Recommended space tree:

```text
BC Implementation Blueprint
  00 Start Here
  01 Project Charter and Governance
  02 Project Plan and Milestones
  03 Roles and Communication
  04 Workstreams
    WS02 Case Study / Company Core
    WS03 Finance Foundation
    WS04 Master Data / Product
    WS05 Purchasing
    WS06 Sales
    WS07 Inventory
    WS08 Warehouse
    WS09 Security / Workflows
    WS10 Reporting
    WS11 Data Migration / Integration
    WS13 UAT / Training / Cutover
  05 Solution Blueprint
  06 Customer Data Requests
  07 Decisions
  08 Risks and Issues
  09 UAT
  10 Training
  11 Customer Handbook
  12 Evidence and Sandbox Notes
  13 Go-Live and Hypercare
  14 Universaarl Reference Project
```

## Jira setup

Use normal, human-friendly Jira.

Default issue types:

- Epic
- Story
- Task
- Bug
- Sub-task

Do not create a dedicated `Spec Change` issue type.

Use fields/labels/components for meaning:

- Workstream
- BC Area
- BC Company/Environment
- Implementation Route
- Customer Data Required
- Evidence Status
- UAT Required
- Training Output
- Book/Handbook Output
- Risk Level

Recommended labels:

- `customer-data`
- `decision-needed`
- `risk`
- `uat`
- `training`
- `handbook`
- `playwright-evidence`
- `sandbox-only`
- `source-needed`
- `final-claim-blocked`

Workflow:

```text
Backlog
Needs Discovery
Ready for Design
Needs Customer Data
Ready for Setup
In Setup
Ready for Evidence
Ready for UAT
In UAT
Ready for Training
Ready for Handbook
Done
Blocked
Parked
Rejected
```

Small Jira instances can simplify this. The point is not many statuses; the point is that missing data, UAT, training and handbook work are visible.

## Spec-driven without tool theater

For a major epic, create a Confluence spec page. Link it from the Jira epic.

Spec page sections:

```text
Spec ID:
Linked Jira epic:
Workstream:
Business problem:
Target outcome:
Scope:
Out of scope:
Customer roles:
Customer data required:
Requirements:
Business Central route decision:
Configuration/migration route:
Decisions:
Risks:
UAT scenarios:
Training impact:
Handbook/book impact:
Evidence plan:
Acceptance criteria:
Open questions:
```

The spec page is not a second backlog. It explains intent and acceptance. Jira tracks execution.

## GitHub setup

GitHub is used for technical artifacts:

- Playwright tests and helpers
- scripts and checks
- generated evidence files
- repo documentation
- technical defects
- agent-learning assets

Rules:

- Link GitHub technical work back to Jira where it affects customer/project outcomes.
- Do not store real customer secrets or sensitive personal data.
- Keep customer-facing handbook text separate from raw Playwright logs.
- Evidence must state whether it is sandbox observation, Playwright-repeatable, UAT-accepted or source-backed.

## Business Central environment setup

For this repo and Universaarl, we can simulate the model with a sandbox. For a real customer project, define environments explicitly:

- DEV or partner build sandbox
- CONFIG or golden configuration workspace where applicable
- TEST/UAT
- TRAINING
- PROD

For Business Central small/medium projects, the exact environment count can be simplified, but the roles must still be clear:

- Where do consultants configure?
- Where do users test?
- Where do users train?
- What data is safe to enter?
- What gets reset, copied or preserved?
- What is the source of truth for configuration?

## Customer onboarding checklist

Before kickoff:

- [ ] customer sponsor named
- [ ] project manager named
- [ ] key users named per area
- [ ] IT/admin contact named
- [ ] tax/accounting advisor boundary known
- [ ] communication channels created
- [ ] Confluence space created
- [ ] Jira project created
- [ ] BC environment strategy drafted
- [ ] first project plan drafted
- [ ] initial risks drafted
- [ ] initial data requests drafted

At kickoff:

- [ ] scope explained
- [ ] out-of-scope explained
- [ ] roles confirmed
- [ ] decision path confirmed
- [ ] tool model explained
- [ ] workshop cadence agreed
- [ ] first data request pack assigned
- [ ] next two weeks scheduled

After kickoff:

- [ ] kickoff notes published
- [ ] Jira epics visible
- [ ] Confluence project home updated
- [ ] first data requests tracked
- [ ] first workshops booked
- [ ] first decisions/risks logged
- [ ] customer knows where to find project status

## Definition of real enough

This setup is realistic only when:

- the customer can understand what is expected from them
- the PM can see owner, due date, status and blocker
- the consultant can see requirements, data and implementation route
- the architect can see decisions, risks and dependencies
- the trainer can see role, process, material and evidence
- the book/handbook curator can see what is final, draft, blocked or unproven
- the automation agent can see what should be proven and why

If a document or ticket does not help any of these roles, it should be merged, simplified or deleted.
