# BCSpec Pilot 001: Master Data Product Training and Evidence

Status: proposed
Purpose: First manual pilot for an OpenSpec-inspired BCSpec workflow.
Last reviewed: 2026-07-05
Related workstreams: `WS04-MASTER-DATA-PRODUCT`, `WS13-UAT-TRAINING-CUTOVER`, `WS14-BOOK-PLAYWRIGHT-LEARNING`

## Proposal

The project needs a repeatable way to refine master-data/product work without jumping directly from chat into BC clicks or book prose.

This pilot tests whether a BCSpec-style change note improves:

- customer data requests
- implementation-route decisions
- training design
- Playwright evidence planning
- book curation
- Jira-ready task breakdown

In scope:

- customers, vendors, items, services and non-inventory items as a project/training/evidence package
- route comparison for manual UI, templates, configuration packages, Excel import, API and park/no-change
- training module and UAT scenario shape for master data
- evidence map for Playwright-readable UI proof

Out of scope:

- final production migration
- tax/legal validation
- live BC data cleanup
- full inventory costing or warehouse execution

## Requirements

### REQ-001 Master data must be taught as business ownership, not only fields

Priority: MUST
Type: training behavior

Rationale:

Customer users need to understand who owns customers, vendors and items, what fields matter for downstream posting, and when a missing field blocks a process.

Scenario:

```text
Given a sales user is trained on customer master data
When the user creates or reviews a customer
Then the training must explain business ownership, required posting/tax/payment fields, blocked/active handling, and where to escalate incomplete data
```

Evidence needed:

- official BC source for relevant product behavior
- sandbox observation for page behavior
- training exercise mapped to a role

### REQ-002 Bulk setup routes must be considered before manual mass entry

Priority: MUST
Type: project behavior

Rationale:

A medium/large customer would not realistically maintain all master data by repeated manual UI clicks.

Scenario:

```text
Given Universaarl provides a customer, vendor or item list
When the project plans setup or migration
Then the route decision must compare manual UI, templates, configuration packages, Excel import, API, AL and park/no-change where relevant
```

Evidence needed:

- route decision in the workstream or decision log
- UI validation path for a sample record
- clear statement where Playwright validates outcome rather than performing bulk migration

### REQ-003 Playwright evidence must be linked to UAT or book claims

Priority: MUST
Type: evidence behavior

Rationale:

Screenshots and test logs are only useful if they prove a project question, training step or book claim.

Scenario:

```text
Given a Playwright scenario creates or reviews a master-data record
When the result is used in the book or training package
Then the scenario must name the business question, expected visible result, repeatability status and evidence boundary
```

Evidence needed:

- Playwright evidence map entry
- screenshot truth or visible-page assertion
- book/training status not higher than the evidence supports

### REQ-004 Customer data gaps must become project artifacts

Priority: MUST
Type: project behavior

Rationale:

Incomplete customer master data is realistic and should drive follow-up questions instead of silent assumptions.

Scenario:

```text
Given a provided item list misses posting groups or units of measure
When the consultant reviews the file
Then the gap must become a data-request follow-up, risk, decision or parked scope item
```

Evidence needed:

- customer data request with owner and due date
- validation rule
- risk or decision if the project proceeds with assumptions

## Project impact

Affected files:

- `WORKSTREAM-04-MASTER-DATA-PRODUCT-JIRA-DRAFT.md`
- `CUSTOMER-DATA-CATALOG-DRAFT.md`
- `CUSTOMER-DATA-SIMULATION-DRAFT.md`
- `ROLE-BASED-TRAINING-MATRIX-DRAFT.md`
- `PLAYWRIGHT-TRAINING-EVIDENCE-MAP-DRAFT.md`
- `BOOK-PROJECT-TICKET-BACKLOG-DRAFT.md`

Jira issue candidates:

