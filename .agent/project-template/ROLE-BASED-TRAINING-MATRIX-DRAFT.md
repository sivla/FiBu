# Role-Based Training Matrix Draft

Status: draft
Purpose: Rollenbasierte Schulungsmatrix fuer Universaarl Business Central, Projektstory, UAT und Kundenhandbuch.
Last reviewed: 2026-07-05

## How to use

This matrix defines who needs which training, why, and what evidence or exercise makes it real.

Status values:

- `planned`
- `draft`
- `evidence-needed`
- `uat-needed`
- `trainer-ready`
- `delivered`
- `accepted`
- `parked`

## Role groups

| Code | Role group | Main fictional owners |
| --- | --- | --- |
| RG-MGMT | Management | Mara Stein, Jonas Weber, Claudia Schulte |
| RG-FIN | Finance/accounting | Jonas Weber, Lena Hartmann, Claudia Schulte |
| RG-PUR | Purchasing | Tobias Brandt |
| RG-SALES | Sales operations | Pia Neumann |
| RG-INV | Inventory/warehouse | Elena Fischer |
| RG-ADMIN | IT/admin | Sami Yilmaz |
| RG-KEY | Cross-functional key users | Lena, Tobias, Pia, Elena, Sami |
| RG-TRAIN | Training/project team | Julia Meier, Sarah Klein, Tom Seidel |

## Matrix

| Module | Workstream | Audience | Required for | Exercise | Evidence gate | Status |
| --- | --- | --- | --- | --- | --- | --- |
| TR-00-01 Project journey and roles | WS01/WS02 | all project roles | Understanding how the book/project is run | Identify own role, tickets and decisions | Project docs exist | draft |
| TR-00-02 Environment, company and evidence boundary | WS02 | all key users, admin, book team | Avoid wrong-company work and legacy evidence confusion | Identify `playthru` / `UNIVERSAARL-DE` in screenshots/UI | Company context proof needed | evidence-needed |
| TR-01-01 Role Center and navigation | WS02 | all end users/key users | Basic BC usability | Find a page and return to Role Center | UI read-only Playwright proof | evidence-needed |
| TR-01-02 Lists, cards, FastTabs and FactBoxes | WS02 | all users | Understand page types | Identify list/card/FastTab/FactBox in a scenario | Screenshot truth proof | evidence-needed |
| TR-01-03 Filters, views and search | WS02/WS10 | all users, management | Find and review records | Filter a list and reset filters | UI proof and handbook steps | evidence-needed |
| TR-02-01 Chart of accounts | WS03 | finance, management | Account review and reporting foundation | Review account purpose and category | Chart reopen proof | draft |
| TR-02-02 Posting groups | WS03 | finance key users, consultants | Account determination | Explain customer/vendor/general/inventory posting setup | Setup row proof needed | evidence-needed |
| TR-02-03 VAT/USt boundary | WS03 | finance, CFO, tax advisor | Tax-sensitive setup review | Classify VAT setup claim as product/source/tax-review | Source and boundary proof | draft |
| TR-02-04 Dimensions | WS03/WS10 | finance, management, key users | Reporting structure | Classify departments/sites as dimensions/locations/roles | Dimension proof later | planned |
| TR-02-05 Journals, preview and posting | WS03 | finance key users | Controlled finance posting | Enter/review journal scenario in sandbox | Preview/posting evidence required before final | planned |
| TR-03-01 Customer master data | WS04/WS06 | sales, finance, key users | O2C readiness | Review customer required fields | Customer UI proof needed | planned |
| TR-03-02 Vendor master data | WS04/WS05 | purchasing, finance, key users | P2P readiness | Review vendor required fields | Vendor UI proof needed | planned |
| TR-03-03 Items, services and non-inventory items | WS04/WS07 | purchasing, sales, inventory | Product model clarity | Classify item types and required posting fields | Item UI proof needed | planned |
| TR-03-04 Configuration packages and imports | WS11 | key users, admin, data lead | Scalable setup/data route | Validate import template and imported record | Import/config package proof when used | planned |
| TR-04-01 Purchase order to invoice | WS05 | purchasing, finance | Source-to-Pay process | Create/review purchase flow | Playwright/UAT process proof | planned |
| TR-04-02 Purchase exceptions and corrections | WS05 | purchasing, finance key users | Error handling | Correct quantity, vendor, invoice issue | Evidence/UAT needed | planned |
| TR-05-01 Sales quote/order/invoice | WS06 | sales, finance | Order-to-Cash process | Create/review sales flow | Playwright/UAT process proof | planned |
| TR-05-02 Sales exceptions and corrections | WS06 | sales, finance key users | Error handling | Handle wrong price/customer/availability issue | Evidence/UAT needed | planned |
| TR-06-01 Inventory quantity and value | WS07 | inventory, finance, management | Stock and valuation understanding | Trace item ledger/value entry concept | Item/value entry proof needed | planned |
| TR-06-02 Physical inventory and adjustments | WS07 | inventory, finance | Count and correction | Review count discrepancy and correction path | UAT scenario needed | planned |
| TR-06-03 Warehouse daily process | WS08 | warehouse users, inventory lead | Receiving/picking/shipping | Run selected warehouse scenario | Warehouse scope and proof needed | parked |
| TR-07-01 Management reporting and dimensions | WS10 | management, finance | Reporting and decisions | Filter report by dimension | Report proof needed | planned |
| TR-07-02 Permissions and role centers | WS09 | admin, key users | Access and support | Map role to role center/permission | Admin proof needed | planned |
| TR-07-03 Workflows and approvals | WS09 | management, key users, admin | Control process | Review approval scenario | Workflow proof needed | planned |
| TR-08-01 UAT execution | WS13 | key users, test lead | Acceptance | Execute UAT script and log result | UAT script exists | draft |
| TR-08-02 Cutover and hypercare | WS13 | management, key users, admin | Go-live readiness | Walk through go/no-go and support triage | Cutover checklist needed | planned |

