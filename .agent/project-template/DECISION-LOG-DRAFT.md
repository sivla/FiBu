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