- Data Request: Provide customer master data with validation columns.
- Data Request: Provide vendor master data with payment and posting assumptions.
- Data Request: Provide item/service/non-inventory master list with units and posting groups.
- Decision: Select realistic master-data setup route.
- Training Item: Master-data ownership and daily maintenance.
- UAT Scenario: Key user validates a sample customer, vendor and item.
- Playwright Evidence: Prove sample record setup and visibility.
- Book Output: Curated chapter section for master-data foundation.

## Customer data

Required from Universaarl:

- customer list with number/name/address/contact/payment terms/tax assumptions/posting group candidate
- vendor list with number/name/address/contact/payment terms/bank/payment method/posting group candidate
- item/service/non-inventory list with number/description/type/base unit/posting group candidate/costing or price assumptions
- owner for each file
- due date and validation contact

Realistic imperfections to include:

- some records missing posting group candidates
- inconsistent unit-of-measure naming
- inactive or duplicate legacy records
- one customer/vendor that should be blocked at go-live
- one item/service classification disagreement between sales and finance

## Implementation route

Candidate routes:

- manual UI: good for teaching and one-record validation
- templates: useful where BC supports repeated defaults
- configuration packages: useful for structured setup/import after field decisions are known
- Excel import: useful for user-facing corrections and smaller datasets
- API: useful for repeatable integration/migration later, not first teaching path
- AL extension: only if a real customization or validation gap appears
- no-change/park: valid when customer data or decision is missing

Recommended pilot route:

- teach one manual UI path per record type
- validate one sample record in the sandbox
- document configuration package or Excel/import route as the realistic bulk route
- do not claim final migration readiness until data validation and route decision are accepted

## Evidence plan

Official source basis:

- Business Central docs for master data, templates/import/configuration concepts where used
- MB-800/Microsoft Learn paths where they define relevant learning objectives

Sandbox observation:

- sample customer page
- sample vendor page
- sample item/service/non-inventory page where available
- visible posting/tax/payment/unit fields relevant to the chosen path

Playwright:

- navigate to record list/page
- create or inspect one controlled sample record
- assert visible fields and success state
- capture screenshot only after page and active editor context are stable
- record repeatability and cleanup/park strategy

UAT:

- Lena Hartmann validates finance-relevant fields.
- Pia Neumann validates sales/customer usability.
- Tobias Brandt validates vendor/purchasing usability.
- Elena Fischer validates item/unit/inventory usability where relevant.

Training:

- one module card for master-data ownership
- one exercise for reviewing an incomplete data row
- one exercise for validating a sample BC record
- one escalation rule for missing or disputed fields

Book:

- explain why master data is a project artifact, not just a BC page
- show manual concept and realistic bulk route separately
- mark fictional data clearly as Universaarl case-study data
- avoid final migration claims until evidence supports them

## Tasks

- [ ] Convert `DR-MD-001` through `DR-MD-003` into Jira-ready data requests.
- [ ] Add route decision candidate for master-data setup/import.
- [ ] Create one master-data training module card.
- [ ] Create one UAT scenario for customer/vendor/item validation.
- [ ] Add one Playwright evidence scenario candidate for a sample record.
- [ ] Add book curation note for master-data chapter section.
- [ ] Record any missing data as risk, decision or parked scope.
- [ ] Review whether this BCSpec pilot improved execution quality.

## Acceptance

This pilot is useful only if it produces clearer work than the existing backlog alone.

Done when:

- every task above is either completed, parked or converted into a named follow-up
- customer-data needs are owner-ready
- implementation route is justified
- training/UAT/book/evidence impacts are linked
- no raw Playwright output is promoted directly to book text
- a decision is made whether to keep, change or drop BCSpec

## Archive note

If accepted, merge the learnings into:

- `SPEC-DRIVEN-SIDEPROJECT-DRAFT.md`
- `JIRA-WORK-ITEM-MODEL.md`
- `PROJECT-ARTIFACT-TEMPLATES.md`
- `WORKSTREAM-04-MASTER-DATA-PRODUCT-JIRA-DRAFT.md`
- `PLAYWRIGHT-TRAINING-EVIDENCE-MAP-DRAFT.md`

If rejected, record why BCSpec added overhead without enough value and keep the useful parts as normal Jira/backlog templates.
