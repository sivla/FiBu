# Project Scene Cards Draft

Status: draft
Purpose: Wiederverwendbare Szenenkarten fuer die Universaarl Projektstory.
Last reviewed: 2026-07-05

## Scene card rule

A scene is useful only when it produces project value:

- ticket
- data request
- decision
- risk
- BC setup/process work
- Playwright evidence
- UAT scenario
- training/handbook output
- book curation

If a scene does not produce any of these, remove it or rewrite it.

## Scene card template

```text
Scene ID:
Title:
Book part/chapter:
Workstream:
Linked tickets:
Characters:
Scene purpose:
Customer question:
Consultant response:
Data involved:
Decision/risk:
BC implementation impact:
Playwright/evidence impact:
UAT/training impact:
Book output:
Open follow-up:
```

## SCENE-001 Kickoff: This is a real implementation project

Book part/chapter:

- Part 1: Project mobilization

Workstream:

- `WS01-GOVERNANCE`
- `WS14-BOOK-PLAYWRIGHT-LEARNING`

Linked tickets:

- `BCPM-0001` Mobilize Universaarl BC implementation project
- `BCPM-0002` Review project plan and phase gates
- `BCPM-0003` Define Jira work item model

Characters:

- Mara Stein
- Jonas Weber
- Nora Becker
- Adrian Vogt
- Jana Weiss
- Robin Adler

Scene purpose:

- Establish that the book follows a managed BC implementation, not isolated screenshots.

Customer question:

- Mara asks how the project avoids becoming a long technical setup exercise with no business result.

Consultant response:

- Nora explains the workstreams, gates and Jira structure.
- Adrian explains that each BC setup decision must connect to the company process.
- Jana explains that the book will show the project journey.
- Robin explains that Playwright evidence supports claims but does not replace consulting judgment.

Data involved:

- no detailed data yet
- project roles and owners requested

Decision/risk:

- Decision: project is managed through workstreams, tickets, decisions and risks.
- Risk: raw automation becomes book content.

BC implementation impact:

- no setup yet
- environment/company boundary must be confirmed before later work

Playwright/evidence impact:

- later evidence must be tied to tickets or book claims

UAT/training impact:

- UAT and training are in scope from the beginning

Book output:

- opening chapter explains the project frame and cast

Open follow-up:

- create project roles and data request list

## SCENE-002 Discovery: What company are we implementing?

Book part/chapter:

- Part 2: Discovery and customer data

Workstream:

- `WS02-CASE-STUDY-CORE`

Linked tickets:

- `BCPM-0100` Define Universaarl company and implementation context
- `BCPM-0101` Request company information
- `BCPM-0102` Request organization model

Characters:

- Mara Stein
- Jonas Weber
- Sami Yilmaz
- Julia Meier
- Nora Becker
- Adrian Vogt

Scene purpose:

- Make the company model specific enough to justify BC setup.

Customer question:

- Jonas asks which information must be decided before Business Central setup starts.

Consultant response:

- Adrian separates legal entity, BC company, dimensions, locations and reporting units.
- Nora turns missing items into data requests with owners and due dates.

Data involved:

- `CORE-001` Company information
- `CORE-002` Organization model

Decision/risk:

- Risk: missing company data creates arbitrary setup.
- Decision needed: first target company and later multi-company scope.

BC implementation impact:

- company information and environment context
- future dimensions and location decisions

Playwright/evidence impact:

- later Playwright evidence must state environment and company

UAT/training impact:

- training roles begin from organization model

Book output:

- chapter explains why company context comes before setup clicks

Open follow-up:

- expand `WS02-CASE-STUDY-CORE`

## SCENE-003 First data package: Finance data arrives incomplete

Book part/chapter:

- Part 4: Finance and system foundation

Workstream:

- `WS03-FINANCE-FOUNDATION`

Linked tickets:

- `BCPM-0201` Request chart of accounts
- `BCPM-0202` Request posting group design inputs
- `BCPM-0203` Request VAT/USt assumptions
- `BCPM-0205` Decide SKR04-oriented starter scope

Characters:

- Jonas Weber
- Lena Hartmann
- Claudia Schulte
- Robert Klein
- Eva Krueger
- Adrian Vogt
- Milena Brand

Scene purpose:

- Show that customer data must be reviewed before setup or import.

Customer question:

- Lena asks whether the team can start entering the chart of accounts even though VAT accounts are still under review.

Consultant response:

- Eva accepts the chart-of-accounts subset for sandbox foundation work.
- Robert marks VAT finality as needing tax review.
- Adrian separates source-backed BC setup from legal/tax claims.
- Milena warns that posting-group imports must wait until accounts are validated.

Data involved:

- `FIN-001` Chart of accounts
- `FIN-002` Posting group inputs
- `FIN-003` VAT assumptions

Decision/risk:

- Decision: SKR04-oriented starter scope can proceed as sandbox/book candidate.
- Risk: VAT and compliance claims overreach evidence.

BC implementation impact:

- scoped chart of accounts verification
- posting setup remains dependent on approved accounts
- VAT finality remains blocked

Playwright/evidence impact:

- chart of accounts reopen proof
- posting setup evidence only after rows are scoped

UAT/training impact:

- finance key user training starts with account purpose and posting-group concept

Book output:

- chapter shows how incomplete customer data is handled responsibly

Open follow-up:

- create VAT boundary decision
- create posting group design decision

## SCENE-004 Master data workshop: Manual understanding vs bulk route

Book part/chapter:

- Part 5: Master data and scalable setup

Workstream:

- `WS04-MASTER-DATA-PRODUCT`
- `WS11-DATA-MIGRATION-INTEGRATION`

Linked tickets:

- `BCPM-0301` Request customer list
- `BCPM-0302` Request vendor list
- `BCPM-0303` Request item/service catalog
- `BCPM-0305` Decide UI example vs configuration package route

Characters:

- Lena Hartmann
- Tobias Brandt
- Pia Neumann
- Elena Fischer
- Milena Brand
- Felix Roth

Scene purpose:

- Explain why the project teaches manual setup but uses scalable routes for larger data.

Customer question:

- Tobias asks why the vendor list cannot simply be imported immediately.

Consultant response:

- Milena points out missing payment terms and posting groups.
- Felix separates inventory items, service items and non-inventory items.
- Lena confirms finance fields must be validated before data load.

Data involved:

- `MD-001` Customers
- `MD-002` Vendors
- `MD-003` Items, services and non-inventory items

Decision/risk:

- Decision: one manual UI example per object for learning; bulk route considered through configuration package/import.
- Risk: configuration packages used as shortcuts without understanding.

BC implementation impact:

- example customer/vendor/item records
- later configuration package or import path

Playwright/evidence impact:

- validate example records in UI
- bulk data validation route to be defined

UAT/training impact:

- master data owners learn required fields and quality rules

Book output:

- chapter explains manual UI concept and real project-scale import route

Open follow-up:

- expand `WS04-MASTER-DATA-PRODUCT`

## SCENE-005 UAT planning: Evidence is not acceptance

Book part/chapter:

- Part 8: UAT, training, cutover and hypercare

Workstream:

- `WS13-UAT-TRAINING-CUTOVER`
- `WS14-BOOK-PLAYWRIGHT-LEARNING`

Linked tickets:

- `BCPM-1101` Create UAT scenario catalog
- `BCPM-1202` Map Playwright scenarios to UAT and evidence claims

Characters:

- Tom Seidel
- Lena Hartmann
- Tobias Brandt
- Pia Neumann
- Elena Fischer
- Sarah Klein
- Robin Adler

Scene purpose:

- Separate automated evidence from customer acceptance.

Customer question:

- Pia asks whether passing Playwright tests means the sales process is accepted.

Consultant response:

- Tom explains UAT acceptance requires key-user validation.
- Robin explains Playwright proves repeatable behavior but not business satisfaction.
- Sarah identifies training exercises from failed or confusing UAT steps.

Data involved:

- UAT scenario catalog
- role-based training matrix

Decision/risk:

- Risk: Playwright proof mistaken for customer acceptance.

BC implementation impact:

- no new setup by default
- process evidence informs acceptance

Playwright/evidence impact:

- map scenarios to evidence claims

UAT/training impact:

- define pass/fail and training follow-ups

Book output:

- chapter explains professional UAT and automation boundaries

Open follow-up:

- create role-based training matrix
- create Playwright scenario catalog
