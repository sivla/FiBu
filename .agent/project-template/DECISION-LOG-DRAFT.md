# Decision Log Draft

Status: draft
Purpose: Projektentscheidungen fuer Universaarl Business Central nachvollziehbar halten.
Last reviewed: 2026-07-05

## Principle

Decisions are not hidden in chat, test output or book prose. Any decision that changes scope, setup, migration, testing, training or final book claims must be recorded.

## Decision template

```text
Decision ID:
Title:
Date:
Workstream:
Epic:
Owner:
Problem:
Options considered:
Decision:
Reason:
Source basis:
Sandbox/evidence basis:
Customer impact:
Book impact:
Playwright impact:
Risks:
Reversal/correction path:
Status:
```

## Decision status

- `proposed`
- `accepted`
- `rejected`
- `superseded`
- `parked`
- `needs-source`
- `needs-sandbox-evidence`
- `needs-customer-approval`

## Initial decisions

### DEC-001 Treat the repo as a real implementation project

Date: 2026-07-05
Workstream: `WS01-GOVERNANCE`
Status: accepted

Problem:

The project risks becoming a collection of test runs, notes and book fragments.

Decision:

Treat the repo as a Business Central implementation program with workstreams, epics, stories, tasks, risks, decisions, customer data requests, UAT, training, book curation and Playwright evidence.

Reason:

This creates a durable structure for real project thinking and prevents raw automation work from becoming the project strategy.

Source basis:

- Microsoft Dynamics 365 implementation guidance and Success by Design emphasize governance, strategy, data, testing and deployment readiness.

Book impact:

Book chapters should map to workstreams and not read like raw test logs.

Playwright impact:

Playwright scenarios must map to project outcomes, UAT or evidence needs.

Risks:

- documentation can become noise if not tied to decisions and deliverables.

### DEC-002 Separate product model, inventory and warehouse

Date: 2026-07-05
Workstream: `WS04-MASTER-DATA-PRODUCT`, `WS07-INVENTORY-COSTING-STOCK`, `WS08-WAREHOUSE-LOGISTICS`
Status: accepted

Problem:

Combining `Lager und Artikel` is too broad and hides important BC concepts.

Decision:

Separate:

- product/master data model
- inventory, costing and stock control
- warehouse and physical logistics

Reason:

Items, inventory valuation and warehouse execution have different ownership, setup, evidence and training needs.

Book impact:

The book can explain product master data before inventory effects and warehouse processes.

Playwright impact:

Evidence scenarios can prove item setup, item/value entries and warehouse actions separately.

### DEC-003 Use Finance Foundation as first detailed workstream

Date: 2026-07-05
Workstream: `WS03-FINANCE-FOUNDATION`
Status: accepted

Problem:

Most process work depends on finance setup, posting groups, VAT, dimensions and number series.

Decision:

Use `WS03-FINANCE-FOUNDATION` as the first fully expanded Jira-ready workstream pattern.

Reason:

Finance foundation gates sales, purchasing, inventory and reporting.

Risks:

- over-focusing on finance can delay process realism if no milestone limits are used.

### DEC-004 Use scalable BC implementation routes where sensible

Date: 2026-07-05
Workstream: all implementation workstreams
Status: accepted

Problem:

Manual UI clicks are useful for learning and screenshots but are not always realistic for bulk setup or migration.

Decision:

Every major setup or master-data activity must compare manual UI, Assisted Setup, configuration packages, Excel import, API, AL extension and no-change/park route where relevant.

Reason:

Real projects use scalable setup/data routes, especially for chart of accounts, posting groups, dimensions, master data and migration.

Book impact:

The book should teach both the individual UI concept and the scalable project route.

Playwright impact:

Playwright validates outcomes and can demonstrate UI concepts, but it is not always the implementation route.

### DEC-005 Keep official sources above community sources

Date: 2026-07-05
Workstream: `WS14-BOOK-PLAYWRIGHT-LEARNING`
Status: accepted

Problem:

BC/AL/MCP ecosystem knowledge includes community tools and opinions that may help but should not define final product claims.

