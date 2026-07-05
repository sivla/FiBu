# Customer Data Catalog Draft

Status: draft
Purpose: Datenanforderungskatalog fuer die Universaarl Business Central Einfuehrung.
Last reviewed: 2026-07-05

## Principle

Every required customer dataset must have an owner, purpose, format, deadline, validation rule and BC usage. Missing data is a project blocker, not an informal note.

## Data categories

- Configuration data: setup that defines how BC behaves.
- Master data: customers, vendors, items, bank accounts and similar records.
- Opening balances: initial G/L, customer, vendor, bank, inventory and fixed asset balances.
- Open transactions: open sales orders, purchase orders, invoices and other documents.
- Reference data: lists, mappings, codes, departments, locations and reporting structures.
- Test/training data: safe sample data for UAT and customer exercises.

## Catalog fields

Use this structure per data request:

```text
Data request ID:
Workstream:
Epic:
Data object:
Category:
Customer owner:
Internal owner:
Required format:
Required fields:
Optional fields:
Validation rules:
Due date:
Used for:
Implementation route candidate:
BC validation route:
Book/training usage:
Risk if missing:
Status:
```

## Phase 1 data requests

### DR-CORE-001 Company information

Workstream: `WS02-CASE-STUDY-CORE`
Category: configuration data

Required:

- legal company name
- address
- country/region
- currency
- VAT/tax registration context
- fiscal year assumptions
- main contact roles
- primary language and localization expectations

Used for:

- company setup
- book case-study introduction
- training context
- evidence labels

Risk if missing:

- setup decisions become generic and book loses realism.

### DR-CORE-002 Organization model

Workstream: `WS02-CASE-STUDY-CORE`
Category: reference data

Required:

- departments
- cost centers
- locations/sites
- business units
- management reporting structure
- key roles and responsibilities

Used for:

- dimensions
- roles
- reporting
- process ownership
- training matrix

Risk if missing:

- dimensions, permissions and reporting become arbitrary.

### DR-FIN-001 Chart of accounts

Workstream: `WS03-FINANCE-FOUNDATION`
Category: configuration data

Required:

- target chart of accounts or SKR04-oriented starter decision
- account numbers
- account names
- account type
- posting allowed/blocked state
- account categories where known

Used for:

- posting groups
- financial reports
- book finance foundation
- Playwright chart proof

Risk if missing:

- posting setup cannot be responsibly completed.

### DR-FIN-002 Posting group design inputs

Workstream: `WS03-FINANCE-FOUNDATION`
Category: configuration data

Required:

- customer groups
- vendor groups
- business posting groups
- product posting groups
- revenue accounts
- expense accounts
- receivable/payable accounts
- inventory accounts

Used for:

- account determination
- sales/purchasing/inventory process readiness

Risk if missing:

- documents may post to wrong or incomplete accounts.

### DR-FIN-003 VAT/USt assumptions

Workstream: `WS03-FINANCE-FOUNDATION`
Category: configuration data

Required:

- domestic VAT assumptions
- EU/export assumptions if in scope
- product VAT groups
- VAT accounts
- tax-advisor review requirement

Used for:

- VAT posting setup
- sales and purchase documents
- book boundary and warning notes

Risk if missing:

- tax claims become unsafe and must remain blocked.

### DR-FIN-004 Dimensions and reporting structure

Workstream: `WS03-FINANCE-FOUNDATION`
Category: reference/configuration data

Required:

- dimensions
- dimension values
- global dimension priorities
- shortcut dimensions
- default dimension rules
- blocked combinations if needed

Used for:

- reporting
- master data defaults
- UAT and management view

Risk if missing:

- reporting and analysis cannot be realistic.

### DR-MD-001 Customers

Workstream: `WS04-MASTER-DATA-PRODUCT`
Category: master data

Required:

- customer number or numbering rule
- name
- address
- country/region
- VAT/tax data where relevant
- customer posting group
- payment terms
- currency if not local
- contact data

Used for:

- sales scenarios
- receivables
- customer training

Risk if missing:

- Order-to-Cash cannot be realistic.

### DR-MD-002 Vendors

Workstream: `WS04-MASTER-DATA-PRODUCT`
Category: master data

Required:

- vendor number or numbering rule
- name
- address
- country/region
- vendor posting group
- payment terms
- payment method
- bank/payment information where in scope
- contact data

Used for:

- purchasing scenarios
- payables
- vendor training

Risk if missing:

- Source-to-Pay cannot be realistic.

### DR-MD-003 Items, services and non-inventory items

Workstream: `WS04-MASTER-DATA-PRODUCT`
Category: master data

Required:

- item/service number
- description
- item type
- base unit of measure
- item category
- inventory posting group if inventory item
- general product posting group
- VAT product posting group
- costing method where relevant
- price/cost assumptions

Used for:

- purchasing
- sales
- inventory
- warehouse
- reporting

Risk if missing:

- process tests become artificial or blocked.

### DR-INV-001 Opening inventory

Workstream: `WS07-INVENTORY-COSTING-STOCK`
Category: opening balance

Required:

- item
- location
- quantity
- unit
- unit cost/value
- valuation date
- source system reference

Used for:

- inventory valuation
- item journals
- warehouse start state

Risk if missing:

- inventory scenarios lack meaningful quantities and values.

### DR-SEC-001 Users and roles

Workstream: `WS09-SECURITY-WORKFLOWS-CONTROLS`
Category: reference data

Required:

- users
- departments
- role centers
- permissions
- key-user/admin designation
- approval responsibilities

Used for:

- permissions
- workflows
- training matrix
- support model

Risk if missing:

- training and controls are not realistic.

### DR-UAT-001 UAT participants and scenarios

Workstream: `WS13-UAT-TRAINING-CUTOVER`
Category: reference/test data

Required:

- process owner per workstream
- key-user testers
- UAT scenario list
- acceptance criteria
- defect triage owner

Used for:

- UAT plan
- training plan
- customer acceptance

Risk if missing:

- implementation cannot be accepted like a real project.

## Status values

- `draft`
- `requested`
- `received`
- `validated`
- `needs-cleanup`
- `blocked`
- `parked`
- `accepted`
- `rejected`

## Next refinement

Turn each data request into Jira `Data Request` issue candidates after the workstreams `WS02`, `WS03` and `WS04` are fully expanded.
