# Project Storyline Draft

Status: draft
Purpose: Durchgehende Projektgeschichte fuer das Universaarl Business Central Buch.
Last reviewed: 2026-07-05

## Story promise

The book follows Universaarl through a complete Business Central implementation project. Each part combines:

- a project scene with people, questions and decisions
- a Jira/project-management layer
- customer data requests and responses
- Business Central setup or process work
- Playwright/evidence validation
- UAT/training/customer handbook output
- curated book explanation

The story should make the reader feel how a professional BC project actually progresses.

## Story structure

```text
Act 1: Mobilize the project
Act 2: Discover the company and request data
Act 3: Design the solution blueprint
Act 4: Build finance and system foundation
Act 5: Build master data and scalable setup
Act 6: Run core processes
Act 7: Add controls, reporting and operations
Act 8: Test, train and simulate go-live
Act 9: Learn, improve and plan next phase
```

## Act 1: Mobilize the project

### Scene 1: Kickoff

Characters:

- Mara Stein
- Jonas Weber
- Nora Becker
- Adrian Vogt
- Sami Yilmaz
- Jana Weiss
- Robin Adler

Project point:

- This is not a demo. It is a managed Business Central implementation and book project.

Jira items:

- `BCPM-0001` Mobilize Universaarl BC implementation project
- `BCPM-0002` Review project plan and phase gates
- `BCPM-0003` Define Jira work item model

Customer data:

- no detailed data yet
- project roles and decision owners requested

BC point:

- environment and company boundary must be visible before any meaningful BC work.

Book point:

- introduce the project as the frame for the whole book.

### Scene 2: Project governance review

Characters:

- Nora Becker
- Mara Stein
- Jonas Weber
- Adrian Vogt

Project point:

- Decisions, risks, data requests and UAT are not optional admin work; they prevent bad setup and weak book claims.

Jira items:

- `BCPM-0004` Create decision log
- `BCPM-0005` Create risk register
- `BCPM-0006` Create customer data catalog

Conflict:

- Mara wants progress quickly. Nora explains that unmanaged setup creates rework later.

Output:

- project plan accepted as draft
- first risk register and decision log created

## Act 2: Discover the company and request data

### Scene 3: Company and organization discovery

Characters:

- Mara Stein
- Jonas Weber
- Sami Yilmaz
- Julia Meier
- Nora Becker
- Adrian Vogt

Project point:

- A BC implementation needs a company model before setup becomes meaningful.

Jira items:

- `BCPM-0100` Define Universaarl company and implementation context
- `BCPM-0101` Request company information
- `BCPM-0102` Request organization model

Customer data requested:

- `CORE-001` Company information
- `CORE-002` Organization model

Customer response:

- Universaarl provides legal name, first target company, departments, locations and role owners.

Consultant review:

- Adrian checks whether locations are legal entities, warehouses, dimensions or reporting-only values.

Book point:

- explain why company, environment, departments and locations matter before setup.

### Scene 4: First data quality problem

Characters:

- Sami Yilmaz
- Milena Brand
- Lena Hartmann
- Tobias Brandt

Project point:

- Customer data is rarely perfect on first delivery.

Example issue:

- vendor list includes payment terms as free text
- customer list lacks posting groups
- item list mixes inventory items and services

Jira items:

- data cleanup tasks
- risk: missing customer data causes arbitrary setup

Book point:

- show that the consultant does not blindly import data; they validate and ask follow-up questions.

## Act 3: Design the solution blueprint

### Scene 5: Fit-to-standard workshop

Characters:

- Adrian Vogt
- Eva Krueger
- Felix Roth
- Jonas Weber
- Lena Hartmann
- Tobias Brandt
- Pia Neumann
- Elena Fischer

Project point:

- The team decides where standard Business Central is enough and where special handling is needed.

Jira items:

- design stories under finance, master data, purchasing, sales and inventory epics

Key decisions:

- UI examples are used for learning.
- Configuration packages are considered for bulk data.
- Product master data, inventory and warehouse remain separate domains.

Book point:

- teach fit-to-standard thinking through concrete choices.