Decision:

Use Microsoft Learn, MB-800, Business Central docs and Dynamics 365 implementation guidance as authority for product and method claims. Community MCPs and articles are advisory unless verified.

Reason:

The book and consultant agent must be reliable.

Risks:

- official docs may not cover every implementation nuance, so sandbox evidence and clearly marked assumptions still matter.

### DEC-006 Transition long-running goals into the project system

Date: 2026-07-05
Workstream: `WS01-GOVERNANCE`, `WS14-BOOK-PLAYWRIGHT-LEARNING`
Status: accepted

Problem:

A long-running agent can keep working in the old queue/execution mode even after the repo has a project-management structure.

Decision:

Use `GOAL-TRANSITION-PROTOCOL.md` to switch long-running goals into the project system at a safe checkpoint.

Reason:

The transition preserves useful work while forcing every next step to map to workstream, epic, issue type, customer data, risk, UAT/training, book and Playwright/evidence impact.

Book impact:

Book work must be connected to workstreams and final-claim gates instead of growing as isolated fragments.

Playwright impact:

Playwright work must map to project evidence, UAT or agent-learning tasks.

Risks:

- forcing the transition mid-action could interrupt valid work
- delaying the transition too long lets old execution habits continue

Reversal/correction path:

If the transition happens too early, the agent may finish the current small case, then repeat the transition card before starting the next major item.

### DEC-007 Treat the complete book as a project-management simulation

Date: 2026-07-05
Workstream: `WS01-GOVERNANCE`, `WS13-UAT-TRAINING-CUTOVER`, `WS14-BOOK-PLAYWRIGHT-LEARNING`
Status: accepted

Problem:

The book could become a set of Business Central explanations without showing how a real implementation project is managed.

Decision:

Treat the entire book as a realistic Business Central project simulation. Each major chapter should include project context: Jira tickets, customer data requests, simulated customer data, consultant review, decisions, risks, BC implementation route, Playwright evidence, UAT, training and book curation.

Reason:

This makes the book practical and real. Readers learn not only Business Central behavior, but also how a consultant structures, executes and teaches an implementation project.

Customer impact:

The customer becomes part of the story through data requests, decisions, UAT and training.

Book impact:

Chapters should read like a guided implementation journey instead of isolated feature documentation.

Playwright impact:

Automation scenarios should map to project evidence, UAT, training or book claims.

Risks:

- fictional data might be mistaken for real customer data
- project tickets could become decorative if they do not drive decisions or outputs

Reversal/correction path:

All simulated customer data must be labeled as fictional Universaarl case-study data. Tickets without project purpose should be rejected or merged.

### DEC-008 Use recurring fictional characters to drive the project story

Date: 2026-07-05
Workstream: `WS02-CASE-STUDY-CORE`, `WS13-UAT-TRAINING-CUTOVER`, `WS14-BOOK-PLAYWRIGHT-LEARNING`
Status: accepted

Problem:

The project/book structure can still feel abstract if there are no recurring people, responsibilities, questions and conflicts.

Decision:

Use a fictional but realistic cast of customer and implementation-partner characters. Characters may own multiple responsibilities when that reflects real projects. They should drive data requests, decisions, risks, UAT, training, Playwright evidence and book scenes.

Reason:

Business Central implementations are shaped by people. Recurrent characters make the project understandable and give the reader a realistic sense of why BC decisions happen.

Customer impact:

The fictional customer team becomes concrete: sponsor, CFO, finance key user, purchasing manager, sales lead, warehouse lead, IT admin, training coordinator and tax advisor.

Book impact:

Chapters can open with short project scenes and then move into BC explanation, evidence and training.

Playwright impact:

Playwright scenarios should map to character-owned business questions or UAT needs where possible.

Risks:

- scenes could become decorative fiction if they do not teach project or BC content
- character names could be mistaken for real people if disclaimers are missing

Reversal/correction path:

Keep all named persons explicitly fictional. Remove scenes that do not produce tickets, decisions, data, BC work, evidence, UAT/training or book learning.

### DEC-009 Training material must be role-based and evidence-backed

