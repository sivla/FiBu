# Jira Work Item Model

Status: draft
Purpose: Define how Universaarl Business Central implementation work should be represented in Jira-like planning.
Last reviewed: 2026-07-05

## Recommended hierarchy

```text
Initiative: Universaarl Business Central Implementation, Book and Evidence System
Workstream: Large delivery or fachliche domain
Epic: Deliverable package
Story: Repeated project activity type or user/business outcome
Task: Concrete work item
Sub-task: Optional implementation/check step
```

Jira implementations differ. If Jira does not support `Initiative` or `Workstream` directly, use components, labels, parent links or custom fields.

## Workstream field

Recommended values:

- `WS01-GOVERNANCE`
- `WS02-CASE-STUDY-CORE`
- `WS03-FINANCE-FOUNDATION`
- `WS04-MASTER-DATA-PRODUCT`
- `WS05-PURCHASING-SOURCE-TO-PAY`
- `WS06-SALES-ORDER-TO-CASH`
- `WS07-INVENTORY-COSTING-STOCK`
- `WS08-WAREHOUSE-LOGISTICS`
- `WS09-SECURITY-WORKFLOWS-CONTROLS`
- `WS10-REPORTING-ANALYTICS`
- `WS11-DATA-MIGRATION-INTEGRATION`
- `WS12-ADVANCED-AREAS`
- `WS13-UAT-TRAINING-CUTOVER`
- `WS14-BOOK-PLAYWRIGHT-LEARNING`

## Issue types

Use these types consistently:

- `Initiative`: whole project outcome or major phase.
- `Epic`: fachliches deliverable package.
- `Story`: customer/business capability or repeated project activity.
- `Task`: concrete action.
- `Bug`: defect in BC setup, Playwright, book claim or evidence.
- `Spike`: research or discovery without a known implementation route.
- `Decision`: architecture/process decision that changes the route.
- `Risk`: tracked risk with owner and mitigation.
- `Data Request`: customer data required before work can proceed.
- `UAT Scenario`: customer acceptance test.
- `Training Item`: customer enablement unit.
- `Book Output`: book section, chapter fragment or curation task.
- `Playwright Evidence`: repeatable proof scenario.
- `Skill/Helper Improvement`: agent learning or automation improvement.

If Jira cannot add custom issue types, represent custom types with labels.

## Standard labels

Domain labels:

- `bc-finance`
- `bc-sales`
- `bc-purchasing`
- `bc-inventory`
- `bc-warehouse`
- `bc-master-data`
- `bc-security`
- `bc-reporting`
- `bc-migration`
- `bc-training`
- `bc-book`
- `bc-playwright`

Evidence labels:

- `evidence-required`
- `source-required`
- `playwright-required`
- `uat-required`
- `book-candidate`
- `final-claim-blocked`
- `sandbox-only`
- `customer-input-needed`

Route labels:

- `route-ui`
- `route-assisted-setup`
- `route-config-package`
- `route-excel-import`
- `route-api`
- `route-al`
- `route-no-change`
- `route-parked`

Risk labels:

- `risk-data-quality`
- `risk-posting`
- `risk-compliance`
- `risk-training`
- `risk-repeatability`
- `risk-scope`

## Workflow statuses

Recommended statuses:

- `Backlog`
- `Needs Discovery`
- `Ready for Design`
- `Design in Progress`
- `Needs Customer Data`
- `Ready for Setup`
- `In Setup`
- `Ready for Evidence`
- `In Playwright Validation`
- `Ready for UAT`
- `In UAT`
- `Ready for Training`
- `Ready for Book Curation`
- `Done`
- `Parked`
- `Rejected`
- `Blocked`

Do not use `Done` for work that is only locally tried but not evidenced, accepted or curated according to its issue type.

## Definition of Ready

A work item is ready only when it has:

- clear business purpose
- workstream and epic
- owner or responsible role
- target company and environment if BC work is involved
- required customer data identified
- dependencies identified
- implementation route candidate
- source/evidence need identified
- acceptance criteria
- rollback, cleanup or park strategy for risky changes

## Definition of Done

A work item is done only when:

- the intended outcome is achieved or explicitly rejected
- changed setup/data/documents are recorded
- evidence status is stated
- source status is stated for product claims
- customer/UAT status is clear where relevant
- training/handbook impact is handled
- book impact is handled
- follow-up gaps are ticketed
- no hidden assumption remains as a final claim

## Naming convention

Use this pattern:

```text
[Workstream] Epic: Short fachlicher name
[Epic] Story: Short business outcome
[Epic] Task: Concrete action
```

Examples:

```text
[WS03] Epic: Posting Groups and Posting Setup
[Posting Groups] Story: Define account determination model
[Posting Groups] Task: Validate General Posting Setup route in UNIVERSAARL-DE
```

```text
[WS07] Epic: Inventory Posting Setup
[Inventory Posting Setup] Story: Prepare stock valuation foundation
[Inventory Posting Setup] Task: Prove item value entry to G/L relationship after controlled scenario
```

## Required custom fields

Recommended fields:

- `Workstream`
- `BC Company`
- `BC Environment`
- `Business Process`
- `Implementation Route`
- `Customer Data Required`
- `Source Required`
- `Playwright Required`
- `UAT Required`
- `Training Output`
- `Book Output`
- `Evidence Status`
- `Risk Level`
- `Decision Record`

## Evidence status values

- `not-needed`
- `needed`
- `planned`
- `observed-lab`
- `observed-universaarl`
- `playwright-repeatable`
- `source-backed`
- `uat-accepted`
- `book-candidate`
- `final`
- `rejected`
- `blocked`

## Project board views

Recommended boards or filters:

- `Implementation Board`: setup, data and process work.
- `Customer Data Board`: all open data requests.
- `UAT Board`: scenarios, defects and acceptance.
- `Training Board`: role-based training and handbook work.
- `Book Board`: chapter curation and final-claim gates.
- `Automation Board`: Playwright, skills, MCP and helper work.
- `Risk/Decision Board`: open risks, blockers and decisions.

## Anti-patterns

Avoid:

- one giant epic called `Business Central Setup`
- raw Playwright test names as customer-facing issue titles
- marking work done because a screenshot exists
- mixing customer handbook text with internal agent/evidence language
- using configuration packages as shortcuts without explaining fields and validation
- using manual UI clicks for bulk setup when a scalable route is clearly better
- adding more categories when the real issue is an unresolved decision