## Act 4: Build finance and system foundation

### Scene 6: Chart of accounts review

Characters:

- Jonas Weber
- Lena Hartmann
- Claudia Schulte
- Eva Krueger
- Adrian Vogt

Project point:

- A starter chart of accounts must support the learning company without pretending full legal/tax finality.

Jira items:

- `BCPM-0201` Request chart of accounts
- `BCPM-0205` Decide SKR04-oriented starter scope
- `BCPM-0208` Verify chart of accounts in BC
- `BCPM-0209` Reopen chart of accounts and prove visible values

Customer data:

- `FIN-001` Chart of accounts

Consultant review:

- Eva checks balance sheet/P&L classification, direct posting and required accounts for posting setup.

BC work:

- verify or create scoped accounts
- reopen accounts to prove persistence

Playwright evidence:

- chart of accounts reopen scenario

Training output:

- Lena learns why account categories and posting permissions matter.

### Scene 7: Posting group explanation

Characters:

- Lena Hartmann
- Eva Krueger
- Adrian Vogt
- Jana Weiss

Project point:

- Posting groups are not codes for decoration; they control account determination.

Jira items:

- `BCPM-0202` Request posting group design inputs
- `BCPM-0206` Decide posting group model
- `BCPM-0211` Train posting groups and account determination

Customer question:

- Lena asks why the customer card does not simply contain the receivables account.

Consultant explanation:

- Eva explains customer/vendor/general/inventory/VAT posting setup as separate account determination layers.

Book point:

- this becomes a beginner-friendly concept chapter.

### Scene 8: VAT boundary review

Characters:

- Jonas Weber
- Robert Klein
- Eva Krueger
- Jana Weiss

Project point:

- Business Central setup can be explained, but legal/tax finality is a separate review boundary.

Jira items:

- `BCPM-0203` Request VAT/USt assumptions
- `BCPM-0207` Decide VAT phase-1 scope and compliance boundary

Customer data:

- `FIN-003` VAT assumptions

Book rule:

- product behavior and tax advice must be separated.

## Act 5: Build master data and scalable setup

### Scene 9: Master data package review

Characters:

- Milena Brand
- Lena Hartmann
- Tobias Brandt
- Pia Neumann
- Felix Roth

Project point:

- Master data must be understood manually but loaded realistically when volume grows.

Jira items:

- `BCPM-0301` Request customer list
- `BCPM-0302` Request vendor list
- `BCPM-0303` Request item/service catalog
- `BCPM-0305` Decide UI example vs configuration package route

Customer data:

- `MD-001` Customers
- `MD-002` Vendors
- `MD-003` Items, services and non-inventory items

Conflict:

- Tobias wants to "just upload the vendor list".
- Milena insists missing posting groups and payment terms must be resolved first.

BC work:

- create one example manually for learning
- prepare configuration-package route for bulk data when justified

Book point:

- teach both the UI concept and project-scale data loading.

## Act 6: Run core processes

### Scene 10: First purchasing scenario

Characters:

- Tobias Brandt
- Lena Hartmann
- Felix Roth
- Eva Krueger
- Tom Seidel
- Robin Adler

Project point:

- Purchasing must show document flow, finance effect and user responsibility.

Jira items:

- `BCPM-0402` Decide direct purchase invoice vs purchase order route
- `BCPM-0404` Run purchasing scenario read/preview path
- `BCPM-0405` Key user tests purchase order to invoice

BC work:

- vendor
- purchase order or invoice
- receipt/invoice boundary
- preview/posting only when unlocked

Evidence:

- document evidence
- vendor ledger/G/L trace where available

Training:

- purchasing users learn order, receipt, invoice and correction.

### Scene 11: First sales scenario

Characters:

- Pia Neumann
- Lena Hartmann
- Felix Roth
- Tom Seidel
- Sarah Klein

Project point:

- Sales must connect customer terms, item/product model, availability and receivables.

Jira items:

- `BCPM-0502` Decide quote/order/invoice route for phase 1
- `BCPM-0504` Run sales scenario read/preview path
- `BCPM-0505` Key user tests quote to invoice