Date: 2026-07-05
Workstream: `WS13-UAT-TRAINING-CUTOVER`, `WS14-BOOK-PLAYWRIGHT-LEARNING`
Status: accepted

Problem:

Training could become generic slides or handbook text that is disconnected from actual Business Central behavior, customer roles and project evidence.

Decision:

All professional training material must be role-based, tied to a workstream/epic, linked to handbook/book output and backed by source, Universaarl sandbox observation, Playwright repeatability or UAT acceptance where it teaches concrete BC behavior.

Reason:

Customer training only has value when users learn their actual responsibilities, daily process, checks, exceptions and escalation routes.

Customer impact:

Each audience receives a different learning path: management, finance, purchasing, sales, inventory/warehouse, admin, key users and project/book team.

Book impact:

Book chapters must produce usable handbook and training sections, not just explanatory prose.

Playwright impact:

Playwright scenarios should be mapped to training modules when they can prove or demonstrate the behavior being taught.

Risks:

- training material can overclaim if the BC behavior is not proven
- technical Playwright probes can be mistaken for customer-facing exercises

Reversal/correction path:

Mark modules as `draft`, `evidence-needed`, `technical-only` or `parked` until evidence, UAT or source gates are satisfied.

### DEC-010 Realism is a quality gate for project/book/training artifacts

Date: 2026-07-05
Workstream: all workstreams
Status: accepted

Problem:

The Universaarl project could become too smooth and demo-like: perfect data, instant decisions, always-available roles, no missing fields, no UAT findings and no realistic project constraints.

Decision:

Use `REALISM-STANDARD-DRAFT.md` as a quality gate before promoting project plans, tickets, customer data, scenes, book chapters, training material, UAT scenarios or Playwright evidence to a more final status.

Reason:

A realistic Business Central implementation includes incomplete data, role constraints, phased scope, trade-offs, review boundaries, defects, training gaps and explicit risks.

Customer impact:

The fictional customer behaves like a real customer: data arrives with owners, gaps, follow-up questions, availability constraints and sign-off needs.

Book impact:

The book becomes more credible because it shows real project behavior instead of perfect demo flow.

Playwright impact:

Playwright remains evidence for repeatable behavior, not proof that the customer accepted the process or that the project is production-ready.

Risks:

- too much realism can create distracting noise
- too little realism makes the book feel artificial

Reversal/correction path:

If a section becomes too messy, simplify it intentionally and label it as `training-simplification` or `book-simplification`.

### DEC-011 Test BCSpec before adopting OpenSpec globally

Date: 2026-07-05
Workstream: `WS01-GOVERNANCE`, `WS14-BOOK-PLAYWRIGHT-LEARNING`
Status: proposed

Problem:

OpenSpec and Spec Kit offer useful spec-driven workflows, but the Universaarl repo is not only a code project. It contains Business Central implementation work, project management, customer data requests, UAT, training, book curation, Playwright evidence and agent-learning artifacts.

Decision:

Test a lightweight BC-specific spec-driven workflow called `BCSpec` with one pilot before installing OpenSpec or creating a canonical `.agent/spec-driven/` structure.

Reason:

The project benefits from persistent specs and change proposals, but the artifact set must include BC route decisions, customer data, evidence, training, UAT and book impact. A manual pilot will show whether the workflow improves delivery quality or only adds documentation overhead.

Source basis:

- OpenSpec docs: persistent specs, change folders, proposal/spec/design/tasks and archive workflow.
- OpenSpec customization docs: custom schemas and project configuration.
- GitHub Spec Kit docs: structured spec/plan/tasks/implementation flow.

Book impact:

Large book changes can be reviewed for intent before raw execution becomes prose.

Playwright impact:

Evidence scenarios can be planned as requirements instead of discovered accidentally after automation runs.

Risks:

- spec-driven files can duplicate Jira/backlog/project docs
- agents may write polished specs without doing source, sandbox, UAT or Playwright verification

Reversal/correction path:

If the pilot adds overhead without improving quality, keep the useful template fragments and reject BCSpec as a standing process.
