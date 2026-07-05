# Universaarl BC Project Template

Status: draft
Purpose: Projektakte fuer eine realistische Business-Central-Einfuehrung, das kuratierte Buch, Kundenschulung, UAT und Playwright-Beweisfuehrung.
Last reviewed: 2026-07-05

## Why this exists

This project should be handled like a real Business Central implementation, not like a pile of test runs. Every setup, process, book chapter and Playwright proof should connect to a project structure that a consultant could also maintain in Jira.

The target is one integrated system:

- Jira-style work management for scope, epics, tasks, risks and decisions.
- Business Central consulting logic for setup, data, process and training.
- Book curation so raw evidence becomes readable customer-facing material.
- Playwright evidence so important claims can be reproduced in the sandbox.
- Agent learning so repeated problems become skills, helpers and better rules.

## Current files

- `PROJECT-PLAN-DRAFT.md`
  - Complete project plan draft with phases, milestones, governance, roles, gates and immediate next actions.
- `PROJECT-DASHBOARD-DRAFT.md`
  - Compact project manager view with milestone, workstream readiness, top decisions, risks and next work.
- `REAL-CUSTOMER-ONBOARDING-AND-PROJECT-SETUP-GUIDE-DRAFT.md`
  - Real customer onboarding and project setup guide for Confluence, Jira, GitHub, BC sandbox, data, UAT, training and handbook work.
- `AGENT-OPERATING-MODEL-DRAFT.md`
  - Schlankes Rollen-, Routing- und Governance-Modell fuer Orchestrator, Spezialagenten, Modellstaerken, Reviews und `playthru`-Exklusivitaet.
- `GOAL-TRANSITION-PROTOCOL.md`
  - Protocol for switching a long-running goal into the project-management system at a safe checkpoint.
- `GOAL-TRANSITION-CARD-2026-07-05.md`
  - Current transition card for moving the active long-running goal into project-mode defaults.
- `BOOK-AS-PROJECT-MANAGEMENT-MODEL.md`
  - Model for treating the complete book as a realistic Business Central implementation project.
- `BOOK-PROJECT-TICKET-BACKLOG-DRAFT.md`
  - Initial Jira-style backlog for the book/project simulation.
- `PROJECT-CAST-AND-STAKEHOLDERS-DRAFT.md`
  - Fictional but realistic project characters, roles, dual responsibilities and stakeholder tensions.
- `PROJECT-STORYLINE-DRAFT.md`
  - End-to-end project story arc from kickoff to go-live simulation and retrospective.
- `PROJECT-SCENE-CARDS-DRAFT.md`
  - Scene cards that turn characters and storyline into tickets, data, decisions, BC work, evidence and training.
- `TRAINING-STRATEGY-AND-CURRICULUM-DRAFT.md`
  - Role- and phase-based training curriculum linked to BC workstreams, UAT, handbook output and evidence.
- `ROLE-BASED-TRAINING-MATRIX-DRAFT.md`
  - Training matrix by audience, module, exercise, evidence gate and status.
- `TRAINING-MODULE-CARDS-DRAFT.md`
  - First concrete training cards with role, exercise, typical mistakes, success check, escalation, handbook output, UAT and evidence status.
- `PLAYWRIGHT-TRAINING-EVIDENCE-MAP-DRAFT.md`
  - Mapping from training modules to Playwright, sandbox evidence, UAT and handbook readiness.
- `PLAYWRIGHT-SCENARIO-CATALOG-WS02-WS03-WS04-DRAFT.md`
  - Read-first Playwright scenario catalog for company context, navigation, finance-foundation setup dependencies and master-data pages.
- `REALISM-STANDARD-DRAFT.md`
  - Quality gate for keeping the fictional Universaarl project realistic instead of demo-perfect.
- `REALISM-REVIEW-DATA-REQUESTS-2026-07-05.md`
  - First realism review for the Jira-ready core and master-data request candidates.
- `SPEC-DRIVEN-SIDEPROJECT-DRAFT.md`
  - OpenSpec/Spec-Kit-inspired sideproject for testing a BC-specific spec-driven workflow.