Training:

- sales users learn quote, order, shipment, invoice and correction boundaries.

### Scene 12: Inventory opening and valuation

Characters:

- Elena Fischer
- Claudia Schulte
- Felix Roth
- Eva Krueger
- Robin Adler

Project point:

- Inventory quantity and value must be treated separately from product master data and warehouse movement.

Jira items:

- `BCPM-0601` Request opening inventory
- `BCPM-0602` Decide costing assumptions and inventory posting route
- `BCPM-0604` Prove item ledger/value entry scenario

Customer data:

- `INV-001` Opening inventory

Book point:

- explain item, item ledger entry, value entry and G/L relationship.

## Act 7: Controls, reporting and operations

### Scene 13: Security and workflow design

Characters:

- Sami Yilmaz
- Jonas Weber
- Lena Hartmann
- Tobias Brandt
- Pia Neumann
- Adrian Vogt

Project point:

- Users, permissions and workflows must match real responsibilities.

Jira items:

- `BCPM-0801` Request users and roles
- `BCPM-0802` Decide permission and key-user model

Training:

- normal users, key users and admins get different learning paths.

### Scene 14: Reporting review

Characters:

- Claudia Schulte
- Jonas Weber
- Mara Stein
- Eva Krueger
- Adrian Vogt

Project point:

- Reporting needs determine dimensions, financial reports and management views.

Jira items:

- `BCPM-0901` Request management reporting requirements
- `BCPM-0902` Key user validates dimension/report filters

Conflict:

- Claudia asks for more detail; Adrian challenges whether it belongs in dimensions, accounts or report design.

## Act 8: Test, train and simulate go-live

### Scene 15: UAT planning

Characters:

- Tom Seidel
- Lena Hartmann
- Tobias Brandt
- Pia Neumann
- Elena Fischer
- Sarah Klein
- Robin Adler

Project point:

- UAT is not "try clicking around". It is scenario-based acceptance.

Jira items:

- `BCPM-1101` Create UAT scenario catalog
- process-specific UAT scenarios

Playwright point:

- repeatable Playwright flows support UAT but do not replace customer acceptance.

### Scene 16: Training readiness review

Characters:

- Julia Meier
- Sarah Klein
- all key users

Project point:

- The customer must know what to do daily, what to check and when to escalate.

Jira items:

- `BCPM-1102` Create role-based training matrix

Book output:

- each process chapter gains a handbook/training section.

### Scene 17: Go-live simulation

Characters:

- Mara Stein
- Jonas Weber
- Nora Becker
- Adrian Vogt
- Sami Yilmaz
- Tom Seidel

Project point:

- The book simulates go-live readiness without pretending this is a production deployment.

Jira items:

- `BCPM-1103` Create cutover checklist
- `BCPM-1104` Create hypercare support model

Output:

- go/no-go checklist
- known risks
- next-phase backlog

## Act 9: Learn and improve

### Scene 18: Project retrospective

Characters:

- Nora Becker
- Adrian Vogt
- Jana Weiss
- Robin Adler
- key users

Project point:

- The project learns from implementation, evidence, UAT and training.

Jira items:

- `BCPM-1203` Audit raw book content against project model
- `BCPM-1204` Convert repeated BC UI blocker into helper/skill
- `BCPM-1205` Write project lessons learned chapter

Book point:

- show how a professional team improves the system rather than just finishing a chapter.

## Chapter opening pattern

Each chapter can open with a compact scene:

```text
The project team opens Jira and reviews the current epic. Lena has returned the finance data package, but the VAT assumptions are incomplete. Eva accepts the chart-of-accounts part for sandbox setup, parks the VAT final claim, and asks Robin to prepare a read-only Playwright proof for the visible account structure.
```

Then the chapter moves into:

- project ticket
- customer data
- consultant review
- BC explanation
- implementation route
- evidence
- UAT/training
- book takeaway

## Next refinement

Create detailed scene cards for the first three chapters:

1. kickoff and project mobilization
2. company and organization data request
3. first finance data package review