## Role learning paths

### Management learning path

Required modules:

- TR-00-01 Project journey and roles
- TR-00-02 Environment, company and evidence boundary
- TR-02-01 Chart of accounts
- TR-02-04 Dimensions
- TR-07-01 Management reporting and dimensions
- TR-07-03 Workflows and approvals
- TR-08-02 Cutover and hypercare

Outcome:

- management can approve scope, understand risks, read reports and make go/no-go decisions.

### Finance learning path

Required modules:

- TR-00-02 Environment, company and evidence boundary
- TR-01-01 Role Center and navigation
- TR-02-01 Chart of accounts
- TR-02-02 Posting groups
- TR-02-03 VAT/USt boundary
- TR-02-04 Dimensions
- TR-02-05 Journals, preview and posting
- TR-03-01 Customer master data
- TR-03-02 Vendor master data
- TR-04-01 Purchase order to invoice
- TR-05-01 Sales quote/order/invoice
- TR-06-01 Inventory quantity and value
- TR-08-01 UAT execution

Outcome:

- finance can understand setup dependencies, validate postings, support UAT and explain common corrections.

### Purchasing learning path

Required modules:

- TR-00-02 Environment, company and evidence boundary
- TR-01-01 Role Center and navigation
- TR-03-02 Vendor master data
- TR-03-03 Items, services and non-inventory items
- TR-04-01 Purchase order to invoice
- TR-04-02 Purchase exceptions and corrections
- TR-08-01 UAT execution

Outcome:

- purchasing can create/review purchase documents, understand required vendor/item data and escalate finance/setup issues.

### Sales learning path

Required modules:

- TR-00-02 Environment, company and evidence boundary
- TR-01-01 Role Center and navigation
- TR-03-01 Customer master data
- TR-03-03 Items, services and non-inventory items
- TR-05-01 Sales quote/order/invoice
- TR-05-02 Sales exceptions and corrections
- TR-08-01 UAT execution

Outcome:

- sales can work through customer/order scenarios and understand where pricing, availability and finance setup matter.

### Inventory and warehouse learning path

Required modules:

- TR-00-02 Environment, company and evidence boundary
- TR-01-01 Role Center and navigation
- TR-03-03 Items, services and non-inventory items
- TR-06-01 Inventory quantity and value
- TR-06-02 Physical inventory and adjustments
- TR-06-03 Warehouse daily process when in scope
- TR-08-01 UAT execution

Outcome:

- inventory/warehouse users understand item master data, stock quantity, value, counts and warehouse scope.

### Admin learning path

Required modules:

- TR-00-01 Project journey and roles
- TR-00-02 Environment, company and evidence boundary
- TR-01-01 Role Center and navigation
- TR-07-02 Permissions and role centers
- TR-07-03 Workflows and approvals
- TR-08-02 Cutover and hypercare

Outcome:

- admin can manage access and support operations without mixing setup, permissions and process ownership.

## Training acceptance criteria

A role learning path is accepted when:

- all required modules are at least `trainer-ready`, or parked with explicit reason
- key users can complete their UAT scenarios or explain blockers
- handbook pages exist for daily tasks
- common mistakes and escalation paths are documented
- Playwright/evidence status is known for concrete BC behavior
- open training gaps are Jira/backlog items

## Next refinement

Create `TRAINING-MODULE-CARDS-DRAFT.md` for the first modules:

- TR-00-02 Environment, company and evidence boundary
- TR-01-01 Role Center and navigation
- TR-02-01 Chart of accounts
- TR-02-02 Posting groups
- TR-03-03 Items, services and non-inventory items