- `BCSPEC-PILOT-001-MASTER-DATA-PRODUCT-TRAINING.md`
  - First manual BCSpec pilot for master-data/product training, customer data, UAT and Playwright evidence.
- `BC-IMPLEMENTATION-WORKBREAKDOWN-DRAFT.md`
  - Main workstream, epic, story and task breakdown.
- `WORKSTREAM-02-CASE-STUDY-CORE-JIRA-DRAFT.md`
  - Detailed workstream draft for Universaarl case-study core, company story, organization model, roles, evidence boundaries, training and book outputs.
- `JIRA-WORK-ITEM-MODEL.md`
  - How to model the work in Jira-like terms.
- `DOCUMENTATION-CADENCE.md`
  - How to keep documentation current while work happens.
- `PROJECT-ARTIFACT-TEMPLATES.md`
  - Reusable templates for issues, data requests, decisions, risks, UAT, training and book output.
- `CUSTOMER-DATA-CATALOG-DRAFT.md`
  - Structured customer data request catalog by workstream and data category.
- `DATA-REQUEST-JIRA-CANDIDATES-DRAFT.md`
  - First Jira-ready Data Request candidates and package-derived dependency tickets for company information, organization model, customers, vendors and items/services.
- `CUSTOMER-DATA-SIMULATION-DRAFT.md`
  - Simulated customer data packages, file structures, validation rules and consultant review flow.
- `SIMULATED-DATA-TABLES-CORE-MD-DRAFT.md`
  - First concrete simulated packages for company information, organization model, customers, vendors and items/services, with owners, validation, route candidates, UAT/training impact and blocked setup dependencies.
- `ROUTE-DECISION-CARDS-FOUNDATION-MASTER-DATA-DRAFT.md`
  - First route decision cards for numbering, posting groups, payment terms and product/UOM setup before live master-data work.
- `DECISION-LOG-DRAFT.md`
  - Project decision register for scope, setup, route, evidence and book decisions.
- `RISK-REGISTER-DRAFT.md`
  - Initial risk register for project, BC setup, book quality and automation risks.
- `REFINEMENT-BACKLOG.md`
  - Ordered refinement backlog for turning the draft into Jira-ready project material.
- `WORKSTREAM-03-FINANCE-FOUNDATION-JIRA-DRAFT.md`
  - First detailed workstream draft for finance foundation, setup decisions, Playwright scenarios and book outputs.
- `WORKSTREAM-04-MASTER-DATA-PRODUCT-JIRA-DRAFT.md`
  - Detailed workstream draft for customers, vendors, items, services, locations, templates, configuration-package choices, UAT, training and book outputs.

## Working rule

Every meaningful piece of work should leave a trace in at least one of these forms:

- a Jira-style issue or backlog item
- a customer data request
- a decision record
- a risk or blocker
- a UAT scenario
- a training/handbook output
- a Playwright evidence scenario
- a book chapter or book-candidate note
- a skill/helper/capability improvement
- a BCSpec-style change note for larger cross-cutting changes

If work cannot be connected to any of those traces, it is probably too isolated or not yet understood.

## Project levels

```text
Initiative
  -> Workstream
      -> Epic
          -> Story
              -> Task
```

The hierarchy is intentionally larger than Jira's default issue hierarchy. In Jira, `Workstream` can be represented as a component, label, parent initiative, plan field or board swimlane, depending on the Jira setup.

## Documentation standard

Before work:

- define goal, scope, owner and dependencies
- classify required customer data
- choose implementation route
- name evidence and source needs
- define training and book output

During work:

- record decisions when they happen
- record blocked assumptions instead of hiding them
- update evidence status
- keep customer-facing and internal-agent language separate

After work:

- update acceptance status
- capture what changed in BC or in the repo
- record what was proven, not proven or rejected
- create follow-up tickets for gaps
- convert repeated issues into skills, helpers or rules

## Critical principle

The project should grow like a professional implementation file. More documentation is not automatically better. Good documentation must reduce confusion, expose decisions, support training, improve the book and make Playwright runs more repeatable.
